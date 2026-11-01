/**
 * @fileoverview PU Coating — Principal Service Draft (Development Only)
 * @status draft_unverified
 * @publicationAuthorization false
 *
 * This content is proposed development content only. It is NOT verified client
 * information. Applications listed below are examples of where each finishing
 * method may be relevant, not a confirmed list of work accepted by RTMETALCOATING.
 * Process steps describe typical workflows and must be verified against the
 * client's actual operating process.
 *
 * Working assumption: PU refers to a polyurethane-based liquid coating system.
 * Confirm this with the client, because polyurethane chemistry can also be used
 * in other coating systems.
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

export const puCoating: PrincipalServiceDraft = {
  slug: 'pu-coating',
  name: 'PU Coating',
  shortName: 'PU',
  displayOrder: 30,
  shortDescription:
    'Polyurethane-based surface finishing for suitable components where appearance and protective coating requirements are important.',
  detailedDescription:
    'PU coating refers to a polyurethane-based finishing system that can be selected for decorative and protective applications. Depending on the formulation, PU coatings may offer different levels of gloss, surface texture and environmental resistance. The appropriate coating system depends on the substrate, its preparation, intended use and the required final appearance. Product compatibility and curing requirements should be established for each application.',
  features: [
    'Polyurethane-based surface-finishing systems',
    'Gloss, satin or matte appearance options where supported',
    'Coating-system selection according to substrate',
    'Decorative and protective finish considerations',
  ],
  potentialApplications: [
    'Suitable metal panels and components',
    'Decorative furniture elements',
    'Interior architectural components',
    'Selected fabricated surfaces',
    'Other compatible substrates, if supported by the client\'s coating system',
  ],
  processSteps: [
    {
      step: 1,
      title: 'Substrate evaluation',
      description:
        'Identify material and surface requirements.',
    },
    {
      step: 2,
      title: 'Surface preparation',
      description:
        'Clean, abrade or prime as specified.',
    },
    {
      step: 3,
      title: 'PU coating application',
      description:
        'Apply the chosen coating system according to its technical requirements.',
    },
    {
      step: 4,
      title: 'Curing and inspection',
      description:
        'Allow the coating to cure and review surface appearance.',
    },
  ],
  imageRequirement:
    'Genuine PU-coated panel or component, photographed to show gloss and texture.',
  specialistRelationshipStatus: 'Not confirmed.',
  clientConfirmationRequirements: [
    'Confirm RTMETALCOATING offers PU coating services',
    'Confirm PU refers to polyurethane-based liquid coating system',
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
