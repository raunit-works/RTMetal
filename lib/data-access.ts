import {
  categories,
  products,
  services,
  testimonials,
  faqs,
  processSteps,
  instagramPosts,
  businessDivisions,
  whyChooseUs,
  industriesServed,
} from './data';
import type {
  Product,
  Category,
  Service,
  Testimonial,
  FAQItem,
  InstagramPost,
  ProcessStep,
  BusinessDivision,
  WhyChooseUsItem,
} from './types';
import { createSupabaseClient } from './supabase/client';
import {
  mapCategoryRow,
  mapProductRow,
  mapServiceRow,
  mapTestimonialRow,
  mapFAQRow,
  DatabaseCategoryRow,
  DatabaseProductRow,
  DatabaseServiceRow,
  DatabaseTestimonialRow,
  DatabaseFAQRow,
} from './supabase/data-mapper';

// ============================================================================
// SYNCHRONOUS DATA ACCESS API (Preserves exact backwards compatibility)
// ============================================================================

export function getProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug || p.id === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  if (categorySlug === 'all') return products;
  return products.filter((p) => p.category === categorySlug);
}

export function getCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getServices(): Service[] {
  return services;
}

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function getTestimonials(): Testimonial[] {
  return testimonials;
}

export function getFAQs(): FAQItem[] {
  return faqs;
}

export function getInstagramPosts(): InstagramPost[] {
  return instagramPosts;
}

export function getProcessSteps(): ProcessStep[] {
  return processSteps;
}

export function getBusinessDivisions(): BusinessDivision[] {
  return businessDivisions;
}

export function getWhyChooseUs(): WhyChooseUsItem[] {
  return whyChooseUs;
}

export function getIndustriesServed(): string[] {
  return industriesServed;
}

// ============================================================================
// ASYNCHRONOUS SUPABASE DATA ACCESS API (Production Data Integration)
// ============================================================================

/**
 * Controlled failure handler respecting production vs development rules.
 * Failure in DEV -> return static fallback from lib/data.ts.
 * Failure in PROD -> return safe empty state ([], undefined, or null).
 */
