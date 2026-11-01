'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

const materials = [
  {
    id: 'iron',
    label: 'Iron',
    image: '/before-metal-worn.jpg',
    alt: 'Raw cast iron texture and surface detail',
    gradient: 'from-[#1a1714]/60 via-[#2b2419]/40 to-[#1a1714]/20',
  },
  {
    id: 'steel',
    label: 'Steel',
    image: '/materials-steel.jpg',
    alt: 'Polished stainless steel sheet surface',
    gradient: 'from-[#1a1714]/40 via-[#2b2419]/50 to-[#1a1714]/30',
  },
  {
    id: 'aluminium',
    label: 'Aluminium',
    image: '/materials-aluminium.jpg',
    alt: 'Brushed aluminium panel with coating finish',
    gradient: 'from-[#1a1714]/30 via-[#2b2419]/40 to-[#1a1714]/20',
  },
  {
    id: 'brass',
    label: 'Brass',
    image: '/hero-brass-interior.jpg',
    alt: 'Warm golden brass metallic surface and finish',
    gradient: null,
  },
  {
    id: 'wood',
    label: 'Wood',
    image: '/materials-wood.jpg',
    alt: 'Natural wood grain with metal inlay detail',
    gradient: 'from-[#1a1714]/50 via-[#2b2419]/30 to-[#1a1714]/10',
  },
  {
    id: 'pvc',
    label: 'PVC',
    image: '/materials-pvc.jpg',
    alt: 'PVC panel material surface for coating',
    gradient: 'from-[#1a1714]/40 via-[#1a1714]/20 to-transparent',
  },
];

export function MaterialsShowcase() {
  return (
    <section
      id="materials"
      className="overflow-hidden bg-[#0e0c0a] py-16 sm:py-24"
      aria-label="Materials and surfaces"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        {/* Desktop layout: intro left, cards right */}
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
          {/* Intro text */}
          <Reveal className="shrink-0 lg:w-[280px] xl:w-[320px]">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a96e]">
              <span className="h-px w-5 bg-[#c9a96e]" aria-hidden="true" />
              Materials & Surfaces
            </p>

            <h2 className="mt-4 font-display text-3xl font-medium leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-[2.8rem]">
              Materials.
              <br />
              Finishes.
              <br />
              Possibilities.
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-white/60 max-w-[300px]">
              Explore the materials we work with, from iron and brass to wood
              and specialty surfaces, with finishes suited to different
              applications.
            </p>

            <Link
              href="/metal-coating"
              className="group mt-7 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9a96e] transition-all duration-300 hover:gap-3"
              aria-label="Explore all materials"
            >
              Explore Materials
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>

          {/* Materials horizontal row */}
          <div className="w-full flex-1 min-w-0">
            <div
              className="flex gap-4 sm:gap-5 lg:gap-6 overflow-x-auto scroll-smooth snap-x pb-4 -mx-5 lg:mx-0 px-5 lg:px-0"
              role="list"
              aria-label="Materials gallery"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#c9a96e #0e0c0a' }}
            >
              {materials.map((mat, i) => (
                <motion.div
                  key={mat.id}
                  role="listitem"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                    delay: i * 0.08,
                  }}
                    className={cn(
                      'group relative shrink-0 snap-center overflow-hidden rounded-2xl border border-white/10 bg-[#13110f] transition-all duration-300 group-hover:border-[#c9a96e]/40 group-hover:-translate-y-1',
                      // Responsive card sizes: 1.2 on mobile, 2 on tablet, 6 in one row on desktop
                      'w-[calc(50%-0.75rem)] sm:w-[calc(33.333%-0.67rem)] lg:w-[calc((100%-7.5rem)/6)]',
                      'aspect-[3/4] sm:aspect-[3/4] lg:aspect-[3/5]'
                    )}

                >
                  {/* Image or gradient fallback */}
                  <div className="relative h-full w-full overflow-hidden">
                    {mat.image ? (
                      <Image
                        src={mat.image}
                        alt={mat.alt}
                        fill
                        sizes="(max-width: 640px) 85vw, (max-width: 1024px) 30vw, (max-width: 1280px) 15vw, 14vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className={cn('h-full w-full bg-gradient-to-br', mat.gradient)}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(201,169,110,0.06),transparent_70%)]" />
                      </div>
                    )}
                    {/* Bottom label gradient */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0e0c0a]/80 via-[#0e0c0a]/10 to-transparent" aria-hidden="true" />
                  </div>

                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 py-4">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                      {mat.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Scroll hint for mobile */}
            <p className="text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/40 mt-2 lg:hidden">
              Scroll horizontally to explore all materials
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
