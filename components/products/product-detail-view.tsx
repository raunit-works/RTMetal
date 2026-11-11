'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, ArrowLeft, ArrowRight, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/sections/product-card';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { CtaBanner } from '@/components/sections/cta-banner';
import { ProductImageGallery } from '@/components/sections/product-image-gallery';
import { getHomeDecorWhatsAppLink, getMetalCoatingWhatsAppLink } from '@/lib/site';
import type { Product } from '@/lib/types';

interface ProductDetailViewProps {
  product: Product;
  division: 'home_decor' | 'metal_services';
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

export function ProductDetailView({ product, division, relatedProducts = [] }: ProductDetailViewProps) {
  const whatsappMessage = `Hello RTMETALCOATING, I am interested in ${product.name}. Please share availability and a quotation.`;
  const whatsappUrl = division === 'home_decor'
    ? getHomeDecorWhatsAppLink(whatsappMessage)
    : getMetalCoatingWhatsAppLink(whatsappMessage);

  const hasExtendedSpecs =
    product.sku ||
    hasMeaningfulValue(product.material) ||
    hasMeaningfulValue(product.colorFinish) ||
    hasMeaningfulValue(product.dimensions) ||
    hasMeaningfulValue(product.weight) ||
    hasMeaningfulValue(product.stockStatus) ||
    hasMeaningfulValue(product.careInstructions);

  return (
    <>
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
                    {product.category}
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

                <div className="mt-6 flex items-baseline gap-4">
                  {whatsappUrl ? (
                    <Button asChild className="rounded-full bg-[#25D366] text-ink hover:bg-[#25D366]/90">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Enquire About Product
                      </a>
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="cursor-not-allowed rounded-full border border-[#25D366]/25 bg-[#25D366]/10 text-muted-foreground disabled:opacity-100"
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Enquire About Product
                    </Button>
                  )}
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
                    {hasMeaningfulValue(product.material) && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Material:</span>
                        <span className="font-medium">{product.material}</span>
                      </div>
                    )}
                    {hasMeaningfulValue(product.colorFinish) && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Color / Finish:</span>
                        <span className="font-medium">{product.colorFinish}</span>
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
                    {hasMeaningfulValue(product.stockStatus) && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Availability:</span>
                        <span className="font-medium capitalize">
                          {product.stockStatus.replace('_', ' ')}
                        </span>
                      </div>
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
                  <div className="mt-8 space-y-3 border-y border-border py-6">
                    {product.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm text-foreground/80">
                        <Check className="h-4 w-4 text-gold shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Direct WhatsApp Enquiry CTA */}
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                  {whatsappUrl ? (
                    <Button
                      asChild
                      size="lg"
                      className="flex-1 rounded-full bg-[#25D366] px-8 py-6 text-base font-semibold text-ink shadow-lg transition-all hover:bg-[#25D366]/90"
                    >
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Enquire About Product
                      </a>
                    </Button>
                  ) : (
                    <Button
                      disabled
                      size="lg"
                      className="flex-1 cursor-not-allowed rounded-full border border-[#25D366]/25 bg-[#25D366]/10 px-8 py-6 text-base font-semibold text-muted-foreground disabled:opacity-100"
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Enquire About Product
                    </Button>
                  )}

                  <Button asChild size="lg" className="rounded-full px-6 py-6">
                    <Link href={division === 'home_decor' ? '/#contact' : '/metal-coating#quote'}>
                      Request a Quote
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full px-6 py-6"
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
    </>
  );
}