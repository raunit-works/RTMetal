'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

const materials = [
  {
    id: 'iron',
    label: 'Iron',
    image:
      'https://images.pexels.com/photos/1565558/pexels-photo-1565558.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Dark industrial iron metal structure and texture',
  },
  {
    id: 'steel',
    label: 'Steel',
    image:
      'https://images.pexels.com/photos/1647616/pexels-photo-1647616.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Brushed stainless steel metallic surface',
  },
  {
    id: 'aluminium',
    label: 'Aluminium',
    image:
      'https://images.pexels.com/photos/3825539/pexels-photo-3825539.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Silver aluminium metal panel texture',
  },
  {
    id: 'brass',
    label: 'Brass',
    image:
      'https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Warm golden brass metallic surface and finish',
  },
  {
    id: 'wood',
    label: 'Wood',
    image:
      'https://images.pexels.com/photos/129731/pexels-photo-129731.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Natural wood grain texture for coated surfaces',
  },
  {
    id: 'pvc',
    label: 'PVC',
    image:
      'https://images.pexels.com/photos/3729553/pexels-photo-3729553.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'PVC panel material surface for coating',
  },
];

export function MaterialsShowcase() {
  return (
    <section
      id="materials"
      className="overflow-hidden bg-white py-16 sm:py-20"
      aria-label="Our materials"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        {/* Desktop layout: intro + strip */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:gap-12">
          {/* Intro text */}
          <Reveal className="shrink-0 lg:w-[220px] xl:w-[260px]">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8a6c3e]">
              <span className="h-px w-5 bg-[#8a6c3e]" aria-hidden="true" />
              Our Materials
            </p>
            <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.25em] text-[#8a6c3e]/60">
              Our Possibilities
            </p>

            <h2 className="mt-5 font-display text-3xl font-medium leading-[1.08] tracking-tight text-[#1a1714] sm:text-4xl lg:text-[2.6rem]">
              Versatile.
              <br />
              Durable.
              <br />
              Beautiful.
            </h2>

            <Link
              href="/metal-coating"
              className="group mt-7 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6c3e] transition-all duration-300 hover:gap-3"
              aria-label="Explore all materials"
            >
              Explore Materials
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>

          {/* Materials strip */}
          {/* Desktop: horizontal equal-width grid, Mobile: scrollable strip */}
          <div
            className="w-full overflow-x-auto pb-1"
            role="list"
            aria-label="Materials list"
          >
            <div className="flex min-w-max gap-3 lg:min-w-0 lg:grid lg:min-w-full lg:grid-cols-6 lg:gap-3">
              {materials.map((mat, i) => (
                <motion.div
                  key={mat.id}
                  role="listitem"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                    delay: i * 0.07,
                  }}
                  className="group relative w-[130px] shrink-0 cursor-default overflow-hidden lg:w-auto"
                >
                  {/* Image */}
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mat.image}
                      alt={mat.alt}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      loading="lazy"
                    />
                    {/* Bottom label gradient */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0e0c0a]/70 via-[#0e0c0a]/10 to-transparent" aria-hidden="true" />
                  </div>

                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-3">
                    <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                      {mat.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
