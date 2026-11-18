import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowLeft, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/sections/product-card';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { CtaBanner } from '@/components/sections/cta-banner';
import { ProductVariantProvider } from '@/components/products/product-variant-provider';
import { VariantImageGallery } from '@/components/products/variant-image-gallery';
import { ProductVariantSelector } from '@/components/products/product-variant-selector';
import {
  VariantAvailabilityRow,
  VariantFinishValue,
  VariantSku,
} from '@/components/products/product-variant-meta';
import {
  VariantQuoteButton,
  VariantWhatsAppButton,
} from '@/components/products/product-variant-enquiry';
import { getPublicProductBySlugAsync, getPublicCatalogAsync, getCategoriesAsync } from '@/lib/data-access';
import { isCategoryInSection } from '@/lib/category-hierarchy';
import { getSiteUrlForPath } from '@/lib/site-url';
import { MainSection } from '@/lib/types';

export const revalidate = 0;

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const product = await getPublicProductBySlugAsync(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found | RTMETALCOATING',
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = getSiteUrlForPath(
    `/home-decor/${product.slug || product.id}`
  );

  return {
    title: product.name,
    description: product.description.substring(0, 160),
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    openGraph: {
      title: `${product.name} — Home Decor | RTMETALCOATING`,
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

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = await getPublicProductBySlugAsync(params.slug);

  if (!product) {
    notFound();
  }

  // Redirect Metal products to the Metal product route
  const categories = await getCategoriesAsync({ allowStaticFallback: false, products: [] });
  const category = categories.find((item) => item.slug === product.category);

  if (category && isCategoryInSection(category, 'metal_services')) {
    redirect(`/metal-coating/product/${product.slug || product.id}`);
  }

  const { categories: publicCategories, products: publicProducts } = await getPublicCatalogAsync();
  const relatedProducts = publicProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const homeDecorProducts = publicProducts.filter((p) => {
    const productCategory = publicCategories.find((item) => item.slug === p.category);
    return productCategory ? isCategoryInSection(productCategory, 'home_decor') : false;
  });

  const fallbackRelated =
    relatedProducts.length > 0
      ? relatedProducts
      : homeDecorProducts.filter((p) => p.id !== product.id).slice(0, 4);

  const hasExtendedSpecs =
    product.sku ||
    product.hasVariants ||
    product.material ||
    product.colorFinish ||
    product.dimensions ||
    product.weight ||
    product.stockStatus ||
    product.careInstructions;

  return (
    <>
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-ink pt-32 text-white sm:pt-40">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <Image
            src={product.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover blur-sm"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />

        <div className="relative mx-auto max-w-7xl px-5 pb-12 lg:px-10">
          <Reveal>
            <div className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-ultra text-white/70">
              <Link href="/" className="hover:text-gold transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/home-decor" className="hover:text-gold transition-colors">
                Home Decor
              </Link>
              <span>/</span>
              <span className="text-gold">{product.name}</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Main Product Showcase Section */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <ProductVariantProvider product={product} division="home_decor" categoryName={category?.name}>
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Image Gallery Column */}
            <div className="lg:col-span-6">
              <Reveal>
                <VariantImageGallery />
              </Reveal>
            </div>

            {/* Product Details & Enquiry Column */}
            <div className="flex flex-col justify-center lg:col-span-6">
              <Reveal>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-ultra text-gold-deep">
                    {category ? category.name : product.category.replace('-', ' ')}
                  </p>
                  <VariantSku fallback={product.sku} />
                </div>

                <h1 className="type-product-title mt-3">
                  {product.name}
                </h1>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(product.rating)
                            ? 'fill-gold text-gold'
                            : 'text-muted'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {product.rating} / 5.0 Rating
                  </span>
                </div>

                <ProductVariantSelector />

                <div className="mt-6 flex items-baseline gap-4">
                  <VariantWhatsAppButton
                    division="home_decor"
                    className="rounded-full"
                  />
                </div>

                {product.shortDescription?.trim() ? (
                  <p className="mt-6 text-base leading-relaxed text-foreground/80">
                    {product.shortDescription}
                  </p>
                ) : null}

                {product.description?.trim() &&
                  product.description.trim() !==
                    (product.shortDescription ?? '').trim() && (
                    <div className="mt-8">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">
                        Product Description
                      </h2>
                      <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                        {product.description}
                      </p>
                    </div>
                  )}

                {/* Extended Product Specifications (if available) */}
                {hasExtendedSpecs && (
                  <div className="mt-6 rounded-2xl border border-border/80 bg-muted/30 p-5 space-y-2.5 text-xs text-foreground/80">
                    <div className="flex items-center gap-2 text-gold font-semibold uppercase tracking-wider mb-3">
                      <Info className="h-3.5 w-3.5" />
                      Product Specifications
                    </div>
                    {product.material && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Material:</span>
                        <span className="font-medium">{product.material}</span>
                      </div>
                    )}
                    {(product.colorFinish || product.hasVariants) && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Color / Finish:</span>
                        <VariantFinishValue fallback={product.colorFinish} />
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Dimensions:</span>
                        <span className="font-medium">{product.dimensions}</span>
                      </div>
                    )}
                    {product.weight && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Weight:</span>
                        <span className="font-medium">{product.weight}</span>
                      </div>
                    )}
                    {(product.stockStatus || product.hasVariants) && (
                      <VariantAvailabilityRow fallback={product.stockStatus} />
                    )}
                    {product.careInstructions && (
                      <div className="pt-1">
                        <span className="text-muted-foreground block mb-0.5">Care Instructions:</span>
                        <span className="font-medium leading-relaxed">{product.careInstructions}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Features Highlights */}
                {product.features && product.features.length > 0 ? (
                  <div className="mt-8 border-y border-border py-6">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">
                      Product Features
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {product.features.map((feat, idx) => (
                        <li
                          key={`${feat}-${idx}`}
                          className="flex items-start gap-3 text-sm leading-relaxed text-foreground/80"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Direct WhatsApp Enquiry CTA */}
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <VariantWhatsAppButton
                    division="home_decor"
                    size="lg"
                    showIcon
                    className="flex-1 rounded-full px-8 py-6 text-base font-semibold shadow-lg"
                  />

                  <VariantQuoteButton
                    division="home_decor"
                    className="rounded-full px-6 py-6"
                  />

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full px-6 py-6"
                  >
                    <Link href="/home-decor">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Collection
                    </Link>
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
          </ProductVariantProvider>
        </div>
      </section>

      {/* Related Collection Section */}
      {fallbackRelated.length > 0 && (
        <section className="bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <SectionHeading
              eyebrow="Related Pieces"
              title="Explore similar designs"
              description="Selected pieces from our Home Decor & Lifestyle collection designed to complement your space."
            />

            <StaggerGroup className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {fallbackRelated.map((item) => (
                <StaggerItem key={item.id}>
                  <ProductCard product={item} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      )}

      <CtaBanner
        eyebrow="Bespoke Coating & Orders"
        title={
          <>
            Need custom finishes for <span className="gold-text">this piece?</span>
          </>
        }
        description="Our metal coating workshop can apply custom patinas, brass, or mild steel finishes to meet your architectural specifications."
        primary={{ label: 'Metal Coating Services', href: '/metal-coating' }}
        secondary={{ label: 'Explore All Decor', href: '/home-decor' }}
        variant="dark"
      />
    </>
  );
}

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}
