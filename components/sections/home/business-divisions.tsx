'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

const divisions = [
  {
    slug: 'metal-coating',
    eyebrow: 'METAL COATING & SURFACE FINISHING',
    headline: 'Metal Coating for Every Industry',
    tagline: 'Surface finishing and restoration for industrial components, architectural details and custom applications.',
    points: [
      'Metal Coating & Surface Treatment',
      'Furniture & Industrial Coating',
      'Restoration & Polishing',
      'Art Piece Finishing',
    ],
    cta: { label: 'Explore Metal Coating', href: '/metal-coating' },
    image: '/metal.jpg',
    imageAlt: 'Professional metal coating industrial workshop',
  },
  {
    slug: 'home-decor',
    eyebrow: 'HOME DÉCOR & METAL ART',
    headline: 'Decorative Metalwork for Distinctive Spaces',
    tagline: 'Explore decorative objects, statement pieces and custom metal accents for homes and interiors.',
    points: [
      'Sculptures & Decorative Objects',
      'Table & Wall Décor',
      'Accent & Statement Pieces',
      'Gifting & Decorative Collections',
    ],
    cta: { label: 'Explore Home Décor', href: '/home-decor' },
    image: '/homedecor.jpeg',
    imageAlt: 'Premium decorative metal art pieces',
  },
];

export function BusinessDivisions() {
  return (
    <section id="divisions" className="bg-[#f8f5f0] py-6">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          {divisions.map((div, i) => (
            <Reveal key={div.slug} delay={i * 0.1}>
              <Link
                href={div.cta.href}
                className="group relative block overflow-hidden rounded-2xl border border-transparent transition-colors duration-300 hover:border-[#c9a96e]/30"
                aria-label={`${div.eyebrow}: ${div.headline}`}
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/10] rounded-[inherit]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={div.image}
                    alt={div.imageAlt}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0a]/85 via-[#0e0c0a]/35 to-transparent transition-opacity duration-500 group-hover:from-[#0e0c0a]/90" />
                </div>

                {/* Text overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-9">
                  <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">
                    {div.eyebrow}
                  </p>
                  <h3 className="font-display text-2xl font-medium leading-tight text-white sm:text-3xl lg:text-4xl">
                    {div.headline}
                  </h3>
                  <p className="mt-2 text-sm text-white/70 leading-relaxed max-w-[420px]">
                    {div.tagline}
                  </p>

                  <ul className="mt-4 space-y-1.5" aria-label={`${div.eyebrow} services`}>
                    {div.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-center gap-2 text-xs text-white/60"
                      >
                        <span
                          className="h-0.5 w-3 shrink-0 bg-[#c9a96e]"
                          aria-hidden="true"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white transition-all duration-300 group-hover:gap-3">
                    {div.cta.label}
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
