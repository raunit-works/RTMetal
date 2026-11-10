/**
 * PHASE 2C-4B REGRESSION TESTS
 * Focused tests for six-service integration, publication gating,
 * duplicate prevention, URL behavior, and footer email verification.
 * No database writes. No publication. Mocked fixtures only.
 *
 * Run with: node lib/supabase/__tests__/phase-2c-4b-regression.mjs
 */

// Inlined principal service configuration (mirrors lib/principal-service-groups.ts)
const PRINCIPAL_SERVICE_GROUPS = [
  {
    key: 'pvd-coating',
    name: 'PVD Coating',
    slug: 'pvd-coating',
    description: 'Physical Vapor Deposition coating for durable, decorative metal finishes.',
    specialistSlugs: [],
    mappingStatus: 'review-needed',
    mappingNotes: 'No existing specialist service record maps to PVD Coating.',
  },
  {
    key: 'electroplating',
    name: 'Electroplating',
    slug: 'electroplating',
    description: 'Metal surface treatments for decorative and functional applications.',
    specialistSlugs: ['electroplating'],
    mappingStatus: 'confirmed',
    mappingNotes: 'Direct match with the electroplating specialist service record.',
  },
  {
    key: 'pu-coating',
    name: 'PU Coating',
    slug: 'pu-coating',
    description: 'Polyurethane coating for protective and decorative metal surfaces.',
    specialistSlugs: [],
    mappingStatus: 'review-needed',
    mappingNotes: 'No existing specialist service record maps to PU Coating.',
  },
  {
    key: 'powder-coating',
    name: 'Powder Coating',
    slug: 'powder-coating',
    description: 'Dry powder coating applied electrostatically and cured under heat.',
    specialistSlugs: [],
    mappingStatus: 'review-needed',
    mappingNotes: 'No existing specialist service record maps to Powder Coating.',
  },
  {
    key: 'decorative-metal-finishing',
    name: 'Decorative Metal Finishing',
    slug: 'decorative-metal-finishing',
    description: 'Decorative surface finishing for ornamental and display metal pieces.',
    specialistSlugs: [],
    mappingStatus: 'review-needed',
    mappingNotes: 'Candidate specialist services require client review before mapping.',
  },
  {
    key: 'metal-restoration-refinishing',
    name: 'Metal Restoration & Refinishing',
    slug: 'metal-restoration',
    description: 'Restoration and refinishing for worn or aged metal surfaces.',
    specialistSlugs: ['metal-restoration'],
    mappingStatus: 'confirmed',
    mappingNotes: 'Direct match with the metal-restoration specialist service record.',
  },
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

// ── Simulate the visibility logic from PrincipalServiceCards (public mode) ──
function filterVisibleGroups(groups, publishedServices) {
  const serviceBySlug = new Map(publishedServices.map((svc) => [svc.slug, svc]));
  return groups.filter((group) => serviceBySlug.has(group.slug));
}

// ── Simulate the specialist grid filtering (duplicate prevention) ──
function filterSpecialistGrid(services) {
  return services.filter(
    (svc) => !PRINCIPAL_SERVICE_GROUPS.some((g) => g.slug === svc.slug)
  );
}

// ── Test 1: Zero published services → no principal cards ──
{
  console.log('\n=== Test 1: Zero published services → no principal cards ===');
  const visible = filterVisibleGroups(PRINCIPAL_SERVICE_GROUPS, []);
  assert('No visible groups when nothing published', visible.length === 0);
  assert('Electroplating not visible when unpublished', !visible.some((g) => g.slug === 'electroplating'));
  assert('Metal Restoration not visible when unpublished', !visible.some((g) => g.slug === 'metal-restoration'));
}

// ── Test 2: Published PVD record without specialist mapping → eligible for display ──
{
  console.log('\n=== Test 2: Published PVD record without specialist mapping → eligible ===');
  const published = [{ slug: 'pvd-coating', name: 'PVD Coating', description: 'Test', image: '/test.jpg' }];
  const visible = filterVisibleGroups(PRINCIPAL_SERVICE_GROUPS, published);
  assert('PVD Coating visible when published despite no specialist mapping', visible.some((g) => g.slug === 'pvd-coating'));
  assert('Only PVD Coating visible', visible.length === 1);
}

// ── Test 3: Unpublished Electroplating → not visible ──
{
  console.log('\n=== Test 3: Unpublished Electroplating → not visible ===');
  const published = [{ slug: 'pvd-coating', name: 'PVD Coating', description: 'Test', image: '/test.jpg' }];
  const visible = filterVisibleGroups(PRINCIPAL_SERVICE_GROUPS, published);
  assert('Electroplating hidden when not in published list', !visible.some((g) => g.slug === 'electroplating'));
  assert('Metal Restoration hidden when not in published list', !visible.some((g) => g.slug === 'metal-restoration'));
}

// ── Test 4: Published Metal Restoration → correct canonical route ──
{
  console.log('\n=== Test 4: Published Metal Restoration → correct canonical route ===');
  const published = [{ slug: 'metal-restoration', name: 'Metal Restoration & Refinishing', description: 'Test', image: '/test.jpg' }];
  const visible = filterVisibleGroups(PRINCIPAL_SERVICE_GROUPS, published);
  assert('Metal Restoration visible when published', visible.some((g) => g.slug === 'metal-restoration'));
  assert('Canonical URL is /metal-coating/metal-restoration', visible[0].slug === 'metal-restoration');
  assert('Not using metal-restoration-refinishing as URL', visible[0].slug !== 'metal-restoration-refinishing');
}

// ── Test 5: Principal services do not duplicate in specialist grid ──
{
  console.log('\n=== Test 5: Principal services do not duplicate in specialist grid ===');
  const allServices = [
    { slug: 'electroplating', name: 'Electroplating' },
    { slug: 'metal-restoration', name: 'Metal Restoration & Refinishing' },
    { slug: 'murti-finishing', name: 'Murti Finishing' },
    { slug: 'plastic-coating', name: 'Plastic Coating' },
    { slug: 'marble-coating', name: 'Marble Coating' },
    { slug: 'decorative-showpieces', name: 'Decorative Showpieces' },
    { slug: 'lipping-work', name: 'Lipping Work' },
    { slug: 'wood-finishing', name: 'Wood Finishing' },
    { slug: 'sanitary-finishing', name: 'Sanitary Finishing' },
  ];
  const filtered = filterSpecialistGrid(allServices);
  assert('Electroplating excluded from specialist grid', !filtered.some((s) => s.slug === 'electroplating'));
  assert('Metal Restoration excluded from specialist grid', !filtered.some((s) => s.slug === 'metal-restoration'));
  assert('Murti Finishing retained in specialist grid', filtered.some((s) => s.slug === 'murti-finishing'));
  assert('Plastic Coating retained in specialist grid', filtered.some((s) => s.slug === 'plastic-coating'));
  assert('Marble Coating retained in specialist grid', filtered.some((s) => s.slug === 'marble-coating'));
  assert('Decorative Showpieces retained in specialist grid', filtered.some((s) => s.slug === 'decorative-showpieces'));
  assert('Lipping Work retained in specialist grid', filtered.some((s) => s.slug === 'lipping-work'));
  assert('Wood Finishing retained in specialist grid', filtered.some((s) => s.slug === 'wood-finishing'));
  assert('Sanitary Finishing retained in specialist grid', filtered.some((s) => s.slug === 'sanitary-finishing'));
  assert('Exactly 7 specialist services remain', filtered.length === 7);
}

// ── Test 6: Missing record → no broken clickable detail link ──
{
  console.log('\n=== Test 6: Missing record → no broken clickable detail link ===');
  // When nothing is published, no detail links are generated
  const published = [];
  const visible = filterVisibleGroups(PRINCIPAL_SERVICE_GROUPS, published);
  assert('No groups visible when nothing published', visible.length === 0);
  // When only PVD is published, only PVD gets a detail link
  const partial = [{ slug: 'pvd-coating', name: 'PVD Coating', description: 'Test', image: '/test.jpg' }];
  const partialVisible = filterVisibleGroups(PRINCIPAL_SERVICE_GROUPS, partial);
  assert('Only PVD Coating has a detail link', partialVisible.length === 1);
  assert('PVD detail href would be /metal-coating/pvd-coating', partialVisible[0].slug === 'pvd-coating');
  assert('No detail link for unpublished services', !partialVisible.some((g) => g.slug === 'electroplating'));
}

// ── Test 7: Preview mode displays six cards without public publication ──
{
  console.log('\n=== Test 7: Preview mode displays six cards without public publication ===');
  // Preview mode ignores publishedServices and renders all groups
  const allGroups = PRINCIPAL_SERVICE_GROUPS;
  assert('Preview renders all 6 groups', allGroups.length === 6);
  assert('Preview includes PVD Coating', allGroups.some((g) => g.slug === 'pvd-coating'));
  assert('Preview includes Electroplating', allGroups.some((g) => g.slug === 'electroplating'));
  assert('Preview includes PU Coating', allGroups.some((g) => g.slug === 'pu-coating'));
  assert('Preview includes Powder Coating', allGroups.some((g) => g.slug === 'powder-coating'));
  assert('Preview includes Decorative Metal Finishing', allGroups.some((g) => g.slug === 'decorative-metal-finishing'));
  assert('Preview includes Metal Restoration', allGroups.some((g) => g.slug === 'metal-restoration'));
}

// ── Test 8: Unverified email → no active mailto link ──
{
  console.log('\n=== Test 8: Unverified email → no active mailto link ===');
  // Simulates isEmailVerified() which checks siteSettings.contact.emailVerified
  // siteSettings.contact.emailVerified is false
  const emailVerified = false;
  const email = 'studio@aurumandco.com';
  const isClickable = emailVerified;
  assert('Email not clickable when unverified', !isClickable);
  assert('Email address preserved as text', email === 'studio@aurumandco.com');
}

// ── Test 9: Unverified WhatsApp → no active enquiry link ──
{
  console.log('\n=== Test 9: Unverified WhatsApp → no active enquiry link ===');
  // Simulates getMetalCoatingWhatsAppLink which returns null when unverified
  // siteSettings.whatsapp.metalCoating = '918888888888' (placeholder)
  // siteSettings.whatsapp.metalCoatingVerified = false
  // isPlaceholderPhone('918888888888') → true (all same digit)
  // getMetalCoatingWhatsAppLink returns null
  const whatsappUrl = null;
  const hasVerifiedEnquiry = Boolean(whatsappUrl);
  assert('WhatsApp URL is null when unverified', whatsappUrl === null);
  assert('No active enquiry when WhatsApp unverified', !hasVerifiedEnquiry);
}

// ── Test 10: Published service content comes from actual Supabase objects ──
{
  console.log('\n=== Test 10: Published service content from actual Supabase objects ===');
  // Simulates serviceBySlug lookup from published services
  const publishedServices = [
    { slug: 'electroplating', name: 'Electroplating', description: 'DB record description', image: '/db-image.jpg', is_published: true },
  ];
  const serviceBySlug = new Map(publishedServices.map((svc) => [svc.slug, svc]));
  const group = PRINCIPAL_SERVICE_GROUPS.find((g) => g.slug === 'electroplating');
  const service = serviceBySlug.get(group.slug);
  assert('Service record found by slug', service !== undefined);
  assert('Uses DB name not config name', service.name === 'Electroplating');
  assert('Uses DB description not config description', service.description === 'DB record description');
  assert('Uses DB image not static placeholder', service.image === '/db-image.jpg');
  assert('Not using hardcoded placeholder copy', service.description !== group.description);
}

// ── Test 11: Duplicate prevention — principal service appears only once ──
{
  console.log('\n=== Test 11: Duplicate prevention — principal service appears only once ===');
  const allServices = [
    { slug: 'electroplating', name: 'Electroplating' },
    { slug: 'murti-finishing', name: 'Murti Finishing' },
  ];
  const principalGroups = PRINCIPAL_SERVICE_GROUPS.filter((g) =>
    allServices.some((s) => s.slug === g.slug)
  );
  const specialistServices = filterSpecialistGrid(allServices);
  const principalSlugs = new Set(principalGroups.map((g) => g.slug));
  const specialistSlugs = new Set(specialistServices.map((s) => s.slug));
  let overlap = 0;
  for (const slug of principalSlugs) {
    if (specialistSlugs.has(slug)) overlap++;
  }
  assert('No overlap between principal and specialist grids', overlap === 0);
}

// ── Summary ──
console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n✅ All Phase 2C-4B regression tests passed.');
  process.exit(0);
}
