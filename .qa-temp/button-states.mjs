import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:3000';
const OUT = path.resolve('reports/button-audit/states');
fs.mkdirSync(OUT, { recursive: true });

function readStyles() {
  function parseColor(str) {
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return { r: 0, g: 0, b: 0, a: 0 };
    const p = m[1].split(',').map((v) => parseFloat(v.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function over(fg, bg) {
    const a = fg.a + bg.a * (1 - fg.a);
    return {
      r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / (a || 1),
      g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / (a || 1),
      b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / (a || 1),
      a,
    };
  }
  function lum(c) {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  const el = document.querySelector('[data-qa-target]');
  const s = getComputedStyle(el);
  const layers = [];
  let node = el;
  let gradient = false;
  while (node) {
    const cs = getComputedStyle(node);
    if (cs.backgroundImage && cs.backgroundImage !== 'none') gradient = true;
    const c = parseColor(cs.backgroundColor);
    if (c.a > 0) layers.push(c);
    node = node.parentElement;
  }
  let bg = { r: 255, g: 255, b: 255, a: 1 };
  for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
  const fg = over(parseColor(s.color), bg);
  const l1 = lum(fg), l2 = lum(bg);
  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return {
    text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
    color: s.color,
    effectiveBackground: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
    gradient,
    contrast: Math.round(contrast * 100) / 100,
    opacity: s.opacity,
    visibility: s.visibility,
    focusVisible: el.matches(':focus-visible'),
    boxShadow: s.boxShadow,
    outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
    disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true',
    ariaLabel: el.getAttribute('aria-label'),
    title: el.getAttribute('title'),
  };
}

const allTargets = [
  { name: 'home-cta-secondary', route: '/', section: "Let's build something", role: 'link', text: 'Metal Coating Services' },
  { name: 'home-cta-primary', route: '/', section: "Let's build something", role: 'link', text: 'Shop Home Decor' },
  { name: 'about-division-home-decor', route: '/about', section: 'A house of craft', role: 'link', text: 'Explore Home Decor' },
  { name: 'about-division-metal', route: '/about', section: 'A house of craft', role: 'link', text: 'Explore Metal Coating' },
  { name: 'about-cta-secondary', route: '/about', section: 'Have something in', role: 'link', text: 'Discuss a Project' },
  { name: 'metal-hero-secondary', route: '/metal-coating', section: 'Metal Coating & Finishing', role: 'link', text: 'Enquire About a Project' },
  { name: 'metal-quote-whatsapp', route: '/metal-coating', section: 'Tell us about your', role: 'button', text: 'Chat on WhatsApp' },
];

const targets = process.env.TARGETS
  ? allTargets.filter((t) => process.env.TARGETS.split(',').includes(t.name))
  : allTargets;

async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}

async function focusByTab(page, locator) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  for (let i = 0; i < 400; i++) {
    await page.keyboard.press('Tab');
    const active = await locator.evaluate((el) => el === document.activeElement);
    if (active) return true;
  }
  return false;
}

const browser = await chromium.launch();
const results = [];

for (const width of [390, 1280]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  for (const t of targets) {
    try {
      await page.goto(BASE + t.route, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await scrollThrough(page);
      const scope = page.locator('section', { hasText: t.section }).first();
      const locator = scope.getByRole(t.role, { name: t.text }).first();
      await locator.waitFor({ state: 'visible', timeout: 15000 });
      await locator.scrollIntoViewIfNeeded();
      await locator.evaluate((el) => el.setAttribute('data-qa-target', '1'));
      await page.waitForTimeout(300);

      const normal = await page.evaluate(readStyles);
      await locator.screenshot({ path: path.join(OUT, `${width}-${t.name}-normal.png`) });

      let hover = normal;
      let focus = normal;
      let focused = false;
      if (!normal.disabled) {
        await locator.hover();
        await page.waitForTimeout(400);
        hover = await page.evaluate(readStyles);
        await locator.screenshot({ path: path.join(OUT, `${width}-${t.name}-hover.png`) });

        focused = await focusByTab(page, locator);
        await page.waitForTimeout(250);
        focus = await page.evaluate(readStyles);
        await locator.screenshot({ path: path.join(OUT, `${width}-${t.name}-focus.png`) });
      }

      results.push({ width, name: t.name, focused, normal, hover, focus });
      console.log(
        `[${width}] ${t.name} normal=${normal.contrast}:1 hover=${hover.contrast}:1 focus=${focus.contrast}:1 focusVisible=${focus.focusVisible} keyboardFocused=${focused} disabled=${normal.disabled}`
      );
      await locator.evaluate((el) => el.removeAttribute('data-qa-target'));
    } catch (err) {
      console.log(`[${width}] ${t.name} ERROR ${err.message}`);
      results.push({ width, name: t.name, error: err.message });
    }
  }
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'state-report.json'), JSON.stringify(results, null, 2));
console.log('wrote', path.join(OUT, 'state-report.json'));
