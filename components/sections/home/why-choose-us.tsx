'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { getWhyChooseUs } from '@/lib/data-access';
import { resolveIcon } from '@/lib/icons';

const whyChooseUs = getWhyChooseUs();

export function WhyChooseUs() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="Why RT PU COATING WORKS"
          title="Considered in every detail."
          description="We hold ourselves to a single standard across both divisions — whether it is a vase on a shelf or a coating on a facade."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyChooseUs.map((item, i) => {
            const ItemIcon = resolveIcon(item.icon, Sparkles);
            return (
              <Reveal key={item.title} delay={i * 0.08}>
                <div className="group h-full rounded-2xl border border-border bg-background p-7 transition-all duration-500 hover:border-gold/40 hover:shadow-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-gold transition-colors duration-500 group-hover:bg-gold group-hover:text-ink">
                    <ItemIcon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-medium">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/about">
              Discover Our Story
              <ArrowRight className="ml-2 h-4 w-4 text-gold-deep" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
