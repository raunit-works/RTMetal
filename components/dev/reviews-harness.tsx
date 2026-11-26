'use client';

import Link from 'next/link';
import { Heart, MessageCircle, Phone } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { ProductReviewsSection } from '@/components/reviews/product-reviews-section';
import { Button } from '@/components/ui/button';
import { liveReviewApi, type ReviewApiAdapter } from '@/lib/review/api-client';
import type { ReviewUiReview } from '@/lib/review/client-contract';
import {
  createDevReviewMockAdapter,
  DEV_SUBMISSION_OUTCOMES,
  getInitialDevReviews,
  type DevReviewDataMode,
  type DevSubmissionOutcome,
} from '@/lib/review/dev-mock-adapter';

const HARNESS_PRODUCTS = [
  {
    division: 'Metal Services',
    testId: 'metal-product-shell',
    productId: '0f8fad5b-d9cb-469f-a165-70867728950e',
    productName: 'Handcrafted Brass Hanging Diya Chain With Antique Finish',
  },
  {
    division: 'Home Decor',
    testId: 'home-decor-product-shell',
    productId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    productName: 'Botanical Leaf Wall Artwork In Warm Bronze And Patinated Green',
  },
] as const;

export function ReviewsHarness({
  source,
  allowRouteSource = false,
}: {
  source?: string;
  allowRouteSource?: boolean;
}) {
  const [dataMode, setDataMode] = useState<DevReviewDataMode>('populated');
  const [outcome, setOutcome] = useState<DevSubmissionOutcome>('success');
  const [reviews, setReviews] = useState<ReviewUiReview[]>(() => getInitialDevReviews());
  const [sectionKey, setSectionKey] = useState(0);
  const dataModeRef = useRef(dataMode);
  const outcomeRef = useRef(outcome);
  const reviewsRef = useRef(reviews);

  dataModeRef.current = dataMode;
  outcomeRef.current = outcome;
  reviewsRef.current = reviews;

  const api = useMemo<ReviewApiAdapter>(() => {
    if (source === 'route' && allowRouteSource) return liveReviewApi;
    return createDevReviewMockAdapter({
      getDataMode: () => dataModeRef.current,
      getOutcome: () => outcomeRef.current,
      getReviews: () => reviewsRef.current,
      setReviews,
    });
  }, [allowRouteSource, source]);

  return (
    <main className="min-h-screen bg-[#FCFAF6] pb-20 text-[#302D27]">
      <div className="border-b border-[#E3DDD3] bg-[#302D27] px-5 py-5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/70">Phase 3A isolated UI harness</p>
          <Link href="/" className="text-xs underline underline-offset-4">
            Back to site
          </Link>
        </div>
      </div>

      <section
        data-testid="harness-controls"
        aria-label="Demonstration controls"
        className="mx-auto mt-8 max-w-7xl px-5 lg:px-10"
      >
        <div className="rounded-2xl border border-[#D8CBB8] bg-white p-5 shadow-[0_10px_40px_rgba(48,45,39,0.06)]">
          <p className="type-eyebrow text-[#8B6A3E]">Demonstration controls</p>
          <p className="mt-2 text-sm text-[#6B6459]">
            Demonstration data only. Submissions are simulated locally and never sent to Supabase.
          </p>
          <div className="mt-5 flex flex-wrap items-end gap-6">
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6459]">
                Review list
              </legend>
              <div className="flex gap-2">
                <Button
                  data-testid="harness-mode-populated"
                  aria-pressed={dataMode === 'populated'}
                  variant={dataMode === 'populated' ? 'default' : 'outline'}
                  className="h-10 rounded-full"
                  onClick={() => {
                    setDataMode('populated');
                    setSectionKey((value) => value + 1);
                  }}
                >
                  Populated
                </Button>
                <Button
                  data-testid="harness-mode-empty"
                  aria-pressed={dataMode === 'empty'}
                  variant={dataMode === 'empty' ? 'default' : 'outline'}
                  className="h-10 rounded-full"
                  onClick={() => {
                    setDataMode('empty');
                    setSectionKey((value) => value + 1);
                  }}
                >
                  Empty
                </Button>
              </div>
            </fieldset>
            <label className="block space-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6459]">
              Simulated submission result
              <select
                data-testid="harness-outcome"
                value={outcome}
                onChange={(event) => setOutcome(event.target.value as DevSubmissionOutcome)}
                className="block h-10 min-w-52 rounded-full border border-[#D8CBB8] bg-white px-4 text-sm normal-case tracking-normal text-[#302D27]"
              >
                {DEV_SUBMISSION_OUTCOMES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <Button
              data-testid="harness-reset"
              variant="ghost"
              className="h-10 rounded-full"
              onClick={() => {
                setDataMode('populated');
                setOutcome('success');
                setReviews(getInitialDevReviews());
                setSectionKey((value) => value + 1);
              }}
            >
              Reset demonstration
            </Button>
          </div>
        </div>
      </section>

      {HARNESS_PRODUCTS.map((item) => (
        <section key={item.testId} data-testid={item.testId} className="mx-auto max-w-7xl px-5 py-12 lg:px-10">
          <div className="rounded-2xl border border-[#E3DDD3] bg-white p-6">
            <p className="type-eyebrow text-[#8B6A3E]">{item.division} · Demonstration data</p>
            <h1 className="type-product-title mt-3 break-words">{item.productName}</h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="h-11 rounded-full bg-[#302D27] text-white">
                <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                WhatsApp
              </Button>
              <Button variant="outline" className="h-11 rounded-full border-[#B18A53] text-[#8B6A3E]">
                <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Enquire Now
              </Button>
              <Button variant="ghost" className="h-11 rounded-full">
                <Heart className="mr-2 h-4 w-4" aria-hidden="true" />
                Wishlist
              </Button>
            </div>
          </div>

          <ProductReviewsSection
            key={`${item.testId}-${sectionKey}`}
            productId={item.productId}
            productName={item.productName}
            enabled
            api={api}
          />
        </section>
      ))}
    </main>
  );
}
