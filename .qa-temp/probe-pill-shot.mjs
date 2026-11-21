import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3018';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:375,height:900}});
  await page.goto(BASE+'/home-decor/category/sculptures-figurines',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(1500);
  // pill
  const pill=page.locator('a.whitespace-nowrap.rounded-full').filter({hasText:'Lighting & Wall Decor'}).first();
  await pill.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const pillBox=await pill.boundingBox();
  const pillInfo=await pill.evaluate(el=>{
    const r=el.getBoundingClientRect(); const vw=document.documentElement.clientWidth;
    const container=el.parentElement; const cr=container.getBoundingClientRect();
    const cs=getComputedStyle(container);
    return {pill:{l:r.left,r:r.right,w:r.width,text:el.textContent?.trim()}, container:{l:cr.left,r:cr.right,w:cr.width,overflowX:cs.overflowX,scrollWidth:container.scrollWidth,clientWidth:container.clientWidth}, vw};
  });
  await page.screenshot({path:'.qa-temp/cat-sculptures-375-pill.png',fullPage:false});
  console.log(JSON.stringify({pillBox,pillInfo}));
  await browser.close();
})();
