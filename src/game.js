/* ================= TYPES ================= */
const TYPES=['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
const TC={normal:'#a8a878',fire:'#f08030',water:'#6890f0',electric:'#f8d030',grass:'#78c850',ice:'#98d8d8',fighting:'#c03028',poison:'#a040a0',ground:'#e0c068',flying:'#a890f0',psychic:'#f85888',bug:'#a8b820',rock:'#b8a038',ghost:'#705898',dragon:'#7038f8',dark:'#705848',steel:'#b8b8d0',fairy:'#ee99ac'};
const CHART={
 normal:{rock:.5,ghost:0,steel:.5},
 fire:{fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5,steel:2},
 water:{fire:2,water:.5,grass:.5,ground:2,rock:2,dragon:.5},
 electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5},
 grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5,steel:.5},
 ice:{fire:.5,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2,steel:.5},
 fighting:{normal:2,ice:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0,dark:2,steel:2,fairy:.5},
 poison:{grass:2,poison:.5,ground:.5,rock:.5,ghost:.5,steel:0,fairy:2},
 ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2,steel:2},
 flying:{electric:.5,grass:2,fighting:2,bug:2,rock:.5,steel:.5},
 psychic:{fighting:2,poison:2,psychic:.5,dark:0,steel:.5},
 bug:{fire:.5,grass:2,fighting:.5,poison:.5,flying:.5,psychic:2,ghost:.5,dark:2,steel:.5,fairy:.5},
 rock:{fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2,steel:.5},
 ghost:{normal:0,psychic:2,ghost:2,dark:.5},
 dragon:{dragon:2,steel:.5,fairy:0},
 dark:{fighting:.5,psychic:2,ghost:2,dark:.5,fairy:.5},
 steel:{fire:.5,water:.5,electric:.5,ice:2,rock:2,steel:.5,fairy:2},
 fairy:{fire:.5,fighting:2,poison:.5,dragon:2,dark:2,steel:.5}
};
const EFFV={2:1.6,.5:.6,0:.3};
function chartEff(atk,defs){let m=1;for(const d of defs){const v=CHART[atk][d];if(v!==undefined)m*=v}return m}
function eff(atk,defs){let m=1;for(const d of defs){const v=CHART[atk][d];if(v!==undefined)m*=EFFV[v]}return Math.round(m*100)/100}
function effTxt(e){return e===1?'1×':e+'×'}

/* ================= CREATURES ================= */
const PI=Math.PI;
const SPEED=s=>40+s*.75;
const LF=L=>(0.4*L+2)/22;
function calcStats(m,L){const b=m.stats,f=x=>Math.floor(2*x*L/100)+5;return{max:Math.round((Math.floor(2*b.hp*L/100)+L+10)*3.4),dmg:f(b.dmg),pdef:f(b.pdef),mdef:f(b.mdef),int:f(b.int),spe:f(b.spe)}}
function moveSpeed(u){return 60+.35*u.m.stats.spe+.3*u.spe}
function cdM(u){return 1/(1+u.int/200)}
function intM(u){return 1+u.int/200}
const XPN=L=>L*L*L;
const MONS=[
{id:'bulwhale',n:'Bulwhale',types:['water'],stats:{hp:95,dmg:70,pdef:100,mdef:85,int:55,spe:45},cls:'mag',xp:64,draw:drawBulwhale,states:['norm','turret'],ammo:{max:100,rl:1.8,unit:'tank',verb:'REFILLING...',d:'Water tank 100. Blob uses 20, the stream drains 32/s.'},
 role:'Tank',blurb:'A barnacle-armored whale calf. Plants itself into a water turret that shreds anything in its line.',
 moves:[
  {k:'LMB',n:'Water Blob',t:'water',pow:34,cd:.6,d:'Fast blob of water that shoves the target. Costs 20 water.'},
  {k:'LMB',n:'Water Gun',t:'water',pow:'5 ×10/s',cd:0,d:'Turret only. Hold to spray a hose stream that bends as you turn, slows, and pushes foes far back. Drains 32 water/s.',mode:'turret'},
  {k:'RMB',n:'Turret Mode',t:'water',pow:'—',cd:.5,d:'Root in place: cannot move, takes 35% less damage, ignores knockback. Right-click again to walk. Works with any amount of water.'},
  {k:'E',n:'Hydro Cannon',t:'water',pow:'16 ×13',cd:0,d:'A wide high-pressure beam that follows your aim. Roots you while firing.'}]},
{id:'fistinel',n:'Fistinel',types:['steel','fighting'],stats:{hp:80,dmg:100,pdef:95,mdef:55,int:60,spe:70},cls:'phys',xp:70,draw:drawFistinel,states:['norm','guard'],ammo:{max:12,rl:1.1,unit:'jabs',verb:'CATCHING BREATH',d:'12 jabs, then catches its breath for 1.1s.'},
 role:'Brawler',blurb:'A visored sentinel with forge-hammered gauntlets. Soaks hits behind its guard, then fires them back.',
 moves:[
  {k:'LMB',n:'Flurry Jab',t:'fighting',pow:'10 / 18',cd:.13,d:'Hold for rapid close-range punches. Every 3rd jab hits harder and knocks back.'},
  {k:'RMB',n:'Guard Up',t:'steel',pow:'—',cd:4,d:'Raise your gauntlets: take 75% less damage and move slowly. Blocked damage is stored.'},
  {k:'LMB',n:'Counter Blast',t:'steel',pow:'45 + stored',cd:0,d:'While guarding. Fire a steel shockwave powered by 70% of what you blocked, ending the guard.',mode:'guard'},
  {k:'E',n:'Flying Kick',t:'fighting',pow:130,cd:0,d:'Leap at the cursor untouchable. Stuns on contact, then a landing shockwave.'}]},
{id:'frostbunt',n:'Frostbunt',types:['fairy','ice'],stats:{hp:60,dmg:95,pdef:50,mdef:70,int:90,spe:95},cls:'phys',xp:66,draw:drawFrostbunt,states:['norm'],ammo:{max:6,rl:1.3,unit:'swings',verb:'REFREEZING BAT',d:'The icicle bat survives 6 swings, then refreezes for 1.3s.'},
 role:'Trickshot',blurb:'A snow hare with an icicle bat. Its swing barely tickles, but a batted snowball hits like a truck.',
 moves:[
  {k:'LMB',n:'Bunt Swing',t:'fairy',pow:6,cd:.36,d:'Weak swing. If your snowball is in reach, it gets batted toward the cursor.'},
  {k:'RMB',n:'Snowball',t:'ice',pow:'18 → 330',cd:.3,d:'Summon a snowball, then right-click while next to it to pack it bigger, up to 12 times. Bigger balls hit much harder but fly a little slower. A marker always shows where your ball is. It shatters on hit and bounces off trees.'},
  {k:'E',n:'Blizzard Homer',t:'ice',pow:330,cd:0,d:'For 7s your snowball homes in on the enemy and flies faster. Instantly fully charges it, and summons one if you have none.'}]},
{id:'verdivy',n:'Verdivy',types:['grass'],stats:{hp:75,dmg:80,pdef:60,mdef:95,int:90,spe:65},cls:'mag',xp:64,draw:drawVerdivy,states:['norm'],ammo:{max:10,rl:1.4,unit:'darts',verb:'REGROWING DARTS',d:'10 darts, then regrows them for 1.4s.'},
 role:'Summoner',blurb:'A bloom-hooded dryad. Charges seeds with every dart, then plants biting Thornpods across the field.',
 moves:[
  {k:'LMB',n:'Grass Dart',t:'grass',pow:9,cd:.2,d:'Quick weak darts. Each shot charges half a seed, each hit one more. 8 seeds to fill.'},
  {k:'RMB',n:'Thornpod',t:'grass',pow:'20 per bite',cd:.5,d:'With full seeds, plant a turret at the cursor. Lasts 12s, 90 HP, max 3 at once.'},
  {k:'E',n:'Garden of Thorns',t:'grass',pow:'4 pods',cd:0,d:'Instantly plant four Thornpods around you that last 9s.'}]},
{id:'snipant',n:'Snipant',types:['bug'],stats:{hp:55,dmg:70,pdef:70,mdef:45,int:45,spe:90},cls:'phys',xp:45,draw:drawSnipant,states:['norm','snap'],ammo:{max:8,rl:1,unit:'snaps',verb:'JAWS TIRED',d:'8 snaps, then its jaws rest for 1s.'},
 role:'Skirmisher',blurb:'A brick-red worker ant from the tall grass. Small, quick, and all jaw. It darts in, pinches, and darts out.',
 moves:[
  {k:'LMB',n:'Pincer',t:'bug',pow:16,cd:.3,d:'Snap the mandibles shut on anything right in front of you.'},
  {k:'RMB',n:'Scuttle',t:'bug',pow:'—',cd:3.5,d:'Dash a short way toward the cursor.'},
  {k:'E',n:'Frenzy',t:'bug',pow:'—',cd:0,d:'For 4s: pinch twice as fast, never tire, and run 30% faster.'}]},
{id:'scrattle',n:'Scrattle',types:['normal'],stats:{hp:58,dmg:75,pdef:55,mdef:50,int:55,spe:100},cls:'phys',xp:50,draw:drawScrattle,states:['norm'],ammo:{max:10,rl:.9,unit:'scratches',verb:'SHARPENING CLAWS',d:'10 scratches, then sharpens its claws for 0.9s.'},
 role:'Skirmisher',blurb:'A scrappy field rat with a whip of a tail. Scratches up close, then spins its tail to clear everyone off.',
 moves:[
  {k:'LMB',n:'Scratch',t:'normal',pow:15,cd:.26,d:'Quick claw swipe right in front of you.'},
  {k:'RMB',n:'Tail Swing',t:'normal',pow:48,cd:5,d:'Wind up for 0.45s (you can keep moving), then whip your tail in a big circle around you that knocks foes away.'},
  {k:'E',n:'Super Fang',t:'normal',pow:'40% HP',cd:0,d:'Lunge at the cursor untouchable. The bite takes 40% of the target\'s current HP (at least 30).'}]},
{id:'cindercub',n:'Cindercub',types:['fire'],stats:{hp:78,dmg:100,pdef:70,mdef:72,int:65,spe:62},cls:'mag',xp:64,draw:drawCindercub,states:['norm','charge'],ammo:{max:7,rl:1.3,unit:'blasts',verb:'STOKING EMBERS',d:'7 fire blasts, then stokes its embers for 1.3s.'},
 role:'Artillery',blurb:'A coal-pawed bear cub with a mane that never goes out. Peppers foes with embers and sets the ground ablaze.',
 moves:[
  {k:'LMB',n:'Fire Blast',t:'fire',pow:15,cd:.32,d:'A little ball of fire. 20% chance to burn the target.'},
  {k:'RMB',n:'Charged Fireball',t:'fire',pow:'25 → 95',cd:4,d:'Hold to charge (up to 1.2s), release to throw. Bigger fireballs hit harder, explode wider and burn longer. You move slower while charging.'},
  {k:'E',n:'Ground Slam',t:'fire',pow:55,cd:0,d:'Slam the ground: a wide cone in front of you erupts, burning foes and leaving the grass on fire for 3s.'}]},
{id:'umbrynx',n:'Umbrynx',types:['dark'],stats:{hp:58,dmg:104,pdef:65,mdef:70,int:85,spe:115},cls:'phys',xp:78,draw:drawUmbrynx,states:['norm','rush'],ammo:{max:4,rl:1.2,unit:'volleys',verb:'GATHERING SHADE',d:'4 volleys of 3 bolts, then gathers shade for 1.2s. Free during Eclipse Rush.'},
 role:'Assassin',blurb:'A lynx made of dusk, with a crescent-moon blade for a tail. Rarely seen, never heard, and somehow always a step ahead of you.',
 moves:[
  {k:'LMB',n:'Night Burst',t:'dark',pow:'11×3',cd:.5,d:'Fire three quick shade bolts in a tight burst.'},
  {k:'RMB',n:'Crescent Cleave',t:'dark',pow:55,cd:4,d:'Plant your feet (0.6s) while a red danger zone marks a huge 240° arc, then sweep the blade tail through it with heavy knockback. Faster wind-up during Eclipse Rush.'},
  {k:'E',n:'Eclipse Rush',t:'dark',pow:'—',cd:0,d:'For 5s: run 65% faster, burst twice as fast at no ammo cost, and Cleave recharges in 1.6s.'}]},
{id:'voltusk',n:'Voltusk',types:['rock','electric'],stats:{hp:104,dmg:88,pdef:105,mdef:74,int:50,spe:60},cls:'phys',xp:72,draw:drawVoltusk,states:['norm','roll','charge'],ammo:{max:8,rl:1.2,unit:'gores',verb:'PAWING THE GROUND',d:'8 tusk gores, then paws the ground for 1.2s.'},
 role:'Juggernaut',blurb:'A stone-backed boar whose lodestone tusks hum with static. It curls into a boulder and builds speed until something, or someone, stops it.',
 moves:[
  {k:'LMB',n:'Tusk Spark',t:'electric',pow:'20 + 10',cd:.42,d:'Hook your tusks through anything in front of you. Each gore also throws a short spark bolt ahead.'},
  {k:'RMB',n:'Boulder Roll',t:'rock',pow:'20 → 85',cd:5,d:'Curl into a boulder that rolls toward the cursor and keeps speeding up. Turning sharply bleeds momentum. Rams hit harder the faster you go and stun at high speed. Hit a wall too fast and you CRASH, stunning yourself. Takes 30% less damage while rolling.'},
  {k:'RMB',n:'Discharge',t:'electric',pow:'18 → 50',cd:0,d:'While rolling. Uncurl and dump your momentum as an electric shockwave that slows. Also happens when the roll runs out (3.2s).',mode:'roll'},
  {k:'E',n:'Fault Spark',t:'rock',pow:75,cd:0,d:'Rear up (0.75s) while a long danger line marks your aim, then split the earth along it: everything on the line takes a heavy hit and is stunned, and sparks crackle down the fissure.'}]},
{id:'mesmamba',n:'Mesmamba',types:['poison','psychic'],stats:{hp:66,dmg:98,pdef:56,mdef:84,int:92,spe:64},cls:'mag',xp:74,draw:drawMesmamba,states:['norm','charge'],ammo:{max:6,rl:1.4,unit:'globs',verb:'REBREWING VENOM',d:'6 venom globs, then rebrews for 1.4s.'},
 role:'Mortar',blurb:'A coiled cobra whose hood is painted with staring eyes. It lobs venom over cover and holds you still with a look while the next glob comes down.',
 moves:[
  {k:'LMB',n:'Venom Lob',t:'poison',pow:'21 + pool',cd:.7,d:'Lob a glob of venom in an arc to the cursor. It flies OVER trees and rocks, a ring marks where it lands, and it leaves a toxic puddle for about 2s that hurts and slows.'},
  {k:'RMB',n:'Hypno Link',t:'psychic',pow:'5/tick → 28',cd:8,d:'Lock a psychic link onto the first foe along your aim. It slows them hard and ticks psychic damage. Hold it for 2s and it ends in a stunning Mind Crush. Breaking line of sight or range snaps it.'},
  {k:'E',n:'Acid Rain',t:'poison',pow:'22 ×11',cd:0,d:'Mark a wide circle at the cursor. After a short delay, eleven venom globs rain down inside it, flooding the ground with toxic puddles.'}]},
{id:'phantern',n:'Phantern',types:['ghost','flying'],stats:{hp:52,dmg:84,pdef:56,mdef:66,int:76,spe:118},cls:'phys',xp:74,draw:drawPhantern,states:['norm','veil'],ammo:{max:9,rl:1.1,unit:'quills',verb:'PREENING',d:'9 pairs of quills, then preens for 1.1s. Free while veiled.'},
 role:'Harrier',blurb:'A sea tern that never came back from the fog. It hovers over hazards, reels foes in on a grave-chain, and blinks out of sight when things turn.',
 moves:[
  {k:'LMB',n:'Wisp Quills',t:'flying',pow:'10 ×2',cd:.36,d:'Flick two spectral quills in a narrow spread.'},
  {k:'RMB',n:'Grave Hook',t:'ghost',pow:26,cd:4.5,d:'Throw a chain hook. Catch a foe and you yank it to you, briefly stunned. Catch a tree, rock or Thornpod and you grapple yourself over to it instead.'},
  {k:'E',n:'Phantom Veil',t:'ghost',pow:'—',cd:0,d:'Fade out for 4.5s: nearly invisible, enemies lose track of you, move 35% faster, quills cost nothing and fire faster. Hovering also keeps you above burning and toxic ground.'}]},
];
MONS.push({id:'hexwyrm',n:'Hexwyrm',types:['dragon','fire'],stats:{hp:120,dmg:100,pdef:90,mdef:90,int:80,spe:50},cls:'mag',xp:220,draw:drawHexwyrm,states:['norm','immune'],boss:1,ammo:{max:1,rl:1,unit:'—',verb:'',d:'—'},role:'Calamity',
  blurb:'A dragon of violet flame the Coil tried to bind with the lighthouse lamp. It answers to no one.',moves:[{k:'LMB',n:'Hexfire',t:'fire',pow:40,cd:0,d:'Fireballs.'},{k:'RMB',n:'Rift Cleave',t:'dragon',pow:80,cd:0,d:'Half-arena cleave.'},{k:'E',n:'Wyrm Beam',t:'dragon',pow:9,cd:0,d:'Slow-tracking beam.'}]});
const MON={};MONS.forEach(m=>MON[m.id]=m);const ROSTER=()=>MONS.filter(m=>!m.boss);

/* ================= SPRITES ================= */
const SPR={};let FIST_CV,POD_CV,POD_OPEN,BALL_CV,BALL_GLOW,TALL_OVER;
function buildSprites(){
  for(const m of MONS){SPR[m.id]={};for(const st of m.states){SPR[m.id][st]={};for(const d of['down','up','left']){SPR[m.id][st][d]=[];SPR[m.id][st].right=SPR[m.id][st].right||[];for(const fr of[0,1]){const g=m.draw(d,fr,st);SPR[m.id][st][d].push({c:toCv(g),w:whiteCv(g)});if(d==='left'){const h=flipH(g);SPR[m.id][st].right.push({c:toCv(h),w:whiteCv(h)})}
        if(fr===0){const idl=idleFrames(m.id,g);SPR[m.id][st][d].idle=idl.map(q=>({c:toCv(q),w:whiteCv(q)}));if(d==='left')SPR[m.id][st].right.idle=idl.map(q=>{const h=flipH(q);return{c:toCv(h),w:whiteCv(h)}})}}}}}
  FIST_CV=toCv(drawFist());POD_CV=toCv(drawPod(0));POD_OPEN=toCv(drawPod(1));BALL_CV=toCv(drawBall(0));BALL_GLOW=toCv(drawBall(1));
  TALL_OVER=mkCanvas(32,10);const tc=TALL_OVER.getContext('2d');tileTall(0,-6,0,0,tc,true);tileTall(16,-6,1,0,tc,true);
}
function portrait(cv,id,st='norm',dir='down'){cv.width=32;cv.height=32;const x=cv.getContext('2d');x.imageSmoothingEnabled=false;x.clearRect(0,0,32,32);x.drawImage(SPR[id][st][dir][0].c,0,0,32,32)}

/* ================= STATE ================= */
let W=480,H=270;
const BW=600,BH=338;
function setView(w,h){if(W===w&&H===h)return;W=w;H=h;cv.width=w;cv.height=h;ctx.imageSmoothingEnabled=false;fit()}
let G=null,ctx=null,MAP=null,WORLD=[null,null];
const K={},M={sx:240,sy:135,x:0,y:0,l:false,lpAt:-9,rAt:-9};
const DIFF={easy:{react:1.2,err:.6,agg:.22,lead:0,dodge:0,idle:.45,spd:.75,swap:0,turn:1.6},normal:{react:.55,err:.26,agg:.4,lead:.3,dodge:.25,idle:0,spd:1,swap:0,turn:3.2},hard:{react:.24,err:.1,agg:.9,lead:.75,dodge:.65,idle:0,spd:1,swap:1,turn:7}};
const SPAWN=[{x:30*16+8,y:27*16+8},{x:50*16+8,y:23*16+8}];
function rollHt(){return Math.round((.9+Math.random()*.2)*100)/100}
function mkUnit(id,L=50,hp,ht){const m=MON[id],st=calcStats(m,L);return Object.assign({m,id,lv:L,cd:[0,0],ult:0,ammo:m.ammo.max,rl:0,ht:ht||rollHt()},st,{hp:hp==null?st.max:Math.min(st.max,hp)})}
function mkFighter(side,ids,diff){
  return{side,team:ids.map(x=>typeof x==='string'?mkUnit(x):mkUnit(x.id,x.lv,x.hp,x.ht)),idx:0,unit:null,used:new Set([0]),x:(SPAWN[side]||SPAWN[1]).x,y:(SPAWN[side]||SPAWN[1]).y,vx:0,vy:0,kvx:0,kvy:0,r:7,aim:side?PI:0,dir:side?'left':'right',
    st:{slowT:0,slowA:0,stun:0,stunImm:0,burn:0},invuln:1,channel:0,root:0,dash:null,hurt:0,swapCd:0,faintT:0,effCd:0,walk:0,
    mode:'norm',absorbed:0,guardT:0,jab:0,punchT:0,swingT:0,seeds:0,homerT:0,stream:null,
    dealt:0,kos:0,ai:side?{d:DIFF[diff],react:.5,strT:0,str:1,think:1,seen:null,stuck:0,lastX:0,lastY:0,detour:0,detourA:0,modeT:0}:null};
}
function newGame(pIds,eIds,diff){
  G={t:0,start:2.2,f:eIds.length?[mkFighter(0,pIds,diff),mkFighter(1,eIds,diff)]:[mkFighter(0,pIds,diff)],fires:[],proj:[],beams:[],rings:[],parts:[],texts:[],ghosts:[],timers:[],pods:[],balls:[],
    cam:{x:0,y:0},shake:0,flash:0,hitstop:0,banner:null,over:0,overT:0,winner:-1,diff,pIds,eIds,paused:false,time:0};
  for(const f of G.f){f.unit=f.team[0]}
  const p=G.f[0];G.cam.x=clamp(p.x-W/2,0,WW-W);G.cam.y=clamp(p.y-H/2,0,WH-H);
}
const foes=f=>G.f.filter(o=>o!==f&&o.side!==f.side&&alive(o));
function nearestFoe(f,max=1e9){let b=null,bd=max;for(const o of foes(f)){const d=dist(f,o);if(d<bd){bd=d;b=o}}return b}
const opp=f=>{if(f.target&&alive(f.target)&&f.target.side!==f.side)return f.target;return nearestFoe(f)};
const alive=f=>!!f&&!!f.unit&&f.unit.hp>0&&f.faintT<=0;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const angDiff=(a,b)=>{let d=a-b;while(d>PI)d-=2*PI;while(d<-PI)d+=2*PI;return d};
const tileAt=(x,y)=>{const X=Math.floor(x/TS),Y=Math.floor(y/TS);return(X<0||Y<0||X>=MW||Y>=MH)?null:{X,Y}};
// trees are 'soft' in battle maps (walk/shot === 3): only the trunk blocks, so creatures slip past and behind canopies
const TRUNK_R=6;
function trunkAt(X,Y){for(const[dx,dy]of[[0,0],[-1,0],[0,-1],[-1,-1]]){const x=X+dx,y=Y+dy;if(MAP.obj[y]&&MAP.obj[y][x]===1)return{x:x*TS+16,y:y*TS+27}}return null}
function softTrees(M){if(!M||M.__soft)return;M.__soft=1;const H_=M.ground.length,W_=M.ground[0].length;
  for(let Y=0;Y<H_;Y++)for(let X=0;X<W_;X++){const o=M.obj[Y][X];if((o===1||o===9)&&M.walk[Y][X]===1&&[0,1,3,4,8,9].includes(M.ground[Y][X])){M.walk[Y][X]=3;if(M.shot[Y][X]===1)M.shot[Y][X]=3}}}
