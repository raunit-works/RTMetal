import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3018';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:375,height:900}});
  await page.goto(BASE+'/home-decor/category/sculptures-figurines',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(1500);
  const info=await page.evaluate(()=>{
    const vw=document.documentElement.clientWidth;
    const btns=[...document.querySelectorAll('a[data-testid="product-card-enquire"]')].filter(el=>{
      const r=el.getBoundingClientRect(); return r.width>0 && r.right>vw+1;
    }).slice(0,3);
    return btns.map(el=>{
      const r=el.getBoundingClientRect();
      let a=el.parentElement; const chain=[];
      while(a && a!==document.documentElement){
        const cs=getComputedStyle(a); const ar=a.getBoundingClientRect();
        chain.push({tag:a.tagName.toLowerCase(),testid:a.getAttribute('data-testid'),cls:(typeof a.className==='string'?a.className:'').slice(0,60),overflow:cs.overflow,overflowX:cs.overflowX,overflowY:cs.overflowY,left:Math.round(ar.left),right:Math.round(ar.right),width:Math.round(ar.width),height:Math.round(ar.height)});
        a=a.parentElement;
      }
      return {text:el.textContent?.trim(), rect:{left:Math.round(r.left),right:Math.round(r.right),top:Math.round(r.top),bottom:Math.round(r.bottom),w:Math.round(r.width),h:Math.round(r.height)}, chain:chain.slice(0,10)};
    });
  });
  console.log(JSON.stringify(info,null,2));
  await browser.close();
})();
