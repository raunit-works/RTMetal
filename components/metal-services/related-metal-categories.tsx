import type { Category } from '@/lib/types';
import { CategoryShowcase } from '@/components/categories/category-showcase';
import { toCategoryShowcaseItems } from '@/lib/category-showcase';

interface RelatedMetalCategoriesProps {
  serviceName: string;
  categories: Category[];
}

/**
 * Renders the admin-assigned Metal categories for one service. The list is
 * already filtered to published Metal categories by the data-access layer.
 * When nothing is assigned, the section is omitted rather than showing an
 * empty band or unrelated categories.
 */
export function RelatedMetalCategories({
  serviceName,
  categories,
}: RelatedMetalCategoriesProps) {
  if (categories.length === 0) return null;

  return (
    <CategoryShowcase
      eyebrow={`${serviceName} Catalogue`}
      title="Explore Related Metal Categories"
      description="Browse metalwork categories associated with this finishing service."
      items={toCategoryShowcaseItems(categories)}
      ctaLabel="Explore Category"
    />
  );
}
