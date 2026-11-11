const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const bad = [];
  page.on('response', (res) => { if (res.status() >= 400) bad.push(res.status() + ' ' + res.url()); });
  page.on('requestfailed', (req) => bad.push('FAILED ' + req.url() + ' ' + (req.failure() && req.failure().errorText)));
  await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });
  const styles = await page.evaluate(() => Array.from(document.styleSheets).map(s => s.href || 'inline'));
  console.log(JSON.stringify({ bad, styles }, null, 2));
  await browser.close();
})();
