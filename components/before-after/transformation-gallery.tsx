'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Loader2, RefreshCw, SearchX } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { TransformationCard } from './transformation-card';
import type { BeforeAfterProject } from '@/lib/types';

const PAGE_SIZE = 8;

export function TransformationGallery({
  initialProjects,
  initialTotal,
  serviceSlug,
  available,
}: {
  initialProjects: BeforeAfterProject[];
  initialTotal: number;
  serviceSlug?: string;
  available: boolean;
}) {
  const [projects, setProjects] = React.useState(initialProjects);
  const [total, setTotal] = React.useState(initialTotal);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setProjects(initialProjects);
    setTotal(initialTotal);
    setLoading(false);
    setError(null);
  }, [initialProjects, initialTotal, serviceSlug]);

  const loadMore = async () => {
    if (loading || projects.length >= total) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        offset: String(projects.length),
        limit: String(PAGE_SIZE),
      });
      if (serviceSlug) params.set('service', serviceSlug);

      const response = await fetch(`/api/before-after?${params.toString()}`, {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || 'More transformations could not be loaded.');
      }

      const incoming = Array.isArray(payload.projects)
        ? (payload.projects as BeforeAfterProject[])
        : [];
      setProjects((current) => {
        const seen = new Set(current.map((project) => project.id));
        return [...current, ...incoming.filter((project) => !seen.has(project.id))];
      });
      if (typeof payload.total === 'number') setTotal(payload.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'More transformations could not be loaded.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!available) {
    return (
      <div className="rounded-3xl border border-[#d8a548]/20 bg-[#17181a] p-10 text-center sm:p-14">
        <AlertCircle className="mx-auto h-8 w-8 text-[#D8A548]" aria-hidden="true" />
        <h2 className="mt-4 font-display text-3xl text-[#F7F4EF]">
          The gallery is being prepared.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#C5C4C1]">
          New before-and-after transformations will appear here once the project
          gallery is available. Contact us in the meantime to discuss a similar
          finishing project.
        </p>
        <Link
          href="/metal-coating"
          className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d8a548]/60 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#F2D18B] transition-colors hover:bg-[#d8a548]/10"
        >
          Explore Metal Services
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-3xl border border-[#d8a548]/20 bg-[#17181a] p-10 text-center sm:p-14">
        <SearchX className="mx-auto h-8 w-8 text-[#D8A548]" aria-hidden="true" />
        <h2 className="mt-4 font-display text-3xl text-[#F7F4EF]">
          No transformations published here yet.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#C5C4C1]">
          {serviceSlug
            ? 'This finishing service does not have a published transformation yet. View the full gallery or contact us to discuss your project.'
            : 'Published transformation projects will appear here as soon as they are added by our team.'}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {serviceSlug && (
            <Link
              href="/before-after"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d8a548]/60 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#F2D18B] transition-colors hover:bg-[#d8a548]/10"
            >
              Clear Filter
            </Link>
          )}
          <Link
            href="/metal-coating"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#D8A548] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#191713] transition-colors hover:bg-[#C39337]"
          >
            Explore Services
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
        {projects.map((project, index) => (
          <Reveal key={project.id} delay={Math.min(index, 4) * 0.05}>
            <TransformationCard project={project} priority={index < 2} />
          </Reveal>
        ))}
      </div>

      <div className="mt-9 flex flex-col items-center justify-center gap-3">
        <p className="text-xs text-[#8F8D87]" aria-live="polite">
          Showing {projects.length} of {total} transformation
          {total === 1 ? '' : 's'}
        </p>

        {error && (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="inline-flex items-center gap-2 text-xs text-[#E09A8F]">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              {error}
            </p>
            <button
              type="button"
              onClick={loadMore}
              className="inline-flex items-center gap-2 rounded-full border border-[#d8a548]/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D8A548] transition-colors hover:bg-[#d8a548]/10"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </button>
          </div>
        )}

        {projects.length < total && !error && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-[#d8a548]/60 bg-[#d8a548]/10 px-7 py-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#F2D18B] transition-colors hover:bg-[#d8a548]/20 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading Transformations
              </>
            ) : (
              <>
                Load More Transformations
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        )}

        {projects.length >= total && total > PAGE_SIZE && (
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#6F6D68]">
            You have reached the end of the gallery
          </p>
        )}
      </div>
    </div>
  );
}
