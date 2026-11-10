'use client';

import imageCompression from 'browser-image-compression';
import {
  CATALOG_ALLOWED_MIME_TYPES,
  MAX_OUTPUT_BYTES,
  MAX_SOURCE_BYTES,
  MIN_SOURCE_DIMENSION,
  SOURCE_MIME_TYPES,
  WORKER_LIB_PATH,
  extensionForMime,
  formatBytes,
  getImageProfile,
  sanitizeFileBaseName,
  type ImagePurpose,
} from './image-config';

export type ImageErrorCode =
  | 'unsupported-format'
  | 'too-large'
  | 'empty-file'
  | 'invalid-image'
  | 'dimensions-too-small'
  | 'compression-failed'
  | 'output-too-large'
  | 'cancelled'
  | 'browser-unsupported';

export class ImagePreparationError extends Error {
  readonly code: ImageErrorCode;

  constructor(code: ImageErrorCode, message: string) {
    super(message);
    this.name = 'ImagePreparationError';
    this.code = code;
  }
}

export interface PrepareImageOptions {
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
  /** Slightly higher visual quality for detailed metal surfaces. */
  highQuality?: boolean;
}

export interface PreparedImage {
  file: File;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercent: number;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  sourceMimeType: string;
  mimeType: string;
  wasCompressed: boolean;
  warnings: string[];
}

interface Dimensions {
  width: number;
  height: number;
}

const MIME_ALIASES: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/x-png': 'image/png',
  'image/x-heic': 'image/heic',
  'image/x-heif': 'image/heif',
};

const EXTENSION_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

function normalizeMime(value: string): string {
  const mime = value.toLowerCase().split(';')[0].trim();
  return MIME_ALIASES[mime] ?? mime;
}

function resolveSourceMime(file: File): string {
  const declared = normalizeMime(file.type || '');
  if (declared) return declared;
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_MIME[extension] ?? '';
}

function isAbortError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError'
  );
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new ImagePreparationError('cancelled', 'Image processing was cancelled.');
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ImagePreparationError('invalid-image', message));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

let webpEncodingSupport: boolean | null = null;

function browserCanEncodeWebp(): boolean {
  if (webpEncodingSupport !== null) return webpEncodingSupport;
  if (typeof document === 'undefined') {
    webpEncodingSupport = false;
    return webpEncodingSupport;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpEncodingSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpEncodingSupport = false;
  }

  return webpEncodingSupport;
}

async function readImageDimensions(file: File): Promise<Dimensions> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await withTimeout(
        createImageBitmap(file, { imageOrientation: 'from-image' }),
        20000,
        'The image could not be decoded. It may be corrupted or unsupported by this browser.'
      );
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dimensions;
    } catch (error) {
      if (error instanceof ImagePreparationError) throw error;
      // Fall through to the HTMLImageElement decoder.
    }
  }

  if (typeof document === 'undefined') {
    throw new ImagePreparationError(
      'browser-unsupported',
      'Image validation requires a browser environment.'
    );
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await withTimeout(
      new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () =>
          reject(
            new ImagePreparationError(
              'invalid-image',
              'The image could not be decoded. It may be corrupted or unsupported by this browser.'
            )
          );
        element.src = objectUrl;
      }),
      20000,
      'The image could not be decoded. It may be corrupted or unsupported by this browser.'
    );

    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function chooseOutputMimeType(sourceMime: string): string {
  const canUseWebp = browserCanEncodeWebp();

  if (canUseWebp) return 'image/webp';

  // Preserve transparency when WebP encoding is unavailable.
  if (sourceMime === 'image/png' || sourceMime === 'image/webp') return 'image/png';

  return 'image/jpeg';
}

