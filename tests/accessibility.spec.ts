import { test, expect } from '@playwright/test';
import path from 'path';

const AXE_PATH = path.resolve(process.cwd(), 'node_modules/axe-core/axe.min.js');

// Public routes exercised for automated accessibility acceptance.
// Admin/auth routes are excluded (require authentication; covered by robots noindex).
const ROUTES = [
  { name: 'Homepage', path: '/' },
  { name: 'About Us', path: '/about' },
  { name: 'Home Decor', path: '/home-decor' },
  { name: 'Category (decorative-accessories)', path: '/home-decor/category/decorative-accessories' },
  { name: 'Product Detail (onyx-sculptural-vase)', path: '/home-decor/onyx-sculptural-vase' },
  { name: 'Metal Services', path: '/metal-coating' },
  { name: 'Before & After', path: '/before-after' },
];

async function injectAxe(page) {
  await page.addScriptTag({ path: AXE_PATH });
}

async function runAxe(page) {
  return await page.evaluate(() => {
    return (window as unknown as { axe?: { run: (opts?: any) => Promise<any> } }).axe.run({
      runOnly: {
        type: 'tag',
        values: ['wcag2aa', 'wcag21aa', 'wcag22aa'],
      },
      resultTypes: ['violations', 'incomplete', 'passes'],
    });
  });
}

function formatViolation(v) {
  return {
    id: v.id,
    impact: v.impact,
    tags: v.tags,
    description: v.description,
    help: v.help,
    nodes: v.nodes.map((n) => ({
      html: n.html,
      target: n.target,
      failureSummary: n.failureSummary,
    })),
  };
}

for (const route of ROUTES) {
  test(`axe: ${route.name} (${route.path}) has no critical/serious WCAG violations`, async ({ page }) => {
    await injectAxe(page);
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const results = await runAxe(page);
    const violations = (results.violations ?? []).filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    const allViolations = results.violations ?? [];

    test.info().annotations.push({
      type: `${route.name} axe report`,
      description: JSON.stringify(
        {
          route: route.path,
          violations: allViolations.length,
          criticalSerious: violations.length,
          incomplete: (results.incomplete ?? []).length,
          passes: (results.passes ?? []).length,
          details: allViolations.map(formatViolation),
        },
        null,
        2
      ),
    });

    expect(violations).toEqual([]);
  });
}
