import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3019';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:375,height:900}});
  await page.goto(BASE+'/home-decor/category/sculptures-figurines',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(1500);
  const btns=page.locator('a[data-testid="product-card-enquire"]');
  const n=await btns.count();
  const res=[];
  for(let i=0;i<Math.min(n,4);i++){
    const b=btns.nth(i);
    await b.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const r=await b.evaluate(el=>{
      const r=el.getBoundingClientRect(); const vw=document.documentElement.clientWidth; const vh=document.documentElement.clientHeight;
      const cx=Math.min(vw-1,Math.max(1,r.left+r.width/2)); const cy=Math.min(vh-1,Math.max(1,r.top+r.height/2));
      const top=document.elementFromPoint(cx,cy);
      return {rect:{l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width,h:r.height}, vw,vh, fullyVisible:r.left>=-1&&r.right<=vw+1&&r.top>=-1&&r.bottom<=vh+1, clickable:!!top&&(el===top||el.contains(top)||top.contains(el)), topTag:top?.tagName, topTest:top?.getAttribute?.('data-testid')};
    });
    res.push(r);
  }
  console.log(JSON.stringify(res,null,2));
  await browser.close();
})();
