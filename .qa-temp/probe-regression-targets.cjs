const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');

loadEnvConfig(process.cwd(), true);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key || new URL(url).hostname.split('.')[0] !== 'rbucefvtkiohmaugvkyz') {
  console.error('Refusing to probe.');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const { data: products, error } = await supabase
    .from('products')
    .select('slug,name,is_published,categories(slug,name,main_section)')
    .eq('is_published', true)
    .limit(10);
  if (error) {
    console.log(`products ERROR ${error.message}`);
    process.exit(1);
  }
  console.log(`published products: ${products.length}`);
  for (const product of products) {
    console.log(JSON.stringify({
      slug: product.slug,
      name: product.name,
      category: product.categories,
    }));
  }
})();
