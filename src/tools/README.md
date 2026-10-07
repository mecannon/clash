Build: python3 build.py  -> dist/typeclash.html (deliverable), dist/page.html (test wrapper)
Screenshots: NODE_PATH=/tmp/claude-0/-home-claude/b4b16c97-9bfa-5c96-89be-7cc77fee8e71/scratchpad/node_modules node tools/shots.js <outdir> title,select,town,lab,route,battle,millhaven,umbrynx
Headless Chromium throttles requestAnimationFrame, so tests step owFrame()/update() manually.
