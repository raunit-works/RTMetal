import { createSupabaseBrowserClient } from './client';
import type {
  ProductOptionValue,
  ProductVariantImage,
  SwatchType,
} from '../types';
import {
  buildVariantSnapshot,
  isVariantSchemaMissingError,
  mapProductOptionValueRow,
  mapProductVariantImageRow,
  sortVariantImages,
  type DatabaseProductOptionRow,
  type DatabaseProductOptionValueRow,
  type DatabaseProductVariantImageRow,
  type DatabaseProductVariantRow,
  type ProductVariantsSnapshot,
} from './product-variants';

const OPTION_SELECT = '*, product_option_values(*)';
const VARIANT_SELECT =
  '*, product_variant_options(option_id, option_value_id), product_variant_images(*)';

export const VARIANT_SCHEMA_MESSAGE =
  'The Product Variants database migration has not been applied. Apply the approved additive migration before using this section.';

function friendlyVariantError(error: unknown): Error {
  if (isVariantSchemaMissingError(error)) {
    return new Error(VARIANT_SCHEMA_MESSAGE);
  }
  if (error && typeof error === 'object') {
    const code = (error as { code?: string }).code;
    const message = (error as { message?: string }).message ?? '';
    if (code === '23505') {
      if (/sku/i.test(message)) {
        return new Error('That variant SKU is already used by another finish.');
      }
      if (/product_option_values/i.test(message)) {
        return new Error('A finish with that name already exists on this product.');
      }
      return new Error('That finish is already linked to another variant of this product.');
    }
    if (code === '23514' || code === '23503') {
      return new Error(message || 'The finish data is not valid. Check the fields and try again.');
    }
    if (code === '23502') {
      return new Error('A required finish field is missing.');
    }
    if (code === '42501') {
      return new Error(
        'Administrator access is required to save product finishes. Please sign in as an admin.'
      );
    }
  }
  if (error instanceof Error) return error;
  return new Error('The finish could not be saved.');
}

export function slugifyOptionValue(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'finish';
}

export interface VariantOptionValueInput {
  id?: string;
  optionId: string;
  name: string;
  swatchType: SwatchType;
  swatchColor?: string;
  swatchColorSecondary?: string;
  swatchImageUrl?: string;
  displayOrder?: number;
}

export interface VariantRowInput {
  productId: string;
  sku?: string | null;
  stockQuantity?: number | null;
  availability: 'in_stock' | 'made_to_order' | 'out_of_stock';
  isActive: boolean;
  isDefault: boolean;
  displayOrder?: number;
}

export async function getVariantSchemaSupportAdmin(): Promise<boolean> {
  const { error } = await createSupabaseBrowserClient()
    .from('product_variants')
    .select('id, product_id, is_active, is_default')
    .limit(0);
  if (!error) return true;
  if (isVariantSchemaMissingError(error)) return false;
  throw friendlyVariantError(error);
}

/**
 * Admin loader for one product. Includes inactive variants and variants of
 * draft products so the editor can manage everything before publishing.
 */
export async function getProductVariantsAdmin(
  productId: string
): Promise<ProductVariantsSnapshot> {
  const supabase = createSupabaseBrowserClient();
  const [optionsResult, variantsResult] = await Promise.all([
    supabase
      .from('product_options')
      .select(OPTION_SELECT)
      .eq('product_id', productId)
      .order('display_order', { ascending: true }),
    supabase
      .from('product_variants')
      .select(VARIANT_SELECT)
      .eq('product_id', productId)
      .order('display_order', { ascending: true }),
  ]);

  if (optionsResult.error) throw friendlyVariantError(optionsResult.error);
  if (variantsResult.error) throw friendlyVariantError(variantsResult.error);

  return buildVariantSnapshot(
    (optionsResult.data ?? []) as unknown as DatabaseProductOptionRow[],
    (variantsResult.data ?? []) as unknown as DatabaseProductVariantRow[]
  );
}

/**
 * A product has exactly one Finish option for now. Future dimensions (for
 * example Size) can be added with a different slug without changing the
 * variant schema.
 */
export async function ensureFinishOptionAdmin(productId: string): Promise<{
  id: string;
  name: string;
  slug: string;
  productId: string;
  displayOrder: number;
}> {
  const supabase = createSupabaseBrowserClient();
  const { data: existing, error } = await supabase
    .from('product_options')
    .select('*')
    .eq('product_id', productId)
    .eq('slug', 'finish')
    .maybeSingle();

  if (error) throw friendlyVariantError(error);
  if (existing) {
    return {
      id: existing.id,
      productId: existing.product_id,
      name: existing.name,
      slug: existing.slug,
      displayOrder: Number(existing.display_order ?? 0),
    };
  }

  const { data, error: insertError } = await supabase
    .from('product_options')
    .insert([{ product_id: productId, name: 'Finish', slug: 'finish', display_order: 0 }])
    .select()
    .single();

  if (insertError) {
    if ((insertError as { code?: string }).code === '23505') {
      const { data: retry } = await supabase
        .from('product_options')
        .select('*')
        .eq('product_id', productId)
        .eq('slug', 'finish')
        .maybeSingle();
      if (retry) {
        return {
          id: retry.id,
          productId: retry.product_id,
          name: retry.name,
          slug: retry.slug,
          displayOrder: Number(retry.display_order ?? 0),
        };
      }
    }
    throw friendlyVariantError(insertError);
  }

  return {
    id: data.id,
    productId: data.product_id,
    name: data.name,
    slug: data.slug,
    displayOrder: Number(data.display_order ?? 0),
  };
}

