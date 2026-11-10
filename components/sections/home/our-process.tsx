// 'use client';

// import { motion } from 'framer-motion';
// import { Reveal } from '@/components/motion/reveal';
// import { SectionHeading } from '@/components/sections/section-heading';
// import { getProcessSteps } from '@/lib/data-access';
// import { resolveIcon } from '@/lib/icons';
// import { Sparkles } from 'lucide-react';

// const processSteps = getProcessSteps();

// export function OurProcess() {
//   return (
//     <section id="process" className="bg-ink py-16 text-white sm:py-20">
//       <div className="mx-auto max-w-7xl px-5 lg:px-10">
//         <SectionHeading
//           eyebrow="How We Work"
//           title={
//             <span className="text-white">
//               A process built on <span className="gold-text">precision.</span>
//             </span>
//           }
//           description="From first conversation to final inspection, every project moves through five considered stages."
//         />

//         <div className="relative mt-16">
//           <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent lg:block" />
//           <div className="grid gap-8 lg:grid-cols-5 lg:gap-4">
//             {processSteps.map((step, i) => {
//               const StepIcon = resolveIcon(step.icon, Sparkles);
//               return (
//                 <Reveal key={step.step} delay={i * 0.1}>
//                   <div className="relative">
//                     <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-ink text-gold">
//                       <StepIcon className="h-6 w-6" />
//                     </div>
//                     <p className="mt-6 text-center text-xs font-medium uppercase tracking-ultra text-gold/70">
//                       Step {step.step}
//                     </p>
//                     <h3 className="mt-2 text-center font-display text-xl font-medium text-white">
//                       {step.title}
//                     </h3>
//                     <p className="mt-3 text-center text-sm leading-relaxed text-white/70">
//                       {step.description}
//                     </p>
//                   </div>
//                 </Reveal>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }












'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';

/**
 * RT METAL — Workshop Process Section
 *
 * The five steps below are proposed website copy.
 * Confirm the operational details with RT METAL before
 * publishing them as an established company procedure.
 *
 * The image path reuses the existing homepage hero asset.
 * Replace it with genuine RT METAL workshop photography
 * when an approved photograph is available.
 */

const WORKSHOP_IMAGE = '/hero-coating-process.jpg';

const processSteps = [
  {
    number: '01',
    title: 'Discuss the Project',
    description:
      'Share your material, dimensions, finish reference and project requirements.',
  },
  {
    number: '02',
    title: 'Confirm the Specification',
    description:
      'Review suitable finishing options and agree on the project scope.',
  },
  {
    number: '03',
    title: 'Surface Preparation',
    description:
      'Prepare the metal according to its condition and the selected finishing process.',
  },
  {
    number: '04',
    title: 'Coating & Finishing',
    description:
      'Carry out the agreed surface treatment or decorative finishing work.',
  },
  {
    number: '05',
    title: 'Inspection & Handover',
    description:
      'Review the completed work against the agreed requirements before handover.',
  },
];

