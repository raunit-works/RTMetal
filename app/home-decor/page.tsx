import type { Metadata } from 'next';
import { CategoryCatalogPage } from '@/components/sections/category-catalog-page';
import { getSiteUrlForPath } from '@/lib/site-url';

export const revalidate = 0;

const canonicalUrl = getSiteUrlForPath('/home-decor');

export const metadata: Metadata = {
  title: 'Home Decor & Lifestyle Collection',
  description:
    'Explore our curated collection of luxury home decor, architectural hardware, and hand-finished lifestyle products crafted with precision metal coating.',
  alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
  openGraph: {
    title: 'Home Decor & Lifestyle Collection | RTMETALCOATING',
    description:
      'Explore our curated collection of luxury home decor, architectural hardware, and hand-finished lifestyle products.',
    url: canonicalUrl,
  },
};


export default async function HomeDecorPage({ searchParams }: {
  searchParams: Promise<{ category?: string | string[]; section?: string | string[] }>;
}) {
  const params = await searchParams;
  // Preserve existing header/bookmark query URLs, including ?category=all.
  const category = Array.isArray(params.category) ? params.category[0] : params.category;
  const section = Array.isArray(params.section) ? params.section[0] : params.section;
  return <CategoryCatalogPage slug={category === 'all' ? undefined : category} section={section} />;
}
