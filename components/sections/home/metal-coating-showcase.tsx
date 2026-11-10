'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import { ArrowRight, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { getServices } from '@/lib/data-access';
import { resolveIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import type { Service } from '@/lib/types';

const serviceCardImages: Record<string, string | null> = {
  'metal-restoration': '/after-metal-polished.jpg',
  'murti-finishing': null,
  'plastic-coating': null,
  electroplating: null,
  'marble-coating':
    'https://images.pexels.com/photos/6585755/pexels-photo-6585755.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'decorative-showpieces': '/hero-metal-art-decor.jpeg',
  'lipping-work': null,
  'wood-finishing': null,
  'sanitary-finishing': null,
};

export function MetalCoatingShowcase({
  services: servicesProp,
}: {
  services?: Service[];
}) {
  const services = servicesProp ?? getServices().filter((s) => s.isPublished !== false);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-ink py-20 text-white sm:py-28"
    >
      {/* Parallax background */}
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute inset-0 opacity-15"
      >
        <Image
          src="/hero-coating-process.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/60" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">

          {/* ── Left: Heading + Description + CTAs ── */}
          <div className="lg:col-span-5 xl:col-span-4 lg:pr-6 xl:pr-8 min-w-0">
            <Reveal>
              <p className="mb-4 text-xs font-semibold uppercase tracking-ultra text-gold">
                METAL COATING & FINISHING
              </p>
              <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Surface Finishing,{' '}
                <span className="gold-text"> & Finishing</span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
                Coating, refinishing and decorative surface finishes for metal components,
                fabrication work and custom projects. Explore our services
                and finish samples, or share your requirements for a quotation.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4 flex-wrap">
                {/* Button 1 — Primary: warm-white bg, dark text, always visible */}
                <Button
                  asChild
                  size="lg"
                  className={cn(
                    'rounded-full bg-white text-ink hover:bg-white/90 font-medium',
                    'flex-1 sm:flex-initial min-w-[140px]'
                  )}
                >
                  <a href="/metal-coating">
                    Explore Our Services
                    <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" />
                  </a>
                </Button>

                {/* Button 2 — Secondary: transparent with warm-white text + gold/warm-grey border, always visible */}
                <Button
                  asChild
                  size="lg"
                  className={cn(
                    'rounded-full border border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50 font-medium',
                    'flex-1 sm:flex-initial min-w-[140px]'
                  )}
                >
                  <a href="/metal-coating#quote">
                    Enquire About a Project
                    <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" />
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>

          {/* ── Right: 9 image-backed service cards (3×3 grid) ── */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-7 xl:col-span-8 lg:grid-cols-3 min-w-0">
            {services.slice(0, 9).map((svc, i) => {
              const SvcIcon = resolveIcon(svc.icon, Wrench);
              const cardImage =
                svc.slug in serviceCardImages
                  ? serviceCardImages[svc.slug]
                  : svc.image;

              return (
                <Reveal key={svc.slug} delay={i * 0.06}>
                  <a
                    href={`/metal-coating/${svc.slug}`}
                    aria-label={`${svc.name} — view service`}
                    className={cn(
                      'group relative flex h-full min-h-[150px] flex-col justify-end overflow-hidden rounded-2xl',
                      'border border-white/10 transition-all duration-500',
                      'hover:border-gold/40 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]',
                      'sm:min-h-[165px]'
                    )}
                  >
                    {/* Dark branded fallback */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2b2419] via-ink-soft to-ink" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(201,155,76,0.18),transparent_55%)]" />

                    {/* Background image */}
                    {cardImage && (
                      <>
                        <Image
                          src={cardImage}
                          alt=""
                          aria-hidden="true"
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          loading="lazy"
                          className="object-cover opacity-30 transition-all duration-700 group-hover:opacity-40 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      </>
                    )}

                    {/* Overlay — ensures text readability regardless of image brightness */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/60 to-ink/30" />

                    {/* Icon — top-left, subtle */}
                    <div className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/8 backdrop-blur-sm ring-1 ring-white/10 sm:left-3.5 sm:top-3.5 sm:h-8 sm:w-8">
                      <SvcIcon className="h-3 w-3 text-gold sm:h-3.5 sm:w-3.5" />
                    </div>

                    {/* Text content — bottom */}
                    <div className="relative z-10 min-w-0 p-3 pt-10 sm:p-4 sm:pt-10">
                      <h3 className="break-words text-xs font-semibold leading-tight text-white sm:text-[13px]">
                        {svc.name}
                      </h3>
                      <p className="mt-1 break-words text-[10px] leading-relaxed text-white/65 sm:text-[11px]">
                        {svc.description}
                      </p>
                    </div>
                  </a>
                </Reveal>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
