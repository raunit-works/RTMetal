'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, ArrowRight, Check, Building2, Loader2, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { InstagramSection } from '@/components/sections/instagram-section';
import { CtaBanner } from '@/components/sections/cta-banner';
import { getMetalCoatingWhatsAppLink } from '@/lib/site';
import { resolveIcon } from '@/lib/icons';
import type { Service, InstagramPost, Category, MetalFinishCardData, BeforeAfterProject } from '@/lib/types';
import { createInquiry } from '@/lib/supabase/inquiries';
import { PrincipalServiceCards } from '@/components/sections/principal-service-cards';
import { FinishCollection } from '@/components/sections/finish-collection';
import { CategoryShowcase } from '@/components/categories/category-showcase';
import { toCategoryShowcaseItems } from '@/lib/category-showcase';
import { PRINCIPAL_SERVICE_GROUPS } from '@/lib/principal-service-groups';
import { isCategoryInSection } from '@/lib/category-hierarchy';
import { WorkflowSection } from '@/components/metal-coating/workflow/workflow-section';
import { TransformationSection } from '@/components/metal-coating/transformations/transformation-section';

interface MetalCoatingClientProps {
  services: Service[];
  instagramPosts: InstagramPost[];
  industriesServed: string[];
  categories: Category[];
  finishes: MetalFinishCardData[];
  beforeAfterProjects: BeforeAfterProject[];
  beforeAfterAvailable: boolean;
}

