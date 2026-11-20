import { chromium } from '@playwright/test';

const viewports = [320, 375, 390, 430, 768, 1024, 1280, 1440];
const url = 'http://localhost:3097/';

const browser = await chromium.launch();
const page = await browser.newPage();

const results = [];
for (const width of viewports) {
  await page.setViewportSize({ width, height: 1200 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  const data = await page.evaluate(() => {
    const section = document.querySelector('[aria-label="Metal products showcase"]');
    if (!section) return { error: 'section not found' };
    const secStyle = getComputedStyle(section);
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const rows = Array.from(section.querySelectorAll('.metal-products-carousel'));
    const rowData = rows.map((row, i) => {
      const slides = Array.from(row.querySelectorAll('.metal-products-slide'));
      const track = row.querySelector('.metal-products-track');
      const viewport = row.querySelector('[class*="overflow-hidden"]');
      const vp = viewport ? viewport.getBoundingClientRect() : row.getBoundingClientRect();
      const widths = slides.map(s=>s.getBoundingClientRect().width).filter(Boolean);
      const avg = widths.length ? widths.reduce((a,b)=>a+b,0)/widths.length : 0;
      const gap = parseFloat(getComputedStyle(track||row).gap||'0')||0;
      const visibleApprox = avg ? Math.round(((vp.width + gap) / (avg + gap))*100)/100 : null;
      const navBtns = Array.from(row.querySelectorAll('button')).filter(b => /Previous slide|Next slide/i.test(b.textContent||''));
      return { row: i+1, slideCount: slides.length, navCount: navBtns.length, visibleApprox, firstW: widths[0]?Math.round(widths[0]*100)/100:null };
    });
    const wishBtns = Array.from(section.querySelectorAll('button[aria-label*="wishlist" i]'));
    const viewLinks = Array.from(section.querySelectorAll('a')).filter(a => /view details/i.test(a.textContent||''));
    const enquireLinks = Array.from(section.querySelectorAll('a')).filter(a => /enquire now/i.test(a.textContent||''));
    const wa = Array.from(section.querySelectorAll('a[data-testid="whatsapp-direct-link"], button[data-testid="whatsapp-chooser-trigger"]'));
    const enquire = enquireLinks[0];
    const enquireStyle = enquire ? (()=>{ const cs=getComputedStyle(enquire); const r=enquire.getBoundingClientRect(); return { bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius, h: Math.round(r.height), hasArrow: !!enquire.querySelector('svg') }; })() : null;
    const waStyle = wa[0] ? (()=>{ const cs=getComputedStyle(wa[0]); return { border: cs.borderColor, color: cs.color, bg: cs.backgroundColor }; })() : null;
    const nav = Array.from(section.querySelectorAll('button')).find(b=>/Next slide/i.test(b.textContent||''));
    const navStyle = nav ? (()=>{ const cs=getComputedStyle(nav); return { bg: cs.backgroundColor, color: cs.color, border: cs.borderColor }; })() : null;
    const h2 = section.querySelector('h2');
    const pids = Array.from(section.querySelectorAll('[data-product-id]')).map(e=>e.getAttribute('data-product-id'));
    return {
      overflow,
      sectionBg: secStyle.backgroundColor,
      headingColor: h2 ? getComputedStyle(h2).color : null,
      rows: rowData,
      wishlistCount: wishBtns.length,
      viewCount: viewLinks.length,
      enquireCount: enquireLinks.length,
      waCount: wa.length,
      enquireStyle, waStyle, navStyle,
      totalCards: pids.length,
      uniquePids: new Set(pids).size,
    };
  });
  results.push({ width, data });
}

// mobile visibility of View Details (should be visible without hover)
await page.setViewportSize({ width: 375, height: 1200 });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);
const mobileViewDetails = await page.evaluate(() => {
  const card = document.querySelector('[aria-label="Metal products showcase"] [data-testid="metal-product-card"]');
  if (!card) return null;
  const link = Array.from(card.querySelectorAll('a')).find(a=>/view details/i.test(a.textContent||''));
  const container = link?.parentElement;
  const cs = container ? getComputedStyle(container) : null;
  return { opacity: cs?.opacity, transform: cs?.transform, display: cs?.display, href: link?.getAttribute('href')||null };
});

// desktop hover/focus and interactions
await page.setViewportSize({ width: 1280, height: 1200 });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);
const interactions = await page.evaluate(async () => {
  const section = document.querySelector('[aria-label="Metal products showcase"]');
  if (!section) return { error: 'no section' };
  const firstCard = section.querySelector('[data-testid="metal-product-card"]');
  const wish = firstCard?.querySelector('button[aria-label*="wishlist" i]');
  const viewLink = Array.from(firstCard?.querySelectorAll('a')||[]).find(a=>/view details/i.test(a.textContent||''));
  const viewContainer = viewLink?.parentElement;
  const beforeHover = viewContainer ? getComputedStyle(viewContainer).opacity : null;
  const imgWrap = firstCard?.querySelector('.group\\/image, .relative.aspect-\\[4\\/5\\]');
  imgWrap?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  imgWrap?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  await new Promise(r=>setTimeout(r, 400));
  const afterHover = viewContainer ? getComputedStyle(viewContainer).opacity : null;
  viewLink?.focus();
  await new Promise(r=>setTimeout(r, 200));
  const afterFocus = viewContainer ? getComputedStyle(viewContainer).opacity : null;

  const beforePressed = wish?.getAttribute('aria-pressed');
  const beforeLabel = wish?.getAttribute('aria-label');
  wish?.click();
  await new Promise(r=>setTimeout(r, 900));
  const afterPressed = wish?.getAttribute('aria-pressed');
  const afterLabel = wish?.getAttribute('aria-label');

  const rows = Array.from(section.querySelectorAll('.metal-products-carousel'));
  const navOf = (row, which) => Array.from(row.querySelectorAll('button')).filter(b=>/Previous slide|Next slide/i.test(b.textContent||''))[which];
  const getLeft = (row) => { const s=row.querySelector('.metal-products-slide'); return s?Math.round(s.getBoundingClientRect().left*100)/100:null; };
  const b = { r1: getLeft(rows[0]), r2: getLeft(rows[1]) };
  navOf(rows[0],1)?.click();
  await new Promise(r=>setTimeout(r, 800));
  const a1 = { r1: getLeft(rows[0]), r2: getLeft(rows[1]) };
  navOf(rows[1],1)?.click();
  await new Promise(r=>setTimeout(r, 800));
  const a2 = { r1: getLeft(rows[0]), r2: getLeft(rows[1]) };
  const shuffle = Array.from(section.querySelectorAll('button')).find(b=>/shuffle products/i.test(b.textContent||b.getAttribute('aria-label')||''));
  shuffle?.click();
  await new Promise(r=>setTimeout(r, 1000));
  const as = { r1: getLeft(rows[0]), r2: getLeft(rows[1]) };

  const enquire = Array.from(firstCard?.querySelectorAll('a')||[]).find(a=>/enquire now/i.test(a.textContent||''));
  const wa = firstCard?.querySelector('a[data-testid="whatsapp-direct-link"], button[data-testid="whatsapp-chooser-trigger"]');
  return {
    view: { beforeHover, afterHover, afterFocus, href: viewLink?.getAttribute('href')||null },
    wishlist: { beforePressed, beforeLabel, afterPressed, afterLabel },
    carousel: { before: b, afterR1Next: a1, afterR2Next: a2, afterShuffle: as, shuffleFound: !!shuffle },
    enquireHref: enquire?.getAttribute('href')||null,
    waHref: wa?.getAttribute('href')||null,
  };
});

console.log(JSON.stringify({ viewports: results, mobileViewDetails, interactions }, null, 2));
await browser.close();
