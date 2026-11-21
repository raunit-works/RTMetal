import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3017';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:375,height:844}});
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(1500);
  const before=await page.evaluate(()=>{
    const btn=[...document.querySelectorAll('button')].find(b=>/open menu/i.test(b.getAttribute('aria-label')||''));
    const drawer=document.querySelector('[class*="max-w-sm"]');
    const menuLinks=[...document.querySelectorAll('a')].filter(a=>/Home Decor|Metal Services|Gallery/.test(a.textContent||''));
    function vis(el){ if(!el) return null; const r=el.getBoundingClientRect(); const cs=getComputedStyle(el); return {display:cs.display,visibility:cs.visibility,opacity:cs.opacity,x:r.x,y:r.y,w:r.width,h:r.height,inViewport:r.right>0&&r.left<window.innerWidth}; }
    return {btn:!!btn, btnLabel:btn?.getAttribute('aria-label'), drawer:vis(drawer), sampleMenuLinkVis:menuLinks.slice(0,3).map(a=>({t:a.textContent?.trim().slice(0,20),...vis(a)}))};
  });
  console.log('BEFORE', JSON.stringify(before));
  const btn=page.getByRole('button',{name:/open menu/i});
  await btn.click();
  await page.waitForTimeout(800);
  const after=await page.evaluate(()=>{
    const close=[...document.querySelectorAll('button')].find(b=>/close menu/i.test(b.getAttribute('aria-label')||''));
    const drawer=document.querySelector('[class*="max-w-sm"]');
    function vis(el){ if(!el) return null; const r=el.getBoundingClientRect(); const cs=getComputedStyle(el); return {display:cs.display,visibility:cs.visibility,opacity:cs.opacity,x:r.x,y:r.y,w:r.width,h:r.height,inViewport:r.right>0&&r.left<window.innerWidth}; }
    const openMenuState=window.__NEXT_DATA__?null:null;
    return {closeBtn:!!close, drawer:vis(drawer), bodyOverflow:document.body.style.overflow};
  });
  console.log('AFTER', JSON.stringify(after));
  const closeBtn=page.getByRole('button',{name:/close menu/i});
  if(await closeBtn.count()){ await closeBtn.click(); await page.waitForTimeout(600); }
  const closed=await page.evaluate(()=>{
    const drawer=document.querySelector('[class*="max-w-sm"]');
    function vis(el){ if(!el) return null; const r=el.getBoundingClientRect(); const cs=getComputedStyle(el); return {display:cs.display,visibility:cs.visibility,opacity:cs.opacity,x:r.x,y:r.y,w:r.width,h:r.height,inViewport:r.right>0&&r.left<window.innerWidth}; }
    return {drawer:vis(drawer), bodyOverflow:document.body.style.overflow};
  });
  console.log('CLOSED', JSON.stringify(closed));
  await browser.close();
})();
