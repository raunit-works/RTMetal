'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/sections/product-card';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { CategoryShowcase } from '@/components/categories/category-showcase';
import { InstagramSection } from '@/components/sections/instagram-section';
import { CtaBanner } from '@/components/sections/cta-banner';
import type { Category, Product, InstagramPost, MainSection } from '@/lib/types';
import { categoryHref, filterCategoryProducts, getCategoryPath } from '@/lib/category-hierarchy';
import { toCategoryShowcaseItems } from '@/lib/category-showcase';

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'rating', label: 'Top Rated' },
];

interface HomeDecorCatalogProps {
  categories: Category[];
  products: Product[];
  instagramPosts: InstagramPost[];
  selectedCategory?: Category;
  mainSection?: MainSection;
}

export function HomeDecorCatalog({
  categories,
  products,
  instagramPosts,
  selectedCategory,
  mainSection = 'home_decor',
}: HomeDecorCatalogProps) {
  const activeCategory = selectedCategory?.slug;
  const collectionHref = mainSection === 'metal_services' ? '/metal-coating' : '/home-decor';
  const [sortBy, setSortBy] = useState<string>('featured');

  const filtered = useMemo(() => {
    const list = filterCategoryProducts(products, categories, activeCategory);

    const sorted = [...list];
    if (sortBy === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    return sorted;
  }, [activeCategory, sortBy, products, categories]);

  return (
    <>
      <section className="relative overflow-hidden bg-ink pt-32 text-white sm:pt-40">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <Image
            src="https://images.pexels.com/photos/6585608/pexels-photo-6585608.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 lg:px-10">
          <Reveal>
            <p className="mb-4 text-xs font-medium uppercase tracking-ultra text-gold">
              {mainSection === 'metal_services' ? 'Metal · Product Collection' : 'RT METAL / HOME DECOR'}
            </p>
            <h1 className="font-display text-5xl font-medium leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">
              {selectedCategory ? selectedCategory.name : <>Home Decor & <span className="gold-text">Decorative Metalwork</span></>}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              {selectedCategory ? selectedCategory.description : mainSection === 'metal_services'
                ? 'Explore our metal product collections. Contact our team for availability and a quotation.'
                : <>Explore decorative metal art, mirrors, furniture accents, partitions and
                  custom metalwork for residential and commercial spaces.</>}
            </p>
            {selectedCategory && <nav aria-label="Category breadcrumb" className="mt-4 text-sm text-white/80">
              <Link href={collectionHref} className="hover:text-gold">All collections</Link>
              <span> / {getCategoryPath(selectedCategory, categories)}</span>
            </nav>}
          </Reveal>
        </div>
      </section>

      <section className="border-b border-border bg-background/80 py-6 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto">
            <CategoryChip
              label="All"
              active={!activeCategory}
              href={collectionHref}
            />
            {categories.map((cat) => (
              <CategoryChip
                key={cat.slug}
                label={getCategoryPath(cat, categories)}
                active={activeCategory === cat.slug}
                href={categoryHref(cat)}
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
            {activeCategory && (
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
                <ProductCard product={product} division={mainSection} />
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
        <CategoryShowcase
          eyebrow="Featured Collections"
          title="Shop by story"
          description="Curated edits that bring a single idea into focus — gifting, entertaining, the considered desk."
          items={toCategoryShowcaseItems(categories)}
          ctaLabel="Explore Collection"
        />
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
        secondary={{ label: 'Explore Our Services', href: '/metal-coating' }}
        variant="light"
      />
    </>
  );
}

function CategoryChip({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${active
        ? 'bg-ink text-white'
        : 'border border-border text-foreground/70 hover:border-foreground/30 hover:text-foreground'
        }`}
    >
      {label}
    </Link>
  );
}
