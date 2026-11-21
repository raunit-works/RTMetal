import { chromium } from '@playwright/test';
const BASE='http://127.0.0.1:3017';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(BASE+'/home-decor',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(2000);
  const candidates=await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('[data-testid="product-card"], [data-testid="metal-product-card"]')];
    return cards.map(c=>{
      const name=c.querySelector('[data-testid="product-card-name"]')?.textContent?.trim();
      const href=c.querySelector('a[href*="/home-decor/"]')?.getAttribute('href');
      const swatches=[...c.querySelectorAll('button[data-variant-id]')].map(b=>({id:b.getAttribute('data-variant-id'),finish:b.getAttribute('data-variant-finish'),pressed:b.getAttribute('aria-pressed'),disabled:b.hasAttribute('disabled')}));
      return {name,href,swatchCount:swatches.length,swatches};
    }).filter(x=>x.swatchCount>=2);
  });
  console.log(JSON.stringify(candidates.slice(0,5), null, 2));
  await browser.close();
})();
