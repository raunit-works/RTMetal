'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, Shield, Settings2, Diamond, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const heroSlides = [
  {
    id: 1,
    image: '/hero-brass-interior.jpg',
    alt: 'Premium brass architectural interior with metal accents',
  },
  {
    id: 2,
    image: '/hero-coating-process.jpg',
    alt: 'Professional metal coating process in workshop',
  },
  {
    id: 3,
    image: '/hero-metal-art-decor.jpg',
    alt: 'Premium decorative metal art pieces for inspired spaces',
  },
];

const trustIndicators = [
  { icon: Shield, label: 'Premium Quality Finishes' },
  { icon: Settings2, label: 'Wide Range of Metals & Coatings' },
  { icon: Diamond, label: 'Custom Solutions for Every Project' },
  { icon: Users, label: 'Trusted by Businesses & Designers' },
];

export function Hero() {
  const [current, setCurrent] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = React.useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const startTimer = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!isPaused) {
        setCurrent((prev) => (prev + 1) % heroSlides.length);
      }
    }, 6000);
  }, [isPaused]);

  React.useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, isPaused, startTimer]);

  return (
    <section
      className="relative overflow-hidden bg-[#f8f5f0] pt-16 sm:pt-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="RT Metals hero section"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid min-h-[min(90vh,720px)] items-center gap-8 lg:grid-cols-2 lg:gap-12 py-12 sm:py-16 lg:py-20">
          
          {/* LEFT: Hero Copy */}
          <div className="relative z-10 flex flex-col justify-center">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8a6c3e]"
            >
              <span className="inline-block h-px w-6 bg-[#8a6c3e]" aria-hidden="true" />
              RT Metals / Metal Finishing &amp; Decorative Solutions
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="font-display text-[clamp(2.6rem,5.5vw,4.2rem)] font-medium leading-[1.02] tracking-tight text-[#1a1714]"
            >
              Metal Finishes
              <br />
              for a Better
              <br />
              <span className="gold-text">Tomorrow.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
              className="mt-6 max-w-md text-base leading-relaxed text-[#5a5550]"
            >
              RT Metals delivers premium metal coating and decorative metal
              solutions for modern spaces — built to last, crafted to impress.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button
                asChild
                size="lg"
                className="rounded-none bg-[#8a6c3e] px-7 text-white hover:bg-[#7a5f36] transition-colors duration-300"
              >
                <Link href="/metal-coating">
                  Explore Our Solutions
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="group rounded-none border-[#1a1714]/25 px-7 text-[#1a1714] hover:border-[#8a6c3e] hover:text-[#8a6c3e] transition-colors duration-300"
              >
                <Link href="/home-decor">
                  <Play className="mr-2 h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  View Our Work
                </Link>
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
              className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-[#1a1714]/10 pt-8"
              aria-label="Trust indicators"
            >
              {trustIndicators.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.55 + i * 0.08,
                  }}
                  className="flex items-start gap-2.5"
                >
                  <item.icon
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#8a6c3e]"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium leading-tight text-[#3d3830]">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT: Hero Slideshow */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="relative aspect-[4/3] overflow-hidden rounded-sm lg:aspect-auto lg:h-[min(72vh,600px)]"
            aria-label="Hero image slideshow"
          >
            {/* Slides */}
            <AnimatePresence mode="sync">
              {heroSlides.map((slide, idx) =>
                idx === current ? (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                    className="absolute inset-0"
                  >
                    <motion.img
                      src={slide.image}
                      alt={slide.alt}
                      className="h-full w-full object-cover"
                      initial={{ scale: 1.04 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 7, ease: 'linear' }}
                    />
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>

            {/* Subtle vignette overlay */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a1714]/20 via-transparent to-transparent"
              aria-hidden="true"
            />

            {/* Slide Navigation Dots */}
            <div
              className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2"
              role="tablist"
              aria-label="Slideshow navigation"
            >
              {heroSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  role="tab"
                  aria-selected={idx === current}
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => goTo(idx)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white',
                    idx === current
                      ? 'w-8 bg-white'
                      : 'w-1.5 bg-white/50 hover:bg-white/75'
                  )}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#8a6c3e]/30 to-transparent" aria-hidden="true" />
    </section>
  );
}
