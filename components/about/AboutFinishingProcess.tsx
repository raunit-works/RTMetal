import Image from 'next/image';
import {
  Droplets,
  Paintbrush,
  Search,
  SprayCan,
  type LucideIcon,
} from 'lucide-react';

import { Reveal } from '@/components/motion/reveal';
import { aboutMedia } from './about-data';

interface ProcessStage {
  number: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  icon: LucideIcon;
}

const stages: ProcessStage[] = [
  {
    number: '01',
    title: 'Surface Preparation',
    description:
      'Cleaning, treatment and preparation suited to the component, material and finishing requirements.',
    image: aboutMedia.workshop,
    imageAlt: 'Illustrative metal workshop and surface preparation activity',
    icon: Droplets,
  },
  {
    number: '02',
    title: 'Coating Technology',
    description:
      'Application of an appropriate coating process, such as PVD, electroplating, PU or powder coating, where technically suitable.',
    image: aboutMedia.coating,
    imageAlt: 'Illustrative coating application inside a metal finishing workshop',
    icon: SprayCan,
  },
  {
    number: '03',
    title: 'Finishing',
    description:
      'Relevant finishing and appearance-enhancement operations according to the selected treatment.',
    image: aboutMedia.finishingSample,
    imageAlt: 'Illustrative rose gold mirror finish sample',
    icon: Paintbrush,
  },
  {
    number: '04',
    title: 'Final Inspection',
    description:
      'Review of the finished component against agreed visual and quality requirements.',
    image: aboutMedia.inspectionSample,
    imageAlt: 'Illustrative gold matte finish sample used for finish review',
    icon: Search,
  },
];

export function AboutFinishingProcess() {
  return (
    <section
      aria-labelledby="about-process-heading"
      className="bg-charcoal py-14 text-white sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-brass" aria-hidden="true" />
              <p className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-brass-light">
                Our Finishing Process
              </p>
              <span className="h-px w-8 bg-brass" aria-hidden="true" />
            </div>

            <h2
              id="about-process-heading"
              className="mt-5 font-display text-3xl font-medium leading-[1.08] tracking-tight text-ivory sm:text-4xl lg:text-5xl"
            >
              From Preparation to a{' '}
              <span className="italic text-brass-light">
                Refined Finish.
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
              A structured overview of how suitable components move through
              preparation, treatment and quality review.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-5">
          {stages.map((stage, index) => {
            const Icon = stage.icon;

            return (
              <Reveal key={stage.number} delay={index * 0.06}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-charcoal-soft">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={stage.image}
                      alt={stage.imageAlt}
                      fill
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                      className="object-cover object-center transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
                    />

                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
                      aria-hidden="true"
                    />

                    <span className="absolute left-4 top-4 inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-brass/40 bg-black/45 px-2 font-label text-[11px] font-medium tracking-[0.12em] text-brass-light backdrop-blur-sm">
                      {stage.number}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col border-t border-brass/25 p-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brass/10 text-brass-light">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>

                    <h3 className="mt-4 font-display text-xl font-medium leading-snug text-ivory">
                      {stage.title}
                    </h3>

                    <p className="mt-2 text-[13px] leading-6 text-white/65">
                      {stage.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

                <p className="mt-8 text-center text-[11px] leading-5 text-white/60">
          Illustrative process and finish-sample imagery. Exact stages vary by
          component, material and selected coating system.
        </p>
      </div>
    </section>
  );
}
