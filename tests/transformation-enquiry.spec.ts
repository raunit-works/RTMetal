import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const screenshotDir = path.join('reports', 'phase-3');

test.describe('before/after project enquiry', () => {
  test.beforeAll(() => {
    fs.mkdirSync(screenshotDir, { recursive: true });
  });

  test('sends name and mobile with a blank optional email', async ({ page }) => {
    let payload: Record<string, unknown> | null = null;

    await page.route('**/api/inquiries', async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Enquiry submitted successfully' }),
      });
    });

    await page.goto('/before-after', { waitUntil: 'networkidle' });
    const section = page.locator('#project-enquiry');
    await section.getByRole('button', { name: 'Request a Quote' }).click();
    await expect(page.locator('#project-enquiry-name')).toBeVisible();

    await page.locator('#project-enquiry-name').fill('Project Customer');
    await page.locator('#project-enquiry-phone').fill('9876543210');
    await expect(page.locator('#project-enquiry-email')).toHaveValue('');

    await section.getByRole('button', { name: 'Send Enquiry' }).click();

    await expect(page.getByRole('heading', { name: 'Enquiry received.' })).toBeVisible();
    await section.screenshot({
      path: path.join(screenshotDir, `transformation-enquiry-success-${test.info().project.name}.png`),
    });
    expect(payload).toMatchObject({
      name: 'Project Customer',
      phone: '9876543210',
      email: null,
      division: 'metal_coating',
      inquiry_type: 'service',
    });
  });

  test('blocks a whitespace-only mobile without calling the API', async ({ page }) => {
    let requests = 0;

    await page.route('**/api/inquiries', async (route) => {
      requests += 1;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/before-after', { waitUntil: 'networkidle' });
    const section = page.locator('#project-enquiry');
    await section.getByRole('button', { name: 'Request a Quote' }).click();
    await expect(page.locator('#project-enquiry-name')).toBeVisible();

    await page.locator('#project-enquiry-name').fill('Project Customer');
    await page.locator('#project-enquiry-phone').fill('   ');
    await section.getByRole('button', { name: 'Send Enquiry' }).click();

    await expect(page.locator('#project-enquiry-phone-error')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Enquiry received.' })).toHaveCount(0);
    await section.screenshot({
      path: path.join(screenshotDir, `transformation-enquiry-validation-${test.info().project.name}.png`),
    });
    expect(requests).toBe(0);
  });
});
