-- Migration: Carry the selected product variant into enquiries
-- Date: 2026-11-12
-- Target: review before applying to staging. Not applied to production.
--
-- Additive and nullable. Existing enquiries and existing inserts that do not
-- reference a variant continue to work exactly as before.
--
-- Dependency: public.product_variants
--   (20261112000000_create_product_variants.sql)

ALTER TABLE public.inquiries
    ADD COLUMN IF NOT EXISTS variant_id UUID;

ALTER TABLE public.inquiries
    ADD COLUMN IF NOT EXISTS variant_name_snapshot TEXT;

ALTER TABLE public.inquiries
    ADD COLUMN IF NOT EXISTS variant_sku_snapshot TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'inquiries_variant_id_fkey'
          AND conrelid = 'public.inquiries'::regclass
    ) THEN
        ALTER TABLE public.inquiries
            ADD CONSTRAINT inquiries_variant_id_fkey
            FOREIGN KEY (variant_id)
            REFERENCES public.product_variants(id)
            ON DELETE SET NULL;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_inquiries_variant_id
    ON public.inquiries(variant_id);

COMMENT ON COLUMN public.inquiries.variant_id IS
    'Optional selected product variant. Server-validated against the referenced product before insert.';
COMMENT ON COLUMN public.inquiries.variant_name_snapshot IS
    'Server-side snapshot of the selected finish name at enquiry time.';
COMMENT ON COLUMN public.inquiries.variant_sku_snapshot IS
    'Server-side snapshot of the selected variant SKU at enquiry time.';

NOTIFY pgrst, 'reload schema';
