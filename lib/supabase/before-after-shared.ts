import type {
  BeforeAfterComparisonType,
  BeforeAfterProject,
  BeforeAfterProjectLink,
  BeforeAfterServiceRef,
  BeforeAfterStatus,
} from '../types';

export interface BeforeAfterServiceEmbed {
  id: string;
  name: string;
  slug: string;
}

export interface BeforeAfterLinkEmbed {
  id: string;
  name: string;
  slug: string;
}

export interface BeforeAfterServiceLinkRow {
  project_id?: string;
  display_order: number | null;
  services: BeforeAfterServiceEmbed | BeforeAfterServiceEmbed[] | null;
}

export interface BeforeAfterProjectRow {
  id: string;
  title: string;
  slug: string;
  reference: string | null;
  short_description: string | null;
  description: string | null;
  component_type: string | null;
  material: string | null;
  finish_name: string | null;
  finish_description: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  additional_images: string[] | null;
  initial_condition: string | null;
  treatment_description: string | null;
  final_description: string | null;
  features: string[] | null;
  comparison_type: string;
  verification_confirmed: boolean | null;
  status: string;
  is_featured: boolean | null;
  display_order: number | null;
  project_date: string | null;
  related_category_id: string | null;
  related_product_id: string | null;
  created_at: string;
  updated_at: string;
  before_after_project_services?: BeforeAfterServiceLinkRow[] | null;
  categories?: BeforeAfterLinkEmbed | BeforeAfterLinkEmbed[] | null;
  products?: BeforeAfterLinkEmbed | BeforeAfterLinkEmbed[] | null;
}

export const BEFORE_AFTER_PROJECT_SELECT =
  '*, before_after_project_services(display_order, services(id, name, slug)), categories(id, name, slug), products(id, name, slug)';

export const BEFORE_AFTER_STATUSES: BeforeAfterStatus[] = [
  'draft',
  'published',
  'archived',
];

export const BEFORE_AFTER_COMPARISON_TYPES: BeforeAfterComparisonType[] = [
  'verified',
  'illustrative',
];

export const BEFORE_AFTER_MATERIAL_OPTIONS = [
  'Mild Steel',
  'Stainless Steel',
  'Brass',
  'Copper',
  'Aluminium',
  'Cast Iron',
  'Wrought Iron',
  'Zinc',
  'Bronze',
  'Other',
];

export function normalizeBeforeAfterStatus(value: unknown): BeforeAfterStatus {
  return BEFORE_AFTER_STATUSES.includes(value as BeforeAfterStatus)
    ? (value as BeforeAfterStatus)
    : 'draft';
}

export function normalizeBeforeAfterComparisonType(
  value: unknown
): BeforeAfterComparisonType {
  return BEFORE_AFTER_COMPARISON_TYPES.includes(value as BeforeAfterComparisonType)
    ? (value as BeforeAfterComparisonType)
    : 'illustrative';
}

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapLink(
  value: BeforeAfterLinkEmbed | BeforeAfterLinkEmbed[] | null | undefined
): BeforeAfterProjectLink | null {
  const link = firstEmbed(value);
  if (!link?.id || !link.slug || !link.name) return null;
  return { id: link.id, name: link.name, slug: link.slug };
}

function mapServices(
  links: BeforeAfterServiceLinkRow[] | null | undefined
): BeforeAfterServiceRef[] {
  if (!links?.length) return [];

  const seen = new Set<string>();
  const mapped: Array<BeforeAfterServiceRef | null> = links.map((link) => {
    const service = firstEmbed(link.services);
    if (!service?.id || seen.has(service.id)) return null;
    seen.add(service.id);
    return {
      id: service.id,
      name: service.name,
      slug: service.slug,
      displayOrder: Number(link.display_order ?? 0),
    };
  });

  return mapped
    .filter((service): service is BeforeAfterServiceRef => Boolean(service))
    .sort((a, b) => {
      if ((a.displayOrder ?? 0) !== (b.displayOrder ?? 0)) {
        return Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0);
      }
      return a.name.localeCompare(b.name);
    });
}

export function mapBeforeAfterProjectRow(
  row: BeforeAfterProjectRow
): BeforeAfterProject {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    reference: row.reference,
    shortDescription: row.short_description,
    description: row.description,
    componentType: row.component_type,
    material: row.material,
    finishName: row.finish_name,
    finishDescription: row.finish_description,
    beforeImageUrl: row.before_image_url,
    afterImageUrl: row.after_image_url,
    additionalImages: Array.isArray(row.additional_images)
      ? row.additional_images.filter(Boolean)
      : [],
    initialCondition: row.initial_condition,
    treatmentDescription: row.treatment_description,
    finalDescription: row.final_description,
    features: Array.isArray(row.features) ? row.features.filter(Boolean) : [],
    comparisonType: normalizeBeforeAfterComparisonType(row.comparison_type),
    verificationConfirmed: Boolean(row.verification_confirmed),
    status: normalizeBeforeAfterStatus(row.status),
    isFeatured: Boolean(row.is_featured),
    displayOrder: Number(row.display_order ?? 0),
    projectDate: row.project_date,
    relatedCategoryId: row.related_category_id,
    relatedProductId: row.related_product_id,
    relatedCategory: mapLink(row.categories),
    relatedProduct: mapLink(row.products),
    services: mapServices(row.before_after_project_services),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isBeforeAfterSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  return code === '42P01' || code === 'PGRST204' || code === 'PGRST205';
}

export function sanitizeBeforeAfterSearch(value: string): string {
  return value
    .replace(/[%_,()"'\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugifyBeforeAfterTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
