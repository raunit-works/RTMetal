import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { getMetalCoatingWhatsAppLink } from '@/lib/site';
import {
  getServiceQuoteHref,
  getServiceWhatsAppMessage,
} from '@/lib/metal-service-content';
import type { Service } from '@/lib/types';

interface ServiceEnquiryCTAProps {
  service: Service;
}

export function ServiceEnquiryCTA({ service }: ServiceEnquiryCTAProps) {
  const quoteHref = getServiceQuoteHref(service);
  const whatsappUrl = getMetalCoatingWhatsAppLink(
    getServiceWhatsAppMessage(service)
  );

  return (
    <section className="px-5 pb-12 pt-4 sm:px-6 sm:pb-16 lg:px-10 lg:pb-20">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-ink-soft px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <span className="block h-px w-14 bg-gold" aria-hidden="true" />
            <h2 className="mt-5 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Discuss Your {service.name} Requirements
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              Share your component details, material, quantity and finishing
              requirements with our team. Every project is quoted individually.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href={quoteHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-semibold text-ink transition-colors hover:bg-[#BF8C2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink-soft"
            >
              Request a Quote
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-sm font-medium text-white transition-colors hover:border-white/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink-soft"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp Enquiry
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-sm font-medium text-white/70"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp Enquiry
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
