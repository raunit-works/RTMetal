-- Migration: Create the private review-photos storage bucket
-- Date: 2026-11-24
-- Phase: 1 (database + backend foundation only)
--
-- The bucket is private. Public read is granted through an RLS policy that only
-- exposes objects attached to a published review whose product is publicly
-- visible (public.is_review_photo_public, defined in
-- 20261124000000_create_product_reviews.sql). Uploads are performed by the
-- Phase 2 server route with the service-role key and are NOT granted to
-- anon/authenticated.
--
-- Object path convention: <review_id>/<uuid>.<ext>
-- The same path is stored in public.product_review_images.storage_path.

-- NOTE: the existing 'catalog-images' bucket and its policies are not touched.
--
-- Bucket creation is deliberately conservative: an unexpected pre-existing
-- 'review-photos' bucket is never silently overwritten. If it exists with
-- incompatible settings the migration raises and rolls back.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'review-photos',
    'review-photos',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
    existing_public boolean;
    existing_limit bigint;
    existing_mimes text[];
BEGIN
    SELECT b."public", b.file_size_limit, b.allowed_mime_types
    INTO existing_public, existing_limit, existing_mimes
    FROM storage.buckets b
    WHERE b.id = 'review-photos';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'review-photos bucket does not exist after insert';
    END IF;

    IF existing_public IS DISTINCT FROM false THEN
        RAISE EXCEPTION
            'review-photos bucket already exists but is not private (public=%). Refusing to modify it.',
            existing_public;
    END IF;

    IF existing_limit IS DISTINCT FROM 5242880 THEN
        RAISE EXCEPTION
            'review-photos bucket already exists with file_size_limit=% (expected 5242880). Refusing to modify it.',
            existing_limit;
    END IF;

    IF existing_mimes IS NULL
       OR NOT (existing_mimes @> ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
       OR NOT (existing_mimes <@ ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
    THEN
        RAISE EXCEPTION
            'review-photos bucket already exists with allowed_mime_types=% (expected jpeg/png/webp). Refusing to modify it.',
            existing_mimes;
    END IF;
END;
$$;

DROP POLICY IF EXISTS "Public Read Review Photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Review Photos" ON storage.objects;

CREATE POLICY "Public Read Review Photos" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (
        bucket_id = 'review-photos'
        AND public.is_review_photo_public(name)
    );

CREATE POLICY "Admin Delete Review Photos" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'review-photos' AND public.is_admin());

NOTIFY pgrst, 'reload schema';

COMMIT;
