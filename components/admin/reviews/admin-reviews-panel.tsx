'use client';

import * as React from 'react';
import { AlertCircle, BellRing, Check, Loader2, Star, Trash2 } from 'lucide-react';
import Image from 'next/image';

import { AdminFormPanel } from '@/components/admin/shared/admin-form-panel';
import {
  AdminFilterSelect,
  AdminListToolbar,
  AdminPagination,
} from '@/components/admin/shared/admin-list-controls';
import {
  formatAdminReviewDate,
  formatAdminReviewDateTime,
  getAdminReviewDivisionLabel,
  getAdminReviewStatusLabel,
  type AdminNotification,
  type AdminNotificationsResult,
  type AdminReviewDetail,
  type AdminReviewQuery,
  type AdminReviewsDashboardData,
} from '@/lib/review/admin-view';
import type { ProductReviewStatus } from '@/lib/types';

export interface AdminReviewsPanelActions {
  onQueryChange: (query: AdminReviewQuery) => void;
  onSetStatus: (id: string, status: ProductReviewStatus) => Promise<void>;
  onDeleteReview: (id: string) => Promise<void>;
  onOpenReview: (id: string) => void;
  onCloseReview: () => void;
  onMarkNotificationRead: (id: string) => Promise<void>;
  onMarkAllNotificationsRead: () => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
}

