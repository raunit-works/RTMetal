'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Eye, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/data';

export function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);
  const [quickView, setQuickView] = useState(false);

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
            onClick={() => setLiked((v) => !v)}
            aria-label="Add to wishlist"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink backdrop-blur-md transition-all hover:bg-white"
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                liked && 'fill-destructive text-destructive'
              )}
            />
          </button>

          <div className="absolute inset-x-3 bottom-3 flex translate-y-3 gap-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <Button
              size="sm"
              className="flex-1 rounded-full bg-ink/90 text-white backdrop-blur-md hover:bg-ink"
              onClick={() => setQuickView(true)}
            >
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
              Add to Cart
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full bg-white/80 px-3 text-ink backdrop-blur-md hover:bg-white"
              onClick={() => setQuickView(true)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold leading-snug">{product.name}</h3>
            <div className="mt-1 flex items-center gap-1">
              <Star className="h-3 w-3 fill-gold text-gold" />
              <span className="text-xs text-muted-foreground">
                {product.rating} · {product.category.replace('-', ' ')}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">${product.price}</p>
            {product.originalPrice && (
              <p className="text-xs text-muted-foreground line-through">
                ${product.originalPrice}
              </p>
            )}
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

function QuickViewModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[90] bg-ink/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-1/2 top-1/2 z-[100] w-[92%] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-background shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-md"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="grid sm:grid-cols-2">
          <div className="relative aspect-square sm:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-8">
            {product.badge && (
              <span className="mb-3 inline-flex w-fit rounded-full bg-gold/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-deep">
                {product.badge}
              </span>
            )}
            <h3 className="font-display text-2xl font-semibold">
              {product.name}
            </h3>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3.5 w-3.5',
                    i < Math.round(product.rating)
                      ? 'fill-gold text-gold'
                      : 'text-muted-foreground'
                  )}
                />
              ))}
              <span className="ml-1 text-xs text-muted-foreground">
                {product.rating}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-2xl font-semibold">${product.price}</span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <Button className="flex-1 rounded-full">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Button variant="outline" size="icon" className="rounded-full">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
