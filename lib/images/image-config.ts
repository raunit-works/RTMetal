export type ImagePurpose =
  | 'product-main'
  | 'product-gallery'
  | 'category'
  | 'service'
  | 'testimonial'
  | 'hero'
  | 'before-after'
  | 'metal-finish';

export interface ImageProfile {
  label: string;
  maxLongEdge: number;
  quality: number;
  softSizeTargetBytes: number;
}

/**
 * Central image-upload configuration.
 * These are starting values; adjust here rather than inside components.
 */
export const IMAGE_PROFILES: Record<ImagePurpose, ImageProfile> = {
  'product-main': {
    label: 'Product main image',
    maxLongEdge: 1600,
    quality: 0.85,
    softSizeTargetBytes: 800 * 1024,
  },
  'product-gallery': {
    label: 'Product gallery image',
    maxLongEdge: 1600,
    quality: 0.85,
    softSizeTargetBytes: 800 * 1024,
  },
  category: {
    label: 'Category image',
    maxLongEdge: 1200,
    quality: 0.82,
    softSizeTargetBytes: 500 * 1024,
  },
  service: {
    label: 'Service image',
    maxLongEdge: 1600,
    quality: 0.85,
    softSizeTargetBytes: 800 * 1024,
  },
  testimonial: {
    label: 'Testimonial avatar',
    maxLongEdge: 640,
    quality: 0.85,
    softSizeTargetBytes: 150 * 1024,
  },
  hero: {
    label: 'Hero / banner image',
    maxLongEdge: 1920,
    quality: 0.85,
    softSizeTargetBytes: 1200 * 1024,
  },
  'before-after': {
    label: 'Before & After image',
    maxLongEdge: 1920,
    quality: 0.88,
    softSizeTargetBytes: 1000 * 1024,
  },
  'metal-finish': {
    label: 'Metal finish reference',
    maxLongEdge: 1600,
    quality: 0.88,
    softSizeTargetBytes: 800 * 1024,
  },
};

/** Matches the existing `catalog-images` bucket file_size_limit. */
export const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

/** Generous source limit so phone photographs can still be optimized. */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

export const MIN_SOURCE_DIMENSION = 32;

export const COMPRESSION_CONCURRENCY = 2;

export const UPLOAD_CONCURRENCY = 2;

/**
 * Same-origin copy of the library used by the library's Web Worker.
 * Avoids loading a worker script from a third-party CDN and keeps the
 * browser worker compatible with restrictive CSP configurations.
 */
export const WORKER_LIB_PATH = '/vendor/browser-image-compression.js';

export const CATALOG_BUCKET = 'catalog-images';

export const CATALOG_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const SOURCE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
]);

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
};

export function getImageProfile(purpose: ImagePurpose): ImageProfile {
  return IMAGE_PROFILES[purpose];
}

export function extensionForMime(mimeType: string): string {
  return MIME_EXTENSIONS[mimeType.toLowerCase()] ?? 'bin';
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

export function sanitizeFileBaseName(name: string): string {
  const withoutExtension = name.replace(/\.[^./\\]+$/, '');
  const safe = withoutExtension
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 60);
  return safe || 'image';
}
