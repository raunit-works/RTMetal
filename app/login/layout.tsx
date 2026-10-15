import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | RT PU COATING WORKS',
  description: 'Sign in to your customer account or admin management portal.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
