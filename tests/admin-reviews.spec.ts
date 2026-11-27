import { expect, test, type Page } from '@playwright/test';

import {
  handleAdminReviewDeleteRequest,
  handleAdminReviewDetailRequest,
  type AdminReviewServerDependencies,
} from '@/lib/review/admin-server';
import { getAdminReviewList, getAdminReviewsDashboard } from '@/lib/review/admin';
import {
  DEFAULT_ADMIN_REVIEW_QUERY,
  getAdminReviewPageState,
  isAdminReviewSchemaMissing,
  normalizeAdminReviewSearch,
  summarizeAdminReviews,
  type AdminReviewListItem,
  type AdminReviewQueryAdapter,
} from '@/lib/review/admin-view';
import type { ProductReviewStatus } from '@/lib/types';

const REVIEW_ID = '11111111-1111-4111-8111-111111111111';

async function openHarness(page: Page) {
  await page.goto('/dev/admin-reviews-harness');
  await expect(page.locator('main[data-hydrated="true"]')).toBeVisible();
}

function makeReview(index: number): AdminReviewListItem {
  return {
    id: `review-${index}`,
    productId: `product-${index}`,
    customerName: `Customer ${index}`,
    rating: (index % 5) + 1,
    content: `Review ${index}`,
    status: index % 4 === 0 ? 'archived' : 'published',
    productNameSnapshot: `Product ${index}`,
    division: index % 2 === 0 ? 'home_decor' : 'metal_services',
    categoryName: index % 2 === 0 ? 'Wall Decor' : 'Protective Coatings',
    createdAt: new Date(Date.UTC(2026, 10, 20 - index, 10, 0, 0)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 10, 20 - index, 10, 0, 0)).toISOString(),
    images: [],
  };
}

test.describe('admin review helpers', () => {
  test('clamps requested page to the available page count', () => {
    expect(getAdminReviewPageState(10, 99, 8)).toEqual({ page: 2, pageCount: 2, totalCount: 10 });
    expect(getAdminReviewPageState(0, 3, 8)).toEqual({ page: 1, pageCount: 1, totalCount: 0 });
    expect(getAdminReviewPageState(17, Number.NaN, 8)).toEqual({
      page: 1,
      pageCount: 3,
      totalCount: 17,
    });
  });

  test('normalizes untrusted search input without altering literal SQL pattern characters', () => {
    expect(normalizeAdminReviewSearch('  Jane, Doe  ')).toBe('Jane, Doe');
    expect(normalizeAdminReviewSearch('100%_\\done')).toBe('100%_\\done');
    expect(normalizeAdminReviewSearch('   ')).toBe('');
  });

  test('summarizes published-only ratings without false averages', () => {
    expect(
      summarizeAdminReviews([
        { ...makeReview(1), status: 'published', rating: 5 },
        { ...makeReview(2), status: 'published', rating: 4 },
        { ...makeReview(3), status: 'archived', rating: 2 },
      ])
    ).toEqual({ total: 3, published: 2, archived: 1, averageRating: 4.5 });
    expect(summarizeAdminReviews([])).toEqual({
      total: 0,
      published: 0,
      archived: 0,
      averageRating: null,
    });
  });

  test('recognizes missing review schema errors', () => {
    expect(isAdminReviewSchemaMissing({ code: '42P01' })).toBeTruthy();
    expect(isAdminReviewSchemaMissing({ message: 'Could not find the function public.is_admin()' })).toBeTruthy();
    expect(isAdminReviewSchemaMissing({ message: 'Network error' })).toBeFalsy();
  });
});

