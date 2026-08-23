export const WHATSAPP_NUMBER = '919999999999';
export const INSTAGRAM_HANDLE = 'aurumandco';
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;
export const EMAIL = 'studio@aurumandco.com';
export const PHONE_DISPLAY = '+91 99999 99999';

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
