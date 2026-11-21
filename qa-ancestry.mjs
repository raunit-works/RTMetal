import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3000';
(async()=>{
  const b=await chromium.launch({headless:true});
  const p=await b.newPage();
  for(const route of ['/home-decor','/']){
    await p.setViewportSize({width:320,height:900});
    await p.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:90000});
    await p.waitForTimeout(2000);
    const info=await p.evaluate(()=>{
      const cw=document.documentElement.clientWidth;
      const cards=[...document.querySelectorAll('[data-testid="product-card"],[data-testid="metal-product-card"]')];
      const res=[];
      for(const card of cards){
        const cr=card.getBoundingClientRect();
        if(cr.right<=cw+0.5) continue;
        const enq=card.querySelector('[data-testid="product-card-enquire"] a');
        const act=card.querySelector('[data-testid="product-card-actions"]');
        const chain=[]; let el=card.parentElement;
        for(let i=0;i<4&&el;i++){ const r=el.getBoundingClientRect(); const cs=getComputedStyle(el); chain.push({tag:el.tagName.toLowerCase(),cls:(typeof el.className==='string'?el.className:'').slice(0,100),w:Math.round(r.width),right:Math.round(r.right),overflowX:cs.overflowX,display:cs.display}); el=el.parentElement; }
        res.push({cardRight:Math.round(cr.right),cardLeft:Math.round(cr.left),cardW:Math.round(cr.width),enqRight:enq?Math.round(enq.getBoundingClientRect().right):null,actW:act?Math.round(act.getBoundingClientRect().width):null,chain});
        if(res.length>=3) break;
      }
      return {cw, count:cards.length, bad:res};
    });
    console.log(route, JSON.stringify(info,null,1));
  }
  await b.close();
})();
