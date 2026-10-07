/* ================= WAVE 3: DUNEMAW · AMPOULE · PRISMOTH · playable HEXWYRM =================
   Each one leads with a type no playable creature had: Ground, pure Electric, Psychic/Ice, and Dragon.
   Kept self-contained: species data, kits, AI, HUD text and effect drawing. Core hooks live in game.js
   (hit/burrow, fires/pit, projectile mirrors, splash/refract, drawProj/drawGear/special fallbacks, endModes). */
const PIT_R=58,COIL_MAX=2,COIL_REACH=150,WIRE_MAX=210,MIRROR_L=44,BURROW_T=2.5,CLEAVE2_L=150,CLEAVE2_W=46;
MONS.push(
{id:'dunemaw',n:'Dunemaw',types:['ground'],stats:{hp:80,dmg:88,pdef:86,mdef:58,int:66,spe:74},cls:'phys',xp:70,draw:drawDunemaw,states:['norm','burrow'],ammo:{max:6,rl:1.2,unit:'sprays',verb:'SCOOPING SAND',d:'6 sand sprays, then scoops more for 1.2s.'},
 role:'Ambusher',blurb:'A land shark pup that swims through loose sand like water. All you see is the fin, circling, right before the ground opens up.',
 moves:[
  {k:'LMB',n:'Gill Spout',t:'ground',pow:'6 ×5',cd:.55,d:'Blast a short fan of sand out of your gills. Each grain slows a little; point blank, all five land.'},
  {k:'RMB',n:'Sand Dive',t:'ground',pow:'12 / 46',cd:6,d:'Dive under the sand for up to 2.5s: untouchable and 40% faster, only your fin showing. The fin slices each foe it passes (12). Right-click again (or run out of air) to BREACH, launching everything around you.'},
  {k:'E',n:'Sand Maelstrom',t:'ground',pow:'14 / bite',cd:0,d:'Churn a huge sand whirlpool at the cursor for 5s. Foes inside are dragged toward the middle and slowed, and the eye of it bites every 0.4s. Flyers float over it.'}]},
{id:'ampoule',n:'Ampoule',types:['electric'],stats:{hp:64,dmg:88,pdef:56,mdef:88,int:100,spe:82},cls:'mag',xp:70,draw:drawAmpoule,states:['norm','charge'],ammo:{max:10,rl:1.3,unit:'zaps',verb:'RECHARGING',d:'10 zaps, then recharges for 1.3s.'},
 role:'Controller',blurb:'A lantern jellyfish that drifts over storm-flooded fields. It strings live wires between floating coils and itself, then waits for you to touch one.',
 moves:[
  {k:'LMB',n:'Arc Zap',t:'electric',pow:'13 (+18)',cd:.28,d:'A quick bolt. Shoot one of your own Tesla Coils and it relays an amplified bolt at the nearest foe.'},
  {k:'RMB',n:'Tesla Coil',t:'electric',pow:'8 / tick',cd:1.6,d:'Launch a coil that flies to the cursor and anchors there, or where it hits a wall or a foe (10 dmg). Max 2, 10s each. Live wires link you to each coil and the coils to each other; foes touching a wire are zapped and slowed. Wires go dead past 210 range.'},
  {k:'E',n:'Overload',t:'electric',pow:58,cd:0,d:'Each coil, then you, bursts in a big stunning shockwave, one after another. With no coils out, two drop around you first. Coils are spent.'}]},
{id:'prismoth',n:'Prismoth',types:['psychic','ice'],stats:{hp:60,dmg:94,pdef:56,mdef:84,int:92,spe:106},cls:'mag',xp:72,draw:drawPrismoth,states:['norm'],ammo:{max:12,rl:1.2,unit:'shards',verb:'REGROWING SCALES',d:'12 shards, then regrows its wing scales for 1.2s.'},
 role:'Trickster',blurb:'A moth whose wings grew into living crystal. Light bends wrong around it: shots ricochet, mirrors appear from nowhere, and suddenly there are three of it.',
 moves:[
  {k:'LMB',n:'Prism Shard',t:'psychic',pow:'13 → 3×7',cd:.3,d:'A crystal shard. When it strikes a wall it refracts, splitting into three icy shards that fly off the bounce. Bank shots around cover.'},
  {k:'RMB',n:'Mirror Pane',t:'ice',pow:'—',cd:6,d:'Raise a crystal pane in front of you for 3.5s. Enemy shots that touch it are reflected back as yours. Your own shards passing through it split.'},
  {k:'E',n:'Kaleidoscope',t:'psychic',pow:'echo',cd:0,d:'Two mirror images flank you for 6s and copy every shard you fire. When they fade they shatter in chilling bursts.'}]},
{id:'hexwyrmp',n:'Hexwyrm',types:['dragon','fire'],sz:1.5,stats:{hp:78,dmg:90,pdef:68,mdef:70,int:68,spe:54},cls:'mag',xp:90,draw:drawHexwyrm,states:['norm','immune'],ammo:{max:4,rl:1.6,unit:'hexfires',verb:'STOKING THE RIFT',d:'4 hexfires, then stokes the rift for 1.6s.'},
 role:'Calamity',blurb:'A sliver of the lighthouse wyrm, finally bound to a Bond Band. Huge and slow, it lobs rift-fire, tears the ground open, and once a battle simply refuses to go down.',
 moves:[
  {k:'LMB',n:'Hexfire',t:'fire',pow:'26 + boom',cd:.6,d:'A heavy rift fireball that bursts on impact, burns, and sets the ground alight.'},
  {k:'RMB',n:'Rift Cleave',t:'dragon',pow:72,cd:6.5,d:'Rear up (0.7s) while a wide lane marks your aim, then tear it open: everything in the lane takes a huge hit.'},
  {k:'E',n:'Wyrm Beam',t:'dragon',pow:'7 ×20',cd:0,d:'Root yourself and breathe a long violet beam that slowly follows your aim.'},
  {k:'PAS',n:'Calamity Scales',t:'dragon',pow:'—',cd:0,d:'Passive. The first time you drop below half HP, you go IMMUNE for 1.5s, refill your hexfires and gain 40% ULT.'}]});
for(const m of MONS.slice(-4))MON[m.id]=m;
Object.assign(ANIM,{dunemaw:{k:'sniff',fps:3},ampoule:{k:'hover',fps:3,hover:2.6},prismoth:{k:'hover',fps:6,hover:1.8},hexwyrmp:{k:'breathe',fps:2.2}});

/* ---------- DUNEMAW ---------- */
function burrowEnd(f){const u=f.unit;f.mode='norm';f.burT=0;u.cd[1]=6*cdM(u);if(!alive(f))return;
  nova(f,f.x,f.y-4,{r:38,pow:46,type:'ground',kb:240});G.shake=Math.max(G.shake,5);
  fx(f.x,f.y-2,'#dcb46e',24,140,.5,2,40);fx(f.x,f.y-4,'#8a6234',12,90,.4,2);popup(f.x,f.y-34,'BREACH!','#f6dca0',true);sfx('crack')}
function pitTouch(fi,t){if(t.mode==='burrow'||t.boss)return;const dx=fi.x-t.x,dy=fi.y-t.y,d=Math.hypot(dx,dy)||1;
  if(t.mode!=='turret'&&d>6){const pull=230*G.dt*(.45+.55*Math.min(1,d/fi.r));t.kvx+=dx/d*pull;t.kvy+=dy/d*pull}
  applySt(t,{slow:[.2,.35]});
  if(d<18&&(t.pitCd||0)<=G.t){t.pitCd=G.t+.4;hit(fi.owner,t,14,'ground',{quiet:1,atk:fi.atk,lv:fi.lv,cls:'phys',stabTypes:['ground']});fx(t.x,t.y-2,'#dcb46e',6,60,.3,2,20)}}
