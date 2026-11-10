'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ProductImage } from '@/lib/types';

interface ProductImageGalleryProps {
  mainImage: string;
  productName: string;
  badge?: string;
  images?: ProductImage[];
}

interface GalleryEntry {
  url: string;
  alt: string;
}

export function ProductImageGallery({
  mainImage,
  productName,
  badge,
  images = [],
}: ProductImageGalleryProps) {
  const orderedImages = [...images].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });

  const allImageUrls: GalleryEntry[] = [];

  if (mainImage?.trim()) {
    allImageUrls.push({ url: mainImage.trim(), alt: productName });
  }

  orderedImages.forEach((img) => {
    const url = img.imageUrl?.trim();
    if (url && !allImageUrls.some((item) => item.url === url)) {
      allImageUrls.push({ url, alt: img.altText?.trim() || productName });
    }
  });

  const [selectedUrl, setSelectedUrl] = useState<string>(allImageUrls[0]?.url ?? '');
  const selectedImage =
    allImageUrls.find((item) => item.url === selectedUrl) ?? allImageUrls[0];

  return (
    <div className="space-y-4">
      {/* Primary Display */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-muted shadow-2xl">
        {selectedImage ? (
          <Image
            src={selectedImage.url}
            alt={selectedImage.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-all duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Product image coming soon
          </div>
        )}
        {badge && (
          <span className="absolute left-5 top-5 rounded-full bg-gold/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink backdrop-blur-md">
            {badge}
          </span>
        )}
      </div>

      {/* Thumbnails Gallery */}
      {allImageUrls.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {allImageUrls.map((item, idx) => {
            const isSelected = selectedImage?.url === item.url;
            return (
              <button
                key={item.url}
                type="button"
                onClick={() => setSelectedUrl(item.url)}
                aria-label={`View image ${idx + 1} of ${allImageUrls.length} for ${productName}`}
                aria-pressed={isSelected}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
                  isSelected
                    ? 'border-gold ring-2 ring-gold/40'
                    : 'border-border opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={item.url}
                  alt={item.alt}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
