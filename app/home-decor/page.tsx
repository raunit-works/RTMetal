import type { Metadata } from 'next';
import { CategoryCatalogPage } from '@/components/sections/category-catalog-page';

export const revalidate = 0;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  title: 'Home Decor & Lifestyle Collection',
  description:
    'Explore our curated collection of luxury home decor, architectural hardware, and hand-finished lifestyle products crafted with precision metal coating.',
  alternates: {
    canonical: siteUrl ? `${siteUrl}/home-decor` : '/home-decor',
  },
  openGraph: {
    title: 'Home Decor & Lifestyle Collection | RTMETALCOATING',
    description:
      'Explore our curated collection of luxury home decor, architectural hardware, and hand-finished lifestyle products.',
    url: siteUrl ? `${siteUrl}/home-decor` : '/home-decor',
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
