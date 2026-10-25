import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wishlist | RT METALS',
  description: 'Saved customer wishlist collection.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
