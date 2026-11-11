const { chromium } = require('@playwright/test');

const routes = ['/', '/metal-coating', '/home-decor', '/before-after'];
const widths = [1440, 390];

(async () => {
  const browser = await chromium.launch();

  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    for (const route of routes) {
      const page = await context.newPage();
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(`PAGEERROR: ${error.message}`));
      let status = null;
      try {
        const response = await page.goto(`http://localhost:3100${route}`, {
          waitUntil: 'networkidle',
          timeout: 45000,
        });
        status = response ? response.status() : null;
      } catch (error) {
        errors.push(`NAVIGATION: ${error.message}`);
      }
      const metrics = await page.evaluate(() => ({
        title: document.title,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        h1: document.querySelector('h1')?.textContent.trim().replace(/\s+/g, ' ') ?? null,
      }));
      console.log(JSON.stringify({ width, route, status, ...metrics, consoleErrors: errors }));
      await page.close();
    }
    await context.close();
  }

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
