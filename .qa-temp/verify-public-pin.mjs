import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const baseURL = process.env.PW_BASE_URL || 'http://localhost:3012';
const statePath = process.env.ADMIN_STATE || path.join('.qa-temp', 'staging-admin-state.json');
const targetName = process.env.PIN_PRODUCT_NAME || 'Ashok Stambh';
const resultPath = path.join('.qa-temp', 'pin-verification.json');
const timeout = 30000;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: statePath,
  viewport: { width: 1440, height: 1000 },
});
const admin = await context.newPage();
const publicPage = await context.newPage();
const result = { baseURL, targetName, startedAt: new Date().toISOString() };
let pinned = false;

async function openAdminProducts() {
  await admin.goto(`${baseURL}/admin`, { waitUntil: 'domcontentloaded' });
  await admin.getByRole('button', { name: /^Products/ }).click();
  await admin.getByTestId('admin-product-row').first().waitFor({ state: 'visible', timeout });
}

async function filterToTarget() {
  const search = admin.getByPlaceholder(/Search product name/i);
  await search.fill(targetName);
  const row = admin
    .locator('[data-testid="admin-product-row"]', { hasText: targetName })
    .first();
  await row.waitFor({ state: 'visible', timeout });
  return row;
}

async function readPublicFirst() {
  await publicPage.goto(`${baseURL}/home-decor`, { waitUntil: 'networkidle' });
  const firstCard = publicPage.getByTestId('product-card').first();
  await firstCard.waitFor({ state: 'visible', timeout });
  return {
    id: await firstCard.getAttribute('data-product-id'),
    name: (await firstCard.locator('h3').first().innerText()).trim(),
  };
}

async function waitForFirstCardId(expectedId) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const first = await readPublicFirst();
    if (first.id === expectedId) return first;
    await publicPage.waitForTimeout(1000);
  }
  return readPublicFirst();
}

try {
  await openAdminProducts();
  let row = await filterToTarget();
  const pinButton = row.getByTestId('toggle-pin-product');
  await pinButton.waitFor({ state: 'visible', timeout });

  result.productId = await row.getAttribute('data-product-id');
  result.productSku = await row.getAttribute('data-product-sku');
  assert.ok(result.productId, 'Admin row has no product id.');

  if ((await pinButton.getAttribute('aria-pressed')) === 'true') {
    result.preExistingPin = true;
    await pinButton.click();
    await pinButton.waitFor({ state: 'visible', timeout });
    for (let i = 0; i < 30; i += 1) {
      if ((await pinButton.getAttribute('aria-pressed')) === 'false') break;
      await admin.waitForTimeout(250);
    }
    assert.equal(await pinButton.getAttribute('aria-pressed'), 'false', 'Could not clear pre-existing pin.');
    row = await filterToTarget();
  } else {
    result.preExistingPin = false;
  }

  const before = await readPublicFirst();
  result.beforeFirst = before;

  const cardForTarget = publicPage.locator(`[data-testid="product-card"][data-product-id="${result.productId}"]`);
  result.targetVisiblePublicly = (await cardForTarget.count()) > 0;
  assert.ok(result.targetVisiblePublicly, `${targetName} is not in the public /home-decor collection.`);

  await row.getByTestId('toggle-pin-product').click();
  pinned = true;
  for (let i = 0; i < 40; i += 1) {
    row = await filterToTarget();
    if ((await row.getByTestId('toggle-pin-product').getAttribute('aria-pressed')) === 'true') break;
    await admin.waitForTimeout(250);
  }
  assert.equal(
    await row.getByTestId('toggle-pin-product').getAttribute('aria-pressed'),
    'true',
    'Admin did not report the product as pinned.'
  );
  result.adminPinConfirmed = true;

  const after = await waitForFirstCardId(result.productId);
  result.afterFirst = after;
  assert.equal(after.id, result.productId, 'Pinned product is not first in the public collection.');
  assert.match(after.name.toLowerCase(), /ashok stambh/, 'First public card is not the pinned product.');

  result.publicFirstAfterPin = true;
  console.log('VERIFIED: pinned product appears first in the public collection.');
} catch (error) {
  result.error = error instanceof Error ? error.message : String(error);
  console.error(result.error);
} finally {
  if (pinned) {
    try {
      await openAdminProducts();
      const row = await filterToTarget();
      const pinButton = row.getByTestId('toggle-pin-product');
      if ((await pinButton.getAttribute('aria-pressed')) === 'true') {
        await pinButton.click();
        for (let i = 0; i < 40; i += 1) {
          if ((await pinButton.getAttribute('aria-pressed')) === 'false') break;
          await admin.waitForTimeout(250);
        }
      }
      result.unpinned = (await pinButton.getAttribute('aria-pressed')) === 'false';
      const restored = await readPublicFirst();
      result.afterRestoreFirst = restored;
      result.restored = restored.id === result.beforeFirst?.id;
      if (!result.unpinned || !result.restored) {
        result.cleanupError = 'Cleanup did not fully restore the original public order.';
      }
      console.log(
        result.unpinned && result.restored
          ? 'CLEANUP: product unpinned and public order restored.'
          : `CLEANUP WARNING: ${result.cleanupError}`
      );
    } catch (cleanupError) {
      result.cleanupError = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
      console.error(`CLEANUP FAILED: ${result.cleanupError}`);
    }
  }

  result.finishedAt = new Date().toISOString();
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Evidence: ${resultPath}`);
  await browser.close();
  if (result.error || result.cleanupError) process.exitCode = 1;
}
