
/* ================= STORY / OVERWORLD ================= */
const APP={mode:'title'};
const OW={maps:{},map:null,p:{x:0,y:0,px:0,py:0,dir:'down',walk:0,moving:false,bump:0},lock:0,flags:{},name:'RED',rival:'KAI',look:'player',party:[],cam:{x:0,y:0},fade:0,fadeTo:0,emotes:[],toastT:0,t:0,running:false,last:0,ui:null,actors:[]};
const FREE={MAP:null,WORLD:null};
const STARTERS=['verdivy','bulwhale','cindercub'];
const COUNTER={verdivy:'cindercub',bulwhale:'verdivy',cindercub:'bulwhale'};
const HABITAT={verdivy:'planter',bulwhale:'pond',cindercub:'hearth'};
const DIRV={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const OVZ=2,OVW=240,OVH=135;
const WALK_SPD=104,RUN_SPD=168;

/* ---------- map data ---------- */
function mkMapData(id,w,h,o={}){const m={id,w,h,ground:[],obj:[],walk:[],shot:[],deco:[],warps:[],npcs:[],signs:[],interior:!!o.interior,lab:!!o.lab,name:o.name||'',onStep:null,cvs:null,habitats:null};
  for(let y=0;y<h;y++){m.ground.push(new Array(w).fill(o.interior?5:0));m.obj.push(new Array(w).fill(0));m.walk.push(new Array(w).fill(0));m.shot.push(new Array(w).fill(0))}return m}
function sol(m,x,y,w=1,h=1,shot=1){for(let j=0;j<h;j++)for(let i=0;i<w;i++){const X=x+i,Y=y+j;if(X<0||Y<0||X>=m.w||Y>=m.h)continue;m.walk[Y][X]=1;if(shot)m.shot[Y][X]=1}}
function otree(m,x,y){if(x<0||y<0||x+1>=m.w||y+1>=m.h)return;m.obj[y][x]=1;for(let j=0;j<2;j++)for(let i=0;i<2;i++)if(!m.obj[y+j][x+i])m.obj[y+j][x+i]=9;sol(m,x,y,2,2)}
function orock(m,x,y){m.obj[y][x]=2;sol(m,x,y)}
function gfill(m,x0,y0,x1,y1,v){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(x>=0&&y>=0&&x<m.w&&y<m.h)m.ground[y][x]=v}
function deco(m,y,fn,flat){m.deco.push({y,fn,flat:!!flat})}
function building(m,kind,x,y,roof){const w=kind==='lab'?8:6,h=kind==='lab'?6:5;sol(m,x,y,w,h);
  const doors=kind==='lab'?[[x+3,y+5],[x+4,y+5]]:[[x+2,y+4],[x+3,y+4]];for(const[dx,dy]of doors){m.walk[dy][dx]=0;m.shot[dy][dx]=0}
  deco(m,y*16+2,c=>drawShadow(c,x*16,y*16,w*16,h*16),1);
  deco(m,(y+h)*16,c=>kind==='lab'?drawLab(c,x*16,y*16):drawHouse(c,x*16,y*16,roof));return doors}
function fence(m,x0,x1,y){for(let x=x0;x<=x1;x++){sol(m,x,y,1,1,0);deco(m,y*16+15,c=>drawFence(c,x*16,y*16))}}
function sign(m,x,y,text){sol(m,x,y,1,1,0);deco(m,y*16+15,c=>drawSign(c,x*16,y*16));m.signs.push({x,y,text})}
function prop(m,x,y,w,h,fn,shot=0){sol(m,x,y,w,h,shot);deco(m,(y+h)*16-1,fn)}
function warp(m,x,y,to,tx,ty,dir,cond){m.warps.push({x,y,to,tx,ty,dir,cond})}
function npc(m,o){const n=Object.assign({dir:'down',moving:0,t:0,step:0,hidden:false,wander:0,wt:1+Math.random()*2},o);n.home={x:n.x,y:n.y};m.npcs.push(n);return n}
function wallRow(m,lab){for(let x=0;x<m.w;x++){sol(m,x,0,1,2);deco(m,-1,c=>drawWall(c,x*16,0,lab))}}

// contact shadow as a flat decal (art direction: every standing object gets one; uprights never bake their own)
function shadowDeco(m,cx,cy,rx,ry,a){deco(m,Math.round(cy-ry)-1,c=>artOval(c,cx,cy,rx,ry,a),1)}
function buildTown(){const m=mkMapData('town',32,28,{name:'FERNBROOK TOWN'});
  for(let x=0;x<32;x+=2){if(x!==14&&x!==16){otree(m,x,0);otree(m,x,2)}otree(m,x,26)}
  for(let y=4;y<26;y+=2){otree(m,0,y);otree(m,30,y)}
  gfill(m,14,0,17,3,3);
  gfill(m,15,4,16,22,1);gfill(m,4,12,27,13,1);gfill(m,6,10,7,11,1);gfill(m,22,10,23,11,1);gfill(m,15,21,22,22,1);
  for(let y=23;y<=25;y++)for(let x=2;x<=29;x++){m.ground[y][x]=2;m.walk[y][x]=1}
  gfill(m,3,20,6,21,4);gfill(m,18,9,19,10,4);gfill(m,10,6,11,7,4);gfill(m,8,13+1,13,13+1,4);
  sol(m,9,15,2,2);shadowDeco(m,160,265,30,6,.26);deco(m,16*16+15,c=>drawBigTree(c,8*16,12*16+8));
  sol(m,25,15,4,3);deco(m,15*16-2,c=>drawShadow(c,25*16,15*16-20,64,68),1);deco(m,17*16+15,c=>drawGreenhouse(c,25*16,15*16));
  // village green: paved plaza decal at the crossroads (focal point under the lamps)
  deco(m,-2,c=>drawPlaza(c,256,208,30,'#4f9a3e'),1);
  const home=building(m,'house',4,5,'#d84838'),rh=building(m,'house',20,5,'#3868c8'),lab=building(m,'lab',17,15);
  fence(m,2,11,18);fence(m,25,28,11);for(const[a,b,y]of[[2,11,18],[25,28,11]])for(let x=a;x<=b;x++)shadowDeco(m,x*16+8,y*16+15,8,2,.18);shadowDeco(m,13*16+8,10*16+15,5,2);
  sign(m,13,10,'FERNBROOK\nVillage of the Root Tree.\nPlanted before the first house, still growing.');
  prop(m,8,10,1,1,c=>drawMailbox(c,128,160,'#d84838'));prop(m,24,10,1,1,c=>drawMailbox(c,384,160,'#3868c8'));shadowDeco(m,136,175,5,2);shadowDeco(m,392,175,5,2);
  for(const[x,y]of[[14,11],[17,11],[14,14],[17,20]]){prop(m,x,y,1,1,c=>drawLamp(c,x*16,y*16));shadowDeco(m,x*16+8,y*16+15,5,2)}
  prop(m,11,21,2,1,c=>drawBench(c,176,336));prop(m,25,21,2,1,c=>drawBench(c,400,336));shadowDeco(m,192,351,14,2);shadowDeco(m,416,351,14,2);
  for(const[x,y]of[[2,11],[3,11],[12,8],[19,13+1],[27,8],[28,8],[23,13+1],[2,22],[29,21]])if(!m.walk[y][x]&&m.ground[y][x]!==1){prop(m,x,y,1,1,c=>drawBush(c,x*16,y*16));shadowDeco(m,x*16+8,y*16+15,7,2)}
  orock(m,27,19);otree(m,2,14);otree(m,28,13);otree(m,8,20);
  deco(m,23*16,c=>{for(let i=0;i<14;i++)drawLily(c,(3+((i*7)%26))*16+((i*5)%9),(23+(i%3))*16+5+((i*3)%6));for(const x of[2,3,8,13,14,21,26,28,29])drawReed(c,x*16+3+(x%3)*2,23*16+5);for(const x of[2,29])drawReed(c,x*16+6,25*16+8)},1);
  // ground life: flower clumps, mushrooms by the woods, pebbles on the banks
  deco(m,-1,c=>{for(const[x,y,k]of[[3,9,1],[11,9,0],[26,9,3],[19,7,2],[5,15,1],[12,16,3],[22,14,0],[28,17,2],[9,22,1],[23,21,3],[4,13,2]])drawFlowerClump(c,x*16+2,y*16+5,k);
    for(const[x,y]of[[2,16],[29,7],[6,21],[27,14]])drawMushrooms(c,x*16+3,y*16+8);for(const[x,y]of[[24,22],[5,22],[14,22]])drawPebbles(c,x*16+2,y*16+4)},1);
  deco(m,-1,c=>{drawFillets(c,m.ground,'earth');drawFillets(c,m.ground,'water');drawTallEdges(c,m.ground)},1);
  for(const[dx,dy]of home)warp(m,dx,dy,'home',5,7,'up');for(const[dx,dy]of rh)warp(m,dx,dy,'rhouse',5,7,'up');
  for(const[dx,dy]of lab)warp(m,dx,dy,'lab',dx===20?9:10,12,'up',()=>OW.flags.labOpen?true:"A note is taped to the door:\n\"OUT IN THE NORTH MEADOW. BACK SOON. — W. LARCH\"");
  npc(m,{id:'girl',look:'girl',x:7,y:16,wander:1,talk:async()=>{await say(OW.flags.starter?"Ooh, is that your partner? It's staring at me. I think it likes me!":"I tried sneaking into the north meadow once. Something pinched my ankle and I ran all the way home.")}});
  npc(m,{id:'oldman',look:'oldman',x:27,y:21,dir:'left',wander:1,talk:async()=>{await say("I've fished this pond for forty years. Caught three boots, a kettle, and a cold.\nThe creatures, though? They always get away.")}});
  m.onStep=async(x,y)=>{if(y<=3&&x>=14&&x<=17){if(!OW.flags.starter)await meadowEvent();else await startRoute('route1','south')}};
  return m}
function interiorBase(id,name,w,h,lab){const m=mkMapData(id,w,h,{interior:1,lab,name});wallRow(m,lab);sol(m,0,0,1,h);sol(m,w-1,0,1,h);return m}
function buildHome(){const m=interiorBase('home','HOME',12,9);
  deco(m,0,c=>{drawIntWindow(c,148,2);drawWallClock(c,98,3);drawPainting(c,40,4,16,12)});
  sol(m,1,2,3,1);deco(m,2*16+16,c=>drawCounter(c,16,24,48));
  sol(m,5,2);deco(m,2*16+15,c=>drawTV(c,80,18));
  sol(m,7,1,2,2);deco(m,2*16+15,c=>drawShelf(c,112,8));
  sol(m,10,2,1,2);deco(m,3*16+15,c=>drawBed(c,160,32));shadowDeco(m,175,62,2,10,.2);
  sol(m,4,4,2,2);shadowDeco(m,80,93,15,3,.22);deco(m,5*16+15,c=>drawTable(c,64,64,32,32));
  deco(m,-1,c=>drawRug(c,64,96,32,16),1);
  for(const x of[1,10]){sol(m,x,7);shadowDeco(m,x*16+8,127,6,2);deco(m,7*16+15,c=>drawPlant(c,x*16,112))}
  deco(m,-1,c=>drawMat(c,80,128,32),1);
  warp(m,5,8,'town',6,10,'down');warp(m,6,8,'town',7,10,'down');
  npc(m,{id:'mom',look:'mom',x:3,y:5,dir:'right',talk:async()=>{
    if(OW.flags.starter)await say("So THAT'S your new partner! Hello, little one. You keep "+OW.name+" out of trouble, okay?");
    else{await say("Morning, sleepyhead! Professor Larch knocked earlier. Something about a \"field card\" with your name on it?");await say("She said she'd be out in the north meadow, poking at bugs as usual. Go find her!")}}});
  return m}
function buildRivalHouse(){const m=interiorBase('rhouse',"NEIGHBOR'S HOUSE",12,9);
  deco(m,0,c=>{drawIntWindow(c,90,2);drawPainting(c,180-20,5,14,12)});
  sol(m,8,2,3,1);deco(m,2*16+16,c=>drawCounter(c,128,24,48));
  sol(m,1,1,2,2);deco(m,2*16+15,c=>drawShelf(c,16,8));sol(m,3,1,2,2);deco(m,2*16+15,c=>drawShelf(c,48,8));
  sol(m,5,4,2,2);shadowDeco(m,96,93,15,3,.22);deco(m,5*16+15,c=>drawTable(c,80,64,32,32));
  deco(m,-1,c=>drawRug(c,72,98,48,22),1);
  sol(m,10,7);shadowDeco(m,168,127,6,2);deco(m,7*16+15,c=>drawPlant(c,160,112));sol(m,1,7);shadowDeco(m,24,127,6,2);deco(m,7*16+15,c=>drawPlant(c,16,112));
  deco(m,-1,c=>drawMat(c,80,128,32),1);
  warp(m,5,8,'town',22,10,'down');warp(m,6,8,'town',23,10,'down');
  npc(m,{id:'sister',look:'sister',x:8,y:5,dir:'left',talk:async()=>{await say(OW.flags.rivalDone?"My brother stormed through here muttering about \"sample sizes\". Whatever happened, I think you won something.":"Hi, "+OW.name+"! "+OW.rival+" left at sunrise. He wanted to be first in line at the Field Office. He's been practicing his victory pose all week.")}});
  return m}
function buildLab(){const m=interiorBase('lab','LARCH FIELD OFFICE',20,14,1);
  for(const x of[1,3,5,13,15,17]){sol(m,x,1,2,2);deco(m,2*16+15,c=>drawShelf(c,x*16,8))}
  // lab floor: emblem under the terrarium row + guide stripe to the door
  deco(m,-2,c=>{c.fillStyle='rgba(58,122,208,.28)';c.fillRect(154,170,12,38);c.fillStyle='rgba(58,122,208,.45)';c.fillRect(158,170,4,38);drawPlaza(c,160,152,17,'#3a7ad0',1)},1);
  sol(m,8,1,4,2);deco(m,2*16+15,c=>{drawMachine(c,128,18);drawMachine(c,160,18)});
  m.habitats=[{x:4,y:5,id:'verdivy'},{x:9,y:5,id:'bulwhale'},{x:14,y:5,id:'cindercub'}];
  for(const h of m.habitats){sol(m,h.x,h.y,2,2)}
  for(const h of m.habitats)shadowDeco(m,h.x*16+16,h.y*16+31,16,2,.2);
  sol(m,2,9,3,1);shadowDeco(m,56,159,24,2);deco(m,9*16+15,c=>drawLabTable(c,32,144,48));sol(m,15,9,3,1);shadowDeco(m,264,159,24,2);deco(m,9*16+15,c=>drawLabTable(c,240,144,48));
  for(const[x,y]of[[1,12],[18,12],[1,6],[18,6]]){sol(m,x,y);shadowDeco(m,x*16+8,y*16+15,6,2);deco(m,y*16+15,c=>drawPlant(c,x*16,y*16))}
  deco(m,-1,c=>drawMat(c,144,208,32),1);
  warp(m,9,13,'town',20,21,'down');warp(m,10,13,'town',21,21,'down');
  npc(m,{id:'prof',look:'prof',x:10,y:4,dir:'down',hidden:true,talk:profTalk});
  npc(m,{id:'rival',look:'rival',x:6,y:9,dir:'up',hidden:true,talk:rivalTalk});
  npc(m,{id:'aide',look:'aide',x:16,y:11,dir:'left',wander:1,talk:async()=>{await say("I feed the Terrarium residents. The water one hogs the pond, the fire one naps on the coals, and the grass one sunbathes all day.")}});
  return m}
function lvOf(m){return(X,Y)=>{if(X<0||Y<0||X>=m.w||Y>=m.h)return 0;const e=m.elev?m.elev[Y][X]||0:0;return m.ground[Y][X]===10?Math.max(1,e):e}}
function prepMap(m){m.cvs=[renderMap(m,0),renderMap(m,1)]}
function renderMap(m,fr){const cv0=mkCanvas(m.w*16,m.h*16),c=cpuCtx(cv0);
  for(let Y=0;Y<m.h;Y++)for(let X=0;X<m.w;X++){const x0=X*16,y0=Y*16,v=m.ground[Y][X];
    if(m.interior)drawFloor(c,x0,y0,m.lab,X,Y);else if(v===6)tileCobble(x0,y0,X,Y,c);else if(v===7)tileBridge(x0,y0,X,Y,c,m.ground);else if(v===8)tileDirt(x0,y0,X,Y,c,m.ground);else if(v===1)tilePath(x0,y0,X,Y,c,m.ground);else if(v===2)tileWater(x0,y0,X,Y,c,m.ground,fr);else if(v===3)tileTall(x0,y0,X,Y,c);else if(v===4)tileFlowers(x0,y0,X,Y,c);else if(v===9)tileSand(x0,y0,X,Y,c,m.ground);else if(v===10){if(m.dungeon)tileDungeonWall(x0,y0,X,Y,c,m.ground);else tileCliff(x0,y0,X,Y,c,m.ground,lvOf(m))}else if(v===11)tileStairs(x0,y0,X,Y,c,m.ground);else tileGrass(x0,y0,X,Y,c)}
  if(!m.interior&&!m.dungeon){const lv=lvOf(m);for(let Y=1;Y<m.h;Y++)for(let X=0;X<m.w;X++){const d=lv(X,Y-1)-lv(X,Y);if(d>0&&m.ground[Y][X]!==10&&m.ground[Y][X]!==11){for(let k=0;k<5;k++){c.fillStyle='rgba(20,30,24,'+(.26*(1-k/5)*Math.min(2,d))+')';c.fillRect(X*16,Y*16+k,16,1)}}
    const e=lv(X-1,Y)-lv(X,Y);if(e>0&&m.ground[Y][X]!==10&&m.ground[Y][X]!==11){for(let k=0;k<3;k++){c.fillStyle='rgba(20,30,24,'+(.16*(1-k/3))+')';c.fillRect(X*16+k,Y*16,1,16)}}}}
  if(!TREE_CV){TREE_CV=treeSprite();ROCK_CV=rockSprite()}
  const list=[...m.deco];for(let Y=0;Y<m.h;Y++)for(let X=0;X<m.w;X++){if(m.obj[Y][X]===1){list.push({y:Y*16+26,flat:true,fn:c=>drawTreeShadow(c,X,Y)});list.push({y:Y*16+31,fn:c=>c.drawImage(treeCv(X,Y),X*16,Y*16)})}if(m.obj[Y][X]===2){list.push({y:Y*16+12,flat:true,fn:c=>drawRockShadow(c,X,Y)});list.push({y:Y*16+15,fn:c=>c.drawImage(ROCK_CV,X*16,Y*16)})}}
  list.sort((a,b)=>a.y-b.y).forEach(d=>d.fn(c));const cv=mkCanvas(m.w*16,m.h*16);cv.getContext('2d').drawImage(cv0,0,0);return cv}

/* ---------- dialog / UI ---------- */
const UI={};
function uiInit(){UI.dlg=$('dlg');UI.txt=$('dlgText');UI.arrow=$('dlgArrow');UI.choice=$('choice');UI.name=$('nameBox');UI.toast=$('toast');UI.menu=$('owMenu');UI.loc=$('locName');UI.lvl=$('lvlCard')}
let DLG=null,CHO=null,NAMEB=null;
function say(text){return new Promise(res=>{if(DLG&&DLG.res){const o=DLG.res;DLG=null;o()}UI.dlg.hidden=false;UI.arrow.hidden=true;let t=String(text);const sp=/^([A-Z][A-Z0-9 .'-]{0,13}):\s+/.exec(t),nm=$('dlgName');
  if(sp){t=t.slice(sp[0].length);nm.textContent=sp[1];nm.hidden=false;nm.classList.toggle('you',sp[1]===OW.name)}else nm.hidden=true;UI.dlg.classList.toggle('spk',!!sp);
  DLG={full:t,shown:0,res,done:false};UI.txt.textContent=''})}
function dlgTick(dt){if(!DLG)return;if(!DLG.done){DLG.shown+=dt*60;const n=Math.min(DLG.full.length,Math.floor(DLG.shown));UI.txt.textContent=DLG.full.slice(0,n);if(n>=DLG.full.length){DLG.done=true;UI.arrow.hidden=false}}}
function dlgAdvance(){if(!DLG)return false;if(!DLG.done){DLG.shown=1e9;dlgTick(0);return true}const r=DLG.res;DLG=null;UI.dlg.hidden=true;sfx('blip');r();return true}
function choose(opts){return new Promise(res=>{let i=0;UI.choice.hidden=false;const draw=()=>{UI.choice.innerHTML=opts.map((o,k)=>`<button type="button" class="${k===i?'on':''}" data-k="${k}">${o}</button>`).join('')};draw();
  const done=k=>{UI.choice.hidden=true;CHO=null;sfx('blip');res(k)};CHO={up(){i=(i+opts.length-1)%opts.length;draw();if(CHO.onMove)CHO.onMove(i)},down(){i=(i+1)%opts.length;draw();if(CHO.onMove)CHO.onMove(i)},ok(){done(i)},cancel(){done(opts.length-1)},get i(){return i}};
  UI.choice.onclick=e=>{const b=e.target.closest('button');if(b)done(+b.dataset.k)};
  UI.choice.onmousemove=e=>{const b=e.target.closest('button');if(b&&CHO&&+b.dataset.k!==i){i=+b.dataset.k;draw();sfx('tick');if(CHO.onMove)CHO.onMove(i)}}})}
function askName(title,def,presets){return new Promise(res=>{UI.name.hidden=false;$('nameTitle').textContent=title;const inp=$('nameInput');inp.value='';inp.placeholder=def;
  $('namePresets').innerHTML=presets.map(p=>`<button type="button" class="btn">${p}</button>`).join('');
  const fin=v=>{v=(v||def).toUpperCase().replace(/[^A-Z0-9 ]/g,'').slice(0,10).trim()||def;UI.name.hidden=true;NAMEB=null;sfx('blip');res(v)};NAMEB=fin;
  $('namePresets').onclick=e=>{const b=e.target.closest('button');if(b)fin(b.textContent)};$('nameOk').onclick=()=>fin(inp.value);setTimeout(()=>inp.focus(),30)})}
function toast(t){UI.toast.textContent=t;UI.toast.hidden=false;OW.toastT=3.4}
function showLoc(n){UI.loc.textContent=n;UI.loc.classList.remove('show');void UI.loc.offsetWidth;UI.loc.classList.add('show')}
function wait(s){return new Promise(r=>setTimeout(r,s*1000))}
function fadeTo(v,dur=.35){return new Promise(r=>{if(OW.fadeRes){const o=OW.fadeRes;OW.fadeRes=null;o()}OW.fadeTo=v;OW.fadeSpd=1/dur;OW.fadeRes=r})}

/* ---------- player (free movement) & npcs (grid) ---------- */
function tileOf(px,py){return{x:Math.floor(px/16),y:Math.floor((py-3)/16)}}
function solidTile(m,x,y){if(x<0||y<0||x>=m.w||y>=m.h)return true;return m.walk[y][x]===1}
function canStand(m,px,py){for(const[ox,oy]of[[-5,-6],[5,-6],[-5,-1],[5,-1],[0,-6],[0,-1]])if(solidTile(m,Math.floor((px+ox)/16),Math.floor((py+oy)/16)))return false;
  for(const n of m.npcs){if(n.hidden)continue;const q=entPos(n);if(Math.abs(px-q.x)<12&&Math.abs(py-q.y)<9)return false}return true}
function blocked(m,x,y,self){if(solidTile(m,x,y))return true;if(self!=='p'&&OW.p.x===x&&OW.p.y===y)return true;return m.npcs.some(n=>n!==self&&!n.hidden&&n.x===x&&n.y===y)}
function stepEnt(e,dir,spd){const[dx,dy]=DIRV[dir];e.dir=dir;e.fromX=e.x;e.fromY=e.y;e.x+=dx;e.y+=dy;e.moving=1;e.t=0;e.spd=spd;e.step=(e.step+1)%2}
function entTick(e,dt){if(!e.moving)return false;e.t+=dt/e.spd;if(e.t>=1){e.moving=0;e.t=0;return true}return false}
function entPos(e){if(e===OW.p)return{x:e.px,y:e.py};if(!e.moving)return{x:e.x*16+8,y:e.y*16+15};const k=e.t;return{x:(e.fromX+(e.x-e.fromX)*k)*16+8,y:(e.fromY+(e.y-e.fromY)*k)*16+15}}
function entFrame(e){if(e===OW.p)return e.moving?[1,0,2,0][Math.floor(e.walk/6)%4]:0;return e.moving?(e.t<.5?1+e.step:0):0}
function entBob(e){return 0}
function walkNpc(n,dirs,spd=.2){return new Promise(async r=>{for(const d of dirs){while(n.moving)await wait(.016);stepEnt(n,d,spd);await new Promise(rr=>{n.onArrive=rr})}r()})}
function walkPlayer(dirs){return new Promise(async r=>{for(const d of dirs){const[dx,dy]=DIRV[d];OW.p.dir=d;OW.p.script={dx,dy,left:16};await new Promise(rr=>{OW.p.script.res=rr})}r()})}
function bfs(m,sx,sy,tx,ty,self){const key=(x,y)=>y*m.w+x,prev=new Map([[key(sx,sy),null]]),q=[[sx,sy]];
  while(q.length){const[x,y]=q.shift();if(x===tx&&y===ty)break;for(const d of['up','down','left','right']){const[dx,dy]=DIRV[d],nx=x+dx,ny=y+dy,k=key(nx,ny);if(prev.has(k))continue;if(nx<0||ny<0||nx>=m.w||ny>=m.h)continue;if(!(nx===tx&&ny===ty)&&blocked(m,nx,ny,self))continue;prev.set(k,[x,y,d]);q.push([nx,ny])}}
  const out=[];let k=key(tx,ty);if(!prev.has(k))return[];while(prev.get(k)){const[x,y,d]=prev.get(k);out.unshift(d);k=key(x,y)}return out}
function face(e,t){const dx=t.x-e.x,dy=t.y-e.y;e.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')}
function emote(e,ch='!'){OW.emotes.push({e,ch,t:.9});sfx('ult');return wait(.9)}
function getNpc(id){return OW.map.npcs.find(n=>n.id===id)}
function placePlayer(x,y,dir){Object.assign(OW.p,{x,y,px:x*16+8,py:y*16+14,dir,moving:false,script:null})}

/* ---------- map switching ---------- */
async function gotoMap(id,x,y,dir){await fadeTo(1,.2);setMap(id,x,y,dir);saveGame();await fadeTo(0,.2)}
function setMap(id,x,y,dir){if(id==='millhaven'&&OW.maps.millhaven&&OW.maps.millhaven.rib!==!!OW.flags.ribbon1){OW.maps.millhaven=buildMillhaven();prepMap(OW.maps.millhaven)}const m=OW.maps[id];OW.map=m;placePlayer(x,y,dir);OW.actors=[];
  if(id==='lab')syncLab();markVisit(id);if(m.onEnter)m.onEnter();camSnap();showLoc(m.name);sfx('door')}
function camSnap(){const p=entPos(OW.p);OW.cam.x=camX(p.x);OW.cam.y=camY(p.y)}
function camX(px){const m=OW.map,mw=m.w*16;return mw<=OVW?(mw-OVW)/2:clamp(px-OVW/2,0,mw-OVW)}
function camY(py){const m=OW.map,mh=m.h*16;return mh<=OVH?(mh-OVH)/2:clamp(py-8-OVH/2,0,mh-OVH)}
function syncLab(){const m=OW.maps.lab,pr=m.npcs.find(n=>n.id==='prof'),rv=m.npcs.find(n=>n.id==='rival');
  pr.hidden=!OW.flags.labOpen;rv.hidden=!OW.flags.labOpen||!!OW.flags.rivalLeft;
  for(const h of m.habitats)h.empty=OW.flags.starter===h.id||OW.flags.rivalStarter===h.id}

/* ---------- story scripts ---------- */
async function runScript(fn){OW.lock++;try{await fn()}finally{OW.lock=Math.max(0,OW.lock-1)}}
async function meadowEvent(){const p=OW.p,m=OW.map;
  OW.actors=[{mon:'snipant',x:p.px,y:p.py-30,t:0}];sfx('crack');
  await emote(p,'!');
  await say("The grass rustles... and a wild SNIPANT bursts out, mandibles clacking!");
  await walkPlayer(['down']);OW.actors[0].y=p.py-22;
  await say("It snaps at your shoelaces. It looks very, very proud of itself.");
  const pr=npc(m,{id:'profTown',look:'prof',x:20,y:21,dir:'up'});sfx('blip');
  await say("???: SHOO! Off with you, you little hedge-trimmer!");
  let path=[];for(const[tx,ty]of[[p.x+1,p.y],[p.x-1,p.y],[p.x,p.y+1]]){if(!blocked(m,tx,ty,pr)){path=bfs(m,pr.x,pr.y,tx,ty,pr);if(path.length)break}}if(path.length)await walkNpc(pr,path,.13);
  OW.actors=[];sfx('dash');face(pr,p);face(p,pr);
  await say("LARCH: Hah! Snipants only nip at things that can't nip back. Which, right now, is you.");
  await say("LARCH: "+OW.name+"! There you are. Wren Larch, if you've forgotten. Your field card is ready, but a researcher with no partner is just a person who's bad at hiding.");
  await say("LARCH: Come on. The Terrarium residents have been restless all morning. I think they knew you were coming.");
  await fadeTo(1,.4);m.npcs=m.npcs.filter(n=>n!==pr);OW.flags.labOpen=1;setMap('lab',10,10,'up');await fadeTo(0,.4);
  await say(OW.rival+": FINALLY. I've been staring at these three tanks for an hour, "+OW.name+".");
  await say("LARCH: "+OW.rival+" turned in his field card first, so by rights, he chooses first...");
  await say(OW.rival+": Nope. "+OW.name+" goes first.\nThat way, when I win, nobody can say I stole the best one.");
  await say("LARCH: How generous. Suspiciously generous. Well then!");
  await say("LARCH: Three habitats: a POND, a HEARTH and a PLANTER. Walk up to one and hold out your BOND BAND. If the resident likes you, it'll hop out to meet you.");
  saveGame()}
async function routeBlocked(){await say("The meadow grass stretches north toward ROUTE 1...\nThat road opens in the next chapter!");await walkPlayer(['down'])}
async function offerBand(h){const m=MON[h.id];
  OW.ui='preview';showPreview(h.id);OW.hop={id:h.id,t:0};sfx('blink');
  await say("The "+HABITAT[h.id].toUpperCase()+" resident, "+m.n.toUpperCase()+", presses its face to the glass.\nA "+m.types[0].toUpperCase()+"-type "+(m.cls==='mag'?'magic':'physical')+" "+m.role.toLowerCase()+".");
  await say("Hold out your BOND BAND to "+m.n.toUpperCase()+"?");
  const k=await choose(['YES','NOT YET']);hidePreview();OW.ui=null;OW.hop=null;if(k!==0){await say(m.n.toUpperCase()+" sinks back into its "+HABITAT[h.id]+" with a little sigh.");return}
  OW.flags.starter=h.id;OW.party=[{id:h.id,lv:5,xp:XPN(5),ht:rollHt()}];syncLab();sfx('go');
  await say("Your BOND BAND glows "+({water:'sea-blue',fire:'ember-orange',grass:'leaf-green'})[m.types[0]]+"!\n"+m.n.toUpperCase()+" leaps out and climbs right onto your shoulder!");
  const rid=COUNTER[h.id],rv=getNpc('rival');
  await say(OW.rival+": HA! Knew it. Then I'll take the one that eats yours for breakfast.");
  const hr=OW.maps.lab.habitats.find(x=>x.id===rid);const path=bfs(OW.map,rv.x,rv.y,hr.x,hr.y+2,rv);await walkNpc(rv,path,.16);rv.dir='up';
  OW.flags.rivalStarter=rid;syncLab();sfx('go');
  await say(OW.rival+"'s band flashes and "+MON[rid].n.toUpperCase()+" jumps into his arms.\n"+OW.rival+": Type advantage. Look it up.");
  await say("LARCH: ...So that's why he let you go first. Sneaky. Still, a matchup is only half of a fight.");
  saveGame()}
async function rivalChallenge(){const rv=getNpc('rival'),p=OW.p;
  await emote(rv,'!');await say(OW.rival+": Hold it, "+OW.name+"!\nResearchers test their data, right? So let's test it. Right here, right now!");
  const path=bfs(OW.map,rv.x,rv.y,p.x,p.y-2,rv);if(path.length)await walkNpc(rv,path,.15);face(rv,p);p.dir='up';
  await say("LARCH: Not near the shelves! ...Oh, fine. The tanks are reinforced. Probably.");
  const res=await trainerBattle({enemy:[{id:OW.flags.rivalStarter,lv:5}],name:OW.rival,look:'rival',npc:rv,diff:'easy'});
  OW.flags.rivalDone=1;
  if(res===0)await say(OW.rival+": ...Okay. OKAY. The data was flawed. Small sample size!");
  else await say(OW.rival+": Ha! Told you. Type matchups never lie.\n...Mostly. Yours put up a decent fight.");
  await say(OW.rival+": I'm heading for ROUTE 1 to get a head start. Try to keep up, "+OW.name+"!");
  const out=bfs(OW.map,rv.x,rv.y,9,13,rv);await walkNpc(rv,out,.13);rv.hidden=true;OW.flags.rivalLeft=1;sfx('door');
  const pf=getNpc('prof');face(p,pf);
  await say("LARCH: Let me run your partner through the restorer. Quick hum, a little sparkle...");sfx('reloaded');
  OW.party.forEach(c=>c.hp=null);
  await say("Your team is fully restored!");
  await say("LARCH: Your field card is active, "+OW.name+". ROUTE 1 starts at the north meadow. Bring me back data. And snacks.");
  saveGame();toast('CHAPTER 1 COMPLETE · to be continued')}
async function profTalk(){if(!OW.flags.starter)await say("LARCH: Go on! Walk up to a habitat and hold out your BOND BAND.");
  else if(!OW.flags.rivalDone)await say("LARCH: "+MON[OW.flags.starter].n.toUpperCase()+" hasn't stopped looking at you. That's a good sign.");
  else await say("LARCH: Rule of thumb: water douses fire, fire chars grass, grass drinks water. But a clever tamer can win any matchup.")}
async function rivalTalk(){if(!OW.flags.starter)await say(OW.rival+": Go on, pick. I already know which one I want. Well, which TWO I want.");else await say(OW.rival+": Don't get attached to winning.")}

/* ---------- leveling ---------- */
// encounters track the player's real progress: wilds never above your best mon, trainers +1, gym/boss +2
function partyRef(){return Math.max(1,...((OW&&OW.party)||[]).map(c=>c.lv||1))}
function encLv(lv,k){return Math.max(2,Math.min(lv,partyRef()+(k==='w'?0:k==='t'?1:2)))}
function xpYield(id,lv,trainer){return Math.floor(MON[id].xp*lv/5*(trainer?1.5:1))}
async function grantXP(kos,trainer){for(const k of kos){const parts=k.used.filter(i=>OW.party[i]);if(!parts.length)continue;const share=Math.max(1,Math.floor(xpYield(k.id,k.lv,trainer)/parts.length));
  for(const i of parts){const c=OW.party[i],m=MON[c.id];c.xp+=share;await say(m.n.toUpperCase()+" gained "+share+" EXP. Points!");
    while(c.lv<100&&c.xp>=XPN(c.lv+1)){const before=calcStats(m,c.lv);c.lv++;const after=calcStats(m,c.lv);sfx('go');showLvl(m,c.lv,before,after);await say(m.n.toUpperCase()+" grew to Lv. "+c.lv+"!");hideLvl()}
    await evolveScene(c)}}}
function showLvl(m,lv,a,b){const rows=[['HP','max'],[m.cls==='mag'?'MAGIC':'ATTACK','dmg'],['PHYS DEF','pdef'],['MAGIC DEF','mdef'],['INTELLECT','int'],['SPEED','spe']];
  UI.lvl.innerHTML=`<b><span>${m.n.toUpperCase()}</span><i>LV ${lv}!</i></b>`+rows.map(([l,k])=>`<div><span>${l}</span><span>${b[k]}</span><em>+${b[k]-a[k]}</em></div>`).join('');UI.lvl.hidden=false}
function hideLvl(){UI.lvl.hidden=true}

/* ---------- trainer battle: cut the overworld ---------- */
function trainerBattle(o){return new Promise(async res=>{const m=OW.map,p=OW.p;
  await say(o.name+" challenges you to a battle!");
  OW.cut={t:0};sfx('ult');await wait(.75);OW.cut=null;
  let x0,y0,w,h;if(m.interior){x0=0;y0=0;w=m.w;h=m.h}else{w=Math.min(m.w,40);h=Math.min(m.h,24);x0=clamp(Math.round((p.x+o.npc.x)/2-w/2),0,m.w-w);y0=clamp(Math.round((p.y+o.npc.y)/2-h/2),0,m.h-h)}
  const sub=k=>m[k].slice(y0,y0+h).map(r=>r.slice(x0,x0+w));
  MW=w;MH=h;WW=w*16;WH=h*16;MINI=null;
  MAP={ground:sub('ground'),obj:sub('obj'),walk:sub('walk'),shot:sub('shot')};softTrees(MAP);
  WORLD=m.cvs.map(cv=>{const c=mkCanvas(WW,WH),x=c.getContext('2d');x.drawImage(cv,-x0*16,-y0*16);if(m.habitats)for(const hb of m.habitats)drawHabitatLive(x,hb,(hb.x-x0)*16,(hb.y-y0)*16,0);return c});
  sel.diff=o.diff;newGame(OW.party.map(c=>({id:c.id,lv:c.lv,hp:c.hp,ht:c.ht})),o.enemy.map(e=>Object.assign({},e,{lv:encLv(e.lv,o.gym?'b':'t')})),o.diff);
  const P=G.f[0],Q=G.f[1];P.x=p.px-x0*16;P.y=p.py-y0*16-2;Q.x=(o.npc.x-x0)*16+8;Q.y=(o.npc.y-y0)*16+12;P.aim=Math.atan2(Q.y-P.y,Q.x-P.x);Q.aim=P.aim+PI;
  G.kos=[];G.story={name:o.name,x0,y0,onEnd:async w=>{APP.mode='ow';$('hud').hidden=true;OW.last=performance.now();
    G.f[0].team.forEach((u,i)=>{if(OW.party[i])OW.party[i].hp=Math.max(1,Math.round(u.hp))});
    await grantXP(G.kos,true);if(w===0&&!o.noPay){const pay=60*Math.max(...o.enemy.map(e=>e.lv));OW.money=(OW.money||0)+pay;sfx('go');await say('You got $'+pay+' for winning!')}res(w)}};G.start=2.4;
  G.cam.x=WW<=W?(WW-W)/2:clamp(P.x-W/2,0,WW-W);G.cam.y=WH<=H?(WH-H)/2:clamp(P.y-H/2,0,WH-H);
  APP.mode='battle';$('hud').hidden=false;buildHud();last=performance.now()})}
function drawHabitatLive(c,h,x,y,t){drawHabitat(c,x,y,HABITAT[h.id],0);if(!h.empty){const hop=OW.hop&&OW.hop.id===h.id?Math.abs(Math.sin(OW.t*9))*3:Math.abs(Math.sin(t*2+h.x))*.5;const S=SPR[h.id].norm.down[Math.floor(t*2+h.x)%2];if(t>0)c.drawImage(S.c,x+8,Math.round(y+5-hop),16,16)}drawHabitat(c,x,y,HABITAT[h.id],1)}

/* ---------- overworld loop ---------- */
function fadeTick(dt){if(OW.fade!==OW.fadeTo){const s=(OW.fadeSpd||3)*dt;OW.fade=OW.fade<OW.fadeTo?Math.min(OW.fadeTo,OW.fade+s):Math.max(OW.fadeTo,OW.fade-s);if(OW.fade===OW.fadeTo&&OW.fadeRes){const r=OW.fadeRes;OW.fadeRes=null;r()}}
  if(OW.toastT>0){OW.toastT-=dt;if(OW.toastT<=0)UI.toast.hidden=true}}
function owUpdate(dt){OW.t+=dt;dlgTick(dt);fadeTick(dt);
  for(const e of OW.emotes)e.t-=dt;OW.emotes=OW.emotes.filter(e=>e.t>0);
  for(const a of OW.actors)a.t+=dt;
  if(APP.mode!=='ow'||!OW.map)return;
  const m=OW.map,p=OW.p;
  for(const n of m.npcs){if(entTick(n,dt)&&n.onArrive){const r=n.onArrive;n.onArrive=null;r()}
    if(n.wander&&!n.moving&&!OW.lock&&!DLG&&!n.hidden){n.wt-=dt;if(n.wt<=0){n.wt=1.5+Math.random()*2.5;const ds=['up','down','left','right'],d=ds[Math.floor(Math.random()*4)],[dx,dy]=DIRV[d],nx=n.x+dx,ny=n.y+dy;n.dir=d;
      const pp=tileOf(p.px,p.py);if(Math.abs(nx-n.home.x)<=n.wander&&Math.abs(ny-n.home.y)<=n.wander&&!blocked(m,nx,ny,n)&&!(pp.x===nx&&pp.y===ny)&&!m.warps.some(w=>w.x===nx&&w.y===ny))stepEnt(n,d,.32)}}}
  // player
  let vx=0,vy=0;
  if(p.script){const s=p.script,st=Math.min(s.left,WALK_SPD*dt);p.px+=s.dx*st;p.py+=s.dy*st;s.left-=st;p.moving=true;p.walk+=st;if(s.left<=0){p.script=null;const t=tileOf(p.px,p.py);p.x=t.x;p.y=t.y;s.res()}}
  else if(!OW.lock&&!DLG&&!OW.menuOpen&&!OW.ui){
    vx=((K.KeyD||K.ArrowRight)?1:0)-((K.KeyA||K.ArrowLeft)?1:0);vy=((K.KeyS||K.ArrowDown)?1:0)-((K.KeyW||K.ArrowUp)?1:0);
    const run=K.ShiftLeft||K.ShiftRight,sp=(run?RUN_SPD:WALK_SPD)*dt,l=Math.hypot(vx,vy);
    if(l){vx/=l;vy/=l;if(Math.abs(vx)>Math.abs(vy)+.01)p.dir=vx>0?'right':'left';else if(Math.abs(vy)>.01)p.dir=vy>0?'down':'up';
      let moved=0;const nx=p.px+vx*sp;if(canStand(m,nx,p.py)){p.px=nx;moved+=Math.abs(vx*sp)}else if(vy===0){for(const off of[1,-1]){const tryY=p.py+off*sp;if(canStand(m,p.px,tryY)&&canStand(m,nx,p.py+off*6)){p.py=tryY;moved+=sp*.5;break}}}
      const ny=p.py+vy*sp;if(canStand(m,p.px,ny)){p.py=ny;moved+=Math.abs(vy*sp)}else if(vx===0){for(const off of[1,-1]){const tryX=p.px+off*sp;if(canStand(m,tryX,p.py)&&canStand(m,p.px+off*6,ny)){p.px=tryX;moved+=sp*.5;break}}}
      p.moving=moved>0;p.walk+=moved*(run?1.15:1);if(!moved&&OW.t-p.bump>.4){p.bump=OW.t;sfx('bonk')}
      const t=tileOf(p.px,p.py);if(t.x!==p.x||t.y!==p.y){p.x=t.x;p.y=t.y;onArrive()}}
    else p.moving=false}
  else p.moving=!!p.script;
  const pp=entPos(p),k=1-Math.exp(-10*dt);OW.cam.x+=(camX(pp.x)-OW.cam.x)*k;OW.cam.y+=(camY(pp.y)-OW.cam.y)*k;
  if(OW.cut)OW.cut.t+=dt}
function onArrive(){const m=OW.map,p=OW.p;const w=m.warps.find(w=>w.x===p.x&&w.y===p.y);
  if(w){const ok=w.cond?w.cond():true;if(ok===true){runScript(()=>gotoMap(w.to,w.tx,w.ty,w.dir));return}else{runScript(async()=>{await say(ok);await walkPlayer([{up:'down',down:'up',left:'right',right:'left'}[p.dir]])});return}}
  if(m.id==='lab'&&OW.flags.starter&&!OW.flags.rivalDone&&p.y>=10){runScript(rivalChallenge);return}
  if(m.onStep)runScript(()=>m.onStep(p.x,p.y))}
function interact(){const m=OW.map,p=OW.p,[dx,dy]=DIRV[p.dir];const fx=p.px+dx*14,fy=p.py-4+dy*14,tx=Math.floor(fx/16),ty=Math.floor(fy/16);
  const n=m.npcs.find(n=>{if(n.hidden||n.moving)return false;const q=entPos(n);return Math.hypot(q.x-fx,q.y-4-fy)<13});
  const n2=n||m.npcs.find(n=>{if(n.hidden||n.moving||!n.reach)return false;const q=entPos(n);return Math.hypot(q.x-(p.px+dx*30),q.y-4-(p.py-4+dy*30))<13});
  if(n2&&n2.talk){runScript(async()=>{face(n2,p);await n2.talk()});return}
  const s=m.signs.find(s=>s.x===tx&&s.y===ty);if(s){runScript(()=>say(typeof s.text==='function'?s.text():s.text));return}
  if(m.well&&tx>=m.well.x&&tx<=m.well.x+1&&ty>=m.well.y&&ty<=m.well.y+1){runScript(useWell);return}
  if(m.habitats){const h=m.habitats.find(h=>tx>=h.x&&tx<=h.x+1&&ty>=h.y&&ty<=h.y+1);if(h){runScript(async()=>{if(h.empty)await say("An empty "+HABITAT[h.id]+". It still smells faintly of "+({pond:'pond water',hearth:'woodsmoke',planter:'fresh soil'})[HABITAT[h.id]]+".");else if(OW.flags.starter)await say(MON[h.id].n.toUpperCase()+" waves at you from its "+HABITAT[h.id]+".");else await offerBand(h)});return}}}
function owRender(){const m=OW.map;ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;if(m&&r3dOn()){R3D.ow();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);owScreen();return}ctx.fillStyle='#101418';ctx.fillRect(0,0,W,H);
  if(!m)return;ctx.setTransform(OVZ,0,0,OVZ,0,0);const cx=Math.round(OW.cam.x*2)/2,cy=Math.round(OW.cam.y*2)/2;
  ctx.drawImage(m.cvs[Math.floor(OW.t*1.6)%2],-cx,-cy);ctx.translate(-cx,-cy);
  const ents=[...m.npcs.filter(n=>!n.hidden).map(n=>({e:n,look:n.look})),{e:OW.p,look:OW.look}].map(o=>({...o,pos:entPos(o.e),y:entPos(o.e).y}));
  if(m.habitats)for(const h of m.habitats)ents.push({hab:h,y:h.y*16+31});
  for(const a of OW.actors)ents.push({actor:a,y:a.y});
  ents.sort((a,b)=>a.y-b.y);
  for(const o of ents){
    if(o.hab){drawHabitatLive(ctx,o.hab,o.hab.x*16,o.hab.y*16,OW.t);continue}
    if(o.actor){const a=o.actor,S=SPR[a.mon].norm.down[Math.floor(a.t*8)%2];ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(Math.round(a.x-5),Math.round(a.y),10,2);ctx.drawImage(S.c,Math.round(a.x-8),Math.round(a.y-15-Math.abs(Math.sin(a.t*10))*2),16,16);continue}
    const fr=entFrame(o.e),spr=HSPR[o.look][o.e.dir][fr],x=Math.round(o.pos.x-10),y=Math.round(o.pos.y-29)+entBob(o.e);
    ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(x+5,y+28,10,2);ctx.fillRect(x+6,y+27,8,1);ctx.drawImage(spr,x,y,20,30);
    const t=tileOf(o.pos.x,o.pos.y);if(m.ground[t.y]?.[t.x]===3&&!m.interior)ctx.drawImage(TALL_OVER,0,0,16,10,x+2,y+20,16,10)}
  for(const em of OW.emotes){const pos=entPos(em.e);const x=Math.round(pos.x-6),y=Math.round(pos.y-38+(em.t>.75?(em.t-.75)*20:0));ctx.fillStyle='#282830';ctx.fillRect(x,y,12,12);ctx.fillStyle='#ffffff';ctx.fillRect(x+1,y+1,10,10);ctx.fillRect(x+4,y+12,4,2);ctx.fillStyle='#f83838';ctx.fillRect(x+5,y+3,2,5);ctx.fillRect(x+5,y+9,2,1)}
  owScreen()}
function owScreen(){ctx.setTransform(1,0,0,1,0,0);owMinimap();
  if(OW.cut)drawCut(OW.cut.t,OW.cut.col);
  if(OW.fade>0){ctx.globalAlpha=OW.fade;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}}

// trainer-battle transition (~0.75s): double flash, then diagonal bands clash in from both sides with accent leading edges, then a white slash
function drawCut(t,col){const A=col||'#e8502a',B='#2a6ee8',ink='#1c1c28',ez=x=>1-Math.pow(1-Math.max(0,Math.min(1,x)),3);
  if(t<.05||(t>.09&&t<.14)){ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(0,0,W,H)}
  ctx.save();ctx.translate(W/2,H/2);ctx.rotate(-.38);const D=Math.hypot(W,H),n=6,bh=D/n;
  const sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};for(let i=0;i<n;i++){const k=sm((t-.1-i*.04)/.26);if(k<=0)continue;const fromL=i%2===0,len=D*1.1*k,y=-D/2+i*bh,x0=fromL?-D*.55:D*.55-len,ex=fromL?x0+len:x0;
    ctx.fillStyle=ink;ctx.fillRect(x0,y-.5,len,bh+1);ctx.fillStyle=fromL?A:B;
    if(k<1){ctx.fillRect(fromL?ex-12:ex,y,12,bh);ctx.fillStyle='#ffffff';ctx.fillRect(fromL?ex-3:ex+1,y,2,bh)}
    else{ctx.globalAlpha=.22;ctx.fillRect(-D*.55,y+bh-3,D*1.1,3);ctx.globalAlpha=1}}
  const s1=(t-.42)/.16,s2=(t-.6)/.15;
  if(s1>0){const w=D*ez(s1),th=6+Math.max(0,s2)*H*1.3;ctx.fillStyle=A;ctx.fillRect(-w/2,-th/2-4,w,th+8);ctx.fillStyle='#ffffff';ctx.globalAlpha=s2>0?1:.95;ctx.fillRect(-w/2,-th/2+1,w,Math.max(2,th-2));ctx.globalAlpha=1}
  ctx.restore()}

/* ---------- intro ---------- */
async function runIntro(){APP.mode='intro';OW.intro={who:'prof',t:0};showStage(false);
  await fadeTo(0,.5);
  await say("...click. Is this thing recording? The little light's on. Right!");
  await say("Field log, day one. I'm WREN LARCH: field researcher, part-time botanist, full-time type obsessive.");
  OW.intro.mon='snipant';sfx('crack');
  await say("SNIPANT! Out of my coat pocket! ...Sorry. This one follows me everywhere and pinches anything it can't eat.");
  await say("Creatures like it live everywhere: in the meadows, under the docks, inside volcanoes. Every one of them carries a TYPE.");
  await say("And when two types meet, they CLASH. Water hisses over flame. Roots crack stone. I've spent thirty years mapping those clashes, and I'm still surprised every week.");
  OW.intro.mon=null;
  await say("Fernbrook's field office needs a new junior researcher. You came recommended! Let's fill out your field card.");
  await say("First, the photo for your card. Which one is you?");
  OW.intro.who='pick';OW.intro.pick=0;
  const g=await new Promise(async r=>{const pr=choose(['THIS ONE (LEFT)','THIS ONE (RIGHT)']);CHO.onMove=i=>{OW.intro.pick=i};r(await pr)});
  OW.look=g===1?'playerG':'player';OW.intro.who=OW.look;
  OW.name=await askName('NAME FOR YOUR FIELD CARD',g===1?'LEAF':'RED',g===1?['LEAF','JADE','MAY','ROSA']:['RED','ASH','CAL','NATE']);
  await say(OW.name+". Good name. Fits nicely in the little box.");
  OW.intro.who='rival';
  await say("Your next-door neighbor turned in HIS card at dawn. Loud. Confident. Has told me he's \"the best tamer in Fernbrook\" eleven times this week.");
  await say("Remind me... what does he call himself?");
  OW.rival=await askName("YOUR NEIGHBOR'S NAME",'KAI',['KAI','REX','DUKE','MILO']);
  await say(OW.rival+". Yes. He wrote it in very large letters.");
  OW.intro.who=OW.look;
  await say("Right, "+OW.name+". Come find me in the morning. Your card's waiting, and so is something a little more alive.");
  await say("End of log. ...click.");
  await fadeTo(1,.6);OW.intro=null;
  OW.flags={};OW.party=[];OW.items={potion:2,tether:0};OW.box=[];OW.money=500;OW.playT=0;buildWorldMaps();APP.mode='ow';setMap('home',9,3,'down');saveGame();await fadeTo(0,.6)}
function introRender(){ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#203048');g.addColorStop(1,'#101828');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let i=0;i<40;i++){ctx.fillStyle='rgba(255,255,255,'+(.05+.05*Math.sin(OW.t*2+i))+')';ctx.fillRect((i*97)%W,(i*53)%H,2,2)}
  ctx.fillStyle='#d83838';if(Math.floor(OW.t*2)%2)ctx.fillRect(14,12,6,6);ptext('REC · FIELD LOG 001',26,15,'#e0e0e8',9,'left');
  ctx.fillStyle='#384868';ctx.beginPath();ctx.ellipse(W/2,H/2+52,90,16,0,0,6.283);ctx.fill();ctx.fillStyle='#4a5c80';ctx.beginPath();ctx.ellipse(W/2,H/2+50,80,12,0,0,6.283);ctx.fill();
  const I=OW.intro;if(!I)return;
  if(I.who==='pick'){for(const[k,lk]of[[0,'player'],[1,'playerG']]){const x=W/2-110+k*130,sel_=I.pick===k;ctx.fillStyle=sel_?'#f8d030':'#506080';ctx.fillRect(x-6,H/2-82,92,132);ctx.fillStyle='#e8eef4';ctx.fillRect(x-2,H/2-78,84,124);ctx.drawImage(HSPR[lk].down[0],x+2,H/2-70,80,120)}}
  else{const spr=HSPR[I.who].down[0];ctx.drawImage(spr,W/2-40-(I.mon?40:0),H/2-70,80,120)}
  if(I.mon){const S=SPR[I.mon].norm.left[Math.floor(OW.t*3)%2];ctx.drawImage(S.c,W/2+10,H/2-40-Math.abs(Math.sin(OW.t*8))*4,96,96)}
  if(OW.fade>0){ctx.globalAlpha=OW.fade;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}}

/* ---------- preview card ---------- */
function showPreview(id){const m=MON[id],el=$('preview');el.hidden=false;el.innerHTML=`<canvas class="px" id="pvc"></canvas><div><b>${m.n.toUpperCase()}</b><div class="tys">${chips(m.types)}${clsChip(m)}</div><p>${m.blurb}</p><div class="mm">${miniStats(m)}</div></div>`;portrait($('pvc'),id)}
function hidePreview(){$('preview').hidden=true}

/* ---------- save / load ---------- */
function saveGame(){try{localStorage.setItem('typeclash_save',JSON.stringify({v:2,name:OW.name,rival:OW.rival,look:OW.look,flags:OW.flags,party:OW.party,items:OW.items||{},box:OW.box||[],money:OW.money||0,playT:OW.playT||0,route:APP.mode==='route'?OW.routeAt:null,lastHeal:OW.lastHeal,map:OW.map&&OW.map.id,x:OW.p.x,y:OW.p.y,dir:OW.p.dir}))}catch(e){}}
function loadSave(){try{return JSON.parse(localStorage.getItem('typeclash_save')||'null')}catch(e){return null}}
function buildMillHouses(){
  const a=buildMillHouse('mhouse1','CANAL HOUSE',[33,25],m=>{deco(m,0,c=>{drawIntWindow(c,40,2);drawWallClock(c,120,3)});sol(m,1,1,2,2);deco(m,2*16+15,c=>drawShelf(c,16,8));sol(m,8,2,3,1);deco(m,2*16+16,c=>drawCounter(c,128,24,48));
    sol(m,4,4,2,2);shadowDeco(m,80,93,15,3,.22);deco(m,5*16+15,c=>drawTable(c,64,64,32,32));deco(m,-1,c=>drawRug(c,56,96,48,20),1);for(const x of[1,10]){sol(m,x,7);deco(m,7*16+15,c=>drawPlant(c,x*16,112))}},
    [{id:'fisher',look:'sailor',x:7,y:5,dir:'left',talk:async()=>{await say("Saltwind Coast's got deep water past the shoals. Can't cross it without a partner who swims. Mine just floats and complains.")}},
     {id:'fishkid',look:'girl',x:3,y:6,dir:'right',wander:1,talk:async()=>{await say("I saw a ghost bird over the lighthouse once! It went \"wooo\". Or maybe that was the wind.")}}]);
  const b=buildMillHouse('mhouse2',"WOODCUTTER'S HOUSE",[34,9],m=>{deco(m,0,c=>{drawIntWindow(c,140,2);drawPainting(c,40,4,16,12)});sol(m,1,1,2,2);deco(m,2*16+15,c=>drawShelf(c,16,8));
    for(const[x,y]of[[9,2],[10,2]]){prop(m,x,y,1,1,c=>drawBarrel(c,x*16,y*16),1)}sol(m,5,4,2,2);shadowDeco(m,96,93,15,3,.22);deco(m,5*16+15,c=>drawTable(c,80,64,32,32));sol(m,10,7);deco(m,7*16+15,c=>drawPlant(c,160,112))},
    [{id:'woodcutter',look:'hiker',x:3,y:5,dir:'right',talk:async()=>{if(!OW.flags.woodGift){OW.flags.woodGift=1;OW.items.wood=(OW.items.wood||0)+2;sfx('go');await say("Off to the coast? Here, take two bundles of CAMPFIRE WOOD. Find a fire pit, press E, and your whole team rests up.");toast('Received 2 CAMPFIRE WOOD!');saveGame()}
      else await say("Dry wood's the secret. Wet wood just sulks and smokes. The Waystation sells good bundles.")}}]);
  return{mhouse1:a,mhouse2:b}}
function buildWorldMaps(){OW.maps=Object.assign({town:buildTown(),home:buildHome(),rhouse:buildRivalHouse(),lab:buildLab(),route1:buildRoute1(),millhaven:buildMillhaven(),waystation:buildWaystation(),guild:buildGuild(),route2:buildRoute2(),lighthouse:buildLighthouse(),ruins:buildRuins(),coliseum:buildColiseum(),route3:buildRoute3()},buildMillHouses());for(const k in OW.maps)prepMap(OW.maps[k])}

/* ---------- screens ---------- */
function showStage(hud){$('title').hidden=true;$('select').hidden=true;$('over').hidden=true;$('stage').hidden=false;$('hud').hidden=!hud;fit();startOwLoop()}
function startOwLoop(){if(OW.running)return;OW.running=true;OW.last=performance.now();requestAnimationFrame(owLoop)}
function owLoop(now){if(!OW.running)return;requestAnimationFrame(owLoop);const dt=Math.max(0,Math.min(1/30,(now-OW.last)/1000));OW.last=now;try{owFrame(dt)}catch(e){console.error('frame error',e.message,e.stack)}}
function owFrame(dt){{const fr=$('frame'),ib=APP.mode==='route'||APP.mode==='battle';if(fr&&fr.classList.contains('inbattle')!==ib)fr.classList.toggle('inbattle',ib)}if(APP.mode==='ow'||APP.mode==='route'||APP.mode==='battle')OW.playT=(OW.playT||0)+dt;
  cv.style.cursor=APP.mode==='battle'?'none':'default';
  if(APP.mode==='battle'||APP.mode==='route'){setView(BW,BH);fadeTick(dt);if(APP.mode==='route')routeTick(dt);update(dt);render();updHud();dlgTick(dt);if(OW.fade>0){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=OW.fade;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}}
  else{setView(480,270);owUpdate(dt);if(APP.mode==='intro')introRender();else owRender()}
  flushText()}
function toTitle(){if(APP.mode==='route')syncPartyFromBattle(),saveGame();OW.running=false;running=false;APP.mode='title';$('stage').hidden=true;$('select').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('owMenu').hidden=true;$('dlg').hidden=true;$('lvlCard').hidden=true;DLG=null;$('title').hidden=false;$('contBtn').hidden=!loadSave()}
async function newStory(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}OW.fade=1;OW.fadeTo=1;OW.lock=1;try{await runIntro()}finally{OW.lock=0}}
function continueStory(){const s=loadSave();if(!s)return;if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}
  const party=(s.party||[]).map(c=>typeof c==='string'?{id:c,lv:5,xp:XPN(5)}:c);for(const c of [...party,...(s.box||[])])if(!c.ht)c.ht=rollHt();
  Object.assign(OW,{name:s.name,rival:s.rival,look:s.look||'player',flags:s.flags||{},party,items:Object.assign({potion:0,tether:0},s.items||{}),box:s.box||[],lastHeal:s.lastHeal,money:s.money??500,playT:s.playT||0});buildWorldMaps();showStage(false);APP.mode='ow';OW.fade=0;OW.fadeTo=0;setMap(s.map||'home',s.x??9,s.y??3,s.dir||'down');if(s.route)startRoute(s.route.id,s.route.entry||'south')}
