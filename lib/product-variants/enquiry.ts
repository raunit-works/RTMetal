import type { ProductVariant } from '@/lib/types';

type EnquiryVariant = Pick<ProductVariant, 'finishName' | 'sku'>;

/**
 * Builds the WhatsApp enquiry message for a product, optionally including the
 * selected finish and its SKU. Kept as a pure function so the variant-aware
 * enquiry text can be unit-tested independently of WhatsApp verification.
 */
export function buildProductEnquiryMessage(
  productName: string,
  variant?: EnquiryVariant | null
): string {
  const finishName = variant?.finishName?.trim() ?? '';
  const sku = variant?.sku?.trim() ?? '';

  const details: string[] = [];
  if (finishName) details.push(`Finish: ${finishName}`);
  if (sku) details.push(`SKU: ${sku}`);

  const base = `Hello RTMETALCOATING, I am interested in ${productName}`;
  if (details.length === 0) {
    return `${base}. Please share more details.`;
  }
  return `${base}, ${details.join(', ')}. Please share more details.`;
}

export type EnquiryDivision = 'home_decor' | 'metal_services';

/**
 * Turns a category slug into a readable label without inventing a new name.
 * Values that are already human-readable are kept as supplied.
 */
export function formatCategoryLabel(category: string): string {
  const trimmed = category.trim();
  if (!trimmed) return '';
  if (/\s/.test(trimmed)) return trimmed;
  return trimmed
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export interface RichProductEnquiryInput {
  division: EnquiryDivision;
  productName: string;
  category?: string | null;
  variant?: EnquiryVariant | null;
  productUrl?: string | null;
}

/**
 * Structured, variant-aware WhatsApp message used by all public product
 * enquiry actions. It includes the actual product, category, selected finish,
 * selected SKU and product link, and omits finish/SKU when no variant applies.
 */
export function buildRichProductEnquiryMessage({
  division,
  productName,
  category,
  variant,
  productUrl,
}: RichProductEnquiryInput): string {
  const finishName = variant?.finishName?.trim() ?? '';
  const sku = variant?.sku?.trim() ?? '';
  const categoryLabel = formatCategoryLabel(category ?? '');
  const productLabel = division === 'home_decor' ? 'Home Decor' : 'Metal';

  const lines = [
    `Hello, I am interested in the following ${productLabel} product:`,
    '',
    `Product: ${productName}`,
  ];

  if (categoryLabel) lines.push(`Category: ${categoryLabel}`);
  if (finishName) lines.push(`Selected Finish: ${finishName}`);
  if (sku) lines.push(`SKU: ${sku}`);
  if (productUrl) lines.push(`Product Link: ${productUrl}`);

  lines.push('', 'Please share the details and pricing.');
  return lines.join('\n');
}

export interface ProductEnquiryHrefInput {
  division: EnquiryDivision;
  productId: string;
  productName: string;
  variantId?: string | null;
  finishName?: string | null;
  sku?: string | null;
}

/**
 * Builds the link to the working enquiry form for a product/finish enquiry.
 * The contact form reads these query parameters and pre-fills the message,
 * product reference and finish reference.
 */
export function buildProductEnquiryHref({
  division,
  productId,
  productName,
  variantId,
  finishName,
  sku,
}: ProductEnquiryHrefInput): string {
  const params = new URLSearchParams();
  params.set('product', productId);
  params.set('productName', productName);
  if (variantId) params.set('variant', variantId);
  if (finishName) params.set('finish', finishName);
  if (sku) params.set('sku', sku);

  if (division === 'home_decor') {
    return `/?${params.toString()}#contact`;
  }
  return `/metal-coating?${params.toString()}#quote`;
}
