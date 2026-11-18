import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ScrollProgress } from '@/components/layout/scroll-progress';
import { WishlistProvider } from '@/components/providers/wishlist-provider';
import { getSiteUrl } from '@/lib/site-url';

// Fonts served from public/fonts/ to avoid build-time Google Fonts network
// requests that caused ETIMEDOUT failures on Netlify (fonts.gstatic.com).
// Only the weights the design system actually uses are declared. Every extra
// entry becomes a preloaded woff2 request, so unused weights were removed.
const cormorant = localFont({
  src: [
    { path: '../public/fonts/cormorant-garamond-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/cormorant-garamond-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/cormorant-garamond-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/cormorant-garamond-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../public/fonts/cormorant-garamond-latin-500-italic.woff2', weight: '500', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
  preload: true,
});

const manrope = localFont({
  src: [
    { path: '../public/fonts/manrope-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/manrope-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/manrope-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/manrope-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: 'RTMETALCOATING — Professional Metal Coating & RT HOME DECOR',
    template: '%s | RTMETALCOATING',
  },
  description:
    'A luxury house of home decor, lifestyle products, and premium metal coating services. Crafted for architects, interior designers, and discerning homeowners.',
  keywords: [
    'RTMETALCOATING',
    'RT HOME DECOR',
    'PU Coating Services',
    'Metal Coating',
    'Home Decor',
    'Lifestyle Products',
    'Custom Metal Finishes',
  ],
  authors: [{ name: 'RTMETALCOATING' }],
  creator: 'RTMETALCOATING',
  publisher: 'RTMETALCOATING',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: siteUrl ? { canonical: siteUrl } : undefined,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl || undefined,
    siteName: 'RTMETALCOATING',
    title: 'RTMETALCOATING — Professional Metal Coating & RT HOME DECOR',
    description:
      'A luxury house of home decor, lifestyle products, and premium metal coating services.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RTMETALCOATING — Professional Metal Coating & RT HOME DECOR',
    description:
      'A luxury house of home decor, lifestyle products, and premium metal coating services.',
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${cormorant.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <WishlistProvider>
          <ScrollProgress />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </WishlistProvider>
      </body>
    </html>
  );
}