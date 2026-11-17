import { test, expect } from '@playwright/test';
import {
  DEFAULT_SWATCH_COLOR,
  toFinishOptionPayload,
  toVariantRowValues,
  validateVariantDrafts,
  type VariantDraftInput,
} from '@/lib/product-variants/variant-drafts';

function draft(overrides: Partial<VariantDraftInput> = {}): VariantDraftInput {
  return {
    key: overrides.key ?? 'draft-1',
    finishName: 'Gold',
    swatchType: 'solid',
    swatchColor1: DEFAULT_SWATCH_COLOR,
    swatchColor2: '',
    swatchImageUrl: '',
    sku: '',
    stockQuantity: '',
    availability: 'in_stock',
    isActive: true,
    isDefault: true,
    ...overrides,
  };
}

test.describe('product variant draft validation', () => {
  test('accepts a visible Silver finish and keeps it in the save payload', () => {
    const silver = draft({
      key: 'silver',
      finishName: 'Silver',
      sku: 'RTM-ASHOK-SLV',
      stockQuantity: '4',
    });

    const result = validateVariantDrafts([silver]);

    expect(result.banner).toBeNull();
    expect(result.fields).toEqual([]);

    const payload = toFinishOptionPayload(silver);
    expect(payload.name).toBe('Silver');
    expect(payload.name.trim()).not.toBe('');

    const row = toVariantRowValues(silver);
    expect(row.sku).toBe('RTM-ASHOK-SLV');
    expect(row.stockQuantity).toBe(4);
  });

  test('rejects an empty finish name', () => {
    const result = validateVariantDrafts([draft({ finishName: '' })]);

    expect(result.banner).toContain('enter a finish name');
    expect(result.fields).toEqual([
      expect.objectContaining({ key: 'draft-1', field: 'finishName' }),
    ]);
  });

  test('rejects a whitespace-only finish name', () => {
    const result = validateVariantDrafts([draft({ finishName: '   ' })]);

    expect(result.banner).toContain('enter a finish name');
    expect(result.fields[0]?.field).toBe('finishName');
  });

  test('rejects duplicate finish names regardless of case and whitespace', () => {
    const result = validateVariantDrafts([
      draft({ key: 'gold', finishName: 'Gold' }),
      draft({ key: 'gold-copy', finishName: '  gOlD  ', isDefault: false }),
    ]);

    expect(result.banner).toContain('used by another finish');
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0]?.key).toBe('gold-copy');
  });

  test('accepts zero stock and rejects negative or fractional stock', () => {
    expect(validateVariantDrafts([draft({ stockQuantity: '0' })]).fields).toEqual(
      []
    );

    expect(
      validateVariantDrafts([draft({ stockQuantity: '-1' })]).fields[0]?.field
    ).toBe('stockQuantity');

    expect(
      validateVariantDrafts([draft({ stockQuantity: '1.5' })]).fields[0]?.field
    ).toBe('stockQuantity');
  });

  test('rejects duplicate SKUs case-insensitively', () => {
    const result = validateVariantDrafts([
      draft({ key: 'a', finishName: 'Gold', sku: 'RTM-001' }),
      draft({
        key: 'b',
        finishName: 'Silver',
        sku: ' rtm-001 ',
        isDefault: false,
      }),
    ]);

    expect(result.fields[0]?.field).toBe('sku');
    expect(result.fields[0]?.key).toBe('b');
  });

  test('rejects a default finish that is inactive', () => {
    const result = validateVariantDrafts([
      draft({ isActive: false, isDefault: true }),
    ]);

    expect(result.fields[0]?.message).toContain('default finish must be active');
  });

  test('rejects invalid swatch colours and incomplete dual swatches', () => {
    const invalidSolid = validateVariantDrafts([
      draft({ swatchColor1: 'gold' }),
    ]);
    expect(invalidSolid.fields[0]?.field).toBe('swatchColor1');

    const incompleteDual = validateVariantDrafts([
      draft({ swatchType: 'dual', swatchColor1: '#C9A96E', swatchColor2: '' }),
    ]);
    expect(incompleteDual.fields[0]?.field).toBe('swatchColor2');
  });

  test('requires a swatch image when the image swatch type is selected', () => {
    const result = validateVariantDrafts([
      draft({ swatchType: 'image', swatchImageUrl: '   ' }),
    ]);

    expect(result.fields[0]?.field).toBe('swatchImageUrl');
  });

  test('trims the finish name and normalises the saved colour', () => {
    const payload = toFinishOptionPayload(
      draft({ finishName: '  Antique Bronze  ', swatchColor1: '  #c9a96e  ' })
    );

    expect(payload.name).toBe('Antique Bronze');
    expect(payload.swatchColor).toBe('#c9a96e');
  });
});
