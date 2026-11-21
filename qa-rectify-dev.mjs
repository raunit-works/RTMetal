import fs from 'fs';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const widths = [1920, 1440, 1024, 768, 480, 375, 320];
const baseRoutes = ['/', '/home-decor', '/metal-coating', '/about', '/wishlist'];
const uniq = a => [...new Set((a||[]).filter(Boolean))];

async function goto(page, url, wait=2200){
  try{
    const resp = await page.goto(url, { waitUntil:'domcontentloaded', timeout:90000 });
    await page.waitForTimeout(wait);
    return { ok:true, status: resp? resp.status():null, url: page.url() };
  }catch(e){ return { ok:false, status:null, error:String(e.message||e), url: page.url() }; }
}

const measure = page => page.evaluate(() => {
  const de=document.documentElement, b=document.body;
  const cw=de.clientWidth||innerWidth;
  // Real scrollable overflow only (body.scrollWidth includes intentionally
  // off-canvas carousel slides whose scroller clips them).
  const sw=de.scrollWidth;
  const inScroller = el => {
    let node = el.parentElement;
    while (node && node !== b) {
      const ox = getComputedStyle(node).overflowX;
      if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
      node = node.parentElement;
    }
    return false;
  };
  const cards=[...document.querySelectorAll('[data-testid="product-card"],[data-testid="metal-product-card"]')].slice(0,30).map(card=>{
    const q=s=>card.querySelector(s);
    const inf=el=>{ if(!el) return null; const r=el.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),text:(el.textContent||'').trim().slice(0,70)}; };
    const ni=inf(q('[data-testid="product-card-name"]')), ai=inf(q('[data-testid="product-card-actions"]'));
    let overlap=false;
    if(ni&&ai&&ni.w>0&&ni.h>0&&ai.w>0&&ai.h>0){
      overlap=!(ai.y>=ni.y+ni.h-1||ai.y+ai.h<=ni.y+1||ai.x>=ni.x+ni.w-1||ai.x+ai.w<=ni.x+1);
    }
    const cr=card.getBoundingClientRect();
    const clipped = !inScroller(card) && cr.left < cw && cr.right > cw + 1;
    return { tid:card.getAttribute('data-testid'), id:card.getAttribute('data-product-id'), hasVariants:card.getAttribute('data-has-variants'),
      name:ni, category:inf(q('[data-testid="product-card-category"]')), finish:inf(q('[data-testid="product-card-finish"]')),
      variants:inf(q('[data-testid="product-card-variants"]')), actions:ai, overlap, clipped,
      swatches:card.querySelectorAll('[data-testid="finish-swatches"] button').length };
  });
  return { sw, cw, overflow:sw-cw, bodyScrollWidth:b?b.scrollWidth:null, cards, h1:(document.querySelector('h1')?.textContent||'').trim().slice(0,120),
    loader:!!document.querySelector('[data-testid="route-loading-indicator"]') };
}).catch(e=>({error:String(e)}));

