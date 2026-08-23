'use client';

import { motion } from 'framer-motion';

export function MetallicOrb({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden>
      <motion.div
        animate={{ y: [0, -18, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="relative h-full w-full rounded-full"
        style={{
          background:
            'radial-gradient(circle at 30% 25%, hsl(42 80% 75%) 0%, hsl(38 55% 48%) 35%, hsl(0 0% 12%) 90%)',
          boxShadow:
            '0 40px 80px -20px hsl(38 60% 40% / 0.4), inset -20px -20px 60px hsl(0 0% 0% / 0.5), inset 20px 20px 40px hsl(42 80% 70% / 0.3)',
        }}
      >
        <div
          className="absolute inset-0 rounded-full opacity-40 mix-blend-overlay"
          style={{
            background:
              'radial-gradient(circle at 70% 80%, transparent 40%, hsl(0 0% 0% / 0.4) 100%)',
          }}
        />
      </motion.div>
    </div>
  );
}

export function FloatingRing({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden>
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        className="h-full w-full rounded-full border border-gold/30"
        style={{
          boxShadow:
            '0 0 60px -10px hsl(38 60% 50% / 0.25), inset 0 0 40px hsl(38 60% 50% / 0.1)',
        }}
      >
        <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_20px_hsl(38_60%_50%)]" />
      </motion.div>
    </div>
  );
}

export function GlassShard({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      aria-hidden
      style={{
        background:
          'linear-gradient(135deg, hsl(42 80% 75% / 0.12), hsl(0 0% 100% / 0.04))',
        backdropFilter: 'blur(8px)',
        border: '1px solid hsl(0 0% 100% / 0.1)',
      }}
    />
  );
}
