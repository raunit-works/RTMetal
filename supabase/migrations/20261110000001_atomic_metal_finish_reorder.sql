-- Migration: Atomic administrator-protected Metal Finish reordering
-- Date: 2026-11-10
-- Target: review before applying to staging
--
-- Additive only. Depends on:
--   * public.is_admin() (20260827000001_create_is_admin_function.sql)
--   * public.metal_finishes (20261110000000_create_metal_finishes.sql)
--
-- This function serializes reorders with the insert trigger's advisory lock.
-- It locks every finish row, swaps two adjacent positions and renumbers the
-- complete collection in a single transaction. A partial client-side update
-- therefore cannot leave duplicate or skipped ordering values.
--
-- Rollback plan (only if explicitly approved):
--   DROP FUNCTION IF EXISTS public.reorder_metal_finish(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.reorder_metal_finish(
    p_id UUID,
    p_direction TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_ids UUID[];
    v_count INTEGER;
    v_index INTEGER;
    v_target INTEGER;
    v_swap UUID;
    v_position INTEGER;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrator access is required to reorder metal finishes.'
            USING ERRCODE = '42501';
    END IF;

    IF p_direction IS NULL OR p_direction NOT IN ('up', 'down') THEN
        RAISE EXCEPTION 'Direction must be "up" or "down".'
            USING ERRCODE = '22023';
    END IF;

    -- Same key as set_metal_finish_defaults(); serializes reorders with inserts.
    PERFORM pg_advisory_xact_lock(
        hashtextextended('rt_metal_finishes_display_order', 0)
    );

    SELECT array_agg(ordered.id ORDER BY ordered.display_order, ordered.created_at, ordered.id)
    INTO v_ids
    FROM (
        SELECT id, display_order, created_at
        FROM public.metal_finishes
        FOR UPDATE
    ) AS ordered;

    v_count := COALESCE(array_length(v_ids, 1), 0);
    IF v_count = 0 THEN
        RETURN;
    END IF;

    SELECT idx
    INTO v_index
    FROM generate_subscripts(v_ids, 1) AS idx
    WHERE v_ids[idx] = p_id;

    IF v_index IS NULL THEN
        RAISE EXCEPTION 'Metal finish not found.'
            USING ERRCODE = '23503';
    END IF;

    v_target := CASE
        WHEN p_direction = 'up' THEN v_index - 1
        ELSE v_index + 1
    END;

    IF v_target < 1 OR v_target > v_count THEN
        RETURN;
    END IF;

    v_swap := v_ids[v_target];
    v_ids[v_target] := v_ids[v_index];
    v_ids[v_index] := v_swap;

    FOR v_position IN 1..v_count LOOP
        UPDATE public.metal_finishes
        SET display_order = v_position
        WHERE id = v_ids[v_position]
          AND display_order IS DISTINCT FROM v_position;
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_metal_finish(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_metal_finish(UUID, TEXT) TO authenticated;

-- Re-assert trigger-function hardening in case the base migration was applied
-- before this review. The defaults helper is SECURITY DEFINER and must not be
-- exposed as a normal authenticated RPC.
REVOKE ALL ON FUNCTION public.set_metal_finish_defaults() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_metal_finish_defaults() TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
