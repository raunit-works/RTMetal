import type { SwatchType, VariantAvailability } from '@/lib/types';

export const DEFAULT_SWATCH_COLOR = '#C9A96E';

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export type VariantField =
  | 'finishName'
  | 'sku'
  | 'swatchColor1'
  | 'swatchColor2'
  | 'swatchImageUrl'
  | 'stockQuantity';

export interface FieldValidationError {
  key: string;
  field: VariantField;
  message: string;
}

export interface VariantValidationResult {
  banner: string | null;
  fields: FieldValidationError[];
}

export interface VariantDraftInput {
  key: string;
  finishName: string;
  swatchType: SwatchType;
  swatchColor1: string;
  swatchColor2: string;
  swatchImageUrl: string;
  sku: string;
  stockQuantity: string;
  availability: VariantAvailability;
  isActive: boolean;
  isDefault: boolean;
}

export interface FinishOptionPayload {
  name: string;
  swatchType: SwatchType;
  swatchColor: string;
  swatchColorSecondary: string | undefined;
  swatchImageUrl: string | undefined;
}

export interface VariantRowValues {
  sku: string | null;
  stockQuantity: number | null;
  availability: VariantAvailability;
  isActive: boolean;
  isDefault: boolean;
}

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value.trim());
}

export function normalizeHex(value: string, fallback = DEFAULT_SWATCH_COLOR): string {
  const trimmed = value.trim();
  return HEX_COLOR_PATTERN.test(trimmed) ? trimmed : fallback;
}

export function normalizeStockQuantity(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const quantity = Number(trimmed);
  return Number.isInteger(quantity) ? quantity : null;
}

export function toFinishOptionPayload(draft: VariantDraftInput): FinishOptionPayload {
  return {
    name: draft.finishName.trim(),
    swatchType: draft.swatchType,
    swatchColor: normalizeHex(draft.swatchColor1),
    swatchColorSecondary:
      draft.swatchType === 'dual' ? normalizeHex(draft.swatchColor2) : undefined,
    swatchImageUrl: draft.swatchImageUrl.trim() || undefined,
  };
}

export function toVariantRowValues(draft: VariantDraftInput): VariantRowValues {
  return {
    sku: draft.sku.trim() || null,
    stockQuantity: normalizeStockQuantity(draft.stockQuantity),
    availability: draft.availability,
    isActive: draft.isActive,
    isDefault: draft.isDefault,
  };
}

export function validateVariantDrafts(
  drafts: readonly VariantDraftInput[]
): VariantValidationResult {
  const fields: FieldValidationError[] = [];

  if (drafts.length === 0) {
    return {
      banner:
        'Add at least one finish, or turn off "This product has multiple finishes/colours".',
      fields,
    };
  }

  const names = new Set<string>();
  const skus = new Set<string>();

  drafts.forEach((draft, index) => {
    const position = index + 1;
    const name = draft.finishName.trim();

    if (!name) {
      fields.push({
        key: draft.key,
        field: 'finishName',
        message: `Finish ${position}: enter a finish name.`,
      });
    } else {
      const nameKey = name.toLowerCase();
      if (names.has(nameKey)) {
        fields.push({
          key: draft.key,
          field: 'finishName',
          message: `Finish ${position}: "${name}" is used by another finish on this product.`,
        });
      }
      names.add(nameKey);
    }

    if (draft.swatchType === 'solid') {
      if (!isValidHexColor(draft.swatchColor1)) {
        fields.push({
          key: draft.key,
          field: 'swatchColor1',
          message: `Finish ${position}: choose a valid swatch colour.`,
        });
      }
    } else if (draft.swatchType === 'dual') {
      if (!isValidHexColor(draft.swatchColor1) || !isValidHexColor(draft.swatchColor2)) {
        fields.push({
          key: draft.key,
          field: isValidHexColor(draft.swatchColor1)
            ? 'swatchColor2'
            : 'swatchColor1',
          message: `Finish ${position}: choose two valid swatch colours.`,
        });
      }
    } else if (!draft.swatchImageUrl.trim()) {
      fields.push({
        key: draft.key,
        field: 'swatchImageUrl',
        message: `Finish ${position}: upload a swatch thumbnail image.`,
      });
    }

    const sku = draft.sku.trim().toLowerCase();
    if (sku) {
      if (skus.has(sku)) {
        fields.push({
          key: draft.key,
          field: 'sku',
          message: `Finish ${position}: SKU "${draft.sku.trim()}" is used by another finish.`,
        });
      }
      skus.add(sku);
    }

    if (draft.stockQuantity.trim()) {
      const quantity = Number(draft.stockQuantity);
      if (!Number.isInteger(quantity) || quantity < 0) {
        fields.push({
          key: draft.key,
          field: 'stockQuantity',
          message: `Finish ${position}: stock quantity must be a whole number of 0 or more.`,
        });
      }
    }

    if (draft.isDefault && !draft.isActive) {
      fields.push({
        key: draft.key,
        field: 'finishName',
        message: `Finish ${position}: the default finish must be active.`,
      });
    }
  });

  if (drafts.filter((draft) => draft.isDefault).length > 1) {
    const defaultDraft = drafts.find((draft) => draft.isDefault);
    if (defaultDraft) {
      fields.push({
        key: defaultDraft.key,
        field: 'finishName',
        message: 'Choose a single default finish.',
      });
    }
  }

  return { banner: fields[0]?.message ?? null, fields };
}
