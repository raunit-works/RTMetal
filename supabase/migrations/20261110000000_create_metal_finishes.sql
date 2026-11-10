-- Migration: Create Metal Finishes management catalogue
-- Date: 2026-11-10
-- Target: review before applying to staging
--
-- Additive only. No existing catalogue, CMS, media or relationship rows are
-- modified or deleted by this migration.
--
-- Dependencies (must already exist before this migration):
--   * public.is_admin() (20260827000001_create_is_admin_function.sql)
--
-- Storage dependency: this module reuses the existing public `catalog-images`
-- bucket and its admin-only insert/update/delete policies from
-- 20260827000005_cms_fields_and_storage.sql. It does not create or alter any
-- storage bucket, object or storage policy.
--
-- Transaction boundary:
--   This file intentionally contains no BEGIN/COMMIT. Apply it through the
--   Supabase migration runner, which owns transaction handling. Every statement
--   is idempotent so a partially applied run can be safely re-executed.
--
-- Seed policy:
--   Only the 12 finishes already published on the public Metal Finishes section
--   are inserted. `ON CONFLICT (finish_code) DO NOTHING` keeps the seed
--   idempotent and never overwrites later admin edits. No asset-review images
--   are imported and no additional finishes are created.
--
-- Rollback plan (only if explicitly approved):
--   1. DROP FUNCTION IF EXISTS public.set_metal_finish_defaults() CASCADE;
--   2. DROP TABLE IF EXISTS public.metal_finishes;
--   3. DROP SEQUENCE IF EXISTS public.metal_finish_code_seq;

-- ---------------------------------------------------------------------------
-- 1. CODE ALLOCATION SEQUENCE
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.metal_finish_code_seq;

-- ---------------------------------------------------------------------------
-- 2. METAL FINISHES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metal_finishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finish_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    appearance TEXT,
    applications TEXT,
    short_description TEXT,
    main_image_url TEXT,
    additional_images TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft',
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT metal_finishes_status_check
        CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT metal_finishes_name_not_blank_check
        CHECK (length(btrim(name)) > 0),
    CONSTRAINT metal_finishes_code_not_blank_check
        CHECK (length(btrim(finish_code)) > 0),
    CONSTRAINT metal_finishes_published_media_check
        CHECK (status <> 'published' OR main_image_url IS NOT NULL)
);

COMMENT ON TABLE public.metal_finishes IS
    'Admin-managed metal finish references shown in the public Metal Finishes carousel.';
COMMENT ON COLUMN public.metal_finishes.finish_code IS
    'Stable public FIN-XXXX reference. Auto-allocated on insert when left blank.';
COMMENT ON COLUMN public.metal_finishes.display_order IS
    'Stable carousel order. New records are appended after the current maximum.';

CREATE INDEX IF NOT EXISTS metal_finishes_status_idx
    ON public.metal_finishes(status);
CREATE INDEX IF NOT EXISTS metal_finishes_published_order_idx
    ON public.metal_finishes(status, display_order, created_at, id);