export async function saveVariantOptionValueAdmin(
  input: VariantOptionValueInput
): Promise<{ value: ProductOptionValue; created: boolean }> {
  const supabase = createSupabaseBrowserClient();
  const payload = {
    option_id: input.optionId,
    name: input.name.trim(),
    slug: slugifyOptionValue(input.name),
    swatch_type: input.swatchType,
    swatch_color_1: input.swatchColor || null,
    swatch_color_2: input.swatchColorSecondary || null,
    swatch_image_url: input.swatchImageUrl || null,
    display_order: input.displayOrder ?? 0,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from('product_option_values')
      .update(payload)
      .eq('id', input.id)
      .select()
      .single();
    if (error) throw friendlyVariantError(error);
    return {
      value: mapProductOptionValueRow(
        data as unknown as DatabaseProductOptionValueRow
      ),
      created: false,
    };
  }

  const { data: existing, error: lookupError } = await supabase
    .from('product_option_values')
    .select('id, product_variant_options(variant_id)')
    .eq('option_id', input.optionId)
    .eq('slug', payload.slug)
    .maybeSingle();

  if (lookupError) throw friendlyVariantError(lookupError);

  const existingValue = existing as
    | {
        id: string;
        product_variant_options?: Array<{ variant_id: string }>;
      }
    | null;

  if (existingValue) {
    if ((existingValue.product_variant_options ?? []).length > 0) {
      throw new Error('A finish with that name already exists on this product.');
    }
    const { data: refreshed, error: refreshError } = await supabase
      .from('product_option_values')
      .update(payload)
      .eq('id', existingValue.id)
      .select()
      .single();
    if (refreshError) throw friendlyVariantError(refreshError);
    return {
      value: mapProductOptionValueRow(
        refreshed as unknown as DatabaseProductOptionValueRow
      ),
      created: false,
    };
  }

  const { data, error } = await supabase
    .from('product_option_values')
    .insert([payload])
    .select()
    .single();
  if (error) throw friendlyVariantError(error);
  return {
    value: mapProductOptionValueRow(
      data as unknown as DatabaseProductOptionValueRow
    ),
    created: true,
  };
}

/**
 * Removes a finish value only when no variant references it. Used exclusively
 * to roll back a value created during a save that failed before linking.
 */
export async function deleteVariantOptionValueAdmin(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { count, error: countError } = await supabase
    .from('product_variant_options')
    .select('variant_id', { count: 'exact', head: true })
    .eq('option_value_id', id);
  if (countError) throw friendlyVariantError(countError);
  if ((count ?? 0) > 0) {
    throw new Error(
      'The finish value is still linked to a variant and was not removed.'
    );
  }

  const { error } = await supabase
    .from('product_option_values')
    .delete()
    .eq('id', id);
  if (error) throw friendlyVariantError(error);
}

export async function createVariantAdmin(
  input: VariantRowInput
): Promise<{ id: string }> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('product_variants')
    .insert([
      {
        product_id: input.productId,
        sku: input.sku || null,
        stock_quantity: input.stockQuantity ?? null,
        availability: input.availability,
        is_active: input.isActive,
        is_default: input.isDefault,
        display_order: input.displayOrder ?? 0,
      },
    ])
    .select('*')
    .single();
  if (error) throw friendlyVariantError(error);
  return { id: data.id };
}

export async function updateVariantAdmin(
  id: string,
  updates: Partial<{
    sku: string | null;
    stock_quantity: number | null;
    availability: 'in_stock' | 'made_to_order' | 'out_of_stock';
    is_active: boolean;
    is_default: boolean;
    display_order: number;
  }>
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('product_variants').update(updates).eq('id', id);
  if (error) throw friendlyVariantError(error);
}

export async function deleteVariantAdmin(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('product_variants').delete().eq('id', id);
  if (error) throw friendlyVariantError(error);
}

export async function linkVariantOptionAdmin(
  variantId: string,
  optionId: string,
  optionValueId: string
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('product_variant_options').upsert(
    [{ variant_id: variantId, option_id: optionId, option_value_id: optionValueId }],
    { onConflict: 'variant_id,option_id' }
  );
  if (error) throw friendlyVariantError(error);
}

