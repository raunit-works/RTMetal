import { notFound } from 'next/navigation';
import { getInstagramPosts, getPublicCatalogAsync } from '@/lib/data-access';
import { isCategoryInSection } from '@/lib/category-hierarchy';
import { HomeDecorCatalog } from './home-decor-catalog';
import type { MainSection } from '@/lib/types';

export async function CategoryCatalogPage({ slug, section }: { slug?: string; section?: string }) {
  const { categories, products } = await getPublicCatalogAsync();
  const selected = slug ? categories.find((category) => category.slug === slug) : undefined;
  if (slug && !selected) notFound();
  if (section && section !== 'home_decor' && section !== 'metal_services') notFound();
  if (selected && section && !isCategoryInSection(selected, section as MainSection)) notFound();
  const mainSection: MainSection = selected?.mainSection ?? (section as MainSection | undefined) ?? 'home_decor';
  if (selected && !isCategoryInSection(selected, mainSection)) notFound();
  const sectionCategories = categories.filter((category) => isCategoryInSection(category, mainSection));

  return <HomeDecorCatalog categories={sectionCategories} products={products}
    instagramPosts={getInstagramPosts()} selectedCategory={selected} mainSection={mainSection} />;
}
