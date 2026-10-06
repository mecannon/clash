# Typeclash: architecture notes (read before editing)

Typeclash is a single-file HTML game built by `python3 build.py`. That script concatenates `shell.html` with the following pieces and writes `dist/typeclash.html` (the deliverable) and `dist/page.html` (a test wrapper):

| Placeholder | Source |
|---|---|
| `/*THREE*/` | `vendor/three.min.js` (three r128, inlined, UMD global `THREE`) |
| `/*SPR*/` | `spr.js` |
| `/*GAME*/` | `game.js` |
| `/*STORY*/` | `story.js` |
| `/*R3D*/` | `r3d.js` (optional) |

All game code shares one `'use strict'` script scope. There are no modules, so watch for global name collisions.

## spr.js: all pixel art
- Grid toolkit: `SG(w,h)` makes a grid. `part(g,shapeFn,RP(line,r0..r3),opts)` draws a shaded part with an auto outline. `E()` is an ellipse, `RR()` a rect, `PG()` a polygon; `U`/`DF`/`IN` are union/difference/intersection. Also `px`, `pxs`, `hline`, `lineG`, `stamp`, `flipH`, `toCv(g)` → canvas, `whiteCv`.
- Creature draw functions `drawX(dir,fr,state)` return a 32x32 grid. `dir` is `down|up|left` (right is auto-flipped) and `fr` is 0 or 1.
- Humans: 16x24 templates (`HEADS`, `FACE`, `BODY`, `LEGS`, `LOOKS`). `buildHumans()` → `HSPR[look][dir][frame]`.
- Tiles are 16px. Functions `tileGrass` / `tileTall` / `tilePath` / `tileWater` / `tileFlowers` / `tileDirt` / `tileCobble` / `tileBridge` take `(x0,y0,X,Y,c,...)` and draw on a 2D context.
- Props and buildings: `drawHouse`, `drawLab`, `drawGuild`, `drawMill`, `drawBigTree`, `drawLamp`, `drawSign`, `drawFence`, and many more. These are canvas `fillRect` painters, signature `(c,x,y,...)`.
- `treeSprite()` and `rockSprite()` produce the canvases `TREE_CV` and `ROCK_CV` (32x32 tree, 16x16 rock).
- Free-battle arena: `buildMap()` fills `MAP={ground,obj,walk,shot}` (obj 1 = tree on a 2x2 tile, 2 = rock). `paintWorld(MAP,fr)` paints a full canvas.
- Ground codes: 0 grass, 1 path, 2 water, 3 tall grass, 4 flowers, 5 interior floor, 6 cobble, 7 bridge, 8 dirt.

## game.js: real-time battle engine (also runs the routes)
- `MONS[]` has `{id,n,types,stats{hp,dmg,pdef,mdef,int,spe},cls:'phys'|'mag',xp,draw,states,ammo{max,rl,unit,verb,d},role,blurb,moves[3]}`. `MON[id]` is the lookup table.
- Per-mon behaviour lives in three tables: `KIT[id].act(f,c)` and `KIT[id].move(f)` (move-speed multiplier), `AIK[id](f,t,c,d,sight,dt)` (returns `{pref,aimTarget,goto,aim}`), and `special(f)` (the HUD state text), plus `curMoves(f)` when moves change by mode.
- Helpers: `shoot`, `cone`, `nova`, `dash`, `beam`, `later(f,delay,fn)`, `hit(src,tgt,pow,type,o)`, `ring(x,y,r,col,life,kind,extra)`, `fx()` particles, `popup()` damage text. Ring kinds are `tele`, `telearc`, `nova`, `arc` and a plain ring.
- Fighters live in `G.f[]` (side 0 is the player). Each fighter `f` has `x,y,aim,dir,mode,unit{m,hp,max,dmg,...,cd[2],ult,ammo,rl}` plus many timers.
- Factions: `foes(f)`, `opp(f)`, and `wild` fighters in route mode.
- Damage = `pow × eff × STAB(1.2) × atk/def × LF(level)`. Type multipliers are 1.6 / 0.6 / 0.3.
- Rendering: `render()` draws everything with a 2D ctx at view size W×H. The battle and route view is 600x338 (`BW`, `BH`); the overworld is 480x270 with `OVZ=2`. Order: the map canvas `WORLD[frame]`, then a translate by the camera, then fires, ghosts, entities sorted by y (pods, balls, fighters via `drawFighter`), beams, streams, projectiles, rings, particles and texts. Next come the screen-space arrows, minimap, banner and crosshair.
- Crisp text: `ptext(t,x,y,col,size,align,o)` queues text on the `#tx` overlay canvas. It uses the current ctx transform, and `flushText()` draws the queue.
- Camera: `updCam` sets `G.cam`, and the mouse world position is `M.x=G.cam.x+M.sx` (`M.sx`/`M.sy` are view-space mouse coordinates).
- HUD is DOM: `buildHud()` / `updHud()` (`#hud`, the `.gba` panels).

