-- Migration: Product Options, Variants, Swatches and Variant Images
-- Date: 2026-11-12
-- Target: review before applying to staging. Not applied to production.
--
-- Additive only. Existing products, product_images, categories, services and
-- enquiry rows are neither modified nor deleted by this migration.
--
-- Dependencies (must already exist before this migration):
--   * public.products              (20260824000000_create_foundation_tables.sql)
--   * public.is_admin()            (20260827000001_create_is_admin_function.sql)
--
-- Storage dependency: variant photographs reuse the existing public
-- `catalog-images` bucket and its admin-only write policies. No bucket or
-- storage policy is created or altered here.
--
-- Transaction boundary: intentionally no BEGIN/COMMIT. The Supabase migration
-- runner owns transaction handling. Every statement is idempotent so a
-- partially applied run can be re-executed safely.
--
-- Rollback plan (only if explicitly approved):
--   1. DROP TABLE IF EXISTS public.product_variant_images;
--   2. DROP TABLE IF EXISTS public.product_variant_options;
--   3. DROP TABLE IF EXISTS public.product_variants;
--   4. DROP TABLE IF EXISTS public.product_option_values;
--   5. DROP TABLE IF EXISTS public.product_options;
--   6. DROP FUNCTION IF EXISTS public.touch_product_variant_updated_at() CASCADE;
--   7. DROP FUNCTION IF EXISTS public.ensure_single_default_product_variant() CASCADE;
--   8. DROP FUNCTION IF EXISTS public.validate_product_variant_option() CASCADE;
--
-- Publication rule: public RLS policies only expose active variants whose
-- parent product is published, and the option/value/media rows reachable from
-- those variants. An active variant can therefore never be publicly readable
-- while its parent product is unpublished.

-- ---------------------------------------------------------------------------
-- 1. OPTION DIMENSIONS (Finish now; Size or others can be added later)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_options_name_not_blank
        CHECK (length(btrim(name)) > 0),
    CONSTRAINT product_options_slug_format
        CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT product_options_product_slug_key
        UNIQUE (product_id, slug),
    CONSTRAINT product_options_id_product_key
        UNIQUE (id, product_id)
);

COMMENT ON TABLE public.product_options IS
    'One row per selectable dimension of a parent product. Finish is the only dimension created by the admin UI today.';
COMMENT ON COLUMN public.product_options.slug IS
    'Stable machine name for the dimension, for example finish.';

-- ---------------------------------------------------------------------------
-- 2. OPTION VALUES (Swatch configuration lives on the value, not the variant)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_option_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id UUID NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    swatch_type TEXT NOT NULL DEFAULT 'solid',
    swatch_color_1 TEXT,
    swatch_color_2 TEXT,
    swatch_image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_option_values_name_not_blank
        CHECK (length(btrim(name)) > 0),
    CONSTRAINT product_option_values_slug_format
        CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT product_option_values_swatch_type_check
        CHECK (swatch_type IN ('solid', 'dual', 'image')),
    CONSTRAINT product_option_values_solid_color_check
        CHECK (swatch_type <> 'solid' OR swatch_color_1 IS NOT NULL),
    CONSTRAINT product_option_values_dual_color_check
        CHECK (
            swatch_type <> 'dual'
            OR (swatch_color_1 IS NOT NULL AND swatch_color_2 IS NOT NULL)
        ),
    CONSTRAINT product_option_values_image_check
        CHECK (
            swatch_type <> 'image'
            OR (swatch_image_url IS NOT NULL AND length(btrim(swatch_image_url)) > 0)
        ),
    CONSTRAINT product_option_values_color_format_check
        CHECK (
            (swatch_color_1 IS NULL OR swatch_color_1 ~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$')
            AND (swatch_color_2 IS NULL OR swatch_color_2 ~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$')
        ),
    CONSTRAINT product_option_values_option_slug_key
        UNIQUE (option_id, slug),
    CONSTRAINT product_option_values_option_id_key
        UNIQUE (option_id, id)
);

COMMENT ON COLUMN public.product_option_values.swatch_type IS
    'solid = one colour, dual = two-colour split swatch, image = photographic thumbnail.';
COMMENT ON COLUMN public.product_option_values.swatch_color_1 IS
    'Primary hex colour for solid/dual swatches and the fallback for image swatches.';

-- ---------------------------------------------------------------------------
-- 3. VARIANTS (One stable child per parent product)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT,
    price NUMERIC(10, 2),
    stock_quantity INTEGER,
    availability TEXT NOT NULL DEFAULT 'in_stock',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_variants_sku_not_blank
        CHECK (sku IS NULL OR length(btrim(sku)) > 0),
    CONSTRAINT product_variants_price_check
        CHECK (price IS NULL OR price >= 0),
    CONSTRAINT product_variants_stock_check
        CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
    CONSTRAINT product_variants_availability_check
        CHECK (availability IN ('in_stock', 'made_to_order', 'out_of_stock')),
    CONSTRAINT product_variants_default_requires_active
        CHECK (NOT is_default OR is_active),
    CONSTRAINT product_variants_id_product_key
        UNIQUE (id, product_id)
);

