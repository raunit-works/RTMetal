'use client';

import type {
  ReviewsResponse,
  SubmitReviewResponse,
} from '@/lib/review/client-contract';

export interface ReviewApiErrorDetails {
  status: number;
  code?: string;
  retryAfter?: number;
  submissionId?: string;
  errors?: Array<{ field: string; message: string }>;
}

export class ReviewApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly retryAfter?: number;
  readonly submissionId?: string;
  readonly errors: Array<{ field: string; message: string }>;

  constructor(message: string, details: ReviewApiErrorDetails) {
    super(message);
    this.name = 'ReviewApiError';
    this.status = details.status;
    this.code = details.code;
    this.retryAfter = details.retryAfter;
    this.submissionId = details.submissionId;
    this.errors = details.errors ?? [];
  }
}

interface ErrorBody {
  success?: boolean;
  message?: string;
  code?: string;
  errors?: Array<{ field: string; message: string }>;
  retryAfter?: number;
  submissionId?: string;
}

function parseRetryAfter(response: Response, body: ErrorBody): number | undefined {
  const header = response.headers.get('Retry-After');
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
    const date = Date.parse(header);
    if (!Number.isNaN(date)) {
      return Math.max(0, Math.ceil((date - Date.now()) / 1000));
    }
  }
  return typeof body.retryAfter === 'number' && Number.isFinite(body.retryAfter)
    ? Math.ceil(body.retryAfter)
    : undefined;
}

async function readBody(response: Response): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') return body as Record<string, unknown>;
  } catch {
    return {};
  }
  return {};
}

function errorFromResponse(response: Response, body: ErrorBody): ReviewApiError {
  return new ReviewApiError(
    'Your review could not be submitted. Please try again.',
    {
      status: response.status,
      code: body.code,
      retryAfter: parseRetryAfter(response, body),
      submissionId: body.submissionId,
      errors: body.errors,
    }
  );
}

export async function fetchReviews(
  productId: string,
  options: { limit: number; offset: number },
  signal?: AbortSignal
): Promise<ReviewsResponse['data']> {
  const params = new URLSearchParams({
    productId,
    limit: String(options.limit),
    offset: String(options.offset),
  });

  const response = await fetch(`/api/reviews?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
    signal,
  });
  const body = (await readBody(response)) as ErrorBody & { data?: ReviewsResponse['data'] };

  if (!response.ok || !body.data) {
    throw new ReviewApiError('Reviews are temporarily unavailable.', {
      status: response.status,
      code: body.code,
    });
  }

  return body.data;
}

export interface ReviewSubmitInput {
  productId: string;
  rating: number;
  content: string;
  customerName: string;
  submissionKey: string;
  photos: File[];
}

export interface ReviewApiAdapter {
  fetchReviews: (
    productId: string,
    options: { limit: number; offset: number },
    signal?: AbortSignal,
  ) => Promise<ReviewsResponse['data']>;
  submitReview: (input: ReviewSubmitInput, signal?: AbortSignal) => Promise<SubmitReviewResponse>;
}

export const liveReviewApi: ReviewApiAdapter = {
  fetchReviews,
  submitReview: (input, signal) => submitReview(input, signal),
};

export async function submitReview(
  input: ReviewSubmitInput,
  signal?: AbortSignal,
): Promise<SubmitReviewResponse> {

  const formData = new FormData();
  formData.set('productId', input.productId);
  formData.set('rating', String(input.rating));
  formData.set('content', input.content);
  formData.set('customerName', input.customerName);
  formData.set('submissionKey', input.submissionKey);
  formData.set('website', '');
  input.photos.forEach((photo, index) => {
    formData.set(`photo${index}`, photo);
  });

  const response = await fetch('/api/reviews', {
    method: 'POST',
    body: formData,
    signal,
  });
  const body = (await readBody(response)) as unknown as ErrorBody & SubmitReviewResponse;

  if (!response.ok || !body.success || !body.data?.review) {
    throw errorFromResponse(response, body);
  }

  return body;
}
