'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Maximize, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import {
  APPROVED_METAL_FINISHES,
  type ApprovedFinish,
} from '@/content/metal-coating/finishes';

interface FinishCardProps {
  finish: ApprovedFinish;
  onSelect: (finId: string, el: HTMLElement) => void;
  onEnquire: (finId: string, displayName: string) => void;
}

function FinishCard({
  finish,
  onSelect,
  onEnquire,
}: FinishCardProps) {
  return (
    <article
      key={finish.finId}
      id={`finish-${finish.finId}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all duration-300 hover:shadow-lg hover:border-gold/40"
    >
      <div className="relative h-56 sm:h-64 overflow-hidden bg-white border-b border-border/60">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onSelect(finish.finId, e.currentTarget);
          }}
          aria-label={`Enlarge ${finish.displayName} (${finish.finId})`}
          className="absolute inset-0 w-full h-full p-1"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={finish.imagePath}
            alt={finish.altText}
            width={800}
            height={800}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain bg-white group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Maximize className="h-3.5 w-3.5 text-white" aria-hidden="true" />
            <span className="text-xs font-medium text-white">Enlarge</span>
          </div>
        </button>
      </div>
      <div className="flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-base font-medium sm:text-lg tracking-tight text-foreground group-hover:text-gold-deep transition-colors">
            {finish.displayName}
          </h3>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-border px-2 py-0.5 rounded">
            {finish.finId}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Decorative metal finish sample. Enquire for availability and
          suitability.
        </p>
        <div className="mt-auto pt-3 border-t border-border/40">
          <Link
            href="#quote"
            onClick={() => onEnquire(finish.finId, finish.displayName)}
            className="inline-flex items-center gap-1.5 w-full rounded-full border border-gold/20 bg-white px-3 py-1.5 text-[11px] font-medium text-gold-deep hover:bg-gold/5 transition-colors text-center"
            aria-label={`Request a quote for ${finish.displayName} (${finish.finId})`}
          >
            Request this finish
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

interface FinishCollectionProps {
  onEnquireFinish?: (finId: string, displayName: string) => void;
}

export function FinishCollection({
  onEnquireFinish,
}: FinishCollectionProps = {}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const finish = APPROVED_METAL_FINISHES[current];
  const prevIndex = (current - 1 + APPROVED_METAL_FINISHES.length) % APPROVED_METAL_FINISHES.length;
  const nextIndex = (current + 1) % APPROVED_METAL_FINISHES.length;

  const openLightbox = useCallback(
    (finId: string, el: HTMLElement) => {
      triggerRef.current = el;
      const idx = APPROVED_METAL_FINISHES.findIndex((f) => f.finId === finId);
      setCurrent(idx);
      setOpen(true);
    },
    []
  );

  const closeLightbox = useCallback(() => {
    setOpen(false);
  }, []);

  // Sync native dialog with React open state.
  // showModal / close are called here in a useEffect so they always run
  // after React has committed state — avoiding the race between setState
  // and imperative showModal in the same event-handler tick.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      document.body.style.overflow = 'hidden';
      // Move focus to the dialog so keyboard events (ArrowLeft/Right, Escape)
      // are received by the element with our onKeyDown handler.
      dialog.focus();
    } else {
      if (dialog.open) {
        dialog.close();
      }
      document.body.style.overflow = '';
      // Restore focus to the trigger button.
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }, [open]);

  // Cleanup on unmount: ensure body scroll is restored.
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDialogElement>) => {
      if (e.key === 'Escape') {
        // Prevent the native dialog cancel/close — we handle it ourselves
        // so React state stays in sync.
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrent((prev) => (prev - 1 + APPROVED_METAL_FINISHES.length) % APPROVED_METAL_FINISHES.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrent((prev) => (prev + 1) % APPROVED_METAL_FINISHES.length);
      }
    },
    [closeLightbox]
  );

  // Guard against the native <dialog> cancel event (fired by the browser on
  // Escape before our React onKeyDown can preventDefault). Preventing the
  // cancel event keeps the native dialog open so our closeLightbox() handler
  // is the sole code path that calls dialog.close(), keeping React state in
  // sync.
  const handleCancel = useCallback(
    (e: React.SyntheticEvent<HTMLDialogElement>) => {
      e.preventDefault();
      closeLightbox();
    },
    [closeLightbox]
  );

  return (
    <>
      <section
        id="finishes"
        className="scroll-mt-24 pt-10 pb-12 sm:pt-14 sm:pb-16 bg-background"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <SectionHeading
            eyebrow="Metal Finishes & Colour Collection"
            title="Explore Our Metal Finishes"
            description="Discover our selection of decorative metal finishes, from mirror and hairline textures to antique and matte appearances. Explore the samples and enquire about your preferred finish."
          />

          <p className="mt-4 sm:mt-5 text-center text-xs font-medium uppercase tracking-wider text-gold-deep">
            Twelve client-approved finish samples — visual references only
          </p>

          <div className="mt-8 sm:mt-10 grid gap-6 sm:gap-8 lg:gap-10">
            <Reveal as="div" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
              {APPROVED_METAL_FINISHES.map((finish) => (
                <FinishCard
                  key={finish.finId}
                  finish={finish}
                  onSelect={(finId, el) => openLightbox(finId, el)}
                  onEnquire={(finId, displayName) => {
                    onEnquireFinish?.(finId, displayName);
                  }}
                />
              ))}
            </Reveal>
          </div>

          <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-gold text-ink hover:bg-gold/90 font-medium shadow-lg shadow-gold/25"
            >
              <a href="#quote">Request a Finish Quote</a>
            </Button>
          </div>
        </div>
      </section>

      {/*
        Lightbox dialog.
        Implementation notes:
        - tabIndex={-1} ensures the <dialog> itself is focusable so that
          keyboard events (Arrow, Escape) fire on the element with onKeyDown.
        - onCancel prevents the browser's native Escape→cancel→close sequence;
          our handleKeyDown/closeLightbox is the single close path.
        - showModal()/close() are driven by useEffect, not inline handlers,
          so React state is always committed before the imperative call runs.
        - The backdrop is a child <div> with onClick rather than relying on
          the native ::backdrop pseudo-element, giving full pointer-event control.
      */}
      <dialog
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onCancel={handleCancel}
        aria-label={`Finish enlargement: ${finish?.displayName ?? ''}`}
        aria-modal="true"
        className="m-auto w-full max-w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-visible rounded-2xl border-none bg-transparent p-0 shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
      >
        {/* Backdrop — sits behind the content panel; click closes */}
        <div
          onClick={closeLightbox}
          className="fixed inset-0 z-0 bg-ink/60 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Content panel */}
        <div className="relative z-10 flex flex-col items-center justify-center bg-background border border-border rounded-2xl p-6 sm:p-8 shadow-2xl outline-none max-h-[90vh] overflow-y-auto">
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Close finish enlargement"
            className="absolute top-4 right-4 rounded-full bg-white/90 border border-border p-2 text-ink hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-gold"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="relative flex-1 w-full flex items-center justify-center bg-white rounded-xl border border-border overflow-hidden min-h-[200px]">
            <button
              type="button"
              onClick={() => setCurrent(prevIndex)}
              aria-label="Previous finish"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border border-border p-2 text-ink hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-gold"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={finish?.imagePath}
              alt={finish ? `Enlarged view — ${finish.altText}` : ''}
              width={1200}
              height={1200}
              loading="eager"
              decoding="async"
              className="max-w-full max-h-[60vh] object-contain mx-auto"
            />
            <button
              type="button"
              onClick={() => setCurrent(nextIndex)}
              aria-label="Next finish"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border border-border p-2 text-ink hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-gold"
            >
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 text-center">
            <h3 className="font-display text-xl font-medium sm:text-2xl text-foreground">
              {finish?.displayName}
            </h3>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              FIN ID: {finish?.finId}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>Image {current + 1} of {APPROVED_METAL_FINISHES.length}</span>
            <button
              type="button"
              onClick={() => setCurrent(prevIndex)}
              aria-label="Previous finish"
              className="underline underline-offset-2 hover:text-gold-deep"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrent(nextIndex)}
              aria-label="Next finish"
              className="underline underline-offset-2 hover:text-gold-deep"
            >
              Next
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}