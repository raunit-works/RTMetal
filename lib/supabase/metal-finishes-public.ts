import { unstable_cache } from 'next/cache';
import { APPROVED_METAL_FINISHES } from '@/content/metal-coating/finishes';
import type { MetalFinishCardData } from '../types';
import { createSupabasePublicClient } from './server';
import {
  DEFAULT_FINISH_APPLICATIONS,
  METAL_FINISHES_PUBLIC_CACHE_TAG,
  METAL_FINISH_PUBLIC_SELECT,
  getFinishAppearanceLabel,
  isMetalFinishSchemaMissingError,
  mapMetalFinishCardRow,
  type MetalFinishPublicRow,
} from './metal-finishes-shared';

/**
 * Until the additive migration is applied, the public section keeps showing the
 * original 12 client-approved references from the static content module. Once
 * the table exists, only published database rows are returned, so draft and
 * archived records can never leak publicly.
 */
function getStaticFinishFallback(): MetalFinishCardData[] {
  return APPROVED_METAL_FINISHES.map((finish) => ({
    id: finish.finId,
    finId: finish.finId,
    displayName: finish.displayName,
    imagePath: finish.imagePath,
    altText: finish.altText,
    appearance: getFinishAppearanceLabel(finish.displayName),
    applications: DEFAULT_FINISH_APPLICATIONS,
    displayOrder: finish.displayOrder,
  })).sort((a, b) => a.displayOrder - b.displayOrder);
}

async function loadPublishedMetalFinishes(): Promise<MetalFinishCardData[]> {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from('metal_finishes')
      .select(METAL_FINISH_PUBLIC_SELECT)
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      if (isMetalFinishSchemaMissingError(error)) {
        return getStaticFinishFallback();
      }
      console.error('[Metal Finishes] Could not load public finishes:', error);
      return getStaticFinishFallback();
    }

    return ((data ?? []) as MetalFinishPublicRow[])
      .map(mapMetalFinishCardRow)
      .filter((finish) => Boolean(finish.imagePath));
  } catch (error) {
    console.error('[Metal Finishes] Could not load public finishes:', error);
    return getStaticFinishFallback();
  }
}

/**
 * The carousel data changes only when an administrator publishes, unpublishes,
 * edits, deletes or reorders a finish. Cache it across requests and invalidate
 * the tag from the admin mutation revalidation route.
 */
const getCachedPublishedMetalFinishes = unstable_cache(
  loadPublishedMetalFinishes,
  ['metal-finishes-public-v1'],
  {
    tags: [METAL_FINISHES_PUBLIC_CACHE_TAG],
    revalidate: 300,
  }
);

export async function getPublishedMetalFinishes(): Promise<
  MetalFinishCardData[]
> {
  return getCachedPublishedMetalFinishes();
}
