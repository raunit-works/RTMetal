import type { Product } from '@/lib/types';

export type ProductRatingDisplay =
  | { kind: 'rating'; rating: number }
  | { kind: 'empty' }
  | { kind: 'hidden' };

function hasConfirmedReviewCount(
  reviewCount: Product['reviewCount']
): reviewCount is number {
  return (
    typeof reviewCount === 'number' &&
    Number.isInteger(reviewCount) &&
    reviewCount > 0
  );
}

function hasValidRating(rating: Product['rating']): rating is number {
  return (
    typeof rating === 'number' && Number.isFinite(rating) && rating >= 1 && rating <= 5
  );
}

export function getGenuineProductRating(
  product: Pick<Product, 'rating' | 'reviewCount'>
): number | null {
  if (!hasConfirmedReviewCount(product.reviewCount)) return null;
  if (!hasValidRating(product.rating)) return null;
  return product.rating;
}

export function getProductRatingDisplay(
  product: Pick<Product, 'rating' | 'reviewCount'>
): ProductRatingDisplay {
  if (product.reviewCount === 0) {
    return { kind: 'empty' };
  }

  const rating = getGenuineProductRating(product);
  return rating !== null ? { kind: 'rating', rating } : { kind: 'hidden' };
}
