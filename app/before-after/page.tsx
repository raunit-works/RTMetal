import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Images,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { TransformationFilters } from '@/components/before-after/transformation-filters';
import { TransformationGallery } from '@/components/before-after/transformation-gallery';
import { TransformationEnquiry } from '@/components/before-after/transformation-enquiry';
import {
  getPublishedBeforeAfterFacets,
  getPublishedBeforeAfterProjects,
} from '@/lib/supabase/before-after-public';
import { getSiteUrlForPath } from '@/lib/site-url';

export const revalidate = 0;

const canonicalUrl = getSiteUrlForPath('/before-after');

export const metadata: Metadata = {
  title: 'Before & After Transformations',
  description:
    'Explore documented metal coating and surface finishing transformations. Verified projects and clearly labelled illustrative surface comparisons.',
  alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
  openGraph: {
    title: 'Before & After Transformations | RTMETALCOATING',
    description:
      'Explore documented metal coating and surface finishing transformations from RTMETALCOATING.',
    url: canonicalUrl,
    type: 'website',
    images: [{ url: '/after-metal-polished.jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Before & After Transformations | RTMETALCOATING',
    description:
      'Documented metal coating and surface finishing transformations, with illustrative comparisons clearly labelled.',
  },
};

export default async function BeforeAfterGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedService = Array.isArray(params.service)
    ? params.service[0]
    : params.service;

  const facets = await getPublishedBeforeAfterFacets();
  const activeService = facets.services.find(
    (service) => service.slug === requestedService
  );

  const initial = await getPublishedBeforeAfterProjects({
    serviceSlug: activeService?.slug,
    limit: 8,
  });

  const stats = [
    {
      label: 'Published Transformations',
      value: facets.total,
      icon: Images,
    },
    {
      label: 'Verified Projects',
      value: facets.verified,
      icon: BadgeCheck,
    },
    {
      label: 'Finishing Services',
      value: facets.services.length,
      icon: Layers,
    },
  ];

  return (
    <main className="min-h-screen bg-[#101112] text-[#F7F4EF]">
      <section className="relative isolate overflow-hidden pb-12 pt-20 sm:pb-16 sm:pt-24">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Image
            src="/after-metal-polished.jpeg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#101112]/80 via-[#101112]/90 to-[#101112]" />
          <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-[#d8a548]/10 blur-[120px]" />
        </div>

        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-10 xl:px-14">
          <Reveal>
            <Link
              href="/metal-coating"
              className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B8B6B1] transition-colors hover:text-[#D8A548]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Metal Coating & Finishing
            </Link>

            <p className="mt-8 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D8A548] sm:text-xs">
              Project Gallery
              <span aria-hidden="true" className="h-px w-10 bg-[#d8a548]/60" />
              Before & After
            </p>

            <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.8rem,6vw,5.8rem)] font-normal leading-[0.98] tracking-[-0.04em]">
              See the Difference a
              <span className="block italic text-[#D8A548]">Finish Makes</span>
            </h1>

            <p className="mt-6 max-w-2xl text-[15px] leading-[1.8] text-[#C5C4C1] sm:text-base">
              Explore metal finishing and restoration work from our workshop. Discover the details, craftsmanship, and surface transformations behind every finish.
            </p>
          </Reveal>

          {facets.total > 0 && (
            <Reveal delay={0.08}>
              <dl className="mt-10 grid max-w-3xl grid-cols-3 gap-3 sm:gap-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:flex sm:items-center sm:gap-4 sm:p-5"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d8a548]/30 bg-[#d8a548]/10 text-[#D8A548]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="mt-2 sm:mt-0">
                        <dd className="font-display text-2xl leading-none text-[#F7F4EF] sm:text-3xl">
                          {stat.value}
                        </dd>
                        <dt className="mt-1 text-[9px] font-semibold uppercase leading-tight tracking-[0.12em] text-[#8F8D87] sm:text-[10px]">
                          {stat.label}
                        </dt>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </Reveal>
          )}
        </div>
      </section>

      <section
        aria-labelledby="transformation-gallery-heading"
        className="pb-16 sm:pb-20"
      >
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-10 xl:px-14">
          <div className="mb-8 flex flex-col gap-5 border-y border-white/10 py-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2
                id="transformation-gallery-heading"
                className="font-display text-3xl font-normal tracking-[-0.02em] text-[#F7F4EF] sm:text-4xl"
              >
                Transformation Gallery
              </h2>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-[#8F8D87]">
                Select a finishing service to narrow the gallery. Filters use
                published project data only.
              </p>
            </div>

            <Link
              href="#project-enquiry"
              className="inline-flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#D8A548] transition-colors hover:text-[#F2D18B]"
            >
              Request a Quote
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mb-8">
            <TransformationFilters
              services={facets.services}
              activeServiceSlug={activeService?.slug}
              total={initial.total}
            />
          </div>

          <TransformationGallery
            initialProjects={initial.projects}
            initialTotal={initial.total}
            serviceSlug={activeService?.slug}
            available={initial.available && facets.available}
          />

          {facets.illustrative > 0 && (
            <p className="mt-8 flex max-w-3xl items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-xs leading-relaxed text-[#8F8D87]">
              <Sparkles
                className="mt-0.5 h-4 w-4 shrink-0 text-[#D8A548]"
                aria-hidden="true"
              />
              Illustrative comparisons demonstrate surface appearance only. They
              are excluded from the verified project count and are never
              presented as documented before-and-after case studies.
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1440px] px-5 pb-20 sm:px-8 lg:px-10 xl:px-14">
        <TransformationEnquiry />
      </div>
    </main>
  );
}
