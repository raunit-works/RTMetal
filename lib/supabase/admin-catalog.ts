import { createSupabaseBrowserClient } from './client';
import { mapCategoryRow } from './data-mapper';
import { getValidCategories, validateCategoryChange } from '../category-hierarchy';
import {
  CATALOG_ALLOWED_MIME_TYPES,
  CATALOG_BUCKET,
  MAX_OUTPUT_BYTES,
  extensionForMime,
  formatBytes,
} from '../images/image-config';
import type { MainSection } from '../types';
import { normalizeAdminSearch } from '../admin/list-utils';
import { isMetalFinishSchemaMissingError } from './metal-finishes-shared';

// ==================================================
// IMAGE STORAGE UPLOADER
// ==================================================
/**
 * Upload an already-optimized image to Supabase Storage.
 *
 * Paths are unique and immutable, so the public object can safely be cached
 * for a long time. Old objects are never overwritten or deleted here.
 */
export async function uploadCatalogImage(file: File) {
  const mimeType = (file.type || '').toLowerCase();
  if (!CATALOG_ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `Unsupported upload type "${mimeType || 'unknown'}". Use JPG, PNG or WebP.`
    );
  }

  if (file.size > MAX_OUTPUT_BYTES) {
    throw new Error(
      `The optimized image is ${formatBytes(file.size)}, above the ${formatBytes(
        MAX_OUTPUT_BYTES
      )} storage limit.`
    );
  }

  const supabase = createSupabaseBrowserClient();
  const fileExt = extensionForMime(mimeType);
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from(CATALOG_BUCKET)
    .upload(filePath, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: mimeType,
    });

  if (error) {
    const statusCode = (error as { statusCode?: string | number }).statusCode;
    throw new Error(
      `Storage upload failed${statusCode ? ` (HTTP ${statusCode})` : ''}: ${error.message}`
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from(CATALOG_BUCKET)
    .getPublicUrl(data.path);

  if (!publicUrlData.publicUrl) {
    throw new Error('Storage upload succeeded but Supabase did not return a public URL.');
  }

  return publicUrlData.publicUrl;
}

function getCatalogObjectPath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${CATALOG_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex < 0) return null;

    const path = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    if (!path || path.includes('..') || path.startsWith('/')) return null;
    return path;
  } catch {
    return null;
  }
}

/**
 * Delete an uploaded catalogue object only when no catalogue/CMS record still
 * references its public URL. Any lookup failure is treated as "referenced" so
 * cleanup can never remove an image that is still in use.
 */
export async function deleteCatalogImageIfUnreferenced(
  publicUrl: string | null | undefined
): Promise<boolean> {
  if (!publicUrl) return false;
  const objectPath = getCatalogObjectPath(publicUrl);
  if (!objectPath) return false;

  const supabase = createSupabaseBrowserClient();
  const countQuery = (
    table:
      | 'before_after_projects'
      | 'products'
      | 'product_images'
      | 'categories'
      | 'services'
      | 'testimonials'
      | 'metal_finishes',
    column: string
  ) =>
    supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq(column, publicUrl);

  try {
    const [beforeRows, afterRows, additionalRows, productRows, galleryRows, categoryRows, serviceRows, testimonialRows, settings, finishMainRows, finishAdditionalRows] =
      await Promise.all([
        countQuery('before_after_projects', 'before_image_url'),
        countQuery('before_after_projects', 'after_image_url'),
        supabase
          .from('before_after_projects')
          .select('id', { count: 'exact', head: true })
          .contains('additional_images', [publicUrl]),
        countQuery('products', 'image'),
        countQuery('product_images', 'image_url'),
        countQuery('categories', 'image'),
        countQuery('services', 'image'),
        countQuery('testimonials', 'avatar'),
        supabase.from('site_settings').select('key, value'),
        countQuery('metal_finishes', 'main_image_url'),
        supabase
          .from('metal_finishes')
          .select('id', { count: 'exact', head: true })
          .contains('additional_images', [publicUrl]),
      ]);

    const referenceChecks = [
      beforeRows,
      afterRows,
      additionalRows,
      productRows,
      galleryRows,
      categoryRows,
      serviceRows,
      testimonialRows,
    ];

    if (referenceChecks.some((result) => result.error)) return false;
    if (referenceChecks.some((result) => (result.count ?? 0) > 0)) return false;

    // The Metal Finishes table is additive and may not be applied yet. Its
    // absence must not block cleanup for every other catalogue module.
    for (const result of [finishMainRows, finishAdditionalRows]) {
      if (result.error) {
        if (isMetalFinishSchemaMissingError(result.error)) continue;
        return false;
      }
      if ((result.count ?? 0) > 0) return false;
    }
    if (settings.error) return false;
    if (
      (settings.data ?? []).some((row) =>
        JSON.stringify(row.value ?? null).includes(publicUrl)
      )
    ) {
      return false;
    }

    const { error } = await supabase.storage.from(CATALOG_BUCKET).remove([objectPath]);
    return !error;
  } catch {
    return false;
  }
}