function solidWalk(x,y){const t=tileAt(x,y);if(!t)return true;const v=MAP.walk[t.Y][t.X];if(v===3){const tr=trunkAt(t.X,t.Y);return!!tr&&Math.hypot(x-tr.x,(y-tr.y)*1.5)<TRUNK_R+1}return v===1}
function solidShot(x,y){const t=tileAt(x,y);if(!t)return true;const v=MAP.shot[t.Y][t.X];if(v===3){const tr=trunkAt(t.X,t.Y);return!!tr&&Math.hypot(x-tr.x,(y+6-tr.y)*1.5)<TRUNK_R}return v===1}
function groundAt(x,y){const t=tileAt(x,y);return t?MAP.ground[t.Y][t.X]:0}
function los(a,b){const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.ceil(d/6);for(let i=1;i<n;i++){const k=i/n;if(solidShot(a.x+(b.x-a.x)*k,a.y+(b.y-a.y)*k))return false}return true}
function rayLen(x,y,a,max){for(let l=6;l<max;l+=4)if(solidShot(x+Math.cos(a)*l,y+Math.sin(a)*l))return l;return max}
function freeSpot(x,y,r=7){for(const[dx,dy]of[[0,0],[r,0],[-r,0],[0,r],[0,-r]])if(solidWalk(x+dx,y+dy))return false;return true}
function resolve(f){
  const r=f.r,x0=Math.floor((f.x-r)/TS),x1=Math.floor((f.x+r)/TS),y0=Math.floor((f.y-r)/TS),y1=Math.floor((f.y+r)/TS);
  let tr0=null;
  for(let Y=y0;Y<=y1;Y++)for(let X=x0;X<=x1;X++){if(X>=0&&Y>=0&&X<MW&&Y<MH&&MAP.walk[Y][X]===3){const tr=trunkAt(X,Y);if(tr&&(!tr0||tr0.x!==tr.x||tr0.y!==tr.y)){tr0=tr;const dx=f.x-tr.x,dy=(f.y-tr.y)*1.5,d=Math.hypot(dx,dy),mn=TRUNK_R+r*.75;if(d<mn){if(d<.01){f.y=tr.y+mn/1.5}else{f.x=tr.x+dx/d*mn;f.y=tr.y+dy/d*mn/1.5}}}continue}
    if(X>=0&&Y>=0&&X<MW&&Y<MH&&MAP.walk[Y][X]!==1)continue;
    const cx=clamp(f.x,X*TS,X*TS+TS),cy=clamp(f.y,Y*TS,Y*TS+TS),dx=f.x-cx,dy=f.y-cy,d=Math.hypot(dx,dy);
    if(d<r){if(d<.01){f.y=Y*TS+TS+r}else{f.x=cx+dx/d*r;f.y=cy+dy/d*r}}}
  f.x=clamp(f.x,r,WW-r);f.y=clamp(f.y,r,WH-r);if(solidWalk(f.x,f.y))unstickF(f)}
// nearest walkable tile centre (roomy: all 4 neighbours open too; box: must lie inside it)
function nearestOpen(x,y,roomy,box){const sx=Math.floor(x/TS),sy=Math.floor(y/TS),ok=(X,Y)=>X>0&&Y>0&&X<MW-1&&Y<MH-1&&MAP.walk[Y][X]!==1;
  for(let r=0;r<48;r++){let best=null,bd=1e9;for(let Y=sy-r;Y<=sy+r;Y++)for(let X=sx-r;X<=sx+r;X++){if(Math.max(Math.abs(X-sx),Math.abs(Y-sy))!==r||!ok(X,Y))continue;
      if(roomy&&!(ok(X+1,Y)&&ok(X-1,Y)&&ok(X,Y+1)&&ok(X,Y-1)))continue;const px_=X*TS+8,py_=Y*TS+10;if(box&&!(px_>box.x0+8&&px_<box.x1-8&&py_>box.y0+10&&py_<box.y1-6))continue;
      const d=Math.hypot(px_-x,py_-y);if(d<bd){bd=d;best={x:px_,y:py_}}}if(best)return best}return null}
function unstickF(f,roomy,box){const p=nearestOpen(f.x,f.y,roomy,box)||nearestOpen(f.x,f.y,0,box)||nearestOpen(f.x,f.y,0);if(p){f.x=p.x;f.y=p.y;f.kvx=0;f.kvy=0;if(f.dash)f.dash.t=0}return p}
function reach(f,tx,ty,max){let dx=tx-f.x,dy=ty-f.y,d=Math.hypot(dx,dy);if(d>max){dx*=max/d;dy*=max/d}return{x:f.x+dx,y:f.y+dy}}

/* ================= EFFECT HELPERS ================= */
function fx(x,y,col,n,spd,life,sz=1,up=0){for(let i=0;i<n;i++){const a=Math.random()*6.283,s=spd*(.3+Math.random()*.7);G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-up,life:life*(.6+Math.random()*.4),max:life,col,sz})}}
function ring(x,y,r,col,life=.3,kind='ring',extra){G.rings.push(Object.assign({x,y,r,col,life,max:life,kind},extra||{}))}
function popup(x,y,txt,col,small){G.texts.push({x:x+(Math.random()-.5)*6,y,txt:String(txt),col,life:.9,max:.9,small})}
function later(f,d,fn){G.timers.push({t:d,f,unit:f.unit,fn})}
function shoot(f,a,o){const n=o.n||1;for(let i=0;i<n;i++){const aa=a+(o.jit?(Math.random()-.5)*o.jit:0);
  G.proj.push({x:f.x+Math.cos(aa)*9,y:f.y-6+Math.sin(aa)*9,vx:Math.cos(aa)*o.spd,vy:Math.sin(aa)*o.spd,r:o.r||2,pow:o.pow,type:o.type,owner:f,unit:f.unit,life:o.life||1,kind:o.kind||'orb',st:o.st,kb:o.kb||40,hit:new Set(),t:0,onHit:o.onHit})}}
function cone(f,a,o){
  ring(f.x,f.y-6,o.range,o.col||TC[o.type],.12,'arc',{a,arc:o.arc});
  for(const p of G.pods)if(p.owner!==f&&Math.hypot(p.x-f.x,p.y-f.y)<o.range+6&&Math.abs(angDiff(Math.atan2(p.y-f.y,p.x-f.x),a))<o.arc/2+.3)hurtPod(p,o.pow*f.unit.dmg/f.unit.mdef*LF(f.unit.lv)*1.2);
  let any=false;for(const t of foes(f)){const d=dist(f,t);if(d>o.range+t.r)continue;if(Math.abs(angDiff(Math.atan2(t.y-f.y,t.x-f.x),a))>o.arc/2&&d>t.r+f.r)continue;
  if(hit(f,t,o.pow,o.type,{st:o.st,kb:o.kb||40,ka:Math.atan2(t.y-f.y,t.x-f.x),quiet:o.quiet})>=0)any=true}return any}
function nova(f,x,y,o){ring(x,y,o.r,TC[o.type],.32,'nova');fx(x,y-4,TC[o.type],Math.min(30,o.r*.6),o.r*2.2,.4);
  for(const p of G.pods)if(p.owner!==f&&Math.hypot(p.x-x,p.y-y)<o.r+6)hurtPod(p,o.pow*f.unit.dmg/f.unit.mdef*LF(f.unit.lv)*1.2);
  for(const t of foes(f))if(Math.hypot(t.x-x,t.y-y)<=o.r+t.r)hit(f,t,o.pow,o.type,{st:o.st,kb:o.kb||60,ka:Math.atan2(t.y-y,t.x-x)});sfx('boom')}
function dash(f,a,o){const t=o.t||.18,v=(o.dist||100)/t;f.dash={vx:Math.cos(a)*v,vy:Math.sin(a)*v,t,T:t,o,hit:false,tr:0};if(o.invuln)f.invuln=Math.max(f.invuln,t+.05);sfx('dash')}
function beam(f,a,o){const b={owner:f,unit:f.unit,a,o,t:0,tick:0,len:o.len};G.beams.push(b);if(!o.hold){f.channel=o.windup+o.dur;f.root=f.channel}sfx('charge');return b}
function applySt(t,st){if(!st)return;
  if(st.burn&&!t.unit.m.types.includes('fire')){if(t.st.burn<=0)popup(t.x,t.y-34,'BURNED!','#f47a18',true);t.st.burn=Math.max(t.st.burn,st.burn)}
  if(st.slow){t.st.slowT=Math.max(t.st.slowT,st.slow[0]);t.st.slowA=Math.max(st.slow[1],t.st.slowT>0?t.st.slowA:0)}
  if(st.stun&&!t.boss&&t.st.stunImm<=0&&t.st.stun<=0){t.st.stun=st.stun;t.dash=null;popup(t.x,t.y-34,'STUNNED','#f8d030',true)}}
function hit(src,tgt,pow,type,o={}){
  if(!alive(tgt)||tgt.invuln>0)return -1;
  const e=eff(type,tgt.unit.m.types);

  const cls=o.cls||src.unit.m.cls,atk=o.atk||src.unit.dmg,def=cls==='mag'?tgt.unit.mdef:tgt.unit.pdef,lf=LF(o.lv||src.unit.lv);
  const stab=(o.stabTypes||src.unit.m.types).includes(type)?1.2:1;
  let d=o.fixed!=null?o.fixed:pow*e*stab*atk/def*lf;
  if(tgt.mode==='turret')d*=.65;
  if(tgt.mode==='roll')d*=.7;
  if(tgt.mode==='guard'){const blocked=d*.75;tgt.absorbed+=blocked;d-=blocked;ring(tgt.x,tgt.y-6,13,'#e4ecfa',.15);fx(tgt.x+Math.cos(tgt.aim)*8,tgt.y-8+Math.sin(tgt.aim)*8,'#fff4b0',4,60,.2)}
  if(src.wild&&tgt.side===0&&typeof WILD_MULT!=='undefined')d*=WILD_MULT.dmg;
  d=Math.max(1,Math.round(d));
  tgt.unit.hp-=d;tgt.hurt=.1;tgt.hurtAt=G.t;src.dealt+=d;tgt.lastHit=src;if(G.route&&tgt.side!==0&&src.side===0)G.focus=tgt;if(G.route&&src.side!==0&&tgt.side===0)G.focus=src;
  if(!o.noUlt&&!ultBusy(src))src.unit.ult=Math.min(100,src.unit.ult+d/tgt.unit.max*140*intM(src.unit));if(!ultBusy(tgt))tgt.unit.ult=Math.min(100,tgt.unit.ult+d/tgt.unit.max*45*intM(tgt.unit));
  popup(tgt.x,tgt.y-24,d,e>1?'#f8e048':e<1?'#c0c0d0':'#ffffff',o.quiet);
  if(tgt.effCd<=0&&e!==1){popup(tgt.x,tgt.y-34,e>1?"IT'S SUPER EFFECTIVE!":e<.4?"IT BARELY TICKLED...":"NOT VERY EFFECTIVE...",e>1?'#f8a830':'#a0a0b0',true);tgt.effCd=.8}
  applySt(tgt,o.st);
  if(o.kb&&tgt.mode!=='turret'&&!tgt.boss){const k=o.kb*(tgt.mode==='guard'?.4:1);tgt.kvx+=Math.cos(o.ka)*k;tgt.kvy+=Math.sin(o.ka)*k;if(k>=80){tgt.stagger=Math.max(tgt.stagger||0,Math.min(.25,k/900));tgt.vx*=.3;tgt.vy*=.3}}
  fx(tgt.x,tgt.y-8,TC[type],o.quiet?3:7,70,.3);
  if(!o.quiet){G.shake=Math.min(5,G.shake+d/tgt.unit.max*22);if(d>=tgt.unit.max*.14)G.hitstop=.05}
  sfx('hit',e);
  if(tgt.unit.hp<=0)faint(tgt,src);
  return d}
function hurtPod(p,d){p.hp-=d;p.hurt=.1;fx(p.x,p.y-6,'#ee5c98',4,50,.3);if(p.hp<=0)p.dead=1}
function faint(t,src){if(G.route&&(t.wild||t.rtrainer)&&src&&src.side===0)routeXP(t);if(G.kos&&t.side===1&&t.unit.hp>-1e6)G.kos.push({id:t.unit.id,lv:t.unit.lv,used:[...G.f[0].used]});t.unit.hp=0;t.faintT=1.3;t.dash=null;t.channel=0;t.root=0;src.kos++;popup(t.x,t.y-38,t.unit.m.n.toUpperCase()+' FAINTED!','#f85858',true);fx(t.x,t.y-8,'#ffffff',24,90,.7);G.shake=6;G.hitstop=.12;sfx('ko');endModes(t)}
function endModes(f){f.link=null;f.mom=0;f.veilT=0;f.frenzyT=0;f.rushT=0;f.mode='norm';f.absorbed=0;f.stream=null;f.homerT=0;G.balls=G.balls.filter(b=>b.owner!==f)}
function resetTransient(f){f.st={slowT:0,slowA:0,stun:0,stunImm:0,burn:0};f.chargeT=0;f.charging=0;f.channel=0;f.root=0;f.dash=null;f.kvx=f.kvy=0;f.seeds=0;endModes(f)}
function matchScore(u,v){let off=0,def=0;for(const mv of u.m.moves)off=Math.max(off,eff(mv.t,v.m.types)*(u.m.types.includes(mv.t)?1.2:1));for(const mv of v.m.moves)def=Math.max(def,eff(mv.t,u.m.types)*(v.m.types.includes(mv.t)?1.2:1));return off-def+u.hp/u.max*.6}
function bringIn(f,i){f.idx=i;f.used.add(i);f.unit=f.team[i];resetTransient(f);f.invuln=1;ring(f.x,f.y-6,16,TC[f.unit.m.types[0]],.35,'nova');fx(f.x,f.y-8,'#ffffff',14,60,.4);sfx('swap')}
function nextUnit(f){if(f.wild){f.gone=1;return}const live=f.team.map((u,i)=>[u,i]).filter(([u])=>u.hp>0);
  if(!live.length&&f.ally){f.reviveT=10;return}
  if(f.boss){f.gone=1;bossDefeated(f);return}
  if(!live.length&&f.rtrainer){f.gone=1;routeTrainerWon(f.rtrainer);return}
  if(!live.length){if(G.route){G.route.wipe=1;return}endGame(1-f.side);return}
  let pick=live[0][1];
  if((f.side===1||f.rtrainer)&&!f.wild&&!f.remote){const o=(G.f.find(x=>x.side===0)||G.f[0]).unit;let best=-99;for(const[u,i]of live){const s=matchScore(u,o)+Math.random()*.2;if(s>best){best=s;pick=i}}}
  bringIn(f,pick);f.swapCd=1}
function trySwap(f,i){if(i===f.idx||f.swapCd>0||!f.team[i]||f.team[i].hp<=0)return;bringIn(f,i);f.swapCd=3}
function endGame(w){if(G.over)return;G.over=1;G.overT=1.6;G.winner=w}

