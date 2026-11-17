-- Migration: Add product archiving (soft‑delete) support
-- Date: 2026-11-13
-- Additive only – existing rows keep their current values.
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.is_archived IS
    'When true the product is hidden from public catalogues but retained for audit/history.';