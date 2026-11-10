-- Migration: Create Metal Service <-> Metal Category many-to-many associations
-- Date: 2026-11-07
-- Target: review before applying to staging rbucefvtkiohmaugvkyz
--
-- Additive only. No existing service, category, product, image or relationship
-- rows are modified or deleted by this migration.
--
-- "N/A - No Service Assigned" is represented by the ABSENCE of rows for a
-- category. No placeholder service or category is created.
--
-- Transaction boundary:
--   This file intentionally contains no BEGIN/COMMIT. Apply it through the
--   Supabase migration runner, which owns transaction handling. If your runner
--   does not wrap migration files, execute this file inside a single transaction.
--   Every statement below is idempotent, so a partially applied run can be
--   safely re-executed.
--
-- PREFLIGHT (read-only; required before applying):
--   1. Confirm the remote migration history and that this version is not recorded.
--   2. Confirm public.service_categories does not already exist.
--   3. Confirm no same-named functions, triggers, policies or indexes exist.
--   4. Confirm a current staging backup exists.
--
-- Rollback plan (only if explicitly approved):
--   1. DROP TRIGGER IF EXISTS categories_block_section_change_with_services ON public.categories;
--   2. DROP TABLE IF EXISTS public.service_categories;
--   3. DROP FUNCTION IF EXISTS public.validate_service_category_assignment();
--   4. DROP FUNCTION IF EXISTS public.prevent_category_section_change_with_services();
--   5. DROP FUNCTION IF EXISTS public.replace_service_categories(uuid, uuid[], uuid[]);
--   6. DROP FUNCTION IF EXISTS public.replace_category_services(uuid, uuid[], uuid[]);
--

-- ---------------------------------------------------------------------------
-- 1. JUNCTION TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_categories (
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (service_id, category_id)
);

CREATE INDEX IF NOT EXISTS service_categories_category_id_idx
    ON public.service_categories(category_id);

CREATE INDEX IF NOT EXISTS service_categories_service_order_idx
    ON public.service_categories(service_id, display_order);

-- ---------------------------------------------------------------------------
-- 2. VALIDATION TRIGGERS
-- ---------------------------------------------------------------------------
-- Enforce that only Metal division categories can be associated with services.
-- The application also filters the picker, but the database is the final guard.
CREATE OR REPLACE FUNCTION public.validate_service_category_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_section TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.services s WHERE s.id = NEW.service_id
    ) THEN
        RAISE EXCEPTION 'The selected service does not exist.'
            USING ERRCODE = '23503';
    END IF;

    SELECT c.main_section INTO v_section
    FROM public.categories c
    WHERE c.id = NEW.category_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'The selected category does not exist.'
            USING ERRCODE = '23503';
    END IF;

    IF v_section IS DISTINCT FROM 'metal_services' THEN
        RAISE EXCEPTION 'Only categories in the Metal division can be linked to a metal service.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_service_category_assignment() FROM PUBLIC;

DROP TRIGGER IF EXISTS service_categories_validate_assignment
    ON public.service_categories;

CREATE TRIGGER service_categories_validate_assignment
    BEFORE INSERT OR UPDATE ON public.service_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_service_category_assignment();

-- A category cannot leave the Metal division while service associations exist.
-- This protects Home Decor from ever inheriting a metal-service link.
CREATE OR REPLACE FUNCTION public.prevent_category_section_change_with_services()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.main_section IS DISTINCT FROM OLD.main_section
       AND EXISTS (
           SELECT 1
           FROM public.service_categories sc
           WHERE sc.category_id = NEW.id
       )
    THEN
        RAISE EXCEPTION 'Remove this category''s metal service assignments before changing its main section.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_category_section_change_with_services() FROM PUBLIC;

DROP TRIGGER IF EXISTS categories_block_section_change_with_services
    ON public.categories;

CREATE TRIGGER categories_block_section_change_with_services
    BEFORE UPDATE OF main_section ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_category_section_change_with_services();

-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY AND PRIVILEGES
-- ---------------------------------------------------------------------------
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Writes are RPC-only. The replace_* functions are SECURITY DEFINER, enforce
-- administrator authorization and optimistic concurrency, and serialize
-- concurrent writes. Direct table DML grants are intentionally withheld.
REVOKE ALL ON TABLE public.service_categories FROM anon, authenticated;
GRANT SELECT ON public.service_categories TO anon, authenticated;