function drawPit(fi){const k=Math.min(1,fi.life*1.5,(5-fi.life)*4+.2),r=fi.r;
  ctx.globalAlpha=.55*k;pell(fi.x,fi.y,r,r*.55,'#8a6234');ctx.globalAlpha=.7*k;pell(fi.x,fi.y,r*.78,r*.43,'#b88a4a');pell(fi.x,fi.y+1,r*.5,r*.27,'#8a6234');pell(fi.x,fi.y+1,r*.22,r*.12,'#3a2410');
  ctx.globalAlpha=k;pring(fi.x,fi.y,r,'#dcb46e',2);
  for(let i=0;i<26;i++){const ph=(G.t*.55+i/26+fi.seed)%1,rr=r*(1-ph),a=i*2.4+G.t*(1.2+ph*2.5)+fi.seed;ctx.fillStyle=i%3?'#f6dca0':'#6e4222';ctx.fillRect(Math.round(fi.x+Math.cos(a)*rr),Math.round(fi.y+Math.sin(a)*rr*.55),i%4?1:2,1)}
  ctx.globalAlpha=1}
KIT.dunemaw={
  act(f,c){const u=f.unit;
    if(f.mode==='burrow'){if(c.r&&f.burAge>.3)burrowEnd(f);return}
    if(c.r&&u.cd[1]<=0){f.mode='burrow';f.burT=BURROW_T;f.burAge=0;f.finHit=[];f.vx*=.5;f.vy*=.5;fx(f.x,f.y-2,'#dcb46e',18,90,.4,2,30);ring(f.x,f.y,16,'#b88a4a',.3,'nova');sfx('plant');return}
    if(c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<=0)startReload(f);else{u.ammo--;u.cd[0]=.55;f.spitT=.15;
      for(let i=0;i<5;i++)shoot(f,c.aim+(i-2)*.13,{spd:290+i%2*30,pow:6,type:'ground',r:2,life:.32,jit:.05,kind:'grit',kb:22,st:{slow:[.6,.12]}});sfx('splash');if(u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);const p=reach(f,c.tx,c.ty,200);G.fires.push({x:p.x,y:p.y,r:PIT_R,life:5,owner:f,seed:Math.random()*6,pit:1,atk:f.unit.dmg,lv:f.unit.lv});
      ring(p.x,p.y,PIT_R,'#dcb46e',.45,'nova');fx(p.x,p.y,'#b88a4a',30,160,.6,2,30);G.shake=Math.max(G.shake,4);sfx('boom')}},
  move(f){if(f.mode==='burrow'){f.burT-=G.dt;f.burAge+=G.dt;for(const t of foes(f)){if(dist(f,t)<f.r+t.r+5&&!(f.finHit||[]).includes(t.unit)){(f.finHit=f.finHit||[]).push(t.unit);hit(f,t,12,'ground',{kb:90,ka:Math.atan2(t.y-f.y,t.x-f.x),st:{slow:[.6,.3]}});fx(t.x,t.y-4,'#f6dca0',10,90,.3,2,20);sfx('jab')}}if(Math.random()<.6)G.parts.push({x:f.x+(Math.random()-.5)*14,y:f.y+(Math.random()-.5)*4,vx:(Math.random()-.5)*30,vy:-20,life:.35,max:.35,col:Math.random()<.5?'#dcb46e':'#8a6234',sz:2});if(f.burT<=0)burrowEnd(f);return 1.4}return 1}};
AIK.dunemaw=function(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
  if(f.mode==='burrow'){if(d<f.r+t.r+10&&f.burAge>.3)c.r=1;else if(f.burT<.35)c.r=1;return{pref:0,goto:{x:t.x,y:t.y}}}
  if(u.ult>=100&&sight&&d<190&&Math.random()<dt*D.agg*2.5)c.e=1;
  if(u.cd[1]<=0&&((d>110&&d<280&&Math.random()<dt*D.agg*2)||(ai.threat&&u.hp<u.max*.55&&Math.random()<dt*D.dodge*6)))c.r=1;
  else if(sight&&d<85&&u.cd[0]<=0&&ai.react<=0){c.l=1;ai.react=D.react*.5}
  return{pref:26,aimTarget:1}};

/* ---------- AMPOULE ---------- */
function segDist(px_,py_,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy||1,k=clamp(((px_-ax)*dx+(py_-ay)*dy)/L,0,1);return Math.hypot(px_-(ax+dx*k),py_-(ay+dy*k))}
function ampWires(f){const N=f.nodes||[],W=[];for(const n of N)W.push([f.x,f.y-6,n.x,n.y]);if(N.length===2)W.push([N[0].x,N[0].y,N[1].x,N[1].y]);return W.map(w=>({w,live:Math.hypot(w[2]-w[0],w[3]-w[1])<=WIRE_MAX}))}
function coilFlyTick(f){const C=f.coilFly;if(!C||!C.length)return;
  for(const k of C){const sp=Math.hypot(k.vx,k.vy)*G.dt,nx=k.x+k.vx*G.dt,ny=k.y+k.vy*G.dt;let land=Math.hypot(k.tx-k.x,k.ty-k.y)<=sp+1;
    if(!land&&solidShot(nx,ny+10))land=1;if(!land)for(const t of foes(f))if(Math.hypot(t.x-nx,t.y-6-ny)<t.r+5){land=1;hit(f,t,10,'electric',{kb:60,ka:Math.atan2(k.vy,k.vx),st:{slow:[.5,.3]}});break}
    if(land){k.done=1;dropCoil(f,k.x,k.y+6)}else{k.x=nx;k.y=ny;if(Math.random()<.5)G.parts.push({x:k.x,y:k.y,vx:0,vy:0,life:.2,max:.2,col:Math.random()<.5?'#f8ec78':'#8eb4f4',sz:1})}}
  f.coilFly=C.filter(k=>!k.done)}
function ampTick(f){coilFlyTick(f);const N=f.nodes;if(!N||!N.length)return;for(const n of N)n.life-=G.dt;f.nodes=N.filter(n=>n.life>0);
  for(const{w,live}of ampWires(f)){if(!live)continue;for(const t of foes(f)){if((t.wireCd||0)>G.t)continue;if(segDist(t.x,t.y-6,...w)<t.r+3){t.wireCd=G.t+.3;hit(f,t,8,'electric',{quiet:1,st:{slow:[.4,.3]},kb:0});fx(t.x,t.y-8,'#f8ec78',4,60,.2)}}}
  // relays: own zaps that touch a coil fire an amplified bolt from it
  for(const p of G.proj){if(p.owner!==f||p.kind!=='zap'||p.relay)continue;for(const n of f.nodes){if(Math.hypot(p.x-n.x,p.y-n.y)<9){p.dead=1;const t=nearestFoe({x:n.x,y:n.y+6,side:f.side},230);
      ring(n.x,n.y,12,'#f8ec78',.25,'nova');fx(n.x,n.y,'#fffce0',8,90,.25);sfx('crack');
      if(t){const a=Math.atan2(t.y-6-n.y,t.x-n.x);G.proj.push({x:n.x,y:n.y,vx:Math.cos(a)*460,vy:Math.sin(a)*460,r:3,pow:18,type:'electric',owner:f,unit:f.unit,life:.6,kind:'zap',relay:1,kb:60,st:{slow:[.5,.3]},hit:new Set(),t:0})}break}}}}
