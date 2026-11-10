// 'use client';

// import { useCallback, useEffect, useRef, useState } from 'react';
// import Link from 'next/link';
// import { ArrowLeft, ArrowRight, Maximize, X } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Reveal } from '@/components/motion/reveal';
// import { SectionHeading } from '@/components/sections/section-heading';
// import {
//   APPROVED_METAL_FINISHES,
//   type ApprovedFinish,
// } from '@/content/metal-coating/finishes';

// interface FinishCardProps {
//   finish: ApprovedFinish;
//   onSelect: (finId: string, el: HTMLElement) => void;
//   onEnquire: (finId: string, displayName: string) => void;
// }

// function FinishCard({
//   finish,
//   onSelect,
//   onEnquire,
// }: FinishCardProps) {
//   return (
//     <article
//       key={finish.finId}
//       id={`finish-${finish.finId}`}
//       className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all duration-300 hover:shadow-lg hover:border-gold/40"
//     >
//       <div className="relative h-56 sm:h-64 overflow-hidden bg-white border-b border-border/60">
//         <button
//           type="button"
//           onClick={(e) => {
//             e.preventDefault();
//             onSelect(finish.finId, e.currentTarget);
//           }}
//           aria-label={`Enlarge ${finish.displayName} (${finish.finId})`}
//           className="absolute inset-0 w-full h-full p-1"
//         >
//           {/* eslint-disable-next-line @next/next/no-img-element */}
//           <img
//             src={finish.imagePath}
//             alt={finish.altText}
//             width={800}
//             height={800}
//             loading="lazy"
//             decoding="async"
//             className="h-full w-full object-contain bg-white group-hover:scale-105 transition-transform duration-500"
//           />
//           <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//           <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//             <Maximize className="h-3.5 w-3.5 text-white" aria-hidden="true" />
//             <span className="text-xs font-medium text-white">Enlarge</span>
//           </div>
//         </button>
//       </div>
//       <div className="flex-1 flex-col p-4">
//         <div className="flex items-center justify-between gap-2">
//           <h3 className="font-display text-base font-medium sm:text-lg tracking-tight text-foreground group-hover:text-gold-deep transition-colors">
//             {finish.displayName}
//           </h3>
//           <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-border px-2 py-0.5 rounded">
//             {finish.finId}
//           </span>
//         </div>
//         <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
//           Decorative metal finish sample. Enquire for availability and
//           suitability.
//         </p>
//         <div className="mt-auto pt-3 border-t border-border/40">
//           <Link
//             href="#quote"
//             onClick={() => onEnquire(finish.finId, finish.displayName)}
//             className="inline-flex items-center gap-1.5 w-full rounded-full border border-gold/20 bg-white px-3 py-1.5 text-[11px] font-medium text-gold-deep hover:bg-gold/5 transition-colors text-center"
//             aria-label={`Request a quote for ${finish.displayName} (${finish.finId})`}
//           >
//             Request this finish
//             <ArrowRight className="h-3 w-3" />
//           </Link>
//         </div>
//       </div>
//     </article>
//   );
// }

// interface FinishCollectionProps {
//   onEnquireFinish?: (finId: string, displayName: string) => void;
// }

// export function FinishCollection({
//   onEnquireFinish,
// }: FinishCollectionProps = {}) {
//   const [open, setOpen] = useState(false);
//   const [current, setCurrent] = useState(0);
//   const dialogRef = useRef<HTMLDialogElement>(null);
//   const triggerRef = useRef<HTMLElement | null>(null);

//   const finish = APPROVED_METAL_FINISHES[current];
//   const prevIndex = (current - 1 + APPROVED_METAL_FINISHES.length) % APPROVED_METAL_FINISHES.length;
//   const nextIndex = (current + 1) % APPROVED_METAL_FINISHES.length;

//   const openLightbox = useCallback(
//     (finId: string, el: HTMLElement) => {
//       triggerRef.current = el;
//       const idx = APPROVED_METAL_FINISHES.findIndex((f) => f.finId === finId);
//       setCurrent(idx);
//       setOpen(true);
//     },
//     []
//   );

//   const closeLightbox = useCallback(() => {
//     setOpen(false);
//   }, []);

//   // Sync native dialog with React open state.
//   // showModal / close are called here in a useEffect so they always run
//   // after React has committed state — avoiding the race between setState
//   // and imperative showModal in the same event-handler tick.
//   useEffect(() => {
//     const dialog = dialogRef.current;
//     if (!dialog) return;

//     if (open) {
//       if (!dialog.open) {
//         dialog.showModal();
//       }
//       document.body.style.overflow = 'hidden';
//       // Move focus to the dialog so keyboard events (ArrowLeft/Right, Escape)
//       // are received by the element with our onKeyDown handler.
//       dialog.focus();
//     } else {
//       if (dialog.open) {
//         dialog.close();
//       }
//       document.body.style.overflow = '';
//       // Restore focus to the trigger button.
//       requestAnimationFrame(() => {
//         triggerRef.current?.focus();
//       });
//     }
//   }, [open]);

//   // Cleanup on unmount: ensure body scroll is restored.
//   useEffect(() => {
//     return () => {
//       document.body.style.overflow = '';
//     };
//   }, []);

