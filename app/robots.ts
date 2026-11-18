import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

// Routes that must never be indexed: admin CMS, preview/staging, dev tooling,
// and customer-facing auth/account routes.
const DISALLOWED_ROUTES = [
  '/admin',
  '/preview',
  '/dev',
  '/account',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/wishlist',
  '/api/',
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: DISALLOWED_ROUTES,
    },
    sitemap: siteUrl ? `${siteUrl}/sitemap.xml` : undefined,
  };
}
