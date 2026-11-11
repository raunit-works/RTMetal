export const coreMetalServices = [
  'PVD Coating',
  'Electroplating',
  'PU Coating',
  'Powder Coating',
  'Decorative Finishing',
  'Metal Restoration',
] as const;

export interface HomeDecorCollection {
  label: string;
  href: string;
}

/**
 * Existing RT HOME DECOR catalogue categories.
 * These labels and routes mirror the live catalogue structure.
 */
export const homeDecorCollections: HomeDecorCollection[] = [
  {
    label: 'Home Decor',
    href: '/home-decor/category/home-decor',
  },
  {
    label: 'Decorative Accessories',
    href: '/home-decor/category/decorative-accessories',
  },
  {
    label: 'Gift Articles',
    href: '/home-decor/category/gift-articles',
  },
  {
    label: 'Lifestyle Products',
    href: '/home-decor/category/lifestyle-products',
  },
  {
    label: 'Household Products',
    href: '/home-decor/category/household-products',
  },
  {
    label: 'Daily Utility',
    href: '/home-decor/category/daily-utility',
  },
];

export const aboutMedia = {
  hero: '/hero-brass-interior.jpg',
  workshop: '/metal.jpg',
  coating: '/hero-coating-process.jpg',
  finishingSample: '/images/metal-coating/finishes/FIN-0044.jpeg',
  inspectionSample: '/images/metal-coating/finishes/FIN-0058.jpeg',
  metalDivision: '/hero-brass-interior.jpg',
  homeDecorDivision: '/hero-metal-art-decor.jpg',
  ctaBackground: '/hero-coating-process.jpg',
} as const;
