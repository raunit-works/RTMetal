'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Loader2, PenLine, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { SectionHeading } from '@/components/sections/section-heading';
import { ReviewCard } from '@/components/reviews/review-card';
import { ReviewFormModal } from '@/components/reviews/review-form-modal';
import { ReviewRatingStars } from '@/components/reviews/review-rating-stars';
import type { ReviewUiReview, ReviewUiSummary } from '@/lib/review/client-contract';
import {
  ReviewApiError,
  liveReviewApi,
  type ReviewApiAdapter,
} from '@/lib/review/api-client';
import { isReviewUiEnabled } from '@/lib/review/ui-feature';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 6;
const IMAGE_URL_REFRESH_MS = 50 * 60 * 1000;

type SectionStatus = 'loading' | 'ready' | 'unavailable' | 'error';

function isReviewSystemUnavailable(error: unknown): boolean {
  return (
    error instanceof ReviewApiError &&
    error.status === 503 &&
    (error.code === 'SCHEMA_NOT_READY' || error.code === 'SERVICE_UNAVAILABLE')
  );
}

function describeFetchError(error: unknown): string {
  if (error instanceof ReviewApiError && error.status === 404) {
    return 'Reviews could not be loaded for this product.';
  }
  return 'Reviews could not be loaded. Please try again.';
}

function formatSummary(summary: ReviewUiSummary | null): string {
  if (!summary || summary.reviewCount === 0) return 'No reviews yet';
  const average = summary.averageRating ?? 0;
  const label = summary.reviewCount === 1 ? 'review' : 'reviews';
  return `${average.toFixed(1)} out of 5 · ${summary.reviewCount} ${label}`;
}

function ReviewSkeleton() {
  return (
    <div data-testid="reviews-loading" className="grid gap-6 md:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-[260px] animate-pulse rounded-2xl border border-[#E3DDD3] bg-white/70"
        />
      ))}
    </div>
  );
}