(async () => {
  const N = ({ ok:true, status:200 });
  const report = { base:BASE, startedAt:new Date().toISOString(), discovered:{}, routes:{}, responsive:[], interactions:{}, consoleErrors:[], pageErrors:[], requestFailures:[], badResponses:[] };
  const browser = await chromium.launch({ headless:true });
  const ctx = await browser.newContext({ locale:'en-US' });
  const page = await ctx.newPage();
  page.on('console', m => { if(m.type()==='error') report.consoleErrors.push({ text:m.text().slice(0,300), url:page.url() }); });
  page.on('pageerror', e => report.pageErrors.push({ message:String(e).slice(0,400), url:page.url() }));
  page.on('requestfailed', r => report.requestFailures.push({ url:r.url(), failure:r.failure()?.errorText||'unknown', page:page.url() }));
  page.on('response', r => { if(r.status()>=400) report.badResponses.push({ url:r.url(), status:r.status(), page:page.url() }); });

  await page.setViewportSize({ width:1440, height:900 });
  for(const r of ['/', '/home-decor', '/metal-coating']){
    await goto(page, BASE + r, 2600);
    const hrefs = await page.$$eval('a[href]', as=>as.map(a=>a.getAttribute('href')).filter(Boolean)).catch(()=>[]);
    report.discovered[r] = uniq(hrefs);
  }
  const all = uniq(Object.values(report.discovered).flat());
  const product = all.filter(h=>/^\/home-decor\/[^/?#]+$/.test(h)).slice(0,2);
  const metal = all.filter(h=>/^\/metal-coating\/product\//.test(h)).slice(0,2);
  const routes = uniq([...baseRoutes, ...product, ...metal]);
  report.discovered.productLinks = product;
  report.discovered.metalProductLinks = metal;
  report.discovered.routes = routes;

  for(const route of routes){
    await page.setViewportSize({ width:1440, height:900 });
    const nav = await goto(page, BASE + route, 2600);
    const m = await measure(page);
    report.routes[route] = { nav, overflow:m.overflow, cardCount:m.cards?m.cards.length:0, h1:m.h1, loader:m.loader,
      cards:(m.cards||[]).map(c=>({tid:c.tid,name:c.name?.text,category:c.category?.text,finish:c.finish?.text,hasVariants:c.hasVariants,swatches:c.swatches,overlap:c.overlap})) };
  }

  for(const route of routes){
    for(const w of widths){
      await page.setViewportSize({ width:w, height:900 });
      const nav = await goto(page, BASE + route, 1500);
      const m = await measure(page);
      report.responsive.push({ route, width:w, status:nav.status, navError:nav.error||null, overflow:m.overflow,
        cardCount:m.cards?m.cards.length:0,
        cropped:(m.cards||[]).filter(c=>c.overlap||c.clipped||(c.actions&&c.actions.h===0)||(c.name&&c.name.h===0)).slice(0,8) });
    }
  }

  const I = report.interactions;
  await page.setViewportSize({ width:390, height:844 });
  await goto(page, BASE + '/home-decor', 3000);
  const hd = page.locator('[data-testid="product-card"],[data-testid="metal-product-card"]');
  I.homeDecorCards = await hd.count();
  if(I.homeDecorCards){
    const card = hd.first();
    const qv = card.locator('button[aria-label="Quick view"]');
    if(await qv.count()){
      await qv.click({force:true}).catch(e=>I.quickViewError=String(e));
      await page.waitForTimeout(900);
      I.quickViewOpened = await page.locator('[role="dialog"][aria-label^="Quick view"]').count()>0;
      I.quickViewEnquire = await page.locator('[role="dialog"] a:has-text("Enquire Now")').count()>0;
      I.quickViewWhatsApp = await page.locator('[role="dialog"] [data-testid="whatsapp-chooser-trigger"], [role="dialog"] button:has-text("WhatsApp")').count()>0;
      await page.keyboard.press('Escape').catch(()=>{});
      await page.waitForTimeout(500);
      I.quickViewClosed = await page.locator('[role="dialog"][aria-label^="Quick view"]').count()===0;
    }
    const sw = card.locator('[data-testid="finish-swatches"] button');
    I.variantButtons = await sw.count();
    if(I.variantButtons){
      I.variantBefore = await card.locator('[data-testid="selected-finish-name"]').innerText().catch(()=>null);
      I.imgBefore = await card.locator('img').first().getAttribute('src').catch(()=>null);
      if(I.variantButtons>1){
        await sw.nth(1).click({force:true}).catch(e=>I.variantClickError=String(e));
        await page.waitForTimeout(700);
        I.variantAfter = await card.locator('[data-testid="selected-finish-name"]').innerText().catch(()=>null);
        I.imgAfter = await card.locator('img').first().getAttribute('src').catch(()=>null);
      }
    }
    const heart = card.locator('[data-testid="wishlist-toggle"]');
    if(await heart.count()){
      await heart.click({force:true}).catch(e=>I.wishlistError=String(e));
      await page.waitForTimeout(900);
      I.wishlistGuestPrompt = await page.locator('text=Sign in required').count()>0;
      await page.getByRole('button',{name:'Cancel'}).click().catch(()=>{});
      await page.waitForTimeout(400);
    }
    const wa = card.locator('[data-testid="whatsapp-chooser-trigger"]');
    I.whatsappChooserPresent = await wa.count()>0;
    if(I.whatsappChooserPresent){
      await wa.click({force:true}).catch(e=>I.waError=String(e));
      await page.waitForTimeout(700);
      I.whatsappChooserOpened = await page.locator('[data-testid="whatsapp-chooser"]').count()>0;
      I.whatsappOptions = await page.locator('[data-testid="whatsapp-contact-option"]').count();
      I.whatsappHrefs = await page.locator('[data-testid="whatsapp-contact-option"]').evaluateAll(es=>es.map(e=>e.getAttribute('href'))).catch(()=>[]);
      await page.keyboard.press('Escape').catch(()=>{});
    }
    const enq = card.locator('[data-testid="product-card-enquire"] a');
    if(await enq.count()){
      I.enquireHref = await enq.getAttribute('href');
      const urlBefore = page.url();
      await Promise.all([ page.waitForLoadState('domcontentloaded').catch(()=>null), enq.click({force:true}).catch(e=>I.enquireError=String(e)) ]);
      await page.waitForTimeout(1800);
      I.enquireUrl = page.url();
      I.enquireNavigated = page.url()!==urlBefore;
    }
    I.cardTestId = await card.getAttribute('data-testid').catch(()=>null);
    I.cardHasVariants = await card.getAttribute('data-has-variants').catch(()=>null);
  }

  await goto(page, BASE + '/metal-coating', 3000);
  I.metalCards = await hd.count();
  if(I.metalCards){
    const c = hd.first();
    I.metalTestId = await c.getAttribute('data-testid').catch(()=>null);
    I.metalDirectLink = await c.locator('[data-testid="whatsapp-direct-link"]').count()>0;
    I.metalDirectHref = await c.locator('[data-testid="whatsapp-direct-link"]').getAttribute('href').catch(()=>null);
    I.metalChooser = await c.locator('[data-testid="whatsapp-chooser-trigger"]').count()>0;
  }

  // Loader: normal link navigation from header (desktop nav must be visible)
  await page.setViewportSize({ width:1440, height:900 });
  await goto(page, BASE + '/', 2600);
  const navLink = page.locator('header a[href="/home-decor"]').first();
  I.navLinkCount = await navLink.count();
  I.navLinkVisible = I.navLinkCount ? await navLink.isVisible().catch(()=>false) : false;
  if(await navLink.count()){
    await page.evaluate(()=>{
      window.__rtEv=[];
      const el=document.querySelector('[data-testid="route-loading-indicator"]');
      if(el){
        new MutationObserver(()=>window.__rtEv.push(el.getAttribute('data-loading'))).observe(el,{attributes:true,attributeFilter:['data-loading']});
        window.__rtEv.push('init:'+el.getAttribute('data-loading'));
      }
    });
    await Promise.all([ page.waitForURL('**/home-decor', {timeout:30000}).catch(()=>null), navLink.click({force:true}).catch(e=>I.navClickError=String(e)) ]);
    await page.waitForTimeout(1200);
    I.navUrl = page.url();
    I.loaderEventsNav = await page.evaluate(()=>window.__rtEv||[]).catch(()=>[]);
    I.loaderAfterNav = await page.locator('[data-testid="route-loading-indicator"]').getAttribute('data-loading').catch(()=>null);
  } else { I.navLinkMissing = true; }

  // Loader: programmatic pushState / replaceState
  await goto(page, BASE + '/home-decor', 2600);
  I.loaderPresentOnHomeDecor = await page.locator('[data-testid="route-loading-indicator"]').count()>0;
  const sample = async (fn) => {
    await page.evaluate(()=>{
      window.__rtEv2=[];
      const el=document.querySelector('[data-testid="route-loading-indicator"]');
      if(el){
        new MutationObserver(()=>window.__rtEv2.push(el.getAttribute('data-loading'))).observe(el,{attributes:true,attributeFilter:['data-loading']});
        window.__rtEv2.push('init:'+el.getAttribute('data-loading'));
      }
    });
    await page.evaluate(fn);
    await page.waitForTimeout(80);
    const immediate = await page.locator('[data-testid="route-loading-indicator"]').getAttribute('data-loading').catch(()=>null);
    await page.waitForTimeout(4000);
    const after = await page.locator('[data-testid="route-loading-indicator"]').getAttribute('data-loading').catch(()=>null);
    const events = await page.evaluate(()=>window.__rtEv2||[]).catch(()=>[]);
    return { immediate, after, events, url:page.url() };
  };
  I.pushState = await sample(()=>window.history.pushState({},'', '/home-decor?qa=prog'));
  I.replaceState = await sample(()=>window.history.replaceState({},'', '/metal-coating?qa=prog2'));

  const trim = (a,n=200)=>a.slice(0,n);
  report.consoleErrors=trim(report.consoleErrors); report.pageErrors=trim(report.pageErrors);
  report.requestFailures=trim(report.requestFailures); report.badResponses=trim(report.badResponses);

  await browser.close();
  fs.writeFileSync('qa-rectify-dev.json', JSON.stringify(report,null,2));
  const overflow = report.responsive.filter(r=>r.overflow>1);
  const crop = report.responsive.filter(r=>r.cropped.length>0);
  console.log(JSON.stringify({
    base:BASE, routes:Object.keys(report.routes).length, responsive:report.responsive.length,
    overflow:overflow.length, overflowSamples:overflow.slice(0,12).map(x=>({route:x.route,width:x.width,overflow:x.overflow,cardCount:x.cardCount})),
    crop:crop.length, cropSamples:crop.slice(0,12).map(x=>({route:x.route,width:x.width,items:x.cropped.length})),
    console:report.consoleErrors.length, pageErrors:report.pageErrors.length,
    reqFail:report.requestFailures.length, bad:report.badResponses.length,
    interactions:report.interactions, routesDetail:report.routes
  },null,2));
})();
