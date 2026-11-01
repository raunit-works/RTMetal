/**
 * @fileoverview Metal Coating — Principal Service Draft Index
 * @status draft_unverified
 * @publicationAuthorization false
 *
 * Aggregates all six principal service drafts for development preview.
 * All content is proposed development content only — NOT verified client
 * information.
 */

import { pvdCoating } from './pvd-coating';
import { electroplating } from './electroplating';
import { puCoating } from './pu-coating';
import { powderCoating } from './powder-coating';
import { decorativeMetalFinishing } from './decorative-metal-finishing';
import { metalRestoration } from './metal-restoration';
import type { PrincipalServiceDraft } from './pvd-coating';

export type { PrincipalServiceDraft } from './pvd-coating';

export const PRINCIPAL_SERVICE_DRAFTS: Record<string, PrincipalServiceDraft> = {
  'pvd-coating': pvdCoating,
  electroplating,
  'pu-coating': puCoating,
  'powder-coating': powderCoating,
  'decorative-metal-finishing': decorativeMetalFinishing,
  'metal-restoration': metalRestoration,
};

export const ALL_PRINCIPAL_SERVICE_DRAFTS: PrincipalServiceDraft[] = [
  pvdCoating,
  electroplating,
  puCoating,
  powderCoating,
  decorativeMetalFinishing,
  metalRestoration,
];
