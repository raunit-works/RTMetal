const { chromium } = require('playwright');

const baseUrl = process.env.PERF_BASE_URL || 'http://127.0.0.1:3102';
const pages = [
  '/metal-coating',
  '/metal-coating/product/botanical-leaf-wall-artwork',
  '/home-decor',
];

(async () => {
  const browser = await chromium.launch();
  const results = [];

  for (const path of pages) {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    const started = Date.now();
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle', timeout: 120000 });
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);

    const metrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource')
        .filter((entry) => entry.name.includes('/_next/image'))
        .map((entry) => ({
          url: entry.name,
          durationMs: Math.round(entry.duration),
          ttfbMs: Math.round(entry.responseStart - entry.requestStart),
          transferBytes: entry.transferSize,
          encodedBytes: entry.encodedBodySize,
          decodedBytes: entry.decodedBodySize,
        }));

      const images = Array.from(document.images);
      return {
        imageCount: images.length,
        completeImages: images.filter((img) => img.complete && img.naturalWidth > 0).length,
        navigation: {
          domContentLoadedMs: Math.round(
            performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd
          ),
          loadEventMs: Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd),
        },
        optimizerRequests: resources.length,
        optimizerTransferBytes: resources.reduce((sum, item) => sum + item.transferBytes, 0),
        slowest: resources.sort((a, b) => b.durationMs - a.durationMs).slice(0, 5),
        totalDurationMs: resources.reduce((sum, item) => sum + item.durationMs, 0),
      };
    });

    results.push({ path, wallClockMs: Date.now() - started, ...metrics });
    await context.close();
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
