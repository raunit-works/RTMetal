CREATE OR REPLACE FUNCTION public.get_admin_reviews_page(
    p_page integer,
    p_page_size integer,
    p_status text,
    p_rating integer,
    p_search text,
    p_division text,
    p_sort text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_page integer := greatest(1, least(coalesce(p_page, 1), 10000));
    v_page_size integer := greatest(1, least(coalesce(p_page_size, 8), 100));
    v_status text := nullif(lower(btrim(coalesce(p_status, ''))), 'all');
    v_rating integer := CASE WHEN p_rating BETWEEN 1 AND 5 THEN p_rating ELSE NULL END;
    v_division text := nullif(lower(btrim(coalesce(p_division, ''))), 'all');
    v_search text := left(btrim(coalesce(p_search, '')), 120);
    v_pattern text;
    v_result json;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Administrator access is required.'
            USING ERRCODE = '42501';
    END IF;

    IF v_status NOT IN ('published', 'archived') THEN
        v_status := NULL;
    END IF;

    IF v_division NOT IN ('home_decor', 'metal_services') THEN
        v_division := NULL;
    END IF;

    v_pattern := '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%';

    WITH filtered AS (
        SELECT
            r.id,
            r.product_id,
            r.user_id,
            r.customer_name,
            r.rating,
            r.content,
            r.status,
            r.product_name_snapshot,
            r.product_slug_snapshot,
            r.created_at,
            r.updated_at,
            p.name AS product_name,
            p.slug AS product_slug,
            json_build_object(
                'id', c.id,
                'name', c.name,
                'slug', c.slug,
                'main_section', c.main_section
            ) AS category
        FROM public.product_reviews r
        JOIN public.products p ON p.id = r.product_id
        JOIN public.categories c ON c.id = p.category_id
        WHERE (v_status IS NULL OR r.status = v_status)
          AND (v_rating IS NULL OR r.rating = v_rating)
          AND (v_division IS NULL OR c.main_section = v_division)
          AND (
              v_search = ''
              OR r.customer_name ILIKE v_pattern ESCAPE '\'
              OR r.content ILIKE v_pattern ESCAPE '\'
              OR r.product_name_snapshot ILIKE v_pattern ESCAPE '\'
              OR p.name ILIKE v_pattern ESCAPE '\'
              OR c.name ILIKE v_pattern ESCAPE '\'
          )
    ),
    total AS (
        SELECT count(*)::integer AS count FROM filtered
    ),
    paged AS (
        SELECT *
        FROM filtered
        ORDER BY
            CASE WHEN lower(coalesce(p_sort, '')) = 'oldest' THEN created_at END ASC NULLS LAST,
            CASE WHEN lower(coalesce(p_sort, '')) = 'oldest' THEN id END ASC NULLS LAST,
            CASE WHEN lower(coalesce(p_sort, '')) = 'oldest' THEN NULL ELSE created_at END DESC NULLS LAST,
            CASE WHEN lower(coalesce(p_sort, '')) = 'oldest' THEN NULL ELSE id END DESC NULLS LAST
        LIMIT v_page_size OFFSET ((v_page - 1) * v_page_size)
    ),
    rows_json AS (
        SELECT coalesce(
            json_agg(
                json_build_object(
                    'id', paged.id,
                    'product_id', paged.product_id,
                    'user_id', paged.user_id,
                    'customer_name', paged.customer_name,
                    'rating', paged.rating,
                    'content', paged.content,
                    'status', paged.status,
                    'product_name_snapshot', paged.product_name_snapshot,
                    'product_slug_snapshot', paged.product_slug_snapshot,
                    'created_at', paged.created_at,
                    'updated_at', paged.updated_at,
                    'product_review_images', coalesce(
                        (
                            SELECT json_agg(
                                json_build_object(
                                    'id', i.id,
                                    'review_id', i.review_id,
                                    'storage_path', i.storage_path,
                                    'sort_order', i.sort_order,
                                    'created_at', i.created_at
                                )
                                ORDER BY i.sort_order ASC, i.id ASC
                            )
                            FROM public.product_review_images i
                            WHERE i.review_id = paged.id
                        ),
                        '[]'::json
                    ),
                    'products', json_build_object(
                        'id', paged.product_id,
                        'name', paged.product_name,
                        'slug', paged.product_slug,
                        'category_id', NULL,
                        'categories', paged.category
                    )
                )
            ),
            '[]'::json
        ) AS rows
        FROM paged
    )
    SELECT json_build_object('rows', rows_json.rows, 'count', total.count)
    INTO v_result
    FROM rows_json
    CROSS JOIN total;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_reviews_page(integer, integer, text, integer, text, text, text)
    FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_reviews_page(integer, integer, text, integer, text, text, text)
    TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.sync_admin_notification_read_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NOT NEW.is_read THEN
        NEW.read_at := NULL;
    ELSIF NOT coalesce(OLD.is_read, false) THEN
        NEW.read_at := coalesce(NEW.read_at, now());
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_admin_notification_read_at() FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS admin_notifications_sync_read_at ON public.admin_notifications;
CREATE TRIGGER admin_notifications_sync_read_at
    BEFORE UPDATE ON public.admin_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_admin_notification_read_at();

REVOKE DELETE ON TABLE public.product_reviews FROM authenticated;
REVOKE DELETE ON TABLE public.product_review_images FROM authenticated;

DROP POLICY IF EXISTS product_reviews_admin_delete ON public.product_reviews;
DROP POLICY IF EXISTS product_review_images_admin_delete ON public.product_review_images;

REVOKE UPDATE ON TABLE public.products FROM authenticated;
DO $$
DECLARE
    v_columns text;
BEGIN
    SELECT string_agg(format('%I', column_name), ', ' ORDER BY ordinal_position)
    INTO v_columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name NOT IN ('rating', 'review_count');

    IF v_columns IS NOT NULL THEN
        EXECUTE format('GRANT UPDATE (%s) ON TABLE public.products TO authenticated', v_columns);
    END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
