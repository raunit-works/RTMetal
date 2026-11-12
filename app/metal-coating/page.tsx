import type { Metadata } from 'next';
import {
  getServicesAsync,
  getInstagramPosts,
  getIndustriesServed,
  getPublicCatalogAsync,
} from '@/lib/data-access';
import { MetalCoatingClient } from '@/components/sections/metal-coating-client';
import { isCategoryInSection } from '@/lib/category-hierarchy';
import { getSiteUrlForPath } from '@/lib/site-url';
import { getPublishedMetalFinishes } from '@/lib/supabase/metal-finishes-public';
import { getPublishedBeforeAfterProjects } from '@/lib/supabase/before-after-public';

export const revalidate = 0;

const canonicalUrl = getSiteUrlForPath('/metal-coating');

export const metadata: Metadata = {
  title: 'Premium Metal & PU Coating Services',
  description:
    'Industrial and architectural PU metal coating, electroplating, liquid metal finishing, and custom protective metal treatments for commercial and luxury residential projects.',
  alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
  openGraph: {
    title: 'Premium Metal & PU Coating Services | RTMETALCOATING',
    description:
      'Industrial and architectural PU metal coating, electroplating, liquid metal finishing, and custom protective metal treatments.',
    url: canonicalUrl,
  },
};


export default async function MetalCoatingPage() {
  const services = await getServicesAsync({ allowStaticFallback: false });
  const instagramPosts = getInstagramPosts();
  const industriesServed = getIndustriesServed();
  const { categories } = await getPublicCatalogAsync();
  const metalCategories = categories.filter((category) =>
    isCategoryInSection(category, 'metal_services')
  );
  const finishes = await getPublishedMetalFinishes();
  const beforeAfter = await getPublishedBeforeAfterProjects({ limit: 9 });

  return (
    <MetalCoatingClient
      services={services}
      instagramPosts={instagramPosts}
      industriesServed={industriesServed}
      categories={metalCategories}
      finishes={finishes}
      beforeAfterProjects={beforeAfter.projects}
      beforeAfterAvailable={beforeAfter.available}
    />
  );
}
