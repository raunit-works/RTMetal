-- Migration: Add admin review statistics RPC
-- Date: 2026-11-27
-- Purpose: Return exact, published-only review counts and average rating for the admin dashboard.
-- Backward compatible: adds a function only; no schema or customer review behaviour is changed.

CREATE OR REPLACE FUNCTION public.get_admin_review_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total BIGINT;
    v_published BIGINT;
    v_archived BIGINT;
    v_average NUMERIC;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Administrator access is required.'
            USING ERRCODE = '42501';
    END IF;

    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'published'),
        COUNT(*) FILTER (WHERE status = 'archived'),
        ROUND(AVG(rating) FILTER (WHERE status = 'published')::numeric, 1)
    INTO v_total, v_published, v_archived, v_average
    FROM public.product_reviews;

    RETURN json_build_object(
        'total', v_total,
        'published', v_published,
        'archived', v_archived,
        'average_rating', v_average
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_review_stats() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_review_stats() TO authenticated, service_role;
