import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, Sparkles } from 'lucide-react';
import { BeforeAfterCompare } from './before-after-compare';
import type { BeforeAfterProject } from '@/lib/types';

export function formatProjectDate(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function VerificationBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8a548]/45 bg-[#d8a548]/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#F2D18B]">
        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
        Verified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#C5C4C1]">
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      Illustrative
    </span>
  );
}

export function TransformationCard({
  project,
  priority = false,
}: {
  project: BeforeAfterProject;
  priority?: boolean;
}) {
  const verified = project.comparisonType === 'verified';
  const projectDate = formatProjectDate(project.projectDate);
  const services = project.services.slice(0, 3);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#d8a548]/20 bg-[#17181a] p-3 shadow-[0_22px_70px_rgba(0,0,0,0.32)] transition-colors hover:border-[#d8a548]/40 sm:p-4">
      <BeforeAfterCompare
        beforeImage={project.beforeImageUrl!}
        afterImage={project.afterImageUrl!}
        title={project.title}
        verified={verified}
        priority={priority}
      />

      <div className="flex flex-1 flex-col px-1 pb-1 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <VerificationBadge verified={verified} />
          {project.isFeatured && (
            <span className="rounded-full border border-[#d8a548]/30 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#D8A548]">
              Featured
            </span>
          )}
          {projectDate && (
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8F8D87]">
              {projectDate}
            </span>
          )}
        </div>

        <h3 className="mt-3 font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-[#F7F4EF]">
          <Link
            href={`/before-after/${project.slug}`}
            className="transition-colors hover:text-[#E2BA70] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D8A548]"
          >
            {project.title}
          </Link>
        </h3>

        {(project.shortDescription || project.description) && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#C5C4C1]">
            {project.shortDescription || project.description}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {project.material && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8F8D87]">
                Material
              </dt>
              <dd className="mt-0.5 truncate text-[#E8E6E1]">{project.material}</dd>
            </div>
          )}
          {project.finishName && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8F8D87]">
                Finish
              </dt>
              <dd className="mt-0.5 truncate text-[#E8E6E1]">{project.finishName}</dd>
            </div>
          )}
        </dl>

        {services.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {services.map((service) => (
              <span
                key={service.id}
                className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-[#B8B6B1]"
              >
                {service.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-5">
          <Link
            href={`/before-after/${project.slug}`}
            className="group inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D8A548] transition-colors hover:text-[#F2D18B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D8A548]"
          >
            View Transformation
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
