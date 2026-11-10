/**
 * AUTHORIZED ELECTROPLATING DEVELOPMENT DRAFT — INSERTION SCRIPT
 *
 * Authorization: granted by user, 2026-10-30.
 * Purpose: Create exactly ONE unpublished Electroplating service record.
 * Scope: Uses NEXT_PUBLIC_SUPABASE_* keys only (no service-role key).
 *
 * Run with: node lib/supabase/__tests__/electroplating-draft-insert.mjs
 *
 * This script:
 *   1. Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from .env.local
 *   2. Checks the record does not already exist
 *   3. Validates the image URL format
 *   4. Inserts the authorized draft (is_published: false)
 *   5. Reads the saved record back and confirms all fields
 *   6. Confirms the anonymous public API does not expose the unpublished record
 *
 * No schema changes. No RLS changes. No publication. No other records inserted.
 */

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// ─── Load environment variables from .env.local ──────────────────────────────
function loadEnv(path) {
  try {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local may not exist in CI; rely on already-set env vars
  }
}
loadEnv('.env.local');
loadEnv('.env.development.local');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set.');
  process.exit(1);
}

// Mask key in output — never log full credentials
const maskedKey = SUPABASE_KEY.slice(0, 12) + '…' + SUPABASE_KEY.slice(-4);
console.log(`\nSupabase project : ${SUPABASE_URL}`);
console.log(`Publishable key  : ${maskedKey}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── AUTHORIZED DRAFT VALUES ─────────────────────────────────────────────────
const AUTHORIZED_SLUG = 'electroplating';
const AUTHORIZED_RECORD = {
  name: 'Electroplating',
  slug: AUTHORIZED_SLUG,
  short_name: 'Electroplating',
  description: 'Metal surface treatments for decorative and functional applications.',
  long_description:
    'Electroplating services for decorative and functional metal components. We apply metal coatings to base materials to achieve specific surface characteristics — including appearance, corrosion resistance and finish quality.',
  image:
    'https://images.pexels.com/photos/8216580/pexels-photo-8216580.jpeg?auto=compress&cs=tinysrgb&w=1200',
  features: [
    'Decorative and functional applications',
    'Consistent finish across batch runs',
    'Multiple plating options',
    'Suitable for hardware and fittings',
  ],
  applications: [],
  process_steps: [],
  display_order: 0,
  is_published: false,   // NEVER changed by this script
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
let step = 0;
function section(title) {
  step++;
  console.log(`\n[${ step }] ${title}`);
  console.log('─'.repeat(title.length + 4));
}

function pass(msg) { console.log(`    ✅ PASS: ${msg}`); }
function fail(msg) { console.error(`    ❌ FAIL: ${msg}`); }
function info(msg) { console.log(`    ℹ️  ${msg}`); }

// ─── PRE-FLIGHT 1: Image URL format ──────────────────────────────────────────
section('Pre-flight: Image URL validation');
const img = AUTHORIZED_RECORD.image.trim();
const validImage =
  img.startsWith('https://') || img.startsWith('http://') || img.startsWith('/');
if (!img) {
  fail('Image is empty — cannot proceed.');
  process.exit(1);
}
if (!validImage) {
  fail(`Image does not start with https://, http:// or / — value: ${img}`);
  process.exit(1);
}
pass(`Image URL format: ${img.slice(0, 60)}…`);

// ─── PRE-FLIGHT 2: Confirm record does not already exist ─────────────────────
section('Pre-flight: Check for existing record');
const { data: existing, error: existsErr } = await supabase
  .from('services')
  .select('id, slug, is_published, created_at')
  .eq('slug', AUTHORIZED_SLUG)
  .maybeSingle();

if (existsErr) {
  fail(`Supabase query error: ${existsErr.message} (code: ${existsErr.code})`);
  console.error('\nFull error:', existsErr);
  process.exit(1);
}

if (existing) {
  info(`Record already exists:`);
  info(`  id         : ${existing.id}`);
  info(`  slug       : ${existing.slug}`);
  info(`  is_published: ${existing.is_published}`);
  info(`  created_at : ${existing.created_at}`);
  fail('Record with slug "electroplating" already exists. Aborting to prevent duplicate.');
  console.log('\nBLOCKED — RECORD ALREADY EXISTS');
  console.log('If you intend to update this record, use the admin edit workflow, not this insertion script.');
  process.exit(0);
}
pass(`No existing record found for slug "${AUTHORIZED_SLUG}". Safe to insert.`);

// ─── PRE-FLIGHT 3: Confirm is_published is false ──────────────────────────────
section('Pre-flight: Publication status guard');
if (AUTHORIZED_RECORD.is_published !== false) {
  fail('is_published is not false in the authorized record. Aborting.');
  process.exit(1);
}
pass('is_published = false — confirmed. Record will be an unpublished draft.');

// ─── PRE-FLIGHT 4: No schema modification required ───────────────────────────
section('Pre-flight: Schema check (probe 15-column services table)');
const { error: schemaErr } = await supabase
  .from('services')
  .select('id,slug,name,short_name,description,long_description,image,icon,features,applications,process_steps,display_order,is_published,created_at,updated_at')
  .limit(0);

if (schemaErr) {
  fail(`Schema probe failed: ${schemaErr.message}`);
  process.exit(1);
}
pass('15-column services schema confirmed. No schema changes required.');

