# Catalogue Variant Pilot — Handover

Date: 2026-11-17
Environment: staging only — Supabase project `rbucefvtkiohmaugvkyz` (`.env.local`, `.env.development.local`)
App: `http://localhost:3000` (dev server restored after the production build)
Admin session: saved Playwright storage state outside the repo (contents never printed or committed)

## Result

The Admin catalogue flow (create → edit → variants → images → publish/unpublish) was exercised end-to-end on real staging records. All three QA products were published, verified publicly, then returned to **Draft**. A real customer enquiry was submitted, verified in Admin, and deleted. No production system was touched and nothing was committed, pushed, or deployed.

## Pilot products (all now Draft)

| Case | Product | ID | SKU | Finishes | Persisted |
| --- | --- | --- | --- | --- | --- |
| A | QA Pilot - Plain Showpiece | `ff9d095d-d952-449c-ab2f-40785758f136` | QA-PILOT-PLAIN | none | image + gallery, publish/unpublish |
| B | QA Pilot - Single Finish Showpiece | `dfafb3c8-1f84-4fca-923e-f5c7fca88ef2` | QA-PILOT-SINGLE | Antique Brass (`QA-PILOT-B01`, stock 4, default) | variant image + fields after refresh/reopen |
| C | QA Pilot - Long Finish Name Showpiece | `c4be9a2d-d8c4-4bfa-abaa-cbc6cea15cfc` | QA-PILOT-LONG | `QA-PILOT-C01` (default) / `QA-PILOT-C02` | 2 gallery images + 2 variant images after refresh/reopen |

Reference product used for regression: `Ashok Stambh – Premium Decorative Showpiece` (3 finishes: Gold `ASHOK-STG-GLD`, Silver `ASHOK-STG-SLV`, Antique Bronze).

Verified public behaviour while published: chips only for ≥2 variants; card image follows the selected finish; enquiry link carries `variant`, `finish`, `sku`; detail selector mirrors selection; Long chip labels wrap without clipping at 1440 px and 390 px.

## Enquiry round-trip

- Submitted from the published Long card with `QA-PILOT-C02` selected (`QA TEST - Catalogue Pilot` / `qa.test+rtmetal@example.com`).
- `POST /api/inquiries` → **201**, `{ success: true }`; success banner shown.
- Admin lead showed the correct snapshots: product name, finish name, `SKU: QA-PILOT-C02`, pre-filled message.
- `DELETE /rest/v1/inquiries?id=eq.<id>` → **204**; fresh Admin load shows **0 leads** and “No customer inquiries in database yet”.
- The API route contains no email/notification code (database insert only), so no production notifications could fire.

## Image audit

Every rendered image returned **HTTP 200** with a valid content type and `naturalWidth > 0`; no Next.js image errors or console errors.

| Source | Checked |
| --- | --- |
| Plain card + detail | main image (384/750 renditions) |
| Single card + detail | variant primary image |
| Long card + detail | C01 and C02 variant primary images after chip/radio selection |
| Long gallery | 2 storage WebP objects (200, `image/webp`, 6.4 KB / 8.2 KB) |
| Ashok card + detail | Gold, Silver, Antique Bronze primary images |

Evidence: `image-audit.json`, `*-1440-result.json`, `variant-interactions-*.json`.

## Cleanup verification

- All three QA records are **Draft** after a fresh Admin reload; `data-testid="admin-product-row"` still finds each by ID.
- Public `/home-decor` contains none of the QA products; their detail routes return **404**.
- Ashok detail still returns **200** and its card still exposes 3 chips (Gold, Silver, Antique Bronze).
- Collection count moved from 37 (pilot published) to 34 after unpublishing, then to 36 published pieces on the final check; no write from this task publishes products, so the later increase reflects concurrent staging activity. Final check: 36 headings, 35 unique titles (one pre-existing duplicate title among non-QA items).

## Checks run

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run build` | pass (warnings only: `metadataBase`, outdated caniuse-lite) |
| `npm run test:variants` (`PW_BASE_URL=http://localhost:3000`) | 21/21 pass |
| Main suite, Chromium | 77 pass, 2 fail, 1 skipped, 3 not run |
| `image-rendering` + `enquiry-action`, mobile-chrome | 9/9 pass |
| `tests/admin-product-edit.spec.ts` (staging session) | 1/1 pass |

Failure notes:
- `tests/enquiry-action.spec.ts` “card CTA…” failed under 6 parallel workers with `finish=Gold` instead of `Silver`; it passes in isolation (3/3) and on mobile. This is a hydration/timing race in the test, not a UI defect (manual click updates the href immediately).
- `qa-metal-integration.spec.ts` expects 2 collection links but staging has 3 published metal categories (`metal-plaques-panels-signage`, `art-work`, `name-plates-signage`). The extra slug does not exist anywhere in the repo, so it is staging data drift unrelated to this pilot. The file runs serially, so the remaining 3 tests in it were skipped after this failure. The test file itself has pre-existing uncommitted edits; it was not modified for this task.

## Files changed for this task

- `components/admin/admin-workspace.tsx` — row `data-testid`/`data-product-id`/`data-product-sku`, accessible names plus `data-testid` on publish/edit/archive buttons, hidden `product-editing-id` with `data-editing-id`.
- `components/sections/product-card.tsx` — chip button `max-w-full … text-left`; label `min-w-0 break-words text-left` (long finish names no longer clip).
- `tests/admin-product-edit.spec.ts` — new, skipped unless `STAGING_ADMIN_STATE` and `STAGING_QA_PRODUCT_ID` are provided.
- `playwright.config.ts` — registered the new spec (`playwright.config.ts` also carries earlier uncommitted server-selection changes, not authored here).

The rest of the working tree (variants editor, provider/selector, admin catalog libs, etc.) is pre-existing uncommitted work and was not refactored.

Housekeeping: 29 obsolete root `_*.mjs` scratch scripts were moved to `C:\Users\ACER\AppData\Local\Temp\opencode\obsolete-root-scripts\` (recoverable, not deleted). `test-results/` was restored to its committed state after the runs.

## Open items / decisions needed

- WhatsApp, public email and phone remain intentionally non-clickable: `whatsapp.homeDecorVerified`, `emailVerified`, `phoneVerified` are `false` and the WhatsApp number is still the placeholder `919999999999`. Provide verified details to enable them.
- QA records and their uploaded images were intentionally retained as Draft (deleting them needs explicit approval).
- The stale metal-collection assertion (2 vs 3 categories) is a data/test mismatch to resolve separately; it is not caused by this work.
- No commit, push, deploy or database migration was performed.
