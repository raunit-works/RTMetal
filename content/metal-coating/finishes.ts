/**
 * @fileoverview Metal Finishes & Colour Collection — Approved Finish Samples
 * @status approved_for_display
 *
 * Twelve finish samples approved by the client through the RTMETALCOATING
 * finish review package. Display names are the confirmed proposed finish
 * labels carried forward from the client handoff approval data
 * (client-handoff/client-finish-approval.csv). No client-confirmed finish
 * name was recorded separately for any sample, so the proposed visible
 * appearance label is retained as the display label consistent with the
 * user's approval.
 *
 * This module contains display metadata only. It does not assert coating
 * process, substrate compatibility, manufacturing method, durability,
 * availability, or certification for any sample. No sample is automatically
 * associated with PVD, PU, electroplating or powder coating based on colour.
 */

export interface ApprovedFinish {
  readonly finId: string;
  readonly displayName: string;
  readonly imagePath: string;
  readonly altText: string;
  readonly displayOrder: number;
}

export const APPROVED_METAL_FINISHES: ReadonlyArray<ApprovedFinish> = [
  {
    finId: 'FIN-0003',
    displayName: 'Brown Antique',
    imagePath: '/images/metal-coating/finishes/FIN-0003.jpeg',
    altText: 'FIN-0003 Brown Antique metal finish sample',
    displayOrder: 1,
  },
  {
    finId: 'FIN-0004',
    displayName: 'Rustic Iron Finish',
    imagePath: '/images/metal-coating/finishes/FIN-0004.jpeg',
    altText: 'FIN-0004 Rustic Iron Finish metal finish sample',
    displayOrder: 2,
  },
  {
    finId: 'FIN-0013',
    displayName: 'Deep Blue Finish',
    imagePath: '/images/metal-coating/finishes/FIN-0013.jpeg',
    altText: 'FIN-0013 Deep Blue metal finish sample',
    displayOrder: 3,
  },
  {
    finId: 'FIN-0041',
    displayName: 'Rose Gold Hairline',
    imagePath: '/images/metal-coating/finishes/FIN-0041.jpeg',
    altText: 'FIN-0041 Rose Gold Hairline metal finish sample',
    displayOrder: 4,
  },
  {
    finId: 'FIN-0044',
    displayName: 'Rose Gold Mirror',
    imagePath: '/images/metal-coating/finishes/FIN-0044.jpeg',
    altText: 'FIN-0044 Rose Gold Mirror metal finish sample',
    displayOrder: 5,
  },
  {
    finId: 'FIN-0045',
    displayName: 'Graphite Mirror',
    imagePath: '/images/metal-coating/finishes/FIN-0045.jpeg',
    altText: 'FIN-0045 Graphite Mirror metal finish sample',
    displayOrder: 6,
  },
  {
    finId: 'FIN-0046',
    displayName: 'Satin Brass',
    imagePath: '/images/metal-coating/finishes/FIN-0046.jpeg',
    altText: 'FIN-0046 Satin Brass metal finish sample',
    displayOrder: 7,
  },
  {
    finId: 'FIN-0053',
    displayName: 'Gold Mirror',
    imagePath: '/images/metal-coating/finishes/FIN-0053.jpeg',
    altText: 'FIN-0053 Gold Mirror metal finish sample',
    displayOrder: 8,
  },
  {
    finId: 'FIN-0054',
    displayName: 'Graphite Hairline',
    imagePath: '/images/metal-coating/finishes/FIN-0054.jpeg',
    altText: 'FIN-0054 Graphite Hairline metal finish sample',
    displayOrder: 9,
  },
  {
    finId: 'FIN-0058',
    displayName: 'Gold Matte',
    imagePath: '/images/metal-coating/finishes/FIN-0058.jpeg',
    altText: 'FIN-0058 Gold Matte metal finish sample',
    displayOrder: 10,
  },
  {
    finId: 'FIN-0060',
    displayName: 'Champagne Mirror',
    imagePath: '/images/metal-coating/finishes/FIN-0060.jpeg',
    altText: 'FIN-0060 Champagne Mirror metal finish sample',
    displayOrder: 11,
  },
  {
    finId: 'FIN-0063',
    displayName: 'Copper Antique Glossy',
    imagePath: '/images/metal-coating/finishes/FIN-0063.jpeg',
    altText: 'FIN-0063 Copper Antique Glossy metal finish sample',
    displayOrder: 12,
  },
] as const;

export const APPROVED_FINISH_BY_ID: Record<string, ApprovedFinish> =
  Object.fromEntries(
    APPROVED_METAL_FINISHES.map((f) => [f.finId, f])
  ) as Record<string, ApprovedFinish>;

export const APPROVED_FINISH_COUNT = APPROVED_METAL_FINISHES.length;