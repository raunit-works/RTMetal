import { NextResponse } from 'next/server';
import type { ProductReviewImage } from '@/lib/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasServiceCredentials } from '@/lib/supabase/service';
import {
  parseBoundedMultipart,
  parseReviewPhotos,
  parseReviewPagination,
  parseReviewRouteUrlProductId,
  RequestTooLargeError,
  ReviewRouteError,
  computeReviewPayloadHash,
  hashReviewPhoto,
  validateReviewInput,
} from '@/lib/review/validation';
import {
  processReviewPhoto,
  generateReviewPhotoPath,
  type ReviewPhotoProcessingResult,
} from '@/lib/review/image-processing';
import {
  checkRateLimit,
  getReviewRateLimitSecret,
  hashReviewIdentifier,
  type RateLimitResult,
} from '@/lib/review/rate-limit';
import {
  fetchProductReviews,
  fetchReviewImages,
  checkProductVisibility,
  uploadReviewPhoto,
  createSignedReviewPhotoUrl,
  cleanupReviewPhotos,
  createProductReviewAtomic,
  reconcileReviewSubmission,
  ReviewSubmissionOutcomeUnknownError,
} from '@/lib/review/data-access';
import { randomUUID } from 'crypto';

export interface ReviewFetchDependencies {
  hasServiceCredentials: () => boolean;
  fetchProductReviews: typeof fetchProductReviews;
  createSignedReviewPhotoUrl: typeof createSignedReviewPhotoUrl;
}

const defaultFetchDependencies: ReviewFetchDependencies = {
  hasServiceCredentials,
  fetchProductReviews,
  createSignedReviewPhotoUrl,
};

export interface ReviewRouteDependencies {
  isSubmissionEnabled: () => boolean;
  hasServiceCredentials: () => boolean;
  getReviewRateLimitSecret: () => string;
  checkRateLimit: (request: Request) => Promise<RateLimitResult>;
  validateReviewInput: typeof validateReviewInput;
  checkProductVisibility: typeof checkProductVisibility;
  parseBoundedFormData: (request: Request) => Promise<FormData>;
  parseReviewPhotos: (formData: FormData) => File[];
  getAuthenticatedUserId: () => Promise<string | null>;
  processReviewPhoto: typeof processReviewPhoto;
  generateReviewPhotoPath: typeof generateReviewPhotoPath;
  uploadReviewPhoto: typeof uploadReviewPhoto;
  createProductReviewAtomic: typeof createProductReviewAtomic;
  reconcileReviewSubmission: typeof reconcileReviewSubmission;
  fetchReviewImages: typeof fetchReviewImages;
  createSignedReviewPhotoUrl: typeof createSignedReviewPhotoUrl;
  cleanupReviewPhotos: typeof cleanupReviewPhotos;
  hashSubmissionKey: (value: string) => string;
  hashReviewPhoto: typeof hashReviewPhoto;
  computeReviewPayloadHash: typeof computeReviewPayloadHash;
  randomUUID: () => string;
}

async function resolveAuthenticatedUserId(): Promise<string | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    return !error && data.user ? data.user.id : null;
  } catch {
    return null;
  }
}

const defaultRouteDependencies: ReviewRouteDependencies = {
  isSubmissionEnabled: () => process.env.REVIEW_SUBMISSIONS_ENABLED === 'true',
  hasServiceCredentials,
  getReviewRateLimitSecret,
  checkRateLimit,
  validateReviewInput,
  checkProductVisibility,
  parseBoundedFormData: (request) => parseBoundedMultipart(request),
  parseReviewPhotos,
  getAuthenticatedUserId: resolveAuthenticatedUserId,
  processReviewPhoto,
  generateReviewPhotoPath,
  uploadReviewPhoto,
  createProductReviewAtomic,
  reconcileReviewSubmission,
  fetchReviewImages,
  createSignedReviewPhotoUrl,
  cleanupReviewPhotos,
  hashSubmissionKey: hashReviewIdentifier,
  hashReviewPhoto,
  computeReviewPayloadHash,
  randomUUID,
};