function WorkshopImage() {
  const [imageFailed, setImageFailed] = React.useState(false);

  return (
    <div className="mt-7 sm:mt-8">
      <div
        className="
          relative isolate
          aspect-[4/3] w-full
          overflow-hidden rounded-xl
          bg-[#242321]
          sm:aspect-[16/10]
          lg:aspect-[5/4]
        "
      >
        {!imageFailed ? (
          <Image
            src={WORKSHOP_IMAGE}
            alt="Illustrative photograph of metal finishing work"
            fill
            sizes="
              (max-width: 640px) 100vw,
              (max-width: 1024px) 90vw,
              40vw
            "
            className="
              object-cover object-center
              transition-transform duration-700
              motion-safe:hover:scale-[1.025]
            "
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#242321] px-6 text-center">
            <p className="text-sm text-white/50">
              Workshop photograph unavailable
            </p>
          </div>
        )}

        {/* Restrained gradient for image depth */}
        <div
          className="
            pointer-events-none absolute inset-0
            bg-gradient-to-t
            from-black/50 via-black/10 to-transparent
          "
          aria-hidden="true"
        />

        {/* Small editorial label */}
        <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5">
          <span
            className="
              inline-flex items-center gap-2
              rounded-md border border-white/15
              bg-[#171614]/80
              px-3 py-2
              text-[10px] font-medium
              uppercase tracking-[0.14em]
              text-white/85
              backdrop-blur-sm
            "
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#c9a96e]"
              aria-hidden="true"
            />
            Surface Finishing
          </span>
        </div>
      </div>

      <p
        className="
          mt-3 text-xs leading-relaxed
          text-[#99958e]
        "
      >
        Illustrative workshop imagery.
      </p>
    </div>
  );
}

export function OurProcess() {
  return (
    <section
      id="process"
      className="
        relative overflow-hidden
        bg-[#141413]
        py-12 text-white
        lg:py-16
      "
      aria-labelledby="our-process-heading"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div
          className="
            grid items-start
            gap-10
            lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]
            lg:gap-14
            xl:gap-20
          "
        >
          {/* LEFT — INTRODUCTION & WORKSHOP IMAGE */}
          <div className="min-w-0">
            <Reveal>
              <div>
                {/* Eyebrow */}
                <div className="flex items-center gap-3">
                  <span
                    className="
                      h-px w-7 shrink-0 bg-[#c9a96e]
                    "
                    aria-hidden="true"
                  />

                  <p
                    className="
                      text-[10px] font-semibold
                      uppercase tracking-[0.23em]
                      text-[#c9a96e]
                    "
                  >
                    Our Process
                  </p>
                </div>

                {/* Main heading */}
                <h2
                  id="our-process-heading"
                  className="
                    mt-5 max-w-[520px]
                    font-display font-medium
                    text-[clamp(2.3rem,4vw,3.25rem)]
                    leading-[1.12]
                    tracking-tight
                    text-[#f8f5f0]
                  "
                >
                  From Requirement
                  <br className="hidden sm:block" />
                  {' '}to Finished{' '}
                  <span className="text-[#c9a96e]">
                    Surface.
                  </span>
                </h2>

                {/* Supporting copy */}
                <p
                  className="
                    mt-5 max-w-[420px]
                    text-[15px] leading-[1.75]
                    text-[#b6b4af]
                  "
                >
                  Every project starts with understanding
                  the material, intended application and
                  required finish. Our approach focuses on
                  defining the scope, preparing the surface
                  and reviewing the finished work.
                </p>

                {/* Workshop image */}
                <WorkshopImage />

                {/* CTA */}
                <Link
                  href="/#contact"
                  className="
                    group mt-5 inline-flex
                    items-center gap-2
                    border-b border-[#c9a96e]/60
                    pb-1.5
                    text-xs font-semibold
                    uppercase tracking-[0.13em]
                    text-[#c9a96e]
                    transition-colors duration-200
                    hover:border-white
                    hover:text-white
                    focus-visible:outline
                    focus-visible:outline-2
                    focus-visible:outline-offset-4
                    focus-visible:outline-[#c9a96e]
                  "
                >
                  Discuss Your Project

                  <ArrowUpRight
                    className="
                      h-4 w-4
                      transition-transform duration-200
                      group-hover:-translate-y-0.5
                      group-hover:translate-x-0.5
                    "
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </Reveal>
          </div>

          {/* RIGHT — NUMBERED PROCESS LIST */}
          <div className="min-w-0 lg:pt-2">
            <Reveal direction="right" delay={0.1}>
              <div className="border-t border-white/15">
                {processSteps.map((step) => (
                  <div
                    key={step.number}
                    className="
                      group grid
                      grid-cols-[42px_minmax(0,1fr)]
                      gap-4
                      border-b border-white/15
                      py-5
                      sm:grid-cols-[56px_minmax(0,1fr)]
                      sm:gap-5
                      sm:py-6
                    "
                  >
                    {/* Step number */}
                    <div>
                      <span
                        className="
                          font-display text-[28px]
                          font-medium leading-none
                          tracking-tight
                          text-[#c9a96e]
                          sm:text-[32px]
                        "
                      >
                        {step.number}
                      </span>
                    </div>

                    {/* Step information */}
                    <div className="min-w-0">
                      <h3
                        className="
                          font-display
                          text-[21px] font-medium
                          leading-snug
                          text-[#f8f5f0]
                          sm:text-[24px]
                        "
                      >
                        {step.title}
                      </h3>

                      <p
                        className="
                          mt-2 max-w-[480px]
                          text-[14px] leading-[1.7]
                          text-[#b6b4af]
                        "
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
