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
import { filterCategoryProducts, getDescendantSlugs, getValidCategories } from './category-hierarchy';
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

/**
 * Publication mode detection.
 *
 * Supabase-authoritative mode: NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are configured. Supabase is the
 * source of truth for publication status. Static services are never used to
 * override an admin's unpublished state, and database errors fail closed.
 *
 * Static/demo mode: Supabase environment variables are absent. Static curated
 * services are used directly, gated by their local isPublished flag.
 */
export function isSupabaseAuthoritative(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function mergeCuratedServices(publishedServices: Service[]): Service[] {
  // In Supabase-authoritative mode, Supabase is the sole source of truth.
  // Static curated services must not override an admin's unpublished state.
  if (isSupabaseAuthoritative()) {
    return publishedServices;
  }

  // Static/demo mode: static services are eligible per their local flags.
  const curatedSlugs = new Set(services.map((service) => service.slug));
  const publicCurated = services.filter((service) => service.isPublished !== false);
  return [
    ...publicCurated,
    ...publishedServices.filter((service) => !curatedSlugs.has(service.slug)),
  ];
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
function handleFailure<T>(
  action: string,
  error: unknown,
  devFallback: T,
  allowDevFallback = true
): T {
  console.error(`[Supabase Error] ${action} failed:`, error);
  if (allowDevFallback && process.env.NODE_ENV === 'development') {
    console.warn(`[Supabase Controlled Fallback] Returning static dummy data in development mode for "${action}".`);
    return devFallback;
  }
  return (Array.isArray(devFallback) ? [] : undefined) as unknown as T;
}

export interface GetProductsOptions {
  allowStaticFallback?: boolean;
}

/**
 * Fetch published products from Supabase.
 * Enforces is_published = true.
 * Callers can explicitly disable the development-only static fallback.
 */
export async function getProductsAsync(
  options: GetProductsOptions = {}
): Promise<Product[]> {
  const allowStaticFallback = options.allowStaticFallback ?? true;

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(slug, name), product_images(*)')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      return handleFailure('getProductsAsync', error.message, products, allowStaticFallback);
    }

    if (!data || data.length === 0) {
      console.info('[Supabase Info] "products" table query returned 0 rows.');
      return [];
    }

    return data.map((row) => mapProductRow(row as unknown as DatabaseProductRow));
  } catch (err) {
    return handleFailure('getProductsAsync', err, products, allowStaticFallback);
  }
}

/**
 * Fetch a single product by slug or ID from Supabase.
 * Enforces is_published = true.
 */
export async function getProductBySlugAsync(slug: string, options: GetProductsOptions = {}): Promise<Product | undefined> {
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
      return handleFailure(`getProductBySlugAsync(${slug})`, error.message, getProductBySlug(slug), options.allowStaticFallback ?? true);
    }

    if (!data) {
      return undefined;
    }

    return mapProductRow(data as unknown as DatabaseProductRow);
  } catch (err) {
    return handleFailure(`getProductBySlugAsync(${slug})`, err, getProductBySlug(slug), options.allowStaticFallback ?? true);
  }
}

/**
 * Fetch products by category slug from Supabase.
 */
export async function getProductsByCategoryAsync(categorySlug: string): Promise<Product[]> {
  const { categories: publicCategories, products: publicProducts } = await getPublicCatalogAsync();
  return filterCategoryProducts(publicProducts, publicCategories, categorySlug === 'all' ? undefined : categorySlug);
}

/**
 * Fetch all published categories from Supabase.
 * Product counts include descendants of parent categories.
 */
export interface GetCategoriesOptions {
  allowStaticFallback?: boolean;
  products?: Product[];
}

export async function getCategoriesAsync(
  options: GetCategoriesOptions = {}
): Promise<Category[]> {
  const allowStaticFallback = options.allowStaticFallback ?? true;

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return handleFailure('getCategoriesAsync', error.message, categories, allowStaticFallback);
    }

    if (!data || data.length === 0) {
      console.info('[Supabase Info] "categories" table query returned 0 rows.');
      return [];
    }

    const allProducts = options.products ?? await getProductsAsync({ allowStaticFallback });
    const mapped = getValidCategories(data
      .map((row) => mapCategoryRow(row as DatabaseCategoryRow)));
    const publishedProducts = filterCategoryProducts(allProducts, mapped);
    return mapped.map((category) => {
      const descendants = getDescendantSlugs(mapped, category.slug);
      return { ...category, productCount: publishedProducts.filter((product) => descendants.has(product.category)).length };
    });
  } catch (err) {
    return handleFailure('getCategoriesAsync', err, categories, allowStaticFallback);
  }
}

