/* ===== pixel toolkit ===== */
function SG(w,h){return{w,h,p:new Array(w*h).fill(null)}}
function RP(line,a,b,c,d){return{line,r:[a,b,c,d]}}
// shapes carry a bounding box (.bb=[x0,y0,x1,y1]) so part() only scans the pixels they can touch
const BB=(f,bb)=>(f.bb=bb,f);
const E=(cx,cy,rx,ry)=>BB((x,y)=>((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1,[cx-rx-1,cy-ry-1,cx+rx+1,cy+ry+1]);
const RR=(x0,y0,x1,y1)=>BB((x,y)=>x>=x0&&x<=x1&&y>=y0&&y<=y1,[x0,y0,x1,y1]);
const _ub=fs=>fs.every(f=>f.bb)?[Math.min(...fs.map(f=>f.bb[0])),Math.min(...fs.map(f=>f.bb[1])),Math.max(...fs.map(f=>f.bb[2])),Math.max(...fs.map(f=>f.bb[3]))]:null;
const U=(...fs)=>BB((x,y)=>fs.some(f=>f(x,y)),_ub(fs));
const DF=(a,b)=>BB((x,y)=>a(x,y)&&!b(x,y),a.bb||null);
const IN=(a,b)=>BB((x,y)=>a(x,y)&&b(x,y),a.bb&&b.bb?[Math.max(a.bb[0],b.bb[0]),Math.max(a.bb[1],b.bb[1]),Math.min(a.bb[2],b.bb[2]),Math.min(a.bb[3],b.bb[3])]:(a.bb||b.bb||null));
const PG=pts=>BB((x,y)=>{x+=.5;y+=.5;let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,yi]=pts[i],[xj,yj]=pts[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c}return c},[Math.min(...pts.map(p=>p[0]))-1,Math.min(...pts.map(p=>p[1]))-1,Math.max(...pts.map(p=>p[0]))+1,Math.max(...pts.map(p=>p[1]))+1]);
function part(g,shape,rp,o={}){
  const W=g.w,H=g.h,m=new Uint8Array(W*H);let x0=1e9,y0=1e9,x1=-1,y1=-1;
  const bb=shape.bb,sx0=bb?Math.max(0,Math.floor(bb[0])):0,sy0=bb?Math.max(0,Math.floor(bb[1])):0,sx1=bb?Math.min(W-1,Math.ceil(bb[2])):W-1,sy1=bb?Math.min(H-1,Math.ceil(bb[3])):H-1;
  for(let y=sy0;y<=sy1;y++)for(let x=sx0;x<=sx1;x++)if(shape(x,y)){m[y*W+x]=1;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0)return m;
  const sc=o.sh||{cx:(x0+x1+1)/2,cy:(y0+y1+1)/2,rx:Math.max(1,(x1-x0+1)/2),ry:Math.max(1,(y1-y0+1)/2)};
  const lx=o.lx??-.55,ly=o.ly??-.85,bias=o.bias||0;
  const was=g.p.slice();
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x;if(!m[i])continue;
    let edge=false,outer=false;
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;const inm=X>=0&&Y>=0&&X<W&&Y<H&&m[Y*W+X];if(!inm){edge=true;if(!(X>=0&&Y>=0&&X<W&&Y<H)||!was[Y*W+X])outer=true}}
    let c;
    if(edge&&o.line!==false)c=outer||o.hard?rp.line:(o.soft?rp.r[0]:rp.line);
    else if(o.flat!=null)c=rp.r[o.flat];
    else{const nx=(x+.5-sc.cx)/sc.rx,ny=(y+.5-sc.cy)/sc.ry;const L=(nx*lx+ny*ly)*.85+(1-Math.min(1,nx*nx+ny*ny))*.5+bias;c=rp.r[L>.68?3:L>.16?2:L>-.36?1:0]}
    g.p[i]=c}
  return m}
function px(g,x,y,c){if(x>=0&&y>=0&&x<g.w&&y<g.h)g.p[y*g.w+x]=c}
function pxs(g,list,c){for(const[x,y]of list)px(g,x,y,c)}
function hline(g,x0,x1,y,c){for(let x=x0;x<=x1;x++)px(g,x,y,c)}
function get(g,x,y){return x>=0&&y>=0&&x<g.w&&y<g.h?g.p[y*g.w+x]:null}
function inMask(m,g,x,y){return x>=0&&y>=0&&x<g.w&&y<g.h&&m[y*g.w+x]}
function interior(m,g,x,y){return inMask(m,g,x,y)&&inMask(m,g,x+1,y)&&inMask(m,g,x-1,y)&&inMask(m,g,x,y+1)&&inMask(m,g,x,y-1)}
function flipH(g){const o=SG(g.w,g.h);for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++)o.p[y*g.w+x]=g.p[y*g.w+(g.w-1-x)];return o}
const _HC={};function _hx(v){let r=_HC[v];if(r===undefined){r=(typeof v==='string'&&v[0]==='#'&&(v.length===7||v.length===4))?(v.length===4?[parseInt(v[1]+v[1],16),parseInt(v[2]+v[2],16),parseInt(v[3]+v[3],16)]:[parseInt(v.slice(1,3),16),parseInt(v.slice(3,5),16),parseInt(v.slice(5,7),16)]):null;_HC[v]=r}return r}
function toCv(g){const c=mkCanvas(g.w,g.h),x=c.getContext('2d'),im=x.createImageData(g.w,g.h),D=im.data,slow=[];
  for(let i=0;i<g.p.length;i++){const v=g.p[i];if(!v)continue;const h=_hx(v);if(h){D[i*4]=h[0];D[i*4+1]=h[1];D[i*4+2]=h[2];D[i*4+3]=255}else slow.push(i)}
  x.putImageData(im,0,0);for(const i of slow){x.fillStyle=g.p[i];x.fillRect(i%g.w,Math.floor(i/g.w),1,1)}return c}
function whiteCv(g){const c=mkCanvas(g.w,g.h),x=c.getContext('2d');x.fillStyle='#ffffff';for(let y=0;y<g.h;y++)for(let i=0;i<g.w;i++)if(g.p[y*g.w+i])x.fillRect(i,y,1,1);return c}

function stamp(g,x0,y0,rows,map,fl){for(let y=0;y<rows.length;y++)for(let x=0;x<rows[y].length;x++){const ch=rows[y][fl?rows[y].length-1-x:x];if(ch!=='.')px(g,x0+x,y0+y,map[ch])}}
const FIST=[
"...lllll...",
"..lhhwhhl..",
".lhwhhhhml.",
"lhhhhhhhmdl",
"lhlhlmlmldl",
"lmlmlmlmldl",
"lmmmmmmmddl",
"ldmmmmmdddl",
"loooooooool",
"lggggggggGl",
"lGGGGGGGGGl",
".lllllllll."];
/* ===== palettes ===== */
const PAL={
  whale:RP('#16244e','#2a4f94','#3a72c8','#58a0ec','#9ad0fc'),
  belly:RP('#6a5636','#c0a676','#dcc596','#f2e5ba','#fffbe8'),
  shell:RP('#34344c','#6c6e88','#9698b2','#c2c4d8','#eef0f8'),
  brass:RP('#46300e','#8a5a18','#b88028','#e0b048','#fff0a0'),
  steel:RP('#22283a','#525a70','#7c86a2','#aab4cc','#e4ecfa'),
  suit:RP('#141420','#262636','#363650','#4c4c6e','#6a6a92'),
  scarf:RP('#3e0a10','#8a1a1e','#be2a2a','#e84a40','#ff9a84'),
  gold:RP('#4a3008','#9a6a10','#c89a22','#ecc84a','#fff4b0'),
  fur:RP('#5a6896','#a6b4d4','#c8d4ee','#e8eefc','#ffffff'),
  ice:RP('#163c6e','#2e6eae','#56a6de','#96d6f6','#e2f8ff'),
  pink:RP('#7a2a4e','#c4588a','#e682aa','#f8b2ca','#ffe2ee'),
  leaf:RP('#123a14','#226a24','#38903a','#62b84a','#a8e070'),
  vine:RP('#10280e','#1e4a1c','#2e6a28','#468a36','#6eb04a'),
  petal:RP('#4a0c2c','#9a1c56','#cc2e72','#ee5c98','#ffa8cc'),
  skin:RP('#3e5a2a','#90b072','#b4d496','#d6eebc','#f2fff0'),
  bloom:RP('#6a4a08','#c8941a','#ecc030','#ffe468','#fff8c0'),
};
const INK='#141428';

/* ===== BULWHALE (water tank) ===== */
function drawBulwhale(dir,fr,st){
  const g=SG(32,32),P=PAL,tur=st==='turret',b=tur?2:(fr?1:0);
  const footL=tur?0:(fr?-1:0),footR=tur?0:(fr?0:-1);
  if(dir==='down'){
    if(!tur){part(g,E(10.5,29+footL,4,2.2),P.whale);part(g,E(21.5,29+footR,4,2.2),P.whale)}
    else{part(g,RR(2,24,4,30),P.shell);part(g,RR(27,24,29,30),P.shell)}
    part(g,E(4.5,20+b,3.2,4.6),P.whale,{bias:-.1});part(g,E(27.5,20+b,3.2,4.6),P.whale,{bias:-.1});
    const body=part(g,E(16,19+b,12.6,10.2),P.whale);
    const bel=part(g,E(16,23.5+b,8,6),P.belly,{soft:1});
    for(const yy of[22,24,26])for(let x=0;x<32;x++)if(interior(bel,g,x,yy+b)&&x%2===0)px(g,x,yy+b,P.belly.r[1]);
    part(g,DF(E(16,12.5+b,11.2,6.6),(x,y)=>y>15+b),P.shell,{soft:1});
    for(const[bx,by]of[[8,11],[13,9],[19,9],[24,11],[16,12],[10,14],[22,14]]){px(g,bx,by+b,P.shell.r[3]);px(g,bx+1,by+b,P.shell.r[2]);px(g,bx,by+1+b,P.shell.r[1]);px(g,bx+1,by+1+b,P.shell.line)}
    if(!tur){part(g,RR(13,4+b,18,9+b),P.brass);part(g,RR(12,3+b,19,4+b),P.brass,{flat:3});hline(g,14,17,3+b,'#0e1a30');hline(g,13,18,6+b,P.brass.r[0])}
    else{part(g,E(16,7+b,4,2.5),P.brass)}
    for(const ex of[10,20]){for(let dy=0;dy<3;dy++)hline(g,ex,ex+2,16+dy+b,INK);px(g,ex,16+b,'#ffffff');px(g,ex+1,17+b,'#3a72c8')}
    pxs(g,[[9,14+b],[10,14+b],[11,15+b],[12,15+b]],P.whale.line);pxs(g,[[23,14+b],[22,14+b],[21,15+b],[20,15+b]],P.whale.line);
    pxs(g,[[14,20+b],[15,21+b],[16,21+b],[17,20+b]],P.belly.line);
    px(g,7,19+b,'#f08cb0');px(g,8,19+b,'#f8b0c8');px(g,24,19+b,'#f08cb0');px(g,23,19+b,'#f8b0c8');
  }else if(dir==='up'){
    if(!tur){part(g,E(10.5,29+footL,4,2.2),P.whale);part(g,E(21.5,29+footR,4,2.2),P.whale)}
    else{part(g,RR(2,24,4,30),P.shell);part(g,RR(27,24,29,30),P.shell)}
    part(g,E(4.5,20+b,3.2,4.6),P.whale);part(g,E(27.5,20+b,3.2,4.6),P.whale);
    part(g,E(16,19+b,12.6,10.2),P.whale);
    part(g,E(16,17+b,11,8.6),P.shell,{soft:1});
    for(const[bx,by]of[[9,13],[14,11],[19,11],[23,14],[16,16],[11,19],[21,19],[16,21],[8,17],[24,18]]){px(g,bx,by+b,P.shell.r[3]);px(g,bx+1,by+b,P.shell.r[2]);px(g,bx,by+1+b,P.shell.r[1]);px(g,bx+1,by+1+b,P.shell.line)}
    part(g,RR(15,26+b,17,29),P.whale);part(g,E(11.5,29,4.2,2),P.whale,{bias:.1});part(g,E(20.5,29,4.2,2),P.whale,{bias:.1});
    if(!tur){part(g,RR(13,5+b,18,10+b),P.brass);part(g,RR(12,4+b,19,5+b),P.brass,{flat:3})}else part(g,E(16,8+b,4,2.5),P.brass);
  }else{ // left
    if(!tur){part(g,E(21+(fr?1:-1),29,3.8,2.1),P.whale,{bias:-.3});}
    part(g,PG([[23,17+b],[28,12],[31,9],[31,14],[27,18+b],[26,21+b]]),P.whale);
    part(g,E(29.2,10.5,2.2,3.6),P.whale);
    if(!tur)part(g,E(10+(fr?-1:1),29,3.8,2.1),P.whale);else part(g,RR(4,24,6,30),P.shell);
    const body=part(g,E(15.5,19+b,13,9.6),P.whale);
    const bel=part(g,E(10.5,24+b,8,5),P.belly,{soft:1});
    for(const yy of[23,25])for(let x=0;x<32;x++)if(interior(bel,g,x,yy+b)&&x%2)px(g,x,yy+b,P.belly.r[1]);
    part(g,DF(E(18.5,13+b,10.6,6.4),(x,y)=>y>15+b),P.shell,{soft:1});
    for(const[bx,by]of[[12,11],[17,9],[22,10],[25,13],[19,13]]){px(g,bx,by+b,P.shell.r[3]);px(g,bx+1,by+b,P.shell.r[2]);px(g,bx,by+1+b,P.shell.r[1]);px(g,bx+1,by+1+b,P.shell.line)}
    if(!tur){part(g,RR(15,4+b,20,9+b),P.brass);part(g,RR(14,3+b,21,4+b),P.brass,{flat:3});hline(g,16,19,3+b,'#0e1a30')}else part(g,E(18,7+b,4,2.5),P.brass);
    part(g,PG([[12,18+b],[16,19+b],[17,24+b],[14,26+b],[12,23+b]]),P.whale,{bias:.15});
    for(let dy=0;dy<3;dy++)hline(g,5,7,16+dy+b,INK);px(g,5,16+b,'#ffffff');px(g,6,17+b,'#3a72c8');
    pxs(g,[[4,14+b],[5,14+b],[6,15+b],[7,15+b]],P.whale.line);
    pxs(g,[[2,21+b],[3,22+b],[4,22+b],[5,21+b]],P.belly.line);
    px(g,8,19+b,'#f08cb0');
  }
  return g}

/* ===== FISTINEL (steel / fighting) ===== */
function drawFistinel(dir,fr,st){
  const g=SG(32,32),P=PAL,gd=st==='guard',b=fr?1:0,s1=fr?-1:0,s2=fr?0:-1;
  const GM={l:P.steel.line,w:'#ffffff',h:P.steel.r[3],m:P.steel.r[2],d:P.steel.r[1],k:P.steel.r[0],g:P.gold.r[3],G:P.gold.r[1],o:P.gold.line};
  const gaunt=(cx,cy,fl)=>stamp(g,Math.round(cx)-5,Math.round(cy)-5,FIST,GM,fl);
  if(dir==='down'||dir==='up'){
    const up=dir==='up';
    // scarf tails behind (front view: flutter to side)
    if(!up)part(g,PG([[19,16],[27,13+b],[29,15+b],[22,19]]),P.scarf);
    // legs & boots
    part(g,RR(11,23,14,28+s1),P.suit);part(g,RR(18,23,21,28+s2),P.suit);
    part(g,RR(10,27+s1,15,30+s1),P.steel);part(g,RR(17,27+s2,22,30+s2),P.steel);
    // torso
    part(g,RR(10,16+b,22,25),P.suit);
    if(!up){part(g,PG([[11,17+b],[21,17+b],[20,23+b],[16,25],[12,23+b]]),P.steel);hline(g,14,18,20+b,P.steel.r[3]);part(g,RR(10,23,22,24),P.gold,{flat:2})}
    else{part(g,PG([[11,17+b],[21,17+b],[21,23],[11,23]]),P.steel,{soft:1});part(g,RR(10,23,22,24),P.gold,{flat:1})}
    // head
    part(g,E(16,10+b,7.4,7.2),P.steel);
    part(g,PG([[13,3+b],[16,0+b],[19,3+b],[17,6+b],[15,6+b]]),P.scarf);
    if(!up){part(g,RR(10,9+b,22,12+b),P.suit,{flat:0,hard:1});px(g,13,10+b,'#fff6a0');px(g,14,10+b,'#ffd23a');px(g,18,10+b,'#ffd23a');px(g,19,10+b,'#fff6a0');px(g,13,11+b,'#c88a10');px(g,19,11+b,'#c88a10');part(g,RR(15,12+b,17,15+b),P.steel,{flat:1});px(g,12,6+b,'#ffffff');px(g,13,5+b,P.steel.r[3])}
    else{hline(g,11,21,12+b,P.steel.r[0]);px(g,19,6+b,P.steel.r[3])}
    // scarf
    part(g,RR(10,15+b,22,17+b),P.scarf);
    if(up)part(g,PG([[14,16+b],[18,16+b],[19,25+b],[16,23+b],[13,25+b]]),P.scarf);
    // gauntlets
    if(gd&&!up){gaunt(11,13+b);gaunt(21,13+b,1)}
    else{part(g,RR(7,17+b,10,20+b),P.suit);part(g,RR(22,17+b,25,20+b),P.suit);gaunt(5,21+b);gaunt(27,21+b,1)}
  }else{ // left
    part(g,PG([[20,15+b],[30,12+b*2],[31,15+b],[24,19]]),P.scarf);
    if(!gd)gaunt(22,21+b,1);
    part(g,RR(14+(fr?2:0),23,17+(fr?2:0),29),P.suit,{bias:-.3});part(g,RR(13+(fr?2:0),27,18+(fr?2:0),30),P.steel,{bias:-.3});
    part(g,RR(15-(fr?2:0),23,18-(fr?2:0),29),P.suit);part(g,RR(12-(fr?2:0),27,18-(fr?2:0),30),P.steel);
    part(g,RR(11,16+b,21,25),P.suit);part(g,PG([[11,17+b],[18,17+b],[17,23+b],[11,23+b]]),P.steel);part(g,RR(11,23,21,24),P.gold,{flat:2});
    part(g,E(15,10+b,7.2,7.2),P.steel);
    part(g,PG([[14,3+b],[19,0+b],[21,4+b],[18,6+b]]),P.scarf);
    part(g,RR(7,9+b,15,12+b),P.suit,{flat:0,hard:1});px(g,9,10+b,'#fff6a0');px(g,10,10+b,'#ffd23a');px(g,9,11+b,'#c88a10');px(g,11,5+b,'#ffffff');
    part(g,RR(11,15+b,21,17+b),P.scarf);
    if(gd)gaunt(9,14+b);else gaunt(10,21+b);
  }
  return g}

/* ===== FROSTBUNT (fairy / ice) ===== */
function drawFrostbunt(dir,fr,st){
  const g=SG(32,32),P=PAL,b=fr?1:0;
  const crystal=(cx,cy)=>{part(g,PG([[cx,cy-3],[cx+2,cy],[cx,cy+2],[cx-2,cy]]),P.ice);px(g,cx,cy-1,'#ffffff')};
  if(dir!=='left'){
    const up=dir==='up';
    // feet
    part(g,E(11.5,29+(fr?-1:0),3.4,1.8),P.fur);part(g,E(20.5,29+(fr?0:-1),3.4,1.8),P.fur);
    // body
    part(g,E(16,24+b,6.6,5.4),P.fur);
    if(up){part(g,E(16,26+b,3.2,3),P.ice,{soft:1});px(g,15,25+b,'#ffffff')}
    else{part(g,E(16,25+b,3.6,3.4),P.fur,{line:false,flat:3})}
    // ears
    const earL=E(11.5,6+b,2.8,6.6),earR=E(20.5,6+b,2.8,6.6);
    part(g,earL,P.fur);part(g,earR,P.fur);
    if(!up){part(g,E(11.5,7+b,1.2,4.4),P.pink,{line:false,flat:2});part(g,E(20.5,7+b,1.2,4.4),P.pink,{line:false,flat:2})}
    crystal(11,0+b);crystal(21,0+b);
    // head
    part(g,E(16,15+b,8.6,7),P.fur);
    // cheek fluff
    part(g,E(8.5,18+b,2.4,2.2),P.fur);part(g,E(23.5,18+b,2.4,2.2),P.fur);
    if(!up){
      // eyes
      for(const ex of[11,19]){part(g,RR(ex,14+b,ex+2,17+b),{line:INK,r:[INK,INK,INK,INK]},{flat:0,line:false});px(g,ex,14+b,'#ffffff');px(g,ex+1,14+b,'#ffffff');px(g,ex+1,16+b,'#56a6de');px(g,ex+2,16+b,'#96d6f6');px(g,ex+1,17+b,'#2e6eae')}
      px(g,9,18+b,'#f08cb0');px(g,10,18+b,'#f8b2ca');px(g,22,18+b,'#f08cb0');px(g,23,18+b,'#f8b2ca');
      px(g,15,18+b,'#c4588a');px(g,16,18+b,'#c4588a');px(g,15,19+b,P.fur.line);px(g,16,19+b,P.fur.line);
      // snowflake mark
      pxs(g,[[16,9+b],[15,10+b],[17,10+b],[16,11+b]],'#56a6de');px(g,16,10+b,'#e2f8ff');
      // bow
      part(g,U(E(22.5,9+b,2.2,1.8),E(26,9+b,2.2,1.8)),P.pink);px(g,24,9+b,P.pink.r[0]);
    }else{part(g,U(E(22.5,9+b,2.2,1.8),E(26,9+b,2.2,1.8)),P.pink);px(g,24,9+b,P.pink.r[0])}
    // arms
    part(g,E(10,23+b,2,2),P.fur);part(g,E(22,23+b,2,2),P.fur);
  }else{
    part(g,E(22.5,25+b,3,2.8),P.ice,{soft:1});px(g,22,24+b,'#ffffff');
    part(g,E(19+(fr?1:-1),29,3.4,1.8),P.fur,{bias:-.3});
    part(g,E(16,24+b,6.6,5.4),P.fur);
    part(g,E(12+(fr?-1:1),29,3.6,1.8),P.fur);
    part(g,E(18,6+b,2.6,6.6),P.fur,{bias:-.3});crystal(19,0+b);
    part(g,E(14.5,15+b,8,7),P.fur);
    part(g,E(15,6+b,2.8,6.6),P.fur);part(g,E(15,7+b,1.2,4.4),P.pink,{line:false,flat:2});crystal(15,0+b);
    part(g,E(7.5,18+b,2.4,2.2),P.fur);
    part(g,RR(9,14+b,11,17+b),{line:INK,r:[INK,INK,INK,INK]},{flat:0,line:false});px(g,9,14+b,'#ffffff');px(g,10,14+b,'#ffffff');px(g,10,16+b,'#56a6de');px(g,10,17+b,'#2e6eae');
    px(g,8,18+b,'#f08cb0');px(g,6,17+b,'#c4588a');
    part(g,U(E(19.5,9+b,2.2,1.8),E(23,9+b,2.2,1.8)),P.pink);px(g,21,9+b,P.pink.r[0]);
    part(g,E(13,23+b,2.2,2),P.fur);
  }
  return g}

/* ===== VERDIVY (grass) ===== */
function drawVerdivy(dir,fr,st){
  const g=SG(32,32),P=PAL,b=fr?1:0,sw=fr?1:-1;
  if(dir!=='left'){
    const up=dir==='up';
    // back petals
    part(g,E(8,12+b,4.4,5.6),P.petal);part(g,E(24,12+b,4.4,5.6),P.petal);part(g,E(16,5+b,5.6,4.4),P.petal);
    part(g,E(10,6+b,3.6,3.6),P.petal);part(g,E(22,6+b,3.6,3.6),P.petal);
    // vine arms
    part(g,PG([[10,18+b],[5,20+b],[3,24+b+sw],[5,25+b+sw],[7,22+b],[11,21+b]]),P.vine);
    part(g,PG([[22,18+b],[27,20+b],[29,24+b-sw],[27,25+b-sw],[25,22+b],[21,21+b]]),P.vine);
    px(g,4,22+b,P.leaf.r[3]);px(g,28,22+b,P.leaf.r[3]);
    // leaf skirt
    part(g,PG([[9,21],[6,30],[11,27],[13,31],[16,27],[19,31],[21,27],[26,30],[23,21]]),P.leaf);
    if(!up){pxs(g,[[11,26],[16,25],[21,26]],P.leaf.r[0]);pxs(g,[[10,23],[15,22]],P.leaf.r[3])}
    // torso
    part(g,E(16,20+b,4.6,3.6),P.skin);
    // head
    part(g,E(16,13+b,6.6,6.2),up?P.petal:P.skin);
    if(!up){
      // leaf fringe
      part(g,PG([[10,10+b],[13,7+b],[16,9+b],[19,7+b],[22,10+b],[19,11+b],[16,10+b],[13,11+b]]),P.leaf);
      for(const ex of[12,18]){hline(g,ex,ex+1,13+b,INK);px(g,ex,14+b,'#ffe468');px(g,ex+1,14+b,'#a8e070');px(g,ex,13+b,'#ffffff');px(g,ex+1,15+b,P.skin.r[0])}
      px(g,15,17+b,P.skin.line);px(g,16,17+b,P.skin.line);px(g,11,16+b,'#ee8cb4');px(g,20,16+b,'#ee8cb4');
    }else{for(let y=9;y<18;y+=3)px(g,16,y+b,P.petal.r[0])}
    // crown bloom
    part(g,E(16,4+b,2.6,2.2),P.bloom);px(g,15,3+b,'#ffffff');
  }else{
    part(g,E(22,12+b,4.6,5.6),P.petal);part(g,E(17,5+b,5,4.2),P.petal);part(g,E(23,6+b,3.4,3.4),P.petal);
    part(g,PG([[17,18+b],[22,20+b],[25,24+b+sw],[23,25+b+sw],[20,22+b],[16,21+b]]),P.vine,{bias:-.3});
    part(g,PG([[11,21],[7,30],[12,27],[15,31],[18,27],[23,30],[21,21]]),P.leaf);
    part(g,E(15,20+b,4.2,3.6),P.skin);
    part(g,E(14,13+b,6.4,6.2),P.skin);
    part(g,PG([[9,11+b],[12,7+b],[16,8+b],[20,9+b],[17,11+b],[13,10+b]]),P.leaf);
    hline(g,9,10,13+b,INK);px(g,9,14+b,'#ffe468');px(g,10,14+b,'#a8e070');px(g,9,13+b,'#ffffff');
    px(g,8,17+b,P.skin.line);px(g,11,16+b,'#ee8cb4');
    part(g,PG([[13,18+b],[8,20+b],[5,23+b-sw],[7,24+b-sw],[10,22+b],[14,21+b]]),P.vine);px(g,6,22+b,P.leaf.r[3]);
    part(g,E(15,4+b,2.6,2.2),P.bloom);px(g,14,3+b,'#ffffff');
  }
  return g}

/* ===== extras ===== */
function drawPod(open){const g=SG(20,20),P=PAL;
  part(g,PG([[2,19],[5,13],[9,17],[10,12],[11,17],[15,13],[18,19]]),P.leaf);
  part(g,RR(9,11,11,16),P.vine);
  part(g,E(10,8,6.5,5.6),P.petal);
  if(open){part(g,E(10,9,4,3),{line:'#2a0414',r:['#3a0820','#3a0820','#5a1030','#5a1030']},{flat:1,line:false});pxs(g,[[7,7],[9,7],[11,7],[13,7],[8,11],[12,11]],'#fff8e0')}
  else{hline(g,5,15,9,P.petal.line);pxs(g,[[6,10],[8,10],[10,10],[12,10],[14,10]],'#fff8e0')}
  px(g,7,5,P.petal.r[3]);px(g,8,4,'#ffffff');
  return g}
function drawBall(glow){const g=SG(10,10),P=PAL;part(g,E(5,5,4.1,4.1),glow?P.pink:P.fur,{sh:{cx:5,cy:5,rx:4,ry:4}});px(g,3,3,'#ffffff');px(g,4,3,'#ffffff');px(g,3,4,'#ffffff');pxs(g,[[6,6],[5,7]],glow?P.pink.r[0]:P.ice.r[2]);return g}
function drawFist(){const g=SG(12,13),P=PAL;stamp(g,0,0,FIST,{l:P.steel.line,w:'#ffffff',h:P.steel.r[3],m:P.steel.r[2],d:P.steel.r[1],k:P.steel.r[0],g:P.gold.r[3],G:P.gold.r[1],o:P.gold.line});return g}

/* ===== WORLD ===== */
const TS=16;let MW=80,MH=56,WW=MW*TS,WH=MH*TS;
const TREEP=RP('#173a2a','#22583a','#2f7a38','#53a33c','#93d05a'),BARK=RP('#2e1a10','#5a3420','#7a4c2a','#9c6a38','#c08c4e'),STONE=RP('#2e2c3a','#55546a','#82839a','#b2b4c6','#e2e4ee');
function hsh(x,y,s=0){let h=(x*374761393+y*668265263+s*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function buildMap(){
  const ground=[],obj=[],walk=[],shot=[];
  for(let y=0;y<MH;y++){ground.push(new Array(MW).fill(0));obj.push(new Array(MW).fill(0));walk.push(new Array(MW).fill(0));shot.push(new Array(MW).fill(0))}
  const seg=(px,py,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l));return Math.hypot(px-ax-dx*t,py-ay-dy*t)};
  const paths=[[[4,27],[20,27],[30,22],[50,22],[60,30],[76,30]],[[39,4],[39,15],[34,22]],[[50,22],[46,36],[40,52]],[[20,27],[18,40],[26,48]]];
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    let path=false;for(const pl of paths)for(let i=0;i<pl.length-1;i++)if(seg(x+.5,y+.5,...pl[i],...pl[i+1])<1.6+hsh(x,y,3)*.5)path=true;
    if(path)ground[y][x]=1;}
  const ell=(cx,cy,rx,ry,n,v,ok=()=>true)=>{for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const d=((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2;if(d<1-hsh(x,y,n)*.25&&ok(x,y))ground[y][x]=v}};
  for(const[cx,cy,rx,ry]of[[15,12,6,4],[63,45,7,4.5],[61,10,4,3],[27,45,4,2.6],[52,30,2.6,2]])ell(cx,cy,rx,ry,1,2);
  for(const[cx,cy,rx,ry]of[[11,38,6,5],[56,16,6,4],[31,34,5,3],[70,22,4,6],[47,45,5,3],[24,15,4,3],[66,36,4,3],[8,47,4,3]])ell(cx,cy,rx,ry,2,3,(x,y)=>ground[y][x]===0);
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)if(ground[y][x]===0&&hsh(x,y,9)<.035)ground[y][x]=4;
  for(const[cx,cy]of[[34,27],[44,18],[58,25],[22,22],[66,32]])for(let y=cy-1;y<=cy+1;y++)for(let x=cx-2;x<=cx+2;x++)if(ground[y][x]===0&&hsh(x,y,4)<.7)ground[y][x]=4;
  const free2=(x,y)=>{for(let j=0;j<2;j++)for(let i=0;i<2;i++){const X=x+i,Y=y+j;if(X<0||Y<0||X>=MW||Y>=MH||obj[Y][X]||(ground[Y][X]!==0&&ground[Y][X]!==4&&ground[Y][X]!==3))return false}return true};
  const tree=(x,y,force)=>{if(!force&&!free2(x,y))return;obj[y][x]=1;for(let j=0;j<2;j++)for(let i=0;i<2;i++){if(!obj[y+j][x+i])obj[y+j][x+i]=9;walk[y+j][x+i]=1;shot[y+j][x+i]=1}};
  for(let x=0;x<MW;x+=2){tree(x,0,1);tree(x,2,1);tree(x,MH-4,1);tree(x,MH-2,1)}
  for(let y=4;y<MH-4;y+=2){tree(0,y,1);tree(2,y,1);tree(MW-4,y,1);tree(MW-2,y,1)}
  // ragged inner tree line
  for(let x=4;x<MW-4;x+=2){if(hsh(x,1,5)<.45)tree(x,4);if(hsh(x,2,5)<.45)tree(x,MH-6)}
  for(let y=6;y<MH-6;y+=2){if(hsh(1,y,5)<.45)tree(4,y);if(hsh(2,y,5)<.45)tree(MW-6,y)}
  const spawnClear=(x,y)=>Math.hypot(x-30,y-27)<5||Math.hypot(x-50,y-23)<5;
  for(const[x,y]of[[8,20],[10,20],[9,22],[22,30],[24,31],[34,9],[36,10],[44,29],[52,37],[54,36],[68,14],[70,15],[28,52],[58,22],[14,30],[66,26],[30,40],[38,44],[56,42],[72,40],[44,8],[24,8],[62,50],[50,50],[18,50],[12,26],[74,8],[60,36],[34,48]])if(!spawnClear(x,y))tree(x,y);
  for(let k=0;k<200&&k>=0;k++){const x=4+Math.floor(hsh(k,7,8)*(MW-8)),y=5+Math.floor(hsh(k,9,8)*(MH-10));if(obj[y][x]||ground[y][x]===1||ground[y][x]===2||spawnClear(x,y))continue;if(hsh(k,3,3)<.17){obj[y][x]=2;walk[y][x]=1;shot[y][x]=1}}
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)if(ground[y][x]===2)walk[y][x]=1;
  // designed touches (decals only, no collision): duel rings at both spawns, soft corners, tall-grass edges, pond life
  const decal=c=>{drawFillets(c,ground,'earth');drawFillets(c,ground,'water');drawTallEdges(c,ground);
    drawPlaza(c,30*16+8,27*16+8,30,'#e8502a');drawPlaza(c,50*16+8,23*16+8,30,'#2a6ee8');
    for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){if(ground[y][x]!==2)continue;const h=hsh(x,y,401);
      if(ground[y-1][x]!==2&&h<.45)drawReed(c,x*16+3+Math.floor(h*16),y*16+5);else if(ground[y-1][x]===2&&ground[y+1][x]===2&&ground[y][x-1]===2&&ground[y][x+1]===2&&h<.3)drawLily(c,x*16+4,y*16+6)}
    for(let k=0;k<26;k++){const x=4+Math.floor(hsh(k,1,402)*(MW-8)),y=5+Math.floor(hsh(k,2,402)*(MH-10));if(ground[y][x]!==0||obj[y][x])continue;
      if(k%3===0)drawMushrooms(c,x*16+3,y*16+6);else if(k%3===1)drawFlowerClump(c,x*16+2,y*16+5,k);else drawPebbles(c,x*16+2,y*16+4)}};
  return{ground,obj,walk,shot,decal}}
