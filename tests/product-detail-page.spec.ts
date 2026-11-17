import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const productPath = '/home-decor/seated-dog-figurine-grey-white-wa0006';
const screenshotDir = path.join('reports', 'phase-3');

async function revealPage(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.6));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 90));
    }
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
}

async function expectProductDetail(page: Page) {
  await page.goto(productPath);

  await expect(page.getByRole('heading', { level: 1, name: 'Seated Dog Figurine – Grey and White' })).toBeVisible();
  await expect(page.getByText('Grey-and-white seated dog figurine for home display.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Product Description' })).toBeVisible();
  await expect(
    page.getByText('A seated dog figurine with grey and white colour detailing.', { exact: false })
  ).toBeVisible();

  const featureList = page.getByRole('heading', { name: 'Product Features' }).locator('..').locator('li');
  await expect(featureList).toHaveCount(3);
  await expect(featureList.nth(0)).toContainText('Seated dog design');
  await expect(featureList.nth(1)).toContainText('Grey and white colour detailing');
  await expect(featureList.nth(2)).toContainText('Decorative shelf or tabletop piece');
}

test.describe('product detail page', () => {
  test.beforeAll(() => {
    fs.mkdirSync(screenshotDir, { recursive: true });
  });

  test('splits legacy newline features from the staging catalogue into separate rows', async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/metal-coating/product/metal-p0026-abstract-continuous-line-wall-sculpture');

    const featureList = page.getByRole('heading', { name: 'Product Features' }).locator('..').locator('li');
    await expect(featureList).toHaveCount(4);
    await expect(featureList.nth(0)).toHaveText('Continuous-line inspired design');
    await expect(featureList.nth(1)).toHaveText('Abstract sculptural composition');
    await expect(featureList.nth(2)).toHaveText('Flowing organic forms');
    await expect(featureList.nth(3)).toHaveText('Contemporary wall decoration');

    await revealPage(page);
    await page.screenshot({
      path: path.join(screenshotDir, 'legacy-product-features-desktop.png'),
      fullPage: true,
    });
  });

  test('splits legacy newline features on the Home Decor detail route', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/home-decor/bird-figurines-decorative-base-wa0013');

    const featureList = page.getByRole('heading', { name: 'Product Features' }).locator('..').locator('li');
    await expect(featureList).toHaveCount(3);
    await expect(featureList.nth(0)).toHaveText('Bird-themed sculptural design');
    await expect(featureList.nth(1)).toHaveText('Decorative base');
    await expect(featureList.nth(2)).toHaveText('Suitable for tabletop display');
  });

  test('desktop shows short description, full description and separate feature rows', async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expectProductDetail(page);
    await revealPage(page);

    await page.screenshot({
      path: path.join(screenshotDir, 'seated-dog-product-detail-desktop.png'),
      fullPage: true,
    });
  });

  test('tablet shows the same separated feature rows', async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 768, height: 1024 });
    await expectProductDetail(page);
    await revealPage(page);

    await page.screenshot({
      path: path.join(screenshotDir, 'seated-dog-product-detail-tablet.png'),
      fullPage: true,
    });
  });

  test('mobile shows the same separated feature rows', async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 390, height: 844 });
    await expectProductDetail(page);
    await revealPage(page);

    await page.screenshot({
      path: path.join(screenshotDir, 'seated-dog-product-detail-mobile.png'),
      fullPage: true,
    });
  });
});