/* ---------- maps: world map (menu) + area minimap (overworld) ---------- */
const WMAP=[{id:'town',n:'FERNBROOK',x:70,y:208,t:'town'},{id:'route1',n:'HOLLOWMILL TRAIL',x:70,y:150,t:'route',path:[[70,200],[70,120]]},{id:'millhaven',n:'MILLHAVEN',x:70,y:104,t:'town'},
  {id:'route2',n:'SALTWIND COAST',x:150,y:92,t:'route',path:[[78,104],[118,102],[152,90],[176,66],[186,40]]},{id:'lighthouse',n:'SALTWIND LIGHTHOUSE',x:186,y:30,t:'tower'},{id:'route3',n:'TALONREACH WILDS',x:36,y:104,t:'route',path:[[62,104],[48,104],[36,96],[24,104]],area:[10,78,60,130]}];
const AREA_OF={home:'town',rhouse:'town',lab:'town',waystation:'millhaven',guild:'millhaven',mhouse1:'millhaven',mhouse2:'millhaven',ruins:'lighthouse'};
function curArea(){if(APP.mode==='route'&&G&&G.route)return G.route.map.id;const id=OW.map&&OW.map.id;return AREA_OF[id]||id}
function markVisit(id){id=AREA_OF[id]||id;if(!OW.flags['v_'+id]){OW.flags['v_'+id]=1}}
function drawWorldMap(cv,hov){const W=260,H=236,c=cv.getContext('2d');cv.width=W;cv.height=H;c.imageSmoothingEnabled=false;
  c.fillStyle='#2a5cb8';c.fillRect(0,0,W,H);for(let i=0;i<40;i++){c.fillStyle='rgba(216,244,255,.25)';c.fillRect((i*53)%W,(i*37)%H,6,1)}
  c.fillStyle='#3f86e0';c.beginPath();c.moveTo(0,0);c.lineTo(206,0);c.bezierCurveTo(196,60,214,120,200,170);c.bezierCurveTo(190,210,160,236,120,236);c.lineTo(0,236);c.closePath();c.fill();
  c.fillStyle='#4f9a3e';c.beginPath();c.moveTo(0,0);c.lineTo(200,0);c.bezierCurveTo(190,60,208,120,194,168);c.bezierCurveTo(184,206,156,230,116,232);c.lineTo(0,232);c.closePath();c.fill();
  c.fillStyle='#e6c98c';c.beginPath();c.moveTo(186,40);c.bezierCurveTo(196,90,200,130,190,168);c.lineTo(184,166);c.bezierCurveTo(192,130,188,90,180,40);c.closePath();c.fill();
  c.fillStyle='#2f6e34';for(let i=0;i<60;i++){const x=(i*71)%180,y=(i*43)%220;c.fillRect(x,y,4,3)}c.fillStyle='#7a6a5a';c.fillRect(10,60,30,90);c.fillStyle='#6a5a4a';c.fillRect(10,146,30,4);
  const cur=curArea(),seen=id=>OW.flags['v_'+id]||id===cur;
  for(const n of WMAP)if(n.area){const[a0,b0,a1,b1]=n.area,sn=seen(n.id);if(sn){for(let k=0;k<4;k++){c.fillStyle=['#5a8a44','#6a9a50','#7aaa5a','#8aba66'][k];c.fillRect(a0+k*5,b0+k*4,a1-a0-k*10,b1-b0-k*8)}c.strokeStyle='#4a3a2e';c.lineWidth=1;for(let k=0;k<4;k++)c.strokeRect(a0+k*5+.5,b0+k*4+.5,a1-a0-k*10-1,b1-b0-k*8-1)}
    else{c.strokeStyle='rgba(246,230,184,.35)';c.setLineDash([3,4]);c.lineWidth=2;c.strokeRect(a0,b0,a1-a0,b1-b0);c.setLineDash([])}}
  for(const n of WMAP)if(n.path){c.strokeStyle=seen(n.id)?'#f6e6b8':'rgba(246,230,184,.25)';c.lineWidth=5;c.setLineDash(seen(n.id)?[]:[3,4]);c.beginPath();n.path.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.setLineDash([])}
  for(const n of WMAP){if(n.path)continue;const s=seen(n.id);c.fillStyle='#1c1c28';if(n.t==='tower'){c.fillRect(n.x-4,n.y-10,9,16);c.fillStyle=s?'#e84848':'#555';c.fillRect(n.x-3,n.y-9,7,14);c.fillStyle=s?'#f4f0e8':'#777';c.fillRect(n.x-3,n.y-4,7,3);c.fillStyle='#a040e0';c.fillRect(n.x-2,n.y-12,5,3)}
    else{c.fillRect(n.x-8,n.y-6,16,12);c.fillStyle=s?'#e8502a':'#666';c.fillRect(n.x-7,n.y-5,14,10);c.fillStyle=s?'#fff0a0':'#888';c.fillRect(n.x-5,n.y-3,4,3);c.fillRect(n.x+1,n.y-3,4,3)}}
  c.font='bold 9px "Pixelify Sans",monospace';c.textAlign='left';
  if(hov&&hov.n){const n=hov.n,s=seen(n.id),label=s?n.n:'???';c.font='bold 10px "Pixelify Sans",monospace';const w=c.measureText(label).width,lx=clamp(hov.x-w/2,4,W-w-8),ly=hov.y-14;c.fillStyle='#1c1c28';c.fillRect(lx-4,ly-11,w+8,15);c.fillStyle='#f8f8f4';c.fillRect(lx-3,ly-10,w+6,13);c.fillStyle='#1c1c28';c.fillText(label,lx,ly)}
  if(hov){c.strokeStyle='#1c1c28';c.lineWidth=3;c.beginPath();c.arc(hov.x,hov.y,6,0,6.3);c.stroke();c.strokeStyle='#ffffff';c.lineWidth=1.5;c.beginPath();c.arc(hov.x,hov.y,6,0,6.3);c.stroke();c.fillStyle='#ffffff';c.fillRect(hov.x-1,hov.y-10,2,4);c.fillRect(hov.x-1,hov.y+6,2,4);c.fillRect(hov.x-10,hov.y-1,4,2);c.fillRect(hov.x+6,hov.y-1,4,2)}
  const me=WMAP.find(n=>n.id===cur);if(me){const pu=Math.floor(performance.now()/300)%2;c.fillStyle='#1c1c28';c.beginPath();c.arc(me.x,me.y-(me.t==='route'?0:14),5,0,6.3);c.fill();c.fillStyle=pu?'#f8c838':'#ffffff';c.beginPath();c.arc(me.x,me.y-(me.t==='route'?0:14),3.5,0,6.3);c.fill()}}
