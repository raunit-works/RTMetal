const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3100/about', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.screenshot({ path: '.qa-temp/hero-curve-final.png', clip: { x: 430, y: 77, width: 420, height: 620 } });
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