//   const handleKeyDown = useCallback(
//     (e: React.KeyboardEvent<HTMLDialogElement>) => {
//       if (e.key === 'Escape') {
//         // Prevent the native dialog cancel/close — we handle it ourselves
//         // so React state stays in sync.
//         e.preventDefault();
//         closeLightbox();
//       } else if (e.key === 'ArrowLeft') {
//         e.preventDefault();
//         setCurrent((prev) => (prev - 1 + APPROVED_METAL_FINISHES.length) % APPROVED_METAL_FINISHES.length);
//       } else if (e.key === 'ArrowRight') {
//         e.preventDefault();
//         setCurrent((prev) => (prev + 1) % APPROVED_METAL_FINISHES.length);
//       }
//     },
//     [closeLightbox]
//   );

//   // Guard against the native <dialog> cancel event (fired by the browser on
//   // Escape before our React onKeyDown can preventDefault). Preventing the
//   // cancel event keeps the native dialog open so our closeLightbox() handler
//   // is the sole code path that calls dialog.close(), keeping React state in
//   // sync.
//   const handleCancel = useCallback(
//     (e: React.SyntheticEvent<HTMLDialogElement>) => {
//       e.preventDefault();
//       closeLightbox();
//     },
//     [closeLightbox]
//   );

//   return (
//     <>
//       <section
//         id="finishes"
//         className="scroll-mt-24 pt-10 pb-12 sm:pt-14 sm:pb-16 bg-background"
//       >
//         <div className="mx-auto max-w-7xl px-5 lg:px-10">
//           <SectionHeading
//             eyebrow="Metal Finishes & Colour Collection"
//             title="Explore Our Metal Finishes"
//             description="Discover our selection of decorative metal finishes, from mirror and hairline textures to antique and matte appearances. Explore the samples and enquire about your preferred finish."
//           />

//           <p className="mt-4 sm:mt-5 text-center text-xs font-medium uppercase tracking-wider text-gold-deep">
//             Twelve client-approved finish samples — visual references only
//           </p>

//           <div className="mt-8 sm:mt-10 grid gap-6 sm:gap-8 lg:gap-10">
//             <Reveal as="div" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
//               {APPROVED_METAL_FINISHES.map((finish) => (
//                 <FinishCard
//                   key={finish.finId}
//                   finish={finish}
//                   onSelect={(finId, el) => openLightbox(finId, el)}
//                   onEnquire={(finId, displayName) => {
//                     onEnquireFinish?.(finId, displayName);
//                   }}
//                 />
//               ))}
//             </Reveal>
//           </div>

//           <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
//             <Button
//               asChild
//               size="lg"
//               className="rounded-full bg-gold text-ink hover:bg-gold/90 font-medium shadow-lg shadow-gold/25"
//             >
//               <a href="#quote">Request a Finish Quote</a>
//             </Button>
//           </div>
//         </div>
//       </section>

//       {/*
//         Lightbox dialog.
//         Implementation notes:
//         - tabIndex={-1} ensures the <dialog> itself is focusable so that
//           keyboard events (Arrow, Escape) fire on the element with onKeyDown.
//         - onCancel prevents the browser's native Escape→cancel→close sequence;
//           our handleKeyDown/closeLightbox is the single close path.
//         - showModal()/close() are driven by useEffect, not inline handlers,
//           so React state is always committed before the imperative call runs.
//         - The backdrop is a child <div> with onClick rather than relying on
//           the native ::backdrop pseudo-element, giving full pointer-event control.
//       */}
//       <dialog
//         ref={dialogRef}
//         tabIndex={-1}
//         onKeyDown={handleKeyDown}
//         onCancel={handleCancel}
//         aria-label={`Finish enlargement: ${finish?.displayName ?? ''}`}
//         aria-modal="true"
//         className="m-auto w-full max-w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-visible rounded-2xl border-none bg-transparent p-0 shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
//       >
//         {/* Backdrop — sits behind the content panel; click closes */}
//         <div
//           onClick={closeLightbox}
//           className="fixed inset-0 z-0 bg-ink/60 backdrop-blur-sm"
//           aria-hidden="true"
//         />

//         {/* Content panel */}
//         <div className="relative z-10 flex flex-col items-center justify-center bg-background border border-border rounded-2xl p-6 sm:p-8 shadow-2xl outline-none max-h-[90vh] overflow-y-auto">
//           <button
//             type="button"
//             onClick={closeLightbox}
//             aria-label="Close finish enlargement"
//             className="absolute top-4 right-4 rounded-full bg-white/90 border border-border p-2 text-ink hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-gold"
//           >
//             <X className="h-5 w-5" aria-hidden="true" />
//           </button>

//           <div className="relative flex-1 w-full flex items-center justify-center bg-white rounded-xl border border-border overflow-hidden min-h-[200px]">
//             <button
//               type="button"
//               onClick={() => setCurrent(prevIndex)}
//               aria-label="Previous finish"
//               className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border border-border p-2 text-ink hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-gold"
//             >
//               <ArrowLeft className="h-5 w-5" aria-hidden="true" />
//             </button>
//             {/* eslint-disable-next-line @next/next/no-img-element */}
//             <img
//               src={finish?.imagePath}
//               alt={finish ? `Enlarged view — ${finish.altText}` : ''}
//               width={1200}
//               height={1200}
//               loading="eager"
//               decoding="async"
//               className="max-w-full max-h-[60vh] object-contain mx-auto"
//             />
//             <button
//               type="button"
//               onClick={() => setCurrent(nextIndex)}
//               aria-label="Next finish"
//               className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border border-border p-2 text-ink hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-gold"
//             >
//               <ArrowRight className="h-5 w-5" aria-hidden="true" />
//             </button>
//           </div>

