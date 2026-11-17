import { notFound } from 'next/navigation';
import { ProductVariantsHarness } from '@/components/dev/product-variants-harness';

export const revalidate = 0;

export const metadata = {
  title: 'Product Variants Harness | RTMETALCOATING',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProductVariantsHarnessPage() {
  // Server-side enforcement: this component harness is only available while
  // running the development server. Production builds return 404.
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <ProductVariantsHarness />;
}
