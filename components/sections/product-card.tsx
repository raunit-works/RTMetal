'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Star, X, MessageCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Product, ProductImage } from '@/lib/types';
import { getProductGalleryImages, sortGalleryImages } from '@/lib/supabase/product-gallery';

import { getHomeDecorWhatsAppLink, isHomeDecorWhatsappVerified, getMetalCoatingWhatsAppLink } from '@/lib/site';

import { useWishlist } from '@/components/providers/wishlist-provider';

interface ProductCardProps {
  product: Product;
  division?: 'home_decor' | 'metal_services';
}

export function ProductCard({ product, division = 'home_decor' }: ProductCardProps) {
  const [quickView, setQuickView] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { isInWishlist, toggleItem } = useWishlist();

  const productSlug = product.slug || product.id;
  const isSaved = isInWishlist(product.id) || (product.slug ? isInWishlist(product.slug) : false);
  const productDetailLink = division === 'metal_services' ? `/metal-coating/product/${productSlug}` : `/home-decor/${productSlug}`;
  const productWhatsAppUrl = division === 'metal_services'
    ? getMetalCoatingWhatsAppLink(`Hello RTMETALCOATING, I am interested in ${product.name}. Please share more details.`)
    : getHomeDecorWhatsAppLink(`Hello RTMETALCOATING, I am interested in ${product.name}. Please share more details.`);

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
      <div className="group relative flex h-full flex-col">
        <div className="relative aspect-[4/5] shrink-0 overflow-hidden rounded-2xl bg-muted">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
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
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-ink backdrop-blur-md transition-all hover:bg-white disabled:opacity-50 sm:h-9 sm:w-9"
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
              className="h-11 flex-1 rounded-full bg-ink/90 text-white backdrop-blur-md hover:bg-ink sm:h-9"
            >
              <Link href={productDetailLink}>View Details</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-11 w-11 shrink-0 rounded-full bg-white/80 px-0 text-ink backdrop-blur-md hover:bg-white sm:h-9 sm:w-9"
              onClick={() => setQuickView(true)}
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-1 flex-col gap-3 sm:mt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
          <div className="min-w-0 sm:flex-1">
            <Link href={productDetailLink} className="block">
              <h3 className="line-clamp-2 min-h-[2.8em] text-[13px] font-semibold leading-[1.4] transition-colors hover:text-gold-deep sm:line-clamp-none sm:min-h-0 sm:text-sm sm:leading-snug">
                {product.name}
              </h3>
            </Link>
            <div className="mt-1 hidden items-center gap-1 sm:flex">
              <Star className="h-3 w-3 fill-gold text-gold" />
              <span className="text-xs text-muted-foreground">
                {product.rating} Â· {product.category.replace('-', ' ')}
              </span>
            </div>
          </div>
          <div className="mt-auto w-full sm:mt-0 sm:w-auto sm:shrink-0 sm:text-right">
            {productWhatsAppUrl ? (
              <Button
                asChild
                className="h-auto min-h-[44px] w-full rounded-full bg-[#25D366] px-4 text-sm text-ink hover:bg-[#25D366]/90 sm:h-10 sm:min-h-0 sm:w-auto"
              >
                <a
                  href={productWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Enquire Now
                </a>
              </Button>
            ) : (
              <Button
                disabled
                className="h-auto min-h-[44px] w-full cursor-not-allowed rounded-full border border-[#25D366]/25 bg-[#25D366]/10 px-4 text-sm text-muted-foreground disabled:opacity-100 sm:h-10 sm:min-h-0 sm:w-auto"
              >
                Enquire Now
              </Button>
            )}
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Polished centered Quick-View Modal
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
  const whatsappMsg = `Hello RTMETALCOATING, I am interested in ${product.name}. Please share more details.`;
  const quickViewWhatsAppUrl = division === 'metal_services'
    ? getMetalCoatingWhatsAppLink(whatsappMsg)
    : getHomeDecorWhatsAppLink(whatsappMsg);

  const productIdRef = useRef(product.id);
  const requestIdRef = useRef(0);
  const [galleryImages, setGalleryImages] = useState<ProductImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);

  const buildGalleryItems = useMemo(() => {
    const mainImage: ProductImage = {
      id: `${product.id}::main`,
      productId: product.id,
      imageUrl: product.image,
      altText: product.name,
      sortOrder: -1,
      isPrimary: true,
    };

    const additionalImages = (product.images ?? galleryImages).filter(
      (image) => Boolean(image.imageUrl) && image.imageUrl !== product.image
    );

    return sortGalleryImages([mainImage, ...additionalImages]);
  }, [product.id, product.image, product.name, product.images, galleryImages]);

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

  /* â”€â”€ Prevent background scroll while modal is open â”€â”€ */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* â”€â”€ Close on Escape key â”€â”€ */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* â”€â”€ Dark overlay / backdrop â”€â”€ */}
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

      {/* â”€â”€ Centering wrapper (flex so the modal is always in the viewport centre) â”€â”€ */}
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
          {/* â”€â”€ Close button â”€â”€ */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-background/90 shadow-lg ring-1 ring-border/50 backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-muted"
            aria-label="Close quick view"
          >
            <X className="h-[15px] w-[15px] text-foreground" />
          </button>

          <div className="grid sm:grid-cols-[1fr_1.1fr]">
            {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Left â€” Large Product Image â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="relative min-h-[260px] sm:min-h-[500px]">
              <Image
                src={selectedImage?.imageUrl ?? product.image}
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

            {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Right â€” Product Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

                {/* Attribute pills â€” only rendered when data is available */}
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
                <p className="text-xs text-muted-foreground">Loading more images…</p>
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
                            src={image.imageUrl}
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

              {/* â”€â”€ Action buttons â”€â”€ */}
              <div className="flex flex-col gap-3">
                {quickViewWhatsAppUrl ? (
                  <Button
                    asChild
                    size="lg"
                    className="w-full rounded-full bg-[#25D366] text-ink shadow-sm hover:bg-[#22c15e] focus-visible:ring-[#25D366]/50"
                  >
                    <a
                      href={quickViewWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Enquire via WhatsApp
                    </a>
                  </Button>
                ) : (
                  <Button
                    disabled
                    size="lg"
                    className="w-full cursor-not-allowed rounded-full border border-[#25D366]/25 bg-[#25D366]/10 text-muted-foreground disabled:opacity-100"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Enquire via WhatsApp
                  </Button>
                )}

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