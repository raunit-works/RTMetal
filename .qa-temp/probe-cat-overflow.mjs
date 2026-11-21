import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3017';
const widths=[1440,1024,768,480,375,320];
async function run(){
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  // discover category pages
  await page.setViewportSize({width:1440,height:900});
  await page.goto(BASE+'/home-decor',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(1500);
  const catLinks=await page.$$eval('a[href*="/home-decor/category/"]',as=>[...new Set(as.map(a=>a.getAttribute('href')).filter(Boolean))]);
  await page.goto(BASE+'/metal-coating',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(1500);
  const metalCatLinks=await page.$$eval('a[href*="/metal-coating/category/"]',as=>[...new Set(as.map(a=>a.getAttribute('href')).filter(Boolean))]);
  const routes=[...catLinks.slice(0,2),...metalCatLinks.slice(0,2)];
  const results=[];
  for(const route of routes){
    for(const w of widths){
      await page.setViewportSize({width:w,height:900});
      await page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForTimeout(1200);
      const data=await page.evaluate(()=>{
        const vw=document.documentElement.clientWidth;
        const sw=document.documentElement.scrollWidth;
        const overflow=sw-vw;
        const els=[...document.querySelectorAll('body *')].map(el=>{
          const r=el.getBoundingClientRect();
          if(!(r.width>0&&r.height>0)) return null;
          if(r.right<=vw+1 && r.left>=-1) return null;
          const cs=getComputedStyle(el);
          const styleHidden=cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity||'1')===0;
          let anc=el.parentElement, clipped=false;
          while(anc && anc!==document.body){ const acs=getComputedStyle(anc); if(['hidden','clip'].includes(acs.overflowX)||['hidden','clip'].includes(acs.overflow)){ clipped=true; break;} anc=anc.parentElement; }
          const fullyOffscreen=(r.left>=vw+1 || r.right<= -1);
          return {tag:el.tagName.toLowerCase(),testid:el.getAttribute('data-testid'),cls:(typeof el.className==='string'?el.className:'').slice(0,80),right:Math.round(r.right),left:Math.round(r.left),styleHidden,clippedByAncestor:clipped,fullyOffscreen,text:(el.innerText||'').replace(/\s+/g,' ').trim().slice(0,40)};
        }).filter(Boolean).filter(i=>!i.styleHidden && !i.clippedByAncestor && !i.fullyOffscreen);
        return {overflow,realSuspects:els.slice(0,5),totalReal:els.length};
      });
      results.push({route,width:w,...data});
    }
  }
  console.log(JSON.stringify({routes,results},null,2));
  await browser.close();
}
run().catch(e=>{console.error(e); process.exit(1)});
