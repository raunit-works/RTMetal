import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { verifyAdminAccess } from '@/lib/supabase/admin';
import type { MainSection } from '@/lib/types';

import {
  ADMIN_REVIEW_PHOTO_SIGN_SECONDS,
  isValidAdminReviewId,
  type AdminReviewDetail,
  type AdminReviewPhotoView,
} from './admin-view';

type AdminSupabaseClient = ReturnType<typeof getSupabaseServiceClient>;

export interface AdminIdentity {
  isAdmin: boolean;
  userId: string | null;
}

export interface AdminReviewServerDependencies {
  verifyAdmin: () => Promise<AdminIdentity>;
  getClient: () => AdminSupabaseClient;
}

interface StorageEntry {
  name: string;
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export function hasValidAdminMutationOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const host = request.headers.get('x-forwarded-host') ?? requestUrl.host;
    const protocol = request.headers.get('x-forwarded-proto') ?? requestUrl.protocol.replace(':', '');

    return (
      !originUrl.username &&
      !originUrl.password &&
      (protocol === 'http' || protocol === 'https') &&
      originUrl.host === host &&
      originUrl.protocol === `${protocol}:`
    );
  } catch {
    return false;
  }
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function requireAdmin(
  dependencies: AdminReviewServerDependencies
): Promise<AdminIdentity | Response> {
  let identity: AdminIdentity;
  try {
    identity = await dependencies.verifyAdmin();
  } catch {
    return jsonResponse(401, { message: 'Authentication is required.' });
  }
  if (!identity.isAdmin || !identity.userId) {
    return jsonResponse(403, { message: 'Administrator access is required.' });
  }
  return identity;
}

export async function handleAdminReviewDetailRequest(
  request: Request,
  dependencies: AdminReviewServerDependencies
): Promise<Response> {
  if (request.method !== 'GET') {
    return jsonResponse(405, { message: 'Method not allowed.' });
  }

  const admin = await requireAdmin(dependencies);
  if (admin instanceof Response) return admin;

  const reviewId = new URL(request.url).searchParams.get('reviewId') ?? '';
  if (!isValidAdminReviewId(reviewId)) {
    return jsonResponse(400, { message: 'Invalid review identifier.' });
  }

  const client = dependencies.getClient();
  const { data: review, error: reviewError } = await client
    .from('product_reviews')
    .select(
      [
        'id',
        'product_id',
        'customer_name',
        'rating',
        'content',
        'status',
        'created_at',
        'updated_at',
        'products!inner(id, name, slug, categories!inner(id, name, main_section))',
      ].join(', ')
    )
    .eq('id', reviewId)
    .maybeSingle();

  if (reviewError) {
    const code = String((reviewError as { code?: string })?.code ?? '');
    if (code === 'PGRST205' || code === '42P01' || code === '42883') {
      return jsonResponse(503, { message: 'Review database migrations are not applied.' });
    }
    return jsonResponse(500, { message: 'Could not load the review.' });
  }
  if (!review) return jsonResponse(404, { message: 'Review not found.' });

  const reviewRow = review as unknown as Record<string, unknown>;
  const productsValue = reviewRow.products;
  const productRecord = Array.isArray(productsValue) ? productsValue[0] : productsValue;
  const product = productRecord as Record<string, unknown> | null | undefined;
  const categoryValue = product?.categories;
  const category = (Array.isArray(categoryValue) ? categoryValue[0] : categoryValue) as
    | Record<string, unknown>
    | null
    | undefined;

  const { data: imageRows, error: imageError } = await client
    .from('product_review_images')
    .select('id, storage_path, sort_order')
    .eq('review_id', reviewId)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (imageError) return jsonResponse(500, { message: 'Could not load review photos.' });

  const photos: AdminReviewPhotoView[] = [];
  for (const row of imageRows ?? []) {
    const storagePath = readString(row.storage_path);
    if (!storagePath || !storagePath.startsWith(`${reviewId}/`)) continue;
    const { data, error } = await client.storage
      .from('review-photos')
      .createSignedUrl(storagePath, ADMIN_REVIEW_PHOTO_SIGN_SECONDS);
    if (error || !data?.signedUrl) {
      return jsonResponse(500, { message: 'Could not prepare review photos.' });
    }
    photos.push({
      id: String(row.id),
      url: data.signedUrl,
      sortOrder: readNumber(row.sort_order),
    });
  }

  const detail: AdminReviewDetail = {
    id: String(reviewRow.id),
    productId: String(reviewRow.product_id),
    productName:
      readString(product?.name) ?? readString(reviewRow.product_name_snapshot) ?? 'Product unavailable',
    productSlug: readString(product?.slug),
    division: (readString(category?.main_section) as MainSection | null) ?? null,
    categoryName: readString(category?.name),
    customerName: readString(reviewRow.customer_name),
    rating: readNumber(reviewRow.rating, 1),
    content: String(reviewRow.content ?? ''),
    status: reviewRow.status === 'archived' ? 'archived' : 'published',
    createdAt: String(reviewRow.created_at),
    updatedAt: String(reviewRow.updated_at),
    photos,
  };

  return jsonResponse(200, { review: detail });
}

