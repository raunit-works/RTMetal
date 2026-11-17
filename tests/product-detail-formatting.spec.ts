import { expect, test } from '@playwright/test';
import { normalizeProductFeatures } from '@/lib/product-details/features';

test.describe('product detail feature formatting', () => {
  test('splits a legacy newline-separated feature string into separate rows', () => {
    expect(
      normalizeProductFeatures([
        'Seated dog design\nGrey and white colour detailing\nDecorative shelf or tabletop piece',
      ])
    ).toEqual([
      'Seated dog design',
      'Grey and white colour detailing',
      'Decorative shelf or tabletop piece',
    ]);
  });

  test('keeps a properly stored feature array intact', () => {
    expect(
      normalizeProductFeatures([
        'Seated dog design',
        'Grey and white colour detailing',
        'Decorative shelf or tabletop piece',
      ])
    ).toEqual([
      'Seated dog design',
      'Grey and white colour detailing',
      'Decorative shelf or tabletop piece',
    ]);
  });

  test('preserves commas and spaces inside one feature sentence', () => {
    expect(
      normalizeProductFeatures([
        'Hand-finished in grey, white and warm metallic tones',
      ])
    ).toEqual(['Hand-finished in grey, white and warm metallic tones']);
  });

  test('supports a plain multiline string and CRLF line endings', () => {
    expect(
      normalizeProductFeatures('First feature\r\n\r\nSecond feature\r\n')
    ).toEqual(['First feature', 'Second feature']);
  });

  test('handles empty and missing values safely', () => {
    expect(normalizeProductFeatures(null)).toEqual([]);
    expect(normalizeProductFeatures(undefined)).toEqual([]);
    expect(normalizeProductFeatures(['', '   '])).toEqual([]);
  });
});
