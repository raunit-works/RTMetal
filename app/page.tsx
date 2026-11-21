import { Hero } from '@/components/sections/home/hero';
import { BusinessDivisions } from '@/components/sections/home/business-divisions';
import { MaterialsShowcase } from '@/components/sections/home/materials-showcase';
import { BeforeAfterSection } from '@/components/sections/home/before-after';
import { OurProcess } from '@/components/sections/home/our-process';
import { FeaturedProducts } from '@/components/sections/home/featured-products';
import { MetalCoatingShowcase } from '@/components/sections/home/metal-coating-showcase';
import { MetalProductsShowcase } from '@/components/sections/home/metal-products-showcase';
import { Testimonials } from '@/components/sections/home/testimonials';
import { FAQ } from '@/components/sections/home/faq';
import { ContactSection } from '@/components/sections/home/contact';
import { InstagramSection } from '@/components/sections/instagram-section';
import type { Metadata } from 'next';
import { CtaBanner } from '@/components/sections/cta-banner';
import {
  getHomeCatalogAsync,
  getServicesAsync,
  getTestimonialsAsync,
  getFAQsAsync,
  getInstagramPosts,
} from '@/lib/data-access';
import { getSiteUrlForPath } from '@/lib/site-url';

export const revalidate = 0;

const canonicalUrl = getSiteUrlForPath('/');

const pageTitle = 'RTMETALCOATING — Premium Metal Coating & RT HOME DECOR';
const pageDescription =
  'RTMETALCOATING offers premium metal coating, PU coating, and decorative finishing services alongside the RT HOME DECOR collection of luxury home decor and lifestyle products. Request a quotation for your project.';

export const metadata: Metadata = {
  title: {
    absolute: pageTitle,
    template: '%s | RTMETALCOATING',
  },
  description: pageDescription,
  keywords: [
    'RTMETALCOATING',
    'RT HOME DECOR',
    'Metal Coating Services',
    'PU Coating',
    'Home Decor',
    'Lifestyle Products',
    'Custom Metal Finishes',
    'Decorative Finishing',
  ],
  authors: [{ name: 'RTMETALCOATING' }],
  creator: 'RTMETALCOATING',
  publisher: 'RTMETALCOATING',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: canonicalUrl || undefined,
    siteName: 'RTMETALCOATING',
    title: pageTitle,
    description: pageDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
  },
};

export default async function Home() {
  const [catalog, testimonials, faqs, services] = await Promise.all([
    getHomeCatalogAsync(),
    getTestimonialsAsync(),
    getFAQsAsync(),
    getServicesAsync({ allowStaticFallback: false }),
  ]);
  const instagramPosts = getInstagramPosts();

  return (
    <>
      {/* ── NEW TOP SECTIONS ─────────────────────────────────── */}
      <Hero />
      <BusinessDivisions />
      <MaterialsShowcase />
      <BeforeAfterSection />

      {/* ── EXISTING LOWER SECTIONS (unchanged) ──────────────── */}
      <OurProcess />
      <FeaturedProducts products={catalog.products} categories={catalog.categories} />
      <MetalCoatingShowcase services={services} />
      <MetalProductsShowcase
        products={catalog.products}
        categories={catalog.categories}
      />
      <InstagramSection
        posts={instagramPosts}
        eyebrow="OUR WORK IN MOTION"
        title="Craftsmanship in Every Detail"
        description="Explore real projects, premium finishes and workshop craftsmanship through our latest videos."
      />
      <Testimonials testimonials={testimonials} />
      <FAQ faqs={faqs} />
      <ContactSection />
      <CtaBanner
        eyebrow="Ready when you are"
        title={
          <>
            Let&apos;s build something <span className="gold-text">lasting.</span>
          </>
        }
        description="Explore the collection or request a quote for premium metal coating — we will respond within one business day."
        primary={{ label: 'Shop Home Decor', href: '/home-decor' }}
        secondary={{ label: 'Metal Coating Services', href: '/metal-coating' }}
      />
    </>
  );
}
