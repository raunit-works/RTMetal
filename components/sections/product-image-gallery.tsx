'use client';

import { useState } from 'react';
import type { ProductImage } from '@/lib/types';

interface ProductImageGalleryProps {
  mainImage: string;
  productName: string;
  badge?: string;
  images?: ProductImage[];
}

export function ProductImageGallery({
  mainImage,
  productName,
  badge,
  images = [],
}: ProductImageGalleryProps) {
  // Build array of all unique image URLs
  const allImageUrls: { url: string; alt?: string }[] = [];
  
  if (mainImage) {
    allImageUrls.push({ url: mainImage, alt: productName });
  }

  images.forEach((img) => {
    if (img.imageUrl && !allImageUrls.some((item) => item.url === img.imageUrl)) {
      allImageUrls.push({ url: img.imageUrl, alt: img.altText || productName });
    }
  });

  const [selectedImage, setSelectedImage] = useState<string>(
    allImageUrls.length > 0 ? allImageUrls[0].url : mainImage
  );

  return (
    <div className="space-y-4">
      {/* Primary Display */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-muted shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={selectedImage}
          alt={productName}
          className="h-full w-full object-cover transition-all duration-500"
        />
        {badge && (
          <span className="absolute left-5 top-5 rounded-full bg-gold/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink backdrop-blur-md">
            {badge}
          </span>
        )}
      </div>

      {/* Thumbnails Gallery */}
      {allImageUrls.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {allImageUrls.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(item.url)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border transition-all ${
                selectedImage === item.url
                  ? 'border-gold ring-2 ring-gold/40'
                  : 'border-border opacity-70 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.alt || `${productName} preview ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
