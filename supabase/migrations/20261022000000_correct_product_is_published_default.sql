-- Migration: Correct products.is_published column default to FALSE
-- Date: 2026-10-22
-- Reason: Foundation migration 20260824000000 set DEFAULT TRUE, making new
--         products immediately visible to public. RT Metals requires all new
--         products to start as drafts (is_published = false) so admin can
--         review before publishing.
-- Safety: Only changes the column DEFAULT. Does NOT backfill existing rows.
--         Existing published/unpublished product states are preserved.

ALTER TABLE public.products
  ALTER COLUMN is_published SET DEFAULT false;
