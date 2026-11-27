import { notFound } from 'next/navigation';

import { AdminReviewsHarness } from '@/components/dev/admin-reviews-harness';

export const revalidate = 0;

export const metadata = {
  title: 'Admin Reviews Harness | RTMETALCOATING',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminReviewsHarnessPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <AdminReviewsHarness />;
}
