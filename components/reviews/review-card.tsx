'use client';

import Image from 'next/image';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReviewRatingStars } from '@/components/reviews/review-rating-stars';
import {
  countCodePoints,
  type ReviewUiImage,
  type ReviewUiReview,
} from '@/lib/review/client-contract';
import { cn } from '@/lib/utils';

const COLLAPSED_CODE_POINTS = 320;

function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function ReviewCard({
  review,
  className,
}: {
  review: ReviewUiReview;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState<ReviewUiImage | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<string[]>([]);
  const contentLength = countCodePoints(review.content);
  const isLong = contentLength > COLLAPSED_CODE_POINTS;
  const visibleContent =
    expanded || !isLong
      ? review.content
      : `${Array.from(review.content).slice(0, COLLAPSED_CODE_POINTS).join('')}…`;
  const images = review.images.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const isUnavailable = (image: ReviewUiImage) =>
    !image.signedUrl || failedImageIds.includes(image.id);
  const markFailed = (id: string) => {
    setFailedImageIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  return (
    <article
      data-testid="review-card"
      className={cn(
        'flex h-full flex-col rounded-2xl border border-[#E3DDD3] bg-white p-5 shadow-[0_8px_28px_rgba(48,45,39,0.05)] sm:p-6',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReviewRatingStars value={review.rating} size="sm" />
        <time
          dateTime={review.createdAt}
          className="text-[11px] uppercase tracking-[0.12em] text-[#302D27]/55"
        >
          {formatReviewDate(review.createdAt)}
        </time>
      </div>

      <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-[#302D27]/85">
        {visibleContent}
      </p>

      {isLong && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 self-start text-xs font-semibold uppercase tracking-[0.12em] text-[#8B6A3E] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B18A53] focus-visible:ring-offset-2"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      <div className="mt-auto pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#302D27]">
          {review.customerName?.trim() || 'Anonymous customer'}
        </p>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                data-testid="review-photo-thumb"
                aria-label={`View customer review photo ${index + 1}`}
                onClick={() => setActiveImage(image)}
                className="relative aspect-square overflow-hidden rounded-lg border border-[#E3DDD3] bg-[#FCFAF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B18A53]"
              >
                {isUnavailable(image) ? (
                  <span
                    data-testid="review-photo-unavailable"
                    className="flex h-full items-center justify-center px-1 text-center text-[10px] text-[#8B6A3E]"
                  >
                    Photo unavailable
                  </span>
                ) : (
                  <Image
                    src={image.signedUrl ?? ''}
                    alt={`Customer review photo ${index + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 30vw, 120px"
                    className="object-cover"
                    onError={() => markFailed(image.id)}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={activeImage !== null}
        onOpenChange={(open) => {
          if (!open) setActiveImage(null);
        }}
      >
        <DialogContent
          data-testid="review-photo-gallery"
          className="max-w-3xl rounded-2xl border-[#E3DDD3] bg-[#FCFAF6] p-6"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-[#302D27]">
              Customer review photo
            </DialogTitle>
            <DialogDescription className="text-sm text-[#302D27]/65">
              Expanded from a customer review.
            </DialogDescription>
          </DialogHeader>
          <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-xl border border-[#E3DDD3] bg-white">
            {activeImage && !isUnavailable(activeImage) ? (
              <Image
                src={activeImage.signedUrl ?? ''}
                alt={`Expanded customer review photo from ${review.customerName?.trim() || 'an anonymous customer'}`}
                fill
                unoptimized
                sizes="(max-width: 768px) 90vw, 720px"
                className="object-contain"
                onError={() => markFailed(activeImage.id)}
              />
            ) : (
              <p className="flex h-full items-center justify-center px-6 text-sm text-[#6B6459]">
                This photo is unavailable.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