## story.js: overworld, maps, scripts, routes
- Maps: `mkMapData(id,w,h,opts)` → `{ground,obj,walk,shot,deco[],npcs,warps,signs,...}`. Builder helpers: `sol` (collision), `otree` (2x2 tree), `orock`, `gfill`, `deco(m,sortY,fn,flat)`, `building`, `fence`, `sign`, `prop`, `warp`, `npc`.
  - `deco` items are `{y,fn,flat}`. `fn(ctx)` paints in map pixel space. `flat:true` marks ground decals (shadows, rugs, mats, lilies, boats, burrows); everything else stands upright. Trees and rocks come from the `m.obj` grid (1 = tree top-left, 9 = tree filler, 2 = rock).
- `prepMap` / `renderMap` bake two animation frames (`m.cvs[0/1]`): ground tiles, then upright and flat decos and obj trees/rocks, sorted by y.
- Maps: `town` (Fernbrook), `home`, `rhouse`, `lab` (interiors), `route1` (Hollowmill Trail, 40x104, played in route mode), `millhaven`.
- The overworld uses free pixel movement for the player (`OW.p.px`, `OW.p.py`) while NPCs step on the grid. `owRender()` draws `m.cvs`, then entities sorted by y (NPCs, player, habitats, actors) with HSPR sprites, then emotes, the cut transition and the fade.
- Main loop: `owFrame(dt)`.
  - In `battle` or `route` mode it calls `setView(BW,BH)`, `routeTick`, `update(dt)`, `render()`, `updHud()` and `dlgTick`, then draws the fade overlay.
  - Otherwise (overworld or intro) it calls `setView(480,270)`, `owUpdate(dt)` and `owRender()` (or `introRender()`).
  - It always ends with `flushText()`.
- Trainer battles (`trainerBattle`) cut a sub-rectangle of the current overworld map (`x0`,`y0`,`w`,`h`) into `MAP` and `WORLD`, then run the battle engine with `G.story`.
- Route mode (`startRoute`) uses the route map directly as `MAP` and `WORLD`, and spawns wild fighters (`mkWild`, `wildCtl`). Tethers are the catch mechanic (`throwTether`, `tetherTick`, `routeDraw`). Space prompts come from `routePrompt`.
- Saves live in localStorage under `typeclash_save`.

## Testing
See `tools/README.md`. `tools/shots.js` renders key scenes to PNGs in headless Chromium (WebGL works through SwiftShader). Headless throttles requestAnimationFrame, so the tools step the simulation manually with `owFrame`, or with `update` / `render` / `updHud` / `flushText`.

## Rules for all contributors
- Make surgical edits. Do not rewrite working systems, and keep function signatures stable.
- Every existing feature must keep working: story flow, route mode, Tethers, free battle, save/load.
- Commit to your branch with clear messages.
