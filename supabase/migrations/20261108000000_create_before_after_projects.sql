-- Migration: Create Before & After project gallery
-- Date: 2026-11-08
-- Target: review before applying to staging
--
-- Additive only. No existing catalogue, CMS, media or relationship rows are
-- modified or deleted by this migration.
--
-- Dependencies (must already exist before this migration):
--   * public.is_admin()            (20260827000001_create_is_admin_function.sql)
--   * public.categories/products   (20260824000000_create_foundation_tables.sql)
--   * public.services              (20260824000000_create_foundation_tables.sql)
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
-- PREFLIGHT (read-only; required before applying):
--   1. Confirm the remote migration history and that this version is not recorded.
--   2. Confirm public.before_after_projects does not already exist.
--   3. Confirm no same-named policies or indexes exist from an earlier attempt.
--   4. Confirm a current staging backup exists.
--
-- Rollback plan (only if explicitly approved):
--   1. DROP FUNCTION IF EXISTS public.save_before_after_project(UUID, JSONB, UUID[]);
--   2. DROP TABLE IF EXISTS public.before_after_project_services;
--   3. DROP TABLE IF EXISTS public.before_after_projects;

-- ---------------------------------------------------------------------------
-- 1. BEFORE & AFTER PROJECTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.before_after_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    reference TEXT,
    short_description TEXT,
    description TEXT,
    component_type TEXT,
    material TEXT,
    finish_name TEXT,
    finish_description TEXT,
    before_image_url TEXT,
    after_image_url TEXT,
    additional_images TEXT[] NOT NULL DEFAULT '{}',
    initial_condition TEXT,
    treatment_description TEXT,
    final_description TEXT,
    features TEXT[] NOT NULL DEFAULT '{}',
    comparison_type TEXT NOT NULL DEFAULT 'illustrative',
    verification_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'draft',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    project_date DATE,
    related_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    related_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT before_after_projects_comparison_type_check
        CHECK (comparison_type IN ('verified', 'illustrative')),
    CONSTRAINT before_after_projects_status_check
        CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT before_after_projects_title_not_blank_check
        CHECK (length(btrim(title)) > 0),
    CONSTRAINT before_after_projects_slug_not_blank_check
        CHECK (length(btrim(slug)) > 0),
    CONSTRAINT before_after_projects_published_media_check
        CHECK (
            status <> 'published'
            OR (before_image_url IS NOT NULL AND after_image_url IS NOT NULL)
        ),
    CONSTRAINT before_after_projects_verified_confirmation_check
        CHECK (
            status <> 'published'
            OR comparison_type <> 'verified'
            OR verification_confirmed = TRUE
        )
);

COMMENT ON TABLE public.before_after_projects IS
    'Published or draft before/after transformations. Illustrative comparisons are not verified case studies.';
COMMENT ON COLUMN public.before_after_projects.comparison_type IS
    'verified = both images document the same object/location; illustrative = surface appearance comparison only.';
COMMENT ON COLUMN public.before_after_projects.verification_confirmed IS
    'Administrator attestation required before a verified comparison can be published.';

CREATE INDEX IF NOT EXISTS before_after_projects_slug_idx
    ON public.before_after_projects(slug);
CREATE INDEX IF NOT EXISTS before_after_projects_status_idx
    ON public.before_after_projects(status);
CREATE INDEX IF NOT EXISTS before_after_projects_published_order_idx
    ON public.before_after_projects(status, is_featured, display_order);
CREATE INDEX IF NOT EXISTS before_after_projects_comparison_type_idx
    ON public.before_after_projects(comparison_type);
CREATE INDEX IF NOT EXISTS before_after_projects_project_date_idx
    ON public.before_after_projects(project_date DESC);
CREATE INDEX IF NOT EXISTS before_after_projects_material_idx
    ON public.before_after_projects(material);
CREATE INDEX IF NOT EXISTS before_after_projects_related_category_idx
    ON public.before_after_projects(related_category_id);