function reviewSubmissionsDisabledResponse() {
  return NextResponse.json(
    { success: false, message: 'Review submissions are not enabled.', code: 'REVIEWS_DISABLED' },
    { status: 503 }
  );
}

function serviceUnavailableResponse() {
  return NextResponse.json(
    { success: false, message: 'Review service is not configured.', code: 'SERVICE_UNAVAILABLE' },
    { status: 503 }
  );
}

function rateLimitUnavailableResponse() {
  return NextResponse.json(
    { success: false, message: 'Review submission is temporarily unavailable.', code: 'RATE_LIMIT_UNAVAILABLE' },
    { status: 503 }
  );
}

async function serializeExistingReviewImages(
  reviewId: string,
  deps: ReviewRouteDependencies
): Promise<Array<{ id: string; sortOrder: number; signedUrl: string | null }>> {
  let images: ProductReviewImage[];
  try {
    images = await deps.fetchReviewImages(reviewId);
  } catch {
    return [];
  }

  const signedUrls = new Map<string, string | null>();
  for (const image of images) {
    if (signedUrls.has(image.id)) continue;
    let signedUrl: string | null = null;
    try {
      signedUrl = await deps.createSignedReviewPhotoUrl(image.storagePath);
    } catch {
      signedUrl = null;
    }
    signedUrls.set(image.id, signedUrl);
  }

  return images.map((image) => ({
    id: image.id,
    sortOrder: image.sortOrder,
    signedUrl: signedUrls.get(image.id) ?? null,
  }));
}

function submissionRateLimitHeaders(rateLimitResult: RateLimitResult) {
  return {
    'X-RateLimit-Remaining': String(rateLimitResult.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetTime / 1000)),
  };
}

async function buildSubmissionSuccessResponse(
  deps: ReviewRouteDependencies,
  options: {
    reviewId: string;
    productId: string;
    customerName: string | null;
    rating: number;
    content: string;
    productName: string | null;
    productSlug: string | null;
    createdAt: string | null;
    imagePaths: string[];
    sortOrders: number[];
    rateLimitResult: RateLimitResult;
  }
): Promise<NextResponse> {
  const images: Array<{ sortOrder: number; signedUrl: string | null }> = [];
  for (let index = 0; index < options.imagePaths.length; index++) {
    let signedUrl: string | null = null;
    try {
      signedUrl = await deps.createSignedReviewPhotoUrl(options.imagePaths[index]);
    } catch {
      signedUrl = null;
    }
    images.push({ sortOrder: options.sortOrders[index], signedUrl });
  }

  return NextResponse.json(
    {
      success: true,
      duplicate: false,
      message: 'Review submitted successfully.',
      data: {
        review: {
          id: options.reviewId,
          productId: options.productId,
          customerName: options.customerName,
          rating: options.rating,
          content: options.content,
          status: 'published',
          productNameSnapshot: options.productName,
          productSlugSnapshot: options.productSlug,
          createdAt: options.createdAt,
          images,
        },
      },
    },
    { status: 201, headers: submissionRateLimitHeaders(options.rateLimitResult) }
  );
}

