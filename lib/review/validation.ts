import { createHash } from 'crypto';
import type { ProductReviewValidationError } from '@/lib/types';
import { REVIEW_PHOTO_MAX_COUNT } from '@/lib/review/image-processing';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
const INTEGER_REGEX = /^-?\d+$/;
const PAGINATION_INTEGER_REGEX = /^-?\d+$/;
const SUBMISSION_KEY_REGEX = /^[A-Za-z0-9_-]{43,128}$/;
const SUBMISSION_KEY_MIN_DISTINCT_CHARS = 16;
const SHA256_HEX_REGEX = /^[0-9a-f]{64}$/;
export const MAX_REVIEW_REQUEST_BYTES = 4 * 1024 * 1024;
const DEFAULT_REVIEW_LIMIT = 20;
const MAX_REVIEW_LIMIT = 20;
const MAX_REVIEW_OFFSET = 10000;
const ALLOWED_PHOTO_FIELDS = new Set(
  Array.from({ length: REVIEW_PHOTO_MAX_COUNT }, (_, index) => `photo${index}`)
);

export class ReviewRouteError extends Error {
  constructor(message: string, public status = 400, public code?: string) {
    super(message);
  }
}

export class RequestTooLargeError extends ReviewRouteError {
  constructor() {
    super('Request is too large. Maximum 4 MB.', 413);
  }
}

export interface ReviewPagination {
  limit: number;
  offset: number;
}

export function parseReviewRouteUrlProductId(searchParams: URLSearchParams): string {
  const productId = searchParams.get('productId');
  if (!productId) {
    throw new ReviewRouteError('Product ID is required.', 400);
  }
  if (!UUID_REGEX.test(productId)) {
    throw new ReviewRouteError('Invalid product ID format.', 400);
  }
  return productId;
}

export function parseReviewPagination(searchParams: URLSearchParams): ReviewPagination {
  const parseIntegerParam = (name: string, fallback: number, min: number, max: number): number => {
    const raw = searchParams.get(name);
    if (raw === null) return fallback;
    if (!PAGINATION_INTEGER_REGEX.test(raw)) {
      throw new ReviewRouteError(`Invalid ${name} parameter.`, 400, 'INVALID_PAGINATION');
    }

    const parsed = Number(raw);
    if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
      throw new ReviewRouteError(`Invalid ${name} parameter.`, 400, 'INVALID_PAGINATION');
    }

    return parsed;
  };

  return {
    limit: parseIntegerParam('limit', DEFAULT_REVIEW_LIMIT, 1, MAX_REVIEW_LIMIT),
    offset: parseIntegerParam('offset', 0, 0, MAX_REVIEW_OFFSET),
  };
}

function isUploadedFile(value: FormDataEntryValue): value is File {
  if (typeof File !== 'undefined' && value instanceof File) return true;
  return (
    typeof value === 'object'
    && value !== null
    && 'arrayBuffer' in value
    && 'name' in value
    && 'size' in value
  );
}

export function parseReviewPhotos(formData: FormData): File[] {
  const files: File[] = [];

  formData.forEach((value, key) => {
    if (isUploadedFile(value)) {
      if (!ALLOWED_PHOTO_FIELDS.has(key)) {
        throw new ReviewRouteError('Unexpected photo field.', 400);
      }
      files.push(value);
      return;
    }

    if (key.toLowerCase().startsWith('photo')) {
      throw new ReviewRouteError('Invalid photo field.', 400);
    }
  });

  if (files.length > REVIEW_PHOTO_MAX_COUNT) {
    throw new ReviewRouteError('Maximum 3 photographs allowed per review.', 400);
  }

  return files;
}

export async function parseBoundedMultipart(
  request: Request,
  maxBytes = MAX_REVIEW_REQUEST_BYTES
): Promise<FormData> {
  const declaredLength = request.headers.get('content-length');
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      throw new RequestTooLargeError();
    }
  }

  const body = request.body;
  if (!body) {
    throw new ReviewRouteError('Multipart body is required.', 400);
  }

  const reader = body.getReader();
  let received = 0;
  const boundedBody = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }

      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        controller.error(new RequestTooLargeError());
        return;
      }

      controller.enqueue(value);
    },
    cancel(reason) {
      void reader.cancel(reason);
    },
  });

  const boundedRequest = new Request(request.url, {
    method: request.method,
    headers: new Headers(request.headers),
    body: boundedBody as any,
    duplex: 'half',
  } as RequestInit & { duplex?: string });

  try {
    return await boundedRequest.formData();
  } catch (error) {
    if (error instanceof RequestTooLargeError) throw error;
    throw new ReviewRouteError('Invalid multipart request.', 400);
  }
}

export interface ValidatedReviewInput {
  productId: string;
  rating: number;
  content: string;
  customerName: string | null;
  submissionKey: string;
}

