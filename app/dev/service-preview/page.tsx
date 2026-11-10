import { notFound } from 'next/navigation';
import { PrincipalServiceCards } from '@/components/sections/principal-service-cards';
import { ALL_PRINCIPAL_SERVICE_DRAFTS } from '@/content/metal-coating';

export const revalidate = 0;

export const metadata = {
  title: 'Service Preview | RTMETALCOATING',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ServicePreviewPage() {
  // Server-side enforcement: only accessible in development.
  // In production this route returns 404 regardless of URL knowledge.
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return (
    <section className="pt-28 sm:pt-32 pb-10 sm:pb-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <p className="text-xs font-medium uppercase tracking-ultra text-gold">
            Development Preview
          </p>
          <h1 className="mt-1 font-display text-2xl font-medium tracking-tight             sm:text-3xl">
            Six Principal Services — Design Review
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Isolated preview of the six principal service cards. Not exposed in
            public navigation. Content is pending client approval and is not
            published.
          </p>
        </div>

        <PrincipalServiceCards previewMode={true} previewDrafts={ALL_PRINCIPAL_SERVICE_DRAFTS} />
      </div>
    </section>
  );
}