export function MetalCoatingClient({
  services,
  instagramPosts,
  industriesServed,
  categories,
  finishes,
  beforeAfterProjects,
  beforeAfterAvailable,
}: MetalCoatingClientProps) {
  const [quoteName, setQuoteName] = useState('');
  const [quoteEmail, setQuoteEmail] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteFinishRef, setQuoteFinishRef] = useState('');

  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteServiceId, setQuoteServiceId] = useState<string | undefined>(undefined);
  const metalCoatingWhatsAppUrl = getMetalCoatingWhatsAppLink(
    "Hello RTMETALCOATING, I'd like a quote for metal coating services."
  );

  // Service detail pages link here with ?service=<slug>#quote. Prefill the
  // enquiry with that service and carry its ID into the existing API flow.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const requestedSlug = new URLSearchParams(window.location.search).get('service');
    if (!requestedSlug) return;

    const requestedService = services.find((service) => service.slug === requestedSlug);
    if (!requestedService) return;

    setQuoteServiceId(requestedService.id);
    setQuoteMessage((current) =>
      current.trim().length > 0
        ? current
        : `I would like a quotation for ${requestedService.name}.\n\nPlease share your component details, material, quantity and finishing requirements.`
    );
  }, [services]);

  const selectFinishForEnquiry = (finId: string, displayName: string) => {
    setQuoteFinishRef(finId);
    const quoteSection = document.getElementById('quote');
    if (quoteSection) {
      quoteSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#quote';
    }
  };

  // Derive principal vs specialist services from the published array
  const principalServiceSlugs = new Set(
    PRINCIPAL_SERVICE_GROUPS.map((g) => g.slug)
  );
  const principalServices = services.filter((svc) =>
    principalServiceSlugs.has(svc.slug)
  );
  const specialistServices = services.filter(
    (svc) => !principalServiceSlugs.has(svc.slug)
  );

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteSubmitting) return;

    setQuoteSubmitting(true);
    setQuoteError(null);

    const res = await createInquiry({
      name: quoteName,
      email: quoteEmail,
      phone: quotePhone || undefined,
      message:
        quoteMessage +
        (quoteFinishRef ? `\nFinish reference (FIN ID): ${quoteFinishRef}` : ''),
      division: 'metal_coating',
      inquiry_type: 'service',
      service_id: quoteServiceId,
    });

    setQuoteSubmitting(false);

    if (res.success) {
      setQuoteSubmitted(true);
      setQuoteName('');
      setQuoteEmail('');
      setQuotePhone('');
      setQuoteFinishRef('');

      const selectedService = quoteServiceId
        ? services.find((service) => service.id === quoteServiceId)
        : undefined;
      setQuoteMessage(
        selectedService
          ? `I would like a quotation for ${selectedService.name}.\n\nPlease share your component details, material, quantity and finishing requirements.`
          : ''
      );

      setTimeout(() => setQuoteSubmitted(false), 5000);
    } else {
      setQuoteError(res.message);
    }
  };

  return (
    <>
      <section className="relative overflow-hidden bg-ink pt-32 text-white sm:pt-40">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <Image
            src="/hero-coating-process.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/40" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 lg:px-10">
          <Reveal>
            <p className="mb-4 text-xs font-medium uppercase tracking-ultra text-gold">
              METAL COATING & FINISHING
            </p>
            <h1 className="font-display text-5xl font-medium leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">
              Metal Coating<span className="gold-text"> & Finishing</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Coating, refinishing and decorative surface finishes for metal components,
              fabrication work and custom projects. Explore our services
              and finish samples, or share your requirements for a quotation.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
              {/* Button 1 — Primary: warm-white bg, dark ink text, always visible */}
              <Button
                asChild
                size="lg"
                className="h-12 w-full rounded-full bg-white px-6 text-sm font-medium text-ink hover:bg-white/90 sm:h-11 sm:w-auto sm:px-8"
              >
                <a href="#services">
                  Explore Our Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              {/* Button 2 — Secondary: transparent, explicit white text, gold border */}
              <Button
                asChild
                size="lg"
                className="h-12 w-full rounded-full border border-white/30 bg-transparent px-6 text-sm font-medium text-white hover:border-white/50 hover:bg-white hover:text-ink sm:h-11 sm:w-auto sm:px-8"
              >
                <a href="#quote">
                  Enquire About a Project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Metal Services — always visible; finishes section is unconditional */}
      <section id="services" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          {/* Published principal services — only when Supabase has records */}
          {principalServices.length > 0 && (
            <PrincipalServiceCards publishedServices={services} />
          )}

          {/* Metal Finishes & Colour Collection — always rendered */}
          <FinishCollection
            finishes={finishes}
            onEnquireFinish={selectFinishForEnquiry}
          />

          {/* Published specialist services — only when Supabase has records */}
          {specialistServices.length > 0 && (
            <>
              <SectionHeading
                eyebrow="Our Services"
                title="Specialist Services"
                description="Surface finishing, restoration and specialist treatments across metal, marble, wood and more — each carried out with care and consistency."
              />
              <StaggerGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {specialistServices.map((svc) => {
                  const SvcIcon = resolveIcon(svc.icon, Wrench);
                  return (
                    <StaggerItem key={svc.slug} id={svc.slug} className="scroll-mt-24">
                      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all duration-500 hover:border-gold/40 hover:shadow-xl">
                        <Link href={`/metal-coating/${svc.slug}`} className="flex-1 flex-col overflow-hidden" aria-label={`${svc.name} — view service`}>
                          <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#2b2419] via-ink-soft to-ink">
                            {svc.image && (
                              <>
                                <Image
                                  src={svc.image}
                                  alt={svc.name}
                                  fill
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                  loading="lazy"
                                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                                  onError={(event) => {
                                    event.currentTarget.style.display = 'none';
                                  }}
                                />
                              </>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                            <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full glass">
                              <SvcIcon className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="flex flex-1 flex-col p-6">
                            <h3 className="font-display text-xl font-medium sm:text-2xl">
                              {svc.name}
                            </h3>
                            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                              {svc.longDescription || svc.description}
                            </p>
                            {svc.features && svc.features.length > 0 && (
                              <ul className="mt-5 space-y-2">
                                {svc.features.map((f) => (
                                  <li
                                    key={f}
                                    className="flex items-center gap-2 text-xs text-foreground/70"
                                  >
                                    <Check className="h-3.5 w-3.5 text-gold" />
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </Link>
                        <div className="mt-6 border-t border-border/60 pt-4">
                          {(() => {
                            const serviceWhatsAppUrl = getMetalCoatingWhatsAppLink(
                              `Hello RTMETALCOATING, I am interested in ${svc.name}. I would like to discuss my coating requirement.`
                            );
                            return serviceWhatsAppUrl ? (
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="w-full rounded-full border-gold/30 hover:border-gold hover:bg-gold/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(serviceWhatsAppUrl, '_blank', 'noopener,noreferrer');
                                }}
                              >
                                <button type="button" className="flex w-full items-center justify-between gap-2">
                                  <MessageCircle className="mr-2 h-3.5 w-3.5 text-gold-deep" />
                                  <span>Enquire About {svc.shortName || svc.name}</span>
                                </button>
                              </Button>
                            ) : (
                              <Button
                                disabled
                                size="sm"
                                variant="outline"
                                className="w-full cursor-not-allowed rounded-full border-gold/20 bg-transparent text-muted-foreground disabled:opacity-100"
                              >
                                <MessageCircle className="mr-2 h-3.5 w-3.5 text-gold-deep" />
                                Enquire About {svc.shortName || svc.name}
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerGroup>
            </>
          )}
        </div>
      </section>

      {/* Metal Product Collections */}
      {(() => {
        const metalCategories = categories.filter(
          (category) =>
            isCategoryInSection(category, 'metal_services') &&
            category.isPublished !== false
        );
        if (metalCategories.length === 0) return null;
        return (
          <CategoryShowcase
            id="collections"
            className="scroll-mt-24"
            eyebrow="Metal Product Collections"
            title="Browse our metalwork categories"
            description="Explore decorative art, architectural details and custom metal products. Open a collection to view available designs and enquire about your requirements."
            items={toCategoryShowcaseItems(metalCategories)}
            ctaLabel="View Collection"
          />
        );
      })()}

      <section className="bg-ink py-10 text-white sm:py-12 lg:py-14">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <SectionHeading
            eyebrow="Industries We Serve"
            title={
              <span className="text-white">
                Built for <span className="gold-text">every</span> sector.
              </span>
            }
            description="From single pieces to full production runs, we serve clients across industries who demand finish quality without compromise."
          />
          <div className="mt-14 flex flex-wrap justify-center gap-3">
            {industriesServed.map((ind, i) => (
              <Reveal key={ind} delay={i * 0.05}>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/90 backdrop-blur-sm transition-colors hover:border-gold/40 hover:text-white">
                  <Building2 className="h-3.5 w-3.5 text-gold" />
                  {ind}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <TransformationSection
        projects={beforeAfterProjects}
        available={beforeAfterAvailable}
      />

      <WorkflowSection />

      <section className="py-10 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <SectionHeading
            eyebrow="Premium Finishes"
            title="A finish for every vision."
            description="Polished, brushed, satin, matte or patinated — we develop the finish your project demands."
          />
          <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {[
              { name: 'Polished Brass', tone: 'linear-gradient(135deg, hsl(42 80% 70%), hsl(38 55% 42%))' },
              { name: 'Brushed Gold', tone: 'linear-gradient(135deg, hsl(40 60% 60%), hsl(36 45% 38%))' },
              { name: 'Satin Nickel', tone: 'linear-gradient(135deg, hsl(0 0% 70%), hsl(0 0% 45%))' },
              { name: 'Matte Black', tone: 'linear-gradient(135deg, hsl(0 0% 12%), hsl(0 0% 6%))' },
            ].map((finish, i) => (
              <Reveal key={finish.name} delay={i * 0.08}>
                <div className="group overflow-hidden rounded-2xl border border-border">
                  <div
                    className="relative aspect-square transition-transform duration-700 group-hover:scale-105"
                    style={{ background: finish.tone }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold">{finish.name}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <InstagramSection
        posts={instagramPosts.filter(
          (p) => p.category === 'Workshop' || p.category === 'Recent Work' || p.category === 'Behind The Scenes'
        ).slice(0, 6)}
        eyebrow="Workshop & Work"
        title="Inside the workshop"
        description="Reels and posts from the coating floor — process, machinery and completed projects."
      />

      <section id="quote" className="scroll-mt-24 px-5 py-8 lg:px-10 lg:py-12">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-ink px-6 py-10 text-center text-white sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gold/15 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-gold/10 blur-[100px]" />
          <div className="relative">
            <p className="mb-4 text-xs font-medium uppercase tracking-ultra text-gold">
              Request a Quote
            </p>
            <h2 className="mx-auto max-w-3xl font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Tell us about your <span className="gold-text">project.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Share your material, finish, quantity and timeline — we will
              respond with a tailored proposal within one business day.
            </p>
            <form onSubmit={handleQuoteSubmit} className="mx-auto mt-10 max-w-2xl text-left">
              {quoteError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/20 p-3 text-xs text-destructive-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{quoteError}</span>
                </div>
              )}

              {quoteSubmitted && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/20 p-3 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Quote request received! Our team will reach out to you within one business day.</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  value={quoteName}
                  onChange={(e) => setQuoteName(e.target.value)}
                  disabled={quoteSubmitting}
                  placeholder="Your name *"
                  className="h-12 rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                />
                <input
                  type="email"
                  required
                  value={quoteEmail}
                  onChange={(e) => setQuoteEmail(e.target.value)}
                  disabled={quoteSubmitting}
                  placeholder="Email address *"
                  className="h-12 rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                />
                <input
                  value={quotePhone}
                  onChange={(e) => setQuotePhone(e.target.value)}
                  disabled={quoteSubmitting}
                  placeholder="Phone number (optional)"
                  className="h-12 rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:col-span-2"
                />
                <input
                  value={quoteFinishRef}
                  onChange={(e) => setQuoteFinishRef(e.target.value)}
                  disabled={quoteSubmitting}
                  placeholder="Finish reference (FIN ID) — optional"
                  className="h-12 rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:col-span-2"
                />
                <textarea
                  required
                  rows={3}
                  value={quoteMessage}
                  onChange={(e) => setQuoteMessage(e.target.value)}
                  disabled={quoteSubmitting}
                  placeholder="Project details — material, finish, quantity, timeline *"
                  className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:col-span-2"
                />
              </div>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={quoteSubmitting || quoteSubmitted}
                  className="w-full rounded-full bg-white text-ink hover:bg-white/90 sm:w-auto font-medium"
                >
                  {quoteSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      {quoteSubmitted ? 'Quote Request Sent' : 'Request Quote'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                {metalCoatingWhatsAppUrl ? (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full rounded-full border-white/30 bg-transparent text-white hover:border-white/50 hover:bg-white hover:text-ink sm:w-auto"
                  >
                    <a
                      href={metalCoatingWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat on WhatsApp
                    </a>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled
                    size="lg"
                    variant="outline"
                    title="WhatsApp contact is not configured yet. Please use the quote form above."
                    className="w-full cursor-not-allowed rounded-full border-white/25 bg-transparent text-white/70 disabled:opacity-100 sm:w-auto"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat on WhatsApp
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section >

      <CtaBanner
        eyebrow="Two divisions, one standard"
        title={
          <>
            Explore the <span className="gold-text">collection</span> too.
          </>
        }
        description="While you are here, discover our home decor and lifestyle pieces — designed with the same attention to material and craft."
        primary={{ label: 'Shop Home Decor', href: '/home-decor' }}
        secondary={{ label: 'Back to Home', href: '/' }}
        variant="light"
      />
    </>
  );
}
