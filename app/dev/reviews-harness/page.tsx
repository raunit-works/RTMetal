import { notFound } from 'next/navigation';

import { ReviewsHarness } from '@/components/dev/reviews-harness';

export const revalidate = 0;

export const metadata = {
  title: 'Reviews UI Harness | RTMETALCOATING',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReviewsHarnessPage({
  searchParams,
}: {
  searchParams: { source?: string };
}) {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return (
    <ReviewsHarness
      source={searchParams.source}
      allowRouteSource={process.env.REVIEW_TEST_ROUTE_SOURCE === '1'}
    />
  );
}
