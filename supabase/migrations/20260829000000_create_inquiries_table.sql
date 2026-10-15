-- Migration: Create public.inquiries table for Lead Management
-- Date: 2026-08-29
-- Step: 4.14 Customer Inquiry / Lead Database

-- 1. CREATE INQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
    email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone TEXT,
    message TEXT NOT NULL CHECK (char_length(trim(message)) >= 10),
    inquiry_type TEXT NOT NULL DEFAULT 'general' CHECK (inquiry_type IN ('general', 'product', 'service')),
    division TEXT NOT NULL DEFAULT 'home_decor' CHECK (division IN ('home_decor', 'metal_coating')),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    product_name_snapshot TEXT,
    service_name_snapshot TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'converted', 'closed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CREATE INDEXES FOR ADMIN QUERYING & FILTERING
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_division ON public.inquiries(division);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 4. PRIVILEGE LOCKDOWN & TABLE GRANTS
REVOKE ALL PRIVILEGES ON TABLE public.inquiries FROM anon, authenticated;
GRANT INSERT ON TABLE public.inquiries TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.inquiries TO authenticated;

-- 5. RLS POLICIES
-- Policy 1: Public / Authenticated Insert Lockdown
DROP POLICY IF EXISTS "inquiries_public_insert" ON public.inquiries;
CREATE POLICY "inquiries_public_insert"
    ON public.inquiries FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        status = 'new'
        AND admin_notes IS NULL
        AND (user_id IS NULL OR user_id = auth.uid())
        AND inquiry_type IN ('general', 'product', 'service')
        AND division IN ('home_decor', 'metal_coating')
    );

-- Policy 2: Admin Select Only
DROP POLICY IF EXISTS "inquiries_admin_select" ON public.inquiries;
CREATE POLICY "inquiries_admin_select"
    ON public.inquiries FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Policy 3: Admin Update Only (status & admin_notes)
DROP POLICY IF EXISTS "inquiries_admin_update" ON public.inquiries;
CREATE POLICY "inquiries_admin_update"
    ON public.inquiries FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Policy 4: Admin Delete Only
DROP POLICY IF EXISTS "inquiries_admin_delete" ON public.inquiries;
CREATE POLICY "inquiries_admin_delete"
    ON public.inquiries FOR DELETE
    TO authenticated
    USING (public.is_admin());
