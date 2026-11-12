'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TransformationPreviewCard } from './transformation-preview-card';
import type { BeforeAfterProject } from '@/lib/types';

export function TransformationCarousel({
  projects,
}: {
  projects: BeforeAfterProject[];
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const stepRef = React.useRef(0);
  const reduceMotion = useReducedMotion();

  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(projects.length > 1);
  const [range, setRange] = React.useState({
    start: 1,
    end: Math.min(projects.length, 3),
  });

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;

    const sync = () => {
      const firstCard = track.firstElementChild as HTMLElement | null;
      const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = firstCard
        ? firstCard.getBoundingClientRect().width + gap
        : track.clientWidth;

      stepRef.current = step || track.clientWidth;

      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      setCanScrollPrev(track.scrollLeft > 4);
      setCanScrollNext(track.scrollLeft < maxScroll - 4);

      const visible = Math.max(
        1,
        Math.min(projects.length, Math.round((track.clientWidth + gap) / (step || 1)))
      );
      const startIndex = Math.min(
        projects.length - 1,
        Math.max(0, Math.round(track.scrollLeft / (step || 1)))
      );

      setRange({
        start: startIndex + 1,
        end: Math.min(projects.length, startIndex + visible),
      });
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        sync();
      });
    };

    sync();
    track.addEventListener('scroll', onScroll, { passive: true });
    const resizeObserver = new ResizeObserver(sync);
    resizeObserver.observe(track);

    return () => {
      track.removeEventListener('scroll', onScroll);
      resizeObserver.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [projects.length]);

  const scrollBySlide = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * (stepRef.current || track.clientWidth),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  if (projects.length === 0) return null;

  const showControls = projects.length > 1;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Before and after transformation projects"
    >
      <div
        ref={trackRef}
        className="-mx-1 flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto overscroll-x-contain scroll-smooth px-1 pb-2 [scrollbar-width:none] lg:gap-6 [&::-webkit-scrollbar]:hidden"
        style={{ scrollBehavior: reduceMotion ? 'auto' : undefined }}
      >
        {projects.map((project, index) => (
          <div
            key={project.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${projects.length}`}
            className="w-full shrink-0 snap-start basis-full sm:basis-[calc((100%-20px)/2)] lg:basis-[calc((100%-48px)/3)]"
          >
            <TransformationPreviewCard project={project} priority={index < 2} />
          </div>
        ))}
      </div>

      {showControls && (
        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A8478]" aria-live="polite">
            {String(range.start).padStart(2, '0')}
            {range.end > range.start ? `–${String(range.end).padStart(2, '0')}` : ''}
            <span className="mx-1.5 text-[#C9C1B2]">/</span>
            {String(projects.length).padStart(2, '0')}
          </p>

          <div className="flex items-center gap-2.5 sm:justify-end">
            <button
              type="button"
              onClick={() => scrollBySlide(-1)}
              disabled={!canScrollPrev}
              aria-label="Previous transformation projects"
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C18B2F]',
                canScrollPrev
                  ? 'border-[#C18B2F]/40 text-[#9A6B1F] hover:border-[#C18B2F] hover:bg-[#F7F0E3]'
                  : 'cursor-not-allowed border-[#EAE4DA] text-[#C9C1B2]'
              )}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollBySlide(1)}
              disabled={!canScrollNext}
              aria-label="Next transformation projects"
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C18B2F]',
                canScrollNext
                  ? 'border-[#C18B2F]/40 text-[#9A6B1F] hover:border-[#C18B2F] hover:bg-[#F7F0E3]'
                  : 'cursor-not-allowed border-[#EAE4DA] text-[#C9C1B2]'
              )}
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
