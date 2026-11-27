'use client';

import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

function clampRating(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(5, Math.max(0, value));
}

export function ReviewRatingStars({
  value,
  size = 'md',
  className,
}: {
  value: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const rating = value === null ? 0 : clampRating(value);
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const label =
    value === null
      ? 'No reviews yet'
      : `${rating.toFixed(1)} out of 5 stars`;

  return (
    <span
      role="img"
      aria-label={label}
      data-testid="review-rating-stars"
      className={cn('inline-flex items-center gap-0.5', className)}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.min(100, Math.max(0, (rating - index) * 100));
        return (
          <span key={index} className={cn('relative shrink-0', iconSize)} aria-hidden="true">
            <Star className={cn(iconSize, 'absolute inset-0 text-[#D9D2C6]')} strokeWidth={1.5} />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill}%` }}
              >
                <Star className={cn(iconSize, 'fill-[#B18A53] text-[#B18A53]')} strokeWidth={1.2} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
