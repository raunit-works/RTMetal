import type { ProductVariantImage } from '@/lib/types';
import type { FinishOptionPayload, VariantRowValues } from './variant-drafts';

export type VariantSaveStage =
  | 'finish-option'
  | 'finish-value'
  | 'variant'
  | 'variant-link'
  | 'variant-rollback'
  | 'finish-value-rollback'
  | 'images'
  | 'reorder'
  | 'default'
  | 'delete'
  | 'finalisation';

export interface VariantSaveFailure {
  stage: VariantSaveStage;
  finishName?: string;
  message: string;
}

export interface VariantSaveDraft {
  key: string;
  id?: string;
  optionValueId?: string;
  finishName: string;
  finishPayload: FinishOptionPayload;
  rowValues: VariantRowValues;
  displayOrder: number;
  isDefault: boolean;
  images: ProductVariantImage[];
  baselineImages: ProductVariantImage[];
  removedImageIds: string[];
}

export interface SavedOptionValue {
  id: string;
  created: boolean;
}

export interface VariantSaveOperations {
  ensureFinishOption: (productId: string) => Promise<{ id: string }>;
  saveOptionValue: (input: {
    id?: string;
    optionId: string;
    finishPayload: FinishOptionPayload;
    displayOrder: number;
  }) => Promise<SavedOptionValue>;
  createVariant: (input: {
    productId: string;
    rowValues: VariantRowValues;
    displayOrder: number;
  }) => Promise<{ id: string }>;
  updateVariant: (input: {
    variantId: string;
    rowValues: VariantRowValues;
    displayOrder: number;
  }) => Promise<void>;
  linkVariantOption: (input: {
    variantId: string;
    optionId: string;
    optionValueId: string;
  }) => Promise<void>;
  deleteVariant: (variantId: string) => Promise<void>;
  deleteOptionValue: (optionValueId: string) => Promise<void>;
  syncImages: (input: {
    variantId: string;
    desired: ProductVariantImage[];
    baseline: ProductVariantImage[];
    removedIds: string[];
  }) => Promise<{ failures: Array<{ message: string }> }>;
  reorderVariants: (productId: string, variantIds: string[]) => Promise<void>;
  setDefaultVariant: (productId: string, variantId: string) => Promise<void>;
}

