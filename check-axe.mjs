import { chromium, devices } from 'playwright';
import path from 'path';

const AXE_PATH = path.resolve('node_modules/axe-core/axe.min.js');
const BASE = 'http://localhost:3010';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ ...devices['Desktop Chrome'] });
  const page = await context.newPage();
  await page.addScriptTag({ path: AXE_PATH });
  await page.goto(BASE + '/home-decor/seated-dog-figurine-grey-white-wa0006', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const res = await page.evaluate(() => {
    return window.axe.run({
      runOnly: { type: 'tag', values: ['wcag2aa'] },
      resultTypes: ['violations'],
    });
  });
  for (const v of res.violations) {
    console.log('[' + v.impact + '] ' + v.id + ': ' + v.description);
    for (const n of v.nodes) {
      console.log('   target=' + n.target.join(',') + ' :: ' + n.failureSummary);
    }
  }
  if (res.violations.length === 0) console.log('NO VIOLATIONS');
  await browser.close();
})();
