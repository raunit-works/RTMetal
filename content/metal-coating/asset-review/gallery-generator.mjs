import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlDir = __dirname;

const finSourceDir = path.resolve(htmlDir, '../../../RT METAL CATALOGUE/01-METAL-FINISHES/Other');
const whatsappSourceDir = path.resolve(htmlDir, '../../../RT METAL CATALOGUE/03-UNCATEGORIZED/WhatsApp-Images');

const htmlPath = path.join(htmlDir, 'service-image-review.html');
const validationPath = path.join(htmlDir, 'gallery-validation.json');

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
      directory: path.basename(dir),
      parentDirectory: path.basename(path.dirname(dir)),
      category,
      id,
    });
  }
  records.sort((a, b) => a.name.localeCompare(b.name));
  return records;
}

const finRecords = enumerateImages(finSourceDir, 'Metal Finishing');
const whatsappRecords = enumerateImages(whatsappSourceDir, 'WhatsApp Images');

const allRecords = [...finRecords, ...whatsappRecords];

for (const record of allRecords) {
  const relPath = path.relative(htmlDir, record.absolutePath);
  record.relativePath = relPath.split(path.sep).join('/');
  record.urlPath = encodeURI(record.relativePath);
  record.exists = fs.existsSync(record.absolutePath);
  record.resolvedAbsolute = path.resolve(htmlDir, record.relativePath);
  record.pathMatches = record.resolvedAbsolute === record.absolutePath;
  record.insideSourceDir = record.absolutePath.startsWith(finSourceDir) || record.absolutePath.startsWith(whatsappSourceDir);
}

const idCounts = {};
for (const record of allRecords) {
  if (record.id) {
    idCounts[record.id] = (idCounts[record.id] || 0) + 1;
  }
}
const duplicateIds = Object.entries(idCounts)
  .filter(([, count]) => count > 1)
  .map(([id]) => id);

function htmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function imageCardHtml(record) {
  const escapedName = htmlEscape(record.name);
  const escapedCategory = htmlEscape(record.category);
  const escapedId = record.id ? htmlEscape(record.id) : '&mdash;';
  const imgSrc = record.urlPath;
  return `
    <div class="card">
      <a href="${imgSrc}" target="_blank" rel="noopener noreferrer">
        <img src="${imgSrc}" alt="${escapedName}" loading="lazy">
      </a>
      <div class="card-info">
        <div class="card-filename">${escapedName}</div>
        <div class="card-category">${escapedCategory}</div>
        <div class="card-id">ID: ${escapedId}</div>
        <div class="card-status">REVIEW REQUIRED</div>
      </div>
    </div>
  `;
}