export async function handleReviewFetch(
  request: Request,
  deps: ReviewFetchDependencies = defaultFetchDependencies
) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = parseReviewRouteUrlProductId(searchParams);
    const { limit, offset } = parseReviewPagination(searchParams);

    if (!deps.hasServiceCredentials()) {
      return serviceUnavailableResponse();
    }

    const result = await deps.fetchProductReviews({ productId, limit, offset });
    const signedUrls = new Map<string, string | null>();

    for (const review of result.reviews) {
      for (const image of review.images ?? []) {
        if (signedUrls.has(image.id)) continue;
        let signedUrl: string | null = null;
        try {
          signedUrl = await deps.createSignedReviewPhotoUrl(image.storagePath);
        } catch {
          signedUrl = null;
        }
        signedUrls.set(image.id, signedUrl);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          reviews: result.reviews.map((review) => ({
            id: review.id,
            productId: review.productId,
            customerName: review.customerName ?? null,
            rating: review.rating,
            content: review.content,
            status: review.status,
            productNameSnapshot: review.productNameSnapshot ?? null,
            productSlugSnapshot: review.productSlugSnapshot ?? null,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
            images: (review.images ?? []).map((image) => ({
              id: image.id,
              reviewId: image.reviewId,
              sortOrder: image.sortOrder,
              signedUrl: signedUrls.get(image.id) ?? null,
            })),
          })),
          totalCount: result.totalCount,
          summary: result.summary,
          pagination: {
            limit,
            offset,
            hasMore: offset + limit < result.totalCount,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ReviewRouteError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code ?? 'BAD_REQUEST' },
        { status: error.status }
      );
    }
    if (error instanceof Error && error.message.startsWith('SCHEMA_NOT_READY')) {
      return NextResponse.json(
        { success: false, message: 'Review system is not yet available.', code: 'SCHEMA_NOT_READY' },
        { status: 503 }
      );
    }

    console.error('[API Error] GET /api/reviews failed:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to fetch reviews at this time.' },
      { status: 500 }
    );
  }
}

