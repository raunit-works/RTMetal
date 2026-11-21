import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3000';
(async()=>{
  const b=await chromium.launch({headless:true});
  const p=await b.newPage();
  for(const route of ['/','/home-decor']){
    for(const w of [320,375]){
      await p.setViewportSize({width:1440,height:900});
      await p.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:90000});
      await p.waitForTimeout(1500);
      await p.setViewportSize({width:w,height:900});
      await p.waitForTimeout(1800);
      const m1=await p.evaluate(()=>{const de=document.documentElement,bo=document.body;return {deSW:de.scrollWidth,boSW:bo.scrollWidth,deOW:de.offsetWidth,boOW:bo.offsetWidth,deCW:de.clientWidth};});
      await p.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:90000});
      await p.waitForTimeout(1800);
      const m2=await p.evaluate(()=>{const de=document.documentElement,bo=document.body;return {deSW:de.scrollWidth,boSW:bo.scrollWidth,deOW:de.offsetWidth,boOW:bo.offsetWidth,deCW:de.clientWidth};});
      console.log(JSON.stringify({route,w,resize:m1,fresh:m2}));
    }
  }
  await b.close();
})();