function areaMapCanvas(m){if(m.__mini)return m.__mini;const s=Math.min(1,Math.max(.12,150/Math.max(m.w,m.h)/16*1.0)),cv=mkCanvas(Math.ceil(m.w*16*s),Math.ceil(m.h*16*s)),x=cv.getContext('2d');x.imageSmoothingEnabled=true;x.drawImage(m.cvs[0],0,0,cv.width,cv.height);m.__mini={cv,s};return m.__mini}
function owMinimap(){const m=OW.map;if(!m||m.interior||OW.showMini===false||APP.mode!=='ow'||OW.menuOpen)return;const mm=areaMapCanvas(m),k=Math.min(96/mm.cv.width,72/mm.cv.height),w=Math.round(mm.cv.width*k),h=Math.round(mm.cv.height*k),x0=W-w-8,y0=8;
  ctx.globalAlpha=.92;ctx.fillStyle='#1c1c28';ctx.fillRect(x0-3,y0-3,w+6,h+6);ctx.drawImage(mm.cv,x0,y0,w,h);ctx.globalAlpha=1;const sc=w/(m.w*16);
  for(const n of m.npcs)if(!n.hidden){ctx.fillStyle='#2a6ee8';ctx.fillRect(Math.round(x0+(n.x*16+8)*sc)-1,Math.round(y0+(n.y*16+12)*sc)-1,2,2)}
  const pu=Math.floor(OW.t*4)%2;ctx.fillStyle='#1c1c28';ctx.fillRect(Math.round(x0+OW.p.px*sc)-2,Math.round(y0+OW.p.py*sc)-3,5,5);ctx.fillStyle=pu?'#f8c838':'#e8502a';ctx.fillRect(Math.round(x0+OW.p.px*sc)-1,Math.round(y0+OW.p.py*sc)-2,3,3);
  ptext(m.name,x0+w/2,y0+h+8,'#ffffff',6)}

/* ---------- full pause menu: team / summary / bag / card / options ---------- */
const HT_BASE={bulwhale:1.8,fistinel:1.5,frostbunt:.6,verdivy:.9,snipant:.4,scrattle:.35,cindercub:.8,umbrynx:1.1,voltusk:1.4,mesmamba:2.1,phantern:.7,dunemaw:.5,ampoule:.6,prismoth:.45,hexwyrmp:3.4,calderursa:1.7,dreadwhale:3.4,verdryad:1.4};
const ITEMS={potion:{n:'POTION',price:100,col:'#c860d8',d:'Restores 60 HP to one creature. Can\'t revive a fainted one.'},wood:{n:'CAMPFIRE WOOD',price:250,col:'#a86838',d:'A bundle of dry wood. Light a fire pit on a route (press E) to fully heal your whole team. One use.'},tether:{n:'TETHER',price:150,col:'#e8c060',d:'A warm seed-stone that bonds with weakened wild creatures. Throw it with Q in the field.'}};
function curHp(i){if(APP.mode==='route'&&G&&G.f[0]&&G.f[0].team[i])return Math.max(0,Math.round(G.f[0].team[i].hp));const c=OW.party[i];return c.hp==null?calcStats(MON[c.id],c.lv).max:c.hp}
function htTxt(c){return((HT_BASE[c.id]||1)*(c.ht||1)).toFixed(2)+' m'}
function fmtT(s){s=Math.floor(s||0);return Math.floor(s/3600)+':'+String(Math.floor(s/60)%60).padStart(2,'0')}
function hpBar(hp,max){const k=max?hp/max:0;return`<div class="hpm"><span>HP</span><i><b class="${k>.5?'':k>.2?'mid':'low'}" style="width:${Math.max(0,Math.min(100,k*100))}%"></b></i><span>${hp}/${max}</span></div>`}
function partyHTML(){return OW.party.length?OW.party.map((c,i)=>{const m=MON[c.id],st=calcStats(m,c.lv),nxt=XPN(c.lv+1),cur=XPN(c.lv),pct=Math.min(100,(c.xp-cur)/(nxt-cur)*100),hp=curHp(i);
  return`<div class="pm" data-a="sum" data-i="${i}"><canvas class="px"></canvas><div><b>${m.n.toUpperCase()} <small>Lv${c.lv}</small></b><div class="tys">${chips(m.types)}${clsChip(m)}</div>
  ${hpBar(hp,st.max)}<div class="xpb"><span>EXP</span><i><b style="width:${pct}%"></b></i><span>${nxt-c.xp} to Lv${c.lv+1}</span></div><div class="pmbtns"><button type="button" data-a="sum" data-i="${i}">SUMMARY ▸</button>${i>0?`<button type="button" data-a="lead" data-i="${i}">MAKE LEAD</button>`:''}</div></div></div>`}).join('')+boxHTML():'<p style="margin:0">You don\'t have a partner yet.</p>'}
function boxHTML(){const B=OW.box||[];if(!B.length||APP.mode==='route')return'';return`<div class="rbox"><b>RESERVE · at Larch's field office</b>`+B.map((c,i)=>`<div class="rrow"><span>${MON[c.id].n.toUpperCase()} <small>Lv${c.lv}</small></span>${OW.party.map((p,j)=>`<button type="button" data-a="swap" data-i="${i}" data-j="${j}">⇄ ${MON[p.id].n}</button>`).join('')}</div>`).join('')+`</div>`}
function summaryHTML(i){const c=OW.party[i],m=MON[c.id],st=calcStats(m,c.lv),hp=curHp(i),nxt=XPN(c.lv+1),cur=XPN(c.lv),pct=Math.min(100,(c.xp-cur)/(nxt-cur)*100);
  const rows=[['HP','max',st.max],[m.cls==='mag'?'MAGIC':'ATTACK','dmg',st.dmg],['PHYS DEF','pdef',st.pdef],['MAGIC DEF','mdef',st.mdef],['INTELLECT','int',st.int],['SPEED','spe',st.spe]];
  return`<div class="sumv"><div class="sumtop"><button type="button" data-a="party">◂ TEAM</button><span>${i>0?`<button type="button" data-a="sum" data-i="${i-1}">▲</button>`:''}${i<OW.party.length-1?`<button type="button" data-a="sum" data-i="${i+1}">▼</button>`:''}</span></div>
  <div class="sumh"><canvas class="px"></canvas><div><b>${m.n.toUpperCase()} <small>Lv${c.lv}</small></b><div class="tys">${chips(m.types)}${clsChip(m)}</div><div class="sumr"><span>${m.role.toUpperCase()}</span><span>HEIGHT ${htTxt(c)}</span></div><p>${m.blurb}</p></div></div>
  ${hpBar(hp,st.max)}<div class="xpb"><span>EXP</span><i><b style="width:${pct}%"></b></i><span>${c.xp} · ${nxt-c.xp} to Lv${c.lv+1}</span></div>
  <div class="sumst">${rows.map(([l,k,v])=>`<span>${l}</span><i><b style="width:${Math.min(100,m.stats[k==='max'?'hp':k]/1.3)}%;background:${(STAT_COL[k==='max'?'hp':k]||['#3f86e0'])[0]}"></b></i><em>${v}</em>`).join('')}</div>
  <div class="sumam"><b>${m.ammo.unit.toUpperCase()}</b> ${m.ammo.d}</div>
  <div class="summv">${m.moves.map(mv=>`<div class="mvrow"><span class="mk">${mv.k==='E'?'R · ULT':mv.k}</span><div><div class="mvh"><b>${mv.n.toUpperCase()}</b>${chips([mv.t])}<span>POW ${mv.pow}</span><span>${mv.cd?'CD '+mv.cd+'s':mv.k==='E'?'ULT':'—'}</span></div><p>${mv.d}</p></div></div>`).join('')}</div></div>`}
function bagHTML(){const I=OW.items||{};return`<div class="bagv"><div class="bagh"><b>BAG</b><span>$${OW.money||0}</span></div>`+Object.keys(ITEMS).map(k=>{const it=ITEMS[k],n=I[k]||0;return`<div class="bagrow"><i style="background:${it.col}"></i><div><b>${it.n} <small>×${n}</small></b><p>${it.d}</p>${k==='potion'&&n>0?`<div class="pmbtns">${OW.party.map((c,j)=>`<button type="button" data-a="potion" data-i="${j}">USE ON ${MON[c.id].n.toUpperCase()} (${curHp(j)}/${calcStats(MON[c.id],c.lv).max})</button>`).join('')}</div>`:''}</div></div>`}).join('')+`</div>`}
function cardHTML(){return`<div class="cardv"><div class="cardh"><b>TRAINER CARD</b><span>FERNBROOK FIELD OFFICE</span></div><div class="cardb"><canvas class="px"></canvas><dl><dt>NAME</dt><dd>${OW.name}</dd><dt>MONEY</dt><dd>$${OW.money||0}</dd><dt>TEAM</dt><dd>${OW.party.length} / 3</dd><dt>RESERVE</dt><dd>${(OW.box||[]).length}</dd><dt>BONDED</dt><dd>${OW.flags.caught||0}</dd><dt>PLAY TIME</dt><dd>${fmtT(OW.playT)}</dd><dt>RIVAL</dt><dd>${OW.rival}</dd></dl></div><div class="cardp">${OW.party.map(()=>'<canvas class="px"></canvas>').join('')}</div></div>`}
function optHTML(){const r3=typeof R3D!=='undefined'&&R3D.ready;return`<div class="bagv"><div class="bagh"><b>OPTIONS</b></div><div class="pmbtns col"><button type="button" data-a="sound">SOUND: ${muted?'OFF':'ON'}</button>${r3?`<button type="button" data-a="r3d">3D VIEW: ${R3D.on?'ON':'OFF'}</button>`:''}<button type="button" data-a="chart">TYPE CHART</button></div></div>`}
function menuPanel(kind,i){const mp=$('mparty');mp.hidden=false;OW.menuTab=kind;
  if(kind==='party'){mp.innerHTML=partyHTML();mp.querySelectorAll('.pm>canvas').forEach((c,j)=>portrait(c,OW.party[j].id))}
  else if(kind==='sum'){mp.innerHTML=summaryHTML(i);portrait(mp.querySelector('.sumh canvas'),OW.party[i].id)}
  else if(kind==='bag')mp.innerHTML=bagHTML();
  else if(kind==='card'){mp.innerHTML=cardHTML();const cc=mp.querySelector('.cardb canvas');cc.width=20;cc.height=30;const x=cc.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(HSPR[OW.look].down[0],0,0);mp.querySelectorAll('.cardp canvas').forEach((c,j)=>portrait(c,OW.party[j].id))}
  else if(kind==='opt')mp.innerHTML=optHTML();
  else if(kind==='map'){const am=(APP.mode==='route'&&G&&G.route)?G.route.map:(OW.map&&!OW.map.interior?OW.map:OW.maps[curArea()]);mp.innerHTML=`<div class="bagv"><div class="bagh"><b>REGION MAP</b><span>${(WMAP.find(n=>n.id===curArea())||{n:''}).n}</span></div><canvas class="wmap px"></canvas>${am?`<div class="bagh"><b>AREA</b><span>${am.name}</span></div><canvas class="amap"></canvas>`:''}</div>`;
    {const wc=mp.querySelector('.wmap');drawWorldMap(wc);const near=(mx,my)=>{let best=null,bd=18;for(const n of WMAP){let px_=n.x,py_=n.y;if(n.path){let d0=1e9;for(let i=0;i<n.path.length-1;i++){const[a,b]=n.path[i],[c2,d2]=n.path[i+1];for(let k=0;k<=10;k++){const x=a+(c2-a)*k/10,y=b+(d2-b)*k/10,dd=Math.hypot(mx-x,my-y);if(dd<d0){d0=dd;px_=x;py_=y}}}}const d=Math.hypot(mx-px_,my-py_);if(d<bd){bd=d;best=n}}return best};
      wc.onmousemove=e=>{const r=wc.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width*wc.width,my=(e.clientY-r.top)/r.height*wc.height;drawWorldMap(wc,{x:mx,y:my,n:near(mx,my)})};wc.onmouseleave=()=>drawWorldMap(wc);wc.style.cursor='none'}if(am){const a=mp.querySelector('.amap'),mm=areaMapCanvas(am);a.width=mm.cv.width;a.height=mm.cv.height;const x=a.getContext('2d');x.drawImage(mm.cv,0,0);const sc=mm.cv.width/(am.w*16);const px_=APP.mode==='route'&&G&&G.route?G.f[0].x:OW.p.px,py_=APP.mode==='route'&&G&&G.route?G.f[0].y:OW.p.py;if(am===OW.map||APP.mode==='route'){x.fillStyle='#1c1c28';x.fillRect(px_*sc-3,py_*sc-4,7,7);x.fillStyle='#f8c838';x.fillRect(px_*sc-2,py_*sc-3,5,5)}}}
  mp.scrollTop=0}
function showParty(){menuPanel('party')}
function usePotion(i){const I=OW.items;if(!(I.potion>0))return;const c=OW.party[i],max=calcStats(MON[c.id],c.lv).max,hp=curHp(i);
  if(hp<=0){toast(MON[c.id].n.toUpperCase()+" has fainted. A potion won't help.");return}if(hp>=max){toast(MON[c.id].n.toUpperCase()+' is already at full HP.');return}
  const nh=Math.min(max,hp+60);I.potion--;c.hp=nh>=max?null:nh;if(APP.mode==='route'&&G&&G.f[0]&&G.f[0].team[i])G.f[0].team[i].hp=nh;sfx('reloaded');toast(MON[c.id].n.toUpperCase()+' recovered '+(nh-hp)+' HP!');saveGame()}
function openOwMenu(){OW.menuOpen=true;const el=UI.menu;el.hidden=false;const inRoute=APP.mode==='route';
  el.innerHTML=`<div class="gba mbox"><button type="button" data-a="party" class="on">TEAM</button><button type="button" data-a="bag">BAG</button><button type="button" data-a="map">MAP</button><button type="button" data-a="card">${OW.name}</button><button type="button" data-a="opt">OPTIONS</button><button type="button" data-a="unstuck">UNSTUCK</button><button type="button" data-a="save">SAVE</button><button type="button" data-a="title">QUIT TO TITLE</button><button type="button" data-a="close">${inRoute?'RESUME':'CLOSE'}</button></div><div class="gba mparty" id="mparty" hidden></div>`;
  el.onmouseover=e=>{const b=e.target.closest('.mbox button');if(b&&!b.classList.contains('on')){el.querySelectorAll('.mbox button').forEach(x=>x.classList.toggle('on',x===b))}};
  el.onclick=e=>{const b=e.target.closest('button,.pm');if(!b)return;const a=b.dataset.a;if(!a)return;sfx('blip');
    if(a==='close')closeOwMenu();else if(a==='save'){saveGame();toast('Progress saved.')}else if(a==='chart')$('chart').hidden=false;else if(a==='sound'){muted=!muted;b.textContent='SOUND: '+(muted?'OFF':'ON')}else if(a==='r3d'){R3D.toggle();b.textContent='3D VIEW: '+(R3D.on?'ON':'OFF')}else if(a==='title'){saveGame();closeOwMenu();toTitle()}else if(a==='unstuck'){closeOwMenu();unstuckPlayer()}
    else if(a==='swap'){const i=+b.dataset.i,j=+b.dataset.j,t=OW.party[j];OW.party[j]=OW.box[i];OW.box[i]=t;saveGame();toast(MON[OW.party[j].id].n.toUpperCase()+' joined your team!');menuPanel('party')}
    else if(a==='lead'){const i=+b.dataset.i;if(inRoute){toast("Swap partners with 1 2 3 while you're in the field.");return}const t=OW.party[0];OW.party[0]=OW.party[i];OW.party[i]=t;saveGame();menuPanel('party')}
    else if(a==='potion'){usePotion(+b.dataset.i);menuPanel('bag')}
    else if(a==='sum')menuPanel('sum',+b.dataset.i);
    else if(a==='party'||a==='bag'||a==='card'||a==='opt'||a==='map'){el.querySelectorAll('.mbox button').forEach(x=>x.classList.toggle('on',x===b));menuPanel(a)}};
  menuPanel('party')}
function closeOwMenu(){OW.menuOpen=false;UI.menu.hidden=true}
function menuKey(c){const bs=[...UI.menu.querySelectorAll('.mbox button')];if(!bs.length)return false;let i=bs.findIndex(b=>b.classList.contains('on'));
  if(['ArrowUp','KeyW','ArrowDown','KeyS'].includes(c)){i=(i<0?0:i+(c==='ArrowUp'||c==='KeyW'?bs.length-1:1))%bs.length;bs.forEach((b,k)=>b.classList.toggle('on',k===i));sfx('tick');return true}
  if(['Space','Enter','KeyE','KeyZ'].includes(c)){(bs[i]||bs[0]).click();return true}return false}
