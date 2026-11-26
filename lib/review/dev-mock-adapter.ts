'use client';

import {
  ReviewApiError,
  type ReviewApiAdapter,
  type ReviewApiErrorDetails,
} from '@/lib/review/api-client';
import type {
  ReviewUiReview,
  ReviewUiSummary,
  SubmittedReview,
} from '@/lib/review/client-contract';

export type DevReviewDataMode = 'populated' | 'empty';

export type DevSubmissionOutcome =
  | 'success'
  | 'duplicate'
  | 'validation-error'
  | 'server-error'
  | 'rate-limit'
  | 'uncertain';

export const DEV_SUBMISSION_OUTCOMES: ReadonlyArray<{
  value: DevSubmissionOutcome;
  label: string;
}> = [
  { value: 'success', label: 'Successful submission' },
  { value: 'duplicate', label: 'Duplicate submission' },
  { value: 'validation-error', label: 'Validation error' },
  { value: 'server-error', label: 'Server error' },
  { value: 'rate-limit', label: 'Rate limit' },
  { value: 'uncertain', label: 'Uncertain outcome' },
];

const DEV_IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lY8AAAAASUVORK5CYII=';

const MOCK_REVIEWS: ReviewUiReview[] = [
  {
    id: 'dev-review-1',
    productId: 'demo',
    customerName: 'Ananya R.',
    rating: 5,
    content:
      'The antique finish is even richer in person. Excellent craftsmanship and careful packing.',
    status: 'published',
    createdAt: '2026-11-18T10:30:00.000Z',
    images: [
      { id: 'dev-image-1', signedUrl: DEV_IMAGE_DATA_URL, sortOrder: 0 },
      { id: 'dev-image-2', signedUrl: DEV_IMAGE_DATA_URL, sortOrder: 1 },
    ],
  },
  {
    id: 'dev-review-2',
    productId: 'demo',
    customerName: 'Vikram S.',
    rating: 4,
    content:
      'Beautiful patina and solid hanging chain. The finish took a little time to settle, but the result is lovely.',
    status: 'published',
    createdAt: '2026-11-11T08:15:00.000Z',
    images: [],
  },
  {
    id: 'dev-review-3',
    productId: 'demo',
    customerName: null,
    rating: 5,
    content:
      'Ordered for our entryway and it has become the focal point of the room. Very happy with the detail.',
    status: 'published',
    createdAt: '2026-10-29T14:45:00.000Z',
    images: [{ id: 'dev-image-3', signedUrl: DEV_IMAGE_DATA_URL, sortOrder: 0 }],
  },
];

export function getInitialDevReviews(): ReviewUiReview[] {
  return MOCK_REVIEWS.map((review) => ({
    ...review,
    images: review.images.map((image) => ({ ...image })),
  }));
}

function buildSummary(reviews: ReviewUiReview[]): ReviewUiSummary {
  if (reviews.length === 0) return { averageRating: null, reviewCount: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    averageRating: Math.round((total / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
  };
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    function onAbort() {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function error(details: ReviewApiErrorDetails, message: string): never {
  throw new ReviewApiError(message, details);
}

export interface DevReviewMockAdapterOptions {
  getDataMode: () => DevReviewDataMode;
  getOutcome: () => DevSubmissionOutcome;
  getReviews: () => ReviewUiReview[];
  setReviews: (reviews: ReviewUiReview[]) => void;
}

export function createDevReviewMockAdapter(
  options: DevReviewMockAdapterOptions,
): ReviewApiAdapter {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Development review mock adapter is unavailable outside development.');
  }

  return {
    async fetchReviews(_productId, requestOptions, signal) {
      await wait(180, signal);
      const allReviews = options.getDataMode() === 'empty' ? [] : options.getReviews();
      const start = Math.min(requestOptions.offset, allReviews.length);
      const reviews = allReviews.slice(start, start + requestOptions.limit);
      return {
        reviews,
        totalCount: allReviews.length,
        summary: buildSummary(allReviews),
        pagination: {
          limit: requestOptions.limit,
          offset: requestOptions.offset,
          hasMore: start + reviews.length < allReviews.length,
        },
      };
    },

    async submitReview(input, signal) {
      await wait(300, signal);
      const outcome = options.getOutcome();
      const baseReview: SubmittedReview = {
        id: `dev-submitted-${Date.now()}`,
        productId: input.productId,
        customerName: input.customerName.trim() || null,
        rating: input.rating,
        content: input.content.trim(),
        status: 'published',
        createdAt: new Date().toISOString(),
      };

      if (outcome === 'duplicate') {
        return {
          success: true,
          duplicate: true,
          message: 'This review has already been submitted.',
          data: { review: baseReview },
        };
      }

      if (outcome === 'validation-error') {
        return error(
          {
            status: 400,
            code: 'VALIDATION_FAILED',
            errors: [{ field: 'content', message: 'Please remove unsupported wording.' }],
          },
          'Please correct the highlighted field.',
        );
      }

      if (outcome === 'server-error') {
        return error({ status: 500, code: 'SERVER_ERROR' }, 'Dev mock server error.');
      }

      if (outcome === 'rate-limit') {
        return error(
          { status: 429, code: 'RATE_LIMIT_EXCEEDED', retryAfter: 120 },
          'Too many review submissions. Please try again later.',
        );
      }

      if (outcome === 'uncertain') {
        return error(
          {
            status: 503,
            code: 'SUBMISSION_STATUS_UNKNOWN',
            submissionId: `dev-unknown-${Date.now()}`,
          },
          'We could not confirm whether your review was received.',
        );
      }

      const currentReviews = options.getReviews();
      options.setReviews([
        {
          ...baseReview,
          status: 'published',
          createdAt: baseReview.createdAt ?? new Date().toISOString(),
          images: input.photos.map((photo, index) => ({
            id: `dev-submitted-image-${Date.now()}-${index}`,
            signedUrl: null,
            sortOrder: index,
          })),
        },
        ...currentReviews,
      ]);

      return {
        success: true,
        duplicate: false,
        message: 'Thank you for sharing your review.',
        data: { review: baseReview },
      };
    },
  };
}