CREATE INDEX IF NOT EXISTS before_after_projects_related_product_idx
    ON public.before_after_projects(related_product_id);

-- ---------------------------------------------------------------------------
-- 2. SERVICE RELATIONSHIPS (many-to-many, ordered)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.before_after_project_services (
    project_id UUID NOT NULL REFERENCES public.before_after_projects(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, service_id)
);

CREATE INDEX IF NOT EXISTS before_after_project_services_service_idx
    ON public.before_after_project_services(service_id);
CREATE INDEX IF NOT EXISTS before_after_project_services_project_order_idx
    ON public.before_after_project_services(project_id, display_order);

-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY AND PRIVILEGES
-- ---------------------------------------------------------------------------
ALTER TABLE public.before_after_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.before_after_project_services ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.before_after_projects FROM anon, authenticated;
GRANT SELECT ON TABLE public.before_after_projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.before_after_projects TO authenticated;

REVOKE ALL ON TABLE public.before_after_project_services FROM anon, authenticated;
GRANT SELECT ON TABLE public.before_after_project_services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.before_after_project_services TO authenticated;

DROP POLICY IF EXISTS "before_after_projects_public_select" ON public.before_after_projects;
DROP POLICY IF EXISTS "before_after_projects_admin_select" ON public.before_after_projects;
DROP POLICY IF EXISTS "before_after_projects_admin_insert" ON public.before_after_projects;
DROP POLICY IF EXISTS "before_after_projects_admin_update" ON public.before_after_projects;
DROP POLICY IF EXISTS "before_after_projects_admin_delete" ON public.before_after_projects;

CREATE POLICY "before_after_projects_public_select"
    ON public.before_after_projects
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

CREATE POLICY "before_after_projects_admin_select"
    ON public.before_after_projects
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "before_after_projects_admin_insert"
    ON public.before_after_projects
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "before_after_projects_admin_update"
    ON public.before_after_projects
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "before_after_projects_admin_delete"
    ON public.before_after_projects
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "before_after_project_services_public_select" ON public.before_after_project_services;
DROP POLICY IF EXISTS "before_after_project_services_admin_select" ON public.before_after_project_services;
DROP POLICY IF EXISTS "before_after_project_services_admin_insert" ON public.before_after_project_services;
DROP POLICY IF EXISTS "before_after_project_services_admin_update" ON public.before_after_project_services;
DROP POLICY IF EXISTS "before_after_project_services_admin_delete" ON public.before_after_project_services;

-- Public visitors only see relationships where both endpoints are public.
CREATE POLICY "before_after_project_services_public_select"
    ON public.before_after_project_services
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.before_after_projects p
            WHERE p.id = public.before_after_project_services.project_id
              AND p.status = 'published'
        )
        AND EXISTS (
            SELECT 1
            FROM public.services s
            WHERE s.id = public.before_after_project_services.service_id
              AND s.is_published = TRUE
        )
    );