/* ===== MAP ART: shared ramps + seamless world-space helpers ===== */
// Ramps follow ART_DIRECTION anchors; shadows lean cool, highlights lean warm.
const GRS={k:'#14301e',d:'#1f4a2c',s:'#2f6e34',m:'#4f9a3e',lip:'#62ae48',b:'#7cc457',b2:'#75bd51',b3:'#84ca5d',l:'#a4d86a',h:'#b8e27a'};
const DRT={k:'#5a3a22',d:'#8a5e36',m:'#c49a5c',l:'#e6c98c',h:'#f6e6b8'};
const WTR={k:'#1a3a78',d:'#2a5cb8',m:'#3f86e0',l:'#7cc0f4',h:'#d8f4ff'};
const STN={k:'#2e2c3a',d:'#55546a',m:'#82839a',l:'#b2b4c6',h:'#e2e4ee'};
const WOOD={k:'#3e2414',d:'#6a4024',m:'#9a6234',l:'#c48a4c',h:'#e6b878'};
function smo(t){return t*t*(3-2*t)}
// smooth value noise in world pixel space (seamless across tiles)
function vnz(x,y,s,sc){const fx=x/sc,fy=y/sc,ix=Math.floor(fx),iy=Math.floor(fy),tx=smo(fx-ix),ty=smo(fy-iy);
  const a=hsh(ix,iy,s),b=hsh(ix+1,iy,s),c=hsh(ix,iy+1,s),d=hsh(ix+1,iy+1,s);return a+(b-a)*tx+(c-a)*ty+(a-b-c+d)*tx*ty}
// periodic (512px) noise tables: lattice hashed once, per-pixel lookups are cheap. sc must divide 512
// CPU-backed canvas for heavy per-pixel painting (fillRect on GPU canvases is slow); copy the result to a normal canvas
function cpuCtx(cv){return cv.getContext('2d',{willReadFrequently:true})}
const NZT={},TEXN=512;
function nzT(s,sc){const k=s+'_'+sc;if(NZT[k])return NZT[k];const n=TEXN/sc,L=new Float32Array(n*n);for(let j=0;j<n;j++)for(let i=0;i<n;i++)L[j*n+i]=hsh(i,j,s);
  const T=new Float32Array(TEXN*TEXN),TX=new Float32Array(TEXN),I0=new Int32Array(TEXN),I1=new Int32Array(TEXN);for(let x=0;x<TEXN;x++){const f=x/sc,i=Math.floor(f);TX[x]=smo(f-i);I0[x]=i%n;I1[x]=(i+1)%n}
  for(let y=0;y<TEXN;y++){const ty=TX[y],r0=I0[y]*n,r1=I1[y]*n,o=y*TEXN;for(let x=0;x<TEXN;x++){const tx=TX[x],a=L[r0+I0[x]],b=L[r0+I1[x]],c=L[r1+I0[x]],d=L[r1+I1[x]];T[o+x]=a+(b-a)*tx+(c-a)*ty+(a-b-c+d)*tx*ty}}return NZT[k]=T}
function nzp(x,y,s,sc){return nzT(s,sc)[((y&511)<<9)|(x&511)]}
// bake a 512x512 texture canvas from fn(x,y)->'#rrggbb'
// fn(x,y,i) returns an index into pal (hex strings); i = y*TEXN+x for direct noise-table reads
function texCv(fn,pal){const cv=mkCanvas(TEXN,TEXN),x=cpuCtx(cv),id=x.createImageData(TEXN,TEXN),D=id.data,P=pal.map(h=>parseInt(h.slice(1),16));
  for(let y=0,i=0;y<TEXN;y++)for(let xx=0;xx<TEXN;xx++,i++){const v=P[fn(xx,y,i)],o=i*4;D[o]=v>>16;D[o+1]=v>>8&255;D[o+2]=v&255;D[o+3]=255}x.putImageData(id,0,0);return cv}
const TEX={},TEXPAT=new WeakMap();
// world-anchored pattern fill (fast in browsers and node; patterns are cached per context)
function texBlit(c,cv,x0,y0){let m=TEXPAT.get(c);if(!m){m=new Map();TEXPAT.set(c,m)}let p=m.get(cv);if(!p){p=c.createPattern(cv,'repeat');m.set(cv,p)}c.fillStyle=p;c.fillRect(x0,y0,16,16)}
// per-pixel painter batched into horizontal runs (integer fillRects only)
function artRows(c,x0,y0,w,h,fn){for(let j=0;j<h;j++){let run=null,st=0;for(let i=0;i<=w;i++){const col=i<w?fn(i,j):null;if(col!==run){if(run)R_(c,x0+st,y0+j,i-st,1,run);run=col;st=i}}}}
// stamp rows of chars (pal lookup, '.' = clear); clip=true keeps it inside the 16px tile
const STAMPC=new Map();
function artStamp(c,x0,y0,ox,oy,rows,pal,clip){if(!clip||(ox>=0&&oy>=0&&ox+rows[0].length<=16&&oy+rows.length<=16)){let m=STAMPC.get(rows);if(!m){m=new Map();STAMPC.set(rows,m)}let cv=m.get(pal);
    if(!cv){cv=mkCanvas(rows[0].length,rows.length);artStampPx(cpuCtx(cv),0,0,0,0,rows,pal,0);m.set(pal,cv)}c.drawImage(cv,x0+ox,y0+oy);return}artStampPx(c,x0,y0,ox,oy,rows,pal,clip)}
function artStampPx(c,x0,y0,ox,oy,rows,pal,clip){for(let j=0;j<rows.length;j++){const r=rows[j];for(let i=0;i<r.length;i++){const ch=r[i];if(ch==='.')continue;const X=ox+i,Y=oy+j;if(clip&&(X<0||Y<0||X>15||Y>15))continue;R_(c,x0+X,y0+Y,1,1,pal[ch])}}}
// pixel ellipse contact shadow (flat decal). cx,cy = centre; rx,ry radii in px
function artOval(c,cx,cy,rx,ry,a){c.fillStyle='rgba(16,34,44,'+(a||.22)+')';for(let j=0;j<ry*2;j++){const yy=(j-ry+.5)/ry,hw=Math.round(rx*Math.sqrt(Math.max(0,1-yy*yy)));if(hw>0)c.fillRect(Math.round(cx)-hw,Math.round(cy-ry)+j,hw*2,1)}
  c.fillStyle='rgba(16,34,44,'+((a||.22)*.6)+')';const r2=Math.max(1,Math.round(ry*.55));for(let j=0;j<r2*2;j++){const yy=(j-r2+.5)/r2,hw=Math.round(rx*.7*Math.sqrt(Math.max(0,1-yy*yy)));if(hw>0)c.fillRect(Math.round(cx)-hw,Math.round(cy-r2)+j,hw*2,1)}}
// Edge autotile field: returns fn(i,j)->distance(px) to the nearest foreign cell, with rounded convex corners of radius R.
// Sets EDGE_K (foreign ground value) and EDGE_DIR (0 up,1 right,2 down,3 left,4 diagonal). null when no foreign neighbour.
let EDGE_K=0,EDGE_DIR=0;
function artEdge(G,X,Y,foreign,R){const N=(dx,dy)=>{const r=G[Y+dy];if(!r)return -1;const v=r[X+dx];return v===undefined?-1:v};
  const n=[N(0,-1),N(1,0),N(0,1),N(-1,0),N(-1,-1),N(1,-1),N(1,1),N(-1,1)],f=n.map(v=>v>=0&&foreign(v));if(!f.some(Boolean))return null;
  return(i,j)=>{const x=i+.5,y=j+.5;let d=99,k=0,s=0;
    if(f[0]&&y<d){d=y;k=n[0];s=0}if(f[1]&&16-x<d){d=16-x;k=n[1];s=1}if(f[2]&&16-y<d){d=16-y;k=n[2];s=2}if(f[3]&&x<d){d=x;k=n[3];s=3}
    if(f[4]){const q=Math.hypot(x,y);if(q<d){d=q;k=n[4];s=4}}if(f[5]){const q=Math.hypot(16-x,y);if(q<d){d=q;k=n[5];s=4}}
    if(f[6]){const q=Math.hypot(16-x,16-y);if(q<d){d=q;k=n[6];s=4}}if(f[7]){const q=Math.hypot(x,16-y);if(q<d){d=q;k=n[7];s=4}}
    if(R){const cr=(a,b,cx,cy,kk,ss)=>{if(a&&b){const ux=Math.abs(x-cx),uy=Math.abs(y-cy);if(ux<R&&uy<R){const q=R-Math.hypot(R-ux,R-uy);if(q<d){d=q;k=kk;s=ss}}}};
      cr(f[0],f[3],0,0,n[0],0);cr(f[0],f[1],16,0,n[0],0);cr(f[2],f[1],16,16,n[2],2);cr(f[2],f[3],0,16,n[2],2)}
    EDGE_K=k;EDGE_DIR=s;return d}}
const isGrassV=v=>v===0||v===3||v===4;
function grassBase(wx,wy){const v=nzp(wx,wy,7,8)*.6+nzp(wx,wy,8,32)*.4;return v<.37?GRS.b2:v>.64?GRS.b3:GRS.b}
const TUFT_P={h:GRS.h,l:GRS.l,m:GRS.m,d:'#438f3a',s:GRS.s};
const TUFTS=[["h.h","lml",".d."],[".h..h","hm.hm","mdmmd"],["h...h",".l.l.","hmhmh",".d.d."],["l.h","mhm"],[".h.h..","hmhml.",".dmdmh","...d.."]];
function grassTufts(x0,y0,X,Y,c){const dens=vnz(X,Y,11,3.3)*.7+hsh(X,Y,12)*.3,n=dens>.6?3:dens>.44?2:dens>.3?1:0;
  for(let k=0;k<n;k++){const t=TUFTS[Math.floor(hsh(X,Y,k*3+13)*TUFTS.length)],w=t[0].length,h=t.length;artStamp(c,x0,y0,1+Math.floor(hsh(X,Y,k*3+14)*(14-w)),1+Math.floor(hsh(X,Y,k*3+15)*(14-h)),t,TUFT_P,1)}
  if(!n&&hsh(X,Y,19)<.35){const a=2+Math.floor(hsh(X,Y,20)*12),b=2+Math.floor(hsh(X,Y,21)*12);R_(c,x0+a,y0+b,1,1,GRS.l);R_(c,x0+a,y0+b+1,1,1,GRS.m)}}
function tileGrass(x0,y0,X,Y,c){if(!TEX.grass){const A=nzT(7,8),B=nzT(8,32);TEX.grass=texCv((x,y,i)=>{const v=A[i]*.6+B[i]*.4;return v<.37?1:v>.64?2:0},[GRS.b,GRS.b2,GRS.b3])}texBlit(c,TEX.grass,x0,y0);grassTufts(x0,y0,X,Y,c)}
// tall grass: staggered blade clumps over a dark base, half-clumps wrap seamlessly between tiles. over=true -> front blades only
const TALL_P={k:'#1f4a2c',d:'#2c6e34',m:'#45923c',l:'#68b84a',h:'#9cd860',t:'#c4ec84'};
const TALL_CL=["..t...t.","..h..lh.",".lh..hl.","hlm.hlmh","lmmdlmml","mmddmmdm","mddkmddm","dkkkdkkd"];
function tileTall(x0,y0,X,Y,c,over){if(!over){if(!TEX.tall){TEX.tall=mkCanvas(16,16);tileTall(0,0,0,0,cpuCtx(TEX.tall),2)}c.drawImage(TEX.tall,x0,y0);if(hsh(X,Y,23)<.5)R_(c,x0+2+Math.floor(hsh(X,Y,24)*12),y0+5,1,1,TALL_P.t);return}
  if(over===2){R_(c,x0,y0,16,16,TALL_P.d);R_(c,x0,y0,16,1,TALL_P.m);over=false}
  const rowsY=over?[7]:[-1,7];for(const oy of rowsY){const st=(oy===7)?4:0;for(let ox=st-8;ox<16;ox+=8)artStamp(c,x0,y0,ox,oy,TALL_CL,TALL_P,1)}}
// path(1) & dirt(8): rounded grass overhang with dark rim + top-edge shadow, pebbles, soft path/dirt blend
const PATH_P={b:'#e6c98c',b2:'#dcbd7e',b3:'#eed59e',r:'#c49a5c',r2:'#d6b072',hi:'#f6e6b8'};
const DIRT_P={b:'#c49a5c',b2:'#b88d51',b3:'#cfa76a',r:'#8a5e36',r2:'#a87844',hi:'#dcb47a'};
const PEB_P={h:'#f4ecd8',m:'#bcae94',d:'#8a7a62'};
const PEBS=[["hm","md"],[".hm","hmd",".d."],["h","d"]];
function earthBase(wx,wy,p,dirt){const v=nzp(wx,wy,21+dirt,8)*.75+nzp(wx,wy,23,4)*.25;return v<.36?p.b2:v>.68?p.b3:p.b}
function artEarth(x0,y0,X,Y,c,G,dirt){const ed=artEdge(G,X,Y,isGrassV,7);
  let h1=0,h8=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const v=G[Y+dy]?.[X+dx];if(v===1)h1=1;if(v===8)h8=1}
  const ev=v=>v===1?1:v===8?0:(dirt?0:1),cell=(x,y)=>{const v=G[y]?.[x];return v===undefined?(dirt?0:1):ev(v)};
  const mix=h1&&h8?(wx,wy)=>{const fx=wx/16-.5,fy=wy/16-.5,ix=Math.floor(fx),iy=Math.floor(fy),tx=smo(fx-ix),ty=smo(fy-iy),a=cell(ix,iy),b=cell(ix+1,iy),cc=cell(ix,iy+1),d=cell(ix+1,iy+1);return a+(b-a)*tx+(cc-a)*ty+(a-b-cc+d)*tx*ty+(nzp(wx,wy,31,4)-.5)*.4>.5}:null;
  const own=dirt?DIRT_P:PATH_P,tk=dirt?'dirt':'path';if(!TEX[tk]){const A=nzT(21+dirt,8),B=nzT(23,4);TEX[tk]=texCv((x,y,i)=>{const v=A[i]*.75+B[i]*.25;return v<.36?1:v>.68?2:0},[own.b,own.b2,own.b3])}texBlit(c,TEX[tk],x0,y0);
  if(ed||mix)artRows(c,x0,y0,16,16,(i,j)=>{const wx=x0+i,wy=y0+j,p=mix?(mix(wx,wy)?PATH_P:DIRT_P):own;
    if(ed){const d=ed(i,j);if(d<8){const t=2.2+(nzp(wx,wy,33,4)-.5)*2.4;
      if(d<t-1)return EDGE_K===3?TALL_P.m:grassBase(wx,wy);
      if(d<t)return EDGE_K===3?TALL_P.d:GRS.lip;
      if(d<t+1)return p.r;
      if(d<t+2.2&&(EDGE_DIR===0||EDGE_DIR===4||(EDGE_DIR===3&&d<t+1.6)))return p.r2;
      if(d<t+4)return (nzp(wx,wy,21+dirt,8)<.4?p.b2:p.b)}}
    return mix?earthBase(wx,wy,p,p===DIRT_P?1:0):null});
  const pn=Math.floor(hsh(X,Y,25)*3.2);for(let k=0;k<pn;k++){const pb=PEBS[Math.floor(hsh(X,Y,k+26)*3)],a=2+Math.floor(hsh(X,Y,k+28)*11),b=2+Math.floor(hsh(X,Y,k+30)*11);
    if(ed&&ed(a,b)<6)continue;artStamp(c,x0,y0,a,b,pb,dirt?{h:'#dcc6a2',m:'#a08466',d:'#6e5440'}:PEB_P,1)}
  if(hsh(X,Y,32)<.4){const a=3+Math.floor(hsh(X,Y,33)*10),b=3+Math.floor(hsh(X,Y,34)*10);if(!ed||ed(a,b)>5)R_(c,x0+a,y0+b,2,1,own.r2)}}
function tilePath(x0,y0,X,Y,c,G){artEarth(x0,y0,X,Y,c,G,0)}
function tileDirt(x0,y0,X,Y,c,G){artEarth(x0,y0,X,Y,c,G,1)}
// water: depth gradient from shores, animated foam + ripples (fr 0/1), earthen banks with a taller face on the north shore,
// stone canal walls next to cobble, cast shadow beside bridges
function tileWater(x0,y0,X,Y,c,G,fr){fr=fr?1:0;const land=v=>v!==2&&v!==7;let canal=false;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(G[Y+dy]?.[X+dx]===6)canal=true;
  const ed=artEdge(G,X,Y,land,canal?0:10),tk='water'+fr;if(!TEX[tk]){const pal=[WTR.h,WTR.l,'#3576d2','#4a92e6','#3a7ed8',WTR.m];TEX[tk]=texCv((x,y)=>pal.indexOf(waterBase(x,y,fr,99)),pal)}texBlit(c,TEX[tk],x0,y0);
  if(ed)artRows(c,x0,y0,16,16,(i,j)=>{const wx=x0+i,wy=y0+j;let e=99,dir=-1;
    if(ed){const d=ed(i,j);dir=EDGE_DIR;const k=EDGE_K;
      if(!canal){e=d-(3.4+(nzp(wx,wy,41,4)-.5)*1.8);
        if(e<0){const top=dir===0,bw=top?3.2:1.4,earth=k===1||k===8;
          if(e<-bw-1)return earth?(k===1?PATH_P.b:DIRT_P.b):grassBase(wx,wy);
          if(e<-bw)return earth?DRT.d:GRS.lip;
          if(e<-1)return top?(e<-bw+1?DRT.m:'#a87848'):DRT.m;
          return '#6a4a2e'}
        if(e<1)return ((wx+wy*3+fr*3)>>1)%4?WTR.h:WTR.l;
        if(e<2.2)return WTR.l}
      else e=d}
    if(dir===0&&e<5)return e<3?WTR.d:'#3574cc';
    return e<4.5?waterBase(wx,wy,fr,e):null});
  const g=(dx,dy)=>G[Y+dy]?.[X+dx];
  if(canal){const L=(dx,dy)=>{const v=g(dx,dy);return v!==undefined&&land(v)};
    if(L(0,-1)){R_(c,x0,y0,16,1,STN.h);R_(c,x0,y0+1,16,3,STN.m);for(let i=0;i<16;i+=8)R_(c,x0+((i+X*5+(Y%2)*4)%16),y0+1,1,3,STN.d);R_(c,x0,y0+2,16,1,'#76778e');R_(c,x0,y0+4,16,1,STN.k);R_(c,x0,y0+5,16,1,WTR.k)}
    if(L(0,1)){R_(c,x0,y0+13,16,1,'#2f66c2');R_(c,x0,y0+14,16,1,STN.d);R_(c,x0,y0+15,16,1,STN.l)}
    if(L(-1,0)){R_(c,x0,y0,2,16,STN.m);R_(c,x0,y0,1,16,STN.l);R_(c,x0+2,y0,1,16,STN.k);R_(c,x0+3,y0,1,16,WTR.d)}
    if(L(1,0)){R_(c,x0+13,y0,1,16,STN.k);R_(c,x0+14,y0,2,16,STN.d);R_(c,x0+15,y0,1,16,STN.m)}
    if(L(-1,-1)&&!L(-1,0)&&!L(0,-1)){R_(c,x0,y0,3,4,STN.m);R_(c,x0,y0,3,1,STN.h);R_(c,x0,y0+4,3,1,STN.k)}
    if(L(1,-1)&&!L(1,0)&&!L(0,-1)){R_(c,x0+13,y0,3,4,STN.m);R_(c,x0+13,y0,3,1,STN.h);R_(c,x0+13,y0+4,3,1,STN.k)}
    if(L(-1,1)&&!L(-1,0)&&!L(0,1)){R_(c,x0,y0+14,3,1,STN.d);R_(c,x0,y0+15,3,1,STN.l)}
    if(L(1,1)&&!L(1,0)&&!L(0,1)){R_(c,x0+13,y0+14,3,1,STN.d);R_(c,x0+13,y0+15,3,1,STN.l)}}
  if(g(-1,0)===7){R_(c,x0,y0,3,16,WTR.d);R_(c,x0+3,y0,1,16,'#3574cc')}
  if(g(0,-1)===7){R_(c,x0,y0,16,3,WTR.d);R_(c,x0,y0+3,16,1,'#3574cc')}}
// open-water body: ripples on a world lattice (periodic, shifted per frame) + broad depth tone
let WRIP=null;
function waterBase(wx,wy,fr,e){if(!WRIP){WRIP=new Int16Array(32*64*5);for(let cy=0;cy<64;cy++)for(let cx=0;cx<32;cx++){const o=(cy*32+cx)*5,ln=3+Math.floor(hsh(cx,cy,52)*4);WRIP[o]=Math.floor(hsh(cx,cy,51)*5);WRIP[o+1]=ln;WRIP[o+2]=1+Math.floor(hsh(cx,cy,53)*(12-ln));WRIP[o+3]=hsh(cx,cy,54)<.62?1:0;WRIP[o+4]=hsh(cx,cy,55)<.35?1:0}}
  const o=((((wy>>3)&63)<<5)|((wx>>4)&31))*5;if(WRIP[o+3]){const oy=WRIP[o],ln=WRIP[o+1],lx=(wx&15)-WRIP[o+2]-fr,ly=wy&7;if(ly===oy&&lx>=0&&lx<ln)return (WRIP[o+4]&&lx===(fr?ln-1:0))?WTR.h:WTR.l;if(ly===oy+1&&lx>=1&&lx<=ln)return '#3576d2'}
  if(e<4.5)return '#4a92e6';return nzp(wx,wy,57,32)>.6?'#3a7ed8':WTR.m}
// flowers: grass + small hand-placed blooms; colour drifts in patches
const FLW=[['#f8f8f0','#c4cada'],['#f86868','#c02c44'],['#f8d848','#d8962a'],['#f898c8','#c85898']];
function tileFlowers(x0,y0,X,Y,c){tileGrass(x0,y0,X,Y,c);const pal=FLW[Math.floor(vnz(X,Y,81,3)*3.99)];const n=2+Math.floor(hsh(X,Y,82)*3);
  for(let k=0;k<n;k++){const fx=2+Math.floor(hsh(X,Y,k+83)*12),fy=2+Math.floor(hsh(X,Y,k+88)*11),cc=hsh(X,Y,k+93)<.25?FLW[(k+1)%4]:pal;
    R_(c,x0+fx,y0+fy+2,1,2,GRS.s);R_(c,x0+fx+1,y0+fy+3,1,1,GRS.m);R_(c,x0+fx,y0+fy-1,1,1,cc[0]);R_(c,x0+fx-1,y0+fy,1,1,cc[0]);R_(c,x0+fx+1,y0+fy,1,1,cc[1]);R_(c,x0+fx,y0+fy+1,1,1,cc[1]);R_(c,x0+fx,y0+fy,1,1,'#fff4a0')}}
// cobble: world-anchored courses of varied pavers (no 16px grid), mortar, top/left light, bottom/right shade, wear + moss
function cobTex(){const cv=mkCanvas(TEXN,TEXN),c=cpuCtx(cv);let y=0,r=0;
  const cr=(x,yy,w,h,col)=>{for(const ox of[0,-TEXN])R_(c,x+ox,yy,w,h,col)};
  while(y<TEXN){let h=8+Math.floor(hsh(r,0,71)*3);if(TEXN-y-h<8)h=TEXN-y;const x0=Math.floor(hsh(r,1,72)*12);let x=x0,s=0;
    while(x<x0+TEXN){let w=10+Math.floor(hsh(r,s,73)*8);if(x0+TEXN-x-w<10)w=x0+TEXN-x;const hv=hsh(r,s,74),tone=COB_B[Math.floor(hv*5)];
      cr(x,y,w,h,'#7e7d92');cr(x,y,w-1,h-1,tone);cr(x+1,y,w-3,1,hmix(tone,'#e2e4ee',.35));cr(x,y+1,1,h-3,hmix(tone,'#e2e4ee',.18));
      cr(x+1,y+h-2,w-2,1,hmix(tone,'#55546a',.22));cr(x+w-2,y+1,1,h-3,hmix(tone,'#55546a',.14));cr(x,y,1,1,'#8a899e');
      if(hv>.86)cr(x+3+Math.floor(hsh(s,r,75)*(w-6)),y+2+Math.floor(hsh(r,s,77)*(h-5)),2,1,hmix(tone,'#55546a',.25));if(hsh(r,s,76)<.05)cr(x,y+h-2,2,1,'#78966a');x+=w;s++}
    y+=h;r++}return cv}
const COB_B=['#a2a2b2','#9c9cae','#a8a7b6','#9e9ba8','#a5a3ae'];
function tileCobble(x0,y0,X,Y,c){if(!TEX.cob)TEX.cob=cobTex();texBlit(c,TEX.cob,x0,y0)}
// bridge: planks run across the walking direction, rails only on water sides, end lips where it meets land
function tileBridge(x0,y0,X,Y,c,G){const g=(dx,dy)=>G[Y+dy]?.[X+dx],W2=v=>v===2;const ns=!(W2(g(0,-1))||W2(g(0,1)));
  R_(c,x0,y0,16,16,WOOD.k);
  if(ns){for(let p=0;p<4;p++){const py=y0+p*4,q=Y*4+p,col=hsh(X,q,61)<.5?WOOD.m:'#a46a3a';R_(c,x0,py,16,3,col);R_(c,x0,py,16,1,WOOD.l);R_(c,x0,py+2,16,1,hmix(col,'#3e2414',.25));R_(c,x0+(q*5+3)%16,py,1,3,WOOD.d);R_(c,x0+3,py+1,1,1,WOOD.d);R_(c,x0+12,py+1,1,1,WOOD.d)}
    const lip=v=>v!==undefined&&v!==2&&v!==7;if(lip(g(0,-1)))R_(c,x0,y0,16,1,WOOD.d);if(lip(g(0,1))){R_(c,x0,y0+15,16,1,WOOD.k)}
    if(W2(g(-1,0))){R_(c,x0,y0,3,16,WOOD.d);R_(c,x0+1,y0,1,16,WOOD.l);R_(c,x0+3,y0,1,16,WOOD.k);if(Y%2===0){R_(c,x0,y0+2,4,4,WOOD.k);R_(c,x0,y0+2,3,3,WOOD.m);R_(c,x0,y0+2,3,1,WOOD.h)}}
    if(W2(g(1,0))){R_(c,x0+12,y0,1,16,WOOD.k);R_(c,x0+13,y0,3,16,WOOD.d);R_(c,x0+14,y0,1,16,WOOD.l);if(Y%2===0){R_(c,x0+12,y0+2,4,4,WOOD.k);R_(c,x0+13,y0+2,3,3,WOOD.m);R_(c,x0+13,y0+2,3,1,WOOD.h)}}}
  else{for(let p=0;p<4;p++){const px_=x0+p*4,q=X*4+p,col=hsh(q,Y,61)<.5?WOOD.m:'#a46a3a';R_(c,px_,y0,3,16,col);R_(c,px_,y0,1,16,WOOD.l);R_(c,px_+2,y0,1,16,hmix(col,'#3e2414',.25));R_(c,px_,y0+(q*5+3)%16,3,1,WOOD.d);R_(c,px_+1,y0+3,1,1,WOOD.d);R_(c,px_+1,y0+12,1,1,WOOD.d)}
    if(W2(g(0,-1))){R_(c,x0,y0,16,3,WOOD.d);R_(c,x0,y0+1,16,1,WOOD.l);R_(c,x0,y0+3,16,1,WOOD.k);if(X%2===0){R_(c,x0+2,y0,4,4,WOOD.k);R_(c,x0+2,y0,3,3,WOOD.m);R_(c,x0+2,y0,3,1,WOOD.h)}}
    if(W2(g(0,1))){R_(c,x0,y0+12,16,1,WOOD.k);R_(c,x0,y0+13,16,3,WOOD.d);R_(c,x0,y0+14,16,1,WOOD.l);if(X%2===0){R_(c,x0+2,y0+12,4,4,WOOD.k);R_(c,x0+2,y0+12,3,3,WOOD.m);R_(c,x0+2,y0+12,3,1,WOOD.h)}}}}
// curbs: raised stone border drawn inside cells of type A wherever they meet type B (planters in plazas). flat decal.
function drawCurbs(c,G,isA,isB){const H=G.length,W=G[0].length;
  for(let Y=0;Y<H;Y++)for(let X=0;X<W;X++){if(!isA(G[Y][X]))continue;const b=(dx,dy)=>{const v=G[Y+dy]?.[X+dx];return v!==undefined&&isB(v)},x=X*16,y=Y*16;
    const u=b(0,-1),d=b(0,1),l=b(-1,0),r=b(1,0);
    if(u){R_(c,x,y,16,3,STN.m);R_(c,x,y,16,1,STN.h);R_(c,x,y+3,16,1,STN.d);c.fillStyle='rgba(16,34,44,.22)';c.fillRect(x,y+4,16,2)}
    if(d){R_(c,x,y+13,16,1,STN.l);R_(c,x,y+14,16,1,STN.m);R_(c,x,y+15,16,1,STN.d)}
    if(l){R_(c,x,y,3,16,STN.m);R_(c,x,y,1,16,STN.l);R_(c,x+3,y,1,16,STN.d);c.fillStyle='rgba(16,34,44,.18)';c.fillRect(x+4,y+(u?6:0),1,16-(u?6:0))}
    if(r){R_(c,x+13,y,1,16,STN.l);R_(c,x+14,y,1,16,STN.m);R_(c,x+15,y,1,16,STN.d)}
    for(const[cx,cy,ok]of[[0,0,u&&l],[13,0,u&&r],[0,13,d&&l],[13,13,d&&r]])if(ok){R_(c,x+cx,y+cy,3,3,STN.l);R_(c,x+cx+1,y+cy+1,1,1,STN.h)}}}
let TREE_CV=null,ROCK_CV=null,TREE_CVS=null;
// tree variants (32x32, upright card: art ends on row 31 = base). v: 0 round, 1 tall, 2 broad w/ blossoms
function treeVar(v,flip){const g=SG(32,32),L=TREEP;
  // trunk + root flare
  part(g,U(RR(13,19,18,29),PG([[10,31],[13,26],[19,26],[22,31]])),BARK,{sh:{cx:13,cy:24,rx:6,ry:8}});
  px(g,15,23,BARK.r[0]);px(g,15,24,BARK.r[0]);px(g,17,27,BARK.r[0]);hline(g,12,13,30,BARK.r[1]);hline(g,19,20,30,BARK.r[1]);px(g,14,21,BARK.r[3]);px(g,14,22,BARK.r[3]);
  const can=v===1?U(E(16,10,10.5,9.5),E(16,4.5,7,4.5),E(9.5,15,6.5,6),E(22.5,15,6.5,6),E(16,18,8.5,5)):v===2?U(E(16,11,14,9),E(7,16,6.5,5.5),E(25,16,6.5,5.5),E(16,18,11,5.5),E(12,5,6,4.5),E(21,5,6,4.5)):U(E(16,10,12.5,9),E(8,15,7,6),E(24,15,7,6),E(16,18,10,5.5),E(14,4.5,7,4.5));
  const m=part(g,can,L,{sh:{cx:14,cy:9,rx:15,ry:13}});
  // darker underside band
  for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(interior(m,g,x,y)&&!inMask(m,g,x,y+3)&&get(g,x,y)!==L.line)px(g,x,y,L.r[0]);
  // leaf clumps: scalloped shade arcs (lower-right) + warm highlight (upper-left)
  const cl=v===1?[[12,4],[19,5],[9,10],[16,10],[23,11],[11,16],[18,16],[24,17]]:v===2?[[10,6],[17,4],[23,7],[6,13],[13,11],[20,11],[26,13],[10,17],[17,17],[23,18]]:[[11,5],[18,4],[24,9],[7,12],[14,10],[20,12],[26,14],[10,17],[17,17],[23,18]];
  for(const[cx,cy]of cl){for(let a=0;a<12;a++){const t=a/12*Math.PI*.95-.1,x=Math.round(cx+Math.cos(t)*3.2),y=Math.round(cy+Math.sin(t)*2.6);if(interior(m,g,x,y)){const cur=get(g,x,y);px(g,x,y,cur===L.r[3]?L.r[2]:cur===L.r[2]?L.r[1]:L.r[0])}}
    for(const[dx,dy]of[[-2,-2],[-1,-2],[0,-2],[-2,-1]]){const x=cx+dx,y=cy+dy;if(interior(m,g,x,y)){const cur=get(g,x,y);px(g,x,y,cur===L.r[0]?L.r[1]:cur===L.r[1]?L.r[2]:L.r[3])}}}
  for(const[x,y]of v===1?[[12,2],[10,8]]:[[10,3],[16,2],[6,10]])if(interior(m,g,x,y)){px(g,x,y,L.r[3]);px(g,x+1,y,'#c8ec88')}
  if(v===2)for(const[x,y]of[[9,7],[19,6],[24,12],[14,14],[7,16],[20,17]])if(interior(m,g,x,y)){px(g,x,y,'#f8b4d0');px(g,x+1,y,'#f8b4d0');px(g,x,y+1,'#d8709c')}
  return toCv(flip?flipH(g):g)}
function treeSprite(){return treeVar(0)}
function treeCv(X,Y){if(!TREE_CVS){TREE_CVS=[treeVar(0),treeVar(0,1),treeVar(1),treeVar(2,1)];TREE_CV=TREE_CVS[0]}
  const h=hsh(X,Y,97);return TREE_CVS[h<.5?0:h<.72?1:h<.9?2:3]}
function drawTreeShadow(c,X,Y){artOval(c,X*16+16,Y*16+30,12,3,.24)}
// boulder 16x16, upright (no baked shadow; use drawRockShadow as a flat decal)
function rockSprite(){const g=SG(16,16);const m=part(g,U(E(8,10,7,5.2),E(6,7.5,4.5,4),E(10,8,4,3.5),RR(2,10,13,14)),STONE,{sh:{cx:6,cy:6,rx:8,ry:7}});
  pxs(g,[[9,9],[10,10],[10,11],[11,12]],STONE.r[0]);px(g,8,8,STONE.r[1]);pxs(g,[[4,5],[5,4]],STONE.r[3]);px(g,5,5,'#ffffff');
  for(let x=1;x<15;x++)if(interior(m,g,x,13))px(g,x,13,STONE.r[0]);pxs(g,[[5,3],[6,3],[7,4]],'#6f9a4a');px(g,6,2,'#8ac05a');return toCv(g)}
