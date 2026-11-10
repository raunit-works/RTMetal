import type {
  MetalFinish,
  MetalFinishCardData,
  MetalFinishStatus,
} from '../types';

export const METAL_FINISH_STATUSES: MetalFinishStatus[] = [
  'draft',
  'published',
  'archived',
];

export const DEFAULT_FINISH_APPLICATIONS =
  'Confirm material and intended use on enquiry.';

export const METAL_FINISHES_PUBLIC_CACHE_TAG = 'metal-finishes-public';

export const METAL_FINISH_ADMIN_SELECT =
  'id, finish_code, name, appearance, applications, short_description, main_image_url, additional_images, status, display_order, created_at, updated_at';

export const METAL_FINISH_PUBLIC_SELECT =
  'id, finish_code, name, appearance, applications, main_image_url, display_order';

export interface MetalFinishRow {
  id: string;
  finish_code: string;
  name: string;
  appearance: string | null;
  applications: string | null;
  short_description: string | null;
  main_image_url: string | null;
  additional_images: string[] | null;
  status: string;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface MetalFinishPublicRow {
  id: string;
  finish_code: string;
  name: string;
  appearance: string | null;
  applications: string | null;
  main_image_url: string | null;
  display_order: number | null;
}

/**
 * The public cards derived this label from the finish name before the database
 * existed. Keep the same wording as the fallback so both paths match.
 */
export function getFinishAppearanceLabel(name: string): string {
  const value = name.toLowerCase();

  if (value.includes('hairline')) return 'Hairline appearance';
  if (value.includes('mirror')) return 'Reflective appearance';
  if (value.includes('antique')) return 'Antique appearance';
  if (value.includes('rustic')) return 'Rustic appearance';
  if (value.includes('satin')) return 'Satin appearance';
  if (value.includes('matte')) return 'Matte appearance';
  if (value.includes('brushed')) return 'Brushed appearance';

  return 'Decorative finish reference';
}

export function normalizeMetalFinishStatus(value: unknown): MetalFinishStatus {
  return METAL_FINISH_STATUSES.includes(value as MetalFinishStatus)
    ? (value as MetalFinishStatus)
    : 'draft';
}

export function normalizeFinishCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isMetalFinishCodeValid(value: string): boolean {
  return /^FIN-\d{4,}$/.test(normalizeFinishCode(value));
}

export function isMetalFinishSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  return code === '42P01' || code === 'PGRST204' || code === 'PGRST205';
}

export function sanitizeMetalFinishSearch(value: string): string {
  return value
    .replace(/[%_,()"'\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mapMetalFinishRow(row: MetalFinishRow): MetalFinish {
  return {
    id: row.id,
    finishCode: row.finish_code,
    name: row.name,
    appearance:
      row.appearance?.trim() || getFinishAppearanceLabel(row.name),
    applications:
      row.applications?.trim() || DEFAULT_FINISH_APPLICATIONS,
    shortDescription: row.short_description,
    mainImageUrl: row.main_image_url ?? '',
    additionalImages: Array.isArray(row.additional_images)
      ? row.additional_images.filter(Boolean)
      : [],
    status: normalizeMetalFinishStatus(row.status),
    displayOrder: Number(row.display_order ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCardData(
  id: string,
  finishCode: string,
  name: string,
  appearance: string | null | undefined,
  applications: string | null | undefined,
  mainImageUrl: string,
  displayOrder: number
): MetalFinishCardData {
  return {
    id,
    finId: finishCode,
    displayName: name,
    imagePath: mainImageUrl,
    altText: `${finishCode} ${name} metal finish sample`,
    appearance: appearance?.trim() || getFinishAppearanceLabel(name),
    applications: applications?.trim() || DEFAULT_FINISH_APPLICATIONS,
    displayOrder,
  };
}

export function mapMetalFinishCardRow(
  row: MetalFinishPublicRow
): MetalFinishCardData {
  return toCardData(
    row.id,
    row.finish_code,
    row.name,
    row.appearance,
    row.applications,
    row.main_image_url ?? '',
    Number(row.display_order ?? 0)
  );
}

export function mapMetalFinishToCard(
  finish: MetalFinish
): MetalFinishCardData {
  return toCardData(
    finish.id,
    finish.finishCode,
    finish.name,
    finish.appearance,
    finish.applications,
    finish.mainImageUrl,
    finish.displayOrder
  );
}
