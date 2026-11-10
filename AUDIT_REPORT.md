# RTMETALCOATING — COMPLETE WEBSITE AUDIT & GAP ANALYSIS

**Audit type:** Read-only architecture & requirements audit  
**Repository:** D:\Client Project\RT METAL\project  
**Branch:** opencode-development (substantial uncommitted modified/untracked work present)  
**Status:** No files modified. No database connections. No migrations executed.  
**Date:** Wed Oct 28 2026

---

## A. EXECUTIVE ASSESSMENT

### Current architecture
- **Framework:** Next.js 13.5.1 App Router (confirmed in package.json)
- **React 18.2.0, TypeScript 5.2.2, Tailwind CSS 3.3.3**
- **Backend:** Supabase (@supabase/supabase-js ^2.58.0, @supabase/ssr ^0.12.5)
- **Auth:** Supabase Auth (email/password), server + browser + middleware clients
- **Payments:** NONE. No cart, no checkout, no payment gateway, no order model anywhere in the codebase.
- **Data access pattern:** Dual-mode — async Supabase queries with static fallback from `lib/data.ts` in development; production returns empty/safe state on failure.

### Overall implementation maturity
| Area | Maturity |
|------|----------|
| Next.js App Router pages & routing | Mature |
| Supabase schema (catalog, profiles, inquiries, wishlists, product_images, RLS) | Mature / well-designed |
| Admin CMS workspace (categories, products, services, FAQs, testimonials, inquiries) | Mature |
| Enquiry workflow (form + API + DB + admin status tracking) | Mature |
| WhatsApp enquiry integration | Present (UI + links), placeholder numbers |
| RT HOME DECOR ecommerce (cart, checkout, payments, orders, shipping) | **NOT IMPLEMENTED** |
| Product variants, SKU inventory, pricing, coupons | **NOT IMPLEMENTED** |
| Metal-coating service detail pages | **NOT IMPLEMENTED** (anchor links only) |

**Headline:** The site is a credible enquiry-based metal-coating showcase with a functioning admin CMS and enquiry ledger, but it is **not an ecommerce store**. Zero ecommerce infrastructure (cart, checkout, payment, orders, shipping, inventory) exists. Converting it to support RT HOME DECOR retail is a substantial build, not a configuration change.

---

## B. ACTUAL ROUTE AND COMPONENT INVENTORY

### App routes

| Route | Purpose | Principal file | Data source | Status | Missing requirements |
|-------|---------|----------------|-------------|--------|---------------------|
| `/` | Homepage: hero, divisions, materials, before/after, process, featured products, metal showcase, testimonials, FAQ, contact, CTA | `app/page.tsx` | `getPublicCatalogAsync`, `getTestimonialsAsync`, `getFAQsAsync`, `getInstagramPosts` (Supabase w/ static fallback) | Implemented | 7-stage process (currently 5), correct service catalogue, RT HOME DECOR branding |
| `/about` | About Us: story, two divisions, philosophy | `app/about/page.tsx` | Static (hardcoded Pexels images) | Implemented | RT HOME DECOR / Mumbai + Wai addresses, full company narrative |
| `/home-decor` | Catalog listing with category chips, filters, sort | `app/home-decor/page.tsx` → `CategoryCatalogPage` → `HomeDecorCatalog` | `getPublicCatalogAsync()` | Implemented | Cart, checkout, pricing, 7 required category groups |
| `/home-decor/category/[slug]` | Category detail listing | `app/home-decor/category/[slug]/page.tsx` | `getCategoriesAsync()` | Implemented | Published/unpublished category enforcement verified via RLS |
| `/home-decor/[slug]` | Product detail: gallery, specs, WhatsApp enquiry, related | `app/home-decor/[slug]/page.tsx` | `getPublicProductBySlugAsync()` | Implemented (enquiry-only) | **No price display, no Add to Cart, no Buy Now, no variants** |
| `/metal-coating` | Metal services landing: 9 service cards as anchors to same page (`#slug`), process, industries, CTA | `app/metal-coating/page.tsx` | `getServicesAsync()` + `mergeCuratedServices()` | Implemented | **No dedicated service detail pages**, no service enquiry CTA per service, no PVD/PU/Powder Coating |
| `/admin` | Admin workspace (protected by middleware + `verifyAdminAccess`) | `app/admin/page.tsx` → `AdminWorkspace` | Supabase browser client | Implemented | No order/shipping/coupon/refund admin |
| `/account` | Customer profile: edit name/phone, wishlist shortcut | `app/account/page.tsx` | `getCustomerProfile`, `updateCustomerProfile` | Implemented | Order history, address management |
| `/wishlist` | Saved products (auth required) | `app/wishlist/page.tsx` | `getWishlistProducts()` | Implemented | No guest wishlist |
| `/login` | Email/password sign in | `app/login/page.tsx` | Supabase Auth | Implemented | — |
| `/signup` | Account creation | `app/signup/page.tsx` | Supabase Auth | Implemented | — |
| `/forgot-password` | Password reset | `app/forgot-password/page.tsx` | Supabase Auth | Implemented | — |
| `/reset-password` | Reset form | `app/reset-password/page.tsx` | Supabase Auth | Implemented | — |
| `/api/inquiries` | POST enquiry submission (validates, binds user, snapshots product/service, inserts into `inquiries`, status=new) | `app/api/inquiries/route.ts` | Supabase server client | Implemented | WhatsApp message dispatch not integrated |

