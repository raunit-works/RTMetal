-- Migration: Lockdown public table privileges to strict least-privilege (SELECT only)
-- Date: 2026-08-26
-- Target Owner Role: postgres
-- Target Schema: public

-- 1. REVOKE ALL PRIVILEGES ON EXISTING FOUNDATION TABLES FROM anon AND authenticated
REVOKE ALL PRIVILEGES ON TABLE public.categories FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.products FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.services FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.testimonials FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.faqs FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.site_settings FROM anon, authenticated;

-- 2. GRANT ONLY SELECT PRIVILEGE ON EXISTING FOUNDATION TABLES TO anon AND authenticated
GRANT SELECT ON TABLE public.categories TO anon, authenticated;
GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT SELECT ON TABLE public.services TO anon, authenticated;
GRANT SELECT ON TABLE public.testimonials TO anon, authenticated;
GRANT SELECT ON TABLE public.faqs TO anon, authenticated;
GRANT SELECT ON TABLE public.site_settings TO anon, authenticated;

-- 3. CONFIGURE ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
