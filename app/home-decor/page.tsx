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


export default function HomeDecorPage({ searchParams }: {
  searchParams: { category?: string | string[]; section?: string | string[] };
}) {
  // Preserve existing header/bookmark query URLs, including ?category=all.
  const category = Array.isArray(searchParams.category) ? searchParams.category[0] : searchParams.category;
  const section = Array.isArray(searchParams.section) ? searchParams.section[0] : searchParams.section;
  return <CategoryCatalogPage slug={category === 'all' ? undefined : category} section={section} />;
}
