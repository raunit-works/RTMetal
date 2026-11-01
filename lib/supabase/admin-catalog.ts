import { createSupabaseBrowserClient } from './client';
import { mapCategoryRow } from './data-mapper';
import { getValidCategories, validateCategoryChange } from '../category-hierarchy';
import type { MainSection } from '../types';

// ==================================================
// IMAGE STORAGE UPLOADER
// ==================================================
export async function uploadCatalogImage(file: File) {
  const supabase = createSupabaseBrowserClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from('catalog-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('catalog-images')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
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
export async function addProductGalleryImage(productId: string, imageUrl: string, altText?: string, isPrimary = false, sortOrder = 0) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('product_images')
    .insert([{ product_id: productId, image_url: imageUrl, alt_text: altText, is_primary: isPrimary, sort_order: sortOrder }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProductGalleryImage(imageId: string, updates: Partial<{ alt_text: string; is_primary: boolean; sort_order: number }>) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('product_images')
    .update(updates)
    .eq('id', imageId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProductGalleryImage(imageId: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('product_images').delete().eq('id', imageId);
  if (error) throw error;
}

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
