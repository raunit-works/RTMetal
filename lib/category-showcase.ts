import { categoryHref } from '@/lib/category-hierarchy';
import type { Category } from '@/lib/types';

export interface CategoryShowcaseItem {
  id: string;
  title: string;
  description?: string;
  image?: string;
  href: string;
  icon?: string;
}

export function toCategoryShowcaseItems(
  categories: Category[]
): CategoryShowcaseItem[] {
  return categories
    .filter(
      (category) =>
        category.isPublished !== false &&
        Boolean(category.slug) &&
        Boolean(category.name)
    )
    .map((category) => {
      const description = (category.tagline || category.description || '').trim();

      return {
        id: category.id ?? category.slug,
        title: category.name.trim(),
        description: description || undefined,
        image: category.image?.trim() || undefined,
        href: categoryHref(category),
        icon: category.icon,
      };
    });
}
