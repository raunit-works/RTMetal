import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.PERF_BASE_URL ?? 'http://localhost:3011';
const OUT = process.env.PERF_OUT ?? 'reports/performance/audit-2026-11-17.json';

const routes = [
  { name: 'home', path: '/' },
  { name: 'home-decor', path: '/home-decor' },
  { name: 'metal-coating', path: '/metal-coating' },
  {
    name: 'product-detail',
    path: '/home-decor/ashok-stambh-premium-decorative-showpiece',
  },
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
  {
    name: 'mobile',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
];

function round(value) {
  return typeof value === 'number' ? Math.round(value * 100) / 100 : value;
}

const browser = await chromium.launch();
const results = [];

for (const viewport of viewports) {
  for (const route of routes) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
    });
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');

    const resources = new Map();
    client.on('Network.responseReceived', (event) => {
      resources.set(event.requestId, {
        url: event.response.url,
        type: event.type,
        status: event.response.status,
        mimeType: event.response.mimeType,
        fromCache: Boolean(
          event.response.fromDiskCache ||
            event.response.fromMemoryCache ||
            event.response.fromPrefetchCache
        ),
      });
    });
    client.on('Network.loadingFinished', (event) => {
      const item = resources.get(event.requestId);
      if (item) item.encodedDataLength = event.encodedDataLength;
    });

    await page.addInitScript(() => {
      window.__perf = { lcp: 0, lcpElement: '', cls: 0, longTasks: 0, longTaskMs: 0 };
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__perf.lcp = entry.startTime;
            window.__perf.lcpElement = entry.element
              ? `${entry.element.tagName.toLowerCase()}${entry.element.className ? '.' + String(entry.element.className).split(/\s+/).slice(0, 2).join('.') : ''}`
              : entry.url || '';
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__perf.cls += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {}
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__perf.longTasks += 1;
            window.__perf.longTaskMs += entry.duration;
          }
        }).observe({ type: 'longtask', buffered: true });
      } catch {}
    });

    const startedAt = Date.now();
    const response = await page.goto(`${BASE}${route.path}`, {
      waitUntil: 'load',
      timeout: 120000,
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const elapsedMs = Date.now() - startedAt;

    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paints = Object.fromEntries(
        performance.getEntriesByType('paint').map((entry) => [entry.name, entry.startTime])
      );
      const resourceEntries = performance.getEntriesByType('resource');
      const byInitiator = {};
      for (const entry of resourceEntries) {
        byInitiator[entry.initiatorType] = (byInitiator[entry.initiatorType] ?? 0) + 1;
      }
      return {
        navigation: nav
          ? {
              duration: nav.duration,
              domContentLoaded: nav.domContentLoadedEventEnd,
              loadEvent: nav.loadEventEnd,
              responseStart: nav.responseStart,
              responseEnd: nav.responseEnd,
              transferSize: nav.transferSize,
              encodedBodySize: nav.encodedBodySize,
              decodedBodySize: nav.decodedBodySize,
            }
          : null,
        paints,
        perf: window.__perf,
        resourceCount: resourceEntries.length,
        resourceInitiators: byInitiator,
        jsHeap: performance.memory
          ? {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
            }
          : null,
      };
    });

    const byType = {};
    let totalBytes = 0;
    let fromCacheCount = 0;
    for (const item of resources.values()) {
      const bytes = item.encodedDataLength ?? 0;
      totalBytes += bytes;
      if (item.fromCache) fromCacheCount += 1;
      const bucket = (byType[item.type] ??= { count: 0, bytes: 0, statuses: {} });
      bucket.count += 1;
      bucket.bytes += bytes;
      bucket.statuses[item.status] = (bucket.statuses[item.status] ?? 0) + 1;
    }
    for (const bucket of Object.values(byType)) bucket.bytes = round(bucket.bytes);

    const documentStatus = response?.status();
    const contentType = response?.headers()['content-type'] ?? '';

    results.push({
      viewport: viewport.name,
      route: route.name,
      path: route.path,
      status: documentStatus,
      contentType,
      elapsedMs,
      ttfbMs: round(metrics.navigation?.responseStart),
      domContentLoadedMs: round(metrics.navigation?.domContentLoaded),
      loadEventMs: round(metrics.navigation?.loadEvent),
      fcpMs: round(metrics.paints['first-contentful-paint']),
      lcpMs: round(metrics.perf.lcp),
      lcpElement: metrics.perf.lcpElement,
      cls: round(metrics.perf.cls),
      longTasks: metrics.perf.longTasks,
      longTaskMs: round(metrics.perf.longTaskMs),
      documentTransferBytes: metrics.navigation?.transferSize ?? null,
      documentEncodedBytes: metrics.navigation?.encodedBodySize ?? null,
      totalTransferBytes: totalBytes,
      resourceCount: metrics.resourceCount,
      resourceInitiators: metrics.resourceInitiators,
      fromCacheCount,
      byType,
      jsHeap: metrics.jsHeap,
    });

    await context.close();
  }
}

await browser.close();

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  viewports: viewports.map(({ name, width, height }) => ({ name, width, height })),
  routes,
  note: 'No Lighthouse dependency is installed. Measurements use Chromium CDP + PerformanceObserver on an empty browser cache per route.',
  results,
};

fs.mkdirSync('reports/performance', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
