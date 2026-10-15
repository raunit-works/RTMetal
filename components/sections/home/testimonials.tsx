'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import type { Testimonial } from '@/lib/types';
import { getTestimonials } from '@/lib/data-access';

interface TestimonialsProps {
  testimonials?: Testimonial[];
}

export function Testimonials({ testimonials: testimonialsProp }: TestimonialsProps) {
  const testimonials = testimonialsProp ?? getTestimonials();

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section id="testimonials" className="bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="Trusted By"
          title="What our clients say."
          description="Architects, designers and commercial buyers who trust RT PU COATING WORKS with their projects."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.1}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-background p-7">
                <Quote className="h-8 w-8 text-gold/30" />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/80">
                  “{t.content}”
                </blockquote>
                <div className="mt-6 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={
                        s < t.rating
                          ? 'h-3.5 w-3.5 fill-gold text-gold'
                          : 'h-3.5 w-3.5 text-muted-foreground'
                      }
                    />
                  ))}
                </div>
                <figcaption className="mt-4 flex items-center gap-3 border-t border-border pt-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
