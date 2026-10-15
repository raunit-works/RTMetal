-- Migration: Create public.is_admin helper function
-- Date: 2026-08-27
-- Step: 4.3 Production-Safe is_admin() Function

CREATE OR REPLACE FUNCTION public.is_admin(
    user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        (
            SELECT role = 'admin'
            FROM public.profiles
            WHERE id = user_id
        ),
        FALSE
    );
$$;

-- Harden execution privileges
REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, service_role;