/* ================= CREATURE KITS ================= */
const KIT={
 hexwyrm:{act(){},move(f){return f.bmove??.5}},
 scrattle:{
  act(f,c){const u=f.unit;
    if(c.r&&u.cd[1]<=0){u.cd[1]=5*cdM(u);f.windT=.45;ring(f.x,f.y-4,54,'#a8a878',.45,'tele',{f});sfx('charge');
      later(f,.45,()=>{f.spinT=.25;nova(f,f.x,f.y-4,{r:54,pow:48,type:'normal',kb:240});G.shake=Math.max(G.shake,3)})}
    else if(c.l&&u.cd[0]<=0&&u.rl<=0&&f.windT<=0){if(u.ammo<=0)startReload(f);else{u.ammo--;if(!isPC(f)){const a=c.aim;u.cd[0]=.55;ring(f.x,f.y-4,31,'#f85838',.2,'telearc',{f,a,arc:1.8});later(f,.2,()=>{f.clawT=.12;cone(f,a,{range:31,arc:1.8,pow:15,type:'normal',kb:100,col:'#ffffff'});sfx('jab')})}else{u.cd[0]=.26;f.clawT=.12;cone(f,c.aim,{range:31,arc:1.8,pow:15,type:'normal',kb:100,col:'#ffffff'});sfx('jab')}if(u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100&&f.windT<=0){u.ult=0;ult(f);const p=reach(f,c.tx,c.ty,160);const d=Math.max(30,Math.hypot(p.x-f.x,p.y-f.y));
      dash(f,Math.atan2(p.y-f.y,p.x-f.x),{dist:d,t:.12+d/900,invuln:1,fang:1,pow:1,type:'normal',kb:160,stop:1})}},
  move(){return 1}},
 cindercub:{
  act(f,c){const u=f.unit;
    if(f.charging){f.chargeT=Math.min(1.2,f.chargeT+G.dt);if(Math.random()<.6)fx(f.x+Math.cos(c.aim)*10,f.y-12+Math.sin(c.aim)*6,'#f8c040',1,30,.25,1,20);
      if(!c.rHeld){const k=f.chargeT/1.2;f.charging=0;u.cd[1]=4*cdM(u);f.chargeT=0;
        shoot(f,c.aim,{spd:250+80*k,pow:25+70*k,type:'fire',r:3+5*k,life:1.1,kind:'fireball',kb:80+140*k,st:{burn:2+3*k},onHit:null});const pr=G.proj[G.proj.length-1];pr.boom=14+22*k;pr.burnK=k;sfx('boom')}}
    else if(c.rHeld&&u.cd[1]<=0){f.charging=1;f.chargeT=0;sfx('charge')}
    if(!f.charging&&c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<=0)startReload(f);else{u.ammo--;u.cd[0]=.32;shoot(f,c.aim,{spd:290,pow:15,type:'fire',r:2.5,life:.75,kind:'ember',kb:30,st:Math.random()<.2?{burn:2}:null});sfx('dart');if(u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100&&!f.charging){u.ult=0;ult(f);f.root=.45;f.slamT=.3;const a=c.aim;
      later(f,.25,()=>{G.shake=Math.max(G.shake,6);cone(f,a,{range:125,arc:2.3,pow:60,type:'fire',kb:220,st:{burn:4},col:'#f47a18'});ring(f.x,f.y-4,125,'#f47a18',.4,'arc',{a,arc:2.3});
        for(const d of[22,44,66,88,110])for(const o of[-1,-.5,0,.5,1]){const x=f.x+Math.cos(a+o*1.05)*d,y=f.y+Math.sin(a+o*1.05)*d;if(!solidWalk(x,y))G.fires.push({x,y,r:13,life:3.5,owner:f,seed:Math.random()*6})}
        fx(f.x+Math.cos(a)*20,f.y+Math.sin(a)*20,'#f8a030',24,140,.5);fx(f.x,f.y+2,'#9a8060',10,80,.4)})}},
  move(f){return f.charging?.6:1}},
 umbrynx:{
  act(f,c){const u=f.unit,rs=f.mode==='rush';
    if(rs){f.trailT=(f.trailT||0)-G.dt;if(f.trailT<=0&&Math.hypot(f.vx,f.vy)>30){f.trailT=.05;G.ghosts.push({spr:SPR.umbrynx.rush[f.dir][0].c,x:f.x,y:f.y,life:.2})}if(Math.random()<.35)G.parts.push({x:f.x+(Math.random()-.5)*12,y:f.y-2-Math.random()*16,vx:0,vy:-20,life:.4,max:.4,col:Math.random()<.5?'#30244e':'#e06aff',sz:Math.random()<.4?2:1})}
    if(c.r&&u.cd[1]<=0&&!(f.cleaveW>0)){u.cd[1]=(rs?1.6:4)*cdM(u);const a=c.aim,wu=rs?.32:.6;f.cleaveW=wu;f.root=wu;fx(f.x,f.y+2,'#46366e',6,40,.3);ring(f.x,f.y-4,CLEAVE_R,'#f83838',wu,'telearc',{f,a,arc:CLEAVE_ARC});sfx('charge');
      later(f,wu,()=>{f.cleaveT=.25;f.cleaveA=a;cone(f,a,{range:CLEAVE_R,arc:CLEAVE_ARC,pow:55,type:'dark',kb:240,col:'#a088e0'});for(let i=0;i<14;i++){const aa=a-CLEAVE_ARC/2+CLEAVE_ARC*i/13;fx(f.x+Math.cos(aa)*CLEAVE_R*.8,f.y-4+Math.sin(aa)*CLEAVE_R*.8,i%2?'#d8d0ff':'#8a5ae0',2,70,.3)}G.shake=Math.max(G.shake,5);sfx('punch')})}
    else if(c.l&&u.cd[0]<=0&&u.rl<=0&&!(f.cleaveW>0)){if(u.ammo<=0)startReload(f);else{if(!rs)u.ammo--;u.cd[0]=rs?.22:.5;const gap=rs?.045:.075;
      for(let i=0;i<3;i++)later(f,i*gap,()=>{shoot(f,f.aim+(i-1)*.07,{spd:340,pow:11,type:'dark',r:2,life:.6,kind:'shade',kb:25});sfx('dart')});if(!rs&&u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);f.mode='rush';f.rushT=5;u.rl=0;u.ammo=u.m.ammo.max;ring(f.x,f.y-6,24,'#705898',.4,'nova');fx(f.x,f.y-8,'#e06aff',22,110,.5);fx(f.x,f.y-8,'#1e1632',16,70,.6)}},
  move(f){return f.mode==='rush'?1.65:1}},
 snipant:{
  act(f,c){const u=f.unit;
    if(c.r&&u.cd[1]<=0){u.cd[1]=3.5*cdM(u);fx(f.x,f.y+2,'#d8c098',8,50,.3);dash(f,c.ra??c.aim,{dist:110,t:.16})}
    else if(c.l&&u.cd[0]<=0&&u.rl<=0){const fz=f.frenzyT>0;if(!fz&&u.ammo<=0)startReload(f);else{if(!fz)u.ammo--;u.cd[0]=fz?.15:.3;f.snapT=.12;
      if(!isPC(f)){const a=c.aim;u.cd[0]=Math.max(u.cd[0],fz?.35:.55);ring(f.x,f.y-4,32,'#f85838',.2,'telearc',{f,a,arc:1.8});later(f,.2,()=>{f.snapT=.12;cone(f,a,{range:32,arc:1.8,pow:16,type:'bug',kb:110,col:'#f6d68a'});sfx('jab')})}else{cone(f,c.aim,{range:32,arc:1.8,pow:16,type:'bug',kb:110,col:'#f6d68a'});sfx('jab')}if(!fz&&u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);f.frenzyT=4;fx(f.x,f.y-8,'#c84428',16,80,.4);ring(f.x,f.y-6,16,'#a8b820',.3,'nova')}},
  move(f){return f.frenzyT>0?1.3:1}},
 bulwhale:{
  act(f,c){const u=f.unit;
    if(c.r&&u.cd[1]<=0){if(f.mode==='turret'){exitTurret(f,.5)}else{f.mode='turret';f.vx=f.vy=0;u.cd[1]=.5*cdM(u);fx(f.x,f.y+4,'#88c0fc',12,60,.4);sfx('plant')}return}
    if(f.mode==='turret'){
      if(c.l&&u.rl<=0){f.sprayT=(f.sprayT||0)+G.dt;while(f.sprayT>=.033&&u.ammo>0){f.sprayT-=.033;u.ammo-=32*.033;emitDrop(f,c.aim)}
        if(u.ammo<=0){u.ammo=0;startReload(f)}}
      else f.sprayT=0;
    }else if(c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<20)startReload(f);else{u.ammo-=20;u.cd[0]=.6;shoot(f,c.aim,{spd:230,pow:34,type:'water',r:4,life:.9,kind:'blob',kb:110});sfx('splash')}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);beam(f,c.aim,{len:520,w:26,windup:.45,dur:1.3,tick:.1,pow:16,type:'water',track:1.3,kb:45,kind:'cannon'})}},
  move(f){return f.mode==='turret'?.28:1}},
 fistinel:{
  act(f,c){const u=f.unit;
    if(f.mode==='guard'){f.guardT+=G.dt;
      if(c.lp){const pow=45+Math.min(120,f.absorbed*.7);shoot(f,c.aim,{spd:330,pow,type:'steel',r:5+Math.min(4,f.absorbed/30),life:.9,kind:'blast',kb:240});popup(f.x,f.y-34,'COUNTER!','#ecc84a',true);fx(f.x,f.y-8,'#fff4b0',14,90,.35);f.mode='norm';f.absorbed=0;u.cd[1]=4*cdM(u);f.punchT=.15;sfx('boom')}
    }else{
      if(c.r&&u.cd[1]<=0){f.mode='guard';f.absorbed=0;f.guardT=0;sfx('plant');ring(f.x,f.y-6,14,'#e4ecfa',.25,'nova')}
      else if(c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<=0)startReload(f);else{u.ammo--;u.cd[0]=.14;f.jab++;const big=f.jab%3===0;f.punchT=.1;f.punchSide=f.jab%2?1:-1;
        cone(f,c.aim,{range:big?32:28,arc:1.6,pow:big?18:10,type:'fighting',kb:big?300:110,quiet:!big});sfx(big?'punch':'jab');if(u.ammo<=0)startReload(f)}}
    }
    if(c.e&&u.ult>=100){u.ult=0;f.mode='norm';ult(f);const p=reach(f,c.tx,c.ty,220);const d=Math.max(40,Math.hypot(p.x-f.x,p.y-f.y));
      dash(f,Math.atan2(p.y-f.y,p.x-f.x),{dist:d,t:.2+d/900,invuln:1,jump:1,pow:130,type:'fighting',kb:360,st:{stun:.6},stop:1,end:g=>nova(g,g.x,g.y,{r:30,pow:30,type:'fighting',kb:150})})}},
  move(f){return f.mode==='guard'?.45:1}},
 frostbunt:{
  act(f,c){const u=f.unit;const b=G.balls.find(b=>b.owner===f);
    if(b&&c.rHeld&&u.cd[1]<=0&&(b.live||Math.hypot(b.x-f.x,b.y-(f.y-4))>=BALL_REACH+ballR(b))){f.resumT=(f.resumT||0)+G.dt;if(f.resumT>=.6){f.resumT=0;summonBall(f,c.aim);u.cd[1]=.4*cdM(u);return}}else f.resumT=0;
    if(c.r&&u.cd[1]<=0){
      if(!b){u.cd[1]=.4*cdM(u);summonBall(f,c.aim)}
      else{const d=Math.hypot(b.x-f.x,b.y-(f.y-4));
        if(d<BALL_REACH+ballR(b)&&!b.live&&b.charge<BALL_MAX){b.charge++;u.cd[1]=.3*cdM(u);ring(b.x,b.y,ballR(b)+4,'#96d6f6',.25,'nova');fx(b.x,b.y,'#e2f8ff',6+b.charge,50,.35);sfx('charge'+Math.min(5,1+(b.charge>>1)))}
        else if(f.side===0&&(f.noSeedCd||0)<=0){popup(f.x,f.y-34,b.charge>=BALL_MAX&&!b.live?'FULLY CHARGED':'HOLD RMB: NEW BALL','#e2f8ff',true);f.noSeedCd=.6}}}
    if(c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<=0){startReload(f)}else{u.ammo--;u.cd[0]=.36;f.swingT=.16;f.swingDir=-(f.swingDir||1);
      cone(f,c.aim,{range:26,arc:2.2,pow:6,type:'fairy',kb:90,quiet:1,col:'#e2f8ff'});sfx('swing');
      if(b&&!b.live){const d=Math.hypot(b.x-f.x,b.y-(f.y-4));const ang=Math.abs(angDiff(Math.atan2(b.y-(f.y-4),b.x-f.x),c.aim));
        if(d<16+ballR(b)||(d<30+ballR(b)&&ang<1.3)){const sp=(f.homerT>0?440:380)-b.charge*5;b.vx=Math.cos(c.aim)*sp;b.vy=Math.sin(c.aim)*sp;b.live=1;b.hitCd=0;b.life=Math.max(b.life,5);sfx('crack');ring(b.x,b.y,8+b.charge,'#ffffff',.15,'nova');fx(b.x,b.y,'#e2f8ff',10,90,.3);G.shake=Math.max(G.shake,1+b.charge*.6)}}
      if(u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);f.homerT=7;let bb=G.balls.find(b=>b.owner===f);if(!bb){summonBall(f,c.aim);bb=G.balls.find(b=>b.owner===f)}if(bb&&!bb.live)bb.charge=BALL_MAX}},
  move(){return 1}},
 verdivy:{
  act(f,c){const u=f.unit;
    if(c.r&&u.cd[1]<=0&&f.seeds>=8){const p=reach(f,c.tx,c.ty,130);if(freeSpot(p.x,p.y,5)){u.cd[1]=.5*cdM(u);f.seeds=0;plantPod(f,p.x,p.y,12);const mine=G.pods.filter(q=>q.owner===f&&!q.ult);if(mine.length>3)mine[0].dead=1}else popup(f.x,f.y-34,'CAN\'T PLANT THERE','#f0f0f0',true)}
    else if(c.r&&f.seeds<8&&f.side===0&&(f.noSeedCd||0)<=0){popup(f.x,f.y-34,'NEED 8 SEEDS','#c8f0a0',true);f.noSeedCd=.6}
    if(c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<=0)startReload(f);else{u.ammo--;u.cd[0]=.2;f.seeds=Math.min(8,f.seeds+.5);fx(f.x+Math.cos(c.aim)*10,f.y-6+Math.sin(c.aim)*10,'#a8e070',4,50,.2);shoot(f,c.aim,{spd:340,pow:9,type:'grass',r:2.5,life:.65,jit:.06,kind:'dart',kb:20,onHit:()=>{f.seeds=Math.min(8,f.seeds+1)}});sfx('dart');if(u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);for(const a of[0,PI/2,PI,PI*1.5]){const x=f.x+Math.cos(a+PI/4)*36,y=f.y+Math.sin(a+PI/4)*36;if(freeSpot(x,y,5))plantPod(f,x,y,9,1)}}},
  move(){return 1}},
 voltusk:{
  act(f,c){const u=f.unit;
    if(f.mode==='roll'){rollTick(f,c);return}
    if(f.faultW>0)return;
    if(c.r&&u.cd[1]<=0){f.mode='roll';f.mom=.15;f.rollA=c.aim;f.rollAge=0;f.rollLast=G.t;f.rollHit=new Map();ring(f.x,f.y-4,16,'#d4aa58',.3,'nova');fx(f.x,f.y-4,'#f8e468',10,80,.3);fx(f.x,f.y,'#aa7e36',8,60,.3);sfx('dash');return}
    if(c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<=0)startReload(f);else{u.ammo--;u.cd[0]=.42;f.goreT=.16;f.goreSide=-(f.goreSide||1);
      cone(f,c.aim,{range:30,arc:1.9,pow:20,type:'electric',kb:110,col:'#f8e468'});shoot(f,c.aim,{spd:300,pow:10,type:'electric',r:2,life:.3,kind:'spark',kb:20});sfx('jab');if(u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);const a=c.aim,wu=.75;f.faultW=wu;f.root=wu;f.slamT=wu;ring(f.x,f.y,FAULT_L,'#f8d030',wu,'teleline',{a,w:FAULT_W,own:f});fx(f.x,f.y-10,'#f8e468',12,70,.4);sfx('charge');
      later(f,wu,()=>faultSpark(f,a))}},
  move(f){return f.mode==='roll'?1.15+1.25*(f.mom||0):1}},
 mesmamba:{
  act(f,c){const u=f.unit;
    if(f.link)linkTick(f);
    if(f.rainW>0)return;
    if(c.r&&u.cd[1]<=0&&!f.link){const t=linkFind(f,c.aim);u.cd[1]=(t?8:1)*cdM(u);f.slamT=.25;
      if(t){f.link={t,unit:t.unit,time:0,tick:.15,last:G.t};ring(t.x,t.y-6,14,'#f85888',.3,'nova');fx(t.x,t.y-10,'#ffd0e0',10,70,.3);popup(t.x,t.y-34,'LINKED!','#f85888',true);sfx('charge')}
      else{for(let i=1;i<8;i++)G.parts.push({x:f.x+Math.cos(c.aim)*i*18,y:f.y-12+Math.sin(c.aim)*i*18,vx:0,vy:0,life:.25,max:.25,col:i%2?'#f85888':'#ffd0e0',sz:1});if(f.side===0)popup(f.x,f.y-34,'NO TARGET','#ffd0e0',true);sfx('tick')}}
    if(c.l&&u.cd[0]<=0&&u.rl<=0){if(u.ammo<=0)startReload(f);else{u.ammo--;u.cd[0]=.7;f.spitT=.18;f.slamT=Math.max(f.slamT||0,.12);
      let p=reach(f,c.tx,c.ty,LOB_MAX);if(Math.hypot(p.x-f.x,p.y-f.y)<36)p={x:f.x+Math.cos(c.aim)*36,y:f.y+Math.sin(c.aim)*36};
      venomLob(f,p.x,p.y,{pow:21,r:17,pool:2.2,pr:13});sfx('splash');if(u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);const p=reach(f,c.tx,c.ty,240);f.rainW=.5;f.root=.5;f.slamT=.7;ring(p.x,p.y,RAIN_R,'#c060d0',1.15,'tele',{own:f});fx(f.x,f.y-16,'#c868e0',16,70,.5,1,30);fx(f.x,f.y-16,'#d8ff70',8,50,.5,1,40);sfx('charge');
      for(let i=0;i<11;i++)later(f,.85+i*.09,()=>{const a=Math.random()*6.283,rr=Math.sqrt(Math.random())*RAIN_R*.9;venomLob(f,p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr,{pow:22,r:16,pool:4,pr:12,T:.3,sx:p.x+Math.cos(a)*rr,sy:p.y+Math.sin(a)*rr,h:150,noTele:1})})}},
  move(f){return f.link?.55:1}},
 phantern:{
  act(f,c){const u=f.unit,vl=f.mode==='veil';
    if(vl&&Math.random()<.35)G.parts.push({x:f.x+(Math.random()-.5)*16,y:f.y-8-Math.random()*14,vx:0,vy:-14,life:.4,max:.4,col:Math.random()<.5?'#70e0d0':'#ccfff2',sz:1,veil:f});
    if(c.r&&u.cd[1]<=0){u.cd[1]=4.5*cdM(u);f.hookT=.2;throwHook(f,c.aim)}
    else if(c.l&&u.cd[0]<=0&&u.rl<=0){if(!vl&&u.ammo<=0)startReload(f);else{if(!vl)u.ammo--;u.cd[0]=vl?.25:.36;f.quillT=.12;f.glimpseT=.2;for(const o of[-.09,.09])shoot(f,c.aim+o,{spd:330,pow:10,type:'flying',r:2,life:.62,kind:'quill',kb:25});sfx('dart');if(!vl&&u.ammo<=0)startReload(f)}}
    if(c.e&&u.ult>=100){u.ult=0;ult(f);f.mode='veil';f.veilT=4.5;u.rl=0;u.ammo=u.m.ammo.max;ring(f.x,f.y-10,22,'#70e0d0',.4,'nova');fx(f.x,f.y-12,'#ccfff2',18,90,.5);fx(f.x,f.y-12,'#30aca8',12,60,.6);sfx('blink')}},
  move(f){return f.mode==='veil'?1.35:1}},
};
/* ---- new-mon helpers ---- */
const FAULT_L=190,FAULT_W=30,LOB_MAX=210,RAIN_R=64,LINK_R=170,LINK_T=2;
function rollTick(f,c){const u=f.unit;
  if(G.t-(f.rollLast||0)>.12){endRoll(f,0);return}
  f.rollLast=G.t;f.rollAge+=G.dt;
  const turn=clamp(angDiff(c.aim,f.rollA),-2.4*G.dt,2.4*G.dt);f.rollA+=turn;f.mom=clamp(f.mom+G.dt*.62-Math.abs(turn)*.12,0,1);
  c.mx=Math.cos(f.rollA);c.my=Math.sin(f.rollA);
  for(const t of foes(f)){if(dist(f,t)>f.r+t.r+6||(f.rollHit.get(t.unit)||-9)>G.t-.55)continue;f.rollHit.set(t.unit,G.t);
    const ka=f.rollA+clamp(angDiff(Math.atan2(t.y-f.y,t.x-f.x),f.rollA),-.8,.8);
    if(hit(f,t,Math.round(20+65*f.mom),'rock',{kb:120+240*f.mom,ka,st:f.mom>.65?{stun:.35}:null})>=0){G.shake=Math.max(G.shake,2+f.mom*4);ring(t.x,t.y-6,14,'#d4aa58',.25,'nova');fx(t.x,t.y-8,'#f6e2a2',10,110,.35);fx(t.x,t.y-8,'#f8e468',6,90,.3);sfx('punch');f.mom*=.6}}
  for(const p of G.pods)if(p.owner!==f&&Math.hypot(p.x-f.x,p.y-f.y)<f.r+8&&(p.rollCd||0)<G.t){p.rollCd=G.t+.55;hurtPod(p,(20+65*f.mom)*f.unit.dmg/f.unit.mdef*LF(f.unit.lv)*1.2);f.mom*=.7}
  const ax=f.x+Math.cos(f.rollA)*(f.r+3),ay=f.y+Math.sin(f.rollA)*(f.r+3);
  if(solidWalk(ax,ay)){if(f.mom>=.5){rollCrash(f);return}
    const hx=solidWalk(ax,f.y),vy=solidWalk(f.x,ay);let vx2=Math.cos(f.rollA),vy2=Math.sin(f.rollA);if(hx)vx2=-vx2;if(vy)vy2=-vy2;if(!hx&&!vy){vx2=-vx2;vy2=-vy2}
    f.rollA=Math.atan2(vy2,vx2);f.mom*=.6;c.mx=vx2;c.my=vy2;sfx('bonk');fx(ax,ay-4,'#d4aa58',5,50,.25)}
  if(Math.random()<.5+f.mom*.5)G.parts.push({x:f.x-Math.cos(f.rollA)*8+(Math.random()-.5)*6,y:f.y+(Math.random()-.5)*3,vx:0,vy:-8,life:.35,max:.35,col:Math.random()<.5?'#aa7e36':'#7a5222',sz:2});
  if(f.mom>.4&&Math.random()<f.mom*.8)G.parts.push({x:f.x+(Math.random()-.5)*18,y:f.y-10+(Math.random()-.5)*16,vx:(Math.random()-.5)*50,vy:(Math.random()-.5)*50,life:.15,max:.15,col:Math.random()<.5?'#f8e468':'#ffffff',sz:1});
  if((c.r&&f.rollAge>.3)||f.rollAge>=3.2)endRoll(f,1)}
function endRoll(f,dis){const u=f.unit,m=f.mom||0;f.mode='norm';u.cd[1]=5*cdM(u);f.mom=0;f.vx*=.3;f.vy*=.3;
  if(dis&&m>.25){const r=Math.round(22+30*m);nova(f,f.x,f.y-4,{r,pow:Math.round(18+32*m),type:'electric',kb:90+120*m,st:{slow:[.8,.3]}});fx(f.x,f.y-6,'#fffcd8',12,r*3,.3);for(let i=0;i<6;i++){const a=i*1.047+Math.random()*.5;G.parts.push({x:f.x+Math.cos(a)*r*.7,y:f.y-4+Math.sin(a)*r*.7,vx:0,vy:0,life:.2,max:.2,col:'#ffffff',sz:2})}G.shake=Math.max(G.shake,2+m*3)}
  else{fx(f.x,f.y-4,'#d4aa58',8,50,.3);sfx('swap')}}
function rollCrash(f){const u=f.unit,m=f.mom||0;f.mode='norm';u.cd[1]=5*cdM(u);f.mom=0;f.vx=f.vy=0;
  nova(f,f.x,f.y-4,{r:30,pow:Math.round(25+30*m),type:'rock',kb:150});f.st.stun=Math.max(f.st.stun,.55);f.dash=null;
  popup(f.x,f.y-34,'CRASH!','#e8c068',true);fx(f.x,f.y-6,'#f6e2a2',14,110,.4);G.shake=Math.max(G.shake,6);sfx('crack')}
function faultSpark(f,a){const ca=Math.cos(a),sa=Math.sin(a),x0=f.x,y0=f.y;
  ring(x0,y0,FAULT_L,'#d4aa58',.8,'fault',{a,w:FAULT_W,seed:Math.random()*9});G.shake=Math.max(G.shake,7);G.flash=Math.max(G.flash,.12);sfx('boom');sfx('crack');
  for(const t of foes(f)){const rx=t.x-x0,ry=t.y-y0,al=rx*ca+ry*sa,pp=-rx*sa+ry*ca;if(al>-8&&al<FAULT_L+t.r&&Math.abs(pp)<FAULT_W/2+t.r)hit(f,t,75,'rock',{kb:150,ka:a+(pp>=0?PI/2:-PI/2),st:{stun:.8}})}
  for(const p of G.pods){const rx=p.x-x0,ry=p.y-y0,al=rx*ca+ry*sa;if(al>-8&&al<FAULT_L&&Math.abs(-rx*sa+ry*ca)<FAULT_W/2+6)hurtPod(p,75*f.unit.dmg/f.unit.mdef*LF(f.unit.lv)*1.2)}
  for(let d=10;d<FAULT_L;d+=12){const x=x0+ca*d,y=y0+sa*d;fx(x,y-2,'#aa7e36',3,70,.45,2,20);fx(x,y-4,d%36<12?'#f8e468':'#f6e2a2',2,90,.3)}
  later(f,.22,()=>{for(const k of[.3,.6,.9]){const x=x0+ca*FAULT_L*k,y=y0+sa*FAULT_L*k;ring(x,y-4,18,'#f8d030',.25,'nova');fx(x,y-6,'#fffcd8',8,120,.25);for(const t of foes(f))if(Math.hypot(t.x-x,t.y-y)<18+t.r)hit(f,t,14,'electric',{quiet:1,kb:40,ka:Math.atan2(t.y-y,t.x-x)})}sfx('crack')})}
function venomLob(f,x,y,o){const sx=o.sx??f.x+Math.cos(f.aim)*8,sy=o.sy??f.y-14,d=Math.hypot(x-sx,y-sy),T=o.T??(.32+d/480);
  ring(x,y,o.r,'#c060d0',T,'tele',{own:f});ring(sx,sy,0,'#a040a0',T,'lob',{sx,sy,ex:x,ey:y,h:o.h??(18+d*.25)});
  later(f,T,()=>venomSplash(f,x,y,o))}
function venomSplash(f,x,y,o){ring(x,y,o.r+2,'#a040a0',.3,'nova');fx(x,y-2,'#c868e0',12,90,.4);fx(x,y-2,'#d8ff70',6,70,.35,1,20);
  for(const p of G.pods)if(p.owner!==f&&Math.hypot(p.x-x,p.y-y)<o.r+6)hurtPod(p,o.pow*f.unit.dmg/f.unit.mdef*LF(f.unit.lv)*1.2);
  for(const t of foes(f))if(Math.hypot(t.x-x,t.y-y)<=o.r+t.r)hit(f,t,o.pow,'poison',{kb:40,ka:Math.atan2(t.y-y,t.x-x)});
  if(!solidWalk(x,y))G.fires.push({x,y,r:o.pr,life:o.pool,owner:f,seed:Math.random()*6,tox:1,atk:f.unit.dmg,lv:f.unit.lv});sfx('splash')}
function toxTouch(fi,t){applySt(t,{slow:[.25,.3]});if((t.toxCd||0)<=0){t.toxCd=.4;hit(fi.owner,t,4,'poison',{quiet:1,atk:fi.atk,lv:fi.lv,cls:'mag',stabTypes:['poison','psychic']});fx(t.x,t.y-4,'#c868e0',3,30,.3,1,20)}}
function linkFind(f,a){let best=null,bd=1e9;for(const t of foes(f)){const d=dist(f,t);if(d>LINK_R||!los(f,t))continue;const off=Math.abs(angDiff(Math.atan2(t.y-f.y,t.x-f.x),a));if(off>.5&&Math.sin(off)*d>16)continue;if(d<bd){bd=d;best=t}}return best}
function linkTick(f){const L=f.link,t=L.t;
  if(G.t-L.last>.12||!alive(t)||t.unit!==L.unit||t.bound||dist(f,t)>LINK_R+40||!los(f,t)){f.link=null;fx((f.x+t.x)/2,(f.y+t.y)/2-8,'#f85888',8,60,.3);if(f.side===0||t.side===0)popup(t.x,t.y-34,'LINK BROKEN','#d8a0c0',true);sfx('tick');return}
  L.last=G.t;L.time+=G.dt;L.tick-=G.dt;f.slamT=Math.max(f.slamT||0,.1);applySt(t,{slow:[.2,.5]});
  if(L.tick<=0){L.tick=.3;hit(f,t,5,'psychic',{quiet:1});fx(t.x,t.y-10,'#f85888',3,40,.25)}
  if(L.time>=LINK_T){f.link=null;hit(f,t,28,'psychic',{st:{stun:.7},kb:60,ka:Math.atan2(t.y-f.y,t.x-f.x)});ring(t.x,t.y-8,22,'#f85888',.35,'nova');fx(t.x,t.y-10,'#ffd0e0',16,90,.4);popup(t.x,t.y-34,'MIND CRUSH!','#f85888',true);G.shake=Math.max(G.shake,3);sfx('crack')}}
function throwHook(f,a){shoot(f,a,{spd:440,pow:26,type:'ghost',r:3,life:.4,kind:'hook',kb:1});const p=G.proj[G.proj.length-1];p.onHit=()=>{for(const t of foes(f))if(p.hit.has(t.unit))yank(f,t)};sfx('dash')}
function yank(f,t){const d=dist(f,t),a=Math.atan2(f.y-t.y,f.x-t.x),k=Math.min(520,Math.max(0,d-22)*7);if(t.mode!=='turret'){t.kvx+=Math.cos(a)*k;t.kvy+=Math.sin(a)*k}applySt(t,{stun:.3});
  popup(t.x,t.y-34,'HOOKED!','#78e8d8',true);for(let i=0;i<8;i++){const q=i/8;G.parts.push({x:t.x+(f.x-t.x)*q,y:t.y-8+(f.y-t.y)*q,vx:0,vy:-10,life:.3,max:.3,col:i%2?'#70e0d0':'#ccfff2',sz:1})}G.shake=Math.max(G.shake,2);sfx('crack')}
function hookEnd(p){const f=p.owner;fx(p.x,p.y,'#70e0d0',6,60,.25);if(p.hit.size||!alive(f)||f.unit!==p.unit||f.dash||f.st.stun>0)return;
  const d=Math.hypot(p.x-f.x,p.y-(f.y-6));if(d<26)return;dash(f,Math.atan2(p.y-(f.y-6),p.x-f.x),{dist:d-16,t:.08+d/900});ring(p.x,p.y,8,'#70e0d0',.25,'nova');sfx('bonk')}
function veilEnd(f){f.mode='norm';if(alive(f)){ring(f.x,f.y-10,18,'#70e0d0',.3,'nova');fx(f.x,f.y-12,'#ccfff2',12,70,.4)}}
function ultBusy(f){return G.t<(f.ultLock||0)||f.rushT>0||f.frenzyT>0||f.homerT>0||f.mode==='veil'||f.mode==='rush'}
function ult(f){f.ultLock=G.t+2.5;const m=f.unit.m,mv=m.moves.find(x=>x.k==='E');G.banner={txt:mv.n.toUpperCase(),who:m.n,col:TC[mv.t],t:1.3,side:f.side};G.flash=Math.max(G.flash,.12);sfx('ult')}
function startReload(f){const u=f.unit;if(u.rl>0||u.ammo>=u.m.ammo.max)return;u.rl=u.m.ammo.rl;if(f.side===0)popup(f.x,f.y-34,u.m.ammo.verb,'#ffffff',true);sfx('reload')}
function exitTurret(f,cd){f.mode='norm';f.sprayT=0;f.unit.cd[1]=Math.max(f.unit.cd[1],cd);sfx('swap')}
function emitDrop(f,a){a+=(Math.random()-.5)*.05;const sp=330,ox=f.x+Math.cos(a)*14,oy=f.y-10+Math.sin(a)*12;f.dropSeq=(f.dropSeq||0)+1;
  G.proj.push({x:ox,y:oy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:3,pow:5,type:'water',owner:f,unit:f.unit,life:.6,kind:'drop',seq:f.dropSeq,kb:30,st:{slow:[.4,.2]},hit:new Set(),t:0});if(Math.random()<.3)sfx('dart')}
const BALL_MAX=12,BALL_REACH=44,DASH_CD=1.6;const CLEAVE_R=74,CLEAVE_ARC=4.2;
function ballR(b){return 3+b.charge*.9}
function ballPow(b){const c=b.charge;return Math.round(18+c*6+c*c*1.25+(c>=BALL_MAX?60:0))}
function shatter(b){b.dead=1;b.owner.unit.cd[1]=Math.max(b.owner.unit.cd[1],1.6*cdM(b.owner.unit));ring(b.x,b.y,10+b.charge*2,'#ffffff',.3,'nova');fx(b.x,b.y,'#e2f8ff',10+b.charge*3,140,.45,2);fx(b.x,b.y,'#96d6f6',8,90,.4);G.shake=Math.max(G.shake,2+b.charge*.35);sfx('crack')}
function summonBall(f,a){G.balls=G.balls.filter(b=>b.owner!==f);let x=f.x+Math.cos(a)*16,y=f.y-4+Math.sin(a)*16;if(solidShot(x,y)){x=f.x;y=f.y-4}
  G.balls.push({x,y,vx:0,vy:0,owner:f,unit:f.unit,life:12,live:0,hitCd:0,spin:0,charge:0});fx(x,y,'#e2f8ff',10,50,.4);ring(x,y,7,'#96d6f6',.25,'nova');sfx('blink')}
function plantPod(f,x,y,life,isUlt){const ph=Math.round(f.unit.max*.25);G.pods.push({x,y,hp:ph,max:ph,life,owner:f,atk:f.unit.dmg,lv:f.unit.lv,cd:.4,open:0,hurt:0,ult:!!isUlt,grow:0});fx(x,y,'#62b84a',10,50,.4);sfx('plant')}

/* ================= CONTROLLERS ================= */
function playerCtl(f){
  const mx=((K.KeyD||K.ArrowRight)?1:0)-((K.KeyA||K.ArrowLeft)?1:0),my=((K.KeyS||K.ArrowDown)?1:0)-((K.KeyW||K.ArrowUp)?1:0);
  const c={mx,my,aim:Math.atan2(M.y-(f.y-6),M.x-f.x),l:M.l||G.t-M.lpAt<.12,lp:G.t-M.lpAt<.12,r:G.t-M.rAt<.25,rHeld:M.r,e:G.t-(K.eAt??-9)<.15,reload:G.t-(K.rlAt??-9)<.15,dash:G.t-(K.dashAt??-9)<.18,dash:G.t-(K.dashAt??-9)<.18,swap:K.swap??null,tx:M.x,ty:M.y};K.swap=null;return c}
const isPC=f=>f===G.f[0]||!!f.remote;
// a fighter driven by the network opponent: replays their last input packet with the same edge timing as playerCtl
function remoteCtl(f){const R=f.remoteC||(f.remoteC={});const c={mx:R.mx||0,my:R.my||0,aim:R.aim??f.aim,l:!!R.l||G.t-(R.lpAt??-9)<.12,lp:G.t-(R.lpAt??-9)<.12,r:G.t-(R.rAt??-9)<.25,rHeld:!!R.rHeld,
  e:G.t-(R.eAt??-9)<.15,reload:G.t-(R.rlAt??-9)<.15,dash:false,swap:R.swap??null,tx:R.tx??f.x,ty:R.ty??f.y};R.swap=null;return c}
function steer(f,mx,my,ai){
  const l=Math.hypot(mx,my);if(l<.05)return[0,0];let a=Math.atan2(my,mx);
  if(ai.detour>0){a+=ai.detourA}
  for(const off of[0,.45,-.45,.9,-.9,1.4,-1.4,2,-2]){const aa=a+off;if(!solidWalk(f.x+Math.cos(aa)*14,f.y+Math.sin(aa)*14)&&!solidWalk(f.x+Math.cos(aa)*8,f.y+Math.sin(aa)*8)){if(Math.abs(off)>1&&ai.detour<=0){ai.detour=.7;ai.detourA=off}return[Math.cos(aa)*Math.min(1,l),Math.sin(aa)*Math.min(1,l)]}}
  return[mx,my]}
function aiCtl(f,dt){
  const ai=f.ai,D=ai.d,m=f.unit.m,c={mx:0,my:0,aim:f.aim,l:0,lp:0,r:0,e:0,swap:null,tx:f.x,ty:f.y};let t=opp(f);
  ai.react-=dt;ai.strT-=dt;ai.think-=dt;ai.detour-=dt;
  if(!alive(t))return c;
  {ai.podT=(ai.podT||0)-dt;if(ai.pod&&(ai.pod.dead||ai.podT<=0))ai.pod=null;if(!ai.pod&&G.pods.length){const dt0=dist(f,t);let bp=null,bd=150;for(const p of G.pods){if(p.dead||p.owner.side===f.side)continue;const d=Math.hypot(p.x-f.x,p.y-f.y);if(d<bd&&d<dt0*.85){bd=d;bp=p}}if(bp&&Math.random()<.6){ai.pod=bp;ai.podT=2.5}else if(bp)ai.podT=1}
   if(ai.pod){const p=ai.pod;t={x:p.x,y:p.y+2,vx:0,vy:0,kvx:0,kvy:0,r:7,unit:t.unit,side:p.owner.side,st:t.st,mode:'norm',faintT:0,team:t.team,dash:null,pod:1}}}
  if(t.mode!=='veil'||(t.glimpseT||0)>0||!ai.seen||Math.random()<dt*.6)ai.seen={x:t.x,y:t.y,vx:t.vx+t.kvx*.3,vy:t.vy+t.kvy*.3};
  const s=ai.seen,dx=s.x-f.x,dy=s.y-f.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,sight=los(f,t);
  const plan=AIK[m.id](f,t,c,d,sight,dt);
  let pref=plan.pref;
  if(ai.strT<=0){ai.str=Math.random()<.5?-1:1;ai.strT=.5+Math.random()*1.1}
  let mx,my;
  if(plan.goto){const gx=plan.goto.x-f.x,gy=plan.goto.y-f.y,gl=Math.hypot(gx,gy)||1;mx=gl>6?gx/gl:0;my=gl>6?gy/gl:0}
  else if(!sight&&d>40){mx=ux;my=uy}
  else{const rad=d>pref+15?1:d<pref-25?-.8:0;mx=ux*rad-uy*ai.str*.75;my=uy*rad+ux*ai.str*.75}
  let threat=0;
  for(const p of G.proj){if(p.owner===f)continue;const rx=f.x-p.x,ry=f.y-p.y,sp=Math.hypot(p.vx,p.vy)||1,along=(rx*p.vx+ry*p.vy)/sp;if(along<0||along>120)continue;const perp=(rx*p.vy-ry*p.vx)/sp;if(Math.abs(perp)<p.r+f.r+6){threat=1;const sg=perp>=0?1:-1;mx+=p.vy/sp*sg*2.4*D.dodge;my+=-p.vx/sp*sg*2.4*D.dodge}}
  for(const b of G.balls){if(b.owner===f||!b.live)continue;const rx=f.x-b.x,ry=f.y-b.y,sp=Math.hypot(b.vx,b.vy)||1,along=(rx*b.vx+ry*b.vy)/sp;if(along>0&&along<140&&Math.abs((rx*b.vy-ry*b.vx)/sp)<16){threat=1;const sg=(rx*b.vy-ry*b.vx)>=0?1:-1;mx+=b.vy/sp*sg*2.4*D.dodge;my+=-b.vx/sp*sg*2.4*D.dodge}}
  for(const b of G.beams){if(b.owner===f)continue;const ca=Math.cos(b.a),sa=Math.sin(b.a),rx=f.x-b.owner.x,ry=f.y-b.owner.y,pp=rx*sa-ry*ca;if(rx*ca+ry*sa>0&&rx*ca+ry*sa<b.len&&Math.abs(pp)<b.o.w+14){threat=1;const sg=pp>=0?1:-1;mx+=sa*sg*2.6*D.dodge;my+=-ca*sg*2.6*D.dodge}}
  for(const r of G.rings){const o=r.own;if(!o||o===f||o.side===f.side)continue;
    if(r.kind==='tele'){const rx=f.x-r.x,ry=f.y-r.y,dd=Math.hypot(rx,ry)||1;if(dd<r.r+f.r+8){threat=1;mx+=rx/dd*2.6*D.dodge;my+=ry/dd*2.6*D.dodge}}
    else if(r.kind==='teleline'){const ca=Math.cos(r.a),sa=Math.sin(r.a),rx=f.x-r.x,ry=f.y-r.y,al=rx*ca+ry*sa,pp=-rx*sa+ry*ca;if(al>-10&&al<r.r+10&&Math.abs(pp)<r.w/2+f.r+8){threat=1;const sg=pp>=0?1:-1;mx+=-sa*sg*2.8*D.dodge;my+=ca*sg*2.8*D.dodge}}}
  ai.threat=threat;
  // stuck detection
  ai.stuck+=dt;if(ai.stuck>.5){const mv=Math.hypot(f.x-ai.lastX,f.y-ai.lastY);if(mv<6&&Math.hypot(mx,my)>.3){ai.detour=.9;ai.detourA=(Math.random()<.5?-1:1)*(1.2+Math.random())}ai.lastX=f.x;ai.lastY=f.y;ai.stuck=0}
  [c.mx,c.my]=steer(f,mx,my,ai);
  const lead=d/320*D.lead,axp=s.x+s.vx*lead,ayp=s.y+s.vy*lead;
  ai.aimOff=clamp((ai.aimOff||0)+(Math.random()-.5)*dt*4*D.err,-D.err,D.err);
  if(c.aim===f.aim||plan.aimTarget){c.aim=Math.atan2(ayp-(f.y-6),axp-f.x)+ai.aimOff+(Math.random()-.5)*D.err;c.tx=axp+Math.cos(ai.aimOff*6)*D.err*60;c.ty=ayp+Math.sin(ai.aimOff*6)*D.err*60}
  if(plan.aim!=null){c.aim=plan.aim+ai.aimOff}
  {const tr=(D.turn||6)*(f.mode==='turret'?.6:1);c.aim=f.aim+clamp(angDiff(c.aim,f.aim),-tr*dt,tr*dt)}
  if(D.idle){ai.idleT=(ai.idleT||0)-dt;if(ai.idleT<=-2.5){ai.idleT=Math.random()<D.idle?.9+Math.random()*1.2:0}if(ai.idleT>0){c.l=c.lp=c.r=c.e=0;c.rHeld=0;const wa=G.t*.7+f.side*3;c.mx=Math.cos(wa)*.4;c.my=Math.sin(wa)*.4;[c.mx,c.my]=steer(f,c.mx,c.my,ai)}}
  {const u=f.unit;if(u.rl<=0&&u.ammo<m.ammo.max&&(d>260||(m.id==='bulwhale'&&u.ammo<20&&f.mode!=='turret')))c.reload=1}
  if(ai.think<=0){ai.think=1.3;const u=f.unit;if(f.swapCd<=0&&D.swap&&u.hp>u.max*.25){const cur=matchScore(u,t.unit);let best=cur+1.1,bi=-1;f.team.forEach((v,i)=>{if(v.hp>0&&v!==u){const sc=matchScore(v,t.unit);if(sc>best){best=sc;bi=i}}});if(bi>=0&&Math.random()<.45)c.swap=bi}}
  return c}
const AIK={
 hexwyrm(){return{pref:120,aimTarget:1}},
 scrattle(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
   if(d<36&&ai.react<=0){c.l=1;ai.react=D.react*.3}
   if(u.cd[1]<=0&&d<50&&Math.random()<dt*D.agg*3)c.r=1;
   if(u.ult>=100&&sight&&d>40&&d<160&&Math.random()<dt*D.agg*2)c.e=1;
   return{pref:14,aimTarget:1}},
 cindercub(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
   if(f.charging){c.rHeld=f.chargeT<(ai.chg||.8)?1:0;if(!sight)c.rHeld=0;return{pref:150,aimTarget:1}}
   if(u.cd[1]<=0&&sight&&d<240&&Math.random()<dt*D.agg*1.5){c.rHeld=1;ai.chg=.4+Math.random()*.8}
   else if(sight&&d<220&&u.cd[0]<=0&&ai.react<=0){c.l=1;ai.react=D.react*.6}
   if(u.ult>=100&&d<110&&Math.random()<dt*D.agg*3)c.e=1;
   return{pref:150,aimTarget:1}},
 snipant(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
   if(d<36)c.l=1;
   if(u.cd[1]<=0&&sight&&d>55&&d<150&&Math.random()<dt*D.agg*3)c.r=1;
   else if(u.cd[1]<=0&&u.hp<u.max*.3&&d<40&&Math.random()<dt*D.agg*3){c.r=1;const ea=Math.atan2(f.y-t.y,f.x-t.x)+ai.str*.6;c.ra=ea}
   if(u.ult>=100&&d<90&&Math.random()<dt*D.agg*2)c.e=1;
   return{pref:14,aimTarget:1}},
 bulwhale(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
   if(f.mode==='turret'){ai.modeT+=dt;
     const bad=!sight||d>250||d<34;if(bad)ai.bad=(ai.bad||0)+dt;else ai.bad=0;
     if(ai.bad>1.1&&u.cd[1]<=0){c.r=1;ai.bad=0}
     if(sight&&d<190)c.l=1;
   }else{ai.modeT=0;
     if(sight&&d<190&&d>50&&u.cd[1]<=0&&(u.ammo>=40||u.rl>0)&&Math.random()<dt*D.agg*2.2)c.r=1;
     else if(sight&&d<210&&ai.react<=0&&u.cd[0]<=0){c.l=1;ai.react=D.react*(.6+Math.random()*.8)}}
   if(u.ult>=100&&sight&&d<430&&Math.random()<dt*D.agg*2)c.e=1;
   return{pref:160,aimTarget:1}},
 fistinel(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
   if(f.mode==='guard'){if((f.absorbed>35||f.guardT>1.4)&&sight&&d<300&&Math.random()<dt*D.agg*4){c.lp=1;c.l=1}return{pref:90,aimTarget:1}}
   if(u.cd[1]<=0&&(ai.threat||G.beams.some(b=>b.owner===t))&&d>60&&Math.random()<dt*D.agg*5)c.r=1;
   else if(d<36)c.l=1;
   if(u.ult>=100&&sight&&d>60&&d<210&&Math.random()<dt*D.agg*2)c.e=1;
   return{pref:16,aimTarget:1}},
 frostbunt(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;const b=G.balls.find(b=>b.owner===f);
   if(!b||(b&&Math.hypot(b.x-f.x,b.y-f.y)>170&&!b.live)){if(u.ult>=100&&d<320&&Math.random()<dt*D.agg*2)c.e=1;if(u.cd[1]<=0&&d<300){c.r=1;c.rHeld=1;c.aim=Math.atan2(t.y-f.y,t.x-f.x)}return{pref:140,aimTarget:1}}
   if(b.live&&Math.hypot(b.vx,b.vy)>140)return{pref:130,aimTarget:1};
   // comfort: how safe it feels to keep charging (distance from the foe, own health, incoming fire)
   const comfort=clamp((d-70)/140,0,1)*(.35+.65*u.hp/u.max)*(ai.threat?.5:1),want=Math.round(2+comfort*(BALL_MAX-2));
   if(u.ult>=100&&b.charge>=8&&d<320&&!b.live&&Math.random()<dt*D.agg*3)c.e=1;
   const ta=Math.atan2(t.y-b.y,t.x-b.x),gx=b.x-Math.cos(ta)*12,gy=b.y+4-Math.sin(ta)*12;
   const bd=Math.hypot(b.x-f.x,b.y-(f.y-4)),clear=los(b,t);
   const ready=b.charge>=want||(d<70&&b.charge>=2)||f.homerT>0;
   if(!ready&&bd<BALL_REACH+ballR(b)-4&&b.charge<BALL_MAX&&u.cd[1]<=0){c.r=1;return{pref:0,goto:{x:gx,y:gy}}}
   if(ready&&bd<26&&ai.react<=0&&u.cd[0]<=0&&u.rl<=0&&clear){c.l=1;ai.react=D.react*.6;const lead=Math.hypot(t.x-b.x,t.y-b.y)/400*D.lead;const tx=t.x+t.vx*lead,ty=t.y+t.vy*lead;return{pref:0,goto:{x:gx,y:gy},aim:Math.atan2(ty-b.y,tx-b.x)+(Math.random()-.5)*D.err}}
   return{pref:0,goto:{x:gx,y:gy}}},
 umbrynx(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d,rs=f.mode==='rush';
   if(sight&&d<210&&u.cd[0]<=0&&ai.react<=0){c.l=1;ai.react=D.react*(rs?.3:.75)}
   if(u.cd[1]<=0&&d<70&&Math.random()<dt*D.agg*5)c.r=1;
   if(u.ult>=100&&d<230&&Math.random()<dt*D.agg*2)c.e=1;
   return{pref:rs?28:110,aimTarget:1}},
 verdivy(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
   if(f.seeds>=8&&u.cd[1]<=0&&d<260&&Math.random()<dt*D.agg*3){const k=Math.min(110,Math.max(30,d-60));c.r=1;c.tx=f.x+(t.x-f.x)/d*k;c.ty=f.y+(t.y-f.y)/d*k;return{pref:140}}
   if(sight&&d<230&&u.cd[0]<=0&&ai.react<=0){c.l=1;ai.react=D.react*.4}
   if(u.ult>=100&&d<140&&Math.random()<dt*D.agg*2)c.e=1;
   return{pref:150,aimTarget:1}},
 voltusk(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
   if(f.mode==='roll'){const lead=Math.min(.6,d/240)*D.lead,a=Math.atan2(t.y+t.vy*lead-f.y,t.x+t.vx*lead-f.x);
     if(rayLen(f.x,f.y-2,f.rollA,36)<30&&f.mom>=.45&&Math.random()<D.dodge+.15)c.r=1;
     else if(d<f.r+t.r+12&&f.mom>.5&&f.rollAge>.4&&Math.random()<D.agg*.35)c.r=1;
     else if(f.rollAge>1.1&&d>70&&Math.abs(angDiff(Math.atan2(t.y-f.y,t.x-f.x),f.rollA))>2)c.r=1;
     return{pref:0,aim:a}}
   if(f.faultW>0)return{pref:30,aimTarget:1};
   if(u.ult>=100&&sight&&d<FAULT_L*.85&&ai.react<=0&&Math.random()<dt*D.agg*3)c.e=1;
   else if(u.cd[1]<=0&&sight&&d>50&&d<240&&rayLen(f.x,f.y-2,Math.atan2(t.y-f.y,t.x-f.x),d)>=d-12&&Math.random()<dt*D.agg*3)c.r=1;
   if(d<36&&ai.react<=0){c.l=1;ai.react=D.react*.35}
   return{pref:20,aimTarget:1}},
 mesmamba(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d;
   if(d<LOB_MAX+10&&d>28&&u.cd[0]<=0&&u.rl<=0&&ai.react<=0){c.l=1;ai.react=D.react*.5}
   if(f.link)return{pref:130,aimTarget:1};
   if(u.ult>=100&&d<230&&Math.random()<dt*D.agg*2)c.e=1;
   else if(u.cd[1]<=0&&sight&&d<LINK_R-15&&Math.random()<dt*D.agg*2.5){c.r=1;c.l=0;return{pref:160,aim:Math.atan2(t.y-f.y,t.x-f.x)}}
   return{pref:165,aimTarget:1}},
 phantern(f,t,c,d,sight,dt){const ai=f.ai,u=f.unit,D=ai.d,vl=f.mode==='veil';
   if(u.ult>=100&&d<240&&Math.random()<dt*D.agg*2)c.e=1;
   if(u.cd[1]<=0&&Math.random()<dt*D.agg*3){
     if(u.hp<u.max*.45&&d<75){const away=Math.atan2(f.y-t.y,f.x-t.x);for(const o of[0,.5,-.5,1,-1,1.5,-1.5]){const a=away+o,l=rayLen(f.x,f.y-6,a,170);if(l<165&&l>50){c.r=1;return{pref:120,aim:a}}}}
     else if(sight&&d>60&&d<165&&!vl){c.r=1;return{pref:110,aim:Math.atan2(t.y-f.y,t.x-f.x)}}}
   if(sight&&d<210&&u.cd[0]<=0&&ai.react<=0){c.l=1;ai.react=D.react*(vl?.3:.6)}
   return{pref:vl?70:115,aimTarget:1}},
};

/* ================= UPDATE ================= */
function updFighter(f,dt){
  for(const u of f.team){u.cd[0]=Math.max(0,u.cd[0]-dt);u.cd[1]=Math.max(0,u.cd[1]-dt)}
  for(const k of['invuln','hurt','swapCd','channel','root','effCd','punchT','swingT','homerT','noSeedCd','dropCd','snapT','frenzyT','windT','spinT','clawT','slamT','stagger','rushT','cleaveT','cleaveW','goreT','faultW','spitT','rainW','quillT','hookT','veilT','toxCd','glimpseT','dashCd'])f[k]=Math.max(0,(f[k]||0)-dt);
  if(f.mode==='rush'&&f.rushT<=0)f.mode='norm';
  if(f.mode==='veil'&&f.veilT<=0)veilEnd(f);
  if(f.faintT>0){f.faintT-=dt;f.kvx=f.kvy=0;if(f.faintT<=0)nextUnit(f);return}
  if(!f.unit||f.unit.hp<=0)return;
  const u=f.unit,m=u.m,s=f.st;
  if(!ultBusy(f))u.ult=Math.min(100,u.ult+2.2*dt*intM(u));
  s.slowT=Math.max(0,s.slowT-dt);s.stunImm=Math.max(0,s.stunImm-dt);
  if(s.burn>0){s.burn-=dt;f.burnT=(f.burnT||0)-dt;if(Math.random()<.5)G.parts.push({x:f.x+(Math.random()-.5)*12,y:f.y-4-Math.random()*16,vx:0,vy:-30,life:.35,max:.35,col:Math.random()<.5?'#f47a18':'#f8c040',sz:Math.random()<.4?2:1});if(f.burnT<=0){f.burnT=.5;if(f.invuln<=0){const bd=Math.max(1,Math.round(u.max*.015));u.hp-=bd;popup(f.x,f.y-24,bd,'#f8a050',true);const o=(f.lastHit&&f.lastHit.unit)?f.lastHit:(opp(f)||f);if(o!==f)o.unit.ult=Math.min(100,o.unit.ult+1.5);if(u.hp<=0){faint(f,o);return}}}}
  if(s.stun>0){s.stun-=dt;if(s.stun<=0)s.stunImm=.6}
  if(u.rl>0){u.rl-=dt;if(u.rl<=0){u.rl=0;u.ammo=m.ammo.max;sfx('reloaded')}}
  const c=f===G.f[0]?playerCtl(f):f.remote?remoteCtl(f):f.boss?bossCtl(f,dt):f.ally?allyCtl(f,dt):f.wild?wildCtl(f,dt):aiCtl(f,dt);
  if(c.reload&&s.stun<=0&&f.mode!=='guard')startReload(f);
  f.aim=c.aim;
  const ca=Math.cos(c.aim),sa=Math.sin(c.aim);f.dir=Math.abs(ca)>Math.abs(sa)*1.1?(ca>0?'right':'left'):(sa>0?'down':'up');
  if(s.stun<=0&&!f.dash&&f.channel<=0){
    if(c.swap!=null&&f.mode!=='guard')trySwap(f,c.swap);
    else KIT[m.id].act(f,c);
    if(f===G.f[0]){if(c.r)M.rAt=-9;if(c.e&&u.ult<100)K.eAt=-9;if(c.e)K.eAt=-9;if(c.lp)M.lpAt=-9}else if(f.remote&&f.remoteC){const R=f.remoteC;if(c.r)R.rAt=-9;if(c.e)R.eAt=-9;if(c.lp)R.lpAt=-9}
  }
  if(f.dash){const d=f.dash,st=Math.min(dt,d.t);f.x+=d.vx*st;f.y+=d.vy*st;if(!d.o.jump)resolve(f);else{f.x=clamp(f.x,8,WW-8);f.y=clamp(f.y,8,WH-8)}d.t-=dt;d.tr-=dt;
    if(d.tr<=0){d.tr=.04;G.ghosts.push({spr:SPR[m.id][f.mode in SPR[m.id]?f.mode:'norm'][f.dir][0].c,x:f.x,y:f.y-(d.o.jump?jumpZ(f):0),life:.2})}
    for(const t of foes(f)){if(d.hit)break;if(d.o.pow&&dist(f,t)<f.r+t.r+6){const r=hit(f,t,d.o.pow,d.o.type,{st:d.o.st,kb:d.o.kb,ka:Math.atan2(d.vy,d.vx),fixed:d.o.fang?Math.max(3,Math.round(t.unit.hp*.4)):null});if(d.o.fang&&r>0){popup(t.x,t.y-34,'SUPER FANG!','#f8e048',true);fx(t.x,t.y-8,'#ffffff',14,100,.3)}if(r>=0){d.hit=true;sfx('punch');if(d.o.stop)d.t=0}}}
    if(d.t<=0){f.dash=null;f.vx=f.vy=0;resolve(f);if(d.o.end)d.o.end(f)}
    f.walk+=dt;
  }else{
    let mx=s.stun>0?0:c.mx,my=s.stun>0?0:c.my;const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}
    const mult=(f===G.f[0]&&(K.ShiftLeft||K.ShiftRight)&&canSprint(f)?1.6:1)*KIT[m.id].move(f)*(f.root>0?0:1)*((f.stagger||0)>0?.15:1)*(s.slowT>0?1-s.slowA:1)*(f.ai?f.ai.d.spd:1);
    const sp=moveSpeed(u)*mult;
    const k=Math.min(1,dt*16);f.vx+=(mx*sp-f.vx)*k;f.vy+=(my*sp-f.vy)*k;
    f.x+=(f.vx+f.kvx)*dt;f.y+=(f.vy+f.kvy)*dt;resolve(f);
    if(l>.1&&mult>0)f.walk+=dt;
  }
  const kd=Math.exp(-7*dt);f.kvx*=kd;f.kvy*=kd;
}
function canSprint(f){if(!G.route||f!==G.f[0])return false;const R=G.route;if(R.arena)return false;if(G.t-(f.hurtAt||-9)<3)return false;for(const o of G.f){if(o===f||o.side===f.side||!alive(o))continue;if((o.target===f||o.rtrainer)&&dist(o,f)<300)return false}return true}
function jumpZ(f){const d=f.dash;if(!d||!d.o.jump)return 0;return Math.sin(PI*(1-d.t/d.T))*22}
function update(dt){
  if(G.paused)return;
  if(G.hitstop>0){G.hitstop-=dt;return}
  G.dt=dt;G.t+=dt;G.shake=Math.max(0,G.shake-dt*14);G.flash=Math.max(0,G.flash-dt*2);
  if(G.banner){G.banner.t-=dt;if(G.banner.t<=0)G.banner=null}
  updCam(dt);
  if(G.start>0){G.start-=dt;updParts(dt);if(G.start<=0)sfx('go');return}
  if(G.over){G.overT-=dt;updParts(dt);if(G.overT<=0&&G.over===1){G.over=2;if(G.story)G.story.onEnd(G.winner);else showOver()}return}
  G.time+=dt;
  for(const f of G.f)updFighter(f,dt);
  for(let i=0;i<G.f.length;i++)for(let j=i+1;j<G.f.length;j++){const a=G.f[i],b=G.f[j];if(alive(a)&&alive(b)&&!(a.dash&&a.dash.o.jump)&&!(b.dash&&b.dash.o.jump)){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,m=a.r+b.r;if(d<m){const p=(m-d)/2;if(a.mode!=='turret'){a.x-=dx/d*p;a.y-=dy/d*p}if(b.mode!=='turret'){b.x+=dx/d*p;b.y+=dy/d*p}resolve(a);resolve(b)}}}
  for(const tm of G.timers){tm.t-=dt;if(tm.t<=0){tm.done=1;if(tm.f.unit===tm.unit&&alive(tm.f))tm.fn()}}G.timers=G.timers.filter(t=>!t.done);
  // projectiles
  for(const p of G.proj){
    p.life-=dt;p.t+=dt;
    if(p.kind==='drop'){const k=Math.exp(-1.6*dt);p.vx*=k;p.vy*=k;p.r=Math.min(5,p.r+dt*4)}
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.kind==='fireball'||p.kind==='ember')G.parts.push({x:p.x+(Math.random()-.5)*p.r,y:p.y+(Math.random()-.5)*p.r,vx:0,vy:-20,life:.3,max:.3,col:Math.random()<.5?'#f47a18':'#f8c040',sz:p.kind==='fireball'?2:1});
    else if(p.kind!=='drop'&&Math.random()<(p.kind==='dart'?.9:.4))G.parts.push({x:p.x,y:p.y,vx:0,vy:0,life:p.kind==='dart'?.3:.18,max:p.kind==='dart'?.3:.18,col:p.kind==='dart'?(Math.random()<.5?'#f8ffc8':'#ffe468'):TC[p.type],sz:p.kind==='dart'?2:1});
    for(const t of foes(p.owner)){if(p.dead)break;const ty=t.y-6;
    if(p.kind==='drop'){if(alive(t)&&Math.hypot(p.x-t.x,p.y-ty)<p.r+t.r){const ka=Math.atan2(p.vy,p.vx);if(p.owner.dropCd>0){if(t.invuln<=0&&t.mode!=='turret'){const k=t.mode==='guard'?6:16;t.kvx+=Math.cos(ka)*k;t.kvy+=Math.sin(ka)*k}}else{p.owner.dropCd=.1;hit(p.owner,t,p.pow,'water',{st:p.st,kb:p.kb,ka,quiet:true})}p.dead=1;fx(p.x,p.y,'#9ad0fc',2,60,.2)}}
    else if(alive(t)&&!p.hit.has(t.unit)&&Math.hypot(p.x-t.x,p.y-ty)<p.r+t.r+1){const r=hit(p.owner,t,p.pow,p.type,{st:p.st,kb:p.kb,ka:Math.atan2(p.vy,p.vx),atk:p.atk,lv:p.lv,cls:p.cls,stabTypes:p.stab,noUlt:p.noUlt});if(r>=0){p.hit.add(t.unit);p.dead=1;if(p.onHit)p.onHit();splash(p)}}}
    for(const q of G.pods)if(!p.dead&&q.owner!==p.owner&&Math.hypot(p.x-q.x,p.y-(q.y-6))<p.r+7){hurtPod(q,p.pow*LF(p.lv||p.owner.unit.lv)*1.2);p.dead=1;splash(p)}
    if(!p.dead&&solidShot(p.x,p.y+4)){p.dead=1;splash(p)}
    if(p.life<=0){p.dead=1;if(p.kind==='blob'||p.kind==='fireball')splash(p);if(p.kind==='drop')fx(p.x,p.y,'#c8e8ff',2,30,.25)}
  }G.proj=G.proj.filter(p=>!p.dead);
  // balls
  for(const b of G.balls){const f=b.owner;b.life-=dt;b.hitCd-=dt;b.spin+=dt*Math.hypot(b.vx,b.vy)*.05;
    if(f.unit!==b.unit||!alive(f)||b.life<=0){b.dead=1;fx(b.x,b.y,'#e2f8ff',8,40,.3);continue}
    const t=nearestFoe(f,400);let sp=Math.hypot(b.vx,b.vy);
    if(b.live&&f.homerT>0&&alive(t)&&sp>60){const cur=Math.atan2(b.vy,b.vx),want=Math.atan2(t.y-6-b.y,t.x-b.x),na=cur+clamp(angDiff(want,cur),-7*dt,7*dt);b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp}
    const fr=b.live&&f.homerT>0?.35:.8;b.vx*=Math.exp(-fr*dt);b.vy*=Math.exp(-fr*dt);sp=Math.hypot(b.vx,b.vy);
    if(sp<120&&b.live){b.live=0}
    if(!b.live){b.vx*=Math.exp(-4*dt);b.vy*=Math.exp(-4*dt)}
    const nx=b.x+b.vx*dt,ny=b.y+b.vy*dt;
    if(solidShot(nx,b.y+4)){b.vx*=-.75;sfx('bonk')}else b.x=nx;
    if(solidShot(b.x,ny+4)){b.vy*=-.75;sfx('bonk')}else b.y=ny;
    if(b.live&&Math.random()<.7)G.parts.push({x:b.x,y:b.y,vx:0,vy:0,life:.25,max:.25,col:f.homerT>0?'#f8b2ca':'#e2f8ff',sz:2});
    const br=ballR(b);
    for(const t of foes(f)){if(b.dead||!b.live||b.hitCd>0)break;if(Math.hypot(b.x-t.x,b.y-(t.y-6))<t.r+br-3){const pow=ballPow(b);const r=hit(f,t,pow,'ice',{kb:90+b.charge*22,ka:Math.atan2(b.vy,b.vx),st:b.charge>=3?{slow:[1,.35]}:null});if(r>=0){shatter(b)}}}
    for(const q of G.pods)if(b.live&&q.owner!==f&&Math.hypot(b.x-q.x,b.y-(q.y-6))<br+6){hurtPod(q,ballPow(b)*LF(f.unit.lv));shatter(b)}
  }G.balls=G.balls.filter(b=>!b.dead);
  // burning ground
  for(const fi of G.fires){fi.life-=dt;for(const t of foes(fi.owner))if(Math.hypot(t.x-fi.x,t.y-fi.y)<fi.r+t.r&&!t.unit.m.types.includes('flying')){if(fi.tox){toxTouch(fi,t);continue}applySt(t,{burn:1.5});t.lastHit=fi.owner}}G.fires=G.fires.filter(fi=>fi.life>0);
  // pods
  for(const p of G.pods){p.life-=dt;p.cd-=dt;p.open=Math.max(0,p.open-dt);p.hurt=Math.max(0,p.hurt-dt);p.grow=Math.min(1,p.grow+dt*5);if(p.life<=0)p.dead=1;if(p.dead){fx(p.x,p.y-6,'#62b84a',10,50,.4);continue}
    let t=null;{let bd=150;for(const o of foes(p.owner)){const d=Math.hypot(o.x-p.x,o.y-p.y);if(d<bd&&los({x:p.x,y:p.y-6},o)){bd=d;t=o}}}if(p.cd<=0&&t){p.cd=.8;p.open=.2;const a=Math.atan2(t.y-6-(p.y-8),t.x-p.x);
      G.proj.push({x:p.x+Math.cos(a)*6,y:p.y-8+Math.sin(a)*6,vx:Math.cos(a)*260,vy:Math.sin(a)*260,r:2,pow:20,type:'grass',owner:p.owner,atk:p.atk,lv:p.lv,cls:'mag',stab:['grass'],unit:null,life:.8,kind:'seed',kb:40,hit:new Set(),t:0,noUlt:1});sfx('dart')}}
  G.pods=G.pods.filter(p=>!p.dead);
  // beams
  for(const b of G.beams){const f=b.owner;if(f.unit!==b.unit||!alive(f)||(b.o.hold&&(f.stream!==b||f.mode!=='turret'))){b.dead=1;continue}
    if(b.o.track)b.a+=clamp(angDiff(f.aim,b.a),-b.o.track*dt,b.o.track*dt);
    const bo=b.o.off||8,ox=f.x+Math.cos(b.a)*bo,oy=f.y-8-(b.o.oy||0)+Math.sin(b.a)*bo;b.len=rayLen(ox,oy+6+(b.o.oy||0),b.a,b.o.len);
    b.t+=dt;if(b.t>b.o.windup){b.tick-=dt;if(!b.o.hold)G.shake=Math.max(G.shake,1.2);if(b.tick<=0){b.tick=b.o.tick;const ca=Math.cos(b.a),sa=Math.sin(b.a);
      for(const t of foes(f)){const rx=t.x-ox,ry=t.y-6-oy,al=rx*ca+ry*sa,pp=Math.abs(rx*sa-ry*ca);if(al>0&&al<b.len&&pp<b.o.w/2+t.r)hit(f,t,b.o.pow,b.o.type,{st:b.o.st,kb:b.o.kb,ka:b.a,quiet:true})}
      for(const q of G.pods)if(q.owner!==f){const rx=q.x-ox,ry=q.y-6-oy,al=rx*ca+ry*sa;if(al>0&&al<b.len&&Math.abs(rx*sa-ry*ca)<b.o.w/2+6)hurtPod(q,b.o.pow*LF(f.unit.lv))}}}
    if(b.t>b.o.windup+b.o.dur)b.dead=1}G.beams=G.beams.filter(b=>!b.dead);
  updParts(dt);
}
function splash(p){if(p.kind==='hook'){hookEnd(p);return}
if(p.kind==='fireball'&&!p.boomed){p.boomed=1;const f=p.owner;ring(p.x,p.y,p.boom,'#f47a18',.35,'nova');fx(p.x,p.y,'#f8c040',20,p.boom*4,.5);for(const t of foes(f))if(!p.hit.has(t.unit)&&Math.hypot(t.x-p.x,t.y-6-p.y)<p.boom+t.r)hit(f,t,p.pow*.6,'fire',{kb:120,ka:Math.atan2(t.y-p.y,t.x-p.x),st:{burn:2+3*p.burnK}});if(!solidWalk(p.x,p.y+6))G.fires.push({x:p.x,y:p.y+6,r:6+p.boom*.4,life:2,owner:f,seed:Math.random()*6});G.shake=Math.max(G.shake,2+p.burnK*3);sfx('boom');return}
const col=TC[p.type];fx(p.x,p.y,col,p.kind==='blob'||p.kind==='blast'?12:5,p.kind==='blast'?110:60,.3);if(p.kind==='blob')ring(p.x,p.y,9,'#a8d8ff',.2,'nova');if(p.kind==='blast')ring(p.x,p.y,14,'#fff4b0',.25,'nova')}
function updCam(dt){if(r3dOn()){R3D.updCam(dt);return}const p=G.f[0];const k=1-Math.exp(-9*dt);const tx=WW<=W?(WW-W)/2:clamp(p.x-W/2,0,WW-W),ty=WH<=H?(WH-H)/2:clamp(p.y-8-H/2,0,WH-H);G.cam.x+=(tx-G.cam.x)*k;G.cam.y+=(ty-G.cam.y)*k;M.x=G.cam.x+M.sx;M.y=G.cam.y+M.sy}
function updParts(dt){
  for(const p of G.parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy*=.92}G.parts=G.parts.filter(p=>p.life>0);
  if(G.parts.length>900)G.parts.splice(0,G.parts.length-900);
  for(const r of G.rings)r.life-=dt;G.rings=G.rings.filter(r=>r.life>0);
  for(const t of G.texts){t.life-=dt;t.y-=dt*22}G.texts=G.texts.filter(t=>t.life>0);
  for(const g of G.ghosts)g.life-=dt;G.ghosts=G.ghosts.filter(g=>g.life>0);
}

/* ================= RENDER ================= */
function pcirc(x,y,r,col){ctx.fillStyle=col;x=Math.round(x);y=Math.round(y);const R=Math.ceil(r);for(let j=-R;j<=R;j++){if(r*r-j*j<0)continue;const w=Math.floor(Math.sqrt(r*r-j*j));ctx.fillRect(x-w,y+j,w*2+1,1)}}
function pell(x,y,rx,ry,col){ctx.fillStyle=col;x=Math.round(x);y=Math.round(y);for(let j=-Math.ceil(ry);j<=Math.ceil(ry);j++){const k=1-(j*j)/(ry*ry);if(k<0)continue;const w=Math.floor(rx*Math.sqrt(k));ctx.fillRect(x-w,y+j,w*2+1,1)}}
function pring(x,y,r,col,step=1.6){ctx.fillStyle=col;const n=Math.max(10,Math.floor(r*6.283/step));for(let i=0;i<n;i++){const a=i/n*6.283;ctx.fillRect(Math.round(x+Math.cos(a)*r),Math.round(y+Math.sin(a)*r),1,1)}}
function pline(x0,y0,x1,y1,w,col){ctx.fillStyle=col;const n=Math.ceil(Math.hypot(x1-x0,y1-y0));for(let i=0;i<=n;i++){const k=n?i/n:0;ctx.fillRect(Math.round(x0+(x1-x0)*k-w/2),Math.round(y0+(y1-y0)*k-w/2),w,w)}}
const TXQ=[];
let PTX=null,PROJ=null,HK=1;// R3D hooks: PTX remaps queued text, PROJ projects world->view, HK scales sprite-relative heights
function r3dOn(){return typeof R3D!=='undefined'&&R3D.ready&&R3D.on}
function scrP(x,y,cx,cy){return PROJ?PROJ(x,y):[x-cx,y-cy]}
function ptext(t,x,y,col,size=8,align='center',o={}){const m=ctx.getTransform();const q={t:String(t),x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f,col,size:size*(m.a||1),align,a:ctx.globalAlpha,bg:o.bg,dark:o.dark};if(PTX)PTX(q);TXQ.push(q)}
function flushText(){const tc=$('tx');if(!tc)return;const x=tc.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,tc.width,tc.height);const s=tc.width/W;
  for(const q of TXQ){const fs=Math.max(11,Math.round(q.size*s*1.05));x.font='700 '+fs+'px "Pixelify Sans", "Trebuchet MS", sans-serif';x.textAlign=q.align;x.textBaseline='middle';x.globalAlpha=q.a;x.lineJoin='round';
    const px=q.x*s,py=q.y*s;if(q.dark){x.fillStyle='#d0d0c8';x.fillText(q.t,px+Math.max(1,fs/12),py+Math.max(1,fs/12));x.fillStyle=q.col;x.fillText(q.t,px,py);continue}
    x.lineWidth=Math.max(3,fs/4);x.strokeStyle='#202028';x.strokeText(q.t,px,py);x.fillStyle=q.col;x.fillText(q.t,px,py)}
  x.globalAlpha=1;TXQ.length=0}