function makeOutputFile(blob: Blob, originalName: string, mimeType: string): File {
  const extension = extensionForMime(mimeType);
  const baseName = sanitizeFileBaseName(originalName);
  return new File([blob], `${baseName}-optimized.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

function normalizeOutputMime(value: string, fallback: string): string {
  const mime = normalizeMime(value || '') || fallback;
  return CATALOG_ALLOWED_MIME_TYPES.has(mime) ? mime : fallback;
}

function validateSource(file: File): { mimeType: string } {
  if (!(file instanceof File) || file.size === 0) {
    throw new ImagePreparationError('empty-file', 'The selected file is empty.');
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImagePreparationError(
      'too-large',
      `"${file.name}" is ${formatBytes(file.size)}. The maximum source size is ${formatBytes(
        MAX_SOURCE_BYTES
      )}. Please resize or export the photograph before uploading.`
    );
  }

  const mimeType = resolveSourceMime(file);

  if (mimeType === 'image/svg+xml') {
    throw new ImagePreparationError(
      'unsupported-format',
      'SVG files are not supported for catalogue photo uploads. Use PNG or WebP for transparent artwork.'
    );
  }

  if (mimeType === 'image/gif') {
    throw new ImagePreparationError(
      'unsupported-format',
      'GIF files are not supported because compression can destroy animation. Use JPG, PNG or WebP.'
    );
  }

  if (!SOURCE_MIME_TYPES.has(mimeType)) {
    throw new ImagePreparationError(
      'unsupported-format',
      `"${file.name}" is not a supported image format. Use JPG, PNG, WebP, AVIF or HEIC.`
    );
  }

  return { mimeType };
}

/**
 * Validate, resize, convert and compress a selected image before it is sent to
 * Supabase Storage. The original file on the administrator's computer is never
 * modified or deleted.
 */
export async function prepareImageUpload(
  file: File,
  purpose: ImagePurpose,
  options: PrepareImageOptions = {}
): Promise<PreparedImage> {
  const { signal, onProgress, highQuality = false } = options;
  throwIfAborted(signal);

  const profile = getImageProfile(purpose);
  const warnings: string[] = [];
  const { mimeType: sourceMimeType } = validateSource(file);

  onProgress?.(1);

  const originalDimensions = await readImageDimensions(file);
  throwIfAborted(signal);

  if (
    originalDimensions.width < MIN_SOURCE_DIMENSION ||
    originalDimensions.height < MIN_SOURCE_DIMENSION
  ) {
    throw new ImagePreparationError(
      'dimensions-too-small',
      `"${file.name}" is only ${originalDimensions.width}×${originalDimensions.height}px. Use an image at least ${MIN_SOURCE_DIMENSION}px on both sides.`
    );
  }

  // A small, already-WebP image does not benefit from another lossy pass.
  const alreadyOptimized =
    sourceMimeType === 'image/webp' &&
    file.size <= profile.softSizeTargetBytes &&
    originalDimensions.width <= profile.maxLongEdge &&
    originalDimensions.height <= profile.maxLongEdge;

  if (alreadyOptimized) {
    onProgress?.(100);
    return {
      file,
      originalSize: file.size,
      optimizedSize: file.size,
      savedBytes: 0,
      savedPercent: 0,
      originalWidth: originalDimensions.width,
      originalHeight: originalDimensions.height,
      width: originalDimensions.width,
      height: originalDimensions.height,
      sourceMimeType,
      mimeType: sourceMimeType,
      wasCompressed: false,
      warnings: ['The file was already WebP and within the target dimensions/size.'],
    };
  }

  const outputMimeType = chooseOutputMimeType(sourceMimeType);
  const quality = highQuality
    ? Math.min(0.95, profile.quality + 0.05)
    : profile.quality;

  let compressed: File;
  try {
    onProgress?.(3);

    compressed = await imageCompression(file, {
      maxSizeMB: profile.softSizeTargetBytes / (1024 * 1024),
      maxWidthOrHeight: profile.maxLongEdge,
      initialQuality: quality,
      fileType: outputMimeType,
      useWebWorker: typeof Worker !== 'undefined',
      libURL: WORKER_LIB_PATH,
      maxIteration: 12,
      alwaysKeepResolution: false,
      preserveExif: false,
      signal,
      onProgress: (progress) => onProgress?.(Math.min(99, Math.max(1, progress))),
    });
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) {
      throw new ImagePreparationError('cancelled', 'Image processing was cancelled.');
    }

    const formatHint =
      sourceMimeType === 'image/heic' || sourceMimeType === 'image/heif'
        ? ' This browser could not convert the HEIC/HEIF file. Export it as JPG, PNG or WebP and try again.'
        : sourceMimeType === 'image/avif'
          ? ' This browser could not convert the AVIF file. Export it as JPG, PNG or WebP and try again.'
          : '';

    throw new ImagePreparationError(
      'compression-failed',
      `"${file.name}" could not be processed.${formatHint}`
    );
  }

  throwIfAborted(signal);

  const resultMimeType = normalizeOutputMime(compressed.type, outputMimeType);
  let outputFile = makeOutputFile(compressed, file.name, resultMimeType);

  // Never return a larger file when the source format is already accepted.
  const sourceFormatAccepted = CATALOG_ALLOWED_MIME_TYPES.has(sourceMimeType);
  if (sourceFormatAccepted && outputFile.size >= file.size) {
    outputFile = file;
    warnings.push('Compression did not reduce the file size, so the original file was kept.');
  }

  if (outputFile.size > MAX_OUTPUT_BYTES) {
    throw new ImagePreparationError(
      'output-too-large',
      `The optimized image is still ${formatBytes(outputFile.size)}, above the ${formatBytes(
        MAX_OUTPUT_BYTES
      )} storage limit. Reduce the image dimensions and try again.`
    );
  }

  const outputDimensions = await readImageDimensions(outputFile).catch(() => ({
    width: Math.min(originalDimensions.width, profile.maxLongEdge),
    height: Math.min(originalDimensions.height, profile.maxLongEdge),
  }));

  const optimizedSize = outputFile.size;
  const savedBytes = Math.max(0, file.size - optimizedSize);
  const savedPercent =
    file.size > 0 ? Math.round((savedBytes / file.size) * 1000) / 10 : 0;

  onProgress?.(100);

  return {
    file: outputFile,
    originalSize: file.size,
    optimizedSize,
    savedBytes,
    savedPercent,
    originalWidth: originalDimensions.width,
    originalHeight: originalDimensions.height,
    width: outputDimensions.width,
    height: outputDimensions.height,
    sourceMimeType,
    mimeType: outputFile.type,
    wasCompressed: outputFile !== file,
    warnings,
  };
}

export function getImageErrorMessage(error: unknown): string {
  if (error instanceof ImagePreparationError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'The image could not be processed. Please try a different file.';
}
