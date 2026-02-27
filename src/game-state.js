import { FLAG_ROWS, GAME_STATES, SCALE } from './constants.js';
import { createEntity, Mario } from './entities.js';
import { drawScene } from './renderer.js';

export class Game {
  constructor({ canvas, ctx, input, runtimeLevel, spriteSource }) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.input = input;
    this.debugFlags = input.debugFlags;
    this.spriteSource = spriteSource;
    this.scale = SCALE;

    this.runtimeLevel = runtimeLevel;
    this.level = runtimeLevel;

    this.camera = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      update: (target) => {
        this.camera.width = this.canvas.width;
        this.camera.height = this.canvas.height;
        const targetX = target.x * this.scale - this.camera.width * 0.4;
        if (targetX > this.camera.x) this.camera.x = targetX;
        this.camera.x = Math.max(0, this.camera.x);
      },
    };

    this.loopHandle = 0;
    this.lastTimeUpdate = Date.now();
    this.frameCount = 0;

    this.frame = this.frame.bind(this);

    this.resetGameProgress();
    this.resetLevelState();
  }

  resetGameProgress() {
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
  }

  resetLevelState() {
    this.level = JSON.parse(JSON.stringify(this.runtimeLevel));

    this.gameTime = 400;
    this.isGameOver = false;
    this.state = GAME_STATES.PLAYING;
    this.clearTimer = 0;
    this.flagY = this.level.goal.flagTopRow ?? FLAG_ROWS.TOP;

    this.entities = [];
    this.items = [];

    const spawnX = this.level.spawn.x * 16;
    const spawnY = this.level.spawn.y * 16;
    this.mario = new Mario(this, spawnX, spawnY);
    this.entities.push(this.mario);

    for (const e of this.level.entities) {
      this.entities.push(createEntity(this, e.type, { x: e.x, y: e.y }, e.props));
    }

    this.lastTimeUpdate = Date.now();
    this.camera.x = 0;
  }

  hardRestart() {
    this.resetGameProgress();
    this.resetLevelState();
  }

  restartGame() {
    if (this.lives <= 0) {
      this.isGameOver = true;
      return;
    }
    this.resetLevelState();
  }

  triggerFlagpole() {
    if (this.state !== GAME_STATES.PLAYING) return;
    this.state = GAME_STATES.FLAGPOLE;
    this.mario.vx = 0;
    this.mario.vy = 0;
    this.flagY = this.level.goal.flagTopRow ?? FLAG_ROWS.TOP;
    this.clearTimer = 0;
  }

  update() {
    if (this.isGameOver) return;

    this.frameCount++;

    if (this.state === GAME_STATES.FLAGPOLE) {
      this.clearTimer++;
      const bottom = this.level.goal.flagBottomRow ?? FLAG_ROWS.BOTTOM;
      if (this.clearTimer % 3 === 0 && this.flagY < bottom) this.flagY++;
      if (this.flagY >= bottom && this.clearTimer > 90) {
        this.state = GAME_STATES.CLEAR;
        this.clearTimer = 0;
      }
      this.camera.update(this.mario);
      this.mario.update();
      return;
    }

    if (this.state === GAME_STATES.CLEAR) {
      this.clearTimer++;
      return;
    }

    if (Date.now() - this.lastTimeUpdate > 1000) {
      this.gameTime--;
      this.lastTimeUpdate = Date.now();
      if (this.gameTime <= 0) this.mario.die();
    }

    this.items = this.items.filter((i) => !i.dead);
    for (const item of this.items) item.update();

    this.entities = this.entities.filter((e) => !(e.flat && e.flatTimer <= 0));
    for (const e of this.entities) e.update();

    this.camera.update(this.mario);
  }

  draw() {
    drawScene(this);
  }

  frame() {
    this.update();
    this.draw();
    this.loopHandle = requestAnimationFrame(this.frame);
  }

  start() {
    if (this.loopHandle) cancelAnimationFrame(this.loopHandle);
    this.loopHandle = requestAnimationFrame(this.frame);
  }
}