test.describe('admin review data access contracts', () => {
  test('requests distinct pages and re-requests the last page for out-of-range input', async () => {
    const pages: number[] = [];
    const adapter: AdminReviewQueryAdapter = {
      async selectReviews(input) {
        pages.push(input.page);
        const rangeStart = (input.page - 1) * input.pageSize;
        const rows = Array.from(
          { length: Math.max(0, Math.min(8, 17 - rangeStart)) },
          (_, index) => makeReview(rangeStart + index + 1)
        );
        return { rows, count: 17 };
      },
      async selectStats() {
        return { total: 17, published: 13, archived: 4, averageRating: 4.4 };
      },
    };

    const firstPage = await getAdminReviewList(
      { ...DEFAULT_ADMIN_REVIEW_QUERY, page: 1, pageSize: 8 },
      adapter
    );
    const secondPage = await getAdminReviewList(
      { ...DEFAULT_ADMIN_REVIEW_QUERY, page: 2, pageSize: 8 },
      adapter
    );
    const outOfRangePage = await getAdminReviewList(
      { ...DEFAULT_ADMIN_REVIEW_QUERY, page: 99, pageSize: 8 },
      adapter
    );

    expect(pages).toEqual([1, 2, 99, 3]);
    expect(firstPage.reviews.map((review) => review.id)).not.toEqual(
      secondPage.reviews.map((review) => review.id)
    );
    expect(firstPage.page).toEqual({ page: 1, pageCount: 3, totalCount: 17 });
    expect(secondPage.page).toEqual({ page: 2, pageCount: 3, totalCount: 17 });
    expect(outOfRangePage.page).toEqual({ page: 3, pageCount: 3, totalCount: 17 });
    expect(outOfRangePage.reviews).toHaveLength(1);
  });

  test('uses exact database statistics instead of deriving ratings from the current page', async () => {
    const dashboard = await getAdminReviewsDashboard(
      { ...DEFAULT_ADMIN_REVIEW_QUERY, page: 1, pageSize: 8 },
      {
        async selectReviews() {
          return {
            rows: [
              { ...makeReview(1), rating: 5, status: 'published' },
              { ...makeReview(2), rating: 1, status: 'archived' },
            ],
            count: 2,
          };
        },
        async selectStats() {
          return { total: 2, published: 1, archived: 1, averageRating: 5 };
        },
      }
    );

    expect(dashboard.stats).toEqual({ total: 2, published: 1, archived: 1, averageRating: 5 });
    expect(dashboard.list.page).toEqual({ page: 1, pageCount: 1, totalCount: 2 });
  });
});

function createFakeServerDependencies(options: {
  isAdmin?: boolean;
  reviewExists?: boolean;
  removeError?: boolean;
  deleteError?: boolean;
}) {
  const calls = {
    removedPaths: [] as string[],
    deleted: false,
    signedPaths: [] as string[],
  };

  const client = {
    from(table: string) {
      const filters: Record<string, string> = {};
      let operation = 'select';
      const builder: any = {
        select() {
          return builder;
        },
        eq(key: string, value: string) {
          filters[key] = value;
          return builder;
        },
        order() {
          return builder;
        },
        maybeSingle() {
          if (table !== 'product_reviews') return Promise.resolve({ data: null, error: null });
          if (options.reviewExists === false) return Promise.resolve({ data: null, error: null });
          return Promise.resolve({
            data: {
              id: filters.id ?? REVIEW_ID,
              created_at: '2026-11-20T10:00:00.000Z',
              customer_name: 'Asha Mehta',
              product_name_snapshot: 'Brass Wall Piece',
              products: [
                {
                  name: 'Brass Wall Piece',
                  slug: 'brass-wall-piece',
                  categories: [{ name: 'Wall Decor', main_section: 'home_decor' }],
                },
              ],
            },
            error: null,
          });
        },
        delete() {
          operation = 'delete';
          return builder;
        },
        then(resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) {
          if (operation === 'delete') {
            if (!options.deleteError) calls.deleted = true;
            return Promise.resolve({
              error: options.deleteError ? { message: 'delete failed' } : null,
            }).then(resolve, reject);
          }
          if (table === 'product_review_images') {
            return Promise.resolve({
              data: [{ storage_path: `${REVIEW_ID}/photo.jpg`, sort_order: 0, id: 'photo-row' }],
              error: null,
            }).then(resolve, reject);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve, reject);
        },
      };
      return builder;
    },
    storage: {
      from(bucket: string) {
        expect(bucket).toBe('review-photos');
        return {
          async createSignedUrl(path: string) {
            calls.signedPaths.push(path);
            return { data: { signedUrl: `https://signed.test/${path.split('/').pop()}` }, error: null };
          },
          async list() {
            return { data: [{ name: 'photo.jpg' }], error: null };
          },
          async remove(paths: string[]) {
            if (options.removeError) return { error: { message: 'remove failed' } };
            calls.removedPaths.push(...paths);
            return { error: null };
          },
        };
      },
    },
  };

  const dependencies = {
    verifyAdmin: async () => ({
      isAdmin: options.isAdmin !== false,
      userId: options.isAdmin === false ? null : 'admin-user',
    }),
    getClient: () => client as never,
  } as AdminReviewServerDependencies;

  return { dependencies, calls };
}

