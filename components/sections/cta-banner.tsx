'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CtaBanner({
  eyebrow,
  title,
  description,
  primary,
  secondary,
  variant = 'dark',
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  primary: { label: string; href: string; icon?: React.ReactNode };
  secondary?: { label: string; href: string; icon?: React.ReactNode };
  variant?: 'dark' | 'light';
}) {
  const dark = variant === 'dark';
  return (
    <section className="px-5 py-12 lg:px-10 lg:py-16">
      <div
        className={cn(
          'relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-24',
          dark ? 'bg-ink text-white' : 'bg-muted text-foreground'
        )}
      >
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gold/15 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-gold/10 blur-[100px]" />

        <div className="relative">
          {eyebrow && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-4 text-xs font-medium uppercase tracking-ultra text-gold"
            >
              {eyebrow}
            </motion.p>
          )}
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            {title}
          </motion.h2>
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className={cn(
                'mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg',
                dark ? 'text-foreground/70' : 'text-muted-foreground'
              )}
            >
              {description}
            </motion.p>
          )}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          >
            <Button
              asChild
              size="lg"
              className={cn(
                'rounded-full px-7',
                dark
                  ? 'bg-white text-ink hover:bg-white/90'
                  : 'bg-ink text-white hover:bg-ink/90'
              )}
            >
              <a href={primary.href}>
                {primary.icon}
                {primary.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            {secondary && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className={cn(
                  'rounded-full px-7',
                  dark
                    ? 'border-white/20 text-white hover:bg-white/10'
                    : 'border-foreground/20'
                )}
              >
                <a href={secondary.href}>
                  {secondary.icon}
                  {secondary.label}
                </a>
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
