const { chromium } = require('@playwright/test');

const base = 'http://127.0.0.1:3100';
const routes = [
  '/',
  '/metal-coating',
  '/metal-coating/category/art-work',
  '/metal-coating/product/blue-abstract-wall-sculpture',
  '/home-decor',
];
const widths = [320, 390, 1280];

(async () => {
  const browser = await chromium.launch();
  let failures = 0;

  for (const route of routes) {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const consoleErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => consoleErrors.push(error.message));

      const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      const status = response ? response.status() : 0;
      const ok = status === 200 && overflow <= 1 && consoleErrors.length === 0;
      if (!ok) failures += 1;
      console.log(JSON.stringify({ route, width, status, overflow, ok, consoleErrors }));
      await page.close();
    }
  }

  const api = await fetch(`${base}/api/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const apiBody = await api.json().catch(() => ({}));
  const apiOk = api.status === 400 && typeof apiBody.message === 'string';
  if (!apiOk) failures += 1;
  console.log(JSON.stringify({ apiValidation: { status: api.status, ok: apiOk, message: apiBody.message } }));

  const quote = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await quote.goto(`${base}/metal-coating?service=electroplating#quote`, { waitUntil: 'domcontentloaded' });
  await quote.waitForTimeout(1200);
  const prefill = await quote.locator('textarea').first().inputValue();
  const prefillOk = prefill.includes('Electroplating');
  if (!prefillOk) failures += 1;
  console.log(JSON.stringify({ enquiryPrefill: prefillOk, prefill: prefill.slice(0, 100) }));
  await quote.close();

  await browser.close();
  console.log(failures === 0 ? 'REGRESSION_CHECKS_OK' : `REGRESSION_FAILURES=${failures}`);
  process.exit(failures === 0 ? 0 : 1);
})();
