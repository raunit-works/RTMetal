import { test, expect } from '@playwright/test';
import {
  saveProductVariants,
  type VariantSaveDraft,
  type VariantSaveOperations,
} from '@/lib/product-variants/save-orchestrator';

const PRODUCT_ID = '00000000-0000-4000-8000-000000000001';

function silverDraft(overrides: Partial<VariantSaveDraft> = {}): VariantSaveDraft {
  return {
    key: 'silver',
    finishName: 'Silver',
    finishPayload: {
      name: 'Silver',
      swatchType: 'solid',
      swatchColor: '#c9a96e',
      swatchColorSecondary: undefined,
      swatchImageUrl: undefined,
    },
    rowValues: {
      sku: 'RTM-ASHOK-SLV',
      stockQuantity: 4,
      availability: 'in_stock',
      isActive: true,
      isDefault: true,
    },
    displayOrder: 1,
    isDefault: true,
    images: [],
    baselineImages: [],
    removedImageIds: [],
    ...overrides,
  };
}

function operations(
  overrides: Partial<VariantSaveOperations> = {}
): VariantSaveOperations {
  return {
    ensureFinishOption: async () => ({ id: 'option-1' }),
    saveOptionValue: async () => ({ id: 'value-1', created: true }),
    createVariant: async () => ({ id: 'variant-1' }),
    updateVariant: async () => undefined,
    linkVariantOption: async () => undefined,
    deleteVariant: async () => undefined,
    deleteOptionValue: async () => undefined,
    syncImages: async () => ({ failures: [] }),
    reorderVariants: async () => undefined,
    setDefaultVariant: async () => undefined,
    ...overrides,
  };
}

test.describe('product variant save orchestration', () => {
  test('saves Silver and finalises ordering and the default finish', async () => {
    const reordered: string[][] = [];
    const defaults: string[] = [];

    const result = await saveProductVariants({
      productId: PRODUCT_ID,
      drafts: [silverDraft()],
      removedVariantIds: [],
      operations: operations({
        reorderVariants: async (_productId, ids) => {
          reordered.push(ids);
        },
        setDefaultVariant: async (_productId, id) => {
          defaults.push(id);
        },
      }),
    });

    expect(result.failures).toEqual([]);
    expect(result.imageFailures).toEqual([]);
    expect(result.savedOrder).toEqual(['variant-1']);
    expect(result.defaultVariantId).toBe('variant-1');
    expect(result.finalisationApplied).toBe(true);
    expect(reordered).toEqual([['variant-1']]);
    expect(defaults).toEqual(['variant-1']);
  });

  test('rolls back a created variant when option linking fails', async () => {
    const deletedVariants: string[] = [];
    const deletedValues: string[] = [];
    let reordered = false;
    let defaulted = false;

    const result = await saveProductVariants({
      productId: PRODUCT_ID,
      drafts: [silverDraft()],
      removedVariantIds: [],
      operations: operations({
        linkVariantOption: async () => {
          throw new Error('link rejected');
        },
        deleteVariant: async (id) => {
          deletedVariants.push(id);
        },
        deleteOptionValue: async (id) => {
          deletedValues.push(id);
        },
        reorderVariants: async () => {
          reordered = true;
        },
        setDefaultVariant: async () => {
          defaulted = true;
        },
      }),
    });

    expect(result.failures.map((failure) => failure.stage)).toEqual([
      'variant-link',
      'finalisation',
    ]);
    expect(result.failures[0].message).toContain('Silver');
    expect(result.finalisationApplied).toBe(false);
    expect(deletedVariants).toEqual(['variant-1']);
    expect(deletedValues).toEqual(['value-1']);
    expect(reordered).toBe(false);
    expect(defaulted).toBe(false);
  });

  test('does not finalise when the finish value cannot be saved', async () => {
    const result = await saveProductVariants({
      productId: PRODUCT_ID,
      drafts: [silverDraft()],
      removedVariantIds: [],
      operations: operations({
        saveOptionValue: async () => {
          throw new Error('value rejected');
        },
        reorderVariants: async () => {
          throw new Error('must not run');
        },
      }),
    });

    expect(result.failures.map((failure) => failure.stage)).toEqual([
      'finish-value',
      'finalisation',
    ]);
    expect(result.finalisationApplied).toBe(false);
  });

  test('reports image failures while still finalising the finish save', async () => {
    const result = await saveProductVariants({
      productId: PRODUCT_ID,
      drafts: [silverDraft()],
      removedVariantIds: [],
      operations: operations({
        syncImages: async () => ({
          failures: [{ message: 'image row rejected' }],
        }),
      }),
    });

    expect(result.failures).toEqual([]);
    expect(result.imageFailures).toHaveLength(1);
    expect(result.imageFailures[0].message).toContain('Silver');
    expect(result.finalisationApplied).toBe(true);
  });

  test('reports reorder failure instead of a complete save', async () => {
    const result = await saveProductVariants({
      productId: PRODUCT_ID,
      drafts: [silverDraft()],
      removedVariantIds: [],
      operations: operations({
        reorderVariants: async () => {
          throw new Error('reorder rejected');
        },
      }),
    });

    expect(result.failures.map((failure) => failure.stage)).toEqual(['reorder']);
    expect(result.finalisationApplied).toBe(false);
  });

  test('reports default selection failure instead of a complete save', async () => {
    const result = await saveProductVariants({
      productId: PRODUCT_ID,
      drafts: [silverDraft()],
      removedVariantIds: [],
      operations: operations({
        setDefaultVariant: async () => {
          throw new Error('default rejected');
        },
      }),
    });

    expect(result.failures.map((failure) => failure.stage)).toEqual(['default']);
    expect(result.finalisationApplied).toBe(false);
  });

  test('reports deletion failure instead of a complete save', async () => {
    const result = await saveProductVariants({
      productId: PRODUCT_ID,
      drafts: [silverDraft()],
      removedVariantIds: ['old-variant'],
      operations: operations({
        deleteVariant: async () => {
          throw new Error('delete rejected');
        },
      }),
    });

    expect(result.failures.map((failure) => failure.stage)).toEqual(['delete']);
    expect(result.finalisationApplied).toBe(false);
  });
});