COMMENT ON TABLE public.product_variants IS
    'Child records of an existing parent product. Legacy products without rows here continue to render and sell exactly as before.';
COMMENT ON COLUMN public.product_variants.price IS
    'Reserved for confirmed retail pricing. RT metals and quotation-only products keep this NULL; the current admin UI does not edit it.';
COMMENT ON COLUMN public.product_variants.stock_quantity IS
    'Optional stock count. NULL means no tracked stock.';

CREATE INDEX IF NOT EXISTS product_variants_product_order_idx
    ON public.product_variants(product_id, display_order, created_at, id);
CREATE INDEX IF NOT EXISTS product_variants_product_active_idx
    ON public.product_variants(product_id, is_active);

-- SKUs are globally unique when assigned. Case/whitespace-insensitive so two
-- admins cannot create "RTM-01" and " rtm-01 ".
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_sku_unique_idx
    ON public.product_variants (upper(btrim(sku)))
    WHERE sku IS NOT NULL AND btrim(sku) <> '';

-- At most one default variant per parent product.
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_one_default_idx
    ON public.product_variants (product_id)
    WHERE is_default;

-- ---------------------------------------------------------------------------
-- 4. VARIANT -> OPTION VALUE LINKS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variant_options (
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
    option_value_id UUID NOT NULL,
    PRIMARY KEY (variant_id, option_id),
    CONSTRAINT product_variant_options_value_fkey
        FOREIGN KEY (option_id, option_value_id)
        REFERENCES public.product_option_values(option_id, id)
        ON DELETE CASCADE,
    -- One variant cannot reuse the same finish value twice, and two variants
    -- cannot share the same option combination inside one product.
    CONSTRAINT product_variant_options_value_unique
        UNIQUE (option_id, option_value_id),
    CONSTRAINT product_variant_options_variant_value_unique
        UNIQUE (variant_id, option_value_id)
);

COMMENT ON TABLE public.product_variant_options IS
    'Maps each variant to one value per option dimension. The primary key prevents duplicate dimensions on a variant; the option/value unique constraint prevents duplicate option combinations within a product.';

CREATE INDEX IF NOT EXISTS product_variant_options_value_idx
    ON public.product_variant_options(option_value_id);

-- ---------------------------------------------------------------------------
-- 5. VARIANT IMAGES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variant_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_variant_images_url_not_blank
        CHECK (length(btrim(image_url)) > 0)
);

COMMENT ON TABLE public.product_variant_images IS
    'Variant-specific gallery. Deleting a variant removes only these rows; catalogue storage objects and parent product images are never deleted by this relationship.';

CREATE INDEX IF NOT EXISTS product_variant_images_variant_order_idx
    ON public.product_variant_images(variant_id, sort_order, created_at, id);
CREATE UNIQUE INDEX IF NOT EXISTS product_variant_images_unique_url_idx
    ON public.product_variant_images(variant_id, image_url);

-- ---------------------------------------------------------------------------
-- 6. TRIGGER HELPERS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_product_variant_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_product_variant_updated_at() FROM PUBLIC;

DROP TRIGGER IF EXISTS touch_product_options_updated_at ON public.product_options;
CREATE TRIGGER touch_product_options_updated_at
    BEFORE UPDATE ON public.product_options
    FOR EACH ROW EXECUTE FUNCTION public.touch_product_variant_updated_at();

DROP TRIGGER IF EXISTS touch_product_option_values_updated_at ON public.product_option_values;
CREATE TRIGGER touch_product_option_values_updated_at
    BEFORE UPDATE ON public.product_option_values
    FOR EACH ROW EXECUTE FUNCTION public.touch_product_variant_updated_at();

DROP TRIGGER IF EXISTS touch_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER touch_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.touch_product_variant_updated_at();

