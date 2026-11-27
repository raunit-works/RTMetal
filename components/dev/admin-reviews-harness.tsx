'use client';

import * as React from 'react';

import { AdminReviewsPanel, type AdminReviewsPanelActions } from '@/components/admin/reviews/admin-reviews-panel';
import {
  DEFAULT_ADMIN_REVIEW_QUERY,
  getAdminReviewPageState,
  normalizeAdminReviewSearch,
  summarizeAdminReviews,
  type AdminNotification,
  type AdminNotificationsResult,
  type AdminReviewDetail,
  type AdminReviewListItem,
  type AdminReviewQuery,
  type AdminReviewsDashboardData,
} from '@/lib/review/admin-view';
import type { ProductReviewStatus } from '@/lib/types';

const MOCK_PHOTO_URL =
  'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96"%3E%3Crect width="96" height="96" fill="%23D8CBB8"/%3E%3Ctext x="48" y="54" text-anchor="middle" fill="%238B6A3E" font-size="12"%3EMOCK%3C/text%3E%3C/svg%3E';

const MOCK_REVIEWS: AdminReviewListItem[] = Array.from({ length: 10 }, (_, index) => {
  const number = index + 1;
  const division = number % 2 === 0 ? 'home_decor' : 'metal_services';
  return {
    id: `dev-review-${number}`,
    productId: 'dev-product',
    userId: null,
    customerName: number % 3 === 0 ? null : `Customer ${number}`,
    rating: (number % 5) + 1,
    content: `Detailed review number ${number} about the brass finish and careful packing.`,
    status: number > 8 ? 'archived' : 'published',
    productNameSnapshot: number % 2 === 0 ? 'Brass Wall Piece' : 'Bronze Table Piece',
    productSlugSnapshot: 'dev-product',
    division,
    categoryName: division === 'home_decor' ? 'Wall Decor' : 'Protective Coatings',
    productName: number % 2 === 0 ? 'Brass Wall Piece' : 'Bronze Table Piece',
    createdAt: new Date(Date.UTC(2026, 10, 20 - index, 10, 0, 0)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 10, 20 - index, 10, 0, 0)).toISOString(),
    images:
      number % 4 === 0
        ? []
        : [
            {
              id: `dev-image-${number}`,
              reviewId: `dev-review-${number}`,
              storagePath: `dev-review-${number}/mock.jpg`,
              sortOrder: 0,
              createdAt: new Date(Date.UTC(2026, 10, 20 - index, 10, 0, 0)).toISOString(),
            },
          ],
  };
});

const MOCK_NOTIFICATIONS: AdminNotification[] = [
  {
    id: 'dev-notification-1',
    reviewId: 'dev-review-1',
    title: 'New product review',
    message: 'Customer 1 left a 2/5 review on Bronze Table Piece.',
    isRead: false,
    createdAt: '2026-11-20T10:00:00.000Z',
  },
  {
    id: 'dev-notification-2',
    reviewId: 'dev-review-2',
    title: 'New product review',
    message: 'Customer 2 left a 3/5 review on Brass Wall Piece.',
    isRead: false,
    createdAt: '2026-11-19T10:00:00.000Z',
  },
  {
    id: 'dev-notification-3',
    reviewId: null,
    title: 'New product review',
    message: 'A customer left a 4/5 review on Bronze Table Piece.',
    isRead: true,
    createdAt: '2026-11-18T10:00:00.000Z',
  },
];

