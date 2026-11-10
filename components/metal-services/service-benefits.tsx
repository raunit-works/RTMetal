import {
  CheckCircle2,
  Layers,
  ShieldCheck,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { ServiceBenefit } from '@/lib/metal-service-content';

interface ServiceBenefitsProps {
  benefits: ServiceBenefit[];
}

function resolveBenefitIcon(title: string): LucideIcon {
  if (/thin|film|layer|coating/i.test(title)) return Layers;
  if (/decor|appearance|colour|color|gloss|finish|sheen/i.test(title)) {
    return Sparkles;
  }
  if (/prepar|substrate|compat|assessment|protection/i.test(title)) {
    return ShieldCheck;
  }
  if (/application|selection|specification|process|system/i.test(title)) {
    return Wrench;
  }
  return CheckCircle2;
}

export function ServiceBenefits({ benefits }: ServiceBenefitsProps) {
  if (benefits.length === 0) return null;

  return (
    <ul className="grid gap-4">
      {benefits.map((benefit) => {
        const Icon = resolveBenefitIcon(benefit.title);

        return (
          <li
            key={benefit.title}
            className="rounded-2xl border border-[#E7E2DA] bg-white p-5 sm:p-6"
          >
            <Icon
              className="h-5 w-5 text-gold-deep"
              aria-hidden="true"
            />
            <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">
              {benefit.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {benefit.description}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
