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
