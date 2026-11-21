import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3017';
const widths=[1440,1024,768,480,375,320];
const routes=['/','/home-decor','/home-decor/ashok-stambh-premium-decorative-showpiece','/metal-coating'];
function classify(el){
  const cs=getComputedStyle(el);
  const r=el.getBoundingClientRect();
  const vw=document.documentElement.clientWidth;
  const offRight=r.right-vw;
  const offLeft=-r.left;
  const hidden = cs.display==='none' || cs.visibility==='hidden' || parseFloat(cs.opacity||'1')===0;
  const clip = /(hidden|clip|auto)/.test(cs.overflowX) || /(hidden|clip|auto)/.test(cs.overflow) || /(hidden|clip)/.test(getComputedStyle(el.parentElement||document.body).overflowX);
  const intentionallyOffscreen = hidden || r.width===0 || r.height===0 || offLeft>vw || (offRight>1 && (cs.position==='fixed' || cs.position==='absolute') && (r.left>=vw || r.right<=0));
  return {offRight:Math.round(offRight*100)/100, offLeft:Math.round(offLeft*100)/100, hidden, clipAncestor:clip, intentionallyOffscreenCandidate:intentionallyOffscreen, pos:cs.position, overflowX:cs.overflowX};
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  const results=[];
  for(const route of routes){
    for(const w of widths){
      await page.setViewportSize({width:w,height:900});
      await page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForTimeout(1500);
      const data=await page.evaluate((w)=>{
        const vw=document.documentElement.clientWidth;
        const sw=document.documentElement.scrollWidth;
        const overflow=sw-vw;
        const els=[...document.querySelectorAll('body *')].map(el=>{
          const r=el.getBoundingClientRect();
          const right=r.right; const left=r.left;
          if(!(r.width>0) || !(r.height>0)) return null;
          if(right<=vw+1 && left>=-1) return null;
          const cs=getComputedStyle(el);
          const styleHidden=cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity||'1')===0;
          // check if any ancestor hides overflow
          let anc=el.parentElement, clipped=false;
          while(anc && anc!==document.body){ const acs=getComputedStyle(anc); if(['hidden','clip'].includes(acs.overflowX)||['hidden','clip'].includes(acs.overflow)){ clipped=true; break;} anc=anc.parentElement; }
          const offscreen = (left>=vw+1 || right<= -1);
          return {
            tag:el.tagName.toLowerCase(),
            id:el.id||null,
            cls:(typeof el.className==='string'?el.className:'').trim().slice(0,120)||null,
            testid:el.getAttribute('data-testid'),
            left:Math.round(left), right:Math.round(right), width:Math.round(r.width), top:Math.round(r.top),
            pos:cs.position, overflowX:cs.overflowX, visibility:cs.visibility, opacity:cs.opacity,
            styleHidden, clippedByAncestor:clipped, fullyOffscreen:offscreen,
            text:(el.innerText||'').replace(/\s+/g,' ').trim().slice(0,60)
          };
        }).filter(Boolean);
        // keep top offenders by overflow amount
        els.sort((a,b)=>Math.max(b.right-vw, -b.left) - Math.max(a.right-vw,-a.left));
        return {overflow,sw,vw,items:els.slice(0,12)};
      },w);
      results.push({route,width:w,...data});
    }
  }
  console.log(JSON.stringify(results,null,2));
  await browser.close();
})();
