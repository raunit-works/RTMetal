import fs from 'fs';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3017';
const widths = [1920, 1440, 1024, 768, 480, 375, 320];
const baseRoutes = ['/', '/home-decor', '/metal-coating', '/wishlist', '/about'];

function uniq(arr){ return [...new Set((arr||[]).filter(Boolean))]; }

async function safeGoto(page, url, opts={}){
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: opts.timeout || 45000 });
    await page.waitForTimeout(opts.wait || 1400);
    return { ok: true, status: resp ? resp.status() : null, url: page.url() };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e), url: page.url() };
  }
}

async function measure(page){
  return page.evaluate(() => {
    const de = document.documentElement;
    const body = document.body;
    const sw = Math.max(de.scrollWidth, body ? body.scrollWidth : 0, de.offsetWidth, body ? body.offsetWidth : 0);
    const cw = de.clientWidth || window.innerWidth;
    const cards = Array.from(document.querySelectorAll('[data-testid="product-card"], [data-testid="metal-product-card"]')).slice(0, 20).map(card => {
      const id = card.getAttribute('data-product-id');
      const tid = card.getAttribute('data-testid');
      const name = card.querySelector('[data-testid="product-card-name"]');
      const category = card.querySelector('[data-testid="product-card-category"]');
      const finish = card.querySelector('[data-testid="product-card-finish"]');
      const actions = card.querySelector('[data-testid="product-card-actions"]');
      function info(el){
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = window.getComputedStyle(el);
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), text: (el.textContent||'').trim().slice(0,80), display: cs.display };
      }
      const ni = info(name), ai = info(actions);
      let overlap = false;
      if (ni && ai && ni.w>0 && ni.h>0 && ai.w>0 && ai.h>0) {
        overlap = !(ai.y >= ni.y + ni.h - 1 || ai.y + ai.h <= ni.y + 1 || ai.x >= ni.x + ni.w - 1 || ai.x + ai.w <= ni.x + 1);
      }
      return { id, tid, name: ni, category: info(category), finish: info(finish), actions: ai, overlap, hasVariants: card.getAttribute('data-has-variants') };
    });
    return { scrollWidth: sw, clientWidth: cw, overflow: sw - cw, cards, title: document.title, bodyText: (document.body?.innerText||'').slice(0,140) };
  }).catch(e => ({ error: String(e) }));
}