-- Default flag management + append-only display order.
CREATE OR REPLACE FUNCTION public.ensure_single_default_product_variant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND (NEW.display_order IS NULL OR NEW.display_order = 0) THEN
        PERFORM pg_advisory_xact_lock(
            hashtextextended('rt_product_variants_order:' || NEW.product_id::TEXT, 0)
        );
        SELECT COALESCE(MAX(pv.display_order), 0) + 1
        INTO NEW.display_order
        FROM public.product_variants pv
        WHERE pv.product_id = NEW.product_id;
    END IF;

    IF NEW.display_order IS NULL THEN
        NEW.display_order := 0;
    END IF;

    IF NEW.is_default THEN
        UPDATE public.product_variants
        SET is_default = FALSE,
            updated_at = NOW()
        WHERE product_id = NEW.product_id
          AND id <> NEW.id
          AND is_default;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_single_default_product_variant() FROM PUBLIC;

DROP TRIGGER IF EXISTS ensure_single_default_product_variant_trigger ON public.product_variants;
CREATE TRIGGER ensure_single_default_product_variant_trigger
    BEFORE INSERT OR UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_product_variant();

-- A variant's selected option value must belong to the same product and the
-- same dimension. The composite foreign key covers the dimension; this trigger
-- covers the parent product.
CREATE OR REPLACE FUNCTION public.validate_product_variant_option()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    variant_product UUID;
    option_product UUID;
BEGIN
    SELECT pv.product_id INTO variant_product
    FROM public.product_variants pv
    WHERE pv.id = NEW.variant_id;

    SELECT po.product_id INTO option_product
    FROM public.product_options po
    WHERE po.id = NEW.option_id;

    IF variant_product IS NULL OR option_product IS NULL THEN
        RAISE EXCEPTION 'Variant or product option no longer exists.'
            USING ERRCODE = '23503';
    END IF;

    IF variant_product <> option_product THEN
        RAISE EXCEPTION 'A variant option value must belong to an option of the same parent product.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_product_variant_option() FROM PUBLIC;

DROP TRIGGER IF EXISTS validate_product_variant_option_trigger ON public.product_variant_options;
CREATE TRIGGER validate_product_variant_option_trigger
    BEFORE INSERT OR UPDATE ON public.product_variant_options
    FOR EACH ROW EXECUTE FUNCTION public.validate_product_variant_option();

-- ---------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY AND PRIVILEGES
-- ---------------------------------------------------------------------------
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_images ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.product_options FROM PUBLIC;
REVOKE ALL ON TABLE public.product_option_values FROM PUBLIC;
REVOKE ALL ON TABLE public.product_variants FROM PUBLIC;
REVOKE ALL ON TABLE public.product_variant_options FROM PUBLIC;
REVOKE ALL ON TABLE public.product_variant_images FROM PUBLIC;

REVOKE ALL ON TABLE public.product_options FROM anon, authenticated;
REVOKE ALL ON TABLE public.product_option_values FROM anon, authenticated;
REVOKE ALL ON TABLE public.product_variants FROM anon, authenticated;
REVOKE ALL ON TABLE public.product_variant_options FROM anon, authenticated;
REVOKE ALL ON TABLE public.product_variant_images FROM anon, authenticated;

GRANT SELECT ON TABLE public.product_options TO anon, authenticated;
GRANT SELECT ON TABLE public.product_option_values TO anon, authenticated;
GRANT SELECT ON TABLE public.product_variants TO anon, authenticated;
GRANT SELECT ON TABLE public.product_variant_options TO anon, authenticated;
GRANT SELECT ON TABLE public.product_variant_images TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE public.product_options TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.product_option_values TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.product_variants TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.product_variant_options TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.product_variant_images TO authenticated;

-- Public read: only rows reachable from an active variant of a published product.
DROP POLICY IF EXISTS "product_options_public_select" ON public.product_options;
DROP POLICY IF EXISTS "product_options_admin_all" ON public.product_options;
CREATE POLICY "product_options_public_select"
    ON public.product_options FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_id AND p.is_published
        )
    );

DROP POLICY IF EXISTS "product_option_values_public_select" ON public.product_option_values;
CREATE POLICY "product_option_values_public_select"
    ON public.product_option_values FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.product_options po
            JOIN public.products p ON p.id = po.product_id
            WHERE po.id = option_id AND p.is_published
        )
    );

