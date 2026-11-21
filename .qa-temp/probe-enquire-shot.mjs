import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3018';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:320,height:900}});
  await page.goto(BASE+'/home-decor/category/sculptures-figurines',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(1500);
  // screenshot the area around an enquire button
  const btn=page.locator('a[data-testid="product-card-enquire"]').first();
  await btn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({path:'.qa-temp/cat-sculptures-320-enquire.png', fullPage:false});
  const box=await btn.boundingBox();
  const vp=page.viewportSize();
  const inView=await btn.isVisible();
  console.log(JSON.stringify({box,vp,inView}));
  await browser.close();
})();