// ==================================================
// CATEGORIES
// ==================================================
export async function getCategoryHierarchySupportAdmin(): Promise<boolean> {
  const { error } = await createSupabaseBrowserClient().from('categories')
    .select('main_section,parent_id,is_published').limit(0);
  if (!error) return true;
  if (error.code === '42703' || error.code === 'PGRST204') return false;
  throw error;
}

type CategoryInput = {
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  image?: string;
  icon?: string;
  is_featured?: boolean;
  display_order?: number;
  main_section?: MainSection | null;
  parent_id?: string | null;
  is_published?: boolean;
};

async function validateCategoryInput(category: Partial<CategoryInput>, id?: string) {
  const categories = (await getCategoriesAdmin()).map((row) => mapCategoryRow(row));
  const current = categories.find((item) => item.id === id);
  if (id && !current) throw new Error('Category no longer exists. Refresh the catalogue.');
  let hasProducts = false;
  if (id) {
    const { data, error } = await createSupabaseBrowserClient().from('products').select('id').eq('category_id', id).limit(1);
    if (error) throw error;
    hasProducts = Boolean(data?.length);
  }
  const error = validateCategoryChange(categories, {
    id, slug: category.slug ?? current?.slug ?? '',
    mainSection: category.main_section === undefined ? current?.mainSection : category.main_section ?? undefined,
    parentId: category.parent_id === undefined ? current?.parentId : category.parent_id,
  }, hasProducts);
  if (error) throw new Error(error);
}

async function validateProductCategory(categoryId: string, section: MainSection | null | undefined, published?: boolean) {
  const categories = (await getCategoriesAdmin()).map((row) => mapCategoryRow(row));
  const category = getValidCategories(categories, false).find((item) => item.id === categoryId);
  if (!category || (section !== undefined && (category.mainSection ?? null) !== section)) {
    throw new Error('Choose a valid category in the selected main section.');
  }
  if (published && !getValidCategories(categories).some((item) => item.id === categoryId)) {
    throw new Error('Publish the category and its parent categories before publishing this product.');
  }
}

