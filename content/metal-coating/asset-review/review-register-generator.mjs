import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const finSourceDir = path.resolve(__dirname, '../../../RT METAL CATALOGUE/01-METAL-FINISHES/Other');
const whatsappSourceDir = path.resolve(__dirname, '../../../RT METAL CATALOGUE/03-UNCATEGORIZED/WhatsApp-Images');

const csvPath = path.join(__dirname, 'review-register.csv');

function enumerateImages(dir, category) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const records = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const fullPath = path.join(dir, entry.name);
    const stat = fs.statSync(fullPath);
    let id = null;
    const finMatch = entry.name.match(/^FIN-(\d+)-main\.(jpeg|jpg|png)$/i);
    if (finMatch) {
      id = `FIN-${finMatch[1]}`;
    }
    records.push({
      name: entry.name,
      absolutePath: fullPath,
      size: stat.size,
      category,
      id,
      exists: fs.existsSync(fullPath),
    });
  }
  records.sort((a, b) => a.name.localeCompare(b.name));
  return records;
}

const finRecords = enumerateImages(finSourceDir, 'Metal Finishing');
const whatsappRecords = enumerateImages(whatsappSourceDir, 'WhatsApp Images');
const allRecords = [...finRecords, ...whatsappRecords];

function csvEscape(val) {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const header = [
  'Image ID',
  'Original filename',
  'Exact source path',
  'Source category',
  'Visual subject',
  'Proposed finish category',
  'Potential principal service',
  'Image quality',
  'Review decision',
  'Coating process verified',
  'Source authenticity verified',
  'Client publication permission',
  'Notes',
];

const rows = allRecords.map(r => [
  r.id || '',
  csvEscape(r.name),
  csvEscape(r.absolutePath),
  csvEscape(r.category),
  '', // Visual subject - blank until reviewed
  '', // Proposed finish category - blank until reviewed
  '', // Potential principal service - blank until reviewed
  '', // Image quality - blank until reviewed
  'NOT REVIEWED',
  'NO',
  'UNKNOWN',
  'PENDING',
  '', // Notes
]);

let csv = header.join(',') + '\n';
for (const row of rows) {
  csv += row.join(',') + '\n';
}

fs.writeFileSync(csvPath, csv, 'utf8');

console.log('Review register generated: ' + csvPath);
console.log('FIN images: ' + finRecords.length);
console.log('WhatsApp images: ' + whatsappRecords.length);
console.log('Total rows: ' + allRecords.length);
console.log('All files exist: ' + allRecords.every(r => r.exists));
