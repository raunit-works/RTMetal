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
      const data=await page.evaluate(()=>{
        const vw=document.documentElement.clientWidth;
        const btns=[...document.querySelectorAll('a[data-testid="product-card-enquire"]')];
        return btns.slice(0,12).map((el,i)=>{
          const r=el.getBoundingClientRect();
          const card=el.closest('[data-testid="product-card"]');
          const cr=card?card.getBoundingClientRect():null;
          const visibleLeft=Math.max(r.left,0), visibleRight=Math.min(r.right,vw);
          const visibleW=Math.max(0,visibleRight-visibleLeft);
          const fullyVisible=r.left>=-1 && r.right<=vw+1 && r.bottom>0 && r.top<document.documentElement.clientHeight+2000;
          // clickability: elementFromPoint at center of visible portion
          const cx=Math.min(vw-1, Math.max(1, visibleLeft+visibleW/2));
          const cy=Math.max(1, Math.min(document.documentElement.clientHeight-1, r.top + r.height/2));
          const topEl=document.elementFromPoint(cx,cy);
          const clickable=!!topEl && (el===topEl || el.contains(topEl) || topEl.contains(el));
          return {i,text:el.textContent?.trim(), rect:{l:+r.left.toFixed(1),r:+r.right.toFixed(1),t:+r.top.toFixed(1),b:+r.bottom.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)}, fullyVisible, visibleW:+visibleW.toFixed(1), clippedRight:+Math.max(0,r.right-vw).toFixed(1), clippedLeft:+Math.max(0,-r.left).toFixed(1), clickable, cardRect:cr?{l:+cr.left.toFixed(1),r:+cr.right.toFixed(1),w:+cr.width.toFixed(1)}:null};
        });
      });
      const screenshotPath=`.qa-temp/final-${t.name}-${w}.png`;
      // scroll to first enquire button for screenshot on small widths
      if(w<=480){
        const btn=page.locator('a[data-testid="product-card-enquire"]').first();
        if(await btn.count()) { await btn.scrollIntoViewIfNeeded(); await page.waitForTimeout(300); }
      }
      await page.screenshot({path:screenshotPath, fullPage:false});
      report.push({page:t.name,width:w,buttons:data.length,allFullyVisible:data.every(d=>d.fullyVisible),allClickable:data.every(d=>d.clickable),anyClipped:data.some(d=>d.clippedRight>1||d.clippedLeft>1),samples:data.slice(0,2),screenshot:screenshotPath});
    }
  }
  fs.writeFileSync('.qa-temp/final-enquire-report.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report.map(r=>({page:r.page,width:r.width,buttons:r.buttons,allFullyVisible:r.allFullyVisible,allClickable:r.allClickable,anyClipped:r.anyClipped, sample:r.samples[0]?{rect:r.samples[0].rect,clippedRight:r.samples[0].clippedRight,clickable:r.samples[0].clickable}:null})),null,2));
  await browser.close();
})();
