import { test, expect, type Page } from '@playwright/test';

const ASHOK_CARD = 'div.group.relative.flex.h-full.flex-col';

/**
 * Reads a query parameter from a possibly relative href.
 */
function queryParam(href: string, name: string): string | null {
  try {
    return new URL(href, 'http://localhost').searchParams.get(name);
  } catch {
    return null;
  }
}

async function ashokCard(page: Page) {
  const card = page.locator(ASHOK_CARD).filter({ hasText: 'Ashok Stambh' }).first();
  await expect(card).toBeVisible();
  return card;
}

test.describe('customer enquiry action', () => {
  test('the card CTA opens the enquiry form pre-filled with the selected finish', async ({
    page,
  }) => {
    await page.goto('/home-decor', { waitUntil: 'networkidle' });
    const card = await ashokCard(page);

    await card.locator('button[data-variant-id]').nth(1).click();

    const href = await card.getByRole('link', { name: 'Enquire Now' }).getAttribute('href');
    expect(queryParam(href ?? '', 'finish')).toBe('Silver');
    expect(queryParam(href ?? '', 'sku')).toBe('ASHOK-STG-SLV');
    expect(href).toContain('#contact');

    await card.getByRole('link', { name: 'Enquire Now' }).click();

    await page.waitForURL(/[?&]finish=Silver/);
    await page.waitForURL(/#contact$/);

    const message = page.locator('#contact textarea');
    await expect(message).toBeVisible();
    await expect(message).toHaveValue(/Ashok Stambh/);
    await expect(message).toHaveValue(/Finish: Silver/);
    await expect(message).toHaveValue(/SKU: ASHOK-STG-SLV/);
  });

  test('submitting the pre-filled enquiry sends the product and finish to the enquiry API', async ({
    page,
  }) => {
    // Intercept the API call so the test verifies the customer payload and the
    // success state without writing a row into the staging database.
    let payload: Record<string, unknown> | null = null;
    await page.route('**/api/inquiries', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      payload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Enquiry submitted successfully',
        }),
      });
    });

    await page.goto('/home-decor', { waitUntil: 'networkidle' });
    const card = await ashokCard(page);
    await card.locator('button[data-variant-id]').nth(1).click();
    const href = await card.getByRole('link', { name: 'Enquire Now' }).getAttribute('href');
    const variantId = await card
      .locator('button[data-variant-id]')
      .nth(1)
      .getAttribute('data-variant-id');

    await card.getByRole('link', { name: 'Enquire Now' }).click();
    await page.waitForURL(/#contact$/);

    await page.locator('#contact input[placeholder="Your name"]').fill('Test Customer');
    await page
      .locator('#contact input[placeholder="+91 98765 43210"]')
      .fill('+91 98765 43210');
    await page.locator('#contact input[placeholder="you@email.com"]').fill(
      'test.customer@example.com'
    );

    await page.getByRole('button', { name: /Send Enquiry/i }).click();

    await expect.poll(() => payload, { timeout: 15000 }).toBeTruthy();
    const body = payload as unknown as Record<string, unknown>;

    expect(body.division).toBe('home_decor');
    expect(body.inquiry_type).toBe('product');
    expect(body.variant_id).toBe(variantId);
    expect(body.product_id).toBeTruthy();
    expect(String(body.message)).toContain('Finish: Silver');
    expect(String(body.message)).toContain('SKU: ASHOK-STG-SLV');
    expect(String(body.name)).toBe('Test Customer');

    // The customer sees a success confirmation.
    await expect(page.getByText(/Message sent successfully/i)).toBeVisible();
  });

  test('accepts an enquiry with name and mobile while email is blank', async ({ page }) => {
    let payload: Record<string, unknown> | null = null;
    await page.route('**/api/inquiries', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      payload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Enquiry submitted successfully',
        }),
      });
    });

    await page.goto('/#contact', { waitUntil: 'networkidle' });
    await page.locator('#contact input[placeholder="Your name"]').fill('Mobile Only Customer');
    await page
      .locator('#contact input[placeholder="+91 98765 43210"]')
      .fill('+91 98765 43210');
    await page
      .locator('#contact textarea')
      .fill('Please share availability and a quotation for this product.');

    await page.getByRole('button', { name: /Send Enquiry/i }).click();

    await expect.poll(() => payload, { timeout: 15000 }).toBeTruthy();
    const body = payload as unknown as Record<string, unknown>;
    expect(body.name).toBe('Mobile Only Customer');
    expect(body.phone).toBe('+91 98765 43210');
    expect(body.email).toBeNull();
    await expect(page.getByText(/Message sent successfully/i)).toBeVisible();
  });

  test('rejects whitespace-only name and mobile before calling the API', async ({ page }) => {
    let apiCalls = 0;
    await page.route('**/api/inquiries', async (route) => {
      apiCalls += 1;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Unexpected' }),
      });
    });

    await page.goto('/#contact', { waitUntil: 'networkidle' });
    await page.locator('#contact input[placeholder="Your name"]').fill('   ');
    await page
      .locator('#contact input[placeholder="+91 98765 43210"]')
      .fill('+91 98765 43210');
    await page
      .locator('#contact textarea')
      .fill('Please share availability and a quotation for this product.');
    await page.getByRole('button', { name: /Send Enquiry/i }).click();

    await expect(page.getByText(/Please enter your name/i)).toBeVisible();

    await page.locator('#contact input[placeholder="Your name"]').fill('Valid Customer');
    await page.locator('#contact input[placeholder="+91 98765 43210"]').fill('   ');
    await page.getByRole('button', { name: /Send Enquiry/i }).click();

    await expect(page.getByText(/Please enter your mobile number/i)).toBeVisible();
    expect(apiCalls).toBe(0);
  });

  test('the enquiry API is live and rejects invalid input before any database write', async ({
    request,
  }) => {
    const response = await request.post('/api/inquiries', {
      data: { name: 'x', email: 'not-an-email', message: 'short' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBeTruthy();
  });
});
