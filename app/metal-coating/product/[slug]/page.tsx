import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ProductDetailView } from '@/components/products/product-detail-view';
import {
  getPublicProductWithCategoriesAsync,
  getRelatedProductsForCategoryAsync,
} from '@/lib/data-access';
import { isCategoryInSection } from '@/lib/category-hierarchy';
import { getSiteUrlForPath } from '@/lib/site-url';

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { product, categories } = await getPublicProductWithCategoriesAsync(slug);

  if (!product) {
    return {
      title: 'Product Not Found | RTMETALCOATING',
      robots: { index: false, follow: false },
    };
  }

  const category = categories.find((item) => item.slug === product.category);

  if (!category || !isCategoryInSection(category, 'metal_services')) {
    return {
      title: 'Product Not Found | RTMETALCOATING',
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = getSiteUrlForPath(
    `/metal-coating/product/${product.slug || product.id}`
  );

  return {
    title: product.name,
    description: product.description.substring(0, 160),
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    openGraph: {
      title: `${product.name} — Metal Products | RTMETALCOATING`,
      description: product.description.substring(0, 160),
      url: canonicalUrl,
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.substring(0, 160),
      images: product.image ? [product.image] : [],
    },
  };
}

export default async function MetalProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { product, categories } = await getPublicProductWithCategoriesAsync(slug);

  if (!product) {
    notFound();
  }

  const category = categories.find((item) => item.slug === product.category);

  // Never default a missing or out-of-division category to the Metal division.
  if (!category) {
    notFound();
  }

  if (!isCategoryInSection(category, 'metal_services')) {
    if (isCategoryInSection(category, 'home_decor')) {
      redirect(`/home-decor/${product.slug || product.id}`);
    }
    notFound();
  }

  // Only the related products for this category are loaded.
  const relatedProducts = await getRelatedProductsForCategoryAsync(
    categories,
    product.category,
    product.id,
    4
  );

  return (
    <ProductDetailView
      product={product}
      division="metal_services"
      categoryName={category.name}
      relatedProducts={relatedProducts}
    />
  );
}