DROP POLICY IF EXISTS "service_categories_public_select" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_admin_select" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_admin_insert" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_admin_update" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_admin_delete" ON public.service_categories;

-- Public visitors can only read relationships where BOTH endpoints are public:
-- the service must be published, the category must be published (including all
-- ancestors) and the category must belong to the Metal division.
CREATE POLICY "service_categories_public_select"
    ON public.service_categories
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.services s
            WHERE s.id = public.service_categories.service_id
              AND s.is_published = true
        )
        AND public.is_category_public(public.service_categories.category_id)
        AND EXISTS (
            SELECT 1
            FROM public.categories c
            WHERE c.id = public.service_categories.category_id
              AND c.main_section = 'metal_services'
        )
    );

CREATE POLICY "service_categories_admin_select"
    ON public.service_categories
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. ATOMIC, DIFF-BASED REPLACEMENT RPCS
-- ---------------------------------------------------------------------------
-- Both functions:
--   * require an authenticated administrator,
--   * serialize concurrent writes for the same entity,
--   * reject cross-division / missing IDs,
--   * support optimistic concurrency through an optional expected set,
--   * delete only removed links, insert only new links, and update order only,
--   * run inside a single transaction (the function call itself).
CREATE OR REPLACE FUNCTION public.replace_service_categories(
    p_service_id UUID,
    p_category_ids UUID[],
    p_expected_category_ids UUID[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_current UUID[];
    v_next UUID[];
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrator authorization required.'
            USING ERRCODE = '42501';
    END IF;

    IF p_service_id IS NULL THEN
        RAISE EXCEPTION 'A service is required.'
            USING ERRCODE = '22023';
    END IF;

    -- One global lock serializes both admin directions (service form and
    -- category form) so stale expected sets reliably produce a conflict
    -- instead of silently overwriting a concurrent edit. The 64-bit hash
    -- avoids the collision risk of the 32-bit hashtext().
    PERFORM pg_advisory_xact_lock(
        hashtextextended('rt_service_categories_mutation', 0)
    );

    IF NOT EXISTS (
        SELECT 1 FROM public.services s WHERE s.id = p_service_id
    ) THEN
        RAISE EXCEPTION 'The selected service no longer exists.'
            USING ERRCODE = '23503';
    END IF;

    v_current := ARRAY(
        SELECT sc.category_id
        FROM public.service_categories sc
        WHERE sc.service_id = p_service_id
    );

    IF p_expected_category_ids IS NOT NULL
       AND (
           SELECT COALESCE(array_agg(DISTINCT id ORDER BY id), ARRAY[]::UUID[])
           FROM unnest(v_current) AS t(id)
       ) IS DISTINCT FROM (
           SELECT COALESCE(array_agg(DISTINCT id ORDER BY id), ARRAY[]::UUID[])
           FROM unnest(p_expected_category_ids) AS t(id)
       )
    THEN
        RAISE EXCEPTION 'The saved category assignments changed. Reload the service before saving.'
            USING ERRCODE = '40001';
    END IF;

    v_next := ARRAY(
        SELECT t.id
        FROM unnest(COALESCE(p_category_ids, ARRAY[]::UUID[])) WITH ORDINALITY AS t(id, ord)
        GROUP BY t.id
        ORDER BY MIN(t.ord)
    );

    IF EXISTS (
        SELECT 1
        FROM unnest(v_next) AS requested(category_id)
        LEFT JOIN public.categories c ON c.id = requested.category_id
        WHERE c.id IS NULL
           OR c.main_section IS DISTINCT FROM 'metal_services'
    ) THEN
        RAISE EXCEPTION 'Every related category must exist in the Metal division.'
            USING ERRCODE = '23514';
    END IF;

    DELETE FROM public.service_categories sc
    WHERE sc.service_id = p_service_id
      AND NOT (sc.category_id = ANY(v_next));

    INSERT INTO public.service_categories (service_id, category_id, display_order)
    SELECT p_service_id, t.id, (t.ord - 1)::INTEGER
    FROM unnest(v_next) WITH ORDINALITY AS t(id, ord)
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.service_categories sc
        WHERE sc.service_id = p_service_id
          AND sc.category_id = t.id
    );

    UPDATE public.service_categories sc
    SET display_order = (t.ord - 1)::INTEGER
    FROM unnest(v_next) WITH ORDINALITY AS t(id, ord)
    WHERE sc.service_id = p_service_id
      AND sc.category_id = t.id
      AND sc.display_order IS DISTINCT FROM (t.ord - 1)::INTEGER;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_service_categories(UUID, UUID[], UUID[]) FROM PUBLIC;
-- service_role is intentionally excluded: a standard service_role JWT has a
-- null auth.uid(), so is_admin() cannot authorize it. Admin writes run as an
-- authenticated admin user.
GRANT EXECUTE ON FUNCTION public.replace_service_categories(UUID, UUID[], UUID[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.replace_category_services(
    p_category_id UUID,
    p_service_ids UUID[],
    p_expected_service_ids UUID[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_section TEXT;
    v_current UUID[];
    v_next UUID[];
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrator authorization required.'
            USING ERRCODE = '42501';
    END IF;

    IF p_category_id IS NULL THEN
        RAISE EXCEPTION 'A category is required.'
            USING ERRCODE = '22023';
    END IF;

    -- Same global lock as replace_service_categories: see comment there.
    PERFORM pg_advisory_xact_lock(
        hashtextextended('rt_service_categories_mutation', 0)
    );

    SELECT c.main_section INTO v_section
    FROM public.categories c
    WHERE c.id = p_category_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'The selected category no longer exists.'
            USING ERRCODE = '23503';
    END IF;

    IF v_section IS DISTINCT FROM 'metal_services' THEN
        RAISE EXCEPTION 'Only Metal division categories can have service assignments.'
            USING ERRCODE = '23514';
    END IF;

    v_current := ARRAY(
        SELECT sc.service_id
        FROM public.service_categories sc
        WHERE sc.category_id = p_category_id
    );

    IF p_expected_service_ids IS NOT NULL
       AND (
           SELECT COALESCE(array_agg(DISTINCT id ORDER BY id), ARRAY[]::UUID[])
           FROM unnest(v_current) AS t(id)
       ) IS DISTINCT FROM (
           SELECT COALESCE(array_agg(DISTINCT id ORDER BY id), ARRAY[]::UUID[])
           FROM unnest(p_expected_service_ids) AS t(id)
       )
    THEN
        RAISE EXCEPTION 'The saved service assignments changed. Reload the category before saving.'
            USING ERRCODE = '40001';
    END IF;

    v_next := ARRAY(
        SELECT t.id
        FROM unnest(COALESCE(p_service_ids, ARRAY[]::UUID[])) WITH ORDINALITY AS t(id, ord)
        GROUP BY t.id
        ORDER BY MIN(t.ord)
    );

    IF EXISTS (
        SELECT 1
        FROM unnest(v_next) AS requested(service_id)
        LEFT JOIN public.services s ON s.id = requested.service_id
        WHERE s.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Every selected service must exist.'
            USING ERRCODE = '23503';
    END IF;

    DELETE FROM public.service_categories sc
    WHERE sc.category_id = p_category_id
      AND NOT (sc.service_id = ANY(v_next));

    INSERT INTO public.service_categories (service_id, category_id, display_order)
    SELECT t.id, p_category_id, (t.ord - 1)::INTEGER
    FROM unnest(v_next) WITH ORDINALITY AS t(id, ord)
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.service_categories sc
        WHERE sc.category_id = p_category_id
          AND sc.service_id = t.id
    );

    UPDATE public.service_categories sc
    SET display_order = (t.ord - 1)::INTEGER
    FROM unnest(v_next) WITH ORDINALITY AS t(id, ord)
    WHERE sc.category_id = p_category_id
      AND sc.service_id = t.id
      AND sc.display_order IS DISTINCT FROM (t.ord - 1)::INTEGER;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_category_services(UUID, UUID[], UUID[]) FROM PUBLIC;
-- service_role excluded for the same reason as replace_service_categories.
GRANT EXECUTE ON FUNCTION public.replace_category_services(UUID, UUID[], UUID[]) TO authenticated;

-- Ask PostgREST to refresh its schema cache so the new table and RPCs are
-- visible immediately after the migration commits.
NOTIFY pgrst, 'reload schema';
