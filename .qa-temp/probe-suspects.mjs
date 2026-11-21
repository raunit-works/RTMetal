import { chromium } from '@playwright/test';
import fs from 'fs';
const BASE='http://127.0.0.1:3018';
const targets=[
  {name:'home', url:'/'},
  {name:'home-decor', url:'/home-decor'},
  {name:'metal-coating', url:'/metal-coating'},
  {name:'product-detail', url:'/home-decor/ashok-stambh-premium-decorative-showpiece'},
  {name:'cat-home-sculptures', url:'/home-decor/category/sculptures-figurines'},
  {name:'cat-home-lighting', url:'/home-decor/category/lighting-wall-decor'},
  {name:'cat-metal-box', url:'/metal-coating/category/metal-box-letters'},
  {name:'cat-metal-partitions', url:'/metal-coating/category/metal-partitions-room-dividers'},
];
const widths=[320,375,768,1024];
function sel(el){
  const tag=el.tagName.toLowerCase();
  const tid=el.getAttribute('data-testid');
  const id=el.id;
  const cls=(typeof el.className==='string'?el.className:'').trim().split(/\s+/).filter(Boolean).slice(0,4).join('.');
  return `${tag}${id?`#${id}`:''}${tid?`[data-testid="${tid}"]`:''}${cls?`.${cls}`:''}`;
}
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
        const vw=document.documentElement.clientWidth; const vh=document.documentElement.clientHeight;
        function getSelector(el){
          const tag=el.tagName.toLowerCase();
          const tid=el.getAttribute('data-testid');
          const id=el.id;
          const cls=(typeof el.className==='string'?el.className:'').trim().split(/\s+/).filter(Boolean).slice(0,4).join('.');
          return `${tag}${id?`#${id}`:''}${tid?`[data-testid=\"${tid}\"]`:''}${cls?`.${cls}`:''}`;
        }
        function ancestorInfo(el){
          const chain=[]; let a=el.parentElement; let depth=0;
          while(a && a!==document.documentElement && depth<8){
            const cs=getComputedStyle(a); const r=a.getBoundingClientRect();
            chain.push({selector:getSelector(a), overflow:cs.overflow, overflowX:cs.overflowX, overflowY:cs.overflowY, clipPath:cs.clipPath, transform:cs.transform, position:cs.position, left:Math.round(r.left), right:Math.round(r.right), width:Math.round(r.width)});
            a=a.parentElement; depth++;
          }
          return chain;
        }
        function isVisiblePortionUsable(el){
          const r=el.getBoundingClientRect();
          const visibleLeft=Math.max(r.left,0), visibleRight=Math.min(r.right,vw), visibleTop=Math.max(r.top,0), visibleBottom=Math.min(r.bottom,vh);
          const visibleW=Math.max(0,visibleRight-visibleLeft); const visibleH=Math.max(0,visibleBottom-visibleTop);
          const fullyVisible=r.left>=-1 && r.right<=vw+1;
          return {fullyVisible, visibleW:Math.round(visibleW), visibleH:Math.round(visibleH), inViewport: visibleW>0 && visibleH>0};
        }
        const suspects=[];
        const all=[...document.querySelectorAll('a,button,[role="button"],li')];
        for(const el of all){
          const r=el.getBoundingClientRect(); if(r.width<=0||r.height<=0) continue;
          if(r.right<=vw+1 && r.left>= -1) continue;
          const cs=getComputedStyle(el);
          const styleHidden=cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity||'1')===0;
          if(styleHidden) continue;
          const txt=(el.innerText||el.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,60);
          const cls=(typeof el.className==='string'?el.className:'');
          const interesting = txt.includes('Enquire Now') || cls.includes('snap-start') || cls.includes('whitespace-nowrap') || el.closest('[data-testid="product-card-actions"]') || cls.includes('rounded-full') || el.tagName==='LI';
          if(!interesting) continue;
          suspects.push({
            selector:getSelector(el), text:txt, rect:{left:Math.round(r.left),right:Math.round(r.right),top:Math.round(r.top),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height)},
            viewport:{vw,vh,docOverflow:document.documentElement.scrollWidth-vw},
            usable:isVisiblePortionUsable(el), ancestors:ancestorInfo(el)
          });
        }
        // also capture carousel slide containers specifically
        const carousels=[...document.querySelectorAll('[class*="snap-start"], [data-testid="metal-products-slide"]')].filter(el=>{const r=el.getBoundingClientRect(); return r.width>0&&r.height>0 && (r.right>vw+1 || r.left<-1);}).slice(0,6).map(el=>({selector:getSelector(el),rect:{left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)},usable:isVisiblePortionUsable(el),ancestors:ancestorInfo(el),text:(el.innerText||'').replace(/\s+/g,' ').trim().slice(0,40)}));
        return {docOverflow:document.documentElement.scrollWidth-vw, suspects, carousels};
      });
      report.push({page:t.name,url:t.url,width:w,...data});
    }
  }
  fs.writeFileSync('.qa-temp/responsive-suspects.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report.map(r=>({page:r.page,width:r.width,docOverflow:r.docOverflow,suspects:r.suspects.length,carousels:r.carousels.length})),null,2));
  await browser.close();
})();
