import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3018';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:375,height:900}});
  await page.goto(BASE+'/home-decor/category/sculptures-figurines',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(1500);
  const btn=page.locator('a[data-testid="product-card-enquire"]').first();
  await btn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const r=await btn.evaluate(el=>{
    const r=el.getBoundingClientRect(); const vw=document.documentElement.clientWidth;
    const cs=getComputedStyle(el);
    const parent=el.parentElement; const pr=parent.getBoundingClientRect(); const pcs=getComputedStyle(parent);
    return {btn:{l:r.left,r:r.right,w:r.width,h:r.height,minW:cs.minWidth,overflow:cs.overflow,paddingL:cs.paddingLeft,paddingR:cs.paddingRight,fontSize:cs.fontSize}, vw, parent:{l:pr.left,r:pr.right,w:pr.width,display:pcs.display,gap:pcs.gap}, clipped:r.right-vw};
  });
  console.log(JSON.stringify(r,null,2));
  await browser.close();
})();
