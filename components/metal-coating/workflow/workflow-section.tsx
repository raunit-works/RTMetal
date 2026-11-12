import {
  ClipboardList,
  Layers,
  MessageCircle,
  Paintbrush,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

interface WorkflowStepData {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
  highlighted?: boolean;
}

const WORKFLOW_STEPS: WorkflowStepData[] = [
  {
    step: '01',
    title: 'Consultation',
    description:
      'We discuss your requirements, material and intended finish to identify the appropriate approach.',
    icon: MessageCircle,
  },
  {
    step: '02',
    title: 'Specification',
    description:
      'We establish the proposed coating, appearance and relevant project requirements.',
    icon: ClipboardList,
  },
  {
    step: '03',
    title: 'Surface Preparation',
    description:
      'Components are prepared using treatment methods appropriate to the material and selected finishing process.',
    icon: Layers,
    highlighted: true,
  },
  {
    step: '04',
    title: 'Application',
    description:
      'The selected coating or finishing process is carried out according to the agreed specifications.',
    icon: Paintbrush,
  },
  {
    step: '05',
    title: 'Quality Inspection',
    description:
      'The finished component is reviewed against the agreed appearance and quality criteria.',
    icon: ShieldCheck,
  },
];

function StepPill({
  step,
  highlighted,
  className,
}: {
  step: string;
  highlighted?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
        highlighted
          ? 'border-[#C18B2F]/40 bg-[#C18B2F]/10 text-[#9A6B1F]'
          : 'border-[#EAE4DA] bg-[#F7F0E3] text-[#8A6A35]',
        className
      )}
    >
      Step {step}
    </span>
  );
}

function IconCircle({
  icon: Icon,
  highlighted,
  className,
}: {
  icon: LucideIcon;
  highlighted?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex h-16 w-16 shrink-0 items-center justify-center rounded-full border transition-colors',
        highlighted
          ? 'border-[#C18B2F] bg-[#C18B2F] text-white ring-4 ring-[#C18B2F]/10'
          : 'border-[#C18B2F]/40 bg-white text-[#B27B25]',
        className
      )}
    >
      <Icon className={cn(highlighted ? 'h-7 w-7' : 'h-6 w-6')} strokeWidth={1.7} aria-hidden="true" />
    </span>
  );
}

export function WorkflowSection() {
  return (
    <section
      id="workflow"
      aria-labelledby="workflow-heading"
      className="scroll-mt-24 bg-white py-8 sm:py-10 lg:py-12"
    >
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-10">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#C18B2F] sm:text-xs">
              Our Workflow
            </p>
            <h2
              id="workflow-heading"
              className="mt-4 font-display text-[clamp(2rem,4.2vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.02em] text-[#171717] [text-wrap:balance]"
            >
              From Requirement to a{' '}
              <span className="italic text-[#C18B2F]">Premium Finish.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#626262] sm:text-base">
              A structured approach to understanding your requirements, preparing
              components, applying the selected finish and inspecting the result.
            </p>
            <div className="mt-7 flex items-center justify-center gap-3" aria-hidden="true">
              <span className="h-px w-12 bg-[#C18B2F]/40" />
              <span className="block h-1.5 w-1.5 rotate-45 border border-[#C18B2F]" />
              <span className="h-px w-12 bg-[#C18B2F]/40" />
            </div>
          </div>
        </Reveal>

        <div className="relative mt-8 hidden lg:mt-10 lg:block">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[10%] right-[10%] top-8 h-px bg-gradient-to-r from-[#C18B2F]/10 via-[#C18B2F]/50 to-[#C18B2F]/10"
          />
          <ol className="relative grid grid-cols-5 items-start gap-4 xl:gap-6">
            {WORKFLOW_STEPS.map((step, index) => {
              const highlighted = Boolean(step.highlighted);
              return (
                <Reveal
                  key={step.step}
                  as="li"
                  delay={index * 0.07}
                  className={cn(
                    'relative flex flex-col items-center text-center',
                    highlighted ? 'px-3 pb-7' : 'pb-1'
                  )}
                >
                  {highlighted && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -top-5 bottom-0 rounded-[22px] border border-[#C18B2F]/40 bg-[#FBF7EF] shadow-[0_18px_44px_rgba(193,139,47,0.12)]"
                    />
                  )}
                  <IconCircle
                    icon={step.icon}
                    highlighted={highlighted}
                    className="relative z-10"
                  />
                  <StepPill
                    step={step.step}
                    highlighted={highlighted}
                    className="relative z-10 mt-5"
                  />
                  <h3
                    className={cn(
                      'relative z-10 mt-2 font-display font-medium leading-snug text-[#171717]',
                      highlighted ? 'text-xl xl:text-[22px]' : 'text-lg xl:text-xl'
                    )}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={cn(
                      'relative z-10 mt-2.5 max-w-[220px] text-[13px] leading-relaxed xl:text-sm',
                      highlighted ? 'text-[#4B463D]' : 'text-[#626262]'
                    )}
                  >
                    {step.description}
                  </p>
                </Reveal>
              );
            })}
          </ol>
        </div>

        <ol className="relative mt-7 lg:hidden">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-4 left-7 top-4 w-px bg-gradient-to-b from-[#C18B2F]/10 via-[#C18B2F]/45 to-[#C18B2F]/10"
          />
          {WORKFLOW_STEPS.map((step, index) => {
            const highlighted = Boolean(step.highlighted);
            const isLast = index === WORKFLOW_STEPS.length - 1;
            return (
              <li
                key={step.step}
                className={cn('relative flex gap-5', !isLast && 'pb-9')}
              >
                <IconCircle
                  icon={step.icon}
                  highlighted={highlighted}
                  className="relative z-10 h-14 w-14"
                />
                <div
                  className={cn(
                    'min-w-0 flex-1',
                    highlighted
                      ? '-mt-3 rounded-2xl border border-[#C18B2F]/40 bg-[#FBF7EF] p-5 shadow-[0_14px_34px_rgba(193,139,47,0.10)]'
                      : 'pt-0.5'
                  )}
                >
                  <StepPill step={step.step} highlighted={highlighted} />
                  <h3 className="mt-2 font-display text-xl font-medium leading-snug text-[#171717]">
                    {step.title}
                  </h3>
                  <p
                    className={cn(
                      'mt-2 text-sm leading-relaxed',
                      highlighted ? 'text-[#4B463D]' : 'text-[#626262]'
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
