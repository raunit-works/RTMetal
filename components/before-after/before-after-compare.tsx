'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BeforeAfterCompare({
  beforeImage,
  afterImage,
  title,
  verified,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 560px',
  className,
}: {
  beforeImage: string;
  afterImage: string;
  title: string;
  verified: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const [position, setPosition] = React.useState(50);
  const descriptionId = React.useId();
  const beforeLabel = verified ? 'Before' : 'Worn Surface';
  const afterLabel = verified ? 'After' : 'Decorative Finish';
  const beforeAlt = verified
    ? `Before treatment: ${title}`
    : `Illustrative worn metal surface for ${title}`;
  const afterAlt = verified
    ? `After treatment: ${title}`
    : `Illustrative decorative metal finish for ${title}`;

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
          <span className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-full border border-[#d8a548]/35 bg-[#d8a548]/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#F4D699] backdrop-blur-sm">
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
        <span>
          {verified
            ? 'Both images document the same object before and after the finishing work.'
            : 'Illustrative surface comparison only. These images do not document the same object.'}
        </span>
      </p>
    </div>
  );
}
