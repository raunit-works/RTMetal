const fs = require('fs');
const buf = fs.readFileSync('a11y-report3.json');
let raw;
if (buf[0] === 0xff && buf[1] === 0xfe) {
  raw = buf.toString('utf16le');
} else if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
  raw = buf.toString('utf8').slice(1);
} else {
  raw = buf.toString('utf8');
}
if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
const r = JSON.parse(raw);
function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node.tests)) {
    for (const t of node.tests) {
      for (const ann of t.annotations || []) {
        try {
          const d = JSON.parse(ann.description);
          console.log('=== ', d.route, d.project);
          for (const v of d.details || []) {
            if (v.impact !== 'serious') continue;
            console.log('  [' + v.impact + '] ' + v.id);
            for (const n of v.nodes || []) {
              console.log('    target=' + n.target.join(','));
              console.log('    summary=' + n.failureSummary);
            }
          }
        } catch (e) {}
      }
    }
  }
  for (const k of ['tests', 'suites', 'specs']) {
    if (Array.isArray(node[k])) {
      for (const c of node[k]) walk(c);
    }
  }
}
walk(r);
