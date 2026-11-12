import {
  BadgeCheck,
  Building2,
  Layers,
  Palette,
  RefreshCw,
  SlidersHorizontal,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { Reveal } from '@/components/motion/reveal';

interface Feature {
  title: string;
  icon: LucideIcon;
}

const features: Feature[] = [
  {
    title: 'Multiple Coating Services Under One Company',
    icon: Layers,
  },
  {
    title: 'Wide Selection of Decorative Colours and Finishes',
    icon: Palette,
  },
  {
    title: 'Custom Coating Solutions for Different Applications',
    icon: SlidersHorizontal,
  },
  {
    title: 'Services for New and Existing Components',
    icon: RefreshCw,
  },
  {
    title: 'Decorative Finishes for Architectural and Interior Projects',
    icon: Building2,
  },
  {
    title: 'Restoration and Refinishing of Suitable Metal Products',
    icon: Wrench,
  },
  {
    title: 'Services for Individual and Business Customers',
    icon: Users,
  },
  {
    title: 'Focus on Finish Quality and Customer Requirements',
    icon: BadgeCheck,
  },
];

export function AboutWhyChoose() {
  return (
    <section
      aria-labelledby="about-why-choose-heading"
      className="bg-white py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-brass/60" aria-hidden="true" />
              <p className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-brass-deep">
                Why RTMETALCOATING
              </p>
              <span className="h-px w-8 bg-brass/60" aria-hidden="true" />
            </div>

            <h2
              id="about-why-choose-heading"
              className="mt-5 font-display text-3xl font-medium leading-[1.08] tracking-tight text-charcoal sm:text-4xl lg:text-5xl"
            >
              Why Choose RTMETALCOATING?
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-10 rounded-3xl border border-parchment bg-ivory p-3 shadow-[0_20px_60px_-45px_rgba(23,23,23,0.45)] sm:p-5 lg:p-6">
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-parchment min-[360px]:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="flex h-full flex-col gap-3 bg-ivory p-5 transition-colors duration-300 hover:bg-white sm:p-6"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brass/20 bg-white text-brass-deep">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <h3 className="font-label text-[12px] font-semibold leading-5 text-charcoal sm:text-[13px]">
                      {feature.title}
                    </h3>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
