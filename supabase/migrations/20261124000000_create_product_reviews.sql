-- Migration: Create customer product reviews, review photos and admin notifications
-- Date: 2026-11-24
-- Phase: 1 (database + backend foundation only)
--
-- Additive. No existing row is deleted. The only update to existing data is
-- normalising products.rating to NULL where a product has no reviews; the
-- current rating values are the hard-coded foundation default and are never
-- written by the admin catalogue UI (verified in lib/supabase/admin-catalog.ts).
--
-- Public writes are intentionally NOT granted: anon/authenticated get SELECT only.
-- Review creation (and storage upload) must go through a server route using a
-- server-only SUPABASE_SERVICE_ROLE_KEY in Phase 2.

BEGIN;

-- ============================================================
-- 1. PRODUCT AGGREGATE COLUMNS
-- ============================================================

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.products ALTER COLUMN rating DROP DEFAULT;

UPDATE public.products
SET rating = NULL
WHERE review_count = 0 AND rating IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_rating_range'
          AND conrelid = 'public.products'::regclass
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT products_rating_range
            CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_review_count_nonnegative'
          AND conrelid = 'public.products'::regclass
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT products_review_count_nonnegative
            CHECK (review_count >= 0);
    END IF;

    -- Enforce the derived invariant: no reviews means no rating, and a rating
    -- can only exist while there is at least one published review.
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_rating_matches_review_count'
          AND conrelid = 'public.products'::regclass
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT products_rating_matches_review_count
            CHECK (
                (review_count = 0 AND rating IS NULL)
                OR (review_count > 0 AND rating IS NOT NULL)
            );
    END IF;
END;
$$;

COMMENT ON COLUMN public.products.rating IS
    'Average of published review ratings (1-5, one decimal). NULL when review_count = 0. Derived - do not edit manually.';
COMMENT ON COLUMN public.products.review_count IS
    'Number of published reviews. Derived by trigger - do not edit manually.';