function unstuckPlayer(){
  if(APP.mode==='route'&&G.route){const P=G.f[0],A=G.route.arena;if(!alive(P))return;const p=unstickF(P,1,A);if(p){for(const f of G.f)if(f.ally&&alive(f)){const q=nearestOpen(p.x+18,p.y,0,A)||p;f.x=q.x;f.y=q.y}fx(P.x,P.y-8,'#ffffff',12,60,.35);toast('Moved you to open ground.')}return}
  if(APP.mode==='ow'&&OW.map&&!OW.lock){const m=OW.map,p=OW.p,ok=(x,y)=>!solidTile(m,x,y)&&!(m.warps||[]).some(w=>w.x===x&&w.y===y)&&!m.npcs.some(n=>!n.hidden&&n.x===x&&n.y===y),
      roomy=(x,y)=>ok(x,y)&&canStand(m,x*16+8,y*16+14)&&[[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>ok(x+a,y+b)).length>=2;
    for(let r=0;r<30;r++){let best=null,bd=1e9;for(let y=p.y-r;y<=p.y+r;y++)for(let x=p.x-r;x<=p.x+r;x++){if(Math.max(Math.abs(x-p.x),Math.abs(y-p.y))!==r||!roomy(x,y))continue;const d=Math.hypot(x*16+8-p.px,y*16+14-p.py);if(d<bd){bd=d;best=[x,y]}}
      if(best){placePlayer(best[0],best[1],p.dir);toast('Moved you to open ground.');return}}}
  toast("Can't do that right now.")}
function owKey(e){const c=e.code;
  if(APP.mode==='route'){if(OW.menuOpen){if(c!=='Escape'&&menuKey(c))e.preventDefault();return}if(c==='KeyQ'){if(!e.repeat)throwTether();return}if(c==='Space'){e.preventDefault();if(!e.repeat)dlgAdvance();return}if(['KeyE','Enter','KeyZ'].includes(c)){e.preventDefault();if(e.repeat)return;if(dlgAdvance())return;routeInteract()}return}
  if(NAMEB){if(c==='Enter')NAMEB($('nameInput').value);return}
  if(c==='KeyM'&&APP.mode==='ow'&&!DLG&&!OW.menuOpen){OW.showMini=OW.showMini===false;toast(OW.showMini===false?'Area map hidden (M)':'Area map shown (M)');return}
  if(CHO){if(c==='ArrowUp'||c==='KeyW'||c==='ArrowLeft'||c==='KeyA')CHO.up();else if(c==='ArrowDown'||c==='KeyS'||c==='ArrowRight'||c==='KeyD')CHO.down();else if(['Space','Enter','KeyE','KeyZ'].includes(c))CHO.ok();else if(c==='Escape'||c==='KeyX')CHO.cancel();e.preventDefault();return}
  if(OW.menuOpen&&APP.mode==='ow'&&!DLG&&c!=='Escape'){if(!e.repeat||c.startsWith('Arrow'))if(menuKey(c))e.preventDefault();return}
  if(['Space','Enter','KeyE','KeyZ'].includes(c)){e.preventDefault();if(e.repeat)return;if(dlgAdvance())return;if(APP.mode==='ow'&&!OW.lock&&!OW.menuOpen)interact();return}
  if(c==='Escape'&&APP.mode==='ow'&&!OW.lock&&!DLG){if(!$('chart').hidden){$('chart').hidden=true;return}OW.menuOpen?closeOwMenu():openOwMenu()}}
function storyInit(){uiInit();buildHumans();FREE.MAP=MAP;FREE.WORLD=WORLD;
  $('newBtn').onclick=()=>{newStory()};$('contBtn').onclick=()=>continueStory();$('freeBtn').onclick=()=>{APP.mode='select';$('title').hidden=true;$('select').hidden=false;renderSel()};$('selBack').onclick=()=>toTitle();
  UI.dlg.addEventListener('click',()=>dlgAdvance());
  addEventListener('keydown',e=>{if(APP.mode==='route'){owKey(e);return}if(APP.mode==='ow'||APP.mode==='intro'){if(!NAMEB&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){K[e.code]=true;if(e.code.startsWith('Arrow'))e.preventDefault()}owKey(e)}else if(APP.mode==='battle'&&DLG&&['Space','Enter','KeyZ'].includes(e.code))dlgAdvance()});
  addEventListener('keyup',e=>{K[e.code]=false});
  $('contBtn').hidden=!loadSave();
  addEventListener('keydown',e=>{if($('title').hidden||!/^(Arrow(Up|Down)|Key[WS])$/.test(e.code))return;const bs=[...document.querySelectorAll('#title .menu .btn')].filter(b=>!b.hidden);let i=bs.indexOf(document.activeElement);i=i<0?0:(i+(/Up|W/.test(e.code)?bs.length-1:1))%bs.length;bs[i].focus();e.preventDefault()});
  const tc=$('titleMons');tc.innerHTML='';for(const id of STARTERS){const c=document.createElement('canvas');c.className='px';portrait(c,id);tc.appendChild(c)}}

/* ================= ROUTES & MILLHAVEN ================= */
function segD(px_,py_,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px_-ax)*dx+(py_-ay)*dy)/l));return Math.hypot(px_-ax-dx*t,py_-ay-dy*t)}
function pathLine(m,pts,w,v=1){for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)for(let i=0;i<pts.length-1;i++)if(segD(x+.5,y+.5,...pts[i],...pts[i+1])<w/2+hsh(x,y,5)*.35){if(m.ground[y][x]!==2)m.ground[y][x]=v;break}}
function blob(m,cx,cy,rx,ry,v,seed=1){for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const d=((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2;if(d<1-hsh(x,y,seed)*.3&&m.ground[y][x]===0&&!m.walk[y][x])m.ground[y][x]=v}}
function free2x2(m,x,y){for(let j=0;j<2;j++)for(let i=0;i<2;i++){const X=x+i,Y=y+j;if(X<0||Y<0||X>=m.w||Y>=m.h||m.walk[Y][X]||m.ground[Y][X]===1||m.ground[Y][X]===2||m.ground[Y][X]===7)return false}return true}

function buildRoute1(){const m=mkMapData('route1',40,104,{name:'HOLLOWMILL TRAIL'});m.route=1;
  // creek with bridges
  const creekY=x=>x>=16&&x<=23?57:57+Math.round(Math.sin(x*.35)*1.4);
  for(let x=2;x<38;x++){const yc=creekY(x);for(let y=yc-1;y<=yc+1;y++){m.ground[y][x]=2;m.walk[y][x]=1}}
  pathLine(m,[[19.5,104],[19.5,94],[13,86],[12,74],[19.5,64],[19.5,54],[26,47],[27,36],[20,27],[20,12],[19.5,0]],3,1);
  for(let y=50;y<64;y++)for(let x=0;x<40;x++)if(m.ground[y][x]===1&&(m.ground[y-1]?.[x]===2||m.ground[y+1]?.[x]===2||m.walk[y][x])){}
  for(let x=2;x<38;x++){const yc=creekY(x);for(let y=yc-1;y<=yc+1;y++){if((x>=18&&x<=21)||(x>=6&&x<=7)){m.ground[y][x]=7;m.walk[y][x]=0}else{m.ground[y][x]=2}}}
  // borders
  const dry=(x,y)=>m.ground[y][x]!==2&&m.ground[y+1]?.[x]!==2&&m.ground[y][x+1]!==2&&m.ground[y+1]?.[x+1]!==2;
  for(let y=0;y<104;y+=2){otree(m,0,y);otree(m,38,y);if(hsh(1,y,3)<.5&&dry(2,y))otree(m,2,y);if(hsh(2,y,3)<.5&&dry(36,y))otree(m,36,y)}
  for(let x=4;x<36;x+=2){if(x<17||x>21){otree(m,x,0);otree(m,x,102)}}
  // regions
  blob(m,8,73,5,4,8,11);blob(m,6,81,4,3,8,12);blob(m,11,66,3,2,8,13);blob(m,9,77,7,9,3,14);
  blob(m,28,88,6,5,3,15);blob(m,31,96,4,3,3,16);
  blob(m,13,47,8,4,3,17);blob(m,30,50,7,4,3,18);blob(m,20,43,5,2.5,3,19);blob(m,10,52,4,2,3,20);
  blob(m,29,22,5,3,8,21);blob(m,32,30,4,3,8,22);blob(m,25,32,3,2,8,23);blob(m,30,26,6,6,3,24);blob(m,24,18,3,3,3,25);
  blob(m,11,33,3,2,3,26);gfill(m,14,7,16,9,4);gfill(m,23,9,25,10,4);blob(m,8,92,3,2,4,27);
  // landmarks
  sol(m,5,42,3,3);shadowDeco(m,6*16+8,45*16-2,26,4,.24);deco(m,45*16,c=>drawWindmill(c,4*16,40*16));
  for(const[x,y]of[[27,21],[31,29],[24,31],[33,19],[22,25]])if(free2x2(m,x,y)){sol(m,x,y,2,2);shadowDeco(m,x*16+16,y*16+30,14,3);deco(m,y*16+31,c=>drawAnthill(c,x*16,y*16))}
  for(const[x,y]of[[7,70],[10,72],[5,79],[8,82],[12,67],[9,75],[6,74]])if(m.ground[y][x]===8)deco(m,y*16+15,c=>drawBurrow(c,x*16,y*16),1);
  // camp
  sol(m,7,22,2,2);shadowDeco(m,8*16,24*16-2,15,3);deco(m,23*16+15,c=>drawTent(c,7*16,22*16));m.pits=[];
  sol(m,8,27,2,1);shadowDeco(m,9*16,28*16-1,15,2);deco(m,27*16+15,c=>drawLog(c,8*16,27*16));sol(m,12,24);shadowDeco(m,12*16+8,25*16-1,7,2);deco(m,24*16+15,c=>drawStump(c,12*16,24*16));gfill(m,6,21,13,28,0);
  // camp clearing: trodden earth around the fire, a spur path to the trail, and the waystone the camp is named for
  blob(m,10,25,3.6,2.8,8,41);rpit(m,10,25);pathLine(m,[[10.5,26.5],[14,26.5],[18.5,25.5]],2,1);sol(m,11,22);shadowDeco(m,11*16+8,23*16-1,6,2);deco(m,22*16+15,c=>drawWaystone(c,11*16,21*16));
  // props
  for(const[x,y]of[[15,38],[33,42],[5,60],[24,70],[33,78],[15,92],[27,12],[9,14]])if(free2x2(m,x,y)){sol(m,x,y,2,1);shadowDeco(m,x*16+16,y*16+15,15,2);deco(m,y*16+15,c=>drawLog(c,x*16,y*16))}
  for(const[x,y]of[[23,40],[11,60],[30,64],[25,84],[6,33],[31,8],[16,82]])if(!m.walk[y][x]&&m.ground[y][x]!==1){sol(m,x,y);shadowDeco(m,x*16+8,y*16+15,7,2);deco(m,y*16+15,c=>drawStump(c,x*16,y*16))}
  for(const[x,y]of[[6,28],[33,36],[14,62],[27,66],[4,90],[34,92],[24,58+4],[9,38]])if(!m.walk[y][x]&&m.ground[y][x]!==1&&m.ground[y][x]!==2)orock(m,x,y);
  for(const[x,y]of[[4,10],[31,4],[4,30],[33,60],[23,76],[4,96],[14,30],[30,40],[25,96],[34,70],[16,18]])if(free2x2(m,x,y))otree(m,x,y);
  // trailheads: fences frame the south gate, lamps announce Millhaven at the north end
  fence(m,13,16,100);fence(m,23,26,100);for(const x of[13,14,15,16,23,24,25,26])shadowDeco(m,x*16+8,100*16+15,8,2,.18);
  for(const[x,y]of[[17,3],[22,3]]){prop(m,x,y,1,1,c=>drawLamp(c,x*16,y*16));shadowDeco(m,x*16+8,y*16+15,5,2)}
  // wildflower meadows in the open grass (never in spawn ground: spawns need tall grass/dirt)
  for(const[cx,cy,rx,ry,sd]of[[8,8,3,2,51],[31,13,3,2,52],[27,44,2.5,1.6,53],[30,75,3,2,54],[12,96,2.5,1.6,55],[33,52,2,1.5,56],[7,35,2.5,1.6,57],[26,61,2.5,1.5,58]])blob(m,cx,cy,rx,ry,4,sd);
  deco(m,-1,c=>{drawFillets(c,m.ground,'earth');drawFillets(c,m.ground,'water');drawTallEdges(c,m.ground);
    for(const[x,y]of[[3,14],[35,24],[4,52],[35,66],[3,86],[34,98],[13,40],[29,86]])drawMushrooms(c,x*16+3,y*16+6);
    for(const[x,y]of[[16,55],[23,59],[9,60],[29,54],[14,30],[25,72],[6,91]])drawPebbles(c,x*16+2,y*16+4);
    for(const[x,y,k]of[[24,14,0],[12,20,3],[33,46,1],[6,63,2],[28,80,3],[22,92,1],[13,58,0],[30,34,2]])drawFlowerClump(c,x*16+2,y*16+5,k);
    for(let i=0;i<10;i++){const x=3+((i*7)%33),yc=creekY(x);drawLily(c,x*16+4+(i%3)*3,yc*16+1+(i%2)*6)}for(const x of[3,9,12,15,24,27,31,35])drawReed(c,x*16+5,(creekY(x)-1)*16+5)},1);
  // signs
  sign(m,17,98,'HOLLOWMILL TRAIL\nFernbrook to the south, Millhaven to the north.\nWild creatures ahead. Keep your partner close.');
  sign(m,15,70,"THE WARREN\nScrattle burrows in every direction.\nThey're cowards alone, but they bite when cornered.");
  sign(m,23,55-1,"THE CONTESTED FIELD\nWhere the Warren meets the Mounds.\nExpect squabbles. Possibly large ones.");
  sign(m,21,33,"ANTMOUND RISE\nPlease do not kick the mounds.\nThe mounds kick back.");
  sign(m,13,27,"WAYSTONE CAMP\nThe fire pit has gone cold.\nLight it with CAMPFIRE WOOD and your team can rest.");
  sign(m,17,6,"MILLHAVEN — straight ahead\nThe canal town. Mind the water.");
  m.zones=[{n:'warren',x0:3,y0:64,x1:15,y1:86,w:{scrattle:9,snipant:1},max:2,lv:[2,4]},{n:'meadow',x0:22,y0:82,x1:35,y1:99,w:{scrattle:6,snipant:4},max:1,lv:[2,3]},
    {n:'contested',x0:4,y0:41,x1:36,y1:54,w:{scrattle:1,snipant:1},max:2,lv:[3,4]},{n:'mounds',x0:21,y0:15,x1:37,y1:35,w:{snipant:9,scrattle:1},max:2,lv:[3,5]}];
  m.entries={south:{x:19.5*16,y:100*16},north:{x:19.5*16,y:4*16},camp:{x:10*16+8,y:27*16+4}};
  return m}

function buildMillhaven(){const m=mkMapData('millhaven',40,34,{name:'MILLHAVEN'});
  for(let y=0;y<34;y++)for(let x=0;x<40;x++)m.ground[y][x]=6;
  for(let y=17;y<=18;y++)for(let x=0;x<40;x++){m.ground[y][x]=2;m.walk[y][x]=1}
  for(let y=4;y<=16;y++)for(let x=28;x<=29;x++){m.ground[y][x]=2;m.walk[y][x]=1}
  for(const[x0,x1]of[[18,21],[6,7],[34,35]])for(let y=17;y<=18;y++)for(let x=x0;x<=x1;x++){m.ground[y][x]=7;m.walk[y][x]=0}
  for(let y=12;y<=13;y++)for(let x=28;x<=29;x++){m.ground[y][x]=7;m.walk[y][x]=0}
  m.rib=!!OW.flags.ribbon1;for(let y=0;y<34;y+=2){if(y!==12&&y!==14)otree(m,0,y);if(y!==12&&y!==14)otree(m,38,y)}gfill(m,0,13,3,14,1);
  if(!m.rib){sol(m,0,12,2,4);for(const y of[12,13,14,15])deco(m,y*16+15,(Y=>c=>{(Y%2?drawCrate:drawBarrel)(c,16,Y*16);R_(c,0,Y*16+6,16,3,'#6a4024');R_(c,0,Y*16+6,16,1,'#9a6234')})(y));
    npc(m,{id:'wguard',look:'hiker',x:3,y:12,dir:'down',talk:async()=>{await say("RANGER: The Talonreach Wilds are past this barricade. Huge, tangled, cliffs on cliffs.");await say("RANGER: Guild rules: nobody goes in without at least the First Ribbon. Earn it at the Coliseum, then come back.")}})}
  else npc(m,{id:'wguard',look:'hiker',x:3,y:11,dir:'down',talk:async()=>{await say("RANGER: The First Ribbon! The Wilds are open to you. Stick to the stairs, and don't get lost.")}});gfill(m,30,13,39,14,1);for(let x=2;x<38;x+=2)otree(m,x,0);
  for(let x=2;x<38;x++)if(x<18||x>21){sol(m,x,33);sol(m,x,32,1,1,1);deco(m,33*16+15,c=>drawStoneWall(c,x*16,32*16))}
  deco(m,32*16-1,c=>{c.fillStyle='rgba(16,34,44,.2)';for(let x=2;x<38;x++)if(x<18||x>21)c.fillRect(x*16,32*16-1,16,3)},1);
  shadowDeco(m,17*16+13,33*16+14,8,2);shadowDeco(m,21*16+19,33*16+14,8,2);deco(m,33*16+15,c=>drawArch(c,17*16+16-8,32*16-16));
  gfill(m,2,2,7,6,0);gfill(m,32,10,37,15,0);gfill(m,2,26,8,31,0);gfill(m,31,27,37,31,0);gfill(m,9,11,13,15,4);gfill(m,23,26,27,29,4);
  // buildings
  sol(m,8,3,12,7);deco(m,3*16,c=>drawShadow(c,8*16,3*16-7,192,166-48),1);deco(m,10*16,c=>drawGuild(c,8*16,3*16-1));m.walk[9][13]=0;m.walk[9][14]=0;
  sol(m,22,4,6,6);deco(m,4*16,c=>drawShadow(c,22*16,4*16,96,96),1);deco(m,10*16,c=>drawMill(c,22*16,4*16,0));
  const h1=building(m,'house',2,20,'#d84848'),h2=building(m,'house',31,20,'#8a58b0'),h3=building(m,'house',32,4,'#e07830');
  // mending-well plaza: paved ring decal around the well, lamps on its corners
  deco(m,-3,c=>{drawSlabs(c,18*16+4,19*16,4*16-8,13*16);drawSlabs(c,18*16+4,10*16+8,4*16-8,6*16+8);drawSlabs(c,11*16,10*16,11*16,2*16-6)},1);
  deco(m,-2,c=>drawPlaza(c,20*16,23*16,44,'#3f86e0',1),1);
  sol(m,19,22,2,2);shadowDeco(m,20*16,24*16-1,15,3,.26);deco(m,24*16,c=>drawWell(c,19*16,22*16));
  sol(m,25,21,2,3);shadowDeco(m,26*16+2,24*16-1,17,3,.26);deco(m,24*16,c=>drawClock(c,25*16-4,20*16));
  for(const[x,y,col]of[[10,21,'#d84838'],[14,21,'#3868c8'],[24,26,'#38a058'],[10,27,'#e8a838']]){sol(m,x,y,3,1);shadowDeco(m,x*16+24,y*16+15,23,2);deco(m,y*16+16,c=>drawStall(c,x*16,y*16-14,col))}
  for(const[x,y]of[[17,15],[22,15],[17,20],[22,20],[17,26],[22,26],[12,10],[16,10]]){prop(m,x,y,1,1,c=>drawLamp(c,x*16,y*16));shadowDeco(m,x*16+8,y*16+15,5,2)}
  for(const[x,y]of[[26,11],[27,11],[26,12],[33,16]]){prop(m,x,y,1,1,(c=>((x+y)%2?drawBarrel(c,x*16,y*16):drawCrate(c,x*16,y*16))),1);shadowDeco(m,x*16+8,y*16+15,7,2)}
  deco(m,18*16,c=>{drawBoat(c,26*16,17*16+2);drawBoat(c,9*16,17*16+4)},1);
  prop(m,4,14,2,1,c=>drawBench(c,64,224));prop(m,24,24+5,2,1,c=>drawBench(c,384,464));shadowDeco(m,80,239,14,2);shadowDeco(m,400,479,14,2);
  for(const[x,y]of[[3,8],[36,16],[2,19],[37,19],[13,31-1]])if(!m.walk[y][x]){prop(m,x,y,1,1,c=>drawBush(c,x*16,y*16));shadowDeco(m,x*16+8,y*16+15,7,2)}
  // planters: ornamental trees + beds inside the grass plots (plots keep their walkable gaps)
  for(const[x,y]of[[2,2],[6,3],[35,11],[4,29],[34,28]])if(free2x2(m,x,y))otree(m,x,y);
  deco(m,-1,c=>{drawCurbs(c,m.ground,v=>v===0||v===4,v=>v===6);
    for(const[x,y,k]of[[3,5,1],[5,6,0],[33,12,3],[36,14,2],[6,27,1],[3,27,3],[32,30,0],[36,30,1],[33,10,2]])drawFlowerClump(c,x*16+2,y*16+5,k)},1);
  sign(m,12,11,"TAMERS' GUILD HALL\nHome of the Ribbon Trials.");
  sign(m,6,25,"WAYSTATION\nFree healing for every team.\nSupplies sold inside.");
  for(const[dx,dy]of h1)warp(m,dx,dy,'waystation',dx===4?7:8,9,'up');for(const[dx,dy]of h2)warp(m,dx,dy,'mhouse1',dx===33?5:6,7,'up');for(const[dx,dy]of h3)warp(m,dx,dy,'mhouse2',dx===34?5:6,7,'up');
  warp(m,13,9,'guild',8,11,'up');warp(m,14,9,'guild',9,11,'up');
  npc(m,{id:'guard',look:'aide',x:16,y:11,dir:'down',talk:async()=>{await say("GUARD: The Guild runs the Ribbon Trials. Beat the trialmaster and you earn a ribbon for your band.\nThough I hear the trialmaster's gone missing...")}});
  npc(m,{id:'fruit',look:'mom',x:13,y:22,dir:'left',talk:async()=>{await say("Canal plums! Grown on the barges! ...Out of season, sadly. The Waystation sells potions, Tethers and campfire wood, though.")}});
  npc(m,{id:'kid',look:'girl',x:9,y:14,wander:2,talk:async()=>{await say("Sometimes Scrattles ride the barges in from the trail. My dad calls them stowaways. I call them friends.")}});
  npc(m,{id:'granny',look:'oldman',x:22,y:23,dir:'left',talk:async()=>{await say("The Mending Well never runs dry. Let your partner take a sip and it'll be good as new.")}});
  npc(m,{id:'miller',look:'oldman',x:25,y:11,dir:'down',wander:1,talk:async()=>{await say("Oldwheel's been turning for a hundred years. When the creek floods, the wheel spins so fast it sings.")}});
  npc(m,{id:'mrival',look:'rival',x:20,y:27,dir:'down',hidden:true,talk:async()=>{await say(OW.rival+": The Guild opens soon. I'm getting a ribbon first, obviously.")}});
  npc(m,{id:'maren',look:'maren',x:24,y:16,dir:'down',talk:marenTalk});
  m.onStep=async(x,y)=>{if(y>=32&&x>=18&&x<=21){await leaveToRoute();return}if(x<=0&&y>=12&&y<=15&&OW.flags.ribbon1){await startRoute('route3','east');return}if(x>=39&&y>=12&&y<=15){await startRoute('route2','south');return}if(!OW.flags.tetherTut&&OW.flags.millArrive&&y>=15&&y<=18&&x>=17&&x<=22)await marenEvent()};
  m.well={x:19,y:22};
  return m}

/* ---------- Millhaven interiors ---------- */
function buildWaystation(){const m=interiorBase('waystation','MILLHAVEN WAYSTATION',16,11,1);
  deco(m,0,c=>{drawIntWindow(c,24,2);drawIntWindow(c,212,2);drawPainting(c,120,4,16,12)});
  // healing counter (left-centre) and supply counter (right)
  sol(m,4,3,5,1);deco(m,3*16+16,c=>drawCounter(c,64,40,80));sol(m,5,1,3,2);deco(m,2*16+15,c=>{drawMachine(c,72,16);drawMachine(c,104,16)});
  sol(m,11,3,3,1);deco(m,3*16+16,c=>drawCounter(c,176,40,48));sol(m,11,1,2,2);deco(m,2*16+15,c=>drawShelf(c,176,8));sol(m,13,1,2,2);deco(m,2*16+15,c=>drawShelf(c,208,8));
  deco(m,-2,c=>{drawPlaza(c,6*16+8,6*16+8,22,'#e05050',1);c.fillStyle='rgba(224,80,80,.25)';c.fillRect(118,124,20,48)},1);
  for(const[x,y]of[[1,9],[14,9],[1,4],[14,5]]){sol(m,x,y);shadowDeco(m,x*16+8,y*16+15,6,2);deco(m,y*16+15,c=>drawPlant(c,x*16,y*16))}
  sol(m,2,7,2,1);deco(m,7*16+15,c=>drawBench(c,32,112));sol(m,11,7,2,1);deco(m,7*16+15,c=>drawBench(c,176,112));
  deco(m,-1,c=>drawMat(c,112,160,32),1);
  warp(m,7,10,'millhaven',4,25,'down');warp(m,8,10,'millhaven',5,25,'down');
  npc(m,{id:'caretaker',look:'nurse',x:6,y:2,dir:'down',reach:2,talk:waystationHeal});
  npc(m,{id:'clerk',look:'clerk',x:12,y:2,dir:'down',reach:2,talk:shopTalk});
  npc(m,{id:'wtrav',look:'hiker',x:3,y:6,dir:'right',wander:1,talk:async()=>{await say("HIKER: Heading for Saltwind Coast? Pack CAMPFIRE WOOD. The fire pits out there are cold, but a bundle lights one right up and patches your whole team.")}});
  npc(m,{id:'wkid',look:'girl',x:12,y:7,dir:'left',talk:async()=>{await say("The caretaker heals everybody for free! I come here to watch the machines go \"ding\".")}});
  return m}
async function waystationHeal(){await say("CARETAKER: Welcome to the Waystation, traveler! Shall I look after your team?");const k=await choose(['YES, PLEASE','NO THANKS']);
  if(k!==0){await say("CARETAKER: Safe travels. We're always open!");return}
  sfx('reloaded');OW.party.forEach(c=>c.hp=null);OW.lastHeal={map:'waystation',x:7,y:8};saveGame();
  await say("CARETAKER: ...ding! Your team is fully rested. Come back anytime!")}
function buildMillHouse(id,name,back,decorFn,npcs){const m=interiorBase(id,name,12,9);decorFn(m);
  deco(m,-1,c=>drawMat(c,80,128,32),1);warp(m,5,8,'millhaven',back[0],back[1],'down');warp(m,6,8,'millhaven',back[0]+1,back[1],'down');
  for(const n of npcs)npc(m,n);return m}
function buildGuild(){const m=interiorBase('guild',"TAMERS' GUILD HALL",18,13);
  deco(m,0,c=>{for(const x of[40,232])drawPainting(c,x,4,14,12);drawIntWindow(c,120,2);drawIntWindow(c,168,2)});
  for(const x of[1,3,13,15]){sol(m,x,1,2,2);deco(m,2*16+15,c=>drawShelf(c,x*16,8))}
  deco(m,-2,c=>{c.fillStyle='#a83a3a';c.fillRect(136,48,16,160);c.fillStyle='#d85a4a';c.fillRect(138,48,12,160);c.fillStyle='#f8c838';c.fillRect(138,48,1,160);c.fillRect(149,48,1,160);drawPlaza(c,9*16,6*16+8,40,'#f8c838',1)},1);
  for(const[x,y]of[[1,11],[16,11],[1,5],[16,5]]){sol(m,x,y);shadowDeco(m,x*16+8,y*16+15,6,2);deco(m,y*16+15,c=>drawPlant(c,x*16,y*16))}
  deco(m,-1,c=>drawMat(c,128,192,32),1);
  warp(m,8,12,'millhaven',13,10,'down');warp(m,9,12,'millhaven',14,10,'down');
  npc(m,{id:'steward',look:'aide',x:9,y:3,dir:'down',talk:guildSteward});
  npc(m,{id:'gtamer',look:'rival',x:4,y:8,dir:'right',hidden:true,talk:async()=>{await say(OW.rival+": They're holding the trials until the trialmaster shows up. Which means I'm stuck here. Practicing. My victory pose.")}});
  npc(m,{id:'gfan',look:'girl',x:14,y:8,dir:'left',talk:async()=>{await say("Trialmaster Corvan can stop a charging Voltusk with one look. Or so I heard. I've never actually seen him.")}});
  npc(m,{id:'corvan',look:'corvan',x:9,y:2,dir:'down',hidden:true,talk:corvanTrial});
  m.onEnter=()=>{const g=getNpc('gtamer');if(g)g.hidden=!OW.flags.millArrive||!!OW.flags.lhDone;const c=getNpc('corvan');if(c)c.hidden=!OW.flags.lhDone;const s=getNpc('steward');if(s&&OW.flags.lhDone){s.x=12;s.y=4}};
  return m}
async function guildSteward(){
  if(OW.flags.lhDone){await say("STEWARD: You brought the trialmaster home! The whole Guild is buzzing. Go on, talk to him.");return}
  if(!OW.flags.quest){OW.flags.quest=1;
    await say("STEWARD: Oh! A challenger. Welcome to the Tamers' Guild. I'm afraid the Ribbon Trials are... on hold.");
    await say("STEWARD: Trialmaster Corvan left for the old Saltwind Lighthouse three days ago. He said the lamp had been flickering purple at night, and he'd \"have a quick look\".");
    await say("STEWARD: He hasn't come back. The trail north of here, Saltwind Coast, runs all the way up to the lighthouse. But it's a big, wild stretch of shoreline.");
    await say("STEWARD: If you're headed that way anyway... would you look for him? No trialmaster, no trials. And frankly, I'm worried.");
    toast('NEW QUEST: Find Trialmaster Corvan at Saltwind Lighthouse');sfx('go');saveGame();
    await say("STEWARD: Take the east gate out of town. And stock up at the Waystation first. The coast doesn't forgive the unprepared.");return}
  await say("STEWARD: Any sign of Corvan? Saltwind Coast is out the east gate. The lighthouse sits at the far northern tip.")}

/* ---------- CHAPTER 3: Saltwind Coast & the lighthouse ---------- */
function rnpc(m,o){const n=Object.assign({dir:'down',kind:'talk'},o);m.rnpcs.push(n);if(m.walk[n.y])m.walk[n.y][n.x]=1;return n}
function ritem(m,x,y,id,n){m.items.push({x,y,id,n,k:'pk_'+m.id+'_'+x+'_'+y})}
function clearTrees(m,x0,y0,x1,y1){for(let y=y0-1;y<=y1;y++)for(let x=x0-1;x<=x1;x++){if(m.obj[y]?.[x]===1){for(let j=0;j<2;j++)for(let i=0;i<2;i++){if(m.obj[y+j]){m.obj[y+j][x+i]=0;m.walk[y+j][x+i]=0;m.shot[y+j][x+i]=0}}}}}
function rpit(m,x,y){clearTrees(m,x-2,y-2,x+2,y+2);m.pits.push({x:x*16+8,y:y*16+10,k:'pit_'+m.id+'_'+x+'_'+y});for(let j=-1;j<=1;j++)for(let i=-2;i<=2;i++){const g=m.ground[y+j]?.[x+i];if(g===0||g===3||g===4)m.ground[y+j][x+i]=8}sol(m,x,y);shadowDeco(m,x*16+8,y*16+14,8,2,.3);deco(m,y*16+15,c=>drawFirePit(c,x*16,y*16,0))}
function buildRoute2(){const W=72,H=140,m=mkMapData('route2',W,H,{name:'SALTWIND COAST'});m.route=1;m.rnpcs=[];m.items=[];m.pits=[];m.wildCap=8;
  // sea (east), beach band
  for(let y=0;y<H;y++){const sx=54+Math.round(Math.sin(y*.11)*1.6+Math.sin(y*.037)*1.2);for(let x=sx;x<W;x++){m.ground[y][x]=2;m.walk[y][x]=1}for(let x=sx-6;x<sx;x++)if(y>34)m.ground[y][x]=9}
  // islands (gated: swim)
  for(const[cx,cy,rx,ry]of[[63,36,4,3],[64,96,5,3.5],[61,66,2.6,2]])for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<1){m.ground[y][x]=((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<.45?0:9;m.walk[y][x]=0}
  // west highland: a raised plateau with a cliff rim and a stone stairway on its south face
  m.elev=Array.from({length:H},()=>new Array(W).fill(0));
  for(let y=35;y<=122;y++){const ex=21+Math.round(Math.sin(y*.15)*1.2);for(let x=0;x<=ex;x++){if(y===35||y===122||x===ex){m.ground[y][x]=10;m.walk[y][x]=1;m.shot[y][x]=1}else{m.elev[y][x]=1}}}
  for(const x of[9,10,11,12])for(const y of[121,122]){m.ground[y][x]=11;m.walk[y][x]=0;m.shot[y][x]=0;m.elev[y][x]=0}
  for(let y=123;y<=125;y++)for(let x=8;x<=13;x++)if(m.ground[y][x]===0||m.ground[y][x]===3)m.ground[y][x]=1;
  // thornwood (gated: cut) in the north-west, behind a bramble wall
  for(let y=0;y<34;y++)for(let x=0;x<34;x++){if(y===32||x===32){if(x<=32&&y<=32&&m.ground[y][x]!==10){sol(m,x,y,1,1,0);deco(m,y*16+15,(X=>(Y=>c=>drawThorn(c,X*16,Y*16)))(x)(y))}}}
  // main trail
  pathLine(m,[[28.5,140],[28.5,126],[35,114],[40,100],[45,88],[43,74],[38,62],[40,48],[45,36],[43,24],[38.5,13]],2.6,1);
  // regions
  blob(m,30,131,7,4,3,201);blob(m,37,122,6,3.5,3,202);blob(m,24,116,3.5,3,3,203);
  blob(m,27,95,6,5,8,204);blob(m,25,99,3,2,3,205);
  blob(m,39,70,7,6,8,206);blob(m,46,64,4,4,3,207);
  blob(m,31,50,6,8,3,208);blob(m,26,42,4,4,3,209);blob(m,36,40,4,3,4,210);
  blob(m,46,22,6,5,3,211);blob(m,41,30,3,3,4,212);
  blob(m,10,60,7,10,3,213);blob(m,12,90,6,8,3,214);blob(m,14,14,8,8,3,215);blob(m,8,26,5,4,4,216);
  // borders + forests (never on sand, water, cliffs, path)
  const okT=(x,y)=>free2x2(m,x,y)&&[0,3,4].includes(m.ground[y][x])&&[0,3,4].includes(m.ground[y+1]?.[x+1]);
  for(let x=0;x<W;x+=2)if(m.ground[0][x]!==2)otree(m,x,0);for(let y=2;y<H;y+=2)if(m.ground[y][0]!==10)otree(m,0,y);
  for(let x=22;x<54;x+=2)if(x<26||x>31)otree(m,x,138);
  for(let y=4;y<H-4;y+=2)for(let x=22;x<52;x+=2){const h=hsh(x,y,301);const nearPath=[...Array(5)].some((_,i)=>[...Array(5)].some((_,j)=>m.ground[y-2+j]?.[x-2+i]===1));if(nearPath||h>.24)continue;if(okT(x,y))otree(m,x,y)}
  for(let y=34;y<56;y+=2)for(let x=22;x<30;x+=2)if(hsh(x,y,302)<.45&&okT(x,y))otree(m,x,y);
  for(let y=2;y<30;y+=3)for(let x=2;x<30;x+=3)if(hsh(x,y,303)<.4&&okT(x,y))otree(m,x,y);
  for(let y=10;y<118;y+=3)for(let x=2;x<16;x+=3)if(hsh(x,y,304)<.35&&okT(x,y))otree(m,x,y);
  for(const[x,y]of[[41,72],[37,66],[44,76],[35,74],[42,64],[47,80],[33,58],[39,84]])if(!m.walk[y][x]&&m.ground[y][x]!==1)orock(m,x,y);
  for(const[x,y]of[[50,56],[51,84],[49,112],[52,124],[48,44],[50,74]])if(!m.walk[y][x]&&m.ground[y][x]===9)orock(m,x,y);
  // lighthouse on the cape
  sol(m,36,8,4,4);shadowDeco(m,38*16,12*16-2,34,4,.28);deco(m,12*16,c=>drawLighthouse(c,36*16,2*16-4));gfill(m,35,12,41,13,6);
  m.lhDoor={x:38*16,y:12*16+10};
  // fire pits, items, signs
  rpit(m,25,121);rpit(m,43,58);
  ritem(m,34,128,'potion',1);ritem(m,24,110,'tether',2);ritem(m,50,92,'wood',1);ritem(m,26,64,'potion',2);ritem(m,48,46,'tether',2);ritem(m,47,18,'potion',2);
  ritem(m,10,62,'tether',3);ritem(m,63,36,'wood',3);ritem(m,12,12,'potion',5);ritem(m,64,96,'tether',3);
  sign(m,26,134,"SALTWIND COAST\nMillhaven to the west. The old lighthouse to the far north.\nThe tide is strong. Stay on the trail.");
  sign(m,14,124,"SALTWIND HIGHLAND\nStairs lead up to the windswept plateau.\nWild creatures up top are tougher. Watch your step.");
  sign(m,51,70,"DEEP WATER\nThe current pulls hard past the shoals.\nA partner that can swim could cross.");
  sign(m,34,34,"THORNWOOD\nBrambles too thick to push through.\nSomething sharp could cut a way in.");
  sign(m,42,15,"SALTWIND LIGHTHOUSE\nDecommissioned. Keep out.\n(Someone has scratched a coiled snake into the sign.)");
  deco(m,-1,c=>{drawFillets(c,m.ground,'earth');drawFillets(c,m.ground,'water');drawTallEdges(c,m.ground);
    for(const[x,y]of[[30,104],[44,94],[27,80],[45,52],[33,30],[40,118]])drawPebbles(c,x*16+2,y*16+4);for(const[x,y,k]of[[36,106,1],[29,86,2],[42,42,0],[48,30,3],[32,124,1]])drawFlowerClump(c,x*16+2,y*16+5,k)},1);
  // trainers
  rnpc(m,{id:'nils',look:'sailor',x:47,y:104,dir:'left',kind:'trainer',name:'SAILOR NILS',team:[{id:'bulwhale',lv:9}],diff:'normal',
    intro:["SAILOR NILS: Ahoy! You've got that trail-dust look. My Bulwhale's been itching for a splash fight!"],win:"SAILOR NILS: Sunk! Ha, fair and square. The tide favors the bold, I suppose.",after:"SAILOR NILS: Past the shoals there's an island. Can't reach it without a swimmer, though."});
  rnpc(m,{id:'june',look:'girl',x:31,y:94,dir:'right',kind:'trainer',name:'PICNICKER JUNE',team:[{id:'cindercub',lv:9},{id:'snipant',lv:8}],diff:'normal',
    intro:["PICNICKER JUNE: You stepped on my picnic blanket! ...Okay, there's no blanket. But battle me anyway!"],win:"PICNICKER JUNE: Aww. Cindercub burned the sandwiches again, too.",after:"PICNICKER JUNE: The ash clearing here used to be a meadow. Cindercubs nest in it now."});
  rnpc(m,{id:'brakka',look:'hiker',x:41,y:79,dir:'down',kind:'trainer',name:'HIKER BRAKKA',team:[{id:'voltusk',lv:10}],diff:'normal',
    intro:["HIKER BRAKKA: Ho there! This bluff's a Voltusk's playground. Mine rolled here through four fences and a hay cart!"],win:"HIKER BRAKKA: Note to self: walls are not brakes.",after:"HIKER BRAKKA: Saw folks in purple heading up to the lighthouse. Didn't look like sightseers."});
  rnpc(m,{id:'grunt1',look:'coil',x:37,y:53,dir:'down',kind:'trainer',evil:1,name:'COIL GRUNT',team:[{id:'mesmamba',lv:10}],diff:'normal',
    intro:["COIL GRUNT: Hsss... Turn around, kid. This coast is closed for... maintenance.","COIL GRUNT: No? Fine. Mesmamba, give them a long, long stare."],win:"COIL GRUNT: Tch! The Admin's going to coil me up for this...",after:"COIL GRUNT: You'll never get into the lighthouse. Not while the Coil holds it."});
  rnpc(m,{id:'isolde',look:'sister',x:30,y:39,dir:'right',kind:'trainer',name:'MYSTIC ISOLDE',team:[{id:'phantern',lv:10},{id:'verdivy',lv:9}],diff:'normal',
    intro:["MYSTIC ISOLDE: The fog spoke your name. ...Mostly. It said \"someone in a hat\". Close enough. Let us battle."],win:"MYSTIC ISOLDE: The fog did not foresee that. Awkward, given that foreseeing is its whole job.",after:"MYSTIC ISOLDE: Something is wrong with the lighthouse lamp. It shines the colour of a bruise."});
  rnpc(m,{id:'grunt2',look:'coil',x:45,y:27,dir:'left',kind:'trainer',evil:1,name:'COIL GRUNT',team:[{id:'mesmamba',lv:11},{id:'scrattle',lv:10}],diff:'normal',
    intro:["COIL GRUNT: Another meddler? The Admin said nobody gets near the cape.","COIL GRUNT: Hsss! Coil up, Mesmamba!"],win:"COIL GRUNT: Ugh, fine. Go in. See if we care. The Admin will deal with you.",after:"COIL GRUNT: That old trialmaster stuck his nose in too. Look where it got him."});
  rnpc(m,{id:'lhmaren',look:'maren',x:40,y:13,dir:'down',kind:'talk',show:()=>OW.flags.quest&&!OW.flags.lhDone,talk:marenLighthouse});
  m.zones=[{n:'dunes',x0:24,y0:118,x1:44,y1:136,w:{scrattle:5,snipant:4},max:2,lv:[7,9]},
    {n:'shore',x0:44,y0:80,x1:54,y1:128,w:{phantern:5,snipant:2},max:2,lv:[8,10],g:[9,3]},
    {n:'ash',x0:20,y0:88,x1:34,y1:102,w:{snipant:4,voltusk:2,scrattle:2},max:2,lv:[8,10]},
    {n:'bluff',x0:32,y0:60,x1:48,y1:80,w:{voltusk:5,snipant:3},max:2,lv:[9,11]},
    {n:'pine',x0:24,y0:36,x1:40,y1:58,w:{scrattle:4,snipant:3,phantern:1},max:2,lv:[9,11]},
    {n:'cape',x0:38,y0:16,x1:52,y1:30,w:{phantern:6,voltusk:1},max:2,lv:[10,12]},
    {n:'highland',x0:2,y0:38,x1:18,y1:118,w:{voltusk:3,phantern:3,scrattle:2},max:2,lv:[10,12],g:[3]}];
  m.entries={south:{x:28.5*16,y:136*16},lh:{x:38*16+8,y:14*16}};
  m.exits={south:{map:'millhaven',x:37,y:13,dir:'left'}};
  return m}
function buildLighthouse(){const W=30,H=64,m=mkMapData('lighthouse',W,H,{name:'SALTWIND LIGHTHOUSE'});m.route=1;m.rnpcs=[];m.items=[];m.pits=[];m.ally=1;m.wildCap=5;m.dungeon=1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){m.ground[y][x]=10;m.walk[y][x]=1;m.shot[y][x]=1}
  const room=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){m.ground[y][x]=6;m.walk[y][x]=0;m.shot[y][x]=0}};
  room(9,54,20,62);room(13,62,16,63);room(13,48,16,54);room(3,38,26,48);room(3,30,7,38);room(3,22,26,30);room(22,14,26,22);room(5,9,26,15);room(13,5,16,9);room(7,1,22,5);
  for(const[x,y]of[[9,54],[20,54],[3,38],[26,38],[3,22],[26,22],[5,9],[26,9],[7,1],[22,1]]){}
  const braz=(x,y)=>{sol(m,x,y);deco(m,y*16+15,c=>{R_(c,x*16+4,y*16+6,8,10,'#2a2238');R_(c,x*16+5,y*16+7,6,8,'#4a3a5a');R_(c,x*16+3,y*16+4,10,3,'#1c1c28');R_(c,x*16+5,y*16-2,6,6,'#a040e0');R_(c,x*16+6,y*16-4,4,5,'#d888ff');R_(c,x*16+7,y*16-3,2,3,'#ffffff')})};
  for(const[x,y]of[[10,55],[19,55],[4,39],[25,39],[4,23],[25,23],[6,10],[25,10],[8,2],[21,2]])braz(x,y);
  for(const[x,y]of[[10,60],[19,60],[5,46],[24,46],[11,44],[18,44],[5,28],[24,28],[10,24],[19,26]]){prop(m,x,y,1,1,c=>((x+y)%2?drawBarrel(c,x*16,y*16):drawCrate(c,x*16,y*16)),1)}
  ritem(m,24,44,'potion',2);ritem(m,4,24,'tether',2);ritem(m,24,12,'potion',2);
  rnpc(m,{id:'grunt3',look:'coil',x:7,y:42,dir:'right',kind:'trainer',evil:1,name:'COIL GRUNT',team:[{id:'mesmamba',lv:11}],diff:'normal',
    intro:["COIL GRUNT: An intruder! And... is that a lynx? Where did THAT come from?","COIL GRUNT: Doesn't matter. Hsss! Get them!"],win:"COIL GRUNT: That lynx bit my hat!",after:"COIL GRUNT: The lamp's almost charged. You're too late."});
  rnpc(m,{id:'grunt4',look:'coil',x:22,y:26,dir:'left',kind:'trainer',evil:1,name:'COIL GRUNT',team:[{id:'mesmamba',lv:11},{id:'voltusk',lv:11}],diff:'normal',
    intro:["COIL GRUNT: The Admin's upstairs channelling the lamp. Nobody goes up. NOBODY."],win:"COIL GRUNT: ...Okay, somebody goes up.",after:"COIL GRUNT: Admin Vesk will flatten you. Just watch."});
  rnpc(m,{id:'grunt5',look:'coil',x:14,y:12,dir:'down',kind:'trainer',evil:1,name:'COIL GRUNT',team:[{id:'phantern',lv:11},{id:'mesmamba',lv:12}],diff:'normal',
    intro:["COIL GRUNT: Last line of defence! Hsss! The Coil endures!"],win:"COIL GRUNT: The Coil... endures... somewhere else.",after:"COIL GRUNT: Go on then. Vesk is waiting."});
  rnpc(m,{id:'vesk',look:'coilboss',x:15,y:3,dir:'down',kind:'trainer',evil:1,boss:1,name:'ADMIN VESK',team:[{id:'mesmamba',lv:12},{id:'phantern',lv:12},{id:'voltusk',lv:11}],diff:'normal',
    intro:["ADMIN VESK: So. The little tamer with the humming band. And a lynx I'd recognise anywhere.","ADMIN VESK: Tell Maren the Coil remembers her. Tell her yourself, actually, if you can still talk afterwards.","ADMIN VESK: This lamp will shine purple over every coast in the region, and every wild creature will hear the Coil's call. Hsss... Begin!"],
    win:"ADMIN VESK: Impossible. Hsss...",after:"",onWin:veskWon});
  rnpc(m,{id:'corvan',look:'corvan',x:19,y:3,dir:'left',kind:'talk',show:()=>!OW.flags.lhDone,talk:async()=>{await say("CORVAN: Mmph! (The trialmaster is bound in purple vines. He nods urgently toward the Admin.)")}});
  m.zones=[{n:'hall',x0:9,y0:54,x1:20,y1:62,w:{phantern:4,scrattle:3},max:2,lv:[9,11],g:[6]},{n:'store',x0:3,y0:38,x1:26,y1:48,w:{phantern:4,scrattle:2,voltusk:1},max:2,lv:[10,11],g:[6]},
    {n:'gallery',x0:3,y0:22,x1:26,y1:30,w:{phantern:5,voltusk:2},max:2,lv:[10,12],g:[6]},{n:'lamp',x0:5,y0:9,x1:26,y1:15,w:{phantern:3},max:1,lv:[11,12],g:[6]}];
  m.entries={south:{x:15*16,y:61*16}};m.exits={south:{route:'route2',entry:'lh'}};
  return m}
