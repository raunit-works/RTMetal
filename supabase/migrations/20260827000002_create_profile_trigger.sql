-- Migration: Create auth.users -> public.profiles trigger
-- Date: 2026-08-27
-- Step: 4.4 Production-Safe Auth User -> Profile Trigger

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        avatar_url,
        phone,
        role
    )
    VALUES (
        NEW.id,
        NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
        NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')), ''),
        NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
        'customer'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Revoke execution privileges from PUBLIC
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Drop trigger if it exists and recreate on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
