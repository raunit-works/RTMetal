import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CategoryCatalogPage } from '@/components/sections/category-catalog-page';
import { getCategoriesAsync } from '@/lib/data-access';
import { categoryHref } from '@/lib/category-hierarchy';

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategoriesAsync({ allowStaticFallback: false, products: [] });
  const category = categories.find((item) => item.slug === slug);
  if (!category) return { title: 'Category Not Found', robots: { index: false, follow: false } };
  return { title: category.name, description: category.description,
    alternates: { canonical: categoryHref(category) } };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await getCategoriesAsync({ allowStaticFallback: false, products: [] });
  const category = categories.find((item) => item.slug === slug);

  if (!category) notFound();

  if (category.mainSection === 'metal_services') {
    redirect(`/metal-coating/category/${category.slug}`);
  }

  return <CategoryCatalogPage slug={slug} section="home_decor" categories={categories} />;
}
