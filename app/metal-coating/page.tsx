'use client';

import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight, Check, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { InstagramSection } from '@/components/sections/instagram-section';
import { CtaBanner } from '@/components/sections/cta-banner';
import { services, processSteps, industriesServed, instagramPosts } from '@/lib/data';
import { whatsappLink } from '@/lib/site';

const beforeAfter = [
  {
    before:
      'https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=900',
    after:
      'https://images.pexels.com/photos/8216554/pexels-photo-8216554.jpeg?auto=compress&cs=tinysrgb&w=900',
    label: 'Brass Coating on Steel',
  },
  {
    before:
      'https://images.pexels.com/photos/8216570/pexels-photo-8216570.jpeg?auto=compress&cs=tinysrgb&w=900',
    after:
      'https://images.pexels.com/photos/8216580/pexels-photo-8216580.jpeg?auto=compress&cs=tinysrgb&w=900',
    label: 'Premium Surface Finish',
  },
  {
    before:
      'https://images.pexels.com/photos/8216588/pexels-photo-8216588.jpeg?auto=compress&cs=tinysrgb&w=900',
    after:
      'https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=900',
    label: 'Architectural Facade Panel',
  },
];

export default function MetalCoatingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink pt-32 text-white sm:pt-40">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/40" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 lg:px-10">
          <Reveal>
            <p className="mb-4 text-xs font-medium uppercase tracking-ultra text-gold">
              Division 02 · Premium Metal Coating
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tightest sm:text-7xl lg:text-8xl">
              Finishes that <span className="gold-text">endure.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/70 sm:text-lg">
              Specialist coating and finishing services for metal — from brass
              and MS coating to architectural finishes, delivered to an exacting
              standard for trade and private clients.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-ink hover:bg-white/90"
              >
                <a href="#quote">
                  Get a Quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/20 text-white hover:bg-white/10"
              >
                <a
                  href={whatsappLink(
                    "Hello AURUM & CO., I'd like to discuss a metal coating project."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <SectionHeading
            eyebrow="Our Services"
            title="Coating & finishing, refined."
            description="Six specialist services covering everything from decorative brass to large-format architectural finishes."
          />
          <StaggerGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((svc) => (
              <StaggerItem key={svc.slug} id={svc.slug}>
                <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all duration-500 hover:border-gold/40 hover:shadow-xl">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={svc.image}
                      alt={svc.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                    <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full glass">
                      <svc.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-semibold">
                      {svc.name}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {svc.longDescription}
                    </p>
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
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <section className="bg-ink py-20 text-white sm:py-28">
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
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-foreground/80 backdrop-blur-sm transition-colors hover:border-gold/40 hover:text-white">
                  <Building2 className="h-3.5 w-3.5 text-gold" />
                  {ind}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <SectionHeading
            eyebrow="Before & After"
            title="The transformation."
            description="See the difference our coatings make — from raw substrate to premium finish."
          />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {beforeAfter.map((item, i) => (
              <Reveal key={item.label} delay={i * 0.1}>
                <div className="group overflow-hidden rounded-2xl border border-border">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.before}
                      alt={`${item.label} before`}
                      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.after}
                      alt={`${item.label} after`}
                      className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-md">
                      Before
                    </span>
                    <span className="absolute right-3 top-3 rounded-full bg-gold/90 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-ink backdrop-blur-md">
                      After
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Hover to reveal the finished result
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <SectionHeading
            eyebrow="The Process"
            title="From brief to finish."
            description="Every coating project moves through five considered stages — transparent at each step."
          />
          <div className="relative mt-16">
            <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent lg:block" />
            <div className="grid gap-8 lg:grid-cols-5 lg:gap-4">
              {processSteps.map((step, i) => (
                <Reveal key={step.step} delay={i * 0.1}>
                  <div className="relative">
                    <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-background text-gold">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <p className="mt-6 text-center text-xs font-medium uppercase tracking-ultra text-gold-deep">
                      Step {step.step}
                    </p>
                    <h3 className="mt-2 text-center font-display text-xl font-semibold">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
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

      <section id="quote" className="px-5 py-12 lg:px-10 lg:py-16">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center text-white sm:px-12 sm:py-24">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gold/15 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-gold/10 blur-[100px]" />
          <div className="relative">
            <p className="mb-4 text-xs font-medium uppercase tracking-ultra text-gold">
              Request a Quote
            </p>
            <h2 className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Tell us about your <span className="gold-text">project.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-foreground/70 sm:text-lg">
              Share your material, finish, quantity and timeline — we will
              respond with a tailored proposal within one business day.
            </p>
            <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
              <input
                placeholder="Your name"
                className="h-12 rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              />
              <input
                placeholder="Email or phone"
                className="h-12 rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              />
              <textarea
                placeholder="Project details — material, finish, quantity, timeline"
                rows={3}
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:col-span-2"
              />
            </div>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button
                size="lg"
                className="rounded-full bg-white text-ink hover:bg-white/90"
              >
                Request Quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/20 text-white hover:bg-white/10"
              >
                <a
                  href={whatsappLink(
                    "Hello AURUM & CO., I'd like a quote for metal coating."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

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
