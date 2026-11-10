import {
  getServiceBenefits,
  getServiceOverviewHeading,
  getServiceOverviewParagraphs,
} from '@/lib/metal-service-content';
import type { Service } from '@/lib/types';
import { ServiceBenefits } from './service-benefits';

interface ServiceOverviewProps {
  service: Service;
}

export function ServiceOverview({ service }: ServiceOverviewProps) {
  const paragraphs = getServiceOverviewParagraphs(service);
  const benefits = getServiceBenefits(service);
  const hasBenefits = benefits.length > 0;

  return (
    <section className="bg-ivory py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <div
          className={
            hasBenefits
              ? 'grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-14'
              : 'max-w-3xl'
          }
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-ultra text-gold-deep">
              Service Overview
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              {getServiceOverviewHeading(service)}
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          {hasBenefits && (
            <div className="min-w-0">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-ultra text-gold-deep">
                Confirmed Capabilities
              </p>
              <ServiceBenefits benefits={benefits} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
