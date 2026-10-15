-- Migration: Add Admin RLS Write Policies & Table Grants for Foundation Catalog Tables
-- Date: 2026-08-27
-- Step: 4.9 & 4.12 Admin Catalog Management & Admin SELECT Access

-- 1. Table-level DML grants for authenticated role (anon remains SELECT-only)
GRANT INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.testimonials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.faqs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.site_settings TO authenticated;

-- 2. Drop existing admin policies if any
DROP POLICY IF EXISTS "categories_admin_select" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_update" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;

DROP POLICY IF EXISTS "products_admin_select" ON public.products;
DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
DROP POLICY IF EXISTS "products_admin_update" ON public.products;
DROP POLICY IF EXISTS "products_admin_delete" ON public.products;

DROP POLICY IF EXISTS "services_admin_select" ON public.services;
DROP POLICY IF EXISTS "services_admin_insert" ON public.services;
DROP POLICY IF EXISTS "services_admin_update" ON public.services;
DROP POLICY IF EXISTS "services_admin_delete" ON public.services;

DROP POLICY IF EXISTS "testimonials_admin_select" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_admin_insert" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_admin_update" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_admin_delete" ON public.testimonials;

DROP POLICY IF EXISTS "faqs_admin_select" ON public.faqs;
DROP POLICY IF EXISTS "faqs_admin_insert" ON public.faqs;
DROP POLICY IF EXISTS "faqs_admin_update" ON public.faqs;
DROP POLICY IF EXISTS "faqs_admin_delete" ON public.faqs;

DROP POLICY IF EXISTS "site_settings_admin_select" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_admin_insert" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_admin_update" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_admin_delete" ON public.site_settings;

-- 3. Categories Admin Policies
CREATE POLICY "categories_admin_select" ON public.categories FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "categories_admin_insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "categories_admin_update" ON public.categories FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "categories_admin_delete" ON public.categories FOR DELETE TO authenticated USING (public.is_admin());

-- 4. Products Admin Policies (Allows Admin to SELECT unpublished rows)
CREATE POLICY "products_admin_select" ON public.products FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "products_admin_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "products_admin_update" ON public.products FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "products_admin_delete" ON public.products FOR DELETE TO authenticated USING (public.is_admin());

-- 5. Services Admin Policies (Allows Admin to SELECT unpublished rows)
CREATE POLICY "services_admin_select" ON public.services FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "services_admin_insert" ON public.services FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "services_admin_update" ON public.services FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "services_admin_delete" ON public.services FOR DELETE TO authenticated USING (public.is_admin());

-- 6. Testimonials Admin Policies (Allows Admin to SELECT unpublished rows)
CREATE POLICY "testimonials_admin_select" ON public.testimonials FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "testimonials_admin_insert" ON public.testimonials FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "testimonials_admin_update" ON public.testimonials FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "testimonials_admin_delete" ON public.testimonials FOR DELETE TO authenticated USING (public.is_admin());

-- 7. FAQs Admin Policies (Allows Admin to SELECT unpublished rows)
CREATE POLICY "faqs_admin_select" ON public.faqs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "faqs_admin_insert" ON public.faqs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "faqs_admin_update" ON public.faqs FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "faqs_admin_delete" ON public.faqs FOR DELETE TO authenticated USING (public.is_admin());

-- 8. Site Settings Admin Policies
CREATE POLICY "site_settings_admin_select" ON public.site_settings FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "site_settings_admin_insert" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "site_settings_admin_update" ON public.site_settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "site_settings_admin_delete" ON public.site_settings FOR DELETE TO authenticated USING (public.is_admin());
