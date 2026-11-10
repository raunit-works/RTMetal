const { chromium } = require('@playwright/test');
const path = require('path');

const base = 'http://127.0.0.1:3100';
const shotsDir = 'C:\\Users\\ACER\\AppData\\Local\\Temp\\opencode\\rt-shots';
const targets = ['decorative-metal-finishing', 'metal-restoration'];
const widths = [1440, 390];

(async () => {
  const browser = await chromium.launch();

  for (const slug of targets) {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(`${base}/metal-coating/${slug}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: path.join(shotsDir, `${slug}-${width}.png`),
        fullPage: true,
      });
      await page.close();
    }
  }

  await browser.close();
  console.log('EXTRA_SHOTS_OK');
})();