export async function handleReviewSubmission(
  request: Request,
  deps: ReviewRouteDependencies = defaultRouteDependencies
) {
  if (!deps.isSubmissionEnabled()) {
    return reviewSubmissionsDisabledResponse();
  }

  let uploadedStoragePaths: string[] = [];

  const cleanupUploadedPhotos = async () => {
    if (!uploadedStoragePaths.length) return;
    const paths = uploadedStoragePaths;
    try {
      await deps.cleanupReviewPhotos(paths);
      uploadedStoragePaths = [];
      return;
    } catch (cleanupError) {
      console.error('[API Error] Review photo cleanup failed:', cleanupError);
    }

    try {
      await deps.cleanupReviewPhotos(paths);
      uploadedStoragePaths = [];
    } catch (cleanupError) {
      console.error('[API Error] Review photo cleanup retry failed:', cleanupError);
    }
  };

  try {
    deps.getReviewRateLimitSecret();
    if (!deps.hasServiceCredentials()) {
      return serviceUnavailableResponse();
    }

    let rateLimitResult: RateLimitResult;
    try {
      rateLimitResult = await deps.checkRateLimit(request);
    } catch (rateLimitError) {
      const message = rateLimitError instanceof Error ? rateLimitError.message : '';
      if (message.startsWith('SERVICE_UNAVAILABLE')) return serviceUnavailableResponse();
      if (
        message.startsWith('RATE_LIMIT_DB_ERROR')
        || message.startsWith('UNABLE_TO_IDENTIFY_CLIENT')
        || message.startsWith('RATE_LIMIT_ERROR')
      ) {
        return rateLimitUnavailableResponse();
      }
      throw rateLimitError;
    }

    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.retryAfter ?? 60;
      return NextResponse.json(
        {
          success: false,
          message: 'Too many review submissions. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetTime / 1000)),
          },
        }
      );
    }

    const formData = await deps.parseBoundedFormData(request);
    const photoFiles = deps.parseReviewPhotos(formData);

    const validation = deps.validateReviewInput({
      productId: formData.get('productId')?.toString() ?? '',
      rating: formData.get('rating')?.toString() ?? '',
      content: formData.get('content')?.toString() ?? '',
      customerName: formData.get('customerName')?.toString() ?? '',
      submissionKey: formData.get('submissionKey')?.toString() ?? '',
      website: formData.get('website')?.toString() ?? '',
    });

    if (validation.errors.length > 0) {
      return NextResponse.json(
        { success: false, message: validation.errors[0].message, errors: validation.errors },
        { status: 400 }
      );
    }

    const validated = validation.data!;
    const productCheck = await deps.checkProductVisibility(validated.productId);

    if (!productCheck.exists) {
      return NextResponse.json(
        { success: false, message: 'Product not found.' },
        { status: 404 }
      );
    }

    if (!productCheck.isPublic) {
      return NextResponse.json(
        { success: false, message: 'This product is not available for reviews.' },
        { status: 400 }
      );
    }

    const authenticatedUserId = await deps.getAuthenticatedUserId();
    const submissionKeyHash = deps.hashSubmissionKey(validated.submissionKey);
    const reviewId = deps.randomUUID();

    const processedPhotos: Array<ReviewPhotoProcessingResult & { sortOrder: number }> = [];
    for (let index = 0; index < photoFiles.length; index++) {
      const photo = photoFiles[index];
      const buffer = Buffer.from(await photo.arrayBuffer());
      try {
        const processed = await deps.processReviewPhoto(buffer, photo.type);
        processedPhotos.push({ ...processed, sortOrder: index });
      } catch (photoError) {
        const message = photoError instanceof Error ? photoError.message : 'The uploaded photo is invalid.';
        throw new ReviewRouteError(message, 400, 'INVALID_PHOTO');
      }

    }

    const imageFingerprints = processedPhotos.map((photo) => deps.hashReviewPhoto(photo.buffer));
    const payloadHash = deps.computeReviewPayloadHash({
      productId: validated.productId,
      userId: authenticatedUserId,
      customerName: validated.customerName,
      rating: validated.rating,
      content: validated.content,
      imageFingerprints,
    });

    const finalImagePaths: string[] = [];
    const sortOrders: number[] = [];

    for (const photo of processedPhotos) {
      const finalPath = deps.generateReviewPhotoPath(reviewId, photo.extension);
      await deps.uploadReviewPhoto(photo.buffer, photo.mimeType, finalPath);
      uploadedStoragePaths.push(finalPath);
      finalImagePaths.push(finalPath);
      sortOrders.push(photo.sortOrder);
    }

    const rateLimitHeaders = submissionRateLimitHeaders(rateLimitResult);

    let createResult: Awaited<ReturnType<typeof deps.createProductReviewAtomic>>;
    try {
      createResult = await deps.createProductReviewAtomic(
        {
          reviewId,
          productId: validated.productId,
          userId: authenticatedUserId,
          customerName: validated.customerName,
          rating: validated.rating,
          content: validated.content,
          submissionKeyHash,
          payloadHash,
        },
        finalImagePaths,
        sortOrders
      );
    } catch (error) {
      if (!(error instanceof ReviewSubmissionOutcomeUnknownError)) throw error;

      const commitState = await deps.reconcileReviewSubmission(reviewId, submissionKeyHash);
      if (commitState === 'committed') {
        uploadedStoragePaths = [];
        return buildSubmissionSuccessResponse(deps, {
          reviewId,
          productId: validated.productId,
          customerName: validated.customerName,
          rating: validated.rating,
          content: validated.content,
          productName: productCheck.name,
          productSlug: productCheck.slug,
          createdAt: null,
          imagePaths: finalImagePaths,
          sortOrders,
          rateLimitResult,
        });
      }

      if (commitState === 'not_committed') {
        await cleanupUploadedPhotos();
        return NextResponse.json(
          { success: false, message: 'Unable to submit review at this time.' },
          { status: 500, headers: rateLimitHeaders }
        );
      }

      if (commitState === 'conflict') {
        await cleanupUploadedPhotos();
        return NextResponse.json(
          { success: false, message: 'Duplicate submission detected.', code: 'DUPLICATE_SUBMISSION' },
          { status: 409, headers: rateLimitHeaders }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Review submission status could not be confirmed. Keep this submission key for retry.',
          code: 'SUBMISSION_STATUS_UNKNOWN',
          submissionId: reviewId,
        },
        { status: 503, headers: rateLimitHeaders }
      );
    }

    if (createResult.duplicate) {
      await cleanupUploadedPhotos();

      if (createResult.review) {
        const existing = createResult.review;
        const existingImages = await serializeExistingReviewImages(existing.id, deps);
        return NextResponse.json(
          {
            success: true,
            duplicate: true,
            message: 'Review already submitted.',
            data: {
              review: {
                id: existing.id,
                productId: validated.productId,
                customerName: existing.customerName,
                rating: existing.rating,
                content: existing.content,
                status: existing.status,
                productNameSnapshot: existing.productNameSnapshot,
                productSlugSnapshot: existing.productSlugSnapshot,
                createdAt: existing.createdAt,
                images: existingImages,
              },
            },
          },
          { status: 200, headers: rateLimitHeaders }
        );
      }

      return NextResponse.json(
        { success: false, message: 'Duplicate submission detected.', code: 'DUPLICATE_SUBMISSION' },
        { status: 409, headers: rateLimitHeaders }
      );
    }

    if (createResult.errorCode) {
      await cleanupUploadedPhotos();

      if (createResult.errorCode === 'SCHEMA_NOT_READY') {
        return NextResponse.json(
          { success: false, message: 'Review system is not yet available.', code: 'SCHEMA_NOT_READY' },
          { status: 503, headers: rateLimitHeaders }
        );
      }
      if (createResult.errorCode === 'PRODUCT_NOT_FOUND') {
        return NextResponse.json(
          { success: false, message: 'Product not found.', code: 'PRODUCT_NOT_FOUND' },
          { status: 404, headers: rateLimitHeaders }
        );
      }
      if (createResult.errorCode === 'PRODUCT_NOT_PUBLIC') {
        return NextResponse.json(
          { success: false, message: 'This product is not available for reviews.', code: 'PRODUCT_NOT_PUBLIC' },
          { status: 400, headers: rateLimitHeaders }
        );
      }
      if (createResult.errorCode === 'VALIDATION_ERROR') {
        return NextResponse.json(
          { success: false, message: 'Review details are invalid.', code: 'VALIDATION_ERROR' },
          { status: 400, headers: rateLimitHeaders }
        );
      }
      if (
        createResult.errorCode === 'SUBMISSION_KEY_CONFLICT'
        || createResult.errorCode === 'REVIEW_UNAVAILABLE'
      ) {
        return NextResponse.json(
          { success: false, message: 'The original submission is not available.', code: createResult.errorCode },
          { status: 409, headers: rateLimitHeaders }
        );
      }

      console.error('[API Error] Review submission failed:', createResult.errorCode);
      return NextResponse.json(
        { success: false, message: 'Unable to submit review at this time.' },
        { status: 500, headers: rateLimitHeaders }
      );
    }

    if (!createResult.reviewId) {
      await cleanupUploadedPhotos();
      throw new Error('Review submission returned no identifier.');
    }

    return buildSubmissionSuccessResponse(deps, {
      reviewId: createResult.reviewId,
      productId: validated.productId,
      customerName: validated.customerName,
      rating: validated.rating,
      content: validated.content,
      productName: productCheck.name,
      productSlug: productCheck.slug,
      createdAt: createResult.review?.createdAt ?? null,
      imagePaths: finalImagePaths,
      sortOrders,
      rateLimitResult,
    });
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      await cleanupUploadedPhotos();
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 413 }
      );
    }

    await cleanupUploadedPhotos();

    if (error instanceof ReviewRouteError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code ?? 'BAD_REQUEST' },
        { status: error.status }
      );
    }

    if (error instanceof Error) {
      if (error.message.startsWith('SERVICE_UNAVAILABLE')) return serviceUnavailableResponse();
      if (error.message.startsWith('SCHEMA_NOT_READY')) {
        return NextResponse.json(
          { success: false, message: 'Review system is not yet available.', code: 'SCHEMA_NOT_READY' },
          { status: 503 }
        );
      }
    }

    console.error('[API Error] POST /api/reviews failed:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected server error occurred.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleReviewFetch(request);
}

export async function POST(request: Request) {
  return handleReviewSubmission(request);
}