async function marenLighthouse(){const R=G.route;G.paused=true;
  if(!OW.flags.lhMaren){OW.flags.lhMaren=1;
    await say("MAREN: There you are. I wondered when the Guild would send someone. I didn't think it'd be you.");
    await say("MAREN: Feel that? ...No, of course you don't. Umbrynx does. Its fur's been standing up since dawn.");
    await say("MAREN: There's something rotten inside that tower. An evil presence. Old, and patient, and very much awake.");
    await say("MAREN: Your trialmaster went in. He didn't come out. And the lamp started glowing purple.");}
  await say("MAREN: Here. Let me look after your team first.");sfx('reloaded');R.map&&0;G.f[0].team.forEach(u=>{u.hp=u.max});OW.party.forEach(c=>c.hp=null);
  await say("Maren touches each of your partners' foreheads. A cool, quiet feeling washes over them. Your team is fully restored!");
  await say("MAREN: I can't go in. Not yet. Some people in there know my face, and that would make things... complicated.");
  await say("MAREN: But Umbrynx will go with you. It'll fight at your side. Don't let it get too reckless. It likes to show off.");
  const k=await choose(['ENTER THE LIGHTHOUSE','NOT YET']);
  if(k!==0){await say("MAREN: Take your time. The tower isn't going anywhere. Unfortunately.");G.paused=false;return}
  await say("MAREN: Go. And "+OW.name+"... whatever you find at the top, don't listen to it.");G.paused=false;
  syncPartyFromBattle();await startRoute('lighthouse','south')}
async function lighthouseWon(){await say("The violet glow fades from the sky. Footsteps crunch over the rubble behind you.");
  await say("CORVAN: Hah! You actually brought that monster down. Three days in those vines, and THAT is what they were feeding with the lamp.");
  await say("CORVAN: You must be the challenger the steward keeps writing to me about. Trialmaster Corvan, at your service. Or rather, in your debt.");
  await say("CORVAN: That lynx... I know that lynx. If its tamer is who I think she is, she and I will be having words.");
  await say("CORVAN: The Coil was using the lamp to call wild creatures to their side. Without you, every coast from here to Fernbrook would have heard it.");
  await say("CORVAN: Come. Let's get back to Millhaven. A trial is long overdue, and you've more than earned a shot at the First Ribbon.");
  OW.flags.lhDone=1;OW.money=(OW.money||0)+1000;toast('Received $1000 from Trialmaster Corvan!');syncPartyFromBattle();saveGame();
  await fadeTo(1,.6);APP.mode='ow';$('hud').hidden=true;setView(480,270);OW.party.forEach(c=>c.hp=null);setMap('guild',9,8,'up');await fadeTo(0,.6);
  await say("CORVAN: Rest up, "+OW.name+". When you're ready, the First Ribbon Trial will be waiting right here.");
  toast('CHAPTER 3 COMPLETE · to be continued');saveGame()}

