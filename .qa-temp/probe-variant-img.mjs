import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3017';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(BASE+'/home-decor/ashok-stambh-premium-decorative-showpiece',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(2000);
  const getImgs=()=>page.evaluate(()=>{
    const imgs=[...document.querySelectorAll('img')].map((img,i)=>{
      const r=img.getBoundingClientRect();
      return {i,alt:img.alt,src:img.currentSrc||img.src, w:Math.round(r.width),h:Math.round(r.height), top:Math.round(r.top), visible:r.width>0&&r.height>0};
    }).filter(x=>x.visible);
    return imgs;
  });
  const before=await getImgs();
  await page.locator('[role="radiogroup"][aria-label="Select a finish"] button[role="radio"]').nth(1).click();
  await page.waitForTimeout(1200);
  const after=await getImgs();
  console.log(JSON.stringify({before:before.slice(0,8), after:after.slice(0,8)}, null, 2));
  await browser.close();
})();