function dropCoil(f,x,y){f.nodes=(f.nodes||[]).concat([{x,y:y-6,life:10,ph:Math.random()*6}]);if(f.nodes.length>COIL_MAX)f.nodes.shift();ring(x,y-6,12,'#f8ec78',.3,'nova');fx(x,y-8,'#fffce0',10,70,.3);sfx('plant')}
KIT.ampoule={
  act(f,c){const u=f.unit;
    if(f.ovW>0)return;
    if(c.r&&u.cd[1]<=0){const p=reach(f,c.tx,c.ty,COIL_REACH),a=Math.atan2(p.y-f.y,p.x-f.x),sx=f.x+Math.cos(a)*8,sy=f.y-6+Math.sin(a)*8;u.cd[1]=1.6*cdM(u);f.slamT=.15;
      (f.coilFly=f.coilFly||[]).push({x:sx,y:sy,vx:Math.cos(a)*230,vy:Math.sin(a)*230,tx:p.x,ty:p.y-6});fx(sx,sy,'#fffce0',6,60,.2);sfx('dash')}
    if(c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<=0)startReload(f);else{u.ammo--;u.cd[0]=.28;f.slamT=.12;shoot(f,c.aim,{spd:380,pow:13,type:'electric',r:2.5,life:.6,kind:'zap',kb:25});sfx('dart');if(u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);if(!(f.nodes&&f.nodes.length))for(const o of[-1.2,1.2]){const x=f.x+Math.cos(c.aim+o)*44,y=f.y+Math.sin(c.aim+o)*44;if(!solidWalk(x,y))dropCoil(f,x,y)}
      const pts=(f.nodes||[]).map(n=>({x:n.x,y:n.y+6}));f.nodes=[];f.coilFly=[];pts.push(null);f.ovW=.25+pts.length*.22;f.slamT=f.ovW;
      pts.forEach((p,i)=>{if(p)ring(p.x,p.y,52,'#f8d030',.3+i*.22,'tele',{own:f});later(f,.3+i*.22,()=>{const q=p||{x:f.x,y:f.y};nova(f,q.x,q.y-4,{r:52,pow:58,type:'electric',kb:170,st:{stun:.5}});fx(q.x,q.y-6,'#fffce0',16,200,.3);G.shake=Math.max(G.shake,5)})});sfx('charge')}},
  move(f){f.ovW=Math.max(0,(f.ovW||0)-G.dt);ampTick(f);return f.ovW>0?.3:1}};
AIK.ampoule=function(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d,N=f.nodes||[];
  if(u.ult>=100&&(d<60||N.some(n=>Math.hypot(n.x-t.x,n.y+6-t.y)<56))&&Math.random()<dt*D.agg*4)c.e=1;
  if(u.cd[1]<=0&&N.length+(f.coilFly||[]).length<COIL_MAX&&d<300&&Math.random()<dt*D.agg*3){// hang coils across the gap so the wire sits between us
    const a=Math.atan2(t.y-f.y,t.x-f.x)+(N.length?-1:1)*(.7+Math.random()*.5),k=Math.min(COIL_REACH,d*.7);c.r=1;c.tx=f.x+Math.cos(a)*k;c.ty=f.y+Math.sin(a)*k;c.aim=a;return{pref:150}}
  if(sight&&d<250&&u.cd[0]<=0&&ai.react<=0){c.l=1;ai.react=D.react*.4}
  return{pref:150,aimTarget:1}};
function drawWires(f){const N=f.nodes||[];
  for(const k of f.coilFly||[]){ctx.globalAlpha=.35;pline(f.x,f.y-6,k.x,k.y,1,'#8eb4f4');ctx.globalAlpha=1;pcirc(k.x,k.y,4,'#1a1c50');pcirc(k.x,k.y,3,'#5a78d8');pcirc(k.x,k.y,1.6,'#f8ec78');for(let i=0;i<3;i++){const a=G.t*14+i*2.09;ctx.fillStyle='#fffce0';ctx.fillRect(Math.round(k.x+Math.cos(a)*6),Math.round(k.y+Math.sin(a)*3),1,1)}}
  for(const{w,live}of ampWires(f)){const[x0,y0,x1,y1]=w,L=Math.hypot(x1-x0,y1-y0)||1,n=Math.ceil(L/5),nx=-(y1-y0)/L,ny=(x1-x0)/L;let pv=[x0,y0];
    ctx.globalAlpha=live?.95:.25;for(let i=1;i<=n;i++){const q=i/n,j=i<n?(Math.random()-.5)*(live?5:1.5):0,x=x0+(x1-x0)*q+nx*j,y=y0+(y1-y0)*q+ny*j;pline(pv[0],pv[1],x,y,1,live?(i%2?'#f8ec78':'#ffffff'):'#8eb4f4');pv=[x,y]}}
  ctx.globalAlpha=1;
  for(const n of N){const y=n.y+Math.sin(G.t*3+n.ph)*1.5,blink=n.life<2&&Math.floor(G.t*8)%2;pell(n.x,n.y+12,4,1.2,'rgba(0,0,0,.25)');
    pcirc(n.x,y,4.5,'#1a1c50');pcirc(n.x,y,3.5,blink?'#3a4aa0':'#5a78d8');pcirc(n.x,y,2,'#f8ec78');ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(n.x)-1,Math.round(y)-1,1,1);
    for(let i=0;i<3;i++){const a=G.t*4+i*2.09+n.ph;ctx.fillStyle='#fffce0';ctx.fillRect(Math.round(n.x+Math.cos(a)*6),Math.round(y+Math.sin(a)*3),1,1)}}}

/* ---------- PRISMOTH ---------- */
function prismSplit(p,a,x,y){const f=p.owner;if(!f||!f.unit)return;for(const o of[-.38,0,.38])G.proj.push({x,y,vx:Math.cos(a+o)*310,vy:Math.sin(a+o)*310,r:2,pow:7,type:'ice',owner:f,unit:p.unit,life:.45,kind:'prism2',kb:30,st:{slow:[.5,.2]},hit:new Set(p.hit),t:0});
  fx(x,y,'#c6ecff',8,80,.25);ring(x,y,7,'#ffffff',.18,'nova');sfx('tick')}
// wall hit: reflect the shard off the face it struck and split it
function refract(p){if(p.kind!=='prism'||p.refr||!solidShot(p.x,p.y+4))return false;p.refr=1;const dt=G.dt||1/60,bx=p.x-p.vx*dt,by=p.y-p.vy*dt;
  let vx=p.vx,vy=p.vy;const hx=solidShot(p.x,by+4),hy=solidShot(bx,p.y+4);if(hx)vx=-vx;if(hy)vy=-vy;if(!hx&&!hy){vx=-vx;vy=-vy}
  prismSplit(p,Math.atan2(vy,vx),bx,by);return true}
function mirrorTest(p){for(const f of G.f){const m=f.mirror;if(!m||!alive(f))continue;const nx=Math.cos(m.a),ny=Math.sin(m.a),rx=p.x-m.x,ry=p.y-m.y,s=rx*nx+ry*ny,al=-rx*ny+ry*nx;
    if(Math.abs(al)>MIRROR_L/2||Math.abs(s)>p.r+4)continue;
    if(p.owner===f){if(p.kind==='prism'&&!p.refr){p.refr=1;p.dead=1;prismSplit(p,Math.atan2(p.vy,p.vx),p.x,p.y)}continue}
    if(p.owner&&p.owner.side===f.side)continue;const vn=p.vx*nx+p.vy*ny;if(vn>=0)continue;
    if(p.kind==='hook'){p.dead=1;p.kind='quill';fx(p.x,p.y,'#c6ecff',6,60,.25);continue}
    p.vx-=2*vn*nx;p.vy-=2*vn*ny;p.owner=f;p.unit=f.unit;p.hit=new Set();p.life=Math.max(p.life,.6);p.onHit=null;p.atk=null;p.cls=null;p.stab=null;p.lv=null;
    ring(p.x,p.y,8,'#ffffff',.2,'nova');fx(p.x,p.y,'#c6ecff',6,70,.25);if(f.side===0||p.owner.side===0)popup(p.x,p.y-12,'REFLECT!','#c6ecff',true);sfx('crack')}}
