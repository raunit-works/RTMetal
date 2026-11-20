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
console.log('TOP KEYS:', Object.keys(r));
console.log('stats:', JSON.stringify(r.stats));
console.log('suites isArray:', Array.isArray(r.suites), 'len:', r.suites ? r.suites.length : null);
