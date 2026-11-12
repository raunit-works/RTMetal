const { chromium } = require('@playwright/test');

function luminance([r, g, b]) {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function parseRgb(value) {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(',').map((v) => parseFloat(v.trim()));
  return { rgb: [parts[0], parts[1], parts[2]], alpha: parts[3] === undefined ? 1 : parts[3] };
}

function blend(fg, bg, alpha) {
  return fg.map((v, i) => Math.round(v * alpha + bg[i] * (1 - alpha)));
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(`PAGEERROR: ${error.message}`));
  await page.goto('http://localhost:3100/about', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });

  const result = await page.evaluate(() => {
    const parse = (value) => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const parts = match[1].split(',').map((v) => parseFloat(v.trim()));
      return { rgb: [parts[0], parts[1], parts[2]], alpha: parts[3] === undefined ? 1 : parts[3] };
    };
    const blend = (fg, bg, alpha) =>
      fg.map((v, i) => Math.round(v * alpha + bg[i] * (1 - alpha)));
    const pageBg = [255, 255, 255];

    function effectiveBackground(element) {
      let node = element;
      let layers = [];
      while (node && node !== document.documentElement) {
        const style = getComputedStyle(node);
        const bg = parse(style.backgroundColor);
        if (bg && bg.alpha > 0) {
          layers.push(bg);
          if (bg.alpha >= 1) break;
        }
        node = node.parentElement;
      }
      let color = pageBg;
      for (let i = layers.length - 1; i >= 0; i -= 1) {
        color = blend(layers[i].rgb, color, layers[i].alpha);
      }
      return color;
    }

    return Array.from(document.querySelectorAll('main a, main button'))
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((el) => {
        const style = getComputedStyle(el);
        const color = parse(style.color);
        const bg = effectiveBackground(el);
        return {
          text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
          href: el.getAttribute('href'),
          foreground: color ? color.rgb : null,
          foregroundAlpha: color ? color.alpha : null,
          background: bg,
        };
      });
  });

  const report = result.map((item) => {
    const fg = item.foregroundAlpha < 1 ? blend(item.foreground, item.background, item.foregroundAlpha) : item.foreground;
    return {
      text: item.text,
      href: item.href,
      fg: `rgb(${fg.join(', ')})`,
      bg: `rgb(${item.background.join(', ')})`,
      contrast: Number(contrast(fg, item.background).toFixed(2)),
    };
  });

  console.log(JSON.stringify({ contrast: report, consoleErrors: errors }, null, 2));
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobile.newPage();
  const mobileErrors = [];
  mobilePage.on('console', (message) => {
    if (message.type() === 'error') mobileErrors.push(message.text());
  });
  mobilePage.on('pageerror', (error) => mobileErrors.push(`PAGEERROR: ${error.message}`));
  await mobilePage.goto('http://localhost:3100/about', { waitUntil: 'networkidle' });
  await mobilePage.getByRole('button', { name: 'Open menu' }).click();
  await mobilePage.waitForTimeout(500);
  const drawer = await mobilePage.evaluate(() => {
    const nav = Array.from(document.querySelectorAll('nav, div')).find((el) =>
      el.className && typeof el.className === 'string' && el.className.includes('max-w-sm')
    );
    return {
      drawerVisible: Boolean(nav && nav.getBoundingClientRect().width > 0),
      drawerText: nav ? nav.textContent.trim().replace(/\s+/g, ' ').slice(0, 200) : null,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
  await mobilePage.screenshot({ path: '.qa-temp/about-mobile-menu.png' });
  console.log(JSON.stringify({ mobileDrawer: drawer, mobileConsoleErrors: mobileErrors }, null, 2));
  await mobile.close();
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
