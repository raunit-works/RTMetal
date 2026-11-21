import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3000';
(async()=>{
  const b=await chromium.launch({headless:true});
  const p=await b.newPage();
  for(const route of ['/','/home-decor','/metal-coating']){
    for(const w of [320,375,390,768]){
      await p.setViewportSize({width:w,height:900});
      await p.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:90000});
      await p.waitForTimeout(1800);
      const r=await p.evaluate(()=>{
        const cw=document.documentElement.clientWidth;
        const out=[];
        document.querySelectorAll('*').forEach(el=>{
          const cs=getComputedStyle(el);
          if(cs.position==='fixed') return;
          const rc=el.getBoundingClientRect();
          if(rc.width>0 && rc.right>cw+0.5){
            out.push({tag:el.tagName.toLowerCase(), cls:(el.className&&typeof el.className==='string'?el.className:'').slice(0,120), right:Math.round(rc.right), left:Math.round(rc.left), w:Math.round(rc.width), pos:cs.position, text:(el.textContent||'').trim().slice(0,50)});
          }
        });
        return {cw, sw:document.documentElement.scrollWidth, overflow:document.documentElement.scrollWidth-cw, items:out.slice(0,12)};
      });
      console.log(JSON.stringify({route,w,...r}));
    }
  }
  await b.close();
})();
