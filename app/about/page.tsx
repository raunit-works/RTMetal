import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Sparkles, Layers, Shield, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { CtaBanner } from '@/components/sections/cta-banner';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'About — Our Story & Philosophy',
  description:
    'Learn about RT PU COATING WORKS and our approach to considered home decor, premium surface finishing, craftsmanship and precision.',
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title: 'About RT PU COATING WORKS — Story & Philosophy',
    description:
      'A design-led house bringing together considered home objects and premium surface finishing for spaces, products and projects.',
    url: `${siteUrl}/about`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About RT PU COATING WORKS',
    description:
      'Learn about RT PU COATING WORKS and our approach to considered home decor, premium surface finishing, craftsmanship and precision.',
  },
};

const philosophyPrinciples = [
  {
    num: '01',
    title: 'CRAFTSMANSHIP',
    description: 'Attention to material, detail and finish across every piece and surface.',
  },
  {
    num: '02',
    title: 'PRECISION',
    description: 'Consistent execution from initial concept to final protective coat.',
  },
  {
    num: '03',
    title: 'LONGEVITY',
    description: 'Products and finishes engineered to endure daily use and environmental demands.',
  },
  {
    num: '04',
    title: 'BESPOKE THINKING',
    description: 'Solutions shaped around project specifications, not generic templates.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* SECTION 01 — HERO */}
      <section className="relative overflow-hidden bg-ink pt-32 pb-20 text-white sm:pt-40 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Workshop and Craft"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
          <Reveal>
            <p className="mb-4 font-label text-xs font-medium uppercase tracking-ultra text-gold sm:text-sm">
              ABOUT RT PU COATING WORKS
            </p>
            <h1 className="font-display text-5xl font-medium leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">
              Made with intention.
              <br />
              <span className="gold-text">Finished with precision.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              A design-led house bringing together considered home objects and premium
              surface finishing for spaces, products and projects.
            </p>
          </Reveal>
        </div>
      </section>

      {/* SECTION 02 — OUR STORY */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-center">
            <div className="lg:col-span-6">
              <Reveal>
                <p className="mb-3 font-label text-xs font-medium uppercase tracking-ultra text-gold-deep">
                  OUR STORY
                </p>
                <h2 className="font-display text-3xl font-medium leading-tight sm:text-5xl">
                  Considered from material to finish.
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                  <p>
                    RT PU COATING WORKS was built around a simple belief — the things
                    around us should be made with greater attention.
                  </p>
                  <p>
                    From carefully considered home pieces to precision metal finishes,
                    we work across material, form and surface to create results designed to last.
                  </p>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-6">
              <Reveal delay={0.1}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.pexels.com/photos/6585608/pexels-photo-6585608.jpeg?auto=compress&cs=tinysrgb&w=1600"
                    alt="Craftsmanship and Materiality"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl glass text-white text-xs">
                    <p className="font-semibold text-sm">Two Divisions, Singular Quality</p>
                    <p className="mt-1 text-white/80">Harmonizing home decor objects and architectural metal coating.</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03 — TWO DIVISIONS */}
      <section className="bg-muted/40 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <SectionHeading
            eyebrow="TWO DIVISIONS"
            title="A house of craft, divided into two."
            description="Whether creating curated objects for living spaces or applying protective finishes to metal, both arms operate under the same standard."
          />

          <StaggerGroup className="mt-14 grid gap-8 lg:grid-cols-2">
            <StaggerItem>
              <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-ink p-8 text-white sm:p-10 shadow-xl transition-all duration-500 hover:border-gold/40">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-[100px]" />
                <div>
                  <p className="mb-2 font-label text-xs font-medium uppercase tracking-ultra text-gold">
                    01 · DIVISION ONE
                  </p>
                  <h3 className="font-display text-3xl font-medium text-white sm:text-4xl">
                    HOME DECOR & LIFESTYLE
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-base">
                    Considered objects for everyday spaces, selected for their materiality,
                    character and enduring appeal.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-white/15">
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-white/30 text-white hover:bg-white/10"
                  >
                    <Link href="/home-decor">
                      Explore Home Decor
                      <ArrowRight className="ml-2 h-4 w-4 text-gold" />
                    </Link>
                  </Button>
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-ink p-8 text-white sm:p-10 shadow-xl transition-all duration-500 hover:border-gold/40">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-[100px]" />
                <div>
                  <p className="mb-2 font-label text-xs font-medium uppercase tracking-ultra text-gold">
                    02 · DIVISION TWO
                  </p>
                  <h3 className="font-display text-3xl font-medium text-white sm:text-4xl">
                    METAL COATING
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-base">
                    Premium surface finishing for architectural, commercial and bespoke applications.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-white/15">
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-white/30 text-white hover:bg-white/10"
                  >
                    <Link href="/metal-coating">
                      Explore Metal Coating
                      <ArrowRight className="ml-2 h-4 w-4 text-gold" />
                    </Link>
                  </Button>
                </div>
              </div>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>

      {/* SECTION 04 — OUR PHILOSOPHY */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <SectionHeading
            eyebrow="OUR PHILOSOPHY"
            title="The details are the difference."
            description="Four principles that guide our choices, workshop processes and finished products."
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {philosophyPrinciples.map((p, i) => (
              <Reveal key={p.num} delay={i * 0.08}>
                <div className="group h-full rounded-3xl border border-border bg-background p-8 transition-all duration-500 hover:border-gold/40 hover:shadow-lg">
                  <span className="font-label text-2xl font-bold text-gold-deep">
                    {p.num}
                  </span>
                  <h3 className="mt-4 font-label text-base font-semibold tracking-wider text-foreground">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 05 — FINAL CTA */}
      <CtaBanner
        eyebrow="START A CONVERSATION"
        title={
          <>
            Have something in <span className="gold-text">mind?</span>
          </>
        }
        description="Tell us about your project, requirement or idea."
        primary={{ label: 'Explore Home Decor', href: '/home-decor' }}
        secondary={{ label: 'Discuss a Project', href: '/#contact' }}
        variant="dark"
      />
    </>
  );
}
