'use client';

import { ProductImageGallery } from '@/components/sections/product-image-gallery';
import { useProductVariantContext } from '@/components/products/product-variant-provider';

export function VariantImageGallery() {
  const { product, galleryMainImage, galleryImages, galleryKey } =
    useProductVariantContext();

  return (
    <ProductImageGallery
      mainImage={galleryMainImage}
      productName={product.name}
      badge={product.badge}
      images={galleryImages}
      resetKey={galleryKey}
    />
  );
}
