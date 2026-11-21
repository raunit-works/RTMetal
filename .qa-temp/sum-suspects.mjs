import fs from 'fs';
const r=JSON.parse(fs.readFileSync('.qa-temp/responsive-suspects.json','utf8'));
function summarizeItem(i){
  const clipAnc=i.ancestors.find(a=>['hidden','clip','auto'].includes(a.overflowX)||['hidden','clip'].includes(a.overflow));
  return {
    selector:i.selector, text:i.text.slice(0,35), rect:i.rect, usable:i.usable,
    clippedBy: clipAnc?{selector:clipAnc.selector,overflow:clipAnc.overflow,overflowX:clipAnc.overflowX,rect:{left:clipAnc.left,right:clipAnc.right,width:clipAnc.width}}:null,
  };
}
const focus=['cat-home-sculptures','cat-home-lighting','cat-metal-box','cat-metal-partitions','home','home-decor','product-detail'];
for(const page of focus){
  for(const w of [320,375,768,1024]){
    const entry=r.find(x=>x.page===page && x.width===w);
    if(!entry) continue;
    const enquire=entry.suspects.filter(s=>s.text.includes('Enquire Now')||s.selector.includes('product-card-enquire'));
    const pills=entry.suspects.filter(s=>s.selector.includes('whitespace-nowrap.rounded-full') && !s.text.includes('Enquire Now'));
    const slides=entry.carousels;
    if(enquire.length===0 && pills.length===0 && slides.length===0) continue;
    console.log('---',page,w,'docOverflow',entry.docOverflow);
    for(const e of enquire.slice(0,2)) console.log('ENQUIRE',JSON.stringify(summarizeItem(e)));
    for(const p of pills.slice(0,2)) console.log('PILL',JSON.stringify(summarizeItem(p)));
    for(const s of slides.slice(0,2)) console.log('SLIDE',JSON.stringify({selector:s.selector,text:s.text.slice(0,30),rect:s.rect,usable:s.usable,clippedBy:(s.ancestors.find(a=>['hidden','clip','auto'].includes(a.overflowX)||['hidden','clip'].includes(a.overflow))||null)&&{selector:s.ancestors.find(a=>['hidden','clip','auto'].includes(a.overflowX)||['hidden','clip'].includes(a.overflow)).selector,overflowX:s.ancestors.find(a=>['hidden','clip','auto'].includes(a.overflowX)||['hidden','clip'].includes(a.overflow)).overflowX}}));
  }
}
