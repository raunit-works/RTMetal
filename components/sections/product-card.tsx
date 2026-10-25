'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Star, X, MessageCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';

import { getHomeDecorWhatsAppLink } from '@/lib/site';

import { useWishlist } from '@/components/providers/wishlist-provider';

export function ProductCard({ product }: { product: Product }) {
  const [quickView, setQuickView] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { isInWishlist, toggleItem } = useWishlist();

  const productSlug = product.slug || product.id;
  const isSaved = isInWishlist(product.id) || (product.slug ? isInWishlist(product.slug) : false);

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
      <div className="group relative">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
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
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink backdrop-blur-md transition-all hover:bg-white disabled:opacity-50"
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

          <div className="absolute inset-x-3 bottom-3 flex translate-y-3 gap-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <Button
              asChild
              size="sm"
              className="flex-1 rounded-full bg-ink/90 text-white backdrop-blur-md hover:bg-ink"
            >
              <Link href={`/home-decor/${productSlug}`}>View Details</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full bg-white/80 px-3 text-ink backdrop-blur-md hover:bg-white"
              onClick={() => setQuickView(true)}
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-2">
          <div>
            <Link href={`/home-decor/${productSlug}`}>
              <h3 className="text-sm font-semibold leading-snug transition-colors hover:text-gold-deep">
                {product.name}
              </h3>
            </Link>
            <div className="mt-1 flex items-center gap-1">
              <Star className="h-3 w-3 fill-gold text-gold" />
              <span className="text-xs text-muted-foreground">
                {product.rating} · {product.category.replace('-', ' ')}
              </span>
            </div>
          </div>
          <div className="text-right">
            <Button asChild className="rounded-full bg-[#25D366] text-white hover:bg-[#25D366]/90">
              <a
                href={getHomeDecorWhatsAppLink(
                  `Hello RT METALS, I am interested in ${product.name}. Please share more details.`
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Enquire Now
              </a>
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {quickView && (
          <QuickViewModal product={product} onClose={() => setQuickView(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Polished centered Quick-View Modal
───────────────────────────────────────────────────────────────── */
function QuickViewModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const productSlug = product.slug || product.id;
  const whatsappMsg = `Hello RT METALS, I am interested in ${product.name}. Please share more details.`;

  /* ── Prevent background scroll while modal is open ── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* ── Close on Escape key ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* ── Dark overlay / backdrop ── */}
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

      {/* ── Centering wrapper (flex so the modal is always in the viewport centre) ── */}
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
          className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-background shadow-[0_40px_100px_-10px_rgba(0,0,0,0.4)] ring-1 ring-border/30"
        >
          {/* ── Close button ── */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-lg ring-1 ring-border/50 backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-muted"
            aria-label="Close quick view"
          >
            <X className="h-[15px] w-[15px] text-foreground" />
          </button>

          <div className="grid sm:grid-cols-[1fr_1.1fr]">
            {/* ────────── Left — Large Product Image ────────── */}
            <div className="relative min-h-[260px] sm:min-h-[500px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover"
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

            {/* ────────── Right — Product Details ────────── */}
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

                {/* Attribute pills — only rendered when data is available */}
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

              {/* ── Action buttons ── */}
              <div className="flex flex-col gap-3">
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-full bg-[#25D366] text-white shadow-sm hover:bg-[#22c15e] focus-visible:ring-[#25D366]/50"
                >
                  <a
                    href={getHomeDecorWhatsAppLink(whatsappMsg)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Enquire via WhatsApp
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full rounded-full"
                >
                  <Link href={`/home-decor/${productSlug}`} onClick={onClose}>
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
