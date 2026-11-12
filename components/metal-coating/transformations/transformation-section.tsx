import Link from 'next/link';
import { ImageOff, SearchX } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { TransformationCarousel } from './transformation-carousel';
import type { BeforeAfterProject } from '@/lib/types';

function SectionDivider() {
  return (
    <div className="mt-7 flex items-center justify-center gap-3" aria-hidden="true">
      <span className="h-px w-12 bg-[#C18B2F]/40" />
      <svg viewBox="0 0 24 24" className="h-3 w-3 text-[#C18B2F]" fill="currentColor">
        <path d="M12 1.5l2.1 8.4L22.5 12l-8.4 2.1L12 22.5l-2.1-8.4L1.5 12l8.4-2.1L12 1.5z" />
      </svg>
      <span className="h-px w-12 bg-[#C18B2F]/40" />
    </div>
  );
}

function EmptyState({
  variant,
}: {
  variant: 'unavailable' | 'none';
}) {
  const unavailable = variant === 'unavailable';

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-[#EAE4DA] bg-[#FBF7EF] px-6 py-10 text-center sm:px-10">
      {unavailable ? (
        <ImageOff className="mx-auto h-7 w-7 text-[#C18B2F]" aria-hidden="true" />
      ) : (
        <SearchX className="mx-auto h-7 w-7 text-[#C18B2F]" aria-hidden="true" />
      )}
      <h3 className="mt-4 font-display text-2xl font-medium text-[#171717]">
        {unavailable
          ? 'Transformations are being prepared.'
          : 'No transformations published yet.'}
      </h3>
      <p className="mx-auto mt-2.5 max-w-lg text-sm leading-relaxed text-[#626262]">
        {unavailable
          ? 'Published before-and-after projects are temporarily unavailable. Contact us to discuss a similar finishing project in the meantime.'
          : 'Published before-and-after projects will appear here as soon as our team adds them. Contact us to discuss your finishing requirements.'}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#quote"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#C18B2F] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#A97825] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C18B2F]"
        >
          Request a Quotation
        </a>
        <Link
          href="/before-after"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#C18B2F]/40 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#9A6B1F] transition-colors hover:bg-[#F7F0E3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C18B2F]"
        >
          View Gallery
        </Link>
      </div>
    </div>
  );
}

export function TransformationSection({
  projects,
  available,
}: {
  projects: BeforeAfterProject[];
  available: boolean;
}) {
  const seen = new Set<string>();
  const publishedProjects = projects.filter((project) => {
    if (!project.beforeImageUrl || !project.afterImageUrl) return false;
    if (seen.has(project.id)) return false;
    seen.add(project.id);
    return true;
  });
  const hasIllustrative = publishedProjects.some(
    (project) => project.comparisonType !== 'verified'
  );

  return (
    <section
      id="transformations"
      aria-labelledby="transformations-heading"
      className="scroll-mt-24 bg-white py-8 sm:py-10 lg:py-12"
    >
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-10">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#C18B2F] sm:text-xs">
              Before &amp; After
            </p>
            <h2
              id="transformations-heading"
              className="mt-4 font-display text-[clamp(2rem,4.2vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.02em] text-[#171717]"
            >
              See the transformation<span className="text-[#C18B2F]">.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#626262] sm:text-base">
              Explore published metal finishing and surface comparisons, from
              original condition to refined appearance.
            </p>
            <SectionDivider />
          </div>
        </Reveal>

        <div className="mt-7 lg:mt-9">
          {!available ? (
            <EmptyState variant="unavailable" />
          ) : publishedProjects.length === 0 ? (
            <EmptyState variant="none" />
          ) : (
            <>
              <TransformationCarousel projects={publishedProjects} />

              <div className="mt-8 flex flex-col items-center gap-4 border-t border-[#EAE4DA] pt-6 sm:flex-row sm:justify-between">
                {hasIllustrative && (
                  <p className="max-w-xl text-[11px] leading-relaxed text-[#8A8478]">
                    Illustrative comparisons show surface appearance only and are
                    not presented as documented before-and-after case studies.
                  </p>
                )}
                <Link
                  href="/before-after"
                  className="ml-auto inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A6B1F] transition-colors hover:text-[#7A5315] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C18B2F]"
                >
                  View all transformations
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
