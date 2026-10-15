'use client';

import { useState, useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/sections/product-card';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { InstagramSection } from '@/components/sections/instagram-section';
import { CtaBanner } from '@/components/sections/cta-banner';
import type { Category, Product, InstagramPost } from '@/lib/types';

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

interface HomeDecorCatalogProps {
  categories: Category[];
  products: Product[];
  instagramPosts: InstagramPost[];
}

export function HomeDecorCatalog({
  categories,
  products,
  instagramPosts,
}: HomeDecorCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');

  const filtered = useMemo(() => {
    let list =
      activeCategory === 'all'
        ? products
        : products.filter((p) => p.category === activeCategory);

    const sorted = [...list];
    if (sortBy === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    return sorted;
  }, [activeCategory, sortBy, products]);

  return (
    <>
      <section className="relative overflow-hidden bg-ink pt-32 text-white sm:pt-40">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.pexels.com/photos/6585608/pexels-photo-6585608.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 lg:px-10">
          <Reveal>
            <p className="mb-4 text-xs font-medium uppercase tracking-ultra text-gold">
              Division 01 · Home Decor & Lifestyle
            </p>
            <h1 className="font-display text-5xl font-medium leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">
              The <span className="gold-text">Collection</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              A curated edit of home decor, decorative accessories, gift
              articles and daily utility — each piece chosen for material,
              form and the way it feels to live with.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-border bg-background/80 py-6 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto">
            <CategoryChip
              label="All"
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
            />
            {categories.map((cat) => (
              <CategoryChip
                key={cat.slug}
                label={cat.name}
                active={activeCategory === cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <p className="mb-8 text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filtered.length}</span>{' '}
            {filtered.length === 1 ? 'piece' : 'pieces'}
            {activeCategory !== 'all' && (
              <>
                {' '}in{' '}
                <span className="font-medium text-foreground">
                  {categories.find((c) => c.slug === activeCategory)?.name || activeCategory}
                </span>
              </>
            )}
          </p>

          <StaggerGroup className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {filtered.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerGroup>

          {filtered.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              No pieces in this collection yet — check back soon.
            </div>
          )}

          {filtered.length > 0 && (
            <div className="mt-14 flex justify-center">
              <Button variant="outline" className="rounded-full" size="lg">
                Load More
              </Button>
            </div>
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="bg-muted/40 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <SectionHeading
              eyebrow="Featured Collections"
              title="Shop by story"
              description="Curated edits that bring a single idea into focus — gifting, entertaining, the considered desk."
            />
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.slice(0, 3).map((cat, i) => (
                <Reveal key={cat.slug} delay={i * 0.1}>
                  <button
                    onClick={() => setActiveCategory(cat.slug)}
                    className="group relative block w-full text-left overflow-hidden rounded-3xl"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <h3 className="font-display text-2xl font-medium text-white sm:text-3xl">
                        {cat.name}
                      </h3>
                      <p className="mt-1 text-sm text-white/80">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <InstagramSection
        posts={instagramPosts.filter((p) => p.category === 'Product' || p.category === 'Recent Work').slice(0, 6)}
        eyebrow="As seen on Instagram"
        title="Products in motion"
        description="Selected posts and reels featuring our latest pieces — see them styled, in use and up close."
      />

      <CtaBanner
        eyebrow="Not sure where to start?"
        title={
          <>
            Let us help you <span className="gold-text">choose.</span>
          </>
        }
        description="Our team can guide you to the right pieces for your space, or arrange a bespoke commission."
        primary={{ label: 'Contact Us', href: '/#contact' }}
        secondary={{ label: 'Explore Services', href: '/metal-coating' }}
        variant="light"
      />
    </>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
        active
          ? 'bg-ink text-white'
          : 'border border-border text-foreground/70 hover:border-foreground/30 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
