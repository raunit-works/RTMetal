'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/motion/reveal';
import { businessDivisions } from '@/lib/data';

export function BusinessDivisions() {
  return (
    <section id="divisions" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <Reveal className="mb-14 max-w-2xl">
          <p className="mb-4 text-xs font-medium uppercase tracking-ultra text-gold-deep">
            Two Divisions, One Standard
          </p>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            A house of craft, divided into two.
          </h2>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-2">
          {businessDivisions.map((div, i) => (
            <Reveal key={div.slug} delay={i * 0.1}>
              <Link
                href={div.cta.href}
                className="group relative block overflow-hidden rounded-3xl bg-ink"
              >
                <div className="relative aspect-[4/5] sm:aspect-[16/11]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={div.image}
                    alt={div.title}
                    className="h-full w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                </div>

                <div className="absolute inset-0 flex flex-col justify-end p-7 sm:p-10">
                  <p className="mb-3 text-xs font-medium uppercase tracking-ultra text-gold">
                    {div.subtitle}
                  </p>
                  <h3 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                    {div.title}
                  </h3>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/70">
                    {div.description}
                  </p>
                  <ul className="mt-5 space-y-1.5">
                    {div.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-center gap-2 text-xs text-foreground/60"
                      >
                        <span className="h-1 w-1 rounded-full bg-gold" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-white">
                    {div.cta.label}
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
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
