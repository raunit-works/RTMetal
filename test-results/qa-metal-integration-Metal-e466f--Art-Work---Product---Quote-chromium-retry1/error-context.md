# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: qa-metal-integration.spec.ts >> Metal division integration journey >> Metal Services -> Collections -> Art Work -> Product -> Quote
- Location: qa-metal-integration.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#navbar-services-menu')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('#navbar-services-menu') with timeout 5000ms
  - waiting for locator('#navbar-services-menu')

```

```yaml
- banner:
  - navigation:
    - link "RT Metal Coating — Home":
      - /url: /
      - img "RT Metal Coating"
    - list:
      - listitem:
        - link "Home":
          - /url: /
      - listitem:
        - link "Home Decor":
          - /url: /home-decor
          - text: Home Decor
          - img
      - listitem:
        - link "Metal Services":
          - /url: /metal-coating
          - text: Metal Services
          - img
      - listitem:
        - link "Gallery":
          - /url: /before-after
      - listitem:
        - link "About":
          - /url: /about
      - listitem:
        - link "Contact":
          - /url: /#contact
    - button "WhatsApp":
      - img
      - text: WhatsApp
    - link "Sign In":
      - /url: /login
      - img
      - text: Sign In
- main:
  - paragraph: METAL COATING & FINISHING
  - heading "Metal Coating & Finishing" [level=1]
  - paragraph: Coating, refinishing and decorative surface finishes for metal components, fabrication work and custom projects. Explore our services and finish samples, or share your requirements for a quotation.
  - link "Explore Our Services":
    - /url: "#services"
    - text: Explore Our Services
    - img
  - link "Enquire About a Project":
    - /url: "#quote"
    - text: Enquire About a Project
    - img
  - region "Metal Coating & Finishing":
    - paragraph: Our Metal Coating Services
    - heading "Metal Coating & Finishing" [level=2]
    - paragraph: Explore our coating, restoration and decorative finishing services. Select a service to learn more about the process and discuss your project requirements.
    - article:
      - img "PVD Coating service"
      - heading "PVD Coating" [level=3]
      - paragraph: Thin-film surface finishing for selected decorative components, with an emphasis on appearance, sheen and substrate compatibility.
      - link "Explore PVD Coating":
        - /url: /metal-coating/pvd-coating
        - text: Explore Service
    - article:
      - img "Electroplating service"
      - heading "Electroplating" [level=3]
      - paragraph: Electrochemical metal finishing for components requiring a specified decorative or functional surface layer.
      - link "Explore Electroplating":
        - /url: /metal-coating/electroplating
        - text: Explore Service
    - article:
      - img "PU Coating service"
      - heading "PU Coating" [level=3]
      - paragraph: Polyurethane-based surface finishing for suitable components where appearance and protective coating requirements are important.
      - link "Explore PU Coating":
        - /url: /metal-coating/pu-coating
        - text: Explore Service
    - article:
      - img "Powder Coating service"
      - heading "Powder Coating" [level=3]
      - paragraph: Dry-powder surface finishing for suitable components, using coating application and controlled curing.
      - link "Explore Powder Coating":
        - /url: /metal-coating/powder-coating
        - text: Explore Service
    - article:
      - img "Decorative Metal Finishing service"
      - heading "Decorative Metal Finishing" [level=3]
      - paragraph: Appearance-focused metal surface treatments for decorative, architectural and interior applications.
      - link "Explore Decorative Metal Finishing":
        - /url: /metal-coating/decorative-metal-finishing
        - text: Explore Service
    - article:
      - img "Metal Restoration & Refinishing service"
      - heading "Metal Restoration & Refinishing" [level=3]
      - paragraph: Assessment, surface preparation and refinishing of worn or aged metal components.
      - link "Explore Metal Restoration & Refinishing":
        - /url: /metal-coating/metal-restoration
        - text: Explore Service
  - region "Finish Selections for Designers & Architects":
    - paragraph: Architect Selection Board
    - heading "Finish Selections for Designers & Architects" [level=2]
    - paragraph: Explore our collection of 12 approved metal finish references for architectural and decorative projects. Compare appearances, review finish IDs and enquire about suitability for your requirements.
    - paragraph: 12 Finish References
    - paragraph: Compare Appearances
    - paragraph: Enquiry-Based Selection
    - link "Enquire About Finishes":
      - /url: "#quote"
      - text: Enquire About Finishes
      - img
    - link "Browse the Finish Selection":
      - /url: "#finish-board"
      - text: Browse the Finish Selection
      - img
    - paragraph: Photographs are visual references only. Availability, substrate suitability and technical specifications are confirmed during enquiry.
    - paragraph: Finish Library
    - heading "Explore the Collection" [level=3]
    - text: 12 visual references
    - article:
      - button "Enlarge Brown Antique":
        - img "FIN-0003 Brown Antique metal finish sample"
        - img
        - text: Enlarge
      - button "Add Brown Antique to comparison":
        - img
        - text: Compare
      - button "Save Brown Antique for this visit":
        - img
      - heading "Brown Antique" [level=3]
      - text: FIN-0003 Appearance | Antique appearance Applications|Confirm material and intended use on enquiry.
      - link "Enquire about this finish":
        - /url: "#quote"
        - text: Enquire about this finish
        - img
    - article:
      - button "Enlarge Rustic Iron Finish":
        - img "FIN-0004 Rustic Iron Finish metal finish sample"
        - img
        - text: Enlarge
      - button "Add Rustic Iron Finish to comparison":
        - img
        - text: Compare
      - button "Save Rustic Iron Finish for this visit":
        - img
      - heading "Rustic Iron Finish" [level=3]
      - text: FIN-0004 Appearance | Rustic appearance Applications|Confirm material and intended use on enquiry.
      - link "Enquire about this finish":
        - /url: "#quote"
        - text: Enquire about this finish
        - img
    - article:
      - button "Enlarge Deep Blue Finish":
        - img "FIN-0013 Deep Blue metal finish sample"
        - img
        - text: Enlarge
      - button "Add Deep Blue Finish to comparison":
        - img
        - text: Compare
      - button "Save Deep Blue Finish for this visit":
        - img
      - heading "Deep Blue Finish" [level=3]
      - text: FIN-0013 Appearance | Decorative finish reference Applications|Confirm material and intended use on enquiry.
      - link "Enquire about this finish":
        - /url: "#quote"
        - text: Enquire about this finish
        - img
    - article:
      - button "Enlarge Rose Gold Hairline":
        - img "FIN-0041 Rose Gold Hairline metal finish sample"
        - img
        - text: Enlarge
      - button "Add Rose Gold Hairline to comparison":
        - img
        - text: Compare
      - button "Save Rose Gold Hairline for this visit":
        - img
      - heading "Rose Gold Hairline" [level=3]
      - text: FIN-0041 Appearance | Hairline appearance Applications|Confirm material and intended use on enquiry.
      - link "Enquire about this finish":
        - /url: "#quote"
        - text: Enquire about this finish
        - img
    - article:
      - button "Enlarge Rose Gold Mirror":
        - img "FIN-0044 Rose Gold Mirror metal finish sample"
        - img
        - text: Enlarge
      - button "Add Rose Gold Mirror to comparison":
        - img
        - text: Compare
      - button "Save Rose Gold Mirror for this visit":
        - img
      - heading "Rose Gold Mirror" [level=3]
      - text: FIN-0044 Appearance | Reflective appearance Applications|Confirm material and intended use on enquiry.
      - link "Enquire about this finish":
        - /url: "#quote"
        - text: Enquire about this finish
        - img
    - article:
      - button "Enlarge Graphite Mirror":
        - img "FIN-0045 Graphite Mirror metal finish sample"
        - img
        - text: Enlarge
      - button "Add Graphite Mirror to comparison":
        - img
        - text: Compare
      - button "Save Graphite Mirror for this visit":
        - img
      - heading "Graphite Mirror" [level=3]
      - text: FIN-0045 Appearance | Reflective appearance Applications|Confirm material and intended use on enquiry.
      - link "Enquire about this finish":
        - /url: "#quote"
        - text: Enquire about this finish
        - img
    - paragraph: 01/02
    - button "Show finish page 1"
    - button "Show finish page 2"
    - button "Previous finish page":
      - img
    - button "Next finish page":
      - img
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
  - paragraph: Industries We Serve
  - heading "Built for every sector." [level=2]
  - paragraph: From single pieces to full production runs, we serve clients across industries who demand finish quality without compromise.
  - img
  - text: Architecture
  - img
  - text: Interior Design
  - img
  - text: Hospitality
  - img
  - text: Real Estate
  - img
  - text: Automotive
  - img
  - text: Furniture
  - img
  - text: Sculpture & Art
  - img
  - text: Retail Fixtures
  - paragraph: Before & After
  - heading "The transformation." [level=2]
  - paragraph: See the difference our coatings make — from raw substrate to premium finish.
  - img "Surface restoration — worn to refinished before"
  - img "Surface restoration — worn to refinished after"
  - text: Before After
  - paragraph: Surface restoration — worn to refinished
  - paragraph: Hover to reveal the finished result
  - img "Decorative metal finishing before"
  - img "Decorative metal finishing after"
  - text: Before After
  - paragraph: Decorative metal finishing
  - paragraph: Hover to reveal the finished result
  - img "Coating process — application to result before"
  - img "Coating process — application to result after"
  - text: Before After
  - paragraph: Coating process — application to result
  - paragraph: Hover to reveal the finished result
  - paragraph: The Process
  - heading "From brief to finish." [level=2]
  - paragraph: Every coating project moves through five considered stages — transparent at each step.
  - img
  - paragraph: Step 01
  - heading "Consultation" [level=3]
  - paragraph: We begin with a conversation to understand your vision, materials, timeline and performance requirements.
  - img
  - paragraph: Step 02
  - heading "Specification" [level=3]
  - paragraph: Our team develops a precise coating specification — finish, colour, texture and durability targets.
  - img
  - paragraph: Step 03
  - heading "Surface Preparation" [level=3]
  - paragraph: Meticulous cleaning, stripping and pre-treatment to ensure a flawless, long-lasting bond.
  - img
  - paragraph: Step 04
  - heading "Application" [level=3]
  - paragraph: Coatings applied in a controlled environment using calibrated equipment for uniform coverage.
  - img
  - paragraph: Step 05
  - heading "Quality Inspection" [level=3]
  - paragraph: Every piece is inspected against our quality standards before it leaves the workshop.
  - paragraph: Premium Finishes
  - heading "A finish for every vision." [level=2]
  - paragraph: Polished, brushed, satin, matte or patinated — we develop the finish your project demands.
  - paragraph: Polished Brass
  - paragraph: Brushed Gold
  - paragraph: Satin Nickel
  - paragraph: Matte Black
  - paragraph: Workshop & Work
  - heading "Inside the workshop" [level=2]
  - paragraph: Reels and posts from the coating floor — process, machinery and completed projects.
  - button "Previous reel" [disabled]:
    - img
  - button "Reel 1"
  - img
  - text: "@rtmetalcoating"
  - paragraph: Workshop Reel 01
  - button "Reel 2"
  - img
  - text: "@rtmetalcoating"
  - paragraph: Workshop Reel 02
  - button "Reel 3"
  - img
  - text: "@rtmetalcoating"
  - paragraph: Workshop Reel 03
  - button "Reel 4"
  - img
  - text: "@rtmetalcoating"
  - paragraph: Workshop Reel 04
  - button "Reel 5"
  - img
  - text: "@rtmetalcoating"
  - paragraph: Workshop Reel 05
  - button "Reel 6"
  - img
  - text: "@rtmetalcoating"
  - paragraph: Workshop Reel 06
  - button "Reel 7"
  - img
  - text: "@rtmetalcoating"
  - paragraph: Workshop Reel 07
  - button "Next reel":
    - img
  - link "Follow Our Work on Instagram":
    - /url: https://www.instagram.com/rtmetalcoating/
    - img
    - text: Follow Our Work on Instagram
  - paragraph: Request a Quote
  - heading "Tell us about your project." [level=2]
  - paragraph: Share your material, finish, quantity and timeline — we will respond with a tailored proposal within one business day.
  - textbox "Your name *"
  - textbox "Email address *"
  - textbox "Phone number (optional)"
  - textbox "Finish reference (FIN ID) — optional"
  - textbox "Project details — material, finish, quantity, timeline *"
  - button "Request Quote":
    - text: Request Quote
    - img
  - img
  - text: Chat on WhatsApp
  - paragraph: Two divisions, one standard
  - heading "Explore the collection too." [level=2]
  - paragraph: While you are here, discover our home decor and lifestyle pieces — designed with the same attention to material and craft.
  - link "Shop Home Decor":
    - /url: /home-decor
    - text: Shop Home Decor
    - img
  - link "Back to Home":
    - /url: /
