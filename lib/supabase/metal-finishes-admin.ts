import { createSupabaseBrowserClient } from './client';
import type { MetalFinish, MetalFinishStatus } from '../types';
import {
  METAL_FINISH_ADMIN_SELECT,
  isMetalFinishCodeValid,
  isMetalFinishSchemaMissingError,
  mapMetalFinishRow,
  normalizeFinishCode,
  sanitizeMetalFinishSearch,
  type MetalFinishRow,
} from './metal-finishes-shared';

export type MetalFinishSort = 'display_order' | 'name';
export type MetalFinishStatusFilter = 'all' | MetalFinishStatus;
export type MetalFinishOrderDirection = 'up' | 'down';

export interface MetalFinishAdminQuery {
  search?: string;
  status?: MetalFinishStatusFilter;
  sort?: MetalFinishSort;
  page?: number;
  pageSize?: number;
}

export interface MetalFinishAdminPage {
  finishes: MetalFinish[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface MetalFinishCounts {
  total: number;
  published: number;
  draft: number;
  missingImage: number;
}

export interface MetalFinishInput {
  finish_code?: string | null;
  name: string;
  appearance: string;
  applications: string;
  short_description?: string | null;
  main_image_url?: string | null;
  additional_images?: string[];
  status: MetalFinishStatus;
  display_order?: number;
}

const SCHEMA_ERROR_MESSAGE =
  'The Metal Finishes database migration has not been applied. Apply the approved additive migration before using this module.';

const REORDER_FUNCTION_MISSING_MESSAGE =
  'The atomic Metal Finish reorder function is not installed. Apply the approved additive reorder migration, then try again.';

const PUBLIC_CACHE_REVALIDATE_PATH = '/api/admin/metal-finishes/revalidate';

const EMPTY_COUNTS: MetalFinishCounts = {
  total: 0,
  published: 0,
  draft: 0,
  missingImage: 0,
};

function nullableText(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

function normalizeList(values: string[] | undefined): string[] {
  return Array.from(
    new Set((values ?? []).map((value) => value.trim()).filter(Boolean))
  );
}

function friendlyError(error: unknown): Error {
  if (isMetalFinishSchemaMissingError(error)) {
    return new Error(SCHEMA_ERROR_MESSAGE);
  }
  if (error && typeof error === 'object') {
    const code = (error as { code?: string }).code;
    if (code === '23505') {
      return new Error('That finish code is already used by another finish.');
    }
    if (code === '23514') {
      return new Error(
        'A published finish needs a main image. Check the required fields and try again.'
      );
    }
    if (code === '23502') {
      return new Error('A finish name is required.');
    }
    if (code === '42883' || code === 'PGRST202') {
      return new Error(REORDER_FUNCTION_MISSING_MESSAGE);
    }
    if (code === '42501') {
      return new Error('Administrator access is required for this action.');
    }
    if (code === '22023') {
      return new Error('The requested reorder direction is invalid.');
    }
    const message = (error as { message?: string }).message;
    if (message) return new Error(message);
  }
  return new Error('The Metal Finishes request could not be completed.');
}

function validateInput(input: MetalFinishInput) {
  if (!input.name.trim()) throw new Error('A finish name is required.');

  if (input.finish_code?.trim() && !isMetalFinishCodeValid(input.finish_code)) {
    throw new Error('Finish codes must use the FIN-XXXX format, for example FIN-0066.');
  }

  if (input.status === 'published') {
    if (!input.main_image_url?.trim()) {
      throw new Error('Upload a main finish image before publishing.');
    }
    if (!input.appearance.trim()) {
      throw new Error('An appearance description is required before publishing.');
    }
    if (!input.applications.trim()) {
      throw new Error('An applications description is required before publishing.');
    }
  }
}

function toWriteRow(input: MetalFinishInput, includeCode: boolean) {
  const row: Record<string, unknown> = {
    name: input.name.trim(),
    appearance: nullableText(input.appearance),
    applications: nullableText(input.applications),
    short_description: nullableText(input.short_description),
    main_image_url: nullableText(input.main_image_url),
    additional_images: normalizeList(input.additional_images),
    status: input.status,
    display_order: Number.isFinite(input.display_order)
      ? Math.max(0, Math.floor(input.display_order as number))
      : 0,
  };

  if (includeCode) {
    row.finish_code = normalizeFinishCode(input.finish_code ?? '');
  }

  return row;
}

async function requireSchema() {
  const supported = await getMetalFinishSupportAdmin();
  if (!supported) throw new Error(SCHEMA_ERROR_MESSAGE);
}

/**
 * The public carousel is cached with a tag. Ask the admin-only route to
 * invalidate it after a successful mutation. A revalidation failure must not
 * roll back a saved database change; the cache also expires on its own.
 */
async function invalidatePublicMetalFinishesCache(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const response = await fetch(PUBLIC_CACHE_REVALIDATE_PATH, {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok && response.status !== 401 && response.status !== 403) {
      console.warn(
        '[Metal Finishes] Public cache revalidation failed with HTTP',
        response.status
      );
    }
  } catch (error) {
    console.warn('[Metal Finishes] Public cache revalidation failed:', error);
  }
}

export async function getMetalFinishSupportAdmin(): Promise<boolean> {
  const { error } = await createSupabaseBrowserClient()
    .from('metal_finishes')
    .select('id')
    .limit(0);

  if (!error) return true;
  if (isMetalFinishSchemaMissingError(error)) return false;
  throw error;
}

/**
 * Used by the workspace tab counter. A missing migration is not an error here
 * so the rest of the admin dashboard keeps loading normally.
 */
export async function getMetalFinishCountAdmin(): Promise<number> {
  const { error, count } = await createSupabaseBrowserClient()
    .from('metal_finishes')
    .select('id', { count: 'exact', head: true });

  if (error) {
    if (isMetalFinishSchemaMissingError(error)) return 0;
    throw error;
  }
  return count ?? 0;
}

export async function getMetalFinishCountsAdmin(): Promise<MetalFinishCounts> {
  const supabase = createSupabaseBrowserClient();
  const countQuery = () =>
    supabase.from('metal_finishes').select('id', { count: 'exact', head: true });

  const [total, published, draft, missingImage] = await Promise.all([
    countQuery(),
    countQuery().eq('status', 'published'),
    countQuery().eq('status', 'draft'),
    countQuery().is('main_image_url', null),
  ]);

  const results = [total, published, draft, missingImage];
  if (results.some((result) => result.error)) {
    if (
      results.some(
        (result) =>
          result.error && isMetalFinishSchemaMissingError(result.error)
      )
    ) {
      return EMPTY_COUNTS;
    }
    const firstError = results.find((result) => result.error)?.error;
    throw firstError ?? new Error('The Metal Finishes summary could not be loaded.');
  }

  return {
    total: total.count ?? 0,
    published: published.count ?? 0,
    draft: draft.count ?? 0,
    missingImage: missingImage.count ?? 0,
  };
}

export async function getMetalFinishesAdminPage(
  filters: MetalFinishAdminQuery = {}
): Promise<MetalFinishAdminPage> {
  const pageSize = Math.min(50, Math.max(1, Math.floor(filters.pageSize ?? 8)));
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const offset = (page - 1) * pageSize;
  const search = sanitizeMetalFinishSearch(filters.search ?? '');

  try {
    await requireSchema();
    const supabase = createSupabaseBrowserClient();

    let query = supabase
      .from('metal_finishes')
      .select(METAL_FINISH_ADMIN_SELECT, { count: 'exact' });

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,finish_code.ilike.%${search}%`
      );
    }

    if (filters.sort === 'name') {
      query = query
        .order('name', { ascending: true })
        .order('display_order', { ascending: true })
        .order('id', { ascending: true });
    } else {
      query = query
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });
    }

    const { data, error, count } = await query.range(
      offset,
      offset + pageSize - 1
    );

    if (error) throw error;

    const total = count ?? 0;
    return {
      finishes: ((data ?? []) as unknown as MetalFinishRow[]).map(
        mapMetalFinishRow
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

export async function getMetalFinishAdminById(
  id: string
): Promise<MetalFinish | null> {
  try {
    const { data, error } = await createSupabaseBrowserClient()
      .from('metal_finishes')
      .select(METAL_FINISH_ADMIN_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapMetalFinishRow(data as unknown as MetalFinishRow) : null;
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function createMetalFinishAdmin(
  input: MetalFinishInput
): Promise<MetalFinish> {
  validateInput(input);
  await requireSchema();

  const includeCode = Boolean(input.finish_code?.trim());
  const { data, error } = await createSupabaseBrowserClient()
    .from('metal_finishes')
    .insert([toWriteRow(input, includeCode)])
    .select(METAL_FINISH_ADMIN_SELECT)
    .single();

  if (error) throw friendlyError(error);
  await invalidatePublicMetalFinishesCache();
  return mapMetalFinishRow(data as unknown as MetalFinishRow);
}

export async function updateMetalFinishAdmin(
  id: string,
  input: MetalFinishInput
): Promise<MetalFinish> {
  validateInput(input);
  await requireSchema();

  const includeCode = Boolean(input.finish_code?.trim());
  const { data, error } = await createSupabaseBrowserClient()
    .from('metal_finishes')
    .update(toWriteRow(input, includeCode))
    .eq('id', id)
    .select(METAL_FINISH_ADMIN_SELECT)
    .single();

  if (error) throw friendlyError(error);
  await invalidatePublicMetalFinishesCache();
  return mapMetalFinishRow(data as unknown as MetalFinishRow);
}

export async function updateMetalFinishStatusAdmin(
  id: string,
  status: MetalFinishStatus
): Promise<void> {
  await requireSchema();
  const { error } = await createSupabaseBrowserClient()
    .from('metal_finishes')
    .update({ status })
    .eq('id', id);

  if (error) throw friendlyError(error);
  await invalidatePublicMetalFinishesCache();
}

export async function deleteMetalFinishAdmin(id: string): Promise<void> {
  await requireSchema();
  const { error } = await createSupabaseBrowserClient()
    .from('metal_finishes')
    .delete()
    .eq('id', id);

  if (error) throw friendlyError(error);
  await invalidatePublicMetalFinishesCache();
}

/**
 * Atomically swaps a finish with its adjacent neighbour inside a database
 * transaction. The RPC renumbers the whole collection under a row/advisory lock,
 * so concurrent reorders cannot produce duplicate or partially applied order.
 */
export async function reorderMetalFinishAdmin(
  id: string,
  direction: MetalFinishOrderDirection
): Promise<void> {
  await requireSchema();
  const { error } = await createSupabaseBrowserClient().rpc(
    'reorder_metal_finish',
    {
      p_id: id,
      p_direction: direction,
    }
  );

  if (error) throw friendlyError(error);
  await invalidatePublicMetalFinishesCache();
}
