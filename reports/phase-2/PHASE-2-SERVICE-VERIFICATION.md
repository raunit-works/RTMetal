# Phase 2 — Service Verification Report

**Date:** 2026-10-31  
**Status:** ENGINEERING COMPLETE — EXTERNAL APPROVALS PENDING

---

## 1. Six Principal Services — Architecture Status

| Service | Slug | Local Draft | DB Record (staging) | DB Published | Engineering Status |
|---------|------|-------------|---------------------|-------------|-------------------|
| PVD Coating | `pvd-coating` | ✅ Draft exists | ❌ No record | ❌ No | BLOCKED — no DB record, client confirmation required |
| Electroplating | `electroplating` | ✅ Draft exists | ✅ Staging record exists (unpublished) | ❌ No | BLOCKED — unpublished, client confirmation required |
| PU Coating | `pu-coating` | ✅ Draft exists | ❌ No record | ❌ No | BLOCKED — no DB record, client confirmation required |
| Powder Coating | `powder-coating` | ✅ Draft exists | ❌ No record | ❌ No | BLOCKED — no DB record, client confirmation required |
| Decorative Metal Finishing | `decorative-metal-finishing` | ✅ Draft exists | ❌ No record | ❌ No | BLOCKED — no DB record, client confirmation required |
| Metal Restoration & Refinishing | `metal-restoration` | ✅ Draft exists | ✅ Staging record exists (unpublished) | ❌ No | BLOCKED — unpublished, client confirmation required |

> **Note:** All six principal services render correctly in the public UI when published. The principal service section is hidden when zero records are published (correct behavior). No unpublished service is publicly exposed.

---

## 2. Nine Specialist Services — Architecture Status

The nine specialist service definitions are preserved in static data. They display when Supabase returns published records. No specialist service record information was modified during Phase 2.

| Slug | Public Status |
|------|--------------|
| `electroplating` | Controlled by Supabase `is_published` |
| `metal-restoration` | Controlled by Supabase `is_published` |
| (7 others) | Controlled by Supabase `is_published` |

---

## 3. Metal Finishes & Colour Collection

**Status: IMPLEMENTED AND DISPLAYED**

| FIN ID | Display Name | Image Present | Image Loads | Engineering Status |
|--------|-------------|--------------|-------------|-------------------|
| FIN-0003 | Brown Antique | ✅ | Verified (naturalWidth > 0) | ✅ Implemented |
| FIN-0004 | Rustic Iron Finish | ✅ | Verified | ✅ Implemented |
| FIN-0013 | Deep Blue Finish | ✅ | Verified | ✅ Implemented |
| FIN-0041 | Rose Gold Hairline | ✅ | Verified | ✅ Implemented |
| FIN-0044 | Rose Gold Mirror | ✅ | Verified | ✅ Implemented |
| FIN-0045 | Graphite Mirror | ✅ | Verified | ✅ Implemented |
| FIN-0046 | Satin Brass | ✅ | Verified | ✅ Implemented |
| FIN-0053 | Gold Mirror | ✅ | Verified | ✅ Implemented |
| FIN-0054 | Graphite Hairline | ✅ | Verified | ✅ Implemented |
| FIN-0058 | Gold Matte | ✅ | Verified | ✅ Implemented |
| FIN-0060 | Champagne Mirror | ✅ | Verified | ✅ Implemented |
| FIN-0063 | Copper Antique Glossy | ✅ | Verified | ✅ Implemented |

**Business Approval:** All 12 display names are pending client confirmation (see `client-finish-approval.csv`). The proposed names are used for display; process associations are not claimed.

---

## 4. Outstanding Authorization Dependencies

### BLOCKED BY: Client Business Approval

1. **Publication of PVD Coating service** — No DB record. Client must confirm service offering, verify content, provide image URL, and authorize publication.
2. **Publication of PU Coating service** — No DB record. Client must confirm service offering, verify content, provide image URL, and authorize publication.
3. **Publication of Powder Coating service** — No DB record. Client must confirm service offering, verify content, provide image URL, and authorize publication.
4. **Publication of Decorative Metal Finishing service** — No DB record. Client must confirm service offering, verify content, provide image URL, and authorize publication.
5. **Publication of Electroplating service** — Staging record exists. Client must review content, provide verified image, and authorize publication.
6. **Publication of Metal Restoration service** — Staging record exists. Client must review content, provide verified image, and authorize publication.
7. **FIN display name confirmation** — All 12 proposed names require client confirmation.
8. **FIN coating process associations** — No process associations are currently displayed. Client must confirm which FIN samples apply to which services before any such claim is made publicly.

---

## 5. Technical Defects Fixed in Phase 2

| Defect | Root Cause | Fix Applied |
|--------|------------|-------------|
| Lightbox Escape key state desync | Native dialog `cancel` event closed dialog without updating React `open` state | Added `onCancel` handler; moved `showModal()`/`close()` to `useEffect` for consistent state sync |
| Lightbox keyboard events not received | Dialog element not focused after opening | Added `dialog.focus()` in `useEffect` after `showModal()` |
| `showModal()` called before state commit | Imperative call in same event handler as `setState` | Moved to `useEffect` — runs after React commit |
| Before/after labels asserted unverified project claims | Hardcoded fabricated project names | Replaced with honest illustrative labels |
| FIN images using `naturalWidth` - `lazy` loading delay | `loading="lazy"` on card images; test didn't wait | Test uses `waitUntil: 'networkidle'` to ensure images are loaded |

---

## 6. Supabase Database Write Dependencies (BLOCKED)

**NO database writes were performed during Phase 2.**

The following writes are prepared but require specific authorization:

| Operation | Risk Level | Prerequisite |
|-----------|-----------|-------------|
| INSERT 4 new principal service records (PVD, PU, Powder, Decorative) | Medium | Client approval of content + image URL per service |
| UPDATE 2 existing staging records (Electroplating, Metal Restoration) with verified images and set `is_published = true` | Medium | Client approval of content + verified photography |
| Update FIN display names in finishes.ts | Low | Client confirmation of proposed display names |

**Authorization status: BLOCKED — awaiting client confirmation.**
