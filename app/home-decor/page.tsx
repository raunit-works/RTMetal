import type { Metadata } from 'next';
import { getCategoriesAsync, getProductsAsync, getInstagramPosts } from '@/lib/data-access';
import { HomeDecorCatalog } from '@/components/sections/home-decor-catalog';

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
    title: 'Home Decor & Lifestyle Collection | RT PU COATING WORKS',
    description:
      'Explore our curated collection of luxury home decor, architectural hardware, and hand-finished lifestyle products.',
    url: siteUrl ? `${siteUrl}/home-decor` : '/home-decor',
  },
};


export default async function HomeDecorPage() {
  const [categories, products] = await Promise.all([
    getCategoriesAsync(),
    getProductsAsync(),
  ]);
  const instagramPosts = getInstagramPosts();

  return (
    <HomeDecorCatalog
      categories={categories}
      products={products}
      instagramPosts={instagramPosts}
    />
  );
}
