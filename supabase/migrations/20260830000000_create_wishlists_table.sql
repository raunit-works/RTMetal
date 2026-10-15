-- Migration: Create public.wishlists table for persistent customer wishlist
-- Date: 2026-08-30
-- Step: 4.15 Customer Account & Persistent Wishlist

-- 1. CREATE WISHLISTS TABLE
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_product_wishlist UNIQUE (user_id, product_id)
);

-- 2. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_product ON public.wishlists(user_id, product_id);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- 4. PRIVILEGE LOCKDOWN
REVOKE ALL PRIVILEGES ON TABLE public.wishlists FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.wishlists TO authenticated;

-- 5. RLS POLICIES: CUSTOMER OWNERSHIP ISOLATION
DROP POLICY IF EXISTS "wishlists_select_own" ON public.wishlists;
CREATE POLICY "wishlists_select_own"
    ON public.wishlists FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlists_insert_own" ON public.wishlists;
CREATE POLICY "wishlists_insert_own"
    ON public.wishlists FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlists_delete_own" ON public.wishlists;
CREATE POLICY "wishlists_delete_own"
    ON public.wishlists FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
