import './globals.css';
import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope, Space_Grotesk } from 'next/font/google';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ScrollProgress } from '@/components/layout/scroll-progress';
import { WishlistProvider } from '@/components/providers/wishlist-provider';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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

