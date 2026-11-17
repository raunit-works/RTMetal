-- Migration: Add product pinning support
-- Date: 2026-11-13
-- Additive only – existing rows keep their current values.
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS pinned_at timestamptz;

-- Optional: index for fast pin‑first ordering
CREATE INDEX IF NOT EXISTS products_pinned_idx
    ON public.products (is_pinned DESC, pinned_at NULLS FIRST, created_at DESC);

-- Comment to document the purpose
COMMENT ON COLUMN public.products.is_pinned IS
    'When true the product appears at the top of relevant admin and public listings.';
COMMENT ON COLUMN public.products.pinned_at IS
    'Timestamp of when the product was pinned; used for deterministic ordering when multiple products are pinned.';