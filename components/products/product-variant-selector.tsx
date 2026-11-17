'use client';

import * as React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { useProductVariantContext } from '@/components/products/product-variant-provider';
import type { ProductOptionValue } from '@/lib/types';

function splitSwatchColors(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[,/|]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
}

function SwatchPreview({ value }: { value: ProductOptionValue }) {
  const colors = splitSwatchColors(value.swatchColor);

  if (value.swatchType === 'image' && value.swatchImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={value.swatchImageUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="h-full w-full rounded-full object-cover"
      />
    );
  }

  if (colors.length === 2) {
    return (
      <span
        aria-hidden="true"
        className="h-full w-full rounded-full"
        style={{
          background: `linear-gradient(135deg, ${colors[0]} 0 50%, ${colors[1]} 50% 100%)`,
        }}
      />
    );
  }

  if (colors.length === 1) {
    return (
      <span
        aria-hidden="true"
        className="h-full w-full rounded-full"
        style={{ backgroundColor: colors[0] }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-full w-full items-center justify-center rounded-full bg-muted text-[10px] font-semibold uppercase text-foreground"
    >
      {value.name.slice(0, 2)}
    </span>
  );
}

export function ProductVariantSelector() {
  const {
    choices,
    selectedVariant,
    selectedFinishName,
    isUnavailable,
    selectVariant,
  } = useProductVariantContext();

  if (choices.length === 0) return null;

  const availabilityLabel =
    selectedVariant?.availability === 'made_to_order'
      ? 'Made to order'
      : selectedVariant?.availability === 'out_of_stock'
        ? 'Currently unavailable'
        : 'In stock';

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-xs font-semibold uppercase tracking-ultra text-gold-deep">
          Finish
        </span>
        <span aria-live="polite" className="text-sm font-medium text-foreground">
          {selectedFinishName || 'Select a finish'}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Select a finish"
        className="flex flex-wrap items-center gap-2.5"
      >
        {choices.map(({ value, variant }) => {
          const isSelected = selectedVariant?.id === variant.id;
          const variantUnavailable =
            variant.availability === 'out_of_stock' || variant.stockQuantity === 0;

          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${value.name}${variantUnavailable ? ' (unavailable)' : ''}`}
              title={value.name}
              onClick={() => selectVariant(variant.id)}
              className={`relative h-9 w-9 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isSelected
                  ? 'border-gold-deep ring-2 ring-gold/60 ring-offset-2 ring-offset-background'
                  : 'border-border hover:border-gold/70'
              } ${variantUnavailable ? 'opacity-45' : ''}`}
            >
              <span className="absolute inset-1 overflow-hidden rounded-full">
                <SwatchPreview value={value} />
              </span>
              {isSelected && (
                <Check
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-foreground p-[1px] text-background"
                />
              )}
              {variantUnavailable && (
                <span
                  aria-hidden="true"
                  className="absolute inset-1 rounded-full bg-background/40"
                />
              )}
            </button>
          );
        })}
      </div>

      <p
        className={`flex items-center gap-1.5 text-xs ${
          isUnavailable ? 'text-amber-600' : 'text-muted-foreground'
        }`}
      >
        {isUnavailable && <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
        {availabilityLabel}
        {selectedVariant?.sku ? ` · SKU: ${selectedVariant.sku}` : ''}
      </p>
      {choices.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Select a finish to see its image and availability.
        </p>
      )}
    </div>
  );
}
