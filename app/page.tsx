import { Hero } from '@/components/sections/home/hero';
import { BusinessDivisions } from '@/components/sections/home/business-divisions';
import { MaterialsShowcase } from '@/components/sections/home/materials-showcase';
import { BeforeAfterSection } from '@/components/sections/home/before-after';
import { OurProcess } from '@/components/sections/home/our-process';
import { FeaturedProducts } from '@/components/sections/home/featured-products';
import { MetalCoatingShowcase } from '@/components/sections/home/metal-coating-showcase';
import { Testimonials } from '@/components/sections/home/testimonials';
import { FAQ } from '@/components/sections/home/faq';
import { ContactSection } from '@/components/sections/home/contact';
import { InstagramSection } from '@/components/sections/instagram-section';
import { CtaBanner } from '@/components/sections/cta-banner';
import {
  getPublicCatalogAsync,
  getServicesAsync,
  getTestimonialsAsync,
  getFAQsAsync,
  getInstagramPosts,
} from '@/lib/data-access';

export const revalidate = 0;

export default async function Home() {
  const [catalog, testimonials, faqs, services] = await Promise.all([
    getPublicCatalogAsync(),
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
