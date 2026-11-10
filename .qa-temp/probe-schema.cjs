const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');

loadEnvConfig(process.cwd(), true);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase public environment variables.');
  process.exit(1);
}

const projectRef = new URL(url).hostname.split('.')[0];
const STAGING_REF = 'rbucefvtkiohmaugvkyz';
if (projectRef !== STAGING_REF) {
  console.error(`Refusing to probe: expected staging ${STAGING_REF}, got ${projectRef}.`);
  process.exit(1);
}

console.log(`Project: staging (${projectRef})`);
console.log(`Public key kind: ${key.startsWith('sb_publishable_') ? 'publishable' : key.startsWith('eyJ') ? 'legacy-jwt' : 'unknown'} (length ${key.length})`);

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function check(label, fn) {
  try {
    const result = await fn();
    if (result.error) {
      console.log(`${label}: ERROR ${result.error.message}`);
      return null;
    }
    return result.data;
  } catch (error) {
    console.log(`${label}: THROWN ${error.message}`);
    return null;
  }
}

async function main() {
  const tables = ['categories', 'products', 'services', 'product_images'];
  console.log('--- Row access ---');
  for (const table of tables) {
    const data = await check(table, () =>
      supabase.from(table).select('*').limit(5)
    );
    if (data) {
      console.log(`${table}: OK, sample rows=${data.length}`);
      if (data[0]) console.log(`  columns: ${Object.keys(data[0]).sort().join(', ')}`);
    }
  }

  console.log('--- Candidate new columns ---');
  const candidates = [
    ['categories', 'main_section'],
    ['categories', 'parent_id'],
    ['categories', 'is_published'],
    ['products', 'main_section'],
    ['services', 'main_section'],
    ['services', 'related_product_ids'],
    ['services', 'product_ids'],
  ];
  for (const [table, column] of candidates) {
    const data = await check(`${table}.${column}`, () =>
      supabase.from(table).select(column).limit(1)
    );
    if (data) console.log(`${table}.${column}: EXISTS`);
  }

  console.log('--- Counts ---');
  for (const table of tables) {
    const result = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    console.log(`${table}: ${result.error ? `ERROR ${result.error.message}` : result.count}`);
  }

  const { data: cats, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });
  console.log('--- Categories ---');
  if (catErr) {
    console.log(`ERROR ${catErr.message}`);
  } else {
    for (const c of cats || []) {
      console.log(
        JSON.stringify({
          slug: c.slug,
          name: c.name,
          display_order: c.display_order,
          is_featured: c.is_featured,
          main_section: c.main_section,
          parent_id: c.parent_id,
          is_published: c.is_published,
        })
      );
    }
  }

  const { data: prods, error: prodErr } = await supabase
    .from('products')
    .select('id,slug,name,price,is_published,category_id,product_images(id,image_url,is_primary)');
  console.log('--- Products ---');
  if (prodErr) {
    console.log(`ERROR ${prodErr.message}`);
  } else {
    console.log(`visible published products: ${(prods || []).length}`);
    console.log(`with gallery images: ${(prods || []).filter((p) => (p.product_images || []).length > 0).length}`);
    console.log(`null prices: ${(prods || []).filter((p) => p.price == null).length}`);
  }

  const { data: svcs, error: svcErr } = await supabase
    .from('services')
    .select('slug,name,is_published,display_order');
  console.log('--- Services ---');
  if (svcErr) {
    console.log(`ERROR ${svcErr.message}`);
  } else {
    console.log(`published visible: ${(svcs || []).length}`);
    for (const s of svcs || []) console.log(`  ${s.slug} | ${s.name} | order ${s.display_order}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Probe failed:', error.message);
    process.exit(1);
  });
