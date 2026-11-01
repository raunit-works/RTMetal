import type { Category, MainSection, Product } from './types';

export const SECTION_LABELS: Record<MainSection, string> = {
  home_decor: 'Home Decor',
  metal_services: 'Metal',
};

/** Reject ambiguous IDs/slugs, orphan branches, cycles and cross-section parents. */
export function getValidCategories(categories: Category[], publicOnly = true): Category[] {
  const byId = new Map(categories.filter((c) => c.id).map((c) => [c.id!, c]));
  const slugCounts = new Map<string, number>();
  const idCounts = new Map<string, number>();
  categories.forEach((c) => {
    slugCounts.set(c.slug, (slugCounts.get(c.slug) || 0) + 1);
    if (c.id) idCounts.set(c.id, (idCounts.get(c.id) || 0) + 1);
  });
  return categories.filter((category) => {
    const visited = new Set<Category>();
    let current: Category | undefined = category;
    while (current) {
      if (visited.has(current) || current.isHierarchyValid === false || !current.slug || slugCounts.get(current.slug) !== 1 ||
          (current.id && idCounts.get(current.id) !== 1) ||
          (publicOnly && current.isPublished === false)) return false;
      visited.add(current);
      if (!current.parentId) return true;
      const parent = byId.get(current.parentId);
      if (!parent || parent.mainSection !== current.mainSection) return false;
      current = parent;
    }
    return false;
  });
}

export function getDescendantSlugs(categories: Category[], slug: string): Set<string> {
  const root = categories.find((category) => category.slug === slug);
  const slugs = new Set<string>();
  const visit = (category: Category) => {
    if (slugs.has(category.slug)) return;
    slugs.add(category.slug);
    if (category.id) categories.filter((c) => c.parentId === category.id).forEach(visit);
  };
  if (root) visit(root);
  return slugs;
}

/** Legacy/unassigned categories keep their historical Home Decor placement; no data is reclassified. */
export function isCategoryInSection(category: Category, section: MainSection): boolean {
  return category.mainSection === section || (!category.mainSection && section === 'home_decor');
}

export function filterCategoryProducts(products: Product[], categories: Category[], slug?: string): Product[] {
  const valid = getValidCategories(categories);
  const allowed = slug ? getDescendantSlugs(valid, slug) : new Set(valid.map((c) => c.slug));
  const seen = new Set<string>();
  return products.filter((product) => {
    if (product.isPublished === false || !allowed.has(product.category) || seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

export function getCategoryPath(category: Category, categories: Category[]): string {
  const names = [category.name];
  const visited = new Set([category.id]);
  let parentId = category.parentId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = categories.find((c) => c.id === parentId);
    if (!parent) break;
    names.unshift(parent.name);
    parentId = parent.parentId;
  }
  return names.join(' / ');
}

export function categoryHref(category: Category): string {
  const prefix = category.mainSection === 'metal_services' ? 'metal-coating' : 'home-decor';
  return `/${prefix}/category/${encodeURIComponent(category.slug)}`;
}

/** Resolve the division for a product from its category, keeping legacy unassigned categories in Home Decor. */
export function getCategorySection(categories: Category[], slug: string): MainSection {
  const category = categories.find((item) => item.slug === slug);
  return category && !isCategoryInSection(category, 'home_decor')
    ? 'metal_services'
    : 'home_decor';
}

export function validateCategoryChange(
  categories: Category[],
  change: { id?: string; slug: string; mainSection?: MainSection; parentId?: string | null },
  hasAssignedProducts: boolean
): string | undefined {
  if (categories.some((c) => c.slug === change.slug && c.id !== change.id)) return 'This category slug is already in use.';
  const existing = categories.find((c) => c.id === change.id);
  if (existing && existing.mainSection !== change.mainSection &&
      (hasAssignedProducts || categories.some((c) => c.parentId === existing.id))) {
    return 'A category with products or child categories cannot change section. Review its assignments first.';
  }
  if (change.parentId) {
    const parent = getValidCategories(categories, false).find((c) => c.id === change.parentId);
    if (!parent || parent.mainSection !== change.mainSection) return 'Choose a valid parent in the same main section.';
    if (existing && getDescendantSlugs(categories, existing.slug).has(parent.slug)) return 'A category cannot be its own parent or a descendant of itself.';
  }
  return undefined;
}