-- ============================================================
-- 2. PRODUCT REVIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT CHECK (
        customer_name IS NULL
        OR char_length(trim(customer_name)) BETWEEN 2 AND 80
    ),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content TEXT NOT NULL CHECK (
        char_length(trim(content)) BETWEEN 10 AND 2000
        AND octet_length(content) <= 8000
    ),
    status TEXT NOT NULL DEFAULT 'published'
        CHECK (status IN ('published', 'archived')),
    product_name_snapshot TEXT,
    product_slug_snapshot TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id
    ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_status_created
    ON public.product_reviews(product_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status_created
    ON public.product_reviews(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at
    ON public.product_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id
    ON public.product_reviews(user_id);

COMMENT ON TABLE public.product_reviews IS
    'Customer product reviews. Published immediately; admins may archive or delete.';
COMMENT ON COLUMN public.product_reviews.product_name_snapshot IS
    'Product name at submission time, so archived reviews keep their context.';
COMMENT ON COLUMN public.product_reviews.status IS
    'published = visible to the public; archived = hidden but retained for admin history.';

-- ============================================================
-- 3. PRODUCT REVIEW IMAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_review_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_review_images_review_sort_unique UNIQUE (review_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_product_review_images_review_id
    ON public.product_review_images(review_id);

COMMENT ON TABLE public.product_review_images IS
    'Review photos. storage_path is relative to the private review-photos bucket (<review_id>/<file>).';
COMMENT ON COLUMN public.product_review_images.storage_path IS
    'Object path inside the review-photos bucket, e.g. <review_id>/<uuid>.jpg.';

-- ============================================================
-- 4. ADMIN NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type TEXT NOT NULL
        CHECK (notification_type IN ('review_created')),
    review_id UUID REFERENCES public.product_reviews(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread
    ON public.admin_notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at
    ON public.admin_notifications(created_at DESC);

COMMENT ON TABLE public.admin_notifications IS
    'In-app notifications for admins. Rows are generated by trigger, never by clients.';

-- ============================================================
-- 5. VISIBILITY HELPERS
-- ============================================================
-- SECURITY DEFINER so public RLS policies can resolve visibility without
-- recursively re-entering RLS. Mirrors public.is_category_public().

CREATE OR REPLACE FUNCTION public.is_product_public(product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(
        (
            SELECT p.is_published
               AND NOT COALESCE(p.is_archived, false)
               AND public.is_category_public(p.category_id)
            FROM public.products p
            WHERE p.id = product_id
        ),
        false
    );
$$;

CREATE OR REPLACE FUNCTION public.is_product_review_public(review_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(
        (
            SELECT r.status = 'published'
               AND public.is_product_public(r.product_id)
            FROM public.product_reviews r
            WHERE r.id = review_id
        ),
        false
    );
$$;

CREATE OR REPLACE FUNCTION public.is_review_photo_public(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(
        (
            SELECT public.is_product_review_public(i.review_id)
            FROM public.product_review_images i
            WHERE i.storage_path = object_name
        ),
        false
    );
$$;

REVOKE ALL ON FUNCTION public.is_product_public(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_product_review_public(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_review_photo_public(text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_product_public(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_product_review_public(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_review_photo_public(text) TO anon, authenticated, service_role;

-- ============================================================
-- 6. AGGREGATE REFRESH
-- ============================================================

CREATE OR REPLACE FUNCTION public.refresh_product_review_stats(product_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    sorted_ids uuid[];
    pid uuid;
BEGIN
    SELECT array_agg(DISTINCT candidate ORDER BY candidate)
    INTO sorted_ids
    FROM unnest(product_ids) AS candidate
    WHERE candidate IS NOT NULL;

    IF sorted_ids IS NULL THEN
        RETURN;
    END IF;

    -- Deterministic (sorted) per-product locking keeps concurrent bulk
    -- operations from deadlocking on the same set of products.
    FOREACH pid IN ARRAY sorted_ids LOOP
        PERFORM 1 FROM public.products WHERE id = pid FOR UPDATE;

        UPDATE public.products p
        SET rating = stats.avg_rating,
            review_count = stats.review_count
        FROM (
            SELECT ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
                   COUNT(*)::integer AS review_count
            FROM public.product_reviews r
            WHERE r.product_id = pid
              AND r.status = 'published'
        ) AS stats
        WHERE p.id = pid;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_product_review_stats_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    affected uuid[];
BEGIN
    SELECT array_agg(DISTINCT product_id)
    INTO affected
    FROM new_rows
    WHERE product_id IS NOT NULL;

    PERFORM public.refresh_product_review_stats(affected);
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_product_review_stats_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    affected uuid[];
BEGIN
    SELECT array_agg(DISTINCT candidate)
    INTO affected
    FROM (
        SELECT product_id AS candidate FROM new_rows
        UNION
        SELECT product_id AS candidate FROM old_rows
    ) AS changed
    WHERE candidate IS NOT NULL;

    PERFORM public.refresh_product_review_stats(affected);
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_product_review_stats_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    affected uuid[];
BEGIN
    SELECT array_agg(DISTINCT product_id)
    INTO affected
    FROM old_rows
    WHERE product_id IS NOT NULL;

    PERFORM public.refresh_product_review_stats(affected);
    RETURN NULL;
END;
$$;

-- ============================================================
-- 7. NOTIFICATION + TIMESTAMP + IMAGE-LIMIT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_new_product_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
        IF NEW.status = 'published' THEN
            BEGIN
                INSERT INTO public.admin_notifications (
                    notification_type, review_id, title, message
                )
                VALUES (
                    'review_created',
                    NEW.id,
                    'New product review',
                    format(
                        '%s left a %s/5 review on %s.',
                        COALESCE(NULLIF(trim(NEW.customer_name), ''), 'A customer'),
                        NEW.rating,
                        COALESCE(NULLIF(trim(NEW.product_name_snapshot), ''), 'a product')
                    )
                );
            EXCEPTION WHEN OTHERS THEN
                -- Notifications must never block the review from being published.
                -- Log a non-blocking warning with diagnostic context (no PII).
                RAISE WARNING 'admin notification insert failed for review %: %',
                    NEW.id, SQLERRM;
                NULL;
            END;
        END IF;
        RETURN NULL;
    END;
$$;

CREATE OR REPLACE FUNCTION public.touch_product_reviews_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_review_image_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    photo_count integer;
BEGIN
    -- Lock the parent review row so concurrent inserts cannot race past the cap.
    PERFORM 1 FROM public.product_reviews WHERE id = NEW.review_id FOR UPDATE;

    SELECT COUNT(*)::integer
    INTO photo_count
    FROM public.product_review_images
    WHERE review_id = NEW.review_id;

    IF photo_count >= 3 THEN
        RAISE EXCEPTION 'A review can have at most 3 photos.'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_product_review_stats(uuid[]) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.sync_product_review_stats_insert() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.sync_product_review_stats_update() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.sync_product_review_stats_delete() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.notify_new_product_review() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.touch_product_reviews_updated_at() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enforce_review_image_limit() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refresh_product_review_stats(uuid[]) TO service_role;

DROP TRIGGER IF EXISTS product_reviews_stats_insert ON public.product_reviews;
CREATE TRIGGER product_reviews_stats_insert
    AFTER INSERT ON public.product_reviews
    REFERENCING NEW TABLE AS new_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.sync_product_review_stats_insert();

DROP TRIGGER IF EXISTS product_reviews_stats_update ON public.product_reviews;
CREATE TRIGGER product_reviews_stats_update
    AFTER UPDATE ON public.product_reviews
    REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.sync_product_review_stats_update();

DROP TRIGGER IF EXISTS product_reviews_stats_delete ON public.product_reviews;
CREATE TRIGGER product_reviews_stats_delete
    AFTER DELETE ON public.product_reviews
    REFERENCING OLD TABLE AS old_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.sync_product_review_stats_delete();

DROP TRIGGER IF EXISTS product_reviews_notify_admin ON public.product_reviews;
CREATE TRIGGER product_reviews_notify_admin
    AFTER INSERT ON public.product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_product_review();

DROP TRIGGER IF EXISTS product_reviews_touch_updated_at ON public.product_reviews;
CREATE TRIGGER product_reviews_touch_updated_at
    BEFORE UPDATE ON public.product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_product_reviews_updated_at();

DROP TRIGGER IF EXISTS product_review_images_enforce_limit ON public.product_review_images;
CREATE TRIGGER product_review_images_enforce_limit
    BEFORE INSERT ON public.product_review_images
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_review_image_limit();

-- ============================================================
-- 8. ROW LEVEL SECURITY + PRIVILEGES
-- ============================================================

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- product_reviews: read-only for the public, status/delete for admins, writes
-- for the server route (service_role). No INSERT grant to anon/authenticated.
REVOKE ALL ON TABLE public.product_reviews FROM anon, authenticated;
GRANT SELECT (
    id, product_id, customer_name, rating, content, status,
    product_name_snapshot, product_slug_snapshot, created_at, updated_at
) ON TABLE public.product_reviews TO anon, authenticated;
GRANT UPDATE (status) ON TABLE public.product_reviews TO authenticated;
GRANT DELETE ON TABLE public.product_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_reviews TO service_role;

DROP POLICY IF EXISTS product_reviews_public_select ON public.product_reviews;
DROP POLICY IF EXISTS product_reviews_admin_select ON public.product_reviews;
DROP POLICY IF EXISTS product_reviews_admin_update ON public.product_reviews;
DROP POLICY IF EXISTS product_reviews_admin_delete ON public.product_reviews;

CREATE POLICY product_reviews_public_select
    ON public.product_reviews FOR SELECT
    TO anon, authenticated
    USING (status = 'published' AND public.is_product_public(product_id));

CREATE POLICY product_reviews_admin_select
    ON public.product_reviews FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY product_reviews_admin_update
    ON public.product_reviews FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY product_reviews_admin_delete
    ON public.product_reviews FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- product_review_images: read-only for the public, sort/delete for admins.
REVOKE ALL ON TABLE public.product_review_images FROM anon, authenticated;
GRANT SELECT (id, review_id, sort_order, created_at)
    ON TABLE public.product_review_images TO anon, authenticated;
GRANT UPDATE (sort_order) ON TABLE public.product_review_images TO authenticated;
GRANT DELETE ON TABLE public.product_review_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_review_images TO service_role;

DROP POLICY IF EXISTS product_review_images_public_select ON public.product_review_images;
DROP POLICY IF EXISTS product_review_images_admin_select ON public.product_review_images;
DROP POLICY IF EXISTS product_review_images_admin_update ON public.product_review_images;
DROP POLICY IF EXISTS product_review_images_admin_delete ON public.product_review_images;

CREATE POLICY product_review_images_public_select
    ON public.product_review_images FOR SELECT
    TO anon, authenticated
    USING (public.is_product_review_public(review_id));

CREATE POLICY product_review_images_admin_select
    ON public.product_review_images FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY product_review_images_admin_update
    ON public.product_review_images FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY product_review_images_admin_delete
    ON public.product_review_images FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- admin_notifications: visible to admins only. Inserts come from the trigger.
REVOKE ALL ON TABLE public.admin_notifications FROM anon, authenticated;
GRANT SELECT ON TABLE public.admin_notifications TO authenticated;
GRANT UPDATE (is_read, read_at) ON TABLE public.admin_notifications TO authenticated;
GRANT DELETE ON TABLE public.admin_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_notifications TO service_role;

DROP POLICY IF EXISTS admin_notifications_admin_select ON public.admin_notifications;
DROP POLICY IF EXISTS admin_notifications_admin_update ON public.admin_notifications;
DROP POLICY IF EXISTS admin_notifications_admin_delete ON public.admin_notifications;

CREATE POLICY admin_notifications_admin_select
    ON public.admin_notifications FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY admin_notifications_admin_update
    ON public.admin_notifications FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_notifications_admin_delete
    ON public.admin_notifications FOR DELETE
    TO authenticated
    USING (public.is_admin());

NOTIFY pgrst, 'reload schema';

COMMIT;
