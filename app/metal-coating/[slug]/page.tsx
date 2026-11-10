import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getPublishedServiceBySlugAsync,
  getRelatedMetalCategoriesForServiceAsync,
} from '@/lib/data-access';
import { ServicePageTemplate } from '@/components/metal-services/service-page-template';
import { getSiteUrlForPath } from '@/lib/site-url';

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublishedServiceBySlugAsync(slug);

  if (!service) {
    return {
      title: 'Service Not Found | RTMETALCOATING',
    };
  }

  const canonicalUrl = getSiteUrlForPath(`/metal-coating/${slug}`);

  return {
    title: `${service.name} | RTMETALCOATING`,
    description: service.description,
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    openGraph: {
      title: `${service.name} | RTMETALCOATING`,
      description: service.description,
      url: canonicalUrl,
      type: 'website',
      images: service.image ? [{ url: service.image }] : undefined,
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getPublishedServiceBySlugAsync(slug);

  if (!service) {
    notFound();
  }

  const relatedCategories = await getRelatedMetalCategoriesForServiceAsync(service);

  return (
    <ServicePageTemplate
      service={service}
      relatedCategories={relatedCategories}
    />
  );
}
