import { test, expect } from '@playwright/test';
import {
  areIdSelectionsEqual,
  diffIdSelections,
  formatCategorySelectionCount,
  getMetalCategoryPickerOptions,
  isNoServiceAssigned,
  normalizeIdList,
  selectRelatedMetalCategories,
  toggleIdSelection,
  toggleNoServiceAssigned,
} from '@/lib/service-categories';
import type { Category } from '@/lib/types';

const SERVICE_SLUGS = [
  'pvd-coating',
  'electroplating',
  'pu-coating',
  'powder-coating',
  'decorative-metal-finishing',
  'metal-restoration',
];

function category(overrides: Partial<Category> & { id: string; slug: string; name: string }): Category {
  return {
    tagline: '',
    description: '',
    image: '',
    icon: 'boxes',
    productCount: 0,
    mainSection: 'metal_services',
    isPublished: true,
    ...overrides,
  };
}

test.describe('Service-category selection helpers', () => {
  test('normalizes duplicates and empty IDs while preserving order', () => {
    expect(normalizeIdList(['b', 'a', 'b', '', null, 'a', ' c '])).toEqual([
      'b',
      'a',
      'c',
    ]);
  });

  test('computes only the added and removed relationships', () => {
    expect(diffIdSelections(['a', 'b', 'c'], ['b', 'd'])).toEqual({
      toAdd: ['d'],
      toRemove: ['a', 'c'],
    });
    expect(diffIdSelections([], ['x'])).toEqual({ toAdd: ['x'], toRemove: [] });
    expect(diffIdSelections(['x'], [])).toEqual({ toAdd: [], toRemove: ['x'] });
  });

  test('supports zero, one and multiple category selections', () => {
    expect(toggleIdSelection([], 'cat-1')).toEqual(['cat-1']);
    expect(toggleIdSelection(['cat-1'], 'cat-2')).toEqual(['cat-1', 'cat-2']);
    expect(toggleIdSelection(['cat-1', 'cat-2'], 'cat-1')).toEqual(['cat-2']);
    expect(toggleIdSelection([], 'cat-1')).toEqual(['cat-1']);
  });

  test('N/A clears services and a service selection clears N/A', () => {
    const services = ['svc-a', 'svc-b'];
    const afterNoService = toggleNoServiceAssigned(services, true);
    expect(afterNoService).toEqual([]);
    expect(isNoServiceAssigned(afterNoService)).toBe(true);

    const afterService = toggleIdSelection(afterNoService, 'svc-c');
    expect(afterService).toEqual(['svc-c']);
    expect(isNoServiceAssigned(afterService)).toBe(false);
  });

  test('compares relationship sets without depending on order', () => {
    expect(areIdSelectionsEqual(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(areIdSelectionsEqual(['a', 'b'], ['a'])).toBe(false);
    expect(areIdSelectionsEqual([], [])).toBe(true);
  });

  test('picker only contains valid Metal categories', () => {
    const categories = [
      category({ id: 'm1', slug: 'metal-one', name: 'Metal One' }),
      category({
        id: 'h1',
        slug: 'home-one',
        name: 'Home One',
        mainSection: 'home_decor',
      }),
      category({
        id: 'm2',
        slug: 'metal-child',
        name: 'Metal Child',
        parentId: 'm1',
      }),
    ];

    expect(getMetalCategoryPickerOptions(categories).map((option) => option.id)).toEqual([
      'm1',
      'm2',
    ]);
  });

  test('related categories preserve order, exclude Home Decor/drafts and deduplicate', () => {
    const categories = [
      category({ id: 'm1', slug: 'metal-one', name: 'Metal One' }),
      category({ id: 'm2', slug: 'metal-two', name: 'Metal Two' }),
      category({
        id: 'draft',
        slug: 'draft-metal',
        name: 'Draft Metal',
        isPublished: false,
      }),
      category({
        id: 'home',
        slug: 'home',
        name: 'Home',
        mainSection: 'home_decor',
      }),
    ];

    expect(
      selectRelatedMetalCategories(categories, ['m2', 'draft', 'home', 'm2', 'm1']).map(
        (item) => item.id
      )
    ).toEqual(['m2', 'm1']);
  });

  test('formats selection counts correctly', () => {
    expect(formatCategorySelectionCount(0)).toBe('0 categories selected');
    expect(formatCategorySelectionCount(1)).toBe('1 category selected');
    expect(formatCategorySelectionCount(3)).toBe('3 categories selected');
  });
});

test.describe('Public Metal service pages remain healthy', () => {
  for (const slug of SERVICE_SLUGS) {
    test(`${slug} renders without leaking Home Decor`, async ({ page }) => {
      const response = await page.goto(`/metal-coating/${slug}`, {
        waitUntil: 'domcontentloaded',
      });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const relatedSection = page.getByRole('heading', {
        name: 'Related Metal Categories',
      });
      if (await relatedSection.count()) {
        const homeDecorLinks = page.locator(
          'section a[href^="/home-decor/"]'
        );
        await expect(homeDecorLinks).toHaveCount(0);
      }
    });
  }

  test('main Metal directory never duplicates a category link', async ({ page }) => {
    await page.goto('/metal-coating', { waitUntil: 'networkidle' });
    const collections = page.locator('#collections');
    await expect(collections).toBeVisible();

    const hrefs = await collections
      .locator('a[href^="/metal-coating/category/"]')
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('href') ?? '')
      );

    expect(hrefs.length).toBeGreaterThan(0);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  test('service page does not horizontally overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/metal-coating/electroplating', {
      waitUntil: 'networkidle',
    });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
