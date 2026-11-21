import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3017';
const productPath='/home-decor/ashok-stambh-premium-decorative-showpiece';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(BASE+productPath,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(2000);
  const readState=()=>page.evaluate(()=>{
    const radios=[...document.querySelectorAll('[role="radiogroup"][aria-label="Select a finish"] button[role="radio"]')];
    const finishText=document.querySelector('[aria-live="polite"]')?.textContent?.trim()||null;
    const skuLine=[...document.querySelectorAll('p')].find(p=>/SKU:/i.test(p.textContent||''))?.textContent?.trim()||null;
    const galleryImgs=[...document.querySelectorAll('img')].slice(0,8).map(i=>i.getAttribute('src')).filter(Boolean);
    return {
      radios: radios.map(r=>({label:r.getAttribute('aria-label'),checked:r.getAttribute('aria-checked'),title:r.getAttribute('title')})),
      finishText, skuLine, mainImg: galleryImgs[0]||null
    };
  });
  const initial=await readState();
  const radios=page.locator('[role="radiogroup"][aria-label="Select a finish"] button[role="radio"]');
  const count=await radios.count();
  let transition=null;
  if(count>=2){
    // find a different unselected/other radio (2nd)
    const targetIndex=1;
    const targetLabel=await radios.nth(targetIndex).getAttribute('aria-label');
    await radios.nth(targetIndex).click();
    await page.waitForTimeout(800);
    const after=await readState();
    transition={targetIndex,targetLabel,after};
  }
  console.log(JSON.stringify({initial,count,transition}, null, 2));
  await browser.close();
})();
