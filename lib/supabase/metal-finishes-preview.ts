import type { MetalFinish } from '../types';
import { createSupabaseServerClient } from './server';
import {
  METAL_FINISH_ADMIN_SELECT,
  isMetalFinishSchemaMissingError,
  mapMetalFinishRow,
  type MetalFinishRow,
} from './metal-finishes-shared';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Server-only lookup for the administrator preview route. RLS still enforces
 * public.is_admin(), and the caller verifies admin access before rendering.
 * Draft and archived records are never returned by public queries.
 */
export async function getMetalFinishPreviewById(
  id: string
): Promise<MetalFinish | null> {
  if (!UUID_PATTERN.test(id)) return null;

  try {
    const { data, error } = await createSupabaseServerClient()
      .from('metal_finishes')
      .select(METAL_FINISH_ADMIN_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      if (isMetalFinishSchemaMissingError(error)) return null;
      console.error('[Metal Finishes] Could not load admin preview:', error);
      return null;
    }

    return data ? mapMetalFinishRow(data as unknown as MetalFinishRow) : null;
  } catch (error) {
    console.error('[Metal Finishes] Could not load admin preview:', error);
    return null;
  }
}
