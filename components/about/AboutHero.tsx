import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';

import { Reveal } from '@/components/motion/reveal';
import { Button } from '@/components/ui/button';
import { aboutMedia, coreMetalServices } from './about-data';

const primaryButtonClass =
  'h-12 rounded-full bg-charcoal px-7 text-sm font-semibold text-white hover:bg-charcoal-soft focus-visible:ring-brass-deep focus-visible:ring-offset-ivory';

const secondaryButtonClass =
  'h-12 rounded-full border border-charcoal/20 bg-transparent px-7 text-sm font-semibold text-charcoal hover:border-brass hover:bg-champagne hover:text-charcoal focus-visible:ring-brass-deep focus-visible:ring-offset-ivory';

export function AboutHero() {
  return (
    <section
      aria-labelledby="about-hero-heading"
      className="relative overflow-hidden bg-ivory"
    >
      <div className="grid lg:grid-cols-[46fr_54fr]">
        <div className="relative z-10 min-w-0 px-5 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-32 lg:pb-20 lg:pl-[max(2.5rem,calc((100vw-1360px)/2))] lg:pr-14 lg:pt-[136px]">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-brass" aria-hidden="true" />
              <p className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-brass-deep">
                About RTMETALCOATING
              </p>
            </div>

            <h1
              id="about-hero-heading"
              className="mt-6 max-w-[620px] font-display text-4xl font-medium leading-[1.04] tracking-tight text-charcoal sm:text-5xl lg:text-[3.75rem] xl:text-[4.1rem]"
            >
              Transforming Ordinary Surfaces into{' '}
              <span className="italic text-brass-rich">
                Extraordinary Finishes.
              </span>
            </h1>

            <p className="mt-6 max-w-[540px] text-[15px] leading-7 text-[#5F5A53] sm:text-base">
              RTMETALCOATING is a Mumbai-based metal coating and decorative
              finishing company providing surface finishing solutions for
              residential, commercial, architectural, furniture and industrial
              applications.
            </p>

            <ul
              aria-label="Core metal finishing services"
              className="mt-6 flex max-w-[560px] flex-wrap gap-2"
            >
              {coreMetalServices.map((service) => (
                <li
                  key={service}
                  className="rounded-full border border-parchment bg-white/60 px-3 py-1.5 text-[11px] font-medium text-charcoal/75"
                >
                  {service}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className={primaryButtonClass}>
                <Link href="/metal-coating">
                  Explore Our Services
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className={secondaryButtonClass}
              >
                <Link href="/#contact">
                  Contact Us
                </Link>
              </Button>
            </div>

            <p className="mt-6 flex items-center gap-2 text-xs text-[#6F6961]">
              <MapPin className="h-3.5 w-3.5 text-brass-deep" aria-hidden="true" />
              Mumbai, Maharashtra, India
            </p>
          </Reveal>
        </div>

        <div className="relative min-h-[320px] border-t border-brass/25 sm:min-h-[420px] lg:min-h-[660px] lg:border-t-0">
          <Image
            src={aboutMedia.hero}
            alt="Illustrative brass-finished architectural interior with warm metallic surfaces"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 54vw"
            className="object-cover object-center"
          />

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-20 lg:block"
            aria-hidden="true"
          >
            <svg
              className="h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0 C55,18 55,82 0,100 L0,0 Z"
                className="fill-ivory"
              />
              <path
                d="M0,0 C55,18 55,82 0,100"
                fill="none"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                className="stroke-brass/60"
              />
            </svg>
          </div>

          <div className="absolute bottom-5 left-5 right-5 z-10 rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-white backdrop-blur-sm sm:left-auto sm:max-w-[290px]">
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-brass-light">
              Surface finishing
            </p>
            <p className="mt-1 font-display text-lg leading-snug">
              Metal coatings and decorative finishes, considered from material
              to final surface.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