export function AdminReviewsHarness() {
  const [hydrated, setHydrated] = React.useState(false);
  const [mode, setMode] = React.useState<'populated' | 'unavailable'>('populated');
  const [reviews, setReviews] = React.useState<AdminReviewListItem[]>(MOCK_REVIEWS);
  const [notifications, setNotifications] = React.useState<AdminNotification[]>(MOCK_NOTIFICATIONS);
  const [query, setQuery] = React.useState<AdminReviewQuery>({
    ...DEFAULT_ADMIN_REVIEW_QUERY,
    pageSize: 8,
  });
  const [detail, setDetail] = React.useState<AdminReviewDetail | null>(null);
  const [detailId, setDetailId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const data = React.useMemo<AdminReviewsDashboardData>(() => {
    const search = normalizeAdminReviewSearch(query.search).toLowerCase();
    const filtered = reviews
      .filter((review) => query.status === 'all' || review.status === query.status)
      .filter((review) => query.rating === 'all' || review.rating === Number(query.rating))
      .filter((review) => query.division === 'all' || review.division === query.division)
      .filter((review) =>
        !search ||
        `${review.customerName ?? ''} ${review.content} ${review.productNameSnapshot ?? ''} ${review.categoryName ?? ''}`
          .toLowerCase()
          .includes(search)
      )
      .sort((first, second) =>
        query.sort === 'oldest'
          ? first.createdAt.localeCompare(second.createdAt)
          : second.createdAt.localeCompare(first.createdAt)
      );

    const pageState = getAdminReviewPageState(filtered.length, query.page, query.pageSize ?? 8);
    const size = query.pageSize ?? 8;
    return {
      stats: summarizeAdminReviews(reviews),
      list: {
        page: pageState,
        reviews: filtered.slice((pageState.page - 1) * size, pageState.page * size),
      },
    };
  }, [query, reviews]);

  const notificationData = React.useMemo<AdminNotificationsResult>(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.isRead).length,
    }),
    [notifications]
  );

  const actions: AdminReviewsPanelActions = React.useMemo(
    () => ({
      onQueryChange: setQuery,
      async onSetStatus(id: string, status: ProductReviewStatus) {
        setReviews((current) =>
          current.map((review) => (review.id === id ? { ...review, status } : review))
        );
      },
      async onDeleteReview(id: string) {
        setReviews((current) => current.filter((review) => review.id !== id));
      },
      onOpenReview(id: string) {
        const review = reviews.find((item) => item.id === id);
        if (!review) return;
        setDetailId(id);
        setDetail({
          id: review.id,
          productId: review.productId,
          productName: review.productName ?? review.productNameSnapshot ?? 'Product unavailable',
          productSlug: review.productSlugSnapshot ?? null,
          division: review.division ?? null,
          categoryName: review.categoryName ?? null,
          customerName: review.customerName ?? null,
          rating: review.rating,
          content: review.content,
          status: review.status,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          photos: review.images?.length
            ? [{ id: 'dev-photo-1', url: MOCK_PHOTO_URL, sortOrder: 0 }]
            : [],
        });
      },
      onCloseReview() {
        setDetailId(null);
        setDetail(null);
      },
      async onMarkNotificationRead(id: string) {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === id ? { ...notification, isRead: true } : notification
          )
        );
      },
      async onMarkAllNotificationsRead() {
        setNotifications((current) =>
          current.map((notification) => ({ ...notification, isRead: true }))
        );
      },
      async onDeleteNotification(id: string) {
        setNotifications((current) => current.filter((notification) => notification.id !== id));
      },
    }),
    [reviews]
  );

  return (
    <main
      data-hydrated={hydrated ? 'true' : 'false'}
      className="min-h-screen bg-[#FCFAF6] px-4 py-8 text-[#302D27] sm:px-6 lg:px-10"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <section
          data-testid="admin-reviews-harness-controls"
          aria-label="Demonstration controls"
          className="rounded-2xl border border-[#D8CBB8] bg-white p-5"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-[#8B6A3E]">Phase 4 isolated UI harness</p>
          <p className="mt-2 text-sm text-[#6B6459]">
            Demonstration data only. All actions stay in local browser state and never touch Supabase.
            Photo URLs are mock data URIs, not signed storage URLs.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="harness-mode-populated"
              aria-pressed={mode === 'populated'}
              onClick={() => setMode('populated')}
              className="rounded-full border border-[#B18A53] px-4 py-2 text-xs font-semibold"
            >
              Populated
            </button>
            <button
              type="button"
              data-testid="harness-mode-unavailable"
              aria-pressed={mode === 'unavailable'}
              onClick={() => setMode('unavailable')}
              className="rounded-full border border-[#B18A53] px-4 py-2 text-xs font-semibold"
            >
              Schema unavailable
            </button>
          </div>
        </section>

        <AdminReviewsPanel
          data={data}
          notifications={notificationData}
          query={query}
          detail={detail}
          detailLoading={false}
          detailReviewId={detailId}
          available={mode === 'populated'}
          notificationsAvailable={mode === 'populated'}
          actions={actions}
        />
      </div>
    </main>
  );
}
