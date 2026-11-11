const { chromium } = require('@playwright/test');

const routes = ['/about', '/', '/metal-coating'];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  for (const route of routes) {
    const page = await context.newPage();
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(`PAGEERROR: ${error.message}`));
    const response = await page.goto(`http://localhost:3000${route}`, {
      waitUntil: 'networkidle',
      timeout: 120000,
    });
    console.log(JSON.stringify({
      route,
      status: response ? response.status() : null,
      title: await page.title(),
      h1: await page.locator('h1').first().textContent().catch(() => null),
      consoleErrors: errors,
    }));
    await page.close();
  }

  const page = await context.newPage();
  const aboutErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') aboutErrors.push(message.text());
  });
  page.on('pageerror', (error) => aboutErrors.push(`PAGEERROR: ${error.message}`));
  await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle', timeout: 120000 });
  const hrefs = await page.locator('main a').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')).filter(Boolean)
  );
  await page.getByRole('link', { name: /Explore Our Services/i }).first().click();
  await page.waitForURL('**/metal-coating', { timeout: 120000 });
  console.log(JSON.stringify({
    aboutLinks: hrefs,
    afterClick: page.url(),
    aboutConsoleErrors: aboutErrors,
  }));
  await page.close();
  await context.close();
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
