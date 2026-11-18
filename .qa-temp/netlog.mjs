import { chromium } from 'playwright';

const BASE = process.env.PERF_BASE_URL ?? 'http://localhost:3011';
const paths = (process.env.PATHS ?? '/').split(',');

const browser = await chromium.launch();
for (const path of paths) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const seen = [];
  page.on('response', (response) => {
    const request = response.request();
    seen.push({
      url: response.url(),
      status: response.status(),
      type: request.resourceType(),
      method: request.method(),
    });
  });
  await page.goto(`${BASE}${path}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const grouped = {};
  for (const item of seen) {
    (grouped[item.type] ??= []).push(item);
  }
  console.log(`\n=== ${path} ===`);
  for (const [type, items] of Object.entries(grouped)) {
    console.log(`\n[${type}] ${items.length}`);
    for (const item of items) {
      console.log(`  ${item.status} ${item.method} ${item.url}`);
    }
  }
  await context.close();
}
await browser.close();
