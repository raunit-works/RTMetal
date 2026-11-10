const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function normalizeSiteUrl(value: string | undefined | null): string | null {
  if (!value) return null;

  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Resolve the public site origin used by metadata, robots and the sitemap.
 *
 * Production builds never fall back to localhost. If no absolute public URL is
 * configured, callers receive null and must omit the canonical URL instead.
 */
export function getSiteUrl(): string | null {
  const isProduction = process.env.NODE_ENV === 'production';
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.URL,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeSiteUrl(candidate);
    if (!normalized) continue;

    const hostname = new URL(normalized).hostname;
    if (LOCALHOST_HOSTS.has(hostname)) {
      if (!isProduction) return normalized;
      continue;
    }

    return normalized;
  }

  return isProduction ? null : 'http://localhost:3000';
}

export function getSiteUrlForPath(path = '/'): string | undefined {
  const siteUrl = getSiteUrl();
  if (!siteUrl) return undefined;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}
