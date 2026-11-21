import { notFound } from 'next/navigation';
import {
  getCategoriesAsync,
  getInstagramPosts,
  getProductsForSectionAsync,
} from '@/lib/data-access';
import { isCategoryInSection } from '@/lib/category-hierarchy';
import { HomeDecorCatalog } from './home-decor-catalog';
import type { Category, MainSection } from '@/lib/types';

export async function CategoryCatalogPage({
  slug,
  section,
  categories: providedCategories,
}: {
  slug?: string;
  section?: string;
  categories?: Category[];
}) {
  // Category routes already fetch the category list to validate/redirect, so
  // reuse it instead of issuing the same query twice per request.
  const categories =
    providedCategories ??
    (await getCategoriesAsync({ allowStaticFallback: false, products: [] }));
  const selected = slug ? categories.find((category) => category.slug === slug) : undefined;
  if (slug && !selected) notFound();
  if (section && section !== 'home_decor' && section !== 'metal_services') notFound();
  if (selected && section && !isCategoryInSection(selected, section as MainSection)) notFound();
  const mainSection: MainSection = selected?.mainSection ?? (section as MainSection | undefined) ?? 'home_decor';
  if (selected && !isCategoryInSection(selected, mainSection)) notFound();
  const sectionCategories = categories.filter((category) => isCategoryInSection(category, mainSection));
  // Fetch only this division (and category) instead of the whole catalogue.
  const products = await getProductsForSectionAsync(categories, mainSection, selected?.slug);

  return <HomeDecorCatalog categories={sectionCategories} products={products}
    instagramPosts={getInstagramPosts()} selectedCategory={selected} mainSection={mainSection} />;
}
