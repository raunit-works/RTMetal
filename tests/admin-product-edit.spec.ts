import { expect, test } from '@playwright/test';

/**
 * Focused Admin product-row edit test.
 *
 * Requires a saved staging Admin session (never committed) plus an exact QA
 * product identifier. It is skipped unless both environment values are set, so
 * the default suite never authenticates against staging.
 *
 *   STAGING_ADMIN_STATE=C:/path/outside/repo/staging-admin-state.json
 *   STAGING_QA_PRODUCT_ID=<uuid>
 *   STAGING_QA_PRODUCT_SKU=QA-PILOT-PLAIN
 */
const statePath = process.env.STAGING_ADMIN_STATE;
const productId = process.env.STAGING_QA_PRODUCT_ID;
const productSku = process.env.STAGING_QA_PRODUCT_SKU ?? 'QA-PILOT-PLAIN';

test.use({
  storageState: statePath,
  viewport: { width: 1440, height: 900 },
});

test.describe('Admin product row edit', () => {
  test.skip(
    !statePath || !productId,
    'Requires STAGING_ADMIN_STATE and STAGING_QA_PRODUCT_ID'
  );

  test('opens the exact verified product by ID and loads its persisted data', async ({
    page,
  }  ) => {
    if (!productId) throw new Error('STAGING_QA_PRODUCT_ID is required');

    await page.goto('/admin', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Products/ }).first().click();

    const search = page.getByPlaceholder(/Search product name/);
    await search.fill(productSku);

    const row = page.locator(
      `[data-testid="admin-product-row"][data-product-id="${productId}"]`
    );
    await expect(row).toBeVisible();

    // Exactly one row may claim this product ID.
    await expect(
      page.locator(`[data-testid="admin-product-row"][data-product-id="${productId}"]`)
    ).toHaveCount(1);

    await row.getByTestId('edit-product-button').click();

    await expect(page.getByText('Edit Product', { exact: true })).toBeVisible();
    await expect(page.getByTestId('product-editing-id')).toHaveAttribute(
      'data-editing-id',
      productId
    );
    await expect(page.getByPlaceholder('Brass Vessel')).not.toHaveValue('');
    await expect(page.getByPlaceholder('RTM-BRS-001')).toHaveValue(productSku);
    await expect(page.locator('#prod-category')).toHaveValue(/.+/);

    // Product-level main image preview must resolve to a real URL.
    await expect(page.locator('img[alt="Preview"]')).toHaveAttribute(
      'src',
      /^https?:\/\//
    );
  });
});