/* ---------- Route 3: Talonreach Wilds (giant tiered wilderness west of Millhaven) ---------- */
function buildRoute3(){const W=128,H=128,m=mkMapData('route3',W,H,{name:'TALONREACH WILDS'});m.route=1;m.rnpcs=[];m.items=[];m.pits=[];m.wildCap=10;
  const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H,N4=[[1,0],[-1,0],[0,1],[0,-1]],N8=[...N4,[1,1],[-1,1],[1,-1],[-1,-1]];
  const GATE={e:[W-1,64],n:[64,0],w:[0,64]},ENT=[W-3,64];
  // ---- 1) terrain tiers: layered noise, a few broad fields, carved canyons, valley-floor borders ----
  const E=Array.from({length:H},()=>new Array(W).fill(0));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const h=vnz(x*16,y*16,701,24*16)*.5+vnz(x*16,y*16,702,10*16)*.25+vnz(x*16,y*16,703,48*16)*.45;E[y][x]=h<.44?0:h<.6?1:h<.74?2:3}
  for(const[cx,cy,rx,ry,L]of[[96,64,16,11,0],[40,40,15,10,1],[34,96,13,10,0],[86,24,11,8,2],[88,104,12,8,1],[60,66,8,6,2],[20,20,9,7,3]])
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<1-hsh(x,y,704)*.15)E[y][x]=L;
  const canyons=[[[127,64],[110,60],[96,64],[78,58],[64,66],[50,62],[30,64],[0,64]],[[64,0],[66,14],[58,28],[64,44],[64,66]],[[78,58],[84,80],[96,92],[88,104]],
    [[50,62],[44,80],[34,96]],[[30,64],[22,48],[32,30],[40,40]],[[96,64],[104,40],[86,24]],[[64,44],[48,30],[40,40]],[[34,96],[50,112],[70,118],[88,104]],[[114,64],[112,82],[116,98],[104,114],[90,120]]];
  for(const pl of canyons)for(let y=0;y<H;y++)for(let x=0;x<W;x++)for(let k=0;k<pl.length-1;k++){if(segD(x+.5,y+.5,...pl[k],...pl[k+1])<1.7+hsh(x>>2,y>>2,705)*1.5){E[y][x]=0;break}}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(x<5||y<5||x>W-6||y>H-6)E[y][x]=0;for(const[gx,gy]of Object.values(GATE))if(Math.abs(x-gx)+Math.abs(y-gy)<11)E[y][x]=0}
  const tidy=()=>{// one tier per step, no slivers: shelves under 70 tiles melt into their surroundings
    for(let ch=1,it=0;ch&&it<20;it++){ch=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){let mn=9;for(const[dx,dy]of N4){const X=x+dx,Y=y+dy;if(inb(X,Y))mn=Math.min(mn,E[Y][X])}if(E[y][x]>mn+1){E[y][x]=mn+1;ch=1}}}
    for(let pass=0;pass<3;pass++){const seen=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(seen[y*W+x])continue;const L=E[y][x],q=[[x,y]],reg=[];seen[y*W+x]=1;
      while(q.length){const[a,b]=q.pop();reg.push([a,b]);for(const[dx,dy]of N4){const X=a+dx,Y=b+dy;if(inb(X,Y)&&!seen[Y*W+X]&&E[Y][X]===L){seen[Y*W+X]=1;q.push([X,Y])}}}
      if(reg.length<70){let lo=null;for(const[a,b]of reg){for(const[dx,dy]of N4){const X=a+dx,Y=b+dy;if(inb(X,Y)&&E[Y][X]!==L){lo=E[Y][X];break}}if(lo!=null)break}if(lo!=null)for(const[a,b]of reg)E[b][a]=lo}}}
    // shelves thinner than 3 tiles can't hold a walkable top inside their rims
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const L=E[y][x];if(!L)continue;const v=(E[y-1][x]>=L)+(E[y+1][x]>=L),hz=(E[y][x-1]>=L)+(E[y][x+1]>=L);if(v<2&&hz<2)E[y][x]=L-1}};
  tidy();
  const LAKES=[[100,70,6,4],[30,100,5,3.5],[70,120,7,3],[16,24,5,4]];
  // ---- 2) build the playable layer from the tiers; repeat until every shelf is reachable ----
  let C,main;
  const comp=()=>{const R=new Int32Array(W*H).fill(-1);let n=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(m.walk[y][x]||R[y*W+x]>=0)continue;const q=[[x,y]];R[y*W+x]=n;
      while(q.length){const[a,b]=q.pop();for(const[dx,dy]of N4){const X=a+dx,Y=b+dy;if(inb(X,Y)&&!m.walk[Y][X]&&R[Y*W+X]<0){R[Y*W+X]=n;q.push([X,Y])}}}n++}return R};
  const stair=(x,y,north)=>{for(let i=-1;i<=1;i++)for(const yy of(north?[y,y+1]:[y,y-1])){m.ground[yy][x+i]=11;m.walk[yy][x+i]=0;m.shot[yy][x+i]=0;m.obj[yy][x+i]=0}};
  // a stair column: rim tile with a walkable tile one tier lower on one side and two walkable tiles on its own tier on the other
  const okS=(x,y)=>{if(!inb(x,y-2)||!inb(x,y+1))return false;const L=E[y][x];return m.ground[y][x]===10&&L>0&&!m.walk[y+1][x]&&E[y+1][x]===L-1&&E[y-1][x]===L&&!m.obj[y-1][x]&&!m.walk[y-2][x]&&E[y-2][x]===L};
  const okN=(x,y)=>{if(!inb(x,y-1)||!inb(x,y+2))return false;const L=E[y][x];return m.ground[y][x]===10&&L>0&&!m.walk[y-1][x]&&E[y-1][x]===L-1&&E[y+1][x]===L&&!m.obj[y+1][x]&&!m.walk[y+2][x]&&E[y+2][x]===L};
  const stairSites=()=>{const out=[];for(let y=6;y<H-6;y++)for(let x=6;x<W-6;x++){if(okS(x-1,y)&&okS(x,y)&&okS(x+1,y))out.push({x,y,n:0,a:[x,y+1],b:[x,y-2]});if(okN(x-1,y)&&okN(x,y)&&okN(x+1,y))out.push({x,y,n:1,a:[x,y-1],b:[x,y+2]})}return out};
  for(let pass=0;pass<8;pass++){
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){m.ground[y][x]=0;m.walk[y][x]=0;m.shot[y][x]=0;m.obj[y][x]=0}
    for(const[cx,cy,rx,ry]of LAKES)for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(E[y][x]===0&&((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<1-hsh(x,y,706)*.25){m.ground[y][x]=2;m.walk[y][x]=1}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const L=E[y][x];if(!L)continue;if(N8.some(([dx,dy])=>inb(x+dx,y+dy)&&E[y+dy][x+dx]<L)){m.ground[y][x]=10;m.walk[y][x]=1;m.shot[y][x]=1}}
    // border forest with open gates
    const gate=(x,y)=>Math.abs(y-64)<=2&&(x<5||x>W-6)||Math.abs(x-64)<=2&&y<5;
    for(let x=0;x<W;x+=2)for(const y of[0,2,H-2,H-4])if(!gate(x,y)&&!gate(x+1,y)&&!gate(x,y+1))otree(m,x,y);
    for(let y=4;y<H-4;y+=2)for(const x of[0,2,W-2,W-4])if(!gate(x,y)&&!gate(x,y+1)&&!gate(x+1,y))otree(m,x,y);
    // groves: clustered, only on open ground well away from rims and water
    const open=(x,y,r)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const g=m.ground[y+j]?.[x+i];if(g===undefined||g===10||g===2)return false}return true};
    for(let y=6;y<H-6;y+=2)for(let x=6;x<W-6;x+=2){if(vnz(x*16,y*16,709,9*16)>.6&&hsh(x,y,710)<.75&&open(x,y,2)&&free2x2(m,x,y)&&E[y][x]===E[y+1][x+1])otree(m,x,y)}
    // boulders: a few, scattered along cliff feet where they read as rockfall
    for(let k=0;k<70;k++){const x=6+Math.floor(hsh(k,1,711)*(W-12)),y=6+Math.floor(hsh(k,2,711)*(H-12));if(m.walk[y][x]||m.ground[y][x]!==0)continue;
      if(N4.some(([dx,dy])=>m.ground[y+dy]?.[x+dx]===10)&&open(x,y,0)&&!N8.some(([dx,dy])=>m.obj[y+dy]?.[x+dx]===2))orock(m,x,y)}
    // link every shelf to the entrance region, biggest first
    for(let it=0;it<140;it++){C=comp();main=C[ENT[1]*W+ENT[0]];const size={};for(let i=0;i<C.length;i++)if(C[i]>=0)size[C[i]]=(size[C[i]]||0)+1;
      let best=null;for(const s of stairSites()){const a=C[s.a[1]*W+s.a[0]],b=C[s.b[1]*W+s.b[0]];if(a<0||b<0||a===b||(a!==main&&b!==main))continue;const sc=size[a===main?b:a]+hsh(s.x,s.y,712)*20;if(!best||sc>best.sc)best=Object.assign(s,{sc})}
      if(!best)break;stair(best.x,best.y,best.n)}
    C=comp();main=C[ENT[1]*W+ENT[0]];
    // shelves still cut off: drop them one tier so they merge with a neighbour, then rebuild
    // big shelves with no natural stair spot: reshape a short straight stretch of their edge so a staircase fits
    if(pass===7)break;const sz={};for(let i=0;i<C.length;i++)if(C[i]>=0)sz[C[i]]=(sz[C[i]]||0)+1;const done=new Set();let fixed=0;
    for(let y=8;y<H-8;y++)for(let x=8;x<W-8;x++){const c=C[y*W+x];if(c<0||c===main||sz[c]<40||done.has(c))continue;const L=E[y][x];if(!L)continue;
      for(const dir of[1,-1]){const ry=y+dir,ly=y+2*dir;if(m.ground[ry]?.[x]!==10||E[ry][x]!==L||C[ly*W+x]!==main||E[ly][x]!==L-1)continue;
        for(let i=-2;i<=2;i++){E[y][x+i]=L;E[y-dir][x+i]=L;E[ly][x+i]=L-1;E[ly+dir][x+i]=Math.min(E[ly+dir][x+i],L-1)+0}for(let i=-1;i<=1;i++)E[ry][x+i]=L;
        done.add(c);fixed++;break}}
    if(!fixed)break}
  // big shelves get a second way up, placed far from the first, so climbing makes loops instead of dead ends
  {const used=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(m.ground[y][x]===11)used.push([x,y]);let added=0;
    for(const s of stairSites()){if(added>=10)break;const L=E[s.y][s.x];if(L<1)continue;if(used.some(([ux,uy])=>Math.hypot(ux-s.x,uy-s.y)<26))continue;if(hsh(s.x,s.y,713)<.35)continue;
      const a=C[s.a[1]*W+s.a[0]],b=C[s.b[1]*W+s.b[0]];if(a!==main||b!==main)continue;stair(s.x,s.y,s.n);used.push([s.x,s.y]);added++}}
  C=comp();main=C[ENT[1]*W+ENT[0]];
  // anything still unreachable becomes dense forest: no grass, no spawns, no loot
  for(let y=6;y<H-6;y++)for(let x=6;x<W-6;x++){if(C[y*W+x]<0||C[y*W+x]===main)continue;if(free2x2(m,x,y)&&E[y][x]===E[y+1]?.[x+1]&&C[(y+1)*W+x+1]===C[y*W+x])otree(m,x,y)}
  C=comp();main=C[ENT[1]*W+ENT[0]];
  // ---- 3) ground dressing: grass meadows per tier, flowers, rocky summits ----
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(m.ground[y][x]!==0||m.walk[y][x])continue;const L=E[y][x],n=vnz(x*16,y*16,707,7*16),f=vnz(x*16,y*16,708,4*16);
    if(C[y*W+x]!==main)continue;if(L===3&&n>.42)m.ground[y][x]=8;else if(n>.6)m.ground[y][x]=3;else if(f>.82)m.ground[y][x]=4;else if(L>=2&&n<.2)m.ground[y][x]=8}
  // ---- 4) the trail: east gate to the north and west gates (plus side paths to the rest stops) ----
  const bfs=(sx,sy,tx,ty)=>{const P=new Int32Array(W*H).fill(-2);P[sy*W+sx]=-1;const q=[[sx,sy]];let h=0;while(h<q.length){const[a,b]=q[h++];if(a===tx&&b===ty)break;
      for(const[dx,dy]of N4){const X=a+dx,Y=b+dy;if(inb(X,Y)&&!m.walk[Y][X]&&P[Y*W+X]===-2){P[Y*W+X]=b*W+a;q.push([X,Y])}}}const out=[];let c=ty*W+tx;if(P[c]===-2)return out;while(c>=0){out.push([c%W,Math.floor(c/W)]);c=P[c]}return out};
  const pave=pts=>{for(const[a,b]of pts)for(const[dx,dy]of[[0,0],[1,0],[0,1]]){const X=a+dx,Y=b+dy;if(inb(X,Y)&&[0,3,4,8].includes(m.ground[Y][X])&&!m.walk[Y][X])m.ground[Y][X]=1}};
  for(const[tx,ty]of[[64,1],[1,64]])pave(bfs(ENT[0],ENT[1],tx,ty));
  // ---- 5) shelves: measure each reachable shelf (tier region) for loot, rest stops and trainers ----
  const shelf=new Int32Array(W*H).fill(-1),shelves=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(m.walk[y][x]||C[y*W+x]!==main||shelf[y*W+x]>=0||m.ground[y][x]===11)continue;const L=E[y][x],id=shelves.length,q=[[x,y]],t=[];shelf[y*W+x]=id;
    while(q.length){const[a,b]=q.pop();t.push([a,b]);for(const[dx,dy]of N4){const X=a+dx,Y=b+dy;if(inb(X,Y)&&!m.walk[Y][X]&&shelf[Y*W+X]<0&&E[Y][X]===L&&m.ground[Y][X]!==11){shelf[Y*W+X]=id;q.push([X,Y])}}}
    shelves.push({id,L,t})}
  const farFrom=(sh,from)=>{let b=null,bd=-1;for(const[x,y]of sh.t){if(m.ground[y][x]===1||m.obj[y][x])continue;let d=1e9;for(const[fx,fy]of from)d=Math.min(d,Math.hypot(fx-x,fy-y));if(d>bd){bd=d;b=[x,y]}}return b};
  const stairs=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(m.ground[y][x]===11&&m.ground[y-1]?.[x]!==11)stairs.push([x,y]);
  const LOOT=[[],[['tether',2],['wood',1],['potion',1]],[['potion',2],['tether',3]],[['tether',5],['potion',3],['wood',3]]];let li=0;
  for(const sh of shelves.filter(s=>s.L>0&&s.t.length>=110).sort((a,b)=>b.L-a.L||b.t.length-a.t.length)){const p=farFrom(sh,stairs);if(!p)continue;const opts=LOOT[sh.L],[id,n]=opts[li++%opts.length];ritem(m,p[0],p[1],id,n)}
  // valley-floor finds too, away from the trail
  {const trail=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(m.ground[y][x]===1)trail.push([x,y]);const floor=shelves.filter(s=>s.L===0&&s.t.length>200);
    for(const sh of floor.slice(0,4)){const p=farFrom(sh,trail.concat(stairs));if(p)ritem(m,p[0],p[1],['potion','tether','wood','potion'][floor.indexOf(sh)],2)}}
  // rest stops: a campfire on the two biggest plateaus, linked to the trail by a footpath
  for(const sh of shelves.filter(s=>s.L>0).sort((a,b)=>b.t.length-a.t.length).slice(0,2)){let cx=0,cy=0;for(const[x,y]of sh.t){cx+=x;cy+=y}cx/=sh.t.length;cy/=sh.t.length;
    let b=null,bd=1e9;for(const[x,y]of sh.t){const d=Math.hypot(x-cx,y-cy);if(d<bd&&!m.obj[y][x]&&m.ground[y-2]?.[x]!==10&&m.ground[y+2]?.[x]!==10&&m.ground[y][x-3]!==10&&m.ground[y][x+3]!==10){bd=d;b=[x,y]}}if(b)rpit(m,b[0],b[1])}
  // ---- 6) wild creatures: tall grass on each tier, tougher the higher you climb ----
  const POOLS=[{scrattle:3,snipant:3,voltusk:2,dunemaw:2},{snipant:3,phantern:3,scrattle:2,dunemaw:3,ampoule:1},{voltusk:3,mesmamba:3,phantern:2,ampoule:3},{mesmamba:4,voltusk:3,phantern:3,prismoth:2}];
  m.zones=[0,1,2,3].map(L=>{const tiles=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(m.ground[y][x]===3&&E[y][x]===L&&C[y*W+x]===main)tiles.push([x,y]);
    return{n:'r3_tier'+L,x0:0,y0:0,x1:W-1,y1:H-1,w:POOLS[L],max:L===0?3:2,lv:[13+L,14+L],g:[3],tiles}}).filter(z=>z.tiles.length);
  // ---- 7) trainers: some on the trail, some guarding the stairs up to the high shelves ----
  const trail=[];for(let y=6;y<H-6;y++)for(let x=6;x<W-6;x++)if(m.ground[y][x]===1&&C[y*W+x]===main)trail.push([x,y]);
  const freeAt=(x,y)=>inb(x,y)&&!m.walk[y][x]&&m.ground[y][x]!==11&&!m.rnpcs.some(n=>Math.abs(n.x-x)+Math.abs(n.y-y)<12);
  const TR=[['ranger','hiker','RANGER OSWIN',[{id:'voltusk',lv:15},{id:'snipant',lv:14}],"RANGER OSWIN: These wilds swallow the careless. Show me you can handle yourself!","RANGER OSWIN: Solid. You'll do fine out here.","RANGER OSWIN: The higher the shelf, the stronger the creatures. And the better the loot."],
    ['ace','rival','ACE TAMER DAX',[{id:'umbrynx',lv:15},{id:'phantern',lv:15}],"ACE TAMER DAX: A ribbon, huh? Mine's coming. Right after I beat you.","ACE TAMER DAX: ...Okay, maybe not right after.","ACE TAMER DAX: Somebody stashed supplies on the summits. Haven't found them all yet."],
    ['bird','sailor','BIRDKEEPER LIO',[{id:'phantern',lv:14},{id:'phantern',lv:15}],"BIRDKEEPER LIO: My terns ride the updrafts off these cliffs. Try and keep up!","BIRDKEEPER LIO: Grounded! Ha, well flown anyway.","BIRDKEEPER LIO: The west road is closed past the gate. Someday, though."],
    ['mystic','maren','MYSTIC ELSPETH',[{id:'mesmamba',lv:16}],"MYSTIC ELSPETH: You climbed all this way to lose. The stairs whispered it.","MYSTIC ELSPETH: The stairs were wrong. It happens.","MYSTIC ELSPETH: Mesmamba nest in the grass up top. Mind its eyes."],
    ['camper','girl','CAMPER PIA',[{id:'scrattle',lv:14},{id:'cindercub',lv:14},{id:'snipant',lv:14}],"CAMPER PIA: You're not getting past my campsite without a battle!","CAMPER PIA: Fine, fine. Marshmallow?","CAMPER PIA: Campfires up here are free to use if you've got wood."],
    ['hiker','hiker','HIKER GRUM',[{id:'voltusk',lv:16},{id:'fistinel',lv:15}],"HIKER GRUM: Three tiers up and my legs are fine! Battle!","HIKER GRUM: My legs are fine. My pride, less so.","HIKER GRUM: The north gate's just a gate for now. Nothing past it but fog."]];
  const spots=[];for(const[x,y]of[[100,58],[70,62],[40,44],[64,28]]){let b=null,bd=24;for(const[a,c]of trail){const d=Math.hypot(a-x,c-y);if(d<bd&&freeAt(a+1,c)){bd=d;b=[a+1,c]}}if(b)spots.push([...b,'down'])}
  for(const[x,y]of stairs.filter(([x,y])=>E[y-2]?.[x]>=2||E[y+3]?.[x]>=2).sort((a,b)=>hsh(a[0],a[1],716)-hsh(b[0],b[1],716))){if(spots.length>=6)break;
    const up=E[y-2]?.[x]>E[y+2]?.[x];const tx=x+2,ty=up?y-2:y+2;if(freeAt(tx,ty))spots.push([tx,ty,up?'down':'up'])}
  spots.slice(0,6).forEach(([x,y,dir],k)=>{const[id,look,name,team,intro,win,after]=TR[k];rnpc(m,{id:'r3'+id,look,x,y,dir,kind:'trainer',name,team,diff:'normal',intro:[intro],win,after})});
  // ---- 8) signs, entries, exits ----
  sign(m,W-7,61,"TALONREACH WILDS\nMillhaven to the east.\nThe land climbs in shelves. Stairs lead up. The best finds wait on the summits.");
  sign(m,62,6,"NORTH GATE\nThe road beyond is closed for now.");sign(m,6,61,"WEST GATE\nThe road beyond is closed for now.");
  m.elev=E;m.entries={east:{x:(W-3)*16,y:64*16+8},north:{x:64*16+8,y:5*16},west:{x:5*16,y:64*16+8}};
  m.exits={east:{map:'millhaven',x:1,y:13,dir:'right'},north:{closed:"The path north is blocked by fog and fallen timber. It isn't open yet."},west:{closed:"A rope barrier spans the road west: CLOSED UNTIL FURTHER NOTICE."}};
  return m}
/* ---------- the Ribbon Coliseum: first gym trial (also a free-battle stage) ---------- */
function buildColiseum(id='coliseum'){const W=40,H=24,m=mkMapData(id,W,H,{name:'RIBBON COLISEUM'});
  gfill(m,0,0,W-1,H-1,6);
  sol(m,0,0,W,6);sol(m,0,6,3,15);sol(m,37,6,3,15);sol(m,0,21,18,3);sol(m,22,21,18,3);
  deco(m,-1,c=>{drawCourt(c,3*16,6*16,34*16,15*16);drawSideStands(c,0,6*16,48,15*16);drawSideStands(c,37*16,6*16,48,15*16);drawSideStands(c,0,22*16,18*16,32);drawSideStands(c,22*16,22*16,18*16,32);
    R_(c,18*16,21*16,64,48,'#2a2236');for(let y=21*16;y<24*16;y+=8)R_(c,18*16+4,y,56,4,'#3a3048');R_(c,18*16,21*16,64,3,GOLD.m)},1);
  deco(m,6*16,c=>drawGrandstand(c,0,0,W*16));
  deco(m,21*16+14,c=>{drawRailing(c,3*16,21*16,15*16);drawRailing(c,22*16,21*16,15*16)});
  for(const[x,y]of[[3,6],[36,6],[3,20],[36,20]]){sol(m,x,y);deco(m,y*16+16,(fr=>c=>drawPillar(c,x*16,y*16+16-56,fr))(0))}
  for(const x of[18,19,20,21])warp(m,x,23,'guild',9,10,'up');
  npc(m,{id:'ccorvan',look:'corvan',x:32,y:13,dir:'left',talk:corvanTalkC});
  npc(m,{id:'cref',look:'aide',x:19,y:7,dir:'down',talk:async()=>{await say(OW.flags.ribbon1?"REFEREE: That was the loudest the crowd has been in years. You've got fans now.":"REFEREE: Three creatures each. No items once the bell rings. The Trialmaster never holds back.")}});
  m.entries={free:1};return m}
async function corvanTrial(){
  if(OW.flags.ribbon1){await say("CORVAN: The First Ribbon suits you, "+OW.name+". The Coliseum's always open if you want to spar.");return}
  await say("CORVAN: The First Ribbon Trial is held in the Coliseum behind this hall. Three creatures each, no items, no second chances.");
  await say("CORVAN: Ready, "+OW.name+"?");const k=await choose(['BEGIN THE TRIAL','NOT YET']);
  if(k!==0){await say("CORVAN: Take your time. The crowd can wait. Well. They'll complain, but they can wait.");return}
  await fadeTo(1,.6);setMap('coliseum',7,13,'right');await fadeTo(0,.6);await ribbonTrial()}
async function corvanTalkC(){if(OW.flags.ribbon1){await say("CORVAN: Still here? Ha! Go on, the next Ribbon is waiting somewhere out there.");return}await ribbonTrial()}
async function ribbonTrial(){const c=getNpc('ccorvan');sfx('ult');
  await say("The crowd roars as you step onto the marble!");
  await say("CORVAN: Welcome to the Ribbon Coliseum! Every Trialmaster tests something different. Mine is simple: GRIT.");
  await say("CORVAN: You faced down Hexwyrm on a crumbling cliff. Let's see if you can keep your footing when nobody's falling apart but you!");
  const res=await trainerBattle({enemy:[{id:'voltusk',lv:13},{id:'snipant',lv:13},{id:'fistinel',lv:14}],name:'TRIALMASTER CORVAN',look:'corvan',npc:c,diff:'hard',gym:1});
  if(res===0){OW.flags.ribbon1=1;sfx('go');
    await say("CORVAN: ...Hah! HAHA! Now THAT is grit! The crowd's on its feet!");
    await say("CORVAN: By the authority of the Tamers' Guild, I present you with the FIRST RIBBON!");
    toast('Received the FIRST RIBBON!');await say(OW.name+" received the FIRST RIBBON!");
    await say("CORVAN: Wear it proudly. Every Trialmaster from here to the capital will know you've been tested, and passed.");
    saveGame();toast('CHAPTER 4 COMPLETE · to be continued')}
  else{OW.party.forEach(c=>c.hp=null);await say("CORVAN: Not bad! Not good enough yet, either. Rest up, and come back when your team's ready.");await say("Corvan's medic patches your team up. Everyone is fully restored!");saveGame()}}
/* ---------- Saltwind Shoals: free-battle beach stage ---------- */
function buildShoal(){const W=56,H=40,m=mkMapData('shoal',W,H,{name:'SALTWIND SHOALS'});
  for(let y=0;y<H;y++){const sx=34+Math.round(Math.sin(y*.21)*1.6+Math.sin(y*.07)*1.4);for(let x=sx;x<W;x++){m.ground[y][x]=2;m.walk[y][x]=1}for(let x=sx-10;x<sx;x++)m.ground[y][x]=9}
  blob(m,25,32,5,3,2,501);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(m.ground[y][x]===2)m.walk[y][x]=1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=((x+.5-25)/7)**2+((y+.5-32)/4.5)**2;if(d<1.1&&m.ground[y][x]!==2&&d>.6)m.ground[y][x]=9}
  for(let x=31;x<50;x++)for(const y of[18,19]){m.ground[y][x]=7;m.walk[y][x]=0;m.shot[y][x]=0}
  blob(m,10,10,6,4,3,502);blob(m,12,30,5,4,3,503);blob(m,22,8,4,3,4,504);blob(m,8,20,3,3,4,505);
  pathLine(m,[[4,19],[12,19],[18,17],[24,18.5]],2.2,1);
  for(let x=0;x<W;x+=2){if(m.ground[0][x]!==2&&m.ground[0][x]!==9)otree(m,x,0);if(m.ground[H-2][x]!==2&&m.ground[H-2][x]!==9)otree(m,x,H-2)}
  for(let y=2;y<H-2;y+=2)otree(m,0,y);
  for(const[x,y]of[[6,6],[16,4],[18,12],[5,26],[16,26],[10,34],[4,14],[12,24]])if(free2x2(m,x,y)&&m.ground[y][x]!==9)otree(m,x,y);
  for(const[x,y]of[[26,10],[29,26],[25,6],[30,13],[28,34],[31,7],[27,23]])if(!m.walk[y][x]&&m.ground[y][x]===9)orock(m,x,y);
  deco(m,-1,c=>{for(const[x,y]of[[40,10],[43,27],[38,33]])drawBoat(c,x*16,y*16);for(let k=0;k<30;k++){const x=22+Math.floor(hsh(k,1,506)*12),y=2+Math.floor(hsh(k,2,506)*36);if(m.ground[y]?.[x]!==9||m.walk[y][x])continue;
    const X=x*16+Math.floor(hsh(k,3,506)*12),Y=y*16+Math.floor(hsh(k,4,506)*12);if(k%3===0){R_(c,X,Y,4,3,'#f4e8d8');R_(c,X+1,Y,2,1,'#ffffff');R_(c,X,Y+2,4,1,'#c8a888')}else if(k%3===1){R_(c,X,Y,3,3,'#e87a6a');R_(c,X+1,Y+1,1,1,'#f8c8b8')}else{R_(c,X,Y,8,2,'#8a6a4a');R_(c,X,Y,8,1,'#b08a60')}}},1);
  for(const[x,y]of[[35,17],[41,17]]){sol(m,x,y);deco(m,y*16+15,c=>drawBarrel(c,x*16,y*16))}
  sol(m,44,17);deco(m,17*16+15,c=>drawCrate(c,44*16,17*16));
  m.entries={free:1};return m}
const FSTAGE={meadow:{n:'MEADOW'},shoal:{n:'SALTWIND SHOALS',b:buildShoal,sp:[[16,21],[30,16.5]]},coliseum:{n:'RIBBON COLISEUM',b:()=>buildColiseum('coliseum_free'),sp:[[7.4,13.5],[32.6,13.5]]}};
function freeStage(id){if(!FSTAGE[id])id=['meadow','shoal','coliseum'][Math.floor(Math.random()*3)];
  if(id==='meadow')return{id,map:FREE.MAP,world:FREE.WORLD,w:80,h:56,sp:[[30*16+8,27*16+8],[50*16+8,23*16+8]]};
  const S=FSTAGE[id];if(!S.m){S.m=S.b();prepMap(S.m)}return{id,map:S.m,world:S.m.cvs,w:S.m.w,h:S.m.h,sp:S.sp.map(([x,y])=>[x*16,y*16])}}

/* ---------- the broken lighthouse: HEXWYRM boss ---------- */
function buildRuins(){const W=36,H=28,m=mkMapData('ruins',W,H,{name:'SALTWIND RUINS'});m.route=1;m.rnpcs=[];m.items=[];m.pits=[];m.zones=[];m.ally=1;m.exits={};m.onStart=ruinsStart;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const edge=x<2||y<2||x>=W-2||y>=H-2;if(edge){m.ground[y][x]=10;m.walk[y][x]=1;m.shot[y][x]=1}else m.ground[y][x]=hsh(x,y,401)<.18?8:6}
  blob(m,9,18,4,3,8,402);blob(m,26,9,4,3,8,403);
  // broken tower stump + rubble
  sol(m,15,8,6,2);deco(m,10*16+2,c=>drawBrokenTower(c,14*16,9));deco(m,9*16,c=>{for(let i=0;i<5;i++){R_(c,12*16+i*42,10*16+2,30,7,'rgba(20,10,30,.35)')}},1);
  sol(m,22,9,3,1);deco(m,10*16+2,c=>drawFallenLantern(c,22*16+2,10*16-28));
  for(const[x,y]of[[5,5],[29,5],[5,22],[30,21],[12,11],[23,15],[8,14],[27,24]])orock(m,x,y);
  for(const[x,y]of[[10,4],[25,4],[4,12],[31,13]]){sol(m,x,y);deco(m,y*16+15,c=>{R_(c,x*16+5,y*16+2,6,14,'#2a1a3a');R_(c,x*16+6,y*16+3,4,12,'#a040e0');R_(c,x*16+7,y*16+4,2,6,'#e8b8ff');R_(c,x*16+3,y*16+8,3,8,'#2a1a3a');R_(c,x*16+4,y*16+9,1,6,'#c070f0')})}
  m.entries={south:{x:18*16,y:23*16}};
  return m}
async function ruinsStart(){if(OW.flags.lhDone||G.boss)return;const P=G.f[0];G.paused=true;
  G.f[0].team.forEach(u=>{u.hp=u.max;u.ult=0});OW.party.forEach(c=>c.hp=null);const al=G.f.find(f=>f.ally);if(al){al.unit.hp=al.unit.max;al.x=P.x+26;al.y=P.y}
  await say("The tower is gone. Where the lantern room stood, a crack of violet light hangs in the air... and something is climbing out of it.");
  G.shake=8;sfx('ult');await wait(.6);
  const f=mkFighter(12,[{id:'hexwyrm',lv:encLv(13,'b')}],'hard');f.unit=f.team[0];f.boss=1;f.unit.ht=2.4;f.r=20;f.unit.max=Math.round(f.unit.max*9);f.unit.hp=f.unit.max;f.x=18*16;f.y=14*16;f.aim=PI/2;f.invuln=1.5;
  f.b={phase:1,t:2.2,fireT:1.4,tgtT:0,cleave:0};G.f.push(f);G.boss=f;G.focus=f;ring(f.x,f.y-20,60,'#a040e0',.6,'nova');fx(f.x,f.y-20,'#a040e0',40,160,.8);
  await say("HEXWYRM erupts from the rift! Its roar shakes the rubble loose.");
  await say("Your BOND BAND hums hard. Your team is fully restored. UMBRYNX bares its fangs at your side.");
  G.paused=false;toast('BOSS: HEXWYRM · Lv'+f.unit.lv+'');}
function arenaBox(){return{x0:2*16,y0:2*16,x1:(MW-2)*16,y1:(MH-2)*16}}
function bossCtl(f,dt){const B=f.b,P=G.f[0],al=G.f.find(o=>o.ally&&alive(o));const A=arenaBox(),cx=(A.x0+A.x1)/2,cy=(A.y0+A.y1)/2;
  const c={mx:0,my:0,aim:f.aim,l:0,lp:0,r:0,e:0,swap:null,tx:f.x,ty:f.y};if(!alive(P))return c;
  B.tgtT-=dt;if(B.tgtT<=0||!B.tgt||!alive(B.tgt)){B.tgtT=5+Math.random()*3;B.tgt=al&&Math.random()<.35?al:P}const T=B.tgt;
  const ta=Math.atan2(T.y-(f.y-14),T.x-f.x);c.aim=ta;
  // phase transitions
  if(B.phase===1&&f.unit.hp<=f.unit.max*.5){B.phase=2;B.t=13;B.spin=0;B.dT=0;B.fanT=1;f.invuln=99;f.mode='immune';G.beams=G.beams.filter(b=>b.owner!==f);G.banner={txt:'is IMMUNE!',who:'HEXWYRM',col:'#a040e0',t:1.3,side:1,raw:1};sfx('ult');G.shake=6}
  if(B.phase===2){const dx=cx-f.x,dy=cy-24-f.y,d=Math.hypot(dx,dy);if(d>8){c.mx=dx/d;c.my=dy/d}f.bmove=.8;
    B.t-=dt;B.dT-=dt;if(B.dT<=0){B.dT=.16;B.spin+=.27;for(let i=0;i<6;i++)bossShot(f,B.spin+i*1.047,{spd:105,pow:11,kind:'ddart',r:3,life:5})}
    B.fanT-=dt;if(B.fanT<=0){B.fanT=1.5;const tt=Math.random()<.6?P:(al||P),a=Math.atan2(tt.y-(f.y-14),tt.x-f.x);for(let i=-2;i<=2;i++)bossShot(f,a+i*.16,{spd:150,pow:11,kind:'ddart',r:3,life:5})}
    if(B.t<=0){B.phase=3;f.invuln=.5;f.mode='norm';B.t=2;G.banner={txt:'is ENRAGED!',who:'HEXWYRM',col:'#f85838',t:1.3,side:1,raw:1};sfx('ult')}
    return c}
  // phases 1 & 3: drift, fireballs on a timer, rotating big attacks
  const fast=B.phase===3;f.bmove=B.root>0?0:.5;B.root=Math.max(0,(B.root||0)-dt);
  {const want=140,d=Math.hypot(T.x-f.x,T.y-f.y);const dx=(T.x-f.x)/d,dy=(T.y-f.y)/d;let mx=d>want+30?dx:d<want-30?-dx:0,my=d>want+30?dy:d<want-30?-dy:0;mx+=(cx-f.x)/400;my+=(cy-f.y)/400;c.mx=mx;c.my=my}
  B.fireT-=dt;if(B.fireT<=0){B.fireT=fast?1.05:1.6;const tt=Math.random()<.7?T:(al&&T===P?al:P);const lead=fast?.35:.2,a=Math.atan2(tt.y+tt.vy*lead-(f.y-14),tt.x+tt.vx*lead-f.x);bossShot(f,a,{spd:fast?250:175,pow:38,kind:'fireball',r:5,life:2.2,boom:20,burnK:.4,type:'fire'});sfx('boom')}
  B.t-=dt;if(B.t<=0){const roll=Math.random();
    if(roll<.45){// two half-arena cleaves, the second crossing the first
      const v=Math.random()<.5;const half=Math.random()<.5;const r1=v?{x0:half?A.x0:cx,x1:half?cx:A.x1,y0:A.y0,y1:A.y1}:{x0:A.x0,x1:A.x1,y0:half?A.y0:cy,y1:half?cy:A.y1};
      bossCleave(f,r1,1.6,v);const h2=Math.random()<.5;const r2=!v?{x0:h2?A.x0:cx,x1:h2?cx:A.x1,y0:A.y0,y1:A.y1}:{x0:A.x0,x1:A.x1,y0:h2?A.y0:cy,y1:h2?cy:A.y1};
      later(f,1.9,()=>bossCleave(f,r2,1.5,!v));B.t=fast?4.6:5.4;G.banner={txt:'RIFT CLEAVE',who:'HEXWYRM',col:'#f83838',t:1.1,side:1}}
    else if(roll<.75){B.root=4.1;beam(f,ta,{len:640,w:22,windup:1,dur:3.2,tick:.15,pow:6,type:'dragon',track:fast?.5:.38,kb:30,off:30,oy:16});B.t=fast?5:6;G.banner={txt:'WYRM BEAM',who:'HEXWYRM',col:'#a040e0',t:1.1,side:1}}
    else{for(let k=0;k<3;k++)later(f,k*.35,()=>{const tt=Math.random()<.6?T:P,a=Math.atan2(tt.y-(f.y-14),tt.x-f.x);for(let i=-1;i<=1;i++)bossShot(f,a+i*.22,{spd:fast?240:180,pow:30,kind:'fireball',r:4,life:2.2,boom:16,burnK:.3,type:'fire'})});B.t=fast?3.4:4}}
  return c}