function renderPod(p){const x=Math.round(p.x),y=Math.round(p.y),s=p.grow;pell(x,y,7,2,'rgba(0,0,0,.25)');
  const cv=p.open>0?POD_OPEN:POD_CV;if(s<1){const h=Math.round(20*s);ctx.drawImage(cv,0,20-h,20,h,x-10,y-h+1,20,h)}else ctx.drawImage(cv,x-10,y-19);
  if(p.hurt>0){ctx.globalAlpha=.6;pcirc(x,y-10,6,'#ffffff');ctx.globalAlpha=1}
  if(p.life<2&&Math.floor(p.life*10)%2){ctx.globalAlpha=.4;pcirc(x,y-10,6,'#000');ctx.globalAlpha=1}
  const hp=p.hp/p.max;ctx.fillStyle='#283028';ctx.fillRect(x-7,y-23,14,3);ctx.fillStyle=hp>.5?'#70f8a8':hp>.25?'#f8e038':'#f85838';ctx.fillRect(x-6,y-22,Math.ceil(12*hp),1);
  ctx.fillStyle=p.owner.side?'#f85838':'#f8a830';ctx.fillRect(x-1,y-26,3,1)}
function renderBall(b){const x=Math.round(b.x),y=Math.round(b.y),r=ballR(b),hm=b.owner.homerT>0;pell(x,b.y+6,r,1.5,'rgba(0,0,0,.3)');
  pcirc(x,y,r+1,hm?'#7a2a4e':'#5a6896');pcirc(x,y,r,hm?'#f8b2ca':'#c8d4ee');pcirc(x-1,y-1,Math.max(1,r-1.2),hm?'#ffe2ee':'#e8eefc');pcirc(x-Math.ceil(r/3),y-Math.ceil(r/3),Math.max(.6,r/3),'#ffffff');
  if(r>4){ctx.fillStyle=hm?'#c4588a':'#96d6f6';ctx.fillRect(x+Math.floor(r/2),y+Math.floor(r/3),1,1);ctx.fillRect(x+Math.floor(r/3),y+Math.floor(r/2),1,1)}
  if(b.charge>0&&!b.live){for(let i=0;i<b.charge;i++){const a=G.t*2+i*6.283/b.charge;ctx.fillStyle='#e2f8ff';ctx.fillRect(Math.round(x+Math.cos(a)*(r+4)),Math.round(y+Math.sin(a)*(r+3)),1,1)}}
  if(!b.live&&b.owner.side===0&&Math.hypot(b.x-b.owner.x,b.y-(b.owner.y-4))<34&&Math.floor(G.t*4)%2){pring(x,y,r+6,'#ffffff',2)}
  if(b.owner.side===0){const my=Math.round(y-r-9+Math.sin(G.t*6)*1.5);ctx.fillStyle='#163c6e';ctx.fillRect(x-3,my-1,7,3);ctx.fillRect(x-2,my+2,5,1);ctx.fillRect(x-1,my+3,3,1);ctx.fillStyle='#96d6f6';ctx.fillRect(x-2,my,5,1);ctx.fillRect(x-1,my+1,3,1);ctx.fillRect(x,my+2,1,1)}}
