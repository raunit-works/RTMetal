import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Star, MessageCircle, ArrowLeft, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/sections/product-card';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { CtaBanner } from '@/components/sections/cta-banner';
import { ProductImageGallery } from '@/components/sections/product-image-gallery';
import { getProductBySlugAsync, getProductsAsync, getCategoryBySlugAsync } from '@/lib/data-access';
import { getHomeDecorWhatsAppLink } from '@/lib/site';

export const revalidate = 0;

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const product = await getProductBySlugAsync(params.slug);

  if (!product || product.isPublished === false) {
    return {
      title: 'Product Not Found | RT PU COATING WORKS',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const canonicalUrl = `${siteUrl}/home-decor/${product.slug || product.id}`;

  return {
    title: product.name,
    description: product.description.substring(0, 160),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.name} — Home Decor | RT PU COATING WORKS`,
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
  const product = await getProductBySlugAsync(params.slug);

  if (!product || product.isPublished === false) {
    notFound();
  }


  const category = await getCategoryBySlugAsync(product.category);
  const allProducts = await getProductsAsync();
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const fallbackRelated =
    relatedProducts.length > 0
      ? relatedProducts
      : allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  const whatsappMessage = `Hello RT PU COATING WORKS, I am interested in ${product.name}. Please share more details regarding availability, custom options, and pricing.`;

  const hasExtendedSpecs =
    product.sku ||
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt=""
            className="h-full w-full object-cover blur-sm"
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
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Image Gallery Column */}
            <div className="lg:col-span-6">
              <Reveal>
                <ProductImageGallery
                  mainImage={product.image}
                  productName={product.name}
                  badge={product.badge}
                  images={product.images}
                />
              </Reveal>
            </div>

            {/* Product Details & Enquiry Column */}
            <div className="flex flex-col justify-center lg:col-span-6">
              <Reveal>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-ultra text-gold-deep">
                    {category ? category.name : product.category.replace('-', ' ')}
                  </p>
                  {product.sku && (
                    <span className="text-xs text-muted-foreground">
                      · SKU: {product.sku}
                    </span>
                  )}
                </div>

                <h1 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  {product.name}
                </h1>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(product.rating)
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

                <div className="mt-6 flex items-baseline gap-4">
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    ${product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      ${product.originalPrice}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    (Price reference / Quote upon request)
                  </span>
                </div>

                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  {product.description}
                </p>

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
                    {product.colorFinish && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Color / Finish:</span>
                        <span className="font-medium">{product.colorFinish}</span>
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
                    {product.stockStatus && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Availability:</span>
                        <span className="font-medium capitalize">
                          {product.stockStatus.replace('_', ' ')}
                        </span>
                      </div>
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
                  <div className="mt-8 space-y-3 border-y border-border py-6">
                    {product.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm text-foreground/80">
                        <Check className="h-4 w-4 text-gold shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-8 space-y-3 border-y border-border py-6">
                    <div className="flex items-center gap-3 text-sm text-foreground/80">
                      <Check className="h-4 w-4 text-gold shrink-0" />
                      <span>Bespoke finishing & custom metallic coatings available</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground/80">
                      <Check className="h-4 w-4 text-gold shrink-0" />
                      <span>Architectural-grade durability & protective seal</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground/80">
                      <Check className="h-4 w-4 text-gold shrink-0" />
                      <span>Hand-inspected by master artisans before dispatch</span>
                    </div>
                  </div>
                )}

                {/* Direct WhatsApp Enquiry CTA */}
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    size="lg"
                    className="flex-1 rounded-full bg-[#25D366] px-8 py-6 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#25D366]/90"
                  >
                    <a
                      href={getHomeDecorWhatsAppLink(whatsappMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Enquire About Product
                    </a>
                  </Button>

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