function drawRockShadow(c,X,Y){artOval(c,X*16+8,Y*16+15,7,2,.24)}
// free-battle arena canvas: ground, decals (duel circles, reeds, lilies), contact shadows, trees/rocks
function paintWorld(MAP,fr){const cv0=mkCanvas(WW,WH),c=cpuCtx(cv0);const G=MAP.ground;
  for(let Y=0;Y<MH;Y++)for(let X=0;X<MW;X++){const x0=X*TS,y0=Y*TS,v=G[Y][X];
    if(v===1)tilePath(x0,y0,X,Y,c,G);else if(v===2)tileWater(x0,y0,X,Y,c,G,fr);else if(v===3)tileTall(x0,y0,X,Y,c);else if(v===4)tileFlowers(x0,y0,X,Y,c);else if(v===6)tileCobble(x0,y0,X,Y,c);else if(v===8)tileDirt(x0,y0,X,Y,c,G);else tileGrass(x0,y0,X,Y,c)}
  if(!TREE_CV){TREE_CV=treeSprite();ROCK_CV=rockSprite()}
  if(MAP.decal)MAP.decal(c,fr);
  for(let Y=0;Y<MH;Y++)for(let X=0;X<MW;X++){if(MAP.obj[Y][X]===1)drawTreeShadow(c,X,Y);if(MAP.obj[Y][X]===2)drawRockShadow(c,X,Y)}
  for(let Y=0;Y<MH;Y++)for(let X=0;X<MW;X++){if(MAP.obj[Y][X]===1)c.drawImage(treeCv(X,Y),X*TS,Y*TS);if(MAP.obj[Y][X]===2)c.drawImage(ROCK_CV,X*TS,Y*TS)}
  const cv=mkCanvas(WW,WH);cv.getContext('2d').drawImage(cv0,0,0);return cv}

/* ===== SNIPANT (bug) ===== */
function lineG(g,x0,y0,x1,y1,c){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=n;i++){const k=n?i/n:0;px(g,Math.round(x0+(x1-x0)*k),Math.round(y0+(y1-y0)*k),c)}}
PAL.chitin=RP('#240806','#5e140e','#962618','#c84428','#f4936a');
PAL.amber=RP('#2c1606','#6a3c0e','#a2661a','#d49a34','#f6d68a');
function drawSnipant(dir,fr,st){
  const g=SG(32,32),P=PAL,C=P.chitin,LEG='#2a0c08',LH='#7a3020',b=fr?1:0,w=fr?1:-1;
  const leg=(pts)=>{for(let i=0;i<pts.length-1;i++)lineG(g,...pts[i],...pts[i+1],LEG);px(g,...pts[1],LH)};
  const eye=(x,y)=>{px(g,x,y,'#0c0610');px(g,x+1,y,'#0c0610');px(g,x,y+1,'#0c0610');px(g,x+1,y+1,'#3a2440');px(g,x,y,'#ffffff')};
  if(dir==='down'){
    const ab=part(g,E(16,8.5,6.4,5.2),C);
    for(const yy of[7,10])for(let x=0;x<32;x++)if(interior(ab,g,x,yy)&&x%2===0)px(g,x,yy,C.r[0]);
    px(g,13,5,C.r[3]);px(g,14,5,'#ffffff');
    leg([[13,14],[7,12+w],[3,15+w]]);leg([[19,14],[25,12-w],[29,15-w]]);
    leg([[13,16],[6,18-w],[3,22-w]]);leg([[19,16],[26,18+w],[29,22+w]]);
    leg([[13,17],[8,23+w],[6,29]]);leg([[19,17],[24,23-w],[26,29]]);
    part(g,E(16,14.5,4,3),C);
    lineG(g,13,16,10,12,LEG);lineG(g,10,12,6,10-b,LEG);lineG(g,6,10-b,5,7-b,LEG);px(g,5,6-b,C.r[3]);
    lineG(g,19,16,22,12,LEG);lineG(g,22,12,26,10-b,LEG);lineG(g,26,10-b,27,7-b,LEG);px(g,27,6-b,C.r[3]);
    const hd=part(g,E(16,21,7.6,6.2),C);
    for(const ex of[10,19]){for(let dy=0;dy<3;dy++)hline(g,ex,ex+2,19+dy,'#0c0610');px(g,ex,19,'#ffffff');px(g,ex+1,19,'#ffffff');px(g,ex+2,21,'#4a2a50')}
    px(g,13,16,C.r[3]);px(g,14,16,'#ffffff');px(g,15,16,C.r[3]);
    hline(g,14,18,24,C.r[0]);
    const op=st==='snap'?2:0;
    part(g,PG([[10,24],[14,25],[14,27],[13+op/2,30],[10+op,31],[8,29],[9,27]]),P.amber);
    part(g,PG([[22,24],[18,25],[18,27],[19-op/2,30],[22-op,31],[24,29],[23,27]]),P.amber);
    px(g,10,26,P.amber.r[3]);px(g,22,26,P.amber.r[3]);px(g,12,29,P.amber.line);px(g,20,29,P.amber.line);
  }else if(dir==='up'){
    leg([[13,15],[7,12+w],[4,15+w]]);leg([[19,15],[25,12-w],[28,15-w]]);
    leg([[13,17],[6,18-w],[3,22-w]]);leg([[19,17],[26,18+w],[29,22+w]]);
    leg([[13,18],[8,24+w],[7,29]]);leg([[19,18],[24,24-w],[25,29]]);
    lineG(g,13,7,9,3,LEG);lineG(g,9,3,7,1+b,LEG);lineG(g,19,7,23,3,LEG);lineG(g,23,3,25,1+b,LEG);
    part(g,E(16,9,5.4,4.4),C);
    part(g,E(16,15,4,3.4),C);
    const ab=part(g,E(16,23,8.2,6.8),C);
    for(const yy of[20,23,26])for(let x=0;x<32;x++)if(interior(ab,g,x,yy))px(g,x,yy,x%2?C.r[0]:C.r[1]);
    px(g,13,18,C.r[3]);px(g,12,19,'#ffffff');px(g,14,7,C.r[3]);
  }else{ // left
    // far legs
    leg([[15,21],[19,24-w],[21,29]]);leg([[14,21],[13,25+w],[11,29]]);leg([[16,21],[23,23+w],[26,28]]);
    // abdomen
    const ab=part(g,E(24.5,17,6.8,5.6),C);
    for(const xx of[22,25,28])for(let y=0;y<32;y++)if(interior(ab,g,xx,y)&&y%2)px(g,xx,y,C.r[0]);
    px(g,22,13,C.r[3]);px(g,23,13,'#ffffff');
    // petiole + thorax
    part(g,E(17.5,19,4,3.2),C);
    // near legs
    leg([[16,21],[18,25+w],[17,29]]);leg([[15,21],[11,24-w],[8,29]]);leg([[18,21],[22,24-w],[24,29+0]]);
    // head
    part(g,E(9.5,18.5+b*.3,5.4,4.8),C);
    eye(6,16);
    px(g,9,15,C.r[3]);px(g,10,14,'#ffffff');
    // antenna
    lineG(g,9,14,8,9,LEG);lineG(g,8,9,4,7-b,LEG);px(g,3,7-b,C.r[2]);
    // mandible
    const op=st==='snap'?0:1;
    part(g,PG([[5,20],[6,22],[3,24+op],[1,23],[2,21]]),P.amber);px(g,2,22,P.amber.r[3]);
  }
  return g}

/* ===== SCRATTLE (normal rat) ===== */
PAL.ratfur=RP('#2a160a','#6a4426','#966638','#c08e5a','#e6be8a');
PAL.cream=RP('#5a4a30','#c8b080','#e2cc9c','#f6e8c4','#fffaea');
PAL.tail=RP('#5a2238','#b25a78','#d8809c','#f2a8bc','#ffd6e2');
function tailLine(g,pts,tip){for(let i=0;i<pts.length-1;i++){const[x0,y0]=pts[i],[x1,y1]=pts[i+1];lineG(g,x0,y0+1,x1,y1+1,PAL.tail.line);lineG(g,x0,y0,x1,y1,PAL.tail.r[2])}const[tx,ty]=pts[pts.length-1];px(g,tx,ty,'#ffffff');px(g,tx,ty+1,PAL.tail.r[1]);if(tip)px(g,tx+tip[0],ty+tip[1],'#ffffff')}
function drawScrattle(dir,fr,st){
  const g=SG(32,32),P=PAL,F=P.ratfur,b=fr?1:0;
  if(dir==='down'){
    tailLine(g,[[20,26],[25,27],[28,25],[29,21],[28,18],[30,16]],[1,0]);
    part(g,E(11.5,29+(fr?-1:0),3,1.6),P.tail);part(g,E(20.5,29+(fr?0:-1),3,1.6),P.tail);
    part(g,E(16,23+b,7,5.8),F);
    part(g,E(16,24.5+b,4,3.6),P.cream,{soft:1});
    part(g,E(10,22+b,2,2.2),F);part(g,E(22,22+b,2,2.2),F);px(g,9,23+b,P.tail.r[2]);px(g,23,23+b,P.tail.r[2]);
    part(g,E(8.5,8+b,4,4),F);part(g,E(23.5,8+b,4,4),F);
    part(g,E(8.5,8.5+b,2.2,2.4),P.tail,{line:false});part(g,E(23.5,8.5+b,2.2,2.4),P.tail,{line:false});
    part(g,E(16,14+b,7.8,6.4),F);
    part(g,E(16,17.5+b,4,2.6),P.cream,{soft:1});
    px(g,15,15+b,P.tail.r[0]);px(g,16,15+b,P.tail.r[0]);px(g,15,16+b,P.tail.r[1]);px(g,16,16+b,P.tail.r[1]);
    px(g,15,19+b,'#ffffff');px(g,16,19+b,'#ffffff');px(g,15,20+b,'#d8d8c8');px(g,16,20+b,'#d8d8c8');
    for(const ex of[11,19]){for(let dy=0;dy<3;dy++)hline(g,ex,ex+1,12+dy+b,INK);px(g,ex,12+b,'#ffffff');px(g,ex+1,14+b,'#5a3a4a')}
    lineG(g,10,17+b,6,16+b,F.line);lineG(g,10,18+b,6,19+b,F.line);lineG(g,21,17+b,25,16+b,F.line);lineG(g,21,18+b,25,19+b,F.line);
    px(g,13,9+b,F.r[3]);px(g,14,9+b,F.r[3]);px(g,13,10+b,'#fff0d0');
  }else if(dir==='up'){
    part(g,E(11.5,28+(fr?-1:0),3,1.6),P.tail);part(g,E(20.5,28+(fr?0:-1),3,1.6),P.tail);
    part(g,E(16,22+b,7,6),F);
    part(g,E(8.5,8+b,4,4),F);part(g,E(23.5,8+b,4,4),F);
    part(g,E(16,13+b,7.6,6.2),F);
    hline(g,13,19,16+b,F.r[1]);px(g,12,10+b,F.r[3]);px(g,13,9+b,F.r[3]);
    tailLine(g,[[16,27],[16,29],[19,30],[23,29],[26,30],[29,28]],[1,-1]);
  }else{
    part(g,E(20+(fr?1:-1),29,3.4,1.9),P.tail,{bias:-.3,line:false,flat:1});
    tailLine(g,[[24,24],[27,23],[29,20],[29,16],[31,13]],[0,-1]);
    part(g,E(17.5,22.5+b,8,5.6),F);
    part(g,E(15,25+b,5,2.8),P.cream,{soft:1});
    part(g,E(12+(fr?-1:1),29,3.4,1.9),P.tail,{line:false,flat:2});px(g,10+(fr?-1:1),29,P.tail.r[3]);
    part(g,E(12,9+b,3.6,3.8),F);part(g,E(12,9.5+b,2,2.4),P.tail,{line:false});
    part(g,PG([[2,18+b],[6,12+b],[12,11+b],[15,15+b],[13,21+b],[6,21+b]]),F);
    part(g,E(5,18.5+b,3,2.2),P.cream,{soft:1});
    px(g,1,17+b,P.tail.r[0]);px(g,2,17+b,P.tail.r[1]);px(g,3,21+b,'#ffffff');px(g,4,21+b,'#ffffff');px(g,3,22+b,'#d8d8c8');
    for(let dy=0;dy<3;dy++)hline(g,7,8,14+dy+b,INK);px(g,7,14+b,'#ffffff');
    lineG(g,4,17+b,0,16+b,F.line);lineG(g,4,19+b,0,20+b,F.line);
    pxs(g,[[11,25+b],[12,26+b]],F.line);px(g,11,26+b,P.tail.r[2]);px(g,10,26+b,P.tail.r[2]);
  }
  return g}

/* ===== CINDERCUB (fire bear) ===== */
PAL.bear=RP('#260a04','#6a2412','#9c3a1c','#c85a2a','#f09050');
PAL.coal=RP('#08080c','#1e1e26','#34343e','#4e4e5e','#747488');
PAL.flame=RP('#5a1000','#d03a10','#f47a18','#f8c040','#fff6c0');
function flameTufts(g,pts){for(const[x,y,h]of pts){part(g,PG([[x-2,y],[x,y-h],[x+2,y]]),PAL.flame,{flat:2,line:false});px(g,x,y-h+1,PAL.flame.r[3]);px(g,x,y-1,'#fff6c0')}}
function coalPaw(g,cx,cy,rx,ry){part(g,E(cx,cy,rx,ry),PAL.coal);px(g,Math.round(cx)-1,Math.round(cy),'#f47a18');px(g,Math.round(cx)+1,Math.round(cy)+1,'#f8c040')}
function drawCindercub(dir,fr,st){
  const g=SG(32,32),P=PAL,B=P.bear,b=fr?1:0;
  if(dir==='down'){
    coalPaw(g,11,29+(fr?-1:0),3.4,2);coalPaw(g,21,29+(fr?0:-1),3.4,2);
    part(g,E(16,22+b,8.6,7),B);
    part(g,E(16,24+b,5,4.4),P.cream,{soft:1});
    flameTufts(g,[[9,18+b,5],[12,17+b,6],[16,17+b,7],[20,17+b,6],[23,18+b,5]]);
    part(g,E(8.5,6+b,3.4,3.4),B);part(g,E(23.5,6+b,3.4,3.4),B);px(g,8,6+b,P.coal.r[1]);px(g,9,6+b,P.coal.r[1]);px(g,23,6+b,P.coal.r[1]);px(g,24,6+b,P.coal.r[1]);
    flameTufts(g,[[14,6+b,4],[16,5+b,6],[18,6+b,4]]);
    part(g,E(16,12+b,8,6.6),B);
    part(g,E(16,15.5+b,4.4,3),P.cream,{soft:1});
    part(g,E(16,14+b,1.8,1.2),P.coal,{line:false,flat:1});px(g,15,13+b,'#8a8aa0');
    hline(g,15,17,17+b,B.line);
    for(const ex of[11,19]){for(let dy=0;dy<2;dy++)hline(g,ex,ex+1,10+dy+b,INK);px(g,ex,10+b,'#ffffff')}
    px(g,10,13+b,'#f08cb0');px(g,22,13+b,'#f08cb0');
    if(st==='charge'){coalPaw(g,11,19+b,3,3);coalPaw(g,21,19+b,3,3)}
    else{coalPaw(g,7,23+b,3,3.2);coalPaw(g,25,23+b,3,3.2)}
  }else if(dir==='up'){
    coalPaw(g,11,29+(fr?-1:0),3.4,2);coalPaw(g,21,29+(fr?0:-1),3.4,2);
    coalPaw(g,7,22+b,3,3.2);coalPaw(g,25,22+b,3,3.2);
    part(g,E(16,22+b,8.6,7),B);
    part(g,E(16,27+b,2.4,2),B);
    part(g,E(8.5,6+b,3.4,3.4),B);part(g,E(23.5,6+b,3.4,3.4),B);
    part(g,E(16,12+b,8,6.6),B);
    flameTufts(g,[[10,18+b,4],[13,17+b,5],[16,17+b,6],[19,17+b,5],[22,18+b,4]]);
    flameTufts(g,[[14,6+b,4],[16,5+b,6],[18,6+b,4]]);
  }else{
    coalPaw(g,20+(fr?1:-1),29,3.2,2);
    part(g,E(18,21.5+b,9.4,6.8),B);
    part(g,E(15,25+b,5,3),P.cream,{soft:1});
    part(g,E(26.5,18+b,2.2,2),B);
    flameTufts(g,[[13,16+b,6],[16,16+b,7],[19,16+b,7],[22,17+b,6],[25,18+b,4]]);
    coalPaw(g,11+(fr?-1:1),29,3.4,2);
    part(g,E(12,6+b,3.2,3.2),B);px(g,12,6+b,P.coal.r[1]);
    part(g,E(10,12.5+b,7,6.2),B);
    part(g,E(4.5,15+b,3.2,2.4),P.cream,{soft:1});
    part(g,E(2.5,14+b,1.4,1.2),P.coal,{line:false,flat:1});
    for(let dy=0;dy<2;dy++)hline(g,6,7,10+dy+b,INK);px(g,6,10+b,'#ffffff');px(g,8,13+b,'#f08cb0');
    flameTufts(g,[[11,6+b,5],[14,7+b,4]]);
    if(st==='charge')coalPaw(g,6,20+b,3,3);else coalPaw(g,10,23+b,3,3.2);
  }
  return g}


/* ===== UMBRYNX (dark lynx) ===== */
PAL.shade=RP('#0a0814','#1e1632','#30244e','#46366e','#6a589a');
PAL.moon=RP('#2e2450','#7e70c0','#aea2e4','#d8d0ff','#ffffff');
const UEYE='#ffe060',UEYE2='#f89830';
function crescent(g,cx,cy,r,ox,oy){part(g,DF(E(cx,cy,r,r),E(cx+ox,cy+oy,r*.78,r*.78)),PAL.moon,{sh:{cx:cx-1,cy:cy-1,rx:r,ry:r}})}
function thick(g,pts,F){for(let i=0;i<pts.length-1;i++){const[a,b]=pts[i],[c,d]=pts[i+1];lineG(g,a-1,b,c-1,d,F.line);lineG(g,a+1,b+1,c+1,d+1,F.line);lineG(g,a,b,c,d,F.r[2]);lineG(g,a,b+1,c,d+1,F.r[1])}}
function drawUmbrynx(dir,fr,st){
  const g=SG(32,32),P=PAL,F=P.shade,M=P.moon,b=fr?1:0,rush=st==='rush';
  if(dir==='down'){
    thick(g,[[21,25],[25,22],[26,17]],F);
    crescent(g,26,11,6,-2.8,1.8);
    part(g,E(11.5,29+(fr?-1:0),2.8,1.6),F);part(g,E(20.5,29+(fr?0:-1),2.8,1.6),F);
    part(g,E(16,23+b,7,5.4),F);
    part(g,DF(E(16,24.6+b,3.6,2.8),E(16,23.2+b,3.4,2.6)),M,{line:false,flat:2});
    part(g,E(11.5,26+b,2.2,2.4),F);part(g,E(20.5,26+b,2.2,2.4),F);px(g,11,27+b,F.r[4]);px(g,20,27+b,F.r[4]);
    part(g,PG([[7,12+b],[8,1+b],[14,8+b]]),F);part(g,PG([[25,12+b],[24,1+b],[18,8+b]]),F);
    part(g,PG([[9,9+b],[9,4+b],[12,8+b]]),M,{line:false,flat:1});part(g,PG([[23,9+b],[23,4+b],[20,8+b]]),M,{line:false,flat:1});
    px(g,8,2+b,M.r[3]);px(g,24,2+b,M.r[3]);
    part(g,U(E(16,14+b,7.6,6),PG([[9,13+b],[5,19+b],[11,18+b]]),PG([[23,13+b],[27,19+b],[21,18+b]])),F);
    part(g,PG([[9,15+b],[5,19+b],[11,18+b]]),M,{flat:1});part(g,PG([[23,15+b],[27,19+b],[21,18+b]]),M,{flat:1});
    part(g,E(16,17.4+b,3,2),F,{line:false,flat:3});
    px(g,15,16+b,M.r[0]);px(g,16,16+b,M.r[0]);px(g,15,15+b,F.line);px(g,16,15+b,F.line);hline(g,14,17,18+b,F.line);px(g,14,19+b,'#ffffff');px(g,17,19+b,'#ffffff');
    for(let x=10;x<=22;x++)px(g,x,20+b,x%3?M.r[1]:M.r[0]);for(let x=11;x<=21;x+=3)px(g,x,21+b,M.r[1]);
    pxs(g,[[15,9+b],[16,9+b],[14,10+b],[17,10+b]],M.r[3]);
    for(const[ex,s]of[[11,1],[18,-1]]){const i=s>0?ex+2:ex,o=s>0?ex:ex+2;hline(g,ex,ex+2,13+b,UEYE);hline(g,ex,ex+2,14+b,UEYE2);px(g,ex+1,13+b,INK);px(g,ex+1,14+b,INK);px(g,o,14+b,F.line);px(g,o,12+b,F.line);px(g,ex+1,12+b,F.line);px(g,i,12+b,F.r[3]);px(g,i+s,13+b,F.line)}
  }else if(dir==='up'){
    part(g,E(11.5,28+(fr?-1:0),2.8,1.6),F);part(g,E(20.5,28+(fr?0:-1),2.8,1.6),F);
    part(g,E(16,22+b,7,5.8),F);
    pxs(g,[[16,18+b],[16,19+b],[15,21+b],[17,21+b],[16,23+b],[16,24+b]],M.r[1]);
    part(g,PG([[7,12+b],[8,1+b],[14,8+b]]),F);part(g,PG([[25,12+b],[24,1+b],[18,8+b]]),F);
    px(g,8,2+b,M.r[3]);px(g,24,2+b,M.r[3]);
    part(g,U(E(16,13+b,7.4,6),PG([[9,12+b],[5,18+b],[11,17+b]]),PG([[23,12+b],[27,18+b],[21,17+b]])),F);
    hline(g,13,19,15+b,F.r[1]);pxs(g,[[12,9+b],[13,8+b],[19,8+b],[20,9+b]],F.r[4]);
    thick(g,[[16,26],[18,29],[22,29]],F);
    crescent(g,26,26,5.4,-2.6,-1.4);
  }else{
    thick(g,[[24,21],[27,17],[28,13]],F);
    crescent(g,27,8,5.6,-2.8,1.6);
    part(g,E(20+(fr?1:-1),29,2.8,1.7),F,{bias:-.3});part(g,E(23+(fr?-1:1),29,2.6,1.6),F,{bias:-.3});
    part(g,E(18,22.5+b,8.4,5.2),F);
    part(g,DF(E(17,24.5+b,5,2.6),E(17,23+b,5,2.4)),M,{line:false,flat:2});
    pxs(g,[[20,19+b],[22,19+b],[24,20+b]],M.r[1]);
    part(g,E(11+(fr?-1:1),29,2.8,1.7),F);part(g,E(14+(fr?1:-1),29,2.6,1.6),F);px(g,10+(fr?-1:1),29,F.r[4]);
    part(g,PG([[9,10+b],[11,0+b],[15,8+b]]),F);part(g,PG([[11,8+b],[11,3+b],[13,7+b]]),M,{line:false,flat:1});px(g,11,1+b,M.r[3]);
    part(g,U(E(11,13.5+b,6.4,5.6),PG([[3,14+b],[7,11+b],[8,17+b],[4,17+b]]),PG([[14,14+b],[18,19+b],[13,18+b]])),F);
    part(g,PG([[14,14+b],[18,19+b],[13,18+b]]),M,{flat:1});
    part(g,E(4.6,16+b,2,1.4),M,{line:false,flat:2});
    px(g,2,14+b,F.line);px(g,3,14+b,F.line);px(g,4,17+b,'#ffffff');
    for(let y=17;y<=21;y+=2){px(g,15,y+b,M.r[1]);px(g,16,y+1+b,M.r[0])}
    pxs(g,[[9,9+b],[10,9+b],[11,10+b]],M.r[3]);
    hline(g,5,8,11+b,F.line);hline(g,5,8,12+b,UEYE);hline(g,5,8,13+b,UEYE2);px(g,6,12+b,INK);px(g,6,13+b,INK);px(g,8,13+b,F.line)
    px(g,17,19+b,F.r[4]);
  }
  if(rush){for(let i=0;i<g.p.length;i++){const v=g.p[i];if(v===UEYE)g.p[i]='#ff5a5a';else if(v===UEYE2)g.p[i]='#c81838';else if(v===M.r[2]||v===M.r[1])g.p[i]='#e06aff'}}
  return g}

/* ===== VOLTUSK (rock / electric boar) ===== */
PAL.slate=RP('#1a1828','#383650','#58566c','#7e7c90','#aeaab8');
PAL.sandst=RP('#3a220c','#7a5222','#aa7e36','#d4aa58','#f6e2a2');
PAL.volt=RP('#4a3200','#b07e00','#f0c018','#f8e468','#fffcd8');
PAL.tusk=RP('#4a3a2a','#a49274','#d6c8aa','#f0e8d2','#ffffff');
PAL.snout=RP('#3a2234','#7a4c60','#a8707e','#d09ca0','#f0d0c8');
function fillHoles(g){const G=(x,y)=>x>=0&&y>=0&&x<g.w&&y<g.h?g.p[y*g.w+x]:null;for(let y=1;y<g.h-1;y++)for(let x=1;x<g.w-1;x++)if(!G(x,y)&&G(x+1,y)&&G(x-1,y)&&G(x,y+1)&&G(x,y-1))g.p[y*g.w+x]=G(x,y-1)}
function pcircG(g,cx,cy,r,c){for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++)if((x-cx)**2+(y-cy)**2<=r*r)px(g,x,y,c)}
function vTip(g,x,y,fr){px(g,x,y,'#ffffff');px(g,x+(fr?1:-1),y-1,PAL.volt.r[3])}
function vBolt(g,pts,clip){part(g,clip?IN(PG(pts),clip):PG(pts),PAL.volt,{flat:2,line:false});const[x,y]=pts[0];px(g,Math.round(x),Math.round(y),PAL.volt.r[3])}
function vPlate(g,pts){part(g,PG(pts),PAL.sandst);const t=pts[1];px(g,t[0],t[1]+1,PAL.sandst.r[3]);px(g,t[0],t[1]+2,'#fff4c8')}
function vEye(g,x,y,s){px(g,x,y,PAL.volt.r[3]);px(g,x+s,y,'#fffcd8');px(g,x,y+1,PAL.volt.r[1]);px(g,x+s,y+1,INK);px(g,x-s,y-1,PAL.slate.line);px(g,x,y-1,PAL.slate.line);px(g,x+s,y-1,PAL.slate.line);px(g,x-s,y,PAL.slate.line)}
function drawVoltusk(dir,fr,st){
  const g=SG(32,32),P=PAL,R=P.slate,b=fr?1:0,s1=fr?-1:0,s2=fr?0:-1;
  if(st==='roll'){
    const cx=16,cy=19.5,rr=10.5,rot=fr?.63:0;
    part(g,E(cx,cy,rr,rr),P.sandst,{sh:{cx:cx-1.5,cy:cy-2,rx:rr,ry:rr}});
    for(let k=0;k<5;k++){const a=rot+k*1.2566,m=[Math.round(cx+Math.cos(a+.35)*rr*.5),Math.round(cy+Math.sin(a+.35)*rr*.5)],e=[Math.round(cx+Math.cos(a)*(rr-.6)),Math.round(cy+Math.sin(a)*(rr-.6))];
      lineG(g,cx,19,...m,P.sandst.line);lineG(g,...m,...e,P.sandst.line);px(g,...m,P.volt.r[2]);px(g,...e,P.volt.r[3])}
    pcircG(g,cx,19,2.1,P.volt.r[2]);pcircG(g,cx,19,1.1,P.volt.r[3]);px(g,cx,19,'#ffffff');
    part(g,DF(E(cx,cy,rr,rr),E(cx,cy-2.2,rr+.5,rr)),R,{line:false,flat:1});
    if(dir==='left'){part(g,E(6.5,24,3,2.3),P.snout);px(g,4,24,P.snout.line);part(g,PG([[8,26],[5,27],[3,24],[3,22],[5,24]]),P.tusk);vTip(g,3,22,fr)}
    else if(dir==='down'){part(g,E(16,25,3.4,2.3),P.snout);px(g,15,25,P.snout.line);px(g,17,25,P.snout.line);part(g,PG([[13,26],[10,27],[8,24],[8,22],[11,25]]),P.tusk);part(g,PG([[19,26],[22,27],[24,24],[24,22],[21,25]]),P.tusk);vTip(g,8,22,fr);vTip(g,24,22,!fr)}
    px(g,10,12,'#ffffff');px(g,11,12,'#fff4c8');px(g,10,13,P.sandst.r[3]);
    return g}
  const rear=st==='charge',L=rear?-4:0;
  if(dir==='down'){
    vPlate(g,[[7,14+b+L],[9,5+b+L],[13,12+b+L]]);vPlate(g,[[19,12+b+L],[23,5+b+L],[25,14+b+L]]);vPlate(g,[[12,11+b+L],[16,1+b+L],[20,11+b+L]]);
    if(!rear){part(g,RR(8,24,12,29+s1),R);part(g,RR(20,24,24,29+s2),R);part(g,RR(8,28+s1,12,30+s1),P.coal);part(g,RR(20,28+s2,24,30+s2),P.coal)}
    else{part(g,RR(6,25,10,30),R,{bias:-.2});part(g,RR(22,25,26,30),R,{bias:-.2});part(g,RR(6,29,10,30),P.coal);part(g,RR(22,29,26,30),P.coal)}
    part(g,E(16,20+b+L*.5,13,8.4),R);
    {const cl=E(16,20+b+L*.5,12,7.4);vBolt(g,[[4,16+b],[9,16+b],[7,19+b],[10,19+b],[5,25+b],[6,20.5+b],[4,20.5+b]],cl);vBolt(g,[[28,16+b],[23,16+b],[25,19+b],[22,19+b],[27,25+b],[26,20.5+b],[28,20.5+b]],cl)}
    if(rear){part(g,RR(8,20+L,12,25+L),R);part(g,RR(20,20+L,24,25+L),R);part(g,RR(8,24+L,12,26+L),P.coal);part(g,RR(20,24+L,24,26+L),P.coal)}
    part(g,PG([[6,13+b+L],[4,5+b+L],[12,10+b+L]]),R);part(g,PG([[26,13+b+L],[28,5+b+L],[20,10+b+L]]),R);px(g,6,8+b+L,P.snout.r[2]);px(g,26,8+b+L,P.snout.r[2]);
    part(g,E(16,15.5+b+L,8.6,7),R);
    px(g,12,10+b+L,R.r[3]);px(g,13,10+b+L,R.r[3]);px(g,12,11+b+L,R.r[3]);
    vEye(g,11,14+b+L,1);vEye(g,20,14+b+L,-1);
    part(g,E(16,20+b+L,5.2,3.4),P.snout);
    pxs(g,[[14,20+b+L],[14,21+b+L],[18,20+b+L],[18,21+b+L]],P.snout.line);px(g,15,18+b+L,P.snout.r[3]);px(g,16,18+b+L,P.snout.r[3]);
    hline(g,14,18,23+b+L,R.line);
    part(g,PG([[13,23+b+L],[10,22+b+L],[7,19+b+L],[6,15+b+L],[7,14+b+L],[9,17+b+L],[13,20+b+L]]),P.tusk);
    part(g,PG([[19,23+b+L],[22,22+b+L],[25,19+b+L],[26,15+b+L],[25,14+b+L],[23,17+b+L],[19,20+b+L]]),P.tusk);
    vTip(g,6,14+b+L,fr);vTip(g,26,14+b+L,!fr);
    if(rear){for(const[x,y,s]of[[3,9,1],[29,9,-1],[1,18,1],[31,18,-1]])vBolt(g,[[x,y],[x+3*s,y+2],[x+1*s,y+3],[x+4*s,y+6],[x,y+4],[x+2*s,y+2]].map(([a,c])=>[a,c+(fr?1:0)]))}
  }else if(dir==='up'){
    part(g,RR(8,24,12,29+s1),R);part(g,RR(20,24,24,29+s2),R);part(g,RR(8,28+s1,12,30+s1),P.coal);part(g,RR(20,28+s2,24,30+s2),P.coal);
    part(g,PG([[6,13+b+L],[4,5+b+L],[12,10+b+L]]),R);part(g,PG([[26,13+b+L],[28,5+b+L],[20,10+b+L]]),R);
    part(g,E(16,11+b+L,8,5),R);
    part(g,E(16,19+b+L*.5,13,8.8),R);
    {const cl=E(16,20+b+L*.5,12,7.4);vBolt(g,[[4,16+b],[9,16+b],[7,19+b],[10,19+b],[5,25+b],[6,20.5+b],[4,20.5+b]],cl);vBolt(g,[[28,16+b],[23,16+b],[25,19+b],[22,19+b],[27,25+b],[26,20.5+b],[28,20.5+b]],cl)}
    for(const[y,h,w]of[[24,5,3],[19,6,4],[14,7,5],[9,7,4]])vPlate(g,[[16-w,y+b+L],[16,y+b+L-h],[16+w,y+b+L]]);for(const y of[11,16,21])px(g,16,y+b+L,PAL.volt.r[3]);
    part(g,PG([[15,26+b],[18,27+b],[16,29+b],[18,31],[14,29+b]]),P.volt,{flat:2});
    px(g,10,13+b,R.r[3]);px(g,9,14+b,R.r[3]);
  }else{
    for(const pts of[[[11,15],[13,7],[17,13]],[[16,13],[19,4],[22,12]],[[21,12],[24,6],[27,13]],[[25,15],[28,10],[30,16]]])vPlate(g,pts.map(([x,y])=>[x,y+b+L*(x<20?1:.4)]));
    part(g,PG([[28,18+b],[31,15+b],[30,17+b],[31,19+b]]),P.volt,{flat:2});
    part(g,RR(13,24,15,29),R,{bias:-.3});part(g,RR(25,24,27,29),R,{bias:-.3});part(g,RR(13,28,15,30),P.coal,{bias:-.3});part(g,RR(25,28,27,30),P.coal,{bias:-.3});
    part(g,E(18.5,19+b+L*.5,11.5,7.4),R);
    vBolt(g,[[17,16+b],[23,16+b],[21,19+b],[26,19+b],[19,24+b],[21,20.5+b],[16,20.5+b]]);
    if(!rear){part(g,RR(9,24,12,29+s1),R);part(g,RR(21,24,24,29+s2),R);part(g,RR(9,28+s1,12,30+s1),P.coal);part(g,RR(21,28+s2,24,30+s2),P.coal)}
    else{part(g,RR(21,24,24,30),R);part(g,RR(21,29,24,30),P.coal);part(g,PG([[7,18+L],[12,19+L],[10,25+L],[5,24+L]]),R);part(g,PG([[5,23+L],[10,24+L],[9,26+L],[4,25+L]]),P.coal)}
    part(g,PG([[8,13+b+L],[11,6+b+L],[13,13+b+L]]),R);px(g,11,9+b+L,P.snout.r[2]);
    part(g,E(9,18.5+b+L,6.6,6),R);
    part(g,E(3.5,21+b+L,3.2,2.8),P.snout);px(g,1,20+b+L,P.snout.line);px(g,1,21+b+L,P.snout.line);px(g,3,19+b+L,P.snout.r[3]);
    hline(g,2,6,24+b+L,R.line);
    part(g,PG([[7,24+b+L],[3,23+b+L],[1,19+b+L],[1,15+b+L],[3,17+b+L],[5,20+b+L],[8,21+b+L]]),P.tusk);vTip(g,1,15+b+L,fr);
    vEye(g,7,16+b+L,-1);px(g,10,13+b+L,R.r[3]);px(g,11,14+b+L,R.r[3]);
    if(rear){for(const[x,y]of[[2,6],[14,2]])vBolt(g,[[x,y],[x+3,y+2],[x+1,y+3],[x+4,y+6],[x,y+4],[x+2,y+2]].map(([a,c])=>[a,c+(fr?1:0)]))}
  }
  fillHoles(g);return g}