function kaleidoEnd(f){for(const d of f.decoys||[]){nova(f,d.x,d.y,{r:28,pow:30,type:'ice',kb:90,st:{slow:[1,.35]}});fx(d.x,d.y-10,'#c6ecff',14,90,.4)}f.decoys=null;f.kalT=0}
KIT.prismoth={
  act(f,c){const u=f.unit;
    if(c.r&&u.cd[1]<=0){u.cd[1]=6*cdM(u);const a=c.aim;f.mirror={x:f.x+Math.cos(a)*22,y:f.y-6+Math.sin(a)*22,a,life:3.5};ring(f.mirror.x,f.mirror.y,14,'#c6ecff',.3,'nova');fx(f.mirror.x,f.mirror.y,'#ffffff',12,80,.3);sfx('blink')}
    if(c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<=0)startReload(f);else{u.ammo--;u.cd[0]=.3;f.slamT=.1;shoot(f,c.aim,{spd:320,pow:13,type:'psychic',r:2.5,life:.8,kind:'prism',kb:30});
      for(const d of f.decoys||[]){const a=Math.atan2(c.ty-(d.y-6),c.tx-d.x);G.proj.push({x:d.x+Math.cos(a)*9,y:d.y-6+Math.sin(a)*9,vx:Math.cos(a)*320,vy:Math.sin(a)*320,r:2.5,pow:8,type:'psychic',owner:f,unit:u,life:.8,kind:'prism',kb:20,hit:new Set(),t:0})}
      sfx('dart');if(u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);f.kalT=6;f.decoys=[{x:f.x,y:f.y,s:1},{x:f.x,y:f.y,s:-1}];fx(f.x,f.y-10,'#ff9ac0',20,120,.5);fx(f.x,f.y-10,'#c6ecff',16,100,.5);ring(f.x,f.y-8,24,'#f85888',.4,'nova');sfx('blink')}},
  move(f){if(f.mirror){f.mirror.life-=G.dt;if(f.mirror.life<=0){fx(f.mirror.x,f.mirror.y,'#c6ecff',10,60,.3);f.mirror=null}}
    if(f.decoys){f.kalT-=G.dt;const a=f.aim,k=Math.min(1,G.dt*10);for(const d of f.decoys){const tx=f.x-Math.sin(a)*28*d.s-Math.cos(a)*6,ty=f.y+Math.cos(a)*28*d.s-Math.sin(a)*6;d.x+=(tx-d.x)*k;d.y+=(ty-d.y)*k}if(f.kalT<=0)kaleidoEnd(f)}
    return 1}};
AIK.prismoth=function(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
  if(u.cd[1]<=0&&ai.threat&&Math.random()<dt*D.dodge*10)c.r=1;
  if(u.ult>=100&&sight&&d<240&&Math.random()<dt*D.agg*2)c.e=1;
  if(sight&&d<250&&u.cd[0]<=0&&ai.react<=0){c.l=1;ai.react=D.react*.45}
  return{pref:150,aimTarget:1}};
function drawMirror(f){const m=f.mirror;if(!m)return;const nx=Math.cos(m.a),ny=Math.sin(m.a),tx=-ny,ty=nx,h=MIRROR_L/2,fade=Math.min(1,m.life*2);
  ctx.globalAlpha=.5*fade;pline(m.x-tx*h,m.y-ty*h,m.x+tx*h,m.y+ty*h,5,'#2a3a78');ctx.globalAlpha=.85*fade;pline(m.x-tx*h,m.y-ty*h,m.x+tx*h,m.y+ty*h,3,'#8cc4ee');pline(m.x-tx*(h-2),m.y-ty*(h-2),m.x+tx*(h-2),m.y+ty*(h-2),1,'#ffffff');
  const q=((G.t*1.4)%1)*2-1;ctx.fillStyle='#ff9ac0';ctx.fillRect(Math.round(m.x+tx*h*q),Math.round(m.y+ty*h*q),2,2);ctx.globalAlpha=1}
function drawDecoys(f){const S=SPR.prismoth&&SPR.prismoth.norm[f.dir];if(!S||!f.decoys)return;if(r3dOn()){for(const d of f.decoys)if(Math.random()<.2)G.parts.push({x:d.x+(Math.random()-.5)*14,y:d.y-10-Math.random()*12,vx:0,vy:-10,life:.3,max:.3,col:Math.random()<.5?'#ff9ac0':'#c6ecff',sz:1});return}const k=HK||1;for(const d of f.decoys){const sh=Math.sin(G.t*12+d.s*2)*.08;ctx.globalAlpha=Math.min(1,(f.kalT||0)*2)*(.42+sh);
    ctx.drawImage(S[Math.floor(G.t*6)%2].c,Math.round(d.x-16*k),Math.round(d.y-(32+2+Math.sin(G.t*3+d.s)*2)*k),Math.round(32*k),Math.round(32*k));ctx.globalAlpha=1;
    if(Math.random()<.2)G.parts.push({x:d.x+(Math.random()-.5)*14,y:d.y-10-Math.random()*12,vx:0,vy:-10,life:.3,max:.3,col:Math.random()<.5?'#ff9ac0':'#c6ecff',sz:1})}}

/* ---------- playable HEXWYRM ---------- */
function riftCleave(f,a){const ca=Math.cos(a),sa=Math.sin(a),x0=f.x,y0=f.y;G.shake=Math.max(G.shake,7);G.flash=Math.max(G.flash,.1);sfx('boom');sfx('crack');
  for(const t of foes(f)){const rx=t.x-x0,ry=t.y-y0,al=rx*ca+ry*sa,pp=-rx*sa+ry*ca;if(al>-10&&al<CLEAVE2_L+t.r&&Math.abs(pp)<CLEAVE2_W/2+t.r)hit(f,t,72,'dragon',{kb:200,ka:a})}
  for(const p of G.pods){const rx=p.x-x0,ry=p.y-y0,al=rx*ca+ry*sa;if(al>-10&&al<CLEAVE2_L&&Math.abs(-rx*sa+ry*ca)<CLEAVE2_W/2+6)hurtPod(p,72*f.unit.dmg/f.unit.mdef*LF(f.unit.lv)*1.2)}
  for(let d=8;d<CLEAVE2_L;d+=7){const o=(Math.random()-.5)*CLEAVE2_W*.8;G.parts.push({x:x0+ca*d-sa*o,y:y0+sa*d+ca*o,vx:0,vy:-40-Math.random()*30,life:.5,max:.5,col:d%14<7?'#a040e0':'#f85838',sz:2})}
  ring(x0+ca*CLEAVE2_L*.5,y0+sa*CLEAVE2_L*.5,30,'#ffffff',.25,'nova')}