function AdminNotificationCard({
  notification,
  busy,
  onMarkRead,
  onDelete,
  onOpenReview,
}: {
  notification: AdminNotification;
  busy: boolean;
  onMarkRead: () => void;
  onDelete: () => void;
  onOpenReview: () => void;
}) {
  return (
    <article
      data-testid="admin-notification-row"
      data-read={notification.isRead ? 'true' : 'false'}
      className={`rounded-xl border p-3 ${
        notification.isRead
          ? 'border-border/60 bg-card/30 text-muted-foreground'
          : 'border-gold-deep/40 bg-gold-deep/5 text-foreground'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold">{notification.title}</p>
          <p className="mt-1 break-words text-xs">{notification.message}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            {formatAdminReviewDateTime(notification.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {notification.reviewId && (
            <button
              type="button"
              data-testid="review-notification-view"
              disabled={busy}
              onClick={onOpenReview}
              className="rounded-lg border border-gold-deep/40 px-2 py-1 text-[10px] font-medium text-gold-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              View review
            </button>
          )}
          <button
            type="button"
            data-testid="mark-notification-read"
            disabled={notification.isRead || busy}
            onClick={onMarkRead}
            className="rounded-lg border border-border px-2 py-1 text-[10px] font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            {notification.isRead ? 'Read' : 'Mark read'}
          </button>
          <button
            type="button"
            data-testid="delete-notification"
            aria-label={`Delete notification ${notification.title}`}
            disabled={busy}
            onClick={onDelete}
            className="rounded-lg border border-destructive/30 px-2 py-1 text-destructive disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function AdminReviewDetailDialog({
  detail,
  loading,
  onClose,
}: {
  detail: AdminReviewDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div
      data-testid="admin-review-detail-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Review details"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl">
        <AdminFormPanel
          title="Review details"
          icon={<Star className="h-4 w-4 text-gold-deep" aria-hidden="true" />}
          footer={
            <button
              type="button"
              data-testid="admin-review-detail-close"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-xl border border-border px-4 text-xs font-medium hover:bg-muted"
            >
              Close
            </button>
          }
        >
          {loading ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading review details…
            </p>
          ) : !detail ? (
            <p className="text-xs text-muted-foreground">This review is no longer available.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Customer</p>
                  <p data-testid="admin-review-detail-customer" className="mt-1 text-sm font-semibold">
                    {detail.customerName?.trim() || 'Anonymous'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Rating</p>
                  <p data-testid="admin-review-detail-rating" className="mt-1 flex items-center gap-1 text-sm font-semibold">
                    <Star className="h-3.5 w-3.5 text-gold-deep" aria-hidden="true" />
                    {detail.rating}/5
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Product</p>
                  <p data-testid="admin-review-detail-product" className="mt-1 text-sm">
                    {detail.productName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Division / category</p>
                  <p data-testid="admin-review-detail-division" className="mt-1 text-sm">
                    {getAdminReviewDivisionLabel(detail.division)}
                    {detail.categoryName ? ` · ${detail.categoryName}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</p>
                  <p data-testid="admin-review-detail-status" className="mt-1 text-sm">
                    {getAdminReviewStatusLabel(detail.status)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Submitted</p>
                  <p data-testid="admin-review-detail-date" className="mt-1 text-sm">
                    {formatAdminReviewDateTime(detail.createdAt)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Review</p>
                <p data-testid="admin-review-detail-content" className="mt-1 break-words text-sm leading-relaxed">
                  {detail.content}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Photos</p>
                {detail.photos.length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">No photos were submitted.</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detail.photos.map((photo) => (
                      <Image
                        key={photo.id}
                        data-testid="admin-review-detail-photo"
                        src={photo.url}
                        alt="Customer review photo"
                        width={96}
                        height={96}
                        unoptimized
                        className="h-24 w-24 rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>

              {detail.productSlug && (
                <a
                  href={`/${detail.division === 'metal_services' ? 'services' : 'home-decor'}/${detail.productSlug}`}
                  className="inline-flex text-xs font-medium text-gold-deep hover:underline"
                >
                  Open product page
                </a>
              )}
            </div>
          )}
        </AdminFormPanel>
      </div>
    </div>
  );
}

export function AdminReviewsPanel({
  data,
  notifications,
  query,
  detail,
  detailLoading = false,
  detailReviewId = null,
  available,
  notificationsAvailable,
  loading = false,
  actions,
}: {
  data: AdminReviewsDashboardData | null;
  notifications: AdminNotificationsResult;
  query: AdminReviewQuery;
  detail: AdminReviewDetail | null;
  detailLoading?: boolean;
  detailReviewId?: string | null;
  available: boolean;
  notificationsAvailable: boolean;
  loading?: boolean;
  actions: AdminReviewsPanelActions;
}) {
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const reviews = data?.list.reviews ?? [];
  const stats = data?.stats ?? { total: 0, published: 0, archived: 0, averageRating: null };
  const page = data?.list.page ?? { page: 1, pageCount: 1, totalCount: 0 };

  const runAction = async (key: string, action: () => Promise<void>) => {
    setBusyKey(key);
    setActionError(null);
    try {
      await action();
      setConfirmDeleteId(null);
    } catch (error) {
      setActionError(error instanceof Error && error.message ? error.message : 'Action failed.');
    } finally {
      setBusyKey(null);
    }
  };

  const changeFilter = (patch: Partial<AdminReviewQuery>) => {
    actions.onQueryChange({ ...query, ...patch, page: 1 });
  };

  return (
    <div data-testid="admin-reviews-panel" className="space-y-6">
      {actionError && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive"
        >
          {actionError}
        </div>
      )}

      <section className="rounded-2xl border border-border/70 bg-background/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Review notifications</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              New reviews create a persisted notification once the review database migrations are applied.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-deep/40 bg-gold-deep/10 px-3 py-1 text-[11px] font-semibold text-gold-deep">
              <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
              <span data-testid="review-unread-count">
                {notificationsAvailable ? notifications.unreadCount : '—'}
              </span>
              <span>unread</span>
            </span>
            <button
              type="button"
              data-testid="mark-all-notifications-read"
              disabled={
                !notificationsAvailable ||
                notifications.unreadCount === 0 ||
                busyKey === 'notifications-all'
              }
              onClick={() => void runAction('notifications-all', actions.onMarkAllNotificationsRead)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-[11px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busyKey === 'notifications-all' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Mark all read
            </button>
          </div>
        </div>

        {!notificationsAvailable ? (
          <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700">
            Notifications are unavailable until the review database migrations are applied.
          </p>
        ) : notifications.notifications.length === 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">No review notifications yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {notifications.notifications.map((notification) => (
              <AdminNotificationCard
                key={notification.id}
                notification={notification}
                busy={busyKey === `notification-${notification.id}`}
                onMarkRead={() =>
                  void runAction(`notification-${notification.id}`, () =>
                    actions.onMarkNotificationRead(notification.id)
                  )
                }
                onDelete={() =>
                  void runAction(`notification-delete-${notification.id}`, () =>
                    actions.onDeleteNotification(notification.id)
                  )
                }
                onOpenReview={() => {
                  if (notification.reviewId) actions.onOpenReview(notification.reviewId);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {!available ? (
        <div
          data-testid="reviews-unavailable"
          className="flex flex-wrap items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-800"
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Reviews are not available yet.</p>
            <p className="mt-1 text-xs">
              The admin workspace remains fully usable. Apply the review database migrations to enable review management.
            </p>
          </div>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div data-testid="admin-review-stat-total" className="rounded-xl border border-border/70 bg-card/40 p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total reviews</p>
              <p className="mt-1 text-xl font-semibold">{stats.total}</p>
            </div>
            <div data-testid="admin-review-stat-published" className="rounded-xl border border-border/70 bg-card/40 p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Published</p>
              <p className="mt-1 text-xl font-semibold">{stats.published}</p>
            </div>
            <div data-testid="admin-review-stat-archived" className="rounded-xl border border-border/70 bg-card/40 p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Archived</p>
              <p className="mt-1 text-xl font-semibold">{stats.archived}</p>
            </div>
            <div data-testid="admin-review-stat-average" className="rounded-xl border border-border/70 bg-card/40 p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Average rating</p>
              <p className="mt-1 flex items-center gap-1 text-xl font-semibold">
                <Star className="h-4 w-4 text-gold-deep" aria-hidden="true" />
                {stats.averageRating === null ? '—' : stats.averageRating.toFixed(1)}
              </p>
            </div>
          </section>

          <section>
            <AdminListToolbar
              search={query.search}
              onSearchChange={(search) => changeFilter({ search })}
              searchPlaceholder="Search reviews, customers, products or categories…"
              resultCount={reviews.length}
              totalCount={page.totalCount}
              onClear={() =>
                changeFilter({
                  search: '',
                  status: 'all',
                  rating: 'all',
                  division: 'all',
                  sort: 'newest',
                })
              }
              clearDisabled={
                !query.search &&
                query.status === 'all' &&
                query.rating === 'all' &&
                query.division === 'all' &&
                query.sort === 'newest'
              }
            >
              <AdminFilterSelect
                label="Status"
                ariaLabel="Filter reviews by status"
                value={query.status}
                onChange={(status) => changeFilter({ status: status as AdminReviewQuery['status'] })}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'published', label: 'Published' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
              <AdminFilterSelect
                label="Rating"
                ariaLabel="Filter reviews by rating"
                value={query.rating}
                onChange={(rating) => changeFilter({ rating: rating as AdminReviewQuery['rating'] })}
                options={[
                  { value: 'all', label: 'All ratings' },
                  { value: '5', label: '5 stars' },
                  { value: '4', label: '4 stars' },
                  { value: '3', label: '3 stars' },
                  { value: '2', label: '2 stars' },
                  { value: '1', label: '1 star' },
                ]}
              />
              <AdminFilterSelect
                label="Division"
                ariaLabel="Filter reviews by division"
                value={query.division}
                onChange={(division) => changeFilter({ division: division as AdminReviewQuery['division'] })}
                options={[
                  { value: 'all', label: 'All divisions' },
                  { value: 'home_decor', label: 'Home Decor' },
                  { value: 'metal_services', label: 'Metal Coating' },
                ]}
              />
              <AdminFilterSelect
                label="Sort"
                ariaLabel="Sort reviews"
                value={query.sort}
                onChange={(sort) => changeFilter({ sort: sort as AdminReviewQuery['sort'] })}
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                ]}
              />
            </AdminListToolbar>

            {loading ? (
              <p className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/40 p-5 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading reviews…
              </p>
            ) : reviews.length === 0 ? (
              <p className="rounded-xl border border-border/70 bg-card/40 p-5 text-xs text-muted-foreground">
                No reviews match the current filters.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {reviews.map((review) => {
                  const busy = busyKey?.startsWith(`review-${review.id}`);
                  return (
                    <article
                      key={review.id}
                      data-testid="admin-review-row"
                      data-status={review.status}
                      className="rounded-xl border border-border/70 bg-card/40 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p
                            data-testid="admin-review-customer"
                            className="break-words text-sm font-semibold"
                          >
                            {review.customerName?.trim() || 'Anonymous'}
                          </p>
                          <p className="mt-0.5 break-words text-[11px] text-muted-foreground">
                            {review.productName?.trim() ||
                              review.productNameSnapshot?.trim() ||
                              'Product unavailable'}
                          </p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                            {getAdminReviewDivisionLabel(review.division ?? null)}
                            {review.categoryName ? ` · ${review.categoryName}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            data-testid="admin-review-rating"
                            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-semibold"
                          >
                            <Star className="h-3 w-3 text-gold-deep" aria-hidden="true" />
                            {review.rating}/5
                          </span>
                          <span
                            data-testid="admin-review-status"
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                              review.status === 'published'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {getAdminReviewStatusLabel(review.status)}
                          </span>
                        </div>
                      </div>

                      <p data-testid="admin-review-content" className="mt-3 break-words text-xs leading-relaxed">
                        {review.content}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                        <span>{formatAdminReviewDateTime(review.createdAt)}</span>
                        <span data-testid="admin-review-photo-count">
                          {review.images?.length ?? 0} photo{(review.images?.length ?? 0) === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
                        <button
                          type="button"
                          data-testid="admin-review-view"
                          disabled={busy}
                          onClick={() => actions.onOpenReview(review.id)}
                          className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-[11px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          View details
                        </button>
                        <button
                          type="button"
                          data-testid={review.status === 'published' ? 'admin-review-archive' : 'admin-review-restore'}
                          disabled={busy}
                          onClick={() =>
                            void runAction(`review-status-${review.id}`, () =>
                              actions.onSetStatus(
                                review.id,
                                review.status === 'published' ? 'archived' : 'published'
                              )
                            )
                          }
                          className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-[11px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {review.status === 'published' ? 'Archive' : 'Restore'}
                        </button>
                        {confirmDeleteId === review.id ? (
                          <>
                            <p className="w-full text-[10px] font-medium text-destructive">
                              This permanently deletes the review and its stored photos. This cannot be undone.
                            </p>
                            <button
                              type="button"
                              data-testid="admin-review-delete-confirm"
                              disabled={busy}
                              onClick={() =>
                                void runAction(`review-delete-${review.id}`, () =>
                                  actions.onDeleteReview(review.id)
                                )
                              }
                              className="inline-flex h-8 items-center rounded-lg bg-destructive px-3 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Delete permanently
                            </button>
                            <button
                              type="button"
                              data-testid="admin-review-delete-cancel"
                              onClick={() => setConfirmDeleteId(null)}
                              className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-[11px] font-medium hover:bg-muted"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            data-testid="admin-review-delete"
                            onClick={() => setConfirmDeleteId(review.id)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/30 px-3 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                            Delete
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <AdminPagination
              page={page.page}
              pageCount={page.pageCount}
              total={page.totalCount}
              pageSize={query.pageSize ?? 8}
              onPageChange={(nextPage) => changeFilter({ page: nextPage })}
            />
          </section>
        </>
      )}

      {detailReviewId && (
        <AdminReviewDetailDialog
          detail={detail}
          loading={detailLoading}
          onClose={actions.onCloseReview}
        />
      )}
    </div>
  );
}