/* ===== MESMAMBA (poison / psychic cobra) ===== */
PAL.venom=RP('#1c0a2a','#45195a','#702c88','#9c4cb0','#cc88dc');
PAL.hood=RP('#1c0a2a','#2e0e42','#4a1a62','#702c88','#a058b8');
PAL.vbelly=RP('#24300e','#5e7426','#86a23c','#b4d064','#e0f4a8');
const MEYE='#d8ff70',MEYE2='#7ab020',MPSY='#f85888';
function mSpot(g,x,y,glow){const O=glow?'#ffd0e0':'#a02858';for(const[dx,dy]of[[-1,-1],[1,-1],[-1,1],[1,1]])px(g,x+dx,y+dy,O);for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]])px(g,x+dx,y+dy,MPSY);px(g,x,y,glow?'#ffffff':'#2a0a24');px(g,x+1,y-1,glow?'#ffffff':'#ff9ac0');
  if(glow)for(const[dx,dy]of[[-2,0],[2,0],[0,-2],[0,2]])px(g,x+dx,y+dy,'#ff9ac0')}
function mScutes(g,m,y0,y1,c){for(let y=y0;y<=y1;y+=2)for(let x=0;x<32;x++)if(interior(m,g,x,y))px(g,x,y,c)}
function drawMesmamba(dir,fr,st){
  const g=SG(32,32),P=PAL,V=P.venom,Hd=P.hood,b=fr?1:0,cast=st==='charge',hw=cast?12.6:10.6;
  const coil=(x0)=>{part(g,PG([[x0+8,27],[x0+13,23],[x0+14,19],[x0+15,20],[x0+15,25],[x0+10,29]]),V);px(g,x0+14,20,P.vbelly.r[3]);px(g,x0+14,21,P.vbelly.r[2]);
    const lo=part(g,E(x0,28,12,3.3),V);for(let x=x0-10;x<=x0+10;x+=3)px(g,x,28,V.r[1]);const hi=part(g,E(x0+(dir==='left'?2.5:0),25,9.4,2.8),V);for(let x=x0-7;x<=x0+9;x+=3)px(g,x,25,V.r[3]);px(g,x0-5,24,V.r[3])};
  const hood=(cx,w)=>{const sh=DF(E(cx,12+b,w,8.6),RR(0,20+b,31,31));part(g,sh,Hd);return sh};
  if(dir==='down'){
    coil(16);
    const hm=hood(16,hw);part(g,DF(E(16,12.5+b,hw-2.2,6.8),RR(0,20+b,31,31)),Hd,{line:false,flat:1});
    for(const s of[-1,1]){const x=Math.round(16+s*hw*.6);mSpot(g,x,12+b,cast);px(g,x,8+b,Hd.r[3]);px(g,x+s,16+b,Hd.r[3])}
    part(g,PG([[13,11+b],[19,11+b],[20,25],[12,25]]),V);
    const bl=part(g,PG([[14,12+b],[18,12+b],[18,24],[14,24]]),P.vbelly);mScutes(g,bl,14+b,24,P.vbelly.r[1]);
    part(g,E(16,8+b,5.2,3.8),V,{bias:.15});
    px(g,14,6+b,V.r[3]);px(g,13,7+b,V.r[3]);
    px(g,16,5+b,'#ffffff');px(g,16,6+b,MPSY);px(g,15,6+b,'#a02858');px(g,17,6+b,'#a02858');
    for(const[ex,s]of[[13,1],[19,-1]]){px(g,ex,8+b,MEYE);px(g,ex+s,8+b,INK);px(g,ex,9+b,MEYE2);px(g,ex+s,9+b,MEYE);px(g,ex-s,8+b,V.line);px(g,ex,7+b,V.line);px(g,ex+s,7+b,V.line)}
    if(cast){px(g,15,11+b,'#ffffff');px(g,17,11+b,'#ffffff');px(g,16,11+b,'#3a0a20');px(g,16,12+b,'#ff7aa8');px(g,15,12+b,'#3a0a20');px(g,17,12+b,'#3a0a20')}
    else if(!fr){px(g,16,12+b,'#ff5a8a');px(g,15,13+b,'#ff5a8a');px(g,17,13+b,'#ff5a8a')}else px(g,16,12+b,'#ff5a8a');
  }else if(dir==='up'){
    coil(16);
    part(g,PG([[13,11+b],[19,11+b],[20,25],[12,25]]),V);
    const hm=hood(16,hw);
    for(let y=7;y<=18;y+=2)for(let x=5;x<=27;x+=4){const xx=x+((y>>1)%2)*2;if(interior(hm,g,xx,y+b))px(g,xx,y+b,Hd.r[1])}
    px(g,9,8+b,Hd.r[3]);px(g,10,7+b,Hd.r[3]);px(g,11,7+b,Hd.r[3]);
    part(g,PG([[9.5,12.5+b],[13,10+b],[16,9.4+b],[19,10+b],[22.5,12.5+b],[19,15+b],[16,15.6+b],[13,15+b]]),{line:'#5a0c2c',r:['#ffe0ec','#ffe0ec','#ffe0ec','#ffe0ec']},{flat:1});
    pcircG(g,16,12.5+b,2.4,cast?'#ff9ac0':MPSY);pcircG(g,16,12.5+b,1.3,cast?'#ffffff':'#a02858');pxs(g,[[16,11+b],[16,12+b],[16,13+b],[16,14+b]],cast?'#ffffff':'#2a0a24');px(g,17,11+b,'#ffffff');
    hline(g,12,20,8+b,'#ff9ac0');px(g,11,9+b,'#ff9ac0');px(g,21,9+b,'#ff9ac0');
    pxs(g,[[9,9+b],[23,9+b],[16,6+b]],'#ff9ac0');
    if(cast)pxs(g,[[7,12+b],[25,12+b],[16,17+b],[8,9+b],[24,9+b]],'#ffd0e0');
    part(g,E(16,5+b,3.8,2.8),V);px(g,15,4+b,V.r[3]);
    for(let y=21;y<=24;y+=3){px(g,15,y,V.r[1]);px(g,17,y+1,V.r[1])}
  }else{
    coil(17);
    const hm=hood(18,cast?7.6:6.2);part(g,DF(E(18,12.5+b,cast?5.4:4,6.6),RR(0,20+b,31,31)),Hd,{line:false,flat:1});
    mSpot(g,cast?21:20,12+b,cast);px(g,20,8+b,Hd.r[3]);
    part(g,PG([[14,25],[21,25],[19,19+b],[16,13+b],[11,11+b],[11,15+b],[13,19+b]]),V);
    const bl=part(g,PG([[12,14+b],[15,15+b],[16,19+b],[17,24],[15,24],[13,19+b]]),P.vbelly);mScutes(g,bl,15+b,24,P.vbelly.r[1]);
    part(g,E(10,9+b,5.2,3.6),V,{bias:.15});part(g,E(6,10+b,2.4,2),V,{bias:.15});
    px(g,10,7+b,V.r[3]);px(g,11,6+b,V.r[3]);px(g,12,7+b,'#ffffff');px(g,13,7+b,MPSY);
    px(g,8,8+b,MEYE);px(g,9,8+b,MEYE);px(g,8,9+b,INK);px(g,9,9+b,MEYE2);hline(g,7,10,7+b,V.line);
    if(cast){px(g,5,11+b,'#ffffff');px(g,6,11+b,'#3a0a20');px(g,4,11+b,'#3a0a20');px(g,5,12+b,'#ff7aa8')}
    else if(!fr){px(g,3,11+b,'#ff5a8a');px(g,2,11+b,'#ff5a8a');px(g,1,10+b,'#ff5a8a');px(g,1,12+b,'#ff5a8a')}else px(g,3,11+b,'#ff5a8a');
  }
  fillHoles(g);return g}

/* ===== PHANTERN (ghost / flying tern) ===== */
PAL.spirit=RP('#1c2448','#4c5a8c','#8898c8','#c2d0f0','#f2f6ff');
PAL.wisp=RP('#0c3440','#187078','#30aca8','#70e0d0','#ccfff2');
PAL.cap=RP('#0e1228','#1e2444','#2e365c','#424c78','#5c6894');
PAL.beak=RP('#5a1a10','#b8401e','#f07040','#ffa070','#ffd8b8');
const PEYE='#9ffff0';
function pWing(g,pts,tipBox,lx){const W=PAL.wisp,sh=PG(pts);part(g,sh,PAL.spirit,{lx});part(g,IN(sh,tipBox),W,{lx});
  for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(sh(x,y)&&tipBox(x,y)&&(x+y)%2&&!sh(x+1,y)+!sh(x-1,y)+!sh(x,y+1)+!sh(x,y-1)===0)px(g,x,y,W.r[3])}
function pTail(g,pts,tips){const W=PAL.wisp,sh=PG(pts);part(g,sh,W,{lx:0,ly:-1});for(const i of tips){const[x,y]=pts[i];px(g,Math.round(x)+(x>16?-1:0),Math.round(y)-1,'#ffffff');px(g,Math.round(x)+(x>16?-2:1),Math.round(y)-1,W.r[3])}}
function drawPhantern(dir,fr,st){
  const g=SG(32,32),P=PAL,S=P.spirit,C=P.cap,W=P.wisp,b=fr?1:0;
  if(dir!=='left'){const up=dir==='up';
    pTail(g,[[12.5,18.5+b],[19.5,18.5+b],[23,21.5+b],[28,24+b],[22,24+b],[18,22.5+b],[16,21.5+b],[14,22.5+b],[10,24+b],[4,24+b],[9,21.5+b]],[3,9]);
    const wl=fr?[[12,13],[8,14],[4,16],[0,20],[3,21],[7,19],[11,18]]:[[12,13],[9,9],[5,5],[1,2],[2,7],[4,11],[7,15],[11,17]];
    for(const s of[1,-1]){const pts=wl.map(([x,y])=>[s>0?x+.5:31.5-x,y+b]);pWing(g,pts,s>0?RR(0,0,4,31):RR(27,0,31,31),s>0?-.7:.5);
      const mid=fr?[[10,15],[5,17]]:[[10,13],[5,7]];lineG(g,...mid[0].map((v,i)=>i?v+b:(s>0?v:31-v)),...mid[1].map((v,i)=>i?v+b:(s>0?v:31-v)),S.r[1])}
    part(g,E(16,15.5+b,5.2,6),S);
    if(!up){part(g,E(16,17+b,2.2,2.6),W,{flat:3,line:false});px(g,16,17+b,'#ffffff');px(g,15,16+b,W.r[3]);pxs(g,[[13,17+b],[19,17+b],[16,13+b]],W.r[2])}
    else{part(g,PG([[15,11+b],[17,11+b],[17,20+b],[16,22+b],[15,20+b]]),W,{flat:2,line:false});px(g,13,12+b,S.r[3])}
    part(g,E(16,8.5+b,5.6,5.1),S);
    part(g,DF(E(16,8.2+b,5.9,5),RR(0,up?14:9+b,31,31)),C);
    if(!up){
      for(const[ex,s]of[[13,1],[19,-1]]){px(g,ex,9+b,PEYE);px(g,ex+s,9+b,'#ffffff');px(g,ex,10+b,W.r[2]);px(g,ex+s,10+b,PEYE);px(g,ex-s,10+b,C.line)}
      part(g,PG([[14.5,11+b],[17.5,11+b],[16,14.6+b]]),P.beak);px(g,15,11+b,P.beak.r[3]);
      px(g,12,5+b,C.r[3]);px(g,13,4+b,C.r[3]);px(g,14,4+b,C.r[3]);
    }else{px(g,12,5+b,C.r[3]);px(g,13,4+b,C.r[3])}
  }else{
    const far=fr?[[17,15],[21,19],[25,24],[23,24],[19,20]]:[[17,13],[20,7],[23,2],[24,4],[22,10],[20,14]];
    part(g,PG(far.map(([x,y])=>[x,y+b])),S,{bias:-.4});
    pTail(g,[[21,13+b],[24,15+b],[29,17+b],[31,19+b],[27,19+b],[25,19.5+b],[28,23+b],[29,25+b],[24,22+b],[21,18+b]],[3,7]);
    part(g,E(16.5,15+b,7.2,4.6),S);
    part(g,E(12,17+b,2,1.8),W,{flat:3,line:false});px(g,12,17+b,'#ffffff');
    const nw=fr?[[13,15],[18,17],[24,22],[27,25],[22,25],[17,20]]:[[13,13],[16,7],[20,1.5],[24,0],[23,3],[20,9],[18,14]];
    pWing(g,nw.map(([x,y])=>[x,y+b]),fr?RR(0,23,31,31):RR(0,0,31,3),-.3);
    lineG(g,fr?16:16,(fr?17:11)+b,fr?22:20,(fr?21:4)+b,S.r[1]);
    part(g,E(9,10.5+b,5,4.6),S);
    part(g,DF(E(9.6,10+b,5.3,4.6),RR(0,11+b,31,31)),C);part(g,PG([[12,8+b],[17,9+b],[13,11+b]]),C);
    part(g,PG([[5.5,10.5+b],[0,12+b],[0,13+b],[5.5,14.5+b]]),P.beak,{line:false,flat:2});hline(g,1,5,13+b,P.beak.r[1]);hline(g,2,5,11+b,P.beak.r[3]);px(g,0,12+b,P.beak.line);
    px(g,7,11+b,PEYE);px(g,8,11+b,'#ffffff');px(g,7,12+b,W.r[2]);px(g,8,12+b,PEYE);px(g,6,12+b,C.line);
    px(g,7,7+b,C.r[3]);px(g,8,6+b,C.r[3]);
  }
  fillHoles(g);
  if(st==='veil'){const keep=new Set([W.r[3],'#ffffff',PEYE]);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=y*32+x,v=g.p[i];if(!v||keep.has(v))continue;
    if(v===S.line||v===C.line||v===W.line||v===P.beak.line)g.p[i]=W.r[1];else if((x+y)%2)g.p[i]=null;else g.p[i]=v===S.r[3]||v===S.r[2]?W.r[3]:v===S.r[0]||v===S.r[1]||C.r.includes(v)?W.r[2]:W.r[3]}}
  return g}

/* ===== HUMANS (overworld trainers) ===== */
function hmix(h,t,k){const a=parseInt(h.slice(1),16),b=parseInt(t.slice(1),16);const r=Math.round((a>>16)*(1-k)+(b>>16)*k),g=Math.round((a>>8&255)*(1-k)+(b>>8&255)*k),bl=Math.round((a&255)*(1-k)+(b&255)*k);return'#'+((1<<24)|(r<<16)|(g<<8)|bl).toString(16).slice(1)}
const HEADS={
 cap:{down:["....OOOOOOOO....","...OKKKKKKKKO...","..OKKKKWWKKKKO..","..OKKKKWWKKKKO..","..OKKKKKKKKKKO..",".OkkkkkkkkkkkkO.",".OVVVVVVVVVVVVO."],
      up:["....OOOOOOOO....","...OKKKKKKKKO...","..OKKKKKKKKKKO..","..OKKKKKKKKKKO..","..OKKKKKKKKKKO..",".OkkkkkkkkkkkkO.",".OkkkkkkkkkkkkO."],
      left:[".....OOOOOO.....","....OKKKKKKO....","...OKKWWKKKKO...","...OKKWWKKKKO...","...OKKKKKKKKO...","..OkkkkkkkkkkO..","OVVVVVVVkkkkkO.."]},
 short:{down:["....OOOOOOOO....","...OHHHHHHHHO...","..OHHHHHHHHHHO..","..OHHHhHHhHHHO..",".OHHHHHHHHHHHHO.",".OHHHHHHHHHHHHO.",".OHhHHHHHHHHhHO."],
      up:["....OOOOOOOO....","...OHHHHHHHHO...","..OHHHHHHHHHHO..","..OHHHhHHhHHHO..",".OHHHHHHHHHHHHO.",".OHHHHhHHhHHHHO.",".OHHHHHHHHHHHHO."],
      left:[".....OOOOOO.....","....OHHHHHHO....","...OHHHHHHHHO...","...OHHHhHHHHO...","..OHHHHHHHHHHO..","..OHHHHHHHhHHO..","..OSHHHHHHHHHO.."]},
 spiky:{down:["...O..O..O..O...","..OHO.OHOOHO.O..",".OHHHOHHHHHHOHO.",".OHHhHHHHHHhHHO.","OHHHHHHHHHHHHHHO",".OHHHHhHHhHHHHO.",".OHHHHHHHHHHHHO."],
      up:["...O..O..O..O...","..OHO.OHOOHO.O..",".OHHHOHHHHHHOHO.",".OHHhHHHHHHhHHO.","OHHHHHHHHHHHHHHO",".OHHHHhHHhHHHHO.",".OHHHHHHHHHHHHO."],
      left:["......O..O......",".....OHOOHO.O...","...OOHHHHHHOHO..","..OHHHHHHHHHHOO.","...OHHHHhHHHHHHO","..OHHHHHHHHHHHO.","..OSHHHHHHHHHO.."]},
 bald:{down:["................","....OOOOOOOO....","...OSSSSSSSSO...","..OSSWSSSSSSSO..","..OSSSSSSSSSSO..",".OHSSSSSSSSSSHO.",".OHHSSSSSSSSHHO."],
      up:["................","....OOOOOOOO....","...OSSSSSSSSO...","..OSSSSSSSSSSO..","..OSSSSSSSSSSO..",".OHSSSSSSSSSSHO.",".OHHHHHHHHHHHHO."],
      left:["................",".....OOOOOO.....","....OSSSSSSO....","...OSSWSSSSSO...","...OSSSSSSSSO...","..OSSSSSSSHHO...","..OSSSSSSHHHO..."]},
};
const FACE={down:[".OHHSSSSSSSSHHO.",".OHSSSSSSSSSSHO.",".OHSSOSSSSOSSHO.",".OHSSOSSSSOSSHO.","..OsSSSSSSSSsO..","...OOssSSssOO..."],
  up:[".OHHHHHHHHHHHHO.",".OHhHHHHHHHHhHO.",".OHhHHHHHHHHhHO.",".OHHhHHHHHHhHHO.","..OHHHHHHHHHHO..","...OOSSSSSSOO..."],
  left:["..OSSSSSHHHHHO..","..OSSSSSSHHHHO..","..OSOSSSSSHHHO..",".OSSOSSSSSsHHO..","..OSSSSSSssHO...","...OOsssSOOO...."]};
const BODY={down:["....OCCCCCCO....","...OCCCCCCCCO...","..OCCCCCCCCCCO..","..OCcCCCCCCcCO..","..OSOCCCCCCOSO..","...OPPPPPPPPO..."],
  up:["....OCCCCCCO....","...OCCCCCCCCO...","..OCCCCCCCCCCO..","..OCcCCCCCCcCO..","..OSOCCCCCCOSO..","...OPPPPPPPPO..."],
  left:[".....OCCCCO.....","....OCCCCCCO....","....OCCCCCCO....","....OCCcCCCO....","....OCSOCCcO....",".....OPPPPO....."]};
const LEGS={down:[["...OPPPOOPPPO...","...OPPPOOPPPO...","...OBBBOOBBBO...","...OOOO..OOOO..."],["...OPPPOOPPPO...","...OBBBOOPPPO...","...OOOO.OPPPO...",".........OBBBO..",".........OOOO..."].slice(0,4),["...OPPPOOPPPO...","...OPPPOOBBBO...","...OPPPO.OOOO...","...OBBBO........"]],
  left:[[".....OPPPPO.....",".....OPPPPO.....","....OBBBBBO.....","....OOOOOOO....."],["....OPPOPPPO....","...OPPO.OPPO....","..OBBBO.OBBBO...","..OOOOO.OOOOO..."],["....OPPOPPPO....","....OPPOOPPO....","...OBBBOOBBBO...","...OOOOOOOOOO..."]]};
LEGS.up=LEGS.down;
function drawHumanOld(look,dir,fr){
  const d=dir==='right'?'left':dir,rows=[...HEADS[look.head][d],...FACE[d],...BODY[d],...LEGS[d][fr]];
  const map={O:'#282830',K:look.cap||'#d83838',k:hmix(look.cap||'#d83838','#000000',.3),V:look.visor||'#f0f0f0',W:'#ffffff',H:look.hair,h:hmix(look.hair,'#000000',.35),S:'#f8d0a8',s:'#d8a078',C:look.shirt,c:hmix(look.shirt,'#000000',.28),P:look.pants,p:hmix(look.pants,'#000000',.3),B:look.shoes||'#383848'};
  const g=SG(16,24);
  rows.forEach((r,y)=>{for(let x=0;x<16;x++){const ch=r[x];if(ch&&ch!=='.')px(g,x,y+1,map[ch])}});
  if(look.long&&d!=='left'){for(let y=11;y<18;y++){px(g,1,y,map.H);px(g,2,y,y%3?map.H:map.h);px(g,13,y,y%3?map.H:map.h);px(g,14,y,map.H);px(g,0,y,map.O);px(g,15,y,map.O)}px(g,1,18,map.O);px(g,14,18,map.O);px(g,2,18,map.O);px(g,13,18,map.O)}
  if(look.long&&d==='left'){for(let y=11;y<18;y++){px(g,11,y,map.H);px(g,12,y,map.h);px(g,13,y,map.O)}}
  if(look.coat){for(let y=14;y<21;y++){if(d!=='left'){px(g,2,y,y>18?map.O:map.C);px(g,13,y,y>18?map.O:map.C)}}if(d==='down'){for(let y=14;y<20;y++){px(g,7,y,map.c);px(g,8,y,'#b8b8c0')}}}
  if(look.skirt){const fl={down:"..OPPPPPPPPPPO..",up:"..OPPPPPPPPPPO..",left:"....OPPPPPPO...."}[d];for(let x=0;x<16;x++){const ch=fl[x];if(ch!=='.')px(g,x,20,map[ch])}
    for(let y=21;y<24;y++)for(let x=0;x<16;x++){if(get(g,x,y)===map.P)px(g,x,y,map.S);if(get(g,x,y)===map.p)px(g,x,y,map.s)}}
  if(look.pack){const pk=look.pack,pd=hmix(pk,'#000000',.35),pl=hmix(pk,'#ffffff',.3);
    if(d==='up'){for(let y=13;y<20;y++)for(let x=4;x<12;x++)px(g,x,y,(y===13||y===19||x===4||x===11)?'#282830':y===14?pl:pk);hline(g,5,10,16,pd);px(g,7,17,'#f8f8f8');px(g,8,17,'#f8f8f8')}
    else if(d==='down'){px(g,4,14,pd);px(g,5,15,pd);px(g,11,14,pd);px(g,10,15,pd)}
    else{for(let y=13;y<20;y++)for(let x=10;x<13;x++)px(g,x,y,(x===12||y===13||y===19)?'#282830':pk);px(g,10,14,pl);px(g,8,14,pd);px(g,7,15,pd)}}
  if(look.band){if(d==='down'){px(g,3,18,look.band);px(g,12,18,look.band)}else if(d==='left'){px(g,6,18,look.band)}}
  if(look.collar&&d==='down'){px(g,6,14,'#f8f8f8');px(g,9,14,'#f8f8f8');px(g,7,15,'#f8f8f8');px(g,8,15,'#f8f8f8')}
  if(look.scarf&&d!=='up'){hline(g,d==='left'?5:5,d==='left'?10:10,13,look.scarf);if(d==='down'){px(g,9,14,look.scarf);px(g,9,15,hmix(look.scarf,'#000000',.3))}}
  if(look.glasses&&d==='down'){hline(g,4,6,10,'#4868a8');hline(g,9,11,10,'#4868a8')}
  if(look.glasses&&d==='left'){hline(g,2,5,10,'#4868a8')}
  if(look.bow&&d!=='up'){const bx=d==='left'?9:11;px(g,bx,2,'#f84878');px(g,bx+1,2,'#f84878');px(g,bx+2,2,'#f84878');px(g,bx+1,3,'#c02858')}
  return dir==='right'?flipH(g):g}