function groundShadowY(b){return b.y+6}
function fAlpha(f){let al=1;if(f.faintT>0)al=f.faintT/1.3;if(f.ally&&f.unit.hp<=0&&f.faintT<=0)al=.65;if(f.invuln>0&&!f.dash&&Math.floor(G.t*20)%2)al*=.5;if(f.mode==='veil')al*=f.side===0?.55:.1+.1*Math.max(0,Math.sin(G.t*7));return al}
/* ===== creature animation: per-species idle loops built from the original sprite by pixel-safe transforms ===== */
const ANIM={bulwhale:{k:'breathe',fps:3},fistinel:{k:'step',fps:2.5},frostbunt:{k:'twitch',fps:4},verdivy:{k:'sway',fps:2.5},snipant:{k:'twitch',fps:6},scrattle:{k:'sniff',fps:6},
  cindercub:{k:'flicker',fps:6},umbrynx:{k:'sway',fps:2},voltusk:{k:'spark',fps:5},mesmamba:{k:'hypno',fps:3},phantern:{k:'hover',fps:5,hover:2.2},hexwyrm:{k:'breathe',fps:2.2}};
function _gb(g){let t=-1,b=-1;for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++)if(g.p[y*g.w+x]){if(t<0)t=y;b=y}return[t,b]}
function _cp(g){const o=SG(g.w,g.h);o.p=g.p.slice();return o}
function gBreathe(g,k){const[t,b]=_gb(g);if(t<0)return _cp(g);const ym=Math.round(t+(b-t)*.55),o=SG(g.w,g.h);
  for(let y=0;y<g.h;y++){let sy=y;if(k>0&&y<=ym)sy=Math.min(ym,y+k);if(k<0&&y<=ym)sy=y+k;for(let x=0;x<g.w;x++){const v=sy>=0&&sy<g.h?g.p[sy*g.w+x]:null;if(v)o.p[y*g.w+x]=v}}return o}
function gSway(g,s,frac=.62){const[t,b]=_gb(g);if(t<0)return _cp(g);const ym=t+(b-t)*frac,o=SG(g.w,g.h);
  for(let y=0;y<g.h;y++){const off=y<ym?Math.round(s*(ym-y)/Math.max(1,ym-t)):0;for(let x=0;x<g.w;x++){const sx=x-off,v=sx>=0&&sx<g.w?g.p[y*g.w+sx]:null;if(v)o.p[y*g.w+x]=v}}return o}
function gWarm(g,k){const o=_cp(g);for(let i=0;i<o.p.length;i++){const v=o.p[i];if(!v||v[0]!=='#'||v.length!==7)continue;const r=parseInt(v.slice(1,3),16),gg=parseInt(v.slice(3,5),16),bb=parseInt(v.slice(5,7),16);
    if(r>200&&gg>90&&bb<120)o.p[i]=hmix(v,k>0?'#fff4a0':'#e04010',.38)}return o}
function gSpark(g,seed){const o=_cp(g),W=g.w;let n=0;for(let i=0;i<o.p.length&&n<4;i++){const j=(i*97+seed*131)%o.p.length;const v=o.p[j];if(!v)continue;const x=j%W,y=Math.floor(j/W);if(y>g.h*.6)continue;
    const edge=!o.p[j-1]||!o.p[j+1]||!o.p[j-W]||!o.p[j+W];if(edge&&hsh(x,y,seed)<.5){o.p[j]=n%2?'#fff8b0':'#f8e040';n++}}return o}
function idleFrames(id,g){const A=ANIM[id]||{k:'breathe'},big=g.w>32?2:1;
  switch(A.k){
    case'breathe':return[g,gBreathe(g,big),gBreathe(g,big),g];
    case'step':return[g,g,gBreathe(g,-1),gBreathe(g,-1)];
    case'twitch':return[g,gSway(g,1,.3),g,gBreathe(g,1)];
    case'sway':return[gSway(g,-1),g,gSway(g,1),g];
    case'sniff':return[g,gBreathe(g,1),g,gBreathe(g,-1)];
    case'flicker':return[gWarm(g,1),gBreathe(gWarm(g,-1),1),gWarm(g,1),gWarm(g,-1)];
    case'spark':return[g,gSpark(g,1),gBreathe(g,1),gSpark(g,2)];
    case'hypno':return[gSway(g,-2,.7),gSway(g,-1,.7),gSway(g,2,.7),gSway(g,1,.7)];
    case'hover':return[g,gBreathe(g,1),g,gBreathe(g,-1)];}
  return[g,g,g,g]}
// render-time motion: walking hop, hover, attack squash. returns {lift,sx,sy} (lift in px, sx/sy scale)
function fMotion(f){const A=ANIM[f.unit.m.id]||{},moving=Math.abs(f.vx)+Math.abs(f.vy)>20;let lift=0,sx=1,sy=1;
  if(moving){const ph=f.walk*7*Math.PI;lift=Math.abs(Math.sin(ph))*1.6;const land=Math.max(0,1-Math.abs(Math.sin(ph))*4);sx+=land*.06;sy-=land*.06}
  if(A.hover)lift+=A.hover+Math.sin(G.t*3+(f.animPh||0))*A.hover;
  const u=f.unit;if(f._la!=null&&u.ammo<f._la)f.atkP=1;if(u.cd&&u.cd[1]>(f._lc||0)+.3)f.atkP=1;f._la=u.ammo;f._lc=u.cd?u.cd[1]:0;
  if(f.atkP>0){f.atkP=Math.max(0,f.atkP-(G.dt||1/60)*5);const k=Math.sin(f.atkP*Math.PI);sx+=k*.1;sy-=k*.08}
  if(f.hurt>0){sx+=.06;sy-=.08}
  return{lift,sx,sy}}
