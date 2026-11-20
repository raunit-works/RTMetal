import { chromium, devices } from 'playwright';

const BASE = 'http://localhost:3010';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(devices['Desktop Chrome']);
  const page = await context.newPage();
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(BASE + '/about', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const info = await page.evaluate(() => {
    const getW = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return { sel, width: Math.round(r.width), left: Math.round(r.left), right: Math.round(r.right), boxSizing: s.boxSizing, widthCSS: s.width };
    };
    return {
      vpW: document.documentElement.clientWidth,
      scrollW: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      outer: getW('.mx-auto.max-w-7xl.px-5'),
      grid: getW('.mt-10.grid.gap-5'),
      article: getW('article.h-full.min-w-0.w-full'),
      innerDiv: getW('article.h-full.min-w-0.w-full > div.relative'),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
