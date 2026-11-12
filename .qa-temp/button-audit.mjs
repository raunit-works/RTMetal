import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:3000';
const OUT = path.resolve('reports/button-audit');
fs.mkdirSync(OUT, { recursive: true });

const widths = (process.env.WIDTHS || '320,375,390,768,1024,1280,1440,1920').split(',').map(Number);
const routes = (process.env.ROUTES || '/,/about,/metal-coating,/home-decor,/before-after,/login,/account').split(',');

const contrastRefs = [];

function auditInPage() {
  function parseColor(str) {
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return { r: 0, g: 0, b: 0, a: 0 };
    const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  function over(fg, bg) {
    const a = fg.a + bg.a * (1 - fg.a);
    if (a === 0) return { r: 255, g: 255, b: 255, a: 1 };
    return {
      r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
      g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
      b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
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
  function contrast(a, b) {
    const l1 = lum(a), l2 = lum(b);
    const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }
  function effectiveBg(el) {
    const layers = [];
    let gradient = false;
    let node = el;
    while (node) {
      const s = getComputedStyle(node);
      if (s.backgroundImage && s.backgroundImage !== 'none') gradient = true;
      const c = parseColor(s.backgroundColor);
      if (c.a > 0) layers.push(c);
      node = node.parentElement;
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
    return { bg, gradient };
  }
  function opacityHidden(el) {
    let node = el;
    while (node) {
      const s = getComputedStyle(node);
      if (parseFloat(s.opacity) < 0.05) return true;
      if (s.visibility === 'hidden' || s.display === 'none') return true;
      node = node.parentElement;
    }
    return false;
  }

  const nodes = Array.from(document.querySelectorAll('button, a'));
  return nodes
    .filter((el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return false;
      const cls = typeof el.className === 'string' ? el.className : '';
      return /rounded|inline-flex|px-\d/.test(cls) && /\bbg-|\bborder\b/.test(cls);
    })
    .map((el) => {
      const s = getComputedStyle(el);
      const { bg, gradient } = effectiveBg(el);
      const color = parseColor(s.color);
      const textOn = over(color, bg);
      const ratio = contrast(textOn, bg);
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70),
        color: s.color,
        backgroundColor: s.backgroundColor,
        effectiveBackground: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        gradient,
        contrast: Math.round(ratio * 100) / 100,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        hiddenByOpacity: opacityHidden(el),
        disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true',
        className: (typeof el.className === 'string' ? el.className : '').slice(0, 200),
      };
    });
}

const browser = await chromium.launch();

for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  const dir = path.join(OUT, `${width}px`);
  fs.mkdirSync(dir, { recursive: true });

  for (const route of routes) {
    try {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(600);
      const url = page.url();
      if (route === '/account' && !url.includes('/account')) {
        console.log(`[${width}] ${route} -> redirected ${url}`);
        continue;
      }
      await page.evaluate(async () => {
        const step = 500;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(900);
      const rows = await page.evaluate(auditInPage);
      rows.forEach((r) => contrastRefs.push({ width, route: url.replace(BASE, ''), ...r }));
      const bad = rows.filter((r) => !r.gradient && r.contrast < 3.5);
      console.log(`[${width}] ${route} buttons=${rows.length} lowContrast=${bad.length}`);
      bad.slice(0, 8).forEach((b) => {
        console.log(`   ${b.contrast}:1 ${b.disabled ? 'DISABLED ' : ''}${b.hiddenByOpacity ? 'HOVER-ONLY ' : ''}"${b.text}" fg=${b.color} bg=${b.effectiveBackground}`);
      });

      if (width === 1280 || width === 390) {
        await page.screenshot({ path: path.join(dir, `${route.replace(/[/]+/g, '_') || 'home'}.png`), fullPage: false });
      }
    } catch (err) {
      console.log(`[${width}] ${route} ERROR ${err.message}`);
    }
  }
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'contrast-report.json'), JSON.stringify(contrastRefs, null, 2));
console.log(`\nWrote ${path.join(OUT, 'contrast-report.json')}`);
