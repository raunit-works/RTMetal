import { chromium, devices } from 'playwright';

const BASE = 'http://localhost:3010';

const CASES = [
  { route: '/about', label: 'About Us', vp: { width: 320, height: 844 } },
  { route: '/home-decor/seated-dog-figurine-grey-white-wa0006', label: 'Product Detail', vp: { width: 1024, height: 768 } },
  { route: '/home-decor/seated-dog-figurine-grey-white-wa0006', label: 'Product Detail', vp: { width: 1280, height: 800 } },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const c of CASES) {
    const context = await browser.newContext({ ...c.vp });
    const page = await context.newPage();
    await page.goto(BASE + c.route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const ov = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const w = Math.max(doc.scrollWidth, body.scrollWidth) - doc.clientWidth;
      const max = Math.max(doc.scrollWidth, body.scrollWidth);
      return { overflow: w, docScrollWidth: max, docClientWidth: doc.clientWidth, bodyScrollWidth: body.scrollWidth };
    });
    console.log(c.label + ' @ ' + c.vp.width + 'px -> overflow=' + ov.overflow + ' docScrollWidth=' + ov.docScrollWidth + ' clientWidth=' + ov.docClientWidth + ' bodyScrollWidth=' + ov.bodyScrollWidth);
    await context.close();
  }
  await browser.close();
})();