KIT.hexwyrmp={
  act(f,c){const u=f.unit;
    if(f.cleaveW>0)return;
    if(c.r&&u.cd[1]<=0){u.cd[1]=6.5*cdM(u);const a=c.aim,wu=.7;f.cleaveW=wu;f.root=wu;f.slamT=wu;ring(f.x,f.y,CLEAVE2_L,'#a040e0',wu,'teleline',{a,w:CLEAVE2_W,own:f});fx(f.x,f.y-18,'#a040e0',14,70,.4);sfx('charge');later(f,wu,()=>riftCleave(f,a));return}
    if(c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<=0)startReload(f);else{u.ammo--;u.cd[0]=.6;f.slamT=.15;const a=c.aim;shoot(f,a,{spd:210,pow:26,type:'fire',r:4,life:1.3,kind:'fireball',kb:90,st:{burn:2}});const p=G.proj[G.proj.length-1];p.x=f.x+Math.cos(a)*14;p.y=f.y-16+Math.sin(a)*10;p.boom=17;p.burnK=.3;p.hex=1;sfx('boom');if(u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);beam(f,c.aim,{len:440,w:20,windup:.5,dur:2.4,tick:.12,pow:7,type:'dragon',track:1.1,kb:30,off:18,oy:12})}},
  move(f){const u=f.unit;
    if(!u.hexP&&u.hp>0&&u.hp<u.max*.5){u.hexP=1;f.mode='immune';f.immT=1.5;f.invuln=Math.max(f.invuln,1.5);u.ammo=u.m.ammo.max;u.rl=0;u.ult=Math.min(100,u.ult+40);
      G.banner={txt:'CALAMITY SCALES',who:'HEXWYRM',col:'#a040e0',t:1.2,side:f.side};ring(f.x,f.y-16,30,'#a040e0',.5,'nova');fx(f.x,f.y-16,'#e8b8ff',24,130,.5);G.shake=Math.max(G.shake,4);sfx('ult')}
    if(f.mode==='immune'){f.immT-=G.dt;if(f.immT<=0)f.mode='norm'}
    return f.cleaveW>0?0:1}};
AIK.hexwyrmp=function(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
  if(f.cleaveW>0)return{pref:120,aimTarget:1};
  if(u.ult>=100&&sight&&d<360&&Math.random()<dt*D.agg*2)c.e=1;
  else if(u.cd[1]<=0&&sight&&d<CLEAVE2_L-10&&ai.react<=0&&Math.random()<dt*D.agg*3)c.r=1;
  else if(sight&&d<260&&u.cd[0]<=0&&ai.react<=0){c.l=1;ai.react=D.react*.6}
  return{pref:130,aimTarget:1}};

/* ---------- shared hooks called from game.js ---------- */
const GEAR2={ampoule:f=>drawWires(f),prismoth:f=>{drawMirror(f);drawDecoys(f)},
  dunemaw:(f,a,ca,sa)=>{if(f.spitT>0){ctx.fillStyle='#f6dca0';for(let i=0;i<4;i++)ctx.fillRect(Math.round(f.x+ca*(10+i*3)+(Math.random()-.5)*6),Math.round(f.y-8+sa*(10+i*3)+(Math.random()-.5)*6),1,1)}
    if(f.mode==='burrow'){const k=Math.floor(G.t*10)%2;ctx.fillStyle='#8a6234';for(let i=-2;i<=2;i++)ctx.fillRect(Math.round(f.x+i*4+k),Math.round(f.y+2),2,1)}},
  hexwyrmp:(f,a,ca,sa)=>{if(f.cleaveW>0){const k=1-f.cleaveW/.7;for(let i=0;i<5;i++){const aa=G.t*7+i*1.26,r=14+k*8;ctx.fillStyle=i%2?'#f85838':'#e8b8ff';ctx.fillRect(Math.round(f.x+Math.cos(aa)*r),Math.round(f.y-20+Math.sin(aa)*r*.5),2,2)}}
    if(f.mode==='immune'){ctx.globalAlpha=.4+.2*Math.sin(G.t*12);pring(f.x,f.y-18,22,'#e8b8ff',2);ctx.globalAlpha=1}}};
const SPECIAL2={
  dunemaw:f=>{const n=G.fires.filter(q=>q.pit&&q.owner===f).length;return[f.mode==='burrow'?'BURROWED · AIR '+Math.max(0,f.burT).toFixed(1)+'s':(f.unit.cd[1]>0?'BURROW '+f.unit.cd[1].toFixed(1)+'s':'BURROW READY')+(n?' · PIT OPEN':''),f.mode==='burrow'?f.burT/BURROW_T:1-f.unit.cd[1]/6]},
  ampoule:f=>{const N=f.nodes||[],live=ampWires(f).filter(w=>w.live).length;return['COILS '+N.length+'/'+COIL_MAX+' · WIRES '+live+(f.unit.cd[1]>0?' · '+f.unit.cd[1].toFixed(1)+'s':''),N.length/COIL_MAX]},
  prismoth:f=>[f.decoys?'KALEIDOSCOPE '+Math.max(0,f.kalT).toFixed(1)+'s':f.mirror?'MIRROR '+f.mirror.life.toFixed(1)+'s':f.unit.cd[1]>0?'MIRROR '+f.unit.cd[1].toFixed(1)+'s':'MIRROR READY',f.decoys?f.kalT/6:f.mirror?f.mirror.life/3.5:1-f.unit.cd[1]/6],
  hexwyrmp:f=>[f.mode==='immune'?'IMMUNE '+Math.max(0,f.immT).toFixed(1)+'s':f.cleaveW>0?'REARING...':(f.unit.cd[1]>0?'CLEAVE '+f.unit.cd[1].toFixed(1)+'s':'CLEAVE READY')+(f.unit.hexP?'':' · SCALES ARMED'),f.mode==='immune'?f.immT/1.5:1-f.unit.cd[1]/6.5]};
function drawProj2(p){const x=Math.round(p.x),y=Math.round(p.y),a=Math.atan2(p.vy,p.vx),c=Math.cos(a),s=Math.sin(a);
  switch(p.kind){
    case'grit':ctx.fillStyle='#3a2410';ctx.fillRect(x-1,y-1,3,3);ctx.fillStyle=p.t%0.1<.05?'#f6dca0':'#dcb46e';ctx.fillRect(x,y-1,1,2);ctx.fillRect(x-1,y,2,1);return true;
    case'zap':{let px0=p.x,py0=p.y;const n=p.relay?5:3;for(let i=1;i<=n;i++){const nx=p.x-c*i*3+(Math.random()-.5)*4,ny=p.y-s*i*3+(Math.random()-.5)*4;pline(px0,py0,nx,ny,p.relay&&i<3?2:1,i===1?'#ffffff':i%2?'#f8ec78':'#8eb4f4');px0=nx;py0=ny}pcirc(p.x,p.y,p.relay?2.5:1.6,'#fffce0');return true}
    case'prism':case'prism2':{const L=p.kind==='prism'?4:3;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#2a3a78';ctx.fillRect(-L-1,-2,L*2+2,4);ctx.fillStyle=p.kind==='prism'?'#ff9ac0':'#8cc4ee';ctx.fillRect(-L,-1,L*2,2);ctx.fillStyle='#ffffff';ctx.fillRect(L-2,-1,2,1);ctx.restore();
      ctx.fillStyle=p.kind==='prism'?'#f8b2ca':'#c6ecff';ctx.fillRect(Math.round(p.x-c*7),Math.round(p.y-s*7),1,1);return true}}
  return false}