//           <div className="mt-6 text-center">
//             <h3 className="font-display text-xl font-medium sm:text-2xl text-foreground">
//               {finish?.displayName}
//             </h3>
//             <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
//               FIN ID: {finish?.finId}
//             </p>
//           </div>

//           <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
//             <span>Image {current + 1} of {APPROVED_METAL_FINISHES.length}</span>
//             <button
//               type="button"
//               onClick={() => setCurrent(prevIndex)}
//               aria-label="Previous finish"
//               className="underline underline-offset-2 hover:text-gold-deep"
//             >
//               Previous
//             </button>
//             <button
//               type="button"
//               onClick={() => setCurrent(nextIndex)}
//               aria-label="Next finish"
//               className="underline underline-offset-2 hover:text-gold-deep"
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       </dialog>
//     </>
//   );
// }




'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type UIEvent,
} from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  Maximize2,
  MessageSquare,
  Square,
  X,
} from 'lucide-react';

import type { MetalFinishCardData } from '@/lib/types';
import { getPublishedFinishAdditionalImages } from '@/lib/supabase/metal-finishes-gallery';

interface FinishCollectionProps {
  finishes: MetalFinishCardData[];
  onEnquireFinish?: (
    finId: string,
    displayName: string
  ) => void;
}

interface FinishCardProps {
  finish: MetalFinishCardData;
  selected: boolean;
  saved: boolean;
  compareDisabled: boolean;
  onCompare: (id: string) => void;
  onSave: (id: string) => void;
  onOpen: (
    id: string,
    trigger: HTMLElement
  ) => void;
  onEnquire: (finish: MetalFinishCardData) => void;
}

function appearanceLabel(name: string) {
  const value = name.toLowerCase();

  if (value.includes('hairline')) {
    return 'Hairline appearance';
  }

  if (value.includes('mirror')) {
    return 'Reflective appearance';
  }

  if (value.includes('antique')) {
    return 'Antique appearance';
  }

  if (value.includes('rustic')) {
    return 'Rustic appearance';
  }

  if (value.includes('satin')) {
    return 'Satin appearance';
  }

  if (value.includes('matte')) {
    return 'Matte appearance';
  }

  if (value.includes('brushed')) {
    return 'Brushed appearance';
  }

  return 'Decorative finish reference';
}

