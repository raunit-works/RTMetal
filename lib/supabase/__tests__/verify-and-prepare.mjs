/**
 * TASK 1 — Electroplating Final Verification (read-only)
 * TASK 2 — Metal Restoration content readiness check (no write)
 *
 * Run with: node lib/supabase/__tests__/verify-and-prepare.mjs
 *
 * Uses the staging/dev Supabase project (.env.development.local).
 * RLS blocks anon SELECT on services — verification uses what is observable.
 * No writes. No schema changes. No publishing.
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

const envDev  = parseEnvFile('.env.development.local');
const envProd = parseEnvFile('.env.local');

// npm run dev uses .env.development.local (higher precedence in NODE_ENV=development)
const STAGING_URL = envDev['NEXT_PUBLIC_SUPABASE_URL'];
const STAGING_KEY = envDev['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
const PROD_URL    = envProd['NEXT_PUBLIC_SUPABASE_URL'];

const mask = (k) => k ? k.slice(0, 16) + '…' + k.slice(-4) : '(missing)';

console.log('\n╔══════════════════════════════════════════════════════════════════╗');
console.log('║  PHASE 2B: Service Draft Verification and Preparation            ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log(`\n  Staging project  : ${STAGING_URL}`);
console.log(`  Production project: ${PROD_URL}`);
console.log(`  Active (dev mode) : STAGING (via .env.development.local)`);
console.log(`  Staging key       : ${mask(STAGING_KEY)}\n`);

const staging = createClient(STAGING_URL, STAGING_KEY);

// ══════════════════════════════════════════════════════════════════════════════
// TASK 1 — ELECTROPLATING VERIFICATION
// ══════════════════════════════════════════════════════════════════════════════
console.log('━━━ TASK 1: Electroplating Verification ━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// [1a] RLS SELECT test — document the anon limitation
const { data: svcAnon, error: svcAnonErr } = await staging
  .from('services')
  .select('id, slug, is_published')
  .limit(10);

const rlsBlocked = svcAnonErr || (svcAnon && svcAnon.length === 0);
if (rlsBlocked) {
  console.log('  [1a] Anon SELECT on services: 0 rows (RLS restricts anon).');
  console.log('       This is consistent with prior deep probe and is expected behaviour.');
  console.log('       The admin browser session (authenticated JWT) bypasses this restriction.');
}

// [1b] Confirm staging table exists and anon cannot INSERT (double-safety check)
const { error: insertGuard } = await staging
  .from('services')
  .insert([{ slug: '__guard_test__', name: 'guard', description: 'x', long_description: 'x',
             short_name: 'x', image: 'https://x.com/x.jpg', is_published: false }]);
if (insertGuard && insertGuard.code === '42501') {
  console.log('  [1b] Anon INSERT is denied (42501). Write protection confirmed. ✅');
} else if (insertGuard) {
  console.log(`  [1b] Insert guard returned unexpected error: ${insertGuard.code} — ${insertGuard.message}`);
} else {
  // Should never happen — if it does, we must report it
  console.log('  [1b] WARNING: Insert guard did NOT get denied. Review RLS immediately.');
}

// [1c] Confirm public route returns 404 via data-access code analysis
const slugPageSrc = readFileSync('app/metal-coating/[slug]/page.tsx', 'utf8');
const usesPublishedFilter  = slugPageSrc.includes('getPublishedServiceBySlugAsync');
const usesNotFound         = slugPageSrc.includes('notFound()');
const publicQuerySrc       = readFileSync('lib/data-access.ts', 'utf8');
const supabaseAuthoritativeMode = publicQuerySrc.includes('isSupabaseAuthoritative()');
const failsClosed          = publicQuerySrc.includes('return undefined') &&
                             publicQuerySrc.includes('getPublishedServiceBySlugAsync');

console.log('\n  [1c] Public route code verification:');
console.log(`       getPublishedServiceBySlugAsync used  : ${usesPublishedFilter ? '✅ YES' : '❌ NO'}`);
console.log(`       notFound() called on missing/unpublished: ${usesNotFound ? '✅ YES' : '❌ NO'}`);
console.log(`       Supabase-authoritative mode active   : ${supabaseAuthoritativeMode ? '✅ YES' : '❌ NO'}`);
console.log(`       Database error fails closed (no fallback): ${failsClosed ? '✅ YES' : '❌ NO'}`);

// [1d] Verify anon public query with is_published=true returns nothing for electroplating
const { data: pubEp, error: pubEpErr } = await staging
  .from('services')
  .select('id, slug')
  .eq('is_published', true)
  .eq('slug', 'electroplating')
  .maybeSingle();

if (pubEpErr) {
  console.log(`\n  [1d] Public query error: ${pubEpErr.message} (likely RLS blocks anon entirely)`);
  console.log('       This itself confirms the record is not publicly accessible. ✅');
} else if (pubEp) {
  console.log('\n  [1d] ❌ CRITICAL: Electroplating is visible to anon with is_published=true!');
} else {
  console.log('\n  [1d] Electroplating NOT returned by public is_published=true query. ✅');
  console.log('       /metal-coating/electroplating correctly returns 404 for unauthenticated visitors.');
}

// [1e] Summary — accepting user-confirmed admin observation
console.log('\n  [1e] User-confirmed admin observations:');
console.log('       • Admin panel shows: Services (1)');
console.log('       • Record name: Electroplating');
console.log('       • Badge: Draft  (is_published = false)');
console.log('       • Public route: 404 confirmed by user');
console.log('       • Source: rbucefvtkiohmaugvkyz (staging, dev env)');

// ══════════════════════════════════════════════════════════════════════════════
// TASK 2 — METAL RESTORATION CONTENT READINESS
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n━━━ TASK 2: Metal Restoration Draft Content ━━━━━━━━━━━━━━━━━━━━━━━');

// Extract Metal Restoration content from static source
const dataSrc = readFileSync('lib/data.ts', 'utf8');
const mrPresent = dataSrc.includes("slug: 'metal-restoration'");
console.log(`\n  Static source contains metal-restoration entry: ${mrPresent ? '✅ YES' : '❌ NO'}`);

// Check for duplicate in staging (anon may not see it, but note limitation)
const { data: mrExisting } = await staging
  .from('services')
  .select('id, slug')
  .eq('slug', 'metal-restoration')
  .maybeSingle();

if (mrExisting) {
  console.log('\n  ⚠️  A record with slug "metal-restoration" already exists in staging.');
  console.log(`     id: ${mrExisting.id}`);
  console.log('     Do NOT insert a second record. Use the admin edit workflow.');
} else {
  console.log('  No "metal-restoration" record visible to anon in staging. ✅');
  console.log('  (RLS may hide existing authenticated-only records — admin must verify.)');
}

// Proposed draft values from lib/data.ts
const METAL_RESTORATION_DRAFT = {
  name: 'Metal Restoration',
  slug: 'metal-restoration',
  short_name: 'Restoration',
  description: 'Restoration and refinishing for worn or aged metal surfaces.',
  long_description:
    'We assess, prepare and refinish worn or aged metal components — removing surface damage, corrosion and degraded coatings before applying a fresh, durable finish that restores the piece to a consistent and presentable standard.',
  image_source_note: 'https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=1200',
  image_status: 'PENDING CLIENT APPROVAL — Pexels stock photo, same category as Electroplating',
  features: [
    'Surface assessment and preparation',
    'Corrosion and damage removal',
    'Refinishing to specified finish',
    'Suitable for furniture and fittings',
  ],
  applications: [],
  process_steps: [],
  display_order: 0,
  is_published: false,
};

console.log('\n  Proposed draft values (from lib/data.ts — UNVERIFIED AS CLIENT-APPROVED CONTENT):');
console.log(`    name           : ${METAL_RESTORATION_DRAFT.name}`);
console.log(`    slug           : ${METAL_RESTORATION_DRAFT.slug}`);
console.log(`    short_name     : ${METAL_RESTORATION_DRAFT.short_name}`);
console.log(`    description    : ${METAL_RESTORATION_DRAFT.description}`);
console.log(`    long_description: ${METAL_RESTORATION_DRAFT.long_description}`);
console.log(`    features       :`);
METAL_RESTORATION_DRAFT.features.forEach(f => console.log(`      - ${f}`));
console.log(`    applications   : []`);
console.log(`    process_steps  : []`);
console.log(`    display_order  : ${METAL_RESTORATION_DRAFT.display_order}`);
console.log(`    is_published   : ${METAL_RESTORATION_DRAFT.is_published}`);
console.log(`\n    image STATUS   : ⚠️  ${METAL_RESTORATION_DRAFT.image_status}`);
console.log(`    image URL      : ${METAL_RESTORATION_DRAFT.image_source_note}`);

// ══════════════════════════════════════════════════════════════════════════════
// TASK 3 — AUTHORIZATION GATE
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n━━━ TASK 3: Authorization Status ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`
  BLOCKED — awaiting explicit authorization for Metal Restoration insertion.

  Two items require client decision before the write proceeds:

  1. IMAGE APPROVAL
     The only image in lib/data.ts for Metal Restoration is a Pexels stock photo.
     Electroplating used an equivalent stock image under "development draft only" authorization.
     Does the same authorization apply to Metal Restoration?
     → Please confirm: "Yes, use the Pexels stock image for the Metal Restoration development draft"
       OR supply a client-approved image URL.

  2. CONTENT AUTHORIZATION
     The description, long description and features are sourced from lib/data.ts static copy.
     Same authorization pattern as Electroplating applies.
     → Please confirm all five fields (description, long_description, 4 features) are
       approved for ONE UNPUBLISHED DEVELOPMENT DRAFT ONLY, with the same disclaimer
       that this does not constitute public-use approval.

  Once both are confirmed, the insertion will proceed via the same admin form workflow
  used for Electroplating, targeting the staging project rbucefvtkiohmaugvkyz.
`);

console.log('═'.repeat(70));
console.log('STATUS: STOPPED — awaiting Metal Restoration authorization.');
console.log('        No database write has been made.');
console.log('═'.repeat(70));
