import { test, expect } from '@playwright/test';
import { buildProductEnquiryMessage } from '@/lib/product-variants/enquiry';

test.describe('buildProductEnquiryMessage (variant-aware enquiry)', () => {
  test('product without a finish uses the base message', () => {
    expect(buildProductEnquiryMessage('Brass Wall Mirror')).toBe(
      'Hello RTMETALCOATING, I am interested in Brass Wall Mirror. Please share more details.'
    );
  });

  test('null or undefined variant falls back to the base message', () => {
    const expected =
      'Hello RTMETALCOATING, I am interested in Brass Wall Mirror. Please share more details.';
    expect(buildProductEnquiryMessage('Brass Wall Mirror', null)).toBe(expected);
    expect(buildProductEnquiryMessage('Brass Wall Mirror', undefined)).toBe(expected);
  });

  test('single active variant includes its finish', () => {
    expect(
      buildProductEnquiryMessage('Brass Wall Mirror', {
        finishName: 'Gold',
        sku: undefined,
      })
    ).toBe(
      'Hello RTMETALCOATING, I am interested in Brass Wall Mirror, Finish: Gold. Please share more details.'
    );
  });

  test('finish and SKU are both included', () => {
    expect(
      buildProductEnquiryMessage('Ashok Stambh', {
        finishName: 'Antique Bronze',
        sku: 'ASHOK-STG-BRZ',
      })
    ).toBe(
      'Hello RTMETALCOATING, I am interested in Ashok Stambh, Finish: Antique Bronze, SKU: ASHOK-STG-BRZ. Please share more details.'
    );
  });

  test('Gold, Silver and Antique Bronze each map to their own message', () => {
    const variants = [
      { finishName: 'Gold', sku: 'ASHOK-STG-GLD' },
      { finishName: 'Silver', sku: 'ASHOK-STG-SLV' },
      { finishName: 'Antique Bronze', sku: 'ASHOK-STG-BRZ' },
    ];

    const messages = variants.map((variant) =>
      buildProductEnquiryMessage('Ashok Stambh', variant)
    );

    expect(messages[0]).toContain('Finish: Gold, SKU: ASHOK-STG-GLD');
    expect(messages[1]).toContain('Finish: Silver, SKU: ASHOK-STG-SLV');
    expect(messages[2]).toContain(
      'Finish: Antique Bronze, SKU: ASHOK-STG-BRZ'
    );
    expect(new Set(messages).size).toBe(3);
  });

  test('whitespace-only finish and sku are ignored', () => {
    expect(
      buildProductEnquiryMessage('Brass Wall Mirror', {
        finishName: '   ',
        sku: '  ',
      })
    ).toBe(
      'Hello RTMETALCOATING, I am interested in Brass Wall Mirror. Please share more details.'
    );
  });

  test('SKU-only variant is included without a finish', () => {
    expect(
      buildProductEnquiryMessage('Brass Wall Mirror', {
        finishName: '',
        sku: 'MIR-001',
      })
    ).toBe(
      'Hello RTMETALCOATING, I am interested in Brass Wall Mirror, SKU: MIR-001. Please share more details.'
    );
  });
});
