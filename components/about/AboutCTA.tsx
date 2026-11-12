import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Reveal } from '@/components/motion/reveal';
import { Button } from '@/components/ui/button';
import { aboutMedia } from './about-data';

export function AboutCTA() {
  return (
    <section
      aria-labelledby="about-cta-heading"
      className="bg-white px-5 pb-14 pt-2 sm:px-8 sm:pb-16 lg:px-10 lg:pb-20"
    >
      <Reveal>
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-charcoal px-6 py-14 text-center text-white sm:px-10 sm:py-16 lg:py-20">
          <Image
            src={aboutMedia.ctaBackground}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-center opacity-20"
          />

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-charcoal via-charcoal/90 to-charcoal/80"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brass/15 blur-[100px]"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brass/10 blur-[100px]"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-3xl">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-brass" aria-hidden="true" />
              <p className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-brass-light">
                Let&apos;s Work Together
              </p>
              <span className="h-px w-8 bg-brass" aria-hidden="true" />
            </div>

            <h2
              id="about-cta-heading"
              className="mt-5 font-display text-3xl font-medium leading-[1.08] tracking-tight text-ivory sm:text-4xl lg:text-5xl"
            >
              Have a Project or{' '}
              <span className="italic text-brass-light">
                Product Requirement?
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              Get in touch with our team to discuss metal coating, decorative
              finishing or home decor requirements.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 w-full rounded-full bg-ivory px-7 text-sm font-semibold text-charcoal hover:bg-champagne focus-visible:ring-brass-light focus-visible:ring-offset-charcoal sm:w-auto"
              >
                <Link href="/#contact">
                  Contact Us
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-full border-white/30 bg-transparent px-7 text-sm font-semibold text-white hover:border-white/50 hover:bg-white/10 hover:text-white focus-visible:ring-brass-light focus-visible:ring-offset-charcoal sm:w-auto"
              >
                <Link href="/metal-coating">Explore Our Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
