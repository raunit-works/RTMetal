import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const adminStatePath = process.env.STAGING_ADMIN_STATE;
const adminStateExists = Boolean(adminStatePath && fs.existsSync(adminStatePath));

test.describe('admin product pinning', () => {
  test.use({
    storageState: adminStateExists ? adminStatePath : undefined,
    viewport: { width: 1440, height: 1000 },
  });

  test.beforeEach(async ({ page }) => {
    test.skip(!adminStateExists, 'Set STAGING_ADMIN_STATE to an authenticated admin storage state.');

    await page.goto('/admin');
    await page.getByRole('button', { name: /^Products/ }).click();
    await expect(page.getByTestId('admin-product-row').first()).toBeVisible({ timeout: 30000 });
  });

  test('pins, reorders and unpins draft QA products persistently', async ({ page }) => {
    test.setTimeout(120000);

    const rows = page.getByTestId('admin-product-row');
    const plainRow = page.locator('[data-testid="admin-product-row"][data-product-sku="QA-PILOT-PLAIN"]');
    const singleRow = page.locator('[data-testid="admin-product-row"][data-product-sku="QA-PILOT-SINGLE"]');

    await page.getByLabel('Status').selectOption('draft');
    await expect(rows).toHaveCount(3);

    // Pin the first QA product and confirm it moves to the top immediately.
    await plainRow.getByTestId('toggle-pin-product').click();
    await expect(rows.first()).toHaveAttribute('data-product-sku', 'QA-PILOT-PLAIN');
    await expect(plainRow.getByTestId('toggle-pin-product')).toHaveAttribute('aria-pressed', 'true');

    // Pinning a newer product puts it above the previously pinned product.
    await singleRow.getByTestId('toggle-pin-product').click();
    await expect(rows.first()).toHaveAttribute('data-product-sku', 'QA-PILOT-SINGLE');
    await expect(rows.nth(1)).toHaveAttribute('data-product-sku', 'QA-PILOT-PLAIN');

    // Pinned grouping must survive a normal column sort.
    await page.getByLabel('Sort').selectOption('name');
    await expect(rows.first()).toHaveAttribute('data-product-sku', 'QA-PILOT-SINGLE');
    await expect(rows.nth(1)).toHaveAttribute('data-product-sku', 'QA-PILOT-PLAIN');

    // Reload persists the pinned state and pinned-first ordering.
    await page.reload();
    await page.getByRole('button', { name: /^Products/ }).click();
    await page.getByLabel('Status').selectOption('draft');
    await expect(rows.first()).toHaveAttribute('data-product-sku', 'QA-PILOT-SINGLE');
    await expect(rows.nth(1)).toHaveAttribute('data-product-sku', 'QA-PILOT-PLAIN');

    const screenshotDir = path.join('reports', 'phase-3');
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDir, 'admin-products-pinned-desktop.png'),
      fullPage: true,
    });

    // Cleanup through the UI so the QA products return to their normal state.
    await singleRow.getByTestId('toggle-pin-product').click();
    await expect(singleRow.getByTestId('toggle-pin-product')).toHaveAttribute('aria-pressed', 'false');
    await expect(rows.first()).toHaveAttribute('data-product-sku', 'QA-PILOT-PLAIN');

    await plainRow.getByTestId('toggle-pin-product').click();
    await expect(plainRow.getByTestId('toggle-pin-product')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('admin-product-row').filter({ has: page.locator('[aria-pressed="true"]') })).toHaveCount(0);
  });
});
