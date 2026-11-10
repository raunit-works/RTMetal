# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: qa-metal-integration.spec.ts >> Metal division integration journey >> Metal Services -> Collections -> Art Work -> Product -> Quote
- Location: qa-metal-integration.spec.ts:9:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#collections')
Expected pattern: /2\s*pieces/
Received string:  "Metal Product CollectionsBrowse our metalwork categoriesExplore decorative art, architectural details and custom metal products. Open a collection to view available designs and enquire about your requirements.Art WorkDecorative Wall Art & Metal InstallationsExplore decorative wall art, sculptural pieces, patterned panels and architectural features for interior spaces. Browse the designs and enquire about the available materials, finishes, dimensions and custom requirements.3 piecesView Collection →"
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('#collections') with timeout 5000ms
  - waiting for locator('#collections')
    13 × locator resolved to <section id="collections" class="scroll-mt-24 py-20 sm:py-28">…</section>
       - unexpected value "Metal Product CollectionsBrowse our metalwork categoriesExplore decorative art, architectural details and custom metal products. Open a collection to view available designs and enquire about your requirements.Art WorkDecorative Wall Art & Metal InstallationsExplore decorative wall art, sculptural pieces, patterned panels and architectural features for interior spaces. Browse the designs and enquire about the available materials, finishes, dimensions and custom requirements.3 piecesView Collection →"

