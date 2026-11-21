'use client';

import { ProductCard } from '@/components/sections/product-card';
import type { Product } from '@/lib/types';

interface MetalProductCardProps {
  product: Product;
  division?: 'metal_services' | 'home_decor';
}

/**
 * Metal showcase cards reuse the standardized product card layout so ordering,
 * spacing, and actions stay consistent site-wide while preserving behavior.
 */
export function MetalProductCard({
  product,
  division = 'metal_services',
}: MetalProductCardProps) {
  return (
    <ProductCard
      product={product}
      division={division}
      dataTestId="metal-product-card"
    />
  );
}
