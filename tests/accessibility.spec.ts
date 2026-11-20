import { test, expect } from '@playwright/test';
import path from 'path';

const AXE_PATH = path.resolve(process.cwd(), 'node_modules/axe-core/axe.min.js');

interface AxeWindow extends Window {
  axe?: {
    run: (opts?: any) => Promise<any>;
  };
}

interface AxeViolation {
  id: string;
  impact: string;
  tags: string[];
  description: string;
  help: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

interface AxeResult {
  violations: AxeViolation[] | null;
  incomplete: any[] | null;
  passes: any[] | null;
}

// Public routes exercised for automated accessibility acceptance.
// Admin/auth routes are excluded (require authentication; covered by robots noindex).
//
// NOTE: The previous route list referenced '/home-decor/category/decorative-accessories'
// and '/home-decor/onyx-sculptural-vase'. Both return 404 in the current staging
// database (Supabase-authoritative mode; static fallback is disabled), so they are
// replaced with routes that return 200. There is no separate Contact/enquiry page
// route - "Contact" is a /#contact anchor on the homepage.
const ROUTES = [
  { name: 'Homepage', path: '/' },
  { name: 'About Us', path: '/about' },
  { name: 'Home Decor', path: '/home-decor' },
  { name: 'Product Detail (seated-dog-figurine)', path: '/home-decor/seated-dog-figurine-grey-white-wa0006' },
  { name: 'Metal Services', path: '/metal-coating' },
  { name: 'Before & After', path: '/before-after' },
  { name: 'Product Detail (metal-p0026)', path: '/metal-coating/product/metal-p0026-abstract-continuous-line-wall-sculpture' },
];

async function injectAxe(page: import('@playwright/test').Page) {
  await page.addScriptTag({ path: AXE_PATH });
}

async function runAxe(page: import('@playwright/test').Page): Promise<AxeResult> {
  return await page.evaluate(() => {
    const w = window as unknown as AxeWindow;
    return w.axe?.run({
      runOnly: {
        type: 'tag',
        values: ['wcag2aa', 'wcag21aa', 'wcag22aa'],
      },
      resultTypes: ['violations', 'incomplete', 'passes'],
    }) ?? { violations: null, incomplete: null, passes: null };
  });
}

function formatViolation(v: AxeViolation) {
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
  test(`axe: ${route.name} (${route.path}) has no critical/serious WCAG violations`, async ({
    page,
  }) => {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await injectAxe(page);
    await page.waitForTimeout(500);

    const axeGlobal = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      return {
        hasAxe: 'axe' in w,
        hasRun: w.axe && typeof (w.axe as any).run === 'function',
      };
    });
    if (!axeGlobal.hasAxe || !axeGlobal.hasRun) {
      throw new Error(`axe-core not available on ${route.path}: ${JSON.stringify(axeGlobal)}`);
    }

    const results = await runAxe(page);
    const allViolations = results.violations ?? [];
    const incomplete = results.incomplete ?? [];
    const passes = results.passes ?? [];

    const byImpact = (impact: string) => allViolations.filter((v: AxeViolation) => v.impact === impact);
    const critical = byImpact('critical');
    const serious = byImpact('serious');
    const moderate = byImpact('moderate');
    const minor = byImpact('minor');

    test.info().annotations.push({
      type: `${route.name} axe report`,
      description: JSON.stringify(
        {
          route: route.path,
          project: test.info().project.name,
          violations: allViolations.length,
          critical: critical.length,
          serious: serious.length,
          moderate: moderate.length,
          minor: minor.length,
          incomplete: incomplete.length,
          passes: passes.length,
          criticalSerious: critical.length + serious.length,
          details: allViolations.map(formatViolation),
          incompleteChecks: incomplete.map((i: any) => ({
            id: i.id,
            description: i.description,
          })),
        },
        null,
        2
      ),
    });

    expect(critical).toEqual([]);
    expect(serious).toEqual([]);
  });
}
