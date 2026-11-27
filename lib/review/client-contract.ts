export const REVIEW_CLIENT_LIMITS = {
  minRating: 1,
  maxRating: 5,
  minContentCodePoints: 10,
  maxContentCodePoints: 2000,
  maxContentUtf8Bytes: 8000,
  minCustomerNameCodePoints: 2,
  maxCustomerNameCodePoints: 80,
  maxPhotos: 3,
  maxSourcePhotoBytes: 3 * 1024 * 1024,
  maxOutputPhotoBytes: 3 * 1024 * 1024,
  maxPhotoDimension: 1600,
  maxRequestBytes: 4 * 1024 * 1024,
  multipartSafetyBytes: 64 * 1024,
  submissionKeyRegex: /^[A-Za-z0-9_-]{43,128}$/,
  submissionKeyMinDistinctChars: 16,
  controlCharRegex: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/,
  allowedPhotoMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

export interface ReviewUiImage {
  id: string;
  signedUrl: string | null;
  sortOrder: number;
}

export interface ReviewUiReview {
  id: string;
  productId: string;
  customerName: string | null;
  rating: number;
  content: string;
  status: 'published' | 'archived';
  createdAt: string;
  images: ReviewUiImage[];
}

export interface ReviewUiSummary {
  averageRating: number | null;
  reviewCount: number;
}

export interface ReviewUiPagination {
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ReviewsResponse {
  success: boolean;
  data: {
    reviews: ReviewUiReview[];
    totalCount: number;
    summary: ReviewUiSummary;
    pagination: ReviewUiPagination;
  };
}

export interface SubmittedReview {
  id: string;
  productId: string;
  customerName: string | null;
  rating: number;
  content: string;
  status: string;
  createdAt: string | null;
}

export interface SubmitReviewResponse {
  success: boolean;
  duplicate: boolean;
  message: string;
  data: { review: SubmittedReview };
}

export interface ReviewFormErrors {
  rating?: string;
  customerName?: string;
  content?: string;
  photos?: string;
}

export function countCodePoints(value: string): number {
  return Array.from(value).length;
}

export function countUtf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function isHighEntropySubmissionKey(value: string): boolean {
  const trimmed = value.trim();
  if (!REVIEW_CLIENT_LIMITS.submissionKeyRegex.test(trimmed)) return false;
  const distinct = new Set(trimmed.replace(/[-_]/g, ''));
  return distinct.size >= REVIEW_CLIENT_LIMITS.submissionKeyMinDistinctChars;
}

export function createSubmissionKey(): string {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const key = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    if (isHighEntropySubmissionKey(key)) return key;
  }
  throw new Error('Unable to prepare a secure review submission key.');
}

export function getPhotoBudgetBytes(): number {
  return REVIEW_CLIENT_LIMITS.maxRequestBytes - REVIEW_CLIENT_LIMITS.multipartSafetyBytes;
}

export function validateReviewForm(value: {
  rating: number | null;
  customerName: string;
  content: string;
  totalPhotoBytes: number;
}): ReviewFormErrors {
  const errors: ReviewFormErrors = {};

  if (
    value.rating === null ||
    !Number.isInteger(value.rating) ||
    value.rating < REVIEW_CLIENT_LIMITS.minRating ||
    value.rating > REVIEW_CLIENT_LIMITS.maxRating
  ) {
    errors.rating = 'Select a rating from 1 to 5 stars.';
  }

  const name = value.customerName.trim();
  if (name) {
    const nameLength = countCodePoints(name);
    if (
      nameLength < REVIEW_CLIENT_LIMITS.minCustomerNameCodePoints ||
      nameLength > REVIEW_CLIENT_LIMITS.maxCustomerNameCodePoints
    ) {
      errors.customerName = 'Name must be between 2 and 80 characters.';
    } else if (REVIEW_CLIENT_LIMITS.controlCharRegex.test(name)) {
      errors.customerName = 'Name contains invalid characters.';
    }
  }

  const content = value.content.trim();
  const contentLength = countCodePoints(content);
  if (contentLength < REVIEW_CLIENT_LIMITS.minContentCodePoints) {
    errors.content = 'Please write at least 10 characters.';
  } else if (contentLength > REVIEW_CLIENT_LIMITS.maxContentCodePoints) {
    errors.content = 'Review must not exceed 2000 characters.';
  } else if (countUtf8Bytes(content) > REVIEW_CLIENT_LIMITS.maxContentUtf8Bytes) {
    errors.content = 'Review content is too large.';
  } else if (REVIEW_CLIENT_LIMITS.controlCharRegex.test(content)) {
    errors.content = 'Review contains invalid characters.';
  }

  if (value.totalPhotoBytes > getPhotoBudgetBytes()) {
    errors.photos = 'Photos are too large for this submission. Remove or compress a photo.';
  }

  return errors;
}
