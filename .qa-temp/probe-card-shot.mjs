import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3018';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:320,height:900}});
  await page.goto(BASE+'/home-decor/category/sculptures-figurines',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(1500);
  const btn=page.locator('a[data-testid="product-card-enquire"]').first();
  await btn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  // capture just the card
  const card=page.locator('[data-testid="product-card"]').first();
  await card.screenshot({path:'.qa-temp/cat-sculptures-320-card.png'});
  const details=await btn.evaluate(el=>{
    const r=el.getBoundingClientRect(); const vw=document.documentElement.clientWidth;
    const card=el.closest('[data-testid="product-card"]'); const cr=card.getBoundingClientRect();
    return {btn:{l:r.left,r:r.right,w:r.width}, card:{l:cr.left,r:cr.right,w:cr.width}, vw, overflowRight:r.right-vw, cardOverflowRight:cr.right-vw, visibleText:el.textContent?.trim()};
  });
  console.log(JSON.stringify(details));
  await browser.close();
})();
