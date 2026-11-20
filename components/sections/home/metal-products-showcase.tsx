'use client';

import Link from 'next/link';
import { ArrowRight, RotateCcw } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { useCallback, useMemo, useRef, useState } from 'react';
import { getCategorySection } from '@/lib/category-hierarchy';
import type { Category, Product } from '@/lib/types';
import { normalizeImageSrc } from '@/lib/utils';
import { MetalProductCard } from '@/components/sections/home/metal-product-card';

const PRODUCTS_PER_ROW = 12;
const TOTAL_PRODUCTS = PRODUCTS_PER_ROW * 2;

const EMBLA_OPTS = {
  axis: 'x' as const,
  align: 'start' as const,
  watchDrag: true,
  freeScroll: false,
  dragFree: false,
  containScroll: 'trimSnaps' as const,
  skipSnaps: false,
};

interface MetalProductsShowcaseProps {
  products: Product[];
  categories: Category[];
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function selectMetalProducts(
  products: Product[],
  categories: Category[],
  shuffleToken: number
): Product[] {
  const seenIds = new Set<string>();
  const seenImages = new Set<string>();
  const groups = new Map<string, Product[]>();

  for (const product of products) {
    if (!product.id || seenIds.has(product.id)) continue;
    if (!product.name || !product.category) continue;
    if (getCategorySection(categories, product.category) !== 'metal_services') continue;

    const image = normalizeImageSrc(product.cardImage || product.image);
    if (image && seenImages.has(image)) continue;

    seenIds.add(product.id);
    if (image) seenImages.add(image);

    const group = groups.get(product.category) ?? [];
    group.push(product);
    groups.set(product.category, group);
  }

  const categoryOrder = categories
    .filter((category) => groups.has(category.slug))
    .map((category) => category.slug);
  for (const slug of Array.from(groups.keys())) {
    if (!categoryOrder.includes(slug)) categoryOrder.push(slug);
  }

  if (shuffleToken > 0) {
    for (const [slug, group] of Array.from(groups.entries())) {
      groups.set(slug, shuffleArray(group));
    }
  }

  const orderedGroups = shuffleToken > 0 ? shuffleArray(categoryOrder) : categoryOrder;
  const selected: Product[] = [];
  const maxGroupLength = Math.max(0, ...orderedGroups.map((slug) => groups.get(slug)?.length ?? 0));

  for (let index = 0; index < maxGroupLength && selected.length < TOTAL_PRODUCTS; index += 1) {
    for (const slug of orderedGroups) {
      const product = groups.get(slug)?.[index];
      if (product) selected.push(product);
      if (selected.length >= TOTAL_PRODUCTS) break;
    }
  }

  return selected;
}

export function MetalProductsShowcase({
  products,
  categories,
}: MetalProductsShowcaseProps) {
  const [shuffleToken, setShuffleToken] = useState(0);
  const row01ApiRef = useRef<CarouselApi | null>(null);
  const row02ApiRef = useRef<CarouselApi | null>(null);

  const availableProducts = useMemo(
    () => selectMetalProducts(products, categories, shuffleToken),
    [products, categories, shuffleToken]
  );

  const row01Products = useMemo(
    () => availableProducts.slice(0, PRODUCTS_PER_ROW),
    [availableProducts]
  );
  const row02Products = useMemo(
    () => availableProducts.slice(PRODUCTS_PER_ROW, TOTAL_PRODUCTS),
    [availableProducts]
  );

  const setRow01Api = useCallback((api: CarouselApi) => {
    row01ApiRef.current = api ?? null;
  }, []);
  const setRow02Api = useCallback((api: CarouselApi) => {
    row02ApiRef.current = api ?? null;
  }, []);

  const resetCarousels = useCallback(() => {
    const apis = [row01ApiRef.current, row02ApiRef.current];
    for (const api of apis) {
      if (!api) continue;
      api.reInit();
      api.scrollTo(0, true);
    }
  }, []);

  const handleShuffle = useCallback(() => {
    setShuffleToken((token) => token + 1);
    window.requestAnimationFrame(resetCarousels);
    window.setTimeout(resetCarousels, 0);
  }, [resetCarousels]);

  const hasShortage = availableProducts.length < TOTAL_PRODUCTS;

  const navButtonClassName =
    'absolute top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border border-border bg-white text-foreground shadow-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-gold/50 disabled:opacity-40';

  return (
    <section className="bg-white py-12 sm:py-16" aria-label="Metal products showcase">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <Reveal>
            <p className="type-eyebrow text-gold-deep">Our metal collection</p>
            <h2 className="mt-3 font-display text-xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-2xl">
              Explore Our Metal Products
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Discover metal products across our specialised categories and finishes.
            </p>
          </Reveal>
          <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-end">
            <Button
              type="button"
              onClick={handleShuffle}
              variant="outline"
              size="sm"
              className="rounded-full border-border bg-white text-foreground hover:bg-muted"
              aria-label="Shuffle products"
            >
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Shuffle Products
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-border bg-white text-foreground hover:bg-muted"
            >
              <Link href="/metal-coating">
                View all
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
          {hasShortage
            ? `Showing ${availableProducts.length} verified metal products — ${TOTAL_PRODUCTS} requested.`
            : `Showing ${availableProducts.length} verified metal products.`}
        </p>

        {availableProducts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No published metal products are available at the moment.
          </div>
        ) : (
          <>
            <div className="mt-10">
              <h3 className="type-eyebrow mb-3 text-gold-deep">Metal collection</h3>
              <Carousel
                opts={EMBLA_OPTS}
                setApi={setRow01Api}
                className="metal-products-carousel"
                data-testid="metal-products-row-01"
                aria-label="Metal products first row"
              >
                <CarouselContent className="metal-products-track">
                  {row01Products.map((product) => (
                    <CarouselItem
                      key={product.id}
                      className="metal-products-slide"
                      data-testid="metal-products-slide"
                      data-product-id={product.id}
                    >
                      <MetalProductCard product={product} division="metal_services" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className={`${navButtonClassName} left-0 sm:left-2`} />
                <CarouselNext className={`${navButtonClassName} right-0 sm:right-2`} />
              </Carousel>
            </div>

            <div className="mt-10">
              <h3 className="type-eyebrow mb-3 text-gold-deep">
                Surface finishes and metal products
              </h3>
              <Carousel
                opts={EMBLA_OPTS}
                setApi={setRow02Api}
                className="metal-products-carousel"
                data-testid="metal-products-row-02"
                aria-label="Metal products second row"
              >
                <CarouselContent className="metal-products-track">
                  {row02Products.map((product) => (
                    <CarouselItem
                      key={product.id}
                      className="metal-products-slide"
                      data-testid="metal-products-slide"
                      data-product-id={product.id}
                    >
                      <MetalProductCard product={product} division="metal_services" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className={`${navButtonClassName} left-0 sm:left-2`} />
                <CarouselNext className={`${navButtonClassName} right-0 sm:right-2`} />
              </Carousel>
              {row02Products.length === 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  No additional verified metal products are available for the second row.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
