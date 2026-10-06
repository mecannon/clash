/* ================= R3D: Three.js 2.5D renderer (Gen-5 style) =================
 Renders every world view (overworld maps, trainer-battle cut-out, route mode, free-battle arena)
 in 3D when WebGL is available; the 2D canvas #cv stays on top as a transparent screen-space overlay.

 Coordinates: 1 unit = 1 world pixel. Ground = XZ plane, three.x = world x, three.z = world y, y = up.

 Pieces
 - Map scenes (cached per map object): a ground plane textured with a 2-frame bake (tiles + flat decos
   + the semi-transparent "shadow" pixels of upright decos) with a darkened out-of-bounds margin, one
   merged mesh of camera-facing cards (upright decos, obj trees/rocks, swaying tall-grass tufts, a forest
   band past tree-lined edges) packed into one atlas, and real box+gable geometry for houses, the lab,
   the guild, the mill and the greenhouse.
 - Cards lean so they are perpendicular to the camera pitch (rotation about X only, done in the vertex
   shader from a shared pitch uniform). DEVIATION / addition: card fragments write gl_FragDepth as if the
   card were a VERTICAL plane at its 2D sort line (deco.y, feet y). That reproduces the 2D y-sort exactly
   between cards and keeps sprites from clipping into real building walls they stand next to.
 - Entities are pooled billboards that reuse the existing HSPR/SPR canvases as textures (one texture per
   canvas, cached). Pods, balls and lab habitats are small per-frame composites of the 2D painters.
 - Effects: game.js render() was split (drawGroundFx / drawGhosts / drawOverFx / drawScreen and
   fighterGround / fighterOver). Ground fx (fires, rings, arena border) go to a world-space canvas on a
   plane just above the ground (depth tested); over fx (beams, projectiles, particles, HP bars, prompts,
   tethers, emotes) go to a second canvas plane drawn last without depth test. ptext() is remapped
   through the camera (PTX hook), offscreen arrows use PROJ, HK lifts HP bars to match card heights.
 - Camera: PerspectiveCamera (FOV 28). Overworld pitch 52 / ~240px wide, interiors 60 / 210, battle and
   route 60 / ~600. Smooth follow + clamp, battle-start swoop, ult punch-in + roll, shake, run pull-back.
   Mouse aim (M.x/M.y) comes from raycasting M.sx/M.sy onto the ground in updCam.
 - Post: render target + fullscreen pass with per-area grading, warm top tint, vignette, light tilt-shift
   blur on the top band only. Textures use a "sharp bilinear" lookup so pixel art stays crisp in perspective.
 - Toggle: R3D.on (localStorage 'typeclash_r3d'), overworld menu + pause screen buttons.
*/
const R3D=(()=>{
const R={ready:false,on:false};
const TH=typeof THREE!=='undefined'?THREE:null;
const glcv=document.getElementById('gl');
if(!TH||!glcv)return R;
let renderer=null;
try{renderer=new TH.WebGLRenderer({canvas:glcv,antialias:false,alpha:false,depth:true,stencil:false,powerPreference:'high-performance'})}catch(e){console.warn('R3D: WebGL unavailable -',e&&e.message);return R}
if(!renderer||!renderer.getContext())return R;
const GL2=renderer.capabilities.isWebGL2;
const HAS_DEPTH=GL2||!!renderer.extensions.get('EXT_frag_depth');
const HAS_DERIV=GL2||!!renderer.extensions.get('OES_standard_derivatives');
renderer.setPixelRatio(1);
const DEG=Math.PI/180,FOV=28,V3=TH.Vector3;
const OW_PITCH=52,INT_PITCH=60,BAT_PITCH=60;
const KV=1.32;            // wall height per art row (walls read 1:1 with cards at the overworld pitch)
const SINO=Math.sin(OW_PITCH*DEG),ROOF_T=Math.tan(35*DEG);

/* ---------- shaders ---------- */
const VS_CARD=`
attribute float aS;attribute float aX;attribute float aZd;attribute float aSway;attribute float aShade;
uniform vec2 uSize;uniform float uPitch;uniform float uZo;uniform vec4 uUv;uniform float uTime;
varying vec2 vUv;varying vec3 vW;varying float vZd;varying float vShade;
void main(){
  vUv=mix(uUv.xy,uUv.zw,uv);vShade=aShade;
  float h=aS*uSize.y;
  vec3 p=position+vec3(aX*uSize.x,h*cos(uPitch),-h*sin(uPitch));
  vec4 w=modelMatrix*vec4(p,1.);
  w.x+=aSway*min(aS,6.)*sin(uTime*1.1+w.x*.045+w.z*.07)*.12;
  vW=w.xyz;vZd=aZd+uZo+modelMatrix[3].z;
  gl_Position=projectionMatrix*viewMatrix*w;
}`;
const VS_FLAT=`
uniform vec4 uUv;varying vec2 vUv;varying vec3 vW;
void main(){vUv=mix(uUv.xy,uUv.zw,uv);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const FS=`
uniform sampler2D map;uniform vec2 uTexSize;uniform float uOpacity;uniform float uAlphaTest;uniform vec3 uTint;uniform float uSharp;
uniform vec4 uArena;uniform float uDim;uniform vec3 uFogCol;uniform vec3 uFog;uniform vec2 uFx;
uniform float uOccOn;uniform float uFlash;uniform vec4 uOccRect;uniform float uOccZ;uniform vec2 uNear;
varying vec2 vUv;varying vec3 vW;
float bayer(vec2 p){p=mod(floor(p),4.);vec4 r=p.y<.5?vec4(0.,8.,2.,10.):p.y<1.5?vec4(12.,4.,14.,6.):p.y<2.5?vec4(3.,11.,1.,9.):vec4(15.,7.,13.,5.);return((p.x<.5?r.x:p.x<1.5?r.y:p.x<2.5?r.z:r.w)+.5)/16.;}
#ifdef CARD
varying float vZd;varying float vShade;uniform mat4 uProj;
#endif
void main(){
  vec2 uv=vUv;
#ifdef SHARP
  if(uSharp>.5){vec2 px=uv*uTexSize;vec2 sm=floor(px+.5);vec2 d=max(fwidth(px),vec2(1e-5));px=sm+clamp((px-sm)/d,-.5,.5);uv=px/uTexSize;}
#endif
  vec4 c=texture2D(map,uv);
  if(c.a>0.)c.rgb/=c.a;
  c.a*=uOpacity;
  if(c.a<uAlphaTest)discard;
  c.rgb*=uTint;
  if(uOccOn>.5&&uOccRect.z>uOccRect.x){
#ifdef CARD
    float zq=vZd;
#else
    float zq=vW.z;
#endif
    if(zq>uOccZ+1.5){vec2 fc=gl_FragCoord.xy;vec2 dd=max(uOccRect.xy-fc,fc-uOccRect.zw);float e=max(dd.x,dd.y);float k=1.-smoothstep(0.,(uOccRect.w-uOccRect.y)*.35,e);
      if(mix(1.,.33,k)<bayer(fc*.5))discard;}}
  if(uOccOn>.5&&uNear.x>0.){float nk=1.-smoothstep(uNear.x,uNear.y,distance(vW,cameraPosition));if(nk>0.&&mix(1.,.4,nk)<bayer(gl_FragCoord.xy*.5+vec2(1.,2.)))discard;}
  c.rgb=mix(c.rgb,vec3(1.),uFlash);
#ifdef CARD
  c.rgb*=vShade;
#endif
  float o=step(vW.x,uArena.x)+step(uArena.z,vW.x)+step(vW.z,uArena.y)+step(uArena.w,vW.z);
  c.rgb=mix(c.rgb,c.rgb*vec3(.36,.40,.54),min(o,1.)*uDim*uFx.y);
  float f=smoothstep(uFog.x,uFog.y,distance(vW,cameraPosition))*uFog.z*uFx.x;
  c.rgb=mix(c.rgb,uFogCol,f);
  gl_FragColor=c;
#if defined(CARD)&&defined(DEPTH)
  vec3 rd=normalize(vW-cameraPosition);
  float t2=(vZd-cameraPosition.z)/min(rd.z,-1e-4);
  float t1=(.6-cameraPosition.y)/min(rd.y,-1e-4);
  float t=max(min(t1,t2),1.);
  vec4 cp=uProj*viewMatrix*vec4(cameraPosition+rd*t,1.);
  gl_FragDepthEXT=clamp(cp.z/cp.w*.5+.5,0.,1.);
#endif
}`;
const PVS=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const PFS=`
uniform sampler2D tSrc;uniform vec2 uRes;uniform vec3 uGain;uniform vec3 uLift;uniform float uSat;uniform float uVig;uniform float uTilt;uniform vec3 uTop;uniform float uTopAmt;
varying vec2 vUv;
void main(){
  vec2 uv=vUv;vec3 c=texture2D(tSrc,uv).rgb;
  float b=smoothstep(.85,1.,uv.y)*uTilt;
  if(b>.02){vec2 o=vec2(b*2.4)/uRes;vec3 s=c*.2;
    s+=texture2D(tSrc,uv+vec2(o.x,0.)).rgb*.1;s+=texture2D(tSrc,uv-vec2(o.x,0.)).rgb*.1;s+=texture2D(tSrc,uv+vec2(0.,o.y)).rgb*.1;s+=texture2D(tSrc,uv-vec2(0.,o.y)).rgb*.1;
    s+=texture2D(tSrc,uv+o).rgb*.1;s+=texture2D(tSrc,uv-o).rgb*.1;s+=texture2D(tSrc,uv+vec2(o.x,-o.y)).rgb*.1;s+=texture2D(tSrc,uv+vec2(-o.x,o.y)).rgb*.1;c=s;}
  c=c*uGain+uLift*(1.-c);
  float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,uSat);
  c=mix(c,c*uTop,uTopAmt*smoothstep(.35,1.,uv.y));
  vec2 d=uv-.5;d.x*=uRes.x/uRes.y*.6;c*=1.-uVig*smoothstep(.06,.42,dot(d,d));
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
}`;

/* ---------- shared state ---------- */
const U={uArena:{value:new TH.Vector4(-1e6,-1e6,1e6,1e6)},uDim:{value:0},uFogCol:{value:new TH.Color(0xffffff)},uFog:{value:new V3(1e5,2e5,0)},
  uProj:{value:new TH.Matrix4()},uOccRect:{value:new TH.Vector4(0,0,0,0)},uOccZ:{value:0},uNear:{value:new TH.Vector2(0,0)},uPitch:{value:OW_PITCH*DEG},uTime:{value:0}};
const scene=new TH.Scene();scene.background=new TH.Color(0x101418);
const cam=new TH.PerspectiveCamera(FOV,16/9,8,6000);
const dyn=new TH.Group();scene.add(dyn);
const rt=new TH.WebGLRenderTarget(16,16,{minFilter:TH.NearestFilter,magFilter:TH.NearestFilter,depthBuffer:true,stencilBuffer:false});
const postU={tSrc:{value:rt.texture},uRes:{value:new TH.Vector2(16,16)},uGain:{value:new V3(1,1,1)},uLift:{value:new V3(0,0,0)},uSat:{value:1},uVig:{value:.3},uTilt:{value:1},uTop:{value:new V3(1,1,1)},uTopAmt:{value:0}};
const postScene=new TH.Scene(),postCam=new TH.OrthographicCamera(-1,1,1,-1,0,1);
{const g=new TH.BufferGeometry();g.setAttribute('position',new TH.BufferAttribute(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));g.setAttribute('uv',new TH.BufferAttribute(new Float32Array([0,0,2,0,0,2]),2));
 const q=new TH.Mesh(g,new TH.ShaderMaterial({uniforms:postU,vertexShader:PVS,fragmentShader:PFS,depthTest:false,depthWrite:false}));q.frustumCulled=false;postScene.add(q)}

/* ---------- textures & materials ---------- */
const TEX=new WeakMap();
function mkTex(cv){const t=new TH.CanvasTexture(cv);t.magFilter=TH.LinearFilter;t.minFilter=TH.LinearFilter;t.generateMipmaps=false;t.premultiplyAlpha=true;t.wrapS=t.wrapT=TH.ClampToEdgeWrapping;return t}
function texFor(cv){let t=TEX.get(cv);if(!t){t=mkTex(cv);TEX.set(cv,t)}return t}
const WHITE=mkTex((()=>{const c=mkCanvas(2,2),x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,2,2);return c})());
function mat(o){const tex=o.map||WHITE;
  const uni={map:{value:tex},uTexSize:{value:new TH.Vector2(tex.image.width,tex.image.height)},uOpacity:{value:o.opacity??1},uAlphaTest:{value:o.alphaTest??.5},uTint:{value:new TH.Color(o.tint??0xffffff)},
    uSharp:{value:o.sharp===false?0:1},uOccOn:{value:o.occ?1:0},uFlash:{value:0},uUv:{value:new TH.Vector4(0,0,1,1)},uSize:{value:new TH.Vector2(1,1)},uZo:{value:0},uFx:{value:new TH.Vector2(o.fog===false?0:1,o.dim===false?0:1)}};
  for(const k in U)uni[k]=U[k];
  const defs={};if(o.card)defs.CARD=1;if(o.card&&HAS_DEPTH)defs.DEPTH=1;if(HAS_DERIV)defs.SHARP=1;
  return new TH.ShaderMaterial({uniforms:uni,vertexShader:o.card?VS_CARD:VS_FLAT,fragmentShader:FS,defines:defs,transparent:!!o.transparent,depthTest:o.depthTest!==false,depthWrite:o.depthWrite!==false,
    side:o.side||TH.FrontSide,extensions:{derivatives:HAS_DERIV,fragDepth:!!o.card&&HAS_DEPTH}})}
function setTex(m,t){const u=m.uniforms;if(u.map.value!==t){u.map.value=t;u.uTexSize.value.set(t.image.width,t.image.height)}}
function cardAttrs(g,n){for(const[k,v]of[['aS',0],['aX',0],['aZd',0],['aSway',0],['aShade',1]])g.setAttribute(k,new TH.BufferAttribute(new Float32Array(n).fill(v),1))}
const QUAD=(()=>{const g=new TH.BufferGeometry();g.setAttribute('position',new TH.BufferAttribute(new Float32Array(12),3));g.setAttribute('uv',new TH.BufferAttribute(new Float32Array([0,0,1,0,1,1,0,1]),2));
  cardAttrs(g,4);g.attributes.aX.array.set([-.5,.5,.5,-.5]);g.attributes.aS.array.set([0,0,1,1]);g.setIndex([0,1,2,0,2,3]);return g})();
const FLATQ=(()=>{const g=new TH.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);return g})();
const BLOB=mkTex((()=>{const c=mkCanvas(64,32),x=c.getContext('2d'),g=x.createRadialGradient(32,16,2,32,16,32);g.addColorStop(0,'rgba(10,16,24,.62)');g.addColorStop(.55,'rgba(10,16,24,.42)');g.addColorStop(1,'rgba(10,16,24,0)');x.setTransform(1,0,0,.5,0,8);x.fillStyle=g;x.beginPath();x.arc(32,16,32,0,6.283);x.fill();return c})());
const hex=(c)=>{if(!c||c.length<7)return[128,128,128];return[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]};

/* ---------- per-area look ---------- */
const LOOK={
  town:{bg:'#1f3a26',fog:'#d8ecd0',fogAmt:.32,gain:[1.05,1.015,.94],lift:[.018,.012,0],sat:1.1,top:[1.06,1.0,.86],topAmt:.28,vig:.34},
  route1:{bg:'#142a1a',fog:'#d4e6d0',fogAmt:.55,fogN:.75,fogF:1.45,gain:[.97,1.01,.95],lift:[.004,.01,.02],sat:1.0,top:[1.0,1.06,.92],topAmt:.22,vig:.36},
  millhaven:{bg:'#2a2a36',fog:'#f4d6b0',fogAmt:.38,gain:[1.08,.99,.88],lift:[.0,.012,.05],sat:1.06,top:[1.12,.96,.78],topAmt:.42,vig:.4},
  route2:{bg:'#1a3040',fog:'#d8ecf4',fogAmt:.5,fogN:.75,fogF:1.5,gain:[.98,1.01,1.03],lift:[.0,.01,.03],sat:1.06,top:[1.0,1.04,1.08],topAmt:.3,vig:.34},
  lighthouse:{bg:'#0e0a18',fog:'#2a1a3a',fogAmt:.55,fogN:.6,fogF:1.3,gain:[.92,.88,1.04],lift:[.02,0,.05],sat:.95,top:[.95,.85,1.1],topAmt:.35,vig:.62},
  coliseum:{bg:'#1a1424',fog:'#f4e2c8',fogAmt:.25,gain:[1.06,1.0,.94],lift:[.02,.008,0],sat:1.1,top:[1.1,1.0,.86],topAmt:.3,vig:.36},
  coliseum_free:{bg:'#1a1424',fog:'#f4e2c8',fogAmt:.25,gain:[1.06,1.0,.94],lift:[.02,.008,0],sat:1.1,top:[1.1,1.0,.86],topAmt:.3,vig:.36},
  shoal:{bg:'#1a3040',fog:'#d8ecf4',fogAmt:.45,fogN:.75,fogF:1.5,gain:[1.0,1.01,1.03],lift:[.0,.01,.03],sat:1.08,top:[1.0,1.04,1.08],topAmt:.3,vig:.32},
  route3:{bg:'#16281a',fog:'#dce8d0',fogAmt:.5,fogN:.75,fogF:1.5,gain:[1.0,1.01,.95],lift:[.006,.01,.02],sat:1.05,top:[1.04,1.04,.9],topAmt:.24,vig:.34},
  free:{bg:'#142a1a',fog:'#d4e6d0',fogAmt:.5,fogN:.75,fogF:1.45,gain:[.98,1.01,.95],lift:[.004,.01,.02],sat:1.02,top:[1.02,1.04,.9],topAmt:.2,vig:.34},
  interior:{bg:'#1d1612',fog:'#000000',fogAmt:0,gain:[1.04,1.0,.95],lift:[.012,.006,0],sat:1.05,top:[1.04,.98,.9],topAmt:.18,vig:.5},
};
function lookFor(def){return def.interior?LOOK.interior:(LOOK[def.id]||LOOK.town)}

/* ---------- bake helpers ---------- */
function alphaOf(v){if(typeof v!=='string')return 1;if(v[0]==='#'){if(v.length===9)return parseInt(v.slice(7),16)/255;if(v.length===5)return parseInt(v[4]+v[4],16)/255;return 1}
  const m=/rgba?\(([^)]*)\)/.exec(v);if(m){const p=m[1].split(/[ ,\/]+/).filter(Boolean);return p.length>3?parseFloat(p[3])*(p[3].endsWith('%')?.01:1):1}return 1}
// Proxy around the bake scratch context: tracks the drawn bounds, routes see-through fills (alpha < .5: contact shadows)
// to the ground bake instead, and records solid rects so building colours can be sampled without any pixel readback.
function trackCtx(real,st,P,gcs,M){
  const add=(x,y,w,h,col)=>{const m=real.getTransform();let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const[px,py]of[[x,y],[x+w,y],[x,y+h],[x+w,y+h]]){const X=m.a*px+m.c*py+m.e,Y=m.b*px+m.d*py+m.f;a=Math.min(a,X);b=Math.min(b,Y);c=Math.max(c,X);d=Math.max(d,Y)}
    st.x0=Math.min(st.x0,a);st.y0=Math.min(st.y0,b);st.x1=Math.max(st.x1,c);st.y1=Math.max(st.y1,d);if(col)st.rects.push({x:a-P,y:b-P,w:c-a,h:d-b,col})};
  const toG=f=>{const m=real.getTransform();for(const g of gcs){g.save();g.setTransform(m.a,m.b,m.c,m.d,m.e-P+M,m.f-P+M);g.fillStyle=real.fillStyle;g.globalAlpha=real.globalAlpha;f(g);g.restore()}st.sh=1};
  const wrap={fillRect:(x,y,w,h)=>{if(alphaOf(real.fillStyle)*real.globalAlpha<.5){toG(g=>g.fillRect(x,y,w,h));return}add(x,y,w,h,typeof real.fillStyle==='string'?real.fillStyle:null);real.fillRect(x,y,w,h)},
    drawImage:(img,...a)=>{if(real.globalAlpha<.5){toG(g=>g.drawImage(img,...a));return}if(a.length===2)add(a[0],a[1],img.width,img.height);else if(a.length===4)add(a[0],a[1],a[2],a[3]);else add(a[4],a[5],a[6],a[7]);real.drawImage(img,...a)},
    strokeRect:(...a)=>{st.unk=1;real.strokeRect(...a)},putImageData:(...a)=>{st.unk=1;real.putImageData(...a)},fill:(...a)=>{st.unk=1;real.fill(...a)},stroke:(...a)=>{st.unk=1;real.stroke(...a)},
    fillText:(...a)=>{st.unk=1;real.fillText(...a)},strokeText:(...a)=>{st.unk=1;real.strokeText(...a)}};
  return new Proxy(real,{get(t,k){if(k in wrap)return wrap[k];const v=t[k];return typeof v==='function'?v.bind(t):v},set(t,k,v){t[k]=v;return true}})}
// Building painters get real geometry. They are detected by temporarily wrapping the global painter during the bake.
const BLD={drawHouse:{roof:[-16,45],wall:[45,80],body:[-1,97]},drawLab:{roof:[-24,42],wall:[42,96],body:[-1,129]},drawGuild:{roof:[-45,46],wall:[46,112],body:[-1,193]},
  drawMill:{roof:[-3,40],wall:[40,96],body:[-1,97]},drawGreenhouse:{roof:[-14,16],wall:[16,48],body:[0,64]}};
const LOW={drawBed:1,drawTable:1,drawLabTable:1};
let CAPT=null;
function withPainters(fn){const saved={};
  for(const k of[...Object.keys(BLD),...Object.keys(LOW)]){const o=window[k];if(typeof o!=='function')continue;saved[k]=o;try{window[k]=function(c,X,Y,...r){if(CAPT)CAPT.push({k,X,Y});return o.call(this,c,X,Y,...r)}}catch(e){}}
  try{return fn()}finally{for(const k in saved){try{window[k]=saved[k]}catch(e){}}}}
let PARTS=null;
// trees: per-tile variants from treeCv(X,Y) (art ends on row 31); shadows are flat decals (drawTreeShadow / drawRockShadow)
function parts(){if(PARTS)return PARTS;if(!TREE_CV){TREE_CV=treeSprite();ROCK_CV=rockSprite()}
  const ts=mkCanvas(16,10);ts.getContext('2d').drawImage(TALL_OVER,0,0);
  PARTS={ent:new Map(),rock:{cv:ROCK_CV},tall:{cv:ts}};return PARTS}
function treeEnt(pt,X,Y){const cv=treeCv(X,Y);let e=pt.ent.get(cv);if(!e){e={cv};pt.ent.set(cv,e)}return e}

/* ---------- map scene bake ---------- */
function bake(def){
  const t0=performance.now();
  const PW=def.w*16,PH=def.h*16,M=def.interior?64:192,GW=PW+2*M,GH=PH+2*M,P=128;
  const look=lookFor(def),pt=parts();const TM0=performance.now()-t0;
  const group=new TH.Group();const disp=[];
  const TM=['parts:'+Math.round(TM0)];const tm=n=>TM.push(n+':'+Math.round(performance.now()-t0));
  const tiles=[def.tiles(0),def.tiles(1)];tm('tiles');
  const gcv=tiles.map(tc=>{const cv=mkCanvas(GW,GH),c=cv.getContext('2d');c.imageSmoothingEnabled=false;
    if(def.interior){c.fillStyle='#1d1612';c.fillRect(0,0,GW,GH)}
    else{const T=M/16;for(let Y=-T;Y<def.h+T;Y++)for(let X=-T;X<def.w+T;X++){if(X>=0&&Y>=0&&X<def.w&&Y<def.h)continue;const x0=X*16+M,y0=Y*16+M;
        if(hsh(X,Y,61)<.18)tileTall(x0,y0,X,Y,c);else tileGrass(x0,y0,X,Y,c);
        const d=Math.max(X<0?-X:X>=def.w?X-def.w+1:0,Y<0?-Y:Y>=def.h?Y-def.h+1:0);c.fillStyle='rgba(10,26,18,'+Math.min(.62,.16+d*.05)+')';c.fillRect(x0,y0,16,16)}}
    c.drawImage(tc,M,M);c.translate(M,M);return c});
  tm('margin');const scratch=mkCanvas(PW+2*P,PH+2*P),sc=scratch.getContext('2d');sc.imageSmoothingEnabled=false;sc.translate(P,P);
  const st={},px=trackCtx(sc,st,P,gcv,M);
  const cards=[],blds=[];
  const list=def.decos.map((d,i)=>({d,i})).sort((a,b)=>a.d.y-b.d.y||a.i-b.i);
  if(def.interior){const wl=list.filter(o=>!o.d.flat&&o.d.y<=10);if(wl.length){const rest=list.filter(o=>!wl.includes(o));list.length=0;list.push({d:{y:-1,fn:c=>{for(const o of wl)o.d.fn(c)}},i:-1},...rest)}}
  withPainters(()=>{for(const{d}of list){
    if(d.flat){for(const c of gcv){c.save();try{d.fn(c)}catch(e){}c.restore()}continue}
    Object.assign(st,{x0:1e9,y0:1e9,x1:-1e9,y1:-1e9,unk:0,sh:0,rects:[]});CAPT=[];
    sc.save();try{d.fn(px)}catch(e){console.warn('R3D deco',e)}sc.restore();const cap=CAPT;CAPT=null;
    const x0=Math.max(0,Math.floor(st.x0)),y0=Math.max(0,Math.floor(st.y0)),x1=Math.min(scratch.width,Math.ceil(st.x1)),y1=Math.min(scratch.height,Math.ceil(st.y1));
    if(st.unk){// unknown drawing ops: fall back to baking it flat
      sc.save();sc.setTransform(1,0,0,1,0,0);sc.clearRect(0,0,scratch.width,scratch.height);sc.restore();for(const c of gcv){c.save();try{d.fn(c)}catch(e){}c.restore()}continue}
    if(x1<=x0||y1<=y0)continue;const w=x1-x0,h=y1-y0;
    if(d.y<y0-P-1&&y1-P>48&&!cap.length){// sorted under everything but spread over the map (e.g. flower clumps): it behaves as a ground decal
      for(const c of gcv)c.drawImage(scratch,x0,y0,w,h,x0-P,y0-P,w,h);sc.save();sc.setTransform(1,0,0,1,0,0);sc.clearRect(x0,y0,w,h);sc.restore();continue}
    const cv=mkCanvas(w,h);cv.getContext('2d').drawImage(scratch,x0,y0,w,h,0,0,w,h);
    sc.save();sc.setTransform(1,0,0,1,0,0);sc.clearRect(x0,y0,w,h);sc.restore();
    const mx=x0-P,my=y0-P;
    if(cap.length===1&&BLD[cap[0].k])blds.push({cap:cap[0],cv,w,h,mx,my,rects:st.rects});
    else if(cap.length&&cap.every(c=>LOW[c.k])){// low furniture: top-down art flat on the floor + a short front face card
      const K=Math.min(7,h),bx=boxMesh(cv,w,h,K,Math.round(K*1.35),disp);bx.position.set(mx,0,my);group.add(bx)}
    else cards.push({cv,x:mx,top:my,zd:(def.interior&&d.y>=0&&d.y<=10)?d.y+5:d.y});
  }});
  tm('decos');
  // obj trees / rocks
  const place=[];// {e,x,zg,zd,sway,shade}
  const rE=pt.rock,gE=pt.tall;
  for(let Y=0;Y<def.h;Y++)for(let X=0;X<def.w;X++){const o=def.obj[Y][X];
    if(o===1){for(const c of gcv)drawTreeShadow(c,X,Y);place.push({e:treeEnt(pt,X,Y),x:X*16+Math.round((hsh(X,Y,41)-.5)*4),zg:Y*16+32+Math.round((hsh(X,Y,42)-.5)*4),zd:Y*16+31,shade:.94+hsh(X,Y,43)*.08,flip:hsh(X,Y,44)<.5})}
    else if(o===2){for(const c of gcv)drawRockShadow(c,X,Y);place.push({e:rE,x:X*16,zg:Y*16+16,zd:Y*16+15,shade:1})}}
  // swaying tall-grass tufts
  if(!def.interior)for(let Y=0;Y<def.h;Y++)for(let X=0;X<def.w;X++)if(def.ground[Y][X]===3&&!def.obj[Y][X]){
    for(const k of[8,16])place.push({e:gE,x:X*16,zg:Y*16+k,zd:Y*16+k-.6,sway:1,shade:k===8?.9:1})}
  // forest band past tree-lined edges (also hides the void)
  if(!def.interior){const T=Math.floor(M/16);
    const nearEdgeTree=(cx,cy)=>{for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const ex=cx+dx,ey=cy+dy;if(ex<0||ey<0||ex>=def.w||ey>=def.h)continue;if(Math.min(ex,ey,def.w-1-ex,def.h-1-ey)>2)continue;const o=def.obj[ey][ex];if(o===1||o===9)return true}return false};
    let n=0;for(let py=-T*16;py<PH+T*16-16;py+=22)for(let px=-T*16;px<PW+T*16;px+=21){n++;const X=Math.floor(px/16),Y=Math.floor(py/16);
      if(px>-30&&px<PW-2&&py>-30&&py<PH-14)continue;if(!nearEdgeTree(clamp(X,0,def.w-1),clamp(Y,0,def.h-1)))continue;
      const jx=Math.round((hsh(n,7,71)-.5)*10),jy=Math.round((hsh(n,9,73)-.5)*8),d=Math.max(-px,px-PW,-py,py-PH,0);
      for(const c of gcv){c.fillStyle='rgba(6,18,10,.28)';c.fillRect(px+jx+5,py+jy+28,22,4)}
      place.push({e:treeEnt(pt,n,5),x:px+jx,zg:py+32+jy,zd:py+31+jy,shade:Math.max(.42,.72-d*.0022)-hsh(n,2,72)*.08,flip:hsh(n,4,74)<.5})}}
  for(const c of cards)place.push({e:c,x:c.x,zg:c.top+c.cv.height,zd:c.zd,shade:1});
  // atlas
  const ents=[...new Set(place.map(p=>p.e))].sort((a,b)=>b.cv.height-a.cv.height);
  const AW=2048;let ax=0,ay=0,sh=0;for(const e of ents){const w=e.cv.width+2,h=e.cv.height+2;if(ax+w>AW){ax=0;ay+=sh;sh=0}e.ax=ax+1;e.ay=ay+1;ax+=w;sh=Math.max(sh,h)}
  const AH=Math.max(4,ay+sh);const atlas=mkCanvas(AW,AH),ac=atlas.getContext('2d');for(const e of ents)ac.drawImage(e.cv,e.ax,e.ay);

  if(place.length){const n=place.length,pos=new Float32Array(n*12),uv=new Float32Array(n*8),aS=new Float32Array(n*4),aZd=new Float32Array(n*4),aSw=new Float32Array(n*4),aSh=new Float32Array(n*4),idx=new Uint32Array(n*6);
    place.forEach((p,i)=>{const e=p.e,w=e.cv.width,h=e.cv.height,ua=e.ax/AW,ub=(e.ax+w)/AW,u0=p.flip?ub:ua,u1=p.flip?ua:ub,v1=1-e.ay/AH,v0=1-(e.ay+h)/AH;
      const ey=elevAt(def,p.x+w/2,p.zg-2);pos.set([p.x,ey,p.zg+.01,p.x+w,ey,p.zg+.01,p.x+w,ey,p.zg+.01,p.x,ey,p.zg+.01],i*12);uv.set([u0,v0,u1,v0,u1,v1,u0,v1],i*8);aS.set([0,0,h,h],i*4);aZd.fill(p.zd,i*4,i*4+4);aSw.fill(p.sway||0,i*4,i*4+4);aSh.fill(p.shade||1,i*4,i*4+4);
      idx.set([i*4,i*4+1,i*4+2,i*4,i*4+2,i*4+3],i*6)});
    const g=new TH.BufferGeometry();g.setAttribute('position',new TH.BufferAttribute(pos,3));g.setAttribute('uv',new TH.BufferAttribute(uv,2));cardAttrs(g,n*4);
    g.attributes.aS.array.set(aS);g.attributes.aZd.array.set(aZd);g.attributes.aSway.array.set(aSw);g.attributes.aShade.array.set(aSh);g.setIndex(new TH.BufferAttribute(idx,1));
    const at=mkTex(atlas),m=mat({card:1,map:at,occ:1});const mesh=new TH.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=0;group.add(mesh);disp.push(g,m,at)}
  tm('atlas');for(const b of blds)buildBuilding(b,group,disp,cards=>{});
  // interiors: real side walls from the wall art
  if(def.interior&&typeof drawWall==='function'){const Hs=40,wc=mkCanvas(Math.max(16,PH),32),wx=wc.getContext('2d');for(let x=0;x<PH;x+=16)drawWall(wx,x,0,!!def.lab);
    const wt=mkTex(wc),wm=mat({map:wt,tint:0xb4b0b8,side:TH.DoubleSide,occ:1});const g=new TH.BufferGeometry();
    g.setAttribute('position',new TH.BufferAttribute(new Float32Array([0,0,PH,0,0,0,0,Hs,0,0,Hs,PH, PW,0,0,PW,0,PH,PW,Hs,PH,PW,Hs,0]),3));
    g.setAttribute('uv',new TH.BufferAttribute(new Float32Array([1,0,0,0,0,1,1,1, 0,0,1,0,1,1,0,1]),2));g.setIndex([0,1,2,0,2,3,4,5,6,4,6,7]);
    const me=new TH.Mesh(g,wm);me.frustumCulled=false;group.add(me);disp.push(g,wm,wt);
    const cap=mat({tint:0x3a2c24,side:TH.DoubleSide,sharp:false});const g2=new TH.BufferGeometry();
    g2.setAttribute('position',new TH.BufferAttribute(new Float32Array([-4,Hs,PH,0,Hs,PH,0,Hs,-4,-4,Hs,-4, PW,Hs,PH,PW+4,Hs,PH,PW+4,Hs,-4,PW,Hs,-4]),3));g2.setAttribute('uv',new TH.BufferAttribute(new Float32Array(16).fill(.5),2));g2.setIndex([0,1,2,0,2,3,4,5,6,4,6,7]);
    const m2=new TH.Mesh(g2,cap);m2.frustumCulled=false;group.add(m2);disp.push(g2,cap)}
  // ground
  const gtex=gcv.map(c=>mkTex(c.canvas));const gm=mat({map:gtex[0],depthWrite:false});
  const gmesh=new TH.Mesh(FLATQ,gm);gmesh.scale.set(GW,1,GH);gmesh.position.set(PW/2,0,PH/2);gmesh.renderOrder=-2;gmesh.frustumCulled=false;group.add(gmesh);disp.push(gm,...gtex);
  buildElevation(def,group,disp,gtex,GW,GH,M);
  tm('end');const ms={def,group,gtex,gm,look,PW,PH,M,disp,ms:performance.now()-t0,tm:TM.join(' ')};
  return ms}

// solid textured box for low props: top face = art rows [0,h-K), front face = last K rows, darker sides
// ---- elevation: raised tiles (elev grid or cliff code 10) get a top at EH and rock faces; code 11 = stairs ramping up northward
const EH_ROUTE=26,EH_DUNGEON=26;
function elevOf(def){if(def.__ev)return def.__ev;const H=def.dungeon?EH_DUNGEON:EH_ROUTE;
  // level of a tile: def.elev holds 0..N tiers; cliff rims (ground 10) are at least tier 1
  const lv=(X,Y)=>{if(X<0||Y<0||X>=def.w||Y>=def.h)return 0;const e=def.elev?def.elev[Y][X]||0:0;return def.ground[Y][X]===10?Math.max(1,e):e};
  const hi=(X,Y)=>lv(X,Y)>0&&def.ground[Y]?.[X]!==11;
  const st=(X,Y)=>X>=0&&Y>=0&&X<def.w&&Y<def.h&&def.ground[Y][X]===11;
  const ramp={};for(let X=0;X<def.w;X++)for(let Y=0;Y<def.h;Y++)if(st(X,Y)&&!st(X,Y+1)){let t=Y;while(st(X,t-1))t--;let A=lv(X,t-1),B=lv(X,Y+1);if(A===B)A=B+1;const R={top:t*16,bot:(Y+1)*16,a:A,b:B,lo:Math.min(A,B),hi:Math.max(A,B)};for(let k=t;k<=Y;k++)ramp[X+','+k]=R}
  def.__ev={H,hi,st,lv,ramp,any:false};for(let Y=0;Y<def.h&&!def.__ev.any;Y++)for(let X=0;X<def.w;X++)if(hi(X,Y)||st(X,Y)){def.__ev.any=true;break}return def.__ev}
function elevAt(def,x,y){if(!def)return 0;const ev=elevOf(def);if(!ev.any)return 0;const X=Math.floor(x/16),Y=Math.floor(y/16);const r=ev.ramp[X+','+Y];if(r)return ev.H*(r.b+(r.a-r.b)*clamp((r.bot-y)/(r.bot-r.top),0,1));const L=ev.lv(X,Y);return L*ev.H}
function EL(x,y){return ACTIVE?elevAt(ACTIVE.def,x,y):0}
let ROCKTEX=null;
function rockTex(dungeon){const cv=mkCanvas(16,32),c=cv.getContext('2d');if(dungeon){c.fillStyle='#2a2438';c.fillRect(0,0,16,32);for(let r=0;r<32;r+=5){c.fillStyle='#1a1626';c.fillRect(0,r,16,1);c.fillRect((r*3)%16,r,1,5);c.fillStyle='#3a3450';c.fillRect(((r*3)+4)%16,r+1,5,1)}c.fillStyle='#14101e';c.fillRect(0,28,16,4)}
  else{c.fillStyle='#7a6a5a';c.fillRect(0,0,16,32);for(let r=0;r<32;r+=4){c.fillStyle='#5a4a3e';c.fillRect(0,r,16,1);for(let i=(r*5)%6;i<16;i+=6)c.fillRect(i,r+1,1,3)}c.fillStyle='#a8988a';for(let i=0;i<8;i++)c.fillRect((i*7)%14,(i*11)%30,2,1);c.fillStyle='#4f9a3e';c.fillRect(0,0,16,2);c.fillStyle='#2f6e34';c.fillRect(0,2,16,1);c.fillStyle='#3e3228';c.fillRect(0,29,16,3)}
  const t=mkTex(cv);t.wrapS=t.wrapT=TH.RepeatWrapping;return t}
function buildElevation(def,group,disp,gtex,GW,GH,M){const ev=elevOf(def);if(!ev.any)return;const H=ev.H;
  const tp=[],tu=[],ti=[],sp=[],su=[],si=[];let tn=0,sn=0;
  const top=(x0,z0,x1,z1,h0,h1)=>{tp.push(x0,h0,z0,x1,h0,z0,x1,h1,z1,x0,h1,z1);const U=x=>(M+x)/GW,V=z=>1-(M+z)/GH;tu.push(U(x0),V(z0),U(x1),V(z0),U(x1),V(z1),U(x0),V(z1));ti.push(tn,tn+1,tn+2,tn,tn+2,tn+3);tn+=4};
  const face=(ax,az,bx,bz,h1,h0=0)=>{const L=Math.hypot(bx-ax,bz-az)/16;sp.push(ax,h0,az,bx,h0,bz,bx,h1,bz,ax,h1,az);su.push(0,h0/32,L,h0/32,L,h1/32,0,h1/32);si.push(sn,sn+1,sn+2,sn,sn+2,sn+3);sn+=4};
  const lowN=(X,Y)=>ev.st(X,Y)?99:ev.lv(X,Y);
  for(let Y=0;Y<def.h;Y++)for(let X=0;X<def.w;X++){const x0=X*16,z0=Y*16,x1=x0+16,z1=z0+16;
    if(ev.hi(X,Y)){const L=ev.lv(X,Y),h=L*H;top(x0,z0,x1,z1,h,h);
      let n=lowN(X,Y+1);if(n<L)face(x0,z1,x1,z1,h,n*H);n=lowN(X-1,Y);if(n<L)face(x0,z0,x0,z1,h,n*H);n=lowN(X+1,Y);if(n<L)face(x1,z1,x1,z0,h,n*H);n=lowN(X,Y-1);if(n<L)face(x1,z0,x0,z0,h,n*H)}
    else if(ev.st(X,Y)){const r=ev.ramp[X+','+Y],hz=z=>H*(r.b+(r.a-r.b)*clamp((r.bot-z)/(r.bot-r.top),0,1)),h0=hz(z0),h1=hz(z1),b=r.lo*H;tp.push(x0,h0,z0,x1,h0,z0,x1,h1,z1,x0,h1,z1);
      const U=x=>(M+x)/GW,V=z=>1-(M+z)/GH;tu.push(U(x0),V(z0),U(x1),V(z0),U(x1),V(z1),U(x0),V(z1));ti.push(tn,tn+1,tn+2,tn,tn+2,tn+3);tn+=4;
      if(!ev.st(X-1,Y)&&ev.lv(X-1,Y)<r.hi){sp.push(x0,b,z0,x0,b,z1,x0,h1,z1,x0,h0,z0);su.push(0,0,1,0,1,(h1-b)/32,0,(h0-b)/32);si.push(sn,sn+1,sn+2,sn,sn+2,sn+3);sn+=4}
      if(!ev.st(X+1,Y)&&ev.lv(X+1,Y)<r.hi){sp.push(x1,b,z1,x1,b,z0,x1,h0,z0,x1,h1,z1);su.push(0,0,1,0,1,(h0-b)/32,0,(h1-b)/32);si.push(sn,sn+1,sn+2,sn,sn+2,sn+3);sn+=4}}}
  const mkG=(p,u,i)=>{const g=new TH.BufferGeometry();g.setAttribute('position',new TH.BufferAttribute(new Float32Array(p),3));g.setAttribute('uv',new TH.BufferAttribute(new Float32Array(u),2));g.setIndex(new TH.BufferAttribute(new Uint32Array(i),1));return g};
  if(tn){const g=mkG(tp,tu,ti),m=mat({map:gtex[0],side:TH.DoubleSide});const me=new TH.Mesh(g,m);me.frustumCulled=false;me.renderOrder=-1;group.add(me);disp.push(g,m)}
  if(sn){const rt=rockTex(def.dungeon),g=mkG(sp,su,si),m=mat({map:rt,tint:0xd8d4dc,side:TH.DoubleSide,sharp:false});const me=new TH.Mesh(g,m);me.frustumCulled=false;me.renderOrder=-1;group.add(me);disp.push(g,m,rt)}}
function boxMesh(cv,w,h,K,H,disp,tex){const t=tex||mkTex(cv);if(disp&&!tex)disp.push(t);const g=new TH.Group();const vk=K/h;
  const mk=(verts,uvs,m)=>{const ge=new TH.BufferGeometry();ge.setAttribute('position',new TH.BufferAttribute(new Float32Array(verts),3));ge.setAttribute('uv',new TH.BufferAttribute(new Float32Array(uvs),2));ge.setIndex([0,1,2,0,2,3]);const me=new TH.Mesh(ge,m);me.frustumCulled=false;g.add(me);if(disp)disp.push(ge,m)};
  const mt=mat({map:t,side:TH.DoubleSide}),ms=mat({map:t,tint:0x8a8ea8,side:TH.DoubleSide});
  mk([0,H,K,w,H,K,w,H,h,0,H,h],[0,1,1,1,1,vk,0,vk],mt);
  mk([0,0,h,w,0,h,w,H,h,0,H,h],[0,0,1,0,1,vk,0,vk],mt);
  const su=Math.min(.5,3/w);mk([0,0,K,0,0,h,0,H,h,0,H,K],[0,0,su,0,su,vk,0,vk],ms);mk([w,0,h,w,0,K,w,H,K,w,H,h],[1-su,0,1,0,1,vk,1-su,vk],ms);
  return g}
function buildBuilding(b,group,disp){
  const cfg=BLD[b.cap.k],X=b.cap.X,Y=b.cap.Y,cv=b.cv,W_=b.w,H_=b.h,mx=b.mx,my=b.my;
  const r0=Y+cfg.roof[0],r1=Y+cfg.roof[1],w0=Y+cfg.wall[0],w1=Y+cfg.wall[1];
  const crop=(ya,yb)=>{const o=mkCanvas(W_,Math.max(1,yb-ya));o.getContext('2d').drawImage(cv,0,-(ya-my));return o};
  let roofCv=crop(r0,r1);const wallCv=crop(w0,w1);
  // dominant solid colour inside a row band (from the recorded rects)
  const domCol=(ya,yb,xa,xb)=>{const area={};for(const r of b.rects){const h=Math.min(yb,r.y+r.h)-Math.max(ya,r.y),w=Math.min(xb,r.x+r.w)-Math.max(xa,r.x);if(h>0&&w>0&&/^#[0-9a-f]{6}$/i.test(r.col)){const[R_,G_,B_]=hex(r.col);if(R_*.3+G_*.59+B_*.11>90)area[r.col]=(area[r.col]||0)+w*h}}
    let best=null,ba=0;for(const k in area)if(area[k]>ba){ba=area[k];best=k}return best};
  const shade=(c,k,blue)=>{if(!c)return null;const[r,g,b_]=hex(c);const o=new TH.Color(r/255*k,g/255*k,Math.min(1,b_/255*k*(blue||1.1)));const l=o.r*.3+o.g*.59+o.b*.11;if(l<.34){o.multiplyScalar(.34/Math.max(.05,l));o.b=Math.min(1,o.b+.04)}return o};
  const Aw=w1-w0,Ar=r1-r0,Hw=Aw*KV,Dr=Ar/(2*SINO),Hr=Dr*ROOF_T,zf=w1,ov=3;
  const ridgeRows=Ar*(ROOF_T*Math.cos(OW_PITCH*DEG)+SINO)/(2*SINO);const vk=ridgeRows/Ar;
  const x0=mx,x1=mx+W_,bx0=Math.max(X+cfg.body[0],x0+ov),bx1=Math.min(X+cfg.body[1],x1-ov),zb=zf-2*Dr;
  const wc=domCol(w0,w1,bx0,bx1),rc=domCol(r0,r1,bx0,bx1);
  const sideC=shade(wc,.66)||new TH.Color(.45,.42,.4),gabC=shade(wc,.52,1.14)||sideC.clone().multiplyScalar(.8),roofC=shade(rc,.45)||new TH.Color(.3,.25,.25);
  const mk=(verts,uvs,idx,m)=>{const g=new TH.BufferGeometry();g.setAttribute('position',new TH.BufferAttribute(new Float32Array(verts),3));g.setAttribute('uv',new TH.BufferAttribute(new Float32Array(uvs),2));g.setIndex(idx);
    const me=new TH.Mesh(g,m);me.frustumCulled=false;group.add(me);disp.push(g,m)};
  {const f=mkCanvas(roofCv.width,roofCv.height),fx_=f.getContext('2d');const rcA=(()=>{const area={};for(const r of b.rects){const h=Math.min(r1,r.y+r.h)-Math.max(r0+Ar*.3,r.y),w=Math.min(bx1,r.x+r.w)-Math.max(bx0,r.x);if(h>0&&w>0&&/^#[0-9a-f]{6}$/i.test(r.col)){const[R_,G_,B_]=hex(r.col);const L=R_*.3+G_*.59+B_*.11;if(L>35&&L<200&&Math.max(R_,G_,B_)-Math.min(R_,G_,B_)>25)area[r.col]=(area[r.col]||0)+w*h}}let best=null,ba=0;for(const k in area)if(area[k]>ba){ba=area[k];best=k}return best})();fx_.fillStyle=rcA||rc||'#7a4a38';fx_.fillRect(0,0,f.width,f.height);fx_.fillStyle='rgba(0,0,0,.18)';fx_.fillRect(0,0,f.width,f.height);
    fx_.drawImage(roofCv,0,0);roofCv=f}
  const wt=mkTex(wallCv),rtx=mkTex(roofCv);disp.push(wt,rtx);
  // front wall (full art width so props like the mill wheel stay on the wall plane)
  mk([x0,0,zf,x1,0,zf,x1,Hw,zf,x0,Hw,zf],[0,0,1,0,1,1,0,1],[0,1,2,0,2,3],mat({map:wt,side:TH.DoubleSide,occ:1}));
  // roof: front slope (eave -> ridge) and back slope (ridge -> back eave), art split at the ridge row so it reads continuously on screen
  const ey=Hw-ov*ROOF_T,ry=Hw+Hr,rz=zf-Dr;
  mk([x0,ey,zf+ov,x1,ey,zf+ov,x1,ry,rz,x0,ry,rz],[0,0,1,0,1,vk,0,vk],[0,1,2,0,2,3],mat({map:rtx,side:TH.DoubleSide,occ:1}));
  {const bxa=x0,bxb=x1;mk([bxa,ry,rz,bxb,ry,rz,bxb,ey,zb-ov,bxa,ey,zb-ov],new Array(8).fill(.5),[0,1,2,0,2,3],mat({tint:roofC.clone().multiplyScalar(1.25).getHex(),side:TH.DoubleSide,sharp:false,occ:1}))}
  // body sides + back + gable ends (solid, darker)
  // sides textured from a strip of the wall art, shaded cool
  const ua=0,ub=1;
  const scv=mkCanvas(32,Math.max(8,Math.round(Aw))),sx=scv.getContext('2d'),base=wc||'#c8b89a';sx.fillStyle=base;sx.fillRect(0,0,32,scv.height);
  sx.fillStyle='rgba(40,30,40,.22)';for(let y=3;y<scv.height;y+=5)sx.fillRect(0,y,32,1);sx.fillStyle='rgba(255,255,255,.18)';for(let y=4;y<scv.height;y+=5)sx.fillRect(0,y,32,1);
  sx.fillStyle='rgba(30,24,36,.55)';sx.fillRect(0,0,2,scv.height);sx.fillRect(30,0,2,scv.height);sx.fillStyle='rgba(30,24,36,.35)';sx.fillRect(0,scv.height-4,32,4);
  const stx=mkTex(scv);disp.push(stx);const sm=mat({map:stx,tint:0xb8bcd0,side:TH.DoubleSide,occ:1});
  mk([bx0,0,zf,bx0,0,zb,bx0,Hw,zb,bx0,Hw,zf, bx1,0,zf,bx1,0,zb,bx1,Hw,zb,bx1,Hw,zf, bx0,0,zb,bx1,0,zb,bx1,Hw,zb,bx0,Hw,zb],[ua,0,ub,0,ub,1,ua,1, ua,0,ub,0,ub,1,ua,1, ua,0,ub,0,ub,1,ua,1],[0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11],sm);
  const gm=mat({tint:gabC.getHex(),side:TH.DoubleSide,sharp:false,occ:1});
  mk([bx0,Hw,zf,bx0,Hw,zb,bx0,ry-.5,rz, bx1,Hw,zf,bx1,Hw,zb,bx1,ry-.5,rz],new Array(12).fill(.5),[0,1,2,3,4,5],gm);
  // roof underside lip (eave shadow line)
  const um=mat({tint:roofC.getHex(),side:TH.DoubleSide,sharp:false});
  mk([x0,ey,zf+ov,x1,ey,zf+ov,x1,ey-1.5,zf+ov,x0,ey-1.5,zf+ov],new Array(8).fill(.5),[0,1,2,0,2,3],um);
}

/* ---------- scene cache ---------- */
const CACHE={};let ACTIVE=null;
function disposeMs(ms){for(const d of ms.disp)try{d.dispose()}catch(e){}}
function zeros(w,h){return Array.from({length:h},()=>new Array(w).fill(0))}
function sceneFor(m){let c=CACHE[m.id];if(c&&c.src===m)return c.ms;if(c)disposeMs(c.ms);
  const def={id:m.id,w:m.w,h:m.h,interior:!!m.interior,lab:!!m.lab,ground:m.ground,obj:m.obj,decos:m.deco||[],elev:m.elev||null,dungeon:!!m.dungeon,
    tiles:fr=>renderMap(Object.assign({},m,{deco:[],obj:zeros(m.w,m.h)}),fr)};
  const ms=bake(def);CACHE[m.id]={src:m,ms};return ms}
function freeScene(){const M_=FREE.MAP;let c=CACHE.__free;if(c&&c.src===M_)return c.ms;if(c)disposeMs(c.ms);
  const h=M_.ground.length,w=M_.ground[0].length;
  const def={id:'free',w,h,interior:false,ground:M_.ground,obj:M_.obj,decos:[],tiles:fr=>{const sw=MW,sh=MH;MW=w;MH=h;try{return paintWorld({ground:M_.ground,obj:zeros(w,h)},fr)}finally{MW=sw;MH=sh}}};
  const ms=bake(def);CACHE.__free={src:M_,ms};return ms}
function activate(ms,ox,oy){if(ACTIVE!==ms){if(ACTIVE)scene.remove(ACTIVE.group);scene.add(ms.group);ACTIVE=ms;const L=ms.look;scene.background.set(L.bg);U.uFogCol.value.set(L.fog);
    postU.uGain.value.set(...L.gain);postU.uLift.value.set(...L.lift);postU.uSat.value=L.sat;postU.uTop.value.set(...L.top);postU.uTopAmt.value=L.topAmt;postU.uVig.value=L.vig}
  ms.group.position.set(-ox,0,-oy);setTex(ms.gm,ms.gtex[Math.abs(Math.floor((APP.mode==='ow'?OW.t:G?G.t:0)*1.6))%2])}

/* ---------- camera ---------- */
const CS={tx:0,tz:0,pitch:OW_PITCH,width:240,roll:0,g:null,s0:0,snap:1};
function viewAspect(){return W/H}
function placeCam(tx,tz,pitch,width,roll){const th=pitch*DEG,a=viewAspect();cam.aspect=a;cam.fov=FOV;cam.updateProjectionMatrix();
  const tanH=Math.tan(FOV*DEG/2)*a,D=width/2/tanH;cam.position.set(tx,D*Math.sin(th),tz+D*Math.cos(th));cam.up.set(0,1,0);cam.lookAt(tx,0,tz);if(roll)cam.rotateZ(roll);cam.updateMatrixWorld();
  cam.matrixWorldInverse.copy(cam.matrixWorld).invert();U.uPitch.value=th;U.uProj.value.copy(cam.projectionMatrix);
  {const L=ACTIVE&&ACTIVE.look;U.uFog.value.set(D*(L&&L.fogN||1.05),D*(L&&L.fogF||2.1),L?L.fogAmt:0);U.uNear.value.set(0,0)}CS.last={tx,tz,pitch,width,roll};CS.D=D}
const _v=new V3(),_d=new V3();
function rayGround(vx,vy){_v.set(vx/W*2-1,-(vy/H*2-1),.5).unproject(cam);_d.copy(_v).sub(cam.position).normalize();const t=-cam.position.y/Math.min(_d.y,-1e-4);return{x:cam.position.x+_d.x*t,z:cam.position.z+_d.z*t}}
function project(x,z,y=0){_v.set(x,y,z).project(cam);return[(_v.x+1)/2*W,(1-_v.y)/2*H]}
function visRect(){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const[a,b]of[[0,0],[W,0],[0,H],[W,H]]){const p=rayGround(a,b);x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.z);y1=Math.max(y1,p.z)}return{x0,y0,x1,y1}}
function frustumOff(pitch,width){const s=CS.last;placeCam(0,0,pitch,width,0);const tl=rayGround(0,0),bl=rayGround(0,H),br=rayGround(W,H),tr=rayGround(W,0);if(s)placeCam(s.tx,s.tz,s.pitch,s.width,s.roll);
  return{xl:(tl.x+bl.x)/2,xr:(tr.x+br.x)/2,zt:tl.z,zb:bl.z}}
function clampAxis(v,lo,hi,mn,mx){const a=mn-lo,b=mx-hi;return a>b?(mn+mx)/2-(lo+hi)/2:clamp(v,a,b)}
const ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2,smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
function battleCtx(){if(G.route)return{ms:sceneFor(G.route.map),ox:0,oy:0};
  if(G.story&&OW.map)return{ms:sceneFor(OW.map),ox:(G.story.x0||0)*16,oy:(G.story.y0||0)*16,habs:OW.map.habitats};
  if(MAP&&MAP.deco&&MAP.id)return{ms:sceneFor(MAP),ox:0,oy:0};
  return{ms:freeScene(),ox:0,oy:0}}
R.updCam=function(dt){
  if(!G)return;const bc=battleCtx();activate(bc.ms,bc.ox,bc.oy);
  const P=G.f[0];if(CS.g!==G){CS.g=G;CS.s0=G.start||0;CS.snap=1;CS.dim=0}
  // dynamic framing: ~390px wide, widening (max 480) when the focus foe is far; interiors frame the room
  const room=G.story&&OW.map&&OW.map.interior;const foe=G.route?(G.focus&&alive(G.focus)?G.focus:null):(alive(G.f[1])?G.f[1]:null);
  const fd=foe?Math.hypot(foe.x-P.x,foe.y-P.y):0;let wT=room?clamp(Math.max(WW+40,(WH+40)*W/H*.9),300,480):G.boss&&!G.boss.gone?600:clamp(390+Math.max(0,fd-150)*.6,300,480);
  CS.bw=CS.snap||!CS.bw?wT:CS.bw+(wT-CS.bw)*(1-Math.exp(-3*dt));
  const pitch0=room?62:BAT_PITCH,width0=CS.bw;const off=frustumOff(pitch0,width0);const mg=room?0:G.story?110:24;
  let px=P.x,pz=P.y-8;if(foe&&fd<width0*.9){const k=foe.boss?.42:.3;px+=(foe.x-P.x)*k;pz+=(foe.y-P.y)*k}if(foe&&foe.boss)pz-=52;
  let tx=clampAxis(px,off.xl,off.xr,-mg,WW+mg),tz=clampAxis(pz,off.zt,off.zb,-mg,WH+mg);
  if(CS.snap){CS.tx=tx;CS.tz=tz;CS.snap=0}else{const k=1-Math.exp(-7*dt);CS.tx+=(tx-CS.tx)*k;CS.tz+=(tz-CS.tz)*k}
  let pitch=pitch0,width=width0,roll=0,fx=CS.tx,fz=CS.tz,dim=G.story?1:0;
  if(CS.s0>0&&G.start>0){const Q=G.f[1]||P,k=clamp((CS.s0-G.start)/Math.max(.1,CS.s0-.7),0,1),e=ease(k),hold=1-smooth(0,.35,k);
    const sx=Q.x,sz=Q.y-10;pitch=pitch0+(46-pitch0)*(1-e);width=width0+(170-width0)*(1-e);fx=sx+(fx-sx)*e;fz=sz+(fz-sz)*e;roll=-.05*(1-e)*(1-hold*.5);dim=G.story?e:0}
  if(G.banner&&!G.banner.lvl){const k=1.3-G.banner.t,env=smooth(0,.12,k)*(1-smooth(.55,1.3,k)),who=(G.boss&&G.banner.side===1?G.boss:G.f[G.banner.side])||P;width*=1-.07*env;fx+=(who.x-fx)*.15*env;fz+=(who.y-12-fz)*.15*env}
  if(G.shake>0){const sk=Math.min(G.shake,3.5)*.4;fx+=(Math.random()-.5)*sk;fz+=(Math.random()-.5)*sk}
  U.uDim.value=dim*.9;U.uArena.value.set(G.story?0:-1e6,G.story?0:-1e6,G.story?WW:1e6,G.story?WH:1e6);
  placeCam(fx,fz,pitch,width,roll);
  G.camW=width0;G.camH=width0*H/W;G.cam.x=CS.tx-G.camW/2;G.cam.y=CS.tz-G.camH/2;
  const h=rayGround(M.sx,M.sy);M.x=h.x;M.y=h.z};

/* ---------- dynamic billboards ---------- */
const POOL=[],SHP=[];let pN=0,sN=0;
function spr(tex,x,zb,w,h,o){let s=POOL[pN];if(!s){s=new TH.Mesh(QUAD,mat({card:1,transparent:true}));s.frustumCulled=false;s.renderOrder=3;dyn.add(s);POOL.push(s)}pN++;
  const u=s.material.uniforms;setTex(s.material,tex);u.uSize.value.set(w,h);const op=o&&o.op!=null?o.op:1;u.uOpacity.value=op;u.uAlphaTest.value=.5*op;u.uZo.value=o&&o.zo||0;u.uFlash.value=o&&o.flash||0;
  if(o&&o.uv)u.uUv.value.copy(o.uv);else u.uUv.value.set(0,0,1,1);s.position.set(x,o&&o.lift||0,zb);const ont=!!(ACTIVE&&ACTIVE.def&&ACTIVE.def.interior&&APP.mode!=='battle')&&!(o&&o.depth);if(s.material.depthTest===ont){s.material.depthTest=!ont;s.renderOrder=ont?6:3}s.visible=true;return s}
function shadow(x,z,rx,rz,a){let s=SHP[sN];if(!s){s=new TH.Mesh(FLATQ,mat({map:BLOB,transparent:true,depthWrite:false,alphaTest:0,sharp:false}));s.frustumCulled=false;s.renderOrder=1;dyn.add(s);SHP.push(s)}sN++;
  s.scale.set(rx*2.6,1,rz*2.8);s.position.set(x,.25+EL(x,z-1),z);s.material.uniforms.uOpacity.value=a;s.visible=true}
const FLP=[];let fN=0;
function flat(tex,x0,z0,w,h){let s=FLP[fN];if(!s){s=new TH.Mesh(FLATQ,mat({transparent:true,depthWrite:false}));s.frustumCulled=false;s.renderOrder=1;dyn.add(s);FLP.push(s)}fN++;
  setTex(s.material,tex);s.scale.set(w,1,h);s.position.set(x0+w/2,.15,z0+h/2);s.visible=true;return s}
const UV_FRONT=new TH.Vector4(0,0,1,10/32);
function habitat(t,cx,zb){flat(t,cx-16,zb-32,32,32);spr(t,cx,zb,32,10,{zo:-1,uv:UV_FRONT})}
const HABM=[];let habN=0;
function habitat3(h,cx,zb,tm){const kind=HABITAT[h.id],HH=11;
  if(!h.__box){const cv=mkCanvas(32,22),x=cv.getContext('2d');x.imageSmoothingEnabled=false;x.translate(0,-10);drawHabitat(x,0,0,kind,0);drawHabitat(x,0,0,kind,1);h.__box=boxMesh(cv,32,22,6,HH,null);dyn.add(h.__box)}
  const b=h.__box;b.position.set(cx-16,0,zb-22);b.visible=true;HABM.push(b);
  if(!h.empty){const hop=OW.hop&&OW.hop.id===h.id?Math.abs(Math.sin(OW.t*9))*3:Math.abs(Math.sin(tm*2+h.x))*.8;const S=SPR[h.id].norm.down[Math.floor(tm*2+h.x)%2];spr(texFor(S.c),cx,zb-9,20,20,{zo:-1,lift:HH+hop})}}
function dynBegin(){pN=0;sN=0;fN=0;for(const b of HABM)b.visible=false;HABM.length=0}
function dynEnd(){for(let i=fN;i<FLP.length;i++)FLP[i].visible=false;for(let i=pN;i<POOL.length;i++)POOL[i].visible=false;for(let i=sN;i<SHP.length;i++)SHP[i].visible=false}
const COMP=new WeakMap();
function comp(key,w,h,ax,ay,wx,wy,fn){let c=COMP.get(key);if(!c){const cv=mkCanvas(w,h);c={cv,c:cv.getContext('2d'),tex:null};c.tex=mkTex(cv);COMP.set(key,c)}
  const old=ctx;c.c.setTransform(1,0,0,1,0,0);c.c.clearRect(0,0,w,h);c.c.imageSmoothingEnabled=false;c.c.setTransform(1,0,0,1,ax-Math.round(wx),ay-Math.round(wy));ctx=c.c;try{fn()}finally{ctx=old}
  c.tex.needsUpdate=true;return c.tex}

/* ---------- fx canvas layers ---------- */
function fxLayer(depthTest,ro,y){const L={cv:mkCanvas(256,256),x0:0,y0:0,mesh:null,tex:null,m:null};L.c=L.cv.getContext('2d');L.tex=mkTex(L.cv);
  L.m=mat({map:L.tex,transparent:true,alphaTest:.004,depthTest,depthWrite:false,fog:false,dim:false});L.mesh=new TH.Mesh(FLATQ,L.m);L.mesh.renderOrder=ro;L.mesh.position.y=y;L.mesh.frustumCulled=false;L.mesh.visible=false;scene.add(L.mesh);return L}
const GFX=fxLayer(true,2,.3),OFX=fxLayer(false,20,.4);
function fxBegin(L,r){const w=Math.ceil(r.x1-r.x0),h=Math.ceil(r.y1-r.y0);
  if(L.cv.width<w||L.cv.height<h){L.cv.width=Math.max(L.cv.width,Math.ceil(w/128)*128);L.cv.height=Math.max(L.cv.height,Math.ceil(h/128)*128);L.tex.dispose();L.tex=mkTex(L.cv);setTex(L.m,L.tex);L.c=L.cv.getContext('2d')}
  L.x0=Math.floor(r.x0);L.y0=Math.floor(r.y0);const c=L.c;c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.clearRect(0,0,L.cv.width,L.cv.height);c.imageSmoothingEnabled=false;c.translate(-L.x0,-L.y0);
  L.mesh.scale.set(L.cv.width,1,L.cv.height);L.mesh.position.x=L.x0+L.cv.width/2;L.mesh.position.z=L.y0+L.cv.height/2}
function fxDraw(L,fn){const old=ctx;ctx=L.c;PTX=q=>{const wx=q.x+L.x0,wy=q.y+L.y0,a=project(wx,wy),b=project(wx+1,wy);q.x=a[0];q.y=a[1];q.size*=Math.max(.6,Math.hypot(b[0]-a[0],b[1]-a[1]))};
  try{fn()}finally{ctx=old;PTX=null}L.tex.needsUpdate=true;L.mesh.visible=true}
function fxRect(pad){const r=visRect();return{x0:r.x0-pad,y0:r.y0-pad*2.5,x1:r.x1+pad,y1:r.y1+pad}}

/* ---------- size / render ---------- */
function resize(){const cw=glcv.clientWidth||W,ch=glcv.clientHeight||H,pr=Math.min(window.devicePixelRatio||1,2);let w=Math.round(cw*pr),h=Math.round(ch*pr);const s=Math.min(1,1920/w,1080/h);w=Math.max(16,Math.round(w*s));h=Math.max(16,Math.round(h*s));
  if(glcv.width!==w||glcv.height!==h){renderer.setSize(w,h,false);rt.setSize(w,h);postU.uRes.value.set(w,h)}}
function draw(){U.uTime.value=performance.now()/1000;renderer.setRenderTarget(rt);renderer.render(scene,cam);renderer.setRenderTarget(null);renderer.render(postScene,postCam)}
function syncClass(){const fr=document.getElementById('frame');if(fr)fr.classList.toggle('r3d',R.ready&&R.on)}

const HF=new WeakMap();
function arenaMarks(){const a=.35+.15*Math.sin(G.t*3),L=14;ctx.globalAlpha=a;ctx.fillStyle='#fff6d8';for(const[x,y,sx,sy]of[[2,2,1,1],[WW-2,2,-1,1],[2,WH-2,1,-1],[WW-2,WH-2,-1,-1]]){ctx.fillRect(sx>0?x:x-L,y-(sy>0?0:2),L,2);ctx.fillRect(x-(sx>0?0:2),sy>0?y:y-L,2,L)}ctx.globalAlpha=1}
function hurtFlash(f){let s=HF.get(f);if(!s){s={p:0,last:-9,until:-9};HF.set(f,s)}const t=G.t;if(f.hurt>s.p+.001&&t-s.last>.25){s.last=t;s.until=t+.034}s.p=f.hurt;return t<s.until?.6:0}
function occRect(x,y,w,h){const p=U.uPitch.value,a=project(x-w/2,y,0),b=project(x+w/2,y-h*Math.sin(p),h*Math.cos(p)),sx=rt.width/W,sy=rt.height/H;
  U.uOccRect.value.set(Math.min(a[0],b[0])*sx-4,(H-Math.max(a[1],b[1]))*sy-4,Math.max(a[0],b[0])*sx+4,(H-Math.min(a[1],b[1]))*sy+4);U.uOccZ.value=y}
R.battle=function(){
  resize();if(CS.g!==G)R.updCam(0);const bc=battleCtx();activate(bc.ms,bc.ox,bc.oy);const s=CS.last;placeCam(s.tx,s.tz,s.pitch,s.width,s.roll);
  syncClass();postU.uTilt.value=.5;dynBegin();
  for(const f of G.f){if(!f.unit||f.bound)continue;const al=fAlpha(f),z=jumpZ(f),S=fSprite(f);
    {const k=f.unit.ht||1,mo=fMotion(f);spr(texFor(S.c),f.x,f.y+2,32*k*mo.sx,32*k*mo.sy,{op:al,zo:-2,lift:EL(f.x,f.y)+z+mo.lift-(f.faintT>0?(1.3-f.faintT)*8:0),flash:hurtFlash(f)});shadow(f.x,f.y+.5,(8-z*.12)*Math.max(1,k*.85),2.6*Math.max(1,k*.7),.85*al)}}
  if(G.route&&G.route.npcs){for(const n of G.route.npcs){if(n.show&&!n.show())continue;const qx=n.x*16+8,qy=n.y*16+14;spr(texFor(HSPR[n.look][n.dir][0]),qx,qy+1,20,30,{zo:-1,lift:EL(qx,qy)});shadow(qx,qy-.5,5.5,1.8,.8)}
    for(const it of G.route.map.items||[]){if(OW.flags[it.k])continue;if(!ITEMCV){ITEMCV=mkCanvas(16,16);drawItemBall(ITEMCV.getContext('2d'),0,0)}spr(texFor(ITEMCV),it.x*16+8,it.y*16+14,16,16,{zo:-1,lift:EL(it.x*16+8,it.y*16+12)+Math.abs(Math.sin(G.t*3+it.x))*2});shadow(it.x*16+8,it.y*16+13,4,1.4,.6)}}
  for(const p of G.pods){const t=comp(p,24,34,12,28,p.x,p.y,()=>renderPod(p));spr(t,p.x,p.y+6,24,34,{zo:-6});shadow(p.x,p.y,7,2,.7)}
  for(const b of G.balls){const t=comp(b,40,46,20,30,b.x,b.y,()=>renderBall(b));spr(t,b.x,b.y+16,40,46,{zo:-10});shadow(b.x,b.y+6,ballR(b)+1,1.6,.7)}
  {const P=G.f[0];if(alive(P))occRect(P.x,P.y,26,30);else U.uOccRect.value.set(0,0,0,0)}
  for(const g of G.ghosts)spr(texFor(g.spr),g.x,g.y+2,32,32,{op:Math.max(.02,g.life/.2*.4),zo:-2});
  if(bc.habs)for(const h of bc.habs)habitat3(h,h.x*16+16-bc.ox,h.y*16+32-bc.oy,G?G.t:0);
  dynEnd();
  const r=fxRect(48);
  {const ev=ACTIVE&&elevOf(ACTIVE.def).any;if(GFX.m.depthTest===!!ev){GFX.m.depthTest=!ev}}
  if(true){fxBegin(GFX,r);fxDraw(GFX,()=>{for(const fi of G.fires)drawFire(fi);if(G.story)arenaMarks();for(const f of G.f)if(f.unit&&!f.bound&&f.mode==='turret'){ctx.globalAlpha=.6;pell(f.x,f.y+1,14,4,'#88c0fc');pring(f.x,f.y+1,13,'#e2f8ff',3);ctx.globalAlpha=1}for(const q of G.rings)drawRing(q);drawWalkMarks()})}else GFX.mesh.visible=false;
  PROJ=(x,y)=>project(x,y);
  fxBegin(OFX,r);HK=1/Math.sin(CS.last.pitch*DEG);
  try{fxDraw(OFX,()=>{drawOverFx(false);for(const f of G.f){if(!f.unit||f.bound)continue;const z=jumpZ(f),sy=fSY(f,z);drawGear(f,Math.round(f.x-16),sy,z);fighterOver(f,sy)}})}finally{HK=1}
  draw()};

R.ow=function(){
  const m=OW.map;resize();const ms=sceneFor(m);activate(ms,0,0);syncClass();
  U.uDim.value=0;U.uArena.value.set(-1e6,-1e6,1e6,1e6);
  const run=(K.ShiftLeft||K.ShiftRight)&&OW.p.moving&&!m.interior;CS.run=(CS.run||1)+((run?1.12:1)-(CS.run||1))*.06;
  const pitch=m.interior?INT_PITCH:OW_PITCH,width=(m.interior?210:OVW)*CS.run;
  const tx=OW.cam.x+OVW/2,tz=OW.cam.y+OVH/2+(m.interior?4:2);
  placeCam(tx,tz,pitch,width,0);postU.uTilt.value=m.interior?.25:.5;
  dynBegin();
  const ents=[...m.npcs.filter(n=>!n.hidden).map(n=>({e:n,look:n.look})),{e:OW.p,look:OW.look}];
  for(const o of ents){const pos=entPos(o.e),fr=entFrame(o.e),cv=HSPR[o.look][o.e.dir][fr];spr(texFor(cv),Math.round(pos.x),pos.y+1,20,30,{zo:o.e.reach?6:-1,depth:!!o.e.reach,lift:o.e.reach?8:0});shadow(pos.x,pos.y-.5,5.5,1.8,.8)}
  {const pp=entPos(OW.p);occRect(pp.x,pp.y,20,30)}
  if(m.habitats)for(const h of m.habitats)habitat3(h,h.x*16+16,h.y*16+32,OW.t);
  for(const a of OW.actors){const S=SPR[a.mon].norm.down[Math.floor(a.t*8)%2];spr(texFor(S.c),a.x,a.y+1,16,16,{zo:-1,lift:Math.abs(Math.sin(a.t*10))*2});shadow(a.x,a.y+.5,5,1.6,.7)}
  dynEnd();
  GFX.mesh.visible=false;
  if(OW.emotes.length){fxBegin(OFX,fxRect(24));const hk=1/Math.sin(pitch*DEG);fxDraw(OFX,()=>{for(const em of OW.emotes){const pos=entPos(em.e);const x=Math.round(pos.x-6),y=Math.round(pos.y-38*hk+(em.t>.75?(em.t-.75)*20:0));
    ctx.fillStyle='#282830';ctx.fillRect(x,y,12,12);ctx.fillStyle='#ffffff';ctx.fillRect(x+1,y+1,10,10);ctx.fillRect(x+4,y+12,4,2);ctx.fillStyle='#f83838';ctx.fillRect(x+5,y+3,2,5);ctx.fillRect(x+5,y+9,2,1)}})}else OFX.mesh.visible=false;
  draw()};

/* ---------- toggle ---------- */
function btnSync(){const b=document.getElementById('r3dBtn');if(b){b.hidden=!R.ready;b.textContent='3D VIEW: '+(R.on?'ON':'OFF')}}
R.toggle=function(v){R.on=v==null?!R.on:!!v;try{localStorage.setItem('typeclash_r3d',R.on?'1':'0')}catch(e){}syncClass();btnSync()};
R.project=project;R.rayGround=rayGround;R.sceneFor=sceneFor;R.stats=()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles,scenes:Object.keys(CACHE).map(k=>k+':'+CACHE[k].ms.tm)});
R.ready=true;
let pref=null;try{pref=localStorage.getItem('typeclash_r3d')}catch(e){}
R.on=pref!=='0';
addEventListener('DOMContentLoaded',()=>{});
setTimeout(()=>{syncClass();btnSync();const b=document.getElementById('r3dBtn');if(b)b.addEventListener('click',()=>R.toggle())},0);
return R})();
