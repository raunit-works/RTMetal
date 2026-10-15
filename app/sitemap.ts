import { MetadataRoute } from 'next';
import { getProductsAsync } from '@/lib/data-access';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Base static public routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/home-decor`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/metal-coating`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  try {
    // Fetch live catalog products from Supabase
    const products = await getProductsAsync();
    // Exclude unpublished products from sitemap
    const publishedProducts = products.filter((p) => p.isPublished !== false && p.slug);

    publishedProducts.forEach((product) => {
      const productSlug = product.slug || product.id;
      routes.push({
        url: `${siteUrl}/home-decor/${productSlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });
  } catch (err) {
    console.error('[Sitemap Exception] Error fetching catalog products:', err);
    // Returns base static public routes safely without corrupting sitemap
  }

  return routes;
}
