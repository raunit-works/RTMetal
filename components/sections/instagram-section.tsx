'use client';

import { motion } from 'framer-motion';
import { Instagram, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { INSTAGRAM_URL } from '@/lib/site';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import type { InstagramPost } from '@/lib/types';

export function InstagramSection({
  posts,
  title = 'Follow the Craft',
  eyebrow = 'On Instagram',
  description = 'A glimpse into our workshop, recent work and new arrivals — captured in motion.',
}: {
  posts: InstagramPost[];
  title?: string;
  eyebrow?: string;
  description?: string;
}) {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 0.06}>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-2xl bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.image}
                  alt={post.caption}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-90" />
                <div className="absolute left-3 top-3 flex items-center gap-1.5">
                  {post.type === 'reel' ? (
                    <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                      <Play className="h-2.5 w-2.5 fill-white" /> Reel
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                      {post.category}
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-xs font-medium leading-snug text-white">
                    {post.caption}
                  </p>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <Instagram className="mr-2 h-4 w-4" />
              View More on Instagram
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
