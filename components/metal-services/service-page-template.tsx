import type { Category, Service } from '@/lib/types';
import { ServiceHero } from './service-hero';
import { ServiceOverview } from './service-overview';
import { ServiceMaterials } from './service-materials';
import { RelatedMetalCategories } from './related-metal-categories';
import { ServiceEnquiryCTA } from './service-enquiry-cta';

export interface ServicePageTemplateProps {
  service: Service;
  relatedCategories: Category[];
}

/**
 * Shared layout for every individual Metal Service detail page. All content is
 * supplied from the published service record and the existing service-category
 * relationship data.
 */
export function ServicePageTemplate({
  service,
  relatedCategories,
}: ServicePageTemplateProps) {
  return (
    <>
      <ServiceHero service={service} />
      <ServiceOverview service={service} />
      <ServiceMaterials service={service} />
      <RelatedMetalCategories
        serviceName={service.name}
        categories={relatedCategories}
      />
      <ServiceEnquiryCTA service={service} />
    </>
  );
}
