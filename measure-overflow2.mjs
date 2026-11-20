import { chromium, devices } from 'playwright';

const BASE = 'http://localhost:3010';

const CASES = [
  { route: '/about', label: 'About Us', vp: { width: 320, height: 844 }, dev: devices['Desktop Chrome'] },
  { route: '/about', label: 'About Us (mobile)', vp: { width: 320, height: 844 }, dev: devices['Pixel 5'] },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const c of CASES) {
    const context = await browser.newContext({ ...c.dev, viewport: c.vp });
    const page = await context.newPage();
    await page.goto(BASE + c.route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const ov = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const w = Math.max(doc.scrollWidth, body.scrollWidth) - doc.clientWidth;
      return { overflow: w, docScrollWidth: Math.max(doc.scrollWidth, body.scrollWidth), clientWidth: doc.clientWidth };
    });
    console.log(c.label + ' @ ' + c.vp.width + 'px -> overflow=' + ov.overflow + ' scrollWidth=' + ov.docScrollWidth + ' clientWidth=' + ov.clientWidth);
    await context.close();
  }
  await browser.close();
})();
