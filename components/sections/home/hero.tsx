'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetallicOrb, FloatingRing } from '@/components/decorative/3d-elements';

export function Hero() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.3], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-background pt-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[120vh] w-[120vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_hsl(0_0%_96%)_0%,_transparent_60%)]" />
        <FloatingRing className="left-[8%] top-[18%] h-40 w-40 lg:h-64 lg:w-64" />
        <MetallicOrb className="right-[10%] top-[22%] h-28 w-28 lg:h-44 lg:w-44" />
        <div className="absolute bottom-[12%] left-[18%] h-24 w-24 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent backdrop-blur-sm lg:h-36 lg:w-36" />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 mx-auto max-w-5xl px-5 text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 text-xs font-medium uppercase tracking-ultra text-gold-deep sm:text-sm"
        >
          Home Decor · Lifestyle · Premium Metal Coating
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="font-display text-5xl font-medium leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl"
        >
          The art of
          <br />
          <span className="gold-text">refined</span> living.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          A luxury house of considered home decor and premium metal coating —
          crafted for architects, designers and those who notice the details.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
        >
          <Button asChild size="lg" className="rounded-full px-7">
            <Link href="/home-decor">
              Explore Collection
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full px-7"
          >
            <Link href="/metal-coating">Metal Coating Services</Link>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 text-xs text-muted-foreground"
        >
          <span className="uppercase tracking-ultra">Scroll</span>
          <ArrowDown className="h-4 w-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
