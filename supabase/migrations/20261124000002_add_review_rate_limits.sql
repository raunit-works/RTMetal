-- Migration: Add rate limiting and idempotency support for product reviews
-- Date: 2026-11-24
-- Phase: 2 (backend implementation support)
--
-- Additive. Creates tables for rate limiting and submission deduplication.
-- Must run after 20261124000000_create_product_reviews.sql

BEGIN;

-- Rate limiting table: tracks hashed client identifiers per time window
CREATE TABLE IF NOT EXISTS public.review_rate_limits (
    window_key TEXT PRIMARY KEY,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_rate_limits_window_start
    ON public.review_rate_limits(window_start);

COMMENT ON TABLE public.review_rate_limits IS
    'Rate limiting for review submissions. window_key = HMAC(client_ip, secret):window_ms.';

-- Submission idempotency table: prevents duplicate submissions
CREATE TABLE IF NOT EXISTS public.review_submission_keys (
    key_hash TEXT PRIMARY KEY,
    review_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'review_submission_keys'
          AND column_name = 'review_id'
    ) THEN
        ALTER TABLE public.review_submission_keys
            ADD COLUMN review_id UUID NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'review_submission_keys_review_id_fkey'
          AND conrelid = 'public.review_submission_keys'::regclass
    ) THEN
        ALTER TABLE public.review_submission_keys
            ADD CONSTRAINT review_submission_keys_review_id_fkey
            FOREIGN KEY (review_id) REFERENCES public.product_reviews(id)
            ON DELETE SET NULL
            DEFERRABLE INITIALLY DEFERRED;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'review_submission_keys'
          AND column_name = 'payload_hash'
    ) THEN
        ALTER TABLE public.review_submission_keys ADD COLUMN payload_hash text NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'review_submission_keys_payload_hash_format'
          AND conrelid = 'public.review_submission_keys'::regclass
    ) THEN
        ALTER TABLE public.review_submission_keys
            ADD CONSTRAINT review_submission_keys_payload_hash_format
            CHECK (payload_hash IS NULL OR payload_hash ~ '^[0-9a-f]{64}$');
    END IF;
END;
$$;

COMMENT ON TABLE public.review_submission_keys IS
    'Deduplication for review submissions. Stores HMAC(submission_key, secret) and SHA-256 of the normalized payload, including ordered image-content fingerprints; no raw review PII.';

-- RLS for rate limits: only service_role should access (no public policies)
ALTER TABLE public.review_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_submission_keys ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated - only service_role bypasses RLS
-- This is intentional: these tables are for server-side rate limiting only.

REVOKE ALL ON TABLE public.review_rate_limits FROM anon, authenticated;
REVOKE ALL ON TABLE public.review_submission_keys FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.review_rate_limits TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.review_submission_keys TO service_role;

-- Function to clean old rate limit entries (can be called by cron or on insert)
CREATE OR REPLACE FUNCTION public.cleanup_review_rate_limits(max_age interval DEFAULT '24 hours')
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    DELETE FROM public.review_rate_limits
    WHERE updated_at < NOW() - max_age;
$$;

REVOKE ALL ON FUNCTION public.cleanup_review_rate_limits(interval) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_review_rate_limits(interval) TO service_role;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'product_reviews'
          AND column_name = 'submission_key_hash'
    ) THEN
        ALTER TABLE public.product_reviews
            ADD COLUMN submission_key_hash TEXT;
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_reviews_submission_key_hash
    ON public.product_reviews(submission_key_hash)
    WHERE submission_key_hash IS NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;