const LOOKS={
  player:{head:'cap',cap:'#d83838',hair:'#3a2a20',shirt:'#3888c8',pants:'#304060',shoes:'#c83030',pack:'#f0b830',band:'#38c8a8',collar:1},
  playerG:{head:'cap',cap:'#f4f4f4',visor:'#e04848',hair:'#8a4a2a',shirt:'#e04848',pants:'#3a4a78',shoes:'#f4f4f4',pack:'#f8d048',band:'#38c8a8',long:1,skirt:1},
  rival:{head:'spiky',hair:'#c8782c',shirt:'#8058b0',pants:'#384050',band:'#f8a030'},
  prof:{head:'short',hair:'#c8c8d8',shirt:'#f0f0f0',pants:'#506048',coat:1,glasses:1,long:1,scarf:'#3a9a58'},
  mom:{head:'short',hair:'#904828',shirt:'#e87898',pants:'#c05878',long:1},
  girl:{head:'short',hair:'#c05028',shirt:'#f0c838',pants:'#4878c8',bow:1},
  oldman:{head:'bald',hair:'#d0d0d0',shirt:'#58a058',pants:'#605040'},
  sister:{head:'short',hair:'#e8c058',shirt:'#78b8e8',pants:'#5888b8',long:1},
  aide:{head:'short',hair:'#303038',shirt:'#f0f0f0',pants:'#485068',coat:1},
  nurse:{head:'short',hair:'#f0a0b8',shirt:'#f8f8f8',pants:'#e86888',long:1,collar:1,skirt:1},
  hiker:{head:'cap',cap:'#7a5a2a',visor:'#5a3a1a',hair:'#3a2a1a',shirt:'#c86a2a',pants:'#5a5a3a',pack:'#8a6a3a'},
  sailor:{head:'cap',cap:'#f4f4f4',visor:'#2a4a8a',hair:'#6a4a2a',shirt:'#2a5aa8',pants:'#f0f0f0',collar:1},
  corvan:{head:'short',hair:'#3a3a48',shirt:'#8a2a2a',pants:'#2a2a38',coat:1,scarf:'#f8c838'},
  coil:{head:'cap',cap:'#2a1a3a',visor:'#a040a0',hair:'#1a1a22',shirt:'#3a2a4a',pants:'#1e1a26',shoes:'#a040a0',band:'#a040a0'},
  coilboss:{head:'spiky',hair:'#a040a0',shirt:'#1e1428',pants:'#2a1a3a',coat:1,scarf:'#e858c8',shoes:'#1a1a22'},
  clerk:{head:'cap',cap:'#3a9a58',visor:'#f4f4f4',hair:'#5a3a22',shirt:'#f0e8d0',pants:'#384050',collar:1},
  maren:{head:'short',hair:'#2a2238',shirt:'#3e2e58',pants:'#22202c',shoes:'#16141e',coat:1,long:1,scarf:'#aea2e4',band:'#e06aff'},
};
/* ===== HUMANS v3: native-resolution Gen-5-style trainer sprites (20x30), hand-pixeled layered templates from art/hum.py ===== */
const HUMD={"W":20,"H":30,"down":{"head":[3,[".....oooooooooo.....","....oSSSSSSSSSSo....","...oSSSSSSSSSSSSo...","...oSSSSSSSSSSSSo...","...oSSSSSSSSSSSSo...","...oSSSSSSSSSSSSo...","...oSSWESSSSEWSSo...","...oSSWESSSSEWSSo...","...osSSSSSSSSSSso...","....osSSSSSSSSso....",".....oossssssoo....."]],"hair":{"short":[0,["......oooooooo......","....ooHHjjjHHHoo....","...oHHjjjjHHHHHho...","..oHHjjHHHHHHHHhho..","..oHjHHHHHHHHHHhho..","..oHHHHHHHHHHHHhho..","..ohHHhHHHHHHhHhho..","..ohHo.hHHHHo.hhho..","..oho..ohHHo..ohho..","..oho...oo.....oho..","..oho..........oho..","...o............o..."]],"spiky":[0,["...o..oo.oo.oo..o...","..oHooHjoHjoHHooHo..","..oHHHjjjjHHHHHHHo..","..oHHjjHHHHHHHHhho..",".ooHjHHHHHHHHHHhhoo.","ohHHHHHHHHHHHHHHhhho",".ohhHHhHHHHHHhHhhho.","..ohHo.hHHHHo.hhho..","..oho..ohHHo..ohho..","..oho...oo.....oho..","...oo..........oo..."]],"cap":[0,["......oooooooo......","....ooKKkkkKKKoo....","...oKkkkoWWoKKKqo...","..oKkkKoWKKWoKKqqo..","..oKKKKoWWWWoKKqqo..","..oqKKKKooooKKKqqo..",".ooqqqqqqqqqqqqqqoo.","oVVVVVVVVVVVVVVVVVVo",".ovvvvvvvvvvvvvvvvo.","..ohHo.hHHHHo.hhho..","..oho...oo.....oho..","..oho..........oho..","...o............o..."]],"long":[0,["......oooooooo......","....ooHHjjjHHHoo....","...oHHjjjjHHHHHho...","..oHHjjHHHHHHHHhho..","..oHjHHHHHHHHHHhho..","..oHHHHHHHHHHHHhho..",".ohHHHhHHHHHHhHhhho.",".ohHHo.hHHHHo.hhhho.",".ohHo..ohHHo..oHhho.",".ohHo...oo....oHhho.",".ohHo..........oHho.",".ohHo..........oHho.",".ohHo..........oHho.",".ohHHo........oHHho.",".ohHHo........oHHho.",".ohhHo........oHhho.","..ohho........ohho..","...oo..........oo..."]],"bald":[3,[".....oooooooooo.....","....oSTTSSSSSSSo....","...oSTTSSSSSSSSSo...","..ooSSSSSSSSSSSSoo..",".ohhoSSSSSSSSSSohho.",".ohHo..........oHho.",".ohHo..........oHho.","..oo............oo.."]]},"torso":[[14,[".....ooCCLLCCoo.....","....oXCCCLLCCCco....","...oXCoCCCCCCoCco...","...oXCoCCCCCCoCco...","...oXCoCCCCCCoCco...","...oCcoCCCCCCocco...","...oSSoCCCCCCoSso...","...oSsoPPPPPPosso...","....oo........oo...."]],[14,[".....ooCCLLCCoo.....","....oXCCCLLCCCco....","...oXCoCCCCCCoCco...","...oXCoCCCCCCoCco...","...oSSoCCCCCCoCco...","...oSsoCCCCCCocco...","....ooCCCCCCCoSso...",".......PPPPPPosso...","..............oo...."]],[14,[".....ooCCLLCCoo.....","....oXCCCLLCCCco....","...oXCoCCCCCCoCco...","...oXCoCCCCCCoCco...","...oXCoCCCCCCoSso...","...oCcoCCCCCCosso...","...oSSoCCCCCCCoo....","...oSsoPPPPPP.......","....oo.............."]]],"legs":[[21,["......oPPPPPPo......","......oPPPPPPo......","......oPPoPPpo......","......oPpooPpo......","......oPpooPpo......","......oPpooPpo......",".....oBBboBBbo......",".....oBBBoBBBo......","......ooo.ooo......."]],[21,["......oPPPPPPo......","......oPPPPPPo......","......oPPoPPpo......","......oPpooPpo......","......oPpooBBbo.....","......oPpooBBBo.....",".....oBBbo.ooo......",".....oBBBo..........","......ooo..........."]],[21,["......oPPPPPPo......","......oPPPPPPo......","......oPPoPPpo......","......oPpooPpo......",".....oBBboPpo.......",".....oBBBoPpo.......","......ooooBBbo......","..........oBBBo.....","...........ooo......"]]]},"up":{"head":[3,[".....oooooooooo.....","....oSSSSSSSSSSo....","...oSSSSSSSSSSSSo...","...oSSSSSSSSSSSSo...","...oSSSSSSSSSSSSo...","...oSSSSSSSSSSSSo...","...oSSWESSSSEWSSo...","...oSSWESSSSEWSSo...","...osSSSSSSSSSSso...","....osSSSSSSSSso....",".....oossssssoo....."]],"hair":{"short":[0,["......oooooooo......","....ooHHjjjHHHoo....","...oHHjjjjHHHHHho...","..oHHjjHHHHHHHHhho..","..oHjHHHHHHHHHHhho..","..oHHHHHHHHHHHHhho..","..oHHHHHHHHHHHHhho..","..ohHHHHHhHHHHHhho..","..ohHHHHHHhHHHhhho..","..ohhHHHhHHHHHhhho..","...ohhhHHHHHhhhho...","....oohhhhhhhhoo...."]],"spiky":[0,["...o..oo.oo.oo..o...","..oHooHjoHjoHHooHo..","..oHHHjjjjHHHHHHHo..","..oHHjjHHHHHHHHhho..",".ooHjHHHHHHHHHHhhoo.","ohHHHHHHHHHHHHHHhhho",".ohHHHHHhHHHHHHhhho.","..ohHHHHHHhHHHhhho..","..ohhHHHhHHHHHhhho..","...ohhhHHHHHhhhho...","....oohhhhhhhhoo...."]],"cap":[0,["......oooooooo......","....ooKKkkkKKKoo....","...oKkkkKKKKKKKqo...","..oKkkKKKKKKKKKqqo..","..oKKKKKKKKKKKKqqo..","..oqKKKKKKKKKKKqqo..","..oqqqqqoooqqqqqqo..","..ohHHHHoVVoHHHhho..","..ohHHHHHooHHHhhho..","..ohhHHHhHHHHHhhho..","...ohhhHHHHHhhhho...","....oohhhhhhhhoo...."]],"long":[0,["......oooooooo......","....ooHHjjjHHHoo....","...oHHjjjjHHHHHho...","..oHHjjHHHHHHHHhho..","..oHjHHHHHHHHHHhho..","..oHHHHHHHHHHHHhho..",".ohHHHHHHHHHHHHhhho.",".ohHHHHHhHHHHHHhhho.",".ohHHHHHHhHHHHhhhho.",".ohhHHHhHHHHHHhhhho.",".ohHHHHHHHHHHHhhhho.",".ohHHHhHHHHhHHHhhho.",".ohHHHHHHHHHHHHhhho.",".ohHHhHHHHHHhHHhhho.",".ohhHHHHhHHHHHhhhho.","..ohhHHhoohHHhhhho..","...oohho..ohhhoo....",".....oo....oo......."]],"bald":[3,[".....oooooooooo.....","....oSSSSSSSSSso....","...oSSSSSSSSSSSso...","..ooSSSSSSSSSSSsoo..",".ohhoSSSSSSSSSSohho.",".ohHhhhhhhhhhhhhHho.",".ohHHHHHHHHHHHHHHho.","..oohhhhhhhhhhhhoo.."]]},"torso":[[14,[".....ooCCCCCCoo.....","....oXCCCCCCCCco....","...oXCoCCCCCCoCco...","...oXCoCCCCCCoCco...","...oXCoCCCCCCoCco...","...oCcoCCCCCCocco...","...oSSoCCCCCCoSso...","...oSsoPPPPPPosso...","....oo........oo...."]],[14,[".....ooCCCCCCoo.....","....oXCCCCCCCCco....","...oXCoCCCCCCoCco...","...oXCoCCCCCCoCco...","...oXCoCCCCCCoSso...","...oCcoCCCCCCosso...","...oSSoCCCCCCCoo....","...oSsoPPPPPP.......","....oo.............."]],[14,[".....ooCCCCCCoo.....","....oXCCCCCCCCco....","...oXCoCCCCCCoCco...","...oXCoCCCCCCoCco...","...oSSoCCCCCCoCco...","...oSsoCCCCCCocco...","....ooCCCCCCCoSso...",".......PPPPPPosso...","..............oo...."]]],"legs":[[21,["......oPPPPPPo......","......oPPPPPPo......","......oPPoPPpo......","......oPpooPpo......","......oPpooPpo......","......oPpooPpo......",".....oBBboBBbo......",".....oBBBoBBBo......","......ooo.ooo......."]],[21,["......oPPPPPPo......","......oPPPPPPo......","......oPPoPPpo......","......oPpooPpo......",".....oBBboPpo.......",".....oBBBoPpo.......","......ooooBBbo......","..........oBBBo.....","...........ooo......"]],[21,["......oPPPPPPo......","......oPPPPPPo......","......oPPoPPpo......","......oPpooPpo......","......oPpooBBbo.....","......oPpooBBBo.....",".....oBBbo.ooo......",".....oBBBo..........","......ooo..........."]]]},"left":{"head":[3,["......oooooooooo....",".....oSSSSSSSSSSo...","....oSSSSSSSSSSSSo..","...oSSSSSSSSSSSSSo..","...oSSSSSSSSSSSSSo..","..oSSSSSSSSSSSSSSo..","..oSSESSSSSSSSSSSo..","..oSSESSSSSSSSSSso..","..ooSSSSSSSSSSSsso..","...osSSSSSSSSssso...","....ooossssssoo....."]],"hair":{"short":[0,[".......oooooooo.....",".....ooHHjjjHHHoo...","....oHHjjjjHHHHHHo..","...oHjjHHHHHHHHHhho.","..oHjHHHHHHHHHHHhho.","..oHHHHHHHHHHHHHhho.","..ohHHHhHHHHHHHHhho.","..oho.ohHHHHHHHhhho.","...o...ohHHoSoHhhho.",".......ohHHoSShhho..","........ohHHohhho...","........oohhhhoo...."]],"spiky":[0,["......o.oo.oo.o.....",".....oHoHjoHjoHo.o..","....oHHjjjjHHHHHoHo.","...oHjjHHHHHHHHHHHo.","..oHjHHHHHHHHHHHhhoo","..oHHHHHHHHHHHHHhhho","..ohHHHhHHHHHHHHhho.","..oho.ohHHHHHHHhhhoo","...o...ohHHoSoHhhho.",".......ohHHoSShhho..","........ohHHohhho...","........oohhhhoo...."]],"cap":[0,[".......oooooooo.....",".....ooKkkkKKKKoo...","....oKkkkKKKKKKKqo..","...oKkkKKKKKKKKKqqo.","...oKKKKKKKKKKKKqqo.","...oqKKKKKKKKKKKqqo.","..ooqqqqqqqqqqqqqqo.","oVVVVVVvoohHHHHhhho.",".oooooooohHHoSoHhho.",".......ohHHoSShhho..","........ohHHohhho...","........oohhhhoo...."]],"long":[0,[".......oooooooo.....",".....ooHHjjjHHHoo...","....oHHjjjjHHHHHHo..","...oHjjHHHHHHHHHhho.","..oHjHHHHHHHHHHHhho.","..oHHHHHHHHHHHHHhho.","..ohHHHhHHHHHHHHhhho","..oho.ohHHHHHHHHhhho","...o...ohHHoSoHHhhho",".......ohHHoSSHHhhho",".......ohHHHoHHHhhho",".......ohHHHHHHHhhho","........ohHHHHHHhho.","........ohHHHHHHhho.","........ohhHHHHhhho.",".........ohhHHhhho..","..........oohhhoo..."]],"bald":[3,["......oooooooooo....",".....oSTTSSSSSSSo...","....oSTTSSSSSSSSSo..","...oSSSSSSSSSSSSSo..","...oSSSSSSSSSohhho..","..........ohHHHho...","..........ohHHho....","...........oooo....."]]},"torso":[[14,["......ooCCCCoo......",".....oCCCCCCCCo.....",".....oCCoXCoCco.....",".....oCCoXCoCco.....",".....oCCoXCoCco.....",".....oCCocCoCco.....",".....oCCoSSoCco.....",".....oPPoSsoPPo.....","........oo.........."]],[14,["......ooCCCCoo......",".....oCCCCCCCCo.....","....oXCoCCCCCco.....","....oXCoCCCCCco.....","...oSSoCCCCCCco.....","...oSsoCCCCCCco.....","....ooCCCCCCCco.....",".....oPPPPPPPPo.....","...................."]],[14,["......ooCCCCoo......",".....oCCCCCCCCo.....",".....oCCCCCoXCo.....",".....oCCCCCoXCco....",".....oCCCCCCoSSo....",".....oCCCCCCoSso....",".....oCCCCCCCoo.....",".....oPPPPPPPPo.....","...................."]]],"legs":[[21,["......oPPPPPPo......","......oPPPPPpo......","......oPPPPPpo......","......oPPPPPpo......","......oPPPPPpo......","......oPPPPPpo......",".....oBBBBBbo.......",".....oBBBBBBo.......","......oooooo........"]],[21,["......oPPPPPPo......",".....oPPPPoPPpo.....",".....oPPPo.oPPpo....","....oPPPo...oPPpo...","....oPPpo...oPPpo...","...oPPpo.....oPpo...","..oBBBbo.....oBBbo..","..oBBBBo.....oBBBo..","...oooo.......ooo..."]],[21,["......oPPPPPPo......",".....oPpppoPPPo.....",".....oPppo.oPPPo....","....oPppo...oPPPo...","....oPppo...oPPpo...","...oPppo.....oPpo...","..obbbbo.....oBBbo..","..obbbbo.....oBBBo..","...oooo.......ooo..."]]]},"over":{"coat":{"down":[14,[".....ooAACCAAoo.....","....oAAAACCAAAAo....","...oAAoAACCAAoAao...","...oAAoAACCAAoAao...","...oAAoAACCAAoAao...","...oAaoAACCAAoaao...","...oSSoAACCAAoSso...","...oSsoAAaaAAosso...","....ooAAAooAAAoo....","......oAAooAAo......","......oaao.oaao.....",".......oo...oo......"]],"up":[14,[".....ooAAAAAAoo.....","....oAAAAAAAAAAo....","...oAAoAAAAAAoAao...","...oAAoAAAAAAoAao...","...oAAoAAAAAAoAao...","...oAaoAAAAAAoaao...","...oSSoAAAAAAoSso...","...oSsoAAAaAAosso...","....ooAAAAAAAAoo....","......oAAAAAAo......","......oaaaaaao......",".......oooooo......."]],"left":[14,["......ooAAAAoo......",".....oAAAAAAAAo.....",".....oAAoXCoAAo.....",".....oAAoXCoAAo.....",".....oAAoXCoAAo.....",".....oAAocCoAAo.....",".....oAAoSSoAAo.....",".....oAAoSsoAAo.....",".....oAAAooAAAo.....",".....oAAAAAAAAo.....",".....oaaaaaaaao.....","......oooooooo......"]]},"skirt":{"down":[20,["......oPPPPPPo......",".....oPPPPPPPPo.....","....oPPPPPPPPPPo....","....oppPPppPPppo....",".....oooooooooo....."]],"up":[20,["......oPPPPPPo......",".....oPPPPPPPPo.....","....oPPPPPPPPPPo....","....oppPPppPPppo....",".....oooooooooo....."]],"left":[20,["......oPPPPPPo......",".....oPPPPPPPPo.....","....oPPPPPPPPPPo....","....opppPPPPpppo....",".....oooooooooo....."]]},"pack":{"down":[14,[".......G....G.......",".......G....G.......",".......G....G.......",".......g....g.......",".......g....g......."]],"up":[14,["......oooooooo......",".....oGGGGGGGGo.....",".....oGggggggGo.....",".....oGGGWWGGGo.....",".....oGGGGGGGGo.....",".....oGGGGGGGGo.....",".....ogggggggggo....","......oooooooo......"]],"left":[14,["............oooo....","...........oGGGGo...","...........oGGGGgo..","...........oGGGGgo..","...........oGWGGgo..","...........oGGGggo..","...........ogggggo..","............ooooo..."]]},"scarf":{"down":[13,[".....ooooooooooo....","....oFFFFFFFFFFfo...",".....ooFFFFFFFoFo...","............oFFo....","............oFfo....",".............oo....."]],"up":[13,[".....ooooooooooo....","....oFFFFFFFFFFfo...",".....ooooooooooo...."]],"left":[13,[".....oooooooooo.....","....oFFFFFFFFFfo....",".....ooooooFFFFfo...","..........oFFffo....","...........ooo......"]]},"glasses":{"down":[8,["....YYYYY..YYYYY....","....Y...YYYY...Y....","....Y...Y..Y...Y....","....YYYYY..YYYYY...."]],"up":[8,["...................."]],"left":[8,["...YYYY.............","...Y..YYYYYY........","...Y..Y.............","...YYYY............."]]},"bow":{"down":[1,["............oo.oo...","...........oRRoRRo..","...........oRrRrRo..","............oo.oo..."]],"up":[1,["............oo.oo...","...........oRRoRRo..","...........oRrRrRo..","............oo.oo..."]],"left":[1,["..........oo.oo.....",".........oRRoRRo....",".........oRrRrRo....","..........oo.oo....."]]}}};
function drawHuman(Lk,dir,fr){const d=dir==='right'?'left':dir,D=HUMD[d],O=HUMD.over,g=SG(HUMD.W,HUMD.H);
  const sh=Lk.shirt||'#888888',pa=Lk.pants||'#445566',hr=Lk.hair||'#3a2a20',cp=Lk.cap||'#d83838',so=Lk.shoes||hmix(pa,'#101018',.5),vi=Lk.visor||hmix(cp,'#201028',.3);
  const Dk=(c,k=.38)=>hmix(c,'#1c1030',k),Lt=(c,k=.4)=>hmix(c,'#fff4dc',k),coatc=Lk.coat===1||!Lk.coat?hmix(sh,'#1c1030',.06):Lk.coat,pk=Lk.pack||'#f0b830',sc=Lk.scarf||'#f8c838';
  const P={o:'#201820',S:'#f8d0a8',s:'#d4946c',T:'#fff0e0',E:'#201820',e:hmix(hr,'#203060',.6),W:'#ffffff',L:Lk.collar?'#f8f8f8':Lt(sh,.15),X:Lt(sh),C:sh,c:Dk(sh),P:pa,p:Dk(pa),B:so,b:Dk(so),H:hr,h:Dk(hr),j:Lt(hr),K:cp,k:Lt(cp),q:Dk(cp),V:vi,v:Dk(vi),
    A:coatc,a:Dk(coatc),G:pk,g:Dk(pk),F:sc,f:Dk(sc),Y:'#2a2a36',R:'#f05a8a',r:'#b02a5a'};
  const put=(l,sub)=>{const[y0,rows]=l;for(let j=0;j<rows.length;j++){const r=rows[j];for(let i=0;i<r.length;i++){let ch=r[i];if(ch==='.')continue;if(sub&&sub[ch])ch=sub[ch];px(g,i,y0+j,P[ch]||'#ff00ff')}}};
  if(Lk.pack&&d==='left')put(O.pack.left);
  put(D.legs[fr]||D.legs[0],Lk.skirt?{P:'S',p:'s'}:null);put(D.torso[fr]||D.torso[0]);
  if(Lk.skirt)put(O.skirt[d]);if(Lk.coat)put(O.coat[d]);if(Lk.pack&&d!=='left')put(O.pack[d]);
  put(D.head);let hk=Lk.head||'short';if(Lk.long&&hk!=='cap')hk='long';put(D.hair[hk]||D.hair.short);
  if(Lk.scarf)put(O.scarf[d]);if(Lk.glasses)put(O.glasses[d]);if(Lk.bow)put(O.bow[d]);
  return dir==='right'?flipH(g):g}
const HSPR={};
function buildHumans(){for(const k in LOOKS){HSPR[k]={};for(const d of['down','up','left','right'])HSPR[k][d]=[0,1,2].map(fr=>toCv(drawHuman(LOOKS[k],d,fr)))}}

