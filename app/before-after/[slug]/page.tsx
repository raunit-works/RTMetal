import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  CalendarDays,
  Check,
  Layers,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { BeforeAfterCompare } from '@/components/before-after/before-after-compare';
import { formatProjectDate } from '@/components/before-after/transformation-card';
import { TransformationEnquiry } from '@/components/before-after/transformation-enquiry';
import { getPublishedBeforeAfterProjectBySlug } from '@/lib/supabase/before-after-public';
import { getSiteUrlForPath } from '@/lib/site-url';

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedBeforeAfterProjectBySlug(slug);

  if (!project) {
    return { title: 'Transformation Not Found' };
  }

  const description =
    project.shortDescription ||
    project.description ||
    'A metal coating and surface finishing transformation from RTMETALCOATING.';
  const canonicalUrl = getSiteUrlForPath(`/before-after/${project.slug}`);

  return {
    title: `${project.title} | Before & After`,
    description: description.slice(0, 160),
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    openGraph: {
      title: `${project.title} | RTMETALCOATING`,
      description: description.slice(0, 160),
      url: canonicalUrl,
      type: 'article',
      images: project.afterImageUrl?.startsWith('http')
        ? [{ url: project.afterImageUrl }]
        : undefined,
    },
  };
}

function DetailChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wrench;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d8a548]/30 bg-[#d8a548]/10 text-[#D8A548]">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8F8D87]">
          {label}
        </dt>
        <dd className="mt-1 break-words text-sm text-[#E8E6E1]">{value}</dd>
      </div>
    </div>
  );
}

