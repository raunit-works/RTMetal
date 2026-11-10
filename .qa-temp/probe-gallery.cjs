const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');

loadEnvConfig(process.cwd(), true);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('Missing public Supabase environment variables.');
  process.exit(1);
}
const projectRef = new URL(url).hostname.split('.')[0];
const STAGING_REF = 'rbucefvtkiohmaugvkyz';
if (projectRef !== STAGING_REF) {
  console.error(`Refusing to probe: expected staging ${STAGING_REF}, got ${projectRef}.`);
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const hostOf = (value) => {
  try {
    return value && value.startsWith('http') ? new URL(value).hostname : 'local';
  } catch {
    return 'invalid';
  }
};

async function main() {
  console.log(`Project: staging (${projectRef})`);

  const productsResult = await supabase
    .from('products')
    .select('id,slug,name,image,is_published,product_images(id,image_url,alt_text,is_primary,sort_order)');
  if (productsResult.error) throw productsResult.error;

  console.log(`Products: ${productsResult.data.length}`);
  for (const product of productsResult.data) {
    const gallery = [...(product.product_images || [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    console.log(
      `  ${product.slug} | ${product.name} | published=${product.is_published} | mainHost=${hostOf(product.image)} | gallery=${gallery.length}`
    );
    for (const image of gallery) {
      console.log(
        `    gallery id=${image.id} primary=${image.is_primary} sort=${image.sort_order} host=${hostOf(image.image_url)} url=${image.image_url}`
      );
    }
  }

  const servicesResult = await supabase.from('services').select('slug,name,image,is_published');
  if (servicesResult.error) throw servicesResult.error;
  console.log(`Services: ${servicesResult.data.length}`);
  for (const service of servicesResult.data) {
    console.log(
      `  ${service.slug} | ${service.name} | published=${service.is_published} | host=${hostOf(service.image)} | ${service.image}`
    );
  }

  const images = productsResult.data.flatMap((product) => product.product_images || []);
  console.log('--- Public object reachability ---');
  for (const image of images) {
    let status = 'skipped';
    try {
      const response = await fetch(image.image_url, { method: 'HEAD' });
      status = `${response.status} ${response.headers.get('content-type') || ''}`.trim();
    } catch (error) {
      status = `NETWORK ERROR ${error.message}`;
    }
    console.log(`  ${image.id}: ${status}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Probe failed:', error.message);
    process.exit(1);
  });
