import { expect, test } from '@playwright/test';

test('quick view opens, preserves buttons, and switches gallery thumbnails when present', async ({ page }) => {
  await page.goto('/metal-coating/product/botanical-leaf-wall-artwork');

  await page.locator('div.group.relative').first().hover();
  const quickViewButtons = page.locator('button[aria-label="Quick view"]');
  await expect(quickViewButtons.first()).toBeVisible({ timeout: 10000 });
  await quickViewButtons.first().click();

  const dialog = page.getByRole('dialog', { name: /Quick view:/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close quick view' })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'View Full Details' }).first()).toBeVisible();
  await expect(dialog.locator('text=Enquire via WhatsApp').first()).toBeVisible();

  const mainImage = dialog.locator('img').first();
  const thumbnails = dialog.locator('button[aria-pressed]');
  const count = await thumbnails.count();

  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const thumbnail = thumbnails.nth(i);
      const thumbnailImg = thumbnail.locator('img');
      await thumbnail.click();
      await expect(thumbnail).toHaveAttribute('aria-pressed', 'true');
      const thumbnailSrc = await thumbnailImg.getAttribute('src');
      if (thumbnailSrc) {
        await expect(mainImage).toHaveAttribute('src', thumbnailSrc);
      }
    }
  } else {
    await expect(dialog.locator('text=More Images')).not.toBeVisible();
  }

  await dialog.getByRole('button', { name: 'Close quick view' }).click();
  await expect(dialog).not.toBeVisible();

  await page.locator('div.group.relative').first().hover();
  await expect(quickViewButtons.first()).toBeVisible({ timeout: 10000 });
  await quickViewButtons.first().click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close quick view' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close quick view' }).click();
  await expect(dialog).not.toBeVisible();
});
