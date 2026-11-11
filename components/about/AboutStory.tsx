import { Reveal } from '@/components/motion/reveal';

export function AboutStory() {
  return (
    <section
      aria-labelledby="about-story-heading"
      className="bg-white py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_1px_minmax(0,1.15fr)] lg:gap-12">
          <Reveal>
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-brass" aria-hidden="true" />
                <p className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-brass-deep">
                  Our Story
                </p>
              </div>

              <h2
                id="about-story-heading"
                className="mt-5 font-display text-3xl font-medium leading-[1.08] tracking-tight text-charcoal sm:text-4xl lg:text-[2.9rem]"
              >
                About RTMETALCOATING.
              </h2>

              <span
                className="mt-7 block h-px w-16 bg-parchment"
                aria-hidden="true"
              />
            </div>
          </Reveal>

          <div
            className="hidden bg-parchment lg:block"
            aria-hidden="true"
          />

          <Reveal delay={0.08}>
            <div className="max-w-[640px] space-y-5">
              <p className="text-base leading-7 text-charcoal/80 sm:text-lg sm:leading-8">
                RTMETALCOATING provides metal coating, surface treatment and
                decorative finishing solutions for architectural, interior,
                furniture and industrial applications.
              </p>

              <p className="text-sm leading-7 text-[#626262] sm:text-base">
                We work with architects, interior designers, builders, furniture
                manufacturers, fabrication companies, retailers and individual
                customers seeking customized metal finishes.
              </p>

              <p className="rounded-r-2xl border-l-2 border-brass bg-ivory-soft px-5 py-4 text-sm leading-7 text-[#5F5A53] sm:text-base">
                The selected treatment depends on the substrate, intended
                application, desired appearance and technical suitability.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