function FinishCard({
  finish,
  selected,
  saved,
  compareDisabled,
  onCompare,
  onSave,
  onOpen,
  onEnquire,
}: FinishCardProps) {
  return (
    <article
      data-fin-id={finish.finId}
      className="
        group flex h-full min-w-0 flex-col
        overflow-hidden rounded-2xl
        border border-[#e4ddd3]
        bg-[#faf8f4]
        shadow-[0_6px_22px_rgba(42,32,20,0.07)]
        transition-all duration-300
        hover:-translate-y-1
        hover:border-[#c9a96e]/60
        hover:shadow-[0_12px_30px_rgba(42,32,20,0.13)]
      "
    >
      {/* Product image */}
      <div
        className="
          relative aspect-[1.55/1]
          overflow-hidden bg-[#e3dfd8]
          sm:aspect-[16/10]
        "
      >
        <button
          type="button"
          onClick={(event) =>
            onOpen(
              finish.finId,
              event.currentTarget
            )
          }
          aria-label={`Enlarge ${finish.displayName}`}
          className="
            absolute inset-0 z-0 w-full
            cursor-zoom-in overflow-hidden
            focus-visible:outline
            focus-visible:outline-2
            focus-visible:outline-offset-[-3px]
            focus-visible:outline-[#c9a96e]
          "
        >
          <Image
            src={finish.imagePath}
            alt={finish.altText}
            fill
            sizes="
              (max-width:639px) 85vw,
              (max-width:1023px) 45vw,
              25vw
            "
            className="
              object-contain p-1
              transition-transform duration-500
              group-hover:scale-[1.035]
            "
          />

          <span
            className="
              pointer-events-none absolute
              bottom-2 right-2
              flex items-center gap-1
              rounded-full bg-black/65
              px-2.5 py-1.5 text-[10px]
              text-white opacity-0
              transition-opacity
              group-hover:opacity-100
              group-focus-within:opacity-100
            "
          >
            <Maximize2 className="h-3 w-3" />
            Enlarge
          </span>
        </button>

        {/* Compare */}
        <button
          type="button"
          aria-pressed={selected}
          aria-label={
            selected
              ? `Remove ${finish.displayName} from comparison`
              : `Add ${finish.displayName} to comparison`
          }
          disabled={compareDisabled && !selected}
          onClick={() => onCompare(finish.finId)}
          className="
            absolute left-3 top-3 z-10
            inline-flex min-h-9 items-center
            gap-1.5 rounded-md
            bg-black/60 px-2.5
            text-[11px] font-medium
            text-white backdrop-blur-sm
            transition-colors
            hover:bg-black/80
            disabled:cursor-not-allowed
            disabled:opacity-40
            focus-visible:outline
            focus-visible:outline-2
            focus-visible:outline-[#c9a96e]
          "
        >
          {selected ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Square className="h-3.5 w-3.5" />
          )}
          Compare
        </button>

        {/* Bookmark */}
        <button
          type="button"
          aria-pressed={saved}
          aria-label={
            saved
              ? `Remove saved finish ${finish.displayName}`
              : `Save ${finish.displayName} for this visit`
          }
          onClick={() => onSave(finish.finId)}
          className="
            absolute right-3 top-3 z-10
            flex h-9 w-9 items-center
            justify-center rounded-md
            bg-black/60 text-white
            backdrop-blur-sm
            transition-colors
            hover:bg-black/80
            focus-visible:outline
            focus-visible:outline-2
            focus-visible:outline-[#c9a96e]
          "
        >
          <Bookmark
            className="h-4 w-4"
            fill={saved ? '#c9a96e' : 'none'}
          />
        </button>
      </div>

      {/* Product information */}
      <div
        className="
          flex flex-1 flex-col
          px-3.5 pb-3.5 pt-3
          sm:px-4 sm:pb-4
        "
      >
        <div
          className="
            flex items-start
            justify-between gap-2
          "
        >
          <h3
            className="
              min-w-0 font-display
              text-[19px] font-medium
              leading-[1.2] tracking-tight
              text-[#201b15]
              sm:text-[21px]
            "
          >
            {finish.displayName}
          </h3>

          <span
            className="
              shrink-0 rounded-md
              bg-[#eae5dd] px-2 py-1
              text-[10px] font-medium
              text-[#62594c]
            "
          >
            {finish.finId}
          </span>
        </div>

        {/* Appearance */}
        <div
          className="
            mt-3 flex flex-wrap
            items-baseline
            gap-x-2 gap-y-1
            border-b border-[#e6ded2]
            pb-2 text-[12px]
          "
        >
          <span className="font-semibold text-[#25201a]">
            Appearance
          </span>

          <span className="text-[#a58a60]">
            |
          </span>

          <span className="text-[#665f56]">
            {finish.appearance ||
              appearanceLabel(finish.displayName)}
          </span>
        </div>

        {/* Applications */}
        <div
          className="
            mt-2 text-[12px]
            leading-[1.5] text-[#625b52]
          "
        >
          <span className="font-semibold text-[#25201a]">
            Applications
          </span>

          <span className="mx-2 text-[#a58a60]">
            |
          </span>

          {finish.applications ||
            'Confirm material and intended use on enquiry.'}
        </div>

        {/* Enquiry button */}
        {/* Removed Visual Sample, Finish Reference,
            and By Enquiry tags completely. */}
        <div className="mt-auto pt-4">
          <Link
            href="#quote"
            onClick={() => onEnquire(finish)}
            className="
              group/cta flex min-h-10
              w-full items-center
              justify-center gap-2
              rounded-full
              border border-[#c5a16a]
              px-3 py-2 text-center
              text-[12px] font-medium
              text-[#765020]
              transition-colors
              hover:bg-[#c9a96e]
              hover:text-[#171410]
              focus-visible:outline
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[#c9a96e]
            "
          >
            Enquire about this finish

            <ArrowRight
              className="
                h-3.5 w-3.5 shrink-0
                transition-transform
                group-hover/cta:translate-x-1
              "
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function FinishCollection({
  finishes,
  onEnquireFinish,
}: FinishCollectionProps) {
  const count = finishes.length;

  const [wideScreen, setWideScreen] = useState(true);
  const [desktopPage, setDesktopPage] = useState(0);

  const [mobileIndex, setMobileIndex] = useState(0);
  const mobileRailRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);

  const [modal, setModal] = useState<
    'zoom' | 'compare' | null
  >(null);

  const [zoomIndex, setZoomIndex] = useState(0);
  const [zoomImageUrl, setZoomImageUrl] = useState('');
  const [zoomAdditionalImages, setZoomAdditionalImages] =
    useState<string[]>([]);
  const [zoomGalleryLoading, setZoomGalleryLoading] =
    useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Desktop: 6 cards per page.
  // Tablet: 2 cards per page.
  useEffect(() => {
    const media = window.matchMedia(
      '(min-width: 1024px)'
    );

    const update = () => {
      setWideScreen(media.matches);
    };

    update();

    media.addEventListener('change', update);

    return () => {
      media.removeEventListener('change', update);
    };
  }, []);

  const pageSize = wideScreen ? 6 : 2;

  const pageCount = Math.ceil(count / pageSize);

  useEffect(() => {
    setDesktopPage(0);
  }, [pageSize]);

  const safePage = Math.min(
    desktopPage,
    Math.max(0, pageCount - 1)
  );

  const visibleFinishes = finishes.slice(
    safePage * pageSize,
    (safePage + 1) * pageSize
  );

  // Comparison
  const toggleCompare = useCallback((id: string) => {
    setSelected((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (value) => value !== id
        );
      }

      if (previous.length >= 3) {
        return previous;
      }

      return [...previous, id];
    });
  }, []);

  // Bookmark: current session only
  const toggleSave = useCallback((id: string) => {
    setSaved((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id]
    );
  }, []);

  // Image enlargement
  const openZoom = useCallback(
    (id: string, trigger: HTMLElement) => {
      const index = finishes.findIndex(
        (item) => item.finId === id
      );

      if (index < 0) return;

      triggerRef.current = trigger;
      setZoomIndex(index);
      setModal('zoom');
    },
    [finishes]
  );

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  // Native dialog behavior
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    const oldOverflow =
      document.body.style.overflow;

    if (modal) {
      if (!dialog.open) {
        dialog.showModal();
      }

      document.body.style.overflow = 'hidden';
      dialog.focus();
    } else {
      if (dialog.open) {
        dialog.close();
      }

      triggerRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [modal]);

  const previousZoom = useCallback(() => {
    if (count === 0) return;

    setZoomIndex(
      (index) => (index - 1 + count) % count
    );
  }, [count]);

  const nextZoom = useCallback(() => {
    if (count === 0) return;

    setZoomIndex(
      (index) => (index + 1) % count
    );
  }, [count]);

  const handleModalKeyboard = (
    event: KeyboardEvent<HTMLDialogElement>
  ) => {
    if (modal !== 'zoom') return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previousZoom();
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextZoom();
    }
  };

  // Mobile swipe carousel
  const scrollToMobileCard = useCallback(
    (requestedIndex: number) => {
      const rail = mobileRailRef.current;

      if (!rail || count === 0) return;

      const index =
        (requestedIndex + count) % count;

      const first = rail.children[0] as
        | HTMLElement
        | undefined;

      const target = rail.children[index] as
        | HTMLElement
        | undefined;

      if (!first || !target) return;

      rail.scrollTo({
        left:
          target.offsetLeft -
          first.offsetLeft,
        behavior: 'smooth',
      });

      setMobileIndex(index);
    },
    [count]
  );

  const handleMobileScroll = (
    event: UIEvent<HTMLDivElement>
  ) => {
    const rail = event.currentTarget;

    if (rail.children.length < 2) return;

    const first =
      rail.children[0] as HTMLElement;

    const second =
      rail.children[1] as HTMLElement;

    const step =
      second.offsetLeft - first.offsetLeft;

    if (step <= 0) return;

    const index = Math.round(
      rail.scrollLeft / step
    );

    setMobileIndex(
      Math.max(
        0,
        Math.min(index, count - 1)
      )
    );
  };

  // Existing enquiry callback
  const handleEnquire = (
    finish: MetalFinishCardData
  ) => {
    onEnquireFinish?.(
      finish.finId,
      finish.displayName
    );
  };

  const cardProps = (finish: MetalFinishCardData) => ({
    finish,
    selected: selected.includes(finish.finId),
    saved: saved.includes(finish.finId),
    compareDisabled: selected.length >= 3,
    onCompare: toggleCompare,
    onSave: toggleSave,
    onOpen: openZoom,
    onEnquire: handleEnquire,
  });

  const zoomFinish = finishes[zoomIndex];
  const zoomFinishId = zoomFinish?.id;
  const zoomFinishImage = zoomFinish?.imagePath;

  const comparedFinishes = finishes.filter(
    (finish) => selected.includes(finish.finId)
  );

  useEffect(() => {
    if (modal !== 'zoom' || !zoomFinishId || !zoomFinishImage) {
      setZoomAdditionalImages([]);
      setZoomGalleryLoading(false);
      return;
    }

    let cancelled = false;
    setZoomImageUrl(zoomFinishImage);
    setZoomAdditionalImages([]);
    setZoomGalleryLoading(true);

    getPublishedFinishAdditionalImages(zoomFinishId)
      .then((urls) => {
        if (!cancelled) setZoomAdditionalImages(urls);
      })
      .finally(() => {
        if (!cancelled) setZoomGalleryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [modal, zoomFinishId, zoomFinishImage]);

  const zoomImages = [
    { url: zoomFinish?.imagePath ?? '', label: 'Main image' },
    ...zoomAdditionalImages.map((url, index) => ({
      url,
      label: `Detail image ${index + 1}`,
    })),
  ].filter((item) => Boolean(item.url));

  return (
    <>
      {/* FULL-WIDTH FINISH SECTION */}
      <section
        id="finishes"
        aria-labelledby="finish-board-heading"
        className="
          relative left-1/2
          w-screen max-w-none
          -translate-x-1/2
          isolate scroll-mt-24
          overflow-hidden
          bg-white text-[#201b15]
        "
      >
        {/* Edge-to-edge desktop split */}
        <div
          className="
            relative z-10 w-full
            lg:grid
            lg:grid-cols-[minmax(0,35%)_minmax(0,65%)]
          "
        >
          {/* LEFT — DARK EDITORIAL PANEL */}

          <div
            className="
    relative isolate
    overflow-hidden
    bg-white
    px-5 pb-9 pt-12
    text-[#201b15]
    sm:px-8 sm:pb-12 sm:pt-14
    lg:flex lg:min-h-[810px]
    lg:flex-col lg:justify-center
    lg:border-r lg:border-[#e8e2d8]
    lg:pl-10 lg:pr-5 lg:py-14
    xl:pl-14 xl:pr-6
  "
          >


            <div className="relative z-10">
              {/* Eyebrow */}
              <div
                className="
                  flex items-center gap-3
                "
              >
                <p
                  className="
                    text-[10px] font-semibold
                    uppercase tracking-[0.26em]
                    text-[#d8b875]
                    sm:text-[11px]
                  "
                >
                  Architect Selection Board
                </p>

                <span
                  className="
                    h-px w-8 shrink-0
                    bg-[#c9a96e]/80
                  "
                  aria-hidden="true"
                />
              </div>

              {/* Headline */}
              <h2
                id="finish-board-heading"
                className="
                  mt-6 max-w-[560px]
                  font-display font-medium
                  text-[clamp(2.25rem,4.2vw,3.65rem)]
                  leading-[1.08]
                  tracking-tight
                  text-[#201b15]
                "
              >
                Finish Selections
                <br />
                for Designers
                <br />
                <span className="text-[#c9a96e]">
                  &amp;
                </span>{' '}
                Architects
              </h2>

              {/* Description */}
              <p
                className="
                  mt-5 max-w-none
                  text-[14px] leading-[1.75]
                  text-[#514a42]
                  sm:text-base
                "
              >
                Explore our collection of {count} approved
                metal finish references for architectural
                and decorative projects. Compare appearances,
                review finish IDs and enquire about suitability
                for your requirements.
              </p>

              {/* Benefits */}
              <div
                className="
                  mt-7 grid grid-cols-3
                  gap-2 border-t
                  border-[#e8e2d8] pt-5
                  sm:gap-4
                "
              >
                <div className="min-w-0">
                  <Layers
                    className="h-5 w-5 text-[#d8b875]"
                    aria-hidden="true"
                  />

                  <p
                    className="
                      mt-2 text-[11px]
                      leading-[1.45]
                      text-white/85
                    "
                  >
                    {count} Finish
                    <br />
                    References
                  </p>
                </div>

                <div
                  className="
                    min-w-0 border-l
                    border-[#e8e2d8]
                    pl-3 sm:pl-4
                  "
                >
                  <Maximize2
                    className="h-5 w-5 text-[#94713d]"
                    aria-hidden="true"
                  />

                  <p
                    className="
                      mt-2 text-[11px]
                      leading-[1.45]
                      text-white/85
                    "
                  >
                    Compare
                    <br />
                    Appearances
                  </p>
                </div>

                <div
                  className="
                    min-w-0 border-l
                    border-white/20
                    pl-3 sm:pl-4
                  "
                >
                  <MessageSquare
                    className="h-5 w-5 text-[#d8b875]"
                    aria-hidden="true"
                  />

                  <p
                    className="
                      mt-2 text-[11px]
                      leading-[1.45]
                      text-white/85
                    "
                  >
                    Enquiry-Based
                    <br />
                    Selection
                  </p>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="#quote"
                className="
                  group mt-8 flex min-h-12
                  w-fit max-w-full
                  items-center justify-center
                  gap-4 rounded-full
                  bg-gradient-to-r
                  from-[#f0ce81]
                  to-[#bc914a]
                  px-6 py-3
                  text-center text-sm
                  font-semibold text-[#1b1712]
                  shadow-[0_10px_28px_rgba(0,0,0,0.16)]
                  transition-all duration-300
                  hover:brightness-110
                  focus-visible:outline
                  focus-visible:outline-2
                  focus-visible:outline-offset-4
                  focus-visible:outline-[#f0ce81]
                "
              >
                Enquire About Finishes

                <ArrowRight
                  className="
                    h-4 w-4 shrink-0
                    transition-transform
                    group-hover:translate-x-1
                  "
                />
              </Link>

              <a
                href="#finish-board"
                className="
                  mt-4 inline-flex
                  items-center gap-2
                  text-xs font-medium
                  text-[#d8b875]
                  underline-offset-4
                  hover:underline
                "
              >
                Browse the Finish Selection
                <ArrowRight className="h-3.5 w-3.5" />
              </a>

              <p
                className="
                  mt-6 max-w-[410px]
                  text-[11px] leading-relaxed
                  text-[#756d63]
                "
              >
                Photographs are visual references only.
                Availability, substrate suitability and
                technical specifications are confirmed
                during enquiry.
              </p>
            </div>
          </div>

          {/* RIGHT — WHITE FINISH BOARD */}
          <div
            id="finish-board"
            className="
              relative min-w-0
              bg-white
            "
          >
            {/* MOBILE: Dark-to-white vertical blend.
                DESKTOP: Dark-to-white horizontal blend. */}

            {/* Content sits above gradient */}
            <div
              className="
                relative z-10 min-w-0
                px-4 pb-10 pt-8
                sm:px-7 sm:pb-10 sm:pt-10
                lg:flex lg:h-full
                lg:flex-col lg:justify-center
                lg:pb-12 lg:pt-12
                lg:pl-6 lg:pr-6
                xl:pl-7 xl:pr-10
              "
            >
              {/* Board heading */}
              <div
                className="
                  mb-5 flex flex-wrap
                  items-end justify-between
                  gap-2
                "
              >
                <div>
                  <p
                    className="
                      text-[10px] font-semibold
                      uppercase tracking-[0.2em]
                      text-[#9a7139]
                    "
                  >
                    Finish Library
                  </p>

                  <h3
                    className="
                      mt-1 font-display
                      text-2xl text-[#26201a]
                    "
                  >
                    Explore the Collection
                  </h3>
                </div>

                <span
                  className="
                    text-xs text-[#756b60]
                  "
                >
                  {count} visual references
                </span>
              </div>

              {/* TABLET / DESKTOP GRID */}
              <div
                className="
                  hidden min-w-0
                  grid-cols-2 gap-4
                  sm:grid
                  lg:grid-cols-3
                  lg:gap-4
                  xl:gap-5
                "
                aria-label="Metal finish selection cards"
              >
                {visibleFinishes.map((finish) => (
                  <FinishCard
                    key={finish.finId}
                    {...cardProps(finish)}
                  />
                ))}
              </div>

              {/* MOBILE CAROUSEL */}
              <div
                ref={mobileRailRef}
                onScroll={handleMobileScroll}
                aria-label="Swipe through metal finish samples"
                className="
                  relative -mr-4 flex
                  snap-x snap-mandatory
                  gap-3 overflow-x-auto
                  pb-3 pr-8
                  [scrollbar-width:none]
                  [&::-webkit-scrollbar]:hidden
                  sm:hidden
                "
              >
                {finishes.map((finish) => (
                  <div
                    key={finish.finId}
                    className="
                      w-[87%] shrink-0
                      snap-start
                    "
                  >
                    <FinishCard
                      {...cardProps(finish)}
                    />
                  </div>
                ))}
              </div>

              {/* Selected comparison */}
              {selected.length > 0 && (
                <div
                  className="
                    mt-5 flex flex-wrap
                    items-center justify-between
                    gap-3 rounded-xl
                    border border-[#d5c3a7]
                    bg-[#fbf8f2]
                    px-4 py-3
                  "
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {selected.length} of 3 finishes selected
                    </p>

                    <p
                      className="
                        mt-0.5 text-xs
                        text-[#766d61]
                      "
                    >
                      Select at least two for visual comparison.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelected([])}
                      className="
                        text-xs underline
                        text-[#665d52]
                      "
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      disabled={selected.length < 2}
                      onClick={(event) => {
                        triggerRef.current =
                          event.currentTarget;

                        setModal('compare');
                      }}
                      className="
                        rounded-full
                        bg-[#8b672c]
                        px-4 py-2
                        text-xs font-semibold
                        text-white
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >
                      Compare Selected
                    </button>
                  </div>
                </div>
              )}

              {/* TABLET / DESKTOP PAGINATION */}
              <div
                className="
                  mt-7 hidden
                  items-center justify-between
                  gap-3 border-t
                  border-[#d5cbbb]
                  pt-5 sm:flex
                "
              >
                <p
                  className="
                    shrink-0 font-display
                    text-xl text-[#8b672c]
                  "
                >
                  {String(safePage + 1).padStart(2, '0')}

                  <span className="mx-1 text-[#9b9286]">
                    /
                  </span>

                  <span className="text-[#736a60]">
                    {String(pageCount).padStart(2, '0')}
                  </span>
                </p>

                <div
                  className="flex items-center gap-2"
                  aria-label="Finish board pagination"
                >
                  {Array.from(
                    { length: pageCount },
                    (_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setDesktopPage(index)}
                        aria-label={`Show finish page ${index + 1}`}
                        aria-current={
                          safePage === index
                            ? 'step'
                            : undefined
                        }
                        className={
                          safePage === index
                            ? 'h-2.5 w-2.5 rounded-full bg-[#bd8b32]'
                            : 'h-2.5 w-2.5 rounded-full bg-[#beb7ae] hover:bg-[#8b672c]'
                        }
                      />
                    )
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Previous finish page"
                    onClick={() => {
                      if (pageCount > 0) {
                        setDesktopPage(
                          (safePage - 1 + pageCount) %
                          pageCount
                        );
                      }
                    }}
                    className="
                      flex h-10 w-10
                      items-center justify-center
                      rounded-full
                      border border-[#978673]
                      text-[#5b4a36]
                      transition-colors
                      hover:bg-[#e4d6c0]
                    "
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    aria-label="Next finish page"
                    onClick={() => {
                      if (pageCount > 0) {
                        setDesktopPage(
                          (safePage + 1) % pageCount
                        );
                      }
                    }}
                    className="
                      flex h-10 w-10
                      items-center justify-center
                      rounded-full
                      bg-gradient-to-br
                      from-[#bd934a]
                      to-[#755018]
                      text-white
                      transition-transform
                      hover:scale-105
                    "
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* MOBILE PAGINATION */}
              <div
                className="
                  mt-5 flex items-center
                  justify-between gap-2
                  sm:hidden
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    scrollToMobileCard(mobileIndex - 1)
                  }
                  aria-label="Previous finish"
                  className="
                    flex h-11 w-11
                    shrink-0 items-center
                    justify-center rounded-full
                    border border-[#5f5243]
                    text-[#201b15]
                  "
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="min-w-0 text-center">
                  <p className="font-display text-xl">
                    {String(mobileIndex + 1).padStart(2, '0')}

                    <span className="mx-1 text-[#9c9488]">
                      /
                    </span>

                    {String(count).padStart(2, '0')}
                  </p>

                  <div
                    className="
                      mt-2 flex flex-wrap
                      justify-center gap-1.5
                    "
                  >
                    {finishes.map((finish, index) => (
                      <button
                        type="button"
                        key={finish.finId}
                        aria-label={`Go to finish ${index + 1}`}
                        aria-current={
                          mobileIndex === index
                            ? 'step'
                            : undefined
                        }
                        onClick={() =>
                          scrollToMobileCard(index)
                        }
                        className="
                          flex h-5 w-3
                          items-center justify-center
                        "
                      >
                        <span
                          className={
                            mobileIndex === index
                              ? 'h-2 w-2 rounded-full bg-[#b9882c]'
                              : 'h-2 w-2 rounded-full bg-[#bbb5ad]'
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    scrollToMobileCard(mobileIndex + 1)
                  }
                  aria-label="Next finish"
                  className="
                    flex h-11 w-11
                    shrink-0 items-center
                    justify-center rounded-full
                    bg-gradient-to-br
                    from-[#bd934a]
                    to-[#755018]
                    text-white
                  "
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIGHTBOX / COMPARE DIALOG */}
      <dialog
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={handleModalKeyboard}
        onCancel={(event) => {
          event.preventDefault();
          closeModal();
        }}
        aria-label={
          modal === 'compare'
            ? 'Compare selected metal finishes'
            : 'Enlarged metal finish photograph'
        }
        className="
          fixed inset-0 z-[100]
          m-auto max-h-[92dvh]
          w-[min(96vw,1050px)]
          overflow-y-auto
          rounded-2xl border-0
          bg-[#faf8f3] p-0
          text-[#201b15]
          shadow-2xl
          backdrop:bg-black/75
          backdrop:backdrop-blur-sm
        "
      >
        <div className="p-4 sm:p-7">
          <div
            className="
              mb-4 flex items-start
              justify-between gap-4
            "
          >
            <div>
              <p
                className="
                  text-[10px] font-semibold
                  uppercase tracking-[0.2em]
                  text-[#9a7139]
                "
              >
                Metal Finish Library
              </p>

              <h3
                className="
                  mt-1 font-display
                  text-2xl sm:text-3xl
                "
              >
                {modal === 'compare'
                  ? 'Compare Finishes'
                  : zoomFinish?.displayName}
              </h3>
            </div>

            <button
              type="button"
              onClick={closeModal}
              aria-label="Close dialog"
              className="
                flex h-10 w-10
                shrink-0 items-center
                justify-center rounded-full
                border border-[#d8cfc2]
                hover:bg-[#eee6db]
              "
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Zoom view */}
          {modal === 'zoom' && zoomFinish && (
            <>
              <div
                className="
                  relative flex h-[46dvh]
                  items-center justify-center
                  overflow-hidden rounded-xl
                  bg-[#e9e5df]
                  sm:h-[58dvh]
                "
              >
                <Image
                  src={zoomImageUrl || zoomFinish.imagePath}
                  alt={zoomFinish.altText}
                  fill
                  sizes="(max-width:640px) 96vw, 900px"
                  className="object-contain p-3"
                />
              </div>

              {(zoomGalleryLoading || zoomAdditionalImages.length > 0) && (
                <div className="mt-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#9a7139]">
                    {zoomGalleryLoading
                      ? 'Loading additional views…'
                      : `${zoomAdditionalImages.length} additional view${
                          zoomAdditionalImages.length === 1 ? '' : 's'
                        }`}
                  </p>

                  {zoomAdditionalImages.length > 0 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                      {zoomImages.map((image, index) => {
                        const active =
                          (zoomImageUrl || zoomFinish.imagePath) === image.url;

                        return (
                          <button
                            key={`${image.url}-${index}`}
                            type="button"
                            onClick={() => setZoomImageUrl(image.url)}
                            aria-label={`View ${image.label}`}
                            aria-pressed={active}
                            className={`
                              relative h-16 w-16 shrink-0
                              overflow-hidden rounded-lg border-2
                              transition-colors
                              ${
                                active
                                  ? 'border-[#8b672c]'
                                  : 'border-transparent hover:border-[#b9a58a]'
                              }
                            `}
                          >
                            <Image
                              src={image.url}
                              alt=""
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div
                className="
                  mt-4 flex items-center
                  justify-between gap-3
                "
              >
                <button
                  type="button"
                  onClick={previousZoom}
                  aria-label="Previous finish image"
                  className="
                    flex h-10 w-10
                    items-center justify-center
                    rounded-full
                    border border-[#b9a58a]
                  "
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <p className="text-center text-xs text-[#756b60]">
                  {zoomFinish.finId}
                  {' · '}
                  {zoomIndex + 1} of {count}
                </p>

                <button
                  type="button"
                  onClick={nextZoom}
                  aria-label="Next finish image"
                  className="
                    flex h-10 w-10
                    items-center justify-center
                    rounded-full
                    bg-[#8b672c] text-white
                  "
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <Link
                href="#quote"
                onClick={() => {
                  handleEnquire(zoomFinish);
                  closeModal();
                }}
                className="
                  mt-4 flex min-h-11
                  items-center justify-center
                  gap-2 rounded-full
                  bg-[#8b672c] px-5 py-3
                  text-sm font-semibold
                  text-white
                "
              >
                Enquire about this finish

                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}

          {/* Compare view */}
          {modal === 'compare' && (
            <>
              <p
                className="
                  mb-4 text-sm leading-relaxed
                  text-[#756b60]
                "
              >
                Compare the photographed appearance of
                your selected finishes. Technical
                compatibility and performance are not
                determined by these photographs.
              </p>

              <div
                className="
                  grid gap-4
                  sm:grid-cols-2
                  lg:grid-cols-3
                "
              >
                {comparedFinishes.map((finish) => (
                  <div
                    key={finish.finId}
                    className="
                      overflow-hidden rounded-xl
                      border border-[#e1d8ca]
                      bg-white
                    "
                  >
                    <div
                      className="
                        relative aspect-[4/3]
                        bg-[#e5e0d7]
                      "
                    >
                      <Image
                        src={finish.imagePath}
                        alt={finish.altText}
                        fill
                        sizes="
                          (max-width:640px) 90vw,
                          32vw
                        "
                        className="object-contain p-2"
                      />
                    </div>

                    <div className="p-3">
                      <h4
                        className="
                          font-display
                          text-lg font-medium
                        "
                      >
                        {finish.displayName}
                      </h4>

                      <p className="mt-1 text-xs text-[#756b60]">
                        {finish.finId}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
