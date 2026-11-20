import { chromium, devices } from 'playwright';

const BASE = 'http://localhost:3010';
const ROUTE = '/home-decor/onyx-sculptural-vase';
const RUNS = 3;

const CAPTURE_SCRIPT = () => {
  return new Promise((resolve) => {
    const lcpEntries = [];
    const resourceEntries = [];
    const paintEntries = [];

    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.entryType === 'largest-contentful-paint') {
          lcpEntries.push({
            startTime: e.startTime,
            loadTime: e.loadTime,
            size: e.size,
            element: e.element ? e.element.outerHTML.slice(0, 500) : null,
            id: e.id,
            url: e.url || null,
          });
        }
      }
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });

    const ro = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.entryType === 'resource') {
          resourceEntries.push({
            name: e.name,
            entryType: e.entryType,
            initiatorType: e.initiatorType,
            startTime: e.startTime,
            responseStart: e.responseStart,
            responseEnd: e.responseEnd,
            transferSize: e.transferSize,
            encodedBodySize: e.encodedBodySize,
            decodedBodySize: e.decodedBodySize,
            nextHopProtocol: e.nextHopProtocol,
            // priority not exposed via PerformanceResourceTiming in all browsers; note null
          });
        }
        if (e.entryType === 'paint') {
          paintEntries.push({ name: e.name, startTime: e.startTime });
        }
      }
    });
    ro.observe({ type: 'resource', buffered: true });
    ro.observe({ type: 'paint', buffered: true });

    // Wait a bit for LCP to settle, then resolve
    setTimeout(() => {
      po.disconnect();
      ro.disconnect();
      resolve({ lcp: lcpEntries, resources: resourceEntries, paints: paintEntries });
    }, 8000);
  });
};

const getPriorities = async (page) => {
  // Read resource priorities via devtools-like is not directly available; use
  // performance resource timing plus note. We'll capture the <img> loading/priority
  // attributes from the DOM instead.
  return page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map((img) => ({
      src: img.src,
      loading: img.getAttribute('loading'),
      fetchPriority: img.getAttribute('fetchpriority') || img.getAttribute('priority') || 'default',
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      rect: img.getBoundingClientRect(),
    }));
  });
};

for (let i = 0; i < RUNS; i++) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    ...devices['Pixel 5'],
  });
  const page = await context.newPage();

  // Enable console logging of network for resource priorities via CDP
  const client = await context.newCDPSession(page);
  await client.send('Network.enable');
  const resources = {};
  client.on('Network.responseReceived', (e) => {
    resources[e.requestId] = {
      url: e.response.url,
      status: e.response.status,
      mimeType: e.response.mimeType,
      encodedBodySize: null,
      transferSize: null,
      priority: e.response.request ? null : null,
      fromDiskCache: e.response.fromDiskCache,
      fromServiceWorker: e.response.fromServiceWorker,
      timing: e.response.timing,
    };
  });
  client.on('Network.loadingFinished', (e) => {
    const r = resources[e.requestId];
    if (r) {
      r.encodedBodySize = e.encodedBodySize;
    }
  });

  await page.goto(BASE + ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const capture = await page.evaluate(CAPTURE_SCRIPT);
  const imgPriorities = await getPriorities(page);

  console.log(`\n========== RUN ${i + 1} (mobile Pixel 5) ==========`);
  console.log('LCP entries:');
  console.log(JSON.stringify(capture.lcp, null, 2));
  console.log('Paint entries:');
  console.log(JSON.stringify(capture.paints, null, 2));
  console.log('Image priorities (DOM):');
  console.log(JSON.stringify(imgPriorities, null, 2));
  console.log('Image resources (network):');
  const imgRes = Object.values(resources).filter((r) => r.url.match(/\.(jpg|jpeg|png|webp|avif|gif)(\?|$)/i));
  console.log(JSON.stringify(imgRes, null, 2));

  await browser.close();
}
