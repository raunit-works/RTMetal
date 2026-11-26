'use client';

import { useCallback, useRef, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ReviewForm,
  type ReviewSubmissionProtection,
} from '@/components/reviews/review-form';
import {
  liveReviewApi,
  type ReviewApiAdapter,
} from '@/lib/review/api-client';
import { Button } from '@/components/ui/button';

export function ReviewFormModal({
  open,
  onOpenChange,
  productId,
  productName,
  api,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  api?: ReviewApiAdapter;
  onSuccess: (duplicate: boolean) => Promise<void>;
}) {
  const [dismissWarning, setDismissWarning] = useState(false);
  const protectionRef = useRef<ReviewSubmissionProtection>({ active: false, uncertain: false });

  const handleProtectionChange = useCallback((protection: ReviewSubmissionProtection) => {
    protectionRef.current = protection;
    if (!protection.active && !protection.uncertain) setDismissWarning(false);
  }, []);

  const requestClose = useCallback(() => {
    if (protectionRef.current.active || protectionRef.current.uncertain) {
      setDismissWarning(true);
      return;
    }
    setDismissWarning(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        onOpenChange(true);
        return;
      }
      requestClose();
    },
    [onOpenChange, requestClose]
  );

  const blockDismissal = useCallback(
    (event: Event) => {
      if (protectionRef.current.active || protectionRef.current.uncertain) {
        event.preventDefault();
        setDismissWarning(true);
      }
    },
    []
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-testid="review-form-modal"
        onEscapeKeyDown={blockDismissal}
        onPointerDownOutside={blockDismissal}
        onInteractOutside={blockDismissal}
        closeLabel="Close review form"
        closeClassName="right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#302D27] opacity-100 shadow-sm ring-1 ring-[#E3DDD3] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B18A53] md:right-4 md:top-4"
        disableAnimation
        className="inset-x-0 bottom-0 top-auto flex max-h-[calc(100dvh-0.75rem)] w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl border-0 bg-[#FCFAF6] p-0 shadow-[0_-16px_48px_rgba(48,45,39,0.18)] sm:max-w-none md:left-[50%] md:top-[50%] md:bottom-auto md:max-h-[min(90dvh,760px)] md:max-w-[540px] md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-2xl md:border md:border-[#E3DDD3] md:shadow-[0_24px_80px_rgba(48,45,39,0.18)]"
      >
        <div data-testid="review-sheet-handle" aria-hidden="true" className="mx-auto mt-3 h-1.5 w-24 shrink-0 rounded-full bg-[#D9D2C6] md:hidden" />
        <DialogHeader data-testid="review-modal-header" className="shrink-0 space-y-1.5 px-5 pb-4 pr-16 pt-4 text-left sm:px-7 sm:pr-20 md:pt-7">
          <DialogTitle className="font-display text-3xl font-medium text-[#302D27]">
            Write a Review
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-[#302D27]/65">
            Share your experience with {productName}. Reviews publish immediately.
          </DialogDescription>
          <p className="pt-1 text-[11px] uppercase tracking-[0.14em] text-[#8B6A3E]">
            Product · {productName}
          </p>
        </DialogHeader>
        {dismissWarning && (
          <div
            data-testid="review-dismiss-warning"
            role="alertdialog"
            aria-labelledby="review-dismiss-title"
            className="mx-5 mb-3 shrink-0 rounded-xl border border-[#C99A6B] bg-[#FBF0E3] p-4 text-sm text-[#5D4526] sm:mx-7"
          >
            <p id="review-dismiss-title" className="font-semibold">
              Please keep this form open for now.
            </p>
            <p className="mt-1 leading-6">
              {protectionRef.current.uncertain
                ? 'We could not confirm the last submission. Closing now could lose your details or create a duplicate. Use “Retry safely with same details” in the form, or keep this form open.'
                : 'Your review is still being submitted. Closing now could lose your details or create a duplicate.'}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDismissWarning(false)}
              className="mt-3 h-9 rounded-full border-[#B18A53] text-[#8B6A3E]"
            >
              Keep form open
            </Button>
          </div>
        )}
        <ReviewForm
          productId={productId}
          productName={productName}
          api={api ?? liveReviewApi}
          onProtectionChange={handleProtectionChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
