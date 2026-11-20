'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Eye, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppEnquiryButton } from '@/components/enquiry/whatsapp-enquiry-button';
import { useWishlist } from '@/components/providers/wishlist-provider';
import { cn, normalizeImageSrc } from '@/lib/utils';
import type { Product } from '@/lib/types';
import {
  getDefaultVariant,
  getVariantPrimaryImage,
  sortProductVariants,
} from '@/lib/supabase/product-variants';
import {
  buildProductEnquiryHref,
  buildRichProductEnquiryMessage,
  formatCategoryLabel,
} from '@/lib/product-variants/enquiry';

interface MetalProductCardProps {
  product: Product;
  division?: 'metal_services' | 'home_decor';
}

export function MetalProductCard({
  product,
  division = 'metal_services',
}: MetalProductCardProps) {
  const [origin, setOrigin] = useState('');
  const [isPending, setIsPending] = useState(false);
  const { isInWishlist, toggleItem } = useWishlist();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const productSlug = product.slug || product.id;
  const productDetailLink =
    division === 'metal_services'
      ? `/metal-coating/product/${productSlug}`
      : `/home-decor/${productSlug}`;

  const isSaved =
    isInWishlist(product.id) || (product.slug ? isInWishlist(product.slug) : false);

  const activeVariants = useMemo(
    () => sortProductVariants((product.variants ?? []).filter((variant) => variant.isActive)),
    [product.variants]
  );
  const defaultVariant = useMemo(
    () => getDefaultVariant(activeVariants),
    [activeVariants]
  );

  const productImage =
    normalizeImageSrc(
      getVariantPrimaryImage(defaultVariant) || product.cardImage || product.image
    ) || '/images/placeholder.png';
  const finishLabel =
    defaultVariant?.finishName?.trim() ||
    product.colorFinish?.trim() ||
    product.material?.trim() ||
    '';
  const categoryLabel = formatCategoryLabel(product.category || '');
  const productUrl = origin ? `${origin}${productDetailLink}` : productDetailLink;

  const whatsappMessage = buildRichProductEnquiryMessage({
    division,
    productName: product.name,
    category: product.category,
    variant: defaultVariant,
    productUrl,
  });
  const enquiryHref = buildProductEnquiryHref({
    division,
    productId: product.id,
    productName: product.name,
    variantId: defaultVariant?.id,
    finishName: defaultVariant?.finishName,
    sku: defaultVariant?.sku,
  });

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
    <div
      className="flex h-full min-w-0 flex-col"
      data-testid="metal-product-card"
      data-product-id={product.id}
    >
      <div className="group/image relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-2xl bg-muted">
        <Image
          src={productImage}
          alt={product.name}
          fill
          sizes="(max-width: 767px) 60vw, (max-width: 1199px) 30vw, 22vw"
          quality={70}
          className="object-cover transition-transform duration-700 ease-out group-hover/image:scale-105"
          loading="lazy"
        />

        <div
          className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover/image:bg-black/20 group-focus-within/image:bg-black/20"
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={isPending}
          aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isSaved}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : (
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                isSaved ? 'fill-gold-deep text-gold-deep' : 'fill-transparent text-ink'
              )}
              aria-hidden="true"
            />
          )}
        </button>

        <div className="absolute inset-x-3 bottom-3 z-20 flex translate-y-0 opacity-100 transition-all duration-500 sm:translate-y-3 sm:opacity-0 sm:group-hover/image:translate-y-0 sm:group-hover/image:opacity-100 sm:group-focus-within/image:translate-y-0 sm:group-focus-within/image:opacity-100">
          <Button
            asChild
            size="sm"
            className="h-11 w-full rounded-full bg-white/95 text-ink shadow-sm backdrop-blur-md hover:bg-white sm:h-10"
          >
            <Link href={productDetailLink}>
              <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
              View Details
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <div className="min-w-0">
          <Link href={productDetailLink} className="block">
            <h3 className="line-clamp-2 min-h-[2.8em] text-[13px] font-semibold leading-[1.4] text-foreground transition-colors hover:text-gold-deep sm:line-clamp-none sm:min-h-0 sm:text-sm sm:leading-snug">
              {product.name}
            </h3>
          </Link>
          {categoryLabel && (
            <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
              {categoryLabel}
            </p>
          )}
          {finishLabel && (
            <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">
              {finishLabel}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <WhatsAppEnquiryButton
            mode={division}
            message={whatsappMessage}
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full border-[#25D366]/40 bg-white text-[#25D366] hover:bg-[#25D366]/5"
            ariaLabel="Enquire on WhatsApp"
            title="Enquire on WhatsApp"
            showIcon
          />
          <Button
            asChild
            className="group/enquire h-10 min-h-[40px] flex-1 rounded-full bg-ink px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-ink/90 focus-visible:ring-2 focus-visible:ring-gold/50 sm:text-sm"
          >
            <Link href={enquiryHref}>
              <span className="truncate">Enquire Now</span>
              <ArrowRight
                className="ml-2 h-4 w-4 shrink-0 transition-transform duration-200 group-hover/enquire:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
