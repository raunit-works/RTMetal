import { createSupabaseClient } from './client';
import type {
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductVariantImage,
  SwatchType,
  VariantAvailability,
} from '../types';

// ---------------------------------------------------------------------------
// Row shapes (snake_case mirrors the additive Supabase schema)
// ---------------------------------------------------------------------------
export interface DatabaseProductOptionValueRow {
  id: string;
  option_id: string;
  name: string;
  slug: string;
  swatch_type: string;
  swatch_color_1: string | null;
  swatch_color_2: string | null;
  swatch_image_url: string | null;
  display_order: number;
}

export interface DatabaseProductOptionRow {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  display_order: number;
  product_option_values?: DatabaseProductOptionValueRow[] | null;
}

export interface DatabaseProductVariantImageRow {
  id: string;
  variant_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface DatabaseProductVariantRow {
  id: string;
  product_id: string;
  sku: string | null;
  price: number | string | null;
  stock_quantity: number | null;
  availability: string;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  product_variant_options?: Array<{
    option_id: string;
    option_value_id: string;
  }> | null;
  product_variant_images?: DatabaseProductVariantImageRow[] | null;
}

export interface ProductVariantsSnapshot {
  options: ProductOption[];
  variants: ProductVariant[];
}

const VARIANT_AVAILABILITIES: VariantAvailability[] = [
  'in_stock',
  'made_to_order',
  'out_of_stock',
];

const SWATCH_TYPES: SwatchType[] = ['solid', 'dual', 'image'];

const VARIANT_SCHEMA_MISSING_CODES = new Set(['42P01', 'PGRST204', 'PGRST205']);

export function isVariantSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  if (code === '42501') return false;
  if (code && VARIANT_SCHEMA_MISSING_CODES.has(code)) return true;
  const message = (error as { message?: string }).message ?? '';
  if (/permission denied/i.test(message)) return false;
  return /product_variants|product_options|product_option_values|product_variant_images/i.test(
    message
  );
}

function asSwatchType(value: string | null | undefined): SwatchType {
  return SWATCH_TYPES.includes(value as SwatchType) ? (value as SwatchType) : 'solid';
}

function asAvailability(value: string | null | undefined): VariantAvailability {
  return VARIANT_AVAILABILITIES.includes(value as VariantAvailability)
    ? (value as VariantAvailability)
    : 'in_stock';
}

export function mapProductOptionValueRow(
  row: DatabaseProductOptionValueRow
): ProductOptionValue {
  return {
    id: row.id,
    optionId: row.option_id,
    name: row.name,
    swatchType: asSwatchType(row.swatch_type),
    swatchColor: row.swatch_color_1 || undefined,
    swatchColorSecondary: row.swatch_color_2 || undefined,
    swatchImageUrl: row.swatch_image_url || undefined,
    displayOrder: Number(row.display_order ?? 0),
  };
}

export function mapProductVariantImageRow(
  row: DatabaseProductVariantImageRow
): ProductVariantImage {
  return {
    id: row.id,
    variantId: row.variant_id,
    imageUrl: row.image_url,
    altText: row.alt_text || undefined,
    sortOrder: Number(row.sort_order ?? 0),
    isPrimary: Boolean(row.is_primary),
  };
}

export function sortVariantImages(images: ProductVariantImage[]): ProductVariantImage[] {
  return [...images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });
}

export function sortProductOptions<T extends { displayOrder: number; id: string }>(
  options: T[]
): T[] {
  return [...options].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return a.id.localeCompare(b.id);
  });
}

export function sortProductVariants(variants: ProductVariant[]): ProductVariant[] {
  return [...variants].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return a.id.localeCompare(b.id);
  });
}

export function mapProductOptionRow(row: DatabaseProductOptionRow): ProductOption {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    slug: row.slug,
    displayOrder: Number(row.display_order ?? 0),
    values: (row.product_option_values ?? [])
      .map(mapProductOptionValueRow)
      .sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
        return a.id.localeCompare(b.id);
      }),
  };
}

