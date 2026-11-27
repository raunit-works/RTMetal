import type {
  MainSection,
  ProductReview,
  ProductReviewImage,
  ProductReviewStatus,
} from '@/lib/types';

export const ADMIN_REVIEW_PAGE_SIZE = 8;
export const ADMIN_NOTIFICATION_LIMIT = 8;
export const ADMIN_REVIEW_MAX_PAGE_SIZE = 100;
export const ADMIN_REVIEW_MAX_PAGE = 10_000;
export const ADMIN_REVIEW_SEARCH_MAX_LENGTH = 120;
export const ADMIN_REVIEW_PHOTO_SIGN_SECONDS = 300;

export type AdminReviewDivisionFilter = 'all' | MainSection;
export type AdminReviewSort = 'newest' | 'oldest';

export interface AdminReviewQuery {
  page: number;
  pageSize: number;
  status: 'all' | ProductReviewStatus;
  rating: 'all' | '1' | '2' | '3' | '4' | '5';
  search: string;
  division: AdminReviewDivisionFilter;
  sort: AdminReviewSort;
}

export interface AdminReviewStats {
  total: number;
  published: number;
  archived: number;
  averageRating: number | null;
}

export interface AdminReviewPageState {
  page: number;
  pageCount: number;
  totalCount: number;
}

export type AdminReviewListItem = ProductReview & {
  division?: MainSection | null;
  categoryName?: string | null;
  productName?: string | null;
};

export interface AdminReviewListResult {
  reviews: AdminReviewListItem[];
  page: AdminReviewPageState;
}

export interface AdminReviewsDashboardData {
  list: AdminReviewListResult;
  stats: AdminReviewStats;
}

export interface AdminNotification {
  id: string;
  reviewId: string | null;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminNotificationsResult {
  notifications: AdminNotification[];
  unreadCount: number;
}

export interface AdminReviewFailure {
  kind: 'schema-missing' | 'unavailable' | 'unauthorized' | 'invalid';
  message: string;
}

export interface AdminReviewPhotoView {
  id: string;
  url: string;
  sortOrder: number;
}

export interface AdminReviewDetail {
  id: string;
  productId: string;
  productName: string;
  productSlug: string | null;
  division: MainSection | null;
  categoryName: string | null;
  customerName: string | null;
  rating: number;
  content: string;
  status: ProductReviewStatus;
  createdAt: string;
  updatedAt: string;
  photos: AdminReviewPhotoView[];
}

export interface AdminReviewSelectInput {
  status: AdminReviewQuery['status'];
  rating: AdminReviewQuery['rating'];
  search: string;
  division: AdminReviewDivisionFilter;
  sort: AdminReviewSort;
  page: number;
  pageSize: number;
}

export interface AdminReviewSelectResult {
  rows: AdminReviewListItem[];
  count: number;
}

export interface AdminReviewQueryAdapter {
  selectReviews(input: AdminReviewSelectInput): Promise<AdminReviewSelectResult>;
  selectStats(): Promise<AdminReviewStats>;
}

export const DEFAULT_ADMIN_REVIEW_QUERY: AdminReviewQuery = {
  page: 1,
  pageSize: ADMIN_REVIEW_PAGE_SIZE,
  status: 'all',
  rating: 'all',
  search: '',
  division: 'all',
  sort: 'newest',
};

export function getAdminReviewStatusLabel(status: ProductReviewStatus): string {
  return status === 'published' ? 'Published' : 'Archived';
}

export function formatAdminReviewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatAdminReviewDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getAdminReviewDivisionLabel(division: MainSection | null | undefined): string {
  if (division === 'home_decor') return 'Home Decor';
  if (division === 'metal_services') return 'Metal Coating';
  return 'Unassigned division';
}

export function normalizeAdminReviewSearch(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, ADMIN_REVIEW_SEARCH_MAX_LENGTH);
}

export function getAdminReviewRequestBounds(page: number, pageSize: number) {
  const safePage = Number.isFinite(page) ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) ? Math.floor(pageSize) : ADMIN_REVIEW_PAGE_SIZE;
  return {
    page: Math.min(ADMIN_REVIEW_MAX_PAGE, Math.max(1, safePage)),
    pageSize: Math.min(ADMIN_REVIEW_MAX_PAGE_SIZE, Math.max(1, safePageSize)),
  };
}

export function getAdminReviewPageState(
  totalCount: number,
  page: number,
  pageSize: number
): AdminReviewPageState {
  const bounds = getAdminReviewRequestBounds(page, pageSize);
  const safeTotalCount = Number.isFinite(totalCount) ? Math.max(0, Math.floor(totalCount)) : 0;
  const pageCount = Math.max(1, Math.ceil(safeTotalCount / bounds.pageSize));
  return {
    page: Math.min(bounds.page, pageCount),
    pageCount,
    totalCount: safeTotalCount,
  };
}

export function summarizeAdminReviews(reviews: AdminReviewListItem[]): AdminReviewStats {
  const published = reviews.filter((review) => review.status === 'published');
  const publishedRatingTotal = published.reduce((total, review) => total + review.rating, 0);
  return {
    total: reviews.length,
    published: published.length,
    archived: reviews.length - published.length,
    averageRating:
      published.length === 0 ? null : Math.round((publishedRatingTotal / published.length) * 10) / 10,
  };
}

export function isCurrentAdminReviewRequest(currentRequestId: number, latestRequestId: number): boolean {
  return currentRequestId === latestRequestId;
}

export function isValidAdminReviewId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isAdminReviewFailure(error: unknown): error is AdminReviewFailure {
  return (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    'message' in error &&
    typeof (error as AdminReviewFailure).message === 'string'
  );
}

export function getAdminReviewFailureMessage(error: unknown): string {
  if (isAdminReviewFailure(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Review management is temporarily unavailable.';
}

export const adminReviewUnavailableMessage = getAdminReviewFailureMessage;

export function isAdminReviewSchemaMissing(error: unknown): boolean {
  if (isAdminReviewFailure(error)) return error.kind === 'schema-missing';
  const details = error as { code?: string; message?: string } | null;
  if (details?.code === 'PGRST205' || details?.code === '42P01' || details?.code === '42883') return true;
  const message = details?.message?.toLowerCase() ?? '';
  return (
    message.includes('could not find the function public.is_admin') ||
    message.includes('review database migrations') ||
    message.includes('does not exist')
  );
}
