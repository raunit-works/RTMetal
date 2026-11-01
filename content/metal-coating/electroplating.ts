/**
 * @fileoverview Electroplating — Principal Service Draft (Development Only)
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
 * `electroplating`. This draft content is prepared for later comparison and
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

export const electroplating: PrincipalServiceDraft = {
  slug: 'electroplating',
  name: 'Electroplating',
  shortName: 'Electroplating',
  displayOrder: 20,
  shortDescription:
    'Electrochemical metal finishing for components requiring a specified decorative or functional surface layer.',
  detailedDescription:
    'Electroplating is a surface-finishing method in which electrical current is used to deposit a metal layer onto a suitably prepared substrate. Depending on the plating material and application, it can be specified for appearance, corrosion-related requirements or other surface characteristics. The substrate, preparation method, plating metal and final finish should be evaluated to determine the appropriate treatment.',
  features: [
    'Decorative and functional plating applications',
    'Selection of surface appearance and finish requirements',
    'Substrate preparation and compatibility assessment',
    'Plating specification based on component use',
  ],
  potentialApplications: [
    'Metal hardware and fittings',
    'Decorative components',
    'Fixtures and selected architectural accessories',
    'Metal furniture hardware',
    'Components requiring a specified plated surface',
  ],
  processSteps: [
    {
      step: 1,
      title: 'Component assessment',
      description:
        'Review material, condition and finishing requirements.',
    },
    {
      step: 2,
      title: 'Cleaning and preparation',
      description:
        'Prepare the substrate for plating.',
    },
    {
      step: 3,
      title: 'Electroplating',
      description:
        'Deposit the selected metal layer through an appropriate electrochemical process.',
    },
    {
      step: 4,
      title: 'Rinsing and inspection',
      description:
        'Complete post-treatment and assess the finish.',
    },
  ],
  imageRequirement:
    'Genuine plated hardware or a real electroplating project. Replace the current temporary Pexels reference before publication.',
  specialistRelationshipStatus: 'Existing `electroplating` specialist definition.',
  clientConfirmationRequirements: [
    'Confirm RTMETALCOATING offers electroplating services',
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
