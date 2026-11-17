import { test, expect } from '@playwright/test';
import { normalizeImageSrc } from '@/lib/utils';

test.describe('normalizeImageSrc', () => {
  test('returns null for null or undefined input', () => {
    expect(normalizeImageSrc(null)).toBeNull();
    expect(normalizeImageSrc(undefined)).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(normalizeImageSrc('')).toBeNull();
    expect(normalizeImageSrc('   ')).toBeNull();
  });

  test('returns canonical plain HTTPS URL unchanged', () => {
    const url = 'https://rbucefvtkiohmaugvkyz.supabase.co/storage/v1/object/public/catalog-images/uploads/1794806565920-vrpjo4v.webp';
    expect(normalizeImageSrc(url)).toBe(url);
  });

  test('strips surrounding double quotes from a JSON-serialized URL', () => {
    const url = 'https://rbucefvtkiohmaugvkyz.supabase.co/storage/v1/object/public/catalog-images/uploads/image.webp';
    expect(normalizeImageSrc(`"${url}"`)).toBe(url);
  });

  test('strips surrounding single quotes from a JSON-serialized URL', () => {
    const url = 'https://rbucefvtkiohmaugvkyz.supabase.co/storage/v1/object/public/catalog-images/uploads/image.webp';
    expect(normalizeImageSrc(`'${url}'`)).toBe(url);
  });

  test('trims leading and trailing whitespace', () => {
    const url = 'https://example.com/image.webp';
    expect(normalizeImageSrc(`  ${url}  `)).toBe(url);
  });

  test('preserves query parameters in HTTPS URLs', () => {
    const url = 'https://example.com/image.webp?w=800&q=80';
    expect(normalizeImageSrc(url)).toBe(url);
  });

  test('returns null for empty quotes', () => {
    expect(normalizeImageSrc('""')).toBeNull();
    expect(normalizeImageSrc("''")).toBeNull();
  });

  test('rejects unsupported javascript: protocol', () => {
    expect(normalizeImageSrc('javascript:alert(1)')).toBeNull();
    expect(normalizeImageSrc('"javascript:alert(1)"')).toBeNull();
  });

  test('rejects unsupported data: protocol', () => {
    expect(normalizeImageSrc('data:image/png;base64,abc123')).toBeNull();
  });

  test('rejects malformed URL strings', () => {
    expect(normalizeImageSrc('not-a-url')).toBeNull();
    expect(normalizeImageSrc('just text')).toBeNull();
  });

  test('accepts internal application paths', () => {
    expect(normalizeImageSrc('/images/placeholder.svg')).toBe('/images/placeholder.svg');
    expect(normalizeImageSrc('/products/image.png')).toBe('/products/image.png');
  });

  test('URL already in canonical form is not altered', () => {
    const canonical = 'https://example.com/image.webp';
    expect(normalizeImageSrc(canonical)).toBe(canonical);
  });
});
