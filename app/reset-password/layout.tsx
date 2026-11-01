import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | RTMETALCOATING',
  description: 'Set a new password for your account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
