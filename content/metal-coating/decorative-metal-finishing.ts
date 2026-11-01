/**
 * @fileoverview Decorative Metal Finishing — Principal Service Draft (Development Only)
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

export const decorativeMetalFinishing: PrincipalServiceDraft = {
  slug: 'decorative-metal-finishing',
  name: 'Decorative Metal Finishing',
  shortName: 'Decorative Finishing',
  displayOrder: 50,
  shortDescription:
    'Appearance-focused metal surface treatments for decorative, architectural and interior applications.',
  detailedDescription:
    'Decorative metal finishing focuses on the visual characteristics of metal surfaces, including colour, reflectivity, texture and overall appearance. Depending on the base material and selected treatment, finishes may involve polishing, brushing, surface colouring, antiquing or other appropriate techniques. The suitable process should be selected according to the material, desired appearance, application and maintenance requirements.',
  features: [
    'Appearance-led metal finishing',
    'Polished, brushed or textured finish considerations',
    'Decorative colour and surface-effect options',
    'Finish selection for architectural and interior elements',
  ],
  potentialApplications: [
    'Decorative wall features',
    'Metal partitions and screens',
    'Furniture accents and metal bases',
    'Architectural trims and borders',
    'Decorative hardware',
    'Metal sculptures and display pieces',
  ],
  processSteps: [
    {
      step: 1,
      title: 'Finish consultation',
      description:
        'Review material, surface sample and desired appearance.',
    },
    {
      step: 2,
      title: 'Surface preparation',
      description:
        'Prepare the component according to the intended finish.',
    },
    {
      step: 3,
      title: 'Decorative treatment',
      description:
        'Apply the agreed surface-finishing technique.',
    },
    {
      step: 4,
      title: 'Appearance review',
      description:
        'Compare the result with the approved finish reference.',
    },
  ],
  imageRequirement:
    'Genuine finish-sample photography, including client-approved polished, antique, coloured or textured metal examples.',
  specialistRelationshipStatus:
    'Potential specialist relationships — unconfirmed. Candidates: murti-finishing, decorative-showpieces, marble-coating. Do not assume marble is a metal-finishing subservice.',
  clientConfirmationRequirements: [
    'Confirm RTMETALCOATING offers decorative metal finishing services',
    'Confirm actual methods and process steps',
    'Confirm available finishes',
    'Confirm specialist mappings (murti-finishing, decorative-showpieces, marble-coating)',
    'Confirm genuine service photography',
    'Confirm enquiry destination',
    'Confirm publication authorization',
  ],
  contentStatus: 'draft_unverified',
  publicationAuthorization: false,
};
