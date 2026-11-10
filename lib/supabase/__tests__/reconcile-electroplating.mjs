/**
 * READ-ONLY Reconciliation Script — Electroplating Draft
 *
 * Checks BOTH Supabase projects configured in the project's env files.
 * No writes. No deletes. SELECT only.
 *
 * Run with: node lib/supabase/__tests__/reconcile-electroplating.mjs
 */

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// ─── Load both env files ─────────────────────────────────────────────────────
function parseEnvFile(path) {
  const result = {};
  try {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim().replace(/\r$/, '');
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      result[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  } catch {
    // file absent — that's fine
  }
  return result;
}

const envLocal     = parseEnvFile('.env.local');
const envDevLocal  = parseEnvFile('.env.development.local');

// Mask a key for display — never log full credentials
const mask = (k) => k ? k.slice(0, 16) + '…' + k.slice(-4) : '(missing)';

const projects = [
  {
    label: '.env.local (production target)',
    url:   envLocal['NEXT_PUBLIC_SUPABASE_URL'],
    key:   envLocal['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
  },
  {
    label: '.env.development.local (development override)',
    url:   envDevLocal['NEXT_PUBLIC_SUPABASE_URL'],
    key:   envDevLocal['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
  },
];

// Next.js loads .env.development.local OVER .env.local in development mode.
// So when running `npm run dev`, the DEV project is the one in use.
const devProject = projects[1];
const prodProject = projects[0];

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  RECONCILIATION: Electroplating Draft — Read-Only Query  ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('Environment file resolution (Next.js precedence in dev):');
console.log('  .env.development.local  OVERRIDES  .env.local  when NODE_ENV=development');
console.log('  → Active in `npm run dev`: .env.development.local\n');

for (const proj of projects) {
  console.log(`──── ${proj.label} ────`);
  console.log(`  URL : ${proj.url ?? '(not set)'}`);
  console.log(`  Key : ${mask(proj.key)}`);

  if (!proj.url || !proj.key) {
    console.log('  ⚠️  Skipping — URL or key missing.\n');
    continue;
  }

  const client = createClient(proj.url, proj.key);

  // 1. Check for ANY services (counts total rows visible to anon)
  const { data: allSvcs, error: allErr } = await client
    .from('services')
    .select('id, slug, name, is_published, display_order, created_at')
    .order('created_at', { ascending: false });

  if (allErr) {
    console.log(`  ❌ services SELECT failed: ${allErr.message} (${allErr.code})\n`);
    continue;
  }

  console.log(`  Total rows visible (anon SELECT, no filter): ${allSvcs?.length ?? 0}`);

  if (!allSvcs || allSvcs.length === 0) {
    console.log('  → No services visible in this project.\n');
    continue;
  }

  // 2. Look for electroplating specifically
  const ep = allSvcs.find(s => s.slug === 'electroplating');

  if (!ep) {
    console.log('  → slug "electroplating" NOT found among visible rows.');
    console.log('  Rows present:', allSvcs.map(s => `${s.slug} (published=${s.is_published})`).join(', '));
    console.log('');
    continue;
  }

  console.log(`\n  ✅ Found "electroplating" in this project:`);
  console.log(`     id           : ${ep.id}`);
  console.log(`     slug         : ${ep.slug}`);
  console.log(`     name         : ${ep.name}`);
  console.log(`     is_published : ${ep.is_published}`);
  console.log(`     display_order: ${ep.display_order}`);
  console.log(`     created_at   : ${ep.created_at}`);

  // 3. Read full record to verify all fields
  const { data: full, error: fullErr } = await client
    .from('services')
    .select('*')
    .eq('id', ep.id)
    .single();

  if (fullErr) {
    console.log(`  ⚠️  Could not read full record: ${fullErr.message}\n`);
    continue;
  }

  console.log(`\n  Full record verification:`);
  console.log(`     name            : ${full.name}`);
  console.log(`     short_name      : ${full.short_name}`);
  console.log(`     description     : ${full.description}`);
  console.log(`     long_description: ${full.long_description?.slice(0, 80)}…`);
  console.log(`     image           : ${full.image?.slice(0, 70)}…`);
  console.log(`     features        : [${full.features?.length ?? 0} items] → ${JSON.stringify(full.features)}`);
  console.log(`     applications    : ${JSON.stringify(full.applications)}`);
  console.log(`     process_steps   : ${JSON.stringify(full.process_steps)}`);
  console.log(`     is_published    : ${full.is_published}`);

  // 4. Confirm anon public-read query does NOT return unpublished record
  const { data: pubCheck, error: pubErr } = await client
    .from('services')
    .select('id, slug')
    .eq('is_published', true)
    .eq('slug', 'electroplating')
    .maybeSingle();

  if (pubErr) {
    console.log(`\n  ⚠️  Public visibility check error: ${pubErr.message}`);
  } else if (pubCheck) {
    console.log(`\n  ❌ CRITICAL: Unpublished record is visible to is_published=true query!`);
  } else {
    console.log(`\n  ✅ Public visibility: NOT visible via is_published=true filter. Draft is safe.`);
  }
  console.log('');
}

// ─── Explain the discrepancy ──────────────────────────────────────────────────
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  RECONCILIATION SUMMARY                                  ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log(`
Next.js environment file loading order (NODE_ENV=development):
  Priority 1: .env.development.local  → ${devProject.url ?? '(not set)'}
  Priority 2: .env.local              → ${prodProject.url ?? '(not set)'}

When you run 'npm run dev', the DEVELOPMENT project is active.
When you open the Supabase SQL Editor in your dashboard, you must be
viewing the project whose URL matches the one above.

If the SQL Editor showed 0 rows for slug='electroplating', it was
almost certainly open on the wrong project (the production project
at .env.local), while the local admin panel was connected to the
development project at .env.development.local.
`);