```

```yaml
- paragraph: Metal Product Collections
- heading "Browse our metalwork categories" [level=2]
- paragraph: Explore decorative art, architectural details and custom metal products. Open a collection to view available designs and enquire about your requirements.
- link "Art Work Art Work Decorative Wall Art & Metal Installations Explore decorative wall art, sculptural pieces, patterned panels and architectural features for interior spaces. Browse the designs and enquire about the available materials, finishes, dimensions and custom requirements. 3 pieces View Collection →":
  - /url: /metal-coating/category/art-work
  - img "Art Work"
  - heading "Art Work" [level=3]
  - paragraph: Decorative Wall Art & Metal Installations
  - paragraph: Explore decorative wall art, sculptural pieces, patterned panels and architectural features for interior spaces. Browse the designs and enquire about the available materials, finishes, dimensions and custom requirements.
  - text: 3 pieces View Collection →
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { PRINCIPAL_SERVICE_GROUPS } from '@/lib/principal-service-groups';
  3   | 
  4   | test.describe.configure({ mode: 'serial' });
  5   | 
  6   | test.describe('Metal division integration journey', () => {
  7   |   test.setTimeout(120_000);
  8   | 
  9   |   test('Metal Services -> Collections -> Art Work -> Product -> Quote', async ({
  10  |     page,
  11  |   }) => {
  12  |     const mobile = (page.viewportSize()?.width ?? 1280) < 1024;
  13  | 
  14  |     await page.goto('/metal-coating', { waitUntil: 'networkidle' });
  15  |     await expect(page.locator('#services')).toBeVisible();
  16  | 
  17  |     if (mobile) {
  18  |       await page.getByRole('button', { name: 'Open menu' }).click();
  19  |       for (const group of PRINCIPAL_SERVICE_GROUPS) {
  20  |         await expect(
  21  |           page.getByRole('link', { name: group.name, exact: true })
  22  |         ).toBeVisible();
  23  |       }
  24  |       await expect(
  25  |         page.getByRole('link', { name: 'View Metal Collections', exact: true })
  26  |       ).toBeVisible();
  27  |       await page
  28  |         .getByRole('link', { name: 'View Metal Collections', exact: true })
  29  |         .click();
  30  |     } else {
  31  |       await page
  32  |         .locator('a[href="/metal-coating"]')
  33  |         .filter({ hasText: 'Metal Services' })
  34  |         .first()
  35  |         .hover();
  36  |       const menu = page.locator('#navbar-services-menu');
  37  |       await expect(menu).toBeVisible();
  38  |       for (const group of PRINCIPAL_SERVICE_GROUPS) {
  39  |         await expect(
  40  |           menu.locator(`a[href="/metal-coating/${group.slug}"]`)
  41  |         ).toHaveCount(1);
  42  |       }
  43  |       await expect(
  44  |         menu.locator('a[href^="/metal-coating/category/"]')
  45  |       ).toHaveCount(0);
  46  |       await menu
  47  |         .getByRole('menuitem', { name: 'View Metal Collections' })
  48  |         .click();
  49  |     }
  50  | 
  51  |     await expect(page).toHaveURL(/\/metal-coating#collections$/, {
  52  |       timeout: 30_000,
  53  |     });
  54  |     const collections = page.locator('#collections');
  55  |     await expect(collections).toBeInViewport();
> 56  |     await expect(collections).toContainText(/2\s*pieces/);
      |                               ^ Error: expect(locator).toContainText(expected) failed
  57  | 
  58  |     const artWorkLink = collections.locator(
  59  |       'a[href="/metal-coating/category/art-work"]'
  60  |     );
  61  |     await expect(artWorkLink).toBeVisible();
  62  |     await artWorkLink.scrollIntoViewIfNeeded();
  63  |     await artWorkLink.click();
  64  | 
  65  |     await expect(page).toHaveURL(/\/metal-coating\/category\/art-work$/, {
  66  |       timeout: 30_000,
  67  |     });
  68  |     await expect(
  69  |       page.getByRole('heading', { name: 'Art Work', level: 1 })
  70  |     ).toBeVisible();
  71  |     await expect(
  72  |       page.getByRole('heading', { name: 'Blue Abstract Wall Sculpture' })
  73  |     ).toBeVisible();
  74  |     await expect(
  75  |       page.getByRole('heading', { name: 'Botanical Leaf Wall Artwork' })
  76  |     ).toBeVisible();
  77  | 
  78  |     const productLinks = page.locator(
  79  |       'a[href="/metal-coating/product/blue-abstract-wall-sculpture"]'
  80  |     );
  81  |     await expect(productLinks.first()).toBeVisible();
  82  |     await productLinks.first().click();
  83  | 
  84  |     await expect(page).toHaveURL(
  85  |       /\/metal-coating\/product\/blue-abstract-wall-sculpture$/,
  86  |       { timeout: 30_000 }
  87  |     );
  88  |     await expect(
  89  |       page.getByRole('heading', { name: 'Blue Abstract Wall Sculpture', level: 1 })
  90  |     ).toBeVisible();
  91  | 
  92  |     const galleryImages = page.locator('img[src*="catalog-images"]');
  93  |     expect(await galleryImages.count()).toBeGreaterThanOrEqual(4);
  94  |     await expect(page.getByText(/5\.0\s*Rating/)).toHaveCount(0);
  95  |     await expect(page.getByText(/custom patinas/i)).toHaveCount(0);
  96  |     await expect(page.getByText('Color / Finish')).toBeVisible();
  97  |     await expect(page.getByText('Material:', { exact: true })).toHaveCount(0);
  98  | 
  99  |     const quoteLink = page.locator('a[href="/metal-coating#quote"]').first();
  100 |     await expect(quoteLink).toBeVisible();
  101 |     await quoteLink.click();
  102 | 
  103 |     await expect(page.locator('#quote')).toBeInViewport();
  104 |     await expect(page.locator('#quote')).toContainText(
  105 |       'Tell us about your project'
  106 |     );
  107 |     await expect(
  108 |       page.locator('#quote input[placeholder*="Your name"]')
  109 |     ).toBeVisible();
  110 |   });
  111 | 
  112 |   test('All six coating-service routes remain reachable', async ({ page }) => {
  113 |     for (const group of PRINCIPAL_SERVICE_GROUPS) {
  114 |       const response = await page.goto(`/metal-coating/${group.slug}`, {
  115 |         waitUntil: 'domcontentloaded',
  116 |       });
  117 |       expect(response?.status()).toBe(200);
  118 |       await expect(
  119 |         page.getByRole('heading', { name: group.name, level: 1 })
  120 |       ).toBeVisible();
  121 |     }
  122 |   });
  123 | 
  124 |   test('Home Decor stays separate from the Metal division', async ({ page }) => {
  125 |     await page.goto('/home-decor', { waitUntil: 'networkidle' });
  126 |     await expect(
  127 |       page.getByRole('heading', { name: /Home Decor/i, level: 1 })
  128 |     ).toBeVisible();
  129 |     await expect(
  130 |       page.locator('a[href="/metal-coating/category/art-work"]')
  131 |     ).toHaveCount(0);
  132 | 
  133 |     await page.goto('/home-decor/blue-abstract-wall-sculpture');
  134 |     await expect(page).toHaveURL(
  135 |       /\/metal-coating\/product\/blue-abstract-wall-sculpture$/,
  136 |       { timeout: 30_000 }
  137 |     );
  138 | 
  139 |     await page.goto('/home-decor/category/art-work');
  140 |     await expect(page).toHaveURL(/\/metal-coating\/category\/art-work$/, {
  141 |       timeout: 30_000,
  142 |     });
  143 |   });
  144 | 
  145 |   test('Missing products return 404', async ({ page }) => {
  146 |     const response = await page.goto(
  147 |       '/metal-coating/product/this-product-does-not-exist'
  148 |     );
  149 |     expect(response?.status()).toBe(404);
  150 |   });
  151 | });
  152 | 
```