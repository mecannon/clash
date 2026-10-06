/* ===== net.js: online QUICK MATCH (3v3 vs another player) =====
   Host-authoritative: the matchmaking server pairs two players and relays messages. The HOST runs the real battle and
   streams snapshots (~30/s); the GUEST renders those snapshots and streams its inputs back. See server/README.md. */
const NET_DEFAULT='';// e.g. 'wss://typeclash-server.onrender.com' once the server is deployed
const NET={on:false,ws:null,role:null,opp:null,snapT:0,inT:0,snapQ:null,cnt:{lp:0,r:0,e:0,rl:0},prev:{},sfxq:[],seq:0,last:0};
function netURL(){let q=null;try{q=new URLSearchParams(location.search).get('server')}catch(e){}if(q){try{localStorage.setItem('typeclash_server',q)}catch(e){}return q}
  let v='';try{v=localStorage.getItem('typeclash_server')||''}catch(e){}if(v)return v;if(NET_DEFAULT)return NET_DEFAULT;
  // served by the matchmaking server itself? then it's the same host
  if(/^https?:$/.test(location.protocol)&&location.host)return(location.protocol==='https:'?'wss://':'ws://')+location.host;return''}
function netSend(o){if(NET.ws&&NET.ws.readyState===1)NET.ws.send(JSON.stringify(o))}
function netStatus(txt,showUrl){const ov=$('netov');if(!ov)return;ov.hidden=false;$('netTxt').textContent=txt;$('netUrlRow').hidden=!showUrl}
function netClose(){const ov=$('netov');if(ov)ov.hidden=true}
function netStop(){NET.on=false;NET.role=null;try{if(NET.ws)NET.ws.close()}catch(e){}NET.ws=null}
function quickMatch(){if(sel.team.length<3){toast('Pick a squad of 3 first.');return}
  const url=netURL();if(!url){netStatus('Enter your matchmaking server address (see server/README.md):',true);return}
  netStatus('Connecting to '+url.replace(/^wss?:\/\//,'')+'...');
  let ws;try{ws=new WebSocket(url)}catch(e){netStatus('Could not connect: '+e.message,true);return}
  NET.ws=ws;
  ws.onopen=()=>{netSend({t:'queue',team:sel.team.slice(),name:(OW&&OW.name)||'TRAINER',v:1});netStatus('Searching for an opponent...')};
  ws.onerror=()=>{if(!NET.on)netStatus('Connection failed. Check the server address.',true)};
  ws.onclose=()=>{if(NET.on&&G&&!G.over){toast('Connection lost.');if(NET.role==='host')endGame(0);else{G.winner=0;G.over=1;G.overT=1.6}}NET.on=false};
  ws.onmessage=ev=>{let d;try{d=JSON.parse(ev.data)}catch(e){return}netMsg(d)}}
function netMsg(d){
  if(d.t==='queued'){netStatus('Searching for an opponent... ('+(d.n||1)+' in queue)');return}
  if(d.t==='match'){NET.role=d.role;NET.opp=d;netClose();netBegin(d);return}
  if(d.t==='in'&&NET.role==='host'&&G){const f=G.f[1];if(!f)return;const R=f.remoteC||(f.remoteC={}),c=d.c;
    R.mx=c.mx;R.my=c.my;R.aim=c.aim;R.l=c.l;R.rHeld=c.rh;R.tx=c.tx;R.ty=c.ty;if(c.sw!=null)R.swap=c.sw;
    for(const[k,at]of[['lp','lpAt'],['r','rAt'],['e','eAt'],['rl','rlAt']]){if(c[k]>(R['n_'+k]||0)){R['n_'+k]=c[k];R[at]=G.t}}return}
  if(d.t==='snap'&&NET.role==='guest'){NET.snapQ=d.s;return}
  if(d.t==='left'){toast('Opponent left the match.');if(G&&!G.over){if(NET.role==='host')endGame(0);else{G.winner=0;G.over=1;G.overT=1.6}}return}}
function netBegin(d){sel.stage=d.stage||'coliseum';sel.diff='normal';NET.on=true;NET.cnt={lp:0,r:0,e:0,rl:0};NET.prev={};NET.snapQ=null;NET.snapT=0;NET.inT=0;
  // both sides build the same arena; the guest's local sim is replaced by the host's snapshots
  startBattle(d.opp.slice());NET.endSent=0;
  if(NET.role==='host'){const f=G.f[1];f.remote=true;f.remoteC={};f.ai.d=Object.assign({},f.ai.d,{spd:1})}
  toast('Matched with '+(d.oppName||'a trainer')+'!');}
/* ---------- snapshot encoding (refs to fighters / units / species become small tags) ---------- */
function netEnc(G){const F=G.f,FM=new Map(),UM=new Map();F.forEach((f,i)=>{FM.set(f,i);f.team.forEach((u,j)=>UM.set(u,[i,j]))});
  const enc=(v,dep)=>{if(v==null)return v;const t=typeof v;if(t==='number')return Number.isInteger(v)?v:Math.round(v*100)/100;if(t==='string'||t==='boolean')return v;if(t!=='object')return undefined;
    if(v instanceof Set||v instanceof Map||(typeof HTMLCanvasElement!=='undefined'&&v instanceof HTMLCanvasElement))return undefined;
    if(FM.has(v))return{$f:FM.get(v)};if(UM.has(v))return{$u:UM.get(v)};if(v.id&&MON[v.id]===v)return{$m:v.id};if(dep>5)return undefined;
    if(Array.isArray(v))return v.map(x=>enc(x,dep+1));const o={};for(const k in v){if(k==='ai'||k==='remoteC'||k==='spr'||k==='onHit')continue;const e=enc(v[k],dep+1);if(e!==undefined)o[k]=e}return o};
  const encF=f=>{const o={};for(const k in f){if(k==='ai'||k==='remoteC')continue;if(k==='team'){o.team=f.team.map(u=>{const q={};for(const k2 in u){if(k2==='m'){q.m={$m:u.m.id};continue}const e=enc(u[k2],2);if(e!==undefined)q[k2]=e}return q});continue}
    const e=enc(f[k],1);if(e!==undefined)o[k]=e}return o};
  const sfx=NET.sfxq.splice(0,8);
  return{t:G.t,time:G.time,start:G.start,over:G.over,overT:G.overT,winner:G.winner,shake:G.shake,flash:G.flash,banner:enc(G.banner,1),f:F.map(encF),
    proj:enc(G.proj,0),beams:enc(G.beams,0),rings:enc(G.rings,0),fires:enc(G.fires,0),pods:enc(G.pods,0),balls:enc(G.balls,0),texts:enc(G.texts,0),sfx}}
function netDec(s){const n=s.f.length,map=i=>i===0?1:i===1?0:i;// the guest sees itself as fighter 0 on side 0
  const F=[];for(let i=0;i<n;i++)F[map(i)]=s.f[i];
  const dec=v=>{if(v==null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(dec);if('$f'in v)return F[map(v.$f)];if('$u'in v){const f=F[map(v.$u[0])];return f&&f.team[v.$u[1]]}if('$m'in v)return MON[v.$m];
    for(const k in v)v[k]=dec(v[k]);return v};
  for(const f of F){for(const u of f.team)u.m=MON[u.m.$m]}
  for(const f of F){for(const k in f){if(k==='team')continue;f[k]=dec(f[k])}for(const u of f.team)for(const k in u){if(k!=='m')u[k]=dec(u[k])}if(f.side===0||f.side===1)f.side=1-f.side;f.ai=null}
  return{F,proj:dec(s.proj)||[],beams:dec(s.beams)||[],rings:dec(s.rings)||[],fires:dec(s.fires)||[],pods:dec(s.pods)||[],balls:dec(s.balls)||[],texts:dec(s.texts)||[],banner:s.banner?dec(s.banner):null}}
/* ---------- host ---------- */
function netHostTick(dt){NET.snapT-=dt;if(NET.snapT>0||!G)return;NET.snapT=1/30;netSend({t:'snap',s:netEnc(G)});if(G.over===2&&!NET.endSent){NET.endSent=1;setTimeout(netStop,1500)}}
/* ---------- guest ---------- */
function netGuestFrame(dt){if(!G)return;
  if(NET.snapQ){const s=NET.snapQ;NET.snapQ=null;const D=netDec(s),old=G.f;
    D.F.forEach((f,i)=>{const o=old[i];if(o&&o.unit&&f.unit&&f.unit.hp<o.unit.hp-.5&&typeof fx==='function')fx(f.x,f.y-8,'#ffffff',6,60,.3);if(o){f.animPh=o.animPh;f._la=o._la;f._lc=o._lc;f.atkP=o.atkP}});
    G.f=D.F;G.proj=D.proj;G.beams=D.beams;G.rings=D.rings;G.fires=D.fires;G.pods=D.pods;G.balls=D.balls;G.texts=D.texts;G.banner=D.banner;
    G.t=s.t;G.time=s.time;G.start=s.start;G.shake=s.shake;G.flash=s.flash;
    if(s.over&&!G.over){G.over=1;G.overT=s.overT;G.winner=s.winner===0?1:s.winner===1?0:s.winner}
    for(const n of s.sfx||[])try{sfx(n)}catch(e){}}
  // dead-reckon between snapshots so motion stays smooth
  G.dt=dt;G.t+=dt;for(const f of G.f){if(f.faintT>0)f.faintT=Math.max(.01,f.faintT-dt);else{f.x+=((f.vx||0)+(f.kvx||0))*dt;f.y+=((f.vy||0)+(f.kvy||0))*dt;if(Math.hypot(f.vx||0,f.vy||0)>.1)f.walk=(f.walk||0)+dt}if(f.hurt>0)f.hurt-=dt}
  for(const p of G.proj){p.x+=(p.vx||0)*dt;p.y+=(p.vy||0)*dt}
  if(G.banner){G.banner.t-=dt;if(G.banner.t<=0)G.banner=null}
  updCam(dt);updParts(dt);
  if(G.over){G.overT-=dt;if(G.overT<=0&&G.over===1){G.over=2;showOver();setTimeout(netStop,500)}return}
  // input packets (~30/s): edges travel as press counters so none are lost or doubled
  NET.inT-=dt;const P=G.f[0];if(!P)return;
  for(const[k,src,key]of[['lp',M,'lpAt'],['r',M,'rAt'],['e',K,'eAt'],['rl',K,'rlAt']]){const v=src[key];if(v!=null&&v>-9&&v!==NET.prev[k]){NET.prev[k]=v;NET.cnt[k]++}}
  const sw=K.swap??null;if(sw!=null)K.swap=null;
  if(NET.inT<=0||sw!=null){NET.inT=1/30;const mx=((K.KeyD||K.ArrowRight)?1:0)-((K.KeyA||K.ArrowLeft)?1:0),my=((K.KeyS||K.ArrowDown)?1:0)-((K.KeyW||K.ArrowUp)?1:0);
    netSend({t:'in',c:{mx,my,aim:Math.round(Math.atan2(M.y-(P.y-6),M.x-P.x)*1000)/1000,l:!!M.l,rh:!!M.r,tx:Math.round(M.x),ty:Math.round(M.y),sw,lp:NET.cnt.lp,r:NET.cnt.r,e:NET.cnt.e,rl:NET.cnt.rl}})}}
/* ---------- sound relay + UI wiring ---------- */
{const _s=sfx;sfx=function(n){if(NET.on&&NET.role==='host')NET.sfxq.push(n);return _s.apply(this,arguments)}}
function netUI(){const fb=$('fight');if(!fb||$('qmBtn'))return;
  const b=document.createElement('button');b.type='button';b.className='btn';b.id='qmBtn';b.textContent='ONLINE QUICK MATCH';b.onclick=quickMatch;fb.insertAdjacentElement('afterend',b);
  const ov=document.createElement('div');ov.id='netov';ov.hidden=true;ov.innerHTML=`<div class="gba"><h3>QUICK MATCH</h3><p id="netTxt"></p><div id="netUrlRow" hidden><input id="netUrl" placeholder="wss://your-server.example.com" spellcheck="false"><button type="button" class="btn" id="netSave">SAVE &amp; CONNECT</button></div><button type="button" class="btn" id="netCancel">CANCEL</button></div>`;
  document.body.appendChild(ov);$('netUrl').value=netURL()||'';
  $('netSave').onclick=()=>{const v=$('netUrl').value.trim();if(!v)return;try{localStorage.setItem('typeclash_server',v)}catch(e){}quickMatch()};
  $('netCancel').onclick=()=>{netSend({t:'cancel'});netStop();netClose()}}
if(document.readyState!=='loading')netUI();else addEventListener('DOMContentLoaded',netUI);
