import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronRight, MessageCircle, Wrench } from 'lucide-react';
import { getMetalCoatingWhatsAppLink } from '@/lib/site';
import {
  getServiceHeroTitle,
  getServiceQuoteHref,
  getServiceWhatsAppMessage,
} from '@/lib/metal-service-content';
import { resolveIcon } from '@/lib/icons';
import type { Service } from '@/lib/types';

interface ServiceHeroProps {
  service: Service;
}

export function ServiceHero({ service }: ServiceHeroProps) {
  const quoteHref = getServiceQuoteHref(service);
  const whatsappUrl = getMetalCoatingWhatsAppLink(
    getServiceWhatsAppMessage(service)
  );
  const ServiceIcon = resolveIcon(service.icon, Wrench);

  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="mx-auto max-w-7xl px-5 pb-14 pt-28 sm:px-6 sm:pb-16 sm:pt-32 lg:px-10 lg:pb-20 lg:pt-36">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 text-[11px] text-white/55 sm:text-xs">
            <li className="flex items-center gap-1">
              <Link
                href="/"
                className="transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                Home
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </li>
            <li className="flex items-center gap-1">
              <Link
                href="/metal-coating"
                className="transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                Metal Services
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </li>
            <li>
              <span aria-current="page" className="text-white/85">
                {service.name}
              </span>
            </li>
          </ol>
        </nav>

        <div className="grid items-center gap-9 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-ultra text-gold">
              Metal Finishing Service
            </p>
            <h1 className="mt-4 font-display text-4xl font-medium leading-[1.02] tracking-tight sm:text-5xl lg:text-[3.75rem]">
              {getServiceHeroTitle(service)}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              {service.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={quoteHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-semibold text-ink transition-colors hover:bg-[#BF8C2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                Request a Quote
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-sm font-medium text-white transition-colors hover:border-white/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  WhatsApp / Discuss Requirements
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-white/10 px-6 text-sm font-medium text-white/40"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  WhatsApp / Discuss Requirements
                </button>
              )}
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:rounded-3xl lg:aspect-[5/4]">
            {service.image ? (
              <Image
                src={service.image}
                alt={`${service.name} metal finishing service`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink-soft to-ink">
                <ServiceIcon
                  className="h-16 w-16 text-gold/70"
                  aria-hidden="true"
                />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
