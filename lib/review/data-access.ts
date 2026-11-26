import { createSupabasePublicClient } from '@/lib/supabase/server';
import { getSupabaseServiceClient, hasServiceCredentials } from '@/lib/supabase/service';
import type { ProductReview, ProductReviewImage, ProductReviewSummary, ProductReviewStatus } from '@/lib/types';

const REVIEW_PHOTO_BUCKET = 'review-photos';

export interface ReviewFetchOptions {
  productId: string;
  limit?: number;
  offset?: number;
}

export interface ReviewFetchResult {
  reviews: ProductReview[];
  totalCount: number;
  summary: ProductReviewSummary;
}

function mapReviewRow(row: any): ProductReview {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id ?? null,
    customerName: row.customer_name ?? null,
    rating: row.rating,
    content: row.content,
    status: row.status as ProductReviewStatus,
    productNameSnapshot: row.product_name_snapshot ?? null,
    productSlugSnapshot: row.product_slug_snapshot ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images: row.product_review_images?.map(mapReviewImageRow) ?? [],
  };
}

function mapReviewImageRow(row: any): ProductReviewImage {
  return {
    id: row.id ?? row.image_id,
    reviewId: row.review_id,
    storagePath: row.storage_path,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

async function fetchPublicReviewImagePaths(
  reviewIds: string[]
): Promise<Map<string, string>> {
  const paths = new Map<string, string>();
  if (!reviewIds.length) return paths;
  if (!hasServiceCredentials()) {
    throw new Error('SERVICE_UNAVAILABLE: Supabase service configuration is not available.');
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.rpc('get_public_review_image_paths', {
    p_review_ids: reviewIds,
  });

  if (error) {
    if (isSchemaNotReadyError(error)) {
      throw new Error('SCHEMA_NOT_READY: Review image helper is not available.');
    }
    throw new Error('Failed to fetch review images.');
  }

  for (const row of (data ?? []) as any[]) {
    if (typeof row?.image_id === 'string' && typeof row?.storage_path === 'string') {
      paths.set(row.image_id, row.storage_path);
    }
  }

  return paths;
}

type PublicSupabaseClient = ReturnType<typeof createSupabasePublicClient>;

async function fetchProductVisibility(supabase: PublicSupabaseClient, productId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_product_public', { product_id: productId });

  if (error) {
    if (isSchemaNotReadyError(error)) {
      throw new Error('SCHEMA_NOT_READY: Review helper is not available.');
    }
    throw new Error('Product visibility check failed.');
  }

  return data === true;
}

export async function fetchProductReviews(options: ReviewFetchOptions): Promise<ReviewFetchResult> {
  const { productId, limit = 20, offset = 0 } = options;
  const supabase = createSupabasePublicClient();

  try {
    const isPublic = await fetchProductVisibility(supabase, productId);
    if (!isPublic) {
      return {
        reviews: [],
        totalCount: 0,
        summary: { averageRating: null, reviewCount: 0 },
      };
    }

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('rating, review_count')
      .eq('id', productId)
      .maybeSingle();

    if (productError) {
      if (isSchemaNotReadyError(productError)) {
        throw new Error('SCHEMA_NOT_READY: Products table not available.');
      }
      throw new Error('Product lookup failed.');
    }

    const { data, error, count } = await supabase
      .from('product_reviews')
      .select(
        'id, product_id, customer_name, rating, content, status, product_name_snapshot, product_slug_snapshot, created_at, updated_at, product_review_images(id, review_id, sort_order, created_at)',
        { count: 'exact' }
      )
      .eq('product_id', productId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      if (isSchemaNotReadyError(error)) {
        throw new Error('SCHEMA_NOT_READY: Review tables have not been migrated yet.');
      }
      throw new Error('Failed to fetch reviews.');
    }

    const reviews = (data ?? []).map(mapReviewRow);
    const imagePaths = await fetchPublicReviewImagePaths(reviews.map((review) => review.id));
    for (const review of reviews) {
      for (const image of review.images ?? []) {
        image.storagePath = imagePaths.get(image.id) ?? '';
      }
    }

    return {
      reviews,
      totalCount: count ?? 0,
      summary: {
        averageRating: productData?.rating ?? null,
        reviewCount: productData?.review_count ?? 0,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('SCHEMA_NOT_READY')) {
      throw error;
    }
    throw new Error('Unable to fetch reviews at this time.');
  }
}

export async function fetchProductReviewSummary(productId: string): Promise<ProductReviewSummary> {
  const supabase = createSupabasePublicClient();

  try {
    const isPublic = await fetchProductVisibility(supabase, productId);
    if (!isPublic) {
      return { averageRating: null, reviewCount: 0 };
    }

    const { data, error } = await supabase
      .from('products')
      .select('rating, review_count')
      .eq('id', productId)
      .maybeSingle();

    if (error) {
      if (isSchemaNotReadyError(error)) {
        throw new Error('SCHEMA_NOT_READY: Products table not available.');
      }
      throw new Error('Product lookup failed.');
    }

    return {
      averageRating: data?.rating ?? null,
      reviewCount: data?.review_count ?? 0,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('SCHEMA_NOT_READY')) {
      throw error;
    }
    throw new Error('Unable to fetch review summary.');
  }
}

export async function fetchReviewImages(reviewId: string): Promise<ProductReviewImage[]> {
  if (!hasServiceCredentials()) {
    throw new Error('SERVICE_UNAVAILABLE: Supabase service configuration is not available.');
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.rpc('get_public_review_image_paths', {
    p_review_ids: [reviewId],
  });

  if (error) {
    if (isSchemaNotReadyError(error)) {
      throw new Error('SCHEMA_NOT_READY: Review image helper is not available.');
    }
    throw new Error('Failed to fetch review images.');
  }

  return ((data ?? []) as any[]).map(mapReviewImageRow);
}

export interface CreateReviewPayload {
  reviewId: string;
  productId: string;
  userId: string | null;
  customerName: string | null;
  rating: number;
  content: string;
  submissionKeyHash: string;
  payloadHash: string;
}

export interface ExistingReviewResult {
  id: string;
  userId: string | null;
  customerName: string | null;
  rating: number;
  content: string;
  status: string;
  productNameSnapshot: string | null;
  productSlugSnapshot: string | null;
  createdAt: string | null;
}

export interface CreateReviewResult {
  reviewId: string;
  duplicate: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  review: ExistingReviewResult | null;
}

export class ReviewSubmissionOutcomeUnknownError extends Error {
  constructor() {
    super('Review submission outcome is unknown.');
    this.name = 'ReviewSubmissionOutcomeUnknownError';
  }
}

const REVIEW_UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function createProductReviewAtomic(
  payload: CreateReviewPayload,
  imageStoragePaths: string[] = [],
  sortOrders: number[] = []
): Promise<CreateReviewResult> {
  if (!hasServiceCredentials()) {
    throw new Error('SERVICE_UNAVAILABLE: Supabase service configuration is not available.');
  }

  const supabase = getSupabaseServiceClient();

  try {
    const { data, error } = await supabase.rpc('submit_product_review', {
      p_review_id: payload.reviewId,
      p_product_id: payload.productId,
      p_user_id: payload.userId,
      p_customer_name: payload.customerName,
      p_rating: payload.rating,
      p_content: payload.content,
      p_submission_key_hash: payload.submissionKeyHash,
      p_payload_hash: payload.payloadHash,
      p_image_paths: imageStoragePaths,
      p_sort_orders: sortOrders,
    });

    if (error) {
      if (isSchemaNotReadyError(error)) {
        throw new Error('SCHEMA_NOT_READY: Review tables have not been migrated yet.');
      }
      throw new ReviewSubmissionOutcomeUnknownError();
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result || typeof result !== 'object') {
      throw new ReviewSubmissionOutcomeUnknownError();
    }

    const row = result as any;
    if (
      typeof row.duplicate !== 'boolean'
      || (row.error_code !== null && row.error_code !== undefined && typeof row.error_code !== 'string')
      || (row.error_message !== null && row.error_message !== undefined && typeof row.error_message !== 'string')
      || (row.review_id !== null && row.review_id !== undefined && typeof row.review_id !== 'string')
    ) {
      throw new ReviewSubmissionOutcomeUnknownError();
    }

    const reviewId = typeof row.review_id === 'string' ? row.review_id : '';
    if (reviewId && !REVIEW_UUID_REGEX.test(reviewId)) {
      throw new ReviewSubmissionOutcomeUnknownError();
    }

    return {
      reviewId,
      duplicate: row.duplicate,
      errorCode: typeof row.error_code === 'string' ? row.error_code : null,
      errorMessage: typeof row.error_message === 'string' ? row.error_message : null,
      review: reviewId
        ? {
            id: reviewId,
            userId: row.existing_user_id ?? null,
            customerName: row.existing_customer_name ?? null,
            rating: row.existing_rating,
            content: row.existing_content,
            status: row.existing_status,
            productNameSnapshot: row.existing_product_name_snapshot ?? null,
            productSlugSnapshot: row.existing_product_slug_snapshot ?? null,
            createdAt: row.existing_created_at ?? null,
          }
        : null,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('SCHEMA_NOT_READY')) {
      throw error;
    }
    if (error instanceof ReviewSubmissionOutcomeUnknownError) throw error;
    throw new ReviewSubmissionOutcomeUnknownError();
  }
}

export type ReviewSubmissionCommitState = 'committed' | 'not_committed' | 'conflict' | 'uncertain';

export interface ReviewReconciliationOptions {
  ambiguous?: boolean;
}

export async function reconcileReviewSubmission(
  reviewId: string,
  submissionKeyHash: string,
  database?: any,
  options: ReviewReconciliationOptions = {}
): Promise<ReviewSubmissionCommitState> {
  const ambiguous = options.ambiguous ?? true;

  if (!database && !hasServiceCredentials()) {
    return 'uncertain';
  }

  try {
    const supabase = database ?? getSupabaseServiceClient();
    const keyResult = await supabase
      .from('review_submission_keys')
      .select('review_id')
      .eq('key_hash', submissionKeyHash)
      .maybeSingle();

    if (keyResult.error) return 'uncertain';

    if (keyResult.data) {
      if (typeof keyResult.data.review_id !== 'string') return 'conflict';
      return keyResult.data.review_id === reviewId ? 'committed' : 'conflict';
    }

    const reviewResult = await supabase
      .from('product_reviews')
      .select('id')
      .eq('id', reviewId)
      .maybeSingle();

    if (reviewResult.error) return 'uncertain';
    if (reviewResult.data) return 'committed';
    return ambiguous ? 'uncertain' : 'not_committed';
  } catch {
    return 'uncertain';
  }
}

export async function checkProductVisibility(productId: string): Promise<{
  exists: boolean;
  isPublic: boolean;
  name: string | null;
  slug: string | null;
}> {
  const supabase = createSupabasePublicClient();

  try {
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, name, slug, is_published, is_archived')
      .eq('id', productId)
      .maybeSingle();

    if (productError) {
      if (isSchemaNotReadyError(productError)) {
        throw new Error('SCHEMA_NOT_READY: Products table not available.');
      }
      throw new Error('Product lookup failed.');
    }

    if (!productData) {
      return { exists: false, isPublic: false, name: null, slug: null };
    }

    const isPublic = await fetchProductVisibility(supabase, productId);
    return {
      exists: true,
      isPublic,
      name: productData.name ?? null,
      slug: productData.slug ?? null,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('SCHEMA_NOT_READY')) {
      throw error;
    }
    throw new Error('Unable to verify product.');
  }
}

export async function uploadReviewPhoto(
  buffer: Buffer,
  mimeType: string,
  storagePath: string
): Promise<void> {
  if (!hasServiceCredentials()) {
    throw new Error('SERVICE_UNAVAILABLE: Supabase service configuration is not available.');
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.storage
    .from(REVIEW_PHOTO_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error('Storage upload failed.');
  }
}

export async function createSignedReviewPhotoUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string | null> {
  if (!hasServiceCredentials()) {
    throw new Error('SERVICE_UNAVAILABLE: Supabase service configuration is not available.');
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.storage
    .from(REVIEW_PHOTO_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    return null;
  }

  return data?.signedUrl ?? null;
}

export async function cleanupReviewPhotos(storagePaths: string[]): Promise<void> {
  if (!storagePaths.length || !hasServiceCredentials()) {
    return;
  }

  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.storage.from(REVIEW_PHOTO_BUCKET).remove(storagePaths);
  if (error) {
    throw new Error('Failed to clean up review photos.');
  }
}

function isSchemaNotReadyError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || '');
  if (code === '42P01' || code === '42883' || code === 'PGRST202') return true;
  const message = String(error.message || error);
  return (
    (message.includes('relation') && message.includes('does not exist')) ||
    message.includes('Could not find the function') ||
    message.includes('schema cache')
  );
}
