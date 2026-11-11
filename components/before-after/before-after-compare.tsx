'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ComparisonVariant = 'default' | 'handle';
type ComparisonTheme = 'dark' | 'light';

export function BeforeAfterCompare({
  beforeImage,
  afterImage,
  title,
  verified,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 560px',
  className,
  variant = 'default',
  theme = 'dark',
  labels,
  aspectClassName,
  showNote = true,
}: {
  beforeImage: string;
  afterImage: string;
  title: string;
  verified: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  variant?: ComparisonVariant;
  theme?: ComparisonTheme;
  labels?: { before: string; after: string };
  aspectClassName?: string;
  showNote?: boolean;
}) {
  const [position, setPosition] = React.useState(50);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const draggingRef = React.useRef(false);
  const descriptionId = React.useId();

  const beforeLabel = labels?.before ?? (verified ? 'Before' : 'Worn Surface');
  const afterLabel = labels?.after ?? (verified ? 'After' : 'Decorative Finish');
  const beforeAlt = verified
    ? `Before treatment: ${title}`
    : `Illustrative original surface for ${title}`;
  const afterAlt = verified
    ? `After treatment: ${title}`
    : `Illustrative example finish for ${title}`;

  const disclosure = verified
    ? 'Both images document the same object before and after the finishing work.'
    : 'Illustrative surface comparison only. These images do not document the same object.';

  const clampPosition = (value: number) =>
    Math.min(100, Math.max(0, Math.round(value)));

  const updateFromClientX = React.useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(clampPosition(next));
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromClientX(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    updateFromClientX(event.clientX);
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 2;
    let next: number | null = null;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      next = position - step;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      next = position + step;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = 100;
    }

    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    setPosition(clampPosition(next));
  };

  if (variant === 'handle') {
    const light = theme === 'light';

    return (
      <div className={cn('group/compare', className)}>
        <div
          ref={containerRef}
          className={cn(
            'relative isolate w-full select-none overflow-hidden rounded-[16px] border',
            light ? 'border-[#E4D9C6] bg-[#E9E3D8]' : 'border-[#d8a548]/25 bg-[#17181a]',
            aspectClassName ?? 'aspect-[16/10]'
          )}
        >
          <Image
            src={afterImage}
            alt={afterAlt}
            fill
            priority={priority}
            sizes={sizes}
            className="pointer-events-none object-cover object-center"
            draggable={false}
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden';
            }}
          />

          <div
            className="pointer-events-none absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            aria-hidden="true"
          >
            <Image
              src={beforeImage}
              alt=""
              fill
              priority={priority}
              sizes={sizes}
              className="object-cover object-center"
              draggable={false}
              onError={(event) => {
                event.currentTarget.style.visibility = 'hidden';
              }}
            />
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-black/45 to-transparent"
          />

          <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#171717] shadow-sm backdrop-blur-sm sm:left-4 sm:top-4">
            {beforeLabel}
          </span>
          <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-full bg-[#C18B2F] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm sm:right-4 sm:top-4">
            {afterLabel}
          </span>

          <div
            role="slider"
            tabIndex={0}
            aria-label={`Compare before and after images for ${title}`}
            aria-describedby={descriptionId}
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={position}
            aria-valuetext={`${position}% ${beforeLabel.toLowerCase()} visible`}
            data-comparison-handle=""
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            onLostPointerCapture={() => {
              draggingRef.current = false;
            }}
            onKeyDown={handleKeyDown}
            className="group/handle absolute inset-y-0 z-30 w-11 -translate-x-1/2 cursor-ew-resize touch-none outline-none"
            style={{ left: `${position}%` }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.35)]"
            />
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-[0_8px_20px_rgba(0,0,0,0.22)] transition group-focus-visible/handle:ring-2 group-focus-visible/handle:ring-[#C18B2F] group-focus-visible/handle:ring-offset-2',
                light ? 'border-[#C18B2F]/60 text-[#9A6B1F]' : 'border-[#F4D699]/70 text-[#D8A548]'
              )}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              <span className="mx-0.5 h-4 w-px bg-[#C18B2F]/40" />
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </span>
          </div>

          <p id={descriptionId} className="sr-only">
            {disclosure}
          </p>
        </div>

        {showNote && (
          <p
            className={cn(
              'mt-3 flex items-start gap-2 text-[11px] leading-relaxed',
              light ? 'text-[#7B766C]' : 'text-[#8F8D87]'
            )}
          >
            <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C18B2F]" />
            <span>{disclosure}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('group/compare', className)}>
      <div className="relative isolate overflow-hidden rounded-2xl border border-[#d8a548]/25 bg-[#17181a] shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/11]">
          <Image
            src={afterImage}
            alt={afterAlt}
            fill
            priority={priority}
            sizes={sizes}
            className="pointer-events-none select-none object-cover object-center"
            draggable={false}
          />

          <div
            className="pointer-events-none absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            aria-hidden="true"
          >
            <Image
              src={beforeImage}
              alt=""
              fill
              priority={priority}
              sizes={sizes}
              className="select-none object-cover object-center"
              draggable={false}
            />
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-black/55 to-transparent"
          />

          <span className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#F7F4EF] backdrop-blur-sm">
            {beforeLabel}
          </span>
          <span className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-full border border-[#d8a548]/40 bg-[#d8a548]/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#F4D699] backdrop-blur-sm">
            {afterLabel}
          </span>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 z-20 w-[2px] -translate-x-1/2 bg-[#F7F4EF] shadow-[0_0_14px_rgba(0,0,0,0.45)]"
            style={{ left: `${position}%` }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#F4D699]/70 bg-[#101112] text-[#D8A548] shadow-[0_8px_22px_rgba(0,0,0,0.45)]"
            style={{ left: `${position}%` }}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            <span className="mx-0.5 h-4 w-px bg-[#d8a548]/40" />
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={position}
            onChange={(event) => setPosition(Number(event.currentTarget.value))}
            aria-label={`Compare before and after images for ${title}`}
            aria-describedby={descriptionId}
            aria-valuetext={`${position}% ${beforeLabel.toLowerCase()} visible`}
            className="peer absolute inset-0 z-30 h-full w-full cursor-ew-resize touch-none opacity-0 focus-visible:outline-none"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-40 rounded-2xl ring-2 ring-inset ring-[#D8A548] opacity-0 transition-opacity peer-focus-visible:opacity-100"
          />
        </div>
      </div>

      <p
        id={descriptionId}
        className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-[#8F8D87]"
      >
        <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D8A548]" />
        <span>{disclosure}</span>
      </p>
    </div>
  );
}
