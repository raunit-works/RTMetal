import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Customer Account | RT PU COATING WORKS',
  description: 'Register for a customer account to manage your persistent wishlist.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
