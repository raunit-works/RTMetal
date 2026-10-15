import { Hero } from '@/components/sections/home/hero';
import { BusinessDivisions } from '@/components/sections/home/business-divisions';
import { FeaturedCategories } from '@/components/sections/home/featured-categories';
import { WhyChooseUs } from '@/components/sections/home/why-choose-us';
import { OurProcess } from '@/components/sections/home/our-process';
import { FeaturedProducts } from '@/components/sections/home/featured-products';
import { MetalCoatingShowcase } from '@/components/sections/home/metal-coating-showcase';
import { Testimonials } from '@/components/sections/home/testimonials';
import { FAQ } from '@/components/sections/home/faq';
import { ContactSection } from '@/components/sections/home/contact';
import { InstagramSection } from '@/components/sections/instagram-section';
import { CtaBanner } from '@/components/sections/cta-banner';
import {
  getCategoriesAsync,
  getProductsAsync,
  getTestimonialsAsync,
  getFAQsAsync,
  getInstagramPosts,
} from '@/lib/data-access';

export const revalidate = 0;

export default async function Home() {
  const [categories, products, testimonials, faqs] = await Promise.all([
    getCategoriesAsync(),
    getProductsAsync(),
    getTestimonialsAsync(),
    getFAQsAsync(),
  ]);
  const instagramPosts = getInstagramPosts();

  return (
    <>
      <Hero />
      <BusinessDivisions />
      <FeaturedCategories categories={categories} />
      <WhyChooseUs />
      <OurProcess />
      <FeaturedProducts products={products} />
      <MetalCoatingShowcase />
      <InstagramSection
        posts={instagramPosts.slice(0, 6)}
        eyebrow="On Instagram"
        title="Follow the craft"
        description="A glimpse into our workshop, recent work and new arrivals — captured in motion."
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
