/** @type {import('next').NextConfig} */
const supabaseImageHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname || null;
  } catch {
    return null;
  }
})();

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Local measurement: AVIF first-request optimization took 1.97-2.82s per
    // image versus 0.32-0.38s for WebP. Warm cache responses were under 10ms
    // for both. WebP keeps metal detail while removing the cold-render delay.
    formats: ['image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'thumb.wikimedia.org', pathname: '/wikipedia/**' },
      { protocol: 'https', hostname: 'upload.wikimedia.org', pathname: '/wikipedia/**' },
      ...(supabaseImageHost
        ? [{ protocol: 'https', hostname: supabaseImageHost, pathname: '/storage/v1/object/**' }]
        : []),
    ],
  },
};

module.exports = nextConfig;