export default async function BeforeAfterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getPublishedBeforeAfterProjectBySlug(slug);

  if (!project || !project.beforeImageUrl || !project.afterImageUrl) {
    notFound();
  }

  const verified = project.comparisonType === 'verified';
  const projectDate = formatProjectDate(project.projectDate);
  const primaryService = project.services[0];
  const description =
    project.description || project.shortDescription || null;

  return (
    <main className="min-h-screen bg-[#101112] text-[#F7F4EF]">
      <section className="relative isolate overflow-hidden pb-10 pt-32 sm:pb-14 sm:pt-40">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-[#d8a548]/10 blur-[120px]" />
          <div className="absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-[#d8a548]/5 blur-[110px]" />
        </div>

        <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <Reveal>
            <Link
              href="/before-after"
              className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B8B6B1] transition-colors hover:text-[#D8A548]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              All Transformations
            </Link>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              {verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8a548]/45 bg-[#d8a548]/15 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#F2D18B]">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Verified Before & After Project
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#C5C4C1]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Illustrative Surface Comparison
                </span>
              )}
              {project.isFeatured && (
                <span className="rounded-full border border-[#d8a548]/30 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#D8A548]">
                  Featured Project
                </span>
              )}
            </div>

            <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.7rem,5.5vw,5rem)] font-normal leading-[1.02] tracking-[-0.035em]">
              {project.title}
            </h1>

            {(project.shortDescription || project.description) && (
              <p className="mt-5 max-w-2xl text-[15px] leading-[1.8] text-[#C5C4C1] sm:text-base">
                {project.shortDescription || project.description}
              </p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="pb-12 sm:pb-16">
        <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <Reveal direction="up">
            <BeforeAfterCompare
              beforeImage={project.beforeImageUrl}
              afterImage={project.afterImageUrl}
              title={project.title}
              verified={verified}
              priority
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="mx-auto max-w-5xl"
            />
          </Reveal>

          <Reveal delay={0.05}>
            <dl className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {project.componentType && (
                <DetailChip icon={Boxes} label="Component" value={project.componentType} />
              )}
              {project.material && (
                <DetailChip icon={Layers} label="Material" value={project.material} />
              )}
              {project.finishName && (
                <DetailChip icon={Wrench} label="Finish" value={project.finishName} />
              )}
              {projectDate && (
                <DetailChip icon={CalendarDays} label="Project Date" value={projectDate} />
              )}
            </dl>
          </Reveal>

          {project.services.length > 0 && (
            <Reveal delay={0.08}>
              <div className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8F8D87]">
                  Services
                </span>
                {project.services.map((service) => (
                  <Link
                    key={service.id}
                    href={`/metal-coating/${service.slug}`}
                    className="rounded-full border border-white/12 px-3 py-1.5 text-[11px] text-[#C5C4C1] transition-colors hover:border-[#d8a548]/50 hover:text-[#F2D18B]"
                  >
                    {service.name}
                  </Link>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <section className="pb-14 sm:pb-20">
        <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 lg:px-10">
          <div className="space-y-8">
            {(project.initialCondition || project.treatmentDescription || project.finalDescription) && (
              <Reveal>
                <div className="grid gap-4 sm:grid-cols-3">
                  {project.initialCondition && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#D8A548]">
                        Initial Condition
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[#C5C4C1]">
                        {project.initialCondition}
                      </p>
                    </div>
                  )}
                  {project.treatmentDescription && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#D8A548]">
                        Treatment
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[#C5C4C1]">
                        {project.treatmentDescription}
                      </p>
                    </div>
                  )}
                  {project.finalDescription && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#D8A548]">
                        Final Result
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[#C5C4C1]">
                        {project.finalDescription}
                      </p>
                    </div>
                  )}
                </div>
              </Reveal>
            )}

            {(description || project.finishDescription) && (
              <Reveal>
                <div className="rounded-3xl border border-white/10 bg-[#17181a] p-6 sm:p-8">
                  <h2 className="font-display text-3xl font-normal tracking-[-0.02em] text-[#F7F4EF]">
                    Project Notes
                  </h2>
                  {description && (
                    <p className="mt-4 whitespace-pre-line text-sm leading-[1.9] text-[#C5C4C1]">
                      {description}
                    </p>
                  )}
                  {project.finishDescription && (
                    <div className="mt-5 border-t border-white/10 pt-5">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#D8A548]">
                        Finish Details
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-[1.9] text-[#C5C4C1]">
                        {project.finishDescription}
                      </p>
                    </div>
                  )}
                </div>
              </Reveal>
            )}

            {project.additionalImages.length > 0 && (
              <Reveal>
                <div>
                  <h2 className="font-display text-3xl font-normal tracking-[-0.02em] text-[#F7F4EF]">
                    Additional Views
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {project.additionalImages.map((imageUrl, index) => (
                      <div
                        key={`${imageUrl}-${index}`}
                        className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[#17181a]"
                      >
                        <Image
                          src={imageUrl}
                          alt={`${project.title} additional view ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 420px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
          </div>

          <aside className="space-y-5">
            {project.features.length > 0 && (
              <Reveal>
                <div className="rounded-3xl border border-white/10 bg-[#17181a] p-6">
                  <h2 className="font-display text-2xl font-normal text-[#F7F4EF]">
                    Project Highlights
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {project.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-[#C5C4C1]"
                      >
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#D8A548]"
                          aria-hidden="true"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}

            {(project.reference ||
              project.relatedCategory ||
              project.relatedProduct ||
              project.finishName) && (
              <Reveal>
                <div className="rounded-3xl border border-white/10 bg-[#17181a] p-6">
                  <h2 className="font-display text-2xl font-normal text-[#F7F4EF]">
                    Project Details
                  </h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    {project.reference && (
                      <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                        <dt className="text-[#8F8D87]">Reference</dt>
                        <dd className="text-right text-[#E8E6E1]">{project.reference}</dd>
                      </div>
                    )}
                    {project.finishName && (
                      <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                        <dt className="text-[#8F8D87]">Finish</dt>
                        <dd className="text-right text-[#E8E6E1]">{project.finishName}</dd>
                      </div>
                    )}
                    {project.relatedCategory && (
                      <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                        <dt className="text-[#8F8D87]">Category</dt>
                        <dd className="text-right text-[#E8E6E1]">
                          {project.relatedCategory.name}
                        </dd>
                      </div>
                    )}
                    {project.relatedProduct && (
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-[#8F8D87]">Product</dt>
                        <dd className="text-right text-[#E8E6E1]">
                          {project.relatedProduct.name}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Reveal>
            )}

            {!verified && (
              <Reveal>
                <div className="rounded-3xl border border-[#d8a548]/25 bg-[#d8a548]/5 p-6">
                  <p className="flex items-start gap-2.5 text-xs leading-relaxed text-[#B8B6B1]">
                    <Sparkles
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#D8A548]"
                      aria-hidden="true"
                    />
                    This is an illustrative surface comparison. The images
                    demonstrate different surface appearances and do not document
                    the before-and-after condition of the same object.
                  </p>
                </div>
              </Reveal>
            )}
          </aside>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1280px] px-5 pb-20 sm:px-8 lg:px-10">
        <TransformationEnquiry
          projectTitle={project.title}
          serviceId={primaryService?.id}
          serviceName={primaryService?.name}
        />
      </div>
    </main>
  );
}
