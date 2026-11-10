'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeftRight, ArrowRight, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';

/**
 * RT Metalcoating — homepage comparison section.
 * Keep verifiedTransformation=false until the two photographs are independently
 * verified to document the SAME object before and after actual work.
 * Image files must already exist under /public in the existing Next.js project.
 */
const comparison = {
  beforeImage: '/before-metal-worn.jpeg',
  afterImage: '/after-metal-polished.jpeg',
  verifiedTransformation: false,
};

function BeforeAfterSlider() {
  const [position, setPosition] = React.useState(50);
  const descriptionId = React.useId();
  const beforeLabel = comparison.verifiedTransformation ? 'Before' : 'Worn Surface';
  const afterLabel = comparison.verifiedTransformation ? 'After' : 'Decorative Finish';

  return (
    <div className="min-w-0 w-full">
      <div className="group relative isolate overflow-hidden rounded-[22px] border border-[#d6c4a7] bg-[#211a13] shadow-[0_24px_60px_rgba(59,43,27,0.13)] sm:rounded-[28px]">
        <div className="relative aspect-[5/4] w-full sm:aspect-[16/10] lg:aspect-[1.63/1]">
          {/* Right / decorative-finish image: visible beneath the reveal. */}
          <Image
            src={comparison.afterImage}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 56vw"
            className="pointer-events-none select-none object-cover object-center"
            draggable={false}
          />

          {/* Left / worn-surface image: clipped to the slider position. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            aria-hidden="true"
          >
            <Image
              src={comparison.beforeImage}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 56vw"
              className="select-none object-cover object-center"
              draggable={false}
            />
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/35 to-transparent" />

          <span className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-full bg-[#24211e]/85 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.09em] text-white backdrop-blur-sm sm:bottom-5 sm:left-5 sm:px-4 sm:text-[11px]">
            {beforeLabel}
          </span>
          <span className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-full bg-[#24211e]/85 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.09em] text-white backdrop-blur-sm sm:bottom-5 sm:right-5 sm:px-4 sm:text-[11px]">
            {afterLabel}
          </span>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 z-20 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.25)]"
            style={{ left: `${position}%` }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#efe6d5] bg-white text-[#9d6e24] shadow-[0_6px_18px_rgba(0,0,0,0.20)] sm:h-12 sm:w-12"
            style={{ left: `${position}%` }}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
            <span className="mx-0.5 h-4 w-px bg-[#ddcba8]" />
            <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
          </div>

          {/* Full-frame native range enables touch, mouse, click and keyboard interaction. */}
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={position}
            onChange={(event) => setPosition(Number(event.currentTarget.value))}
            aria-label="Compare worn and decorative metal surfaces"
            aria-describedby={descriptionId}
            aria-valuetext={`${position}% ${beforeLabel.toLowerCase()} visible`}
            className="peer absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0 focus-visible:outline-none touch-none"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-40 rounded-[22px] ring-2 ring-inset ring-[#a77525] opacity-0 transition-opacity peer-focus-visible:opacity-100 sm:rounded-[28px]"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p id={descriptionId} className="flex max-w-[560px] items-start gap-2.5 text-xs italic leading-relaxed text-[#625d56] sm:text-[13px]">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#b47d24]" />
          <span>
            {comparison.verifiedTransformation
              ? 'Compare the original condition with the restored finish of the same component.'
              : 'Finishing'}
          </span>
        </p>
        <span className="inline-flex shrink-0 items-center gap-2.5 self-start text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ad7722] sm:self-auto">
          <span className="hidden h-px w-8 bg-[#b98a40] sm:block" aria-hidden="true" />
          Slide to Compare
          <ArrowLeftRight aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export function BeforeAfterSection() {
  const verified = comparison.verifiedTransformation;

  return (
    <section
      id="before-after"
      aria-label={verified ? 'Before and after metal restoration' : 'Metal surface finishing comparison'}
      className="relative isolate overflow-hidden bg-[#f8f5f0] py-14 sm:py-16 lg:py-[76px]"
    >
      {/* Decorative metallic arcs are CSS-only and cannot intercept interaction. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[270px] -top-[330px] h-[560px] w-[700px] rotate-[-21deg] rounded-[50%] border-[54px] border-[#c7a77e]/[0.12] sm:-left-[320px] sm:-top-[370px]" />
        <div className="absolute -left-[260px] -top-[340px] h-[570px] w-[710px] rotate-[-21deg] rounded-[50%] border border-[#ca9b50]/55 sm:-left-[310px] sm:-top-[380px]" />
        <div className="absolute -bottom-[410px] -left-[300px] h-[530px] w-[980px] rotate-[11deg] rounded-[50%] border-[48px] border-[#bd935d]/[0.12] sm:-bottom-[420px]" />
        <div className="absolute -bottom-[360px] -left-[290px] h-[530px] w-[990px] rotate-[11deg] rounded-[50%] border border-[#bc8a3d]/40" />
        <div className="absolute -bottom-[240px] -right-[280px] h-[340px] w-[730px] rotate-[-12deg] rounded-[50%] border-[32px] border-[#ceb18d]/[0.10]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-10 xl:px-14">
        <div className="grid min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,0.40fr)_minmax(0,0.60fr)] lg:gap-12 xl:gap-16">
          <Reveal>
            <div className="min-w-0 max-w-[565px]">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[#b27619] sm:text-xs">
                  {verified ? 'Restoration / Before & After' : 'Metal Finishing / Visual Comparison'}
                </span>
                <span aria-hidden="true" className="h-px w-10 bg-[#c49753]" />
              </div>

              <h2 className="mt-7 font-display text-[clamp(2.65rem,4.3vw,4.5rem)] font-normal leading-[1.07] tracking-[-0.035em] text-[#171717]">
                {verified ? (
                  <>See the Difference <span className="italic text-[#c38b2b]">in Every Finish.</span></>
                ) : (
                  <>The Difference <span className="block">Is in the <em className="font-normal text-[#c38b2b]">Finish.</em></span></>
                )}
              </h2>

              <p className="mt-7 max-w-[480px] text-[15px] leading-[1.8] text-[#595957] sm:text-[17px]">
                {verified
                  ? 'Explore how surface preparation, refinishing and restoration can transform the appearance of an existing metal component.'
                  : 'From surface preparation to decorative finishing, explore the range of appearances possible with metal coating and restoration services.'}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/metal-coating"
                  className="group inline-flex min-h-12 items-center justify-center gap-4 rounded-full border border-[#d7ab58] bg-gradient-to-b from-[#f7cf77] to-[#dba439] px-6 py-3 text-xs font-bold uppercase tracking-[0.035em] text-[#191713] shadow-[0_7px_17px_rgba(154,111,43,0.14)] transition-[background,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(154,111,43,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a77525] motion-reduce:transform-none sm:px-8 sm:text-sm"
                >
                  Explore Metal Services
                  <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
                </Link>
                <Link
                  href="/before-after"
                  className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-[#c9b28d] px-6 py-3 text-xs font-bold uppercase tracking-[0.035em] text-[#6c4b1f] transition-colors duration-200 hover:border-[#a77525] hover:bg-[#f0e6d5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a77525] sm:px-7 sm:text-sm"
                >
                  View All Transformations
                  <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.1}>
            <BeforeAfterSlider />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