- contentinfo:
  - link "RTMETALCOATING homepage":
    - /url: /
    - img "RTMETALCOATING"
  - paragraph: Metal coating, surface finishing and decorative products for residential, commercial and architectural projects.
  - paragraph: RTMETALCOATING
  - paragraph: Metal Coating & Decorative Finishing Services Mumbai, Maharashtra, India
  - paragraph: RT HOME DECOR
  - paragraph: Online Home Decoration Store Wai, Satara, Maharashtra, India
  - link "Instagram":
    - /url: https://www.instagram.com/rtmetalcoating/
    - img
  - button "WhatsApp contact pending" [disabled]:
    - img
  - button "Email contact pending" [disabled]:
    - img
  - heading "Collections" [level=3]
  - list:
    - listitem:
      - link "Home Decor":
        - /url: /home-decor?category=home-decor
    - listitem:
      - link "Decorative Accessories":
        - /url: /home-decor?category=decorative-accessories
    - listitem:
      - link "Gift Articles":
        - /url: /home-decor?category=gift-articles
    - listitem:
      - link "Lifestyle Products":
        - /url: /home-decor?category=lifestyle-products
    - listitem:
      - link "Household Products":
        - /url: /home-decor?category=household-products
    - listitem:
      - link "Daily Utility":
        - /url: /home-decor?category=daily-utility
  - heading "Services" [level=3]
  - list:
    - listitem:
      - link "MS Coating":
        - /url: /metal-coating#ms-coating
    - listitem:
      - link "Brass Coating":
        - /url: /metal-coating#brass-coating
    - listitem:
      - link "Decorative Finishing":
        - /url: /metal-coating#decorative-metal-finishing
    - listitem:
      - link "Premium Surface Finishing":
        - /url: /metal-coating#premium-surface-finishing
    - listitem:
      - link "Custom Metal Coating":
        - /url: /metal-coating#custom-metal-coating
    - listitem:
      - link "Architectural Finishes":
        - /url: /metal-coating#architectural-metal-finishes
  - heading "Company" [level=3]
  - list:
    - listitem:
      - link "About":
        - /url: /about
    - listitem:
      - link "Before & After":
        - /url: /before-after
    - listitem:
      - link "Our Process":
        - /url: /#process
    - listitem:
      - link "Testimonials":
        - /url: /#testimonials
    - listitem:
      - link "Contact":
        - /url: /#contact
  - heading "Get in Touch" [level=3]
  - list:
    - listitem:
      - img
      - text: Business address pending client approval
    - listitem:
      - img
      - text: +91 76660 67782
    - listitem:
      - img
      - text: studio@aurumandco.com
  - paragraph:
    - img
    - text: Metal Coating Location
  - heading "Find Us in Mumbai" [level=3]
  - paragraph: Kumbharwada, Mumbai 400004
  - iframe
  - link "View on Google Maps":
    - /url: https://maps.app.goo.gl/wtmGuotpv7b35y8W6
    - img
    - text: View on Google Maps
  - paragraph: © 2026 RTMETALCOATING. All rights reserved.
  - link "Privacy":
    - /url: /
  - link "Terms":
    - /url: /
- alert
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
> 37  |       await expect(menu).toBeVisible();
      |                          ^ Error: expect(locator).toBeVisible() failed
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
  56  |     await expect(collections).toContainText(/2\s*pieces/);
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
```