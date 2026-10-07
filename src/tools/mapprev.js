// Map preview: renders every map (both water frames) to PNGs without a browser.
// Usage: NODE_PATH=<scratchpad>/node_modules node tools/mapprev.js <outDir> [frames=0]
const fs=require('fs'),vm=require('vm'),path=require('path');const {createCanvas}=require('@napi-rs/canvas');
const out=process.argv[2]||'mapprev';const frames=(process.argv[3]||'0').split(',').map(Number);fs.mkdirSync(out,{recursive:true});
const R=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const js="'use strict';\n"+R('spr.js')+'\n'+R('game.js')+'\n'+R('story.js');
function P(){const f=function(){return P()};return new Proxy(f,{get(t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='matches')return false;if(k==='hidden')return true;if(k==='children')return[];if(k==='querySelectorAll')return()=>[];return P()},set(){return true},apply(){return P()}})}
const ctx={Math,console,JSON,Date,Object,Array,Map,Set,Promise,performance:{now:()=>Date.now()},document:P(),window:P(),matchMedia:()=>({matches:false}),addEventListener(){},requestAnimationFrame(){},setInterval(){return 0},clearInterval(){},setTimeout(){},clearTimeout(){},innerWidth:1000,innerHeight:600,mkCanvas:(w,h)=>createCanvas(w,h),fs,out,frames,localStorage:{getItem(){return null},setItem(){}}};
vm.createContext(ctx);vm.runInContext(js.replace(/\n\s*storyInit\(\);/,'\n'),ctx);
vm.runInContext(`init();buildHumans();OW.name='RED';OW.rival='KAI';buildWorldMaps();
for(const k in OW.maps){const m=OW.maps[k];for(const fr of frames){const cv=m.cvs[fr];
  if(m.habitats){const x=cv.getContext('2d');for(const hb of m.habitats)drawHabitatLive(x,hb,hb.x*16,hb.y*16,0)}
  fs.writeFileSync(out+'/map_'+k+(fr?'_f'+fr:'')+'.png',cv.toBuffer('image/png'))}}
const A=buildMap();for(const fr of frames){MW=80;MH=56;WW=MW*16;WH=MH*16;fs.writeFileSync(out+'/map_arena'+(fr?'_f'+fr:'')+'.png',paintWorld(A,fr).toBuffer('image/png'))}`,ctx);
console.log('ok');
