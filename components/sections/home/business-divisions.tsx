'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Reveal } from '@/components/motion/reveal';

const divisions = [
  {
    slug: 'metal-coating',
    eyebrow: 'METAL COATING & SURFACE FINISHING',
    headline: 'Metal Coating for Every Industry ',
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
    headline: 'Metal Art & Decorative Interiors',
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
    <section id="divisions" className="bg-[#f8f5f0] py-6 ">
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
                <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/10] rounded-[inherit] ">
                  <Image
                    src={div.image}
                    alt={div.imageAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Dark gradient overlay */}

                  {/* Full-image dark overlay for consistent contrast */}
                  <div
                    className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/45"
                    aria-hidden="true"
                  />

                  {/* Stronger gradient behind the text */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
                    aria-hidden="true"
                  />


                  {/* Text overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-9">
                    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">
                      {div.eyebrow}
                    </p>
                    <h3 className="font-display text-2xl font-medium leading-tight text-white sm:text-3xl lg:text-4xl">
                      {div.headline}
                    </h3>
                    <p className="mt-2 max-w-[420px] text-sm leading-relaxed text-white/90">
                      {div.tagline}
                    </p>

                    <ul className="mt-4 space-y-1.5" aria-label={`${div.eyebrow} services`}>
                      {div.points.map((point) => (
                        <li
                          key={point}
                          className="flex items-center gap-2 text-xs text-white/50"
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

                </div> {/* Closes Image Container */}


              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section >
  );
}
