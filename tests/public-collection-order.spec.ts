import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  comparePinnedFirst,
  sortCollectionProducts,
} from '@/lib/catalog/collection-order';
import {
  getGenuineProductRating,
  getProductRatingDisplay,
} from '@/lib/catalog/product-rating';
import { products as staticFallbackProducts } from '@/lib/data';
import {
  mapProductRow,
  mapTestimonialRow,
  type DatabaseProductRow,
} from '@/lib/supabase/data-mapper';
import type { Product } from '@/lib/types';

function product(
  id: string,
  overrides: Partial<Product> = {}
): Product {
  return {
    id,
    slug: id,
    name: `Product ${id}`,
    category: 'sculptures-figurines',
    price: null,
    image: '/placeholder.jpg',
    rating: 0,
    description: '',
    isPinned: false,
    pinnedAt: null,
    ...overrides,
  };
}

const ids = (products: Product[]) => products.map((item) => item.id);

function productRow(overrides: Partial<DatabaseProductRow> = {}): DatabaseProductRow {
  return {
    id: 'product-id',
    slug: 'product-slug',
    name: 'Product',
    category_id: 'category-id',
    price: null,
    original_price: null,
    image: '/placeholder.jpg',
    rating: null,
    badge: null,
    description: '',
    is_published: true,
    is_pinned: false,
    pinned_at: null,
    ...overrides,
  };
}

test.describe('public collection pinned-first ordering', () => {
  test('pinned products sort before unpinned products', () => {
    const unpinned = product('unpinned', { name: 'AAA first alphabetically' });
    const pinned = product('pinned', {
      name: 'ZZZ last alphabetically',
      isPinned: true,
      pinnedAt: '2026-11-17T09:00:00.000Z',
    });

    expect(sortCollectionProducts([unpinned, pinned], 'name').map((item) => item.id)).toEqual([
      'pinned',
      'unpinned',
    ]);
    expect(sortCollectionProducts([unpinned, pinned], 'rating').map((item) => item.id)).toEqual([
      'pinned',
      'unpinned',
    ]);
  });

  test('most recently pinned product comes first', () => {
    const older = product('older', {
      isPinned: true,
      pinnedAt: '2026-11-16T09:00:00.000Z',
    });
    const newer = product('newer', {
      isPinned: true,
      pinnedAt: '2026-11-17T09:00:00.000Z',
    });
    const unpinned = product('unpinned');

    expect(sortCollectionProducts([older, unpinned, newer]).map((item) => item.id)).toEqual([
      'newer',
      'older',
      'unpinned',
    ]);
  });

  test('pinned products without a timestamp still precede unpinned products', () => {
    const pinnedNoTime = product('pinned-no-time', { isPinned: true, pinnedAt: null });
    const pinnedWithTime = product('pinned-with-time', {
      isPinned: true,
      pinnedAt: '2026-11-17T09:00:00.000Z',
    });
    const unpinned = product('unpinned');

    expect(
      sortCollectionProducts([unpinned, pinnedNoTime, pinnedWithTime]).map((item) => item.id)
    ).toEqual(['pinned-with-time', 'pinned-no-time', 'unpinned']);
  });

  test('unpinned products keep the chosen sort after the pinned group', () => {
    const pinned = product('pinned', {
      isPinned: true,
      pinnedAt: '2026-11-17T09:00:00.000Z',
      name: 'Zulu',
    });
    const lowRated = product('low', { name: 'Alpha', rating: 2, reviewCount: 1 });
    const highRated = product('high', { name: 'Bravo', rating: 4.8, reviewCount: 2 });

    expect(
      sortCollectionProducts([pinned, lowRated, highRated], 'rating').map((item) => item.id)
    ).toEqual(['pinned', 'high', 'low']);
    expect(
      sortCollectionProducts([pinned, lowRated, highRated], 'name').map((item) => item.id)
    ).toEqual(['pinned', 'low', 'high']);
  });

  test('featured order preserves the server position as a deterministic tie-breaker', () => {
    const first = product('first', { rating: 2 });
    const second = product('second', { rating: 4.8 });

    expect(sortCollectionProducts([first, second], 'featured').map((item) => item.id)).toEqual([
      'first',
      'second',
    ]);
    expect(sortCollectionProducts([second, first], 'featured').map((item) => item.id)).toEqual([
      'second',
      'first',
    ]);
  });

  test('comparator is zero for two unpinned products', () => {
    expect(comparePinnedFirst(product('a'), product('b'))).toBe(0);
  });

  test('does not mutate the input array', () => {
    const input = [product('a'), product('b', { isPinned: true, pinnedAt: '2026-11-17T09:00:00.000Z' })];
    const before = ids(input);
    sortCollectionProducts(input, 'name');
    expect(ids(input)).toEqual(before);
  });

  test('products without a genuine rating sort after rated products', () => {
    const unrated = product('unrated', { rating: null });
    const lowRated = product('low', { rating: 2, reviewCount: 1 });

    expect(sortCollectionProducts([unrated, lowRated], 'rating').map((item) => item.id)).toEqual([
      'low',
      'unrated',
    ]);
    expect(sortCollectionProducts([lowRated, unrated], 'rating').map((item) => item.id)).toEqual([
      'low',
      'unrated',
    ]);
  });

  test('legacy five-star products do not outrank genuinely reviewed products', () => {
    const legacy = product('legacy', { rating: 5 });
    const genuine = product('genuine', { rating: 4.2, reviewCount: 1 });

    expect(sortCollectionProducts([legacy, genuine], 'rating').map((item) => item.id)).toEqual([
      'genuine',
      'legacy',
    ]);
    expect(sortCollectionProducts([genuine, legacy], 'rating').map((item) => item.id)).toEqual([
      'genuine',
      'legacy',
    ]);
  });

  test('legacy five-star products keep the server order when ratings are unavailable', () => {
    const first = product('first', { rating: 5 });
    const second = product('second', { rating: 4.1 });

    expect(sortCollectionProducts([first, second], 'rating').map((item) => item.id)).toEqual([
      'first',
      'second',
    ]);
    expect(sortCollectionProducts([second, first], 'rating').map((item) => item.id)).toEqual([
      'second',
      'first',
    ]);
  });

  test('pinned legacy five-star products still precede genuinely reviewed products', () => {
    const pinnedLegacy = product('pinned-legacy', {
      rating: 5,
      isPinned: true,
      pinnedAt: '2026-11-17T09:00:00.000Z',
    });
    const genuine = product('genuine', { rating: 4.2, reviewCount: 1 });

    expect(
      sortCollectionProducts([genuine, pinnedLegacy], 'rating').map((item) => item.id)
    ).toEqual(['pinned-legacy', 'genuine']);
  });
});

