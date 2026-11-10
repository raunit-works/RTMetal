/**
 * DEEP PROBE — Admin data source and RLS policy investigation
 * Read-only. No writes.
 * Run with: node lib/supabase/__tests__/deep-probe.mjs
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function parseEnvFile(path) {
  const result = {};
  try {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim().replace(/\r$/, '');
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      result[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  } catch {}
  return result;
}

const envLocal    = parseEnvFile('.env.local');
const envDevLocal = parseEnvFile('.env.development.local');

// NODE_ENV=development → dev overrides prod
const activeUrl = envDevLocal['NEXT_PUBLIC_SUPABASE_URL']    ?? envLocal['NEXT_PUBLIC_SUPABASE_URL'];
const activeKey = envDevLocal['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] ?? envLocal['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];

console.log('\n=== DEEP PROBE ===');
console.log(`Active project (dev mode): ${activeUrl}`);

const supabase = createClient(activeUrl, activeKey);

// ── 1. Raw SELECT with no filters — see what anon can read ──────────────────
console.log('\n[1] SELECT * FROM services LIMIT 10 (anon, no filter)');
const { data: raw, error: rawErr } = await supabase.from('services').select('*').limit(10);
if (rawErr) {
  console.log(`  Error: ${rawErr.message} (code: ${rawErr.code})`);
  console.log('  → RLS likely blocks SELECT for anon on this table entirely.');
} else {
  console.log(`  Rows returned: ${raw?.length ?? 0}`);
  if (raw?.length) {
    raw.forEach(r => console.log(`    - ${r.slug} | is_published: ${r.is_published} | id: ${r.id}`));
  } else {
    console.log('  → Table is empty OR RLS hides all rows from anon.');
  }
}

// ── 2. Try COUNT to see if rows exist at all (may bypass RLS on count) ───────
console.log('\n[2] SELECT count(*) FROM services (anon)');
const { count, error: countErr } = await supabase
  .from('services')
  .select('*', { count: 'exact', head: true });
if (countErr) {
  console.log(`  Error: ${countErr.message} (code: ${countErr.code})`);
} else {
  console.log(`  Count: ${count}`);
}

// ── 3. Check if admin is authenticated vs anon ───────────────────────────────
console.log('\n[3] Check current session (is this anon or authenticated?)');
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  console.log(`  Authenticated as: ${session.user?.email ?? session.user?.id}`);
  console.log(`  Role: ${session.user?.role}`);
} else {
  console.log('  No session — this client is operating as anon role.');
  console.log('  Admin UI uses a browser-based authenticated session (cookie-based JWT).');
  console.log('  This script cannot replicate that session — explains SELECT returning 0 rows');
  console.log('  if RLS requires authentication for SELECT on public.services.');
}

// ── 4. Probe whether the table exists at all ─────────────────────────────────
console.log('\n[4] Probe: does services table exist? (information_schema — anon may not see it)');
const { data: tableInfo, error: tableErr } = await supabase
  .from('services')
  .select('id')
  .limit(1);
if (tableErr) {
  console.log(`  Table probe error: ${tableErr.message} (code: ${tableErr.code})`);
  if (tableErr.code === '42P01') {
    console.log('  → Table does not exist in this project.');
  } else if (tableErr.code === '42501') {
    console.log('  → Table exists but anon SELECT is denied by RLS policy.');
  }
} else {
  console.log(`  Table exists. Rows visible to anon: ${tableInfo?.length ?? 0}`);
}

// ── 5. Try selecting from categories and products (same RLS context) ─────────
console.log('\n[5] Probe other tables for comparison (categories, products)');
for (const table of ['categories', 'products', 'testimonials', 'faqs']) {
  const { data: td, error: te } = await supabase.from(table).select('id').limit(1);
  if (te) {
    console.log(`  ${table}: ERROR ${te.code} — ${te.message}`);
  } else {
    console.log(`  ${table}: ${td?.length ?? 0} rows visible to anon`);
  }
}

// ── 6. Source check: what does getServicesAdmin() actually return? ──────────
// getServicesAdmin selects ALL columns with no is_published filter.
// If anon sees 0 rows, admin must be using an authenticated session.
// The admin /admin page uses createSupabaseBrowserClient() with user's cookie JWT.
console.log('\n[6] Admin data source analysis (code-level, no query)');
const adminCatalogSrc = readFileSync('lib/supabase/admin-catalog.ts', 'utf8');
const hasPublishedFilter = adminCatalogSrc.includes("eq('is_published'");
// Check getServicesAdmin specifically
const getServicesAdminMatch = adminCatalogSrc.match(/getServicesAdmin[\s\S]{0,500}?\}/);
console.log('  getServicesAdmin() filters by is_published:', hasPublishedFilter ? 'YES (somewhere in file)' : 'NO — fetches all rows');
console.log('  Admin list shows ALL services including drafts: RLS must allow authenticated users full SELECT');
console.log('  Anon SELECT returns 0: RLS may restrict anon to is_published=true only, OR table has no data');

// ── 7. Check what the admin page would see via authenticated Supabase call ────
// We cannot replicate the auth session here, but we can verify:
// admin-workspace calls getServicesAdmin() → Supabase SELECT * → returns data IF authenticated
// If admin shows "Services (1), Electroplating, Draft", the record EXISTS in the active project
// and the RLS policy allows the authenticated admin session to see it.

console.log('\n=== CONCLUSION ===');
console.log(`
The admin /admin page showed: Services (1), Electroplating, Draft.
This script (anon, no session) sees: 0 rows via SELECT.

Two possible explanations:

A) RLS BLOCKS ANON SELECT ENTIRELY
   The services table has a SELECT policy that requires auth.
   The admin browser session (authenticated JWT) passes the policy.
   The anon key (this script + SQL Editor default) is blocked.
   → The Electroplating record EXISTS in ${activeUrl}
   → The SQL Editor query returned 0 rows because it ran as anon role.
   → To verify in SQL Editor: change role to "service_role" in the dashboard
     (top-right dropdown in Table Editor → "service_role") OR run:
       SET ROLE postgres; SELECT * FROM services WHERE slug = 'electroplating';

B) ADMIN IS SHOWING STATIC/CACHED DATA
   If the admin Select call fails silently and falls back to static data,
   the "electroplating" record seen in admin may be from lib/data.ts.
   → BUT: getServicesAdmin() throws on error (no fallback), and the admin
     shows count=1, not 9 (the full static set). So this is unlikely.

MOST LIKELY: Explanation A — RLS restricts anon SELECT.
The record is in the development Supabase project at:
  ${activeUrl}
Run the SQL Editor query as postgres/service_role to confirm.
`);
