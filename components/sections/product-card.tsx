'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Star, X, ArrowRight, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Product, ProductImage, ProductOptionValue } from '@/lib/types';
import { getProductGalleryImages, sortGalleryImages } from '@/lib/supabase/product-gallery';
import { getDefaultVariant, getVariantPrimaryImage, sortProductVariants } from '@/lib/supabase/product-variants';
import {
  buildProductEnquiryHref,
  buildRichProductEnquiryMessage,
  formatCategoryLabel,
} from '@/lib/product-variants/enquiry';
import {
  getCompactFinishLabel,
  getFinishSwatchVisual,
} from '@/lib/product-variants/swatch';
import { normalizeImageSrc } from '@/lib/utils';

import { WhatsAppEnquiryButton } from '@/components/enquiry/whatsapp-enquiry-button';
import { useWishlist } from '@/components/providers/wishlist-provider';

interface ProductCardProps {
  product: Product;
  division?: 'home_decor' | 'metal_services';
  dataTestId?: string;
}

function FinishSwatchPreview({
  finishName,
  value,
}: {
  finishName: string;
  value?: ProductOptionValue;
}) {
  const visual = getFinishSwatchVisual(finishName, value);

  if (visual.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={visual.imageUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="h-full w-full rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="block h-full w-full rounded-full"
      style={{ background: visual.background }}
    />
  );
}

export function ProductCard({ product, division = 'home_decor', dataTestId = 'product-card' }: ProductCardProps) {
  const [quickView, setQuickView] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [origin, setOrigin] = useState('');
  const { isInWishlist, toggleItem } = useWishlist();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  // Only the customer's explicit choice is stored. The effective selection is
  // derived, so the configured default finish is active on the first render
  // and a stale id from a previous product can never be reused.
  const [chosenVariantId, setChosenVariantId] = useState<string | undefined>(undefined);

  const activeVariants = useMemo(
    () => sortProductVariants((product.variants ?? []).filter((variant) => variant.isActive)),
    [product.variants]
  );
  const defaultVariant = useMemo(
    () => getDefaultVariant(activeVariants),
    [activeVariants]
  );
  const selectedVariant = useMemo(() => {
    const chosen = chosenVariantId
      ? activeVariants.find((variant) => variant.id === chosenVariantId)
      : undefined;
    return chosen ?? defaultVariant;
  }, [chosenVariantId, activeVariants, defaultVariant]);

  const finishOption = useMemo(
    () =>
      (product.options ?? []).find((option) => option.slug === 'finish') ??
      (product.options ?? [])[0],
    [product.options]
  );
  const finishValuesByVariantId = useMemo(() => {
    const values = new Map<string, ProductOptionValue>();
    for (const variant of activeVariants) {
      const value = finishOption?.values.find(
        (optionValue) => optionValue.id === variant.optionValueId
      );
      if (value) values.set(variant.id, value);
    }
    return values;
  }, [activeVariants, finishOption]);

  const productSlug = product.slug || product.id;
  const isSaved = isInWishlist(product.id) || (product.slug ? isInWishlist(product.slug) : false);
  const productDetailLink = division === 'metal_services' ? `/metal-coating/product/${productSlug}` : `/home-decor/${productSlug}`;
  const enquiryWhatsAppMessage = useMemo(() => {
    const productUrl = origin ? `${origin}${productDetailLink}` : productDetailLink;
    return buildRichProductEnquiryMessage({
      division: division === 'metal_services' ? 'metal_services' : 'home_decor',
      productName: product.name,
      category: product.category,
      variant: selectedVariant,
      productUrl,
    });
  }, [division, origin, product.category, product.name, productDetailLink, selectedVariant]);
  const productEnquiryHref = useMemo(
    () =>
      buildProductEnquiryHref({
        division: division === 'metal_services' ? 'metal_services' : 'home_decor',
        productId: product.id,
        productName: product.name,
        variantId: selectedVariant?.id,
        finishName: selectedVariant?.finishName,
        sku: selectedVariant?.sku,
      }),
    [division, product.id, product.name, selectedVariant]
  );
  const productImageFallback = normalizeImageSrc(product.image) || '/images/placeholder.png';
  const displayCategory = formatCategoryLabel(product.category || '') || (division === 'metal_services' ? 'Metal Services' : 'Home Decor');
  const displayFinish =
    selectedVariant?.finishName?.trim() ||
    product.colorFinish?.trim() ||
    product.material?.trim() ||
    '';
  const hasVariants = activeVariants.length > 0;

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isPending) return;

    setIsPending(true);
    try {
      await toggleItem(product.id);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <div
        className="group relative flex h-full flex-col rounded-2xl border border-border/60 bg-background"
        data-testid={dataTestId}
        data-product-id={product.id}
        data-has-variants={hasVariants ? 'true' : 'false'}
      >
        {/* 1. Product Image */}
        <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-t-2xl bg-muted">
          <Image
            src={normalizeImageSrc(
              getVariantPrimaryImage(selectedVariant) || product.cardImage || product.image
            ) || productImageFallback}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={70}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {product.badge && (
            <span
              className={cn(
                'absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md',
                product.badge === 'Bestseller' && 'bg-gold/90 text-ink',
                product.badge === 'New' && 'bg-white/90 text-ink',
                product.badge === 'Limited' && 'bg-ink/80 text-white'
              )}
            >
              {product.badge}
            </span>
          )}

          <button
            onClick={handleWishlistToggle}
            disabled={isPending}
            aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isSaved}
            data-testid="wishlist-toggle"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur-md transition-all hover:bg-white disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors',
                  isSaved && 'fill-destructive text-destructive'
                )}
              />
            )}
          </button>

          <div className="absolute inset-x-3 bottom-3 flex translate-y-0 gap-2 opacity-100 transition-all duration-500 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
            <Button
              asChild
              size="sm"
              className="h-10 flex-1 rounded-full bg-ink/90 text-white backdrop-blur-md hover:bg-ink"
            >
              <Link href={productDetailLink}>View Details</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-10 w-10 shrink-0 rounded-full bg-white/90 px-0 text-ink backdrop-blur-md hover:bg-white"
              onClick={() => setQuickView(true)}
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Info + Actions */}
        <div className="flex flex-1 flex-col p-3 sm:p-4" data-testid="product-card-content">
          <div className="flex flex-1 flex-col gap-2">
            {/* 2. Product Name */}
            <Link href={productDetailLink} className="block min-w-0">
              <h3
                data-testid="product-card-name"
                className="break-words [overflow-wrap:anywhere] text-[13px] font-semibold leading-[1.4] text-foreground transition-colors hover:text-gold-deep sm:text-sm sm:leading-snug [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden"
              >
                {product.name}
              </h3>
            </Link>

            {/* 3. Product Category */}
            <p
              data-testid="product-card-category"
              className="break-words [overflow-wrap:anywhere] text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden"
            >
              {displayCategory}
            </p>

            {/* 4. Product Finish */}
            <p
              data-testid="product-card-finish"
              className={cn(
                'min-h-[1.25rem] break-words [overflow-wrap:anywhere] text-xs leading-5 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden',
                displayFinish ? 'text-muted-foreground' : 'text-transparent'
              )}
              aria-label={displayFinish ? `Finish: ${displayFinish}` : undefined}
            >
              {displayFinish || 'Finish'}
            </p>

            {/* 5. Product Variants (only when available) */}
            {hasVariants && (
              <div
                className="mt-0.5 w-full min-w-0"
                data-testid="product-card-variants"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/70">
                    Variants
                  </span>
                  <span
                    data-testid="selected-finish-name"
                    aria-live="polite"
                    className="min-w-0 break-words [overflow-wrap:anywhere] text-right text-[10px] font-medium text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden"
                  >
                    {selectedVariant?.finishName}
                  </span>
                </div>

                <div
                  role="group"
                  aria-label={`Select a finish for ${product.name}`}
                  data-testid="finish-swatches"
                  className="mt-1.5 flex w-full touch-pan-x flex-row flex-nowrap items-start gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {activeVariants.map((variant, index) => {
                    const value = finishValuesByVariantId.get(variant.id);
                    const finishName =
                      value?.name || variant.finishName || `Finish ${index + 1}`;
                    const compactLabel = getCompactFinishLabel(finishName);
                    const isSelected = selectedVariant?.id === variant.id;
                    const isAvailable =
                      variant.availability !== 'out_of_stock' &&
                      variant.stockQuantity !== 0;
                    const variantImage = normalizeImageSrc(getVariantPrimaryImage(variant));

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={`${finishName}${isAvailable ? '' : ' (unavailable)'}`}
                        title={finishName}
                        data-variant-id={variant.id}
                        data-variant-sku={variant.sku ?? undefined}
                        data-variant-finish={finishName}
                        data-variant-image={variantImage ?? undefined}
                        data-variant-available={isAvailable}
                        onClick={() => setChosenVariantId(variant.id)}
                        className={cn(
                          'group/finish flex w-11 shrink-0 flex-col items-center gap-1 rounded-md py-0.5 text-center transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                          isAvailable ? 'opacity-100' : 'opacity-50'
                        )}
                      >
                        <span
                          className={cn(
                            'relative flex h-[24px] w-[24px] items-center justify-center rounded-full border transition-transform duration-200',
                            isSelected
                              ? 'border-gold-deep ring-2 ring-gold/45 ring-offset-1 ring-offset-background'
                              : 'border-border/80 group-hover/finish:scale-105 group-focus-visible/finish:scale-105'
                          )}
                        >
                          <span className="absolute inset-[2px] overflow-hidden rounded-full">
                            <FinishSwatchPreview finishName={finishName} value={value} />
                          </span>
                          {!isAvailable && (
                            <span
                              aria-hidden="true"
                              className="absolute inset-[2px] rounded-full bg-background/45"
                            />
                          )}
                          {isSelected && (
                            <Check
                              aria-hidden="true"
                              strokeWidth={3}
                              className="relative z-10 h-3 w-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
                            />
                          )}
                        </span>
                        <span
                          className={cn(
                            'w-full truncate text-[10px] leading-none',
                            isSelected
                              ? 'font-semibold text-foreground'
                              : 'font-medium text-muted-foreground'
                          )}
                        >
                          {compactLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 6. WhatsApp + 7. Enquire Now (always last, bottom-aligned) */}
          <div className="mt-auto pt-3" data-testid="product-card-actions">
            <div className="flex items-center gap-2">
              <WhatsAppEnquiryButton
                mode={division}
                message={enquiryWhatsAppMessage}
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/5"
                ariaLabel="Enquire on WhatsApp"
                title="Enquire on WhatsApp"
                showIcon
              />
              <Button
                asChild
                data-testid="product-card-enquire"
                className="h-10 min-h-[40px] min-w-0 flex-1 rounded-full bg-ink px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-ink/90 sm:px-4 sm:text-sm"
              >
                <Link href={productEnquiryHref} className="min-w-0">
                  <span className="truncate">Enquire Now</span>
                  <ArrowRight className="ml-1.5 h-4 w-4 shrink-0 sm:ml-2" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {quickView && (
          <QuickViewModal product={product} division={division} onClose={() => setQuickView(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
   Polished centered Quick-View Modal
Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
const GALLERY_CACHE_TTL_MS = 5 * 60 * 1000;
const galleryCache = new Map<string, { images: ProductImage[]; ts: number }>();

function QuickViewModal({
  product,
  division = 'home_decor',
  onClose,
}: {
  product: Product;
  division?: 'home_decor' | 'metal_services';
  onClose: () => void;
}) {
  const productSlug = product.slug || product.id;
  const productDetailLink = division === 'metal_services' ? `/metal-coating/product/${productSlug}` : `/home-decor/${productSlug}`;
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const quickViewWhatsAppMessage = useMemo(() => {
    const productUrl = origin ? `${origin}${productDetailLink}` : productDetailLink;
    return buildRichProductEnquiryMessage({
      division: division === 'metal_services' ? 'metal_services' : 'home_decor',
      productName: product.name,
      category: product.category,
      productUrl,
    });
  }, [division, origin, product.category, product.name, productDetailLink]);
  const quickViewEnquiryHref = buildProductEnquiryHref({
    division: division === 'metal_services' ? 'metal_services' : 'home_decor',
    productId: product.id,
    productName: product.name,
  });

  const productIdRef = useRef(product.id);
  const requestIdRef = useRef(0);
  const [galleryImages, setGalleryImages] = useState<ProductImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);

  const buildGalleryItems = useMemo(() => {
    const mainImageUrl = product.cardImage || product.image;
    const mainImage: ProductImage = {
      id: `${product.id}::main`,
      productId: product.id,
      imageUrl: mainImageUrl,
      altText: product.name,
      sortOrder: -1,
      isPrimary: true,
    };

    const additionalImages = (product.images ?? galleryImages).filter(
      (image) => Boolean(image.imageUrl) && image.imageUrl !== mainImageUrl
    );

    return sortGalleryImages([mainImage, ...additionalImages]);
  }, [
    product.id,
    product.cardImage,
    product.image,
    product.name,
    product.images,
    galleryImages,
  ]);

  const additionalImages = buildGalleryItems.slice(1);

  const loadGallery = useCallback(async () => {
    if (product.images && product.images.length > 0) {
      setGalleryImages(product.images);
      return;
    }

    const cached = galleryCache.get(product.id);
    if (cached && Date.now() - cached.ts < GALLERY_CACHE_TTL_MS) {
      setGalleryImages(cached.images);
      return;
    }

    const requestId = ++requestIdRef.current;
    setGalleryLoading(true);
    setGalleryError(null);

    try {
      const images = await getProductGalleryImages(product.id);
      if (requestId !== requestIdRef.current) return;
      setGalleryImages(images);
      galleryCache.set(product.id, { images, ts: Date.now() });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setGalleryError(
        error instanceof Error ? error.message : 'The additional images could not be loaded.'
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setGalleryLoading(false);
      }
    }
  }, [product.id, product.images]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  useEffect(() => {
    if (buildGalleryItems.length === 0) return;
    if (
      selectedImage &&
      buildGalleryItems.some(
        (item) => item.id === selectedImage.id || item.imageUrl === selectedImage.imageUrl
      )
    ) {
      return;
    }
    setSelectedImage(buildGalleryItems[0] ?? null);
  }, [buildGalleryItems, selectedImage, product.id]);

  useEffect(() => {
    productIdRef.current = product.id;
    setSelectedImage(null);
    setGalleryImages([]);
    setGalleryError(null);
    setGalleryLoading(false);
  }, [product.id]);

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Prevent background scroll while modal is open Ã¢â€â‚¬Ã¢â€â‚¬ */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Close on Escape key Ã¢â€â‚¬Ã¢â€â‚¬ */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Dark overlay / backdrop Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <motion.div
        key="qv-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-[3px]"
        aria-hidden="true"
      />

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Centering wrapper (flex so the modal is always in the viewport centre) Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
        <motion.div
          key="qv-modal"
          initial={{ opacity: 0, scale: 0.93, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 32 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view: ${product.name}`}
          /* Stop click from bubbling through to the backdrop */
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl max-h-[90dvh] overflow-y-auto rounded-3xl bg-background shadow-[0_40px_100px_-10px_rgba(0,0,0,0.4)] ring-1 ring-border/30"
        >
          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Close button Ã¢â€â‚¬Ã¢â€â‚¬ */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-background/90 shadow-lg ring-1 ring-border/50 backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-muted"
            aria-label="Close quick view"
          >
            <X className="h-[15px] w-[15px] text-foreground" />
          </button>

          <div className="grid sm:grid-cols-[1fr_1.1fr]">
            {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Left Ã¢â‚¬â€ Large Product Image Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
            <div className="relative min-h-[260px] sm:min-h-[500px]">
              <Image
                src={normalizeImageSrc(selectedImage?.imageUrl ?? (product.cardImage || product.image)) || '/images/placeholder.png'}
                alt={selectedImage?.altText ?? product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover"
                loading="eager"
              />
              {/* Subtle depth gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

              {product.badge && (
                <span
                  className={cn(
                    'absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md',
                    product.badge === 'Bestseller' && 'bg-gold/90 text-ink',
                    product.badge === 'New' && 'bg-white/90 text-ink',
                    product.badge === 'Limited' && 'bg-ink/80 text-white'
                  )}
                >
                  {product.badge}
                </span>
              )}
            </div>

            {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Right Ã¢â‚¬â€ Product Details Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
            <div className="flex flex-col justify-between gap-8 p-7 sm:p-9">
              <div className="space-y-0">
                {/* Category eyebrow */}
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-deep">
                  {product.category.replace(/-/g, ' ')}
                </p>

                {/* Product name */}
                <h2 className="font-display text-2xl font-medium leading-tight tracking-tight text-foreground sm:text-[1.75rem]">
                  {product.name}
                </h2>

                {/* Star rating */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-[13px] w-[13px]',
                          i < Math.round(product.rating)
                            ? 'fill-gold text-gold'
                            : 'fill-muted-foreground/20 text-muted-foreground/40'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {product.rating} / 5
                  </span>
                </div>

                {/* Divider */}
                <div className="my-5 h-px bg-border/60" />

                {/* Short description */}
                <p className="text-sm leading-[1.7] text-muted-foreground">
                  {product.shortDescription || product.description}
                </p>

                {/* Attribute pills Ã¢â‚¬â€ only rendered when data is available */}
                {(product.material || product.colorFinish || product.dimensions) && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {product.material && (
                      <span className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                        {product.material}
                      </span>
                    )}
                    {product.colorFinish && (
                      <span className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                        {product.colorFinish}
                      </span>
                    )}
                    {product.dimensions && (
                      <span className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                        {product.dimensions}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {galleryLoading && (
                <p className="text-xs text-muted-foreground">Loading more imagesâ€¦</p>
              )}

              {galleryError && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {galleryError}
                  <button
                    onClick={loadGallery}
                    className="underline underline-offset-4 text-gold hover:text-gold-deep"
                  >
                    Retry
                  </button>
                </div>
              )}

              {additionalImages.length > 0 && (
                <div className="space-y-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-deep">
                    More Images
                  </p>

                  <div
                    role="group"
                    aria-label="Additional product images"
                    className={cn(
                      'flex flex-row gap-2 overflow-x-auto sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:overflow-visible',
                      'pb-1'
                    )}
                  >
                    {additionalImages.map((image, index) => {
                      const isSelected = selectedImage?.imageUrl === image.imageUrl;
                      return (
                        <button
                          key={image.id}
                          onClick={() => setSelectedImage(image)}
                          aria-pressed={isSelected}
                          aria-label={image.altText || `Image ${index + 1} of ${product.name}`}
                          className={cn(
                            'relative flex-shrink-0 aspect-square rounded border transition-colors duration-200',
                            'border-transparent hover:border-muted/50 focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-1',
                            isSelected
                              ? 'border-[#C9A96E] ring-1 ring-[#C9A96E]/60'
                              : 'border-transparent'
                          )}
                        >
                          <Image
                            src={normalizeImageSrc(image.imageUrl) || '/images/placeholder.png'}
                            alt={image.altText || `Image ${index + 1} of ${product.name}`}
                            fill
                            sizes="(max-width: 768px) 80px, (max-width: 1024px) 120px, 150px"
                            className="object-contain rounded"
                            loading="lazy"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ã¢â€â‚¬Ã¢â€â‚¬ Action buttons Ã¢â€â‚¬Ã¢â€â‚¬ */}
              <div className="flex flex-col gap-3">
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-full"
                >
                  <Link href={quickViewEnquiryHref} onClick={onClose}>
                    Enquire Now
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>

                <WhatsAppEnquiryButton
                  mode={division}
                  message={quickViewWhatsAppMessage}
                  label="Enquire via WhatsApp"
                  variant="outline"
                  size="lg"
                  showIcon
                  className="w-full rounded-full border-[#25D366]/40 text-[#25D366]"
                />

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full rounded-full"
                >
                  <Link href={productDetailLink} onClick={onClose}>
                    View Full Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
