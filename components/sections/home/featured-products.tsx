'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { ProductCard } from '@/components/sections/product-card';
import type { Product } from '@/lib/types';
import { getProducts } from '@/lib/data-access';

interface FeaturedProductsProps {
  products?: Product[];
}

export function FeaturedProducts({ products: productsProp }: FeaturedProductsProps) {
  const products = productsProp ?? getProducts();

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="The Collection"
            title="Featured products"
            description="A selection of pieces that define the RT PU COATING WORKS aesthetic — material-led, quietly confident and built to last."
          />
          <Button
            asChild
            variant="outline"
            className="shrink-0 rounded-full"
          >
            <Link href="/home-decor">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="mt-14 py-16 text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
            No featured pieces available at the moment — check back soon.
          </div>
        ) : (
          <StaggerGroup className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </section>
  );
}
