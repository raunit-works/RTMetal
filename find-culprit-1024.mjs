import { chromium, devices } from 'playwright';

const BASE = 'http://localhost:3010';

const vp = { width: 1024, height: 768 };
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(devices['Desktop Chrome']);
  const page = await context.newPage();
  await page.setViewportSize(vp);
  await page.goto(BASE + '/home-decor/seated-dog-figurine-grey-white-wa0006', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const info = await page.evaluate(() => {
    function isClipped(el) {
      const s = getComputedStyle(el);
      const ov = s.overflow + s.overflowX + s.overflowY;
      return /(hidden|scroll|auto|clip)/.test(ov);
    }
    const doc = document.documentElement;
    const vpW = doc.clientWidth;
    const scrollW = Math.max(doc.scrollWidth, document.body.scrollWidth);
    const culprits = [];
    for (const el of document.querySelectorAll('*')) {
      try {
        const r = el.getBoundingClientRect();
        if (r.right <= vpW + 2 && r.left >= -2 && r.width <= vpW + 2) continue;
        let ancestor = el.parentElement;
        let clipped = false;
        while (ancestor && ancestor !== document.body && ancestor !== doc) {
          if (isClipped(ancestor)) { clipped = true; break; }
          ancestor = ancestor.parentElement;
        }
        if (!clipped) culprits.push({ tag: el.tagName, class: (el.className || '').slice(0, 40), width: Math.round(r.width), left: Math.round(r.left), right: Math.round(r.right) });
      } catch (e) {}
    }
    return { vpW, scrollW, culprits: culprits.slice(0, 15) };
  });
  console.log('scrollW=' + info.scrollW + ' vpW=' + info.vpW);
  for (const s of info.culprits) console.log('CULPRIT ' + s.tag + ' w=' + s.width + ' left=' + s.left + ' right=' + s.right + ' | ' + s.class);
  await browser.close();
})();
