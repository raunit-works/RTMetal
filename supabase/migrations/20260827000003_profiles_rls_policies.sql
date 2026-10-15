-- Migration: Create Row Level Security policies for public.profiles
-- Date: 2026-08-27
-- Step: 4.5 Production-Safe Profiles RLS Policies

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable table-level DML grants for authenticated role so RLS policies can evaluate
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;

-- Drop existing policies if any
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

-- 1. SELECT own profile
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() = id
);

-- 2. SELECT admin
CREATE POLICY "profiles_select_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    public.is_admin()
);

-- 3. UPDATE own customer profile (Role escalation prevented!)
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    auth.uid() = id
    AND NOT public.is_admin()
)
WITH CHECK (
    auth.uid() = id
    AND role = 'customer'
);

-- 4. UPDATE admin
CREATE POLICY "profiles_update_admin"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

-- 5. INSERT admin only
CREATE POLICY "profiles_insert_admin"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);

-- 6. DELETE admin only
CREATE POLICY "profiles_delete_admin"
ON public.profiles
FOR DELETE
TO authenticated
USING (
    public.is_admin()
);
