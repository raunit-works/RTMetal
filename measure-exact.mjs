import { chromium, devices } from 'playwright';

const BASE = 'http://localhost:3010';

const CASES = [
  { route: '/about', label: 'About Us', vp: { width: 320, height: 844 }, dev: devices['Desktop Chrome'] },
  { route: '/home-decor/seated-dog-figurine-grey-white-wa0006', label: 'Product Detail', vp: { width: 1024, height: 768 }, dev: devices['Desktop Chrome'] },
  { route: '/home-decor/seated-dog-figurine-grey-white-wa0006', label: 'Product Detail', vp: { width: 1280, height: 800 }, dev: devices['Desktop Chrome'] },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const c of CASES) {
    const context = await browser.newContext(c.dev);
    const page = await context.newPage();
    await page.setViewportSize(c.vp);
    await page.goto(BASE + c.route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const ov = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const w = Math.max(doc.scrollWidth, body.scrollWidth) - doc.clientWidth;
      return { overflow: w, scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth), clientWidth: doc.clientWidth };
    });
    console.log(c.label + ' @ ' + c.vp.width + 'px -> overflow=' + ov.overflow + ' scrollWidth=' + ov.scrollWidth + ' clientWidth=' + ov.clientWidth);
    await context.close();
  }
  await browser.close();
})();
