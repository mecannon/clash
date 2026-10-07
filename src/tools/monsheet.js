// Usage: NODE_PATH=<scratchpad>/node_modules node tools/monsheet.js <out.png> [scale] [id,id,...]
// Renders creature sprite sheets straight from spr.js: every state x down/left/up/right x 2 frames.
const fs=require('fs'),vm=require('vm'),path=require('path');const {createCanvas}=require('@napi-rs/canvas');
const src=fs.readFileSync(path.resolve(__dirname,'../spr.js'),'utf8');
const ctx={Math,console,mkCanvas:(w,h)=>createCanvas(w,h)};vm.createContext(ctx);vm.runInContext(src,ctx);
const ALL={bulwhale:['norm','turret'],fistinel:['norm','guard'],frostbunt:['norm'],verdivy:['norm'],snipant:['norm','snap'],scrattle:['norm'],cindercub:['norm','charge'],umbrynx:['norm','rush'],
  voltusk:['norm','roll','charge'],mesmamba:['norm','charge'],phantern:['norm','veil'],dunemaw:['norm','burrow'],ampoule:['norm','charge'],prismoth:['norm']};
const out=process.argv[2]||'sheet.png',S=+(process.argv[3]||4),ids=(process.argv[4]||Object.keys(ALL).join(',')).split(',');
const rows=[];for(const id of ids){const fn=ctx['draw'+id[0].toUpperCase()+id.slice(1)];if(!fn){console.log('missing',id);continue}for(const st of ALL[id])rows.push([id,st,fn])}
const cw=32*S+4,lab=110,cv=createCanvas(lab+cw*8+8,rows.length*(32*S+6)+30),c=cv.getContext('2d');c.imageSmoothingEnabled=false;
c.fillStyle='#88d070';c.fillRect(0,0,cv.width,cv.height);c.fillStyle='#1c1c28';c.font='bold 13px sans-serif';
['down0','down1','left0','left1','up0','up1','right0','right1'].forEach((t,i)=>c.fillText(t,lab+i*cw+4,18));
rows.forEach(([id,st,fn],r)=>{const y=26+r*(32*S+6);c.fillStyle='#1c1c28';c.fillText(id,6,y+20);c.fillText(st,6,y+38);
  let i=0;for(const d of['down','left','up','right'])for(const fr of[0,1]){let g=fn(d==='right'?'left':d,fr,st);if(d==='right')g=ctx.flipH(g);
    c.fillStyle=(i>>1)%2?'#80c868':'#88d070';c.fillRect(lab+i*cw,y,32*S,32*S);c.drawImage(ctx.toCv(g),lab+i*cw,y,32*S,32*S);i++}});
fs.writeFileSync(out,cv.toBuffer('image/png'));console.log('wrote',out,rows.length,'rows');
