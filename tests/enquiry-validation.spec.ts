import { expect, test } from '@playwright/test';
import { validateEnquiryIdentity } from '@/lib/enquiry/validation';

const name = 'Test Customer';
const phone = '+91 98765 43210';
const email = 'test.customer@example.com';

test.describe('enquiry identity validation', () => {
  const cases: Array<{
    label: string;
    input: { name?: string; phone?: string; email?: string };
    valid: boolean;
    invalidField?: 'name' | 'phone' | 'email';
  }> = [
    {
      label: 'missing name is rejected',
      input: { phone, email: '' },
      valid: false,
      invalidField: 'name',
    },
    {
      label: 'missing mobile is rejected',
      input: { name, email: '' },
      valid: false,
      invalidField: 'phone',
    },
    {
      label: 'blank email is accepted',
      input: { name, phone, email: '' },
      valid: true,
    },
    {
      label: 'valid email is accepted',
      input: { name, phone, email },
      valid: true,
    },
    {
      label: 'invalid provided email is rejected',
      input: { name, phone, email: 'not-an-email' },
      valid: false,
      invalidField: 'email',
    },
    {
      label: 'whitespace-only name is rejected',
      input: { name: '   ', phone, email: '' },
      valid: false,
      invalidField: 'name',
    },
    {
      label: 'whitespace-only mobile is rejected',
      input: { name, phone: '   ', email: '' },
      valid: false,
      invalidField: 'phone',
    },
  ];

  for (const testCase of cases) {
    test(testCase.label, () => {
      const result = validateEnquiryIdentity(testCase.input);
      expect(result.isValid).toBe(testCase.valid);
      if (testCase.invalidField) {
        expect(result.errors[testCase.invalidField]).toBeTruthy();
      }
    });
  }

  test('blank email is normalised to null and values are trimmed', () => {
    const result = validateEnquiryIdentity({
      name: `  ${name}  `,
      phone: `  ${phone}  `,
      email: '   ',
    });
    expect(result.isValid).toBe(true);
    expect(result.name).toBe(name);
    expect(result.phone).toBe(phone);
    expect(result.email).toBeNull();
  });

  test('international phone formats are accepted', () => {
    for (const value of ['+1 (555) 123-4567', '+44 20 7946 0958', '+91-98765-43210']) {
      const result = validateEnquiryIdentity({ name, phone: value, email: '' });
      expect(result.errors.phone).toBeUndefined();
    }
  });
});
