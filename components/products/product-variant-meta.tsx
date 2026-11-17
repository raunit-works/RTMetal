'use client';

import { useProductVariantContext } from '@/components/products/product-variant-provider';

export function VariantSku({ fallback }: { fallback?: string }) {
  const { selectedVariant, product } = useProductVariantContext();
  const sku = selectedVariant?.sku || fallback || product.sku;

  if (!sku) return null;
  return <span className="text-xs text-muted-foreground">· SKU: {sku}</span>;
}

export function VariantFinishValue({ fallback }: { fallback?: string }) {
  const { selectedFinishName } = useProductVariantContext();
  return <span className="font-medium">{selectedFinishName || fallback}</span>;
}

function availabilityLabel(availability: string, stockQuantity?: number | null) {
  if (availability === 'out_of_stock') return 'Out of stock';
  if (availability === 'made_to_order') return 'Made to order';
  if (typeof stockQuantity === 'number' && stockQuantity > 0) {
    return `In stock · ${stockQuantity} available`;
  }
  return 'In stock';
}

export function VariantAvailabilityRow({ fallback }: { fallback?: string }) {
  const { selectedVariant, variants } = useProductVariantContext();

  const value = selectedVariant
    ? availabilityLabel(selectedVariant.availability, selectedVariant.stockQuantity)
    : variants.length > 0
      ? 'Select a finish'
      : fallback
        ? fallback.replace(/_/g, ' ')
        : null;

  if (!value) return null;

  return (
    <div className="flex justify-between border-b border-border/40 pb-1.5">
      <span className="text-muted-foreground">Availability:</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
