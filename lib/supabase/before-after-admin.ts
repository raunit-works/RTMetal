import { createSupabaseBrowserClient } from './client';
import {
  BEFORE_AFTER_PROJECT_SELECT,
  isBeforeAfterSchemaMissingError,
  mapBeforeAfterProjectRow,
  sanitizeBeforeAfterSearch,
  type BeforeAfterProjectRow,
} from './before-after-shared';
import type {
  BeforeAfterComparisonType,
  BeforeAfterProject,
  BeforeAfterStatus,
} from '../types';

export type BeforeAfterFeaturedFilter = 'all' | 'featured' | 'not_featured';
export type BeforeAfterSort =
  | 'display_order'
  | 'newest'
  | 'oldest'
  | 'title';

export interface BeforeAfterAdminQuery {
  search?: string;
  serviceId?: string;
  material?: string;
  comparisonType?: 'all' | BeforeAfterComparisonType;
  status?: 'all' | BeforeAfterStatus;
  featured?: BeforeAfterFeaturedFilter;
  dateFrom?: string;
  dateTo?: string;
  sort?: BeforeAfterSort;
  page?: number;
  pageSize?: number;
}

export interface BeforeAfterAdminPage {
  projects: BeforeAfterProject[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface BeforeAfterProjectInput {
  title: string;
  slug: string;
  reference?: string | null;
  short_description?: string | null;
  description?: string | null;
  component_type?: string | null;
  material?: string | null;
  finish_name?: string | null;
  finish_description?: string | null;
  before_image_url?: string | null;
  after_image_url?: string | null;
  additional_images?: string[];
  initial_condition?: string | null;
  treatment_description?: string | null;
  final_description?: string | null;
  features?: string[];
  comparison_type: BeforeAfterComparisonType;
  verification_confirmed: boolean;
  status: BeforeAfterStatus;
  is_featured: boolean;
  display_order: number;
  project_date?: string | null;
  related_category_id?: string | null;
  related_product_id?: string | null;
  service_ids?: string[];
}

const SCHEMA_ERROR_MESSAGE =
  'The Before & After database migration has not been applied. Apply the additive migration before using this module.';

function nullableText(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

function normalizeList(values: string[] | undefined): string[] {
  return Array.from(
    new Set((values ?? []).map((value) => value.trim()).filter(Boolean))
  );
}

function normalizeServiceIds(values: string[] | undefined): string[] {
  return Array.from(new Set((values ?? []).filter(Boolean)));
}

function toWriteRow(input: BeforeAfterProjectInput) {
  return {
    title: input.title.trim(),
    slug: input.slug.trim(),
    reference: nullableText(input.reference),
    short_description: nullableText(input.short_description),
    description: nullableText(input.description),
    component_type: nullableText(input.component_type),
    material: nullableText(input.material),
    finish_name: nullableText(input.finish_name),
    finish_description: nullableText(input.finish_description),
    before_image_url: nullableText(input.before_image_url),
    after_image_url: nullableText(input.after_image_url),
    additional_images: normalizeList(input.additional_images),
    initial_condition: nullableText(input.initial_condition),
    treatment_description: nullableText(input.treatment_description),
    final_description: nullableText(input.final_description),
    features: normalizeList(input.features),
    comparison_type: input.comparison_type,
    verification_confirmed: Boolean(input.verification_confirmed),
    status: input.status,
    is_featured: Boolean(input.is_featured),
    display_order: Number.isFinite(input.display_order) ? input.display_order : 0,
    project_date: input.project_date?.trim() || null,
    related_category_id: input.related_category_id || null,
    related_product_id: input.related_product_id || null,
  };
}

function validateInput(input: BeforeAfterProjectInput) {
  if (!input.title.trim()) throw new Error('A project title is required.');
  if (!input.slug.trim()) throw new Error('A URL slug is required.');
  if (input.status === 'published') {
    if (!input.before_image_url?.trim() || !input.after_image_url?.trim()) {
      throw new Error('Upload both the before and after images before publishing.');
    }
    if (
      input.comparison_type === 'verified' &&
      !input.verification_confirmed
    ) {
      throw new Error(
        'Confirm that both images document the same object before publishing a verified comparison.'
      );
    }
  }
}

function friendlyError(error: unknown): Error {
  if (isBeforeAfterSchemaMissingError(error)) {
    return new Error(SCHEMA_ERROR_MESSAGE);
  }
  if (error && typeof error === 'object') {
    const code = (error as { code?: string }).code;
    if (code === '42883' || code === 'PGRST202') {
      return new Error(
        'The atomic Before & After save function is not installed. Apply the approved additive migration before saving.'
      );
    }
    if (code === '23505') {
      return new Error('That URL slug is already used by another transformation.');
    }
    if (code === '23503') {
      return new Error(
        'A selected service, category, product or project no longer exists. Refresh the list and try again.'
      );
    }
    if (code === '23514') {
      return new Error(
        'Published records require both images, and verified records require the confirmation checkbox.'
      );
    }
    if (code === '22007' || code === '22008' || code === '22P02') {
      return new Error('The project date or a selected record is not valid.');
    }
    const message = (error as { message?: string }).message;
    if (message) return new Error(message);
  }
  return new Error('The Before & After request could not be completed.');
}

async function requireSchema() {
  const supported = await getBeforeAfterSupportAdmin();
  if (!supported) throw new Error(SCHEMA_ERROR_MESSAGE);
}

export async function getBeforeAfterSupportAdmin(): Promise<boolean> {
  const { error } = await createSupabaseBrowserClient()
    .from('before_after_projects')
    .select('id')
    .limit(0);

  if (!error) return true;
  if (isBeforeAfterSchemaMissingError(error)) return false;
  throw error;
}

export async function getBeforeAfterCountAdmin(): Promise<number> {
  const { error, count } = await createSupabaseBrowserClient()
    .from('before_after_projects')
    .select('id', { count: 'exact', head: true });

  if (error) {
    if (isBeforeAfterSchemaMissingError(error)) return 0;
    throw error;
  }
  return count ?? 0;
}

export async function getBeforeAfterMaterialsAdmin(): Promise<string[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('before_after_projects')
    .select('material')
    .not('material', 'is', null);

  if (error) {
    if (isBeforeAfterSchemaMissingError(error)) return [];
    throw error;
  }

  return Array.from(
    new Set(
      (data ?? [])
        .map((row) => row.material?.trim())
        .filter((material): material is string => Boolean(material))
    )
  ).sort((a, b) => a.localeCompare(b));
}

async function getProjectIdsForService(serviceId: string): Promise<string[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('before_after_project_services')
    .select('project_id')
    .eq('service_id', serviceId);

  if (error) {
    if (isBeforeAfterSchemaMissingError(error)) throw new Error(SCHEMA_ERROR_MESSAGE);
    throw error;
  }

  return Array.from(
    new Set((data ?? []).map((link) => link.project_id).filter(Boolean))
  );
}

async function getProjectIdsMatchingServiceSearch(query: string): Promise<string[]> {
  if (!query) return [];
  const supabase = createSupabaseBrowserClient();
  const { data: services, error: serviceError } = await supabase
    .from('services')
    .select('id')
    .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
    .limit(100);

  if (serviceError) throw serviceError;
  if (!services?.length) return [];

  const { data: links, error: linkError } = await supabase
    .from('before_after_project_services')
    .select('project_id')
    .in('service_id', services.map((service) => service.id));

  if (linkError) {
    if (isBeforeAfterSchemaMissingError(linkError)) throw new Error(SCHEMA_ERROR_MESSAGE);
    throw linkError;
  }

  return Array.from(
    new Set((links ?? []).map((link) => link.project_id).filter(Boolean))
  );
}

export async function getBeforeAfterProjectsAdminPage(
  filters: BeforeAfterAdminQuery = {}
): Promise<BeforeAfterAdminPage> {
  const pageSize = Math.min(50, Math.max(1, Math.floor(filters.pageSize ?? 8)));
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const offset = (page - 1) * pageSize;
  const queryText = sanitizeBeforeAfterSearch(filters.search ?? '');

  try {
    await requireSchema();
    const supabase = createSupabaseBrowserClient();

    let serviceProjectIds: string[] | null = null;
    if (filters.serviceId) {
      serviceProjectIds = await getProjectIdsForService(filters.serviceId);
      if (serviceProjectIds.length === 0) {
        return { projects: [], total: 0, page, pageSize, pageCount: 1 };
      }
    }

    let searchServiceProjectIds: string[] = [];
    if (queryText) {
      searchServiceProjectIds = await getProjectIdsMatchingServiceSearch(queryText);
    }

    let query = supabase
      .from('before_after_projects')
      .select(BEFORE_AFTER_PROJECT_SELECT, { count: 'exact' });

    if (serviceProjectIds) {
      query = query.in('id', serviceProjectIds);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.comparisonType && filters.comparisonType !== 'all') {
      query = query.eq('comparison_type', filters.comparisonType);
    }
    if (filters.material) {
      query = query.eq('material', filters.material);
    }
    if (filters.featured === 'featured') {
      query = query.eq('is_featured', true);
    } else if (filters.featured === 'not_featured') {
      query = query.eq('is_featured', false);
    }
    if (filters.dateFrom) {
      query = query.gte('project_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('project_date', filters.dateTo);
    }

    if (queryText) {
      const clauses = [
        `title.ilike.%${queryText}%`,
        `reference.ilike.%${queryText}%`,
        `short_description.ilike.%${queryText}%`,
        `description.ilike.%${queryText}%`,
        `component_type.ilike.%${queryText}%`,
        `material.ilike.%${queryText}%`,
        `finish_name.ilike.%${queryText}%`,
        `finish_description.ilike.%${queryText}%`,
      ];
      if (searchServiceProjectIds.length > 0) {
        clauses.push(`id.in.(${searchServiceProjectIds.join(',')})`);
      }
      query = query.or(clauses.join(','));
    }

    switch (filters.sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'title':
        query = query.order('title', { ascending: true });
        break;
      case 'display_order':
      default:
        query = query
          .order('is_featured', { ascending: false })
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });
        break;
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    const total = count ?? 0;
    return {
      projects: ((data ?? []) as unknown as BeforeAfterProjectRow[]).map(
        mapBeforeAfterProjectRow
      ),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch (error) {
    throw friendlyError(error);
  }
}

async function saveProjectAtomically(
  projectId: string | null,
  input: BeforeAfterProjectInput
): Promise<string> {
  validateInput(input);
  await requireSchema();

  const { data, error } = await createSupabaseBrowserClient().rpc(
    'save_before_after_project',
    {
      p_project_id: projectId,
      p_project: toWriteRow(input),
      p_service_ids: normalizeServiceIds(input.service_ids),
    }
  );

  if (error) throw friendlyError(error);
  if (!data || typeof data !== 'string') {
    throw new Error('The transformation was saved but no project identifier was returned.');
  }
  return data;
}

export async function createBeforeAfterProjectAdmin(
  input: BeforeAfterProjectInput
): Promise<string> {
  return saveProjectAtomically(null, input);
}

export async function updateBeforeAfterProjectAdmin(
  id: string,
  input: BeforeAfterProjectInput
): Promise<void> {
  await saveProjectAtomically(id, input);
}

export async function updateBeforeAfterStatusAdmin(
  id: string,
  status: BeforeAfterStatus
): Promise<void> {
  await requireSchema();
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('before_after_projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw friendlyError(error);
}

export async function deleteBeforeAfterProjectAdmin(id: string): Promise<void> {
  await requireSchema();
  const { error } = await createSupabaseBrowserClient()
    .from('before_after_projects')
    .delete()
    .eq('id', id);
  if (error) throw friendlyError(error);
}
