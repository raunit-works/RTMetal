'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProductVariantContext } from '@/components/products/product-variant-provider';
import { WhatsAppEnquiryButton } from '@/components/enquiry/whatsapp-enquiry-button';
import {
  buildProductEnquiryHref,
  type EnquiryDivision,
} from '@/lib/product-variants/enquiry';

type Division = EnquiryDivision;

interface EnquiryButtonProps {
  division: Division;
  label?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
}

function buildQuoteHref(
  division: Division,
  productId: string,
  productName: string,
  variantId?: string,
  finishName?: string,
  sku?: string
) {
  return buildProductEnquiryHref({
    division,
    productId,
    productName,
    variantId,
    finishName,
    sku,
  });
}

export function VariantWhatsAppButton({
  division,
  label = 'Enquire About Product',
  className,
  size,
  showIcon = false,
}: EnquiryButtonProps) {
  const { enquiryMessage, isUnavailable } = useProductVariantContext();
  const buttonLabel = isUnavailable ? 'Ask About Availability' : label;

  return (
    <WhatsAppEnquiryButton
      mode={division}
      message={enquiryMessage}
      label={buttonLabel}
      size={size}
      showIcon={showIcon}
      className={`bg-[#25D366] text-ink hover:bg-[#25D366]/90 ${className ?? ''}`}
      ariaLabel={buttonLabel}
    />
  );
}

export function VariantQuoteButton({
  division,
  className,
  size = 'lg',
}: {
  division: Division;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}) {
  const { product, selectedVariant, selectedFinishName } =
    useProductVariantContext();

  const href = buildQuoteHref(
    division,
    product.id,
    product.name,
    selectedVariant?.id,
    selectedFinishName,
    selectedVariant?.sku
  );

  return (
    <Button asChild size={size} className={className}>
      <Link href={href}>
        Request a Quote
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  );
}
