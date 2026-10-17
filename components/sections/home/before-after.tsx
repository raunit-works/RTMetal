'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, GripVertical } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

const BEFORE_IMAGE =
  'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=1200';
const AFTER_IMAGE =
  'https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=1200';

function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = React.useState(50);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);

  const updatePosition = React.useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = (x / rect.width) * 100;
    setSliderPosition(Math.max(5, Math.min(95, pct)));
  }, []);

  const onMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      updatePosition(e.clientX);

      const onMouseMove = (ev: MouseEvent) => {
        if (isDragging.current) updatePosition(ev.clientX);
      };
      const onMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [updatePosition]
  );

  const onTouchStart = React.useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      isDragging.current = true;
      updatePosition(touch.clientX);

      const onTouchMove = (ev: TouchEvent) => {
        if (isDragging.current && ev.touches[0]) {
          ev.preventDefault();
          updatePosition(ev.touches[0].clientX);
        }
      };
      const onTouchEnd = () => {
        isDragging.current = false;
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };

      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    },
    [updatePosition]
  );

  // Keyboard accessibility
  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSliderPosition((p) => Math.max(5, p - 5));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSliderPosition((p) => Math.min(95, p + 5));
      }
    },
    []
  );

  // Click on container area to move slider
  const onContainerClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (isDragging.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] cursor-ew-resize select-none overflow-hidden rounded-sm sm:aspect-[16/11]"
      onClick={onContainerClick}
      aria-label="Before and after metal restoration comparison slider"
      role="img"
    >
      {/* AFTER image (full width, bottom) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={AFTER_IMAGE}
        alt="After: premium metal coating finish"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* BEFORE image (clipped on left) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BEFORE_IMAGE}
          alt="Before: worn and weathered metal surface"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_16px_rgba(255,255,255,0.6)]"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        aria-hidden="true"
      />

      {/* Drag handle */}
      <div
        className="absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 transition-transform duration-150 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8a6c3e]"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onKeyDown={onKeyDown}
        role="slider"
        aria-label="Drag to compare before and after"
        aria-valuemin={5}
        aria-valuemax={95}
        aria-valuenow={Math.round(sliderPosition)}
        tabIndex={0}
      >
        <GripVertical className="h-5 w-5 text-[#8a6c3e]" aria-hidden="true" />
      </div>

      {/* BEFORE label */}
      <div className="pointer-events-none absolute bottom-4 left-4">
        <span className="rounded-sm bg-[#1a1714]/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
          Before
        </span>
      </div>

      {/* AFTER label */}
      <div className="pointer-events-none absolute bottom-4 right-4">
        <span className="rounded-sm bg-[#1a1714]/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
          After
        </span>
      </div>
    </div>
  );
}

export function BeforeAfterSection() {
  return (
    <section
      id="before-after"
      className="bg-[#faf8f4] py-16 sm:py-20"
      aria-label="Before and after transformation showcase"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
          
          {/* Left: Text content */}
          <Reveal>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8a6c3e]">
              Before / After
              <span className="h-px w-8 bg-[#8a6c3e]" aria-hidden="true" />
            </p>

            <h2 className="mt-5 font-display text-[clamp(2.4rem,4.5vw,3.4rem)] font-medium leading-[1.04] tracking-tight text-[#1a1714]">
              Restoration
              <br />
              That Reveals
              <br />
              New Life.
            </h2>

            <p className="mt-6 max-w-[380px] text-base leading-relaxed text-[#5a5550]">
              From worn and weathered to refined and radiant — our metal
              coating and restoration work brings back the beauty and strength
              in every surface.
            </p>

            <Link
              href="/metal-coating"
              className="group mt-8 inline-flex items-center gap-2 border-b border-[#8a6c3e] pb-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6c3e] transition-all duration-300 hover:gap-3"
              aria-label="See more transformation examples"
            >
              See More Transformations
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>

          {/* Right: Comparison slider */}
          <Reveal direction="right" delay={0.1}>
            <BeforeAfterSlider />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