function fSprite(f){const m=f.unit.m,st=SPR[m.id][f.mode]?f.mode:(f.snapT>0&&SPR[m.id].snap?'snap':(f.charging||f.slamT>0)&&SPR[m.id].charge?'charge':'norm');const moving=Math.abs(f.vx)+Math.abs(f.vy)>20;const set=SPR[m.id][st][f.dir];if(!moving&&set.idle){if(f.animPh==null)f.animPh=Math.random()*4;const A=ANIM[m.id]||{fps:3};return set.idle[Math.floor(G.t*(A.fps||3)+f.animPh)%4]}const fr=moving?((f.walk*7|0)%2):0;return set[fr]}
function fSY(f,z){return HK===1?Math.round(f.y-30-z+(f.faintT>0?(1.3-f.faintT)*8:0)):Math.round(f.y-(30+z)*HK+(f.faintT>0?(1.3-f.faintT)*8:0))}
function drawFighter(f){
  if(!f.unit||f.bound)return;const al=fAlpha(f),z=jumpZ(f);
  fighterGround(f,al,z);
  const S=fSprite(f);
  const sx=Math.round(f.x-16),sy=fSY(f,z);
  const behind=f.dir==='up';
  if(behind)drawGear(f,sx,sy,z);
  ctx.globalAlpha=al;{const k=f.unit.ht||1,mo=fMotion(f),w=Math.round(32*k*mo.sx),h=Math.round(32*k*mo.sy);ctx.drawImage(f.hurt>0?S.w:S.c,Math.round(f.x-w/2),Math.round(sy+32-h-mo.lift+30*(1-k)*0),w,h)}ctx.globalAlpha=1;
  if(!behind)drawGear(f,sx,sy,z);
  if(groundAt(f.x,f.y)===3&&z<2&&f.faintT<=0)ctx.drawImage(TALL_OVER,Math.round(f.x-16),Math.round(f.y-6));
  fighterOver(f,sy);
}
function fighterGround(f,al,z){
  pell(f.x,f.y+1,8-z*.12,2.5,'rgba(0,0,0,'+(.3*al)+')');
  if(f.mode==='turret'){ctx.globalAlpha=.6;pell(f.x,f.y+1,14,4,'#88c0fc');pring(f.x,f.y+1,13,'#e2f8ff',3);ctx.globalAlpha=1}
}
function fighterOver(f,sy){
  if(f.ally&&f.unit.hp<=0&&f.faintT<=0){for(let i=0;i<4;i++){const a=G.t*5+i*1.571,x=Math.round(f.x+Math.cos(a)*10),y=Math.round(sy+6+Math.sin(a)*3);ctx.fillStyle=i%2?'#f8d030':'#ffffff';ctx.fillRect(x-1,y,3,1);ctx.fillRect(x,y-1,1,3)}
    const t=Math.ceil(f.reviveT||0);ctx.fillStyle='#1c1c28';ctx.fillRect(Math.round(f.x)-12,Math.round(sy-10),24,9);ctx.fillStyle='#a040e0';ctx.fillRect(Math.round(f.x)-11,Math.round(sy-3),Math.round(22*(1-(f.reviveT||0)/10)),1);ptext(t+'s',f.x,sy-6,'#ffffff',6);return}
  if(f.mode==='guard'){ctx.globalAlpha=.35+Math.sin(G.t*10)*.1;pring(f.x,f.y-12,16,'#e4ecfa',1.2);ctx.globalAlpha=1}
  if(f.st.slowT>0){ctx.fillStyle='#98d8d8';for(let i=0;i<3;i++)ctx.fillRect(Math.round(f.x-8+i*7+Math.sin(G.t*5+i)*2),Math.round(f.y-4-((G.t*20+i*7)%14)),1,2)}
  if(f.st.stun>0){for(let i=0;i<3;i++){const a=G.t*6+i*2.09;ctx.fillStyle='#f8d030';ctx.fillRect(Math.round(f.x+Math.cos(a)*9),Math.round(sy+2+Math.sin(a)*2),2,2)}}
  if(f.faintT>0)return;
  if(f.wild&&f.arenaT>0&&G.route&&G.route.arena&&!G.route.arena.intruder){const n=Math.max(1,Math.ceil(5-f.arenaT)),by=Math.round(sy-18),pu=Math.floor(G.t*8)%2;ctx.fillStyle='#1c1c28';ctx.fillRect(Math.round(f.x)-8,by-7,17,13);ctx.fillStyle=pu?'#f85838':'#f8d030';ctx.fillRect(Math.round(f.x)-7,by-6,15,11);ctx.fillStyle='#1c1c28';ctx.fillRect(Math.round(f.x)-6,by-5,13,9);ctx.fillStyle=pu?'#f85838':'#f8d030';ctx.fillRect(Math.round(f.x)-6,by+3,Math.round(13*Math.min(1,f.arenaT/5)),1);ptext(n+'',f.x,by,'#ffffff',8)}
  if(f.mode==='veil'&&f.side!==0)return;
  const w=20,hp=Math.max(0,f.unit.hp/f.unit.max),y0=sy-3;ctx.fillStyle='#283028';ctx.fillRect(Math.round(f.x-w/2)-1,y0-1,w+2,4);ctx.fillStyle=hp>.5?'#70f8a8':hp>.2?'#f8e038':'#f85838';ctx.fillRect(Math.round(f.x-w/2),y0,Math.ceil(w*hp),2);
  ctx.fillStyle=f.side?'#f85838':'#f8a830';ctx.fillRect(Math.round(f.x)-2,y0-5,5,1);ctx.fillRect(Math.round(f.x)-1,y0-4,3,1);ctx.fillRect(Math.round(f.x),y0-3,1,1);
  if(f.unit.ult>=100&&!f.wild){ctx.fillStyle=Math.floor(G.t*6)%2?'#ffffff':'#f8d030';ctx.fillRect(Math.round(f.x)+w/2+2,y0,2,2)}
  if(f.wild){ptext('Lv'+f.unit.lv,f.x,y0-8,f.unit.id==='scrattle'?'#f8e0c0':'#ffc0a8',6);if(f.wild.alert>0){const ay=y0-18-(f.wild.alert>.6?(f.wild.alert-.6)*20:0);ctx.fillStyle='#282830';ctx.fillRect(Math.round(f.x)-3,Math.round(ay),7,9);ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(f.x)-2,Math.round(ay)+1,5,7);ctx.fillStyle='#f83838';ctx.fillRect(Math.round(f.x),Math.round(ay)+2,1,3);ctx.fillRect(Math.round(f.x),Math.round(ay)+6,1,1)}}
}
function drawGear(f,sx,sy,z){const id=f.unit.m.id,a=f.aim,ca=Math.cos(a),sa=Math.sin(a);
  if(id==='voltusk'||id==='mesmamba'||id==='phantern')drawGearNew(f,id,a,ca,sa);
  if(id==='cindercub'&&f.charging){const k=f.chargeT/1.2,r=2+5*k+Math.sin(G.t*30)*.7,x=f.x+ca*10,y=f.y-12+sa*6;pcirc(x,y,r+1,'#5a1000');pcirc(x,y,r,'#f47a18');pcirc(x,y,r*.6,'#f8c040');pcirc(x-1,y-1,Math.max(.5,r*.3),'#fff6c0');if(k>=1&&Math.floor(G.t*10)%2)pring(x,y,r+3,'#ffffff',2)}
  if(id==='scrattle'&&f.windT>0){const k=1-f.windT/.45;for(let i=0;i<10;i++){const aa=-k*6+i*.25;ctx.fillStyle=i===9?'#ffffff':'#d8809c';ctx.fillRect(Math.round(f.x+Math.cos(aa)*(8+i)),Math.round(f.y-4+Math.sin(aa)*(5+i*.6)),2,2)}}
  if(id==='scrattle'&&f.spinT>0){ctx.globalAlpha=f.spinT/.25;for(let i=0;i<40;i++){const aa=i/40*6.283+G.t*20;ctx.fillStyle=i%4?'#d8809c':'#ffffff';ctx.fillRect(Math.round(f.x+Math.cos(aa)*(30+(i%5)*5)),Math.round(f.y-4+Math.sin(aa)*(30+(i%5)*5)),2,2)}ctx.globalAlpha=1}
  if(id==='scrattle'&&f.clawT>0){for(const o of[-3,0,3]){pline(f.x+ca*10-sa*o-sa*4,f.y-8+sa*10+ca*o-ca*4,f.x+ca*18-sa*o+sa*4,f.y-8+sa*18+ca*o+ca*4,1,'#ffffff')}}
  if(id==='umbrynx'&&f.cleaveT>0){const k=f.cleaveT/.25;ctx.globalAlpha=Math.min(1,k*1.6);for(let i=0;i<=48;i++){const aa=f.cleaveA-CLEAVE_ARC/2+CLEAVE_ARC*i/48;for(const[r,cl]of[[CLEAVE_R,'#ffffff'],[CLEAVE_R-4,'#d8d0ff'],[CLEAVE_R-9,'#8a5ae0'],[CLEAVE_R-15,'#46366e']]){const rr=r-(1-k)*8;ctx.fillStyle=cl;ctx.fillRect(Math.round(f.x+Math.cos(aa)*rr),Math.round(f.y-6+Math.sin(aa)*rr*.8),2,1)}}ctx.globalAlpha=1}
  if(id==='bulwhale'&&f.mode==='turret'){const bx=f.x,by=f.y-10;pline(bx,by,bx+ca*12,by+sa*12,4,'#46300e');pline(bx,by,bx+ca*12,by+sa*12,2,'#e0b048');ctx.fillStyle='#fff0a0';ctx.fillRect(Math.round(bx+ca*12),Math.round(by+sa*12),1,1)}
  if(id==='fistinel'&&f.punchT>0){const ext=10+(f.punchT/.12)*6,side=(f.punchSide||1)*4;const x=f.x+ca*ext-sa*side,y=f.y-14+sa*ext+ca*side;ctx.drawImage(FIST_CV,Math.round(x-6),Math.round(y-6));fx(x+ca*4,y+sa*4,'#ffffff',1,30,.1)}
  if(id==='frostbunt'&&f.resumT>0){const k=f.resumT/.6;ctx.fillStyle='#e2f8ff';for(let i=0;i<24*k;i++){const aa=-PI/2+i/24*6.283;ctx.fillRect(Math.round(f.x+Math.cos(aa)*13),Math.round(f.y-10+Math.sin(aa)*13),2,2)}}
  if(id==='frostbunt'){const hx=f.x+(f.dir==='left'?-5:5),hy=f.y-8;let ba=a-1.1*(f.swingDir||1);if(f.swingT>0){const k=1-f.swingT/.16;ba=a+(f.swingDir||1)*(-1.3+2.6*k)}else ba=a-1.25;
    const L=14,tx=hx+Math.cos(ba)*L,ty=hy+Math.sin(ba)*L;pline(hx,hy,tx,ty,3,'#163c6e');pline(hx+Math.cos(ba)*3,hy+Math.sin(ba)*3,tx,ty,2,'#96d6f6');ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(tx),Math.round(ty),1,1);pline(hx,hy,hx+Math.cos(ba)*3,hy+Math.sin(ba)*3,2,'#e682aa');
    if(f.swingT>0){ctx.globalAlpha=.6;for(let i=0;i<8;i++){const aa=a+(f.swingDir||1)*(-1.3+2.6*i/8);ctx.fillStyle='#e2f8ff';ctx.fillRect(Math.round(hx+Math.cos(aa)*16),Math.round(hy+Math.sin(aa)*16),1,1)}ctx.globalAlpha=1}}
}
function drawGearNew(f,id,a,ca,sa){
  if(id==='voltusk'){
    if(f.goreT>0){const k=1-f.goreT/.16,s=f.goreSide||1;let px0=null;for(let i=0;i<=8;i++){const aa=a+s*(-.95+1.9*(i/8))*Math.min(1,k*1.6),r=20+(i%2)*3,x=f.x+Math.cos(aa)*r,y=f.y-8+Math.sin(aa)*r*.85;if(px0)pline(px0[0],px0[1],x,y,1,i%3?'#f8e468':'#ffffff');px0=[x,y]}}
    if(f.mode==='roll'){const m=f.mom||0,ra=f.rollA||0;for(let i=0;i<Math.round(3+m*6);i++){const o=(i-3)*3,l=6+m*14,bx=f.x-Math.cos(ra)*(11+((G.t*90+i*7)%10))-Math.sin(ra)*o,by=f.y-9-Math.sin(ra)*(11+((G.t*90+i*7)%10))+Math.cos(ra)*o*.7;ctx.globalAlpha=.5;pline(bx,by,bx-Math.cos(ra)*l,by-Math.sin(ra)*l,1,i%2?'#ffffff':'#f6e2a2');ctx.globalAlpha=1}
      if(m>.6&&Math.floor(G.t*16)%2)pring(f.x,f.y-10,13,'#f8e468',2)}
    if(f.faultW>0){const k=1-f.faultW/.75;for(let i=0;i<4;i++){const aa=G.t*9+i*1.57,r=10+k*6;ctx.fillStyle=i%2?'#ffffff':'#f8e468';ctx.fillRect(Math.round(f.x+Math.cos(aa)*r),Math.round(f.y-14+Math.sin(aa)*r*.6),2,1)}ctx.globalAlpha=.25+.25*k;pell(f.x,f.y+1,10+k*8,3+k*2,'#f8d030');ctx.globalAlpha=1}}
  else if(id==='mesmamba'){
    if(f.link&&alive(f.link.t)){const t=f.link.t,x0=f.x+ca*4,y0=f.y-17,x1=t.x,y1=t.y-10,dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,n=Math.ceil(L/2),k=f.link.time/LINK_T;
      for(let i=0;i<=n;i++){const q=i/n,w=Math.sin(q*L*.18-G.t*14)*(2+k*2),bx=x0+dx*q,by=y0+dy*q;ctx.fillStyle='#a02858';ctx.fillRect(Math.round(bx+nx*w),Math.round(by+ny*w),1,1);ctx.fillStyle='#f85888';ctx.fillRect(Math.round(bx-nx*w),Math.round(by-ny*w),1,1);if(i%3===0){ctx.fillStyle=Math.floor(G.t*12+i)%4?'#ffd0e0':'#ffffff';ctx.fillRect(Math.round(bx),Math.round(by),1,1)}}
      for(let i=0;i<3;i++){const aa=G.t*5+i*2.09,r=9-k*3;ctx.fillStyle=i===0?'#ffffff':'#f85888';ctx.fillRect(Math.round(x1+Math.cos(aa)*r)-1,Math.round(y1+Math.sin(aa)*r*.6),3,1);ctx.fillRect(Math.round(x1+Math.cos(aa)*r),Math.round(y1+Math.sin(aa)*r*.6)-1,1,3)}
      ctx.globalAlpha=.6;pring(x1,y1,10-k*4,'#f85888',2);ctx.globalAlpha=1}
    if(f.spitT>0){const x=f.x+ca*9,y=f.y-15+sa*5,r=1.5+f.spitT*10;pcirc(x,y,r+1,'#2e0e42');pcirc(x,y,r,'#a058b8');ctx.fillStyle='#d8ff70';ctx.fillRect(Math.round(x),Math.round(y)-1,1,1)}
    if(f.rainW>0){for(let i=0;i<5;i++){const aa=G.t*6+i*1.26;ctx.fillStyle=i%2?'#d8ff70':'#c868e0';ctx.fillRect(Math.round(f.x+Math.cos(aa)*12),Math.round(f.y-26+Math.sin(aa)*4),2,2)}}}
  else if(id==='phantern'){
    if(f.mode==='veil'&&f.side!==0)return;
    if(f.quillT>0){const x=f.x+ca*10,y=f.y-14+sa*8;ctx.fillStyle='#ccfff2';ctx.fillRect(Math.round(x)-1,Math.round(y),3,1);ctx.fillRect(Math.round(x),Math.round(y)-1,1,3)}
    if(f.mode==='veil'){ctx.globalAlpha=.35+.15*Math.sin(G.t*8);pring(f.x,f.y-14,12+Math.sin(G.t*4)*2,'#70e0d0',2.5);ctx.globalAlpha=1}}}
function drawTox(fi){const k=Math.min(1,fi.life*1.5);ctx.globalAlpha=.5*k;pell(fi.x,fi.y,fi.r,fi.r*.55,'#2e0e42');ctx.globalAlpha=.75*k;pell(fi.x,fi.y,fi.r-1.5,fi.r*.55-1,'#702c88');ctx.globalAlpha=.6*k;pell(fi.x-1,fi.y-1,fi.r*.55,fi.r*.25,'#a058b8');ctx.globalAlpha=k;
  for(let i=0;i<5;i++){const aa=i*2.4+fi.seed,rr=(i%3+1)/3*fi.r*.7,x=Math.round(fi.x+Math.cos(aa)*rr),y=Math.round(fi.y+Math.sin(aa)*rr*.5),ph=(G.t*1.6+i*.37+fi.seed)%1;
    if(ph<.75){ctx.fillStyle=i%2?'#d8ff70':'#e0a0f0';ctx.fillRect(x,y-Math.round(ph*2),1,1)}else{ctx.fillStyle='#d8ff70';ctx.fillRect(x-1,y-2,1,1);ctx.fillRect(x+1,y-2,1,1);ctx.fillRect(x,y-3,1,1)}}ctx.globalAlpha=1}
function drawProj(p){const col=TC[p.type],x=Math.round(p.x),y=Math.round(p.y);const a=Math.atan2(p.vy,p.vx),c=Math.cos(a),s=Math.sin(a);
  pell(x,y+8,Math.max(1,p.r-1),1,'rgba(0,0,0,.2)');
  switch(p.kind){
    case'dart':case'seed':{const pk=p.kind==='seed',L=pk?6:9;pline(p.x-c*L,p.y-s*L,p.x,p.y,3,pk?'#4a0c2c':'#0e2a10');pline(p.x-c*(L-1),p.y-s*(L-1),p.x-c,p.y-s,1,pk?'#ee5c98':'#f8ffc8');ctx.fillStyle='#ffffff';ctx.fillRect(x,y,1,1);ctx.fillStyle=pk?'#ee5c98':'#ffe468';ctx.fillRect(Math.round(p.x-c*L-s*2),Math.round(p.y-s*L+c*2),1,1);ctx.fillRect(Math.round(p.x-c*L+s*2),Math.round(p.y-s*L-c*2),1,1);break}
    case'ember':pcirc(p.x,p.y,p.r+.5,'#5a1000');pcirc(p.x,p.y,p.r,'#f47a18');ctx.fillStyle='#fff6c0';ctx.fillRect(x,y,1,1);ctx.fillStyle='#f8c040';ctx.fillRect(Math.round(p.x-c*3),Math.round(p.y-s*3),2,2);break;
    case'fireball':{const fl=Math.sin(G.t*40)*.6;pcirc(p.x,p.y,p.r+1.5+fl,'#5a1000');pcirc(p.x,p.y,p.r+.5+fl,'#d03a10');pcirc(p.x,p.y,p.r*.7,'#f8a030');pcirc(p.x-1,p.y-1,p.r*.35,'#fff6c0');for(let i=1;i<4;i++){ctx.fillStyle=i%2?'#f47a18':'#f8c040';ctx.fillRect(Math.round(p.x-c*(p.r+i*2)+(Math.random()-.5)*3),Math.round(p.y-s*(p.r+i*2)+(Math.random()-.5)*3),2,2)}break}
    case'blob':pcirc(p.x,p.y,p.r,'#2a4f94');pcirc(p.x,p.y,p.r-1,'#58a0ec');ctx.fillStyle='#e2f8ff';ctx.fillRect(x-1,y-2,2,1);ctx.fillRect(x-2,y-1,1,1);break;
    case'blast':pcirc(p.x,p.y,p.r+1,'#525a70');pcirc(p.x,p.y,p.r,'#aab4cc');pcirc(p.x,p.y,p.r-2,'#fff4b0');pring(p.x,p.y,p.r+3,'#e4ecfa',2);break;
    case'shade':pcirc(p.x,p.y,p.r+1,'#1e1632');pcirc(p.x,p.y,p.r,'#8a5ae0');ctx.fillStyle='#e8d8ff';ctx.fillRect(x,y,1,1);ctx.fillStyle='#46366e';ctx.fillRect(Math.round(p.x-c*4),Math.round(p.y-s*4),2,2);ctx.fillStyle='#705898';ctx.fillRect(Math.round(p.x-c*7),Math.round(p.y-s*7),1,1);break;
    case'spark':{let px0=p.x,py0=p.y;for(let i=1;i<4;i++){const nx=p.x-c*i*3+(Math.random()-.5)*4,ny=p.y-s*i*3+(Math.random()-.5)*4;pline(px0,py0,nx,ny,1,i===1?'#ffffff':'#f8d030');px0=nx;py0=ny}pcirc(p.x,p.y,1.5,'#fffcd8');break}
    case'quill':{pline(p.x-c*7,p.y-s*7,p.x,p.y,3,'#0c3440');pline(p.x-c*6,p.y-s*6,p.x-c,p.y-s,1,'#70e0d0');ctx.fillStyle='#ffffff';ctx.fillRect(x,y,1,1);ctx.fillStyle='#ccfff2';ctx.fillRect(Math.round(p.x-c*4-s*2),Math.round(p.y-s*4+c*2),1,1);ctx.fillRect(Math.round(p.x-c*4+s*2),Math.round(p.y-s*4-c*2),1,1);break}
    case'hook':{const f=p.owner,ox=f.x,oy=f.y-12,n=Math.ceil(Math.hypot(p.x-ox,p.y-oy)/4);for(let i=0;i<n;i++){const q=i/n;ctx.fillStyle=i%2?'#30aca8':'#ccfff2';ctx.fillRect(Math.round(ox+(p.x-ox)*q),Math.round(oy+(p.y-oy)*q),2,1)}
      pcirc(p.x,p.y,3,'#0c3440');pcirc(p.x,p.y,2,'#70e0d0');ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(p.x+c*2),Math.round(p.y+s*2),1,1);pline(p.x+s*3,p.y-c*3,p.x+s*3-c*3,p.y-c*3-s*3,1,'#ccfff2');pline(p.x-s*3,p.y+c*3,p.x-s*3-c*3,p.y+c*3-s*3,1,'#ccfff2');break}
    case'ddart':{ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#1e0a38';ctx.fillRect(-6,-3,10,6);ctx.fillStyle='#a040e0';ctx.fillRect(-5,-2,8,4);ctx.fillStyle='#e8b8ff';ctx.fillRect(-1,-1,4,2);ctx.restore();break}
    default:pcirc(p.x,p.y,p.r,col)}}
function drawStreams(){const ds=G.proj.filter(p=>p.kind==='drop').sort((a,b)=>a.owner.side-b.owner.side||a.seq-b.seq);
  for(const pass of[[5,'#2a4f94'],[3,'#58a0ec'],[1,'#e2f8ff']]){for(let i=0;i<ds.length;i++){const a=ds[i],b=ds[i+1];const w=Math.max(1,Math.round(pass[0]*(.7+a.r/8)));
      if(b&&b.owner===a.owner&&b.seq===a.seq+1&&Math.hypot(a.x-b.x,a.y-b.y)<24)pline(a.x,a.y,b.x,b.y,w,pass[1]);else pcirc(a.x,a.y,w/2+.5,pass[1])}}
  for(const p of ds)if(Math.random()<.15)G.parts.push({x:p.x+(Math.random()-.5)*6,y:p.y+(Math.random()-.5)*6,vx:p.vx*.2,vy:p.vy*.2,life:.25,max:.25,col:'#c8e8ff',sz:1})}
function drawBeam(b){const f=b.owner,col=TC[b.o.type],bo=b.o.off||8,DR=b.o.type==='dragon';const ox=f.x+Math.cos(b.a)*bo,oy=f.y-8-(b.o.oy||0)+Math.sin(b.a)*bo;ctx.save();ctx.translate(Math.round(ox),Math.round(oy));ctx.rotate(b.a);
  if(b.t<b.o.windup){ctx.fillStyle=DR?'#f85838':'#e2f8ff';ctx.globalAlpha=DR?.75:.5;for(let i=6;i<b.len;i+=6)ctx.fillRect(i,DR?-1:0,3,DR?2:1);if(DR){ctx.globalAlpha=.18;ctx.fillRect(0,-b.o.w/2,b.len,b.o.w)}ctx.globalAlpha=1;pcirc(0,0,2+b.t/b.o.windup*(DR?8:4),DR?'#a040e0':'#58a0ec')}
  else{const w=b.o.w*(.85+Math.sin(G.t*50)*.15);ctx.fillStyle=DR?'#2a0a48':'#2a4f94';ctx.fillRect(0,-w/2-1,b.len,w+2);ctx.fillStyle=DR?'#8a30d8':'#58a0ec';ctx.fillRect(0,-w/2,b.len,w);ctx.fillStyle=DR?'#d090ff':'#9ad0fc';ctx.fillRect(0,-w/4,b.len,w/2);ctx.fillStyle='#ffffff';ctx.fillRect(0,-Math.max(1,w/8),b.len,Math.max(1,w/4));
    for(let i=0;i<b.len;i+=9){const o=((G.t*240+i)%18)-9;ctx.fillStyle='#e2f8ff';ctx.fillRect(i,Math.round(o*w/22),2,1)}}
  ctx.restore();
  if(b.t>=b.o.windup&&Math.random()<.9){const ex=ox+Math.cos(b.a)*b.len,ey=oy+Math.sin(b.a)*b.len;fx(ex,ey,'#9ad0fc',b.o.w>10?4:2,80,.3)}}