export interface VariantSaveResult {
  failures: VariantSaveFailure[];
  imageFailures: VariantSaveFailure[];
  savedOrder: string[];
  deletedVariantIds: string[];
  defaultVariantId: string | null;
  finalisationApplied: boolean;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

function label(draft: VariantSaveDraft): string {
  return draft.finishName.trim() || `Finish ${draft.displayOrder}`;
}

/**
 * Persists finishes while keeping the operations that must succeed together
 * together. If a finish is created but cannot be linked, the new variant and
 * any newly created option value are rolled back before the failure is
 * reported. Ordering, default selection and deletion are only finalised when
 * every finish-level operation succeeded, so a partial failure can never be
 * reported as a complete save.
 */
export async function saveProductVariants(input: {
  productId: string;
  drafts: VariantSaveDraft[];
  removedVariantIds: string[];
  operations: VariantSaveOperations;
}): Promise<VariantSaveResult> {
  const { productId, drafts, removedVariantIds, operations } = input;
  const failures: VariantSaveFailure[] = [];
  const imageFailures: VariantSaveFailure[] = [];
  const savedOrder: string[] = [];
  const deletedVariantIds: string[] = [];
  let defaultVariantId: string | null = null;
  let finalisationApplied = false;

  let optionId: string;
  try {
    const option = await operations.ensureFinishOption(productId);
    optionId = option.id;
  } catch (error) {
    failures.push({
      stage: 'finish-option',
      message: `The finish option could not be prepared: ${errorMessage(
        error,
        'unknown database error.'
      )}`,
    });
    return {
      failures,
      imageFailures,
      savedOrder,
      deletedVariantIds,
      defaultVariantId,
      finalisationApplied,
    };
  }

  for (const draft of drafts) {
    let savedValue: SavedOptionValue;
    try {
      savedValue = await operations.saveOptionValue({
        id: draft.optionValueId,
        optionId,
        finishPayload: draft.finishPayload,
        displayOrder: draft.displayOrder,
      });
    } catch (error) {
      failures.push({
        stage: 'finish-value',
        finishName: label(draft),
        message: `${label(draft)}: the finish value could not be saved. ${errorMessage(
          error,
          'Try again.'
        )}`,
      });
      continue;
    }

    let variantId = draft.id ?? '';
    let createdVariant = false;

    try {
      if (!variantId) {
        const created = await operations.createVariant({
          productId,
          rowValues: draft.rowValues,
          displayOrder: draft.displayOrder,
        });
        variantId = created.id;
        createdVariant = true;
      } else {
        await operations.updateVariant({
          variantId,
          rowValues: draft.rowValues,
          displayOrder: draft.displayOrder,
        });
      }

      await operations.linkVariantOption({
        variantId,
        optionId,
        optionValueId: savedValue.id,
      });
    } catch (error) {
      failures.push({
        stage: createdVariant ? 'variant-link' : 'variant',
        finishName: label(draft),
        message: `${label(draft)}: the variant could not be ${
          createdVariant ? 'linked to its finish' : 'updated'
        }. ${errorMessage(error, 'Try again.')}`,
      });

      if (createdVariant && variantId) {
        try {
          await operations.deleteVariant(variantId);
        } catch (rollbackError) {
          failures.push({
            stage: 'variant-rollback',
            finishName: label(draft),
            message: `${label(draft)}: the partly created variant could not be removed. ${errorMessage(
              rollbackError,
              'Remove it manually before retrying.'
            )}`,
          });
        }
      }

      if (savedValue.created) {
        try {
          await operations.deleteOptionValue(savedValue.id);
        } catch (rollbackError) {
          failures.push({
            stage: 'finish-value-rollback',
            finishName: label(draft),
            message: `${label(draft)}: the unused finish value could not be removed. ${errorMessage(
              rollbackError,
              'Remove it manually before retrying.'
            )}`,
          });
        }
      }
      continue;
    }

    try {
      const imageResult = await operations.syncImages({
        variantId,
        desired: draft.images,
        baseline: draft.baselineImages,
        removedIds: draft.removedImageIds,
      });
      imageResult.failures.forEach((failure) => {
        imageFailures.push({
          stage: 'images',
          finishName: label(draft),
          message: `${label(draft)}: ${failure.message}`,
        });
      });
    } catch (error) {
      imageFailures.push({
        stage: 'images',
        finishName: label(draft),
        message: `${label(draft)}: the finish images could not be saved. ${errorMessage(
          error,
          'Try again.'
        )}`,
      });
    }

    savedOrder.push(variantId);
    if (draft.isDefault) defaultVariantId = variantId;
  }

  if (failures.length > 0) {
    failures.push({
      stage: 'finalisation',
      message:
        'Some finishes were saved, but ordering, the default finish and finish deletion were not applied because an earlier step failed. Reopen the product and retry.',
    });
    return {
      failures,
      imageFailures,
      savedOrder,
      deletedVariantIds,
      defaultVariantId,
      finalisationApplied,
    };
  }

  try {
    await operations.reorderVariants(productId, savedOrder);
  } catch (error) {
    failures.push({
      stage: 'reorder',
      message: `The finish order could not be saved. ${errorMessage(
        error,
        'Reopen the product and retry.'
      )}`,
    });
  }

  const desiredDefaultId = defaultVariantId ?? savedOrder[0] ?? null;
  if (desiredDefaultId) {
    try {
      await operations.setDefaultVariant(productId, desiredDefaultId);
      defaultVariantId = desiredDefaultId;
    } catch (error) {
      failures.push({
        stage: 'default',
        message: `The default finish could not be set. ${errorMessage(
          error,
          'Reopen the product and retry.'
        )}`,
      });
    }
  }

  for (const variantId of removedVariantIds) {
    try {
      await operations.deleteVariant(variantId);
      deletedVariantIds.push(variantId);
    } catch (error) {
      failures.push({
        stage: 'delete',
        message: `A removed finish could not be deleted. ${errorMessage(
          error,
          'Reopen the product and retry.'
        )}`,
      });
    }
  }

  finalisationApplied = failures.length === 0;

  return {
    failures,
    imageFailures,
    savedOrder,
    deletedVariantIds,
    defaultVariantId,
    finalisationApplied,
  };
}
