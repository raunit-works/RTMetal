import { chromium } from '@playwright/test';
import fs from 'fs';
const BASE='http://127.0.0.1:3019';
const targets=[
  {name:'cat-home-sculptures', url:'/home-decor/category/sculptures-figurines'},
  {name:'cat-metal-box', url:'/metal-coating/category/metal-box-letters'},
  {name:'product-detail', url:'/home-decor/ashok-stambh-premium-decorative-showpiece'},
  {name:'home', url:'/'},
];
const widths=[320,375,480,768,1024,1440];
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  const report=[];
  for(const t of targets){
    for(const w of widths){
      await page.setViewportSize({width:w,height:900});
      await page.goto(BASE+t.url,{waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForTimeout(1400);
      const btns=page.locator('a[data-testid="product-card-enquire"]');
      const count=await btns.count();
      const samples=[];
      let allFullyVisible=true, allClickable=true, anyClipped=false;
      for(let i=0;i<count;i++){
        const b=btns.nth(i);
        await b.scrollIntoViewIfNeeded();
        await page.waitForTimeout(120);
        const d=await b.evaluate(el=>{
          const r=el.getBoundingClientRect(); const vw=document.documentElement.clientWidth; const vh=document.documentElement.clientHeight;
          const fullyVisible=r.left>=-1&&r.right<=vw+1&&r.top>=-1&&r.bottom<=vh+1;
          const cx=Math.min(vw-1,Math.max(1,r.left+r.width/2)); const cy=Math.min(vh-1,Math.max(1,r.top+r.height/2));
          const top=document.elementFromPoint(cx,cy);
          const clickable=!!top&&(el===top||el.contains(top)||top.contains(el));
          return {fullyVisible,clickable,clippedRight:Math.max(0,r.right-vw),clippedLeft:Math.max(0,-r.left),rect:{l:+r.left.toFixed(1),r:+r.right.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)},text:el.textContent?.trim()};
        });
        if(!d.fullyVisible) allFullyVisible=false;
        if(!d.clickable) allClickable=false;
        if(d.clippedRight>1||d.clippedLeft>1) anyClipped=true;
        if(i<2) samples.push(d);
      }
      if(w<=480){ const b=page.locator('a[data-testid="product-card-enquire"]').first(); if(await b.count()){await b.scrollIntoViewIfNeeded(); await page.waitForTimeout(200);} }
      await page.screenshot({path:`.qa-temp/final2-${t.name}-${w}.png`, fullPage:false});
      report.push({page:t.name,width:w,count,allFullyVisible,allClickable,anyClipped,samples});
    }
  }
  fs.writeFileSync('.qa-temp/final-enquire-report2.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report.map(r=>({page:r.page,width:r.width,count:r.count,allFullyVisible:r.allFullyVisible,allClickable:r.allClickable,anyClipped:r.anyClipped,sample:r.samples[0]})),null,2));
  await browser.close();
})();
