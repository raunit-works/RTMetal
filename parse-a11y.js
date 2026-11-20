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

function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node.tests)) {
    for (const t of node.tests) {
      console.log('TEST [' + t.status + '] :: ' + t.title);
      for (const ann of t.annotations || []) {
        try {
          const d = JSON.parse(ann.description);
          console.log('   route=', d.route, '| project=', d.project);
          console.log('   total=', d.violations, ' crit=', d.critical, ' serious=', d.serious, ' mod=', d.moderate, ' minor=', d.minor, '| incomplete=', d.incomplete, ' passes=', d.passes);
          for (const v of d.details || []) {
            console.log('     [' + v.impact + '] ' + v.id + ': ' + v.description);
            for (const n of v.nodes || []) {
              console.log('       target=' + n.target.join(',') + ' :: ' + n.failureSummary);
            }
          }
          for (const ic of d.incompleteChecks || []) {
            console.log('     INCOMPLETE ' + ic.id + ': ' + ic.description);
          }
        } catch (e) {
          console.log('   ann err', e.message);
        }
      }
    }
  }
  for (const k of ['tests', 'suites', 'specs']) {
    if (Array.isArray(node[k])) {
      for (const child of node[k]) walk(child);
    }
  }
}
walk(r);
