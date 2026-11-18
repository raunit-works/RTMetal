import fs from 'node:fs';
import path from 'node:path';

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error('Usage: node reports/performance/summarise.mjs <run1.json> <run2.json> ...');
  process.exit(1);
}

const runs = inputs.map((file) => ({
  file,
  report: JSON.parse(fs.readFileSync(file, 'utf8')),
}));

const keyOf = (r) => `${r.viewport}::${r.route}`;

const metrics = {
  ttfbMs: (r) => r.ttfbMs,
  fcpMs: (r) => r.fcpMs,
  lcpMs: (r) => r.lcpMs,
  cls: (r) => r.cls,
  longTaskMs: (r) => r.longTaskMs,
  requests: (r) => r.resourceCount,
  totalTransferBytes: (r) => r.totalTransferBytes,
  documentTransferBytes: (r) => r.documentTransferBytes,
  scriptBytes: (r) => (r.byType?.Script?.bytes ?? 0) + (r.byType?.Other?.bytes ?? 0) * 0,
  rawScriptBytes: (r) => r.byType?.Script?.bytes ?? 0,
  imageBytes: (r) => r.byType?.Image?.bytes ?? 0,
  fontBytes: (r) => r.byType?.Font?.bytes ?? 0,
  cssBytes: (r) => r.byType?.Stylesheet?.bytes ?? 0,
  mediaBytes: (r) => r.byType?.Media?.bytes ?? 0,
};

const groups = new Map();
for (const { report } of runs) {
  const results = Array.isArray(report.results) ? report.results : report;
  for (const row of results) {
    const key = keyOf(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
}

function median(values) {
  const numeric = values.filter((v) => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
  if (numeric.length === 0) return null;
  const mid = Math.floor(numeric.length / 2);
  return numeric.length % 2 === 0 ? (numeric[mid - 1] + numeric[mid]) / 2 : numeric[mid];
}

function round(value) {
  return typeof value === 'number' ? Math.round(value * 100) / 100 : value;
}

function kb(bytes) {
  return typeof bytes === 'number' ? `${Math.round((bytes / 1024) * 10) / 10} KB` : 'n/a';
}

const summary = [];
for (const [key, rows] of groups) {
  const [viewport, route] = key.split('::');
  const entry = { viewport, route, runs: rows.length };
  for (const [name, getter] of Object.entries(metrics)) {
    entry[name] = round(median(rows.map(getter)));
  }
  summary.push(entry);
}

const order = { desktop: 0, mobile: 1 };
summary.sort((a, b) => (order[a.viewport] ?? 9) - (order[b.viewport] ?? 9) || a.route.localeCompare(b.route));

const lines = [];
lines.push(`# Median performance (${runs.length} runs)`);
lines.push('');
lines.push(`Inputs: ${inputs.join(', ')}`);
lines.push('');
for (const viewport of ['desktop', 'mobile']) {
  const rows = summary.filter((r) => r.viewport === viewport);
  if (rows.length === 0) continue;
  lines.push(`## ${viewport}`);
  lines.push('');
  lines.push('| Route | TTFB | FCP | LCP | CLS | Req | Total | Script | Image | Font | CSS | Media |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const r of rows) {
    lines.push(
      `| ${r.route} | ${r.ttfbMs} ms | ${r.fcpMs} ms | ${r.lcpMs} ms | ${r.cls} | ${r.requests} | ${kb(
        r.totalTransferBytes,
      )} | ${kb(r.rawScriptBytes)} | ${kb(r.imageBytes)} | ${kb(r.fontBytes)} | ${kb(r.cssBytes)} | ${kb(
        r.mediaBytes,
      )} |`,
    );
  }
  lines.push('');
}

const outBase = path.basename(inputs[0]).replace(/-\d+\.json$/, '');
const mdPath = path.join(path.dirname(inputs[0]), `${outBase}-median.md`);
const jsonPath = path.join(path.dirname(inputs[0]), `${outBase}-median.json`);
fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);
fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(lines.join('\n'));
console.log(`\nWrote ${mdPath} and ${jsonPath}`);
