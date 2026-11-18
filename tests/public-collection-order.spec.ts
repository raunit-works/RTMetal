import { test, expect } from '@playwright/test';
import {
  comparePinnedFirst,
  sortCollectionProducts,
} from '@/lib/catalog/collection-order';
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
    const lowRated = product('low', { name: 'Alpha', rating: 2 });
    const highRated = product('high', { name: 'Bravo', rating: 4.8 });

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
});
