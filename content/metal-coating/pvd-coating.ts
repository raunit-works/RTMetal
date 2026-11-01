/**
 * @fileoverview PVD Coating — Principal Service Draft (Development Only)
 * @status draft_unverified
 * @publicationAuthorization false
 *
 * This content is proposed development content only. It is NOT verified client
 * information. Applications listed below are examples of where each finishing
 * method may be relevant, not a confirmed list of work accepted by RTMETALCOATING.
 * Process steps describe typical workflows and must be verified against the
 * client's actual operating process.
 */

export interface PrincipalServiceDraft {
  slug: string;
  name: string;
  shortName: string;
  displayOrder: number;
  shortDescription: string;
  detailedDescription: string;
  features: string[];
  potentialApplications: string[];
  processSteps: Array<{ step: number; title: string; description: string }>;
  imageRequirement: string;
  specialistRelationshipStatus: string;
  clientConfirmationRequirements: string[];
  contentStatus: 'draft_unverified';
  publicationAuthorization: false;
}

export const pvdCoating: PrincipalServiceDraft = {
  slug: 'pvd-coating',
  name: 'PVD Coating',
  shortName: 'PVD',
  displayOrder: 10,
  shortDescription:
    'Thin-film surface finishing for selected decorative components, with an emphasis on appearance, sheen and substrate compatibility.',
  detailedDescription:
    'Physical Vapour Deposition (PVD) is a vacuum-based finishing technique used to deposit thin layers of material onto prepared surfaces. In decorative applications, PVD coating systems can create distinctive metallic appearances while supporting application-specific surface requirements. The final result depends on the substrate, surface preparation, coating composition and intended use. Finish choices and component suitability should be evaluated before processing.',
  features: [
    'Thin-film surface finishing',
    'Decorative metallic appearance options',
    'Surface-preparation and substrate considerations',
    'Application-specific finish selection',
  ],
  potentialApplications: [
    'Selected stainless-steel components',
    'Decorative architectural hardware',
    'Metal fixtures and fittings',
    'Interior metal accents',
    'Custom decorative components',
  ],
  processSteps: [
    {
      step: 1,
      title: 'Requirement review',
      description:
        'Identify the substrate, required appearance and intended use.',
    },
    {
      step: 2,
      title: 'Surface preparation',
      description:
        'Establish the required initial surface condition.',
    },
    {
      step: 3,
      title: 'Coating application',
      description:
        'Apply the specified PVD coating using a suitable process.',
    },
    {
      step: 4,
      title: 'Finish inspection',
      description:
        'Assess the completed appearance against the agreed specification.',
    },
  ],
  imageRequirement:
    'Authentic PVD-finished component showing reflections and surface detail. Client photograph required.',
  specialistRelationshipStatus: 'No existing specialist mapping confirmed.',
  clientConfirmationRequirements: [
    'Confirm RTMETALCOATING offers PVD coating services',
    'Confirm supported substrates and compatible materials',
    'Confirm actual methods and process steps',
    'Confirm available finishes',
    'Confirm genuine service photography',
    'Confirm enquiry destination',
    'Confirm publication authorization',
  ],
  contentStatus: 'draft_unverified',
  publicationAuthorization: false,
};
