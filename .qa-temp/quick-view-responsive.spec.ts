import { expect, test } from '@playwright/test';

const viewports = [
  [320, 568],
  [375, 667],
  [393, 852],
  [768, 1024],
  [1024, 1366],
  [1440, 900],
];

test('quick view fits each viewport without page-level horizontal overflow', async ({ page }) => {
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.goto('/metal-coating/product/botanical-leaf-wall-artwork');

    await page.locator('div.group.relative').first().hover();
    const quickViewButton = page.locator('button[aria-label="Quick view"]').first();
    await expect(quickViewButton).toBeVisible({ timeout: 8000 });
    await quickViewButton.click();

    const dialog = page.getByRole('dialog', { name: /Quick view:/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close quick view' })).toBeVisible();
    await expect(dialog.locator('text=View Full Details').first()).toBeVisible();
    await expect(dialog.locator('img').first()).toBeVisible();

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(horizontalOverflow).toBe(false);

    await dialog.getByRole('button', { name: 'Close quick view' }).click();
    await expect(dialog).not.toBeVisible();
  }
});
