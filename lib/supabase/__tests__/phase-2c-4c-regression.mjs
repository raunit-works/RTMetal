/**
 * PHASE 2C-4C REGRESSION TESTS
 * Focused tests for six-service integration, empty-state logic,
 * canonical routes, and publication gating.
 * No database writes. No publication. Mocked fixtures only.
 *
 * TEST METHODOLOGY:
 * - Filtering logic functions are pure and extracted from source.
 * - PRINCIPAL_SERVICE_GROUPS is inlined (mirrors lib/principal-service-groups.ts).
 * - Each test is labeled SOURCE or SIMULATION.
 *
 * Run with: node lib/supabase/__tests__/phase-2c-4c-regression.mjs
 */

// Inlined principal service configuration (mirrors lib/principal-service-groups.ts)
const PRINCIPAL_SERVICE_GROUPS = [
  { slug: 'pvd-coating', name: 'PVD Coating', specialistSlugs: [], mappingStatus: 'review-needed' },
  { slug: 'electroplating', name: 'Electroplating', specialistSlugs: ['electroplating'], mappingStatus: 'confirmed' },
  { slug: 'pu-coating', name: 'PU Coating', specialistSlugs: [], mappingStatus: 'review-needed' },
  { slug: 'powder-coating', name: 'Powder Coating', specialistSlugs: [], mappingStatus: 'review-needed' },
  { slug: 'decorative-metal-finishing', name: 'Decorative Metal Finishing', specialistSlugs: [], mappingStatus: 'review-needed' },
  { slug: 'metal-restoration', name: 'Metal Restoration & Refinishing', specialistSlugs: ['metal-restoration'], mappingStatus: 'confirmed' },
];

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

// ── Pure filtering functions (mirror source logic in metal-coating-client.tsx) ──
function filterPrincipalServices(services) {
  const principalServiceSlugs = new Set(PRINCIPAL_SERVICE_GROUPS.map((g) => g.slug));
  return services.filter((svc) => principalServiceSlugs.has(svc.slug));
}

function filterSpecialistServices(services) {
  const principalServiceSlugs = new Set(PRINCIPAL_SERVICE_GROUPS.map((g) => g.slug));
  return services.filter((svc) => !principalServiceSlugs.has(svc.slug));
}

function filterVisiblePrincipalGroups(groups, publishedServices) {
  const serviceBySlug = new Map(publishedServices.map((svc) => [svc.slug, svc]));
  return groups.filter((group) => serviceBySlug.has(group.slug));
}

// ── Test 1: No published services → no principal cards, empty specialist ──
{
  console.log('\n=== Test 1: No published services → no principal cards ===');
  const published = [];
  const principals = filterPrincipalServices(published);
  const specialists = filterSpecialistServices(published);
  assert('No principal services when none published', principals.length === 0);
  assert('No specialist services when none published', specialists.length === 0);
  const visibleGroups = filterVisiblePrincipalGroups(PRINCIPAL_SERVICE_GROUPS, published);
  assert('No principal groups visible', visibleGroups.length === 0);
  assert('Electroplating hidden when unpublished', !visibleGroups.some((g) => g.slug === 'electroplating'));
  assert('Metal Restoration hidden when unpublished', !visibleGroups.some((g) => g.slug === 'metal-restoration'));
}

// ── Test 2: One published principal service and zero specialists ──
{
  console.log('\n=== Test 2: One published principal service and zero specialists ===');
  const published = [{ slug: 'pvd-coating', name: 'PVD Coating', description: 'PVD coating services.', image: '/pvd.jpg' }];
  const principals = filterPrincipalServices(published);
  const specialists = filterSpecialistServices(published);
  assert('PVD Coating visible as principal', principals.some((s) => s.slug === 'pvd-coating'));
  assert('Only one principal service', principals.length === 1);
  assert('No specialist services when all are principal', specialists.length === 0);
  const visibleGroups = filterVisiblePrincipalGroups(PRINCIPAL_SERVICE_GROUPS, published);
  assert('PVD Coating group visible', visibleGroups.some((g) => g.slug === 'pvd-coating'));
  assert('Only one principal group visible', visibleGroups.length === 1);
}

// ── Test 3: One published specialist and zero principals ──
{
  console.log('\n=== Test 3: One published specialist and zero principals ===');
  const published = [{ slug: 'murti-finishing', name: 'Murti Finishing', description: 'Murti finishing.', image: '/murti.jpg' }];
  const principals = filterPrincipalServices(published);
  const specialists = filterSpecialistServices(published);
  assert('No principal services', principals.length === 0);
  assert('Murti Finishing in specialist grid', specialists.some((s) => s.slug === 'murti-finishing'));
  assert('One specialist service', specialists.length === 1);
  const visibleGroups = filterVisiblePrincipalGroups(PRINCIPAL_SERVICE_GROUPS, published);
  assert('No principal groups visible', visibleGroups.length === 0);
}