function countCodePoints(value: string): number {
  return Array.from(value).length;
}

function isHighEntropySubmissionKey(value: string): boolean {
  if (!SUBMISSION_KEY_REGEX.test(value)) return false;
  return new Set(value.replace(/[-_]/g, '')).size >= SUBMISSION_KEY_MIN_DISTINCT_CHARS;
}

export function hashReviewPhoto(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export interface ReviewPayloadHashInput {
  productId: string;
  userId: string | null;
  customerName: string | null;
  rating: number;
  content: string;
  imageFingerprints: string[];
}

export function computeReviewPayloadHash(input: ReviewPayloadHashInput): string {
  if (input.imageFingerprints.length > REVIEW_PHOTO_MAX_COUNT) {
    throw new ReviewRouteError('Too many image fingerprints.', 400, 'INVALID_PAYLOAD');
  }

  for (const fingerprint of input.imageFingerprints) {
    if (!SHA256_HEX_REGEX.test(fingerprint)) {
      throw new ReviewRouteError('Invalid image fingerprint.', 400, 'INVALID_PAYLOAD');
    }
  }

  const canonicalPayload = JSON.stringify([
    ['content', input.content],
    ['customerName', input.customerName],
    ['imageFingerprints', input.imageFingerprints],
    ['productId', input.productId],
    ['rating', input.rating],
    ['userId', input.userId],
  ]);

  return createHash('sha256').update(canonicalPayload).digest('hex');
}

export function validateReviewInput(input: {
  productId: string;
  rating: unknown;
  content: unknown;
  customerName: unknown;
  submissionKey: unknown;
  website: unknown;
  userId?: unknown;
}): { data: ValidatedReviewInput | null; errors: ProductReviewValidationError[] } {
  const errors: ProductReviewValidationError[] = [];

  if (input.website !== undefined && input.website !== null && String(input.website).trim().length > 0) {
    return {
      data: null,
      errors: [{ field: 'website', message: 'Invalid submission.' }],
    };
  }

  const productId = typeof input.productId === 'string' ? input.productId.trim() : '';
  if (!productId) {
    errors.push({ field: 'productId', message: 'Product ID is required.' });
  } else if (!UUID_REGEX.test(productId)) {
    errors.push({ field: 'productId', message: 'Invalid product ID format.' });
  }

  let ratingNum = Number.NaN;
  if (typeof input.rating === 'number') {
    ratingNum = input.rating;
  } else if (typeof input.rating === 'string' && INTEGER_REGEX.test(input.rating.trim())) {
    ratingNum = Number(input.rating.trim());
  }

  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    errors.push({ field: 'rating', message: 'Rating must be an integer between 1 and 5.' });
  }

  const rawContent = typeof input.content === 'string' ? input.content : '';
  const content = rawContent.trim();

  if (!content) {
    errors.push({ field: 'content', message: 'Review content is required.' });
  } else {
    const contentCodePoints = countCodePoints(content);
    if (contentCodePoints < 10) {
      errors.push({ field: 'content', message: 'Review must be at least 10 characters.' });
    } else if (contentCodePoints > 2000) {
      errors.push({ field: 'content', message: 'Review must not exceed 2000 characters.' });
    } else if (Buffer.byteLength(content, 'utf8') > 8000) {
      errors.push({ field: 'content', message: 'Review content is too large.' });
    } else if (CONTROL_CHAR_REGEX.test(content)) {
      errors.push({ field: 'content', message: 'Review contains invalid characters.' });
    }
  }

  let customerName: string | null = null;
  if (input.customerName !== undefined && input.customerName !== null) {
    const name = typeof input.customerName === 'string' ? input.customerName.trim() : '';
    if (name.length > 0) {
      const nameCodePoints = countCodePoints(name);
      if (nameCodePoints < 2 || nameCodePoints > 80) {
        errors.push({ field: 'customerName', message: 'Name must be between 2 and 80 characters.' });
      } else if (CONTROL_CHAR_REGEX.test(name)) {
        errors.push({ field: 'customerName', message: 'Name contains invalid characters.' });
      } else {
        customerName = name;
      }
    }
  }

  const submissionKey = typeof input.submissionKey === 'string' ? input.submissionKey.trim() : '';
  if (!submissionKey) {
    errors.push({ field: 'submissionKey', message: 'Submission key is required.' });
  } else if (!isHighEntropySubmissionKey(submissionKey)) {
    errors.push({
      field: 'submissionKey',
      message: 'Submission key must be a high-entropy value.',
    });
  }

  if (errors.length > 0) {
    return { data: null, errors };
  }

  return {
    data: {
      productId,
      rating: ratingNum,
      content,
      customerName,
      submissionKey,
    },
    errors: [],
  };
}
