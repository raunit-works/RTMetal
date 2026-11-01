import type { SiteSettings } from './types';

export const siteSettings: SiteSettings = {
  brandName: 'RTMETALCOATING',
  tagline: 'Professional Metal Coating & Decorative Finishing Services · RT HOME DECOR',
  contact: {
    email: 'studio@aurumandco.com',
    phone: '+917666067782',
    phoneDisplay: '+91 76660 67782',
    address:
      '6th Kumbharwada, Trimbak Parshuram Street, near public toilet, Compound No. 194, Mumbai 400004, Maharashtra, India',
    emailVerified: false,
    phoneVerified: false,
    addressVerified: false,
  },
  social: {
    instagram: 'rtmetalcoating',
    instagramUrl: 'https://www.instagram.com/rtmetalcoating/',
  },
  whatsapp: {
    homeDecor: '919999999999',
    metalCoating: '918888888888',
    homeDecorVerified: false,
    metalCoatingVerified: false,
  },
  contactAvailability: {
    days: 'Monday to Saturday',
    hours: '10:00 AM – 7:00 PM',
  },
};

// Backward-compatible exports for existing layout/legacy calls
export const WHATSAPP_NUMBER = siteSettings.whatsapp.homeDecor;
export const INSTAGRAM_HANDLE = siteSettings.social.instagram;
export const INSTAGRAM_URL = siteSettings.social.instagramUrl;
export const EMAIL = siteSettings.contact.email;
export const PHONE_DISPLAY = siteSettings.contact.phoneDisplay;

/**
 * Detect placeholder/unverified phone numbers that must not be used as
 * live customer WhatsApp destinations.
 */
export function isPlaceholderPhone(phone: string | undefined | null): boolean {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, '');
  // Placeholder patterns: all same digit, all 9s, too short, or obviously fake
  if (digits.length < 7) return true;
  if (/^(.)\1+$/.test(digits)) return true;
  return false;
}

/**
 * Public email is clickable only when explicitly verified.
 */
export function isEmailVerified(): boolean {
  return Boolean(siteSettings.contact.emailVerified);
}

/**
 * Public telephone is clickable only when explicitly verified.
 */
export function isPhoneVerified(): boolean {
  return Boolean(siteSettings.contact.phoneVerified && !isPlaceholderPhone(siteSettings.contact.phone));
}

/**
 * RT HOME DECOR WhatsApp is clickable only when explicitly verified.
 */
export function isHomeDecorWhatsappVerified(): boolean {
  return Boolean(
    siteSettings.whatsapp.homeDecorVerified && !isPlaceholderPhone(siteSettings.whatsapp.homeDecor),
  );
}

/**
 * Metal Coating WhatsApp is clickable only when explicitly verified.
 */
export function isMetalCoatingWhatsappVerified(): boolean {
  return Boolean(
    siteSettings.whatsapp.metalCoatingVerified && !isPlaceholderPhone(siteSettings.whatsapp.metalCoating),
  );
}

/**
 * Normalize a phone number for WhatsApp wa.me URLs: keep only digits.
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Build a WhatsApp deep-link for a specific division.
 * Returns null when the contact is unverified so callers can render a
 * controlled fallback instead of a broken or fake link.
 */
export function getWhatsAppLink(
  division: 'home_decor' | 'metal_coating',
  message: string,
): string | null {
  const number =
    division === 'home_decor'
      ? siteSettings.whatsapp.homeDecor
      : siteSettings.whatsapp.metalCoating;
  const isVerified =
    division === 'home_decor'
      ? siteSettings.whatsapp.homeDecorVerified
      : siteSettings.whatsapp.metalCoatingVerified;

  if (!number || !isVerified || isPlaceholderPhone(number)) {
    return null;
  }
  return `https://wa.me/${normalizePhoneForWhatsApp(number)}?text=${encodeURIComponent(message)}`;
}

// Division 1: Home Decor & Lifestyle Products WhatsApp helper
export function getHomeDecorWhatsAppLink(message: string): string | null {
  return getWhatsAppLink('home_decor', message);
}

// Division 2: Metal Coating Services WhatsApp helper
export function getMetalCoatingWhatsAppLink(message: string): string | null {
  return getWhatsAppLink('metal_coating', message);
}

/**
 * Legacy helper kept for backward compatibility. Defaults to home decor division.
 * Returns null when unverified.
 */
export function whatsappLink(message: string): string | null {
  return getHomeDecorWhatsAppLink(message);
}

/**
 * Returns the Mumbai business address, gated behind address verification.
 * Callers should display a controlled placeholder when addressVerified is false.
 */
export function getBusinessAddress(): string | null {
  return siteSettings.contact.addressVerified ? siteSettings.contact.address : null;
}