### Key shared components

| Component | File | Function |
|-----------|------|----------|
| Navbar | `components/layout/navbar.tsx` | Mega-menu (Home Decor categories), Services dropdown, WhatsApp, auth, admin link, wishlist count |
| Footer | `components/layout/footer.tsx` | Collections links, services links, contact, social, privacy/terms links (to `/`) |
| ProductCard | `components/sections/product-card.tsx` | Image, wishlist toggle, QuickView modal, **WhatsApp enquiry only** (no price/cart) |
| ProductImageGallery | `components/sections/product-image-gallery.tsx` | Main image + thumbnails |
| CategoryCatalogPage | `components/sections/category-catalog-page.tsx` | Routes to HomeDecorCatalog |
| HomeDecorCatalog | `components/sections/home-decor-catalog.tsx` | Category chips, sort, product grid, Load More (nonfunctional) |
| MetalCoatingClient | `components/sections/metal-coating-client.tsx` | Metal-coating page UI (services, process, industries) |
| AdminWorkspace | `components/admin/admin-workspace.tsx` | Full CMS: categories, products, services, testimonials, FAQs, settings, inquiries |
| WishlistProvider | `components/providers/wishlist-provider.tsx` | Auth-gated wishlist, guest sign-in prompt |

### Supabase client/server files

| File | Role |
|------|------|
| `lib/supabase/server.ts` | `createSupabaseServerClient()` (Next headers cookies) |
| `lib/supabase/client.ts` | `createSupabaseBrowserClient()` (alias `createSupabaseClient`) |
| `lib/supabase/auth.ts` | `getAuthUser`, `getAuthSession` |
| `lib/supabase/admin.ts` | `verifyAdminAccess()` via `rpc('is_admin')` |
| `lib/supabase/profile.ts` | `getCustomerProfile`, `updateCustomerProfile` |
| `lib/supabase/wishlist.ts` | Wishlist CRUD (auth.uid() scoped) |
| `lib/supabase/inquiries.ts` | `createInquiry` (API route client), `getInquiriesAdmin`, `updateInquiryStatusAdmin`, `deleteInquiryAdmin` |
| `lib/supabase/admin-catalog.ts` | Full admin CRUD for categories/products/services/testimonials/FAQs/settings, image upload to `catalog-images` bucket |
| `lib/supabase/data-mapper.ts` | DB row → UI type mapping |
| `lib/supabase/middleware.ts` | Session refresh + `/admin` auth guard |

### Data layer

| File | Role |
|------|------|
| `lib/data.ts` | Static fallback: 8 products, 6 categories, 9 services, testimonials, FAQs, 5 process steps, industries, business divisions |
| `lib/data-access.ts` | Async Supabase API (`getProductsAsync`, `getCategoriesAsync`, `getServicesAsync`, `getPublicCatalogAsync`, etc.) + sync static wrappers |
| `lib/category-hierarchy.ts` | Hierarchy validation, descendant slugs, section membership, category paths |
| `lib/site.ts` | `siteSettings` (brandName "RT METALS", placeholder contact/WhatsApp), WhatsApp link helpers |
| `lib/types.ts` | Shared TypeScript interfaces (Product, Category, Service, Inquiry, UserProfile, WishlistItem, SiteSettings) |

