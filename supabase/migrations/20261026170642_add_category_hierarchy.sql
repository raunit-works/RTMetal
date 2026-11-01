-- Migration: Add category hierarchy columns and ancestor-aware publication policies
-- Date: 2026-10-26
-- Target: staging rbucefvtkiohmaugvkyz only
-- Tables: public.categories
--
-- Additive only. Existing rows are NOT reclassified, reparented, republished,
-- or deleted. NULL values preserve current visibility and placement.

BEGIN;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS main_section text,
  ADD COLUMN IF NOT EXISTS parent_id uuid,
  ADD COLUMN IF NOT EXISTS is_published boolean;

ALTER TABLE public.categories ALTER COLUMN main_section DROP DEFAULT;
ALTER TABLE public.categories ALTER COLUMN parent_id DROP DEFAULT;
ALTER TABLE public.categories ALTER COLUMN is_published SET DEFAULT false;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_main_section_allowed
    CHECK (main_section IS NULL OR main_section IN ('home_decor', 'metal_services')),
  ADD CONSTRAINT categories_parent_requires_section
    CHECK (parent_id IS NULL OR main_section IS NOT NULL),
  ADD CONSTRAINT categories_not_own_parent CHECK (parent_id IS DISTINCT FROM id),
  ADD CONSTRAINT categories_id_section_unique UNIQUE (id, main_section),
  ADD CONSTRAINT categories_parent_same_section_fk
    FOREIGN KEY (parent_id, main_section) REFERENCES public.categories(id, main_section)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON public.categories(parent_id);

-- Ancestor-aware publication check (SECURITY DEFINER so public SELECT policies
-- can inspect draft ancestors without recursing into RLS itself).
CREATE FUNCTION public.is_category_public(category_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH RECURSIVE lineage AS (
    SELECT c.id, c.parent_id, c.main_section, c.is_published,
      ARRAY[c.id] AS visited, true AS compatible
    FROM public.categories c WHERE c.id = category_id
    UNION ALL
    SELECT c.id, c.parent_id, c.main_section, c.is_published,
      l.visited || c.id,
      l.compatible AND (c.main_section IS NOT DISTINCT FROM l.main_section)
    FROM public.categories c JOIN lineage l ON c.id = l.parent_id
    WHERE NOT c.id = ANY(l.visited)
  )
  SELECT COALESCE(
    bool_and(COALESCE(is_published, true) AND compatible)
    AND bool_or(parent_id IS NULL), false
  ) FROM lineage;
$$;
REVOKE ALL ON FUNCTION public.is_category_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_category_public(uuid) TO anon, authenticated;

ALTER POLICY "Allow public read access for categories" ON public.categories
  USING (public.is_category_public(id));
ALTER POLICY "Allow public read access for published products" ON public.products
  USING (is_published = true AND public.is_category_public(category_id));

COMMIT;