function drawRing(r){const k=1-r.life/r.max;ctx.globalAlpha=1-k;
  if(r.f){r.x=r.f.x;r.y=r.f.y-4}
  if(r.kind==='tele'){ctx.globalAlpha=.25+.25*k;pcirc(r.x,r.y,r.r*k,r.col);ctx.globalAlpha=.9;pring(r.x,r.y,r.r,Math.floor(G.t*16)%2?r.col:'#ffffff',2)}
  else if(r.kind==='nova'){const rr=r.r*(.35+.65*Math.min(1,k*2.2));ctx.globalAlpha=(1-k)*.25;pcirc(r.x,r.y,rr,r.col);ctx.globalAlpha=1-k;pring(r.x,r.y,rr,r.col,1.2);pring(r.x,r.y,rr-1,'#ffffff',3)}
  else if(r.kind==='telerect'){const k2=1-r.life/r.max;ctx.globalAlpha=.14+.2*k2;ctx.fillStyle='#f83838';ctx.fillRect(r.x0,r.y0,r.x1-r.x0,r.y1-r.y0);ctx.globalAlpha=.35;ctx.fillRect(r.x0,r.y0,(r.x1-r.x0)*(r.vert?1:k2),(r.y1-r.y0)*(r.vert?k2:1));ctx.globalAlpha=.95;ctx.strokeStyle=Math.floor(G.t*12)%2?'#f83838':'#ffffff';ctx.lineWidth=2;ctx.strokeRect(r.x0+1,r.y0+1,r.x1-r.x0-2,r.y1-r.y0-2)}
  else if(r.kind==='telearc'){if(r.f&&alive(r.f)){r.x=r.f.x;r.y=r.f.y-4}const a0=r.a-r.arc/2,a1=r.a+r.arc/2;ctx.globalAlpha=.16+.14*k;ctx.fillStyle=r.col;ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.arc(r.x,r.y,r.r,a0,a1);ctx.closePath();ctx.fill();ctx.globalAlpha=.32;ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.arc(r.x,r.y,r.r*k,a0,a1);ctx.closePath();ctx.fill();ctx.globalAlpha=.95;const bl=Math.floor(G.t*14)%2?r.col:'#ffffff';for(let i=0;i<=40;i++){const a=a0+(a1-a0)*i/40;ctx.fillStyle=bl;ctx.fillRect(Math.round(r.x+Math.cos(a)*r.r),Math.round(r.y+Math.sin(a)*r.r),2,2)}pline(r.x,r.y,r.x+Math.cos(a0)*r.r,r.y+Math.sin(a0)*r.r,1,bl);pline(r.x,r.y,r.x+Math.cos(a1)*r.r,r.y+Math.sin(a1)*r.r,1,bl)}
  else if(r.kind==='teleline'){const k2=k,bl=Math.floor(G.t*14)%2?r.col:'#ffffff';ctx.save();ctx.translate(Math.round(r.x),Math.round(r.y));ctx.rotate(r.a);ctx.globalAlpha=.16+.14*k2;ctx.fillStyle=r.col;ctx.fillRect(0,-r.w/2,r.r,r.w);ctx.globalAlpha=.32;ctx.fillRect(0,-r.w/2,r.r*k2,r.w);ctx.globalAlpha=.95;ctx.fillStyle=bl;for(let i=0;i<r.r;i+=4){ctx.fillRect(i,-r.w/2,2,1);ctx.fillRect(i,r.w/2-1,2,1)}ctx.fillRect(r.r-1,-r.w/2,1,r.w);for(let i=8;i<r.r;i+=16){ctx.fillRect(i,-1,3,1);ctx.fillRect(i+2,0,2,1)}ctx.restore()}
  else if(r.kind==='fault'){const ca=Math.cos(r.a),sa=Math.sin(r.a),fade=1-k;ctx.globalAlpha=Math.min(1,fade*1.6);
    ctx.globalAlpha=Math.min(.8,fade*1.4);pline(r.x,r.y,r.x+ca*r.r,r.y+sa*r.r,3,'#3a220c');pline(r.x,r.y,r.x+ca*r.r,r.y+sa*r.r,1,k<.5&&Math.floor(G.t*20)%2?'#ffffff':'#f8d030');ctx.globalAlpha=Math.min(1,fade*1.6);
    for(let d=8;d<r.r;d+=9){const q=(d*7.3+r.seed*13)%1,off=(q-.5)*r.w*.55,x=Math.round(r.x+ca*d-sa*off),y=Math.round(r.y+sa*d+ca*off),h=Math.round((8+q*9)*Math.min(1,k*7)*(1-k*.5)),bw=3+Math.round(q*2);if(h<2)continue;
      for(let j=0;j<=h;j++){const w=Math.max(0,Math.round(bw*(1-j/h))),yy=y-j;ctx.fillStyle='#3a220c';ctx.fillRect(x-w-1,yy,w*2+3,1);if(w>0){ctx.fillStyle=j>h*.6?'#d4aa58':'#aa7e36';ctx.fillRect(x-w,yy,w*2+1,1);ctx.fillStyle='#f6e2a2';ctx.fillRect(x-w,yy,1,1)}}
      ctx.fillStyle='#7a5222';ctx.fillRect(x-bw-2,y+1,bw*2+5,1)}
    if(k<.55){let px0=r.x,py0=r.y-4;for(let d=10;d<r.r;d+=10){const j=(Math.random()-.5)*r.w*.6,x=r.x+ca*d-sa*j,y=r.y-4+sa*d+ca*j;pline(px0,py0,x,y,1,Math.random()<.5?'#ffffff':'#f8e468');px0=x;py0=y}}}
  else if(r.kind==='lob'){const q=Math.min(1,k),x=r.sx+(r.ex-r.sx)*q,gy=r.sy+(r.ey-r.sy)*q,z=Math.sin(PI*q)*r.h*(r.sy===r.ey?0:1)+(r.sy===r.ey?(1-q)*r.h:0),y=gy-z;ctx.globalAlpha=.3;pell(x,gy+2,3,1,'#000');ctx.globalAlpha=1;
    pcirc(x,y,3.6,'#2e0e42');pcirc(x,y,2.8,'#9c4cb0');pcirc(x-.5,y-.5,1.6,'#cc88dc');ctx.fillStyle='#d8ff70';ctx.fillRect(Math.round(x)+1,Math.round(y)+1,1,1);ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(x)-1,Math.round(y)-1,1,1);if(Math.random()<.6)G.parts.push({x:x+(Math.random()-.5)*3,y:y+(Math.random()-.5)*3,vx:0,vy:10,life:.25,max:.25,col:Math.random()<.5?'#a058b8':'#d8ff70',sz:1})}
  else if(r.kind==='arc'){ctx.fillStyle=r.col;for(let i=0;i<=10;i++){const a=r.a-r.arc/2+r.arc*i/10;for(const rr of[r.r*.7,r.r]){ctx.fillRect(Math.round(r.x+Math.cos(a)*rr),Math.round(r.y+Math.sin(a)*rr),1,1)}}}
  else pring(r.x,r.y,r.r*(1+k*.4),r.col,1.4);
  ctx.globalAlpha=1}
function drawFire(fi){if(fi.tox){drawTox(fi);return}const k=Math.min(1,fi.life*1.5);ctx.globalAlpha=.3*k;pell(fi.x,fi.y,fi.r,fi.r*.55,'#5a1000');ctx.globalAlpha=k;
  for(let i=0;i<7;i++){const a=i*2.4+fi.seed,rr=(i%3+1)/3*fi.r*.8,x=Math.round(fi.x+Math.cos(a)*rr),y=Math.round(fi.y+Math.sin(a)*rr*.55),h=3+((G.t*12+i*5)|0)%4;
    ctx.fillStyle='#d03a10';ctx.fillRect(x-1,y-h,3,h);ctx.fillStyle='#f8a030';ctx.fillRect(x,y-h+1,1,h-1);ctx.fillStyle='#fff6c0';ctx.fillRect(x,y-1,1,1)}ctx.globalAlpha=1}
function render(){
  ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
  const sk_=Math.min(G.shake,4)*.7,shx=Math.round((Math.random()-.5)*sk_),shy=Math.round((Math.random()-.5)*sk_);
  const cx=WW<=W?Math.round(G.cam.x)+shx:clamp(Math.round(G.cam.x)+shx,0,WW-W),cy=WH<=H?Math.round(G.cam.y)+shy:clamp(Math.round(G.cam.y)+shy,0,WH-H);
  if(r3dOn()){R3D.battle();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);if(G.route&&typeof tetherHud==='function')tetherHud();drawScreen(cx,cy);PROJ=null;return}
  ctx.fillStyle='#101418';ctx.fillRect(0,0,W,H);
  ctx.drawImage(WORLD[Math.abs(Math.floor(G.t*1.6))%2],-cx,-cy);
  ctx.translate(-cx,-cy);
  drawGroundFx();
  drawGhosts();
  const ents=[...G.pods.map(p=>({y:p.y,d:()=>renderPod(p)})),...G.balls.map(b=>({y:b.y+16,d:()=>renderBall(b)})),...G.f.map(f=>({y:f.y,d:()=>drawFighter(f)}))].sort((a,b)=>a.y-b.y);for(const e of ents)e.d();
  drawOverFx(true);
  drawScreen(cx,cy);
}
function drawGroundFx(){
  if(G.story){const pu=.5+.5*Math.sin(G.t*4);ctx.strokeStyle='rgba(248,208,48,'+(.5+.4*pu)+')';ctx.lineWidth=2;ctx.strokeRect(1,1,WW-2,WH-2);ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.lineDashOffset=-G.t*20;ctx.strokeRect(3.5,3.5,WW-7,WH-7);ctx.setLineDash([])}
  drawWalkMarks();
  for(const fi of G.fires)drawFire(fi);
}
// combat walk markers: faint dots on walkable tiles around the player while a foe is engaged; blocked tiles get a soft hatch edge
function drawWalkMarks(){const P=G.f[0];if(!alive(P))return;let on=!G.route;if(G.route){for(const f of G.f)if(f.wild&&alive(f)&&f.target===P&&dist(f,P)<300){on=true;break}}
  G.wmk=Math.max(0,Math.min(1,(G.wmk||0)+(on?.06:-.04)));if(G.wmk<=0)return;
  const R=150,X0=Math.max(0,Math.floor((P.x-R)/TS)),X1=Math.min(MW-1,Math.floor((P.x+R)/TS)),Y0=Math.max(0,Math.floor((P.y-R)/TS)),Y1=Math.min(MH-1,Math.floor((P.y+R)/TS));
  for(let Y=Y0;Y<=Y1;Y++)for(let X=X0;X<=X1;X++){const cx=X*TS+8,cy=Y*TS+8,d=Math.hypot(cx-P.x,cy-P.y);if(d>R)continue;const a=G.wmk*(1-d/R);
    if(MAP.walk[Y][X]!==1){ctx.globalAlpha=.5*a;ctx.fillStyle='#ffffff';ctx.fillRect(cx-1,cy-1,2,2)}
    else{let edge=false;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=X+dx,yy=Y+dy;if(xx>=0&&yy>=0&&xx<MW&&yy<MH&&MAP.walk[yy][xx]!==1){edge=true;break}}
      if(edge){ctx.globalAlpha=.42*a;ctx.fillStyle='#f85838';for(let i=0;i<16;i+=4){ctx.fillRect(X*TS+i,Y*TS+i,2,1);ctx.fillRect(X*TS+15-i,Y*TS+i,1,1)}}}}
  ctx.globalAlpha=1}
function drawGhosts(){for(const g of G.ghosts){ctx.globalAlpha=g.life/.2*.4;ctx.drawImage(g.spr,Math.round(g.x-16),Math.round(g.y-30));ctx.globalAlpha=1}}
function drawOverFx(rings){
  for(const b of G.beams)drawBeam(b);
  drawStreams();
  for(const p of G.proj)if(p.kind!=='drop')drawProj(p);
  if(rings)for(const r of G.rings)drawRing(r);
  for(const p of G.parts){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.col;ctx.fillRect(Math.round(p.x),Math.round(p.y),p.sz,p.sz)}ctx.globalAlpha=1;
  for(const t of G.texts){ctx.globalAlpha=Math.min(1,t.life/t.max*2);ptext(t.txt,t.x,t.y,t.col,8)}ctx.globalAlpha=1;
  if(G.route&&typeof routePrompt==='function')routePrompt();
}
function drawScreen(cx,cy){
  ctx.setTransform(1,0,0,1,0,0);
  // offscreen enemy arrow
  const e=G.route?(G.focus&&alive(G.focus)?G.focus:null):G.f[1];if(alive(e)){const ep=scrP(e.x,e.y-10,cx,cy),ex=ep[0],ey=ep[1];if(ex<0||ex>W||ey<0||ey>H){const ax=clamp(ex,14,W-14),ay=clamp(ey,14,H-14),an=Math.atan2(ey-H/2,ex-W/2);ctx.save();ctx.translate(ax,ay);ctx.rotate(an);ctx.fillStyle='#282830';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-6,-7);ctx.lineTo(-6,7);ctx.fill();ctx.fillStyle='#f85838';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-5);ctx.lineTo(-4,5);ctx.fill();ctx.restore();ptext(Math.round(Math.hypot(e.x-G.f[0].x,e.y-G.f[0].y)/16)+'m',ax-Math.cos(an)*16,ay-Math.sin(an)*12,'#ffffff',8)}}
  {const pb=G.balls.find(b=>b.owner===G.f[0]);if(pb){const bp=scrP(pb.x,pb.y,cx,cy),bx=bp[0],by=bp[1];if(bx<0||bx>W||by<0||by>H){const ax=clamp(bx,12,W-12),ay=clamp(by,12,H-12),an=Math.atan2(by-H/2,bx-W/2);ctx.save();ctx.translate(ax,ay);ctx.rotate(an);ctx.fillStyle='#163c6e';ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-5,-6);ctx.lineTo(-5,6);ctx.fill();ctx.fillStyle='#96d6f6';ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-3,-4);ctx.lineTo(-3,4);ctx.fill();ctx.restore();ptext('BALL',ax-Math.cos(an)*16,ay-Math.sin(an)*11,'#e2f8ff',8)}}}
  if(!(G.story&&WW<=W&&WH<=H))drawMinimap();
  if(G.flash>0){ctx.globalAlpha=Math.min(.6,G.flash);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}
  if(G.boss&&!G.boss.gone&&typeof bossBar==='function')bossBar();
  if(G.banner)drawBanner(G.banner);
  if(G.start>0){const r=G.start-.6,n=Math.ceil(r);if(n>0){const ph=r-Math.floor(r)||1,pop=1+Math.max(0,ph-.8)*2.2;slantPoly(W/2-30*pop,W/2+30*pop,H/2-40,40*pop,9*pop,'#1c1c28','#f8c838',2);ptext(String(n),W/2,H/2-40,'#ffffff',30*pop)}
    else{const k=G.start/.6,pop=1+(1-k)*.25;ctx.globalAlpha=Math.min(1,k*2.5);slantPoly(W/2-62*pop,W/2+62*pop,H/2-40,40*pop,10,'#e8502a','#ffffff',2);ptext('GO!',W/2,H/2-40,'#f8c838',30*pop);ctx.globalAlpha=1}}
  if(G.over){const won=G.winner===0,k=Math.min(1,(1.6-(G.overT||0))*5);slantPoly(-20,-20+(W+40)*k,H/2-40,36,12,won?'#e8502a':'#2a6ee8','#1c1c28',3);ptext(won?'YOU WON!':'YOU LOST...',W/2,H/2-40,won?'#f8c838':'#dfe8ff',24)}
  if(G.paused)return;
  const mx=Math.round(M.sx),my=Math.round(M.sy);ctx.fillStyle='#282830';ctx.fillRect(mx-5,my-1,11,3);ctx.fillRect(mx-1,my-5,3,11);ctx.fillStyle='#ffffff';ctx.fillRect(mx-4,my,3,1);ctx.fillRect(mx+2,my,3,1);ctx.fillRect(mx,my-4,1,3);ctx.fillRect(mx,my+2,1,3);ctx.fillStyle='#f85838';ctx.fillRect(mx,my,1,1);
}
// slanted HUD plate: parallelogram from x0..x1 centred on yc, height h, slant sl; fill + outline (ol px)
function slantPoly(x0,x1,yc,h,sl,fill,ol,olw=2){const y0=yc-h/2,y1=yc+h/2;const P=(e)=>{ctx.beginPath();ctx.moveTo(x0+sl-e,y0-e);ctx.lineTo(x1+sl+e,y0-e);ctx.lineTo(x1-sl+e,y1+e);ctx.lineTo(x0-sl-e,y1+e);ctx.closePath()};
  if(ol){P(olw);ctx.fillStyle=ol;ctx.fill()}P(0);ctx.fillStyle=fill;ctx.fill()}
// "X used Y!" banner: slides in from the user's side with a type-coloured accent block and speed lines
function drawBanner(b){const T=b.lvl?1.6:1.3,age=T-b.t,k=1-Math.pow(1-Math.min(1,age*5.5),3),yc=H/2-58,bh=28,sl=10,dir=b.side?-1:1,bw=Math.min(W*.72,330)*k;
  ctx.save();ctx.globalAlpha=Math.min(1,b.t*4);
  const L=b.side?W-bw:-30,R=b.side?W+30:bw;
  slantPoly(L,R,yc+3,bh,sl,'rgba(10,12,30,.35)');
  slantPoly(L,R,yc,bh,sl,'#f8f8f4','#1c1c28',2);
  ctx.save();ctx.beginPath();ctx.moveTo(L+sl,yc-bh/2);ctx.lineTo(R+sl,yc-bh/2);ctx.lineTo(R-sl,yc+bh/2);ctx.lineTo(L-sl,yc+bh/2);ctx.closePath();ctx.clip();
  ctx.fillStyle='#ebeae3';ctx.fillRect(L-sl,yc+3,R-L+2*sl,bh);ctx.fillStyle=b.col;ctx.fillRect(L-sl,yc+bh/2-4,R-L+2*sl,4);
  ctx.globalAlpha*=.55;for(let i=0;i<4;i++){const lx=((age*520*dir+i*97)%(R-L+80)+(R-L+80))%(R-L+80)+L-40;ctx.fillStyle=b.col;ctx.fillRect(Math.round(lx),Math.round(yc-9+i*5),26+i*6,1)}
  ctx.restore();
  const bx=b.side?W-bw+18:bw-18,tw=Math.min(118,bw*.5);const tx0=b.side?W-tw-22:22;slantPoly(tx0,tx0+tw,yc-bh/2-5,12,4,b.col,'#1c1c28',1.5);
  ptext(b.who.toUpperCase()+(b.lvl||b.raw?'':' USED'),tx0+tw/2,yc-bh/2-5,'#ffffff',7.5);
  if(k>.6){ctx.globalAlpha=Math.min(1,b.t*4)*Math.min(1,(k-.6)*3);const txt=b.lvl?'GREW TO '+b.txt:b.raw?b.txt:b.txt+'!';ptext(txt,b.side?W-26:26,yc+1,'#1c1c28',13,b.side?'right':'left',{dark:1})}
  ctx.restore()}
let MINI=null;
function drawMinimap(){const s=Math.min(1,72/MH),w=Math.ceil(MW*s),h=Math.ceil(MH*s),x0=W-w-6,y0=H-h-6;
  if(!MINI){MINI=mkCanvas(w,h);const c=MINI.getContext('2d');for(let Y=0;Y<MH;Y++)for(let X=0;X<MW;X++){const g=MAP.ground[Y][X],o=MAP.obj[Y][X];c.fillStyle=o?(o===2?'#9098a8':'#2a6a2a'):MAP.walk[Y][X]&&g!==2?'#7a6a58':g===2?'#5898f0':g===1||g===8?'#e2ca92':g===3?'#4ea24a':g===6?'#b8b0a8':g===7?'#a87040':'#88d070';c.fillRect(X*s,Y*s,Math.max(1,s),Math.max(1,s))}}
  ctx.fillStyle='#282830';ctx.fillRect(x0-2,y0-2,w+4,h+4);ctx.fillStyle='#f8f8f0';ctx.fillRect(x0-1,y0-1,w+2,h+2);ctx.globalAlpha=.9;ctx.drawImage(MINI,x0,y0);ctx.globalAlpha=1;
  ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.strokeRect(x0+G.cam.x/TS*s+.5,y0+G.cam.y/TS*s+.5,(r3dOn()&&G.camW||W)/TS*s,(r3dOn()&&G.camH||H)/TS*s);
  for(const p of G.pods){ctx.fillStyle=p.owner.side?'#f85838':'#f8a830';ctx.fillRect(Math.round(x0+p.x/TS*s),Math.round(y0+p.y/TS*s),1,1)}
  for(const b of G.balls)if(b.owner.side===0){ctx.fillStyle='#163c6e';ctx.fillRect(Math.round(x0+b.x/TS*s)-1,Math.round(y0+b.y/TS*s)-1,3,3);ctx.fillStyle='#96d6f6';ctx.fillRect(Math.round(x0+b.x/TS*s),Math.round(y0+b.y/TS*s),1,1)}
  G.f.forEach(f=>{if(!alive(f)||(f.mode==='veil'&&f.side!==0))return;ctx.fillStyle='#282830';ctx.fillRect(Math.round(x0+f.x/TS*s)-2,Math.round(y0+f.y/TS*s)-2,4,4);ctx.fillStyle=f.side?'#f85838':'#f8d030';ctx.fillRect(Math.round(x0+f.x/TS*s)-1,Math.round(y0+f.y/TS*s)-1,2,2)})}

/* ================= HUD ================= */
const $=id=>document.getElementById(id);
let HUD=null;
function chips(types){return types.map(t=>`<span class="ty" style="--tc:${TC[t]}">${t.toUpperCase()}</span>`).join('')}
function buildHud(){
  const h=$('hud');h.innerHTML='';HUD={side:[],ab:[]};
  [G.f[0],G.route?{team:[],route:1}:G.f[1]].forEach((f,si)=>{const d=document.createElement('div');d.className='gba hpbox p'+si;
    d.innerHTML=`<div class="row1"><span class="picw"><canvas class="px pic"></canvas></span><div class="nmw"><div class="nm"><b class="n"></b><span class="lv"></span><span class="tys"></span></div><div class="hpl"><span class="hplab">HP</span><span class="bar"><span class="sh"></span><b></b></span></div><div class="sub"><span class="status"></span><span class="hpn"></span></div></div></div><div class="ult"${f.route?' hidden':''}><span>ULT</span><i><b></b></i></div>${si===0&&(G.story||G.route)?'<div class="xpl"><span>EXP</span><i><b></b></i><em></em></div>':''}<div class="pips">${f.team.map((u,i)=>`<div class="pip"><canvas class="px"></canvas><i></i><em>${i+1}</em></div>`).join('')}</div>`;
    h.appendChild(d);const pips=[...d.querySelectorAll('.pip')];pips.forEach((p,i)=>portrait(p.querySelector('canvas'),f.team[i].m.id));
    HUD.side.push({el:d,cv:d.querySelector('.pic'),n:d.querySelector('.n'),lv:d.querySelector('.lv'),ty:d.querySelector('.tys'),barw:d.querySelector('.bar'),bar:d.querySelector('.bar b'),sh:d.querySelector('.bar .sh'),hpn:d.querySelector('.hpn'),st:d.querySelector('.status'),ult:d.querySelector('.ult'),ultb:d.querySelector('.ult b'),xpb:d.querySelector('.xpl b'),xpe:d.querySelector('.xpl em'),pips,last:null,snap:0})});
  const bar=document.createElement('div');bar.className='gba moves';
  for(let i=0;i<3;i++){const a=document.createElement('div');a.className='mv';a.innerHTML=`<div class="kc"><span class="k">${i<2?`<span class="mouse ${i?'r':'l'}"></span>`:'R'}</span><i class="sw"></i><span class="cd"></span></div><div class="mvb"><div class="n"></div><div class="t"><span class="tt"></span><em></em></div><div class="am"></div></div>`;bar.appendChild(a);HUD.ab.push({el:a,k:a.querySelector('.k'),n:a.querySelector('.n'),tt:a.querySelector('.tt'),e:a.querySelector('em'),cd:a.querySelector('.cd'),am:a.querySelector('.am'),key:'',cool:false})}
  const sp=document.createElement('div');sp.className='mv special';sp.innerHTML='<div class="k">STATE</div><div class="n"></div><div class="meter"></div>';bar.appendChild(sp);HUD.sp={n:sp.querySelector('.n'),m:sp.querySelector('.meter')};
  const ds=document.createElement('div');ds.className='mv special dashp';ds.innerHTML='<div class="k">SHIFT</div><div class="n">SPRINT</div><div class="meter"></div>';bar.appendChild(ds);HUD.ds={el:ds,m:ds.querySelector('.meter')};
  h.appendChild(bar);
  const hint=document.createElement('div');hint.className='gba hint';hint.textContent='WASD move · Mouse aim · LMB / RMB · R ultimate · F reload · 1 2 3 swap · Esc pause';h.appendChild(hint);HUD.hint=hint;
}
function curMoves(f){const m=f.unit.m,mv=m.moves,by=n=>mv.find(x=>x.n===n);
  switch(m.id){case'bulwhale':return[f.mode==='turret'?by('Water Gun'):by('Water Blob'),by('Turret Mode'),by('Hydro Cannon')];
    case'fistinel':return[f.mode==='guard'?by('Counter Blast'):by('Flurry Jab'),by('Guard Up'),by('Flying Kick')];
    case'voltusk':return[by('Tusk Spark'),f.mode==='roll'?by('Discharge'):by('Boulder Roll'),by('Fault Spark')];
    default:return[mv[0],mv[1],mv[2]]}}
function special(f){switch(f.unit.m.id){
  case'bulwhale':return[(f.mode==='turret'?'TURRET':'WALKING')+' · TANK '+Math.round(f.unit.ammo),f.unit.ammo/100];
  case'fistinel':return[f.mode==='guard'?'GUARD · '+Math.round(f.absorbed)+' stored':'READY',f.mode==='guard'?Math.min(1,f.absorbed/170):0];
  case'frostbunt':{const b=G.balls.find(b=>b.owner===f);return[f.homerT>0?'HOMER '+f.homerT.toFixed(1)+'s':b?(b.live?'BALL IN FLIGHT':'BALL LV '+b.charge+'/'+BALL_MAX+' · '+Math.round(ballPow(b))+' POW'):'NO BALL',f.homerT>0?f.homerT/7:b?b.charge/BALL_MAX:0]}
  case'snipant':return[f.frenzyT>0?'FRENZY '+f.frenzyT.toFixed(1)+'s':f.unit.cd[1]>0?'DASH '+f.unit.cd[1].toFixed(1)+'s':'DASH READY',f.frenzyT>0?f.frenzyT/4:1-f.unit.cd[1]/3.5];
  case'scrattle':return[f.windT>0?'WINDING UP...':f.unit.cd[1]>0?'TAIL '+f.unit.cd[1].toFixed(1)+'s':'TAIL READY',1-f.unit.cd[1]/5];
  case'cindercub':return[f.charging?'CHARGING '+Math.round(f.chargeT/1.2*100)+'%':f.unit.cd[1]>0?'FIREBALL '+f.unit.cd[1].toFixed(1)+'s':'FIREBALL READY',f.charging?f.chargeT/1.2:1-f.unit.cd[1]/4];
  case'umbrynx':return[f.mode==='rush'?'ECLIPSE '+f.rushT.toFixed(1)+'s':f.cleaveW>0?'WINDING UP...':f.unit.cd[1]>0?'CLEAVE '+f.unit.cd[1].toFixed(1)+'s':'CLEAVE READY',f.mode==='rush'?f.rushT/5:1-f.unit.cd[1]/4];
  case'verdivy':return['SEEDS '+Math.floor(f.seeds)+'/8 · PODS '+G.pods.filter(p=>p.owner===f).length,f.seeds/8];
  case'voltusk':return[f.mode==='roll'?'ROLLING · '+Math.round((f.mom||0)*100)+'% MOMENTUM':f.faultW>0?'QUAKING...':f.unit.cd[1]>0?'ROLL '+f.unit.cd[1].toFixed(1)+'s':'ROLL READY',f.mode==='roll'?(f.mom||0):1-f.unit.cd[1]/5];
  case'mesmamba':{const n=G.fires.filter(q=>q.tox&&q.owner===f).length;return[f.link?'LINKED · CRUSH IN '+Math.max(0,LINK_T-f.link.time).toFixed(1)+'s':(f.unit.cd[1]>0?'GAZE '+f.unit.cd[1].toFixed(1)+'s':'GAZE READY')+' · POOLS '+n,f.link?f.link.time/LINK_T:1-f.unit.cd[1]/8]}
  case'phantern':return[f.mode==='veil'?'VEILED '+f.veilT.toFixed(1)+'s':f.unit.cd[1]>0?'HOOK '+f.unit.cd[1].toFixed(1)+'s':'HOOK READY',f.mode==='veil'?f.veilT/4.5:1-f.unit.cd[1]/4.5]}}
