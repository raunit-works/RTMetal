'use client';

import * as React from 'react';
import {
  getDefaultVariant,
  getVariantPrimaryImage,
} from '@/lib/supabase/product-variants';
import {
  buildRichProductEnquiryMessage,
  type EnquiryDivision,
} from '@/lib/product-variants/enquiry';
import type {
  Product,
  ProductImage,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from '@/lib/types';

interface VariantChoice {
  value: ProductOptionValue;
  variant: ProductVariant;
}

interface ProductVariantContextValue {
  product: Product;
  variants: ProductVariant[];
  finishOption?: ProductOption;
  choices: VariantChoice[];
  selectedVariant?: ProductVariant;
  selectedValue?: ProductOptionValue;
  selectedFinishName: string;
  isUnavailable: boolean;
  galleryMainImage: string;
  galleryImages: ProductImage[];
  galleryKey: string;
  selectVariant: (variantId: string) => void;
  enquiryMessage: string;
}

const ProductVariantContext = React.createContext<ProductVariantContextValue | null>(
  null
);

function readVariantParam(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('variant');
}

function writeVariantParam(variantId: string | undefined) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (variantId) {
    url.searchParams.set('variant', variantId);
  } else {
    url.searchParams.delete('variant');
  }
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function toProductImages(product: Product, variant: ProductVariant | undefined): ProductImage[] {
  if (variant && variant.images.length > 0) {
    return [...variant.images]
      .sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.id.localeCompare(b.id);
      })
      .map((image) => ({
        id: image.id,
        productId: product.id,
        imageUrl: image.imageUrl,
        altText: image.altText,
        sortOrder: image.sortOrder,
        isPrimary: image.isPrimary,
      }));
  }

  return product.images ?? [];
}

export function ProductVariantProvider({
  product,
  division = 'home_decor',
  categoryName,
  children,
}: {
  product: Product;
  division?: EnquiryDivision;
  categoryName?: string;
  children: React.ReactNode;
}) {
  const [origin, setOrigin] = React.useState('');

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const variants = React.useMemo(
    () => (product.variants ?? []).filter((variant) => variant.isActive),
    [product.variants]
  );
  const finishOption = React.useMemo(
    () =>
      (product.options ?? []).find((option) => option.slug === 'finish') ??
      (product.options ?? [])[0],
    [product.options]
  );

  const choices = React.useMemo<VariantChoice[]>(() => {
    return variants
      .map((variant) => {
        const value = finishOption?.values.find(
          (optionValue) => optionValue.id === variant.optionValueId
        );
        return value ? { value, variant } : null;
      })
      .filter((choice): choice is VariantChoice => choice !== null);
  }, [finishOption, variants]);

  const initialVariant = React.useMemo(
    () => getDefaultVariant(variants) ?? variants[0],
    [variants]
  );
  const [selectedVariantId, setSelectedVariantId] = React.useState<
    string | undefined
  >(initialVariant?.id);
  const urlInitialisedRef = React.useRef(false);

  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ?? initialVariant;

  React.useEffect(() => {
    setSelectedVariantId(initialVariant?.id);
  }, [initialVariant?.id]);

  React.useEffect(() => {
    if (urlInitialisedRef.current) return;
    urlInitialisedRef.current = true;
    const requested = readVariantParam();
    if (!requested) return;
    const matched = variants.find((variant) => variant.id === requested);
    if (matched) {
      setSelectedVariantId(matched.id);
    } else {
      // Invalid or inactive variant URLs fall back to the default finish and
      // replace the unsafe parameter instead of rendering an error.
      writeVariantParam(initialVariant?.id);
    }
  }, [initialVariant?.id, variants]);

  React.useEffect(() => {
    if (!urlInitialisedRef.current) return;
    writeVariantParam(selectedVariant?.id);
  }, [selectedVariant?.id]);

  React.useEffect(() => {
    const handler = () => {
      const requested = readVariantParam();
      if (!requested) return;
      const matched = variants.find((variant) => variant.id === requested);
      if (matched) setSelectedVariantId(matched.id);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [variants]);

  const selectedValue = selectedVariant
    ? finishOption?.values.find(
        (value) => value.id === selectedVariant.optionValueId
      )
    : undefined;

  const selectedFinishName =
    selectedValue?.name ?? selectedVariant?.finishName ?? '';

  const isUnavailable = Boolean(
    selectedVariant &&
      (selectedVariant.availability === 'out_of_stock' ||
        selectedVariant.stockQuantity === 0)
  );

  const galleryMainImage =
    getVariantPrimaryImage(selectedVariant) || product.image;
  const galleryImages = toProductImages(product, selectedVariant);

  const enquiryMessage = React.useMemo(() => {
    const productPath =
      division === 'metal_services'
        ? `/metal-coating/product/${product.slug || product.id}`
        : `/home-decor/${product.slug || product.id}`;
    const productUrl = origin ? `${origin}${productPath}` : productPath;

    const message = buildRichProductEnquiryMessage({
      division,
      productName: product.name,
      category: categoryName || product.category,
      variant: selectedVariant,
      productUrl,
    });

    if (isUnavailable) {
      return `${message}\n\nI understand this finish is currently unavailable and would like the next available option.`;
    }
    return message;
  }, [
    categoryName,
    division,
    isUnavailable,
    origin,
    product.category,
    product.id,
    product.name,
    product.slug,
    selectedVariant,
  ]);

  const selectVariant = React.useCallback((variantId: string) => {
    setSelectedVariantId(variantId);
  }, []);

  const value = React.useMemo<ProductVariantContextValue>(
    () => ({
      product,
      variants,
      finishOption,
      choices,
      selectedVariant,
      selectedValue,
      selectedFinishName,
      isUnavailable,
      galleryMainImage,
      galleryImages,
      galleryKey: selectedVariant?.id ?? `${product.id}-legacy`,
      selectVariant,
      enquiryMessage,
    }),
    [
      choices,
      enquiryMessage,
      finishOption,
      galleryImages,
      galleryMainImage,
      isUnavailable,
      product,
      selectVariant,
      selectedFinishName,
      selectedVariant,
      selectedValue,
      variants,
    ]
  );

  return (
    <ProductVariantContext.Provider value={value}>
      {children}
    </ProductVariantContext.Provider>
  );
}

export function useProductVariantContext(): ProductVariantContextValue {
  const context = React.useContext(ProductVariantContext);
  if (!context) {
    throw new Error(
      'ProductVariantProvider is required around variant-aware product components.'
    );
  }
  return context;
}
