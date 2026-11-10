import type { Category } from './types';
import { getCategoryPath } from './category-hierarchy';

/** Remove empty/duplicate IDs while preserving the first-seen order. */
export function normalizeIdList(ids: ReadonlyArray<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of ids) {
    if (!value) continue;
    const id = value.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    normalized.push(id);
  }

  return normalized;
}

export interface IdSelectionDiff {
  toAdd: string[];
  toRemove: string[];
}

/** Compute the minimum set of changes between two selections. */
export function diffIdSelections(
  current: ReadonlyArray<string>,
  next: ReadonlyArray<string>
): IdSelectionDiff {
  const currentSet = new Set(current);
  const nextSet = new Set(next);

  return {
    toAdd: next.filter((id) => !currentSet.has(id)),
    toRemove: current.filter((id) => !nextSet.has(id)),
  };
}

/** Order-insensitive comparison used for optimistic concurrency checks. */
export function areIdSelectionsEqual(
  left: ReadonlyArray<string>,
  right: ReadonlyArray<string>
): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id)) && new Set(left).size === rightSet.size;
}

/** Add or remove a single checkbox selection. */
export function toggleIdSelection(
  selected: ReadonlyArray<string>,
  id: string
): string[] {
  if (!id) return [...selected];
  return selected.includes(id)
    ? selected.filter((value) => value !== id)
    : [...selected, id];
}

/**
 * "N/A - No Service Assigned" is derived, never stored as a fake record.
 * Checking N/A clears all service selections; unchecking it is a no-op until
 * a real service is selected.
 */
export function toggleNoServiceAssigned(
  selectedServiceIds: ReadonlyArray<string>,
  checked: boolean
): string[] {
  return checked ? [] : [...selectedServiceIds];
}

export function isNoServiceAssigned(
  selectedServiceIds: ReadonlyArray<string>
): boolean {
  return selectedServiceIds.length === 0;
}

export interface CategoryPickerOption {
  id: string;
  name: string;
  slug: string;
  path: string;
  isPublished: boolean;
}

/** Build the admin Services picker from valid Metal division categories. */
export function getMetalCategoryPickerOptions(
  categories: ReadonlyArray<Category>
): CategoryPickerOption[] {
  return categories
    .filter((category) => category.id && category.mainSection === 'metal_services')
    .map((category) => ({
      id: category.id!,
      name: category.name,
      slug: category.slug,
      path: getCategoryPath(category, [...categories]),
      isPublished: category.isPublished !== false,
    }));
}

/**
 * Resolve linked IDs to publishable Metal categories, preserving the
 * relationship display order and dropping drafts, Home Decor and duplicates.
 */
export function selectRelatedMetalCategories(
  categories: ReadonlyArray<Category>,
  orderedCategoryIds: ReadonlyArray<string>
): Category[] {
  const byId = new Map(
    categories
      .filter((category) => category.id)
      .map((category) => [category.id!, category] as const)
  );
  const seen = new Set<string>();
  const related: Category[] = [];

  for (const categoryId of orderedCategoryIds) {
    if (seen.has(categoryId)) continue;
    const category = byId.get(categoryId);
    if (!category) continue;
    if (category.mainSection !== 'metal_services') continue;
    if (category.isPublished === false) continue;
    seen.add(categoryId);
    related.push(category);
  }

  return related;
}

export function formatCategorySelectionCount(count: number): string {
  return `${count} categor${count === 1 ? 'y' : 'ies'} selected`;
}

export function formatServiceSelectionCount(count: number): string {
  return `${count} service${count === 1 ? '' : 's'} selected`;
}
