const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const widths = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const outDir = path.join(process.cwd(), 'reports', 'about-responsive');

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();

  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: width < 768 ? 844 : 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const consoleErrors = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(`PAGEERROR: ${error.message}`));

    await page.goto('http://localhost:3100/about', { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < pageHeight; y += 600) {
      await page.evaluate((nextY) => window.scrollTo(0, nextY), y);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(900);

    await page.evaluate(async () => {
      await Promise.all(
        Array.from(document.images).map((image) =>
          image.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                image.onload = resolve;
                image.onerror = resolve;
              })
        )
      );
    });

    const metrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const h1 = document.querySelector('h1');
      const visibleButtons = Array.from(
        document.querySelectorAll('main a, main button')
      )
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .map((element) => {
          const style = getComputedStyle(element);
          return {
            text: (element.textContent || '').trim().replace(/\s+/g, ' '),
            href: element.getAttribute('href'),
            color: style.color,
            background: style.backgroundColor,
          };
        });

      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        bodyHeight: document.body.scrollHeight,
        h1: h1 ? h1.textContent.trim().replace(/\s+/g, ' ') : null,
        headerHeight: header ? header.getBoundingClientRect().height : null,
        visibleButtons,
      };
    });

    const screenshotPath = path.join(outDir, `about-${width}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await context.close();

    console.log(
      JSON.stringify({
        width,
        screenshotPath,
        overflow: metrics.scrollWidth > metrics.innerWidth + 1,
        scrollWidth: metrics.scrollWidth,
        innerWidth: metrics.innerWidth,
        bodyHeight: metrics.bodyHeight,
        headerHeight: metrics.headerHeight,
        h1: metrics.h1,
        linkCount: metrics.visibleButtons.length,
        links: metrics.visibleButtons
          .filter((item) => item.href)
          .map((item) => item.href),
        consoleErrors,
      })
    );
  }

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

