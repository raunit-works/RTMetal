
'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getMetalCoatingWhatsAppLink } from '@/lib/site';
import {
  PRINCIPAL_SERVICE_GROUPS,
  type PrincipalServiceGroup,
} from '@/lib/principal-service-groups';
import type { PrincipalServiceDraft } from '@/content/metal-coating';
import type { Service } from '@/lib/types';

interface PrincipalServiceCardsProps {
  previewMode?: boolean;
  publishedServices?: Service[];
  previewDrafts?: PrincipalServiceDraft[];
}

interface CardProps {
  group: PrincipalServiceGroup;
  service?: Service;
  previewDraft?: PrincipalServiceDraft;
  detailHref?: string;
  whatsappUrl: string | null;
  previewMode: boolean;
}

// Decorative motifs are for development preview only.
// They are not representations of actual coating processes.
const SERVICE_MOTIFS: Record<string, CSSProperties> = {
  'pvd-coating': {
    background:
      'linear-gradient(135deg, #292522 0%, #292522 44%, #bbb6ac 44%, #bbb6ac 56%, #292522 56%)',
  },
  electroplating: {
    background:
      'repeating-radial-gradient(circle at center, #aaa49a 0 3px, #36322d 4px 17px)',
  },
  'pu-coating': {
    background:
      'linear-gradient(160deg, #34312c 0%, #777064 50%, #d1c6b0 100%)',
  },
  'powder-coating': {
    background:
      'radial-gradient(#787167 1px, #302d2a 2px)',
    backgroundSize: '12px 12px',
  },
  'decorative-metal-finishing': {
    background:
      'repeating-linear-gradient(100deg, #47413a 0 2px, #aaa397 3px 5px, #676157 6px 8px)',
  },
  'metal-restoration': {
    background:
      'linear-gradient(135deg, #77736c 0%, #c3beb5 49%, #3a3733 50%, #292725 100%)',
  },
};

