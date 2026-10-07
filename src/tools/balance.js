// Headless AI-vs-AI balance sim (no browser). Usage:
//   NODE_PATH=<scratchpad>/node_modules node tools/balance.js [games] [diffs] [focus ids] [mode]
//   games: per ordered pair per difficulty (default 10); diffs: hard,normal; focus: comma ids (default all new mons)
//   mode: 'focus' (focus mons vs everyone, both sides) or 'all' (full round robin of every mon)
// Prints win rates and avg time-to-kill. Requires `python3 build.py` first (reads dist/typeclash.html).
const fs=require('fs'),vm=require('vm'),path=require('path');let createCanvas=null;try{({createCanvas}=require('@napi-rs/canvas'))}catch(e){}
const html=fs.readFileSync(path.resolve(__dirname,'../dist/typeclash.html'),'utf8');
const js=html.split('<script>').map(x=>x.split('</script>')[0]).find(x=>x.includes("'use strict'")&&x.includes('function newGame'));
function P(){const f=function(){return P()};return new Proxy(f,{get(t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='matches')return false;if(k==='hidden')return true;if(k==='children')return[];if(k==='querySelectorAll')return()=>[];if(k==='width'||k==='height')return 100;return P()},set(){return true},apply(){return P()}})}
const doc=P();const realDoc=new Proxy({},{get(t,k){if(k==='createElement')return tag=>tag==='canvas'&&createCanvas?createCanvas(32,32):P();return doc[k]}});
const errs=[];
const ctx={Math,console:{log(){},warn(){},error:(...a)=>errs.push(a.join(' '))},performance:{now:()=>Date.now()},document:realDoc,window:P(),localStorage:P(),matchMedia:()=>({matches:false}),addEventListener(){},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},innerWidth:1200,innerHeight:700,devicePixelRatio:1,
  parseInt,parseFloat,String,Number,Set,Map,Object,Array,Symbol,JSON,Promise,isNaN,Uint8Array,Float32Array,Error};
vm.createContext(ctx);vm.runInContext(js.replace(/\binit\(\);\s*$/,'')+';try{init()}catch(e){}',ctx);
const games=+(process.argv[2]||10),diffs=(process.argv[3]||'hard,normal').split(','),focus=(process.argv[4]||'voltusk,mesmamba,phantern').split(','),mode=process.argv[5]||'focus';
vm.runInContext(`
playerCtl=function(f){return aiCtl(f,1/60)};
function mkAI(diff){return{d:DIFF[diff],react:.5,strT:0,str:1,think:1,seen:null,stuck:0,lastX:0,lastY:0,detour:0,detourA:0,modeT:0}}
var SIMERR=[];
function duel(a,b,diff){newGame([a],[b],diff);G.f[0].ai=mkAI(diff);G.start=0;let s=0;const lim=60*120;
  try{while(!G.over&&s<lim){update(1/60);if(s%7===0){render()}s++}}catch(e){SIMERR.push(a+' v '+b+': '+e.message+' '+(e.stack||'').split('\\n')[1]);return{w:-2,t:s/60}}
  if(!G.over){const h0=G.f[0].unit.hp/G.f[0].unit.max,h1=G.f[1].unit.hp/G.f[1].unit.max;return{w:h0>h1?0:1,t:120,to:1}}
  return{w:G.winner,t:G.time}}`,ctx);
const ids=vm.runInContext('MONS.map(m=>m.id)',ctx);
const res={};const key=(a,b)=>a+'|'+b;
const t0=Date.now();
const pairs=[];for(const a of ids)for(const b of ids){if(mode==='all'||focus.includes(a))pairs.push([a,b])}
for(const diff of diffs)for(const[a,b]of pairs){for(let g=0;g<games;g++){
  // a on side0 half the time, side1 the other half
  const flip=g%2;const r=vm.runInContext(`duel(${JSON.stringify(flip?b:a)},${JSON.stringify(flip?a:b)},${JSON.stringify(diff)})`,ctx);
  const aw=r.w===-2?null:(flip?r.w===1:r.w===0);const k=diff+'|'+key(a,b);res[k]=res[k]||{w:0,n:0,t:0,to:0};if(aw!==null){res[k].n++;res[k].t+=r.t;if(aw)res[k].w++;if(r.to)res[k].to++}}}
const se=vm.runInContext('SIMERR',ctx);
const out={games,diffs,focus,mode,secs:((Date.now()-t0)/1000).toFixed(0),res,errors:se.slice(0,20).concat(errs.slice(0,10))};
fs.writeFileSync(process.env.OUT||'balance.json',JSON.stringify(out));
for(const diff of diffs){console.log('\n== '+diff+' ==');
  const rows=mode==='all'?ids:focus;
  console.log('mon'.padEnd(10)+ids.map(x=>x.slice(0,6).padStart(7)).join('')+'   FIELD   TTK');
  for(const a of rows){let W=0,N=0,T=0;const cells=ids.map(b=>{const r=res[diff+'|'+key(a,b)];if(!r||!r.n)return'   -  ';if(b!==a){W+=r.w;N+=r.n;T+=r.t}return(Math.round(r.w/r.n*100)+'%').padStart(7)});
    console.log(a.padEnd(10)+cells.join('')+('  '+Math.round(W/N*100)+'%').padStart(8)+(T/N).toFixed(1).padStart(6)+'s')}}
console.log('\nerrors:',se.length+errs.length,se.slice(0,5).join('\n'),errs.slice(0,3).join('\n'));console.log('time',out.secs,'s');
