import { createSupabaseBrowserClient } from './client';
import { mapProductImageRow, type DatabaseProductImageRow } from './data-mapper';
import type { ProductImage } from '../types';

export async function addProductGalleryImage(
  productId: string,
  imageUrl: string,
  altText?: string,
  isPrimary = false,
  sortOrder = 0
) {
  const supabase = createSupabaseBrowserClient();

  // A retry can follow a request whose INSERT succeeded but whose response was
  // lost. Reuse the existing row instead of creating a duplicate gallery record.
  const { data: existing, error: existingError } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .eq('image_url', imageUrl)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('product_images')
    .insert([{ product_id: productId, image_url: imageUrl, alt_text: altText, is_primary: isPrimary, sort_order: sortOrder }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProductGalleryImage(
  imageId: string,
  updates: Partial<{ alt_text: string; is_primary: boolean; sort_order: number }>
) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('product_images')
    .update(updates)
    .eq('id', imageId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProductGalleryImage(imageId: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('product_images').delete().eq('id', imageId);
  if (error) throw error;
}

export async function getProductGalleryImages(productId: string): Promise<ProductImage[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return sortGalleryImages((data || []).map((row) => mapProductImageRow(row as DatabaseProductImageRow)));
}

export function sortGalleryImages(images: ProductImage[]): ProductImage[] {
  return [...images].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });
}

function isPersistableImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/');
}

export interface GallerySyncFailure {
  imageId?: string;
  imageUrl?: string;
  message: string;
}

export interface GallerySyncResult {
  /** Rows confirmed to exist in the database after this sync. */
  savedImages: ProductImage[];
  added: ProductImage[];
  updated: ProductImage[];
  deletedIds: string[];
  failures: GallerySyncFailure[];
}

export interface GalleryOperations {
  add: (
    productId: string,
    imageUrl: string,
    altText?: string,
    isPrimary?: boolean,
    sortOrder?: number
  ) => Promise<ProductImage>;
  update: (
    imageId: string,
    updates: Partial<{ alt_text: string; is_primary: boolean; sort_order: number }>
  ) => Promise<ProductImage>;
  remove: (imageId: string) => Promise<void>;
}

export interface GallerySyncOptions {
  operations?: GalleryOperations;
  /**
   * Only these saved row ids may be deleted. This prevents an incomplete or
   * temporarily empty UI array from deleting existing gallery rows.
   */
  removedIds?: Iterable<string>;
}

const defaultOperations: GalleryOperations = {
  async add(productId, imageUrl, altText, isPrimary, sortOrder) {
    const row = await addProductGalleryImage(productId, imageUrl, altText, isPrimary, sortOrder);
    return mapProductImageRow(row as DatabaseProductImageRow);
  },
  async update(imageId, updates) {
    const row = await updateProductGalleryImage(imageId, updates);
    return mapProductImageRow(row as DatabaseProductImageRow);
  },
  remove: deleteProductGalleryImage,
};

/**
 * Persist only the deliberate differences between the saved gallery and the
 * desired gallery. Existing rows are updated in place; new rows are inserted;
 * only rows explicitly removed from the desired list are deleted.
 */
export async function syncProductGalleryImages(
  productId: string,
  desiredImages: ProductImage[],
  baselineImages: ProductImage[],
  options: GallerySyncOptions = {}
): Promise<GallerySyncResult> {
  const operations = options.operations ?? defaultOperations;
  const explicitlyRemovedIds = new Set(options.removedIds ?? []);
  const baseline = sortGalleryImages(baselineImages);
  const baselineById = new Map(baseline.map((image) => [image.id, image]));
  const desiredIds = new Set(desiredImages.map((image) => image.id).filter(Boolean));
  const desiredUrls = new Set(desiredImages.map((image) => image.imageUrl).filter(Boolean));
  const savedById = new Map(baseline.map((image) => [image.id, image]));

  const added: ProductImage[] = [];
  const updated: ProductImage[] = [];
  const deletedIds: string[] = [];
  const failures: GallerySyncFailure[] = [];

  for (const image of desiredImages) {
    if (image.id) continue;

    if (!isPersistableImageUrl(image.imageUrl)) {
      failures.push({
        imageUrl: image.imageUrl,
        message: 'The uploaded image URL is not valid, so it was not saved.',
      });
      continue;
    }

    const alreadySaved = baseline.find((existing) => existing.imageUrl === image.imageUrl);
    if (alreadySaved) continue;

    try {
      const saved = await operations.add(
        productId,
        image.imageUrl,
        image.altText,
        image.isPrimary,
        image.sortOrder
      );
      added.push(saved);
      savedById.set(saved.id, saved);
    } catch (error) {
      failures.push({
        imageUrl: image.imageUrl,
        message: `Gallery database insert failed: ${
          error instanceof Error ? error.message : 'The gallery image could not be saved.'
        }`,
      });
    }
  }

  for (const original of baseline) {
    if (!explicitlyRemovedIds.has(original.id)) continue;
    if (desiredIds.has(original.id) || desiredUrls.has(original.imageUrl)) continue;

    try {
      await operations.remove(original.id);
      deletedIds.push(original.id);
      savedById.delete(original.id);
    } catch (error) {
      failures.push({
        imageId: original.id,
        imageUrl: original.imageUrl,
        message: `Gallery database delete failed: ${
          error instanceof Error ? error.message : 'The gallery image could not be removed.'
        }`,
      });
    }
  }

  for (const image of desiredImages) {
    if (!image.id) continue;

    const current = baselineById.get(image.id) ?? savedById.get(image.id);
    if (!current) {
      failures.push({
        imageId: image.id,
        imageUrl: image.imageUrl,
        message:
          'Gallery database update failed: this image is no longer in the saved set. Refresh the product before saving.',
      });
      continue;
    }

    const changed =
      current.altText !== image.altText ||
      current.isPrimary !== image.isPrimary ||
      current.sortOrder !== image.sortOrder;

    if (!changed) continue;

    try {
      const saved = await operations.update(image.id, {
        alt_text: image.altText,
        is_primary: image.isPrimary,
        sort_order: image.sortOrder,
      });
      updated.push(saved);
      savedById.set(saved.id, saved);
    } catch (error) {
      failures.push({
        imageId: image.id,
        imageUrl: image.imageUrl,
        message: `Gallery database update failed: ${
          error instanceof Error ? error.message : 'The gallery image changes could not be saved.'
        }`,
      });
    }
  }

  return {
    savedImages: sortGalleryImages(Array.from(savedById.values())),
    added,
    updated,
    deletedIds,
    failures,
  };
}

export function mergeGallerySyncResult(
  desiredImages: ProductImage[],
  result: GallerySyncResult
): ProductImage[] {
  const addedByUrl = new Map(result.added.map((image) => [image.imageUrl, image]));
  const updatedById = new Map(result.updated.map((image) => [image.id, image]));

  return desiredImages.map((image) => {
    if (image.id) {
      return updatedById.get(image.id) ?? image;
    }

    return (
      addedByUrl.get(image.imageUrl) ??
      result.savedImages.find((saved) => saved.imageUrl === image.imageUrl) ??
      image
    );
  });
}