/* ===== OVERWORLD ART: buildings, interiors ===== */
function R_(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
// shared building bits. All upright painters end on or above their deco sort line; contact shadows are separate flat decos.
const WALL_OL='#3a2c34',IRON=['#1e1c2a','#34324a','#545472','#8486a4'];
function roofRamp(roof){return{o:hmix(roof,'#120a1c',.78),r0:hmix(roof,'#1c1438',.52),r1:hmix(roof,'#1c1438',.26),r2:roof,r3:hmix(roof,'#fff0c4',.26),r4:hmix(roof,'#fff6dc',.52)}}
// window: frame, sky-gradient glass, diagonal reflection, muntins, sill; optional shutters (colour) + flower box
function artWin(c,x,y,w,h,sh,box){if(sh){const so=hmix(sh,'#120a1c',.62),sd=hmix(sh,'#120a1c',.3);for(const sx of[x-5,x+w+1]){R_(c,sx,y,4,h,so);R_(c,sx+1,y+1,2,h-2,sh);for(let yy=y+2;yy<y+h-1;yy+=2)R_(c,sx+1,yy,2,1,sd)}}
  R_(c,x,y,w,h,WALL_OL);R_(c,x+1,y+1,w-2,h-2,'#f8f4ec');const gx=x+2,gy=y+2,gw=w-4,gh=h-4;
  for(let j=0;j<gh;j++)R_(c,gx,gy+j,gw,1,j<gh*.4?'#b4e0f8':j<gh*.75?'#80bcec':'#5e98d8');
  for(let j=0;j<gh;j++){const rx=gx+1+Math.floor((gh-1-j)*.7);if(rx<gx+gw-2)R_(c,rx,gy+j,j%5<3?2:1,1,'#eaf8ff')}
  R_(c,gx,gy,gw,1,'#5a7aa0');R_(c,gx+(gw>>1),gy,1,gh,'#f8f4ec');R_(c,gx,gy+(gh>>1),gw,1,'#f8f4ec');
  R_(c,x-1,y+h,w+2,2,'#d8c8a8');R_(c,x-1,y+h+1,w+2,1,'#a89070');
  if(box){R_(c,x,y+h+2,w,4,'#6a4024');R_(c,x+1,y+h+2,w-2,1,'#9a6234');for(let i=1;i<w-1;i+=2){R_(c,x+i,y+h+1,1,1,(i>>1)%3===1?'#f8d848':'#f05a6a');R_(c,x+i+1,y+h+1,1,1,'#4f9a3e')}}}
// House: 96x80 footprint at (X,Y); chimney rises above Y.
// ROOF_SPLIT: Y+45  (rows < Y+45 = roof band incl. eave fascia; rows >= Y+45 = wall band)
function drawHouse(c,X,Y,roof){const W=96,P=roofRamp(roof);
  // chimney (behind roof)
  R_(c,X+67,Y-12,14,22,P.o);R_(c,X+68,Y-11,12,21,'#b0604a');R_(c,X+68,Y-11,3,21,'#c87a5e');R_(c,X+77,Y-11,3,21,'#8a4636');for(let yy=-8;yy<9;yy+=4)R_(c,X+68,Y+yy,12,1,'#7a3a2c');
  R_(c,X+66,Y-15,16,4,P.o);R_(c,X+67,Y-14,14,2,'#7a7088');R_(c,X+67,Y-14,14,1,'#a49cb4');
  // roof: trapezoid front plane, lit left hip, shaded right hip, staggered shingle courses
  const RT=Y-2,RB=Y+42;
  for(let y=RT;y<RB;y++){const k=(y-RT)/(RB-RT-1),ins=Math.round(15*(1-k)),x0=X-3+ins,x1=X+W+3-ins,hip=Math.round(9*(1-k))+3,a=x0+1,b=x1-1,t=y-RT,row=(t+3)%6,crs=Math.floor((t+3)/6);
    R_(c,x0,y,x1-x0,1,P.o);if(t===0)continue;
    R_(c,a,y,b-a,1,row===5?P.r1:row===0?P.r3:P.r2);R_(c,a,y,hip,1,row===5?P.r2:row===0?P.r4:P.r3);R_(c,b-hip,y,hip,1,row===5?P.r0:P.r1);
    R_(c,a+hip,y,1,1,P.r4);R_(c,b-hip-1,y,1,1,P.r0);
    if(row>0&&row<5)for(let x=a+hip+3+(crs%2?4:0);x<b-hip-2;x+=8){R_(c,x,y,1,1,P.r1)}}
  R_(c,X+13,RT+1,W-26,2,P.r4);R_(c,X+13,RT+3,W-26,1,P.r1);
  // attic window
  R_(c,X+42,Y+13,12,11,P.o);R_(c,X+43,Y+14,10,9,'#f4ecd8');R_(c,X+44,Y+15,8,7,'#80bcec');R_(c,X+44,Y+15,8,3,'#b4e0f8');R_(c,X+45,Y+16,2,4,'#eaf8ff');R_(c,X+48,Y+15,1,7,'#f4ecd8');R_(c,X+41,Y+24,14,2,P.r0);
  // eave fascia
  R_(c,X-3,RB,W+6,1,P.r3);R_(c,X-3,RB+1,W+6,2,P.r0);R_(c,X-3,RB+3,W+6,1,P.o);R_(c,X-4,RB-1,1,5,P.o);R_(c,X+W+3,RB-1,1,5,P.o);
  // wall: lap siding, eave shadow, corner posts, stone footing
  const WT=Y+45,WB=Y+80;R_(c,X-1,WT,W+2,WB-WT,WALL_OL);
  for(let y=WT;y<WB-4;y++){const b=(y-WT)%5;R_(c,X,y,W,1,b===4?'#d4c09a':b===0?'#fff6e2':'#f2e4c4')}
  R_(c,X,WT,3,WB-WT-4,'#a8744a');R_(c,X,WT,1,WB-WT-4,'#c8925e');R_(c,X+W-3,WT,3,WB-WT-4,'#8a5a38');R_(c,X+W-1,WT,1,WB-WT-4,'#6a4024');
  c.fillStyle='rgba(58,36,96,.30)';c.fillRect(X,WT,W,3);c.fillStyle='rgba(58,36,96,.14)';c.fillRect(X,WT+3,W,2);
  R_(c,X,WB-4,W,4,'#8e8a9c');R_(c,X,WB-4,W,1,'#bcb8c8');for(let x=6;x<W;x+=9){R_(c,X+x,WB-3,1,3,'#66627a')}R_(c,X,WB-1,W,1,'#5e5a70');
  artWin(c,X+9,Y+53,18,15,P.r1,1);artWin(c,X+69,Y+53,18,15,P.r1,1);
  // door + awning + step (door cells X+32..X+64)
  R_(c,X+35,Y+55,26,21,WALL_OL);R_(c,X+36,Y+56,24,20,'#7a4624');
  for(const dx of[37,49]){R_(c,X+dx,Y+57,10,19,'#9a5e30');R_(c,X+dx,Y+57,10,1,'#b87a44');R_(c,X+dx+1,Y+59,8,6,'#844c26');R_(c,X+dx+1,Y+67,8,7,'#844c26');R_(c,X+dx+1,Y+59,8,1,'#6a3a1c');R_(c,X+dx+1,Y+67,8,1,'#6a3a1c');R_(c,X+dx+2,Y+60,1,4,'#b87a44');R_(c,X+dx+2,Y+68,1,5,'#b87a44')}
  R_(c,X+48,Y+56,1,20,'#4a2814');R_(c,X+45,Y+65,2,2,'#f8d050');R_(c,X+51,Y+65,2,2,'#f8d050');R_(c,X+45,Y+65,1,1,'#fff4b0');R_(c,X+51,Y+65,1,1,'#fff4b0');
  R_(c,X+31,Y+48,34,6,P.o);R_(c,X+32,Y+48,32,4,P.r2);R_(c,X+32,Y+48,32,1,P.r4);R_(c,X+32,Y+51,32,1,P.r1);for(let i=0;i<8;i++)R_(c,X+33+i*4,Y+52,2,1,P.r1);
  c.fillStyle='rgba(58,36,96,.25)';c.fillRect(X+35,Y+54,26,2);
  R_(c,X+33,Y+76,30,4,'#5e5a70');R_(c,X+34,Y+76,28,3,'#aaa6b6');R_(c,X+34,Y+76,28,1,'#d4d0dc');
  // wall lamp
  R_(c,X+28,Y+57,4,6,IRON[0]);R_(c,X+29,Y+58,2,3,'#f8e078');R_(c,X+29,Y+58,1,1,'#ffffff')}
// Lab: 128x96 footprint, modern mansard roof with skylights + rooftop dish.
// ROOF_SPLIT: Y+42
function drawLab(c,X,Y){const W=128,OL='#232838',R=['#2a3248','#3e4c68','#566a8a','#7890b0','#a8bcd6'];
  // rooftop gear (behind the roof line)
  R_(c,X+14,Y-12,14,10,OL);R_(c,X+15,Y-11,12,8,'#9aa6b8');R_(c,X+15,Y-11,12,2,'#c8d2de');for(let i=0;i<4;i++)R_(c,X+16+i*3,Y-8,2,4,'#5a6478');
  R_(c,X+104,Y-8,2,8,OL);R_(c,X+96,Y-22,18,14,OL);R_(c,X+97,Y-21,16,12,'#dfe5ee');R_(c,X+97,Y-21,16,2,'#ffffff');R_(c,X+99,Y-18,8,6,'#b8c2d0');R_(c,X+104,Y-16,2,2,'#e84848');R_(c,X+100,Y-23,10,1,OL);
  // roof plane
  const RT=Y-4,RB=Y+36;
  for(let y=RT;y<RB;y++){const k=(y-RT)/(RB-RT-1),ins=Math.round(9*(1-k)),x0=X-3+ins,x1=X+W+3-ins,t=y-RT;R_(c,x0,y,x1-x0,1,OL);if(!t)continue;
    const base=t<3?R[4]:t<16?R[3]:t<30?R[2]:R[1];R_(c,x0+1,y,x1-x0-2,1,base);
    for(let x=X+2;x<X+W;x+=10){if(x>x0&&x<x1-2){R_(c,x,y,1,1,R[1]);R_(c,x+1,y,1,1,t<16?R[4]:R[3])}}}
  for(const sx of[18,56,94]){R_(c,X+sx,Y+9,18,14,OL);for(let j=0;j<12;j++)R_(c,X+sx+1,Y+10+j,16,1,j<4?'#c8ecfc':j<8?'#8ccaf0':'#68a8e0');for(let j=0;j<12;j++){const rx=X+sx+2+Math.floor((11-j)*.6);R_(c,rx,Y+10+j,2,1,'#f0faff')}R_(c,X+sx,Y+23,18,2,R[0])}
  // fascia with accent stripe
  R_(c,X-3,RB,W+6,7,OL);R_(c,X-2,RB+1,W+4,5,'#eef2f6');R_(c,X-2,RB+1,W+4,1,'#ffffff');R_(c,X-2,RB+3,W+4,2,'#3a7ad0');R_(c,X-2,RB+5,W+4,1,'#c8d0dc');
  // wall
  const WT=Y+43,WB=Y+96;R_(c,X-1,WT,W+2,WB-WT,OL);R_(c,X,WT,W,WB-WT-4,'#e6eaf0');for(let x=0;x<W;x+=16){R_(c,X+x,WT,1,WB-WT-4,'#d0d6e0');R_(c,X+x+1,WT,1,WB-WT-4,'#f4f6fa')}
  c.fillStyle='rgba(40,48,96,.26)';c.fillRect(X,WT,W,3);c.fillStyle='rgba(40,48,96,.12)';c.fillRect(X,WT+3,W,2);
  R_(c,X,WB-4,W,4,'#7c8698');R_(c,X,WB-4,W,1,'#aab4c4');
  for(const wx of[7,27,83,103]){R_(c,X+wx,Y+52,18,24,OL);for(let j=0;j<22;j++)R_(c,X+wx+1,Y+53+j,16,1,j<8?'#b4e0f8':j<16?'#80bcec':'#5e98d8');for(let j=0;j<22;j++){const rx=X+wx+2+Math.floor((21-j)*.5);if(rx<X+wx+14)R_(c,rx,Y+53+j,j%6<4?2:1,1,'#eaf8ff')}R_(c,X+wx+8,Y+53,1,22,'#e6eaf0');R_(c,X+wx-1,Y+76,20,2,'#aab4c4')}
  // entrance canopy + sign + sliding glass doors (door cells X+48..X+80)
  R_(c,X+42,Y+46,44,8,OL);R_(c,X+43,Y+47,42,5,'#3a7ad0');R_(c,X+43,Y+47,42,1,'#78a8f0');for(let i=0;i<6;i++)R_(c,X+50+i*5,Y+49,3,2,'#f8f8f8');c.fillStyle='rgba(40,48,96,.3)';c.fillRect(X+44,Y+54,40,3);
  R_(c,X+47,Y+57,34,35,OL);for(let j=0;j<33;j++){const col=j<10?'#b8e2f6':j<24?'#8ccaf0':'#70b0e4';R_(c,X+49,Y+58+j,14,1,col);R_(c,X+65,Y+58+j,14,1,col)}
  for(let j=0;j<16;j++){R_(c,X+51+Math.floor((15-j)*.4),Y+60+j,2,1,'#f0faff');R_(c,X+67+Math.floor((15-j)*.4),Y+60+j,2,1,'#f0faff')}R_(c,X+63,Y+58,2,33,'#7c8698');R_(c,X+49,Y+74,30,1,'#aab4c4');
  R_(c,X+44,WB-4,40,4,'#5e6678');R_(c,X+45,WB-4,38,3,'#c8ccd6');R_(c,X+45,WB-4,38,1,'#eef0f4')}
function drawFence(c,x,y){const O=WOOD.k;R_(c,x,y+5,16,4,O);R_(c,x,y+6,16,2,WOOD.l);R_(c,x,y+6,16,1,WOOD.h);R_(c,x,y+10,16,4,O);R_(c,x,y+11,16,2,WOOD.m);R_(c,x,y+11,16,1,WOOD.l);
  R_(c,x+2,y+1,6,14,O);R_(c,x+3,y+2,4,12,WOOD.m);R_(c,x+3,y+2,1,12,WOOD.l);R_(c,x+6,y+2,1,12,WOOD.d);R_(c,x+3,y+1,4,1,O);R_(c,x+4,y+2,2,1,WOOD.h);R_(c,x+3,y+13,4,1,WOOD.d)}
function drawSign(c,x,y){const O=WOOD.k;R_(c,x+6,y+9,4,7,O);R_(c,x+7,y+9,2,6,WOOD.d);R_(c,x+7,y+9,1,6,WOOD.m);
  R_(c,x+1,y+1,14,10,O);R_(c,x+2,y+2,12,8,WOOD.l);R_(c,x+2,y+2,12,1,WOOD.h);R_(c,x+2,y+9,12,1,WOOD.m);R_(c,x+13,y+2,1,8,WOOD.m);R_(c,x+4,y+4,8,1,WOOD.d);R_(c,x+4,y+6,6,1,WOOD.d);R_(c,x+3,y+3,1,1,'#f8e4b0')}
function drawWall(c,x,y,lab){if(lab){R_(c,x,y,16,32,'#dfe7ef');R_(c,x,y,16,3,'#f4f8fb');R_(c,x,y+3,16,1,'#b8c4d2');for(let i=0;i<16;i+=8)R_(c,x+i,y+4,1,18,'#ccd6e2');R_(c,x,y+12,16,2,'#3a7ad0');R_(c,x,y+14,16,1,'#2a5cb8');
    R_(c,x,y+22,16,8,'#9aa6b8');R_(c,x,y+22,16,1,'#c4ceda');R_(c,x,y+29,16,1,'#7c8698');R_(c,x,y+30,16,2,'#3a4252');return}
  R_(c,x,y,16,32,'#efe0bc');R_(c,x,y,16,2,'#a87850');R_(c,x,y+2,16,1,'#c89a6a');R_(c,x,y+3,16,1,'#d8c49c');
  for(let i=0;i<16;i+=8){R_(c,x+i+3,y+6,2,2,'#e2cc9c');R_(c,x+i+7,y+12,2,2,'#e2cc9c');R_(c,x+i+3,y+18,2,1,'#e2cc9c')}
  R_(c,x,y+21,16,2,'#b8885a');R_(c,x,y+21,16,1,'#d8a874');R_(c,x,y+23,16,6,'#a8784e');for(let i=0;i<16;i+=8){R_(c,x+i,y+23,1,6,'#8a5e3a');R_(c,x+i+1,y+24,5,4,'#b4845a')}R_(c,x,y+29,16,1,'#6a4428');R_(c,x,y+30,16,2,'#4a3428')}
// interior floors: oak planks (grain, staggered seams, sheen) / lab tiles (grout, glossy diagonal). Row 2 sits under the wall: ambient shadow.
function drawFloor(c,x,y,lab,X,Y){if(lab){R_(c,x,y,16,16,(X+Y)%2?'#e2e9f0':'#ecf1f6');R_(c,x,y+15,16,1,'#c4cedb');R_(c,x+15,y,1,16,'#c4cedb');R_(c,x,y,15,1,'#f8fbfd');R_(c,x,y,1,15,'#f8fbfd');
    if(hsh(X,Y,202)<.35)for(let k=0;k<3;k++)R_(c,x+3+k,y+6-k,2,1,'#ffffff');if(Y===2){c.fillStyle='rgba(40,56,96,.16)';c.fillRect(x,y,16,4);c.fillRect(x,y,16,2)}return}
  for(let p=0;p<4;p++){const py=y+p*4,q=Y*4+p,tone=['#d8a868','#d09e5e','#dcae70','#cc9a5a'][Math.floor(hsh(X+(q*3>>3),q,201)*4)];R_(c,x,py,16,4,tone);R_(c,x,py,16,1,hmix(tone,'#fff4d8',.3));R_(c,x,py+3,16,1,'#9c6c3c');
    const sx=(q*7+((X*16)>>0))%32;if(sx<16)R_(c,x+sx,py,1,3,'#a87444');R_(c,x+((q*5+X*3)%14)+1,py+2,3,1,hmix(tone,'#8a5a30',.4))}
  if(Y===2){c.fillStyle='rgba(60,30,20,.2)';c.fillRect(x,y,16,4);c.fillRect(x,y,16,2)}}
function drawShelf(c,x,y){const O='#3a2414';R_(c,x,y,32,40,O);R_(c,x+1,y+1,30,38,'#8a5a30');R_(c,x+1,y+1,30,2,'#b07a44');R_(c,x+1,y+1,1,38,'#a06c3a');R_(c,x+30,y+1,1,38,'#6a4024');
  const cols=['#c83838','#3878c8','#38a058','#e8b838','#8858b8','#e87838','#d8d0c0'];
  for(const sy of[4,15,26]){R_(c,x+3,y+sy,26,9,'#2e1c10');let bx=x+3,i=0;while(bx<x+28){const bw=2+((i*7+sy)%3),bh=6+((i*5+sy)%3),col=cols[(i*3+sy)%7];if(bx+bw>x+29)break;if((i+sy)%9===4){R_(c,bx,y+sy+9-4,bw+2,4,col);R_(c,bx,y+sy+5,bw+2,1,hmix(col,'#ffffff',.35));bx+=bw+3}else{R_(c,bx,y+sy+9-bh,bw,bh,col);R_(c,bx,y+sy+9-bh,1,bh,hmix(col,'#ffffff',.3));R_(c,bx,y+sy+9-bh+2,bw,1,hmix(col,'#000000',.25));bx+=bw+(i%4===3?1:0)}i++}
    R_(c,x+2,y+sy+9,28,2,'#b07a44');R_(c,x+2,y+sy+10,28,1,'#6a4024')}
  R_(c,x+1,y+37,30,2,'#5a3820')}
function drawTable(c,x,y,w,h){const O='#3a2414';R_(c,x+3,y+h-10,3,10,O);R_(c,x+w-6,y+h-10,3,10,O);R_(c,x+4,y+h-10,1,9,'#8a5a30');R_(c,x+w-5,y+h-10,1,9,'#8a5a30');
  R_(c,x+1,y+3,w-2,h-11,O);R_(c,x+2,y+4,w-4,h-15,'#c88850');R_(c,x+2,y+4,w-4,1,'#e8b070');R_(c,x+2,y+4,1,h-15,'#dca064');for(let i=y+8;i<y+h-11;i+=5)R_(c,x+3,i,w-6,1,'#b87a44');R_(c,x+2,y+h-11,w-4,3,'#9a6234');R_(c,x+2,y+h-9,w-4,1,'#6a4024');
  R_(c,x+w/2-4,y+8,8,6,'#f4f0e8');R_(c,x+w/2-3,y+9,6,4,'#e84848');R_(c,x+w/2-2,y+9,2,1,'#ff9a9a')}
function drawLabTable(c,x,y,w){R_(c,x+3,y+11,2,4,'#3a4252');R_(c,x+w-5,y+11,2,4,'#3a4252');R_(c,x,y+2,w,11,'#3a4252');R_(c,x+1,y+3,w-2,6,'#f6f8fa');R_(c,x+1,y+3,w-2,1,'#ffffff');R_(c,x+1,y+9,w-2,3,'#a8b4c2');R_(c,x+1,y+11,w-2,1,'#7c8698');
  R_(c,x+6,y-2,4,6,'#3a4252');R_(c,x+7,y-1,2,4,'#78e0b0');R_(c,x+7,y-1,1,1,'#ffffff');R_(c,x+w-16,y,10,4,'#3a4252');R_(c,x+w-15,y+1,8,2,'#e8eef4');R_(c,x+w/2-2,y-1,4,5,'#3a4252');R_(c,x+w/2-1,y,2,3,'#f8a8c8')}
function drawTV(c,x,y){R_(c,x+1,y+16,14,14,'#3a2414');R_(c,x+2,y+17,12,12,'#a87040');R_(c,x+2,y+17,12,1,'#c88a50');R_(c,x+2,y+22,12,1,'#6a4024');R_(c,x+7,y+24,2,1,'#e8c060');
  R_(c,x,y+2,16,15,'#262433');R_(c,x+1,y+3,14,13,'#3c3a50');R_(c,x+2,y+4,12,10,'#68b0e0');R_(c,x+2,y+4,12,4,'#98d0f0');R_(c,x+3,y+5,3,2,'#e0f4ff');R_(c,x+2,y+11,12,3,'#58a048');R_(c,x+1,y+15,14,1,'#545472');R_(c,x+7,y,1,3,'#262433');R_(c,x+10,y-1,1,4,'#262433')}
function drawBed(c,x,y){R_(c,x,y,16,32,'#3a2414');R_(c,x+1,y+1,14,4,'#9a6234');R_(c,x+1,y+1,14,1,'#c48a4c');R_(c,x+1,y+5,14,26,'#f4f2ee');R_(c,x+2,y+6,12,7,'#ffffff');R_(c,x+2,y+12,12,1,'#d0d0dc');
  R_(c,x+1,y+14,14,17,'#4878c8');R_(c,x+1,y+14,14,2,'#78a8e8');R_(c,x+1,y+16,14,1,'#f4f2ee');for(let i=19;i<30;i+=4)R_(c,x+2,y+i,12,1,'#3c68b0');R_(c,x+14,y+14,1,17,'#2e5698');R_(c,x+1,y+30,14,1,'#2e5698')}
function drawPlant(c,x,y){R_(c,x+3,y+10,10,6,'#5a2a18');R_(c,x+4,y+10,8,5,'#b85a36');R_(c,x+4,y+10,8,1,'#d8784a');R_(c,x+4,y+13,8,1,'#8a3e24');R_(c,x+3,y+9,10,2,'#5a2a18');R_(c,x+4,y+9,8,1,'#7a4a30');
  for(const[a,b,k]of[[2,4,0],[9,1,1],[11,5,0],[5,0,1],[7,4,0],[3,7,1],[10,7,0]]){R_(c,x+a,y+b,4,4,'#1f4a2c');R_(c,x+a,y+b,3,3,k?'#4f9a3e':'#2f7a38');R_(c,x+a,y+b,1,1,'#93d05a')}}
function drawCounter(c,x,y,w){R_(c,x,y,w,24,'#3a2c28');R_(c,x+1,y+1,w-2,7,'#ece6da');R_(c,x+1,y+1,w-2,1,'#ffffff');R_(c,x+1,y+7,w-2,1,'#b8b0a2');R_(c,x+1,y+8,w-2,15,'#c89060');R_(c,x+1,y+8,w-2,1,'#8a5a30');
  for(let i=0;i<w;i+=16){R_(c,x+i+2,y+10,12,11,'#b47a4a');R_(c,x+i+2,y+10,12,1,'#d8a470');R_(c,x+i+7,y+14,2,2,'#e8c060')}R_(c,x+1,y+22,w-2,1,'#6a4024');
  R_(c,x+5,y+2,10,5,'#9aa6b8');R_(c,x+6,y+3,8,3,'#c8d4e0');R_(c,x+w-14,y-3,8,9,'#3a2c28');R_(c,x+w-13,y-2,6,7,'#e84848');R_(c,x+w-13,y-2,6,1,'#ff9a9a')}
function drawMachine(c,x,y){R_(c,x,y,32,30,'#262c3a');R_(c,x+1,y+1,30,28,'#9aa8b8');R_(c,x+1,y+1,30,2,'#c8d2de');R_(c,x+1,y+1,1,28,'#b8c4d2');R_(c,x+30,y+1,1,28,'#6a7688');R_(c,x+1,y+26,30,3,'#6a7688');
  R_(c,x+4,y+4,24,12,'#1e2430');R_(c,x+5,y+5,22,10,'#2a8a68');R_(c,x+5,y+5,22,3,'#48c890');for(let i=0;i<3;i++)R_(c,x+7,y+8+i*2,6+((i*5)%12),1,'#b8f8d8');R_(c,x+20,y+7,5,6,'#1e6a50');R_(c,x+21,y+8,3,2,'#78e0b0');
  R_(c,x+4,y+19,4,4,'#a82838');R_(c,x+4,y+19,3,3,'#e84848');R_(c,x+10,y+19,4,4,'#a87818');R_(c,x+10,y+19,3,3,'#f8d848');R_(c,x+16,y+20,10,2,'#4a5668');R_(c,x+16,y+20,10,1,'#3a4252')}
function drawMat(c,x,y,w){R_(c,x+1,y+4,w-2,10,'#6a2028');R_(c,x+2,y+5,w-4,8,'#b83a40');R_(c,x+3,y+6,w-6,6,'#c85858');R_(c,x+3,y+6,w-6,1,'#e88888');for(let i=x+5;i<x+w-5;i+=4)R_(c,i,y+9,2,1,'#e8b048')}
function drawRug(c,x,y,w,h){R_(c,x,y,w,h,'#24406a');R_(c,x+1,y+1,w-2,h-2,'#3a6aa8');R_(c,x+3,y+3,w-6,h-6,'#f0d878');R_(c,x+4,y+4,w-8,h-8,'#5888c8');R_(c,x+4,y+4,w-8,1,'#78a8e0');for(let i=x+6;i<x+w-6;i+=4)R_(c,i,y+h/2-1|0,2,2,'#f0d878');for(let i=x+2;i<x+w-2;i+=3){R_(c,i,y-1,1,1,'#f0d878');R_(c,i,y+h,1,1,'#f0d878')}}
function capsuleCv(){const g=SG(10,10);part(g,E(5,5,4.3,4.3),RP('#203040','#2a8a88','#38b0a8','#60d0c8','#b0f0e8'),{sh:{cx:5,cy:5,rx:4,ry:4}});for(let x=1;x<9;x++){px(g,x,5,'#c89a22');px(g,x,6,'#f4f4f4');px(g,x,7,'#e0e0e8')}px(g,1,6,'#203040');px(g,8,6,'#203040');px(g,5,5,'#ffffff');px(g,3,2,'#ffffff');return toCv(g)}

/* ===== habitats, town props ===== */
function drawHabitat(c,x,y,kind,front){// 32x32 at tile (x,y) covering 2x2; front=true draws the glass front + rim
  if(!front){R_(c,x,y+31,32,1,'#262c3a');R_(c,x,y+10,32,22,'#262c3a');R_(c,x+1,y+11,30,20,'#6a7688');
    if(kind==='pond'){R_(c,x+2,y+13,28,18,'#3f86e0');R_(c,x+2,y+13,28,2,'#2a5cb8');R_(c,x+4,y+18,6,1,'#7cc0f4');R_(c,x+18,y+24,8,1,'#7cc0f4');R_(c,x+9,y+27,4,1,'#d8f4ff');R_(c,x+20,y+15,7,3,'#2f6e34');R_(c,x+21,y+15,4,1,'#7cc457');R_(c,x+3,y+26,4,4,'#82839a');R_(c,x+3,y+26,3,1,'#b2b4c6')}
    else if(kind==='hearth'){R_(c,x+2,y+13,28,18,'#4a2a22');for(let i=0;i<7;i++)R_(c,x+2+i*4,y+14+(i%2)*4,3,2,'#6a3a2c');R_(c,x+6,y+23,20,7,'#2a1a18');for(let i=0;i<6;i++){R_(c,x+7+i*3,y+25+(i%2),2,2,i%2?'#f8a030':'#d83a10');R_(c,x+7+i*3,y+25+(i%2),1,1,'#fff0a0')}R_(c,x+5,y+22,22,1,'#82839a')}
    else{R_(c,x+2,y+13,28,18,'#5a3a22');R_(c,x+2,y+13,28,3,'#8a5e36');for(let i=0;i<7;i++)R_(c,x+4+i*4,y+20+(i%2)*3,2,1,'#3e2616');for(const[a,b]of[[4,16],[10,18],[22,16],[26,19]]){R_(c,x+a,y+b-4,2,5,'#2f6e34');R_(c,x+a-1,y+b-6,4,3,'#4f9a3e');R_(c,x+a-1,y+b-6,2,1,'#93d05a')}}}
  else{c.globalAlpha=.24;R_(c,x+2,y+13,28,18,'#d8f4ff');c.globalAlpha=1;R_(c,x,y+10,32,3,'#262c3a');R_(c,x+1,y+11,30,1,'#e0e8f0');R_(c,x+1,y+12,30,1,'#9aa8b8');R_(c,x,y+10,1,22,'#262c3a');R_(c,x+31,y+10,1,22,'#262c3a');R_(c,x+1,y+12,1,19,'#c8d2de');R_(c,x+30,y+12,1,19,'#7c8698');R_(c,x,y+31,32,1,'#262c3a');
    for(let k=0;k<9;k++){R_(c,x+4+Math.floor(k*.5),y+14+k,2,1,'#ffffff')}R_(c,x+9,y+14,1,4,'#ffffff');
    R_(c,x+10,y+26,12,5,'#262c3a');R_(c,x+11,y+27,10,3,'#e6eaf0');R_(c,x+12,y+28,8,1,kind==='pond'?'#3f86e0':kind==='hearth'?'#e8603a':'#4f9a3e')}}
function drawMailbox(c,x,y,col){const P=roofRamp(col);R_(c,x+6,y+8,4,8,WOOD.k);R_(c,x+7,y+8,2,7,WOOD.m);R_(c,x+7,y+8,1,7,WOOD.l);
  R_(c,x+2,y+1,12,8,P.o);R_(c,x+3,y+2,10,6,P.r2);R_(c,x+3,y+2,10,1,P.r4);R_(c,x+3,y+7,10,1,P.r0);R_(c,x+3,y+2,1,6,P.r3);R_(c,x+4,y+4,3,2,P.o);R_(c,x+12,y-1,2,5,IRON[0]);R_(c,x+12,y-1,3,2,'#e83838');R_(c,x+12,y-1,3,1,'#ff8a7a')}
function drawLamp(c,x,y){const I=IRON;R_(c,x+5,y+12,6,4,I[0]);R_(c,x+6,y+12,4,3,I[2]);R_(c,x+6,y+12,4,1,I[3]);R_(c,x+7,y-4,2,16,I[0]);R_(c,x+7,y-4,1,16,I[2]);
  R_(c,x+4,y-13,8,9,I[0]);R_(c,x+5,y-12,6,7,'#f8d860');R_(c,x+5,y-12,6,2,'#fff4b8');R_(c,x+6,y-11,2,4,'#ffffff');R_(c,x+7,y-12,1,7,I[1]);R_(c,x+3,y-15,10,3,I[0]);R_(c,x+4,y-15,8,1,I[2]);R_(c,x+7,y-17,2,2,I[0]);R_(c,x+4,y-5,8,1,I[1])}
function drawBench(c,x,y){const O=WOOD.k;R_(c,x+3,y+11,3,5,IRON[0]);R_(c,x+26,y+11,3,5,IRON[0]);R_(c,x+1,y+2,30,5,O);R_(c,x+2,y+3,28,1,WOOD.l);R_(c,x+2,y+5,28,1,WOOD.m);
  R_(c,x+1,y+8,30,5,O);R_(c,x+2,y+9,28,2,WOOD.l);R_(c,x+2,y+9,28,1,WOOD.h);R_(c,x+2,y+11,28,1,WOOD.d);R_(c,x+3,y+7,2,2,IRON[1]);R_(c,x+27,y+7,2,2,IRON[1])}
const BUSHP=RP('#173a2a','#22583a','#2f7a38','#53a33c','#93d05a');
let BUSH_CV=null;function drawBush(c,x,y){if(!BUSH_CV){const g=SG(16,16);const m=part(g,U(E(8,9,7.2,5.6),E(5,7,4,4),E(11,7,4,3.6)),BUSHP,{sh:{cx:6,cy:6,rx:8,ry:7}});for(const[a,b]of[[4,5],[9,4],[11,8],[6,9]])if(interior(m,g,a,b)){px(g,a,b,BUSHP.r[3]);px(g,a+1,b+1,BUSHP.r[1])}px(g,4,4,'#c8ec88');px(g,10,3,BUSHP.r[3]);for(let i=2;i<14;i++)if(interior(m,g,i,13))px(g,i,13,BUSHP.r[0]);BUSH_CV=toCv(g)}c.drawImage(BUSH_CV,x,y)}
function drawLily(c,x,y){R_(c,x,y,6,3,'#1f6a3a');R_(c,x+1,y,4,1,'#5fb050');R_(c,x,y+1,3,1,'#3f8a40');R_(c,x+3,y+1,1,1,'#2a5cb8');R_(c,x+4,y+2,2,1,'#174a30');if((x+y)%3===0){R_(c,x+1,y-1,2,1,'#f8b4d0');R_(c,x+2,y-1,1,1,'#ffffff')}}
function drawReed(c,x,y){for(const[a,h]of[[0,7],[2,9],[4,6],[6,8]]){R_(c,x+a,y-h+2,1,h,a%4?'#3f8a38':'#2f6e34');R_(c,x+a,y-h,1,2,'#7a4a26');R_(c,x+a,y-h,1,1,'#a86c38')}R_(c,x+1,y-3,1,1,'#7cc457');R_(c,x+5,y-2,1,1,'#7cc457')}
// building contact shadow (flat): base strip + right-side falloff, stepped corner, two tones
function drawShadow(c,x,y,w,h){const t=y+Math.round(h*.55);c.fillStyle='rgba(16,34,44,.22)';c.fillRect(x+2,y+h,w-2,3);c.fillRect(x+w,t,3,y+h-t);c.fillStyle='rgba(16,34,44,.12)';c.fillRect(x+4,y+h+3,w-2,2);c.fillRect(x+w+3,t+3,2,y+h-t-3);c.fillRect(x+w,y+h,2,2)}

/* ===== ROUTE / CITY ART ===== */
function drawBurrow(c,x,y){R_(c,x+1,y+6,14,9,'#8a5e36');R_(c,x+2,y+5,12,2,'#b48650');R_(c,x+1,y+6,1,7,'#a07444');R_(c,x+3,y+8,10,6,'#3e2616');R_(c,x+4,y+8,8,1,'#5a3a22');R_(c,x+5,y+9,6,4,'#1c1008');R_(c,x+3,y+14,10,1,'#6a4428');R_(c,x+2,y+13,2,1,'#e6c98c');R_(c,x+12,y+12,2,1,'#e6c98c');R_(c,x+13,y+4,2,1,'#c49a5c')}
function drawAnthill(c,x,y){const O='#5a3a22';for(let r=0;r<13;r++){const w=Math.round(26-(r*r)/8.5),yy=y+29-r*2,xx=x+16-(w>>1);R_(c,xx-1,yy,w+2,2,O);R_(c,xx,yy,w,2,r%3===2?'#a87444':'#c49a5c');R_(c,xx,yy,Math.max(1,w>>2),2,r%3===2?'#c49a5c':'#e0b878');R_(c,xx+w-Math.max(1,w>>3),yy,Math.max(1,w>>3),2,'#8a5e36')}
  R_(c,x+12,y+4,8,5,O);R_(c,x+13,y+5,6,3,'#2a1a0c');R_(c,x+13,y+4,6,1,'#e0b878');for(let k=0;k<7;k++)R_(c,x+7+((k*7)%18),y+14+((k*5)%12),1,1,'#5a1810');R_(c,x+10,y+12,2,1,'#f0d098');R_(c,x+18,y+19,3,1,'#f0d098');R_(c,x+4,y+29,24,1,'#8a5e36')}
function drawWindmill(c,x,y){const O='#3a3444';
  for(let r=0;r<46;r++){const w=Math.round(40-r*.36),xx=x+32-(w>>1),yy=y+77-r;R_(c,xx-1,yy,w+2,1,O);R_(c,xx,yy,w,1,r%7===6?'#7a7468':'#a49c8c');R_(c,xx,yy,3,1,'#c4bcaa');R_(c,xx+w-4,yy,4,1,'#7a7468')}
  for(let r=2;r<44;r+=7)for(let k=0;k<5;k++)R_(c,x+14+k*9+(r%14?4:0),y+77-r-5,1,5,'#6a6458');
  R_(c,x+26,y+60,12,18,O);R_(c,x+27,y+61,10,17,'#6a4024');R_(c,x+27,y+61,10,1,'#9a6234');R_(c,x+32,y+61,1,17,'#3e2414');R_(c,x+35,y+69,1,2,'#f8d050');
  R_(c,x+24,y+44,16,10,O);R_(c,x+25,y+45,14,8,'#80bcec');R_(c,x+25,y+45,14,3,'#b4e0f8');R_(c,x+32,y+45,1,8,O);R_(c,x+23,y+54,18,2,'#7a7468');
  for(let r=0;r<14;r++){const w=Math.round(10+r*2.3),xx=x+32-(w>>1),yy=y+18+r;R_(c,xx-1,yy,w+2,1,O);R_(c,xx,yy,w,1,r%4===3?'#6a2a20':'#a84838');R_(c,xx,yy,Math.max(1,w>>2),1,'#c8604a')}R_(c,x+14,y+31,36,2,O);
  const hx=x+32,hy=y+26;for(const a of[-.7,.85,2.45,3.95]){const ca=Math.cos(a),sa=Math.sin(a);for(let i=3;i<30;i++){const px_=Math.round(hx+ca*i),py_=Math.round(hy+sa*i);R_(c,px_,py_,2,2,'#4a2a14');if(i>8&&i<29)for(let k=1;k<5;k++){const qx=Math.round(hx+ca*i-sa*k),qy=Math.round(hy+sa*i+ca*k);R_(c,qx,qy,1,1,k===4||i===9||i===28?'#6a4024':(i+k)%3?'#e8dcc0':'#c8b898')}}}
  R_(c,hx-3,hy-3,7,7,O);R_(c,hx-2,hy-2,5,5,'#8a5e36');R_(c,hx-1,hy-1,2,2,'#c48a4c')}
function drawLog(c,x,y){const O=WOOD.k;R_(c,x+1,y+5,30,10,O);R_(c,x+2,y+6,24,8,'#7a4c2a');R_(c,x+2,y+6,24,2,'#9c6a38');R_(c,x+2,y+12,24,1,'#5a3420');for(let i=6;i<24;i+=6)R_(c,x+i,y+8,3,1,'#5a3420');
  R_(c,x+26,y+5,5,10,O);R_(c,x+26,y+6,4,8,'#d8b078');R_(c,x+27,y+8,2,4,'#b88a54');R_(c,x+27,y+9,1,2,'#8a5e36');R_(c,x+7,y+4,3,2,'#2f6e34');R_(c,x+8,y+3,2,1,'#7cc457');R_(c,x+15,y+5,4,1,'#4f9a3e')}
function drawStump(c,x,y){const O=WOOD.k;R_(c,x+1,y+12,14,3,O);R_(c,x+2,y+5,12,10,O);R_(c,x+3,y+8,10,6,'#7a4c2a');R_(c,x+3,y+8,2,6,'#9c6a38');R_(c,x+11,y+8,2,6,'#5a3420');R_(c,x+2,y+13,3,2,'#7a4c2a');R_(c,x+11,y+13,3,2,'#5a3420');
  R_(c,x+3,y+4,10,5,O);R_(c,x+4,y+5,8,3,'#d8b078');R_(c,x+5,y+6,6,1,'#b88a54');R_(c,x+7,y+6,2,1,'#8a5e36');R_(c,x+4,y+5,8,1,'#f0d098')}
function drawTent(c,x,y){const O='#1a2e48';for(let r=0;r<26;r++){const w=Math.round(4+r*1.1),xx=x+16-(w>>1),yy=y+4+r;R_(c,xx-1,yy,w+2,1,O);R_(c,xx,yy,w>>1,1,r%5===4?'#3a8ab0':'#58a8d0');R_(c,xx+(w>>1),yy,w-(w>>1),1,r%5===4?'#245e88':'#3a80b0')}
  R_(c,x+15,y+1,2,4,WOOD.k);R_(c,x+12,y+16,8,14,O);R_(c,x+13,y+17,3,13,'#0e1c2c');R_(c,x+16,y+17,3,13,'#24506e');R_(c,x+16,y+17,1,13,'#58a8d0');R_(c,x+3,y+29,26,1,O);R_(c,x+2,y+27,2,3,WOOD.d);R_(c,x+28,y+27,2,3,WOOD.d)}
function drawCampfire(c,x,y){for(let k=0;k<9;k++){const a=k/9*6.283,sx=Math.round(x+8+Math.cos(a)*6)-1,sy=Math.round(y+11+Math.sin(a)*3)-1;R_(c,sx,sy,3,3,STN.d);R_(c,sx,sy,3,2,STN.m);R_(c,sx,sy,2,1,STN.l)}
  R_(c,x+3,y+9,10,3,WOOD.k);R_(c,x+4,y+9,8,1,WOOD.m);R_(c,x+5,y+11,6,2,'#2a1408');R_(c,x+5,y+5,6,6,'#c02c10');R_(c,x+6,y+3,4,7,'#f07a20');R_(c,x+7,y+2,2,3,'#f8b030');R_(c,x+7,y+7,2,3,'#fff6c0');R_(c,x+4,y+7,1,2,'#f07a20');R_(c,x+11,y+6,1,2,'#c02c10')}
function drawArch(c,x,y){const O=STN.k;for(const px_ of[0,54]){R_(c,x+px_,y+8,10,40,O);R_(c,x+px_+1,y+9,8,38,STN.m);R_(c,x+px_+1,y+9,2,38,STN.l);R_(c,x+px_+7,y+9,1,38,STN.d);for(let yy=14;yy<46;yy+=7)R_(c,x+px_+1,y+yy,8,1,STN.d);R_(c,x+px_-1,y+44,12,4,O);R_(c,x+px_,y+44,10,3,STN.l)}
  R_(c,x-3,y,70,11,O);R_(c,x-2,y+1,68,8,STN.l);R_(c,x-2,y+1,68,1,STN.h);R_(c,x-2,y+8,68,1,STN.d);R_(c,x+12,y+2,40,5,O);R_(c,x+13,y+3,38,3,'#2a5cb8');for(let i=0;i<6;i++)R_(c,x+17+i*5,y+4,3,1,'#f0f0f0');R_(c,x+29,y-4,6,5,O);R_(c,x+30,y-3,4,3,'#f8c838')}
// Guild hall: 192 wide, art Y-30..Y+112. ROOF_SPLIT: Y+46
function drawGuild(c,X,Y){const W_=192,OL='#241e34',R=['#2a2048','#3e3068','#5a4890','#7a68b0','#a898d4'],G='#f8c838',GD='#a87818';
  // bell tower behind roof
  R_(c,X+80,Y-22,32,30,OL);R_(c,X+81,Y-21,30,28,'#e8e0d0');R_(c,X+81,Y-21,3,28,'#fffaf0');R_(c,X+107,Y-21,4,28,'#c4b8a4');R_(c,X+90,Y-16,12,16,OL);R_(c,X+91,Y-15,10,15,'#2a2040');R_(c,X+92,Y-15,8,2,'#4a3a68');R_(c,X+94,Y-10,4,5,GD);R_(c,X+95,Y-10,2,2,G);
  for(let r=0;r<13;r++){const w=4+r*3,xx=X+96-(w>>1);R_(c,xx-1,Y-35+r,w+2,1,OL);R_(c,xx,Y-35+r,w>>1,1,r%4===3?R[2]:R[3]);R_(c,xx+(w>>1),Y-35+r,w-(w>>1),1,r%4===3?R[1]:R[2])}R_(c,X+77,Y-23,38,2,G);R_(c,X+95,Y-42,2,7,G);R_(c,X+94,Y-44,4,3,G);R_(c,X+95,Y-44,1,1,'#fff4b0');
  // roof
  for(let y=0;y<44;y++){const inset=Math.max(0,22-y),x0=X-5+inset,x1=X+W_+5-inset,t=y%7;R_(c,x0,Y+y,x1-x0,1,OL);if(!y)continue;R_(c,x0+1,Y+y,x1-x0-2,1,t===6?R[1]:t===0?R[4]:y<22?R[3]:R[2]);if(y<22){R_(c,x0+1,Y+y,2,1,R[4]);R_(c,x1-3,Y+y,2,1,R[0])}
    if(t>0&&t<6)for(let x=x0+4+(Math.floor(y/7)%2?5:0);x<x1-3;x+=10)R_(c,x,Y+y,1,1,R[1])}
  R_(c,X+18,Y+1,W_-36,2,R[4]);R_(c,X-5,Y+40,W_+10,2,G);R_(c,X-5,Y+42,W_+10,2,GD);R_(c,X-5,Y+44,W_+10,2,OL);
  // pediment over the door
  for(let r=0;r<12;r++){const w=60-r*5,xx=X+96-(w>>1);R_(c,xx-1,Y+30-r,w+2,1,OL);R_(c,xx,Y+30-r,w,1,r===0?GD:'#efe6d4')}R_(c,X+92,Y+22,8,6,G);R_(c,X+93,Y+23,6,4,'#fff0a0');R_(c,X+94,Y+24,4,2,GD);
  // wall
  const WT=Y+46,WB=Y+112;R_(c,X-1,WT,W_+2,WB-WT,OL);R_(c,X,WT,W_,WB-WT-6,'#ece2cc');for(let y=WT+6;y<WB-6;y+=8)for(let x=0;x<W_;x+=16)R_(c,X+x+((y>>3)%2)*8,y,1,7,'#d8ccb2');for(let y=WT+5;y<WB-6;y+=8)R_(c,X,y,W_,1,'#d8ccb2');
  c.fillStyle='rgba(40,24,80,.28)';c.fillRect(X,WT,W_,4);c.fillStyle='rgba(40,24,80,.12)';c.fillRect(X,WT+4,W_,3);
  R_(c,X,WB-6,W_,6,'#8e8a9c');R_(c,X,WB-6,W_,1,'#c4c0cc');R_(c,X,WB-1,W_,1,'#5e5a70');
  for(const cx of[16,48,134,166]){R_(c,X+cx-1,WT+3,14,4,OL);R_(c,X+cx,WT+4,12,2,'#fffaf0');R_(c,X+cx,WT+7,12,WB-WT-15,OL);R_(c,X+cx+1,WT+7,10,WB-WT-15,'#f4eee2');R_(c,X+cx+1,WT+7,3,WB-WT-15,'#ffffff');R_(c,X+cx+8,WT+7,3,WB-WT-15,'#cfc4b0');R_(c,X+cx+5,WT+7,1,WB-WT-15,'#e2d8c4');R_(c,X+cx-1,WB-9,14,3,OL);R_(c,X+cx,WB-9,12,2,'#e2d8c4')}
  for(const wx of[29,149]){R_(c,X+wx,WT+12,16,30,OL);R_(c,X+wx+1,WT+11,14,1,OL);R_(c,X+wx+2,WT+10,12,1,OL);for(let j=0;j<29;j++)R_(c,X+wx+1,WT+12+j,14,1,j<10?'#b4d8f4':j<20?'#80b0e4':'#6090d0');R_(c,X+wx+8,WT+12,1,29,OL);R_(c,X+wx+1,WT+24,14,1,OL);for(let j=0;j<10;j++)R_(c,X+wx+2+Math.floor((9-j)*.5),WT+13+j,1,1,'#eaf8ff');R_(c,X+wx-1,WT+42,18,2,'#c4b8a4')}
  for(const bx of[66,114]){R_(c,X+bx-1,WT-1,14,2,GD);R_(c,X+bx,WT+1,12,32,'#8a2838');R_(c,X+bx,WT+1,3,32,'#a83848');R_(c,X+bx+10,WT+1,2,32,'#6a1828');R_(c,X+bx,WT+3,12,2,G);R_(c,X+bx+3,WT+12,6,6,G);R_(c,X+bx+4,WT+13,4,4,'#8a2838');R_(c,X+bx+5,WT+14,2,2,G);R_(c,X+bx,WT+33,6,4,'#8a2838');R_(c,X+bx+6,WT+31,6,4,'#8a2838');R_(c,X+bx,WT+29,12,1,G)}
  // arched door (door cells X+80..X+112) + steps
  R_(c,X+80,WT+20,32,WB-WT-26,OL);R_(c,X+82,WT+18,28,2,OL);R_(c,X+85,WT+16,22,2,OL);R_(c,X+82,WT+20,28,WB-WT-26,'#5a3018');R_(c,X+85,WT+18,22,2,'#5a3018');
  for(const dx of[83,97]){R_(c,X+dx,WT+22,12,WB-WT-30,'#7a4424');R_(c,X+dx,WT+22,12,1,'#9a5e30');for(let yy=WT+27;yy<WB-10;yy+=8)for(let k=0;k<3;k++)R_(c,X+dx+2+k*4,yy,1,1,G)}R_(c,X+95,WT+20,2,WB-WT-26,'#3a1c0c');R_(c,X+92,WT+40,2,3,G);R_(c,X+98,WT+40,2,3,G);
  R_(c,X+76,WB-6,40,6,OL);R_(c,X+77,WB-6,38,2,'#d8d4e0');R_(c,X+77,WB-4,38,1,'#8e8a9c');R_(c,X+78,WB-3,36,2,'#c4c0cc');R_(c,X+76,WT+14,40,4,'#cfc4b0');R_(c,X+76,WT+14,40,1,'#fffaf0')}
// Mill: 96 wide stone mill + waterwheel over the canal (wheel centre X+104). ROOF_SPLIT: Y+40
function drawMill(c,X,Y,t){const OL='#2a2228',P=roofRamp('#8a5838');
  for(let y=-2;y<38;y++){const inset=Math.max(0,14-(y+2)),x0=X-4+inset,x1=X+100-inset,tt=y+2,row=tt%6;R_(c,x0,Y+y,x1-x0,1,P.o);if(!tt)continue;R_(c,x0+1,Y+y,x1-x0-2,1,row===5?P.r1:row===0?P.r3:P.r2);if(tt<16){R_(c,x0+1,Y+y,3,1,P.r3);R_(c,x1-4,Y+y,3,1,P.r0)}
    if(row>0&&row<5)for(let x=x0+3+(Math.floor(tt/6)%2?4:0);x<x1-2;x+=8)R_(c,x,Y+y,1,1,P.r1)}
  R_(c,X+12,Y-1,72,2,P.r4);R_(c,X-4,Y+36,104,2,P.r0);R_(c,X-4,Y+38,104,2,P.o);
  R_(c,X+40,Y+8,16,12,P.o);R_(c,X+41,Y+9,14,10,'#f0e6d0');R_(c,X+42,Y+10,12,8,'#80bcec');R_(c,X+42,Y+10,12,3,'#b4e0f8');R_(c,X+48,Y+10,1,8,'#f0e6d0');R_(c,X+39,Y+20,18,2,P.r0);
  const WT=Y+40,WB=Y+96;R_(c,X-1,WT,98,WB-WT,OL);R_(c,X,WT,96,WB-WT,'#a89a80');
  for(let y=WT+1,r=0;y<WB-4;y+=7,r++)for(let x=-(r%2)*6;x<96;x+=12){const a=Math.max(X,X+x),b=Math.min(X+96,X+x+11);if(b<=a)continue;const tone=['#c4b494','#b8a888','#ccbd9e'][(r+x/12|0)%3&3]||'#c4b494';R_(c,a,y,b-a,6,tone);R_(c,a,y,b-a,1,'#ddd0b4');R_(c,a,y+5,b-a,1,'#94866e')}
  c.fillStyle='rgba(40,24,40,.28)';c.fillRect(X,WT,96,4);
  R_(c,X,WB-4,96,4,'#6e6458');R_(c,X,WB-4,96,1,'#9a8e7e');
  artWin(c,X+11,Y+52,16,14,'#5a7a48',0);artWin(c,X+69,Y+52,16,14,'#5a7a48',0);
  R_(c,X+37,Y+66,22,30,OL);R_(c,X+39,Y+68,18,28,'#6a4024');for(let i=0;i<3;i++)R_(c,X+40+i*6,Y+69,4,27,i%2?'#7a4c2a':'#8a5a32');R_(c,X+39,Y+76,18,2,'#3e2414');R_(c,X+39,Y+88,18,2,'#3e2414');R_(c,X+53,Y+82,2,2,'#f8d050');R_(c,X+35,Y+64,26,3,'#5a3420');
  R_(c,X+60,Y+86,10,10,'#5a3a1a');R_(c,X+61,Y+87,8,8,'#d8c8a0');R_(c,X+61,Y+87,8,1,'#f0e4c0');R_(c,X+63,Y+89,4,1,'#8a6a40');
  // waterwheel
  const cx=X+104,cy=Y+64,r=26,a0=t||0;
  for(let a=0;a<6.283;a+=.05){R_(c,Math.round(cx+Math.cos(a)*r)-1,Math.round(cy+Math.sin(a)*r)-1,3,3,'#3e2414')}
  for(let a=0;a<6.283;a+=.05){R_(c,Math.round(cx+Math.cos(a)*(r-1)),Math.round(cy+Math.sin(a)*(r-1)),1,1,a>3.5&&a<5.6?'#b07a44':'#7a4c2a');R_(c,Math.round(cx+Math.cos(a)*(r-7)),Math.round(cy+Math.sin(a)*(r-7)),2,2,'#4a2a14')}
  for(let i=0;i<10;i++){const a=i/10*6.283+a0,ca=Math.cos(a),sa=Math.sin(a);for(let k=5;k<r-1;k++)R_(c,Math.round(cx+ca*k),Math.round(cy+sa*k),2,2,k%7===0?'#3e2414':'#7a4c2a');for(let k=-3;k<=3;k++){const qx=Math.round(cx+ca*(r+1)-sa*k),qy=Math.round(cy+sa*(r+1)+ca*k);R_(c,qx,qy,2,2,k===-3?'#c48a4c':'#8a5a32')}}
  R_(c,cx-5,cy-5,10,10,OL);R_(c,cx-4,cy-4,8,8,'#545472');R_(c,cx-4,cy-4,8,2,'#8486a4');R_(c,cx-1,cy-1,2,2,'#1e1c2a')}
function drawWell(c,x,y){const O=STN.k;
  R_(c,x+4,y-6,3,22,WOOD.k);R_(c,x+25,y-6,3,22,WOOD.k);R_(c,x+5,y-5,1,20,WOOD.l);R_(c,x+26,y-5,1,20,WOOD.m);R_(c,x+6,y+1,20,2,WOOD.k);R_(c,x+7,y+1,18,1,WOOD.m);
  for(let r=0;r<8;r++){const w=34-r*2-(r>5?2:0),xx=x+16-(w>>1);R_(c,xx-1,y-14+r,w+2,1,WOOD.k);R_(c,xx,y-14+r,w,1,r===7?'#6a2a20':r<2?'#c8604a':'#a84838');R_(c,xx,y-14+r,w>>2,1,'#d8785e')}
  R_(c,x+15,y+3,2,7,'#d8d0c0');R_(c,x+12,y+9,8,6,WOOD.k);R_(c,x+13,y+10,6,4,WOOD.m);R_(c,x+13,y+10,6,1,WOOD.l);R_(c,x+13,y+12,6,1,IRON[2]);
  R_(c,x+2,y+14,28,17,O);R_(c,x+3,y+15,26,15,STN.m);for(let i=0;i<3;i++){const yy=y+15+i*5;R_(c,x+3,yy,26,1,STN.l);for(let k=0;k<26;k+=7)R_(c,x+3+k+(i%2)*3,yy+1,1,4,STN.d)}R_(c,x+3,y+15,2,15,STN.l);R_(c,x+27,y+15,2,15,STN.d);
  R_(c,x+2,y+12,28,5,O);R_(c,x+3,y+13,26,3,STN.l);R_(c,x+3,y+13,26,1,STN.h);R_(c,x+6,y+14,20,2,WTR.d);R_(c,x+8,y+14,5,1,WTR.l);R_(c,x+3,y+30,26,1,'#3e3c4c')}
function drawStall(c,x,y,col){const P=roofRamp(col);R_(c,x+3,y+8,3,22,WOOD.k);R_(c,x+42,y+8,3,22,WOOD.k);R_(c,x+4,y+8,1,21,WOOD.l);
  R_(c,x+1,y+17,46,13,WOOD.k);R_(c,x+2,y+18,44,11,'#8a5a32');R_(c,x+2,y+18,44,2,'#c48a4c');R_(c,x+2,y+20,44,1,'#5a3420');for(let i=8;i<46;i+=10)R_(c,x+2+i,y+21,1,8,'#6a4024');R_(c,x+2,y+28,44,1,'#5a3420');
  const fr=['#e84848','#f8c838','#78c850','#f89838','#c858c8','#58a8e8'];for(let i=0;i<7;i++){const fx=x+4+i*6,f=fr[(i+col.length)%6];R_(c,fx,y+14,5,4,hmix(f,'#000000',.35));R_(c,fx,y+14,4,3,f);R_(c,fx,y+14,2,1,hmix(f,'#ffffff',.5))}
  for(let i=0;i<6;i++){const sx=x+i*8,cc=i%2?'#f4f0e8':P.r2,cd=i%2?'#d0c8b8':P.r0;R_(c,sx,y,8,8,cc);R_(c,sx,y,8,1,i%2?'#ffffff':P.r4);R_(c,sx,y+8,8,2,cd);R_(c,sx+2,y+10,4,1,cd)}R_(c,x-1,y-1,50,1,P.o);R_(c,x-1,y,1,10,P.o);R_(c,x+48,y,1,10,P.o);c.fillStyle='rgba(40,20,40,.25)';c.fillRect(x+2,y+11,44,3)}
// Clock tower: 40 wide, art y-30..y+63 (bottom = sort line when called at the footprint top row)
function drawClock(c,x,y){const O='#2a2838',S=['#6a6458','#8a8474','#a8a292','#c8c2b0'];
  R_(c,x+5,y+14,30,50,O);R_(c,x+6,y+15,28,48,S[2]);R_(c,x+6,y+15,4,48,S[3]);R_(c,x+30,y+15,4,48,S[1]);for(let yy=20;yy<62;yy+=7){R_(c,x+6,y+yy,28,1,S[1]);for(let k=0;k<28;k+=9)R_(c,x+6+k+((yy/7|0)%2)*4,y+yy+1,1,6,S[1])}
  R_(c,x+3,y+58,34,6,O);R_(c,x+4,y+58,32,5,S[1]);R_(c,x+4,y+58,32,1,S[3]);R_(c,x+14,y+46,12,17,O);R_(c,x+15,y+47,10,16,'#6a4024');R_(c,x+15,y+47,10,1,'#9a6234');R_(c,x+20,y+47,1,16,'#3e2414');
  R_(c,x+2,y+10,36,6,O);R_(c,x+3,y+11,34,4,S[3]);R_(c,x+3,y+11,34,1,'#e8e4d4');
  for(let r=0;r<22;r++){const w=Math.max(2,36-Math.round(r*1.6)),xx=x+20-(w>>1);R_(c,xx-1,y+9-r,w+2,1,O);R_(c,xx,y+9-r,w>>1,1,'#3a7ab0');R_(c,xx+(w>>1),y+9-r,w-(w>>1),1,'#2a5a8a')}R_(c,x+19,y-18,2,6,'#f8c838');R_(c,x+18,y-20,4,3,'#f8c838');
  R_(c,x+11,y+19,18,18,O);R_(c,x+12,y+20,16,16,'#f4f0e0');R_(c,x+12,y+20,16,2,'#ffffff');R_(c,x+13,y+33,14,2,'#d4ccb4');for(const[a,b]of[[19,21],[19,34],[13,27],[26,27]])R_(c,x+a+(a===19?0:0),y+b,2,1,O);R_(c,x+19,y+23,2,6,O);R_(c,x+20,y+27,5,2,O);R_(c,x+19,y+27,2,2,'#e84848')}
// Root Tree: x..x+64 canopy, trunk centred x+32, roots end y+64. Layered canopy, blossoms, flared roots. Shadow is a flat decal.
let BIGTREE_CV=null;
function drawBigTree(c,x,y){// grid 72x80 placed at (x-4,y-14): canopy rows 0..50, trunk + root flare to row 77 (= y+63)
  if(!BIGTREE_CV){const g=SG(72,80),L=TREEP;
    part(g,U(PG([[26,40],[46,40],[44,62],[50,72],[60,77],[44,78],[36,74],[28,78],[12,77],[22,72],[28,62]]),RR(28,36,43,64)),BARK,{sh:{cx:30,cy:52,rx:14,ry:22}});
    for(const[a,b,l]of[[33,46,10],[38,52,8],[31,58,6]])for(let k=0;k<l;k++)px(g,a+(k>>2),b+k,BARK.r[0]);for(let k=0;k<8;k++)px(g,30,44+k,BARK.r[3]);
    for(const[a,b]of[[18,75],[54,75],[25,72],[47,72]]){px(g,a,b,BARK.r[0]);px(g,a+1,b,BARK.r[3])}
    const m=part(g,U(E(36,24,32,18),E(14,32,13,11),E(58,32,13,11),E(36,10,22,11),E(22,16,12,9),E(50,16,12,9),E(36,38,20,8)),L,{sh:{cx:32,cy:20,rx:36,ry:26}});
    for(let yy=0;yy<80;yy++)for(let xx=0;xx<72;xx++)if(interior(m,g,xx,yy)&&!inMask(m,g,xx,yy+4)&&get(g,xx,yy)!==L.line)px(g,xx,yy,L.r[0]);
    const cl=[[22,8],[34,5],[46,8],[14,18],[26,15],[38,14],[50,16],[60,22],[8,28],[20,26],[32,24],[44,25],[56,30],[14,36],[26,34],[38,34],[50,37],[62,36],[30,42],[42,43]];
    for(const[cx,cy]of cl){for(let a=0;a<16;a++){const t=a/16*Math.PI*.95-.1,xx=Math.round(cx+Math.cos(t)*5),yy=Math.round(cy+Math.sin(t)*3.8);if(interior(m,g,xx,yy)){const cur=get(g,xx,yy);px(g,xx,yy,cur===L.r[3]?L.r[2]:cur===L.r[2]?L.r[1]:L.r[0])}}
      for(const[dx,dy]of[[-3,-3],[-2,-3],[-1,-3],[-3,-2],[-2,-2]]){const xx=cx+dx,yy=cy+dy;if(interior(m,g,xx,yy)){const cur=get(g,xx,yy);px(g,xx,yy,cur===L.r[0]?L.r[1]:cur===L.r[1]?L.r[2]:L.r[3])}}}
    for(const[a,b]of[[18,10],[28,6],[42,4],[54,12],[10,22],[24,20],[36,18],[48,20],[62,28],[16,30],[30,30],[44,31],[56,34],[22,40],[40,40],[34,12],[8,32]])if(interior(m,g,a,b)){px(g,a,b,'#f8c4dc');px(g,a+1,b,'#f8a4c8');px(g,a,b+1,'#d8709c');px(g,a+1,b-1,'#ffffff')}
    for(const[a,b]of[[20,5],[33,2],[12,15]])if(interior(m,g,a,b)){px(g,a,b,'#c8ec88');px(g,a+1,b,'#c8ec88')}
    BIGTREE_CV=toCv(g)}
  c.drawImage(BIGTREE_CV,x-4,y-14)}
// Greenhouse: 64 wide, glass walls y+16..y+47, gabled glass roof up to y-12. ROOF_SPLIT: y+16
function drawGreenhouse(c,x,y){const F='#e8eef0',FD='#8a9aa0',O='#4a5a62';
  R_(c,x,y+16,64,32,O);c.globalAlpha=.85;R_(c,x+1,y+17,62,29,'#b8e0d4');c.globalAlpha=1;
  for(let i=0;i<7;i++){const px_=x+4+i*8+((i*3)%3),h=10+((i*5)%6);R_(c,px_+1,y+46-h,2,h,'#2f6e34');R_(c,px_,y+44-h,5,4,i%3===0?'#f87898':i%3===1?'#f8d848':'#4f9a3e');R_(c,px_+1,y+44-h,2,1,'#ffffff')}
  R_(c,x+1,y+40,62,6,'#6a4024');R_(c,x+1,y+40,62,1,'#9a6234');
  c.globalAlpha=.4;for(let j=0;j<29;j++)R_(c,x+3+Math.floor((28-j)*.3),y+17+j,3,1,'#ffffff');c.globalAlpha=1;
  for(let i=0;i<=64;i+=8)R_(c,x+Math.min(i,63),y+16,1,32,F);R_(c,x,y+30,64,1,F);R_(c,x,y+16,64,1,F);R_(c,x,y+47,64,1,FD);
  for(let r=0;r<28;r++){const t=r/27,ins=Math.round(28*(1-t)),xx=x-2+ins,w=68-ins*2;if(w<2)continue;R_(c,xx,y-12+r,w,1,O);R_(c,xx+1,y-12+r,(w>>1)-1,1,r%5===4?'#ffffff':'#d8f0ec');R_(c,xx+(w>>1),y-12+r,(w-(w>>1))-1,1,r%5===4?F:'#a8d4cc')}
  R_(c,x+31,y-13,2,30,F);R_(c,x-2,y+15,68,2,FD);R_(c,x-2,y+15,68,1,F);
  R_(c,x+26,y+28,12,20,O);R_(c,x+27,y+29,10,19,'#c8e8e0');R_(c,x+32,y+29,1,19,O);R_(c,x+28,y+30,2,8,'#ffffff');R_(c,x+34,y+38,2,2,'#f8d050')}
function drawBarrel(c,x,y){const O=WOOD.k;R_(c,x+3,y+2,10,13,O);R_(c,x+2,y+4,12,9,O);R_(c,x+4,y+3,8,11,'#8a5a30');R_(c,x+3,y+5,10,7,'#8a5a30');R_(c,x+4,y+3,3,11,'#b07a44');R_(c,x+10,y+3,2,11,'#6a4024');R_(c,x+2,y+5,12,1,IRON[1]);R_(c,x+2,y+11,12,1,IRON[1]);R_(c,x+4,y+5,2,1,IRON[3]);
  R_(c,x+4,y+2,8,2,'#c48a4c');R_(c,x+5,y+2,6,1,'#e0b070')}
function drawCrate(c,x,y){const O=WOOD.k;R_(c,x+1,y+2,14,13,O);R_(c,x+2,y+3,12,11,'#c48a4c');R_(c,x+2,y+3,12,1,'#e6b878');R_(c,x+2,y+3,1,11,'#dca46a');R_(c,x+2,y+13,12,1,'#8a5a30');R_(c,x+13,y+3,1,11,'#9a6234');
  for(let i=0;i<10;i++)R_(c,x+3+i,y+4+i,1,1,'#8a5a30');R_(c,x+2,y+8,12,1,'#9a6234')}
function drawBoat(c,x,y){c.fillStyle='rgba(16,34,60,.3)';c.fillRect(x+3,y+13,26,2);const rows=[[4,27],[2,29],[1,30],[1,30],[2,29],[3,28],[5,26]];
  rows.forEach(([a,b],j)=>{R_(c,x+a,y+6+j,b-a+1,1,WOOD.k);if(j>0&&j<6)R_(c,x+a+1,y+6+j,b-a-1,1,j===1?'#d89858':j<4?'#6a4024':'#a86838')});R_(c,x+4,y+7,24,1,'#d89858');R_(c,x+10,y+8,2,3,'#9a6234');R_(c,x+20,y+8,2,3,'#9a6234');R_(c,x+5,y+13,22,1,'#d8f4ff')}

/* ===== MAP ART: composition pieces (new) ===== */
// circular paved plaza decal (flat). cx,cy centre px, r radius px; accent = inlay colour
function drawPlaza(c,cx,cy,r,accent,cool){const ac=accent||'#4f9a3e',acd=hmix(ac,'#14301e',.45),P=cool?['#a8a8b8','#9e9eb0','#b2b2c0','#77768c','#8a8a9e',STN.d,STN.l,STN.h]:['#e0d0ae','#d6c4a0','#e8dabc','#b49c78','#c8b48e','#8a7254','#eadcc0','#f8f0dc'];
  for(let y=-r-2;y<=r+2;y++)for(let x=-r-2;x<=r+2;x++){const d=Math.hypot(x+.5,y+.5);if(d>r+1.5)continue;let col;
    if(d>r+.5)col='rgba(16,34,44,.16)';else if(d>r-1)col=P[5];else if(d>r-3)col=y<0?P[7]:P[6];else if(d>r-4)col=P[5];
    else{const k=r-4-d,ring=Math.floor(k/6),a=Math.atan2(y,x),n=Math.max(5,12-ring*3),seg=Math.floor((a+Math.PI)/(Math.PI*2)*n),fr=k%6,sa=((a+Math.PI)/(Math.PI*2)*n)%1;
      if(d<6)col=d<2?'#fff4b0':d<4.5?ac:acd;else if(fr<1||sa<.06)col=P[3];else{const hv=hsh(ring,seg,301);col=P[Math.floor(hv*3)];if(fr>4.9)col=P[4];else if(fr<1.9)col=P[6]}
      if(d>=6&&d<10&&Math.abs(Math.sin(a*2))>.97)col=d<8?ac:acd}
    R_(c,cx+x,cy+y,1,1,col)}}
// stone town wall segment 16x32 (upright, base = y+31): coping, coursed blocks, plinth
function drawStoneWall(c,x,y){const O=STN.k;R_(c,x,y+2,16,30,O);R_(c,x,y+3,16,28,'#9a9486');
  R_(c,x,y+2,16,4,O);R_(c,x,y+3,16,2,'#c8c2b2');R_(c,x,y+3,16,1,'#e4dece');R_(c,x,y+5,16,1,'#7a7468');
  for(let r=0;r<4;r++){const yy=y+7+r*6;R_(c,x,yy,16,1,'#b4ae9e');R_(c,x,yy+5,16,1,'#6e685c');const off=((x>>4)+r)%2?0:8;R_(c,x+off,yy,1,6,'#6e685c');R_(c,x+((off+7)&15),yy+1,1,4,'#b4ae9e')}
  R_(c,x,y+29,16,2,'#7a7468');R_(c,x,y+31,16,1,O);if(hsh(x,y,302)<.3){R_(c,x+3,y+28,3,1,'#5f8a44');R_(c,x+4,y+27,1,1,'#7cc457')}}
// waystone monolith 16x32 (upright, base y+31): carved stone with glowing rune
function drawWaystone(c,x,y){const O=STN.k;R_(c,x+3,y+4,10,28,O);R_(c,x+4,y+2,8,2,O);R_(c,x+4,y+4,8,26,STN.m);R_(c,x+5,y+3,6,1,STN.l);R_(c,x+4,y+4,2,26,STN.l);R_(c,x+10,y+4,2,26,STN.d);
  R_(c,x+7,y+9,2,8,'#58c8e8');R_(c,x+6,y+11,4,1,'#58c8e8');R_(c,x+6,y+15,4,1,'#58c8e8');R_(c,x+7,y+9,1,1,'#d8f8ff');R_(c,x+2,y+28,12,4,O);R_(c,x+3,y+28,10,3,STN.d);R_(c,x+3,y+28,10,1,STN.l);R_(c,x+4,y+27,3,1,'#5f8a44')}
// interior wall window 32x22 at (x,y) — drawn over the wall row
function drawIntWindow(c,x,y){R_(c,x,y,32,20,'#5a3a22');R_(c,x+1,y+1,30,18,'#f4ecd8');for(let j=0;j<16;j++)R_(c,x+2,y+2+j,28,1,j<6?'#bfe6fa':j<12?'#94cff2':'#7ab8ea');R_(c,x+2,y+13,28,5,'#7cc457');R_(c,x+2,y+12,28,1,'#4f9a3e');R_(c,x+6,y+9,6,4,'#2f7a38');R_(c,x+20,y+8,7,5,'#2f7a38');
  for(let j=0;j<10;j++)R_(c,x+4+Math.floor((9-j)*.6),y+2+j,2,1,'#f0faff');R_(c,x+15,y+1,2,18,'#f4ecd8');R_(c,x+1,y+9,30,1,'#f4ecd8');R_(c,x-1,y+19,34,3,'#c89a6a');R_(c,x-1,y+19,34,1,'#e6b878');
  R_(c,x-3,y-1,4,22,'#c85a5a');R_(c,x+31,y-1,4,22,'#c85a5a');R_(c,x-3,y-1,1,22,'#e88a7a');R_(c,x+34,y-1,1,22,'#983a40')}
function drawWallClock(c,x,y){R_(c,x+2,y,12,12,'#3e2414');R_(c,x+3,y+1,10,10,'#f4f0e0');R_(c,x+3,y+1,10,1,'#ffffff');R_(c,x+7,y+3,2,4,'#262433');R_(c,x+8,y+6,3,1,'#262433');R_(c,x+7,y+12,2,4,'#3e2414');R_(c,x+6,y+16,4,3,'#c8a038')}
function drawPainting(c,x,y,w,h){R_(c,x,y,w,h,'#7a4c22');R_(c,x+1,y+1,w-2,h-2,'#c89a42');R_(c,x+2,y+2,w-4,h-4,'#a8d8f0');R_(c,x+2,y+2+((h-4)>>1),w-4,(h-4)-((h-4)>>1),'#6ab04a');R_(c,x+w/2-2|0,y+3,4,3,'#f8e8a0')}
// small flat ground decals for life: flower clump, mushrooms, pebbles, stepping stone
function drawFlowerClump(c,x,y,k){const pal=FLW[k%4];for(let i=0;i<5;i++){const fx=x+Math.floor(hsh(x,i,303)*12),fy=y+Math.floor(hsh(y,i,304)*7);R_(c,fx,fy+1,1,2,GRS.s);R_(c,fx,fy,1,1,pal[0]);R_(c,fx+1,fy,1,1,pal[1]);R_(c,fx,fy-1,1,1,i%2?'#fff4a0':pal[0])}}
function drawMushrooms(c,x,y){for(const[a,b,s]of[[0,2,3],[4,0,4],[8,3,3]]){R_(c,x+a+1,y+b+s-1,1,3,'#f0e6d0');R_(c,x+a,y+b,s,s-1,'#c83838');R_(c,x+a,y+b,s,1,'#e86060');R_(c,x+a+1,y+b+1,1,1,'#ffffff')}}
function drawPebbles(c,x,y){for(let i=0;i<4;i++){const a=x+Math.floor(hsh(x,y+i,305)*12),b=y+Math.floor(hsh(y,x+i,306)*8);R_(c,a,b,2,2,STN.m);R_(c,a,b,2,1,STN.l);R_(c,a+1,b+1,1,1,STN.d)}}
function drawStepStone(c,x,y){R_(c,x+1,y+1,10,6,'rgba(16,34,44,.25)');R_(c,x,y,10,6,STN.d);R_(c,x+1,y,8,5,STN.m);R_(c,x+1,y,8,1,STN.l);R_(c,x+2,y+1,3,1,STN.h)}

// soft edges for tall-grass patches (flat decal over the ground): rounded convex corners, blade tips poking into the
// neighbouring grass, and a contact shade under the patch. isT(v) = tall cell; isG(v) = plain grass/flowers neighbour
function drawTallEdges(c,G,isT,isG){isT=isT||(v=>v===3);isG=isG||(v=>v===0||v===4);const H=G.length,W=G[0].length;
  for(let Y=0;Y<H;Y++)for(let X=0;X<W;X++){if(!isT(G[Y][X]))continue;const n=(dx,dy)=>{const v=G[Y+dy]?.[X+dx];return v!==undefined&&isG(v)},x=X*16,y=Y*16;
    const u=n(0,-1),d=n(0,1),l=n(-1,0),r=n(1,0);
    for(const[ok,cx,cy]of[[u&&l,0,0],[u&&r,16,0],[d&&l,0,16],[d&&r,16,16]])if(ok)for(let j=0;j<5;j++)for(let i=0;i<5;i++){const px_=cx?15-i:i,py_=cy?15-j:j;if(Math.hypot(5-i-.5,5-j-.5)>5.2)R_(c,x+px_,y+py_,1,1,grassBase(x+px_,y+py_))}
    if(u)for(let i=1;i<15;i+=3){if(hsh(X*16+i,Y,311)<.25)continue;const h=1+Math.floor(hsh(X*16+i,Y,312)*3);R_(c,x+i,y-h,1,h,TALL_P.l);R_(c,x+i,y-h,1,1,TALL_P.t)}
    if(d){c.fillStyle='rgba(16,48,28,.22)';c.fillRect(x+(l?4:0),y+16,16-(l?4:0)-(r?4:0),2);for(let i=2;i<15;i+=4)if(hsh(X*16+i,Y,313)<.6)R_(c,x+i,y+16,1,2,TALL_P.m)}
    if(l)for(let j=3;j<14;j+=4)if(hsh(X,Y*16+j,314)<.7){R_(c,x-1,y+j,1,3,TALL_P.m);R_(c,x-2,y+j,1,1,TALL_P.h)}
    if(r)for(let j=1;j<14;j+=4)if(hsh(X,Y*16+j,315)<.7){R_(c,x+16,y+j,1,3,TALL_P.d);R_(c,x+17,y+j,1,1,TALL_P.l)}}
  // concave corners: a small blade clump fills the notch
  for(let Y=0;Y<H;Y++)for(let X=0;X<W;X++){if(!isG(G[Y][X]))continue;const t=(dx,dy)=>{const v=G[Y+dy]?.[X+dx];return v!==undefined&&isT(v)};
    for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]])if(t(sx,0)&&t(0,sy))artStamp(c,X*16+(sx<0?0:10),Y*16+(sy<0?0:10),0,0,TALL_NOTCHES[(sy<0?0:2)+(sx<0?0:1)],TALL_P,0)}}
