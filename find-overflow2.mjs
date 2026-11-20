import { chromium, devices } from 'playwright';

const BASE = 'http://localhost:3010';

const CASES = [
  { route: '/about', label: 'About Us', vp: { width: 320, height: 844 }, dev: devices['Pixel 5'] },
  { route: '/home-decor/seated-dog-figurine-grey-white-wa0006', label: 'Product Detail', vp: { width: 1024, height: 768 }, dev: devices['Desktop Chrome'] },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const c of CASES) {
    const context = await browser.newContext({ ...c.dev, viewport: c.vp });
    const page = await context.newPage();
    await page.goto(BASE + c.route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
      const doc = document.documentElement;
      const vpW = doc.clientWidth;
      const overflowing = [];
      for (const el of document.querySelectorAll('*')) {
        try {
          const r = el.getBoundingClientRect();
          if (r.width > vpW + 2 || r.right > vpW + 2 || r.left < -2) {
            overflowing.push({
              tag: el.tagName,
              class: (el.className || '').slice(0, 50),
              width: Math.round(r.width),
              left: Math.round(r.left),
              right: Math.round(r.right),
            });
          }
        } catch (e) {}
      }
      return { vpW, scrollWidth: doc.scrollWidth, overflowing: overflowing.slice(0, 20) };
    });
    console.log('=== ' + c.label + ' @ ' + c.vp.width + 'px (scrollWidth=' + info.scrollWidth + ') ===');
    for (const s of info.overflowing) {
      console.log('   ' + s.tag + ' w=' + s.width + ' left=' + s.left + ' right=' + s.right + ' | ' + s.class);
    }
    await context.close();
  }
  await browser.close();
})();
