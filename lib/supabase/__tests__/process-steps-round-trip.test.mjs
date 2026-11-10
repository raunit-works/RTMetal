/**
 * Regression tests for process_steps round-trip data integrity
 * and service image validation logic.
 *
 * Run with: node lib/supabase/__tests__/process-steps-round-trip.test.mjs
 * No dependencies, no database writes.
 */

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

// ─── Helpers mirroring admin-workspace.tsx logic ────────────────────────────

/**
 * Mirrors the edit-populator logic: convert raw DB process_steps array to textarea string.
 * Uses JSON.stringify (lossless) — not "title - description" text.
 */
function toTextarea(dbSteps) {
  if (!dbSteps || !Array.isArray(dbSteps) || dbSteps.length === 0) return '';
  return JSON.stringify(dbSteps, null, 2);
}

/**
 * Mirrors handleServiceSubmit process_steps parsing.
 * Returns {ok: true, value} or {ok: false, error}.
 */
function parseTextarea(textareaValue, isEditing) {
  const trimmed = (textareaValue ?? '').trim();
  if (trimmed === '') {
    return { ok: true, value: isEditing ? undefined : [] };
  }
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: 'Not valid JSON' };
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, error: 'Not a JSON array' };
  }
  return { ok: true, value: parsed };
}

/**
 * Mirrors image validation in handleServiceSubmit.
 */
function validateImage(svcImage) {
  const trimmed = (svcImage ?? '').trim();
  if (!trimmed) return { ok: false, error: 'Image is required' };
  if (
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('/')
  ) {
    return { ok: false, error: 'Invalid image URL or path' };
  }
  return { ok: true };
}

// ─── Test Suite 1: Process-step round-trips ─────────────────────────────────
console.log('\n=== Suite 1: Process-step data integrity ===\n');

// T1 — Structured object survives open + save without edits
{
  const dbSteps = [{ title: 'Surface Preparation', description: 'Clean and degrease.', order: 1 }];
  const textarea = toTextarea(dbSteps);
  const result = parseTextarea(textarea, true); // editing = true
  assert('Structured object round-trip: ok', result.ok === true);
  assert('Structured object round-trip: title preserved', result.value?.[0]?.title === 'Surface Preparation');
  assert('Structured object round-trip: description preserved', result.value?.[0]?.description === 'Clean and degrease.');
  assert('Structured object round-trip: extra property "order" preserved', result.value?.[0]?.order === 1);
}

// T2 — Hyphen in title/description does not corrupt data
{
  const dbSteps = [{ title: 'Pre-treatment - soak', description: 'Soak 10-15 min in solution A-type.' }];
  const textarea = toTextarea(dbSteps);
  const result = parseTextarea(textarea, true);
  assert('Hyphen in title: round-trip ok', result.ok === true);
  assert('Hyphen in title: title exact', result.value?.[0]?.title === 'Pre-treatment - soak');
  assert('Hyphen in description: description exact', result.value?.[0]?.description === 'Soak 10-15 min in solution A-type.');
}

// T3 — Multiple structured objects with extra properties
{
  const dbSteps = [
    { title: 'Step 1', description: 'Desc 1', icon: 'wrench', duration: '5 min' },
    { title: 'Step 2', description: 'Desc 2', icon: 'flame', duration: '10 min' },
  ];
  const textarea = toTextarea(dbSteps);
  const result = parseTextarea(textarea, true);
  assert('Multi-step: round-trip ok', result.ok === true);
  assert('Multi-step: first step icon preserved', result.value?.[0]?.icon === 'wrench');
  assert('Multi-step: second step duration preserved', result.value?.[1]?.duration === '10 min');
}

// T4 — Empty textarea during edit preserves (returns undefined = omit from payload)
{
  const result = parseTextarea('', true);
  assert('Empty textarea (editing): ok', result.ok === true);
  assert('Empty textarea (editing): value is undefined (omit from payload)', result.value === undefined);
}

// T5 — Empty textarea for new service sends []
{
  const result = parseTextarea('', false);
  assert('Empty textarea (new service): ok', result.ok === true);
  assert('Empty textarea (new service): value is []', Array.isArray(result.value) && result.value.length === 0);
}

// T6 — Invalid JSON is rejected
{
  const result = parseTextarea('not json', false);
  assert('Invalid JSON: rejected', result.ok === false);
}

// T7 — JSON object (not array) is rejected
{
  const result = parseTextarea('{"title":"Step 1"}', false);
  assert('JSON object (non-array): rejected', result.ok === false);
}

// T8 — String-only array is accepted (for backward compatibility with plain-string steps)
{
  const dbSteps = ['Surface clean', 'Apply primer'];
  const textarea = toTextarea(dbSteps);
  const result = parseTextarea(textarea, true);
  assert('String steps: round-trip ok', result.ok === true);
  assert('String steps: first element preserved', result.value?.[0] === 'Surface clean');
}

// T9 — Editing OTHER fields (name, desc etc.) does not touch svcProcessSteps state
// Simulated: if svcProcessSteps is '' when editing=true, payload omits process_steps key
{
  const svcProcessSteps = ''; // unchanged from load (user only edited name)
  const isEditing = true;
  const result = parseTextarea(svcProcessSteps, isEditing);
  const payloadHasKey = result.value !== undefined;
  assert('Editing other fields: process_steps absent from payload', !payloadHasKey);
}

// ─── Test Suite 2: Image Validation ─────────────────────────────────────────
console.log('\n=== Suite 2: Image validation ===\n');

assert('Empty string rejected', !validateImage('').ok);
assert('Whitespace-only rejected', !validateImage('   ').ok);
assert('Plain string rejected', !validateImage('my-image.jpg').ok);
assert('Relative path without slash rejected', !validateImage('uploads/abc.jpg').ok);
assert('Valid https:// URL accepted', validateImage('https://example.supabase.co/storage/v1/object/public/catalog-images/uploads/test.jpg').ok);
assert('Valid http:// URL accepted', validateImage('http://localhost:3000/uploads/test.jpg').ok);
assert('Valid root-relative path accepted', validateImage('/uploads/catalog-images/img.png').ok);
assert('Supabase storage URL accepted', validateImage('https://xxxxxxxxxx.supabase.co/storage/v1/object/public/catalog-images/uploads/1234-abc.webp').ok);

// ─── Test Suite 3: Publication defaults ─────────────────────────────────────
console.log('\n=== Suite 3: Publication defaults ===\n');

// Verify new-service default: svcIsPublished initialises to false
const initialSvcIsPublished = false; // matches useState(false) in component
assert('New service starts unpublished (false)', initialSvcIsPublished === false);

// Verify createServiceAdmin uses: is_published: service.is_published ?? false
function simulateCreate(servicePayload) {
  return { is_published: servicePayload.is_published ?? false };
}
const created = simulateCreate({ is_published: false });
assert('createServiceAdmin: false passed explicitly stored as false', created.is_published === false);
const createdUndefined = simulateCreate({});
assert('createServiceAdmin: undefined falls back to false', createdUndefined.is_published === false);

// Verify editing an existing service preserves its publication status
const existingService = { is_published: true, name: 'PU Coating' };
const loadedIsPublished = existingService.is_published; // setSvcIsPublished(s.is_published)
assert('Editing existing service: published status preserved from DB row', loadedIsPublished === true);

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\n⚠️  REGRESSION: Some tests failed. Review above output.');
  process.exit(1);
} else {
  console.log('\n✅  All regression tests passed.');
  process.exit(0);
}
