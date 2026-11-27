import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { MainSection, ProductReviewImage, ProductReviewStatus } from '@/lib/types';

import {
  ADMIN_NOTIFICATION_LIMIT,
  getAdminReviewPageState,
  getAdminReviewRequestBounds,
  isAdminReviewFailure,
  isValidAdminReviewId,
  normalizeAdminReviewSearch,
  type AdminNotification,
  type AdminNotificationsResult,
  type AdminReviewDetail,
  type AdminReviewFailure,
  type AdminReviewListItem,
  type AdminReviewQuery,
  type AdminReviewQueryAdapter,
  type AdminReviewSelectInput,
  type AdminReviewSelectResult,
  type AdminReviewStats,
  type AdminReviewsDashboardData,
} from './admin-view';

type ReviewRow = Record<string, unknown> & {
  id: string;
  product_id: string;
  rating: number;
  content: string;
  status: ProductReviewStatus;
  created_at: string;
  updated_at: string;
};

interface SupabaseErrorLike {
  code?: string;
  message?: string;
}

function toAdminReviewFailure(error: unknown, fallbackMessage: string): AdminReviewFailure {
  if (isAdminReviewFailure(error)) return error;
  const details = error as SupabaseErrorLike | null;
  const code = details?.code;
  const message = details?.message;
  if (code === 'PGRST205' || code === '42P01' || code === '42883') {
    return {
      kind: 'schema-missing',
      message: 'Review management is unavailable until the review database migrations are applied.',
    };
  }
  if (code === '42501' || message?.toLowerCase().includes('forbidden')) {
    return { kind: 'unauthorized', message: 'You do not have permission to manage reviews.' };
  }
  return {
    kind: 'unavailable',
    message: message && message.length > 0 ? message : fallbackMessage,
  };
}

function single<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapReviewImageRow(row: Record<string, unknown>): ProductReviewImage {
  return {
    id: String(row.id),
    reviewId: String(row.review_id),
    storagePath: String(row.storage_path),
    sortOrder: readNumber(row.sort_order),
    createdAt: String(row.created_at),
  };
}

function mapReviewRow(row: ReviewRow): AdminReviewListItem {
  const images = Array.isArray(row.product_review_images)
    ? row.product_review_images.map((image) => mapReviewImageRow(image as Record<string, unknown>))
    : [];

  const product = single<Record<string, unknown> | null>(
    row.products as Record<string, unknown> | Record<string, unknown>[] | null | undefined
  );
  const category = product
    ? single<Record<string, unknown> | null>(
        product.categories as Record<string, unknown> | Record<string, unknown>[] | null | undefined
      )
    : null;

  const division = readString(category?.main_section) as MainSection | null;

  return {
    id: String(row.id),
    productId: String(row.product_id),
    userId: readString(row.user_id),
    customerName: readString(row.customer_name),
    rating: readNumber(row.rating, 1),
    content: String(row.content ?? ''),
    status: row.status === 'archived' ? 'archived' : 'published',
    productNameSnapshot: readString(row.product_name_snapshot),
    productSlugSnapshot: readString(row.product_slug_snapshot),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    images,
    division,
    categoryName: readString(category?.name),
    productName: readString(product?.name),
  };
}

export function createSupabaseAdminReviewQueryAdapter(): AdminReviewQueryAdapter {
  const supabase = createSupabaseBrowserClient();

  return {
    async selectReviews(input: AdminReviewSelectInput): Promise<AdminReviewSelectResult> {
      const { data, error } = await supabase.rpc('get_admin_reviews_page', {
        p_page: input.page,
        p_page_size: input.pageSize,
        p_status: input.status === 'all' ? null : input.status,
        p_rating: input.rating === 'all' ? null : Number(input.rating),
        p_search: input.search || null,
        p_division: input.division === 'all' ? null : input.division,
        p_sort: input.sort,
      });
      if (error) throw toAdminReviewFailure(error, 'Could not load reviews.');

      const payload = (data ?? {}) as { rows?: unknown[]; count?: number | string };
      return {
        rows: (payload.rows ?? []).map((row) => mapReviewRow(row as unknown as ReviewRow)),
        count: readNumber(payload.count ?? 0),
      };
    },

    async selectStats(): Promise<AdminReviewStats> {
      const { data, error } = await supabase.rpc('get_admin_review_stats');
      if (error) throw toAdminReviewFailure(error, 'Could not load review statistics.');

      const stats = (data ?? {}) as Record<string, unknown>;
      const averageValue = stats.average_rating ?? stats.averageRating ?? null;
      return {
        total: readNumber(stats.total),
        published: readNumber(stats.published),
        archived: readNumber(stats.archived),
        averageRating: averageValue === null || averageValue === undefined ? null : readNumber(averageValue),
      };
    },
  };
}