const finSection = allRecords.filter(r => r.category === 'Metal Finishing');
const whatsappSection = allRecords.filter(r => r.category === 'WhatsApp Images');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RT METAL Coating - Service Image Review Gallery</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f7; color: #333; padding: 20px; }
  header { background: #1a1a1a; color: #fff; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
  header h1 { margin-bottom: 8px; font-size: 1.5rem; }
  header p { font-size: 0.9rem; color: #ccc; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 40px; }
  .card { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
  .card img { width: 100%; height: 160px; object-fit: cover; display: block; background: #f0f0f0; cursor: pointer; }
  .card-info { padding: 10px; display: flex; flex-direction: column; gap: 4px; }
  .card-filename { font-size: 0.85rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .card-category { font-size: 0.75rem; color: #666; }
  .card-id { font-size: 0.75rem; color: #666; font-family: monospace; }
  .card-status { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #856404; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 2px 6px; display: inline-block; width: fit-content; }
  .section { margin-bottom: 40px; }
  .section h2 { font-size: 1.5rem; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #1a1a1a; }
  .stats { display: flex; gap: 20px; margin-bottom: 20px; }
  .stat-box { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); flex: 1; }
  .stat-number { font-size: 2rem; font-weight: 700; color: #1a1a1a; }
  .stat-label { font-size: 0.85rem; color: #666; margin-top: 4px; }
  .disclaimer { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .disclaimer h3 { margin-top: 0; color: #856404; font-size: 1rem; }
  .disclaimer p { margin: 4px 0; color: #856404; font-size: 0.9rem; }
  .note { font-size: 0.8rem; color: #666; font-style: italic; margin-top: 8px; }
</style>
</head>
<body>
  <header>
    <h1>RT METAL Coating - Service Image Review Gallery</h1>
    <p>Catalogue Source: RT METAL CATALOGUE</p>
    <p>Status: Development Draft - Not Client Approved - REVIEW REQUIRED</p>
  </header>

  <div class="disclaimer">
    <h3>&#10071; Important Limitations</h3>
    <p><strong>No semantic visual inspection was performed.</strong> All classifications are based on filename and directory structure only.</p>
    <p><strong>No images are client-approved.</strong> All images require client approval before any public use.</p>
    <p><strong>No coating-process classification is assigned.</strong> No FIN images are associated with PVD; no WhatsApp images are associated with PU.</p>
    <p><strong>Image paths are relative to:</strong> <code>content/metal-coating/asset-review/service-image-review.html</code></p>
  </div>

  <div class="section">
    <h2>A. Metal Finishing &#8212; ${finSection.length} images</h2>
    <div class="stats">
      <div class="stat-box"><div class="stat-number">${finSection.length}</div><div class="stat-label">Images Found</div></div>
      <div class="stat-box"><div class="stat-number">0</div><div class="stat-label">Client Approved</div></div>
    </div>
    <div class="grid" id="fin-gallery">
${finSection.map(imageCardHtml).join('')}
    </div>
    <p class="note">Source: RT METAL CATALOGUE/01-METAL-FINISHES/Other/ &#8212; All images marked REVIEW REQUIRED.</p>
  </div>

  <div class="section">
    <h2>B. WhatsApp Images &#8212; ${whatsappSection.length} images</h2>
    <div class="stats">
      <div class="stat-box"><div class="stat-number">${whatsappSection.length}</div><div class="stat-label">Images Found</div></div>
      <div class="stat-box"><div class="stat-number">0</div><div class="stat-label">Client Approved</div></div>
    </div>
    <div class="grid" id="whatsapp-gallery">
${whatsappSection.map(imageCardHtml).join('')}
    </div>
    <p class="note">Source: RT METAL CATALOGUE/03-UNCATEGORIZED/WhatsApp-Images/ &#8212; All images marked REVIEW REQUIRED.</p>
  </div>

  <footer style="margin-top: 40px; padding: 20px; background: #1a1a1a; color: #fff; border-radius: 8px;">
    <h3>Review Status</h3>
    <p>All ${allRecords.length} images are marked <strong>REVIEW REQUIRED</strong>.</p>
    <p>No images verified for public use. No service associations inferred.</p>
  </footer>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');

const missingImagePaths = allRecords.filter(r => !r.exists).map(r => r.relativePath);
const resolvedImagePaths = allRecords.filter(r => r.exists).length;
const generatedImageElements = allRecords.length;

const validation = {
  expectedImages: 87,
  foundImages: allRecords.length,
  generatedImageElements,
  resolvedImagePaths,
  missingImagePaths,
  duplicateIds,
  pass: allRecords.length === 87 &&
        generatedImageElements === 87 &&
        resolvedImagePaths === 87 &&
        missingImagePaths.length === 0 &&
        duplicateIds.length === 0
};

fs.writeFileSync(validationPath, JSON.stringify(validation, null, 2), 'utf8');

console.log('Gallery generation complete.');
console.log(`FIN images: ${finRecords.length}`);
console.log(`WhatsApp images: ${whatsappRecords.length}`);
console.log(`Total: ${allRecords.length}`);
console.log(`Resolved paths: ${resolvedImagePaths}`);
console.log(`Missing paths: ${missingImagePaths.length}`);
console.log(`Duplicate IDs: ${duplicateIds.length}`);
console.log(`Validation pass: ${validation.pass}`);
