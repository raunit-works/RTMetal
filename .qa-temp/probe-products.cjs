const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');
loadEnvConfig(process.cwd(), true);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
(async () => {
  const { data, error } = await supabase.from('products').select('name,slug,is_published,categories(slug,name)');
  if (error) { console.log(error.message); process.exit(1); }
  for (const p of data) console.log(`${p.name} | ${p.slug} | category=${p.categories?.slug || 'missing'}`);
})();
