import { test, expect, type Page } from '@playwright/test';

const FINISH_TOGGLE =
  'label:has-text("This product has multiple finishes/colours") input[type="checkbox"]';
const FINISH_NAME = 'input[id^="finish-name-"]';
const FINISH_SKU = 'input[id^="finish-sku-"]';
const FINISH_STOCK = 'input[id^="finish-stock-"]';
const IMAGE_INPUT = 'input[type="file"][multiple]';
const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
]);

async function openEditor(page: Page) {
  await page.goto('/dev/product-variants-harness', { waitUntil: 'domcontentloaded' });
  const toggleLabel = page.getByText('This product has multiple finishes/colours');
  await expect(toggleLabel).toBeVisible({ timeout: 15000 });

  const toggle = page.locator(FINISH_TOGGLE);
  await toggle.scrollIntoViewIfNeeded();
  await expect(toggle).toBeEnabled();

  // Ensure the editor is enabled and the finish inputs are rendered.
  await toggle.setChecked(true, { force: true });
  try {
    await expect(page.locator(FINISH_NAME)).toBeVisible({ timeout: 8000 });
  } catch {
    await toggleLabel.click({ force: true });
    await toggle.setChecked(true, { force: true });
    await expect(page.locator(FINISH_NAME)).toBeVisible({ timeout: 15000 });
  }
}

async function readJson(page: Page, testId: string) {
  return JSON.parse((await page.getByTestId(testId).textContent()) ?? 'null');
}

test.describe('product variants editor component flow', () => {
  test('accepts Silver from the real input through validation and save', async ({
    page,
  }) => {
    await openEditor(page);

    await page.locator(FINISH_NAME).fill('Silver');
    await expect(page.locator(FINISH_NAME)).toHaveValue('Silver');

    const drafts = await readJson(page, 'editor-drafts');
    expect(drafts).toHaveLength(1);
    expect(drafts[0].finishName).toBe('Silver');

    await page.locator(FINISH_SKU).fill('RTM-ASHOK-SLV');
    await page.locator(FINISH_STOCK).fill('4');

    await page.getByTestId('product-validate').click();
    await expect(page.getByTestId('validation-result')).toHaveText('accepted');

    await page.getByTestId('product-save').click();
    await expect(page.getByTestId('save-result')).toHaveText('saved');

    const saved = await readJson(page, 'saved-db');
    expect(saved.options[0].values[0].name).toBe('Silver');
    expect(saved.variants).toHaveLength(1);
    expect(saved.variants[0].finishName).toBe('Silver');
    expect(saved.variants[0].sku).toBe('RTM-ASHOK-SLV');
    expect(saved.variants[0].stockQuantity).toBe(4);
    expect(saved.variants[0].isDefault).toBe(true);

    const reloadedDrafts = await readJson(page, 'editor-drafts');
    expect(reloadedDrafts[0].finishName).toBe('Silver');
    expect(reloadedDrafts[0].sku).toBe('RTM-ASHOK-SLV');
  });

  test('still rejects an empty and a whitespace-only finish name', async ({
    page,
  }) => {
    await openEditor(page);

    await page.locator(FINISH_NAME).fill('');
    await page.getByTestId('product-validate').click();
    await expect(page.getByTestId('validation-result')).toContainText(
      'enter a finish name'
    );

    await page.locator(FINISH_NAME).fill('   ');
    await page.getByTestId('product-validate').click();
    await expect(page.getByTestId('validation-result')).toContainText(
      'enter a finish name'
    );

    const drafts = await readJson(page, 'editor-drafts');
    expect(drafts[0].finishName).toBe('   ');
  });

  test('blocks Save while a finish image is still uploading', async ({
    page,
  }) => {
    await openEditor(page);
    await page.locator(FINISH_NAME).fill('Silver');

    await page.getByTestId('hold-uploads').check();
    await page.locator(IMAGE_INPUT).setInputFiles({
      name: 'silver.png',
      mimeType: 'image/png',
      buffer: PNG,
    });

    await expect(page.getByText('silver.png — uploading...')).toBeVisible();

    await page.getByTestId('product-save').click();
    await expect(page.getByTestId('save-result')).toContainText(
      'Wait for 1 finish image to finish uploading before saving.'
    );
    await expect(page.getByTestId('save-attempts')).toHaveText('0');

    await page.getByTestId('release-uploads').click();
    await expect(page.getByText('silver.png — uploading...')).toHaveCount(0);

    await page.getByTestId('product-save').click();
    await expect(page.getByTestId('save-result')).toHaveText('saved');

    const saved = await readJson(page, 'saved-db');
    expect(saved.variants[0].finishName).toBe('Silver');
    expect(saved.variants[0].images).toHaveLength(1);
    expect(saved.variants[0].images[0].variantId).toBe(
      saved.variants[0].id
    );
  });

  test('shows a failed upload, blocks Save, and succeeds after Retry', async ({
    page,
  }) => {
    await openEditor(page);
    await page.locator(FINISH_NAME).fill('Silver');

    await page.getByTestId('fail-next-upload').check();
    await page.locator(IMAGE_INPUT).setInputFiles({
      name: 'silver.png',
      mimeType: 'image/png',
      buffer: PNG,
    });

    await expect(
      page.getByText(/Storage upload failed \(HTTP 500\): simulated storage outage/)
    ).toBeVisible();

    await page.getByTestId('product-save').click();
    await expect(page.getByTestId('save-result')).toContainText(
      'failed to upload'
    );
    await expect(page.getByTestId('save-result')).toContainText(
      'simulated storage outage'
    );
    await expect(page.getByTestId('save-attempts')).toHaveText('0');

    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0);
    await expect(page.getByAltText('Silver').first()).toBeVisible();

    await page.getByTestId('product-save').click();
    await expect(page.getByTestId('save-result')).toHaveText('saved');

    const saved = await readJson(page, 'saved-db');
    expect(saved.variants[0].images).toHaveLength(1);
    expect(saved.variants[0].images[0].variantId).toBe(
      saved.variants[0].id
    );
  });
});
