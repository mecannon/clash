# Typeclash

A real-time creature-battling RPG in a single HTML file, plus a tiny Node server for **online Quick Match** (3v3 vs another player).

## Play online (deploy to Render, free)
1. Sign in at https://render.com with GitHub.
2. **New → Blueprint**, pick this repo, then **Deploy**. `render.yaml` sets everything up.
3. Open the URL Render gives you (e.g. `https://typeclash.onrender.com`). The game loads, and Quick Match automatically uses that server.
4. To play: **Free Battle**, pick 3 creatures, then **ONLINE QUICK MATCH**. Anyone else searching at the same time is matched with you.

Free Render services sleep after about 15 idle minutes. The first visit afterwards takes 30 to 60 seconds to wake up.

## Files
- `typeclash.html`: the whole game (built output). The server serves it at `/`.
- `server.js`, `package.json`: matchmaking queue + WebSocket relay. `/health` shows queue and room counts.
- `render.yaml`: Render blueprint.
- `src/`: game sources. Rebuild with `cd src && python3 build.py`, then copy `src/dist/page.html` to the repo root as `typeclash.html` (page.html is the standalone build with the html/head wrapper).

## Run locally
```
npm install
npm start      # http://localhost:8080, open it in two windows to test Quick Match
```

## How online play works
One player's browser hosts the battle and streams its state (~30/s) to the other. The other player's inputs are sent back to the host. The server only queues players and relays messages, so it's very light.
Limits: the guest has one round trip of input delay; the host is trusted (fine between friends); if a player leaves, the other wins.
