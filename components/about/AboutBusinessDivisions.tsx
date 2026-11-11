import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Frame,
  Gift,
  Globe,
  Home,
  Lamp,
  MapPin,
  Sofa,
  Sparkles,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

import { Reveal } from '@/components/motion/reveal';
import { Button } from '@/components/ui/button';
import {
  aboutMedia,
  coreMetalServices,
  homeDecorCollections,
} from './about-data';

const collectionIcons: Record<string, LucideIcon> = {
  'Home Decor': Home,
  'Decorative Accessories': Frame,
  'Gift Articles': Gift,
  'Lifestyle Products': Lamp,
  'Household Products': Sofa,
  'Daily Utility': Utensils,
};

export function AboutBusinessDivisions() {
  return (
    <section
      aria-labelledby="about-divisions-heading"
      className="bg-white py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-brass/60" aria-hidden="true" />
              <p className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-brass-deep">
                Our Business Divisions
              </p>
              <span className="h-px w-8 bg-brass/60" aria-hidden="true" />
            </div>

            <h2
              id="about-divisions-heading"
              className="mt-5 font-display text-3xl font-medium leading-[1.08] tracking-tight text-charcoal sm:text-4xl lg:text-5xl"
            >
              Two Specialised Divisions.{' '}
              <span className="italic text-brass-rich">One Shared Expertise.</span>
            </h2>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 xl:grid-cols-2">
          <Reveal className="h-full">
            <article className="h-full overflow-hidden rounded-3xl bg-charcoal text-white shadow-[0_24px_60px_-36px_rgba(23,23,23,0.7)] ring-1 ring-black/10">
              <div className="grid h-full sm:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                <div className="relative min-h-[220px] sm:min-h-full">
                  <Image
                    src={aboutMedia.metalDivision}
                    alt="Illustrative brass-finished architectural metal interior"
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 1279px) 38vw, 20vw"
                    className="object-cover object-center"
                  />

                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"
                    aria-hidden="true"
                  />

                  <p className="absolute bottom-4 left-4 right-4 font-label text-[10px] font-medium uppercase tracking-[0.18em] text-white/75">
                    Architectural metal finishes
                  </p>
                </div>

                <div className="flex flex-col p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-brass-light">
                      01 / Metal Division
                    </p>
                    <MapPin
                      className="h-4 w-4 shrink-0 text-brass-light"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mt-4 font-display text-3xl font-medium leading-tight text-white sm:text-[2rem]">
                    RTMETALCOATING
                  </h3>

                  <p className="mt-1 text-sm font-medium text-brass-light">
                    Professional Metal Coating Services
                  </p>

                  <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-white/55">
                    <MapPin
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-light"
                      aria-hidden="true"
                    />
                    Mumbai, Maharashtra, India
                  </p>

                  <p className="mt-4 text-sm leading-7 text-white/70">
                    Specialist metal coating, surface treatment and decorative
                    finishing solutions for architectural, interior, furniture
                    and industrial applications.
                  </p>

                  <ul
                    aria-label="RTMETALCOATING services"
                    className="mt-5 grid gap-x-4 gap-y-2 min-[360px]:grid-cols-2"
                  >
                    {coreMetalServices.map((service) => (
                      <li
                        key={service}
                        className="flex items-start gap-2 text-[12px] leading-5 text-white/70"
                      >
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-light"
                          aria-hidden="true"
                        />
                        <span>{service}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-6">
                    <Button
                      asChild
                      className="h-11 w-full rounded-full bg-ivory text-sm font-semibold text-charcoal hover:bg-champagne focus-visible:ring-brass-light focus-visible:ring-offset-charcoal"
                    >
                      <Link href="/metal-coating">
                        Explore Metal Coating Services
                        <ArrowRight
                          className="ml-2 h-4 w-4"
                          aria-hidden="true"
                        />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          </Reveal>

          <Reveal className="h-full" delay={0.08}>
            <article className="h-full overflow-hidden rounded-3xl border border-parchment bg-champagne/80 text-charcoal shadow-[0_24px_60px_-40px_rgba(23,23,23,0.5)]">
              <div className="grid h-full sm:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                <div className="relative min-h-[220px] sm:min-h-full">
                  <Image
                    src={aboutMedia.homeDecorDivision}
                    alt="Illustrative living room with decorative metal wall art and home accessories"
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 1279px) 38vw, 20vw"
                    className="object-cover object-center"
                  />

                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
                    aria-hidden="true"
                  />

                  <p className="absolute bottom-4 left-4 right-4 font-label text-[10px] font-medium uppercase tracking-[0.18em] text-white/85">
                    Home decor &amp; lifestyle
                  </p>
                </div>

                <div className="flex flex-col p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-brass-deep">
                      02 / Home Decor Division
                    </p>
                    <Globe
                      className="h-4 w-4 shrink-0 text-brass-deep"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mt-4 font-display text-3xl font-medium leading-tight text-charcoal sm:text-[2rem]">
                    RT HOME DECOR
                  </h3>

                  <p className="mt-1 text-sm font-medium text-brass-deep">
                    Online Home Decor &amp; Lifestyle Store
                  </p>

                  <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-charcoal/70">
                    <MapPin
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-deep"
                      aria-hidden="true"
                    />
                    Wai, Satara, Maharashtra, India
                  </p>

                  <p className="mt-4 text-sm leading-7 text-[#5F5A53]">
                    RT HOME DECOR is a home decoration and lifestyle retail
                    business offering decorative showpieces, spiritual décor,
                    traditional accessories, gifting products and home styling
                    collections for customers across India.
                  </p>

                  <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-charcoal/65">
                    <Globe
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-deep"
                      aria-hidden="true"
                    />
                    Delivery available to eligible locations across India.
                  </p>

                  <ul
                    aria-label="RT HOME DECOR collections"
                    className="mt-5 grid gap-x-4 gap-y-2 min-[360px]:grid-cols-2"
                  >
                    {homeDecorCollections.map((collection) => {
                      const Icon = collectionIcons[collection.label] ?? Sparkles;

                      return (
                        <li key={collection.href}>
                          <Link
                            href={collection.href}
                            className="group flex items-start gap-2 rounded-sm text-[12px] leading-5 text-charcoal/75 transition-colors hover:text-brass-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-deep focus-visible:ring-offset-2 focus-visible:ring-offset-champagne"
                          >
                            <Icon
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-deep"
                              aria-hidden="true"
                            />
                            <span className="group-hover:underline">
                              {collection.label}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-auto pt-6">
                    <Button
                      asChild
                      className="h-11 w-full rounded-full bg-charcoal text-sm font-semibold text-white hover:bg-charcoal-soft focus-visible:ring-brass-deep focus-visible:ring-offset-champagne"
                    >
                      <Link href="/home-decor">
                        Visit RT HOME DECOR Store
                        <ArrowRight
                          className="ml-2 h-4 w-4"
                          aria-hidden="true"
                        />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
