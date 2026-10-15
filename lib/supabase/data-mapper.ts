import {
  Sparkles,
  Lamp,
  Boxes,
  Wine,
  Clock,
  Flame,
  Wrench,
  Shield,
  Layers,
  Building,
  CheckCircle,
  LucideIcon,
} from 'lucide-react';
import type {
  Category,
  Product,
  ProductImage,
  Service,
  Testimonial,
  FAQItem,
  IconType,
} from '../types';

const ICON_MAP: Record<string, LucideIcon> = {
  Lamp,
  Boxes,
  Sparkles,
  Wine,
  Clock,
  Flame,
  Wrench,
  Shield,
  Layers,
  Building,
  CheckCircle,
};

export function mapIconComponent(
  iconName?: string | null,
  fallbackIcon: string = 'sparkles'
): IconType {
  if (!iconName) return fallbackIcon;
  return iconName;
}

export interface DatabaseCategoryRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  image: string | null;
  icon: string | null;
  display_order: number;
}

export interface DatabaseProductImageRow {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string | null;
  sort_order?: number | null;
  is_primary?: boolean | null;
}

export interface DatabaseProductRow {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  price: number | string;
  original_price: number | string | null;
  image: string;
  rating: number | string | null;
  badge: string | null;
  description: string;
  is_published: boolean;
  categories?: { slug: string; name: string } | { slug: string; name: string }[] | null;
  sku?: string | null;
  sub_category?: string | null;
  short_description?: string | null;
  material?: string | null;
  color_finish?: string | null;
  dimensions?: string | null;
  weight?: string | null;
  stock_status?: string | null;
  features?: string[] | null;
  care_instructions?: string | null;
  is_featured?: boolean | null;
  display_order?: number | null;
  product_images?: DatabaseProductImageRow[] | null;
}

export interface DatabaseServiceRow {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  description: string;
  long_description: string;
  image: string;
  icon: string | null;
  features: string[] | null;
  display_order: number;
  is_published: boolean;
}

export interface DatabaseTestimonialRow {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  content: string;
  rating: number | null;
  avatar: string | null;
  display_order: number;
  is_published: boolean;
}

export interface DatabaseFAQRow {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_published: boolean;
}

export function mapCategoryRow(
  row: DatabaseCategoryRow,
  productCount: number = 0
): Category {
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline || '',
    description: row.description || '',
    image: row.image || 'https://images.pexels.com/photos/6585608/pexels-photo-6585608.jpeg',
    icon: row.icon || 'boxes',
    productCount,
  };
}

export function mapProductImageRow(row: DatabaseProductImageRow): ProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    imageUrl: row.image_url,
    altText: row.alt_text || undefined,
    sortOrder: Number(row.sort_order ?? 0),
    isPrimary: Boolean(row.is_primary),
  };
}

export function mapProductRow(
  row: DatabaseProductRow,
  categorySlugLookup?: Record<string, string>
): Product {
  let resolvedCategory = 'home-decor';

  if (row.categories) {
    if (Array.isArray(row.categories) && row.categories.length > 0) {
      resolvedCategory = row.categories[0].slug;
    } else if (!Array.isArray(row.categories) && row.categories.slug) {
      resolvedCategory = row.categories.slug;
    }
  } else if (categorySlugLookup && categorySlugLookup[row.category_id]) {
    resolvedCategory = categorySlugLookup[row.category_id];
  }

  let badgeValue: 'New' | 'Bestseller' | 'Limited' | undefined = undefined;
  if (row.badge === 'New' || row.badge === 'Bestseller' || row.badge === 'Limited') {
    badgeValue = row.badge;
  }

  const mappedImages = Array.isArray(row.product_images)
    ? row.product_images.map(mapProductImageRow)
    : undefined;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: resolvedCategory,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    image: row.image,
    rating: row.rating != null ? Number(row.rating) : 5.0,
    badge: badgeValue,
    description: row.description,
    sku: row.sku || undefined,
    subCategory: row.sub_category || undefined,
    shortDescription: row.short_description || undefined,
    material: row.material || undefined,
    colorFinish: row.color_finish || undefined,
    dimensions: row.dimensions || undefined,
    weight: row.weight || undefined,
    stockStatus: row.stock_status || undefined,
    features: Array.isArray(row.features) ? row.features : [],
    careInstructions: row.care_instructions || undefined,
    isFeatured: Boolean(row.is_featured),
    isPublished: row.is_published != null ? Boolean(row.is_published) : true,
    displayOrder: row.display_order != null ? Number(row.display_order) : 0,
    images: mappedImages,
  };
}

export function mapServiceRow(row: DatabaseServiceRow): Service {
  return {
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    description: row.description,
    longDescription: row.long_description,
    icon: row.icon || 'wrench',
    image: row.image,
    features: Array.isArray(row.features) ? row.features : [],
  };
}

export function mapTestimonialRow(row: DatabaseTestimonialRow): Testimonial {
  return {
    id: row.id,
    name: row.name,
    role: row.role || 'Client',
    company: row.company || 'Private Client',
    content: row.content,
    rating: row.rating != null ? Number(row.rating) : 5,
    avatar: row.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
  };
}

export function mapFAQRow(row: DatabaseFAQRow): FAQItem {
  return {
    question: row.question,
    answer: row.answer,
  };
}
