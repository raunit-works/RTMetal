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
    const style=getComputedStyle(el);
    const card=el.closest('[data-testid="product-card"]').getBoundingClientRect();
    const content=el.closest('[data-testid="product-card-content"]').getBoundingClientRect();
    // check if clickable area extends beyond viewport
    return {btn:{l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width,h:r.height}, vw, card:{l:card.left,r:card.right,w:card.width}, content:{l:content.left,r:content.right,w:content.width}, overflowX:getComputedStyle(document.body).overflowX, visibleRightEdge:r.right<=vw+1, clippedPx:Math.max(0,r.right-vw)};
  });
  console.log(JSON.stringify(r,null,2));
  await page.screenshot({path:'.qa-temp/enquire-375-scrolled.png'});
  await browser.close();
})();
