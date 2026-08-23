'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { services } from '@/lib/data';

export function MetalCoatingShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-ink py-20 text-white sm:py-28"
    >
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute inset-0 opacity-20"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt=""
          className="h-full w-full object-cover"
        />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/40" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="mb-4 text-xs font-medium uppercase tracking-ultra text-gold">
                Division 02 · Metal Coating
              </p>
              <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Finishes that <span className="gold-text">elevate</span> metal.
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/70">
                From brass and MS coating to architectural finishes, our
                workshop delivers premium surface treatments for trade and
                private clients — engineered to perform and crafted to
                impress.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white text-ink hover:bg-white/90"
                >
                  <a href="/metal-coating">
                    Explore Services
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/20 text-white hover:bg-white/10"
                >
                  <a href="/metal-coating#quote">Get a Quote</a>
                </Button>
              </div>
            </Reveal>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-7 lg:grid-cols-3">
            {services.slice(0, 6).map((svc, i) => (
              <Reveal key={svc.slug} delay={i * 0.07}>
                <div className="group h-full rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-500 hover:border-gold/40 hover:bg-white/10">
                  <svc.icon className="h-6 w-6 text-gold" />
                  <h3 className="mt-4 text-sm font-semibold text-white">
                    {svc.shortName}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-foreground/60">
                    {svc.description}
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