(async () => {
  const report = { base: BASE, startedAt: new Date().toISOString(), discovered: {}, routes: {}, responsive: [], interactions: {}, consoleErrors: [], pageErrors: [], requestFailures: [], badResponses: [] };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'en-US' });
  const page = await context.newPage();
  page.on('console', msg => { if (msg.type() === 'error') report.consoleErrors.push({ text: msg.text(), location: msg.location(), url: page.url() }); });
  page.on('pageerror', err => report.pageErrors.push({ message: String(err), stack: err && err.stack ? String(err.stack).slice(0,500) : null, url: page.url() }));
  page.on('requestfailed', req => report.requestFailures.push({ url: req.url(), method: req.method(), failure: req.failure(), page: page.url() }));
  page.on('response', res => { const s = res.status(); if (s >= 400) report.badResponses.push({ url: res.url(), status: s, method: res.request().method(), page: page.url() }); });

  await page.setViewportSize({ width: 1440, height: 900 });
  for (const r of ['/', '/home-decor', '/metal-coating']) {
    await safeGoto(page, BASE + r);
    const hrefs = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')).filter(Boolean)).catch(()=>[]);
    if (r === '/') report.discovered.home = uniq(hrefs);
    if (r === '/home-decor') report.discovered.homeDecor = uniq(hrefs);
    if (r === '/metal-coating') report.discovered.metalCoating = uniq(hrefs);
  }
  const allHrefs = uniq([...(report.discovered.home||[]), ...(report.discovered.homeDecor||[]), ...(report.discovered.metalCoating||[])]);
  const categoryLinks = allHrefs.filter(h => /\/(home-decor|metal-coating)\/category\//.test(h)).slice(0,4);
  const homeProductLinks = allHrefs.filter(h => /\/home-decor\/(?!category\/)[^?#/]+/.test(h)).slice(0,2);
  const metalProductLinks = allHrefs.filter(h => /\/metal-coating\/product\//.test(h)).slice(0,2);
  report.discovered.categoryLinks = categoryLinks;
  report.discovered.homeProductLinks = homeProductLinks;
  report.discovered.metalProductLinks = metalProductLinks;

  const routesToTest = uniq([...baseRoutes, ...categoryLinks, ...homeProductLinks, ...metalProductLinks]);
  report.discovered.routesToTest = routesToTest;

  for (const route of routesToTest) {
    await page.setViewportSize({ width: 1440, height: 900 });
    const nav = await safeGoto(page, route.startsWith('http') ? route : BASE + route, { wait: 1800 });
    const m = await measure(page);
    const counts = await page.evaluate(() => ({
      productCards: document.querySelectorAll('[data-testid="product-card"]').length,
      metalCards: document.querySelectorAll('[data-testid="metal-product-card"]').length,
      routeLoader: !!document.querySelector('[data-testid="route-loading-indicator"]'),
      h1: (document.querySelector('h1')?.textContent || '').trim().slice(0,120),
    })).catch(e=>({error:String(e)}));
    report.routes[route] = { nav, counts, overflow: m.overflow, cardCount: (m.cards||[]).length, title: m.title, bodyText: m.bodyText };
  }

  for (const route of routesToTest) {
    const url = route.startsWith('http') ? route : BASE + route;
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 900 });
      const nav = await safeGoto(page, url, { wait: 1200 });
      const m = await measure(page);
      report.responsive.push({ route, width: w, navStatus: nav.status, navUrl: nav.url, navError: nav.error||null, overflow: m.overflow, scrollWidth: m.scrollWidth, clientWidth: m.clientWidth, croppedOrOverlap: (m.cards||[]).filter(c => c.overlap || (c.actions && c.actions.h===0) || (c.name && c.name.h===0)).slice(0,10), sampleCard: (m.cards||[])[0] || null, cardCount: (m.cards||[]).length });
    }
  }

  const interactions = {};
  await page.setViewportSize({ width: 390, height: 844 });

  await safeGoto(page, BASE + '/home-decor');
  interactions.homeDecorCardCount = await page.locator('[data-testid="product-card"], [data-testid="metal-product-card"]').count();
  const hdCard = page.locator('[data-testid="product-card"], [data-testid="metal-product-card"]').first();
  if (await hdCard.count()) {
    const qv = hdCard.locator('button[aria-label="Quick view"]');
    if (await qv.count()) {
      await qv.click().catch(e=>interactions.quickViewError=String(e));
      await page.waitForTimeout(800);
      interactions.quickViewOpened = await page.locator('[role="dialog"][aria-label^="Quick view"]').count() > 0;
      interactions.quickViewEnquire = await page.locator('[role="dialog"] a:has-text("Enquire Now")').count() > 0;
      interactions.quickViewWhatsApp = await page.locator('[role="dialog"] button:has-text("Enquire via WhatsApp"), [role="dialog"] [data-testid="whatsapp-chooser-trigger"]').count() > 0;
      await page.locator('button[aria-label="Close quick view"]').click().catch(()=>page.keyboard.press('Escape'));
      await page.waitForTimeout(400);
      interactions.quickViewClosed = await page.locator('[role="dialog"][aria-label^="Quick view"]').count() === 0;
    }
    const variantBtns = hdCard.locator('[data-testid="finish-swatches"] button');
    interactions.variantButtons = await variantBtns.count();
    if (await variantBtns.count() > 0) {
      interactions.variantBefore = await hdCard.locator('[data-testid="selected-finish-name"]').innerText().catch(()=>null);
      interactions.variantImgBefore = await hdCard.locator('img').first().getAttribute('src').catch(()=>null);
      if (await variantBtns.count() > 1) {
        await variantBtns.nth(1).click({timeout:5000}).catch(e=>interactions.variantClickError=String(e));
        await page.waitForTimeout(500);
        interactions.variantAfter = await hdCard.locator('[data-testid="selected-finish-name"]').innerText().catch(()=>null);
        interactions.variantImgAfter = await hdCard.locator('img').first().getAttribute('src').catch(()=>null);
      }
    }
    const heart = hdCard.locator('[data-testid="wishlist-toggle"]');
    if (await heart.count()) {
      await heart.click().catch(e=>interactions.wishlistError=String(e));
      await page.waitForTimeout(700);
      interactions.wishlistGuestPrompt = await page.locator('text=Sign in required').count() > 0;
      await page.getByRole('button', {name:'Cancel'}).click().catch(()=>{});
      await page.waitForTimeout(300);
    }
    const wa = hdCard.locator('[data-testid="whatsapp-chooser-trigger"]');
    interactions.whatsappChooserPresent = await wa.count() > 0;
    if (await wa.count()) {
      await wa.click().catch(e=>interactions.waError=String(e));
      await page.waitForTimeout(500);
      interactions.whatsappChooserOpened = await page.locator('[data-testid="whatsapp-chooser"]').count() > 0;
      interactions.whatsappOptions = await page.locator('[data-testid="whatsapp-contact-option"]').count();
      interactions.whatsappOptionHrefs = await page.locator('[data-testid="whatsapp-contact-option"]').evaluateAll(els => els.map(e => e.getAttribute('href'))).catch(()=>[]);
      await page.keyboard.press('Escape').catch(()=>{});
      await page.waitForTimeout(200);
    }
    const enquire = hdCard.locator('[data-testid="product-card-enquire"] a').first();
    if (await enquire.count()) {
      interactions.enquireHref = await enquire.getAttribute('href');
      await Promise.all([
        page.waitForLoadState('domcontentloaded').catch(()=>null),
        enquire.click().catch(e=>interactions.enquireClickError=String(e))
      ]);
      await page.waitForTimeout(1500);
      interactions.enquireUrl = page.url();
    }
  }

  await safeGoto(page, BASE + '/metal-coating');
  interactions.metalPageCards = await page.locator('[data-testid="product-card"], [data-testid="metal-product-card"]').count();
  if (interactions.metalPageCards > 0) {
    const mcard = page.locator('[data-testid="product-card"], [data-testid="metal-product-card"]').first();
    interactions.metalCardTestId = await mcard.getAttribute('data-testid').catch(()=>null);
    interactions.metalWhatsappDirect = await mcard.locator('[data-testid="whatsapp-direct-link"]').count() > 0;
    interactions.metalWhatsappChooser = await mcard.locator('[data-testid="whatsapp-chooser-trigger"]').count() > 0;
    interactions.metalDirectHref = await mcard.locator('[data-testid="whatsapp-direct-link"]').getAttribute('href').catch(()=>null);
  }

  // normal link navigation + loader observation
  await safeGoto(page, BASE + '/');
  await page.evaluate(() => {
    window.__rtLoaderEvents = [];
    const el = document.querySelector('[data-testid="route-loading-indicator"]');
    if (el) {
      const obs = new MutationObserver(() => window.__rtLoaderEvents.push({t:Date.now(), v: el.getAttribute('data-loading')}));
      obs.observe(el, { attributes: true, attributeFilter: ['data-loading'] });
      window.__rtLoaderObs = obs;
    }
  });
  const navLink = page.locator('a[href="/home-decor"]').first();
  interactions.homeHasDecorLink = await navLink.count();
  if (await navLink.count()) {
    await Promise.all([
      page.waitForURL('**/home-decor', {timeout: 20000}).catch(()=>null),
      navLink.click().catch(e=>interactions.homeToDecorError=String(e))
    ]);
    await page.waitForTimeout(800);
    interactions.homeToDecorUrl = page.url();
    interactions.loaderEventsNav = await page.evaluate(() => window.__rtLoaderEvents || []).catch(()=>[]);
  }

  // programmatic history navigation: indicator should react to pushState and then clear (failsafe/commit)
  await safeGoto(page, BASE + '/about');
  await page.evaluate(() => {
    window.__rtLoaderEvents2 = [];
    const el = document.querySelector('[data-testid="route-loading-indicator"]');
    if (el) {
      const obs = new MutationObserver(() => window.__rtLoaderEvents2.push({t:Date.now(), v: el.getAttribute('data-loading')}));
      obs.observe(el, { attributes: true, attributeFilter: ['data-loading'] });
    }
  });
  await page.evaluate(() => { window.history.pushState({}, '', '/home-decor?qa=prog'); });
  await page.waitForTimeout(120);
  interactions.pushStateLoadingImmediate = await page.locator('[data-testid="route-loading-indicator"]').getAttribute('data-loading').catch(()=>null);
  await page.waitForTimeout(2500);
  interactions.pushStateLoadingAfter = await page.locator('[data-testid="route-loading-indicator"]').getAttribute('data-loading').catch(()=>null);
  interactions.pushStateEvents = await page.evaluate(() => window.__rtLoaderEvents2 || []).catch(()=>[]);
  interactions.pushStateUrl = page.url();

  // replaceState meaningful
  await page.evaluate(() => {
    window.__rtLoaderEvents3 = [];
    const el = document.querySelector('[data-testid="route-loading-indicator"]');
    if (el) {
      const obs = new MutationObserver(() => window.__rtLoaderEvents3.push({t:Date.now(), v: el.getAttribute('data-loading')}));
      obs.observe(el, { attributes: true, attributeFilter: ['data-loading'] });
    }
    window.history.replaceState({}, '', '/metal-coating?qa=prog2');
  });
  await page.waitForTimeout(120);
  interactions.replaceStateLoadingImmediate = await page.locator('[data-testid="route-loading-indicator"]').getAttribute('data-loading').catch(()=>null);
  await page.waitForTimeout(2500);
  interactions.replaceStateLoadingAfter = await page.locator('[data-testid="route-loading-indicator"]').getAttribute('data-loading').catch(()=>null);
  interactions.replaceStateEvents = await page.evaluate(() => window.__rtLoaderEvents3 || []).catch(()=>[]);

  report.interactions = interactions;

  // trim logs
  const trim = (arr,n=150)=>arr.slice(0,n);
  report.consoleErrors = trim(report.consoleErrors);
  report.pageErrors = trim(report.pageErrors);
  report.requestFailures = trim(report.requestFailures);
  report.badResponses = trim(report.badResponses);

  await browser.close();
  fs.writeFileSync('qa-rectify-results.json', JSON.stringify(report, null, 2));
  const overflowIssues = report.responsive.filter(r => (r.overflow||0) > 1);
  const cropIssues = report.responsive.filter(r => (r.croppedOrOverlap||[]).length > 0);
  console.log(JSON.stringify({
    routesTested: Object.keys(report.routes).length,
    responsiveChecks: report.responsive.length,
    overflowIssues: overflowIssues.length,
    overflowSamples: overflowIssues.slice(0,10).map(x=>({route:x.route,width:x.width,overflow:x.overflow})),
    cropIssues: cropIssues.length,
    cropSamples: cropIssues.slice(0,10).map(x=>({route:x.route,width:x.width,items:x.croppedOrOverlap})),
    consoleErrors: report.consoleErrors.length,
    pageErrors: report.pageErrors.length,
    requestFailures: report.requestFailures.length,
    badResponses: report.badResponses.length,
    discovered: report.discovered,
    interactions: report.interactions,
    routes: report.routes
  }, null, 2));
})();
