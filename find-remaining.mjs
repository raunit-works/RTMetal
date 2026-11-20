import { chromium, devices } from 'playwright';

const BASE = 'http://localhost:3010';

(async () => {
  const browser = await chromium.launch({ headless: true });

  // About Us @320px
  {
    const context = await browser.newContext(devices['Desktop Chrome']);
    const page = await context.newPage();
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(BASE + '/about', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const info = await page.evaluate(() => {
      function isClipped(el) {
        const s = getComputedStyle(el);
        const ov = s.overflow + s.overflowX + s.overflowY;
        return /(hidden|scroll|auto|clip)/.test(ov);
      }
      const doc = document.documentElement;
      const vpW = doc.clientWidth;
      const scrollW = Math.max(doc.scrollWidth, document.body.scrollWidth);
      const culprits = [];
      for (const el of document.querySelectorAll('*')) {
        try {
          const r = el.getBoundingClientRect();
          if (r.right <= vpW + 2 && r.left >= -2 && r.width <= vpW + 2) continue;
          let ancestor = el.parentElement;
          let clipped = false;
          while (ancestor && ancestor !== document.body && ancestor !== doc) {
            if (isClipped(ancestor)) { clipped = true; break; }
            ancestor = ancestor.parentElement;
          }
          if (!clipped) {
            culprits.push({
              tag: el.tagName,
              text: (el.innerText || el.textContent || '').slice(0, 25).replace(/\s+/g, ' '),
              class: (el.className || '').slice(0, 35),
              width: Math.round(r.width),
              left: Math.round(r.left),
              right: Math.round(r.right),
            });
          }
        } catch (e) {}
      }
      return { vpW, scrollW, culprits: culprits.slice(0, 10) };
    });
    console.log('=== About Us @320px scrollW=' + info.scrollW + ' vpW=' + info.vpW + ' ===');
    for (const s of info.culprits) console.log('   CULPRIT <' + s.tag + '> "' + s.text + '" w=' + s.width + ' left=' + s.left + ' right=' + s.right + ' | ' + s.class);
    await context.close();
  }

  // Mobile menu - About Us @375px, open menu
  {
    const context = await browser.newContext(devices['Pixel 5']);
    const page = await context.newPage();
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    // Open menu
    const menuButton = page.getByRole('button', { name: /menu|open navigation/i }).first();
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(1000);
    }
    const info = await page.evaluate(() => {
      function isClipped(el) {
        const s = getComputedStyle(el);
        const ov = s.overflow + s.overflowX + s.overflowY;
        return /(hidden|scroll|auto|clip)/.test(ov);
      }
      const doc = document.documentElement;
      const vpW = doc.clientWidth;
      const scrollW = Math.max(doc.scrollWidth, document.body.scrollWidth);
      const culprits = [];
      for (const el of document.querySelectorAll('*')) {
        try {
          const r = el.getBoundingClientRect();
          if (r.right <= vpW + 2 && r.left >= -2 && r.width <= vpW + 2) continue;
          let ancestor = el.parentElement;
          let clipped = false;
          while (ancestor && ancestor !== document.body && ancestor !== doc) {
            if (isClipped(ancestor)) { clipped = true; break; }
            ancestor = ancestor.parentElement;
          }
          if (!clipped) {
            culprits.push({
              tag: el.tagName,
              text: (el.innerText || el.textContent || '').slice(0, 25).replace(/\s+/g, ' '),
              class: (el.className || '').slice(0, 35),
              width: Math.round(r.width),
              left: Math.round(r.left),
              right: Math.round(r.right),
            });
          }
        } catch (e) {}
      }
      return { vpW, scrollW, culprits: culprits.slice(0, 10) };
    });
    console.log('=== Mobile menu open @375px scrollW=' + info.scrollW + ' vpW=' + info.vpW + ' ===');
    for (const s of info.culprits) console.log('   CULPRIT <' + s.tag + '> "' + s.text + '" w=' + s.width + ' left=' + s.left + ' right=' + s.right + ' | ' + s.class);
    await context.close();
  }

  await browser.close();
})();
