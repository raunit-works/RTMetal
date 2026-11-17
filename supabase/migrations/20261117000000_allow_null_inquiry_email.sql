-- Migration: Make customer email optional on enquiries
-- Date: 2026-11-17
-- Name and mobile number are validated as mandatory by app/api/inquiries.
-- Email may be omitted; a blank value is stored as NULL, never a fake address.

ALTER TABLE public.inquiries
    ALTER COLUMN email DROP NOT NULL;

COMMENT ON COLUMN public.inquiries.email IS
    'Optional customer email address. NULL when the customer does not provide one.';

-- Existing email-format CHECK constraint is unaffected: PostgreSQL evaluates a
-- CHECK constraint as satisfied when the checked expression is NULL.
--
-- Rollback (only after backfilling every NULL email):
--   ALTER TABLE public.inquiries ALTER COLUMN email SET NOT NULL;