test.describe('product rating compatibility', () => {
  test('rating 5.0 with undefined reviewCount is hidden', () => {
    expect(getProductRatingDisplay(product('legacy-undefined', { rating: 5 }))).toEqual({
      kind: 'hidden',
    });
  });

  test('rating 5.0 with NULL reviewCount is hidden', () => {
    expect(
      getProductRatingDisplay(product('legacy-null', { rating: 5, reviewCount: null }))
    ).toEqual({ kind: 'hidden' });
  });

  test('rating 5.0 with reviewCount 0 shows the confirmed empty state', () => {
    expect(
      getProductRatingDisplay(product('empty', { rating: 5, reviewCount: 0 }))
    ).toEqual({ kind: 'empty' });
  });

  test('NULL rating with reviewCount 0 shows the confirmed empty state', () => {
    expect(
      getProductRatingDisplay(product('empty-null-rating', { rating: null, reviewCount: 0 }))
    ).toEqual({ kind: 'empty' });
  });

  test('rating 4.7 with reviewCount 3 is genuine', () => {
    expect(
      getProductRatingDisplay(product('genuine', { rating: 4.7, reviewCount: 3 }))
    ).toEqual({ kind: 'rating', rating: 4.7 });
  });

  test('rating 5.0 with reviewCount 1 is genuine', () => {
    expect(
      getProductRatingDisplay(product('genuine-five', { rating: 5, reviewCount: 1 }))
    ).toEqual({ kind: 'rating', rating: 5 });
  });

  const invalidCases = [
    { name: 'rating above 5', rating: 5.1, reviewCount: 1 },
    { name: 'rating below 1', rating: 0.9, reviewCount: 1 },
    { name: 'NaN rating', rating: Number.NaN, reviewCount: 1 },
    { name: 'fractional review count', rating: 4.5, reviewCount: 1.5 },
    { name: 'negative review count', rating: 4.5, reviewCount: -1 },
    { name: 'NaN review count', rating: 4.5, reviewCount: Number.NaN },
  ];

  for (const invalidCase of invalidCases) {
    test(`${invalidCase.name} is hidden`, () => {
      expect(
        getProductRatingDisplay(
          product('invalid', { rating: invalidCase.rating, reviewCount: invalidCase.reviewCount })
        )
      ).toEqual({ kind: 'hidden' });
    });
  }

  test('the shared helper rejects legacy five-star ratings without a positive review count', () => {
    expect(getGenuineProductRating(product('legacy', { rating: 5 }))).toBeNull();
  });

  test('NULL product rating stays NULL and confirmed zero reviews shows the empty state', () => {
    const mapped = mapProductRow(productRow({ rating: null, review_count: 0 }));

    expect(mapped.rating).toBeNull();
    expect(mapped.reviewCount).toBe(0);
    expect(getProductRatingDisplay(mapped)).toEqual({ kind: 'empty' });
  });

  test('a genuine rating is preserved and displayed', () => {
    const mapped = mapProductRow(productRow({ rating: '4.7', review_count: 3 }));

    expect(mapped.rating).toBe(4.7);
    expect(mapped.reviewCount).toBe(3);
    expect(getProductRatingDisplay(mapped)).toEqual({ kind: 'rating', rating: 4.7 });
  });

  test('static fallback products are hidden until reviews are confirmed', () => {
    expect(staticFallbackProducts.length).toBeGreaterThan(0);
    expect(
      staticFallbackProducts.every(
        (item) => getProductRatingDisplay(item).kind === 'hidden'
      )
    ).toBe(true);
  });

  test('quick-view and Home Decor detail consumers use the corrected helper', () => {
    const consumerPaths = [
      path.join(process.cwd(), 'components', 'sections', 'product-card.tsx'),
      path.join(process.cwd(), 'app', 'home-decor', '[slug]', 'page.tsx'),
    ];

    for (const consumerPath of consumerPaths) {
      const source = fs.readFileSync(consumerPath, 'utf8');
      expect(source.includes('getProductRatingDisplay(product)')).toBe(true);
      expect(source.includes('product.rating')).toBe(false);
    }

    const collectionOrderSource = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'catalog', 'collection-order.ts'),
      'utf8'
    );
    expect(collectionOrderSource.includes('getGenuineProductRating(a)')).toBe(true);
  });

  test('testimonial rating fallback is unchanged', () => {
    const mapped = mapTestimonialRow({
      id: 'testimonial-id',
      name: 'Client',
      role: null,
      company: null,
      content: 'Excellent work.',
      rating: null,
      avatar: null,
      display_order: 0,
      is_published: true,
    });

    expect(mapped.rating).toBe(5);
  });
});
