import fs from 'fs';
const data=JSON.parse(fs.readFileSync('C:/Users/ACER/.local/share/opencode/tool-output/tool_1fdca9080001vzDysRCR3YyPLI','utf8'));
const summary=data.map(r=>{
  const items=r.items||[];
  const real=items.filter(i=>!i.styleHidden && !i.clippedByAncestor && !i.fullyOffscreen);
  const offscreen=items.filter(i=>i.fullyOffscreen);
  const clipped=items.filter(i=>i.clippedByAncestor);
  return {route:r.route,width:r.width,overflow:r.overflow,totalOffenders:items.length,realLayoutSuspects:real.length,clippedOrOffscreen:items.length-real.length, topReal:real.slice(0,3).map(i=>({tag:i.tag,testid:i.testid,cls:(i.cls||'').slice(0,60),right:i.right,left:i.left,text:i.text.slice(0,30)})), topAny:items.slice(0,2).map(i=>({tag:i.tag,testid:i.testid,fullyOffscreen:i.fullyOffscreen,clippedByAncestor:i.clippedByAncestor,styleHidden:i.styleHidden,cls:(i.cls||'').slice(0,50)}))};
});
console.log(JSON.stringify(summary,null,2));