/* ================= STARTER EVOLUTIONS (Lv 14) ================= */
MONS.push(
{id:'calderursa',n:'Calderursa',types:['fire','ground'],sz:1.2,stats:{hp:90,dmg:104,pdef:82,mdef:80,int:72,spe:66},cls:'mag',xp:150,draw:drawCalderursa,states:['norm'],ammo:{max:6,rl:1.4,unit:'globs',verb:'TAPPING MAGMA',d:'6 magma globs, then taps the vent for 1.4s.'},
 role:'Siege',blurb:'Cindercub, grown into a walking volcano. It stopped throwing fire and started moving the ground: magma arcs over walls, vents split the earth under you, and the caldera on its back is always about to blow.',
 moves:[
  {k:'LMB',n:'Magma Lob',t:'fire',pow:'22 + pool',cd:.6,d:'Lob a glob of magma in an arc to the cursor. It sails over trees and rocks, splashes, burns, and leaves a lava pool.'},
  {k:'RMB',n:'Fissure Vent',t:'ground',pow:'34 ×3',cd:6,d:'Crack a vent open at the cursor. After a beat it erupts three times, launching and burning anything standing on it.'},
  {k:'E',n:'Caldera',t:'fire',pow:90,cd:0,d:'Ring a wide area at the cursor with a wall of fire, then the center erupts in a huge blast 1.2s later.'}]},
{id:'dreadwhale',n:'Dreadwhale',types:['water','steel'],sz:1.25,stats:{hp:106,dmg:82,pdef:110,mdef:94,int:62,spe:54},cls:'mag',xp:150,draw:drawDreadwhale,states:['norm'],ammo:{max:4,rl:1.6,unit:'charges',verb:'LOADING CHARGES',d:'4 depth charges, then reloads for 1.6s.'},
 role:'Dreadnought',blurb:'Bulwhale, refitted for war. It traded the turret for a riveted steel hull, a deck cannon, and a habit of ramming first and asking never.',
 moves:[
  {k:'LMB',n:'Depth Charge',t:'water',pow:34,cd:.5,d:'Toss a mine to the cursor. It arms on landing and blasts the first foe that comes near (or pops after 6s). Up to 4 out at once.'},
  {k:'RMB',n:'Ram Tide',t:'steel',pow:50,cd:5,d:'Surge forward on a wave, smashing and stunning the first foe you hit and leaving a slowing wake behind you.'},
  {k:'E',n:'Broadside',t:'water',pow:'20 ×15',cd:0,d:'Brace and fire three thundering volleys from the deck cannon: wide fans of shells toward the cursor.'}]},
{id:'verdryad',n:'Verdryad',types:['grass','fairy'],sz:1.2,stats:{hp:90,dmg:100,pdef:72,mdef:106,int:98,spe:74},cls:'mag',xp:150,draw:drawVerdryad,states:['norm'],ammo:{max:8,rl:1.3,unit:'lashes',verb:'REGROWING VINES',d:'8 lashes, then regrows its vines for 1.3s.'},
 role:'Warden',blurb:'Verdivy in full bloom. It stopped planting turrets and started commanding the forest itself: living whips, roots that grab your ankles, and a flower that heals whoever stands beneath it.',
 moves:[
  {k:'LMB',n:'Thorn Lash',t:'grass',pow:'28 / 38',cd:.38,d:'Crack a long vine whip ahead of you. It hits everything along the lash, and the tip hits harder.'},
  {k:'RMB',n:'Root Snare',t:'grass',pow:34,cd:5,d:'Send roots racing along the ground. The first foe they reach is rooted in place (nearly frozen) for 1.4s.'},
  {k:'E',n:'Elder Bloom',t:'fairy',pow:'22 / pulse',cd:0,d:'Grow a giant flower where you stand for 6s. Inside its petals you heal 3% HP a second, and foes are slowed and stung by fairy pulses.'}]});
for(const m of MONS.slice(-3))MON[m.id]=m;
MON.cindercub.evo={lv:14,to:'calderursa'};MON.bulwhale.evo={lv:14,to:'dreadwhale'};MON.verdivy.evo={lv:14,to:'verdryad'};
Object.assign(ANIM,{calderursa:{k:'flicker',fps:5},dreadwhale:{k:'breathe',fps:2.5},verdryad:{k:'sway',fps:2.5}});
const FIRE2={},RING2={};
/* ---------- CALDERURSA ---------- */
function lavaLob(f,x,y){const sx=f.x+Math.cos(f.aim)*8,sy=f.y-18,d=Math.hypot(x-sx,y-sy),T=.3+d/520;ring(x,y,18,'#f47a18',T,'tele',{own:f});ring(sx,sy,0,'#f47a18',T,'llob',{sx,sy,ex:x,ey:y,h:20+d*.28});
  later(f,T,()=>{ring(x,y,20,'#f47a18',.3,'nova');fx(x,y-2,'#f8c040',14,100,.4,2,20);for(const t of foes(f))if(Math.hypot(t.x-x,t.y-y)<=18+t.r)hit(f,t,22,'fire',{kb:60,ka:Math.atan2(t.y-y,t.x-x),st:{burn:2}});
    for(const p of G.pods)if(p.owner!==f&&Math.hypot(p.x-x,p.y-y)<24)hurtPod(p,24*f.unit.dmg/f.unit.mdef*LF(f.unit.lv)*1.2);if(!solidWalk(x,y))G.fires.push({x,y,r:12,life:2.5,owner:f,seed:Math.random()*6});sfx('splash')})}
RING2.llob=r=>{const k=1-r.life/r.max,q=Math.min(1,k),x=r.sx+(r.ex-r.sx)*q,gy=r.sy+(r.ey-r.sy)*q,y=gy-Math.sin(PI*q)*r.h;ctx.globalAlpha=.3;pell(x,gy+2,3,1,'#000');ctx.globalAlpha=1;
  pcirc(x,y,3.8,'#5a1000');pcirc(x,y,3,'#d03a10');pcirc(x-.5,y-.5,1.8,'#f8a030');ctx.fillStyle='#fff6c0';ctx.fillRect(Math.round(x)-1,Math.round(y)-1,1,1);G.parts.push({x,y,vx:0,vy:-10,life:.25,max:.25,col:Math.random()<.5?'#f47a18':'#f8c040',sz:1})};
KIT.calderursa={
  act(f,c){const u=f.unit;
    if(c.r&&u.cd[1]<=0){u.cd[1]=6*cdM(u);const p=reach(f,c.tx,c.ty,170);f.slamT=.3;ring(p.x,p.y,30,'#f47a18',.55,'tele',{own:f});fx(p.x,p.y,'#443c48',10,60,.4,2);sfx('charge');
      for(let i=0;i<3;i++)later(f,.55+i*.4,()=>{nova(f,p.x,p.y-2,{r:30,pow:34,type:'ground',kb:180,st:{burn:2}});fx(p.x,p.y-6,'#f8c040',18,150,.5,2,60);fx(p.x,p.y,'#2a2430',8,80,.4,2,30);if(!solidWalk(p.x,p.y))G.fires.push({x:p.x,y:p.y,r:14,life:1.2,owner:f,seed:Math.random()*6});G.shake=Math.max(G.shake,3)})}
    if(c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<=0)startReload(f);else{u.ammo--;u.cd[0]=.6;f.slamT=Math.max(f.slamT||0,.15);let p=reach(f,c.tx,c.ty,220);if(Math.hypot(p.x-f.x,p.y-f.y)<40)p={x:f.x+Math.cos(c.aim)*40,y:f.y+Math.sin(c.aim)*40};lavaLob(f,p.x,p.y);sfx('boom');if(u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);const p=reach(f,c.tx,c.ty,210),R=72;f.root=.5;f.slamT=.6;ring(p.x,p.y,R,'#f83838',1.2,'tele',{own:f});
      for(let i=0;i<16;i++){const a=i/16*6.283,x=p.x+Math.cos(a)*R,y=p.y+Math.sin(a)*R*.95;if(!solidWalk(x,y))G.fires.push({x,y,r:11,life:3.6,owner:f,seed:Math.random()*6})}
      later(f,1.2,()=>{nova(f,p.x,p.y,{r:R,pow:90,type:'fire',kb:260,st:{burn:3}});fx(p.x,p.y-10,'#f8c040',40,260,.7,2,80);fx(p.x,p.y,'#2a2430',20,160,.6,2,40);G.shake=Math.max(G.shake,9);G.flash=Math.max(G.flash,.15)});sfx('charge')}},
  move(f){return 1}};
