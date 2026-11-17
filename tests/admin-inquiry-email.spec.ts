import { expect, test } from '@playwright/test';
import fs from 'node:fs';

const adminStatePath = process.env.STAGING_ADMIN_STATE;
const adminStateExists = Boolean(adminStatePath && fs.existsSync(adminStatePath));

test.describe('admin inquiry identity display', () => {
  test.use({
    storageState: adminStateExists ? adminStatePath : undefined,
    viewport: { width: 1440, height: 1000 },
  });

  test('shows Not provided for a null email and deletes the QA lead', async ({ page }) => {
    test.skip(!adminStateExists, 'Set STAGING_ADMIN_STATE to an authenticated admin storage state.');

    await page.goto('/admin');
    await page.getByRole('button', { name: /^Inquiries \/ Leads/ }).click();
    await expect(page.getByRole('heading', { name: /Customer Inquiry Leads/ })).toBeVisible();

    const search = page.getByRole('searchbox', { name: 'Search records' });
    await search.fill('QA Nullable Email 20261117');

    const lead = page.locator('div.rounded-2xl').filter({ hasText: 'QA Nullable Email 20261117' }).first();
    await expect(lead).toBeVisible({ timeout: 30000 });
    await expect(lead.getByText('Not provided')).toBeVisible();
    await expect(lead.getByText('9876543210')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await lead.getByRole('button', { name: 'Delete Lead' }).click();
    await expect(page.getByText('Inquiry deleted successfully.')).toBeVisible();
    await expect(page.getByText('QA Nullable Email 20261117')).toHaveCount(0);
  });
});
