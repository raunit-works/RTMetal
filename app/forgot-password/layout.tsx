import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | RT PU COATING WORKS',
  description: 'Reset your account password.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