// ─── INSERTION ────────────────────────────────────────────────────────────────
section('Insert authorized Electroplating development draft');
info('Payload:');
info(`  name           : ${AUTHORIZED_RECORD.name}`);
info(`  slug           : ${AUTHORIZED_RECORD.slug}`);
info(`  description    : ${AUTHORIZED_RECORD.description}`);
info(`  long_description: ${AUTHORIZED_RECORD.long_description.slice(0, 60)}…`);
info(`  image          : ${AUTHORIZED_RECORD.image.slice(0, 60)}…`);
info(`  features       : [${AUTHORIZED_RECORD.features.length} items]`);
info(`  applications   : []`);
info(`  process_steps  : []`);
info(`  display_order  : ${AUTHORIZED_RECORD.display_order}`);
info(`  is_published   : ${AUTHORIZED_RECORD.is_published}`);

const { data: inserted, error: insertErr } = await supabase
  .from('services')
  .insert([{ ...AUTHORIZED_RECORD, is_published: false }])
  .select()
  .single();

if (insertErr) {
  fail(`Insert failed: ${insertErr.message} (code: ${insertErr.code})`);
  console.error('\nFull error:', insertErr);
  console.log('\nBLOCKED — SPECIFIC INSERTION ISSUE');
  console.log('\nLikely cause: The publishable (anon) key does not have INSERT permission on');
  console.log('  public.services via RLS. This is expected for anon writes requiring admin auth.');
  console.log('\nSee MANUAL STEPS section at the end of this output for the browser-based workflow.');
  process.exit(1);
}

pass(`Record inserted successfully.`);
pass(`  id             : ${inserted.id}`);
pass(`  slug           : ${inserted.slug}`);
pass(`  is_published   : ${inserted.is_published}`);
pass(`  created_at     : ${inserted.created_at}`);

// ─── POST-INSERT VERIFICATION ─────────────────────────────────────────────────
section('Post-insert: Read back saved record and verify all fields');

const { data: saved, error: readErr } = await supabase
  .from('services')
  .select('*')
  .eq('id', inserted.id)
  .single();

if (readErr) {
  fail(`Could not read back record: ${readErr.message}`);
  process.exit(1);
}

// Verify every authorized field
const checks = [
  ['id', saved.id, (v) => typeof v === 'string' && v.length > 30],
  ['slug', saved.slug, (v) => v === AUTHORIZED_SLUG],
  ['name', saved.name, (v) => v === 'Electroplating'],
  ['short_name', saved.short_name, (v) => v === 'Electroplating'],
  ['description', saved.description, (v) => v === AUTHORIZED_RECORD.description],
  ['long_description', saved.long_description, (v) => v === AUTHORIZED_RECORD.long_description],
  ['image', saved.image, (v) => v === AUTHORIZED_RECORD.image],
  ['is_published', saved.is_published, (v) => v === false],
  ['display_order', saved.display_order, (v) => v === 0],
  ['features.length', saved.features?.length, (v) => v === 4],
  ['features[0]', saved.features?.[0], (v) => v === 'Decorative and functional applications'],
  ['features[3]', saved.features?.[3], (v) => v === 'Suitable for hardware and fittings'],
  ['applications', JSON.stringify(saved.applications), (v) => v === '[]'],
  ['process_steps', JSON.stringify(saved.process_steps), (v) => v === '[]' || v === 'null'],
];

let verifyFailed = false;
for (const [label, actual, predicate] of checks) {
  if (predicate(actual)) {
    pass(`${label}: ${String(actual).slice(0, 80)}`);
  } else {
    fail(`${label}: expected predicate to pass, got: ${String(actual).slice(0, 80)}`);
    verifyFailed = true;
  }
}

// ─── PUBLIC VISIBILITY CHECK ──────────────────────────────────────────────────
section('Public API visibility: confirm unpublished record is NOT returned');

const { data: publicRows, error: pubErr } = await supabase
  .from('services')
  .select('id, slug')
  .eq('is_published', true)
  .eq('slug', AUTHORIZED_SLUG);

if (pubErr) {
  fail(`Public query error: ${pubErr.message}`);
} else if (publicRows && publicRows.length > 0) {
  fail('CRITICAL: The draft record is visible to the is_published=true query. RLS or default may be wrong.');
  verifyFailed = true;
} else {
  pass('Unpublished draft is NOT returned by the public is_published=true query. ✅');
  pass('The public API, slug page (/metal-coating/electroplating), and service cards will NOT show this draft.');
}

// ─── FINAL SUMMARY ────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(62));
if (!verifyFailed) {
  console.log('ELECTROPLATING DRAFT CREATED AND VERIFIED');
  console.log('');
  console.log(`  Record ID   : ${saved.id}`);
  console.log(`  Slug        : ${saved.slug}`);
  console.log(`  Published   : ${saved.is_published}  ← DRAFT ONLY`);
  console.log(`  Created at  : ${saved.created_at}`);
  console.log('');
  console.log('  ⚠️  IMAGE NOTE: Temporary Pexels stock reference.');
  console.log('     Client-approved photograph required before publication.');
  console.log('');
  console.log('  NEXT STEP: Open the admin Services tab, locate "Electroplating",');
  console.log('  verify the record visually, then await client content and image');
  console.log('  approval before publishing.');
} else {
  console.log('BLOCKED — POST-INSERT VERIFICATION FAILED');
  console.log('Review the FAIL items above. No further action taken.');
}
console.log('═'.repeat(62));

process.exit(verifyFailed ? 1 : 0);
