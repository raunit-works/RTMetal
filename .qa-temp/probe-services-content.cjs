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
if (projectRef !== 'rbucefvtkiohmaugvkyz') {
  console.error('Refusing to probe: not staging.');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: svcs, error: svcErr } = await supabase
    .from('services')
    .select('id,slug,name,short_name,description,long_description,image,icon,features,applications,process_steps,display_order,is_published')
    .order('display_order', { ascending: true });
  if (svcErr) {
    console.log(`services ERROR ${svcErr.message}`);
  } else {
    console.log(`services count ${svcs.length}`);
    for (const s of svcs) {
      console.log(JSON.stringify({
        id: s.id,
        slug: s.slug,
        name: s.name,
        short_name: s.short_name,
        is_published: s.is_published,
        display_order: s.display_order,
        image: s.image,
        icon: s.icon,
        description: s.description,
        long_description: s.long_description,
        features: s.features,
        applications: s.applications,
        process_steps_type: Array.isArray(s.process_steps) ? 'array' : typeof s.process_steps,
        process_steps_len: Array.isArray(s.process_steps) ? s.process_steps.length : null,
      }));
    }
  }

  const { data: cats, error: catErr } = await supabase
    .from('categories')
    .select('id,slug,name,tagline,description,image,icon,display_order,main_section,parent_id,is_published')
    .order('display_order', { ascending: true });
  if (catErr) {
    console.log(`categories ERROR ${catErr.message}`);
  } else {
    console.log(`categories count ${cats.length}`);
    for (const c of cats) {
      if (c.main_section !== 'metal_services') continue;
      console.log(JSON.stringify({
        id: c.id,
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        image: c.image,
        display_order: c.display_order,
        parent_id: c.parent_id,
        is_published: c.is_published,
      }));
    }
  }

  const { data: links, error: linkErr } = await supabase
    .from('service_categories')
    .select('service_id,category_id,display_order')
    .limit(1000);
  console.log(`service_categories: ${linkErr ? `ERROR ${linkErr.code || ''} ${linkErr.message}` : `OK ${links.length} rows`}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Probe failed:', error.message);
    process.exit(1);
  });
