export type IconType = string;

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  icon: IconType;
  productCount: number;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  badge?: 'New' | 'Bestseller' | 'Limited';
  description: string;
  sku?: string;
  subCategory?: string;
  shortDescription?: string;
  material?: string;
  colorFinish?: string;
  dimensions?: string;
  weight?: string;
  stockStatus?: string;
  features?: string[];
  careInstructions?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  displayOrder?: number;
  images?: ProductImage[];
}

export interface Service {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  icon: IconType;
  image: string;
  features: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ProcessStep {
  step: string;
  title: string;
  description: string;
  icon: IconType;
}

export interface InstagramPost {
  id: string;
  type: 'reel' | 'post';
  category: 'Recent Work' | 'Behind The Scenes' | 'Workshop' | 'Product';
  image: string;
  caption: string;
}

export interface BusinessDivision {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cta: { label: string; href: string };
  points: string[];
}

export interface WhyChooseUsItem {
  icon: IconType;
  title: string;
  description: string;
}

export interface SiteSettings {
  brandName: string;
  tagline: string;
  contact: {
    email: string;
    phone: string;
    phoneDisplay: string;
    address: string;
  };
  social: {
    instagram: string;
    instagramUrl: string;
  };
  whatsapp: {
    homeDecor: string;
    metalCoating: string;
  };
}

export type InquiryType = 'general' | 'product' | 'service';
export type InquiryDivision = 'home_decor' | 'metal_coating';
export type InquiryStatus = 'new' | 'contacted' | 'in_progress' | 'converted' | 'closed';

export interface Inquiry {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  inquiryType: InquiryType;
  division: InquiryDivision;
  productId?: string | null;
  serviceId?: string | null;
  productNameSnapshot?: string | null;
  serviceNameSnapshot?: string | null;
  status: InquiryStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product?: Product;
}


