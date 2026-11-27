'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/sections/product-card';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { CtaBanner } from '@/components/sections/cta-banner';
import { ProductVariantProvider } from '@/components/products/product-variant-provider';
import { ProductReviewsSection } from '@/components/reviews/product-reviews-section';
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
import type { Product } from '@/lib/types';

interface ProductDetailViewProps {
  product: Product;
  division: 'home_decor' | 'metal_services';
  categoryName?: string;
  relatedProducts?: Product[];
}

function hasMeaningfulValue(value?: string): value is string {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized !== '' &&
    normalized !== 'na' &&
    normalized !== 'n/a' &&
    normalized !== 'none' &&
    normalized !== '-'
  );
}

export function ProductDetailView({ product, division, categoryName, relatedProducts = [] }: ProductDetailViewProps) {
  const hasExtendedSpecs =
    product.sku ||
    product.hasVariants ||
    hasMeaningfulValue(product.material) ||
    hasMeaningfulValue(product.colorFinish) ||
    hasMeaningfulValue(product.dimensions) ||
    hasMeaningfulValue(product.weight) ||
    hasMeaningfulValue(product.stockStatus) ||
    hasMeaningfulValue(product.careInstructions);

  return (
    <ProductVariantProvider product={product} division={division} categoryName={categoryName}>
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-ink pt-32 text-white sm:pt-40">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <Image
            src={product.image}
            alt=""
            aria-hidden="true"
            fill
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
              <Link href={division === 'home_decor' ? '/home-decor' : '/metal-coating'} className="hover:text-gold transition-colors">
                {division === 'home_decor' ? 'Home Decor' : 'Metal Services'}
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
                <VariantImageGallery />
              </Reveal>
            </div>

            {/* Product Details & Enquiry Column */}
            <div className="flex flex-col justify-center lg:col-span-6">
              <Reveal>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-ultra text-gold-deep">
                    {product.category}
                  </p>
                  <VariantSku fallback={product.sku} />
                </div>

                <h1 className="type-product-title mt-3">
                  {product.name}
                </h1>

                <ProductVariantSelector />

                <div className="mt-6 flex items-baseline gap-4">
                  <VariantWhatsAppButton
                    division={division}
                    className="h-11 rounded-full px-5"
                  />
                </div>

                {hasMeaningfulValue(product.shortDescription) && (
                  <p className="mt-6 text-base leading-relaxed text-foreground/80">
                    {product.shortDescription}
                  </p>
                )}

                {hasMeaningfulValue(product.description) &&
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
                    {hasMeaningfulValue(product.material) && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Material:</span>
                        <span className="font-medium">{product.material}</span>
                      </div>
                    )}
                    {(hasMeaningfulValue(product.colorFinish) || product.hasVariants) && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Color / Finish:</span>
                        <VariantFinishValue fallback={product.colorFinish} />
                      </div>
                    )}
                    {hasMeaningfulValue(product.dimensions) && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Dimensions:</span>
                        <span className="font-medium">{product.dimensions}</span>
                      </div>
                    )}
                    {hasMeaningfulValue(product.weight) && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Weight:</span>
                        <span className="font-medium">{product.weight}</span>
                      </div>
                    )}
                    {(hasMeaningfulValue(product.stockStatus) || product.hasVariants) && (
                      <VariantAvailabilityRow fallback={product.stockStatus} />
                    )}
                    {hasMeaningfulValue(product.careInstructions) && (
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
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                  <VariantWhatsAppButton
                    division={division}
                    size="lg"
                    showIcon
                    className="h-12 rounded-full px-8 text-base font-semibold shadow-lg sm:flex-1"
                  />

                  <VariantQuoteButton
                    division={division}
                    className="h-12 rounded-full px-6"
                  />

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full px-6"
                  >
                    <Link href={division === 'home_decor' ? '/home-decor' : '/metal-coating'}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Collection
                    </Link>
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
          <ProductReviewsSection
            productId={product.id}
            productName={product.name}
            className="mt-14 sm:mt-12 md:mt-12 lg:mt-16"
          />
        </div>
      </section>

      {/* Related Collection Section */}
      {relatedProducts.length > 0 && (
        <section className="bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <SectionHeading
              eyebrow="Related Pieces"
              title="Explore similar designs"
              description="Selected pieces from our collection designed to complement your space."
            />

            <StaggerGroup className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <StaggerItem key={item.id}>
                  <ProductCard product={item} division={division} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      )}

      <CtaBanner
        eyebrow="Enquire About This Piece"
        title={
          <>
            Need details or a <span className="gold-text">quotation?</span>
          </>
        }
        description="Share your material, finish, quantity and timeline requirements, and our team will respond with availability and a quotation."
        primary={{
          label: 'Request a Quote',
          href: division === 'home_decor' ? '/#contact' : '/metal-coating#quote',
        }}
        secondary={{
          label: division === 'home_decor' ? 'Explore All Decor' : 'Explore Metal Collections',
          href: division === 'home_decor' ? '/home-decor' : '/metal-coating#collections',
        }}
        variant="dark"
      />
    </ProductVariantProvider>
  );
}