import { expect, test } from '@playwright/test';

test('public product page renders persisted gallery images and thumbnail selection', async ({ page }) => {
  await page.goto('/metal-coating/product/botanical-leaf-wall-artwork');

  const thumbnails = page.locator('button[aria-label^="View image"]');
  await expect(thumbnails.first()).toBeVisible();

  const count = await thumbnails.count();
  expect(count).toBeGreaterThanOrEqual(4);

  await thumbnails.nth(1).click();
  await expect(thumbnails.nth(1)).toHaveAttribute('aria-pressed', 'true');

  const brokenImages = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button[aria-label^="View image"] img')).filter(
      (image) => image.complete && (image as HTMLImageElement).naturalWidth === 0
    ).length
  );
  expect(brokenImages).toBe(0);
});