function deleteRequest(includeOrigin = true) {
  return new Request('https://admin.test/api/admin/reviews/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(includeOrigin ? { Origin: 'https://admin.test' } : {}),
    },
    body: JSON.stringify({ reviewId: REVIEW_ID }),
  });
}

test.describe('admin review management server contracts', () => {
  test('rejects non-admin and cross-origin deletion before storage or database access', async () => {
    const nonAdmin = createFakeServerDependencies({ isAdmin: false });
    const nonAdminResponse = await handleAdminReviewDeleteRequest(deleteRequest(), nonAdmin.dependencies);
    expect(nonAdminResponse.status).toBe(403);
    expect(nonAdmin.calls.removedPaths).toEqual([]);
    expect(nonAdmin.calls.deleted).toBe(false);

    const crossOrigin = createFakeServerDependencies({});
    const crossOriginResponse = await handleAdminReviewDeleteRequest(
      deleteRequest(false),
      crossOrigin.dependencies
    );
    expect(crossOriginResponse.status).toBe(403);
    expect(crossOrigin.calls.removedPaths).toEqual([]);
    expect(crossOrigin.calls.deleted).toBe(false);
  });

  test('deletes stored photos before the review row', async () => {
    const { dependencies, calls } = createFakeServerDependencies({});
    const response = await handleAdminReviewDeleteRequest(deleteRequest(), dependencies);

    expect(response.status).toBe(200);
    expect(calls.removedPaths).toEqual([`${REVIEW_ID}/photo.jpg`]);
    expect(calls.deleted).toBe(true);
  });

  test('does not delete the review when photo removal fails', async () => {
    const { dependencies, calls } = createFakeServerDependencies({ removeError: true });
    const response = await handleAdminReviewDeleteRequest(deleteRequest(), dependencies);

    expect(response.status).toBe(502);
    expect(calls.deleted).toBe(false);
  });

  test('returns short-lived signed photo URLs without exposing storage paths', async () => {
    const { dependencies, calls } = createFakeServerDependencies({});
    const response = await handleAdminReviewDetailRequest(
      new Request(`https://admin.test/api/admin/reviews/detail?reviewId=${REVIEW_ID}`),
      dependencies
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const payload = (await response.json()) as { review: { photos: Array<{ url: string }> } };
    expect(payload.review.photos[0]?.url).toBe('https://signed.test/photo.jpg');
    expect(calls.signedPaths).toEqual([`${REVIEW_ID}/photo.jpg`]);
    expect(JSON.stringify(payload)).not.toContain('storage_path');
  });
});

test.describe('admin review management UI harness', () => {
  test('renders stats, filters, divisions and paginated review rows', async ({ page }) => {
    await openHarness(page);

    await expect(page.getByTestId('admin-reviews-panel')).toBeVisible();
    await expect(page.getByTestId('admin-review-stat-total')).toContainText('10');
    await expect(page.getByTestId('admin-review-stat-published')).toContainText('8');
    await expect(page.getByTestId('admin-review-stat-archived')).toContainText('2');
    await expect(page.getByTestId('review-unread-count')).toHaveText('2');
    await expect(page.getByTestId('admin-review-row')).toHaveCount(8);

    await page.getByTestId('admin-reviews-panel').getByRole('searchbox').fill('Brass Wall Piece');
    await expect(page.getByTestId('admin-review-row')).toHaveCount(5);

    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await page.getByLabel('Filter reviews by status').selectOption('archived');
    await expect(page.getByTestId('admin-review-row')).toHaveCount(2);
    await expect(page.getByTestId('admin-review-status').first()).toHaveText('Archived');

    await page.getByLabel('Filter reviews by division').selectOption('metal_services');
    await expect(page.getByTestId('admin-review-row')).toHaveCount(1);
  });

  test('opens review details with product, division, date and mock signed photo', async ({ page }) => {
    await openHarness(page);

    await page.getByTestId('admin-review-view').first().click();
    await expect(page.getByTestId('admin-review-detail-dialog')).toBeVisible();
    await expect(page.getByTestId('admin-review-detail-product')).not.toBeEmpty();
    await expect(page.getByTestId('admin-review-detail-division')).not.toHaveText('Unassigned division');
    await expect(page.getByTestId('admin-review-detail-date')).toContainText('2026');
    await expect(page.getByTestId('admin-review-detail-photo')).toHaveCount(1);
    await page.getByTestId('admin-review-detail-close').click();
    await expect(page.getByTestId('admin-review-detail-dialog')).toHaveCount(0);
  });

  test('archives and deletes reviews through local mock actions', async ({ page }) => {
    await openHarness(page);

    const firstRow = page.getByTestId('admin-review-row').first();
    await expect(firstRow).toHaveAttribute('data-status', 'published');
    await firstRow.getByTestId('admin-review-archive').click();
    await expect(firstRow).toHaveAttribute('data-status', 'archived');
    await expect(page.getByTestId('admin-review-stat-published')).toContainText('7');
    await expect(page.getByTestId('admin-review-stat-archived')).toContainText('3');

    await firstRow.getByTestId('admin-review-delete').click();
    await expect(firstRow).toContainText('cannot be undone');
    await firstRow.getByTestId('admin-review-delete-confirm').click();
    await expect(page.getByTestId('admin-review-stat-total')).toContainText('9');
    await expect(page.getByTestId('admin-review-row')).toHaveCount(8);
  });

  test('marks notifications read and opens a linked review', async ({ page }) => {
    await openHarness(page);

    await page.getByTestId('mark-all-notifications-read').click();
    await expect(page.getByTestId('review-unread-count')).toHaveText('0');
    await expect(page.getByTestId('admin-notification-row')).toHaveCount(3);
    await expect(page.locator('[data-testid="admin-notification-row"][data-read="true"]')).toHaveCount(3);

    await page.getByTestId('review-notification-view').first().click();
    await expect(page.getByTestId('admin-review-detail-dialog')).toBeVisible();

    await page.getByTestId('admin-review-detail-close').click();
    await page.getByTestId('delete-notification').first().click();
    await expect(page.getByTestId('admin-notification-row')).toHaveCount(2);
  });

  test('shows an unavailable state without false zero review statistics', async ({ page }) => {
    await openHarness(page);
    await page.getByTestId('harness-mode-unavailable').click();

    await expect(page.getByTestId('reviews-unavailable')).toBeVisible();
    await expect(page.getByTestId('admin-review-stat-total')).toHaveCount(0);
    await expect(page.getByTestId('admin-review-row')).toHaveCount(0);
    await expect(page.getByTestId('review-unread-count')).toHaveText('—');
  });

  test('fits the review dashboard within the viewport without horizontal overflow', async ({ page }) => {
    await openHarness(page);

    await expect(page.getByTestId('admin-reviews-panel')).toBeVisible();
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    await page.screenshot({
      path: `reports/phase4-admin-reviews/screenshots/admin-reviews-${test.info().project.name}.png`,
      fullPage: true,
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});
