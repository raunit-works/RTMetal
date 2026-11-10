// Offline checks: no environment files, Supabase clients, or network requests.
// Run with: node --test .qa-temp/data-access-regression.test.cjs
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function loadSource(relativePath, dependencies = {}, environment = 'development') {
  const filename = path.join(__dirname, '..', relativePath);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    process: { env: { NODE_ENV: environment } },
    console: { error() {}, warn() {}, info() {} },
    require(id) {
      if (Object.hasOwn(dependencies, id)) return dependencies[id];
      if (id === 'lucide-react') return require(id);
      if (id === 'react/jsx-runtime') return require(id);
      throw new Error(`Unexpected dependency: ${id}`);
    },
  }, { filename });
  return module.exports;
}

const data = loadSource('lib/data.ts');
const mapper = loadSource('lib/supabase/data-mapper.ts');
const hierarchy = loadSource('lib/category-hierarchy.ts');

function createAccess(responses, environment) {
  const filters = [];
  const client = {
    from(table) {
      assert.ok(Object.hasOwn(responses, table), `Unexpected table: ${table}`);
      return {
        select() { return this; },
        eq(column, value) { filters.push({ table, column, value }); return this; },
        order() {
          const response = responses[table];
          if (response instanceof Error) throw response;
          return Promise.resolve(response);
        },
      };
    },
  };
  return {
    access: loadSource('lib/data-access.ts', {
      './data': data,
      './supabase/data-mapper': mapper,
      './category-hierarchy': hierarchy,
      './supabase/client': { createSupabaseClient: () => client },
    }, environment),
    filters,
  };
}

const failure = { data: null, error: { message: 'Offline query failure' } };
const success = (rows) => ({ data: rows, error: null });
const category = (id, slug, parentId = null) => ({ id, slug, name: slug, parent_id: parentId });
const product = (id, slug) => ({
  id, slug: id, name: id, price: null, categories: { slug, name: slug }, is_published: true,
});

test('strict product loading suppresses demo fallback on query errors and exceptions', async () => {
  for (const response of [failure, new Error('Offline connection failure')]) {
    const { access } = createAccess({ products: response });
    assert.equal((await access.getProductsAsync({ allowStaticFallback: false })).length, 0);
    assert.equal((await access.getProductsAsync()).length, data.products.length);
  }
});

test('strict category counts cannot include demo products after a product query failure', async () => {
  assert.ok(data.products.length > 0);
  const slug = data.products[0].category;
  for (const response of [failure, new Error('Offline connection failure')]) {
    const { access } = createAccess({
      categories: success([category('live-category', slug)]), products: response,
    });
    const categories = await access.getCategoriesAsync({ allowStaticFallback: false });
    assert.equal(categories.length, 1);
    assert.equal(categories[0].productCount, 0);
  }
});

test('strict category loading returns empty results when the category query fails', async () => {
  const { access } = createAccess({ categories: failure });
  assert.equal((await access.getCategoriesAsync({ allowStaticFallback: false })).length, 0);
});

test('category counts include descendants and exclude unpublished categories', async () => {
  const { access, filters } = createAccess({
    categories: success([
      category('parent', 'parent'), category('child', 'child', 'parent'),
      category('grandchild', 'grandchild', 'child'),
      { ...category('draft', 'draft', 'parent'), is_published: false },
    ]),
    products: success(['parent', 'child', 'grandchild', 'draft'].map((slug) => product(slug, slug))),
  });
  const categories = await access.getCategoriesAsync({ allowStaticFallback: false });
  assert.equal(categories.map((item) => `${item.slug}:${item.productCount}`).join(','),
    'parent:3,child:2,grandchild:1');
  assert.deepEqual(filters, [{ table: 'products', column: 'is_published', value: true }]);
});

test('cyclic category relationships are excluded from public counts', async () => {
  const { access } = createAccess({
    categories: success([category('a', 'a', 'b'), category('b', 'b', 'a')]),
    products: success([product('one', 'a'), product('two', 'b')]),
  });
  const categories = await access.getCategoriesAsync({ allowStaticFallback: false });
  assert.equal(categories.length, 0);
});

test('public service list preserves curated entries and adds published services once', async () => {
  const { access, filters } = createAccess({ services: success([
    { ...data.services[0], name: 'Duplicate curated service' },
    { slug: 'additional-service', name: 'Additional service', applications: ['Metal'] },
  ]) });
  const services = await access.getMergedServicesAsync();
  assert.equal(services.length, data.services.length + 1);
  assert.equal(services[0].name, data.services[0].name);
  assert.equal(services.at(-1).slug, 'additional-service');
  assert.equal(services.at(-1).applications[0], 'Metal');
  assert.deepEqual(filters, [{ table: 'services', column: 'is_published', value: true }]);
});

test('production query failures remain empty while curated services remain available', async () => {
  const { access } = createAccess({ products: failure, services: failure }, 'production');
  assert.equal((await access.getProductsAsync()).length, 0);
  assert.equal((await access.getServicesAsync()).length, 0);
  assert.equal((await access.getMergedServicesAsync()).length, data.services.length);
});

