import { TILE_SIZE, SCALE, GAME_STATES } from './constants.js';
import { renderSprite } from './atlas.js';

const TILE_TO_SPRITE = {
  '1': 'tile_ground',
  '2': 'tile_brick',
  '3': 'tile_qblock1',
  '4': 'tile_qblock1',
  '5': 'tile_qblock1',
  'e': 'tile_qblock_empty',
  '7': 'tile_pipe_top_l',
  '8': 'tile_pipe_top_r',
  '9': 'tile_pipe_body_l',
  'a': 'tile_pipe_body_r',
  's': 'tile_ground',
  'f': 'tile_ground',
};

export function drawScene(game) {
  const { ctx, canvas, level, entities, items, mario, camera, frameCount, debugFlags, spriteSource } = game;

  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawClouds(game);

  const startCol = Math.max(0, Math.floor(camera.x / (TILE_SIZE * SCALE)));
  const endCol = Math.min(level.width, Math.floor((camera.x + canvas.width) / (TILE_SIZE * SCALE)) + 1);

  for (let r = 0; r < level.height; r++) {
    for (let c = startCol; c < endCol; c++) {
      const tile = level.map[r][c];
      if (tile === ' ') continue;

      let spriteId = TILE_TO_SPRITE[tile];
      if (tile === '3' || tile === '4' || tile === '5') {
        spriteId = Math.floor(frameCount / 15) % 2 === 0 ? 'tile_qblock1' : 'tile_qblock_empty';
      }

      renderSprite(
        ctx,
        spriteSource,
        { spriteId, x: c * TILE_SIZE, y: r * TILE_SIZE },
        camera,
        { hitbox: false, anchor: false },
      );

      if (debugFlags.tileBounds) {
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.35)';
        ctx.strokeRect(c * TILE_SIZE * SCALE - camera.x, r * TILE_SIZE * SCALE - camera.y, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
      }
    }
  }

  drawFlagpole(game);
  drawCastle(game);

  for (const item of items) {
    renderSprite(ctx, spriteSource, item.getRenderData(), camera, debugFlags);
  }

  for (const e of entities) {
    if (e === mario) continue;
    renderSprite(ctx, spriteSource, e.getRenderData(), camera, debugFlags);
  }

  renderSprite(ctx, spriteSource, mario.getRenderData(), camera, debugFlags);
  drawFrontDecor(game);

  if (debugFlags.grid) drawGrid(game);
  drawHUD(game);
}

function drawClouds(game) {
  const { ctx, level, camera, canvas } = game;
  const clouds = level.decorBack?.clouds || [];

  ctx.fillStyle = 'white';
  for (const cl of clouds) {
    const sx = cl.x * TILE_SIZE * SCALE - camera.x;
    const sy = cl.y * TILE_SIZE * SCALE - camera.y;
    if (sx < -80 || sx > canvas.width + 80) continue;
    ctx.beginPath();
    ctx.arc(sx + 20, sy + 20, 14, Math.PI, 0);
    ctx.arc(sx + 36, sy + 10, 18, Math.PI, 0);
    ctx.arc(sx + 52, sy + 20, 14, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFlagpole(game) {
  const { ctx, camera, state, flagY } = game;
  const { flagPoleX, flagTopRow, flagBottomRow } = game.level.goal;

  const px = flagPoleX * TILE_SIZE * SCALE - camera.x + TILE_SIZE * SCALE / 2;
  const topY = flagTopRow * TILE_SIZE * SCALE - camera.y;
  const botY = flagBottomRow * TILE_SIZE * SCALE - camera.y;

  ctx.strokeStyle = '#888';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(px, topY);
  ctx.lineTo(px, botY);
  ctx.stroke();

  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(px, topY, 6, 0, Math.PI * 2);
  ctx.fill();

  const fy = flagY * TILE_SIZE * SCALE - camera.y;
  ctx.fillStyle = '#00AA00';
  ctx.beginPath();
  ctx.moveTo(px, fy);
  ctx.lineTo(px + 28, fy + 10);
  ctx.lineTo(px, fy + 20);
  ctx.closePath();
  ctx.fill();

  if (state !== GAME_STATES.PLAYING) {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(px - 2, topY, 4, botY - topY);
  }
}

function drawCastle(game) {
  const { ctx, level, camera, canvas } = game;
  if (!level.decorBack?.castle) return;

  const cx = level.decorBack.castle.x * TILE_SIZE * SCALE - camera.x;
  const cy = level.decorBack.castle.y * TILE_SIZE * SCALE - camera.y;
  const tw = TILE_SIZE * SCALE;
  const th = TILE_SIZE * SCALE;

  if (cx > canvas.width + 200 || cx < -200) return;

  ctx.fillStyle = '#888';
  ctx.fillRect(cx, cy, tw * 5, th * 4);
  ctx.fillRect(cx, cy - th, tw, th);
  ctx.fillRect(cx + tw * 2, cy - th, tw, th);
  ctx.fillRect(cx + tw * 4, cy - th, tw, th);

  ctx.fillStyle = '#000';
  ctx.fillRect(cx + tw * 1.5, cy + th * 2, tw * 2, th * 2);
  ctx.fillRect(cx + tw * 0.5, cy + th, tw, th);
  ctx.fillRect(cx + tw * 3.5, cy + th, tw, th);
}

function drawFrontDecor(game) {
  const { ctx, level, camera } = game;
  const bushes = level.decorFront?.bushes || [];
  ctx.fillStyle = '#2ea043';

  for (const b of bushes) {
    const x = b.x * TILE_SIZE * SCALE - camera.x;
    const y = b.y * TILE_SIZE * SCALE - camera.y;
    const w = (b.w || 2) * TILE_SIZE * SCALE;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + 20, w * 0.5, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGrid(game) {
  const { ctx, canvas } = game;
  const step = TILE_SIZE * SCALE;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 1;

  for (let x = 0; x < canvas.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y < canvas.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawHUD(game) {
  const { ctx, canvas, score, coins, gameTime, lives, isGameOver, state, clearTimer } = game;

  ctx.fillStyle = 'white';
  ctx.font = '24px Courier New';
  ctx.textAlign = 'left';

  ctx.fillText('MARIO', 40, 40);
  ctx.fillText(score.toString().padStart(6, '0'), 40, 65);

  ctx.fillText('COINS', 200, 40);
  ctx.fillText(`x${coins.toString().padStart(2, '0')}`, 200, 65);

  ctx.fillText('WORLD', 350, 40);
  ctx.fillText('1-1', 350, 65);

  ctx.fillText('TIME', 500, 40);
  ctx.fillText(gameTime.toString().padStart(3, '0'), 500, 65);

  ctx.fillText(`LIVES: ${lives}`, 650, 40);

  if (isGameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.font = '16px Courier New';
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 40);
  }

  if (state === GAME_STATES.CLEAR && clearTimer > 30) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '32px Courier New';
    ctx.fillText('COURSE CLEAR!', canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '24px Courier New';
    ctx.fillText(`SCORE: ${score.toString().padStart(6, '0')}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
  }

  ctx.textAlign = 'left';
  ctx.font = '12px Courier New';
  ctx.fillText('Debug: F2 grid | F3 hitbox | F4 anchor | F5 tile bounds', 20, canvas.height - 20);
}
