import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wishlist | RT PU COATING WORKS',
  description: 'Saved customer wishlist collection.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