function bossShot(f,a,o){shoot(f,a,{spd:o.spd,pow:o.pow,type:o.type||'dragon',r:o.r,life:o.life,kind:o.kind,kb:o.kb||40,st:o.kind==='fireball'?{burn:2}:null});const p=G.proj[G.proj.length-1];p.x=f.x+Math.cos(a)*26;p.y=f.y-24+Math.sin(a)*14;if(o.boom){p.boom=o.boom;p.burnK=o.burnK||.3}}
function bossCleave(f,r,t,vert){ring(0,0,0,'#f83838',t,'telerect',Object.assign({vert},r));sfx('charge');
  later(f,t,()=>{if(!alive(f))return;for(const o of G.f){if(!alive(o)||o.side===f.side)continue;if(o.x>r.x0&&o.x<r.x1&&o.y>r.y0&&o.y<r.y1)hit(f,o,78,'dragon',{kb:200,ka:Math.atan2(o.y-f.y,o.x-f.x)})}
    G.shake=Math.max(G.shake,9);for(let i=0;i<40;i++){const x=r.x0+Math.random()*(r.x1-r.x0),y=r.y0+Math.random()*(r.y1-r.y0);G.parts.push({x,y,vx:0,vy:-40,life:.5,max:.5,col:i%2?'#a040e0':'#f85838',sz:2})}ring((r.x0+r.x1)/2,(r.y0+r.y1)/2,40,'#ffffff',.25,'nova');sfx('crack')})}
function bossBar(){const f=G.boss,u=f.unit,k=Math.max(0,u.hp/u.max),w=Math.min(360,W*.6),x0=(W-w)/2,y0=6;
  ctx.fillStyle='#1c1c28';ctx.fillRect(x0-3,y0,w+6,16);ctx.fillStyle='#3a1a4a';ctx.fillRect(x0,y0+9,w,5);ctx.fillStyle=f.mode==='immune'?'#d8c0ff':k>.5?'#a040e0':'#f85838';ctx.fillRect(x0,y0+9,w*k,5);
  ctx.fillStyle='#ffffff';ctx.fillRect(x0+w/2,y0+8,1,7);ptext('HEXWYRM  Lv'+f.unit.lv+(f.mode==='immune'?'  ·  IMMUNE':''),W/2,y0+4,'#ffffff',6.5)}
async function bossDefeated(f){runScript(async()=>{G.paused=true;G.proj=G.proj.filter(p=>p.owner!==f);G.beams=[];G.rings=G.rings.filter(r=>r.kind!=='telerect');G.boss=null;
  fx(f.x,f.y-20,'#a040e0',50,180,1);G.shake=10;sfx('ko');await wait(.8);
  await say("HEXWYRM lets out a final roar and unravels into violet smoke. The rift snaps shut behind it.");
  await lighthouseWon()})}
async function marenRuins(){G.paused=true;await say("MAREN: That thing is still out there, in what's left of the tower. Umbrynx can smell it.");
  await say("MAREN: Hold still.");sfx('reloaded');G.f[0].team.forEach(u=>{u.hp=u.max});OW.party.forEach(c=>c.hp=null);await say("Your team is fully restored!");
  const k=await choose(['FACE HEXWYRM','NOT YET']);G.paused=false;if(k!==0)return;syncPartyFromBattle();await startRoute('ruins','south')}
async function veskWon(){G.paused=true;
  await say("ADMIN VESK: ...Hsss. Hah. Ha ha. You think you won? The lamp has been calling for three days. Something finally ANSWERED.");
  G.shake=10;sfx('ult');await say("The floor bucks. Cracks race up the walls, and violet light pours through them. The lighthouse is coming apart!");
  await say("ADMIN VESK: Enjoy the view, little tamer. The Coil will collect what's left of you.");
  await say("Vesk vanishes in a swirl of purple smoke. Corvan tears free of his weakened vines and shoves you toward the stairs. \"OUT! NOW!\"");
  OW.flags.veskDown=1;syncPartyFromBattle();saveGame();G.paused=false;await startRoute('ruins','south')}

/* ---------- route mode ---------- */
const WILD_D={react:.55,err:.28,agg:.75,lead:.2,dodge:.18,idle:0,spd:.95,swap:0,turn:3.2};
const WILD_MULT={dmg:1.7,hp:1.35};
const WILD_SP={snipant:{aggro:[95,140],turf:150,leash:330,flee:0,fac:3},scrattle:{aggro:[95,135],turf:110,leash:300,flee:0,fac:2,pack:130}};
WILD_SP.bulwhale={aggro:[80,110],turf:120,leash:260,flee:0,fac:8};WILD_SP.verdivy={aggro:[110,150],turf:140,leash:280,flee:0,fac:9};WILD_SP.cindercub={aggro:[100,140],turf:140,leash:300,flee:0,fac:10};
WILD_SP.dunemaw={aggro:[90,130],turf:140,leash:320,flee:0,fac:13};WILD_SP.ampoule={aggro:[120,170],turf:150,leash:300,flee:.15,fac:14};WILD_SP.prismoth={aggro:[110,160],turf:140,leash:360,flee:.2,fac:15};
WILD_SP.voltusk={aggro:[85,120],turf:150,leash:340,flee:0,fac:4};WILD_SP.mesmamba={aggro:[150,190],turf:170,leash:300,flee:.2,fac:5};WILD_SP.phantern={aggro:[110,160],turf:130,leash:380,flee:.25,fac:6};
async function startRoute(id,entry){const r=OW.maps[id];if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}
  await fadeTo(1,.3);
  MW=r.w;MH=r.h;WW=MW*16;WH=MH*16;MINI=null;softTrees(r);MAP={ground:r.ground,obj:r.obj,walk:r.walk,shot:r.shot};WORLD=r.cvs;
  newGame(OW.party.map(c=>({id:c.id,lv:c.lv,hp:c.hp,ht:c.ht})),[],'easy');
  const e=r.entries[entry]||r.entries.south,P=G.f[0];P.x=e.x;P.y=e.y;P.aim=-PI/2;P.invuln=1.5;
  G.start=0;G.route={id,map:r,spawnT:1,turfT:24,wipe:0,signCd:0,npcs:r.rnpcs||[],arena:null,busy:0};G.focus=null;G.kos=null;
  if(r.ally&&OW.flags.lhMaren&&!OW.flags.lhDone)mkAlly();
  G.route.tutTr=(r.rnpcs||[]).some(n=>n.kind==='trainer')&&!OW.flags.trainerTut;
  for(let i=0;i<3;i++)spawnWild(true);
  G.cam.x=clamp(P.x-BW/2,0,WW-BW);G.cam.y=clamp(P.y-BH/2,0,WH-BH);
  APP.mode='route';OW.routeAt={id,entry};markVisit(id);$('hud').hidden=false;setView(BW,BH);buildHud();last=performance.now();showLoc(r.name);saveGame();
  await fadeTo(0,.3);
  if(r.onStart){await r.onStart();return}
  if(G.route&&G.route.tutTr){OW.flags.trainerTut=1;G.paused=true;await say("LARCH (over the band): Heads up! Trainers roam this trail too. Each one stands inside a marked circle on the ground.");await say("LARCH: Step into a trainer's circle and they'll spot you (a red ! means you're close). Once they do, they fence off the area and you can't leave until one of you wins.");await say("LARCH: Purple circles mean trouble: those belong to the Coil. Be careful.");G.paused=false}
  if(!OW.flags.routeTut){OW.flags.routeTut=1;G.paused=true;await say("Your BOND BAND hums, and suddenly you're seeing the world through "+MON[G.f[0].unit.id].n.toUpperCase()+"'s eyes!");
    await say("LARCH (over the band): On the trail, your partner leads. Wild creatures live in the grass. Some will charge you, some will scurry off, and some will happily fight each other.");
    await say("LARCH: See a sign? Walk up to it and press E. That's how you read and poke at things while you're in your partner's paws. Hold SHIFT to sprint when nothing's chasing you, and R unleashes its ultimate!");
    await say("LARCH: Fight what you must, and there's no rest on the trail, so heal up before you head out. And if the Warren and the Mounds start a turf war... maybe watch from a distance. Or don't. I'm a scientist, not your mother.");G.paused=false}}
function spawnWild(initial){const R=G.route,m=R.map,P=G.f[0];if(!m.zones||!m.zones.length)return;const wild=G.f.filter(f=>f.wild&&!f.gone);if(wild.length>=(m.wildCap||6))return;
  const zs=m.zones.filter(z=>wild.filter(f=>f.zone===z).length<z.max);if(!zs.length)return;const z=zs[Math.floor(Math.random()*zs.length)];
  for(let k=0;k<20;k++){let X,Y;if(z.tiles&&z.tiles.length){const t=z.tiles[Math.floor(Math.random()*z.tiles.length)];X=t[0];Y=t[1]}else{X=z.x0+Math.floor(Math.random()*(z.x1-z.x0+1));Y=z.y0+Math.floor(Math.random()*(z.y1-z.y0+1))}const g=m.ground[Y]?.[X];if(!(z.g||[3,8]).includes(g)||m.walk[Y][X])continue;if(R.arena&&X*16>R.arena.x0-40&&X*16<R.arena.x1+40&&Y*16>R.arena.y0-40&&Y*16<R.arena.y1+40)continue;
    const x=X*16+8,y=Y*16+12;if(Math.hypot(x-P.x,y-P.y)<200)continue;const vx=x-G.cam.x,vy=y-G.cam.y;if(!initial&&vx>-30&&vx<W+30&&vy>-30&&vy<H+30)continue;
    const tot=Object.values(z.w).reduce((a,b)=>a+b,0);let r=Math.random()*tot,id='scrattle';for(const[k2,v]of Object.entries(z.w)){r-=v;if(r<=0){id=k2;break}}
    mkWild(id,encLv(z.lv[0]+Math.floor(Math.random()*(z.lv[1]-z.lv[0]+1)),'w'),x,y,z);return}}
function mkWild(id,lv,x,y,z){const S=WILD_SP[id],f=mkFighter(S.fac,[{id,lv}],'easy');f.unit=f.team[0];f.x=x;f.y=y;f.ai.d=WILD_D;f.aim=Math.random()*6.28;f.invuln=.4;f.zone=z;f.unit.max=Math.round(f.unit.max*WILD_MULT.hp);f.unit.hp=f.unit.max;
  f.wild={hx:x,hy:y,aggro:S.aggro[0]+Math.random()*(S.aggro[1]-S.aggro[0]),turf:S.turf*(.8+Math.random()*.4),leash:S.leash,flee:S.flee,pack:S.pack||0,wt:0,wa:0,wm:0,retarget:Math.random()*.4,alert:0};
  G.f.push(f);fx(x,y,'#78c860',8,40,.4);return f}
function wildCtl(f,dt){const w=f.wild;w.retarget-=dt;w.alert=Math.max(0,w.alert-dt);
  if(w.retarget<=0){w.retarget=.35;let best=null,bd=1e9;
    for(const o of foes(f)){const d=dist(f,o);const ag=o.side===0?w.aggro:w.turf;if(d<ag&&d<bd&&los(f,o)){bd=d;best=o}}
    if(!best&&f.lastHit&&alive(f.lastHit)&&dist(f,f.lastHit)<Math.max(w.aggro*2.5,200))best=f.lastHit;
    if(!best&&f.target&&alive(f.target)&&f.target.side===0&&dist(f,f.target)<w.aggro*2.2)best=f.target;
    if(Math.hypot(f.x-w.hx,f.y-w.hy)>w.leash){best=null;w.returning=1;f.lastHit=null}
    if(best&&best!==f.target&&best.side===0){w.alert=.8;sfx('tick');if(w.pack)for(const o of G.f)if(o!==f&&o.wild&&o.side===f.side&&!o.target&&alive(o)&&dist(o,f)<w.pack){o.target=best;o.wild.alert=.8;o.wild.retarget=.6}}f.target=best}
  if(f.target&&alive(f.target)&&!w.returning){
    if(w.flee&&f.unit.hp<f.unit.max*w.flee){const t=f.target,a=Math.atan2(f.y-t.y,f.x-t.x);const c={mx:Math.cos(a),my:Math.sin(a),aim:a+PI,l:0,lp:0,r:0,e:0,swap:null,tx:t.x,ty:t.y};[c.mx,c.my]=steer(f,c.mx,c.my,f.ai);return c}
    const ac=aiCtl(f,dt);ac.e=0;return ac}
  const c={mx:0,my:0,aim:f.aim,l:0,lp:0,r:0,e:0,swap:null,tx:f.x,ty:f.y};
  if(w.returning){const dx=w.hx-f.x,dy=w.hy-f.y,d=Math.hypot(dx,dy);if(d<20)w.returning=0;else{c.mx=dx/d;c.my=dy/d}}
  else{w.wt-=dt;if(w.wt<=0){w.wt=1+Math.random()*2.5;w.wa=Math.random()*6.283;w.wm=Math.random()<.55?.4:0}c.mx=Math.cos(w.wa)*w.wm;c.my=Math.sin(w.wa)*w.wm;if(w.wm)c.aim=w.wa}
  [c.mx,c.my]=steer(f,c.mx,c.my,f.ai);return c}
function routeXP(t){const P=G.f[0],u=P.unit,c=OW.party[P.idx];if(!c)return;const xp=Math.max(1,Math.floor(MON[t.unit.id].xp*t.unit.lv/5));c.xp+=xp;popup(P.x,P.y-44,'+'+xp+' EXP','#a8d8ff',true);const cash=6+t.unit.lv*4;OW.money=(OW.money||0)+cash;popup(P.x,P.y-54,'+$'+cash,'#f8d848',true);
  while(c.lv<100&&c.xp>=XPN(c.lv+1)){const before=calcStats(u.m,c.lv);c.lv++;const st=calcStats(u.m,c.lv),gain=st.max-u.max;Object.assign(u,st);u.lv=c.lv;u.hp=Math.min(u.max,u.hp+gain);
    sfx('go');G.banner={txt:'LV '+c.lv+'!',who:u.m.n,col:'#58a8dc',t:1.6,side:0,lvl:1};ring(P.x,P.y-6,22,'#f8d030',.5,'nova');fx(P.x,P.y-8,'#f8d030',20,90,.6,2,30);
    showLvl(u.m,c.lv,before,st);clearTimeout(OW.lvlT);OW.lvlT=setTimeout(hideLvl,2800);$('hud').querySelector('.hpbox.p0').dataset.k=Math.random();HUD.side[0].last=null}
  evolveLive(P,u,c)}
function routeTick(dt){const R=G.route;if(!R)return;
  if(DLG||OW.menuOpen){G.paused=true;R.dlgP=1}else if(R.dlgP){R.dlgP=0;G.paused=!$('pause').hidden}
  if(G.paused)return;
  G.f=G.f.filter(f=>!f.gone);
  R.spawnT-=dt;if(R.spawnT<=0){R.spawnT=3.2;if(Math.random()<.5)spawnWild(false)}
  const P=G.f[0];
  R.turfT-=dt;if(R.turfT<=0){R.turfT=38+Math.random()*25;const cz=R.map.zones.find(z=>z.n==='contested');if(cz){const cx=(cz.x0+cz.x1)/2*16,cy=(cz.y0+cz.y1)/2*16;if(Math.hypot(P.x-cx,P.y-cy)<520)turfWar(cx,cy)}}
  tetherTick(dt);routeSysTick(dt);
  if(R.wipe){R.wipe=0;R.arena=null;runScript(blackout);return}
  const EX=R.map.exits||{north:1,south:1};if(!R.arena){let d=null;if(P.y<22&&EX.north)d='north';else if(P.y>WH-18&&EX.south)d='south';else if(P.x<22&&EX.west)d='west';else if(P.x>WW-18&&EX.east)d='east';
    if(d){const ex=EX[d];if(ex&&ex.closed){if(!R.gateT||G.t>R.gateT){R.gateT=G.t+2.5;runScript(async()=>{G.paused=true;await say(ex.closed);G.paused=false})}P.x=clamp(P.x,26,WW-22);P.y=clamp(P.y,26,WH-22)}else runScript(()=>leaveRoute(d))}}}
function turfWar(cx,cy){const sides=[['scrattle',-1],['snipant',1]];const made=[];
  for(const[id,s]of sides)for(let k=0;k<2;k++){const x=cx+s*(60+Math.random()*30),y=cy+(k-.5)*40+(Math.random()-.5)*20;const t=tileOf(x,y);if(solidTile(MAP===null?OW.map:{w:MW,h:MH,walk:MAP.walk},t.x,t.y))continue;const f=mkWild(id,3+Math.floor(Math.random()*2),x,y,G.route.map.zones.find(z=>z.n==='contested'));f.wild.turf=400;f.wild.leash=600;made.push(f)}
  const rats=made.filter(f=>f.unit.id==='scrattle'),ants=made.filter(f=>f.unit.id==='snipant');rats.forEach((f,i)=>f.target=ants[i%ants.length]);ants.forEach((f,i)=>f.target=rats[i%rats.length]);
  toast('A TURF WAR is breaking out in the Contested Field!');sfx('ult')}
async function blackout(){G.paused=true;await say(MON[G.f[0].unit.id].n.toUpperCase()+" can't go on... Your whole team is worn out!");
  await say("You scoop up your partner and hurry back to the last place you rested.");
  await fadeTo(1,.5);OW.party.forEach(c=>c.hp=null);
  const L=OW.lastHeal||{map:'lab',x:10,y:10};APP.mode='ow';$('hud').hidden=true;setView(480,270);
  if(L.route){L.map='lab';L.x=10;L.y=10;delete L.route}
  if(G){G.route=null;G.paused=false}CHO=null;UI.choice.hidden=true;
  setMap(L.map,L.x,L.y,'down');await fadeTo(0,.5);await say("Your team is rested and ready again.");setTimeout(()=>{OW.lock=0},0)}
function syncPartyFromBattle(){if(!G||!G.f[0])return;G.f[0].team.forEach((u,i)=>{if(OW.party[i]){OW.party[i].hp=Math.max(1,Math.round(u.hp));OW.party[i].lv=u.lv}})}
async function leaveRoute(dir){if(APP.mode!=='route')return;syncPartyFromBattle();G.paused=true;await fadeTo(1,.3);APP.mode='ow';$('hud').hidden=true;setView(480,270);
  const ex=G.route&&G.route.map.exits&&G.route.map.exits[dir];if(ex){if(ex.route){APP.mode='route';await startRoute(ex.route,ex.entry);return}setMap(ex.map,ex.x,ex.y,ex.dir);await fadeTo(0,.3);return}
  if(dir==='north'){setMap('millhaven',19,31,'up');await fadeTo(0,.3);if(!OW.flags.millArrive)await millArrive()}else{setMap('town',15,4,'down');await fadeTo(0,.3)}}
async function leaveToRoute(){await startRoute('route1','north')}
async function millArrive(){OW.flags.millArrive=1;const rv=getNpc('mrival');rv.hidden=false;rv.x=19;rv.y=27;await emote(rv,'!');
  await say(OW.rival+": Look who finally crawled out of the trail! Covered in burrs, too.");
  await say(OW.rival+": Welcome to MILLHAVEN. Canals everywhere, a mill older than Larch, and the TAMERS' GUILD right up the main street.");
  await say(OW.rival+": They run Ribbon Trials. Win one and your band gets a ribbon. Doors open soon. I'll be first in line. Obviously.");
  await say(OW.rival+": Oh, and the well in the plaza heals your team. Not that I needed it. ...Okay, I needed it a little.");
  const path=bfs(OW.map,rv.x,rv.y,13,10,rv);walkNpc(rv,path,.15).then(()=>{rv.hidden=true});saveGame()}
function routePrompt(){const R=G.route,P=G.f[0];if(!R)return;routeDraw();if(!alive(P)||DLG||G.paused)return;const L=routeNear();let best=null;
  for(const it of L){if(it.d<it.r&&(!best||it.d<best.d))best=it}
  for(const it of L){if(it===best||it.d>120)continue;const bob=Math.round(Math.sin(G.t*4+it.x)*1.5),x=Math.round(it.x),y=Math.round(it.y-18+bob);ctx.globalAlpha=Math.min(1,(120-it.d)/40)*.9;
    ctx.fillStyle='#202028';ctx.fillRect(x-6,y-5,13,9);ctx.fillStyle='#f8f8f0';ctx.fillRect(x-5,y-4,11,7);ctx.fillStyle='#202028';ctx.fillRect(x-1,y+4,3,2);ctx.fillStyle='#f8f8f0';ctx.fillRect(x,y+3,1,2);
    ctx.fillStyle='#606070';ctx.fillRect(x-3,y-1,1,1);ctx.fillRect(x,y-1,1,1);ctx.fillRect(x+3,y-1,1,1);ctx.globalAlpha=1}
  if(best){const bob=Math.round(Math.sin(G.t*5)*1.5),x=Math.round(best.x),y=Math.round(best.y-24+bob),w=74,x0=x-w/2;
    ctx.fillStyle='#202028';ctx.fillRect(x0-1,y-8,w+2,17);ctx.fillRect(x-3,y+9,7,2);ctx.fillRect(x-1,y+11,3,2);
    ctx.fillStyle='#f8f8f0';ctx.fillRect(x0,y-7,w,15);ctx.fillRect(x-2,y+8,5,2);ctx.fillRect(x,y+10,1,2);
    const pu=.5+.5*Math.sin(G.t*8);ctx.fillStyle='#202028';ctx.fillRect(x0+3,y-5,36,11);ctx.fillStyle=pu>.5?'#f8d030':'#e8b020';ctx.fillRect(x0+3,y+4,36,2);
    ptext('E',x0+21,y,'#ffffff',6.5);ptext(best.lbl,x0+57,y,'#383840',7,'center',{dark:1})}}
/* ---------- route systems: npcs, trainers, arenas, items, fire pits, ally ---------- */
function rKey(n){return'rt_'+G.route.map.id+'_'+n.id}
function npcShown(n){return !n.show||n.show()}
function npcPos(n){return{x:n.x*16+8,y:n.y*16+14}}
function trR(n){return n.boss?84:62}
function routeSysTick(dt){const R=G.route,m=R.map,P=G.f[0];if(!alive(P))return;
  // trainer sight
  if(!R.arena&&!R.busy)for(const n of R.npcs){if(n.kind!=='trainer'||OW.flags[rKey(n)]||!npcShown(n))continue;const q=npcPos(n);const d=Math.hypot(P.x-q.x,P.y-q.y);
    if(d<trR(n)&&los({x:q.x,y:q.y-4},P)){R.busy=1;runScript(()=>routeTrainer(n));break}}
  // arena clamp
  if(R.arena)arenaTick(R.arena,dt);
  // ally revive / leash
  for(const f of G.f)if(f.ally&&f.unit.hp<=0&&f.faintT<=0){f.reviveT=(f.reviveT||10)-dt;if(f.reviveT<=0){f.reviveT=0;f.unit.hp=Math.round(f.unit.max*.6);f.x=P.x+18;f.y=P.y;f.invuln=1.2;resetTransient(f);popup(f.x,f.y-34,'UMBRYNX RETURNS!','#e06aff',true);fx(f.x,f.y-8,'#a040e0',18,90,.5)}}
  // lit pits
  for(const p of m.pits||[])if(OW.flags[p.k+'_lit']&&Math.random()<.5)G.parts.push({x:p.x+(Math.random()-.5)*6,y:p.y-6,vx:(Math.random()-.5)*8,vy:-30-Math.random()*20,life:.6,max:.6,col:Math.random()<.5?'#f8a030':'#d03a10',sz:Math.random()<.3?2:1})}
// trainer arenas: our side, the trainer's mon and at most one intruding wild stay in; every other wild is held outside the line.
// a wild pressed against the line counts down from 5, and the first to reach 0 crashes the fight.
function arenaTick(A,dt){const P=G.f[0],Mg=12;
  for(const f of G.f){if(!alive(f))continue;
    if(f===P||f.ally||f===A.f||f===A.intruder){f.x=clamp(f.x,A.x0+8,A.x1-8);f.y=clamp(f.y,A.y0+10,A.y1-6);if(solidWalk(f.x,f.y))unstickF(f,0,A);continue}
    if(!f.wild){continue}
    const inX=f.x>A.x0-Mg&&f.x<A.x1+Mg,inY=f.y>A.y0-Mg&&f.y<A.y1+Mg;
    if(inX&&inY){// shove to the nearest open spot just outside the line
      const c=[[f.x-(A.x0-Mg),A.x0-Mg-1,f.y],[(A.x1+Mg)-f.x,A.x1+Mg+1,f.y],[f.y-(A.y0-Mg),f.x,A.y0-Mg-1],[(A.y1+Mg)-f.y,f.x,A.y1+Mg+1]].sort((a,b)=>a[0]-b[0]);let done=0;
      for(const[,x,y]of c){if(x<8||y<8||x>WW-8||y>WH-8||solidWalk(x,y))continue;f.x=x;f.y=y;done=1;break}
      if(!done){let p=null;for(let k=0;k<40&&!p;k++){const a=Math.random()*6.283,d=Math.max(A.x1-A.x0,A.y1-A.y0)/2+30+k*6,x=(A.x0+A.x1)/2+Math.cos(a)*d,y=(A.y0+A.y1)/2+Math.sin(a)*d;if(x>8&&y>8&&x<WW-8&&y<WH-8&&!solidWalk(x,y)&&!(x>A.x0-Mg&&x<A.x1+Mg&&y>A.y0-Mg&&y<A.y1+Mg))p={x,y}}
        if(p){fx(f.x,f.y-6,'#ffffff',6,40,.3);f.x=p.x;f.y=p.y}else{f.gone=1;continue}}
      f.kvx=0;f.kvy=0;if(f.dash)f.dash.t=0}
    const touch=f.x>A.x0-Mg-7&&f.x<A.x1+Mg+7&&f.y>A.y0-Mg-7&&f.y<A.y1+Mg+7;
    if(A.intruder){f.arenaT=0;continue}
    f.arenaT=touch?(f.arenaT||0)+dt:Math.max(0,(f.arenaT||0)-dt*2);
    if(f.arenaT>=5){A.intruder=f;f.arenaT=0;const p=nearestOpen(clamp(f.x,A.x0+20,A.x1-20),clamp(f.y,A.y0+20,A.y1-20),0,A);if(p){f.x=p.x;f.y=p.y}
      f.invuln=.6;ring(f.x,f.y-6,18,TC[f.unit.m.types[0]],.4,'nova');fx(f.x,f.y-8,'#ffffff',14,80,.4);sfx('swap');G.banner={txt:'Enters the battle!',who:'WILD '+f.unit.m.n.toUpperCase(),col:TC[f.unit.m.types[0]],t:1.3,side:1,raw:1};toast('A wild '+f.unit.m.n.toUpperCase()+' enters the battle!')}}}
