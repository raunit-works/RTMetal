import { test, expect } from '@playwright/test';
import { PRINCIPAL_SERVICE_GROUPS } from '@/lib/principal-service-groups';

test.describe.configure({ mode: 'serial' });

test.describe('Metal division integration journey', () => {
  test.setTimeout(120_000);

  test('Metal Services -> Collections -> Art Work -> Product -> Quote', async ({
    page,
  }) => {
    const mobile = (page.viewportSize()?.width ?? 1280) < 1024;

    await page.goto('/metal-coating', { waitUntil: 'networkidle' });
    await expect(page.locator('#services')).toBeVisible();

    if (mobile) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      for (const group of PRINCIPAL_SERVICE_GROUPS) {
        await expect(
          page.getByRole('link', { name: group.name, exact: true })
        ).toBeVisible();
      }
      await expect(
        page.getByRole('link', { name: 'View Metal Collections', exact: true })
      ).toBeVisible();
      await page
        .getByRole('link', { name: 'View Metal Collections', exact: true })
        .click();
    } else {
      await page
        .locator('a[href="/metal-coating"]')
        .filter({ hasText: 'Metal Services' })
        .first()
        .hover();
      const menu = page.locator('#navbar-services-menu');
      await expect(menu).toBeVisible();
      for (const group of PRINCIPAL_SERVICE_GROUPS) {
        await expect(
          menu.locator(`a[href="/metal-coating/${group.slug}"]`)
        ).toHaveCount(1);
      }
      await expect(
        menu.locator('a[href^="/metal-coating/category/"]')
      ).toHaveCount(0);
      await menu
        .getByRole('menuitem', { name: 'View Metal Collections' })
        .click();
    }

    await expect(page).toHaveURL(/\/metal-coating#collections$/, {
      timeout: 30_000,
    });
    const collections = page.locator('#collections');
    await expect(collections).toBeInViewport();
    await expect(collections).toContainText(/2\s*pieces/);

    const artWorkLink = collections.locator(
      'a[href="/metal-coating/category/art-work"]'
    );
    await expect(artWorkLink).toBeVisible();
    await artWorkLink.scrollIntoViewIfNeeded();
    await artWorkLink.click();

    await expect(page).toHaveURL(/\/metal-coating\/category\/art-work$/, {
      timeout: 30_000,
    });
    await expect(
      page.getByRole('heading', { name: 'Art Work', level: 1 })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Blue Abstract Wall Sculpture' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Botanical Leaf Wall Artwork' })
    ).toBeVisible();

    const productLinks = page.locator(
      'a[href="/metal-coating/product/blue-abstract-wall-sculpture"]'
    );
    await expect(productLinks.first()).toBeVisible();
    await productLinks.first().click();

    await expect(page).toHaveURL(
      /\/metal-coating\/product\/blue-abstract-wall-sculpture$/,
      { timeout: 30_000 }
    );
    await expect(
      page.getByRole('heading', { name: 'Blue Abstract Wall Sculpture', level: 1 })
    ).toBeVisible();

    const galleryImages = page.locator('img[src*="catalog-images"]');
    expect(await galleryImages.count()).toBeGreaterThanOrEqual(4);
    await expect(page.getByText(/5\.0\s*Rating/)).toHaveCount(0);
    await expect(page.getByText(/custom patinas/i)).toHaveCount(0);
    await expect(page.getByText('Color / Finish')).toBeVisible();
    await expect(page.getByText('Material:', { exact: true })).toHaveCount(0);

    const quoteLink = page.locator('a[href="/metal-coating#quote"]').first();
    await expect(quoteLink).toBeVisible();
    await quoteLink.click();

    await expect(page.locator('#quote')).toBeInViewport();
    await expect(page.locator('#quote')).toContainText(
      'Tell us about your project'
    );
    await expect(
      page.locator('#quote input[placeholder*="Your name"]')
    ).toBeVisible();
  });

  test('All six coating-service routes remain reachable', async ({ page }) => {
    for (const group of PRINCIPAL_SERVICE_GROUPS) {
      const response = await page.goto(`/metal-coating/${group.slug}`, {
        waitUntil: 'domcontentloaded',
      });
      expect(response?.status()).toBe(200);
      await expect(
        page.getByRole('heading', { name: group.name, level: 1 })
      ).toBeVisible();
    }
  });

  test('Home Decor stays separate from the Metal division', async ({ page }) => {
    await page.goto('/home-decor', { waitUntil: 'networkidle' });
    await expect(
      page.getByRole('heading', { name: /Home Decor/i, level: 1 })
    ).toBeVisible();
    await expect(
      page.locator('a[href="/metal-coating/category/art-work"]')
    ).toHaveCount(0);

    await page.goto('/home-decor/blue-abstract-wall-sculpture');
    await expect(page).toHaveURL(
      /\/metal-coating\/product\/blue-abstract-wall-sculpture$/,
      { timeout: 30_000 }
    );

    await page.goto('/home-decor/category/art-work');
    await expect(page).toHaveURL(/\/metal-coating\/category\/art-work$/, {
      timeout: 30_000,
    });
  });

  test('Missing products return 404', async ({ page }) => {
    const response = await page.goto(
      '/metal-coating/product/this-product-does-not-exist'
    );
    expect(response?.status()).toBe(404);
  });
});