export async function setDefaultVariantAdmin(
  productId: string,
  variantId: string
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error: clearError } = await supabase
    .from('product_variants')
    .update({ is_default: false })
    .eq('product_id', productId)
    .eq('is_default', true)
    .neq('id', variantId);
  if (clearError) throw friendlyVariantError(clearError);

  const { error } = await supabase
    .from('product_variants')
    .update({ is_default: true })
    .eq('id', variantId);
  if (error) throw friendlyVariantError(error);
}

export async function reorderVariantsAdmin(
  productId: string,
  orderedVariantIds: string[]
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  for (let index = 0; index < orderedVariantIds.length; index += 1) {
    const { error } = await supabase
      .from('product_variants')
      .update({ display_order: index + 1 })
      .eq('id', orderedVariantIds[index])
      .eq('product_id', productId);
    if (error) throw friendlyVariantError(error);
  }
}

// ---------------------------------------------------------------------------
// Variant images
// ---------------------------------------------------------------------------
export async function addVariantImageAdmin(
  variantId: string,
  imageUrl: string,
  altText?: string,
  isPrimary = false,
  sortOrder = 0
): Promise<ProductVariantImage> {
  const supabase = createSupabaseBrowserClient();
  const { data: existing, error: existingError } = await supabase
    .from('product_variant_images')
    .select('*')
    .eq('variant_id', variantId)
    .eq('image_url', imageUrl)
    .maybeSingle();
  if (existingError) throw friendlyVariantError(existingError);
  if (existing) {
    return mapProductVariantImageRow(existing as unknown as DatabaseProductVariantImageRow);
  }

  const { data, error } = await supabase
    .from('product_variant_images')
    .insert([
      {
        variant_id: variantId,
        image_url: imageUrl,
        alt_text: altText || null,
        is_primary: isPrimary,
        sort_order: sortOrder,
      },
    ])
    .select()
    .single();
  if (error) throw friendlyVariantError(error);
  return mapProductVariantImageRow(data as unknown as DatabaseProductVariantImageRow);
}

export async function updateVariantImageAdmin(
  id: string,
  updates: Partial<{ alt_text: string | null; is_primary: boolean; sort_order: number }>
): Promise<ProductVariantImage> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('product_variant_images')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw friendlyVariantError(error);
  return mapProductVariantImageRow(data as unknown as DatabaseProductVariantImageRow);
}

export async function deleteVariantImageAdmin(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('product_variant_images').delete().eq('id', id);
  if (error) throw friendlyVariantError(error);
}

export interface VariantImageSyncFailure {
  imageId?: string;
  message: string;
}

/**
 * Persist only deliberate differences between the saved and desired gallery.
 * Removing an image association never deletes the parent product image or the
 * storage object.
 */
export async function syncVariantImagesAdmin(
  variantId: string,
  desired: ProductVariantImage[],
  baseline: ProductVariantImage[],
  removedIds: Iterable<string> = []
): Promise<{ saved: ProductVariantImage[]; failures: VariantImageSyncFailure[] }> {
  const failures: VariantImageSyncFailure[] = [];
  const removed = new Set(removedIds);
  const savedById = new Map(baseline.map((image) => [image.id, image]));
  const desiredUrls = new Set(desired.map((image) => image.imageUrl));
  const desiredIds = new Set(desired.map((image) => image.id).filter(Boolean));

  for (const image of desired) {
    if (image.id) continue;
    const already = baseline.find((existing) => existing.imageUrl === image.imageUrl);
    if (already) {
      savedById.set(already.id, already);
      continue;
    }
    try {
      const saved = await addVariantImageAdmin(
        variantId,
        image.imageUrl,
        image.altText,
        image.isPrimary,
        image.sortOrder
      );
      savedById.set(saved.id, saved);
    } catch (error) {
      failures.push({
        message: error instanceof Error ? error.message : 'The finish image could not be saved.',
      });
    }
  }

  for (const original of baseline) {
    if (!removed.has(original.id)) continue;
    if (desiredIds.has(original.id) || desiredUrls.has(original.imageUrl)) continue;
    try {
      await deleteVariantImageAdmin(original.id);
      savedById.delete(original.id);
    } catch (error) {
      failures.push({
        imageId: original.id,
        message: error instanceof Error ? error.message : 'The finish image could not be removed.',
      });
    }
  }

  for (const image of desired) {
    if (!image.id) continue;
    const current = baseline.find((row) => row.id === image.id);
    if (!current) continue;
    const changed =
      current.altText !== image.altText ||
      current.isPrimary !== image.isPrimary ||
      current.sortOrder !== image.sortOrder;
    if (!changed) {
      savedById.set(current.id, current);
      continue;
    }
    try {
      const saved = await updateVariantImageAdmin(image.id, {
        alt_text: image.altText ?? null,
        is_primary: image.isPrimary,
        sort_order: image.sortOrder,
      });
      savedById.set(saved.id, saved);
    } catch (error) {
      failures.push({
        imageId: image.id,
        message: error instanceof Error ? error.message : 'The finish image could not be updated.',
      });
    }
  }

  return {
    saved: sortVariantImages(Array.from(savedById.values())),
    failures,
  };
}
