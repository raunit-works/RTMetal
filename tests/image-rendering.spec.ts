import { test, expect, type Page } from '@playwright/test';

const ROUTES = [
  '/home-decor',
  '/home-decor/category/sculptures-figurines',
];

const MISSING_WIDTH = /missing required "width"/i;

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

/**
 * Extracts the original source URL from a Next.js optimised image src so the
 * same upload can be compared across differently sized renditions.
 */
function sourceUrl(src: string | null): string {
  if (!src) return '';
  const match = /[?&]url=([^&]+)/.exec(src);
  return match ? decodeURIComponent(match[1]) : src;
}

type Diagnostics = {
  consoleErrors: string[];
  pageErrors: string[];
  failedImages: string[];
};

/**
 * Attaches console/page-error listeners and failed-image tracking before the
 * page loads. Next.js throws "Image ... is missing required width property"
 * as a render error, so capturing pageerror is what makes these tests fail when
 * an <Image> is rendered without width/height or an active fill.
 */
function captureDiagnostics(page: Page): Diagnostics {
  const diagnostics: Diagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedImages: [],
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') diagnostics.consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => diagnostics.pageErrors.push(err.message));
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/_next/image') && response.status() >= 400) {
      diagnostics.failedImages.push(`${url} :: HTTP ${response.status()}`);
    }
  });

  return diagnostics;
}

function assertNoMissingWidth(diagnostics: Diagnostics) {
  const all = [...diagnostics.consoleErrors, ...diagnostics.pageErrors];
  const widthErrors = all.filter((text) => MISSING_WIDTH.test(text));
  expect(
    widthErrors,
    `Next.js <Image> rendered without width/height or fill:\n${widthErrors.join('\n')}`
  ).toEqual([]);
}

async function assertAllImagesLoaded(page: Page) {
  // Wait until at least one catalog image element exists in the DOM (covers the
  // dev-server on-demand compile + client hydration delay).
  await page
    .locator('img[src*="catalog-images"]')
    .first()
    .waitFor({ state: 'attached', timeout: 60000 });

  // Trigger lazy-loading for the first catalog image before asserting.
  const catalogImages = page.locator('img[src*="catalog-images"]');
  if (await catalogImages.count()) {
    await catalogImages.first().scrollIntoViewIfNeeded().catch(() => { });
  }

  // Only flag images that finished loading but failed (complete + naturalWidth 0).
  // Lazy images that have not entered the viewport yet are not failures.
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Array.from(document.images).filter(
            (img) => img.complete && img.src && img.naturalWidth === 0
          ).length
        ),
      { timeout: 30000, message: 'an image finished loading with zero width' }
    )
    .toBe(0);

  // At least one real catalog image from Supabase storage must have rendered.
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            Array.from(document.images).filter(
              (img) =>
                img.src.includes('catalog-images') &&
                img.complete &&
                img.naturalWidth > 0
            ).length
        ),
      { timeout: 30000, message: 'no catalog image rendered from storage' }
    )
    .toBeGreaterThan(0);
}

test.describe('home decor image rendering contract', () => {
  for (const route of ROUTES) {
    test(`renders real images without a missing-width crash on ${route}`, async ({
      page,
    }) => {
      const diagnostics = captureDiagnostics(page);

      await page.goto(route, { waitUntil: 'networkidle' });
      await expect(page.locator('h1')).toBeVisible();

      assertNoMissingWidth(diagnostics);
      expect(diagnostics.failedImages, 'optimized image requests failed').toEqual([]);
      await assertAllImagesLoaded(page);
    });
  }

  test('product detail hero and catalog images load from storage', async ({
    page,
  }) => {
    const diagnostics = captureDiagnostics(page);

    await page.goto('/home-decor/ashok-stambh-premium-decorative-showpiece', {
      waitUntil: 'networkidle',
    });

    assertNoMissingWidth(diagnostics);
    await assertAllImagesLoaded(page);

    const storageImages = page.locator('img[src*="/_next/image"][src*="catalog-images"]');
    expect(await storageImages.count()).toBeGreaterThan(0);
  });
});

