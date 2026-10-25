import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account | RT METALS',
  description: 'Customer Account Dashboard.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
