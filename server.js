// Typeclash matchmaking + relay server. Pairs two players searching for QUICK MATCH and relays their game messages.
// Run: npm install && npm start   (listens on $PORT or 8080; serves the game page at / if typeclash.html sits next to it)
const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const PAGE=path.join(__dirname,'typeclash.html');
const srv=http.createServer((req,res)=>{
  if(req.url==='/'||req.url.startsWith('/?')){if(fs.existsSync(PAGE)){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});fs.createReadStream(PAGE).pipe(res);return}}
  if(req.url==='/health'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,queue:queue.length,rooms}));return}
  res.writeHead(200,{'content-type':'text/plain'});res.end('Typeclash matchmaking server is running.');});
const wss=new WebSocketServer({server:srv,maxPayload:256*1024});
let queue=[],rooms=0;const STAGES=['meadow','shoal','coliseum'];
const send=(ws,o)=>{if(ws&&ws.readyState===1)ws.send(typeof o==='string'?o:JSON.stringify(o))};
function pair(a,b){a.peer=b;b.peer=a;rooms++;const stage=STAGES[Math.floor(Math.random()*STAGES.length)];
  send(a,{t:'match',role:'host',opp:b.team,oppName:b.name,stage});send(b,{t:'match',role:'guest',opp:a.team,oppName:a.name,stage})}
const validTeam=t=>Array.isArray(t)&&t.length===3&&t.every(x=>typeof x==='string'&&/^[a-z]{2,16}$/.test(x));
wss.on('connection',ws=>{ws.alive=true;ws.on('pong',()=>{ws.alive=true});
  ws.on('message',raw=>{const s=raw.toString();let d;try{d=JSON.parse(s)}catch(e){return}
    if(d.t==='queue'){if(ws.peer||!validTeam(d.team))return;ws.team=d.team;ws.name=String(d.name||'TRAINER').slice(0,16);
      queue=queue.filter(x=>x!==ws&&x.readyState===1);const o=queue.shift();if(o)pair(o,ws);else{queue.push(ws);send(ws,{t:'queued',n:queue.length})}return}
    if(d.t==='cancel'){queue=queue.filter(x=>x!==ws);return}
    if((d.t==='in'||d.t==='snap')&&ws.peer)send(ws.peer,s)});
  ws.on('close',()=>{queue=queue.filter(x=>x!==ws);if(ws.peer){send(ws.peer,{t:'left'});ws.peer.peer=null;rooms=Math.max(0,rooms-1)}})});
setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue}ws.alive=false;try{ws.ping()}catch(e){}}},20000);
const PORT=process.env.PORT||8080;srv.listen(PORT,()=>console.log('Typeclash server on :'+PORT));
