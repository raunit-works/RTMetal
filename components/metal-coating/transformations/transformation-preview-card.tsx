import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, Sparkles } from 'lucide-react';
import { BeforeAfterCompare } from '@/components/before-after/before-after-compare';
import type { BeforeAfterProject } from '@/lib/types';

function ComparisonBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#C18B2F]/40 bg-[#C18B2F]/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8A5A17]">
        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
        Verified project
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#E4DCCB] bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#7B766C]">
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      Illustrative comparison
    </span>
  );
}

export function TransformationPreviewCard({
  project,
  priority = false,
}: {
  project: BeforeAfterProject;
  priority?: boolean;
}) {
  const verified = project.comparisonType === 'verified';
  const service = project.services[0];
  const description = project.shortDescription || project.description;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-[#C18B2F]/30 bg-white shadow-[0_16px_40px_rgba(23,23,23,0.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(23,23,23,0.10)] motion-reduce:transform-none">
      <div className="p-2.5 pb-0">
        <BeforeAfterCompare
          beforeImage={project.beforeImageUrl!}
          afterImage={project.afterImageUrl!}
          title={project.title}
          verified={verified}
          priority={priority}
          variant="handle"
          theme="light"
          showNote={false}
          aspectClassName="aspect-[16/10]"
          labels={
            verified
              ? { before: 'BEFORE', after: 'AFTER' }
              : { before: 'ORIGINAL SURFACE', after: 'EXAMPLE FINISH' }
          }
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 400px"
        />
      </div>

      <div className="m-2.5 mt-3 flex flex-1 flex-col rounded-[16px] bg-[#FBF7EF] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <ComparisonBadge verified={verified} />
          {project.reference && (
            <span className="shrink-0 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.08em] text-[#A49C8D]">
              {project.reference}
            </span>
          )}
        </div>

        <h3 className="mt-3 font-display text-[19px] font-medium leading-snug tracking-[-0.01em] text-[#171717] sm:text-xl">
          <Link
            href={`/before-after/${project.slug}`}
            className="transition-colors hover:text-[#9A6B1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C18B2F]"
          >
            {project.title}
          </Link>
        </h3>

        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#626262]">
            {description}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {project.material && (
              <span className="rounded-full border border-[#E4DCCB] bg-white/70 px-2.5 py-1 text-[10px] text-[#6B665C]">
                {project.material}
              </span>
            )}
            {service && (
              <span className="max-w-full truncate rounded-full border border-[#E4DCCB] bg-white/70 px-2.5 py-1 text-[10px] text-[#6B665C]">
                {service.name}
              </span>
            )}
          </div>
          <Link
            href={`/before-after/${project.slug}`}
            aria-label={`View ${project.title}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#C18B2F]/40 text-[#9A6B1F] transition-colors hover:border-[#C18B2F] hover:bg-[#C18B2F] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C18B2F]"
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
