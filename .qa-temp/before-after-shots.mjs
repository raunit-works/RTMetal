import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const BASE = 'http://localhost:3000';
const OUT = path.resolve('reports/button-audit/before-after');
fs.mkdirSync(OUT, { recursive: true });

const targets = [
  { name: 'home-cta-secondary', route: '/', section: "Let's build something", role: 'link', text: 'Metal Coating Services' },
  { name: 'about-division-home-decor', route: '/about', section: 'A house of craft', role: 'link', text: 'Explore Home Decor' },
  { name: 'about-division-metal', route: '/about', section: 'A house of craft', role: 'link', text: 'Explore Metal Coating' },
  { name: 'about-cta-secondary', route: '/about', section: 'Have something in', role: 'link', text: 'Discuss a Project' },
  { name: 'metal-quote-whatsapp', route: '/metal-coating', section: 'Tell us about your', role: 'button', text: 'Chat on WhatsApp' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

for (const t of targets) {
  await page.goto(BASE + t.route, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await page.waitForTimeout(800);
  const scope = page.locator('section', { hasText: t.section }).first();
  const locator = scope.getByRole(t.role, { name: t.text }).first();
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  await locator.evaluate((el) => {
    el.setAttribute('data-original-style', el.getAttribute('style') || '');
    el.style.backgroundColor = '#ffffff';
    el.style.color = '#ffffff';
    el.style.borderColor = 'rgba(255,255,255,0.2)';
  });
  await page.waitForTimeout(150);
  await locator.screenshot({ path: path.join(OUT, `${t.name}-before-simulated.png`) });
  await locator.evaluate((el) => {
    el.setAttribute('style', el.getAttribute('data-original-style') || '');
    el.removeAttribute('data-original-style');
  });
  await page.waitForTimeout(150);
  await locator.screenshot({ path: path.join(OUT, `${t.name}-after.png`) });
  console.log(t.name, 'captured');
}

await browser.close();
