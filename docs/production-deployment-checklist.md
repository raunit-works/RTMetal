# Production Deployment Checklist — RT METALCOATING / RT HOME DECOR

Status: **planning only — nothing in this document has been executed.**
No migration, environment change, bucket change or deployment has been applied to
production. Every step below requires explicit approval before it is run.

Last reviewed: 2026-11-17 (branch `opencode-development`, Next.js 13.5.1).

---

## 0. Pre-flight

- [ ] Confirm the release branch and the exact commit being deployed.
- [ ] Confirm no uncommitted working-tree changes are needed at deploy time
      (`git status --porcelain` must be reviewed; do **not** use `git add .`).
- [ ] Take a full database backup (see §7) **before** running any migration.
- [ ] Confirm a rollback path: previous deployment identifier + previous schema
      snapshot are both recoverable.
- [ ] Confirm `npm run typecheck`, `npm run lint` and `npm run build` pass on the
      release commit in CI.

---

## 1. Production environment variables

Set these in the hosting provider's environment configuration (do **not** commit
`.env` files). Names below are the exact identifiers read by the code.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Production Supabase project URL. Read by `lib/supabase/server.ts`, `lib/supabase/client.ts`, `next.config.js`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Publishable/anon key for the production project. `createSupabaseServerClient()` throws on start-up if it is missing. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical production origin, e.g. `https://www.example.com`. Used by `lib/site-url.ts` for canonical URLs, sitemap and robots. |
| `SITE_URL` | Fallback | Used by `lib/site-url.ts` when `NEXT_PUBLIC_SITE_URL` is absent. |
| `VERCEL_URL` / `VERCEL_PROJECT_PRODUCTION_URL` | Fallback | Auto-provided on Vercel; used by `lib/site-url.ts` when the explicit site URL is not set. |

Explicitly **not** required (no service-role key is used anywhere in the app):
there is no `SUPABASE_SERVICE_ROLE_KEY` in the codebase. Admin operations run
through the browser client and are gated by Row Level Security plus
`public.is_admin()`.

**Verification after the variables are set**

- [ ] `GET /` returns 200 and the canonical/OG URLs use the production origin.
- [ ] `GET /sitemap.xml` and `/robots.txt` use the production origin.
- [ ] `/_next/image?url=<absolute Supabase storage URL>` returns an image, not
      a 400/500 (see §5).

---

## 2. Database migrations

Migrations live in `supabase/migrations/` and must be applied in filename order.
Use `supabase db push` (linked project) or `psql -f <file>` in order.

Newer files (not yet recorded as applied in production — verify with
`supabase migration list` before running):

| Order | File | Purpose |
|---|---|---|
| 1 | `20261112000000_create_product_variants.sql` | Creates `product_options`, `product_option_values`, `product_variants`, `product_variant_options`, `product_variant_images`; enables RLS; creates public-select and admin-only policies. |
| 2 | `20261112000001_add_inquiry_variant_reference.sql` | Adds `inquiries.variant_id`, `variant_name_snapshot`, `variant_sku_snapshot`. |
| 3 | `20261113000000_add_product_pinning.sql` | Adds product pinning columns. |
| 4 | `20261113000001_add_product_archive.sql` | Adds product archive columns. |

Already-applied history that must exist before the above: the foundation,
profiles/`is_admin`, catalog RLS, storage, inquiries, wishlist, category
hierarchy, before/after, service categories and metal-finishes migrations
(`20260824…` → `20261110…`).

**Order matters:** `20261112000001` adds inquiry columns that the API route
writes to. Applying it before `20261112000000` leaves the variant tables missing
and the enquiry route will fail with a 400 ("Referenced finish not found").

- [ ] `supabase migration list` shows the pending files.
- [ ] Apply migrations one at a time, checking the output of each.
- [ ] After applying, confirm the new tables exist and are RLS-enabled:
      `select relname, relrowsecurity from pg_class where relname like 'product_variant%' or relname like 'product_option%';`
- [ ] Confirm the inquiry columns exist:
      `select column_name from information_schema.columns where table_name='inquiries' and column_name like 'variant%';`

---

## 3. Storage bucket

- [ ] Bucket `catalog-images` exists, is **public** and has the same limits as
      staging: file size limit `5242880` (5 MB) and allowed MIME types
      `image/jpeg`, `image/png`, `image/webp`, `image/gif`
      (see `supabase/migrations/20260827000005_cms_fields_and_storage.sql`).
