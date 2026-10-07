// Usage: node tools/shots.js <outDir> [scenario,...]
// Scenarios: title select town lab route battle millhaven maren umbrynx voltusk mesmamba phantern newwild
//   UI: dialog choice name menu lvl cut loc pause over chart start small story
// Run with NODE_PATH pointing at the scratchpad node_modules (see tools/README).
const chromium=require('@sparticuz/chromium'),pp=require('puppeteer-core'),fs=require('fs'),path=require('path');
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const out=process.argv[2]||'shots';const want=(process.argv[3]||'title,select,town,lab,route,battle,millhaven').split(',');const VW=+(process.env.VW||1280),VH=+(process.env.VH||720);
const page=path.resolve(__dirname,'../dist/page.html');
fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await pp.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true,defaultViewport:{width:VW,height:VH}});
 const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join('|')));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|Failed to load resource/.test(m.text()))errs.push('CERR '+m.text().slice(0,300))});
 await p.goto('file://'+page);await sl(600);
 const run=(sec,keys={},adv=true)=>p.evaluate(async(sec,keys,adv)=>{Object.assign(K,keys);const n=Math.round(sec*60);for(let i=0;i<n;i++){owFrame(1/60);if(adv){if(typeof CHO!=='undefined'&&CHO)CHO.ok();if(DLG)dlgAdvance(),dlgAdvance()}await new Promise(r=>setTimeout(r,2))}for(const k in keys)K[k]=false;return 1},sec,keys,adv);
 const load=async(save)=>{await p.evaluate(s=>localStorage.setItem('typeclash_save',JSON.stringify(s)),save);await p.reload();await sl(500);await p.click('#contBtn');await sl(300)};
 const base={name:'ASH',rival:'KAI',look:'player',flags:{labOpen:1,starter:'cindercub',rivalStarter:'bulwhale',rivalDone:1,rivalLeft:1,routeTut:1},party:[{id:'cindercub',lv:8,xp:512},{id:'scrattle',lv:5,xp:125}],items:{tether:5},map:'town',x:15,y:13,dir:'down'};
 const shot=async n=>{await p.screenshot({path:path.join(out,n+'.png')});console.log('shot',n)};
 for(const sc of want){try{
  if(sc==='title'){await p.evaluate(()=>localStorage.clear());await p.reload();await sl(600);await shot('title')}
  else if(sc==='select'){await p.evaluate(()=>localStorage.clear());await p.reload();await sl(400);await p.click('#freeBtn');await sl(400);await shot('select')}
  else if(sc==='town'){await load(base);await run(.8,{},false);await shot('town');await run(.6,{ArrowLeft:true},false);await shot('town_walk')}
  else if(sc==='lab'){await load(Object.assign({},base,{map:'lab',x:10,y:8}));await run(.6,{},false);await shot('lab')}
  else if(sc==='millhaven'){await load(Object.assign({},base,{flags:Object.assign({},base.flags,{millArrive:1,tetherTut:1}),map:'millhaven',x:19,y:21,dir:'up'}));await run(.6,{},false);await shot('millhaven')}
  else if(sc==='route'){await load(base);await p.evaluate(()=>{OW.p.x=15;OW.p.y=4;OW.p.px=15*16+8;OW.p.py=4*16+14});await run(1,{ArrowUp:true});await run(1.5);
    await p.evaluate(()=>{const P=G.f[0];P.x=9*16;P.y=78*16;P.invuln=99;mkWild('scrattle',4,P.x+60,P.y-10,G.route.map.zones[0]);mkWild('snipant',4,P.x-50,P.y+20,G.route.map.zones[0])});await run(1.5,{},false);await shot('route');
    await p.evaluate(()=>{M.lpAt=G.t});await run(.25,{},false);await shot('route_fight')}
  else if(sc==='dialog'||sc==='choice'){await load(base);await run(.5,{},false);await p.evaluate(sc=>{say(sc==='dialog'?"LARCH: Ah, there you are! The habitats are ready.\nTake your time and pick the partner that suits you.":"KAI: So? Are you going to battle me or what?");if(sc==='choice')setTimeout(()=>choose(['BRING IT ON','NOT YET']),0)},sc);await run(sc==='dialog'?.9:2.2,{},false);await shot(sc);
    if(sc==='choice'){await p.evaluate(()=>{CHO.down()});await run(.1,{},false);await shot('choice_2');await p.evaluate(()=>{CHO.ok();dlgAdvance();dlgAdvance()})}else await p.evaluate(()=>{dlgAdvance();dlgAdvance()})}
  else if(sc==='name'){await load(base);await run(.3,{},false);await p.evaluate(()=>{askName('NAME FOR YOUR FIELD CARD','RED',['RED','ASH','CAL','NATE'])});await sl(100);await p.type('#nameInput','ASHE');await run(.2,{},false);await shot('name');await p.evaluate(()=>NAMEB('ASHE'))}
  else if(sc==='menu'){await load(Object.assign({},base,{box:[{id:'snipant',lv:4,xp:64},{id:'scrattle',lv:3,xp:27}]}));await run(.4,{},false);await p.evaluate(()=>openOwMenu());await run(.3,{},false);await shot('menu');await p.evaluate(()=>{const b=document.querySelector('#owMenu [data-a=party]');b.click()});await run(.4,{},false);await shot('menu_team');
    await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');await run(.1,{},false);await shot('menu_keys');await p.keyboard.press('Escape');await run(.1,{},false)}
  else if(sc==='lvl'){await load(base);await run(.3,{},false);await p.evaluate(()=>{const m=MON.cindercub;showLvl(m,9,calcStats(m,8),calcStats(m,9));say('CINDERCUB grew to Lv. 9!')});await run(.8,{},false);await shot('lvl');await p.evaluate(()=>{hideLvl();dlgAdvance();dlgAdvance()})}
  else if(sc==='cut'){await load(base);await run(.3,{},false);for(const t of[.08,.3,.55,.72]){await p.evaluate(t=>{OW.cut={t};owFrame(0)},t);await shot('cut_'+Math.round(t*100))}await p.evaluate(()=>{OW.cut=null})}
  else if(sc==='loc'){await load(Object.assign({},base,{map:'millhaven',x:19,y:21,flags:Object.assign({},base.flags,{millArrive:1,tetherTut:1})}));await run(.3,{},false);await p.evaluate(()=>document.getAnimations().forEach(a=>{if(a.animationName==='loc')a.currentTime=900}));await sl(100);await shot('loc')}
  else if(sc==='story'){await p.evaluate(()=>localStorage.clear());await p.reload();await sl(400);await p.click('#newBtn');
    const adv=sec=>p.evaluate(async sec=>{const n=Math.round(sec*60);for(let i=0;i<n;i++){owFrame(1/60);if(NAMEB)NAMEB('');if(CHO)CHO.ok();if(DLG)dlgAdvance(),dlgAdvance();await new Promise(r=>setTimeout(r,2))}return APP.mode},sec);
    let md;for(let i=0;i<12;i++){md=await adv(2.5);if(i===1)await shot('story_intro')}await shot('story_'+md);console.log('story mode',md,'map',await p.evaluate(()=>OW.map&&OW.map.id))}
  else if(['start','pause','over','chart','small'].includes(sc)){
    if(sc==='chart'){await p.evaluate(()=>localStorage.clear());await p.reload();await sl(400);await p.click('#freeBtn');await sl(200);await p.click('#chartBtn');await sl(200);await shot('chart');continue}
    await p.evaluate(()=>localStorage.clear());await p.reload();await sl(400);await p.click('#freeBtn');await sl(300);
    await p.evaluate(()=>{sel.team=['cindercub','frostbunt','fistinel'];sel.diff='normal'});await p.evaluate(()=>{const b=document.getElementById('fight');b.disabled=false;b.click()});
    if(sc==='start'){await p.evaluate(async()=>{for(let i=0;i<20;i++){update(1/60);render();updHud();flushText();await new Promise(r=>setTimeout(r,2))}});await sl(120);await shot('start_a');await sl(500);await p.evaluate(async()=>{for(let i=0;i<40;i++){update(1/60);render();updHud();flushText();await new Promise(r=>setTimeout(r,2))}});await shot('start_b');continue}
    await sl(300);await p.evaluate(async()=>{for(let i=0;i<60*4;i++){update(1/60);render();updHud();flushText();await new Promise(r=>setTimeout(r,2))}});
    if(sc==='pause'){await p.keyboard.press('Escape');await sl(400);await shot('pause');await p.keyboard.press('Escape');await sl(100);const pz=await p.evaluate(()=>G.paused);if(pz)errs.push('pause did not resume');continue}
    if(sc==='over'){await p.evaluate(()=>{G.f[1].team.forEach((u,i)=>{if(i)u.hp=0});G.f[0].team[2].hp=0;G.winner=0;G.time=95;showOver()});await sl(500);await shot('over_win');await p.evaluate(()=>{G.winner=1;showOver()});await sl(500);await shot('over_lose');continue}
    if(sc==='small'){await p.setViewport({width:640,height:400});await p.evaluate(()=>fit());await p.evaluate(async()=>{for(let i=0;i<10;i++){update(1/60);render();updHud();flushText();await new Promise(r=>setTimeout(r,2))}});await shot('small_battle');await p.setViewport({width:VW,height:VH});continue}
  }
  else if(sc==='battle'||sc==='umbrynx'){await p.evaluate(()=>localStorage.clear());await p.reload();await sl(400);await p.click('#freeBtn');await sl(300);
    await p.evaluate(sc=>{sel.team=sc==='umbrynx'?['umbrynx','bulwhale','verdivy']:['cindercub','frostbunt','fistinel'];sel.diff='normal';},sc);
    await p.evaluate(()=>{const b=document.getElementById('fight');b.disabled=false;b.click()});await sl(300);
    await p.evaluate(async()=>{for(let i=0;i<60*4;i++){update(1/60);render();updHud();flushText();await new Promise(r=>setTimeout(r,2))}});
    await p.evaluate(()=>{M.lpAt=G.t;K.eAt=G.t;G.f[0].unit.ult=100;G.f[1].unit.ult=100});
    await p.evaluate(async()=>{for(let i=0;i<20;i++){update(1/60);render();updHud();flushText();await new Promise(r=>setTimeout(r,2))}});await shot(sc);
    await p.evaluate(()=>{M.rAt=G.t});await p.evaluate(async()=>{for(let i=0;i<12;i++){update(1/60);render();updHud();flushText();await new Promise(r=>setTimeout(r,2))}});await shot(sc+'_2')}
  else if(sc==='voltusk'||sc==='mesmamba'||sc==='phantern'){await p.evaluate(()=>localStorage.clear());await p.reload();await sl(400);await p.click('#freeBtn');await sl(300);
    await p.evaluate(sc=>{sel.team=[sc,'umbrynx','verdivy'];sel.diff='normal'},sc);
    await p.evaluate(()=>{const b=document.getElementById('fight');b.disabled=false;b.click()});await sl(300);
    const step=n=>p.evaluate(async n=>{for(let i=0;i<n;i++){update(1/60);render();updHud();flushText();await new Promise(r=>setTimeout(r,2))}},n);
    const setup=dx=>p.evaluate(dx=>{const P=G.f[0],E=G.f[1];G.start=0;endModes(P);P.st.stun=0;P.dash=null;P.x=40*16;P.y=28*16;E.x=P.x+dx;E.y=P.y+6;E.unit.hp=E.unit.max;P.unit.ammo=P.unit.m.ammo.max;P.unit.rl=0;P.unit.cd=[0,0];P.invuln=0;E.invuln=0;E.ai.react=9;E.st.stun=0;G.cam.x=P.x-BW/2;G.cam.y=P.y-BH/2;},dx);
    const aim=()=>p.evaluate(()=>{const E=G.f[1];M.sx=E.x-G.cam.x;M.sy=E.y-8-G.cam.y;M.x=E.x;M.y=E.y-8});
    const freeze=()=>p.evaluate(()=>{const E=G.f[1];E.ai.d=Object.assign({},E.ai.d,{agg:0,spd:.0001,dodge:0});});
    const S={voltusk:[[34,'l',5],[150,'r',40],[120,'e',24],[0,'',40]],mesmamba:[[150,'l',16],[0,'',38],[120,'r',45],[150,'e',30],[0,'',45]],phantern:[[120,'l',7],[140,'r',7],[0,'',20],[120,'e',30]]}[sc];
    await step(30);let i=0;
    for(const[dx,btn,n]of S){if(dx){await setup(dx);await freeze();await step(2)}await aim();
      await p.evaluate(b=>{if(b==='l')M.lpAt=G.t;if(b==='r')M.rAt=G.t;if(b==='e'){G.f[0].unit.ult=100;K.eAt=G.t}},btn);
      for(let k=0;k<n;k++){await aim();await step(1)}await shot(sc+'_'+(i++)+(btn||'after'))}}
  else if(sc==='newwild'){await load(Object.assign({},base,{flags:Object.assign({},base.flags,{tetherTut:1})}));await p.evaluate(()=>{OW.p.x=15;OW.p.y=4;OW.p.px=15*16+8;OW.p.py=4*16+14});await run(1,{ArrowUp:true});await run(1.5);
    await p.evaluate(()=>{const P=G.f[0];P.x=9*16;P.y=78*16;P.invuln=99;const z=G.route.map.zones[0];mkWild('voltusk',5,P.x+70,P.y-20,z);mkWild('mesmamba',5,P.x-60,P.y-30,z);mkWild('phantern',5,P.x+10,P.y+60,z)});await run(2.2,{},false);await shot('newwild');
    await p.evaluate(()=>{const w=G.f.find(f=>f.wild&&f.unit.id==='phantern');if(w){w.unit.hp=1;w.invuln=0;M.x=w.x;M.y=w.y-6;M.sx=w.x-G.cam.x;M.sy=w.y-6-G.cam.y;throwTether()}});await run(.6,{},false);await shot('newwild_tether');await run(2.6,{},false)}
 }catch(e){errs.push('SCENARIO '+sc+' failed: '+e.message)}}
 console.log(errs.length?errs.join('\n'):'no errors');await b.close()})();