const TALL_NOTCH=["mmmmdk","lmmdk.","mmdk..","mdk...","dk....","k....."],TALL_NOTCH_B=["t.....","hl....","lmt...","mlhl..","mdmmt.","dkkdmk"],TALL_NOTCHES=[TALL_NOTCH,TALL_NOTCH.map(r=>[...r].reverse().join("")),TALL_NOTCH_B,TALL_NOTCH_B.map(r=>[...r].reverse().join(""))];
// main-street runner: large warm sandstone slabs with a dark kerb line (flat decal over cobble). px rect
function drawSlabs(c,x0,y0,w,h){R_(c,x0,y0,w,h,'#b49c78');for(let y=y0+1,r=0;y<y0+h-1;y+=8,r++){const hh=Math.min(7,y0+h-1-y);for(let x=x0+1-((r%2)?8:0);x<x0+w-1;x+=16){const a=Math.max(x,x0+1),b=Math.min(x+15,x0+w-1);if(b<=a)continue;const t=['#e0d0ae','#d8c6a2','#e6d8b8'][(r+((x-x0)>>4))%3];R_(c,a,y,b-a,hh,t);R_(c,a,y,b-a,1,'#f2e8d0');R_(c,a,y+hh-1,b-a,1,'#c4ae88')}}
  R_(c,x0,y0,w,1,'#8a7254');R_(c,x0,y0+h-1,w,1,'#8a7254');R_(c,x0,y0,1,h,'#8a7254');R_(c,x0+w-1,y0,1,h,'#8a7254')}
// concave-corner fillets (flat decal over the ground). Tiles only round their own convex corners; this rounds the
// inside corners where a land cell has path/dirt ('earth') or water ('water') on two orthogonal sides, so diagonal
// runs read as smooth curves instead of stair-steps.
function drawFillets(c,G,mode){const water=mode==='water',isIn=water?(v=>v===2):(v=>v===1||v===8),isOut=water?(v=>v===0||v===3||v===4||v===1||v===8):(v=>v===0||v===3||v===4);
  const R=water?10:8,t=water?3.4:2.2,H=G.length,W=G[0].length;
  for(let Y=0;Y<H;Y++)for(let X=0;X<W;X++){const own=G[Y][X];if(!isOut(own))continue;const n=(dx,dy)=>{const v=G[Y+dy]?.[X+dx];return v!==undefined&&isIn(v)?v:-1};
    for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const a=n(sx,0),b=n(0,sy);if(a<0||b<0)continue;
      const Px=X*16+(sx>0?16:0),Py=Y*16+(sy>0?16:0),Cx=Px-sx*(R-t),Cy=Py-sy*(R-t),k=a===8&&b===8?8:a;
      for(let j=-Math.ceil(t)-1;j<=R;j++)for(let i=-Math.ceil(t)-1;i<=R;i++){const wx=Px-sx*i-(sx>0?1:0),wy=Py-sy*j-(sy>0?1:0),qx=wx+.5-Cx,qy=wy+.5-Cy;
        if(qx*sx<=0||qy*sy<=0)continue;const e=Math.hypot(qx,qy)-R;let col=null;
        if(water){const bank=own===1?PATH_P.b:own===8?DIRT_P.b:null;
          if(e<-2.4)continue;col=e<-1.4?(bank?DRT.d:GRS.lip):e<-1?DRT.m:e<0?'#6a4a2e':e<1?WTR.h:e<2.2?WTR.l:e<4.5?'#4a92e6':WTR.m}
        else{const p=k===8?DIRT_P:PATH_P;if(e<-1)continue;col=e<0?GRS.lip:e<1?p.r:e<2?p.r2:earthBase(wx,wy,p,k===8?1:0)}
        R_(c,wx,wy,1,1,col)}}}}

/* ===== CHAPTER 3: coast tiles & landmarks ===== */
const SAND=['#b8925a','#d8b878','#ecd49a','#f8e8bc'];
function tileSand(x0,y0,X,Y,c,G){R_(c,x0,y0,16,16,SAND[1]);for(let i=0;i<10;i++){const h=hsh(X*16+i,Y*16,91),px_=Math.floor(h*16),py_=Math.floor(hsh(X,Y*16+i,92)*16);R_(c,x0+px_,y0+py_,1,1,h<.5?SAND[2]:SAND[0])}
  if(hsh(X,Y,93)<.35){const px_=x0+3+Math.floor(hsh(X,Y,94)*9),py_=y0+3+Math.floor(hsh(X,Y,95)*9);R_(c,px_,py_,3,1,SAND[3]);R_(c,px_+1,py_+1,2,1,SAND[2])}
  if(hsh(X,Y,96)<.12){const px_=x0+4+Math.floor(hsh(X,Y,97)*8),py_=y0+5+Math.floor(hsh(X,Y,98)*7);R_(c,px_,py_,3,2,'#f0e0e0');R_(c,px_,py_,1,1,'#e89090');R_(c,px_+2,py_+1,1,1,'#c87878')}
  const g=(dx,dy)=>G&&G[Y+dy]?.[X+dx];if(g(0,1)===2){R_(c,x0,y0+13,16,3,'#e8f4f0');R_(c,x0,y0+15,16,1,'#a8d8e8')}if(g(0,-1)===0||g(0,-1)===3){for(let i=0;i<16;i+=3)R_(c,x0+i,y0,2,1+((i*7)%3),'#6aa84a')}}
// cliff rim (ground 10): the shelf's grass runs to a weathered rock lip on every side that drops to a lower tier.
// lv(X,Y) gives each tile's tier; without it the old one-level guess (neighbours that aren't rim are lower) is used.
function tileCliff(x0,y0,X,Y,c,G,lv){const me=lv?lv(X,Y):1,low=(dx,dy)=>lv?lv(X+dx,Y+dy)<me:(G&&G[Y+dy]?.[X+dx])!==10;
  tileGrass(x0,y0,X,Y,c);
  const L='#9a8a78',D='#5e5044',K='#3a3028',M='#3a7a30';
  const edge=(x,y,w,h,horiz,outer)=>{R_(c,x,y,w,h,L);if(horiz){for(let i=0;i<w;i++){const k=hsh(X*16+i,Y,83);R_(c,x+i,outer>0?y+h:y-1,1,1,k<.5?D:K);if(k<.22)R_(c,x+i,y,1,1,'#b8a894')}}
    else for(let i=0;i<h;i++){const k=hsh(X,Y*16+i,84);R_(c,outer>0?x+w:x-1,y+i,1,1,k<.5?D:K);if(k<.22)R_(c,x,y+i,1,1,'#b8a894')}};
  // grass tufts lean over the lip, then the rock band itself
  if(low(0,1)){edge(x0,y0+13,16,3,1,1);for(let i=0;i<16;i+=3)if(hsh(X*7+i,Y,85)<.6)R_(c,x0+i,y0+12,2,2,M)}
  if(low(0,-1)){edge(x0,y0,16,2,1,1);R_(c,x0,y0+2,16,1,K)}
  if(low(-1,0)){edge(x0,y0,2,16,0,1);R_(c,x0+2,y0,1,16,'rgba(40,30,24,.35)')}
  if(low(1,0)){edge(x0+14,y0,2,16,0,-1);R_(c,x0+13,y0,1,16,'rgba(40,30,24,.35)')}
  // outer corners
  if(low(1,1)&&!low(0,1)&&!low(1,0))R_(c,x0+13,y0+13,3,3,L);if(low(-1,1)&&!low(0,1)&&!low(-1,0))R_(c,x0,y0+13,3,3,L)}
// natural cliff face texture (16 wide x 96 tall, v=1 at the top): mossy overhang, layered strata, cracks, darker toe
function cliffFaceCv(){const cv=mkCanvas(16,96),c=cv.getContext('2d');const S=['#8a7a68','#7e6e5e','#948472','#76685a'];
  let y=0,k=0;while(y<96){const h=3+Math.floor(hsh(k,1,86)*6);R_(c,0,y,16,h,S[k%4]);R_(c,0,y,16,1,'#a89886');R_(c,0,y+h-1,16,1,'#5e5044');
    for(let i=0;i<3;i++){const x=Math.floor(hsh(k,i+2,87)*15);R_(c,x,y+1,1,Math.max(1,h-2),'#5a4c40')}y+=h;k++}
  for(let i=0;i<14;i++){const x=Math.floor(hsh(i,3,88)*15),yy=8+Math.floor(hsh(i,4,88)*80);R_(c,x,yy,2,1,'#b4a490')}
  R_(c,0,0,16,3,'#4f9a3e');R_(c,0,3,16,1,'#2f6e34');for(let i=0;i<16;i++){const d=Math.floor(hsh(i,5,89)*5);if(d>1)R_(c,i,4,1,d,i%2?'#3a7a30':'#2f6e34')}
  return cv}
function drawThorn(c,x,y){R_(c,x+1,y+3,14,12,'#14301e');R_(c,x+2,y+2,12,12,'#1f4a2c');R_(c,x+3,y+3,10,9,'#2f6e34');
  for(const[a,b]of[[3,4],[9,3],[12,7],[5,9],[10,11],[2,8]]){R_(c,x+a,y+b,2,1,'#4f9a3e');R_(c,x+a+1,y+b-1,1,1,'#c860d8')}
  for(const[a,b]of[[1,6],[14,5],[7,1],[13,12],[0,11]]){R_(c,x+a,y+b,1,2,'#e8e0f0')}}