### Migrations (supabase/migrations/)

| File | Purpose | Verified from file |
|------|---------|-------------------|
| `20260824000000_create_foundation_tables.sql` | categories, products, services, testimonials, faqs, site_settings + RLS public read | YES |
| `20260826000000_lockdown_public_table_privileges.sql` | REVOKE all, GRANT SELECT only to anon/authenticated | YES |
| `20260827000000_create_profiles_table.sql` | profiles (id, full_name, avatar_url, phone, role customer/admin) | YES |
| `20260827000001_create_is_admin_function.sql` | `public.is_admin()` SECURITY DEFINER | YES |
| `20260827000002_create_profile_trigger.sql` | auth.users → profiles trigger (default role='customer') | YES |
| `20260827000003_profiles_rls_policies.sql` | Profiles RLS (select own/admin, update own w/ role escalation guard) | YES |
| `20260827000004_catalog_admin_rls_policies.sql` | Admin insert/update/delete/select on all catalog tables via `is_admin()` | YES |
| `20260827000005_cms_fields_and_storage.sql` | sku, sub_category, material, color_finish, dimensions, weight, stock_status, features, care_instructions, is_featured, display_order on products; process_steps, applications on services; product_images table; `catalog-images` storage bucket | YES |
| `20260829000000_create_inquiries_table.sql` | inquiries table + RLS (public insert, admin select/update/delete) | YES |
| `20260830000000_create_wishlists_table.sql` | wishlists (user_id, product_id, unique constraint) + RLS | YES |
| `20260831000000_make_price_nullable.sql` | products.price DROP NOT NULL | YES |
| `20261022000000_correct_product_is_published_default.sql` | products.is_published DEFAULT false | YES |
| `20261026170642_add_category_hierarchy.sql` | categories.main_section, parent_id, is_published + `is_category_public()` function + ancestor-aware policies | YES (but marked "Target: staging ... only"; proposal copy in supabase/proposals/) |

**Note:** `supabase/migrations/20261026170642_add_category_hierarchy.sql` exists in the automatic migrations folder. `supabase/proposals/category-hierarchy-review.md` states it targets staging and has not been executed/validated by PostgreSQL. Local DB state is NOT VERIFIED (no connection made).

---

## C. METAL-COATING REQUIREMENTS MATRIX (DIVISION A)

### Client-required services vs implementation

| # | Client service | Dedicated detail page? | Exists as card/static text only? | Source file | Status |
|---|----------------|----------------------|----------------------------------|-------------|--------|
| 1 | PVD Coating | No | No | — | MISSING |
| 2 | Electroplating | No | Yes (static card) | `lib/data.ts:303` | PARTIAL |
| 3 | PU Coating | No | No | — | MISSING |
| 4 | Powder Coating | No | No | — | MISSING |
| 5 | Decorative Metal Finishing | No | No | — | MISSING |
| 6 | Metal Restoration / Refinishing | No | Yes (static card: "Metal Restoration") | `lib/data.ts:252` | PARTIAL |

### Additional client capabilities vs implementation

| Capability | Implemented? | Evidence |
|------------|-------------|----------|
| Decorative stainless-steel sheets | No | — |
| Metal trims | No | — |
| Custom nameplates | No | — |
| Furniture components | No | — |
| Architectural metalwork | No | — |
| Religious-idol finishing | Partial | "Murti Finishing" static service in `lib/data.ts:269` |

### Nine surface-finishing cards (homepage)
The 9 static services in `lib/data.ts` (`services` array): metal-restoration, murti-finishing, plastic-coating, electroplating, marble-coating, decorative-showpieces, lipping-work, wood-finishing, sanitary-finishing. These are **not** the client's 6 required service groups. They appear in:
- `app/home-decor/[slug]/page.tsx` — not used
- `components/sections/home/metal-coating-showcase.tsx` — 9 image-backed cards, all linking to `/metal-coating` (anchor `#slug`)
- `components/layout/navbar.tsx` — services dropdown linking to `/metal-coating#${svc.slug}`