export async function handleAdminReviewDeleteRequest(
  request: Request,
  dependencies: AdminReviewServerDependencies
): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse(405, { message: 'Method not allowed.' });
  }
  if (!hasValidAdminMutationOrigin(request)) {
    return jsonResponse(403, { message: 'Invalid request origin.' });
  }

  const admin = await requireAdmin(dependencies);
  if (admin instanceof Response) return admin;

  let reviewId = '';
  try {
    const body = (await request.json()) as { reviewId?: unknown };
    reviewId = typeof body.reviewId === 'string' ? body.reviewId : '';
  } catch {
    return jsonResponse(400, { message: 'Invalid request body.' });
  }
  if (!isValidAdminReviewId(reviewId)) {
    return jsonResponse(400, { message: 'Invalid review identifier.' });
  }

  const client = dependencies.getClient();
  const { data: review, error: reviewError } = await client
    .from('product_reviews')
    .select('id, created_at')
    .eq('id', reviewId)
    .maybeSingle();

  if (reviewError) return jsonResponse(500, { message: 'Could not verify the review.' });

  const { data: imageRows, error: imageError } = await client
    .from('product_review_images')
    .select('storage_path')
    .eq('review_id', reviewId);

  if (imageError) return jsonResponse(500, { message: 'Could not verify review photos.' });

  const storagePaths = new Set<string>();
  for (const row of imageRows ?? []) {
    const storagePath = readString(row.storage_path);
    if (!storagePath) continue;
    if (!storagePath.startsWith(`${reviewId}/`)) {
      return jsonResponse(500, {
        message: 'Review photos could not be safely removed. The review was not deleted.',
      });
    }
    storagePaths.add(storagePath);
  }

  const { data: listedFiles, error: listError } = await client.storage
    .from('review-photos')
    .list(reviewId);

  if (listError) {
    return jsonResponse(500, { message: 'Could not verify stored review photos. The review was not deleted.' });
  }

  for (const entry of (listedFiles ?? []) as StorageEntry[]) {
    const storagePath = entry.name.startsWith(`${reviewId}/`) ? entry.name : `${reviewId}/${entry.name}`;
    if (storagePath.startsWith(`${reviewId}/`)) storagePaths.add(storagePath);
  }

  if (storagePaths.size > 0) {
    const { error: removeError } = await client.storage
      .from('review-photos')
      .remove(Array.from(storagePaths));
    if (removeError) {
      return jsonResponse(502, {
        message: 'Stored review photos could not be removed. The review was not deleted.',
        partialCleanup: true,
      });
    }
  }

  if (!review) {
    return jsonResponse(200, {
      deleted: true,
      alreadyRemoved: true,
      message: 'Review was already removed; no additional action was required.',
    });
  }

  const { error: deleteError } = await client.from('product_reviews').delete().eq('id', reviewId);
  if (deleteError) {
    return jsonResponse(500, {
      message: 'Review photos were removed, but the review record could not be deleted. Retry deletion.',
      partialCleanup: true,
    });
  }

  return jsonResponse(200, {
    deleted: true,
    message: 'Review and its stored photos were permanently deleted.',
  });
}

export function createAdminReviewServerHandlers() {
  return {
    verifyAdmin: async (): Promise<AdminIdentity> => {
      const result = await verifyAdminAccess();
      return { isAdmin: result.isAdmin, userId: result.userId };
    },
    getClient: getSupabaseServiceClient,
  } satisfies AdminReviewServerDependencies;
}
