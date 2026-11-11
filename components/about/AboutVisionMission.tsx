import { Eye, Target, type LucideIcon } from 'lucide-react';

import { Reveal } from '@/components/motion/reveal';

interface VisionMissionCard {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const cards: VisionMissionCard[] = [
  {
    number: '01',
    title: 'Our Vision',
    description:
      'To become a trusted name in decorative metal finishing and surface coating through innovative finishes, reliable workmanship and customer-focused solutions.',
    icon: Eye,
  },
  {
    number: '02',
    title: 'Our Mission',
    description:
      'To enhance the appearance and functionality of metal products through appropriate surface preparation, coating technologies and customized finishing solutions.',
    icon: Target,
  },
];

export function AboutVisionMission() {
  return (
    <section
      aria-labelledby="about-vision-mission-heading"
      className="bg-ivory py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-5 lg:px-10">
        <h2
          id="about-vision-mission-heading"
          className="sr-only"
        >
          Our Vision and Mission
        </h2>

        <Reveal>
          <div className="mb-7 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-brass/60" aria-hidden="true" />
            <p className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-brass-deep">
              Vision &amp; Mission
            </p>
            <span className="h-px w-8 bg-brass/60" aria-hidden="true" />
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 lg:gap-5">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <Reveal key={card.number} delay={index * 0.08}>
                <article className="flex h-full flex-col rounded-3xl border border-parchment bg-champagne/75 p-7 shadow-[0_18px_45px_-30px_rgba(23,23,23,0.4)] sm:p-9">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brass/25 bg-ivory text-brass-deep">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span
                      className="font-display text-4xl leading-none text-brass/25"
                      aria-hidden="true"
                    >
                      {card.number}
                    </span>
                  </div>

                  <h3 className="mt-8 font-display text-2xl font-medium text-charcoal sm:text-3xl">
                    {card.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-[#5F5A53] sm:text-base">
                    {card.description}
                  </p>

                  <span
                    className="mt-auto block pt-8"
                    aria-hidden="true"
                  >
                    <span className="block h-px w-full bg-brass/15" />
                  </span>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