/** One product snapshot supplies both the listing and category counts; never use demo data. */
export async function getPublicCatalogAsync(): Promise<{ categories: Category[]; products: Product[] }> {
  const products = await getProductsAsync({ allowStaticFallback: false });
  const categories = await getCategoriesAsync({ allowStaticFallback: false, products });
  return { categories, products: filterCategoryProducts(products, categories) };
}

export async function getPublicProductBySlugAsync(slug: string): Promise<Product | undefined> {
  const product = await getProductBySlugAsync(slug, { allowStaticFallback: false });
  if (!product) return undefined;
  const categories = await getCategoriesAsync({ allowStaticFallback: false, products: [] });
  return filterCategoryProducts([product], categories)[0];
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

export interface GetServicesOptions {
  allowStaticFallback?: boolean;
}

/**
 * Fetch published services from Supabase.
 * Callers can explicitly disable the development-only static fallback.
 */
export async function getServicesAsync(
  options: GetServicesOptions = {}
): Promise<Service[]> {
  const allowStaticFallback = options.allowStaticFallback ?? true;

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error) {
      return handleFailure(
        'getServicesAsync',
        error.message,
        services,
        allowStaticFallback
      );
    }

    if (!data || data.length === 0) {
      console.info('[Supabase Info] "services" table query returned 0 rows.');
      return [];
    }

    return data.map((row) => mapServiceRow(row as DatabaseServiceRow));
  } catch (err) {
    return handleFailure(
      'getServicesAsync',
      err,
      services,
      allowStaticFallback
    );
  }
}

/**
 * Fetch a single service by slug from Supabase.
 */
export async function getServiceBySlugAsync(slug: string): Promise<Service | undefined> {
  try {
    const allServices = await getServicesAsync();
    return allServices.find((s) => s.slug === slug && s.isPublished !== false);
  } catch (err) {
    return handleFailure(
      `getServiceBySlugAsync(${slug})`,
      err,
      services.find((s) => s.slug === slug && s.isPublished !== false),
    );
  }
}

/**
 * Fetch a single publicly eligible service by slug.
 * Respects publication status for both Supabase records and static curated fallbacks.
 * Returns undefined for missing, invalid, or intentionally unpublished services.
 *
 * Publication authority:
 * - Supabase-authoritative mode: Supabase is the source of truth. If Supabase is
 *   reachable and returns no row for the slug (whether because the record does
 *   not exist or is_published is false), the service is NOT publicly exposed —
 *   even if a static curated record with the same slug exists and is marked
 *   isPublished: true. Database errors fail closed (return undefined).
 * - Static/demo mode: Supabase environment variables are absent. Static curated
 *   services are used directly, gated by their local isPublished flag.
 */
export async function getPublishedServiceBySlugAsync(slug: string): Promise<Service | undefined> {
  // Static/demo mode: no Supabase configuration. Use static curated services.
  if (!isSupabaseAuthoritative()) {
    return services.find((s) => s.slug === slug && s.isPublished !== false);
  }

  // Supabase-authoritative mode: Supabase is the sole source of truth.
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_published', true)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    // Database error: fail closed. Do not expose static content during an outage.
    console.error(`[Supabase Error] getPublishedServiceBySlugAsync(${slug}) failed:`, error);
    return undefined;
  }

  // No published row exists for this slug. Fail closed — do not override
  // with a static curated record, even if isPublished: true in static data.
  if (!data) {
    return undefined;
  }

  return mapServiceRow(data as unknown as DatabaseServiceRow);
}

/**
 * Fetch the complete public service list: curated confirmed services plus
 * additional published services stored in Supabase.
 */
export async function getMergedServicesAsync(): Promise<Service[]> {
  const publishedServices = await getServicesAsync({ allowStaticFallback: false });
  return mergeCuratedServices(publishedServices);
}

/**
 * Fetch one public service by slug from the merged curated + published list.
 */
export async function getMergedServiceBySlugAsync(slug: string): Promise<Service | undefined> {
  const allServices = await getMergedServicesAsync();
  return allServices.find((service) => service.slug === slug);
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
