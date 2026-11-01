import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ProductDetailView } from '@/components/products/product-detail-view';
import { getPublicProductBySlugAsync, getPublicCatalogAsync, getCategoriesAsync } from '@/lib/data-access';
import { isCategoryInSection } from '@/lib/category-hierarchy';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getPublicProductBySlugAsync(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found | RTMETALCOATING',
      robots: { index: false, follow: false },
    };
  }

  const categories = await getCategoriesAsync({ allowStaticFallback: false, products: [] });
  const category = categories.find((item) => item.slug === product.category);

  if (!category || !isCategoryInSection(category, 'metal_services')) {
    return {
      title: 'Product Not Found | RTMETALCOATING',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const canonicalUrl = `${siteUrl}/metal-coating/product/${product.slug || product.id}`;

  return {
    title: product.name,
    description: product.description.substring(0, 160),
    alternates: {
      canonical: canonicalUrl,
    },
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

export default async function MetalProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getPublicProductBySlugAsync(params.slug);

  if (!product) {
    notFound();
  }

  const categories = await getCategoriesAsync({ allowStaticFallback: false, products: [] });
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

  const { products: publicProducts } = await getPublicCatalogAsync();
  const relatedProducts = publicProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return (
    <ProductDetailView
      product={product}
      division="metal_services"
      relatedProducts={relatedProducts}
    />
  );
}