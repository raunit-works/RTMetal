const fs = require('fs');
const buf = fs.readFileSync('a11y-report.json');
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

function inspect(node, depth, maxDepth) {
  if (depth > maxDepth) return;
  const pad = '  '.repeat(depth);
  if (Array.isArray(node)) {
    console.log(pad + 'ARRAY len=' + node.length);
    if (node.length) inspect(node[0], depth + 1, maxDepth);
    return;
  }
  if (node && typeof node === 'object') {
    const keys = Object.keys(node);
    console.log(pad + 'KEYS: ' + keys.join(', '));
    // recurse into interesting keys
    for (const k of keys) {
      if (k === 'tests' || k === 'suites' || k === 'specs' || k === 'projects') {
        inspect(node[k], depth + 1, maxDepth);
      }
    }
  }
}
inspect(r, 0, 4);
