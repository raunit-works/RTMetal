'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Shield, Settings2, Diamond, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Temporary hero photography — to be replaced by client-supplied images.
 * LEFT: metal coating / workshop finishing craftsmanship.
 * RIGHT: premium decorative metal interiors.
 */
const TEMP_HERO_COATING_IMAGE = '/hero-coating-process.jpg';
const TEMP_HERO_DECOR_IMAGE = '/homedecor2.jpeg';

// Navbar is position: fixed at top-0 with a height of 76px (70px when scrolled).
// Account for it exactly once so content never hides behind it.
const NAVBAR_HEIGHT = 76;

const trustIndicators = [
  { icon: Shield, label: 'Premium Quality Finishes' },
  { icon: Settings2, label: 'Wide Range of Metals & Coatings' },
  { icon: Diamond, label: 'Custom Solutions for Every Project' },
  { icon: Users, label: 'Trusted by Businesses & Designers' },
];

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(media.matches);
    const handler = () => setReduced(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export function Hero() {
  const reducedMotion = useReducedMotion();
  const variant = reducedMotion ? false : { opacity: 1, y: 0 };
  const initial = reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 };

  const centerBlendMask = {
    maskImage: 'linear-gradient(to right, transparent 0%, #000 90px, #000 100%)',
    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 90px, #000 100%)',
  };

  return (
    <section
      className="relative isolate overflow-hidden bg-[#0e0c0a] min-h-[min(85vh,900px)] pt-[104px] md:pt-[124px] lg:pt-[140px]"
      aria-label="RT Metals hero section"
    >
      {/* ── Background image layer ── */}
      <div className="absolute inset-0 z-0">

        {/* Desktop & tablet (≥768px): side-by-side split, ~50% each */}
        <div className="hidden md:block absolute inset-0 w-full">
          <div className="absolute inset-y-0 left-0 w-[50%]">
            <Image
              fill
              src={TEMP_HERO_COATING_IMAGE}
              alt="Professional metal coating process in workshop"
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover object-position-center"
              priority
            />
          </div>
          <div
            className="absolute inset-y-0 right-0 w-[52%]"
            style={centerBlendMask}
          >
            <Image
              fill
              src={TEMP_HERO_DECOR_IMAGE}
              alt="Premium brass architectural interior with metal accents"
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover object-position-center"
            />
          </div>
        </div>

        {/* Mobile (<768px): stacked images, both visible, normal flow */}
        <div className="md:hidden w-full">
          <div className="relative h-[34vh] min-h-[210px] w-full">
            <Image
              fill
              src={TEMP_HERO_COATING_IMAGE}
              alt="Professional metal coating process in workshop"
              sizes="100vw"
              className="object-cover object-position-center"
            />
          </div>
          <div className="relative h-[34vh] min-h-[210px] w-full">
            <Image
              fill
              src={TEMP_HERO_DECOR_IMAGE}
              alt="Premium brass architectural interior with metal accents"
              sizes="100vw"
              className="object-cover object-position-center"
            />
          </div>
        </div>
      </div>

      {/* ── Subtle overlays for text readability (kept light so photos show) ── */}
      <div className="absolute inset-0 z-10 bg-[#0e0c0a]/20" aria-hidden="true" />
      <div
        className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-[#0e0c0a]/15 to-[#0e0c0a]/30"
        aria-hidden="true"
      />
      <div
        className="absolute inset-y-0 z-10 bg-gradient-to-t from-[#0e0c0a]/20 to-transparent"
        aria-hidden="true"
      />

      {/* ── Centered content — normal flow, clears the navbar via section pt ── */}
      <div className="relative z-20 mx-auto max-w-[900px] px-5 sm:px-8 md:px-12 pb-24 text-center">
        <motion.p
          initial={initial}
          animate={variant}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a96e]"
        >
          <span className="inline-block h-px w-6 bg-[#c9a96e]" aria-hidden="true" />
          RT Metals / Metal Finishing &amp; Decorative Solutions
        </motion.p>

        <motion.h1
          initial={initial}
          animate={variant}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="font-display text-[clamp(2rem,9vw,4.4rem)] font-medium leading-[1.12] tracking-tight text-white"
        >
          Metal Finishes
          <br />
          for a Better
          <br />
          <span className="gold-text">Tomorrow.</span>
        </motion.h1>

        <motion.p
          initial={initial}
          animate={variant}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
          className="mt-6 mx-auto max-w-[560px] text-base sm:text-lg leading-relaxed text-[#e8e2d8]"
        >
          RT Metals delivers premium metal coating and decorative metal
          solutions for modern spaces — built to last, crafted to impress.
        </motion.p>

        <motion.div
          initial={initial}
          animate={variant}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button
            asChild
            size="lg"
            className="rounded-full bg-[#c9a96e] px-8 py-3.5 text-[#0e0c0a] font-semibold hover:bg-[#b5935c] transition-colors duration-300 shadow-sm"
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
            className="rounded-full border border-[#c9a96e]/50 bg-transparent px-8 py-3.5 text-white font-semibold hover:bg-[#c9a96e] hover:text-[#0e0c0a] transition-colors duration-300 shadow-sm"
          >
            <Link href="/home-decor">
              <Play className="mr-2 h-3.5 w-3.5 fill-current" aria-hidden="true" />
              View Our Work
            </Link>
          </Button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 border-t border-[#c9a96e]/20 pt-12"
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
                className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a96e]"
                aria-hidden="true"
              />
              <span className="text-xs font-medium leading-tight text-white/90">
                {item.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
