import { test, expect, type Page } from '@playwright/test';
import {
  buildWhatsAppUrl,
  getHomeDecorWhatsAppContacts,
  getMetalCoatingWhatsAppContact,
  getWhatsAppContactOptions,
  siteSettings,
} from '@/lib/site';
import { buildRichProductEnquiryMessage } from '@/lib/product-variants/enquiry';

const HOME_DECOR_PRIMARY = '917977314013';
const HOME_DECOR_SECONDARY = '919082867541';
const METAL_COATING = '917666067782';

function messageFromHref(href: string | null): string {
  if (!href) return '';
  return new URL(href).searchParams.get('text') ?? '';
}

test.describe('WhatsApp contact configuration', () => {
  test('division numbers are the supplied verified numbers', () => {
    expect(siteSettings.whatsapp.homeDecor).toBe(HOME_DECOR_PRIMARY);
    expect(siteSettings.whatsapp.homeDecorSecondary).toBe(HOME_DECOR_SECONDARY);
    expect(siteSettings.whatsapp.metalCoating).toBe(METAL_COATING);
    expect(siteSettings.whatsapp.homeDecorVerified).toBe(true);
    expect(siteSettings.whatsapp.homeDecorSecondaryVerified).toBe(true);
    expect(siteSettings.whatsapp.metalCoatingVerified).toBe(true);
  });

  test('wa.me URL uses digits only and safely encoded text', () => {
    const url = buildWhatsAppUrl('+91 79773 14013', 'Hello & welcome\nLine 2');
    expect(url.startsWith('https://wa.me/917977314013?text=')).toBe(true);
    expect(url).not.toContain('+91');
    expect(url).not.toContain('\n');
    expect(messageFromHref(url)).toBe('Hello & welcome\nLine 2');
  });

  test('Home Decor exposes both contacts in primary-then-secondary order', () => {
    const contacts = getHomeDecorWhatsAppContacts('Product enquiry');
    expect(contacts.map((contact) => contact.number)).toEqual([
      HOME_DECOR_PRIMARY,
      HOME_DECOR_SECONDARY,
    ]);
    for (const contact of contacts) {
      expect(contact.url.startsWith(`https://wa.me/${contact.number}?text=`)).toBe(true);
      expect(messageFromHref(contact.url)).toBe('Product enquiry');
    }
  });

  test('Metal Services has one direct contact', () => {
    const contact = getMetalCoatingWhatsAppContact('Service enquiry');
    expect(contact?.number).toBe(METAL_COATING);
    expect(messageFromHref(contact?.url ?? null)).toBe('Service enquiry');
  });

  test('general mode offers Metal and both Home Decor contacts', () => {
    const contacts = getWhatsAppContactOptions('general', 'General enquiry');
    expect(contacts.map((contact) => contact.number)).toEqual([
      METAL_COATING,
      HOME_DECOR_PRIMARY,
      HOME_DECOR_SECONDARY,
    ]);
  });

  test('rich message includes product, category, selected finish, SKU and link', () => {
    const message = buildRichProductEnquiryMessage({
      division: 'home_decor',
      productName: 'Ashok Stambh – Premium Decorative Showpiece',
      category: 'sculptures-figurines',
      variant: { finishName: 'Silver', sku: 'ASHOK-STG-SLV' },
      productUrl: 'http://localhost:3010/home-decor/ashok-stambh-premium-decorative-showpiece',
    });

    expect(message).toContain('Home Decor product');
    expect(message).toContain('Product: Ashok Stambh – Premium Decorative Showpiece');
    expect(message).toContain('Category: Sculptures Figurines');
    expect(message).toContain('Selected Finish: Silver');
    expect(message).toContain('SKU: ASHOK-STG-SLV');
    expect(message).toContain(
      'Product Link: http://localhost:3010/home-decor/ashok-stambh-premium-decorative-showpiece'
    );
  });

  test('rich message keeps a human-readable category name unchanged', () => {
    const message = buildRichProductEnquiryMessage({
      division: 'home_decor',
      productName: 'Ashok Stambh',
      category: 'Sculptures & Figurines',
    });
    expect(message).toContain('Category: Sculptures & Figurines');
  });

  test('rich message omits absent finish, SKU and link', () => {
    const message = buildRichProductEnquiryMessage({
      division: 'metal_services',
      productName: 'Lotus-Inspired Metal Sculpture',
    });

    expect(message).toContain('Metal product');
    expect(message).not.toContain('Selected Finish:');
    expect(message).not.toContain('SKU:');
    expect(message).not.toContain('Product Link:');
  });
});