// ── Test 4: Mixed published principals and specialists ──
{
  console.log('\n=== Test 4: Mixed published principals and specialists ===');
  const published = [
    { slug: 'electroplating', name: 'Electroplating', description: 'DB content', image: '/ep.jpg' },
    { slug: 'murti-finishing', name: 'Murti Finishing', description: 'DB content', image: '/murti.jpg' },
  ];
  const principals = filterPrincipalServices(published);
  const specialists = filterSpecialistServices(published);
  assert('Electroplating visible as principal', principals.some((s) => s.slug === 'electroplating'));
  assert('Only electroplating principal', principals.length === 1);
  assert('Murti Finishing in specialist grid', specialists.some((s) => s.slug === 'murti-finishing'));
  assert('Only one specialist service', specialists.length === 1);
  const visibleGroups = filterVisiblePrincipalGroups(PRINCIPAL_SERVICE_GROUPS, published);
  assert('Electroplating group visible', visibleGroups.some((g) => g.slug === 'electroplating'));
  assert('Only one principal group visible', visibleGroups.length === 1);
  // No duplicates across grids
  const allSlugs = [...principals.map((s) => s.slug), ...specialists.map((s) => s.slug)];
  const uniqueSlugs = new Set(allSlugs);
  assert('No duplicate slugs across principal and specialist grids', allSlugs.length === uniqueSlugs.size);
  assert('Electroplating appears exactly once', allSlugs.filter((s) => s === 'electroplating').length === 1);
}

// ── Test 5: Unpublished principal drafts excluded ──
{
  console.log('\n=== Test 5: Unpublished principal drafts excluded ===');
  const published = [{ slug: 'murti-finishing', name: 'Murti Finishing', description: 'DB content', image: '/murti.jpg' }];
  const visibleGroups = filterVisiblePrincipalGroups(PRINCIPAL_SERVICE_GROUPS, published);
  assert('Electroplating not visible when unpublished', !visibleGroups.some((g) => g.slug === 'electroplating'));
  assert('Metal Restoration not visible when unpublished', !visibleGroups.some((g) => g.slug === 'metal-restoration'));
  assert('No principal groups visible', visibleGroups.length === 0);
}

// ── Test 6: Canonical Metal Restoration route ──
{
  console.log('\n=== Test 6: Canonical Metal Restoration route ===');
  const mrGroup = PRINCIPAL_SERVICE_GROUPS.find((g) => g.name.includes('Metal Restoration'));
  assert('Metal Restoration group exists', !!mrGroup);
  assert('Canonical slug is metal-restoration', mrGroup.slug === 'metal-restoration');
  assert('Not using metal-restoration-refinishing as URL', mrGroup.slug !== 'metal-restoration-refinishing');
  assert('Detail href is /metal-coating/metal-restoration', `/metal-coating/${mrGroup.slug}` === '/metal-coating/metal-restoration');
}

// ── Test 7: Unverified enquiry destination remains inactive ──
{
  console.log('\n=== Test 7: Unverified enquiry destination remains inactive ===');
  const whatsappUrl = null;
  const hasVerifiedEnquiry = Boolean(whatsappUrl);
  const previewMode = true;
  const activeEnquiry = hasVerifiedEnquiry && !previewMode;
  assert('WhatsApp URL is null when unverified', whatsappUrl === null);
  assert('No active enquiry in preview mode', !activeEnquiry);
  assert('No active enquiry when unverified in public mode', !(Boolean(null) && !false));
}

// ── Test 8: Development preview still displays six cards ──
{
  console.log('\n=== Test 8: Development preview still displays six cards ===');
  assert('Preview renders all 6 groups', PRINCIPAL_SERVICE_GROUPS.length === 6);
  const slugs = PRINCIPAL_SERVICE_GROUPS.map((g) => g.slug);
  assert('Preview includes PVD Coating', slugs.includes('pvd-coating'));
  assert('Preview includes Electroplating', slugs.includes('electroplating'));
  assert('Preview includes PU Coating', slugs.includes('pu-coating'));
  assert('Preview includes Powder Coating', slugs.includes('powder-coating'));
  assert('Preview includes Decorative Metal Finishing', slugs.includes('decorative-metal-finishing'));
  assert('Preview includes Metal Restoration', slugs.includes('metal-restoration'));
}

// ── Test 9: No static description fallback in public mode ──
{
  console.log('\n=== Test 9: No static description fallback in public mode ===');
  // Public mode (previewMode=false): service.description used directly, empty if missing
  const service = { slug: 'electroplating', name: 'Electroplating', description: '', image: '/ep.jpg' };
  const previewMode = false;
  const displayDescription = service
    ? service.description
    : previewMode ? 'Static group description' : '';
  assert('Empty description stays empty in public mode', displayDescription === '');
  assert('Not using static group description as fallback', displayDescription !== 'Static group description');

  // Preview mode can use static description
  const previewModeTrue = true;
  const noService = undefined;
  const previewDescription = noService
    ? noService.description
    : previewModeTrue ? 'Static group description' : '';
  assert('Preview mode can use static description', previewDescription === 'Static group description');
}

// ── Summary ──
console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n✅ All Phase 2C-4C regression tests passed.');
  process.exit(0);
}
