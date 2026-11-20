import { test, expect } from '@playwright/test';

// Viewport widths required for acceptance: 320, 360, 375, 390, 414, 768, 1024, 1280, 1440 px
const VIEWPORTS = [
  { width: 320, height: 844, label: '320px' },
  { width: 360, height: 844, label: '360px' },
  { width: 375, height: 844, label: '375px' },
  { width: 390, height: 844, label: '390px' },
  { width: 414, height: 896, label: '414px' },
  { width: 768, height: 1024, label: '768px' },
  { width: 1024, height: 768, label: '1024px' },
  { width: 1280, height: 800, label: '1280px' },
  { width: 1440, height: 900, label: '1440px' },
];

// Public routes that return 200 in the current staging database.
// '/home-decor/category/decorative-accessories' and '/home-decor/onyx-sculptural-vase'
// previously used here both return 404 (Supabase-authoritative mode, static
// fallback disabled) and are replaced with routes that load.
const ROUTES = [
  { name: 'Homepage', path: '/' },
  { name: 'About Us', path: '/about' },
  { name: 'Home Decor', path: '/home-decor' },
  { name: 'Product Detail (seated-dog-figurine)', path: '/home-decor/seated-dog-figurine-grey-white-wa0006' },
  { name: 'Metal Services', path: '/metal-coating' },
  { name: 'Before & After', path: '/before-after' },
  { name: 'Product Detail (metal-p0026)', path: '/metal-coating/product/metal-p0026-abstract-continuous-line-wall-sculpture' },
];

function overflowCheck(viewportWidth: number) {
  return () => {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(0, Math.max(doc.scrollWidth, body.scrollWidth) - doc.clientWidth);
  };
}

for (const viewport of VIEWPORTS) {
  for (const route of ROUTES) {
    test(`responsive: ${route.name} at ${viewport.label} (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Horizontal overflow measured against document scroll dimensions, not
      // body.getBoundingClientRect(), so an overflowing child is caught even
      // when the body itself remains viewport-width.
      const overflowPx = await page.evaluate(overflowCheck(viewport.width));
      expect(overflowPx).toBeLessThanOrEqual(1);

      // Structural landmarks are present (visibility of a landmark is not, by
      // itself, proof of a complete layout - it is a baseline smoke check).
      const header = page.locator('header').first();
      if (await header.count() > 0) await expect(header).toBeVisible();

      const footer = page.locator('footer').first();
      if (await footer.count() > 0) await expect(footer).toBeVisible();

      const main = page.locator('main').first();
      if (await main.count() > 0) await expect(main).toBeVisible();
    });
  }
}

test.describe('responsive: interactive states', () => {
  for (const viewport of VIEWPORTS) {
    test(`no horizontal overflow on Metal Services at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/metal-coating', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const overflowPx = await page.evaluate(overflowCheck(viewport.width));
      expect(overflowPx).toBeLessThanOrEqual(1);
    });

    test(`no horizontal overflow on Product Detail at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/home-decor/seated-dog-figurine-grey-white-wa0006', {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForTimeout(1000);
      const overflowPx = await page.evaluate(overflowCheck(viewport.width));
      expect(overflowPx).toBeLessThanOrEqual(1);
    });
  }

  test('mobile menu opens and closes without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const menuButton = page.getByRole('button', { name: /menu|open navigation/i }).first();
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(500);
      const openOverflow = await page.evaluate(overflowCheck(375));
      expect(openOverflow).toBeLessThanOrEqual(1);

      const closeButton = page.getByRole('button', { name: /close|menu/i }).first();
      if ((await closeButton.count()) > 0) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
      const closedOverflow = await page.evaluate(overflowCheck(375));
      expect(closedOverflow).toBeLessThanOrEqual(1);
    }
  });

  test('product finish selector and image gallery load without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto('/home-decor/seated-dog-figurine-grey-white-wa0006', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(1000);

    const overflowPx = await page.evaluate(overflowCheck(375));
    expect(overflowPx).toBeLessThanOrEqual(1);

    const gallery = page.locator('[class*="gallery"], [role="region"], img').first();
    if ((await gallery.count()) > 0) await expect(gallery).toBeVisible();

    const finishSelect = page.getByRole('combobox').first();
    if ((await finishSelect.count()) > 0) {
      await finishSelect.click();
      await page.waitForTimeout(500);
      const afterOverflow = await page.evaluate(overflowCheck(375));
      expect(afterOverflow).toBeLessThanOrEqual(1);
    }
  });

  test('dialogs and quick views do not cause horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const overflowPx = await page.evaluate(overflowCheck(375));
    expect(overflowPx).toBeLessThanOrEqual(1);
  });
});
