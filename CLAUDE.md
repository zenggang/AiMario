# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

Open `index.html` directly in a browser, or serve via a local HTTP server (required for sprite sheet loading due to CORS):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Architecture

This is a browser-based Super Mario Bros 1-1 clone. All game logic lives in `game.js`, loaded by `index.html`.

**Core systems in `game.js`:**
- Sprite rendering: `drawSprite()` draws from `SpriteSheet.png` using coordinates defined in the `Sprites` object. On load, the checkerboard background is stripped by making near-neutral gray pixels transparent (`window._processedSheet`).
- Physics: `Entity` base class handles gravity, AABB tile collision (X and Y axes separated to prevent corner clipping). `TILE_SIZE=16`, `SCALE=3`.
- Level map: `mapRaw` string array encodes the level. Characters: `1`=ground, `2`=brick, `3/4/5`=question blocks, `7/8/9/a`=pipe segments, `g`=Goomba spawn, `k`=Koopa spawn, `p`=Piranha Plant spawn.
- Entity classes: `Mario extends Entity`, `Enemy extends Entity` (subclassed by `Goomba`, `Koopa`, `PiranhaPlant`), `Mushroom`/`Star extend Entity`.
- Game loop: `requestAnimationFrame` drives `update()` → `draw()`.

**Utility scripts:**
- `analyze.py`: PIL-based script to inspect `SpriteSheet.png` pixel coordinates (run with `python3 analyze.py`).
- `grid.html`: Browser tool to visualize sprite sheet grid overlays.
- `server.py`: Minimal HTTP server on port 8889 that accepts a single POST to `/submit`, saves to `coords.json`, then shuts down.

## Sprite Coordinates

All sprite source coordinates (`x`, `y`, `w`, `h`) in the `Sprites` object are pixel positions in `SpriteSheet.png`. `gw`/`gh` are the logical game tile dimensions (pre-scale). When modifying sprites, use `grid.html` or `analyze.py` to find correct coordinates.
