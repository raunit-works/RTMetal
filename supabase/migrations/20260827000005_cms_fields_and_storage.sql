-- Migration: Complete Admin CMS Field Coverage & Supabase Storage Bucket Setup
-- Date: 2026-08-27
-- Step: 4.12A Admin CMS Hardening

-- 1. ADD CMS COLUMNS TO PRODUCTS
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sub_category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color_finish TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'in_stock';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. ADD CMS COLUMNS TO SERVICES
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS process_steps JSONB DEFAULT '[]';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS applications TEXT[] DEFAULT '{}';

-- 3. ADD CMS COLUMNS TO CATEGORIES
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- 4. ADD CMS COLUMNS TO FAQS
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- 5. CREATE PRODUCT_IMAGES TABLE FOR MULTI-IMAGE GALLERY
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS & PRIVILEGES FOR PRODUCT_IMAGES
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_images TO authenticated;
GRANT SELECT ON TABLE public.product_images TO anon;

DROP POLICY IF EXISTS "product_images_public_select" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_insert" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_update" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_delete" ON public.product_images;

CREATE POLICY "product_images_public_select" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "product_images_admin_insert" ON public.product_images FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "product_images_admin_update" ON public.product_images FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "product_images_admin_delete" ON public.product_images FOR DELETE TO authenticated USING (public.is_admin());

-- 6. SUPABASE STORAGE BUCKET setup FOR CATALOG IMAGES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('catalog-images', 'catalog-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public Read Catalog Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Catalog Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Catalog Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Catalog Images" ON storage.objects;

CREATE POLICY "Public Read Catalog Images" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'catalog-images');

CREATE POLICY "Admin Upload Catalog Images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'catalog-images' AND public.is_admin());

CREATE POLICY "Admin Update Catalog Images" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'catalog-images' AND public.is_admin());

CREATE POLICY "Admin Delete Catalog Images" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'catalog-images' AND public.is_admin());