function ProductReviewsContent({
  productId,
  productName,
  api,
  className,
}: {
  productId: string;
  productName: string;
  api?: ReviewApiAdapter;
  className?: string;
}) {
  const reviewApi = api ?? liveReviewApi;
  const [reviews, setReviews] = useState<ReviewUiReview[]>([]);
  const [summary, setSummary] = useState<ReviewUiSummary | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<SectionStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadMoreStatus, setLoadMoreStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [notice, setNotice] = useState('');
  const [refreshAfterSubmitFailed, setRefreshAfterSubmitFailed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [selectedSnap, setSelectedSnap] = useState(0);
  const [snapCount, setSnapCount] = useState(1);

  const sectionRef = useRef<HTMLElement>(null);
  const reviewsRef = useRef<ReviewUiReview[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async ({
      reset = false,
      silent = false,
    }: { reset?: boolean; silent?: boolean } = {}): Promise<boolean> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const offset = reset ? 0 : reviewsRef.current.length;

      if (!silent) {
        if (reset) setStatus('loading');
        else setLoadMoreStatus('loading');
      }

      try {
        const data = await reviewApi.fetchReviews(
          productId,
          { limit: PAGE_SIZE, offset },
          controller.signal
        );
        if (controller.signal.aborted) return false;

        const nextReviews = reset ? data.reviews : [...reviewsRef.current, ...data.reviews];
        reviewsRef.current = nextReviews;
        setReviews(nextReviews);
        setSummary(data.summary);
        setTotalCount(data.totalCount);
        setHasMore(data.pagination.hasMore);
        setStatus('ready');
        setLoadMoreStatus('idle');
        setErrorMessage('');
        setRefreshAfterSubmitFailed(false);
        return true;
      } catch (error) {
        if (controller.signal.aborted) return false;
        if (reset && !silent) {
          setStatus(isReviewSystemUnavailable(error) ? 'unavailable' : 'error');
          setErrorMessage(describeFetchError(error));
        } else {
          setLoadMoreStatus('error');
        }
        return false;
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [productId, reviewApi]
  );

  useEffect(() => {
    reviewsRef.current = [];
    setReviews([]);
    setSummary(null);
    setTotalCount(0);
    setHasMore(false);
    setNotice('');
    setErrorMessage('');
    setStatus('loading');
    void load({ reset: true });
    return () => abortRef.current?.abort();
  }, [load]);

  useEffect(() => {
    if (!carouselApi) return;
    const update = () => {
      setSelectedSnap(carouselApi.selectedScrollSnap());
      setSnapCount(Math.max(1, carouselApi.scrollSnapList().length));
    };
    update();
    carouselApi.on('select', update);
    carouselApi.on('reInit', update);
    return () => {
      carouselApi.off('select', update);
      carouselApi.off('reInit', update);
    };
  }, [carouselApi]);

  const hasSignedImages = useMemo(
    () => reviews.some((review) => review.images.some((image) => Boolean(image.signedUrl))),
    [reviews]
  );

  useEffect(() => {
    if (status !== 'ready' || !hasSignedImages) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load({ reset: true, silent: true });
    }, IMAGE_URL_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [hasSignedImages, load, status]);

  const scrollToReviews = useCallback(() => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleSubmitSuccess = async (duplicate: boolean) => {
    setFormOpen(false);
    const refreshed = await load({ reset: true, silent: true });
    if (refreshed) {
      setRefreshAfterSubmitFailed(false);
      setNotice(
        duplicate
          ? 'This review was already submitted. Your existing review is shown below.'
          : 'Thank you for sharing your experience! Your review has been published.'
      );
    } else {
      setRefreshAfterSubmitFailed(true);
      setNotice(
        'Thank you for sharing your experience! Your review was submitted, but the list could not refresh yet. Use Refresh reviews below.'
      );
    }
    requestAnimationFrame(scrollToReviews);
  };

  const handleManualRefresh = async () => {
    setRefreshAfterSubmitFailed(false);
    const refreshed = await load({ reset: true, silent: true });
    if (refreshed) setNotice('Reviews are up to date.');
    else setRefreshAfterSubmitFailed(true);
  };

  const showEmptyState = status === 'ready' && totalCount === 0 && reviews.length === 0;
  const showReviews = status === 'ready' && reviews.length > 0;
  const showWriteButton = status === 'ready';
  const heading = showReviews ? 'Loved by our customers.' : 'Customer Reviews';

  return (
    <section
      ref={sectionRef}
      id={`reviews-${productId}`}
      data-testid="reviews-section"
      data-product-id={productId}
      className={cn(
        'scroll-mt-24 border-t border-[#E3DDD3] bg-[#FCFAF6] py-10 sm:py-12 lg:py-16',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="hidden md:block">
          <SectionHeading
            eyebrow="CUSTOMER EXPERIENCES"
            title={heading}
            description="Read customer experiences or share your own."
          />
        </div>

        <div className="md:hidden">
          <h2 className="font-display text-3xl font-medium text-[#302D27]">{heading}</h2>
          <p className="mt-2 text-sm text-[#302D27]/65">
            Read customer experiences or share your own.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-5 text-center">
          {status === 'loading' && (
            <p data-testid="review-summary-text" className="text-sm text-[#302D27]/65">
              Loading reviews…
            </p>
          )}

          {status === 'ready' && (
            <button
              type="button"
              data-testid="review-summary"
              onClick={scrollToReviews}
              className="flex flex-col items-center gap-2 rounded-xl px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B18A53]"
            >
              <ReviewRatingStars
                value={summary?.averageRating ?? null}
                size="md"
                className="justify-center"
              />
              <span className="text-sm font-medium text-[#302D27]" data-testid="review-summary-text">
                {formatSummary(summary)}
              </span>
            </button>
          )}

          {showWriteButton && (
            <Button
              type="button"
              data-testid="write-review-button"
              onClick={() => setFormOpen(true)}
              className="h-12 w-full rounded-full bg-[#302D27] px-7 text-white hover:bg-[#463F34] sm:w-auto"
            >
              <PenLine className="mr-2 h-4 w-4" aria-hidden="true" />
              Write a Review
            </Button>
          )}
        </div>

        {notice && (
          <p
            data-testid="reviews-notice"
            role="status"
            aria-live="polite"
            className="mt-6 rounded-xl border border-[#D8C6A9] bg-[#F8F1E6] px-4 py-3 text-sm text-[#5D4526]"
          >
            {notice}
          </p>
        )}

        {refreshAfterSubmitFailed && (
          <div className="mt-3">
            <Button
              type="button"
              data-testid="reviews-refresh"
              variant="outline"
              onClick={() => void handleManualRefresh()}
              className="h-11 rounded-full border-[#B18A53] text-[#8B6A3E]"
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Refresh reviews
            </Button>
          </div>
        )}

        {status === 'loading' && <div className="mt-10"><ReviewSkeleton /></div>}

        {status === 'unavailable' && (
          <div
            data-testid="reviews-unavailable"
            className="mt-10 rounded-2xl border border-[#D9D2C6] bg-white/70 px-6 py-10 text-center"
          >
            <ReviewRatingStars value={null} size="lg" className="justify-center" />
            <h3 className="mt-4 font-display text-2xl text-[#302D27]">
              Customer reviews will be available soon.
            </h3>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#302D27]/65">
              We are preparing customer reviews for this product. Please check back shortly.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div
            data-testid="reviews-error"
            role="alert"
            className="mt-10 rounded-2xl border border-[#E3DDD3] bg-white p-8 text-center"
          >
            <p className="text-sm text-[#302D27]/75">{errorMessage}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void load({ reset: true })}
              className="mt-4 h-11 rounded-full border-[#B18A53] text-[#8B6A3E]"
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Refresh reviews
            </Button>
          </div>
        )}

        {showEmptyState && (
          <div
            data-testid="reviews-empty"
            className="mt-10 rounded-2xl border border-dashed border-[#D9D2C6] bg-white/70 px-6 py-10 text-center"
          >
            <h3 className="font-display text-2xl text-[#302D27]">Customer Reviews</h3>
            <ReviewRatingStars value={null} size="lg" className="mt-4 justify-center" />
            <p className="mt-3 text-sm font-medium text-[#302D27]">No reviews yet</p>
            <p className="mt-2 font-display text-2xl text-[#302D27]">
              Be the first to share your experience.
            </p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#302D27]/65">
              Share your thoughts and help other customers discover this product.
            </p>
            <Button
              type="button"
              onClick={() => setFormOpen(true)}
              className="mt-6 h-12 rounded-full bg-[#302D27] px-7 text-white hover:bg-[#463F34]"
            >
              Write a Review
            </Button>
          </div>
        )}

        {showReviews && (
          <>
            <div className="mt-10 hidden md:block">
              <Carousel
                opts={{ align: 'start', containScroll: 'trimSnaps' }}
                setApi={setCarouselApi}
                tabIndex={0}
                aria-label="Customer reviews carousel"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B18A53]"
              >
                <CarouselContent className="-ml-4 lg:-ml-5">
                  {reviews.map((review) => (
                    <CarouselItem
                      key={review.id}
                      data-testid="review-carousel-item"
                      className="pl-4 md:basis-1/2 lg:basis-1/3 lg:pl-5"
                    >
                      <ReviewCard review={review} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {reviews.length > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <CarouselPrevious
                      data-testid="review-carousel-prev"
                      className="static left-auto top-auto h-11 w-11 translate-x-0 translate-y-0 border-[#E3DDD3] text-[#302D27]"
                    />
                    <div className="flex items-center gap-2" aria-label="Review pages">
                      {Array.from({ length: snapCount }, (_, index) => (
                        <button
                          key={index}
                          type="button"
                          aria-label={`Go to review page ${index + 1}`}
                          aria-current={index === selectedSnap ? 'true' : undefined}
                          onClick={() => carouselApi?.scrollTo(index)}
                          className={cn(
                            'h-2.5 w-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B18A53]',
                            index === selectedSnap ? 'bg-[#B18A53]' : 'bg-[#D9D2C6]'
                          )}
                        />
                      ))}
                    </div>
                    <CarouselNext
                      data-testid="review-carousel-next"
                      className="static right-auto top-auto h-11 w-11 translate-x-0 translate-y-0 border-[#E3DDD3] text-[#302D27]"
                    />
                  </div>
                )}
              </Carousel>
            </div>

            <div data-testid="review-mobile-list" className="mt-8 grid gap-4 md:hidden">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <Button
                  type="button"
                  data-testid="reviews-load-more"
                  variant="outline"
                  disabled={loadMoreStatus === 'loading'}
                  onClick={() => void load()}
                  className="h-12 min-w-[180px] rounded-full border-[#B18A53] text-[#8B6A3E]"
                >
                  {loadMoreStatus === 'loading' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Loading…
                    </>
                  ) : (
                    'Load more reviews'
                  )}
                </Button>
              </div>
            )}
            {loadMoreStatus === 'error' && (
              <p data-testid="reviews-load-more-error" role="alert" className="mt-4 text-center text-sm text-[#9B2C2C]">
                More reviews could not be loaded. Please try again.
              </p>
            )}
          </>
        )}

        <ReviewFormModal
          open={formOpen}
          onOpenChange={setFormOpen}
          productId={productId}
          productName={productName}
          api={reviewApi}
          onSuccess={handleSubmitSuccess}
        />
      </div>
    </section>
  );
}

export function ProductReviewsSection({
  productId,
  productName,
  enabled,
  api,
  className,
}: {
  productId: string;
  productName: string;
  enabled?: boolean;
  api?: ReviewApiAdapter;
  className?: string;
}) {
  if (!(enabled ?? isReviewUiEnabled())) return null;
  return (
    <ProductReviewsContent
      productId={productId}
      productName={productName}
      api={api}
      className={className}
    />
  );
}