function ServiceCard({
  group,
  service,
  previewDraft,
  detailHref,
  whatsappUrl,
  previewMode,
}: CardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  // In public mode, only use the published database record.
  // Never substitute unverified draft content.
  const displayName = previewMode
    ? group.name
    : service?.name ?? group.name;

  const displayDescription = service
    ? service.description
    : previewMode
      ? previewDraft?.shortDescription ?? group.description
      : '';

  const imageSrc = service?.image?.trim();
  const showImage = Boolean(imageSrc) && !imageFailed;

  return (
    <article
      className="
        group flex h-full flex-col overflow-hidden
        rounded-xl border border-border/80 bg-background
        shadow-[0_3px_14px_rgba(0,0,0,0.035)]
        motion-safe:transition-[transform,box-shadow,border-color]
        motion-safe:duration-300 motion-safe:ease-out
        hover:border-gold/35
        hover:shadow-[0_14px_30px_rgba(0,0,0,0.075)]
        motion-safe:hover:-translate-y-1
        focus-within:border-gold/50
      "
    >
      {/* Image: consistent proportions on every card */}
      <div
        className="
          relative aspect-[16/10] overflow-hidden
          bg-stone-100
        "
      >
        {showImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={`${displayName} service`}
              width={800}
              height={500}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
              className="
                h-full w-full object-cover
                motion-safe:transition-transform
                motion-safe:duration-500
                motion-safe:ease-out
                motion-safe:group-hover:scale-[1.035]
              "
            />
          </>
        ) : previewMode ? (
          <div
            role="img"
            aria-label={`Abstract preview for ${displayName}`}
            className="h-full w-full"
            style={SERVICE_MOTIFS[group.slug]}
          />
        ) : (
          <div
            role="img"
            aria-label={`Image unavailable for ${displayName}`}
            className="
              flex h-full w-full items-center
              justify-center bg-stone-100 px-6
            "
          >
            <span
              className="
                text-center text-xs font-medium
                tracking-wide text-stone-500
              "
            >
              Service image coming soon
            </span>
          </div>
        )}

        {/* Fine image edge: no heavy gradient overlay */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0
            ring-1 ring-inset ring-black/5
          "
        />
      </div>

      {/* Card content */}
      <div
        className="
          flex flex-1 flex-col
          px-5 pb-5 pt-5
          sm:px-6 sm:pb-6
        "
      >
        <h3
          className="
            font-display text-xl font-medium
            leading-snug tracking-tight text-foreground
            sm:text-[22px]
            motion-safe:transition-colors
            motion-safe:duration-300
            group-hover:text-gold-deep
          "
        >
          {displayName}
        </h3>

        {displayDescription && (
          <p
            className="
              mt-2.5 text-sm leading-6
              text-muted-foreground
            "
          >
            {displayDescription}
          </p>
        )}

        {/* Action aligns to the bottom of every card */}
        {detailHref ? (
          <div className="mt-auto pt-5">
            <Link
              href={detailHref}
              aria-label={`Explore ${displayName}`}
              className="
                inline-flex w-fit items-center gap-2
                border-b border-gold/50 pb-1
                text-[13px] font-semibold text-gold-deep
                transition-colors duration-200
                hover:border-gold hover:text-foreground
                focus-visible:rounded-sm
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-gold
                focus-visible:ring-offset-4
              "
            >
              Explore Service

              <ArrowUpRight
                aria-hidden="true"
                className="
                  h-4 w-4
                  motion-safe:transition-transform
                  motion-safe:duration-300
                  motion-safe:group-hover:translate-x-0.5
                  motion-safe:group-hover:-translate-y-0.5
                "
              />
            </Link>
          </div>
        ) : !previewMode && whatsappUrl ? (
          <div className="mt-auto pt-5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Request a quote for ${displayName}`}
              className="
                inline-flex w-fit items-center gap-2
                border-b border-gold/50 pb-1
                text-[13px] font-semibold text-gold-deep
                transition-colors duration-200
                hover:border-gold hover:text-foreground
                focus-visible:rounded-sm
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-gold
                focus-visible:ring-offset-4
              "
            >
              Request a Quote
              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4"
              />
            </a>
          </div>
        ) : previewMode ? (
          <p
            className="
              mt-auto pt-5 text-xs font-medium
              text-muted-foreground
            "
          >
            Development preview
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function PrincipalServiceCards({
  previewMode = false,
  publishedServices = [],
  previewDrafts = [],
}: PrincipalServiceCardsProps) {
  // Public data must already be publication-filtered
  // by the server-side caller.
  const serviceBySlug = new Map(
    publishedServices.map((service) => [
      service.slug,
      service,
    ])
  );

  const draftBySlug = new Map(
    previewDrafts.map((draft) => [
      draft.slug,
      draft,
    ])
  );

  // Public mode: show only canonical groups with a
  // corresponding published service record.
  const groups = previewMode
    ? PRINCIPAL_SERVICE_GROUPS
    : PRINCIPAL_SERVICE_GROUPS.filter((group) =>
      serviceBySlug.has(group.slug)
    );

  if (groups.length === 0) {
    return null;
  }

  const whatsappUrl = previewMode
    ? null
    : getMetalCoatingWhatsAppLink(
      'Hello RTMETALCOATING, I am interested in your metal coating services.'
    );

  return (
    <section
      aria-labelledby="principal-services-heading"
      className="
        bg-background
        pt-8 pb-10
        sm:pt-12 sm:pb-14
      "
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Editorial section heading: Design 01 */}
        <header
          className="
            grid items-end gap-5
            lg:grid-cols-[1.45fr_1fr]
            lg:gap-12
          "
        >
          <div>
            <p
              className="
                text-[11px] font-semibold uppercase
                tracking-[0.2em] text-gold-deep
              "
            >
              Our Metal Coating Services
            </p>

            <h2
              id="principal-services-heading"
              className="
                mt-3 font-display text-3xl
                font-medium leading-tight
                tracking-tight text-foreground
                sm:text-4xl lg:text-[42px]
              "
            >
              Metal Coating &amp; Finishing
            </h2>
          </div>

          <div
            className="
              lg:border-l lg:border-border
              lg:pl-8
            "
          >
            <p
              className="
                max-w-xl text-sm leading-7
                text-muted-foreground
                sm:text-base
              "
            >
              Explore our coating, restoration and
              decorative finishing services. Select a
              service to learn more about the process
              and discuss your project requirements.
            </p>
          </div>
        </header>

        {/* Six-service card grid */}
        <div
          className="
            mt-8 grid grid-cols-1
            items-stretch gap-5
            sm:mt-10 sm:grid-cols-2 sm:gap-6
            lg:grid-cols-3 lg:gap-7
          "
        >
          {groups.map((group) => {
            const service = serviceBySlug.get(group.slug);
            const previewDraft = draftBySlug.get(group.slug);

            const detailHref = service
              ? `/metal-coating/${group.slug}`
              : undefined;

            return (
              <ServiceCard
                key={`${group.slug}:${service?.image ?? 'preview'}`}
                group={group}
                service={service}
                previewDraft={previewDraft}
                detailHref={detailHref}
                whatsappUrl={whatsappUrl}
                previewMode={previewMode}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