function drawBrokenTower(c,x,y){// 128 wide; base line at y+152. the shattered lighthouse stump with a rift hanging over it
  const O='#1c1c28',cx=x+64,base=y+152,VI='#a040e0',VL='#e8b8ff';
  // rift in the air above the stump: a jagged tear with a white-hot core and crackling branches
  const zz=[0,3,-2,4,-3,2,-4,1,3,-1,0];
  for(let r=0;r<42;r++){const yy=y+r,k=Math.sin(Math.PI*r/42),seg=r/42*10,i0=Math.floor(seg),j=Math.round(zz[i0]+(zz[Math.min(10,i0+1)]-zz[i0])*(seg-i0)),hw=Math.round(k*6);
    R_(c,cx+j-hw-2,yy,hw*2+4,1,'#2a0640');R_(c,cx+j-hw-1,yy,hw*2+2,1,VI);if(hw>0)R_(c,cx+j-hw,yy,hw*2,1,'#c878f8');if(hw>1)R_(c,cx+j-Math.max(1,hw-3),yy,Math.max(2,(hw-3)*2),1,VL);if(hw>3)R_(c,cx+j-1,yy,2,1,'#ffffff')}
  for(const[sx,sy,dx,dy,n]of[[-5,12,-1,-1,6],[5,18,1,-1,7],[-6,26,-1,1,5],[6,30,1,1,5],[-3,6,-1,-1,4]])for(let k=0;k<n;k++){const X=cx+sx+dx*k+(k%2?dx:0),Y=y+sy+dy*Math.floor(k*.7);R_(c,X,Y,1,1,k<2?VL:VI)}
  for(const[dx,dy]of[[-16,8],[14,14],[-11,32],[17,4],[-19,22],[12,36]]){R_(c,cx+dx-1,y+dy,3,1,'#5a1a8a');R_(c,cx+dx,y+dy-1,1,3,'#5a1a8a');R_(c,cx+dx,y+dy,1,1,VL)}
  // plinth
  R_(c,x+20,base-22,88,24,O);R_(c,x+21,base-21,86,22,'#5a5664');R_(c,x+21,base-21,86,3,'#8a8698');for(let i=0;i<6;i++)R_(c,x+24+i*14+(i%2)*4,base-14+(i%3)*3,9,1,'#3c3946');
  R_(c,x+21,base-26,86,5,O);R_(c,x+22,base-25,84,3,'#6a2a2e');
  // tower stump: banded shaft with a jagged broken crown
  const top=xx=>y+46+Math.round(hsh(xx>>1,7,911)*14+Math.abs(xx-cx)*.35+(xx>cx+10?-8:0));
  for(let xx=cx-30;xx<=cx+30;xx++){const t=top(xx),rel=xx-cx;for(let yy=t;yy<base-26;yy++){const r=yy-(y+40),w=26+Math.round((yy-y)*.04);if(Math.abs(rel)>w)continue;
      const band=Math.floor((yy-y)/14)%2,edge=Math.abs(rel)>=w-1||yy===t;let col=band?'#b83434':'#e6dfd2';if(rel<-w+5)col=band?'#d85a5a':'#fbf8f0';else if(rel>w-8)col=band?'#7a1e22':'#aaa294';else if(rel>w-14)col=band?'#982a2c':'#c8c0b2';
      if(edge)col=O;else if(yy<t+3)col=yy===t+1?'#3a3040':'#5a4c58';R_(c,xx,yy,1,1,col)}}
  // exposed inner wall and stairs at the break
  for(let xx=cx-16;xx<cx+14;xx++){const t=top(xx)+3;R_(c,xx,t,1,6,'#2a2234');if(xx%5===0)R_(c,xx,t+1,3,1,'#4a4058')}
  // cracks leaking violet light
  const crack=(pts)=>{for(let i=0;i<pts.length-1;i++){const[a,b]=pts[i],[d,e]=pts[i+1],n=Math.max(Math.abs(d-a),Math.abs(e-b));for(let k=0;k<=n;k++){const X=Math.round(a+(d-a)*k/n),Y=Math.round(b+(e-b)*k/n);R_(c,cx+X-1,Y,3,1,O);R_(c,cx+X,Y,1,1,VI)}}};
  crack([[-6,y+66],[-10,y+78],[-4,y+90],[-9,y+104],[-5,y+118]]);crack([[12,y+62],[17,y+76],[11,y+88],[15,y+96]]);crack([[2,y+100],[7,y+108]]);crack([[-18,y+70],[-15,y+82]]);
  // blasted hole in the shaft
  R_(c,cx-2,y+72,16,14,O);R_(c,cx-1,y+73,14,12,'#24102e');R_(c,cx+2,y+76,8,7,'#5a1a8a');R_(c,cx+4,y+78,4,3,VL);for(let i=0;i<3;i++)R_(c,cx-12+i*10,y+96,5,7,O),R_(c,cx-11+i*10,y+97,3,5,i===1?'#3a2a50':'#2a2234');
  // the door, scorched
  R_(c,cx-7,base-26-18,14,18,O);R_(c,cx-6,base-26-17,12,17,'#2a1a14');R_(c,cx-6,base-26-17,12,2,'#120a08');
  // bent iron girders sticking out of the crown
  for(const[a,b,d,e]of[[-14,0,-26,-14],[8,-2,20,-18],[16,4,30,-6]]){const n=Math.max(Math.abs(d-a),Math.abs(e-b));for(let k=0;k<=n;k++){const X=Math.round(cx+a+(d-a)*k/n),Y=Math.round(y+50+b+(e-b)*k/n);R_(c,X-1,Y-1,3,3,O);R_(c,X,Y,1,1,'#6a6a7a')}}
  // withered coil vines climbing the stump
  for(const vx of[-22,19]){for(let yy=base-28;yy>y+70;yy-=1){const X=cx+vx+Math.round(Math.sin(yy*.25)*2);R_(c,X,yy,2,1,'#2e1a3a');if(yy%6===0)R_(c,X+(vx<0?-2:2),yy,2,2,'#5a2a6a')}}
  // rubble heaps against the base: chunks of shaft, plaster and stone, piled highest beside the stump
  const RC=[['#c83838','#e86060','#7a1e22'],['#e6dfd2','#ffffff','#a8a092'],['#6a6672','#8a8698','#3c3946'],['#5a5664','#7a7688','#34313e']];
  for(let i=0;i<46;i++){const u=hsh(i,3,77),v=hsh(i,9,78),sx=Math.round(x+4+u*120),hp=Math.max(0,1-Math.abs(sx-cx)/62)*(Math.abs(sx-cx)<9?.2:1),sz=2+Math.round(v*5),sy=Math.round(base-sz-hp*12*hsh(i,5,79)+(v>.7?2:0)),C=RC[Math.floor(hsh(i,1,80)*4)];
    R_(c,sx-1,sy-1,sz+2,sz+1,O);R_(c,sx,sy,sz,sz-1,C[0]);R_(c,sx,sy,sz,1,C[1]);if(sz>3)R_(c,sx+sz-1,sy+1,1,sz-2,C[2])}
  for(const[dx,w]of[[-50,14],[36,18]]){R_(c,cx+dx-1,base-7,w+2,8,O);R_(c,cx+dx,base-6,w,6,'#b83434');R_(c,cx+dx,base-6,w,2,'#d85a5a');R_(c,cx+dx+3,base-6,4,6,'#e6dfd2')}}
function drawFallenLantern(c,x,y){// 44x30, base line at y+30: the lantern room cage, toppled on its side
  const O='#1c1c28';R_(c,x+2,y+10,40,20,O);R_(c,x+3,y+11,38,18,'#2a2a38');
  for(let i=0;i<5;i++){R_(c,x+5+i*8,y+12,5,15,i===2?'#1a1424':'#7ab8d8');R_(c,x+5+i*8,y+12,2,6,'#d8f4ff');if(i===1||i===4){R_(c,x+6+i*8,y+18,3,9,'#2a2a38');R_(c,x+7+i*8,y+20,1,2,'#d8f4ff')}}
  R_(c,x,y+8,44,3,O);R_(c,x+1,y+9,42,1,'#8a3a3a');R_(c,x,y+27,44,3,O);
  R_(c,x+12,y+2,22,8,O);R_(c,x+13,y+3,20,6,'#c83838');R_(c,x+13,y+3,20,2,'#e86060');R_(c,x+21,y,4,3,O);
  R_(c,x+14,y+14,14,8,'rgba(160,64,224,.35)');R_(c,x+18,y+16,6,4,'#e8b8ff')}
/* ===== COLISEUM (First Ribbon trial grounds / free-battle arena) ===== */
const MARB={k:'#6a6274',d:'#b8b0c0',m:'#e2dce6',l:'#f2eef4',h:'#ffffff'},GOLD={k:'#5a3a0a',d:'#a8741c',m:'#e0aa34',l:'#f8d66a',h:'#fff2b8'},CRIM={k:'#3a0c12',d:'#7a1a24',m:'#b02c34',l:'#d8484a',h:'#f07a6a'};
// polished marble court with gold inlay, painted lines and the Guild emblem; flat decal over (x0,y0,w,h) px
function drawCourt(c,x0,y0,w,h){
  for(let y=0;y<h;y+=32)for(let x=0;x<w;x+=32){const X=x0+x,Y=y0+y,v=hsh(X>>5,Y>>5,611),base=v<.5?MARB.m:MARB.l;R_(c,X,Y,32,32,base);
    for(let k=0;k<3;k++){let vx=X+Math.floor(hsh(X,Y+k,612)*30),vy=Y+Math.floor(hsh(X+k,Y,613)*8);for(let j=0;j<14;j++){vx+=hsh(vx,vy,614+j)<.5?1:0;vy+=1;if(vx<X+32&&vy<Y+32)R_(c,vx,vy,1,1,j%3?MARB.d:'#cfc6d4')}}
    R_(c,X,Y,32,1,MARB.h);R_(c,X,Y,1,32,MARB.h);R_(c,X+31,Y,1,32,'#c8c0ce');R_(c,X,Y+31,32,1,'#c8c0ce')}
  // crimson border band with gold trim
  const bw=10;for(const[x,y,ww,hh]of[[x0,y0,w,bw],[x0,y0+h-bw,w,bw],[x0,y0,bw,h],[x0+w-bw,y0,bw,h]]){R_(c,x,y,ww,hh,CRIM.m);for(let i=0;i<Math.max(ww,hh);i+=8)R_(c,x+(ww>hh?i:2),y+(ww>hh?2:i),ww>hh?4:6,ww>hh?6:4,CRIM.d)}
  const tr=(x,y,ww,hh)=>{R_(c,x,y,ww,hh,GOLD.m);R_(c,x,y,ww,1,GOLD.l)};tr(x0+bw,y0+bw,w-2*bw,2);tr(x0+bw,y0+h-bw-2,w-2*bw,2);tr(x0+bw,y0+bw,2,h-2*bw);tr(x0+w-bw-2,y0+bw,2,h-2*bw);
  // court lines
  const L=(x,y,ww,hh)=>{R_(c,x,y,ww,hh,'#fffaf0');R_(c,x,y+hh,ww,1,'#c8bcae')},cx=x0+w/2,cy=y0+h/2;
  L(x0+26,y0+26,w-52,2);L(x0+26,y0+h-28,w-52,2);L(x0+26,y0+26,2,h-52);L(x0+w-28,y0+26,2,h-52);L(cx-1,y0+26,2,h-52);
  for(let a=0;a<360;a+=1.2){const r=46,X=Math.round(cx+Math.cos(a*Math.PI/180)*r),Y=Math.round(cy+Math.sin(a*Math.PI/180)*r*.62);R_(c,X-1,Y,2,2,'#fffaf0')}
  // emblem: gold ribbon star on a crimson disc
  for(let r=30;r>=0;r--){const ww=Math.round(Math.sqrt(30*30-r*r)*1.0),yy=Math.round(r*.62);for(const sy of[-1,1])R_(c,cx-ww,cy+sy*yy,ww*2,1,r>27?GOLD.k:r>24?GOLD.m:CRIM.m)}
  for(let k=0;k<5;k++){const a=-Math.PI/2+k*Math.PI*2/5;for(let t=0;t<20;t++){const X=Math.round(cx+Math.cos(a)*t),Y=Math.round(cy+Math.sin(a)*t*.62);R_(c,X-2+Math.floor(t/7),Y-1,5-Math.floor(t/5),3,t<16?GOLD.m:GOLD.l)}}
  R_(c,cx-4,cy-3,8,6,GOLD.l);R_(c,cx-2,cy-2,4,4,GOLD.h);
  // team marks at each end
  for(const[ex,col]of[[x0+70,'#2a6ee8'],[x0+w-70,'#e8502a']]){for(let r=16;r>=0;r--){const ww=Math.round(Math.sqrt(256-r*r)),yy=Math.round(r*.62);for(const sy of[-1,1])R_(c,ex-ww,cy+sy*yy,ww*2,1,r>13?'#fffaf0':r>11?col:'rgba(255,255,255,0)')}}
}
// a seated spectator facing the camera (6x9), cheering when arms are up
function fan(c,x,y,k){const H=['#3a2a20','#c8782c','#e8c058','#1a1a22','#904828','#d0d0d0','#c05028','#5a3a8a'],S=['#e8502a','#3888c8','#f0c838','#58a058','#e87898','#8058b0','#f0f0f0','#38c8a8','#d83838'],sk=hsh(k,1,701)<.25?'#c89068':'#f6d2b0',hr=H[Math.floor(hsh(k,2,702)*H.length)],sh=S[Math.floor(hsh(k,3,703)*S.length)],up=hsh(k,4,704)<.3;
  R_(c,x,y+4,6,5,'#1c1c28');R_(c,x+1,y+5,4,4,sh);R_(c,x+1,y+5,4,1,hmix(sh,'#ffffff',.3));R_(c,x+1,y,4,5,'#1c1c28');R_(c,x+1,y+1,4,3,sk);R_(c,x+1,y,4,2,hr);R_(c,x+2,y+3,1,1,'#2a1c18');R_(c,x+4,y+3,1,1,'#2a1c18');
  if(up){R_(c,x-1,y-1,1,4,sk);R_(c,x+6,y-1,1,4,sk);R_(c,x-1,y-2,1,1,sk);R_(c,x+6,y-2,1,1,sk)}else{R_(c,x,y+6,1,2,sk);R_(c,x+5,y+6,1,2,sk)}}
// north grandstand: four packed tiers, banners, VIP box. w px wide, base line at y+H (H=96)
function drawGrandstand(c,x,y,w){const H=96,O='#1c1c28';
  R_(c,x,y,w,H,'#2a2236');
  for(let t=0;t<4;t++){const ty=y+6+t*18;R_(c,x,ty+12,w,6,STN.d);R_(c,x,ty+12,w,1,STN.l);R_(c,x,ty+17,w,1,STN.k);R_(c,x,ty,w,12,t%2?'#3a3048':'#342a42');
    for(let px_=x+2+(t%2)*4;px_<x+w-8;px_+=8){const k=px_*7+t*131;if(hsh(k,t,705)<.88)fan(c,px_,ty+2,k)}}
  // VIP box with canopy at the centre
  const vx=x+w/2-40;R_(c,vx-2,y-2,84,40,O);R_(c,vx,y,80,38,'#4a3a5a');for(let i=0;i<10;i++)R_(c,vx+i*8,y,8,9,i%2?CRIM.m:GOLD.l);R_(c,vx,y+9,80,2,GOLD.k);
  for(let i=0;i<4;i++)fan(c,vx+16+i*14,y+16,900+i);R_(c,vx+6,y+28,68,4,GOLD.m);R_(c,vx+6,y+28,68,1,GOLD.h);
  // front parapet with gold trim and hanging banners
  R_(c,x,y+H-22,w,22,O);R_(c,x,y+H-21,w,20,MARB.d);R_(c,x,y+H-21,w,4,MARB.l);R_(c,x,y+H-17,w,2,GOLD.m);R_(c,x,y+H-4,w,3,'#8a8294');
  for(let px_=x+6;px_<x+w-6;px_+=24)R_(c,px_,y+H-14,12,8,'#cfc6d4');
  for(let bx=x+40;bx<x+w-30;bx+=96){if(Math.abs(bx-(x+w/2))<60)continue;R_(c,bx-1,y+H-40,16,34,O);R_(c,bx,y+H-39,14,30,CRIM.m);R_(c,bx,y+H-39,2,30,CRIM.l);R_(c,bx+12,y+H-39,2,30,CRIM.d);R_(c,bx,y+H-39,14,3,GOLD.m);
    R_(c,bx+3,y+H-30,8,8,GOLD.m);R_(c,bx+5,y+H-28,4,4,GOLD.h);for(let k=0;k<3;k++)R_(c,bx+k*5,y+H-9,4,3,CRIM.d)}}
// marble column with a gold capital and a burning brazier on top (16 wide, base line at y+56)
function drawPillar(c,x,y,fr){const O='#1c1c28';R_(c,x+1,y+44,14,12,O);R_(c,x+2,y+45,12,10,MARB.d);R_(c,x+2,y+45,12,2,MARB.l);
  R_(c,x+3,y+14,10,32,O);R_(c,x+4,y+14,8,31,MARB.m);R_(c,x+4,y+14,2,31,MARB.h);R_(c,x+10,y+14,2,31,MARB.d);for(let yy=y+16;yy<y+44;yy+=6)R_(c,x+7,yy,1,4,'#cfc6d4');
  R_(c,x,y+9,16,6,O);R_(c,x+1,y+10,14,4,GOLD.m);R_(c,x+1,y+10,14,1,GOLD.h);R_(c,x+2,y+4,12,6,O);R_(c,x+3,y+5,10,4,'#3a3040');
  const f=fr?1:0;R_(c,x+4,y-3+f,8,8,'#d03a10');R_(c,x+5,y-6,6,8,'#f47a18');R_(c,x+6,y-8+f,4,7,'#f8c040');R_(c,x+7,y-10,2,5,'#fff2b8')}
// side bleachers seen from above: rows of heads and shoulders (flat decal)
function drawSideStands(c,x,y,w,h){R_(c,x,y,w,h,'#2a2236');for(let yy=y;yy<y+h;yy+=10){R_(c,x,yy+8,w,2,STN.d);for(let xx=x+2;xx<x+w-4;xx+=7){const k=xx*13+yy*7;if(hsh(k,9,706)>.85)continue;const S=['#e8502a','#3888c8','#f0c838','#58a058','#e87898','#8058b0','#38c8a8'],H=['#3a2a20','#c8782c','#e8c058','#1a1a22','#904828'];
    R_(c,xx,yy+3,6,5,S[Math.floor(hsh(k,1,707)*7)]);R_(c,xx+1,yy,4,4,'#f6d2b0');R_(c,xx+1,yy,4,2,H[Math.floor(hsh(k,2,708)*5)])}}}
// low marble railing (south side), base line at y+14
function drawRailing(c,x,y,w){const O='#1c1c28';R_(c,x,y+2,w,12,O);R_(c,x,y+3,w,10,MARB.d);R_(c,x,y+3,w,3,MARB.l);R_(c,x,y+6,w,1,GOLD.m);for(let i=x+4;i<x+w-4;i+=12)R_(c,i,y+8,6,4,'#cfc6d4')}
function drawLighthouse(c,x,y){// footprint 64 wide at (x,y) top of art; tower base at y+150
  const O='#1c1c28';R_(c,x+4,y+132,56,24,O);R_(c,x+5,y+133,54,22,'#d8d0c4');R_(c,x+5,y+133,54,3,'#f0ece4');R_(c,x+26,y+140,12,15,'#3a2a20');R_(c,x+27,y+141,10,14,'#5a3a28');R_(c,x+31,y+141,1,14,'#2a1a10');R_(c,x+35,y+147,1,2,'#f8c838');
  R_(c,x+5,y+128,54,5,'#8a3a3a');R_(c,x+5,y+128,54,1,'#c85a5a');
  for(let r=0;r<104;r++){const w=Math.round(20+r*.12),cx=x+32,yy=y+24+r,band=Math.floor(r/16)%2;R_(c,cx-w-1,yy,w*2+2,1,O);R_(c,cx-w,yy,w*2,1,band?'#c83838':'#f4f0e8');R_(c,cx-w,yy,3,1,band?'#e86060':'#ffffff');R_(c,cx+w-4,yy,4,1,band?'#8a2020':'#c8c0b4')}
  for(const wy of[40,72,104]){R_(c,x+29,y+wy,6,8,O);R_(c,x+30,y+wy+1,4,6,'#5a3a8a');R_(c,x+30,y+wy+1,2,2,'#c890f8')}
  R_(c,x+8,y+20,48,6,O);R_(c,x+9,y+21,46,4,'#3a3a48');for(let i=0;i<46;i+=4)R_(c,x+9+i,y+21,1,4,'#6a6a78');
  R_(c,x+14,y+6,36,15,O);R_(c,x+15,y+7,34,13,'#3a2a5a');c.globalAlpha=.85;R_(c,x+16,y+8,32,11,'#a040e0');c.globalAlpha=1;R_(c,x+26,y+9,12,9,'#e8b8ff');R_(c,x+29,y+10,6,6,'#ffffff');for(let i=0;i<34;i+=6)R_(c,x+15+i,y+7,1,13,O);
  R_(c,x+12,y-2,40,9,O);R_(c,x+13,y-1,38,7,'#8a3a3a');R_(c,x+13,y-1,38,2,'#c85a5a');R_(c,x+30,y-8,4,7,O);R_(c,x+31,y-7,2,6,'#f8c838')}
function drawFirePit(c,x,y,lit){R_(c,x+3,y+9,10,5,'#4a4038');R_(c,x+4,y+10,8,3,lit?'#2a1a10':'#6a6058');for(const[a,b]of[[1,10],[13,10],[2,13],[12,13],[7,8],[7,14]]){R_(c,x+a,y+b,3,2,'#55546a');R_(c,x+a,y+b,2,1,'#b2b4c6')}
  if(!lit){R_(c,x+5,y+10,3,1,'#8a8070');R_(c,x+9,y+11,2,1,'#3a3028')}else{R_(c,x+5,y+7,6,5,'#d03a10');R_(c,x+6,y+5,4,5,'#f47a18');R_(c,x+7,y+4,2,4,'#f8c040');R_(c,x+7,y+7,2,2,'#fff6c0')}}
function drawItemBall(c,x,y){R_(c,x+5,y+9,6,5,'#1c1c28');R_(c,x+6,y+9,4,2,'#e84848');R_(c,x+6,y+11,4,2,'#f4f4f4');R_(c,x+7,y+10,2,2,'#1c1c28');R_(c,x+7,y+9,1,1,'#ffb0a0')}
function tileDungeonWall(x0,y0,X,Y,c,G){const g=(dx,dy)=>G&&G[Y+dy]?.[X+dx];const top=g(0,-1)!==10,bot=g(0,1)!==10;
  R_(c,x0,y0,16,16,'#2a2438');for(let r=0;r<16;r+=4){R_(c,x0,y0+r,16,1,'#1a1626');const off=((Y*4+r)/4)%2?0:8;for(let i=off;i<16;i+=16)R_(c,x0+i,y0+r,1,4,'#1a1626');R_(c,x0+(off+4)%16,y0+r+1,5,1,'#3a3450')}
  if(hsh(X,Y,71)<.12){R_(c,x0+5,y0+6,3,3,'#4a2a5a');R_(c,x0+6,y0+7,1,1,'#a060d0')}
  if(top){R_(c,x0,y0,16,2,'#4a4460');R_(c,x0,y0,16,1,'#6a6484')}if(bot){R_(c,x0,y0+12,16,4,'#14101e');R_(c,x0,y0+12,16,1,'#3a3450')}}
function tileStairs(x0,y0,X,Y,c,G){R_(c,x0,y0,16,16,'#6a6458');for(let r=0;r<16;r+=4){R_(c,x0,y0+r,16,3,'#b2b4c6');R_(c,x0,y0+r,16,1,'#e2e4ee');R_(c,x0,y0+r+3,16,1,'#55546a')}
  const g=(dx,dy)=>G&&G[Y+dy]?.[X+dx];if(g(-1,0)!==11){R_(c,x0,y0,2,16,'#3e3228')}if(g(1,0)!==11){R_(c,x0+14,y0,2,16,'#3e3228')}}

/* ===== HEXWYRM (dragon/fire boss) ===== */
PAL.wyrm=RP('#0a0612','#1c0f2e','#30204c','#4a3072','#7454a8');
PAL.wbelly=RP('#2e0a04','#7a2a0e','#c0521a','#ec8a2a','#ffd070');
PAL.whorn=RP('#24180c','#5e4c30','#9c8862','#d4c69a','#f4ecd0');
PAL.wwing=RP('#12060c','#360a1a','#581424','#822438','#b04456');
function drawHexwyrm(dir,fr,st){const g=SG(64,64),P=PAL,F=P.wyrm,Wg=P.wwing,Bl=P.wbelly,Hn=P.whorn,b=fr?1:0,imm=st==='immune';
  const M=a=>a.map(([x,y])=>[64-x,y]),I=a=>a,EYE=imm?'#ffffff':'#ffe040',GLOW='#ff6a20',FANG='#f4f0e8',MAW=RP('#3a0804','#7a1408','#c8341a','#f88a2a','#ffe080');
  const L=(s,x0,y0,x1,y1,c)=>lineG(g,s?63-x0:x0,y0,s?63-x1:x1,y1,c),Px=(s,x,y,c)=>px(g,s?63-x:x,y,c);
  const seams=(pal,x0,x1,ys)=>{for(const y of ys)for(let x=x0;x<=x1;x++){const v=get(g,x,y);if(v&&v!==pal.line&&pal.r.includes(v))px(g,x,y,pal.r[0])}};
  const wing=(s,dy,top)=>{const T=s?M:I;part(g,PG(T([[24,26+dy],[14,10+b+dy],[3,2+b+dy],[1,14+b+dy],[5,22+dy],[2,30+dy],[8,35+dy],[6,42+dy],[13,39+dy],[18,44+dy],[23,36+dy]])),Wg,{lx:s?.55:-.55});
    for(const[x,y]of[[3,2],[4,22],[7,36],[13,40]])L(s,14,10+b+dy,x,y+(x===3?b:0)+dy,Wg.line);L(s,24,26+dy,14,10+b+dy,Wg.line);L(s,23,24+dy,14,9+b+dy,Wg.r[3]);
    part(g,PG(T([[12,10+b+dy],[14,3+b+dy],[17,10+b+dy]])),Hn);for(const[x,y]of[[6,12],[9,28],[11,34],[5,8]])Px(s,x,y+b+dy,top?Wg.r[0]:'#c85a20')};
  if(dir==='down'){
    wing(0,0);wing(1,0);
    part(g,PG([[38,50],[50,54],[57,52],[59,47],[61,53],[56,58],[44,59],[36,55]]),F);part(g,PG([[57,44],[63,49],[60,55],[55,50]]),Hn);
    for(const s of[0,1]){const T=s?M:I;part(g,PG(T([[17,42],[26,40],[28,52],[25,57],[15,57],[13,50]])),F);part(g,PG(T([[12,56],[26,55],[27,60],[11,61]])),F);
      for(const tx of[12,16,20,24]){Px(s,tx,61,FANG);Px(s,tx,62,FANG)}}
    part(g,PG([[22,26+b],[42,26+b],[46,36],[44,48],[38,54],[26,54],[20,48],[18,36]]),F);
    part(g,PG([[26,30+b],[38,30+b],[40,40],[37,51],[27,51],[24,40]]),Bl,{soft:1});seams(Bl,24,40,[33+b,36+b,39+b,42,45,48]);
    for(const s of[0,1]){L(s,21,37,23,42,'#b8300e');L(s,23,42,22,47,'#b8300e');Px(s,22,40,GLOW);
      const T=s?M:I;part(g,PG(T([[21,28+b],[14,20+b],[24,25+b]])),Hn);part(g,PG(T([[19,33+b],[12,29+b],[20,30+b]])),Hn);
      part(g,PG(T([[19,28+b],[25,32+b],[23,42],[19,47],[13,45],[14,36]])),F);for(const tx of[12,14,16,18]){Px(s,tx,46,FANG);Px(s,tx,47,FANG)}}
    part(g,PG([[27,29+b],[37,29+b],[36,18+b],[28,18+b]]),F);part(g,PG([[30,29+b],[34,29+b],[33,21+b],[31,21+b]]),Bl,{soft:1});seams(Bl,29,35,[23+b,26+b]);
    for(const s of[0,1]){const T=s?M:I;part(g,PG(T([[28,11+b],[22,8+b],[18,3+b],[17,-2+b],[21,1+b],[25,4+b],[30,8+b]])),Hn);part(g,PG(T([[24,14+b],[14,13+b],[7,8+b],[15,9+b],[23,11+b]])),Hn)}
    part(g,PG([[24,9+b],[40,9+b],[43,14+b],[39,20+b],[35,25+b],[29,25+b],[25,20+b],[21,14+b]]),F);
    part(g,PG([[30,10+b],[32,2+b],[34,10+b]]),Hn);
    for(const s of[0,1]){const T=s?M:I;part(g,PG(T([[21,10+b],[32,14+b],[31,16+b],[22,13+b]])),F,{flat:3});L(s,23,14+b,30,17+b,F.line);L(s,24,15+b,29,17+b,EYE);L(s,25,16+b,28,18+b,'#ff3a10');Px(s,27,17+b,'#ffffff')}
    part(g,PG([[28,20+b],[36,20+b],[35,26+b],[29,26+b]]),MAW);for(const x of[29,31,33,35]){px(g,x,21+b,FANG)}for(const x of[30,34])px(g,x,25+b,FANG);pxs(g,[[30,18+b],[33,18+b]],F.line);
  }else if(dir==='up'){
    part(g,PG([[30,50],[34,50],[36,58],[32,63],[28,58]]),F);part(g,PG([[29,58],[35,58],[32,64]]),Hn);
    for(const s of[0,1]){const T=s?M:I;part(g,PG(T([[17,42],[26,40],[28,52],[25,57],[15,57],[13,50]])),F);part(g,PG(T([[19,28],[25,32],[23,42],[19,47],[13,45],[14,36]])),F)}
    part(g,PG([[22,26+b],[42,26+b],[46,36],[44,48],[38,54],[26,54],[20,48],[18,36]]),F);
    for(let y=22;y<52;y+=5)part(g,PG([[30,y+3+b],[32,y-2+b],[34,y+3+b]]),Hn);
    part(g,PG([[27,29+b],[37,29+b],[36,18+b],[28,18+b]]),F);
    part(g,PG([[24,8+b],[40,8+b],[42,14+b],[37,20+b],[27,20+b],[22,14+b]]),F);
    for(const s of[0,1]){const T=s?M:I;part(g,PG(T([[28,10+b],[22,7+b],[18,2+b],[17,-2+b],[21,1+b],[25,4+b],[30,7+b]])),Hn);part(g,PG(T([[24,13+b],[14,12+b],[7,7+b],[15,8+b],[23,10+b]])),Hn)}
    wing(0,2,1);wing(1,2,1);
  }else{
    part(g,PG([[36,30],[46,6+b],[60,2+b],[63,14+b],[58,26],[50,32]]),Wg,{bias:-.4});
    part(g,PG([[44,46],[54,50],[60,46],[61,38],[63,44],[60,52],[52,56],[42,54]]),F);part(g,PG([[58,34],[63,38],[62,44],[58,41]]),Hn);
    part(g,PG([[34,42],[42,42],[42,54],[38,60],[31,60],[33,50]]),F,{bias:-.35});
    part(g,PG([[20,36],[32,28],[46,30],[52,40],[48,50],[30,52],[20,46]]),F);
    part(g,PG([[22,42],[32,46],[46,46],[44,51],[28,51],[21,46]]),Bl,{soft:1});seams(Bl,20,48,[]);for(const x of[26,31,36,41])lineG(g,x,44,x-1,51,Bl.r[0]);
    for(let x=26;x<50;x+=5)part(g,PG([[x,31+(x>40?1:0)],[x+3,24+(x>40?2:0)],[x+5,31+(x>40?1:0)]]),Hn);
    part(g,PG([[42,40],[52,42],[52,54],[48,60],[38,60],[40,50]]),F);part(g,PG([[36,57],[49,57],[49,61],[35,61]]),F);for(const x of[35,38,41])pxs(g,[[x,61],[x,62]],FANG);
    part(g,PG([[22,38],[30,42],[28,55],[22,60],[18,58],[22,52]]),F);for(const x of[17,19,21])pxs(g,[[x,59],[x,60]],FANG);
    part(g,PG([[18,40],[28,34],[22,18+b],[12,20+b]]),F);part(g,PG([[19,38],[23,36],[16,22+b],[14,24+b]]),Bl,{soft:1});
    part(g,PG([[17,12+b],[25,4+b],[32,0+b],[26,8+b],[20,14+b]]),Hn);part(g,PG([[18,16+b],[26,14+b],[29,11+b],[24,17+b]]),Hn);
    part(g,PG([[2,16+b],[10,10+b],[20,11+b],[23,18+b],[17,24+b],[11,22+b],[2,21+b]]),F);
    part(g,PG([[2,19+b],[12,19+b],[16,23+b],[10,26+b],[3,24+b]]),MAW);pxs(g,[[4,20+b],[7,20+b],[10,20+b],[5,23+b],[9,24+b]],FANG);
    part(g,PG([[8,10+b],[19,12+b],[19,14+b],[10,13+b]]),F,{flat:3});lineG(g,10,14+b,17,15+b,F.line);lineG(g,11,15+b,16,16+b,EYE);lineG(g,12,16+b,15,17+b,'#ff3a10');px(g,13,16+b,'#ffffff');px(g,3,17+b,F.line);
    part(g,PG([[30,32],[38,4+b],[48,0+b],[58,8+b],[60,20],[52,26],[54,34],[44,30],[38,38]]),Wg);
    for(const[x,y]of[[48,0],[60,20],[54,34]])lineG(g,38,5+b,x,y+(y<10?b:0),Wg.line);lineG(g,31,31,38,5+b,Wg.r[3]);part(g,PG([[36,6+b],[38,0+b],[40,6+b]]),Hn);
    lineG(g,24,36,28,42,'#b8300e');px(g,26,39,GLOW);
  }
  if(imm){for(let i=0;i<g.p.length;i++){const v=g.p[i];if(v&&v!==F.line)g.p[i]=hmix(v,'#e0c8ff',.38)}}
  return g}