test.describe('collection variant selection regression', () => {
  test('selecting a finish swaps the card image and updates the enquiry link', async ({
    page,
  }) => {
    const diagnostics = captureDiagnostics(page);
    await page.goto('/home-decor', { waitUntil: 'networkidle' });
    assertNoMissingWidth(diagnostics);

    const card = page
      .getByTestId('product-card')
      .filter({ has: page.getByTestId('finish-swatches') })
      .first();
    await expect(card).toBeVisible();

    const swatches = card.locator('button[data-variant-id]');
    const swatchCount = await swatches.count();
    expect(swatchCount, 'product with finishes should expose swatches').toBeGreaterThan(1);

    const mainImage = card.locator('img').first();
    const beforeSrc = await mainImage.getAttribute('src');
    expect(beforeSrc).toBeTruthy();

    await swatches.nth(1).click();
    await expect(swatches.nth(1)).toHaveAttribute('aria-pressed', 'true');

    const finishName = await swatches.nth(1).getAttribute('data-variant-finish');
    expect(finishName).toBeTruthy();

    await expect
      .poll(async () => mainImage.getAttribute('src'), {
        message: 'card image should switch to the selected finish primary image',
      })
      .not.toBe(beforeSrc);

    // The card CTA is a link into the working enquiry form, pre-filled with the
    // selected product and finish.
    const enquiryLink = card.getByRole('link', { name: 'Enquire Now' });
    await expect(enquiryLink).toHaveCount(1);
    const afterHref = (await enquiryLink.getAttribute('href')) ?? '';
    expect(afterHref).toContain('#contact');
    expect(queryParam(afterHref, 'finish')).toBe(finishName);
    expect(queryParam(afterHref, 'variant')).toBeTruthy();

    await assertAllImagesLoaded(page);
  });

  test('finish selection keeps label, image, variant id and SKU in sync', async ({
    page,
  }) => {
    await page.goto('/home-decor', { waitUntil: 'networkidle' });

    const card = page
      .getByTestId('product-card')
      .filter({ hasText: 'Ashok Stambh' })
      .first();
    await expect(card).toBeVisible();

    const chips = card.locator('button[data-variant-id]');
    await expect(chips).toHaveCount(3);

    // Compact labelled swatches keep long finish names readable in one row.
    const labels = (await chips.allTextContents()).map((label) => label.trim());
    expect(labels).toEqual(['Gold', 'Silver', 'Bronze']);
    await expect(chips.nth(2)).toHaveAttribute('title', 'Antique Bronze');

    const mainImage = card.locator('img').first();
    const beforeSrc = await mainImage.getAttribute('src');
    expect(beforeSrc).toBeTruthy();

    await chips.nth(1).click();
    await expect(chips.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(chips.nth(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(chips.nth(2)).toHaveAttribute('aria-pressed', 'false');

    const variantId = await chips.nth(1).getAttribute('data-variant-id');
    const sku = await chips.nth(1).getAttribute('data-variant-sku');
    expect(variantId).toBeTruthy();
    expect(sku).toBe('ASHOK-STG-SLV');

    // The card image follows the selected finish.
    await expect
      .poll(async () => mainImage.getAttribute('src'), {
        message: 'card image should switch to the selected finish image',
      })
      .not.toBe(beforeSrc);

    // The enquiry destination carries the same variant identity.
    const href =
      (await card.getByRole('link', { name: 'Enquire Now' }).getAttribute('href')) ??
      '';
    expect(queryParam(href, 'variant')).toBe(variantId);
    expect(queryParam(href, 'finish')).toBe('Silver');
    expect(queryParam(href, 'sku')).toBe(sku);
  });

  test('the configured default finish is selected on first render', async ({
    page,
  }) => {
    await page.goto('/home-decor', { waitUntil: 'networkidle' });

    const card = page
      .getByTestId('product-card')
      .filter({ hasText: 'Ashok Stambh' })
      .first();
    await expect(card).toBeVisible();

    const chips = card.locator('button[data-variant-id]');
    await expect(chips).toHaveCount(3);

    // Before any click, the configured default finish is already selected.
    await expect(chips.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(chips.nth(1)).toHaveAttribute('aria-pressed', 'false');
    await expect(chips.nth(2)).toHaveAttribute('aria-pressed', 'false');

    const goldVariantId = await chips.nth(0).getAttribute('data-variant-id');
    const goldSku = await chips.nth(0).getAttribute('data-variant-sku');
    expect(goldVariantId).toBeTruthy();
    expect(goldSku).toBe('ASHOK-STG-GLD');

    // The first rendered card image is the default finish's own image.
    const mainImage = card.locator('img').first();
    const mainSrc = await mainImage.getAttribute('src');
    expect(mainSrc).toBeTruthy();
    const goldSwatchSrc = await chips.nth(0).getAttribute('data-variant-image');
    expect(sourceUrl(mainSrc)).toBe(sourceUrl(goldSwatchSrc));

    // The enquiry destination already carries the default finish.
    const href =
      (await card.getByRole('link', { name: 'Enquire Now' }).getAttribute('href')) ??
      '';
    expect(queryParam(href, 'variant')).toBe(goldVariantId);
    expect(queryParam(href, 'finish')).toBe('Gold');
    expect(queryParam(href, 'sku')).toBe('ASHOK-STG-GLD');

    // Selecting Silver then moves every part of the card to Silver.
    await chips.nth(1).click();
    await expect(chips.nth(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(chips.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(chips.nth(2)).toHaveAttribute('aria-pressed', 'false');

    const silverVariantId = await chips.nth(1).getAttribute('data-variant-id');
    const silverSku = await chips.nth(1).getAttribute('data-variant-sku');
    expect(silverSku).toBe('ASHOK-STG-SLV');

    await expect
      .poll(async () => sourceUrl(await mainImage.getAttribute('src')), {
        message: 'card image should switch to the Silver finish image',
      })
      .toBe(sourceUrl(await chips.nth(1).getAttribute('data-variant-image')));

    const silverHref =
      (await card.getByRole('link', { name: 'Enquire Now' }).getAttribute('href')) ??
      '';
    expect(queryParam(silverHref, 'variant')).toBe(silverVariantId);
    expect(queryParam(silverHref, 'finish')).toBe('Silver');
    expect(queryParam(silverHref, 'sku')).toBe('ASHOK-STG-SLV');
  });

  for (const route of ['/home-decor', '/home-decor/category/sculptures-figurines']) {
    test(`finish swatches stay in one horizontal row without page overflow (${route})`, async ({
      page,
    }) => {
      await page.goto(route, { waitUntil: 'networkidle' });

    const cards = page
      .getByTestId('product-card')
      .filter({ has: page.getByTestId('finish-swatches') });
    const cardCount = await cards.count();
    expect(cardCount, 'at least one product should expose finish swatches').toBeGreaterThan(0);

    for (let index = 0; index < cardCount; index += 1) {
      const card = cards.nth(index);
      const swatches = card.locator('button[data-variant-id]');
      const swatchCount = await swatches.count();

      const layout = await card.getByTestId('finish-swatches').evaluate((container) => {
        const buttons = Array.from(container.querySelectorAll('button[data-variant-id]'));
        const tops = buttons.map((button) => Math.round(button.getBoundingClientRect().top));
        const style = window.getComputedStyle(container);
        return {
          flexWrap: style.flexWrap,
          rowCount: new Set(tops).size,
          buttonCount: buttons.length,
          scrollWidth: container.scrollWidth,
          clientWidth: container.clientWidth,
        };
      });

      expect(layout.flexWrap, 'finish swatches must never wrap').toBe('nowrap');
      expect(layout.rowCount, 'all finish swatches must share one row').toBe(1);
      expect(layout.buttonCount).toBe(swatchCount);
      expect(layout.scrollWidth).toBeGreaterThan(0);
      expect(layout.clientWidth).toBeGreaterThan(0);
    }

    const leopard = page
      .getByTestId('product-card')
      .filter({ hasText: 'Premium Leopard Sculpture' })
      .first();
    const leopardSwatches = leopard.locator('button[data-variant-id]');
    await expect(leopardSwatches).toHaveCount(4);
    expect((await leopardSwatches.allTextContents()).map((label) => label.trim())).toEqual([
      'Gold',
      'Silver',
      'Bronze',
      'Black',
    ]);

      const pageOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      expect(pageOverflow, 'the swatch row must not overflow the page').toBeLessThanOrEqual(1);
    });
  }
});
