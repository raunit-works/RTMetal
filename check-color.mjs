import { chromium, devices } from 'playwright';

const BASE = 'http://localhost:3010';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...devices['Desktop Chrome'] });
  const page = await context.newPage();
  await page.goto(BASE + '/home-decor/seated-dog-figurine-grey-white-wa0006', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const color = await page.evaluate(() => {
    const el = document.querySelector('.tracking-ultra.text-gold-deep.text-xs');
    if (!el) return 'not found';
    return window.getComputedStyle(el).color;
  });
  console.log('Category name computed color:', color);
  await browser.close();
})();
