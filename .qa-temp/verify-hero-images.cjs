const { chromium } = require('@playwright/test');

const base = 'http://127.0.0.1:3100';
const cases = [
  { slug: 'pvd-coating', width: 768 },
  { slug: 'decorative-metal-finishing', width: 320 },
];

(async () => {
  const browser = await chromium.launch();
  for (const { slug, width } of cases) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const failed = [];
    page.on('requestfailed', (request) => failed.push({ url: request.url(), error: request.failure()?.errorText }));
    await page.goto(`${base}/metal-coating/${slug}`, { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForFunction(() => {
        const img = document.querySelector('section img');
        return Boolean(img && img.complete && img.naturalWidth > 0);
      }, { timeout: 15000 });
    } catch {
      // reported below
    }
    const state = await page.evaluate(() => {
      const img = document.querySelector('section img');
      return img
        ? { complete: img.complete, naturalWidth: img.naturalWidth, src: img.currentSrc || img.src }
        : { complete: false, naturalWidth: 0, src: null };
    });
    console.log(JSON.stringify({ slug, width, ...state, failed }));
    await page.close();
  }
  await browser.close();
})();