**Verdict:** The 9 cards are static curated capabilities, not the client's required service groups. They are duplicated between `lib/data.ts` static array and Supabase `services` table (merged via `mergeCuratedServices`). No service has its own detail page; all are anchor links on the single `/metal-coating` page.

### Finish browsing
- No dedicated `/finishes` or colours/finishes catalogue route exists.
- Product `color_finish` / `material` fields exist in schema and appear on product detail page only when populated.
- Users cannot browse finishes independently.

### Service detail pages (A-B)
**No service detail routes exist.** `/metal-coating` is a single landing page. Services are shown as cards and as a dropdown, each linking to `/metal-coating#slug`. There is no `/metal-coating/[slug]` route.

### Enquiry CTA & WhatsApp

| Check | Finding | Evidence |
|-------|---------|----------|
| WhatsApp integration present | YES | `whatsappLink()` / `getHomeDecorWhatsAppLink()` / `getMetalCoatingWhatsAppLink()` in `lib/site.ts` |
| WhatsApp links point to configured business contact | Partially — numbers are **placeholders** | `lib/site.ts:17-18`: `919999999999` / `918888888888` marked `// Placeholder` |
| WhatsApp messages contain service/product context | Partially | Product detail & cards include product name; navbar/footer use generic "Hello RT METALS..."; service cards have no WhatsApp CTA |
| Product/image enquiries include details | YES — API snapshots product_name_snapshot / service_name_snapshot | `app/api/inquiries/route.ts:161-164` |
| Enquiry actions distinct from confirmed enquiries in tracking | YES — `inquiries.status` ('new','contacted','in_progress','converted','closed') | `supabase/migrations/20260829000000_create_inquiries_table.sql:19` |
| Retail prices / cart actions on services | NO prices exposed (price nullable, enquiry-only) | Admin sets `price: null` (`admin-workspace.tsx:312`) |

### Content match vs client spec (metal division)

| Client content | Present? | Evidence | Status |
|---------------|----------|----------|--------|
| Company homepage content | Yes | `app/page.tsx` | Present |
| About Us | Yes | `app/about/page.tsx` | Present |
| Services and applications | Partial | 9 static services, no PVD/PU/Powder/Decorative Metal Finishing | GAP |
| Colours and finishes catalogue | No | — | MISSING |
| Projects and gallery | Partial | Instagram section only, no project gallery | PARTIAL |
| Industries served | Yes | `lib/data.ts:568`, passed to metal page | Present |
| Seven-stage work process | No — 5 steps | `lib/data.ts:471` (5 steps), `our-process.tsx` | GAP (5 vs 7) |
| FAQs | Yes | `lib/data.ts:443` (6 FAQs) | Present |
| Contact and custom quotations | Yes | Contact section + `/api/inquiries` | Present |
| WhatsApp enquiry pathways | Yes | WhatsApp buttons throughout | Present (placeholder numbers) |

---

## D. RT HOME DECOR REQUIREMENTS MATRIX (DIVISION B)

VERIFIED IMPLEMENTED / PARTIALLY IMPLEMENTED / UI ONLY / NONFUNCTIONAL / MISSING / NOT TESTED.