test('quotation-only product prices remain null after mapping', () => {
  assert.equal(mapper.mapProductRow(product('quotation-product', 'home-decor')).price, null);
});

const mappedCategory = (id, parentId = null, section = 'home_decor', published = true) =>
  mapper.mapCategoryRow({ ...category(id, id, parentId), main_section: section, is_published: published });

test('nested category filtering includes descendants but not siblings, drafts or duplicates', () => {
  const categories = [mappedCategory('root'), mappedCategory('child', 'root'),
    mappedCategory('leaf', 'child'), mappedCategory('other'), mappedCategory('draft', 'root', 'home_decor', false)];
  const products = ['root', 'child', 'leaf', 'other', 'draft'].map((slug) => mapper.mapProductRow(product(slug, slug)));
  products.push(products[1], { ...products[0], id: 'unpublished', isPublished: false });
  assert.equal(hierarchy.filterCategoryProducts(products, categories, 'root').map((p) => p.id).join(','), 'root,child,leaf');
  assert.equal(hierarchy.filterCategoryProducts(products, categories, 'child').map((p) => p.id).join(','), 'child,leaf');
  assert.equal(hierarchy.filterCategoryProducts(products, categories, 'missing').length, 0);
});

test('hidden ancestors, orphan parents, cross-section links and invalid sections hide whole branches', () => {
  const categories = [mappedCategory('hidden', null, 'home_decor', false), mappedCategory('child', 'hidden'),
    mappedCategory('orphan', 'missing'), mappedCategory('metal', null, 'metal_services'),
    mappedCategory('wrong-section', 'metal'), mappedCategory('bad-section', null, 'unknown')];
  assert.equal(hierarchy.getValidCategories(categories).map((c) => c.slug).join(','), 'metal');
});

test('duplicate category IDs and slugs cannot create ambiguous navigation', () => {
  const root = mappedCategory('root');
  const categories = [root, { ...root, id: 'duplicate' }, mappedCategory('child', 'root'),
    mappedCategory('same-id'), { ...mappedCategory('another-slug'), id: 'same-id' }];
  assert.equal(hierarchy.getValidCategories(categories).length, 0);
});

test('legacy categories stay unassigned and retain their historical placement', () => {
  const legacy = mapper.mapCategoryRow(category('legacy', 'legacy'));
  assert.equal(legacy.mainSection, undefined);
  assert.equal(hierarchy.getValidCategories([legacy]).length, 1);
  assert.equal(hierarchy.isCategoryInSection(legacy, 'home_decor'), true);
  assert.equal(hierarchy.isCategoryInSection(legacy, 'metal_services'), false);
});

test('category paths and URLs distinguish nested configured categories', () => {
  const root = mappedCategory('root');
  const child = mappedCategory('child', 'root');
  assert.equal(hierarchy.getCategoryPath(child, [root, child]), 'root / child');
  assert.equal(hierarchy.categoryHref(child), '/home-decor/category/child');
});

test('admin category validation blocks cycles, wrong sections and implicit product reclassification', () => {
  const categories = [mappedCategory('root'), mappedCategory('child', 'root'), mappedCategory('metal', null, 'metal_services')];
  assert.match(hierarchy.validateCategoryChange(categories, { id: 'root', slug: 'root', mainSection: 'home_decor', parentId: 'child' }, false), /descendant/);
  assert.match(hierarchy.validateCategoryChange(categories, { slug: 'new', mainSection: 'home_decor', parentId: 'metal' }, false), /same main section/);
  assert.match(hierarchy.validateCategoryChange(categories, { id: 'child', slug: 'child', mainSection: 'metal_services' }, true), /cannot change section/);
  assert.match(hierarchy.validateCategoryChange(categories, { slug: 'root', mainSection: 'home_decor' }, false), /already in use/);
  assert.equal(hierarchy.validateCategoryChange(categories, { slug: 'new', mainSection: 'home_decor', parentId: 'child' }, false), undefined);
});

test('public catalogue uses one product query and removes hidden-category products', async () => {
  const { access, filters } = createAccess({
    categories: success([category('root', 'root'), { ...category('hidden', 'hidden'), is_published: false }, category('child', 'child', 'hidden')]),
    products: success([product('one', 'root'), product('two', 'hidden'), product('three', 'child')]),
  });
  const catalog = await access.getPublicCatalogAsync();
  assert.equal(catalog.products.map((p) => p.id).join(','), 'one');
  assert.equal(catalog.categories[0].productCount, 1);
  assert.equal(filters.filter((item) => item.table === 'products').length, 1);
});

test('an absent category relationship is never silently mapped into Home Decor', () => {
  const orphan = mapper.mapProductRow({ ...product('orphan', 'home-decor'), categories: null });
  assert.equal(orphan.category, '');
  assert.equal(hierarchy.filterCategoryProducts([orphan], [mappedCategory('home-decor')]).length, 0);
});