CREATE INDEX IF NOT EXISTS metal_finishes_created_at_idx
    ON public.metal_finishes(created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. DEFAULTS (CODE + APPEND-ONLY DISPLAY ORDER)
-- ---------------------------------------------------------------------------
-- The advisory lock serializes concurrent inserts so two admins cannot receive
-- the same display_order value. Codes come from a sequence so they are unique
-- even under concurrent writes.
CREATE OR REPLACE FUNCTION public.set_metal_finish_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.finish_code IS NULL OR btrim(NEW.finish_code) = '' THEN
        NEW.finish_code := 'FIN-' || lpad(
            nextval('public.metal_finish_code_seq')::TEXT,
            4,
            '0'
        );
    ELSE
        NEW.finish_code := upper(btrim(NEW.finish_code));
    END IF;

    IF TG_OP = 'INSERT' AND (NEW.display_order IS NULL OR NEW.display_order = 0) THEN
        PERFORM pg_advisory_xact_lock(
            hashtextextended('rt_metal_finishes_display_order', 0)
        );
        SELECT COALESCE(MAX(mf.display_order), 0) + 1
        INTO NEW.display_order
        FROM public.metal_finishes mf;
    END IF;

    IF NEW.display_order IS NULL THEN
        NEW.display_order := 0;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

-- Trigger functions are invoked by the trigger manager; restricting direct
-- execution keeps the helper from being callable as a normal RPC.
REVOKE ALL ON FUNCTION public.set_metal_finish_defaults() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_metal_finish_defaults() TO authenticated, service_role;

DROP TRIGGER IF EXISTS set_metal_finish_defaults_trigger ON public.metal_finishes;
CREATE TRIGGER set_metal_finish_defaults_trigger
    BEFORE INSERT OR UPDATE ON public.metal_finishes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_metal_finish_defaults();

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY AND PRIVILEGES
-- ---------------------------------------------------------------------------
ALTER TABLE public.metal_finishes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.metal_finishes FROM PUBLIC;
REVOKE ALL ON TABLE public.metal_finishes FROM anon, authenticated;
GRANT SELECT ON TABLE public.metal_finishes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.metal_finishes TO authenticated;

DROP POLICY IF EXISTS "metal_finishes_public_select" ON public.metal_finishes;
DROP POLICY IF EXISTS "metal_finishes_admin_select" ON public.metal_finishes;
DROP POLICY IF EXISTS "metal_finishes_admin_insert" ON public.metal_finishes;
DROP POLICY IF EXISTS "metal_finishes_admin_update" ON public.metal_finishes;
DROP POLICY IF EXISTS "metal_finishes_admin_delete" ON public.metal_finishes;

CREATE POLICY "metal_finishes_public_select"
    ON public.metal_finishes
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

CREATE POLICY "metal_finishes_admin_select"
    ON public.metal_finishes
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "metal_finishes_admin_insert"
    ON public.metal_finishes
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "metal_finishes_admin_update"
    ON public.metal_finishes
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "metal_finishes_admin_delete"
    ON public.metal_finishes
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. IDEMPOTENT SEED — EXACTLY THE 12 PUBLIC FINISHES
-- ---------------------------------------------------------------------------
INSERT INTO public.metal_finishes (
    finish_code,
    name,
    appearance,
    applications,
    main_image_url,
    status,
    display_order
) VALUES
    ('FIN-0003', 'Brown Antique', 'Antique appearance',
     'Confirm material and intended use on enquiry.',
     '/images/metal-coating/finishes/FIN-0003.jpeg', 'published', 1),
    ('FIN-0004', 'Rustic Iron Finish', 'Rustic appearance',
     'Confirm material and intended use on enquiry.',
     '/images/metal-coating/finishes/FIN-0004.jpeg', 'published', 2),
    ('FIN-0013', 'Deep Blue Finish', 'Decorative finish reference',
     'Confirm material and intended use on enquiry.',
     '/images/metal-coating/finishes/FIN-0013.jpeg', 'published', 3),
    ('FIN-0041', 'Rose Gold Hairline', 'Hairline appearance',
     'Confirm material and intended use on enquiry.',
     '/images/metal-coating/finishes/FIN-0041.jpeg', 'published', 4),
    ('FIN-0044', 'Rose Gold Mirror', 'Reflective appearance',
     'Confirm material and intended use on enquiry.',
     '/images/metal-coating/finishes/FIN-0044.jpeg', 'published', 5),
    ('FIN-0045', 'Graphite Mirror', 'Reflective appearance',
     'Confirm material and intended use on enquiry.',
     '/images/metal-coating/finishes/FIN-0045.jpeg', 'published', 6),
    ('FIN-0046', 'Satin Brass', 'Satin appearance',
     'Confirm material and intended use on enquiry.',
     '/images/metal-coating/finishes/FIN-0046.jpeg', 'published', 7),
    ('FIN-0053', 'Gold Mirror', 'Reflective appearance',
     'Confirm material and intended use on enquiry.',
     '/images/metal-coating/finishes/FIN-0053.jpeg', 'published', 8),
    ('FIN-0054', 'Graphite Hairline', 'Hairline appearance',
     'Confirm material and intended use on enquiry.',
     '/images/metal-coating/finishes/FIN-0054.jpeg', 'published', 9),
    ('FIN-0058', 'Gold Matte', 'Matte appearance',
     'Confirm material and intended use on enquiry.',
     '/images/metal-coating/finishes/FIN-0058.jpeg', 'published', 10),
    ('FIN-0060', 'Champagne Mirror', 'Reflective appearance',
     'Confirm material and intended use on enquiry.',
     '/images/metal-coating/finishes/FIN-0060.jpeg', 'published', 11),
    ('FIN-0063', 'Copper Antique Glossy', 'Antique appearance',
     'Confirm material and intended use on enquiry.',
     '/images/metal-coating/finishes/FIN-0063.jpeg', 'published', 12)
ON CONFLICT (finish_code) DO NOTHING;

-- Keep future auto-allocated codes above every seeded/known code so a new
-- finish never collides with an existing FIN reference.
SELECT setval(
    'public.metal_finish_code_seq',
    GREATEST(
        65,
        COALESCE(
            (
                SELECT MAX(NULLIF(regexp_replace(finish_code, '\D', '', 'g'), '')::BIGINT)
                FROM public.metal_finishes
            ),
            0
        )
    ),
    true
);

-- Ask PostgREST to refresh its schema cache so the new table is visible
-- immediately after the migration commits.
NOTIFY pgrst, 'reload schema';