CREATE POLICY "before_after_project_services_admin_select"
    ON public.before_after_project_services
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "before_after_project_services_admin_insert"
    ON public.before_after_project_services
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "before_after_project_services_admin_update"
    ON public.before_after_project_services
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "before_after_project_services_admin_delete"
    ON public.before_after_project_services
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. ATOMIC PROJECT + SERVICE-LINK SAVE
-- ---------------------------------------------------------------------------
-- The admin UI previously updated the project row and then replaced the
-- service links in separate HTTP requests. A failed link write could leave the
-- two tables out of sync. This function writes both tables in one transaction.
--
-- Existing links are diffed rather than blindly deleted, so link rows that are
-- still selected are never removed and their display order is preserved.
CREATE OR REPLACE FUNCTION public.save_before_after_project(
    p_project_id UUID,
    p_project JSONB,
    p_service_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_project_id UUID;
    v_next UUID[];
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrator authorization required.'
            USING ERRCODE = '42501';
    END IF;

    IF p_project IS NULL OR jsonb_typeof(p_project) IS DISTINCT FROM 'object' THEN
        RAISE EXCEPTION 'A project payload is required.'
            USING ERRCODE = '22023';
    END IF;

    IF p_project_id IS NULL THEN
        INSERT INTO public.before_after_projects (
            title,
            slug,
            reference,
            short_description,
            description,
            component_type,
            material,
            finish_name,
            finish_description,
            before_image_url,
            after_image_url,
            additional_images,
            initial_condition,
            treatment_description,
            final_description,
            features,
            comparison_type,
            verification_confirmed,
            status,
            is_featured,
            display_order,
            project_date,
            related_category_id,
            related_product_id
        ) VALUES (
            btrim(COALESCE(p_project->>'title', '')),
            btrim(COALESCE(p_project->>'slug', '')),
            NULLIF(btrim(COALESCE(p_project->>'reference', '')), ''),
            NULLIF(btrim(COALESCE(p_project->>'short_description', '')), ''),
            NULLIF(btrim(COALESCE(p_project->>'description', '')), ''),
            NULLIF(btrim(COALESCE(p_project->>'component_type', '')), ''),
            NULLIF(btrim(COALESCE(p_project->>'material', '')), ''),
            NULLIF(btrim(COALESCE(p_project->>'finish_name', '')), ''),
            NULLIF(btrim(COALESCE(p_project->>'finish_description', '')), ''),
            NULLIF(btrim(COALESCE(p_project->>'before_image_url', '')), ''),
            NULLIF(btrim(COALESCE(p_project->>'after_image_url', '')), ''),
            COALESCE(
                ARRAY(
                    SELECT btrim(value)
                    FROM jsonb_array_elements_text(
                        CASE
                            WHEN jsonb_typeof(p_project->'additional_images') = 'array'
                                THEN p_project->'additional_images'
                            ELSE '[]'::JSONB
                        END
                    ) AS value
                    WHERE btrim(value) <> ''
                ),
                ARRAY[]::TEXT[]
            ),
            NULLIF(btrim(COALESCE(p_project->>'initial_condition', '')), ''),
            NULLIF(btrim(COALESCE(p_project->>'treatment_description', '')), ''),
            NULLIF(btrim(COALESCE(p_project->>'final_description', '')), ''),
            COALESCE(
                ARRAY(
                    SELECT btrim(value)
                    FROM jsonb_array_elements_text(
                        CASE
                            WHEN jsonb_typeof(p_project->'features') = 'array'
                                THEN p_project->'features'
                            ELSE '[]'::JSONB
                        END
                    ) AS value
                    WHERE btrim(value) <> ''
                ),
                ARRAY[]::TEXT[]
            ),
            COALESCE(NULLIF(p_project->>'comparison_type', ''), 'illustrative'),
            COALESCE((p_project->>'verification_confirmed')::BOOLEAN, FALSE),
            COALESCE(NULLIF(p_project->>'status', ''), 'draft'),
            COALESCE((p_project->>'is_featured')::BOOLEAN, FALSE),
            COALESCE((p_project->>'display_order')::INTEGER, 0),
            NULLIF(btrim(COALESCE(p_project->>'project_date', '')), '')::DATE,
            NULLIF(p_project->>'related_category_id', '')::UUID,
            NULLIF(p_project->>'related_product_id', '')::UUID
        )
        RETURNING id INTO v_project_id;
    ELSE
        PERFORM 1
        FROM public.before_after_projects p
        WHERE p.id = p_project_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'The selected transformation no longer exists.'
                USING ERRCODE = '23503';
        END IF;

        UPDATE public.before_after_projects
        SET
            title = btrim(COALESCE(p_project->>'title', '')),
            slug = btrim(COALESCE(p_project->>'slug', '')),
            reference = NULLIF(btrim(COALESCE(p_project->>'reference', '')), ''),
            short_description = NULLIF(btrim(COALESCE(p_project->>'short_description', '')), ''),
            description = NULLIF(btrim(COALESCE(p_project->>'description', '')), ''),
            component_type = NULLIF(btrim(COALESCE(p_project->>'component_type', '')), ''),
            material = NULLIF(btrim(COALESCE(p_project->>'material', '')), ''),
            finish_name = NULLIF(btrim(COALESCE(p_project->>'finish_name', '')), ''),
            finish_description = NULLIF(btrim(COALESCE(p_project->>'finish_description', '')), ''),
            before_image_url = NULLIF(btrim(COALESCE(p_project->>'before_image_url', '')), ''),
            after_image_url = NULLIF(btrim(COALESCE(p_project->>'after_image_url', '')), ''),
            additional_images = COALESCE(
                ARRAY(
                    SELECT btrim(value)
                    FROM jsonb_array_elements_text(
                        CASE
                            WHEN jsonb_typeof(p_project->'additional_images') = 'array'
                                THEN p_project->'additional_images'
                            ELSE '[]'::JSONB
                        END
                    ) AS value
                    WHERE btrim(value) <> ''
                ),
                ARRAY[]::TEXT[]
            ),
            initial_condition = NULLIF(btrim(COALESCE(p_project->>'initial_condition', '')), ''),
            treatment_description = NULLIF(btrim(COALESCE(p_project->>'treatment_description', '')), ''),
            final_description = NULLIF(btrim(COALESCE(p_project->>'final_description', '')), ''),
            features = COALESCE(
                ARRAY(
                    SELECT btrim(value)
                    FROM jsonb_array_elements_text(
                        CASE
                            WHEN jsonb_typeof(p_project->'features') = 'array'
                                THEN p_project->'features'
                            ELSE '[]'::JSONB
                        END
                    ) AS value
                    WHERE btrim(value) <> ''
                ),
                ARRAY[]::TEXT[]
            ),
            comparison_type = COALESCE(NULLIF(p_project->>'comparison_type', ''), 'illustrative'),
            verification_confirmed = COALESCE((p_project->>'verification_confirmed')::BOOLEAN, FALSE),
            status = COALESCE(NULLIF(p_project->>'status', ''), 'draft'),
            is_featured = COALESCE((p_project->>'is_featured')::BOOLEAN, FALSE),
            display_order = COALESCE((p_project->>'display_order')::INTEGER, 0),
            project_date = NULLIF(btrim(COALESCE(p_project->>'project_date', '')), '')::DATE,
            related_category_id = NULLIF(p_project->>'related_category_id', '')::UUID,
            related_product_id = NULLIF(p_project->>'related_product_id', '')::UUID,
            updated_at = NOW()
        WHERE id = p_project_id
        RETURNING id INTO v_project_id;
    END IF;

    PERFORM pg_advisory_xact_lock(
        hashtextextended('rt_before_after_services_' || v_project_id::TEXT, 0)
    );

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

    DELETE FROM public.before_after_project_services link
    WHERE link.project_id = v_project_id
      AND NOT (link.service_id = ANY(v_next));

    INSERT INTO public.before_after_project_services (project_id, service_id, display_order)
    SELECT v_project_id, t.id, (t.ord - 1)::INTEGER
    FROM unnest(v_next) WITH ORDINALITY AS t(id, ord)
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.before_after_project_services link
        WHERE link.project_id = v_project_id
          AND link.service_id = t.id
    );

    UPDATE public.before_after_project_services link
    SET display_order = (t.ord - 1)::INTEGER
    FROM unnest(v_next) WITH ORDINALITY AS t(id, ord)
    WHERE link.project_id = v_project_id
      AND link.service_id = t.id
      AND link.display_order IS DISTINCT FROM (t.ord - 1)::INTEGER;

    RETURN v_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_before_after_project(UUID, JSONB, UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_before_after_project(UUID, JSONB, UUID[]) TO authenticated;

-- Ask PostgREST to refresh its schema cache so the new tables are visible
-- immediately after the migration commits.
NOTIFY pgrst, 'reload schema';
