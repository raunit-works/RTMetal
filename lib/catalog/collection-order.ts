import { getGenuineProductRating } from '@/lib/catalog/product-rating';
import type { Product } from '@/lib/types';

export type CollectionSort = 'featured' | 'rating' | 'name';

function pinnedTime(product: Product): number | null {
  if (!product.pinnedAt) return null;
  const value = Date.parse(product.pinnedAt);
  return Number.isNaN(value) ? null : value;
}

/**
 * Admin-pinned products always sort before unpinned products.
 *
 * Multiple pinned products keep the existing rule from the database: the most
 * recently pinned product comes first. This function is applied to the full
 * collection result before any display or pagination work, so a pinned product
 * can never be pushed onto a later page.
 */
export function comparePinnedFirst(a: Product, b: Product): number {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
  if (!a.isPinned || !b.isPinned) return 0;

  const aTime = pinnedTime(a);
  const bTime = pinnedTime(b);

  if (aTime !== null && bTime !== null && aTime !== bTime) return bTime - aTime;
  if (aTime !== null && bTime === null) return -1;
  if (aTime === null && bTime !== null) return 1;
  return 0;
}

/**
 * Applies pinned-first grouping, then the customer's chosen sort to unpinned
 * products, then the existing deterministic order (the server's returned
 * position, ultimately created_at DESC / id ASC) as the final tie-breaker.
 */
export function sortCollectionProducts(
  products: Product[],
  sortBy: CollectionSort = 'featured',
): Product[] {
  const position = new Map(products.map((product, index) => [product.id, index]));

  return [...products].sort((a, b) => {
    const pinned = comparePinnedFirst(a, b);
    if (pinned !== 0) return pinned;

    if (!a.isPinned && !b.isPinned) {
      if (sortBy === 'rating') {
        const aRating = getGenuineProductRating(a);
        const bRating = getGenuineProductRating(b);

        if (aRating !== null && bRating !== null && aRating !== bRating) {
          return bRating - aRating;
        }
        if (aRating !== null && bRating === null) return -1;
        if (aRating === null && bRating !== null) return 1;
      }
      if (sortBy === 'name') {
        const byName = a.name.localeCompare(b.name, undefined, {
          sensitivity: 'base',
        });
        if (byName !== 0) return byName;
      }
    }

    return (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0);
  });
}
