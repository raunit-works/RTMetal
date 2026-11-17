import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize an image URL source value.
 *
 * Accepts:
 * - A plain absolute HTTPS URL string (returned as-is)
 * - A URL string with outer quotation marks stripped
 * - A legacy value that looks like a JSON string literal containing a URL
 * - null, undefined, empty string (returns null)
 *
 * Does NOT accept:
 * - Unsupported protocols (javascript:, etc.)
 * - Malformed URLs
 *
 * Returns the cleaned URL string, or null if the value cannot be normalized
 * to a valid, safe image source.
 */
export function normalizeImageSrc(
  src: string | null | undefined
): string | null {
  if (src == null) return null;

  let value = src.trim();

  // Return null for empty strings
  if (value === '') return null;

  // Strip outer quotation marks if present (legacy JSON-serialized value).
  // Only strip when the result is a non‑empty, valid-looking URL.
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    const candidate = value.slice(1, -1).trim();
    if (candidate !== '') value = candidate;
  }

  // Reject unsupported protocols
  if (
    value.toLowerCase().startsWith('javascript:') ||
    value.toLowerCase().startsWith('data:') ||
    value.toLowerCase().startsWith('vbscript:')
  ) {
    return null;
  }

  // Accept supported absolute HTTPS URLs
  // Accept supported internal application paths (leading / or relative)
  // Reject anything that doesn't look like a URL
  if (
    value.startsWith('https://') ||
    value.startsWith('http://') ||
    value.startsWith('/') ||
    value.startsWith('..') // allow relative paths within the app
  ) {
    // Basic sanity: ensure there's something after the protocol/prefix
    const afterProtocol = value.replace(/^https?:\/\//i, '').replace(/^\//, '');
    if (afterProtocol === '') return null;
    return value;
  }

  // If the value doesn't match any accepted pattern, return null
  return null;
}
