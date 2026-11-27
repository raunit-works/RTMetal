import sharp from 'sharp';
import { randomUUID } from 'crypto';

export const REVIEW_PHOTO_MAX_SOURCE_BYTES = 3 * 1024 * 1024;
export const REVIEW_PHOTO_MAX_OUTPUT_BYTES = 3 * 1024 * 1024;
export const REVIEW_PHOTO_MAX_DIMENSION = 1600;
export const REVIEW_PHOTO_MAX_PIXELS = 4_000_000;
export const REVIEW_PHOTO_QUALITY = 85;
export const REVIEW_PHOTO_MAX_COUNT = 3;

export const REVIEW_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const REVIEW_ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

const DECODED_MIME_BY_FORMAT: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export interface ReviewPhotoProcessingResult {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  size: number;
}

export interface ReviewPhotoProcessingError extends Error {
  code: 'unsupported-format' | 'too-large' | 'empty-file' | 'invalid-image' | 'dimensions-too-small' | 'pixels-too-large' | 'processing-failed' | 'output-too-large';
}

export function createReviewPhotoError(code: ReviewPhotoProcessingError['code'], message: string): ReviewPhotoProcessingError {
  const error = new Error(message) as ReviewPhotoProcessingError;
  error.code = code;
  return error;
}

function validateSource(buffer: Buffer, mimeType: string): void {
  if (!buffer || buffer.length === 0) {
    throw createReviewPhotoError('empty-file', 'The uploaded file is empty.');
  }

  if (buffer.length > REVIEW_PHOTO_MAX_SOURCE_BYTES) {
        throw createReviewPhotoError('too-large', 'File size exceeds the maximum of 3 MB.');
  }

  const normalizedMime = mimeType.toLowerCase().split(';')[0].trim();
  if (!REVIEW_ALLOWED_MIME_TYPES.has(normalizedMime)) {
    throw createReviewPhotoError('unsupported-format', 'Use JPEG, PNG, or WebP images.');
  }
}

function encodeWebp(buffer: Buffer, quality: number): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(REVIEW_PHOTO_MAX_DIMENSION, REVIEW_PHOTO_MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toBuffer();
}

export async function processReviewPhoto(
  buffer: Buffer,
  mimeType: string
): Promise<ReviewPhotoProcessingResult> {
  validateSource(buffer, mimeType);

  try {
    const sourceMetadata = await sharp(buffer).metadata();

    if (!sourceMetadata.width || !sourceMetadata.height) {
      throw createReviewPhotoError('invalid-image', 'Could not determine image dimensions.');
    }

    const format = sourceMetadata.format?.toLowerCase();
    const decodedMime = format ? DECODED_MIME_BY_FORMAT[format] : undefined;
    if (!decodedMime) {
      throw createReviewPhotoError('unsupported-format', 'Use JPEG, PNG, or WebP images.');
    }

    if (decodedMime !== mimeType.toLowerCase().split(';')[0].trim()) {
      throw createReviewPhotoError('unsupported-format', 'Image contents do not match the declared type.');
    }

    if (sourceMetadata.width * sourceMetadata.height > REVIEW_PHOTO_MAX_PIXELS) {
      throw createReviewPhotoError('pixels-too-large', 'Image dimensions are too large. Maximum is 4 megapixels.');
    }

    if (sourceMetadata.width < 32 || sourceMetadata.height < 32) {
      throw createReviewPhotoError('dimensions-too-small', 'Image dimensions are too small (minimum 32x32).');
    }

    let outputBuffer = await encodeWebp(buffer, REVIEW_PHOTO_QUALITY);
    if (outputBuffer.length > REVIEW_PHOTO_MAX_OUTPUT_BYTES) {
      outputBuffer = await encodeWebp(buffer, 70);
      if (outputBuffer.length > REVIEW_PHOTO_MAX_OUTPUT_BYTES) {
        throw createReviewPhotoError('output-too-large', 'Processed image still exceeds size limit.');
      }
    }

    const outputMetadata = await sharp(outputBuffer).metadata();
    if (
      outputMetadata.exif
      || outputMetadata.iptc
      || outputMetadata.xmp
      || outputMetadata.tifftagPhotoshop
    ) {
      throw createReviewPhotoError('processing-failed', 'Processed image contains unwanted metadata.');
    }

    return {
      buffer: outputBuffer,
      mimeType: 'image/webp',
      extension: 'webp',
      width: outputMetadata.width,
      height: outputMetadata.height,
      size: outputBuffer.length,
    };
  } catch (error) {
    if (
      error instanceof Error
      && 'code' in error
      && typeof (error as ReviewPhotoProcessingError).code === 'string'
    ) {
      throw error;
    }
    throw createReviewPhotoError('processing-failed', 'Image processing failed.');
  }
}

export function generateReviewPhotoPath(reviewId: string, extension: string): string {
  const uniqueId = randomUUID();
  return `${reviewId}/${uniqueId}.${extension}`;
}

export function isValidReviewPhotoMimeType(mimeType: string): boolean {
  return REVIEW_ALLOWED_MIME_TYPES.has(mimeType.toLowerCase().split(';')[0].trim());
}
