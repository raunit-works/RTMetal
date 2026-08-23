'use client';

import { motion } from 'framer-motion';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { processSteps } from '@/lib/data';

export function OurProcess() {
  return (
    <section id="process" className="bg-ink py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="How We Work"
          title={
            <span className="text-white">
              A process built on <span className="gold-text">precision.</span>
            </span>
          }
          description="From first conversation to final inspection, every project moves through five considered stages."
        />

        <div className="relative mt-16">
          <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent lg:block" />
          <div className="grid gap-8 lg:grid-cols-5 lg:gap-4">
            {processSteps.map((step, i) => (
              <Reveal key={step.step} delay={i * 0.1}>
                <div className="relative">
                  <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-ink text-gold">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-6 text-center text-xs font-medium uppercase tracking-ultra text-gold/70">
                    Step {step.step}
                  </p>
                  <h3 className="mt-2 text-center font-display text-xl font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-center text-sm leading-relaxed text-foreground/60">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
