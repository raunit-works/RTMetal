import { createSupabaseBrowserClient } from './client';
import { normalizeIdList } from '../service-categories';

export interface ServiceCategoryLinkRow {
  service_id: string;
  category_id: string;
  display_order: number;
}

interface PostgrestLikeError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

const MISSING_SCHEMA_CODES = new Set(['42P01', 'PGRST204', 'PGRST205']);
const MISSING_FUNCTION_CODES = new Set(['42883', 'PGRST202']);

function readError(error: unknown): PostgrestLikeError {
  if (!error || typeof error !== 'object') return {};
  return error as PostgrestLikeError;
}

export function isServiceCategorySchemaUnavailable(error: unknown): boolean {
  const parsed = readError(error);
  if (parsed.code && MISSING_SCHEMA_CODES.has(parsed.code)) return true;

  const text = `${parsed.message ?? ''} ${parsed.details ?? ''}`.toLowerCase();
  return (
    text.includes('service_categories') &&
    (text.includes('could not find') || text.includes('does not exist'))
  );
}

export function isServiceCategoryRpcUnavailable(error: unknown): boolean {
  const parsed = readError(error);
  if (parsed.code && MISSING_FUNCTION_CODES.has(parsed.code)) return true;

  const text = `${parsed.message ?? ''} ${parsed.details ?? ''}`.toLowerCase();
  return (
    text.includes('replace_service_categories') ||
    text.includes('replace_category_services')
  ) && (text.includes('could not find') || text.includes('does not exist'));
}

export function isServiceCategoryConflict(error: unknown): boolean {
  const parsed = readError(error);
  if (parsed.code === '40001') return true;
  return (parsed.message ?? '').toLowerCase().includes('assignments changed');
}

/** Runtime schema probe. Missing relation = feature not migrated yet. */
export async function getServiceCategorySupportAdmin(): Promise<boolean> {
  const { error } = await createSupabaseBrowserClient()
    .from('service_categories')
    .select('service_id')
    .limit(0);

  if (!error) return true;
  if (isServiceCategorySchemaUnavailable(error)) return false;
  throw error;
}

export async function getServiceCategoryLinksAdmin(): Promise<ServiceCategoryLinkRow[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('service_categories')
    .select('service_id, category_id, display_order')
    .order('display_order', { ascending: true })
    .order('category_id', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    service_id: String(row.service_id),
    category_id: String(row.category_id),
    display_order: Number(row.display_order ?? 0),
  }));
}

/** Public read: RLS filters unpublished services/categories automatically. */
export async function getServiceCategoryLinksForService(
  serviceId: string
): Promise<ServiceCategoryLinkRow[]> {
  if (!serviceId) return [];

  const { data, error } = await createSupabaseBrowserClient()
    .from('service_categories')
    .select('service_id, category_id, display_order')
    .eq('service_id', serviceId)
    .order('display_order', { ascending: true })
    .order('category_id', { ascending: true });

  if (error) {
    if (isServiceCategorySchemaUnavailable(error)) return [];
    throw error;
  }

  return (data ?? []).map((row) => ({
    service_id: String(row.service_id),
    category_id: String(row.category_id),
    display_order: Number(row.display_order ?? 0),
  }));
}

export async function getServiceCategoryLinksForCategory(
  categoryId: string
): Promise<ServiceCategoryLinkRow[]> {
  if (!categoryId) return [];

  const { data, error } = await createSupabaseBrowserClient()
    .from('service_categories')
    .select('service_id, category_id, display_order')
    .eq('category_id', categoryId)
    .order('display_order', { ascending: true })
    .order('service_id', { ascending: true });

  if (error) {
    if (isServiceCategorySchemaUnavailable(error)) return [];
    throw error;
  }

  return (data ?? []).map((row) => ({
    service_id: String(row.service_id),
    category_id: String(row.category_id),
    display_order: Number(row.display_order ?? 0),
  }));
}

/**
 * Atomically replace the categories linked to a service.
 * `expectedCategoryIds` is the set shown to the administrator when editing;
 * the database rejects the write if another editor changed it first.
 */
export async function replaceServiceCategoriesAdmin(
  serviceId: string,
  categoryIds: ReadonlyArray<string>,
  expectedCategoryIds: ReadonlyArray<string>
): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc('replace_service_categories', {
    p_service_id: serviceId,
    p_category_ids: normalizeIdList(categoryIds),
    p_expected_category_ids: normalizeIdList(expectedCategoryIds),
  });

  if (error) throw error;
}

/** Atomically replace the services linked to a Metal category. */
export async function replaceCategoryServicesAdmin(
  categoryId: string,
  serviceIds: ReadonlyArray<string>,
  expectedServiceIds: ReadonlyArray<string>
): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc('replace_category_services', {
    p_category_id: categoryId,
    p_service_ids: normalizeIdList(serviceIds),
    p_expected_service_ids: normalizeIdList(expectedServiceIds),
  });

  if (error) throw error;
}

export function getServiceCategoryErrorMessage(error: unknown): string {
  if (isServiceCategoryRpcUnavailable(error)) {
    return 'The service-category save function is not installed. Apply the approved migration before assigning relationships.';
  }
  if (isServiceCategorySchemaUnavailable(error)) {
    return 'The service-category relationship table is not installed. Apply the approved migration before assigning relationships.';
  }
  if (isServiceCategoryConflict(error)) {
    return 'Another administrator changed these assignments. Reload and try again.';
  }

  const parsed = readError(error);
  if (parsed.message) return parsed.message;
  if (error instanceof Error && error.message) return error.message;
  return 'The service-category relationship could not be saved.';
}
