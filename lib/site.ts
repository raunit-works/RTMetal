import type { SiteSettings } from './types';

export const siteSettings: SiteSettings = {
  brandName: 'RT PU COATING WORKS',
  tagline: 'Home Decor · Lifestyle · Premium Metal Coating',
  contact: {
    email: 'studio@aurumandco.com',
    phone: '+919999999999',
    phoneDisplay: '+91 99999 99999',
    address: 'Studio 12, Design District, Mumbai, India',
  },
  social: {
    instagram: 'aurumandco',
    instagramUrl: 'https://instagram.com/aurumandco',
  },
  whatsapp: {
    homeDecor: '919999999999', // Placeholder for Home Decor & Lifestyle Products division
    metalCoating: '918888888888', // Placeholder for Metal Coating Services division
  },
};

// Backward-compatible exports for existing layout/legacy calls
export const WHATSAPP_NUMBER = siteSettings.whatsapp.homeDecor;
export const INSTAGRAM_HANDLE = siteSettings.social.instagram;
export const INSTAGRAM_URL = siteSettings.social.instagramUrl;
export const EMAIL = siteSettings.contact.email;
export const PHONE_DISPLAY = siteSettings.contact.phoneDisplay;

export function whatsappLink(message: string): string {
  return getHomeDecorWhatsAppLink(message);
}

// Division 1: Home Decor & Lifestyle Products WhatsApp helper
export function getHomeDecorWhatsAppLink(message: string): string {
  return `https://wa.me/${siteSettings.whatsapp.homeDecor}?text=${encodeURIComponent(message)}`;
}

// Division 2: Metal Coating Services WhatsApp helper
export function getMetalCoatingWhatsAppLink(message: string): string {
  return `https://wa.me/${siteSettings.whatsapp.metalCoating}?text=${encodeURIComponent(message)}`;
}
