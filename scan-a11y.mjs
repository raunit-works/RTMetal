import { chromium, devices } from 'playwright';
import path from 'path';

const AXE_PATH = path.resolve('node_modules/axe-core/axe.min.js');
const BASE = 'http://localhost:3010';

const ROUTES = [
  { name: 'Homepage', path: '/' },
  { name: 'About Us', path: '/about' },
  { name: 'Home Decor', path: '/home-decor' },
  { name: 'Product Detail (seated-dog)', path: '/home-decor/seated-dog-figurine-grey-white-wa0006' },
  { name: 'Metal Services', path: '/metal-coating' },
  { name: 'Before & After', path: '/before-after' },
  { name: 'Product Detail (metal-p0026)', path: '/metal-coating/product/metal-p0026-abstract-continuous-line-wall-sculpture' },
];

const PROJECTS = [
  { name: 'Desktop Chrome', viewport: { width: 1280, height: 800 } },
  { name: 'Mobile Chrome', ...devices['Pixel 5'].viewport },
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const project of PROJECTS) {
    const context = await browser.newContext({ viewport: project.viewport });
    const page = await context.newPage();
    await page.addScriptTag({ path: AXE_PATH });

    for (const route of ROUTES) {
      await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const axeReady = await page.evaluate(() => typeof window.axe === 'function' && typeof window.axe.run === 'function');
      console.log(`  axeReady=${axeReady}`);
      const res = await page.evaluate(() => {
        return window.axe.run({
          runOnly: { type: 'tag', values: ['wcag2aa', 'wcag21aa', 'wcag22aa'] },
          resultTypes: ['violations', 'incomplete', 'passes'],
        });
      });
      const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
      for (const v of res.violations) byImpact[v.impact] = (byImpact[v.impact] || 0) + 1;
      console.log(`\n===== ${project.name} | ${route.name} (${route.path}) =====`);
      console.log(`violations: critical=${byImpact.critical} serious=${byImpact.serious} moderate=${byImpact.moderate} minor=${byImpact.minor} total=${res.violations.length}`);
      console.log(`incomplete: ${res.incomplete.length} passes: ${res.passes.length}`);
      for (const v of res.violations) {
        console.log(`  [${v.impact}] ${v.id}: ${v.description} (nodes: ${v.nodes.length})`);
        for (const n of v.nodes.slice(0, 3)) {
          console.log(`      target=${n.target.join(', ')} :: ${n.failureSummary}`);
        }
      }
      for (const i of res.incomplete.slice(0, 5)) {
        console.log(`  INCOMPLETE ${i.id}: ${i.description}`);
      }
    }
    await context.close();
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
