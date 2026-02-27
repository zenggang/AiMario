import { SCALE } from './constants.js';

/** @typedef {{id:string,src:{x:number,y:number,w:number,h:number},logical:{w:number,h:number},anchor:{x:number,y:number},collision?:{x:number,y:number,w:number,h:number}}} SpriteDef */

/** @type {Record<string, SpriteDef>} */
export const SPRITES = {
  mario_big_stand:  { id: 'mario_big_stand', src: { x: 41,  y: 25, w: 48, h: 77 }, logical: { w: 16, h: 32 }, anchor: { x: 0, y: 0 } },
  mario_big_walk1:  { id: 'mario_big_walk1', src: { x: 111, y: 23, w: 59, h: 79 }, logical: { w: 16, h: 32 }, anchor: { x: 0, y: 0 } },
  mario_big_walk2:  { id: 'mario_big_walk2', src: { x: 188, y: 14, w: 65, h: 85 }, logical: { w: 16, h: 32 }, anchor: { x: 0, y: 0 } },
  mario_big_walk3:  { id: 'mario_big_walk3', src: { x: 276, y: 14, w: 42, h: 88 }, logical: { w: 16, h: 32 }, anchor: { x: 0, y: 0 } },
  mario_big_jump:   { id: 'mario_big_jump', src: { x: 487, y: 14, w: 55, h: 88 }, logical: { w: 16, h: 32 }, anchor: { x: 0, y: 0 } },

  mario_small_stand: { id: 'mario_small_stand', src: { x: 41,  y: 132, w: 54, h: 88 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 }, collision: { x: 2, y: 0, w: 12, h: 16 } },
  mario_small_walk1: { id: 'mario_small_walk1', src: { x: 118, y: 128, w: 53, h: 92 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 }, collision: { x: 2, y: 0, w: 12, h: 16 } },
  mario_small_walk2: { id: 'mario_small_walk2', src: { x: 205, y: 128, w: 42, h: 91 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 }, collision: { x: 2, y: 0, w: 12, h: 16 } },
  mario_small_walk3: { id: 'mario_small_walk3', src: { x: 273, y: 142, w: 80, h: 75 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 }, collision: { x: 2, y: 0, w: 12, h: 16 } },
  mario_small_jump:  { id: 'mario_small_jump', src: { x: 487, y: 133, w: 59, h: 83 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 }, collision: { x: 2, y: 0, w: 12, h: 16 } },
  mario_small_die:   { id: 'mario_small_die', src: { x: 576, y: 133, w: 61, h: 86 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },

  goomba_walk1: { id: 'goomba_walk1', src: { x: 40,  y: 303, w: 62, h: 63 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },
  goomba_walk2: { id: 'goomba_walk2', src: { x: 119, y: 276, w: 58, h: 90 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },
  goomba_flat:  { id: 'goomba_flat',  src: { x: 198, y: 282, w: 57, h: 84 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },

  koopa_walk1: { id: 'koopa_walk1', src: { x: 486, y: 278, w: 68, h: 88 }, logical: { w: 16, h: 24 }, anchor: { x: 0, y: 0 } },
  koopa_walk2: { id: 'koopa_walk2', src: { x: 575, y: 276, w: 68, h: 90 }, logical: { w: 16, h: 24 }, anchor: { x: 0, y: 0 } },
  koopa_shell: { id: 'koopa_shell', src: { x: 669, y: 292, w: 62, h: 74 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },

  piranha_1: { id: 'piranha_1', src: { x: 949, y: 271, w: 58, h: 95 }, logical: { w: 16, h: 24 }, anchor: { x: 0, y: 0 } },
  piranha_2: { id: 'piranha_2', src: { x: 949, y: 271, w: 58, h: 95 }, logical: { w: 16, h: 24 }, anchor: { x: 0, y: 0 } },

  tile_ground:       { id: 'tile_ground', src: { x: 47,  y: 452, w: 53, h: 52 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },
  tile_brick:        { id: 'tile_brick', src: { x: 100, y: 452, w: 53, h: 52 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },
  tile_qblock1:      { id: 'tile_qblock1', src: { x: 264, y: 452, w: 53, h: 52 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },
  tile_qblock_empty: { id: 'tile_qblock_empty', src: { x: 370, y: 452, w: 53, h: 52 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },

  tile_pipe_top_l:  { id: 'tile_pipe_top_l', src: { x: 47, y: 594, w: 47, h: 60 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },
  tile_pipe_top_r:  { id: 'tile_pipe_top_r', src: { x: 94, y: 594, w: 47, h: 60 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },
  tile_pipe_body_l: { id: 'tile_pipe_body_l', src: { x: 47, y: 654, w: 47, h: 60 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },
  tile_pipe_body_r: { id: 'tile_pipe_body_r', src: { x: 94, y: 654, w: 47, h: 60 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },

  item_mushroom: { id: 'item_mushroom', src: { x: 1044, y: 652, w: 60, h: 60 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },
  item_star:     { id: 'item_star', src: { x: 1185, y: 652, w: 53, h: 60 }, logical: { w: 16, h: 16 }, anchor: { x: 0, y: 0 } },
};

export function preprocessSpriteSheet(spriteSheet) {
  const cvs = document.createElement('canvas');
  cvs.width = spriteSheet.width;
  cvs.height = spriteSheet.height;
  const ctx = cvs.getContext('2d');
  ctx.drawImage(spriteSheet, 0, 0);

  const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    if (maxDiff <= 12 && r >= 160) d[i + 3] = 0;
  }
  ctx.putImageData(imgData, 0, 0);
  return cvs;
}

export function renderSprite(ctx, sheet, entityOrTile, camera, debugFlags) {
  const s = SPRITES[entityOrTile.spriteId];
  if (!s || !sheet) return;

  const x = (entityOrTile.x - s.anchor.x) * SCALE - camera.x;
  const y = (entityOrTile.y - s.anchor.y) * SCALE - camera.y;
  const drawW = s.logical.w * SCALE;
  const drawH = s.logical.h * SCALE;
  const flipX = Boolean(entityOrTile.flipX);

  ctx.save();
  if (flipX) {
    ctx.scale(-1, 1);
    ctx.drawImage(sheet, s.src.x, s.src.y, s.src.w, s.src.h, -x - drawW, y, drawW, drawH);
  } else {
    ctx.drawImage(sheet, s.src.x, s.src.y, s.src.w, s.src.h, x, y, drawW, drawH);
  }

  if (debugFlags.anchor) {
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }

  if (debugFlags.hitbox && entityOrTile.hitbox) {
    ctx.strokeStyle = '#ff2d2d';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      (entityOrTile.hitbox.x * SCALE) - camera.x,
      (entityOrTile.hitbox.y * SCALE) - camera.y,
      entityOrTile.hitbox.w * SCALE,
      entityOrTile.hitbox.h * SCALE,
    );
  }

  ctx.restore();
}
