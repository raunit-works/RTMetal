'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, MessageCircle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { getServices } from '@/lib/data-access';
import { resolveIcon } from '@/lib/icons';
import { getMetalCoatingWhatsAppLink } from '@/lib/site';
import { cn } from '@/lib/utils';

const services = getServices();

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
      {/* Parallax background */}
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute inset-0 opacity-15"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt=""
          className="h-full w-full object-cover"
        />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/60" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">

          {/* ── Left: Heading + Description + CTAs ── */}
          <div className="lg:col-span-4 lg:pr-4">
            <Reveal>
              <p className="mb-4 text-xs font-semibold uppercase tracking-ultra text-gold">
                Division 02 · Surface Finishing
              </p>
              <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Surface Finishing,{' '}
                <span className="gold-text">Done with Precision.</span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
                From metal restoration and electroplating to decorative and
                specialty surface finishes, we work across a range of materials
                and applications, with attention to detail at every stage.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                {/* Button 1 — Primary: warm-white bg, dark text, always visible */}
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white text-ink hover:bg-white/90 font-medium"
                >
                  <a href="/metal-coating">
                    Explore Services
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>

                {/* Button 2 — Secondary: transparent with warm-white text + gold/warm-grey border, always visible */}
                <Button
                  asChild
                  size="lg"
                  className="rounded-full border border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50 font-medium"
                >
                  <a
                    href={getMetalCoatingWhatsAppLink(
                      "Hello RT METALS, I'd like to discuss a surface finishing project."
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Discuss Your Project
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>

          {/* ── Right: 9 image-backed service cards (3×3 grid) ── */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-8 lg:grid-cols-3">
            {services.slice(0, 9).map((svc, i) => {
              const SvcIcon = resolveIcon(svc.icon, Wrench);
              return (
                <Reveal key={svc.slug} delay={i * 0.06}>
                  <a
                    href="/metal-coating"
                    aria-label={`${svc.name} — view service`}
                    className={cn(
                      'group relative flex h-full min-h-[140px] flex-col justify-end overflow-hidden rounded-2xl',
                      'border border-white/10 transition-all duration-500',
                      'hover:border-gold/40 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]',
                      'sm:min-h-[160px]'
                    )}
                  >
                    {/* Background image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={svc.image}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-cover opacity-25 transition-all duration-700 group-hover:opacity-35 group-hover:scale-105"
                    />

                    {/* Overlay — ensures text readability regardless of image brightness */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/60 to-ink/30" />

                    {/* Icon — top-left, subtle */}
                    <div className="absolute left-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/8 backdrop-blur-sm ring-1 ring-white/10">
                      <SvcIcon className="h-3.5 w-3.5 text-gold" />
                    </div>

                    {/* Text content — bottom */}
                    <div className="relative z-10 p-4 pt-10">
                      <h3 className="text-[13px] font-semibold leading-tight text-white">
                        {svc.name}
                      </h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/60 line-clamp-2">
                        {svc.description}
                      </p>
                    </div>
                  </a>
                </Reveal>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