AIK.calderursa=function(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
  if(u.ult>=100&&d<220&&Math.random()<dt*D.agg*2)c.e=1;
  else if(u.cd[1]<=0&&d<180&&Math.random()<dt*D.agg*3)c.r=1;
  if(d<230&&d>30&&u.cd[0]<=0&&ai.react<=0){c.l=1;ai.react=D.react*.5}
  return{pref:160,aimTarget:1}};
/* ---------- DREADWHALE ---------- */
function mineBoom(f,m,big){m.done=1;nova(f,m.x,m.y,{r:big?32:22,pow:big?34:16,type:'water',kb:big?180:80});fx(m.x,m.y-4,'#e2f8ff',16,140,.4,2,40);fx(m.x,m.y,'#525a70',8,90,.3,2);G.shake=Math.max(G.shake,big?4:2)}
function mineTick(f){const M=f.mines;if(!M||!M.length)return;
  for(const m of M){if(m.fly){const dx=m.tx-m.x,dy=m.ty-m.y,d=Math.hypot(dx,dy),st=260*G.dt;if(d<=st||solidShot(m.x+dx/d*st,m.y+dy/d*st+4)){m.fly=0;m.arm=.25;fx(m.x,m.y,'#9ad0fc',6,50,.25);sfx('plant')}else{m.x+=dx/d*st;m.y+=dy/d*st}continue}
    m.arm-=G.dt;m.life-=G.dt;if(m.life<=0){mineBoom(f,m,0);continue}if(m.arm>0)continue;
    for(const t of foes(f))if(Math.hypot(t.x-m.x,t.y-m.y)<t.r+14){mineBoom(f,m,1);break}}
  f.mines=M.filter(m=>!m.done)}
FIRE2.wake={touch(fi,t){applySt(t,{slow:[.35,.4]})},draw(fi){const k=Math.min(1,fi.life*1.5);ctx.globalAlpha=.45*k;pell(fi.x,fi.y,fi.r,fi.r*.5,'#2a4f94');ctx.globalAlpha=.6*k;pell(fi.x,fi.y,fi.r*.7,fi.r*.32,'#58a0ec');ctx.globalAlpha=k;pring(fi.x,fi.y,fi.r*(.6+.4*((G.t*1.5+fi.seed)%1)),'#e2f8ff',3);ctx.globalAlpha=1}};
KIT.dreadwhale={
  act(f,c){const u=f.unit;
    if(c.r&&u.cd[1]<=0){u.cd[1]=5*cdM(u);const a=c.ra??c.aim;dash(f,a,{dist:150,t:.32,pow:50,type:'steel',kb:280,st:{stun:.45},stop:1});ring(f.x,f.y,18,'#58a0ec',.3,'nova');
      for(let i=0;i<6;i++)later(f,i*.055,()=>{if(!solidWalk(f.x,f.y))G.fires.push({x:f.x,y:f.y+2,r:13,life:2.5,owner:f,seed:Math.random()*6,fx2:'wake'});fx(f.x,f.y,'#e2f8ff',4,60,.25)});sfx('splash');return}
    if(c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<=0)startReload(f);else{u.ammo--;u.cd[0]=.5;f.slamT=.15;const p=reach(f,c.tx,c.ty,130);(f.mines=f.mines||[]).push({x:f.x,y:f.y-2,tx:p.x,ty:p.y,fly:1,arm:.25,life:6});
      if(f.mines.length>4){const o=f.mines.shift();fx(o.x,o.y,'#9ad0fc',6,40,.3)}sfx('dart');if(u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);f.root=1;f.slamT=1;for(let v=0;v<3;v++)later(f,.15+v*.32,()=>{for(let i=-2;i<=2;i++)shoot(f,f.aim+i*.17+(Math.random()-.5)*.05,{spd:310,pow:20,type:'water',r:4,life:.85,kind:'blob',kb:120});G.shake=Math.max(G.shake,4);fx(f.x+Math.cos(f.aim)*14,f.y-16+Math.sin(f.aim)*10,'#ffffff',10,120,.25);sfx('boom')})}},
  move(f){mineTick(f);return 1}};
AIK.dreadwhale=function(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
  if(u.ult>=100&&sight&&d<230&&Math.random()<dt*D.agg*2)c.e=1;
  else if(u.cd[1]<=0&&sight&&d>45&&d<160&&Math.random()<dt*D.agg*3)c.r=1;
  if(d<150&&u.cd[0]<=0&&ai.react<=0){c.l=1;ai.react=D.react*.6}
  return{pref:80,aimTarget:1}};
/* ---------- VERDRYAD ---------- */
const LASH_L=72;
function thornLash(f,a){const ca=Math.cos(a),sa=Math.sin(a),x0=f.x,y0=f.y-6,x1=x0+ca*rayLen(x0,y0+6,a,LASH_L),y1=y0+sa*rayLen(x0,y0+6,a,LASH_L);f.lashT=.16;f.lashA=a;f.lashL=Math.hypot(x1-x0,y1-y0);
  for(const t of foes(f)){if(segDist(t.x,t.y-6,x0,y0,x1,y1)>t.r+5)continue;const tip=Math.hypot(t.x-x0,t.y-6-y0)>f.lashL*.7;hit(f,t,tip?38:28,'grass',{kb:tip?140:60,ka:a,quiet:!tip});if(tip)fx(t.x,t.y-8,'#a8e070',8,90,.3)}
  for(const p of G.pods)if(p.owner!==f&&segDist(p.x,p.y-6,x0,y0,x1,y1)<8)hurtPod(p,24*f.unit.dmg/f.unit.mdef*LF(f.unit.lv)*1.2);sfx('swing')}
FIRE2.bloom={touch(fi,t){applySt(t,{slow:[.25,.3]});if((t.bloomCd||0)<=G.t){t.bloomCd=G.t+.7;hit(fi.owner,t,22,'fairy',{quiet:1,atk:fi.atk,lv:fi.lv,cls:'mag',stabTypes:['grass','fairy']});fx(t.x,t.y-8,'#ffa8cc',6,60,.3)}},
  draw(fi){const k=Math.min(1,fi.life*1.5,(6-fi.life)*4+.2),r=fi.r,sp=G.t*.3+fi.seed;ctx.globalAlpha=.3*k;pell(fi.x,fi.y,r,r*.55,'#62b84a');
    for(let i=0;i<8;i++){const a=sp+i*.785,x=fi.x+Math.cos(a)*r*.6,y=fi.y+Math.sin(a)*r*.33;ctx.globalAlpha=.6*k;pell(x,y,r*.32,r*.15,i%2?'#ee5c98':'#ffa8cc')}
    ctx.globalAlpha=k;pell(fi.x,fi.y,r*.2,r*.11,'#ecc030');pell(fi.x,fi.y-1,r*.1,r*.06,'#fff8c0');ctx.globalAlpha=.5*k;pring(fi.x,fi.y,r*(.3+.7*((G.t*.9)%1)),'#ffa8cc',3);ctx.globalAlpha=k*.8;pring(fi.x,fi.y,r,'#a8e070',2.5);ctx.globalAlpha=1}};