| # | Client requirement | Status | Evidence | Notes |
|---|-------------------|--------|----------|-------|
| 1 | Seven category groups | MISSING | `lib/data.ts` has 6 categories (home-decor, decorative-accessories, gift-articles, lifestyle-products, household-products, daily-utility) | Different labels from client's 7; no Religious & Spiritual, no Traditional & Festive, no Gifts & Special Collections as distinct |
| 2 | Hierarchical product categories | PARTIALLY IMPLEMENTED | Schema supports `parent_id`/`main_section` (migration + category-hierarchy.ts); UI category tree in navbar/admin | Local DB not connected; not VERIFIED against live data |
| 3 | Published/unpublished categories | VERIFIED IMPLEMENTED | `categories.is_published`, `is_category_public()` RLS, default false | UI admin toggle present |
| 4 | Published/unpublished products | VERIFIED IMPLEMENTED | `products.is_published`, public policy `is_published = true` | Default changed to false |
| 5 | Real product images | PARTIALLY | `products.image` + `product_images` table; static data uses Pexels URLs | Real client images NOT VERIFIED (none in repo except materials/*.jpg) |
| 6 | Product descriptions | VERIFIED IMPLEMENTED | `products.description`, `short_description` | |
| 7 | Product attributes (material, dimensions, colour, weight) | PARTIALLY | Schema columns exist; displayed on product detail if populated | Static data has none populated |
| 8 | Product variants | MISSING | No variants table, no variant UI | |
| 9 | Real INR prices | MISSING | Static data shows unitless numbers (189, 320, 95...); no currency; admin sets `price: null` | No INR currency anywhere |
| 10 | SKU handling | PARTIALLY | `products.sku` column + admin field | Not used in UI |
| 11 | Stock availability | PARTIALLY | `products.stock_status` column + admin dropdown | Not enforced in UI/cart |
| 12 | Add to Cart | MISSING | No cart component, no cart API, no cart state | Grep confirmed zero matches |
| 13 | Buy Now | MISSING | — | |
| 14 | Guest cart | MISSING | — | |
| 15 | Authenticated cart | MISSING | — | |
| 16 | Checkout | MISSING | — | |
| 17 | Payment gateway | MISSING | No Stripe/Razorpay/etc. integration | |
| 18 | UPI/card/net-banking | MISSING | — | |
| 19 | Order records & order numbers | MISSING | No `orders` table | |
| 20 | Order confirmation | MISSING | — | |
| 21 | Customer order access | MISSING | No order history | |
| 22 | Delivery pincode checking | MISSING | — | |
| 23 | Shipping charge calculation | MISSING | — | |
| 24 | Courier shipment tracking | MISSING | — | |
| 25 | Coupons & promotions | MISSING | No coupons table | |
| 26 | Customer reviews | MISSING | No product review model (testimonials exist but are site testimonials, not product reviews) | FAQ mentions shipping (static text only) |
| 27 | WhatsApp support | PARTIALLY | WhatsApp enquiry buttons present; placeholder numbers | |
| 28 | Retail administration | PARTIALLY | Admin manages products/categories but no orders/shipping/coupons | |
| 29 | Cash on Delivery | MISSING | Not required currently | |

**No `orders`, `order_items`, `payments`, `shipping_addresses`, `shipments`, `coupons`, `refunds`, `product_variants`, `inventory`, or `cart` tables exist in migrations.** The `inquiries` table could serve as a lead log but is not an order system.

---

## E. SUPABASE AND ADMIN ASSESSMENT

### Verified capabilities (from migration files + code)
- **Auth:** Supabase Auth email/password; profiles table auto-created on signup via trigger; role column (customer/admin); `is_admin()` RPC.
- **Catalog:** categories, products, product_images, services with `is_published`, `sku`, `stock_status`, attributes, RLS.
- **Public read:** anon/authenticated SELECT on published rows only; ancestor-aware category visibility via `is_category_public()`.
- **Admin write:** authenticated + `is_admin()` for insert/update/delete on all catalog tables.
- **Inquiries:** public INSERT (status=new, no admin_notes), authenticated admin SELECT/UPDATE/DELETE via `is_admin()`.
- **Wishlists:** authenticated user-scoped insert/select/delete.
- **Storage:** `catalog-images` bucket, public read, admin write.
- **Site settings:** key/value JSONB table with admin CRUD.

### Admin panel
- Single workspace at `/admin`, guarded by middleware (redirects non-logged-in to `/login`, non-admin to `/`).
- Tabs: Inquiries/Leads, Categories, Products, Services, Testimonials, FAQs, Settings.
- **Product admin explicitly sets `price: null`** (`admin-workspace.tsx:312`): "enquiry-only catalogue" — confirms products are NOT retail-ready.
- Operations present: create/edit/delete products, categories, services, testimonials, FAQs; upload multiple images (single main image + gallery via `addProductGalleryImage`); publish/unpublish toggle; manage enquiries (status + notes).
- **Missing from admin:** orders, order status, payments, invoices, shipping, coupons, refunds, customer reviews, address management.
- Metal-services admin and retail admin share the same workspace — no role separation beyond `is_admin`. Staff see all inquiries and all products (both divisions) in one list. No PII leakage beyond what admin should see, but no division-scoped admin views.

### Schema extension recommendation (analysis only)
The existing schema can be **extended** for retail by adding: `orders`, `order_items`, `payments`, `shipping_addresses`, `shipments`, `coupons`, `refunds`, `product_variants`, `inventory`/`stock_levels`. Existing product IDs, category IDs, and relationships are preserved by additive migrations. Separate retail-specific models are NOT required — the existing `products` table already carries `sku`, `price` (nullable), `stock_status`, `material`, `color_finish`, `dimensions`, `weight`. Adding variants would require a `product_variants` table linked to `products.id`.

---

## F. BRANDING, CONTENT AND SEO GAPS

### Branding inconsistencies (NOT changed, recorded only)

| Location | Current text | Expected per client | Severity |
|----------|-------------|---------------------|----------|
| Navbar logo (`components/layout/navbar.tsx:371`) | "RT METAL WORKS" | RTMETALCOATING / RT HOME DECOR | High |
| Mobile drawer title (`navbar.tsx:877`) | "RT PU COATING WORKS" | — | High |
| Footer logo (`footer.tsx:46`) | "RT PU COATING WORKS" | — | High |
| Login page title (`app/login/page.tsx:143`) | "RT PU COATING WORKS" | — | High |
| `lib/site.ts:3` | brandName: "RT METALS" | RTMETALCOATING | Medium |
| Layout metadata (`app/layout.tsx:57`) | "RT METALS — Home Decor & Premium Metal Coating" | RTMETALCOATING | Medium |

**Contact details in `lib/site.ts` (placeholders — not verified as real):**
- email: `studio@aurumandco.com` (domain "aurumandco" does not match RTMETALCOATING)
- phone: `+919999999999` / display `+91 99999 99999`
- address: `Studio 12, Design District, Mumbai, India` (client says Mumbai for metal, Wai/Satara for home decor — only one address present)
- WhatsApp homeDecor: `919999999999` (Placeholder)
- WhatsApp metalCoating: `918888888888` (Placeholder)

### Content gaps vs client spec

| Page / section | Client requirement | Current state | Status |
|---------------|-------------------|---------------|--------|
| Homepage hero | Approved hero copy | Present (`hero.tsx`) | Do not change (per instructions) |
| About Us | Two divisions, Mumbai + Wai | Present but generic; single Mumbai address | PARTIAL |
| Services | 6 required groups | 9 static services, wrong labels | GAP |
| Colours & finishes catalogue | Required | No route | MISSING |
| Projects & gallery | Required | Instagram only | PARTIAL |
| Industries served | Required | Present (`industriesServed`) | Present |
| Work process | 7 stages | 5 steps | GAP |
| FAQs | Required | 6 FAQs (static) | Present |
| Contact | Required | Present + API | Present |
| RT HOME DECOR shop | 7 categories, INR prices, cart, checkout | Enquiry-only catalogue, no prices | MISSING (core) |
| Shipping policy | Required | None | MISSING |
| Returns/refunds/damage policy | Required | None | MISSING |
| Privacy policy | Required | Footer link to `/` (no page) | MISSING |
| Terms and conditions | Required | Footer link to `/` (no page) | MISSING |

### SEO
- `sitemap.xml`: `/`, `/about`, `/home-decor`, `/metal-coatering` + published products (dynamic) — present.
- `robots.txt`: allows `/`, disallows `/api/`, references sitemap — present.
- Page metadata present on all routes. OpenGraph/Twitter cards present.
- **No product/category prices for indexing** (enquiry-only). Sitemap excludes unpublished products.

---

## G. FUNCTIONAL RISKS

| Risk | Severity | Evidence |
|------|----------|----------|
| **No ecommerce infrastructure** — RT HOME DECOR cannot sell online | Critical | Zero cart/checkout/payment/order code (grep confirmed) |
| **Placeholder WhatsApp numbers** — enquiries go nowhere real | High | `lib/site.ts:17-18` marked `// Placeholder` |
| **Placeholder contact email/domain** — `studio@aurumandco.com` | High | `lib/site.ts:7` |
| **Branding inconsistency** — "RT METAL WORKS"/"RT PU COATING WORKS" across header/footer/login | Medium | Multiple files |
| **Static fallback data masks missing DB content** — development shows dummy products/services/categories even if Supabase is empty | Medium | `lib/data-access.ts` `handleFailure` returns static data in dev |
| **No service detail pages** — customers cannot explore individual services | Medium | No `/metal-coating/[slug]` route |
| **5-stage process vs 7 required** | Low | `lib/data.ts:471` |
| **Admin and customer share one workspace** — no division-scoped views | Low | `admin-workspace.tsx` |
| **Single address** — no Wai/Satara retail location | Low | `lib/site.ts` contact |
| **Category hierarchy migration status unverified** — `20261026170642` targets staging; not applied/validated locally | Medium | `supabase/proposals/category-hierarchy-review.md` |
| **No policy/legal pages** — privacy, terms, shipping, returns | Medium | Footer links point to `/` |

---

## H. CLIENT DEPENDENCIES (MISSING INPUTS)

Only marked "received" if present in the project or supplied requirements.

| Input | Received? | Evidence |
|-------|-----------|----------|
| Final branding approval (RTMETALCOATING / RT HOME DECOR) | NO | Current branding is "RT METAL WORKS"/"RT PU COATING WORKS" |
| Genuine product images & catalogue | NO | Static data uses Pexels placeholder images; public/ has only materials/*.jpg and hero images |
| SKU/variant information | NO | Schema has `sku` column but no data; no variants |
| Approved retail prices (INR) | NO | No INR prices anywhere; admin sets `price: null` |
| Inventory counts | NO | `stock_status` text only, no inventory table |
| Product weights/dimensions | NO | Schema columns exist, empty in static data |
| Legal seller & tax/invoice information (GST, etc.) | NO | — |
| Business contact details (real phone, email, WhatsApp) | NO | Placeholders in `lib/site.ts` |
| Payment gateway selection/account | NO | No payment integration |
| Courier provider/account | NO | — |
| Shipping origin & fulfilment rules | NO | — |
| Approved shipping/return/refund policies | NO | No policy pages |
| Customer notification provider (SMS/email) | NO | — |

---

## I. PHASE-WISE IMPLEMENTATION ROADMAP

### Phase 0 — Audit & client sign-off (this session)
**Objective:** Complete read-only audit; obtain client decisions on dependencies in Section H.  
**Requirements addressed:** All (diagnostic).  
**Preserve:** Everything; no changes.  
**Files changed:** None (AUDIT_REPORT.md only).  
**Migration required:** No.  
**External dependencies:** Client approvals, branding assets, real contact/WhatsApp numbers.  
**Validation:** This report reviewed with client.  
**Acceptance criteria:** Client confirms gaps and prioritises Division A vs Division B.  
**Rollback:** N/A.  
**Gate to proceed:** Client sign-off on audit findings and provision of Section H inputs.

### Phase 1 — Branding, content, and contact correction (frontend-only)
**Objective:** Align brand identity (RTMETALCOATING / RT HOME DECOR), replace placeholder contact/WhatsApp, add missing pages (privacy, terms, shipping, returns), fix footer/header/mobile-drawer/login branding.  
**Requirements addressed:** Shared branding/navigation/content (Section C-F).  
**Preserve:** Hero copy, animations, existing page structure.  
**Files expected to change:** `components/layout/navbar.tsx`, `components/layout/footer.tsx`, `lib/site.ts`, `app/login/page.tsx`, new pages `/privacy`, `/terms`, `/shipping`, `/returns`, `app/layout.tsx` metadata.  
**Migration required:** No.  
**External dependencies:** Approved brand copy, real contact details, policy text from client.  
**Validation:** Typecheck, visual review of corrected branding.  
**Acceptance criteria:** Branding consistent; real phone/WhatsApp/email; legal pages live.  
**Rollback:** Revert file edits (Git).  
**Gate:** Client approves corrected branding and contact info.

### Phase 2 — Metal-coating service catalogue (frontend + Supabase read-side)
**Objective:** Add dedicated service detail pages; represent the 6 required service groups; add finishes/colours browsing; extend 5-stage process to 7; add WhatsApp context per service.  
**Requirements addressed:** Metal-coating A–M (Section C).  
**Preserve:** Existing `/metal-coating` landing, enquiry API, admin service CRUD.  
**Files expected to change:** `app/metal-coating/[slug]/page.tsx` (new), services data, `metal-coating-client.tsx`, process steps.  
**Migration required:** Possibly none if using existing `services` table; may need new rows inserted by admin (no schema change).  
**External dependencies:** Client service descriptions, finish catalogue, project images.  
**Validation:** Service pages render; WhatsApp links include service context; no real WhatsApp messages sent.  
**Acceptance criteria:** All 6 service groups have detail pages; finishes browsable; WhatsApp messages carry service context.  
**Rollback:** Revert new route/components.  
**Gate:** Metal-coating enquiry flow verified end-to-end (form submission captured in `inquiries` table).

### Phase 3 — Retail data model extension (database-only, no payments)
**Objective:** Add retail support tables without enabling payments: `product_variants`, `inventory`/`stock_levels`, ensure `orders`/`order_items`/`payments`/`shipping_addresses`/`coupons` designed. Keep prices nullable during build; do not expose unknown-price products to checkout.  
**Requirements addressed:** Retail catalogue foundation (Section D, E).  
**Preserve:** Existing product IDs, category IDs, `products.price` nullable, RLS, published rules, enquiry workflows.  
**Files expected to change:** New migration files (additive only); `lib/types.ts` extensions; `lib/data-access.ts` read functions.  
**Migration required:** YES (additive: product_variants, inventory, orders, order_items, payments, shipping_addresses, coupons, refunds — designed but not applied this session).  
**External dependencies:** Client SKU/variant data, approved prices, inventory counts, weights/dimensions.  
**Validation:** Migration SQL reviewed; typecheck; RLS policies for new tables drafted.  
**Acceptance criteria:** Schema supports variants, SKU inventory, orders; no checkout exposure yet.  
**Rollback:** Migration not applied (this session is design only); if applied later, additive tables can be dropped.  
**Gate:** Client approves schema design and provides retail data.

### Phase 4 — Cart, checkout, and payments (frontend + backend)
**Objective:** Guest + authenticated cart, pincode check, shipping calculation, secure payment integration, order creation, order numbers, confirmation, order history, coupon codes.  
**Requirements addressed:** Retail ecommerce B1–B28 (Section D, E).  
**Preserve:** Existing catalogue, wishlist, auth.  
**Files expected to change:** New cart context/API, checkout pages, payment gateway integration, order pages, order history.  
**Migration required:** YES (from Phase 3 tables).  
**External dependencies:** Payment gateway account (UPI/card/net-banking), courier account, shipping rates.  
**Validation:** Test mode payments only; order created in DB; order number issued; no real customer charges.  
**Acceptance criteria:** Add to Cart → Checkout → payment (test mode) → order number → confirmation → order history. Unknown-price products blocked from checkout.  
**Rollback:** Feature-flagged checkout; disable payment routes.  
**Gate:** Payment verification + order creation tested in sandbox.

### Phase 5 — Retail operations & reporting
**Objective:** Admin order management, order status updates, shipping/courier tracking, coupons, refunds, customer returns handling, reports.  
**Requirements addressed:** Retail administration (Section D, E).  
**Preserve:** Existing admin workspace (extend tabs).  
**Files expected to change:** `components/admin/admin-workspace.tsx` (new tabs), order APIs.  
**Migration required:** Likely none beyond Phase 3/4 tables.  
**External dependencies:** Courier tracking API, notification provider.  
**Validation:** Admin can update order status; courier tracking displays.  
**Acceptance criteria:** Full retail ops loop operational.  
**Rollback:** N/A.  
**Gate:** UAT with client staff.

---

## J. FIRST RECOMMENDED IMPLEMENTATION PHASE

**Phase 1 — Branding, content, and contact correction (frontend-only).**

Rationale: It is the lowest-risk, highest-impact starting point. It requires no database changes, no payments, and no new schema. It resolves critical trust issues (placeholder phone/WhatsApp/email `studio@aurumandco.com`, inconsistent brand names "RT METAL WORKS"/"RT PU COATING WORKS"), adds legally required policy pages, and establishes the correct RTMETALCOATING / RT HOME DECOR identity before any ecommerce work begins. All changes are frontend/component edits reversible via Git.

**Scoped task:** Update `lib/site.ts` with client-approved real contact/WhatsApp numbers and brand name; update `components/layout/navbar.tsx`, `components/layout/footer.tsx`, `app/login/page.tsx` branding; add `/privacy`, `/terms`, `/shipping`, `/returns` pages; align `app/layout.tsx` metadata. No database migration. No payments. No content changes to the approved hero.

Stop here. No implementation performed in this session.