test('empty published categories remain valid with zero products', async () => {
  const { access } = createAccess({ categories: success([category('empty', 'empty')]), products: success([]) });
  const catalog = await access.getPublicCatalogAsync();
  assert.equal(catalog.categories.length, 1);
  assert.equal(catalog.categories[0].productCount, 0);
  assert.equal(catalog.products.length, 0);
});

function adminAccess({ rows = [], supportsHierarchy = true } = {}) {
  const writes = [];
  const client = {
    from(table) {
      let selected;
      let written;
      const query = {
        select(columns) { selected = columns; return this; },
        order() { return this; },
        eq() { return this; },
        limit() { return this; },
        insert(value) { written = value; writes.push({ table, value }); return this; },
        update(value) { written = value; writes.push({ table, value }); return this; },
        single() { return this; },
        then(resolve, reject) {
          const response = selected === 'main_section,parent_id,is_published' && !supportsHierarchy
            ? { data: null, error: { code: '42703' } }
            : success(written ?? (table === 'categories' ? rows : []));
          return Promise.resolve(response).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return { writes, admin: loadSource('lib/supabase/admin-catalog.ts', {
    './client': { createSupabaseBrowserClient: () => client },
    './data-mapper': mapper,
    '../category-hierarchy': hierarchy,
  }) };
}

test('admin category creation is blocked before any write if hierarchy columns are missing', async () => {
  const { admin, writes } = adminAccess({ supportsHierarchy: false });
  await assert.rejects(admin.createCategoryAdmin({ name: 'New', slug: 'new', main_section: 'home_decor' }), /schema approval/);
  assert.equal(writes.length, 0);
});

test('new configured categories and products default to drafts at the write boundary', async () => {
  const { admin, writes } = adminAccess({ rows: [{ ...category('root', 'root'), main_section: 'home_decor' }] });
  await admin.createCategoryAdmin({ name: 'Child', slug: 'child', main_section: 'home_decor', parent_id: 'root' });
  await admin.createProductAdmin({ category_id: 'root', name: 'Product', slug: 'product', price: null, image: '', description: '' }, 'home_decor');
  assert.equal(writes.length, 2);
  assert.equal(writes[0].value[0].is_published, false);
  assert.equal(writes[1].value[0].is_published, false);
});

test('product writes reject cross-section assignments and publication under a draft ancestor', async () => {
  const { admin, writes } = adminAccess({ rows: [
    { ...category('root', 'root'), main_section: 'home_decor', is_published: false },
    { ...category('child', 'child', 'root'), main_section: 'home_decor', is_published: true },
  ] });
  const payload = { category_id: 'child', name: 'Product', slug: 'product', price: null, image: '', description: '' };
  await assert.rejects(admin.createProductAdmin(payload, 'metal_services'), /selected main section/);
  await assert.rejects(admin.createProductAdmin({ ...payload, is_published: true }, 'home_decor'), /parent categories/);
  assert.equal(writes.length, 0);
});

function catalogRoute(categories, products = []) {
  return loadSource('components/sections/category-catalog-page.tsx', {
    'next/navigation': { notFound() { throw new Error('NEXT_NOT_FOUND'); } },
    '@/lib/data-access': { getPublicCatalogAsync: async () => ({ categories, products }), getInstagramPosts: () => [] },
    '@/lib/category-hierarchy': hierarchy,
    './home-decor-catalog': { HomeDecorCatalog: () => null },
  }).CategoryCatalogPage;
}

test('category route selects nested categories and separates Metal catalogue categories', async () => {
  const categories = [mappedCategory('decor'), mappedCategory('metal', null, 'metal_services'), mappedCategory('nested', 'metal', 'metal_services')];
  const route = catalogRoute(categories);
  const result = await route({ slug: 'nested' });
  assert.equal(result.props.selectedCategory.slug, 'nested');
  assert.equal(result.props.mainSection, 'metal_services');
  assert.equal(result.props.categories.map((c) => c.slug).join(','), 'metal,nested');
});

test('missing/unpublished categories and incompatible section URLs return not-found', async () => {
  const route = catalogRoute([mappedCategory('decor')]);
  await assert.rejects(route({ slug: 'missing' }), /NEXT_NOT_FOUND/);
  await assert.rejects(route({ section: 'unknown' }), /NEXT_NOT_FOUND/);
  await assert.rejects(route({ slug: 'decor', section: 'metal_services' }), /NEXT_NOT_FOUND/);
});

test('legacy category query URLs pass the selected category to the catalogue route', () => {
  const page = loadSource('app/home-decor/page.tsx', {
    '@/components/sections/category-catalog-page': { CategoryCatalogPage: () => null },
  }).default;
  assert.equal(page({ searchParams: { category: 'nested' } }).props.slug, 'nested');
  assert.equal(page({ searchParams: { category: 'all' } }).props.slug, undefined);
  assert.equal(page({ searchParams: { section: 'metal_services' } }).props.section, 'metal_services');
});