- [ ] The bucket is **not** shared between staging and production — a
      production bucket is required so staging uploads cannot leak into the
      live catalogue.
- [ ] Existing catalogue images are copied into the production bucket (see §7)
      and their `products.image`, `product_images.image_url` and
      `product_variant_images.image_url` rows are rewritten to the production
      storage URLs.
- [ ] Product variant images for the seeded finishes (for example the Ashok
      Stambh finishes) exist in the production bucket with the same three
      images per finish.

---

## 4. Row Level Security

The variant migration ships its own policies; verify each category explicitly.

- [ ] `public.is_admin()` exists and returns the expected result for the admin
      account used by the CMS.
- [ ] Public read policies exist on: `product_options`,
      `product_option_values`, `product_variants`, `product_variant_options`,
      `product_variant_images`.
- [ ] Admin insert/update/delete policies exist on the same five tables and
      are gated by `public.is_admin()`.
- [ ] Storage policies on `storage.objects` for `catalog-images`:
      - `Public Read Catalog Images` — `SELECT TO public`
      - `Admin Upload / Update / Delete Catalog Images` — `TO authenticated`
        with `public.is_admin()`
- [ ] Spot-check that an anonymous session **cannot** write to the variant
      tables, and that an admin session can.

---

## 5. Public image host configuration

`next.config.js` derives the allowed remote image host from
`NEXT_PUBLIC_SUPABASE_URL`:

```js
...(supabaseImageHost
  ? [{ protocol: 'https', hostname: supabaseImageHost, pathname: '/storage/v1/object/**' }]
  : []),
```

Consequences and checks:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` **must** be set at build time, otherwise the
      production Supabase host is not added to `remotePatterns` and every
      catalogue image fails with
      `Invalid src prop ... hostname is not configured under images in next.config.js`.
- [ ] The image host is derived automatically, so no manual hostname edit is
      needed when the production project differs from staging.
- [ ] Existing allowances are preserved: `images.unsplash.com`,
      `images.pexels.com`, `thumb.wikimedia.org`, `upload.wikimedia.org`.
- [ ] After deploying, request one catalogue image through the optimiser and
      confirm HTTP 200 with an `image/webp` content type (the config uses
      `formats: ['image/webp']` and `minimumCacheTTL: 31536000`).
- [ ] Confirm `public/images/placeholder.png` is present in the deployed build
      (the fallback used when a product has no valid image).

---

## 6. Application-level release checks

Run against the deployed production URL.

- [ ] `/home-decor`, `/home-decor/category/sculptures-figurines` and a product
      detail page render with **zero console errors**.
- [ ] Every `<Image>` has an explicit size or `fill` (the missing-width error
      crashes the page in production exactly as it did in staging).
- [ ] Finish chips render as labelled chips and selecting a finish swaps the
      card image and the enquiry pre-fill (product id, variant id, finish, SKU).
- [ ] "Enquire Now" lands on the enquiry form with the message pre-filled.
- [ ] Submitting the enquiry form stores the row with `product_id` and
      `variant_id` populated, and the finish/SKU snapshots are set.
- [ ] Admin → Products shows the finish editor and saves a finish successfully.
- [ ] Admin → Inquiries shows the finish name/SKU for a new enquiry.

---

## 7. Backup and rollback

- [ ] **Pre-migration backup**: `supabase db dump` (or a managed point-in-time
      recovery snapshot) taken immediately before §2 is run, and stored
      off-site.
- [ ] **Storage backup**: copy the `catalog-images` bucket contents (for
      example with the Supabase CLI storage export) before any bulk copy or
      re-pointing of image URLs.
- [ ] **Catalog export**: `COPY (select * from products) TO ...` and the same
      for `product_images`, `product_variants`, `product_variant_images` and
      `inquiries`, so catalogue and enquiry data can be restored independently
      of the schema.
- [ ] Rollback plan for a failed migration: restore the dump, redeploy the
      previous build identifier, and confirm `/home-decor` renders again.
- [ ] Rollback plan for a failed image re-point: keep the previous
      `image_url` values in the export so rows can be restored without
      re-uploading files.
- [ ] Verify the backup can actually be restored (a backup that has never been
      restored is not a backup).

---

## 8. Sign-off

- [ ] Approved by: ______________________  Date: ____________
- [ ] Migrations applied by: ___________  Date: ____________
- [ ] Deployment executed by: __________  Date: ____________
- [ ] Post-deploy smoke test completed by: __________  Date: ____________

**Nothing in this checklist has been executed. Do not run any step without
explicit approval.**