async function homeDecorAshokCard(page: Page) {
  await page.goto('/home-decor', { waitUntil: 'networkidle' });
  const card = page
    .getByTestId('product-card')
    .filter({ hasText: 'Ashok Stambh' })
    .first();
  await expect(card).toBeVisible({ timeout: 30000 });
  return card;
}

test.describe('WhatsApp enquiry routing', () => {
  test('Home Decor product card offers both contacts with a product-specific message', async ({
    page,
  }) => {
    const card = await homeDecorAshokCard(page);
    const silver = card.locator('button[data-variant-sku="ASHOK-STG-SLV"]');
    await silver.click();
    await expect(silver).toHaveAttribute('aria-pressed', 'true');

    await card.getByTestId('whatsapp-chooser-trigger').click();

    const chooser = page.getByTestId('whatsapp-chooser');
    await expect(chooser).toBeVisible();

    const options = chooser.getByTestId('whatsapp-contact-option');
    await expect(options).toHaveCount(2);
    await expect(options.nth(0)).toHaveAttribute('data-contact-number', HOME_DECOR_PRIMARY);
    await expect(options.nth(1)).toHaveAttribute('data-contact-number', HOME_DECOR_SECONDARY);

    const text = messageFromHref(await options.first().getAttribute('href'));
    expect(text).toContain('Product: Ashok Stambh');
    expect(text).toContain('Category: Sculptures Figurines');
    expect(text).toContain('Selected Finish: Silver');
    expect(text).toContain('SKU: ASHOK-STG-SLV');
    expect(text).toContain('/home-decor/ashok-stambh-premium-decorative-showpiece');

    await chooser.getByRole('button', { name: 'Cancel' }).click();
    await expect(chooser).toBeHidden();
  });

  test('Metal Services opens the Metal contact directly without a chooser', async ({ page }) => {
    await page.goto('/metal-coating', { waitUntil: 'networkidle' });

    const directLink = page.getByTestId('whatsapp-direct-link').first();
    await expect(directLink).toHaveAttribute('data-contact-number', METAL_COATING);
    await expect(directLink).toHaveAttribute('href', /^https:\/\/wa\.me\/917666067782\?text=/);
    await expect(page.getByTestId('whatsapp-chooser-trigger')).toHaveCount(0);
  });

  test('general pages present Metal and both Home Decor contacts', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page
      .getByTestId('whatsapp-chooser-trigger')
      .filter({ visible: true })
      .first()
      .click();

    const options = page.getByTestId('whatsapp-chooser').getByTestId('whatsapp-contact-option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveAttribute('data-contact-number', METAL_COATING);
    await expect(options.nth(1)).toHaveAttribute('data-contact-number', HOME_DECOR_PRIMARY);
    await expect(options.nth(2)).toHaveAttribute('data-contact-number', HOME_DECOR_SECONDARY);
  });

  test('product detail sends the selected finish and SKU to Home Decor contacts', async ({
    page,
  }) => {
    await page.goto('/home-decor/ashok-stambh-premium-decorative-showpiece', {
      waitUntil: 'networkidle',
    });

    const silver = page.getByRole('radio', { name: 'Silver' }).first();
    await expect(silver).toBeVisible({ timeout: 30000 });
    await silver.click();
    await expect(silver).toHaveAttribute('aria-checked', 'true');

    await page
      .getByRole('button', { name: 'Enquire About Product' })
      .first()
      .click();

    const options = page.getByTestId('whatsapp-chooser').getByTestId('whatsapp-contact-option');
    await expect(options).toHaveCount(2);

    const text = messageFromHref(await options.first().getAttribute('href'));
    expect(text).toContain('Category: Sculptures & Figurines');
    expect(text).toContain('Selected Finish: Silver');
    expect(text).toContain('SKU: ASHOK-STG-SLV');
    expect(text).toContain('/home-decor/ashok-stambh-premium-decorative-showpiece');
  });
});