export function mapProductVariantRow(
  row: DatabaseProductVariantRow,
  valuesById: Map<string, ProductOptionValue>
): ProductVariant {
  const link = (row.product_variant_options ?? [])[0];
  const optionValue = link ? valuesById.get(link.option_value_id) : undefined;

  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku || undefined,
    price: row.price != null ? Number(row.price) : null,
    stockQuantity: row.stock_quantity != null ? Number(row.stock_quantity) : null,
    availability: asAvailability(row.availability),
    isActive: Boolean(row.is_active),
    isDefault: Boolean(row.is_default),
    displayOrder: Number(row.display_order ?? 0),
    optionId: link?.option_id,
    optionValueId: link?.option_value_id,
    finishName: optionValue?.name ?? '',
    images: sortVariantImages(
      (row.product_variant_images ?? []).map(mapProductVariantImageRow)
    ),
  };
}

export function buildVariantSnapshot(
  optionRows: DatabaseProductOptionRow[],
  variantRows: DatabaseProductVariantRow[]
): ProductVariantsSnapshot {
  const options = sortProductOptions(optionRows.map(mapProductOptionRow));
  const valuesById = new Map<string, ProductOptionValue>();
  options.forEach((option) => {
    option.values.forEach((value) => valuesById.set(value.id, value));
  });
  const variants = sortProductVariants(
    variantRows.map((row) => mapProductVariantRow(row, valuesById))
  );
  return { options, variants };
}

function emptySnapshot(): ProductVariantsSnapshot {
  return { options: [], variants: [] };
}

const OPTION_SELECT = '*, product_option_values(*)';
const VARIANT_SELECT =
  '*, product_variant_options(option_id, option_value_id), product_variant_images(*)';

/**
 * Public loader. RLS already restricts rows to active variants of published
 * products, but the explicit filter keeps the intent visible in code.
 */
export async function getPublicVariantsForProducts(
  productIds: string[]
): Promise<Map<string, ProductVariantsSnapshot>> {
  const result = new Map<string, ProductVariantsSnapshot>();
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));
  if (uniqueIds.length === 0) return result;

  try {
    const supabase = createSupabaseClient();
    const [optionsResult, variantsResult] = await Promise.all([
      supabase
        .from('product_options')
        .select(OPTION_SELECT)
        .in('product_id', uniqueIds)
        .order('display_order', { ascending: true }),
      supabase
        .from('product_variants')
        .select(VARIANT_SELECT)
        .in('product_id', uniqueIds)
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
    ]);

    if (optionsResult.error || variantsResult.error) {
      if (
        isVariantSchemaMissingError(optionsResult.error) ||
        isVariantSchemaMissingError(variantsResult.error)
      ) {
        return result;
      }
      console.error(
        '[Supabase Error] getPublicVariantsForProducts failed:',
        optionsResult.error ?? variantsResult.error
      );
      return result;
    }

    const optionsByProduct = new Map<string, DatabaseProductOptionRow[]>();
    (optionsResult.data ?? []).forEach((row) => {
      const typed = row as unknown as DatabaseProductOptionRow;
      const list = optionsByProduct.get(typed.product_id) ?? [];
      list.push(typed);
      optionsByProduct.set(typed.product_id, list);
    });

    const variantsByProduct = new Map<string, DatabaseProductVariantRow[]>();
    (variantsResult.data ?? []).forEach((row) => {
      const typed = row as unknown as DatabaseProductVariantRow;
      const list = variantsByProduct.get(typed.product_id) ?? [];
      list.push(typed);
      variantsByProduct.set(typed.product_id, list);
    });

    uniqueIds.forEach((productId) => {
      const snapshot = buildVariantSnapshot(
        optionsByProduct.get(productId) ?? [],
        variantsByProduct.get(productId) ?? []
      );
      if (snapshot.variants.length > 0) {
        result.set(productId, snapshot);
      }
    });

    return result;
  } catch (error) {
    if (!isVariantSchemaMissingError(error)) {
      console.error('[Supabase Error] getPublicVariantsForProducts exception:', error);
    }
    return result;
  }
}

export async function getPublicVariantsForProduct(
  productId: string
): Promise<ProductVariantsSnapshot> {
  const map = await getPublicVariantsForProducts([productId]);
  return map.get(productId) ?? emptySnapshot();
}

export function getVariantPrimaryImage(variant: ProductVariant | undefined): string | undefined {
  if (!variant) return undefined;
  const sorted = sortVariantImages(variant.images);
  return sorted[0]?.imageUrl;
}

export function getDefaultVariant(variants: ProductVariant[] | undefined): ProductVariant | undefined {
  if (!variants || variants.length === 0) return undefined;
  return (
    variants.find((variant) => variant.isDefault) ??
    variants.find((variant) => variant.isActive) ??
    variants[0]
  );
}
