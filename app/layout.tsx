import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ScrollProgress } from '@/components/layout/scroll-progress';
import { WishlistProvider } from '@/components/providers/wishlist-provider';

// Fonts served from public/fonts/ to avoid build-time Google Fonts network
// requests that caused ETIMEDOUT failures on Netlify (fonts.gstatic.com).
const cormorant = localFont({
  src: [
    { path: '../public/fonts/cormorant-garamond-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/cormorant-garamond-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/cormorant-garamond-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/cormorant-garamond-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/cormorant-garamond-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/cormorant-garamond-latin-300-italic.woff2', weight: '300', style: 'italic' },
    { path: '../public/fonts/cormorant-garamond-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../public/fonts/cormorant-garamond-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: '../public/fonts/cormorant-garamond-latin-600-italic.woff2', weight: '600', style: 'italic' },
    { path: '../public/fonts/cormorant-garamond-latin-700-italic.woff2', weight: '700', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
});

const manrope = localFont({
  src: [
    { path: '../public/fonts/manrope-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/manrope-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/manrope-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/manrope-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/manrope-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/manrope-latin-800-normal.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = localFont({
  src: [
    { path: '../public/fonts/space-grotesk-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/space-grotesk-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/space-grotesk-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/space-grotesk-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-label',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'RT PU COATING WORKS — Home Decor & Premium Metal Coating',
    template: '%s | RT PU COATING WORKS',
  },
  description:
    'A luxury house of home decor, lifestyle products, and premium metal coating services. Crafted for architects, interior designers, and discerning homeowners.',
  keywords: [
    'RT PU COATING WORKS',
    'PU Coating Services',
    'Metal Coating',
    'Home Decor',
    'Lifestyle Products',
    'Luxury Furniture Coating',
    'Custom Metal Finishes',
  ],
  authors: [{ name: 'RT PU COATING WORKS' }],
  creator: 'RT PU COATING WORKS',
  publisher: 'RT PU COATING WORKS',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteUrl || '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl || '/',
    siteName: 'RT PU COATING WORKS',
    title: 'RT PU COATING WORKS — Home Decor & Premium Metal Coating',
    description:
      'A luxury house of home decor, lifestyle products, and premium metal coating services.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RT PU COATING WORKS — Home Decor & Premium Metal Coating',
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
    <html lang="en" className={`${manrope.variable} ${cormorant.variable} ${spaceGrotesk.variable}`}>
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