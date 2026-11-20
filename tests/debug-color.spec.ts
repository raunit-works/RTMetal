import { test, expect } from '@playwright/test';
import { devices } from 'playwright';

test('debug: computed color of text-gold-deep', async ({ page }) => {
  await page.goto('/home-decor/seated-dog-figurine-grey-white-wa0006', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const color = await page.evaluate(() => {
    const el = document.querySelector('.tracking-ultra.text-gold-deep.text-xs');
    if (!el) return 'not found';
    return window.getComputedStyle(el).color;
  });
  console.log('DEBUG COMPUTED COLOR:', color);
});
