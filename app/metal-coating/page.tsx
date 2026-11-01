import type { Metadata } from 'next';
import {
  getServicesAsync,
  getProcessSteps,
  getInstagramPosts,
  getIndustriesServed,
  getPublicCatalogAsync,
} from '@/lib/data-access';
import { MetalCoatingClient } from '@/components/sections/metal-coating-client';
import { isCategoryInSection } from '@/lib/category-hierarchy';

export const revalidate = 0;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  title: 'Premium Metal & PU Coating Services',
  description:
    'Industrial and architectural PU metal coating, electroplating, liquid metal finishing, and custom protective metal treatments for commercial and luxury residential projects.',
  alternates: {
    canonical: siteUrl ? `${siteUrl}/metal-coating` : '/metal-coating',
  },
  openGraph: {
    title: 'Premium Metal & PU Coating Services | RTMETALCOATING',
    description:
      'Industrial and architectural PU metal coating, electroplating, liquid metal finishing, and custom protective metal treatments.',
    url: siteUrl ? `${siteUrl}/metal-coating` : '/metal-coating',
  },
};


export default async function MetalCoatingPage() {
  const services = await getServicesAsync({ allowStaticFallback: false });
  const processSteps = getProcessSteps();
  const instagramPosts = getInstagramPosts();
  const industriesServed = getIndustriesServed();
  const { categories } = await getPublicCatalogAsync();
  const metalCategories = categories.filter((category) =>
    isCategoryInSection(category, 'metal_services')
  );

  return (
    <MetalCoatingClient
      services={services}
      processSteps={processSteps}
      instagramPosts={instagramPosts}
      industriesServed={industriesServed}
      categories={metalCategories}
    />
  );
}
