import { chromium, devices } from 'playwright';

const BASE = 'http://localhost:3010';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(BASE + '/home-decor/seated-dog-figurine-grey-white-wa0006', { waitUntil: 'domcontentloaded' });
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
            class: (el.className || '').slice(0, 60),
            width: Math.round(r.width),
            left: Math.round(r.left),
            right: Math.round(r.right),
          });
        }
      } catch (e) {}
    }
    return { vpW, docScrollWidth: doc.scrollWidth, bodyScrollWidth: document.body.scrollWidth, count: overflowing.length, samples: overflowing.slice(0, 25) };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