export async function getAdminReviewList(
  query: AdminReviewQuery,
  adapter: AdminReviewQueryAdapter = createSupabaseAdminReviewQueryAdapter()
) {
  const bounds = getAdminReviewRequestBounds(query.page, query.pageSize);
  const baseInput = {
    status: query.status,
    rating: query.rating,
    search: normalizeAdminReviewSearch(query.search),
    division: query.division,
    sort: query.sort,
    pageSize: bounds.pageSize,
  };
  const result = await adapter.selectReviews({ ...baseInput, page: bounds.page });
  const page = getAdminReviewPageState(result.count, bounds.page, bounds.pageSize);

  if (page.page === bounds.page) {
    return { reviews: result.rows, page };
  }

  const adjusted = await adapter.selectReviews({ ...baseInput, page: page.page });
  return { reviews: adjusted.rows, page };
}

export async function getAdminReviewsDashboard(
  query: AdminReviewQuery,
  adapter: AdminReviewQueryAdapter = createSupabaseAdminReviewQueryAdapter()
): Promise<AdminReviewsDashboardData> {
  const [list, stats] = await Promise.all([
    getAdminReviewList(query, adapter),
    adapter.selectStats(),
  ]);

  return { list, stats };
}

export async function updateAdminReviewStatus(
  reviewId: string,
  status: ProductReviewStatus
): Promise<void> {
  if (!isValidAdminReviewId(reviewId)) {
    throw { kind: 'invalid', message: 'Invalid review identifier.' } satisfies AdminReviewFailure;
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('product_reviews')
    .update({ status })
    .eq('id', reviewId)
    .select('id')
    .maybeSingle();

  if (error) throw toAdminReviewFailure(error, 'Could not update the review.');
  if (!data) {
    throw { kind: 'unauthorized', message: 'Review not found or not editable.' } satisfies AdminReviewFailure;
  }
}

async function readAdminReviewResponse(response: Response): Promise<Record<string, unknown>> {
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof payload.message === 'string' ? payload.message : 'Review action failed.';
    const kind = response.status === 403 ? 'unauthorized' : response.status === 404 ? 'invalid' : 'unavailable';
    throw { kind, message } satisfies AdminReviewFailure;
  }
  return payload;
}

export async function getAdminReviewDetail(reviewId: string): Promise<AdminReviewDetail> {
  if (!isValidAdminReviewId(reviewId)) {
    throw { kind: 'invalid', message: 'Invalid review identifier.' } satisfies AdminReviewFailure;
  }

  const response = await fetch(
    `/api/admin/reviews/detail?reviewId=${encodeURIComponent(reviewId)}`,
    { credentials: 'same-origin' }
  );
  const payload = await readAdminReviewResponse(response);
  return payload.review as AdminReviewDetail;
}

export async function deleteAdminReviewAdmin(reviewId: string): Promise<void> {
  if (!isValidAdminReviewId(reviewId)) {
    throw { kind: 'invalid', message: 'Invalid review identifier.' } satisfies AdminReviewFailure;
  }

  const response = await fetch('/api/admin/reviews/delete', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewId }),
  });
  await readAdminReviewResponse(response);
}

function mapNotificationRow(row: Record<string, unknown>): AdminNotification {
  return {
    id: String(row.id),
    reviewId: readString(row.review_id),
    title: String(row.title ?? 'New review'),
    message: String(row.message ?? ''),
    isRead: row.is_read === true,
    createdAt: String(row.created_at),
  };
}

export async function getAdminNotifications(
  requestedLimit: number = ADMIN_NOTIFICATION_LIMIT
): Promise<AdminNotificationsResult> {
  const limit = Math.min(100, Math.max(1, Math.floor(requestedLimit) || ADMIN_NOTIFICATION_LIMIT));
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('id, review_id, title, message, is_read, created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (error) throw toAdminReviewFailure(error, 'Could not load notifications.');
  const notifications = (data ?? []).map((row) => mapNotificationRow(row as Record<string, unknown>));
  const { count, error: countError } = await supabase
    .from('admin_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);

  if (countError) throw toAdminReviewFailure(countError, 'Could not count unread notifications.');

  return {
    notifications,
    unreadCount: Math.max(0, count ?? 0),
  };
}

async function mutateNotification(
  notificationId: string,
  mutation: (supabase: ReturnType<typeof createSupabaseBrowserClient>) => Promise<SupabaseErrorLike | null>
): Promise<void> {
  if (!isValidAdminReviewId(notificationId)) {
    throw { kind: 'invalid', message: 'Invalid notification identifier.' } satisfies AdminReviewFailure;
  }
  const supabase = createSupabaseBrowserClient();
  const error = await mutation(supabase);
  if (error) throw toAdminReviewFailure(error, 'Could not update the notification.');
}

export function markAdminNotificationRead(notificationId: string): Promise<void> {
  return mutateNotification(notificationId, async (supabase) => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);
    return error;
  });
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('admin_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('is_read', false);
  if (error) throw toAdminReviewFailure(error, 'Could not update notifications.');
}

export function deleteAdminNotification(notificationId: string): Promise<void> {
  return mutateNotification(notificationId, async (supabase) => {
    const { error } = await supabase.from('admin_notifications').delete().eq('id', notificationId);
    return error;
  });
}

export const setAdminReviewStatusAdmin = updateAdminReviewStatus;
export const markAdminNotificationReadAdmin = markAdminNotificationRead;
export const markAllAdminNotificationsReadAdmin = markAllAdminNotificationsRead;
export const deleteAdminNotificationAdmin = deleteAdminNotification;
