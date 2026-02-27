import { preprocessSpriteSheet } from './atlas.js';
import { Game } from './game-state.js';
import { createInput } from './input.js';
import { buildRuntimeLevel, loadLevelData } from './level/level-loader.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const spriteSheet = new Image();
spriteSheet.src = 'SpriteSheet.png';

let game;
const input = createInput({
  onRestart: () => {
    if (!game) return;
    if (game.isGameOver || game.state === 'CLEAR') game.hardRestart();
  },
});

async function bootstrap() {
  const levelData = await loadLevelData('./levels/level-1-1.json');
  const runtimeLevel = buildRuntimeLevel(levelData);

  game = new Game({
    canvas,
    ctx,
    input,
    runtimeLevel,
    spriteSource: preprocessSpriteSheet(spriteSheet),
  });

  game.start();
}

spriteSheet.onload = () => {
  bootstrap().catch((err) => {
    console.error(err);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Failed to start game. Check console.', 40, 80);
  });
};
