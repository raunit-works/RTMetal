/**
 * @fileoverview Metal Restoration & Refinishing — Principal Service Draft (Development Only)
 * @status draft_unverified
 * @publicationAuthorization false
 *
 * This content is proposed development content only. It is NOT verified client
 * information. Applications listed below are examples of where each finishing
 * method may be relevant, not a confirmed list of work accepted by RTMETALCOATING.
 * Process steps describe typical workflows and must be verified against the
 * client's actual operating process.
 *
 * An existing unpublished staging record exists for this service under slug
 * `metal-restoration`. This draft content is prepared for later comparison and
 * does not replace, overwrite, delete or recreate that record.
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

export const metalRestoration: PrincipalServiceDraft = {
  slug: 'metal-restoration',
  name: 'Metal Restoration & Refinishing',
  shortName: 'Restoration',
  displayOrder: 60,
  shortDescription:
    'Assessment, surface preparation and refinishing of worn or aged metal components.',
  detailedDescription:
    'Metal restoration and refinishing involve evaluating the condition of existing metalwork and selecting appropriate methods to improve its surface appearance. Depending on the material and condition, the work may involve cleaning, removal of degraded surface layers, corrosion treatment, polishing or recoating. The appropriate restoration approach depends on component condition, desired finish and whether original appearance needs preservation.',
  features: [
    'Surface-condition assessment',
    'Cleaning and preparation of existing metalwork',
    'Refinishing options based on material and condition',
    'Appearance review against the agreed restoration objective',
  ],
  potentialApplications: [
    'Metal furniture and fittings',
    'Decorative architectural hardware',
    'Existing metal frames and accessories',
    'Ornamental metal pieces',
    'Worn or aged metal components',
  ],
  processSteps: [
    {
      step: 1,
      title: 'Condition assessment',
      description:
        'Evaluate the metal, existing finish and visible deterioration.',
    },
    {
      step: 2,
      title: 'Surface preparation',
      description:
        'Clean or remove unsuitable surface layers where appropriate.',
    },
    {
      step: 3,
      title: 'Restoration treatment',
      description:
        'Apply the selected repair or refinishing method.',
    },
    {
      step: 4,
      title: 'Final inspection',
      description:
        'Review the appearance and condition of the finished component.',
    },
  ],
  imageRequirement:
    'Genuine before-and-after photography of the same client project, with consistent framing and accurate representation.',
  specialistRelationshipStatus: 'Existing `metal-restoration` specialist definition.',
  clientConfirmationRequirements: [
    'Confirm RTMETALCOATING offers metal restoration & refinishing services',
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
