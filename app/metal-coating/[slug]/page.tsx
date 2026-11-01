import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getPublishedServiceBySlugAsync,
  getServicesAsync,
} from '@/lib/data-access';
import { getMetalCoatingWhatsAppLink } from '@/lib/site';
import type { Service } from '@/lib/types';

export const revalidate = 0;

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublishedServiceBySlugAsync(slug);

  if (!service) {
    return {
      title: 'Service Not Found | RTMETALCOATING',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    title: `${service.name} | RTMETALCOATING`,
    description: service.description,
    alternates: {
      canonical: siteUrl ? `${siteUrl}/metal-coating/${slug}` : `/metal-coating/${slug}`,
    },
    openGraph: {
      title: `${service.name} | RTMETALCOATING`,
      description: service.description,
      url: siteUrl ? `${siteUrl}/metal-coating/${slug}` : `/metal-coating/${slug}`,
      type: 'website',
      images: service.image ? [{ url: service.image }] : undefined,
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getPublishedServiceBySlugAsync(slug);

  if (!service) {
    notFound();
  }

  const allServices = await getServicesAsync({ allowStaticFallback: false });
  const relatedServices = allServices
    .filter((s) => s.slug !== slug && s.isPublished !== false)
    .slice(0, 3);

  const metalCoatingWhatsAppUrl = getMetalCoatingWhatsAppLink(
    `Hello RTMETALCOATING, I am interested in ${service.name}. I would like to discuss my requirements and request a quotation.`,
  );

  return (
    <>
      {/* Breadcrumb navigation */}
      <nav className="mx-auto max-w-7xl px-5 lg:px-10 py-4 sm:py-6" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-xs text-white/50 sm:text-sm">
          <li className="flex items-center gap-1">
            <Link
              href="/"
              className="text-white/70 hover:text-gold transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
          </li>
          <li className="flex items-center gap-1">
            <Link
              href="/metal-coating"
              className="text-white/70 hover:text-gold transition-colors"
            >
              Metal Coating
            </Link>
            <ChevronRight className="h-3 w-3" />
          </li>
          <li className="flex items-center gap-1">
            <span className="text-white">{service.name}</span>
          </li>
        </ol>
      </nav>

      {/* Service Hero */}
      <section className="relative overflow-hidden bg-ink pt-24 sm:pt-32 lg:pt-40 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          {service.image && (
            <Image
              src={service.image}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/40" />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
          <div className="max-w-3xl lg:max-w-4xl">
            <p className="mb-4 text-xs font-medium uppercase tracking-ultra text-gold">
              Division 02 · Surface Finishing
            </p>
            <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl mb-6">
              {service.name}
            </h1>
            <p className="mb-8 text-base leading-relaxed text-white/80 sm:text-lg">
              {service.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {metalCoatingWhatsAppUrl ? (
                <a
                  href={metalCoatingWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] text-white px-6 py-3 text-sm font-medium hover:bg-[#22c15e] transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366]/20 text-white/40 cursor-not-allowed px-6 py-3 text-sm font-medium"
                >
                  <MessageCircle className="h-4 w-4" style={{ opacity: 0.5 }} />
                  Chat on WhatsApp
                </button>
              )}
              <Link
                href="/metal-coating#quote"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-transparent text-white px-6 py-3 text-sm font-medium hover:bg-white/10 hover:border-white/50 transition-colors"
              >
                Request a Quote
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Service Overview */}
      {service.longDescription && (
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl mb-6">
                Overview
              </h2>
              <p className="text-lg leading-relaxed text-white/80">
                {service.longDescription}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Service Features */}
      {service.features && service.features.length > 0 && (
        <section className="bg-muted/40 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-4">
              <div>
                <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl mb-2">
                  Service Features
                </h2>
                <p className="text-sm text-white/60">
                  Verified capabilities of {service.name}.
                </p>
              </div>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {service.features.map((feature, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/5 p-5"
                >
                  <MessageCircle className="mr-2 h-4 w-4 text-gold" />
                  <span className="text-sm text-white/90">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Applications */}
      {service.applications && service.applications.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-4">
              <div>
                <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl mb-2">
                  Applications
                </h2>
                <p className="text-sm text-white/60">
                  Suitable materials and use cases for {service.name}.
                </p>
              </div>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {service.applications.map((application, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/5 p-5"
                >
                  <span className="text-sm text-white/90">{application}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Process Information */}
      {service.processSteps && Array.isArray(service.processSteps) && service.processSteps.length > 0 && (
        <section className="bg-ink py-20 sm:py-28 text-white">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-4">
              <div>
                <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl mb-2">
                  Process
                </h2>
                <p className="text-sm text-white/60">
                  How {service.name} is delivered.
                </p>
              </div>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              {service.processSteps.map((step, i) => {
                const stepRecord = step as { title?: string; description?: string } | undefined;
                const stepTitle = stepRecord?.title || `Step ${i + 1}`;
                const stepDescription = stepRecord?.description || '';
                return (
                  <div
                    key={i}
                    className="relative rounded-xl border border-white/10 bg-white/5 p-6"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-ink text-gold mb-4">
                      <span className="text-sm font-medium">{i + 1}</span>
                    </div>
                    <h3 className="font-medium text-sm sm:text-base mb-2">
                      {stepTitle}
                    </h3>
                    {stepDescription && (
                      <p className="text-xs text-white/60 leading-relaxed">
                        {stepDescription}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Related Services */}
      {relatedServices.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-4">
              <div>
                <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl mb-2">
                  Related Services
                </h2>
                <p className="text-sm text-white/60">
                  Explore other surface finishing services.
                </p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedServices.map((related) => (
                <Link
                  key={related.slug}
                  href={`/metal-coating/${related.slug}`}
                  className="group block rounded-xl border border-white/10 bg-white/5 p-6 hover:border-gold/40 transition-colors"
                >
                  <h3 className="font-medium text-sm sm:text-base mb-2 group-hover:text-gold transition-colors">
                    {related.name}
                  </h3>
                  <p className="text-xs text-white/60 leading-relaxed line-clamp-3">
                    {related.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
