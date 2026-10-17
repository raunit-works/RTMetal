'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/motion/reveal';

const divisions = [
  {
    slug: 'metal-coating',
    eyebrow: 'SURFACE SOLUTIONS',
    headline: 'Metal Coating for Every Industry',
    tagline: 'Durable. Precise. Beautiful finishes.',
    points: [
      'Metal Coating & Surface Treatment',
      'Furniture & Industrial Coating',
      'Restoration & Polishing',
      'Art Piece Finishing',
    ],
    cta: { label: 'Explore Surface Solutions', href: '/metal-coating' },
    image:
      'https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=1400',
    imageAlt: 'Professional metal coating industrial workshop',
  },
  {
    slug: 'home-decor',
    eyebrow: 'HOME DÉCOR',
    headline: 'Metal Art Pieces for Inspired Spaces',
    tagline: 'Statement pieces. Timeless design.',
    points: [
      'Sculptures & Decorative Objects',
      'Table & Wall Décor',
      'Accent & Statement Pieces',
      'Gifting & Decorative Collections',
    ],
    cta: { label: 'Explore Home Décor', href: '/home-decor' },
    image:
      'https://images.pexels.com/photos/6585608/pexels-photo-6585608.jpeg?auto=compress&cs=tinysrgb&w=1400',
    imageAlt: 'Premium decorative metal art pieces in a luxury interior',
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
                className="group relative block overflow-hidden"
                aria-label={`${div.eyebrow}: ${div.headline}`}
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/10]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={div.image}
                    alt={div.imageAlt}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0a]/80 via-[#0e0c0a]/30 to-transparent transition-opacity duration-500 group-hover:from-[#0e0c0a]/85" />
                </div>

                {/* Text overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-9">
                  <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">
                    {div.eyebrow}
                  </p>
                  <h3 className="font-display text-2xl font-medium leading-tight text-white sm:text-3xl lg:text-4xl">
                    {div.headline}
                  </h3>
                  <p className="mt-2 text-sm text-white/70">{div.tagline}</p>

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
