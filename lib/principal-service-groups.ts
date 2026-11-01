export type PrincipalServiceGroupKey =
  | 'pvd-coating'
  | 'electroplating'
  | 'pu-coating'
  | 'powder-coating'
  | 'decorative-metal-finishing'
  | 'metal-restoration-refinishing';

export interface PrincipalServiceGroup {
  key: PrincipalServiceGroupKey;
  name: string;
  slug: string;
  description: string;
  specialistSlugs: string[];
  mappingStatus: 'confirmed' | 'review-needed';
  mappingNotes?: string;
}

export const PRINCIPAL_SERVICE_GROUPS: PrincipalServiceGroup[] = [
  {
    key: 'pvd-coating',
    name: 'PVD Coating',
    slug: 'pvd-coating',
    description:
      'Physical Vapor Deposition coating for durable, decorative metal finishes.',
    specialistSlugs: [],
    mappingStatus: 'review-needed',
    mappingNotes:
      'No existing specialist service record maps to PVD Coating. Client approval required before public exposure.',
  },
  {
    key: 'electroplating',
    name: 'Electroplating',
    slug: 'electroplating',
    description:
      'Metal surface treatments for decorative and functional applications.',
    specialistSlugs: ['electroplating'],
    mappingStatus: 'confirmed',
    mappingNotes:
      'Direct match with the electroplating specialist service record.',
  },
  {
    key: 'pu-coating',
    name: 'PU Coating',
    slug: 'pu-coating',
    description:
      'Polyurethane coating for protective and decorative metal surfaces.',
    specialistSlugs: [],
    mappingStatus: 'review-needed',
    mappingNotes:
      'No existing specialist service record maps to PU Coating. Client approval required before public exposure.',
  },
  {
    key: 'powder-coating',
    name: 'Powder Coating',
    slug: 'powder-coating',
    description:
      'Dry powder coating applied electrostatically and cured under heat.',
    specialistSlugs: [],
    mappingStatus: 'review-needed',
    mappingNotes:
      'No existing specialist service record maps to Powder Coating. Client approval required before public exposure.',
  },
  {
    key: 'decorative-metal-finishing',
    name: 'Decorative Metal Finishing',
    slug: 'decorative-metal-finishing',
    description:
      'Decorative surface finishing for ornamental and display metal pieces.',
    specialistSlugs: [],
    mappingStatus: 'review-needed',
    mappingNotes:
      'Candidate specialist services (murti-finishing, decorative-showpieces, marble-coating) require client review before mapping. Relationships not yet confirmed by source content.',
  },
  {
    key: 'metal-restoration-refinishing',
    name: 'Metal Restoration & Refinishing',
    slug: 'metal-restoration',
    description:
      'Restoration and refinishing for worn or aged metal surfaces.',
    specialistSlugs: ['metal-restoration'],
    mappingStatus: 'confirmed',
    mappingNotes:
      'Direct match with the metal-restoration specialist service record.',
  },
];

export function getPrincipalServiceGroupBySlug(
  slug: string
): PrincipalServiceGroup | undefined {
  return PRINCIPAL_SERVICE_GROUPS.find((g) => g.slug === slug);
}

export function getPrincipalServiceGroupByKey(
  key: PrincipalServiceGroupKey
): PrincipalServiceGroup | undefined {
  return PRINCIPAL_SERVICE_GROUPS.find((g) => g.key === key);
}

export function getConfirmedPrincipalGroups(): PrincipalServiceGroup[] {
  return PRINCIPAL_SERVICE_GROUPS.filter((g) => g.mappingStatus === 'confirmed');
}

export function getReviewNeededPrincipalGroups(): PrincipalServiceGroup[] {
  return PRINCIPAL_SERVICE_GROUPS.filter((g) => g.mappingStatus === 'review-needed');
}

export function getSpecialistToPrincipalMapping(): Record<string, PrincipalServiceGroupKey | null> {
  const mapping: Record<string, PrincipalServiceGroupKey | null> = {};
  for (const group of PRINCIPAL_SERVICE_GROUPS) {
    for (const specialistSlug of group.specialistSlugs) {
      mapping[specialistSlug] = group.key;
    }
  }
  return mapping;
}
