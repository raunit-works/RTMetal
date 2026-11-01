/**
 * @fileoverview Powder Coating — Principal Service Draft (Development Only)
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

export const powderCoating: PrincipalServiceDraft = {
  slug: 'powder-coating',
  name: 'Powder Coating',
  shortName: 'Powder',
  displayOrder: 40,
  shortDescription:
    'Dry-powder surface finishing for suitable components, using coating application and controlled curing.',
  detailedDescription:
    'Powder coating is a dry finishing process commonly used for metal components. Powder particles are typically applied electrostatically to a prepared, grounded part and then cured using heat to form a continuous coating. Depending on the selected powder formulation, it can provide decorative appearance and application-specific protection. The appropriate coating system depends on the material, intended environment, pretreatment and curing requirements.',
  features: [
    'Dry-powder finishing process',
    'Colour and texture selection subject to availability',
    'Application-specific coating formulations',
    'Surface pretreatment and curing considerations',
  ],
  potentialApplications: [
    'Fabricated metal components',
    'Steel or aluminium frames',
    'Metal furniture structures',
    'Railings and architectural fittings',
    'Selected industrial enclosures or hardware',
  ],
  processSteps: [
    {
      step: 1,
      title: 'Surface preparation',
      description:
        'Clean and pretreat the component as required.',
    },
    {
      step: 2,
      title: 'Powder application',
      description:
        'Apply the selected coating powder using the appropriate method.',
    },
    {
      step: 3,
      title: 'Thermal curing',
      description:
        'Cure according to the coating specification.',
    },
    {
      step: 4,
      title: 'Cooling and inspection',
      description:
        'Evaluate the final coated surface.',
    },
  ],
  imageRequirement:
    'Authentic powder-coated frame, panel or fabricated component, ideally showing texture and finish quality.',
  specialistRelationshipStatus: 'Not confirmed.',
  clientConfirmationRequirements: [
    'Confirm RTMETALCOATING offers powder coating services',
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
