-- Migration: Add atomic review submission RPC and rate limiting functions
-- Date: 2026-11-24
-- Phase: 2.1 (backend reliability corrections)
--
-- Additive. Creates protected database functions for:
--   1. Atomic rate limit increment (increment_review_rate_limit)
--   2. Combined two-window rate limit check (check_review_rate_limits)
--   3. Atomic review submission with idempotency (submit_product_review)
-- Must run after 20261124000002_add_review_rate_limits.sql

BEGIN;

CREATE OR REPLACE FUNCTION public.increment_review_rate_limit(
    p_window_key text,
    p_window_ms bigint,
    p_max_requests integer
)
RETURNS TABLE (
    new_count integer,
    exceeded boolean,
    window_start timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_now timestamptz := NOW();
    v_window interval;
    v_new_count integer;
    v_window_start timestamptz;
BEGIN
    IF p_window_key IS NULL OR btrim(p_window_key) = '' THEN
        RAISE EXCEPTION 'Invalid rate-limit key.'
            USING ERRCODE = '22023';
    END IF;

    IF p_window_ms IS NULL OR p_window_ms <= 0 THEN
        RAISE EXCEPTION 'Invalid rate-limit window.'
            USING ERRCODE = '22023';
    END IF;

    IF p_max_requests IS NULL OR p_max_requests <= 0 THEN
        RAISE EXCEPTION 'Invalid rate-limit maximum.'
            USING ERRCODE = '22023';
    END IF;

    v_window := p_window_ms * interval '1 millisecond';

    WITH upserted AS (
        INSERT INTO public.review_rate_limits (window_key, request_count, window_start, updated_at)
        VALUES (p_window_key, 1, v_now, v_now)
        ON CONFLICT (window_key) DO UPDATE
        SET request_count = CASE
                WHEN public.review_rate_limits.window_start <= v_now - v_window THEN 1
                ELSE public.review_rate_limits.request_count + 1
            END,
            window_start = CASE
                WHEN public.review_rate_limits.window_start <= v_now - v_window THEN v_now
                ELSE public.review_rate_limits.window_start
            END,
            updated_at = v_now
        RETURNING public.review_rate_limits.request_count, public.review_rate_limits.window_start
    )
    SELECT upserted.request_count, upserted.window_start
    INTO v_new_count, v_window_start
    FROM upserted;

    RETURN QUERY SELECT v_new_count, (v_new_count > p_max_requests), v_window_start;
    RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_review_rate_limit(text, bigint, integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_review_rate_limit(text, bigint, integer) TO service_role;

DROP FUNCTION IF EXISTS public.check_review_rate_limits(text);
DROP FUNCTION IF EXISTS public.check_review_rate_limits(text, bigint, integer, bigint, integer);

CREATE FUNCTION public.check_review_rate_limits(
    p_client_ip_hash text,
    p_short_window_ms bigint,
    p_short_window_max integer,
    p_long_window_ms bigint,
    p_long_window_max integer
)
RETURNS TABLE (
    allowed boolean,
    remaining integer,
    reset_time timestamptz,
    retry_after_seconds integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_now timestamptz := NOW();
    v_limit record;
    v_result record;
    v_allowed boolean := true;
    v_remaining integer := 2147483647;
    v_next_reset timestamptz;
    v_blocking_reset timestamptz;
    v_candidate_reset timestamptz;
BEGIN
    IF p_client_ip_hash IS NULL OR btrim(p_client_ip_hash) = '' THEN
        RAISE EXCEPTION 'Invalid client identifier.'
            USING ERRCODE = '22023';
    END IF;

    IF p_short_window_ms IS NULL OR p_short_window_ms <= 0
       OR p_long_window_ms IS NULL OR p_long_window_ms <= 0 THEN
        RAISE EXCEPTION 'Invalid rate-limit window.'
            USING ERRCODE = '22023';
    END IF;

    IF p_short_window_max IS NULL OR p_short_window_max <= 0
       OR p_long_window_max IS NULL OR p_long_window_max <= 0 THEN
        RAISE EXCEPTION 'Invalid rate-limit maximum.'
            USING ERRCODE = '22023';
    END IF;

    FOR v_limit IN
        SELECT limits.window_ms, limits.max_requests
        FROM (VALUES
            (p_short_window_ms, p_short_window_max),
            (p_long_window_ms, p_long_window_max)
        ) AS limits(window_ms, max_requests)
        ORDER BY limits.window_ms DESC
    LOOP
        SELECT *
        INTO v_result
        FROM public.increment_review_rate_limit(
            p_client_ip_hash || ':' || v_limit.window_ms::text,
            v_limit.window_ms,
            v_limit.max_requests
        );

        v_candidate_reset := v_result.window_start + (v_limit.window_ms * interval '1 millisecond');

        IF v_next_reset IS NULL OR v_candidate_reset < v_next_reset THEN
            v_next_reset := v_candidate_reset;
        END IF;

        IF v_result.exceeded THEN
            v_allowed := false;
            v_remaining := 0;
            IF v_blocking_reset IS NULL OR v_candidate_reset > v_blocking_reset THEN
                v_blocking_reset := v_candidate_reset;
            END IF;
        ELSIF v_limit.max_requests - v_result.new_count < v_remaining THEN
            v_remaining := v_limit.max_requests - v_result.new_count;
        END IF;
    END LOOP;

    RETURN QUERY
    SELECT
        v_allowed,
        GREATEST(v_remaining, 0),
        COALESCE(v_blocking_reset, v_next_reset, v_now + interval '15 minutes'),
        CASE
            WHEN v_allowed THEN 0
            ELSE GREATEST(
                0,
                CEIL(EXTRACT(EPOCH FROM (COALESCE(v_blocking_reset, v_now) - v_now)))::integer
            )
        END;
    RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.check_review_rate_limits(text, bigint, integer, bigint, integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_review_rate_limits(text, bigint, integer, bigint, integer) TO service_role;

DROP FUNCTION IF EXISTS public.resolve_review_submission_key(text, uuid, uuid, text, integer, text, integer);
DROP FUNCTION IF EXISTS public.resolve_review_submission_key(text, text);

CREATE FUNCTION public.resolve_review_submission_key(
    p_submission_key_hash text,
    p_payload_hash text
)
RETURNS TABLE (
    status text,
    existing_review_id uuid,
    existing_user_id uuid,
    existing_customer_name text,
    existing_rating integer,
    existing_content text,
    existing_status text,
    existing_product_name_snapshot text,
    existing_product_slug_snapshot text,
    existing_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_key_review_id uuid;
    v_key_payload_hash text;
    v_existing_review_id uuid;
    v_existing_product_id uuid;
    v_existing_user_id uuid;
    v_existing_customer_name text;
    v_existing_rating integer;
    v_existing_content text;
    v_existing_status text;
    v_existing_product_name_snapshot text;
    v_existing_product_slug_snapshot text;
    v_existing_created_at timestamptz;
BEGIN
    SELECT k.review_id, k.payload_hash
    INTO v_key_review_id, v_key_payload_hash
    FROM public.review_submission_keys k
    WHERE k.key_hash = p_submission_key_hash
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT 'NONE'::text, NULL::uuid, NULL::uuid, NULL::text,
            NULL::integer, NULL::text, NULL::text, NULL::text, NULL::text,
            NULL::timestamptz;
        RETURN;
    END IF;

    IF v_key_payload_hash IS DISTINCT FROM p_payload_hash THEN
        RETURN QUERY SELECT 'CONFLICT'::text, NULL::uuid, NULL::uuid, NULL::text,
            NULL::integer, NULL::text, NULL::text, NULL::text, NULL::text,
            NULL::timestamptz;
        RETURN;
    END IF;

    SELECT r.id, r.product_id, r.user_id, r.customer_name, r.rating, r.content,
           r.status, r.product_name_snapshot, r.product_slug_snapshot, r.created_at
    INTO v_existing_review_id, v_existing_product_id, v_existing_user_id,
         v_existing_customer_name, v_existing_rating, v_existing_content,
         v_existing_status, v_existing_product_name_snapshot,
         v_existing_product_slug_snapshot, v_existing_created_at
    FROM public.product_reviews r
    WHERE r.id = v_key_review_id
    LIMIT 1;

    IF v_existing_review_id IS NULL THEN
        RETURN QUERY SELECT 'CONFLICT'::text, NULL::uuid, NULL::uuid, NULL::text,
            NULL::integer, NULL::text, NULL::text, NULL::text, NULL::text,
            NULL::timestamptz;
        RETURN;
    END IF;

    IF v_existing_status IS DISTINCT FROM 'published'
       OR NOT public.is_product_public(v_existing_product_id) THEN
        RETURN QUERY SELECT 'UNAVAILABLE'::text, NULL::uuid, NULL::uuid, NULL::text,
            NULL::integer, NULL::text, NULL::text, NULL::text, NULL::text,
            NULL::timestamptz;
        RETURN;
    END IF;

    RETURN QUERY SELECT 'DUPLICATE'::text, v_existing_review_id, v_existing_user_id,
        v_existing_customer_name, v_existing_rating, v_existing_content,
        v_existing_status, v_existing_product_name_snapshot,
        v_existing_product_slug_snapshot, v_existing_created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_review_submission_key(text, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_review_submission_key(text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.get_public_review_image_paths(p_review_ids uuid[])
RETURNS TABLE (
    image_id uuid,
    review_id uuid,
    storage_path text,
    sort_order integer,
    created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT i.id, i.review_id, i.storage_path, i.sort_order, i.created_at
    FROM public.product_review_images i
    WHERE i.review_id = ANY (p_review_ids)
      AND public.is_product_review_public(i.review_id)
    ORDER BY i.review_id, i.sort_order, i.id
$$;

REVOKE ALL ON FUNCTION public.get_public_review_image_paths(uuid[]) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_review_image_paths(uuid[]) TO service_role;

DROP FUNCTION IF EXISTS public.submit_product_review(
    uuid, uuid, text, integer, text, text, text[], integer[]
);
DROP FUNCTION IF EXISTS public.submit_product_review(
    uuid, uuid, uuid, text, integer, text, text, text[], integer[]
);
DROP FUNCTION IF EXISTS public.submit_product_review(
    uuid, uuid, uuid, text, integer, text, text, text, text[], integer[]
);

CREATE FUNCTION public.submit_product_review(
    p_review_id uuid,
    p_product_id uuid,
    p_user_id uuid,
    p_customer_name text,
    p_rating integer,
    p_content text,
    p_submission_key_hash text,
    p_payload_hash text,
    p_image_paths text[],
    p_sort_orders integer[]
)
RETURNS TABLE (
    review_id uuid,
    duplicate boolean,
    error_code text,
    error_message text,
    existing_user_id uuid,
    existing_customer_name text,
    existing_rating integer,
    existing_content text,
    existing_status text,
    existing_product_name_snapshot text,
    existing_product_slug_snapshot text,
    existing_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_review_id uuid;
    v_product_name text;
    v_product_slug text;
    v_product_public boolean;
    v_is_duplicate boolean := false;
    v_inserted_key text;
    v_image_count integer := 0;
    v_path_prefix text;
    v_index integer;
    v_created_at timestamptz;
    v_existing_review_id uuid;
    v_existing_user_id uuid;
    v_existing_customer_name text;
    v_existing_rating integer;
    v_existing_content text;
    v_existing_status text;
    v_existing_product_name_snapshot text;
    v_existing_product_slug_snapshot text;
    v_existing_created_at timestamptz;
    v_constraint_name text;
    v_key_status text;
    v_key_result record;
BEGIN
    IF p_review_id IS NULL THEN
        RETURN QUERY SELECT NULL::uuid, false, 'VALIDATION_ERROR'::text,
            'Review identifier is required.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    IF p_product_id IS NULL THEN
        RETURN QUERY SELECT NULL::uuid, false, 'VALIDATION_ERROR'::text,
            'Product identifier is required.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 THEN
        RETURN QUERY SELECT NULL::uuid, false, 'VALIDATION_ERROR'::text,
            'Rating must be an integer between 1 and 5.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    IF p_content IS NULL
       OR char_length(btrim(p_content)) NOT BETWEEN 10 AND 2000
       OR octet_length(p_content) > 8000 THEN
        RETURN QUERY SELECT NULL::uuid, false, 'VALIDATION_ERROR'::text,
            'Review content is invalid.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    IF p_customer_name IS NOT NULL
       AND char_length(btrim(p_customer_name)) NOT BETWEEN 2 AND 80 THEN
        RETURN QUERY SELECT NULL::uuid, false, 'VALIDATION_ERROR'::text,
            'Customer name is invalid.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    IF p_submission_key_hash IS NULL OR length(btrim(p_submission_key_hash)) <> 64 THEN
        RETURN QUERY SELECT NULL::uuid, false, 'VALIDATION_ERROR'::text,
            'Submission key is invalid.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    IF p_payload_hash IS NULL OR p_payload_hash !~ '^[0-9a-f]{64}$' THEN
        RETURN QUERY SELECT NULL::uuid, false, 'VALIDATION_ERROR'::text,
            'Submission payload hash is invalid.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    IF COALESCE(array_ndims(p_image_paths), 0) > 1
       OR COALESCE(array_ndims(p_sort_orders), 0) > 1 THEN
        RETURN QUERY SELECT NULL::uuid, false, 'VALIDATION_ERROR'::text,
            'Review photo metadata is invalid.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    v_image_count := COALESCE(array_length(p_image_paths, 1), 0);

    IF v_image_count <> COALESCE(array_length(p_sort_orders, 1), 0) OR v_image_count > 3 THEN
        RETURN QUERY SELECT NULL::uuid, false, 'VALIDATION_ERROR'::text,
            'Review photo metadata is invalid.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    v_path_prefix := p_review_id::text || '/';

    IF v_image_count > 0 THEN
        FOR v_index IN 1..v_image_count LOOP
            IF p_image_paths[v_index] IS NULL
               OR p_image_paths[v_index] = ''
               OR left(p_image_paths[v_index], length(v_path_prefix)) <> v_path_prefix
               OR p_sort_orders[v_index] IS NULL
               OR p_sort_orders[v_index] <> v_index - 1 THEN
                RETURN QUERY SELECT NULL::uuid, false, 'VALIDATION_ERROR'::text,
                    'Review photo metadata is invalid.'::text,
                    NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
                    NULL::text, NULL::text, NULL::timestamptz;
                RETURN;
            END IF;
        END LOOP;
    END IF;

    SELECT * INTO v_key_result
    FROM public.resolve_review_submission_key(
        p_submission_key_hash,
        p_payload_hash
    );

    v_key_status := v_key_result.status;

    IF v_key_status = 'CONFLICT' THEN
        RETURN QUERY SELECT NULL::uuid, false, 'SUBMISSION_KEY_CONFLICT'::text,
            'Submission key cannot be reused with different details.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    IF v_key_status = 'UNAVAILABLE' THEN
        RETURN QUERY SELECT NULL::uuid, false, 'REVIEW_UNAVAILABLE'::text,
            'The original review is no longer publicly available.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    IF v_key_status = 'DUPLICATE' THEN
        RETURN QUERY SELECT v_key_result.existing_review_id, true, 'DUPLICATE_SUBMISSION'::text,
            'This submission key has already been used.'::text,
            v_key_result.existing_user_id, v_key_result.existing_customer_name,
            v_key_result.existing_rating, v_key_result.existing_content,
            v_key_result.existing_status, v_key_result.existing_product_name_snapshot,
            v_key_result.existing_product_slug_snapshot, v_key_result.existing_created_at;
        RETURN;
    END IF;

    SELECT p.name, p.slug
    INTO v_product_name, v_product_slug
    FROM public.products p
    WHERE p.id = p_product_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::uuid, false, 'PRODUCT_NOT_FOUND'::text,
            'Product not found.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    v_product_public := public.is_product_public(p_product_id);

    IF NOT v_product_public THEN
        RETURN QUERY SELECT NULL::uuid, false, 'PRODUCT_NOT_PUBLIC'::text,
            'Product is not publicly available for reviews.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    INSERT INTO public.review_submission_keys (
        key_hash, review_id, created_at, payload_hash
    )
    VALUES (
        p_submission_key_hash, p_review_id, NOW(), p_payload_hash
    )
    ON CONFLICT (key_hash) DO NOTHING
    RETURNING key_hash INTO v_inserted_key;

    IF v_inserted_key IS NULL THEN
        SELECT * INTO v_key_result
        FROM public.resolve_review_submission_key(
            p_submission_key_hash, p_payload_hash
        );

        v_key_status := v_key_result.status;

        IF v_key_status = 'CONFLICT' THEN
            RETURN QUERY SELECT NULL::uuid, false, 'SUBMISSION_KEY_CONFLICT'::text,
                'Submission key cannot be reused with different details.'::text,
                NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
                NULL::text, NULL::text, NULL::timestamptz;
            RETURN;
        END IF;

        IF v_key_status = 'UNAVAILABLE' THEN
            RETURN QUERY SELECT NULL::uuid, false, 'REVIEW_UNAVAILABLE'::text,
                'The original review is no longer publicly available.'::text,
                NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
                NULL::text, NULL::text, NULL::timestamptz;
            RETURN;
        END IF;

        IF v_key_status = 'DUPLICATE' THEN
            RETURN QUERY SELECT v_key_result.existing_review_id, true, 'DUPLICATE_SUBMISSION'::text,
                'Concurrent duplicate submission detected.'::text,
                v_key_result.existing_user_id, v_key_result.existing_customer_name,
                v_key_result.existing_rating, v_key_result.existing_content,
                v_key_result.existing_status, v_key_result.existing_product_name_snapshot,
                v_key_result.existing_product_slug_snapshot, v_key_result.existing_created_at;
            RETURN;
        END IF;

        RETURN QUERY SELECT NULL::uuid, true, 'DUPLICATE_SUBMISSION'::text,
            'Concurrent duplicate submission detected.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    END IF;

    INSERT INTO public.product_reviews (
        id,
        product_id,
        user_id,
        customer_name,
        rating,
        content,
        status,
        product_name_snapshot,
        product_slug_snapshot,
        submission_key_hash
    )
    VALUES (
        p_review_id,
        p_product_id,
        p_user_id,
        p_customer_name,
        p_rating,
        p_content,
        'published',
        v_product_name,
        v_product_slug,
        p_submission_key_hash
    )
    RETURNING created_at INTO v_created_at;

    IF v_image_count > 0 THEN
        INSERT INTO public.product_review_images (
            review_id,
            storage_path,
            sort_order,
            created_at
        )
        SELECT
            p_review_id,
            p_image_paths[ordinal],
            p_sort_orders[ordinal],
            NOW()
        FROM generate_series(1, v_image_count) AS ordinal;
    END IF;

    RETURN QUERY SELECT p_review_id, false, NULL::text, NULL::text,
        p_user_id, p_customer_name, p_rating, p_content, 'published'::text,
        v_product_name, v_product_slug, v_created_at;
    RETURN;
EXCEPTION
    WHEN unique_violation THEN
        GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;

        IF v_constraint_name NOT IN ('review_submission_keys_pkey', 'uq_product_reviews_submission_key_hash') THEN
            RETURN QUERY SELECT NULL::uuid, false, 'DATABASE_ERROR'::text,
                'Review submission failed.'::text,
                NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
                NULL::text, NULL::text, NULL::timestamptz;
            RETURN;
        END IF;

        SELECT * INTO v_key_result
        FROM public.resolve_review_submission_key(
            p_submission_key_hash, p_payload_hash
        );

        v_key_status := v_key_result.status;

        IF v_key_status = 'CONFLICT' THEN
            RETURN QUERY SELECT NULL::uuid, false, 'SUBMISSION_KEY_CONFLICT'::text,
                'Submission key cannot be reused with different details.'::text,
                NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
                NULL::text, NULL::text, NULL::timestamptz;
            RETURN;
        END IF;

        IF v_key_status = 'UNAVAILABLE' THEN
            RETURN QUERY SELECT NULL::uuid, false, 'REVIEW_UNAVAILABLE'::text,
                'The original review is no longer publicly available.'::text,
                NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
                NULL::text, NULL::text, NULL::timestamptz;
            RETURN;
        END IF;

        IF v_key_status = 'DUPLICATE' THEN
            RETURN QUERY SELECT v_key_result.existing_review_id, true, 'DUPLICATE_SUBMISSION'::text,
                'Concurrent duplicate submission detected.'::text,
                v_key_result.existing_user_id, v_key_result.existing_customer_name,
                v_key_result.existing_rating, v_key_result.existing_content,
                v_key_result.existing_status, v_key_result.existing_product_name_snapshot,
                v_key_result.existing_product_slug_snapshot, v_key_result.existing_created_at;
            RETURN;
        END IF;

        RETURN QUERY SELECT NULL::uuid, true, 'DUPLICATE_SUBMISSION'::text,
            'Concurrent duplicate submission detected.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    WHEN check_violation THEN
        RETURN QUERY SELECT NULL::uuid, false, 'VALIDATION_ERROR'::text,
            'Review validation failed.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
    WHEN others THEN
        RETURN QUERY SELECT NULL::uuid, false, 'DATABASE_ERROR'::text,
            'Review submission failed.'::text,
            NULL::uuid, NULL::text, NULL::integer, NULL::text, NULL::text,
            NULL::text, NULL::text, NULL::timestamptz;
        RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_product_review(
    uuid, uuid, uuid, text, integer, text, text, text, text[], integer[]
) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_product_review(
    uuid, uuid, uuid, text, integer, text, text, text, text[], integer[]
) TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_review_submission_keys(max_age interval DEFAULT '30 days')
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    DELETE FROM public.review_submission_keys
    WHERE created_at < NOW() - max_age;
$$;

REVOKE ALL ON FUNCTION public.cleanup_review_submission_keys(interval) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_review_submission_keys(interval) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