async function routeTrainer(n){const R=G.route,P=G.f[0];G.paused=true;const q=npcPos(n);R.spot={n,t:0};sfx('ult');await wait(.8);R.spot=null;
  for(const l of n.intro)await say(l);
  const f=mkFighter(7,n.team.map(t=>({id:t.id,lv:encLv(t.lv,'t')})),n.diff||'normal');f.unit=f.team[0];f.rtrainer=n;f.target=P;
  const a=Math.atan2(P.y-q.y,P.x-q.x);f.x=q.x+Math.cos(a)*22;f.y=q.y+Math.sin(a)*22;f.invuln=1;f.aim=a;
  const cx=(P.x+q.x)/2,cy=(P.y+q.y)/2,hw=Math.min(8*16,WW/2-8),hh=Math.min(6*16,WH/2-8);const x0=clamp(cx-hw,0,WW-2*hw),y0=clamp(cy-hh,0,WH-2*hh);
  R.arena={x0,y0,x1:x0+2*hw,y1:y0+2*hh,f,n};
  for(const w of G.f)if(w.wild)w.arenaT=0;arenaTick(R.arena,0);
  G.f.push(f);ring(f.x,f.y-6,16,TC[f.unit.m.types[0]],.35,'nova');G.focus=f;toast((n.evil?'⚠ ':'')+n.name+' sends out '+f.unit.m.n.toUpperCase()+'!');sfx('swap');
  G.paused=false;R.busy=0}
function routeTrainerWon(n){const R=G.route;OW.flags[rKey(n)]=1;R.arena=null;const pay=60*Math.max(...n.team.map(t=>t.lv));OW.money=(OW.money||0)+pay;saveGame();
  runScript(async()=>{G.paused=true;await say(n.win);await say('You got $'+pay+' for winning!');if(n.onWin){await n.onWin();return}G.paused=false})}
function mkAlly(){const P=G.f[0];const lv=Math.min(13,Math.max(12,...OW.party.map(c=>c.lv)));const a=mkFighter(11,[{id:'umbrynx',lv}],'normal');a.side=0;a.ally=1;a.unit=a.team[0];a.x=P.x+22;a.y=P.y+4;a.ai.d=Object.assign({},DIFF.normal,{agg:.75,react:.4,err:.18,dodge:.5});G.f.push(a);return a}
function allyCtl(f,dt){const P=G.f[0];const dP=alive(P)?dist(f,P):0;
  // unstick: if it hasn't made progress toward the player for a while, blink to the player's side
  f.stk=(f.stk||0)+dt;if(f.stk>.7){const mv=Math.hypot(f.x-(f.stx??f.x),f.y-(f.sty??f.y));if(dP>70&&mv<8){f.stuckN=(f.stuckN||0)+1}else f.stuckN=0;f.stx=f.x;f.sty=f.y;f.stk=0;
    if(f.stuckN>=2&&alive(P)){f.stuckN=0;fx(f.x,f.y-6,'#a040e0',10,60,.3);const a=Math.random()*6.28;for(let k=0;k<8;k++){const x=P.x+Math.cos(a+k)*22,y=P.y+Math.sin(a+k)*16;if(!solidWalk(x,y)){f.x=x;f.y=y;break}}fx(f.x,f.y-6,'#e06aff',12,70,.35)}}
  if(G.boss&&alive(G.boss)){const bc=allyBossCtl(f,dt);if(bc)return bc}
  const foe=nearestFoe(f,200);
  if(foe&&alive(P)&&dist(foe,P)<260&&dP<200){f.target=foe;return aiCtl(f,dt)}
  f.target=null;const c={mx:0,my:0,aim:f.aim,l:0,lp:0,r:0,e:0,swap:null,tx:f.x,ty:f.y};if(!alive(P))return c;const d=dist(f,P);
  if(d>260){for(let k=0;k<8;k++){const x=P.x+Math.cos(k*.8)*22,y=P.y+Math.sin(k*.8)*16;if(!solidWalk(x,y)){f.x=x;f.y=y;break}}fx(f.x,f.y-6,'#a040e0',10,60,.3)}
  else if(d>34){const sp=d>90?1:.75;c.mx=(P.x-f.x)/d*sp;c.my=(P.y-f.y)/d*sp;c.aim=Math.atan2(c.my,c.mx);[c.mx,c.my]=steer(f,c.mx,c.my,f.ai)}
  return c}
// ally vs Hexwyrm: always step out of marked cleave zones and the beam's line; in the immune phase it only dodges
function allyBossCtl(f,dt){const Bo=G.boss,A=arenaBox();f.target=Bo;
  const c={mx:0,my:0,aim:Math.atan2(Bo.y-14-f.y,Bo.x-f.x),l:0,lp:0,r:0,e:0,swap:null,tx:Bo.x,ty:Bo.y-14};
  const z=G.rings.find(r=>r.kind==='telerect'&&f.x>r.x0-12&&f.x<r.x1+12&&f.y>r.y0-12&&f.y<r.y1+12);
  if(z){const opts=[];if(z.x0>A.x0+4)opts.push([f.x-(z.x0-18),-1,0]);if(z.x1<A.x1-4)opts.push([(z.x1+18)-f.x,1,0]);if(z.y0>A.y0+4)opts.push([f.y-(z.y0-18),0,-1]);if(z.y1<A.y1-4)opts.push([(z.y1+18)-f.y,0,1]);
    opts.sort((a,b)=>a[0]-b[0]);if(opts[0]){c.mx=opts[0][1];c.my=opts[0][2];[c.mx,c.my]=steer(f,c.mx,c.my,f.ai)}return c}
  for(const b of G.beams){if(b.owner!==Bo)continue;const ox=Bo.x,oy=Bo.y-24,dx=Math.cos(b.a),dy=Math.sin(b.a),rx=f.x-ox,ry=f.y-oy,along=rx*dx+ry*dy,perp=rx*-dy+ry*dx;
    if(along>0&&Math.abs(perp)<42){const s=perp>=0?1:-1;c.mx=-dy*s;c.my=dx*s;[c.mx,c.my]=steer(f,c.mx,c.my,f.ai);return c}}
  const ph2=Bo.b.phase===2;let ax=0,ay=0,thr=0;
  for(const p of G.proj){if(p.owner!==Bo)continue;const rx=f.x-p.x,ry=f.y-6-p.y,d=Math.hypot(rx,ry),R=p.kind==='fireball'?95:70;if(d>R)continue;const sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp;if(rx*ux+ry*uy<-4)continue;
    const perp=rx*-uy+ry*ux,miss=Math.abs(perp)-(p.boom||0)*.6;if(!ph2&&miss>18)continue;const s=perp>=0?1:-1,w=(R-d)/R;ax+=-uy*s*w*2;ay+=ux*s*w*2;thr=1}
  if(ph2){const dB=dist(f,Bo),want=165;if(dB<want){ax+=(f.x-Bo.x)/dB*.6;ay+=(f.y-Bo.y)/dB*.6}else if(dB>want+50){ax+=(Bo.x-f.x)/dB*.3;ay+=(Bo.y-f.y)/dB*.3}}
  if(ph2||thr){if(f.x<A.x0+20)ax+=.8;if(f.x>A.x1-20)ax-=.8;if(f.y<A.y0+20)ay+=.8;if(f.y>A.y1-20)ay-=.8;
    const m=Math.hypot(ax,ay);if(m>.05){c.mx=ax/Math.max(1,m);c.my=ay/Math.max(1,m);[c.mx,c.my]=steer(f,c.mx,c.my,f.ai)}return c}
  return aiCtl(f,dt)}
function routeNear(){const R=G.route,P=G.f[0],m=R.map,out=[];
  for(const s of m.signs){const x=s.x*16+8,y=s.y*16+8;out.push({x,y:y-4,r:30,d:Math.hypot(P.x-x,P.y-y),lbl:'READ',kind:'sign',s})}
  for(const n of R.npcs){if(!npcShown(n))continue;const q=npcPos(n);if(n.kind==='trainer'&&!OW.flags[rKey(n)])continue;out.push({x:q.x,y:q.y-22,r:30,d:Math.hypot(P.x-q.x,P.y-q.y),lbl:'TALK',kind:'npc',n})}
  for(const it of m.items||[]){if(OW.flags[it.k])continue;const x=it.x*16+8,y=it.y*16+10;out.push({x,y:y-6,r:24,d:Math.hypot(P.x-x,P.y-y),lbl:'TAKE',kind:'item',it})}
  for(const p of m.pits||[])out.push({x:p.x,y:p.y-10,r:30,d:Math.hypot(P.x-p.x,P.y-p.y),lbl:OW.flags[p.k+'_lit']?'REST':'LIGHT',kind:'pit',p});
  if(m.lhDoor)out.push({x:m.lhDoor.x,y:m.lhDoor.y-14,r:30,d:Math.hypot(P.x-m.lhDoor.x,P.y-m.lhDoor.y),lbl:'ENTER',kind:'door'});
  return out}
function routeInteract(){const R=G.route,P=G.f[0];if(!R||G.paused)return;let best=null;for(const it of routeNear())if(it.d<it.r&&(!best||it.d<best.d))best=it;if(!best)return;
  runScript(async()=>{G.paused=true;try{
    if(best.kind==='sign')await say(typeof best.s.text==='function'?best.s.text():best.s.text);
    else if(best.kind==='npc'){const n=best.n;if(n.kind==='trainer')await say(n.after||n.win);else{G.paused=false;await n.talk();return}}
    else if(best.kind==='item'){const it=best.it,I=ITEMS[it.id];OW.flags[it.k]=1;OW.items[it.id]=(OW.items[it.id]||0)+it.n;sfx('go');await say(OW.name+' found '+it.n+' '+I.n+(it.n>1?'S':'')+'!');saveGame()}
    else if(best.kind==='pit'){const p=best.p,lit=OW.flags[p.k+'_lit'];
      if(!(OW.items.wood>0)){await say(lit?"The embers have died down. You'd need more CAMPFIRE WOOD to get it going again.":"A cold fire pit. With a bundle of CAMPFIRE WOOD you could light it and let your team rest.");}
      else{await say("Use one CAMPFIRE WOOD to light a fire and rest? (You have "+OW.items.wood+")");const k=await choose(['LIGHT IT','NOT NOW']);
        if(k===0){OW.items.wood--;OW.flags[p.k+'_lit']=1;sfx('reloaded');G.f[0].team.forEach(u=>{u.hp=u.max});OW.party.forEach(c=>c.hp=null);fx(p.x,p.y-6,'#f8a030',20,80,.6);
          await say("The fire crackles to life. Your team rests in its warmth...\nEveryone is fully restored!");saveGame()}}}
    else if(best.kind==='door'){if(OW.flags.lhDone)await say("The lighthouse is quiet now. Its lamp is dark, and the purple vines have withered.");
      else if(!OW.flags.quest)await say("The door is barred from the inside. High above, a purple glow pulses behind the lantern glass.");
      else if(OW.flags.veskDown){G.paused=false;await marenRuins();return}
      else{G.paused=false;await marenLighthouse();return}}
  }finally{if(APP.mode==='route'&&G.route===R)G.paused=false}})}
function routeHumans2D(){if(r3dOn())return;const R=G.route;for(const n of R.npcs){if(!npcShown(n))continue;const q=npcPos(n);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(Math.round(q.x-5),Math.round(q.y),10,2);ctx.drawImage(HSPR[n.look][n.dir][0],Math.round(q.x-10),Math.round(q.y-29),20,30)}
  for(const it of R.map.items||[]){if(OW.flags[it.k])continue;if(!ITEMCV){ITEMCV=mkCanvas(16,16);drawItemBall(ITEMCV.getContext('2d'),0,0)}ctx.drawImage(ITEMCV,it.x*16,it.y*16-Math.round(Math.abs(Math.sin(G.t*3+it.x))*2))}}
let ITEMCV=null;
function routeOverlays(){const R=G.route;if(!R)return;const P=G.f[0];
  for(const p of R.map.pits||[])if(OW.flags[p.k+'_lit']){const x=Math.round(p.x),y=Math.round(p.y),fl=Math.floor(G.t*10)%2;ctx.fillStyle='#d03a10';ctx.fillRect(x-3,y-6-fl,6,5);ctx.fillStyle='#f47a18';ctx.fillRect(x-2,y-8,4,5);ctx.fillStyle='#f8c040';ctx.fillRect(x-1,y-9+fl,2,4)}
  for(const it of R.map.items||[]){if(OW.flags[it.k])continue;if(Math.floor(G.t*3+it.x)%3===0){ctx.fillStyle='#ffffff';ctx.fillRect(it.x*16+11,it.y*16+4,1,3);ctx.fillRect(it.x*16+10,it.y*16+5,3,1)}}
  if(!R.arena)for(const n of R.npcs){if(n.kind!=='trainer'||OW.flags[rKey(n)]||!npcShown(n))continue;const q=npcPos(n),rr=trR(n),d=P?Math.hypot(P.x-q.x,P.y-q.y):999;if(d>rr*3.2)continue;
    const k=clamp(1-(d-rr)/(rr*2.2),0,1);ctx.globalAlpha=.18+.32*k;ctx.fillStyle=n.evil?'#c050e8':'#f85838';const N=40;for(let i=0;i<N;i++){if((i+Math.floor(G.t*6))%4>1)continue;const a=i/N*6.283;ctx.fillRect(Math.round(q.x+Math.cos(a)*rr),Math.round(q.y+Math.sin(a)*rr*.9),2,2)}
    ctx.globalAlpha=.08+.1*k;pell(q.x,q.y,rr,rr*.9,n.evil?'#c050e8':'#f85838');ctx.globalAlpha=1;
    if(d<rr*1.8){const by=Math.round(q.y-40-Math.abs(Math.sin(G.t*6))*2);ctx.fillStyle='#282830';ctx.fillRect(Math.round(q.x)-3,by,7,10);ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(q.x)-2,by+1,5,8);ctx.fillStyle='#f83838';ctx.fillRect(Math.round(q.x),by+2,1,4);ctx.fillRect(Math.round(q.x),by+7,1,1)}}
  if(R.spot){const q=npcPos(R.spot.n),by=Math.round(q.y-46);ctx.fillStyle='#282830';ctx.fillRect(Math.round(q.x)-5,by,11,14);ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(q.x)-4,by+1,9,12);ctx.fillStyle='#f83838';ctx.fillRect(Math.round(q.x)-1,by+3,3,6);ctx.fillRect(Math.round(q.x)-1,by+10,3,2)}
  if(R.arena){const A=R.arena,pu=.5+.5*Math.sin(G.t*5);ctx.strokeStyle=R.arena.n.evil?'rgba(200,80,232,'+(.55+.35*pu)+')':'rgba(248,208,48,'+(.55+.35*pu)+')';ctx.lineWidth=2;ctx.strokeRect(A.x0+1,A.y0+1,A.x1-A.x0-2,A.y1-A.y0-2);ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.lineDashOffset=-G.t*20;ctx.strokeRect(A.x0+3.5,A.y0+3.5,A.x1-A.x0-7,A.y1-A.y0-7);ctx.setLineDash([])}}

/* ---------- Maren & the Tether ---------- */
const MAREN_LINES=["MAREN: The Mending Well never runs dry. Ever wondered what it's drinking from?","MAREN: That Root Tree back in Fernbrook is older than the village. A lot older. Nobody planted it.","MAREN: Umbrynx doesn't like the Guild hall. ...Neither do I. Don't read into it.","MAREN: Tire them out first, then throw. Healthy creatures just laugh at a Tether.","MAREN: Larch hums when she's nervous. Did she hum when she gave you that band?"];
async function marenEvent(){const mr=getNpc('maren'),p=OW.p;if(!mr||OW.flags.tetherTut)return;
  face(mr,p);await emote(mr,'!');
  await say("???: You there. The one with the band humming like a kettle.");
  const path=bfs(OW.map,mr.x,mr.y,p.x+(p.x<mr.x?1:-1),p.y,mr);if(path.length)await walkNpc(mr,path,.16);face(mr,p);face(p,mr);
  await say("???: Larch's work. I'd know that hum anywhere. ...Don't look at me like that. Lots of people know Larch.");
  await say("MAREN: Maren. I pass through. Sometimes I stay.");
  await say("MAREN: I watched you come up Hollowmill Trail. You fought everything that moved and left it all behind in the grass. That's a tiring way to make friends.");
  const k=await choose(["Who are you, really?","How do you know Larch?","...Friends?"]);
  if(k===0)await say("MAREN: Someone who's walked a lot of trails. That's the honest answer. It just isn't the whole one.");
  else if(k===1)await say("MAREN: Everyone knows Larch. Fewer people know why she stopped working with the Guild. Ask her sometime, and watch her change the subject.");
  else await say("MAREN: Friends. Partners. Whatever you want to call it. Here, you'll see.");
  sfx('reloaded');await say("Maren presses something into your palm. It's a smooth seed-stone the size of a plum, warm, with a faint pulse inside like a slow heartbeat.");
  await say("MAREN: A TETHER. Throw it at a wild creature while you're out in the field. Q throws it toward your cursor.");
  await say("MAREN: It pulses three times. If the creature lets it hold through all three, it's bonded to you. If not, the Tether cracks and you've got one very annoyed creature.");
  await say("MAREN: So don't throw it at anything that's fresh. Wear it down first. The weaker it is, the better the odds.");
  await say("MAREN: Where do they come from? A grove that isn't on any map. Don't ask me which one.");
  await say("MAREN: But first... I want to see how you fight before I hand over more. Umbrynx. Out.");
  sfx('ult');await emote(mr,'...');
  await say("A shadow peels itself off the canal wall. Two gold eyes open in it, and a crescent of moonlight curls up behind them.");
  await say("MAREN: Don't worry. I'll tell it to go easy on you.");
  const res=await trainerBattle({enemy:[{id:'umbrynx',lv:7}],name:'MAREN',look:'maren',npc:mr,diff:'easy'});
  if(res===0){await say("MAREN: Hm. Not bad at all.");await say("MAREN: It was only using one paw, mind you. ...Mostly.")}
  else{await say("MAREN: Don't sulk. Umbrynx has been doing this a lot longer than you have.");await say("MAREN: You read its burst well, though. Most people don't see the third bolt coming.")}
  sfx('reloaded');OW.party.forEach(c=>c.hp=null);await say("Umbrynx brushes past your partner. A faint shimmer passes between them and your team feels fully rested.");
  OW.items=OW.items||{};OW.items.tether=(OW.items.tether||0)+5;OW.box=OW.box||[];OW.flags.tetherTut=1;sfx('go');toast('Received 5 TETHERS!  Press Q in the field to throw.');
  await say("MAREN: Five Tethers. Up to three bonded creatures can travel with you. Any extras will wait at Larch's field office, and you can swap them in from your TEAM menu.");
  await say("MAREN: The trail's crawling with Scrattle and Snipant. Start there.");
  await say("MAREN: I'll be around. Probably.");
  const back=bfs(OW.map,mr.x,mr.y,mr.home.x,mr.home.y,mr);if(back.length)await walkNpc(mr,back,.16);mr.dir='down';saveGame()}
async function shopTalk(){OW.items=OW.items||{};OW.money=OW.money||0;
  await say("CLERK: Welcome to the canal supply stall! Potions for scrapes, Tethers for new friends. Everything a trail-runner needs.");
  for(;;){await say("You have $"+OW.money+". What'll it be?");const k=await choose(['POTION · $'+ITEMS.potion.price,'TETHER · $'+ITEMS.tether.price,'CAMPFIRE WOOD · $'+ITEMS.wood.price,'LEAVE']);if(k<0||k===3)break;
    const id=['potion','tether','wood'][k],it=ITEMS[id];await say("CLERK: "+it.d+" How many?");const q=await choose(['×1','×5','×10','CANCEL']);if(q<0||q===3)continue;
    const n=[1,5,10][q],cost=n*it.price;if(OW.money<cost){await say("CLERK: That's $"+cost+"... you're a little short, friend. Win a few battles out on the trail and come back.");continue}
    OW.money-=cost;OW.items[id]=(OW.items[id]||0)+n;sfx('go');saveGame();await say("CLERK: Here you go! "+n+" "+it.n+(n>1?'S':'')+". You've got "+OW.items[id]+" now.")}
  await say("CLERK: Come back anytime! And mind the canal, it's deeper than it looks.")}
async function marenTalk(){if(!OW.flags.tetherTut){await marenEvent();return}
  OW.items=OW.items||{};if(!(OW.items.tether>0)){OW.items.tether=3;sfx('go');await say("MAREN: Out already? ...Here. Three more. Try missing less.");toast('Received 3 TETHERS!');saveGame();return}
  OW.marenI=((OW.marenI??-1)+1)%MAREN_LINES.length;await say(MAREN_LINES[OW.marenI])}

function catchOdds(f){const u=f.unit,hp=Math.max(0,u.hp/u.max),P=G.f[0];let c=.12+.83*Math.pow(1-hp,1.3);c*=clamp(1+(P.unit.lv-u.lv)*.06,.5,1.4);return clamp(c,.05,.97)}
function throwTether(){const R=G.route;if(!R||G.paused||DLG)return;const P=G.f[0];if(!alive(P))return;
  if(!OW.flags.tetherTut){toast("You don't have anything to throw yet.");return}
  OW.items=OW.items||{};if(!(OW.items.tether>0)){toast('No TETHERS left! Maren in Millhaven might spare a few.');return}
  R.tethers=R.tethers||[];if((R.tetherCd||0)>0||R.tethers.some(t=>t.state!=='done'))return;
  R.tetherCd=.5;const p=reach(P,M.x,M.y,170),d=Math.hypot(p.x-P.x,p.y-P.y);
  R.tethers.push({x:P.x,y:P.y-6,sx:P.x,sy:P.y-6,ex:p.x,ey:p.y,T:.22+d/520,t:0,z:0,state:'fly'});sfx('dash')}
function tetherTick(dt){const R=G.route;R.tetherCd=Math.max(0,(R.tetherCd||0)-dt);if(!R.tethers)return;const P=G.f[0];
  for(const t of R.tethers){
    if(t.state==='fly'){t.t+=dt;const k=Math.min(1,t.t/t.T);t.x=t.sx+(t.ex-t.sx)*k;t.y=t.sy+(t.ey-t.sy)*k;t.z=Math.sin(PI*k)*26;
      if(Math.random()<.6)G.parts.push({x:t.x,y:t.y-t.z,vx:0,vy:0,life:.25,max:.25,col:'#e8c060',sz:1});
      if(t.z<22)for(const f of G.f){if(!f.wild||f.bound||!alive(f)||f.invuln>0)continue;if(Math.hypot(f.x-t.x,f.y-6-t.y)<14){bindTether(t,f);break}}
      if(t.state==='fly'&&k>=1){t.state='miss';t.t=0;fx(t.x,t.y,'#d8d0ff',5,40,.3);sfx('tick')}}
    else if(t.state==='miss'){t.t+=dt;if(t.t>.7){t.state='done';popup(t.x,t.y-14,'MISSED · picked back up','#d8d8e0',true)}}
    else if(t.state==='bind'){const f=t.f;t.t+=dt;f.x=t.x;f.y=t.y;f.vx=f.vy=0;f.kvx=f.kvy=0;
      const pulseAt=[.9,1.55,2.2];while(t.pulse<3&&t.t>=pulseAt[t.pulse]){t.pulse++;t.wob=.25;
        if(Math.random()<t.ps){ring(t.x,t.y-2,10+t.pulse*3,'#e8c060',.35,'nova');sfx('tick');popup(t.x,t.y-18,['·','· ·','· · ·'][t.pulse-1],'#f8e078',true)}
        else{t.state='done';f.bound=0;f.invuln=.4;f.st.stun=0;f.target=P;f.lastHit=P;if(f.wild)f.wild.alert=.8;popup(f.x,f.y-34,'BROKE FREE!','#f85858',true);fx(t.x,t.y,'#5a5078',14,110,.4);fx(t.x,t.y,'#e8c060',8,80,.3);G.shake=Math.max(G.shake,3);sfx('crack');break}}
      t.wob=Math.max(0,(t.wob||0)-dt);
      if(t.state==='bind'&&t.t>=2.6){t.state='done';catchWild(t,f)}}}
  R.tethers=R.tethers.filter(t=>t.state!=='done'||t.keep)}
function bindTether(t,f){OW.items.tether--;t.state='bind';t.t=0;t.pulse=0;t.f=f;t.x=f.x;t.y=f.y;t.ps=Math.pow(catchOdds(f),1/3);
  f.bound=1;f.invuln=99;f.st.stun=99;f.dash=null;f.charging=0;f.target=null;G.focus=f;ring(f.x,f.y-6,20,'#e8c060',.35,'nova');fx(f.x,f.y-8,'#e8c060',14,80,.4);sfx('charge');popup(f.x,f.y-34,'TETHER!','#f8e078',true)}
function catchWild(t,f){const P=G.f[0],u=f.unit;f.bound=0;f.gone=1;
  const base=calcStats(u.m,u.lv),hp=Math.max(1,Math.round(u.hp/u.max*base.max));const c={id:u.id,lv:u.lv,xp:XPN(u.lv),hp,ht:u.ht};
  ring(t.x,t.y-4,26,'#ffffff',.5,'nova');fx(t.x,t.y-6,'#f8e078',26,120,.6,2,20);fx(t.x,t.y-6,'#ffffff',14,90,.5);sfx('go');
  routeXP(f);OW.box=OW.box||[];let where;
  if(OW.party.length<3){OW.party.push(c);P.team.push(mkUnit(c.id,c.lv,c.hp,c.ht));buildHud();where="It joined your team! Press "+P.team.length+" to swap to it.";}
  else{OW.box.push(c);where="Your team's full, so it'll wait for you at Larch's field office.";}
  OW.flags.caught=(OW.flags.caught||0)+1;saveGame();
  runScript(async()=>{G.paused=true;await say("TETHERED! The wild "+u.m.n.toUpperCase()+" (Lv"+u.lv+") bonded with you!\n"+where);if(OW.flags.caught===1)await say("MAREN (from somewhere, somehow): Told you. Wear them down first.");G.paused=false})}
function drawTetherStone(x,y,glow){pcirc(x,y,4,'#141428');pcirc(x,y,3.2,'#5a5078');ctx.fillStyle='#8a80b0';ctx.fillRect(Math.round(x)-2,Math.round(y)-2,2,1);ctx.fillStyle=glow?'#fff4b0':'#e8c060';ctx.fillRect(Math.round(x)-3,Math.round(y),7,1);ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(x)-2,Math.round(y)-3,1,1)}
function routeDraw(){const R=G.route;if(!R)return;routeHumans2D();routeOverlays();
  for(const t of R.tethers||[]){if(t.state==='done')continue;
    if(t.state==='fly'||t.state==='miss'){pell(t.x,t.y+3,3,1,'rgba(0,0,0,.3)');drawTetherStone(t.x,t.y-t.z,0)}
    else if(t.state==='bind'){const f=t.f,ab=Math.min(1,t.t/.35);
      if(ab<1){const S=SPR[f.unit.id].norm.down[0].w,s=1-ab;ctx.globalAlpha=1-ab*.5;ctx.drawImage(S,Math.round(t.x-16*s),Math.round(t.y-4-26*s),Math.max(1,Math.round(32*s)),Math.max(1,Math.round(32*s)));ctx.globalAlpha=1;
        for(let i=0;i<6;i++){const a=i*1.047+G.t*6;pline(t.x,t.y-4,t.x+Math.cos(a)*16*s,t.y-4+Math.sin(a)*12*s,1,'#e8c060')}}
      const wob=t.wob>0?Math.sin(t.wob*40)*2:0;pell(t.x,t.y+3,4,1.2,'rgba(0,0,0,.3)');drawTetherStone(t.x+wob,t.y-1,t.wob>0)}}
  if(!PROJ)tetherHud()}
function tetherHud(){if(OW.flags.tetherTut){ctx.save();ctx.setTransform(1,0,0,1,0,0);const x=18,y=H-14;ctx.fillStyle='#202028';ctx.fillRect(x-10,y-8,62,16);ctx.fillStyle='#f8f8f0';ctx.fillRect(x-9,y-7,60,14);drawTetherStone(x-2,y,0);ptext('×'+(OW.items&&OW.items.tether||0),x+12,y,'#383840',7,'center',{dark:1});ctx.fillStyle='#202028';ctx.fillRect(x+26,y-5,18,10);ptext('Q',x+35,y,'#f8d030',6.5);ctx.restore()}}
function routeHint(){return 'E interact · SHIFT sprint'+(OW.flags.tetherTut?' · Q throw Tether ×'+(OW.items&&OW.items.tether||0):'')+' · LMB / RMB · R ult · F reload · 1 2 3 swap · Esc menu'}

async function useWell(){sfx('reloaded');OW.party.forEach(c=>c.hp=null);OW.lastHeal={map:'millhaven',x:19,y:25};saveGame();await say("You lift a cup of cool well water for your partner.\nYour team is fully restored!")}
