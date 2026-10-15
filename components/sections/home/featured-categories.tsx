'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Boxes } from 'lucide-react';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { resolveIcon } from '@/lib/icons';
import type { Category } from '@/lib/types';
import { getCategories } from '@/lib/data-access';

interface FeaturedCategoriesProps {
  categories?: Category[];
}

export function FeaturedCategories({ categories: categoriesProp }: FeaturedCategoriesProps) {
  const categories = categoriesProp ?? getCategories();

  return (
    <section className="bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="Curated Collections"
          title="Featured categories"
          description="Six considered collections spanning decor, gifting and daily utility — each piece selected for material, form and longevity."
        />

        {categories.length === 0 ? (
          <div className="mt-14 py-12 text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
            No categories available at the moment.
          </div>
        ) : (
          <StaggerGroup className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {categories.map((cat) => {
              const CatIcon = resolveIcon(cat.icon, Boxes);
              return (
                <StaggerItem key={cat.slug}>
                  <Link
                    href={`/home-decor?category=${cat.slug}`}
                    className="group relative block overflow-hidden rounded-2xl bg-background"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
                      <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full glass">
                        <CatIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="text-xs font-medium uppercase tracking-wider text-gold">
                        {cat.productCount} pieces
                      </p>
                      <h3 className="mt-1 font-display text-xl font-semibold text-white">
                        {cat.name}
                      </h3>
                      <p className="mt-1 text-xs text-white/80">{cat.tagline}</p>
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                        Explore
                        <ArrowUpRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        )}
      </div>
    </section>
  );
}
