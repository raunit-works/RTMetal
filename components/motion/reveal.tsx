'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import * as React from 'react';

const easeOut = [0.22, 1, 0.36, 1] as const;

export function useReveal() {
  const reduce = useReducedMotion();
  return React.useMemo(
    () => ({
      initial: { opacity: 0, y: reduce ? 0 : 28 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: '-80px' },
      transition: { duration: 0.8, ease: easeOut },
    }),
    [reduce]
  );
}

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
  as?: 'div' | 'span' | 'section' | 'li' | 'article';
}) {
  const reduce = useReducedMotion();
  const offset = reduce ? 0 : 32;
  const initial: Record<string, number> = { opacity: 0 };
  if (direction === 'up') initial.y = offset;
  if (direction === 'down') initial.y = -offset;
  if (direction === 'left') initial.x = offset;
  if (direction === 'right') initial.x = -offset;

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: easeOut, delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
};

export function StaggerGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className} id={id}>
      {children}
    </motion.div>
  );
}

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: easeOut, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