function updHud(){
  const FOC=G.route?(G.focus&&alive(G.focus)&&dist(G.focus,G.f[0])<420?G.focus:null):G.f[1];
  [G.f[0],FOC].forEach((f,si)=>{const H_=HUD.side[si];H_.el.hidden=!f;if(!f)return;const u=f.unit;if(!u)return;
    if(H_.last!==u){H_.last=u;portrait(H_.cv,u.m.id);H_.n.innerHTML=(f.wild?'<small>WILD</small>':'')+u.m.n.toUpperCase();H_.lv.innerHTML='<small>Lv</small>'+u.lv;H_.ty.innerHTML=chips(u.m.types);H_.barw.classList.add('snap');H_.snap=3}
    else if(H_.snap>0&&--H_.snap===0)H_.barw.classList.remove('snap');
    const p=Math.max(0,u.hp/u.max),w=(p*100).toFixed(2)+'%';if(H_.bar.style.width!==w){H_.bar.style.width=w;H_.sh.style.width=w}const bc=p>.5?'':p>.2?'mid':'low';if(H_.bar.className!==bc)H_.bar.className=bc;
    const hn=Math.max(0,Math.ceil(u.hp))+'<small>/'+u.max+'</small>';if(H_.hpn.innerHTML!==hn)H_.hpn.innerHTML=hn;
    const s=[];if(f.st.burn>0)s.push(['BRN','#f08030']);if(f.st.slowT>0)s.push(['SLW','#5ab8c8']);if(f.st.stun>0)s.push(['STN','#e0b020']);if(f.mode==='turret')s.push(['TUR','#6890f0']);if(f.mode==='guard')s.push(['GRD','#8a8aa8']);if(f.mode==='rush')s.push(['RSH','#a060e0']);
    if(f.mode==='roll')s.push(['ROL','#b8a038']);if(f.mode==='veil')s.push(['VEL','#705898']);if(f.link)s.push(['LNK','#f85888']);
    const sh=s.map(([t,c])=>`<span style="background:${c}">${t}</span>`).join('');if(H_.st.innerHTML!==sh)H_.st.innerHTML=sh;
    if(si===0&&H_.xpb){const c=typeof OW!=='undefined'&&OW.party[f.idx];if(c){const a=XPN(c.lv),b=XPN(c.lv+1),k=Math.max(0,Math.min(1,(c.xp-a)/(b-a))),w=(k*100).toFixed(1)+'%';if(H_.xpb.style.width!==w)H_.xpb.style.width=w;const t=Math.round(k*100)+'%';if(H_.xpe.textContent!==t)H_.xpe.textContent=t}}
    H_.ultb.style.width=u.ult+'%';H_.ult.classList.toggle('full',u.ult>=100);
    H_.pips.forEach((pp,i)=>{const v=f.team[i];if(!v)return;pp.classList.toggle('act',i===f.idx);pp.classList.toggle('ko',v.hp<=0);pp.querySelector('i').style.width=Math.max(0,v.hp/v.max*100)+'%'})});
  const f=G.f[0],u=f.unit,o=FOC?FOC.unit:null,mv=curMoves(f);
  mv.forEach((x,i)=>{const a=HUD.ab[i];const key=x.n+'|'+x.t;if(a.key!==key){a.key=key;a.n.textContent=x.n.toUpperCase();a.tt.textContent=x.t.toUpperCase();a.el.style.setProperty('--tc',TC[x.t])}
    const e=o?eff(x.t,o.m.types):1,et=e===1?'':effTxt(e),ec=e<=.3?'zero':e<1?'bad':'good';if(a.e.textContent!==et)a.e.textContent=et;if(a.e.className!==ec)a.e.className=ec;
    let frac=0,txt='';if(i===0){frac=u.cd[0]/(x.cd||1);if(x.cd===0)frac=0;const A=u.m.ammo;let ak;
      if(A.unit==='tank')ak='T'+Math.round(u.ammo)+(u.rl>0?'r':'');else if(A.max<=16)ak='P'+Math.ceil(u.ammo)+(u.rl>0?'r':'');else ak='B'+Math.round(u.ammo/A.max*50)+(u.rl>0?'r':'');
      if(a.ak!==ak){a.ak=ak;const rl=u.rl>0;if(A.unit==='tank'){a.am.className='am tank'+(rl?' rl':'');a.am.innerHTML=`<b style="width:${Math.max(0,Math.min(100,u.ammo))}%"></b>`}else if(A.max<=16){a.am.className='am'+(rl?' rl':'');const n=Math.ceil(u.ammo);let hh='';for(let j=0;j<A.max;j++)hh+=j<n?'<i></i>':'<i class="e"></i>';a.am.innerHTML=hh}else{a.am.className='am tank'+(rl?' rl':'');a.am.innerHTML=`<b style="width:${u.ammo/A.max*100}%"></b>`}}
      if(u.rl>0){frac=u.rl/A.rl;txt=u.rl.toFixed(1)}}
    else if(i===1){frac=u.cd[1]/(x.cd||1);if(u.m.id==='verdivy'&&f.seeds<8){frac=1-f.seeds/8;txt=Math.floor(f.seeds)+'/8'}else txt=u.cd[1]>.05?u.cd[1].toFixed(1):''}
    else{frac=1-u.ult/100;txt=u.ult<100?Math.floor(u.ult)+'%':''}
    frac=Math.max(0,Math.min(1,frac));a.el.style.setProperty('--cd',frac>.001?frac.toFixed(3):0);if(a.cd.textContent!==txt)a.cd.textContent=txt;
    const cool=frac>.001&&i<2;if(cool!==a.cool){if(a.cool&&!cool){a.el.classList.remove('flash');void a.el.offsetWidth;a.el.classList.add('flash')}a.cool=cool;a.el.classList.toggle('cool',cool)}
    a.el.classList.toggle('ready',i===2&&u.ult>=100)});
  if(HUD.ds){const ok=canSprint(f);HUD.ds.m.style.setProperty('--k',ok?1:0);HUD.ds.el.classList.toggle('rdy',ok);const t=ok?'SPRINT':'IN COMBAT';const nn=HUD.ds.el.querySelector('.n');if(nn.textContent!==t)nn.textContent=t}
  const [t,k]=special(f);if(HUD.sp.n.textContent!==t)HUD.sp.n.textContent=t;HUD.sp.m.style.setProperty('--k',Math.max(0,Math.min(1,k||0)));
  HUD.hint.style.opacity=G.time<(G.route?14:7)?1:0;if(G.route){const ht=(typeof routeHint==='function')?routeHint():'';if(HUD.hint.dataset.r!==ht){HUD.hint.dataset.r=ht;HUD.hint.textContent=ht}}
}

/* ================= AUDIO ================= */
let AC=null,muted=false;const sfxT={};
function tone(f1,f2,d,type='square',vol=.04,delay=0){if(!AC||muted)return;const t0=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f1,t0);o.frequency.exponentialRampToValueAtTime(Math.max(30,f2),t0+d);g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+d);o.connect(g).connect(AC.destination);o.start(t0);o.stop(t0+d+.02)}
function sfx(k,e){if(!AC||muted)return;const now=performance.now();if(sfxT[k]&&now-sfxT[k]<45)return;sfxT[k]=now;
  switch(k){case'dart':tone(900,500,.04,'square',.015);break;case'splash':tone(500,180,.1,'triangle',.04);break;case'hit':tone(e>1?540:e<1?160:280,80,.09,'square',e>1?.05:.035);break;case'boom':tone(180,40,.22,'sawtooth',.04);break;case'dash':tone(300,900,.12,'triangle',.035);break;case'blink':tone(1200,500,.1,'sine',.04);break;case'punch':tone(220,80,.08,'square',.045);break;case'jab':tone(320,160,.04,'square',.02);break;case'swing':tone(600,300,.06,'triangle',.03);break;case'crack':tone(1400,300,.08,'square',.06);tone(200,60,.15,'sawtooth',.04);break;case'bonk':tone(420,300,.05,'triangle',.03);break;case'plant':tone(200,420,.12,'triangle',.04);break;case'charge':tone(200,800,.45,'sawtooth',.03);break;case'ult':tone(392,784,.12,'square',.05);tone(523,1046,.18,'square',.04,.1);break;case'ko':tone(700,60,.7,'triangle',.06);break;case'swap':tone(500,700,.08,'square',.03);tone(700,1000,.08,'square',.03,.08);break;case'reload':tone(300,200,.08,'square',.03);break;case'reloaded':tone(600,900,.07,'square',.035);break;case'charge1':case'charge2':case'charge3':case'charge4':case'charge5':tone(400+ +k.slice(6)*120,600+ +k.slice(6)*160,.08,'triangle',.04);break;case'blip':tone(900,900,.04,'square',.025);break;case'tick':tone(700,700,.03,'square',.02);break;case'door':tone(260,180,.12,'triangle',.04);break;case'go':tone(523,523,.12,'square',.05);tone(784,784,.22,'square',.05,.12);break}}

/* ================= SELECT SCREEN ================= */
const sel={team:[],focus:'bulwhale',diff:'normal',stage:'meadow'};
const STAT_MAX={hp:120,dmg:120,pdef:120,mdef:120,int:120,spe:120};
const STAT_LBL=[['hp','HP'],['dmg','DAMAGE'],['pdef','PHYS DEF'],['mdef','MAGIC DEF'],['int','INTELLECT'],['spe','SPEED']];
const STAT_COL={hp:['#3fd46a','#b6f7a8'],dmg:['#ee5a3a','#ffb09a'],pdef:['#e0a820','#fde58a'],mdef:['#3f86e0','#a8d4ff'],int:['#9a5ae0','#d8b8ff'],spe:['#e85a9a','#ffb8d8']};
function miniBars(m){return STAT_LBL.map(([k,l])=>`<span>${l==='DAMAGE'?(m.cls==='mag'?'MAG':'ATK'):l==='HP'?'HP':l.split(' ')[0].slice(0,3)} ${m.stats[k]}<i><b style="width:${Math.min(100,m.stats[k]/STAT_MAX[k]*100)}%;--sc:${STAT_COL[k][0]}"></b></i></span>`).join('')}
function clsChip(m){return `<span class="ty" style="--tc:${m.cls==='mag'?'#8858c8':'#c86830'}">${m.cls==='mag'?'MAGIC':'PHYSICAL'}</span>`}
function miniStats(m){return STAT_LBL.map(([k,l])=>`<span>${l==='DAMAGE'?(m.cls==='mag'?'MAG':'ATK'):l.split(' ')[0].slice(0,4)} ${m.stats[k]}</span>`).join('')}
function buildRoster(){const r=$('roster');r.innerHTML='';
  ROSTER().forEach(m=>{const b=document.createElement('button');b.type='button';b.className='slotcard';b.id='card-'+m.id;
    b.innerHTML=`<span class="ord" hidden></span><span class="ball"></span><canvas class="px"></canvas><span class="info"><span class="nm">${m.n.toUpperCase()}</span><span class="role">${m.role}</span><span class="tys">${chips(m.types)}${clsChip(m)}</span><span class="mini">${miniBars(m)}</span></span>`;
    b.style.setProperty('--tc',TC[m.types[0]]);b.style.setProperty('--tc2',TC[m.types[1]||m.types[0]]);portrait(b.querySelector('canvas'),m.id);
    b.addEventListener('mouseenter',()=>{sel.focus=m.id;renderDetail()});b.addEventListener('focus',()=>{sel.focus=m.id;renderDetail()});
    b.addEventListener('click',()=>{const i=sel.team.indexOf(m.id);if(i>=0)sel.team.splice(i,1);else if(sel.team.length<3)sel.team.push(m.id);sel.focus=m.id;renderSel()});
    r.appendChild(b)})}
let animT=0,animTimer=null;
function renderDetail(){const m=MON[sel.focus];
  const L50=calcStats(m,50);const st=(l,k)=>`<div class="stat"><span class="sl">${l}</span><span class="sv">${m.stats[k]}</span><i><b style="width:${Math.min(100,m.stats[k]/STAT_MAX[k]*100)}%;--sc:${STAT_COL[k][0]};--sc2:${STAT_COL[k][1]}"></b></i><span class="sv l50">${k==='hp'?L50.max:L50[k]}</span></div>`;
  const mv=x=>`<li><span class="key ${x.k==='E'?'ult':''}">${x.k==='E'?'R':x.k}</span><div><div class="mn"><b>${x.n.toUpperCase()}</b><span class="ty" style="--tc:${TC[x.t]}">${x.t.toUpperCase()}</span></div><div class="mm"><span>POW ${x.pow}</span><span>${x.k==='E'?'Ultimate':x.cd?'CD '+x.cd+'s':'—'}</span>${x.mode?`<span class="md">${x.mode.toUpperCase()}</span>`:''}</div><p>${x.d}</p></div></li>`;
  $('detail').innerHTML=`<div class="sumhead"><span>CREATURE INFO</span><span>${m.role.toUpperCase()}</span></div><div class="sumtop"><div class="stagebox" style="--tc:${TC[m.types[0]]}"><canvas class="px" id="bigspr"></canvas></div><div class="idbox"><h2>${m.n.toUpperCase()}</h2><div class="tys">${chips(m.types)}</div><p>${m.blurb}</p></div></div>
  <div class="sumhead alt"><span>BASE STATS · ${m.cls==='mag'?'MAGIC USER':'PHYSICAL USER'}</span><span>AT LV50</span></div><div class="stats">${STAT_LBL.map(([k,l])=>st(k==='dmg'?(m.cls==='mag'?'MAGIC':'ATTACK'):l,k)).join('')}<p class="statnote">Damage uses ${m.cls==='mag'?'MAGIC vs the target\'s MAGIC DEF':'ATTACK vs the target\'s PHYS DEF'}. INTELLECT speeds up right-click and ultimate recharge. SPEED is running speed (${Math.round(moveSpeed({m,spe:L50.spe}))} px/s at Lv50).</p></div>
  <div class="ammo"><b>AMMO</b> ${m.ammo.d}</div><div class="sumhead alt2"><span>MOVES</span><span>DMG = POW × DMG ÷ DEF × LEVEL</span></div><ul class="mvlist">${m.moves.map(mv).join('')}</ul>`;
  const cv=$('bigspr');let i=0;const dirs=['down','left','up','right'];clearInterval(animTimer);const draw=()=>{const d=dirs[Math.floor(i/4)%4],fr=i%2;cv.width=32;cv.height=32;const x=cv.getContext('2d');x.clearRect(0,0,32,32);x.drawImage(SPR[m.id].norm[d][fr].c,0,0,32,32);i++};draw();animTimer=setInterval(draw,260)}
function renderSel(){
  ROSTER().forEach(m=>{const c=$('card-'+m.id),i=sel.team.indexOf(m.id);c.classList.toggle('on',i>=0);c.classList.toggle('focus',sel.focus===m.id);const o=c.querySelector('.ord');o.hidden=i<0;o.textContent=i+1;c.setAttribute('aria-pressed',i>=0)});
  const s=$('slots');s.innerHTML='';
  for(let i=0;i<3;i++){const id=sel.team[i],d=document.createElement('button');d.type='button';d.className='tslot'+(id?' full':'');
    if(id){d.innerHTML=`<canvas class="px"></canvas><span>${MON[id].n.toUpperCase()}</span>`;portrait(d.querySelector('canvas'),id);d.addEventListener('click',()=>{sel.team.splice(i,1);renderSel()})}else d.innerHTML=`<span>${i===0?'LEAD':'SLOT '+(i+1)}</span>`;
    s.appendChild(d)}
  const fb=$('fight');fb.disabled=sel.team.length<3;fb.textContent=sel.team.length<3?`PICK ${3-sel.team.length} MORE`:'BATTLE!';
  renderDetail()}
function pickRandom(n,exclude=[]){const pool=ROSTER().map(m=>m.id).filter(id=>!exclude.includes(id));const out=[];while(out.length<n&&pool.length)out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);return out}
function buildChart(){let h='<table><tr><th></th>'+TYPES.map(t=>`<th class="ch"><span class="ty" style="--tc:${TC[t]}">${t.slice(0,3).toUpperCase()}</span></th>`).join('')+'</tr>';
  for(const a of TYPES){h+=`<tr><th class="rh"><span class="ty" style="--tc:${TC[a]}">${a.toUpperCase()}</span></th>`;for(const d of TYPES){const v=CHART[a][d];const cls=v===2?'s':v===.5?'r':v===0?'z':'';h+=`<td class="${cls}">${v===2?'2':v===.5?'½':v===0?'0':''}</td>`}h+='</tr>'}
  $('chartTable').innerHTML=h+'</table>'}
function squadStats(){const f=G.f[0];$('pstats').innerHTML=f.team.map((u,i)=>{const p=Math.max(0,u.hp/u.max);return`<li class="${i===f.idx?'act':''}${u.hp<=0?' ko':''}"><canvas class="px"></canvas><b>${u.m.n.toUpperCase()}</b><span class="plv">Lv${u.lv}</span><div class="hpm"><span>HP</span><i><b class="${p>.5?'':p>.2?'mid':'low'}" style="width:${p*100}%"></b></i><span>${Math.max(0,Math.ceil(u.hp))}/${u.max}</span></div><div class="pst"><span>${u.m.cls==='mag'?'MAG':'ATK'} <b>${u.dmg}</b></span><span>PDEF <b>${u.pdef}</b></span><span>MDEF <b>${u.mdef}</b></span><span>INT <b>${u.int}</b></span><span>SPE <b>${u.spe}</b></span></div></li>`}).join('');[...$('pstats').querySelectorAll('canvas')].forEach((c,i)=>portrait(c,f.team[i].m.id))}

/* ================= FLOW ================= */
let cv,running=false,last=0;
function fit(){const fr=$('frame');const s=Math.min(innerWidth/W,innerHeight/H);fr.style.width=W*s+'px';fr.style.height=H*s+'px';const tc=$('tx');if(tc){const d=window.devicePixelRatio||1;tc.width=Math.round(W*s*d);tc.height=Math.round(H*s*d)}}
function startBattle(enemy){
  setView(BW,BH);  APP.mode='free';OW.running=false;{const S=freeStage(sel.stage||'meadow');MW=S.w;MH=S.h;WW=MW*TS;WH=MH*TS;MAP=S.map;softTrees(MAP);WORLD=S.world;SPAWN[0]={x:S.sp[0][0],y:S.sp[0][1]};SPAWN[1]={x:S.sp[1][0],y:S.sp[1][1]}}MINI=null;$('hud').hidden=false;
  if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}
  clearInterval(animTimer);
  newGame(sel.team.slice(),enemy||pickRandom(3),sel.diff);
  $('select').hidden=true;$('over').hidden=true;$('stage').hidden=false;$('pause').hidden=true;
  fit();buildHud();
  if(!running){running=true;last=performance.now();requestAnimationFrame(loop)}
}
function loop(now){if(!running)return;const dt=Math.max(0,Math.min(1/30,(now-last)/1000));last=now;if(typeof NET!=='undefined'&&NET.on&&NET.role==='guest')netGuestFrame(dt);else{update(dt);if(typeof NET!=='undefined'&&NET.on)netHostTick(dt)}render();updHud();flushText();requestAnimationFrame(loop)}
function stopBattle(){running=false;$('stage').hidden=true;$('pause').hidden=true;for(const k in K)K[k]=false;M.l=false}
function showOver(){
  const w=G.winner===0;$('ovTitle').textContent=w?'YOU WON!':'YOU LOST...';$('ovTitle').className=w?'win':'lose';
  const t=Math.round(G.time);$('ovSub').textContent=`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')} · ${{easy:'Rookie',normal:'Ace',hard:'Champion'}[G.diff]} rival · you dealt ${Math.round(G.f[0].dealt)} damage`;
  const col=(f,lab)=>`<div><h3>${lab}</h3><ul>${f.team.map((u,i)=>{const p=Math.max(0,u.hp/u.max);return`<li class="${u.hp<=0?'ko':''}" style="animation-delay:${.25+i*.07}s"><canvas class="px"></canvas><span>${u.m.n.toUpperCase()}</span><span>${u.hp<=0?'FAINTED':Math.max(0,Math.ceil(u.hp))+' HP'}</span><div class="hpm"><i><b class="${p>.5?'':p>.2?'mid':'low'}" style="width:${p*100}%"></b></i></div></li>`}).join('')}</ul></div>`;
  $('ovRes').innerHTML=col(G.f[0],'YOUR SQUAD')+col(G.f[1],'RIVAL SQUAD');[G.f[0],G.f[1]].forEach((f,k)=>[...$('ovRes').children[k].querySelectorAll('canvas')].forEach((c,i)=>portrait(c,f.team[i].m.id)));
  $('over').hidden=false;running=false}
function togglePause(){if(typeof NET!=='undefined'&&NET.on)return;if(!G||G.over||$('stage').hidden||(APP.mode!=='battle'&&APP.mode!=='free'&&APP.mode!=='route')||DLG)return;G.paused=!G.paused;$('pause').hidden=!G.paused;if(G.paused)squadStats();else last=performance.now()}
function init(){
  buildSprites();MAP=buildMap();WORLD=[paintWorld(MAP,0),paintWorld(MAP,1)];
  cv=$('cv');ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
  buildRoster();renderSel();buildChart();
  if(matchMedia('(pointer:coarse)').matches)$('touchNote').hidden=false;
  $('stagesel').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sel.stage=b.dataset.s;[...$('stagesel').children].forEach(x=>x.classList.toggle('on',x===b))});
  $('diff').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sel.diff=b.dataset.d;[...$('diff').children].forEach(x=>x.classList.toggle('on',x===b))});
  $('rand').addEventListener('click',()=>{sel.team=pickRandom(3);sel.focus=sel.team[0];renderSel()});
  $('chartBtn').addEventListener('click',()=>$('chart').hidden=false);$('chartClose').addEventListener('click',()=>$('chart').hidden=true);$('chart').addEventListener('click',e=>{if(e.target.id==='chart')$('chart').hidden=true});
  $('fight').addEventListener('click',()=>startBattle());
  $('again').addEventListener('click',()=>{sel.team=G.pIds.slice();startBattle(G.eIds.slice())});
  $('back').addEventListener('click',()=>{stopBattle();APP.mode='title';$('over').hidden=true;$('select').hidden=false;renderSel()});
  $('resume').addEventListener('click',togglePause);
  $('quit').addEventListener('click',()=>{if(G&&(G.story||G.route)){G.paused=false;$('pause').hidden=true;toTitle();return}stopBattle();$('select').hidden=false;renderSel()});
  $('mute').addEventListener('click',()=>{muted=!muted;$('mute').textContent='SOUND: '+(muted?'OFF':'ON')});
  addEventListener('resize',()=>{if(!$('stage').hidden)fit()});
  addEventListener('keydown',e=>{if($('stage').hidden)return;if(APP.mode!=='battle'&&APP.mode!=='free'&&APP.mode!=='route')return;if(e.code==='Escape'){if(APP.mode==='route'&&typeof openOwMenu==='function'&&!DLG&&!G.over){if(!$('chart').hidden){$('chart').hidden=true;return}OW.menuOpen?closeOwMenu():openOwMenu();return}togglePause();return}if(G&&G.paused)return;
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
    K[e.code]=true;if(e.code==='KeyR'&&!e.repeat)K.eAt=G.t;if(e.code==='KeyF'&&!e.repeat)K.rlAt=G.t;if(/^Digit[123]$/.test(e.code))K.swap=+e.code.slice(5)-1;if(e.code==='KeyM')muted=!muted});
  addEventListener('keyup',e=>{K[e.code]=false});
  addEventListener('blur',()=>{for(const k in K)if(k.startsWith('Key')||k.startsWith('Arrow'))K[k]=false;M.l=false});
  const toScreen=e=>{const r=cv.getBoundingClientRect();M.sx=(e.clientX-r.left)/r.width*W;M.sy=(e.clientY-r.top)/r.height*H};
  addEventListener('mousemove',e=>{if(!$('stage').hidden)toScreen(e)});
  cv.addEventListener('mousedown',e=>{toScreen(e);if(APP.mode!=='battle'&&APP.mode!=='free'&&APP.mode!=='route'){if(e.button===0)dlgAdvance();return}if(DLG){dlgAdvance();return}if(!G||G.paused)return;if(e.button===0){M.l=true;M.lpAt=G.t}if(e.button===2){M.rAt=G.t;M.r=true}e.preventDefault()});
  addEventListener('mouseup',e=>{if(e.button===0)M.l=false;if(e.button===2)M.r=false});
  addEventListener('contextmenu',e=>{if(!$('stage').hidden)e.preventDefault()});
  if(document.fonts&&document.fonts.load)document.fonts.load('8px Silkscreen').catch(()=>{});
  storyInit();
}
