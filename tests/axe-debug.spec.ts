import { test } from '@playwright/test';
import path from 'path';

const AXE_PATH = path.resolve(process.cwd(), 'node_modules/axe-core/axe.min.js');

test('debug axe global', async ({ page }) => {
  await page.addScriptTag({ path: AXE_PATH });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const axeGlobal = await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>;
    return {
      hasAxe: 'axe' in w,
      axeType: typeof w.axe,
      axeKeys: w.axe ? Object.keys(w.axe) : null,
      hasRun: w.axe && typeof (w.axe as any).run,
    };
  });
  console.log('AXE DEBUG:', JSON.stringify(axeGlobal));
});
