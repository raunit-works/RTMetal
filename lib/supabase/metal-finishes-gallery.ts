import { createSupabaseBrowserClient } from './client';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Load detail images only when an administrator-selected public finish is
 * enlarged. RLS and the explicit status filter both restrict this to published
 * records, so draft/archived media can never leak through the lightbox.
 */
export async function getPublishedFinishAdditionalImages(
  id: string
): Promise<string[]> {
  if (!UUID_PATTERN.test(id)) return [];

  try {
    const { data, error } = await createSupabaseBrowserClient()
      .from('metal_finishes')
      .select('additional_images')
      .eq('id', id)
      .eq('status', 'published')
      .maybeSingle();

    if (error) return [];

    const images = (data as { additional_images?: unknown } | null)
      ?.additional_images;

    if (!Array.isArray(images)) return [];

    return images.filter(
      (url): url is string => typeof url === 'string' && url.trim().length > 0
    );
  } catch {
    return [];
  }
}