function handleFailure<T>(action: string, error: unknown, devFallback: T): T {
  console.error(`[Supabase Error] ${action} failed:`, error);
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Supabase Controlled Fallback] Returning static dummy data in development mode for "${action}".`);
    return devFallback;
  }
  return (Array.isArray(devFallback) ? [] : undefined) as unknown as T;
}

/**
 * Fetch published products from Supabase.
 * Enforces is_published = true.
 */
export async function getProductsAsync(): Promise<Product[]> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(slug, name), product_images(*)')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      return handleFailure('getProductsAsync', error.message, products);
    }

    if (!data || data.length === 0) {
      console.info('[Supabase Info] "products" table query returned 0 rows.');
      return [];
    }

    return data.map((row) => mapProductRow(row as unknown as DatabaseProductRow));
  } catch (err) {
    return handleFailure('getProductsAsync', err, products);
  }
}

/**
 * Fetch a single product by slug or ID from Supabase.
 * Enforces is_published = true.
 */
export async function getProductBySlugAsync(slug: string): Promise<Product | undefined> {
  try {
    const supabase = createSupabaseClient();
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(slug);

    let query = supabase
      .from('products')
      .select('*, categories(slug, name), product_images(*)')
      .eq('is_published', true);

    if (isUuid) {
      query = query.or(`slug.eq.${slug},id.eq.${slug}`);
    } else {
      query = query.eq('slug', slug);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return handleFailure(`getProductBySlugAsync(${slug})`, error.message, getProductBySlug(slug));
    }

    if (!data) {
      return undefined;
    }

    return mapProductRow(data as unknown as DatabaseProductRow);
  } catch (err) {
    return handleFailure(`getProductBySlugAsync(${slug})`, err, getProductBySlug(slug));
  }
}

/**
 * Fetch products by category slug from Supabase.
 */
export async function getProductsByCategoryAsync(categorySlug: string): Promise<Product[]> {
  if (categorySlug === 'all') {
    return getProductsAsync();
  }

  const allProducts = await getProductsAsync();
  return allProducts.filter((p) => p.category === categorySlug);
}

/**
 * Fetch all categories from Supabase.
 */
export async function getCategoriesAsync(): Promise<Category[]> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return handleFailure('getCategoriesAsync', error.message, categories);
    }

    if (!data || data.length === 0) {
      console.info('[Supabase Info] "categories" table query returned 0 rows.');
      return [];
    }

    const allProducts = await getProductsAsync();
    const countsMap: Record<string, number> = {};
    allProducts.forEach((p) => {
      countsMap[p.category] = (countsMap[p.category] || 0) + 1;
    });

    return data.map((row) => mapCategoryRow(row as DatabaseCategoryRow, countsMap[row.slug] || 0));
  } catch (err) {
    return handleFailure('getCategoriesAsync', err, categories);
  }
}

/**
 * Fetch a single category by slug from Supabase.
 */
export async function getCategoryBySlugAsync(slug: string): Promise<Category | undefined> {
  try {
    const allCategories = await getCategoriesAsync();
    return allCategories.find((c) => c.slug === slug);
  } catch (err) {
    return handleFailure(`getCategoryBySlugAsync(${slug})`, err, getCategoryBySlug(slug));
  }
}

/**
 * Fetch published services from Supabase.
 */
export async function getServicesAsync(): Promise<Service[]> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error) {
      return handleFailure('getServicesAsync', error.message, services);
    }

    if (!data || data.length === 0) {
      console.info('[Supabase Info] "services" table query returned 0 rows.');
      return [];
    }

    return data.map((row) => mapServiceRow(row as DatabaseServiceRow));
  } catch (err) {
    return handleFailure('getServicesAsync', err, services);
  }
}

/**
 * Fetch a single service by slug from Supabase.
 */
export async function getServiceBySlugAsync(slug: string): Promise<Service | undefined> {
  try {
    const allServices = await getServicesAsync();
    return allServices.find((s) => s.slug === slug);
  } catch (err) {
    return handleFailure(`getServiceBySlugAsync(${slug})`, err, getServiceBySlug(slug));
  }
}

/**
 * Fetch published testimonials from Supabase.
 */
export async function getTestimonialsAsync(): Promise<Testimonial[]> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error) {
      return handleFailure('getTestimonialsAsync', error.message, testimonials);
    }

    if (!data || data.length === 0) {
      console.info('[Supabase Info] "testimonials" table query returned 0 rows.');
      return [];
    }

    return data.map((row) => mapTestimonialRow(row as DatabaseTestimonialRow));
  } catch (err) {
    return handleFailure('getTestimonialsAsync', err, testimonials);
  }
}

/**
 * Fetch published FAQs from Supabase.
 */
export async function getFAQsAsync(): Promise<FAQItem[]> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error) {
      return handleFailure('getFAQsAsync', error.message, faqs);
    }

    if (!data || data.length === 0) {
      console.info('[Supabase Info] "faqs" table query returned 0 rows.');
      return [];
    }

    return data.map((row) => mapFAQRow(row as DatabaseFAQRow));
  } catch (err) {
    return handleFailure('getFAQsAsync', err, faqs);
  }
}

/**
 * Fetch site settings map from Supabase.
 */
export async function getSiteSettingsAsync(): Promise<Record<string, unknown> | null> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from('site_settings').select('*');

    if (error) {
      console.error('[Supabase Query Error] Failed to fetch site_settings:', error.message);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const settingsMap: Record<string, unknown> = {};
    data.forEach((row) => {
      settingsMap[row.key] = row.value;
    });

    return settingsMap;
  } catch (err) {
    console.error('[Supabase Connection Exception] Failed to fetch site_settings:', err);
    return null;
  }
}