export async function getCategoriesAdmin() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createCategoryAdmin(category: CategoryInput) {
  if (!await getCategoryHierarchySupportAdmin()) throw new Error('Category hierarchy schema approval is required before creating categories.');
  if (!category.main_section) throw new Error('Choose a main section for the new category.');
  await validateCategoryInput(category);
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('categories')
    .insert([{ ...category, is_published: category.is_published ?? false, image: category.image || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800' }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategoryAdmin(
  id: string,
  category: Partial<CategoryInput>
) {
  await validateCategoryInput(category, id);
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('categories')
    .update({ ...category, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategoryAdmin(id: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ==================================================
// PRODUCTS
// ==================================================
export async function getProductsAdmin() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug), product_images(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export type AdminProductDivision = 'all' | 'home_decor' | 'metal_services' | 'legacy';
export type AdminProductStatus = 'all' | 'published' | 'draft';
export type AdminProductSort = 'newest' | 'order' | 'name' | 'sku';

export interface AdminProductQuery {
  search?: string;
  division?: AdminProductDivision;
  categoryId?: string;
  status?: AdminProductStatus;
  stock?: string;
  sort?: AdminProductSort;
  page?: number;
  pageSize?: number;
}

export interface AdminProductPage {
  rows: any[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

function cleanseSearchTerm(value: unknown): string {
  return normalizeAdminSearch(value).replace(/[%_,()"'\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function getCategoryLookup() {
  const { data, error } = await createSupabaseBrowserClient()
    .from('categories')
    .select('id, name, slug, parent_id, main_section');
  if (error) throw error;
  return data ?? [];
}

function categoryMatchesLegacy(category: { main_section?: string | null }): boolean {
  return category.main_section !== 'home_decor' && category.main_section !== 'metal_services';
}

export async function getProductsAdminPage(
  filters: AdminProductQuery = {}
): Promise<AdminProductPage> {
  const pageSize = Math.min(50, Math.max(1, Math.floor(filters.pageSize ?? 8)));
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const offset = (page - 1) * pageSize;
  const search = cleanseSearchTerm(filters.search);
  const supabase = createSupabaseBrowserClient();

  const categories = await getCategoryLookup();
  const categoryIdsByName = search
    ? categories
        .filter((category) =>
          `${category.name ?? ''} ${category.slug ?? ''}`.toLowerCase().includes(search)
        )
        .map((category) => category.id)
    : [];

  const legacyDivision = filters.division === 'legacy';
  let divisionCategoryIds: string[] | null = null;
  if (filters.division && filters.division !== 'all') {
    divisionCategoryIds = categories
      .filter((category) =>
        legacyDivision
          ? categoryMatchesLegacy(category)
          : category.main_section === filters.division
      )
      .map((category) => category.id);

    if (divisionCategoryIds.length === 0 && !legacyDivision) {
      return { rows: [], total: 0, page, pageSize, pageCount: 1 };
    }
  }

  let query = supabase
    .from('products')
    .select('*, categories(name, slug), product_images(*)', { count: 'exact' });

  if (legacyDivision && divisionCategoryIds) {
    const clauses = ['category_id.is.null'];
    if (divisionCategoryIds.length > 0) {
      clauses.push(`category_id.in.(${divisionCategoryIds.join(',')})`);
    }
    query = query.or(clauses.join(','));
  } else if (divisionCategoryIds) {
    query = query.in('category_id', divisionCategoryIds);
  }
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.status === 'published') query = query.eq('is_published', true);
  if (filters.status === 'draft') query = query.eq('is_published', false);
  if (filters.stock && filters.stock !== 'all') {
    query = query.eq('stock_status', filters.stock);
  }

  if (search) {
    const clauses = [
      `name.ilike.%${search}%`,
      `slug.ilike.%${search}%`,
      `sku.ilike.%${search}%`,
      `material.ilike.%${search}%`,
      `color_finish.ilike.%${search}%`,
      `sub_category.ilike.%${search}%`,
    ];
    if (isUuid(search)) clauses.push(`id.eq.${search}`);
    if (categoryIdsByName.length > 0) {
      clauses.push(`category_id.in.(${categoryIdsByName.join(',')})`);
    }
    query = query.or(clauses.join(','));
  }

  switch (filters.sort) {
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'sku':
      query = query.order('sku', { ascending: true, nullsFirst: false });
      break;
    case 'order':
      query = query
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const { data, error, count } = await query.range(offset, offset + pageSize - 1);
  if (error) throw error;

  const total = count ?? 0;
  return {
    rows: data ?? [],
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export type AdminCategorySection = 'all' | 'home_decor' | 'metal_services' | 'legacy';
export type AdminCategoryStatus = 'all' | 'published' | 'draft';
export type AdminCategoryHierarchy = 'all' | 'top' | 'child';
export type AdminCategoryServiceFilter = 'all' | 'assigned' | 'unassigned';
export type AdminCategorySort = 'order' | 'name' | 'newest';

export interface AdminCategoryQuery {
  search?: string;
  section?: AdminCategorySection;
  status?: AdminCategoryStatus;
  serviceAssignment?: AdminCategoryServiceFilter;
  serviceId?: string;
  hierarchy?: AdminCategoryHierarchy;
  sort?: AdminCategorySort;
  page?: number;
  pageSize?: number;
}

export interface AdminCategoryPage {
  rows: any[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

async function getServiceLinkedCategoryIds(serviceId?: string): Promise<string[] | null> {
  const supabase = createSupabaseBrowserClient();
  let query = supabase.from('service_categories').select('category_id');
  if (serviceId) query = query.eq('service_id', serviceId);
  const { data, error } = await query;
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST204' || error.code === 'PGRST205') {
      return null;
    }
    throw error;
  }
  return Array.from(new Set((data ?? []).map((row) => String(row.category_id))));
}

export async function getCategoriesAdminPage(
  filters: AdminCategoryQuery = {}
): Promise<AdminCategoryPage> {
  const pageSize = Math.min(50, Math.max(1, Math.floor(filters.pageSize ?? 8)));
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const offset = (page - 1) * pageSize;
  const search = cleanseSearchTerm(filters.search);
  const supabase = createSupabaseBrowserClient();

  const categories = await getCategoryLookup();
  const categoryIdsByName = search
    ? categories
        .filter((category) =>
          `${category.name ?? ''} ${category.slug ?? ''}`.toLowerCase().includes(search)
        )
        .map((category) => category.id)
    : [];

  let sectionCategoryIds: string[] | null = null;
  if (filters.section && filters.section !== 'all') {
    sectionCategoryIds = categories
      .filter((category) =>
        filters.section === 'legacy'
          ? categoryMatchesLegacy(category)
          : category.main_section === filters.section
      )
      .map((category) => category.id);

    if (sectionCategoryIds.length === 0) {
      return { rows: [], total: 0, page, pageSize, pageCount: 1 };
    }
  }

  let linkedCategoryIds: string[] | null = null;
  if (
    filters.serviceId ||
    filters.serviceAssignment === 'assigned' ||
    filters.serviceAssignment === 'unassigned'
  ) {
    linkedCategoryIds = await getServiceLinkedCategoryIds(filters.serviceId);

    if (filters.serviceAssignment === 'assigned' && (linkedCategoryIds?.length ?? 0) === 0) {
      return { rows: [], total: 0, page, pageSize, pageCount: 1 };
    }
  }

  let query = supabase.from('categories').select('*', { count: 'exact' });

  if (sectionCategoryIds) query = query.in('id', sectionCategoryIds);
  if (filters.status === 'published') query = query.eq('is_published', true);
  if (filters.status === 'draft') query = query.eq('is_published', false);
  if (filters.hierarchy === 'top') query = query.is('parent_id', null);
  if (filters.hierarchy === 'child') query = query.not('parent_id', 'is', null);

  if (filters.serviceId && linkedCategoryIds) {
    query = query.in('id', linkedCategoryIds);
  } else if (filters.serviceAssignment === 'assigned' && linkedCategoryIds) {
    query = query.in('id', linkedCategoryIds);
  } else if (
    filters.serviceAssignment === 'unassigned' &&
    linkedCategoryIds &&
    linkedCategoryIds.length > 0
  ) {
    query = query.not('id', 'in', `(${linkedCategoryIds.join(',')})`);
  }

  if (search) {
    const clauses = [
      `name.ilike.%${search}%`,
      `slug.ilike.%${search}%`,
      `tagline.ilike.%${search}%`,
      `description.ilike.%${search}%`,
    ];
    if (isUuid(search)) clauses.push(`id.eq.${search}`);
    if (categoryIdsByName.length > 0) {
      const parentIds = categories
        .filter((category) => categoryIdsByName.includes(category.id))
        .map((category) => category.id);
      if (parentIds.length > 0) clauses.push(`parent_id.in.(${parentIds.join(',')})`);
    }
    query = query.or(clauses.join(','));
  }

  switch (filters.sort) {
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    default:
      query = query
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      break;
  }

  const { data, error, count } = await query.range(offset, offset + pageSize - 1);
  if (error) throw error;

  const total = count ?? 0;
  return {
    rows: data ?? [],
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createProductAdmin(product: {
  category_id: string;
  name: string;
  slug: string;
  sku?: string;
  sub_category?: string;
  price: number | null;
  original_price?: number;
  image: string;
  badge?: string;
  short_description?: string;
  description: string;
  material?: string;
  color_finish?: string;
  dimensions?: string;
  weight?: string;
  stock_status?: string;
  features?: string[];
  care_instructions?: string;
  is_published?: boolean;
  is_featured?: boolean;
  display_order?: number;
}, section?: MainSection | null) {
  await validateProductCategory(product.category_id, section, product.is_published);
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('products')
    .insert([{ ...product, is_published: product.is_published ?? false }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProductAdmin(
  id: string,
  product: {
    category_id?: string;
    name?: string;
    slug?: string;
    sku?: string;
    sub_category?: string;
    price?: number | null;
    original_price?: number;
    image?: string;
    badge?: string;
    short_description?: string;
    description?: string;
    material?: string;
    color_finish?: string;
    dimensions?: string;
    weight?: string;
    stock_status?: string;
    features?: string[];
    care_instructions?: string;
    is_published?: boolean;
    is_featured?: boolean;
    display_order?: number;
  },
  section?: MainSection | null
) {
  if (product.category_id) await validateProductCategory(product.category_id, section, product.is_published);
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('products')
    .update({ ...product, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProductAdmin(id: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// Product Images Gallery Management
export {
  addProductGalleryImage,
  updateProductGalleryImage,
  deleteProductGalleryImage,
  getProductGalleryImages,
} from './product-gallery';

// ==================================================
// SERVICES
// ==================================================
export async function getServicesAdmin() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createServiceAdmin(service: {
  name: string;
  slug: string;
  short_name: string;
  description: string;
  long_description: string;
  image: string;
  icon?: string;
  features?: string[];
  applications?: string[];
  process_steps?: any[];
  display_order?: number;
  is_published?: boolean;
}) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('services')
    .insert([{ ...service, is_published: service.is_published ?? false }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateServiceAdmin(
  id: string,
  service: {
    name?: string;
    slug?: string;
    short_name?: string;
    description?: string;
    long_description?: string;
    image?: string;
    icon?: string;
    features?: string[];
    applications?: string[];
    process_steps?: any[];
    display_order?: number;
    is_published?: boolean;
  }
) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('services')
    .update({ ...service, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteServiceAdmin(id: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}

// ==================================================
// TESTIMONIALS
// ==================================================
export async function getTestimonialsAdmin() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTestimonialAdmin(testimonial: {
  name: string;
  company?: string;
  role?: string;
  content: string;
  rating?: number;
  avatar?: string;
  display_order?: number;
  is_published?: boolean;
}) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('testimonials')
    .insert([testimonial])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTestimonialAdmin(
  id: string,
  testimonial: {
    name?: string;
    company?: string;
    role?: string;
    content?: string;
    rating?: number;
    avatar?: string;
    display_order?: number;
    is_published?: boolean;
  }
) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('testimonials')
    .update({ ...testimonial, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTestimonialAdmin(id: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) throw error;
}

// ==================================================
// FAQS
// ==================================================
export async function getFaqsAdmin() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createFaqAdmin(faq: {
  question: string;
  answer: string;
  category?: string;
  display_order?: number;
  is_published?: boolean;
}) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('faqs')
    .insert([faq])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFaqAdmin(
  id: string,
  faq: {
    question?: string;
    answer?: string;
    category?: string;
    display_order?: number;
    is_published?: boolean;
  }
) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('faqs')
    .update({ ...faq, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFaqAdmin(id: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) throw error;
}

// ==================================================
// SITE SETTINGS
// ==================================================
export async function getSiteSettingsAdmin() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from('site_settings').select('*');
  if (error) throw error;
  return data || [];
}

export async function updateSiteSettingAdmin(key: string, value: unknown) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSiteSettingAdmin(key: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('site_settings').delete().eq('key', key);
  if (error) throw error;
}