DROP POLICY IF EXISTS "product_variants_public_select" ON public.product_variants;
CREATE POLICY "product_variants_public_select"
    ON public.product_variants FOR SELECT
    TO anon, authenticated
    USING (
        is_active
        AND EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_id AND p.is_published
        )
    );

DROP POLICY IF EXISTS "product_variant_options_public_select" ON public.product_variant_options;
CREATE POLICY "product_variant_options_public_select"
    ON public.product_variant_options FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.product_variants pv
            JOIN public.products p ON p.id = pv.product_id
            WHERE pv.id = variant_id AND pv.is_active AND p.is_published
        )
    );

DROP POLICY IF EXISTS "product_variant_images_public_select" ON public.product_variant_images;
CREATE POLICY "product_variant_images_public_select"
    ON public.product_variant_images FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.product_variants pv
            JOIN public.products p ON p.id = pv.product_id
            WHERE pv.id = variant_id AND pv.is_active AND p.is_published
        )
    );

-- Admin read and write access for every variant table. SELECT policies are
-- additive with the public policies above, so admins also see drafts, inactive
-- variants and variants of unpublished products.
DROP POLICY IF EXISTS "product_options_admin_select" ON public.product_options;
CREATE POLICY "product_options_admin_select"
    ON public.product_options FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "product_option_values_admin_select" ON public.product_option_values;
CREATE POLICY "product_option_values_admin_select"
    ON public.product_option_values FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "product_variants_admin_select" ON public.product_variants;
CREATE POLICY "product_variants_admin_select"
    ON public.product_variants FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "product_variant_options_admin_select" ON public.product_variant_options;
CREATE POLICY "product_variant_options_admin_select"
    ON public.product_variant_options FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "product_variant_images_admin_select" ON public.product_variant_images;
CREATE POLICY "product_variant_images_admin_select"
    ON public.product_variant_images FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "product_options_admin_insert" ON public.product_options;
DROP POLICY IF EXISTS "product_options_admin_update" ON public.product_options;
DROP POLICY IF EXISTS "product_options_admin_delete" ON public.product_options;
CREATE POLICY "product_options_admin_insert"
    ON public.product_options FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "product_options_admin_update"
    ON public.product_options FOR UPDATE TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "product_options_admin_delete"
    ON public.product_options FOR DELETE TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "product_option_values_admin_insert" ON public.product_option_values;
DROP POLICY IF EXISTS "product_option_values_admin_update" ON public.product_option_values;
DROP POLICY IF EXISTS "product_option_values_admin_delete" ON public.product_option_values;
CREATE POLICY "product_option_values_admin_insert"
    ON public.product_option_values FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "product_option_values_admin_update"
    ON public.product_option_values FOR UPDATE TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "product_option_values_admin_delete"
    ON public.product_option_values FOR DELETE TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "product_variants_admin_insert" ON public.product_variants;
DROP POLICY IF EXISTS "product_variants_admin_update" ON public.product_variants;
DROP POLICY IF EXISTS "product_variants_admin_delete" ON public.product_variants;
CREATE POLICY "product_variants_admin_insert"
    ON public.product_variants FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "product_variants_admin_update"
    ON public.product_variants FOR UPDATE TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "product_variants_admin_delete"
    ON public.product_variants FOR DELETE TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "product_variant_options_admin_insert" ON public.product_variant_options;
DROP POLICY IF EXISTS "product_variant_options_admin_update" ON public.product_variant_options;
DROP POLICY IF EXISTS "product_variant_options_admin_delete" ON public.product_variant_options;
CREATE POLICY "product_variant_options_admin_insert"
    ON public.product_variant_options FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "product_variant_options_admin_update"
    ON public.product_variant_options FOR UPDATE TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "product_variant_options_admin_delete"
    ON public.product_variant_options FOR DELETE TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "product_variant_images_admin_insert" ON public.product_variant_images;
DROP POLICY IF EXISTS "product_variant_images_admin_update" ON public.product_variant_images;
DROP POLICY IF EXISTS "product_variant_images_admin_delete" ON public.product_variant_images;
CREATE POLICY "product_variant_images_admin_insert"
    ON public.product_variant_images FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "product_variant_images_admin_update"
    ON public.product_variant_images FOR UPDATE TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "product_variant_images_admin_delete"
    ON public.product_variant_images FOR DELETE TO authenticated
    USING (public.is_admin());

-- Ask PostgREST to refresh its schema cache so the new tables are visible
-- immediately after the migration commits.
NOTIFY pgrst, 'reload schema';
