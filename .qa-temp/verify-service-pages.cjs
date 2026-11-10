const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const base = 'http://127.0.0.1:3100';
const slugs = [
  'pvd-coating',
  'electroplating',
  'pu-coating',
  'powder-coating',
  'decorative-metal-finishing',
  'metal-restoration',
];
const widths = [320, 375, 390, 768, 1024, 1280, 1440];
const shotsDir = 'C:\\Users\\ACER\\AppData\\Local\\Temp\\opencode\\rt-shots';

(async () => {
  fs.mkdirSync(shotsDir, { recursive: true });
  const browser = await chromium.launch();
  let failures = 0;

  for (const slug of slugs) {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const consoleErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => consoleErrors.push(error.message));

      await page.goto(`${base}/metal-coating/${slug}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);

      const result = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const hero = document.querySelector('section');
        const heroImage = hero ? hero.querySelector('img') : null;
        const ctas = [...document.querySelectorAll('a[href*="?service="]')];
        const body = document.body;
        return {
          h1: h1 ? h1.textContent.trim() : '',
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          imageLoaded: heroImage ? heroImage.complete && heroImage.naturalWidth > 0 : false,
          ctaCount: ctas.length,
          ctaHref: ctas[0] ? ctas[0].getAttribute('href') : null,
          hasBreadcrumb: Boolean(document.querySelector('nav[aria-label="Breadcrumb"]')),
          materialCards: document.querySelectorAll('article').length,
          bodyText: body.innerText.slice(0, 50),
        };
      });

      const overflowOk = result.overflow <= 1;
      const ok =
        result.h1.length > 0 &&
        overflowOk &&
        result.imageLoaded &&
        result.ctaCount > 0 &&
        result.ctaHref.includes(`service=${slug}`) &&
        result.hasBreadcrumb &&
        consoleErrors.length === 0;

      if (!ok) failures += 1;
      console.log(
        JSON.stringify({
          slug,
          width,
          ok,
          h1: result.h1,
          overflow: result.overflow,
          imageLoaded: result.imageLoaded,
          ctaHref: result.ctaHref,
          materials: result.materialCards,
          consoleErrors,
        })
      );

      if ((width === 1440 || width === 390) && (slug === 'electroplating' || slug === 'pvd-coating')) {
        await page.screenshot({
          path: path.join(shotsDir, `${slug}-${width}.png`),
          fullPage: true,
        });
      }

      await page.close();
    }
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${base}/metal-coating?service=pvd-coating#quote`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const prefill = await page.locator('textarea').first().inputValue();
  const prefilled = prefill.includes('PVD Coating');
  if (!prefilled) failures += 1;
  console.log(JSON.stringify({ prefillCheck: prefilled, prefill: prefill.slice(0, 120) }));
  await page.close();

  await browser.close();
  console.log(failures === 0 ? 'BROWSER_CHECKS_OK' : `BROWSER_FAILURES=${failures}`);
  process.exit(failures === 0 ? 0 : 1);
})();