KIT.verdryad={
  act(f,c){const u=f.unit;
    if(c.r&&u.cd[1]<=0){u.cd[1]=5*cdM(u);shoot(f,c.aim,{spd:250,pow:34,type:'grass',r:4,life:.8,kind:'root',kb:0,st:{slow:[1.4,.88]}});const p=G.proj[G.proj.length-1];p.y=f.y-2;p.onHit=()=>{for(const t of foes(f))if(p.hit.has(t.unit)){popup(t.x,t.y-34,'ROOTED!','#a8e070',true);fx(t.x,t.y,'#6e4222',10,60,.4)}};sfx('plant')}
    if(c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<=0)startReload(f);else{u.ammo--;u.cd[0]=.38;thornLash(f,c.aim);if(u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);G.fires.push({x:f.x,y:f.y,r:64,life:6,owner:f,seed:Math.random()*6,fx2:'bloom',atk:u.dmg,lv:u.lv});ring(f.x,f.y,64,'#ffa8cc',.5,'nova');fx(f.x,f.y-10,'#ffa8cc',30,140,.6,2,30);sfx('plant')}},
  move(f){const u=f.unit;for(const fi of G.fires)if(fi.fx2==='bloom'&&fi.owner===f&&Math.hypot(f.x-fi.x,f.y-fi.y)<fi.r&&u.hp<u.max){u.hp=Math.min(u.max,u.hp+u.max*.03*G.dt);if(Math.random()<.15)G.parts.push({x:f.x+(Math.random()-.5)*12,y:f.y-6-Math.random()*14,vx:0,vy:-20,life:.5,max:.5,col:'#70f8a8',sz:1})}return 1}};
AIK.verdryad=function(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
  if(u.ult>=100&&(d<90||u.hp<u.max*.5)&&Math.random()<dt*D.agg*3)c.e=1;
  if(u.cd[1]<=0&&sight&&d<190&&d>30&&Math.random()<dt*D.agg*3)c.r=1;
  else if(d<LASH_L-4&&sight&&u.cd[0]<=0&&ai.react<=0){c.l=1;ai.react=D.react*.4}
  return{pref:52,aimTarget:1}};
Object.assign(GEAR2,{
  verdryad:(f,a,ca,sa)=>{if(f.lashT>0){const k=1-f.lashT/.16,L=(f.lashL||LASH_L)*Math.min(1,k*2),bend=(1-k)*.6,x0=f.x,y0=f.y-6;let pv=[x0,y0];for(let i=1;i<=10;i++){const q=i/10,aa=f.lashA+bend*Math.sin(q*PI),x=x0+Math.cos(aa)*L*q,y=y0+Math.sin(aa)*L*q;pline(pv[0],pv[1],x,y,i>8?1:2,i%3?'#2e6a28':'#62b84a');pv=[x,y]}ctx.fillStyle='#ffa8cc';ctx.fillRect(Math.round(pv[0]),Math.round(pv[1]),2,2)}},
  dreadwhale:(f)=>{for(const m of f.mines||[]){const y=m.fly?m.y-6:m.y;pell(m.x,m.y+3,4,1.2,'rgba(0,0,0,.25)');pcirc(m.x,y,4,'#22283a');pcirc(m.x,y,3,'#525a70');pcirc(m.x-1,y-1,1.2,'#aab4cc');
    if(!m.fly){const on=m.arm<=0&&Math.floor(G.t*(m.life<1.5?12:4))%2;ctx.fillStyle=on?'#f85838':'#7a2a2a';ctx.fillRect(Math.round(m.x),Math.round(y)-4,1,1)}for(const[dx,dy]of[[-4,0],[4,0],[0,-4]]){ctx.fillStyle='#7c86a2';ctx.fillRect(Math.round(m.x+dx),Math.round(y+dy),1,1)}}}});
Object.assign(SPECIAL2,{
  calderursa:f=>[f.unit.cd[1]>0?'VENT '+f.unit.cd[1].toFixed(1)+'s':'VENT READY',1-f.unit.cd[1]/6],
  dreadwhale:f=>['MINES '+(f.mines||[]).length+'/4 · '+(f.unit.cd[1]>0?'RAM '+f.unit.cd[1].toFixed(1)+'s':'RAM READY'),1-f.unit.cd[1]/5],
  verdryad:f=>{const bl=G.fires.find(q=>q.fx2==='bloom'&&q.owner===f);return[bl?'BLOOM '+bl.life.toFixed(1)+'s':f.unit.cd[1]>0?'SNARE '+f.unit.cd[1].toFixed(1)+'s':'SNARE READY',bl?bl.life/6:1-f.unit.cd[1]/5]}});
{const _d2=drawProj2;drawProj2=function(p){if(p.kind==='root'){const x=Math.round(p.x),y=Math.round(p.y);for(let i=0;i<5;i++){const t=p.t*40+i;ctx.fillStyle=i%2?'#6e4222':'#2e6a28';ctx.fillRect(Math.round(p.x-p.vx*i*.012+Math.sin(t)*2),Math.round(p.y-p.vy*i*.012+Math.cos(t)*1.5),2,2)}ctx.fillStyle='#a8e070';ctx.fillRect(x,y-1,2,2);if(Math.random()<.5)G.parts.push({x:p.x,y:p.y+2,vx:0,vy:-6,life:.3,max:.3,col:'#8a6234',sz:1});return true}return _d2(p)}}
/* ---------- evolution: dialog scene after trainer battles, live transform mid-route ---------- */
async function evolveScene(c){const E=MON[c.id]&&MON[c.id].evo;if(!E||c.lv<E.lv)return;const om=MON[c.id],nm=MON[E.to];
  sfx('charge');await say('What? '+om.n.toUpperCase()+' is evolving!');sfx('ult');
  c.id=E.to;c.hp=null;showLvl(nm,c.lv,calcStats(om,c.lv),calcStats(nm,c.lv));
  await say('Congratulations! Your '+om.n.toUpperCase()+' evolved into '+nm.n.toUpperCase()+'!');
  await say(nm.n.toUpperCase()+' learned '+nm.moves.map(m=>m.n.toUpperCase()).join(', ')+'!');hideLvl();if(typeof saveGame==='function')saveGame()}
function evolveLive(P,u,c){const E=MON[c.id]&&MON[c.id].evo;if(!E||c.lv<E.lv)return;const om=u.m,nm=MON[E.to],k=u.hp/u.max;
  c.id=E.to;Object.assign(u,{m:nm,id:E.to},calcStats(nm,c.lv));u.hp=Math.round(u.max*Math.max(k,.6));u.ammo=nm.ammo.max;u.rl=0;u.cd=[0,0];resetTransient(P);P.invuln=Math.max(P.invuln,1.2);
  G.banner={txt:'EVOLVED!',who:nm.n,col:TC[nm.types[0]],t:2,side:0};G.flash=Math.max(G.flash,.3);ring(P.x,P.y-10,34,'#ffffff',.6,'nova');fx(P.x,P.y-12,'#ffffff',40,160,.7,2,40);fx(P.x,P.y-12,TC[nm.types[0]],24,120,.6,2,30);sfx('ult');
  if(typeof toast==='function')toast(om.n.toUpperCase()+' evolved into '+nm.n.toUpperCase()+'!');HUD.side[0].last=null;buildHud&&buildHud()}
