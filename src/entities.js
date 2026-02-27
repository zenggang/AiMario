import { GAME_STATES, PHYSICS, TILE_SIZE } from './constants.js';

const NON_SOLID_TILES = new Set([' ']);

function isSolidTile(tile) {
  return !NON_SOLID_TILES.has(tile);
}

function playSound(name) {
  console.log(`[Sound] ${name}`);
}

export class Entity {
  constructor(game, x, y, w, h) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.dead = false;
    this.facingRight = true;
  }

  get hitbox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  getRenderData() {
    return { spriteId: 'tile_ground', x: this.x, y: this.y, hitbox: this.hitbox };
  }

  update() {
    if (this.dead) return;
    this.vy += PHYSICS.GRAVITY;
    if (this.vy > PHYSICS.MAX_FALL_SPEED) this.vy = PHYSICS.MAX_FALL_SPEED;

    this.x += this.vx;
    this.checkCollision(this.vx, 0);

    this.y += this.vy;
    this.checkCollision(0, this.vy);
  }

  checkCollision(vx, vy) {
    this.isGrounded = false;

    const map = this.game.level.map;
    let startCol = Math.floor(this.x / TILE_SIZE);
    let endCol = Math.floor((this.x + this.w - 0.1) / TILE_SIZE);
    let startRow = Math.floor(this.y / TILE_SIZE);
    let endRow = Math.floor((this.y + this.h - 0.1) / TILE_SIZE);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (!map[row] || map[row][col] == null) continue;
        const tile = map[row][col];
        if (!isSolidTile(tile)) continue;

        if (vx > 0) {
          this.x = col * TILE_SIZE - this.w;
          this.vx = 0;
        } else if (vx < 0) {
          this.x = col * TILE_SIZE + TILE_SIZE;
          this.vx = 0;
        }

        if (vy > 0) {
          this.y = row * TILE_SIZE - this.h;
          this.vy = 0;
          this.isGrounded = true;
        } else if (vy < 0) {
          this.y = row * TILE_SIZE + TILE_SIZE;
          this.vy = 0;
          this.collideTop(col, row, tile);
        }
      }
    }
  }

  collideTop() {}
}

export class Mario extends Entity {
  constructor(game, x, y) {
    super(game, x, y, 12, 16);
    this.state = 'SMALL';
    this.starTime = 0;
    this.invincibilityTimer = 0;
    this.animTimer = 0;
    this.isJumping = false;
  }

  getRenderData() {
    if (this.invincibilityTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
      return { spriteId: 'mario_small_stand', x: -9999, y: -9999, hitbox: null };
    }

    const prefix = this.state === 'SMALL' ? 'mario_small' : 'mario_big';
    let spriteId = `${prefix}_stand`;

    if (this.dead) spriteId = `${prefix}_die`;
    else if (!this.isGrounded) spriteId = `${prefix}_jump`;
    else if (Math.abs(this.vx) > PHYSICS.MIN_SPEED) {
      const frame = Math.floor(this.animTimer / 5) % 3 + 1;
      spriteId = `${prefix}_walk${frame}`;
    }

    return {
      spriteId,
      x: this.x,
      y: this.y,
      flipX: !this.facingRight,
      hitbox: this.hitbox,
    };
  }

  update() {
    const { game } = this;

    if (this.dead) {
      this.vy += PHYSICS.GRAVITY;
      this.y += this.vy;
      if (this.y > 300) game.restartGame();
      return;
    }

    if (game.state !== GAME_STATES.PLAYING) {
      this.vy += PHYSICS.GRAVITY;
      if (this.vy > PHYSICS.MAX_FALL_SPEED) this.vy = PHYSICS.MAX_FALL_SPEED;
      this.y += this.vy;
      this.checkCollision(0, this.vy);
      this.animTimer++;
      return;
    }

    if (this.y > 300) {
      this.die();
      return;
    }

    if (this.starTime > 0) this.starTime--;
    if (this.invincibilityTimer > 0) this.invincibilityTimer--;

    const maxSpeed = game.input.keys.shift ? PHYSICS.MAX_RUN_SPEED : PHYSICS.MAX_WALK_SPEED;
    const accel = game.input.keys.shift ? PHYSICS.ACCEL_RUN : PHYSICS.ACCEL_WALK;

    if (game.input.keys.left) {
      this.vx -= accel;
      this.facingRight = false;
    } else if (game.input.keys.right) {
      this.vx += accel;
      this.facingRight = true;
    } else {
      this.vx *= PHYSICS.FRICTION;
      if (Math.abs(this.vx) < PHYSICS.MIN_SPEED) this.vx = 0;
    }

    if (this.vx > maxSpeed) this.vx = maxSpeed;
    if (this.vx < -maxSpeed) this.vx = -maxSpeed;

    if (game.input.keys.up && this.isGrounded && !game.input.keys.lastUp) {
      this.vy = PHYSICS.JUMP_FORCE;
      this.isGrounded = false;
      this.isJumping = true;
      playSound('jump');
    }

    let frameGrav = PHYSICS.GRAVITY;
    if (this.isJumping && game.input.keys.up && this.vy < 0) {
      frameGrav *= PHYSICS.JUMP_HOLD_GRAVITY_MODIFIER;
    } else if (this.vy >= 0) {
      this.isJumping = false;
    }

    this.vy += frameGrav;
    if (this.vy > PHYSICS.MAX_FALL_SPEED) this.vy = PHYSICS.MAX_FALL_SPEED;

    game.input.keys.lastUp = game.input.keys.up;

    this.x += this.vx;
    const cameraLeftBound = this.game.camera.x / this.game.scale;
    if (this.x < cameraLeftBound) {
      this.x = cameraLeftBound;
      this.vx = 0;
    }
    this.checkCollision(this.vx, 0);

    this.y += this.vy;
    this.checkCollision(0, this.vy);

    this.animTimer++;

    const flagPoleX = game.level.goal.flagPoleX;
    if (Math.floor((this.x + this.w / 2) / TILE_SIZE) >= flagPoleX) {
      game.triggerFlagpole();
    }
  }

  collideTop(col, row, tile) {
    const map = this.game.level.map;

    if (tile === '3' || tile === '4' || tile === '5') {
      map[row][col] = 'e';
      playSound('bump');
      if (tile === '3') {
        this.game.score += 100;
        this.game.coins++;
        playSound('coin');
      } else if (tile === '4') {
        this.game.items.push(new Mushroom(this.game, col * TILE_SIZE, (row - 1) * TILE_SIZE));
        playSound('powerup_appears');
      } else if (tile === '5') {
        this.game.items.push(new Star(this.game, col * TILE_SIZE, (row - 1) * TILE_SIZE));
        playSound('powerup_appears');
      }
    } else if (tile === '2' && this.state !== 'SMALL') {
      map[row][col] = ' ';
      this.game.score += 50;
      playSound('break_block');
    } else if (tile === '2') {
      playSound('bump');
    }
  }

  takeDamage() {
    if (this.starTime > 0 || this.invincibilityTimer > 0) return;

    if (this.state === 'BIG' || this.state === 'FIRE') {
      this.state = 'SMALL';
      this.y += 16;
      this.h = 16;
      this.invincibilityTimer = 120;
      playSound('damage');
    } else {
      this.die();
    }
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.vy = -5;
    this.vx = 0;
    this.game.lives--;
    playSound('die');
  }
}

export class Enemy extends Entity {
  constructor(game, x, y, w, h) {
    super(game, x, y, w, h);
    this.vx = -0.5;
    this.animTimer = 0;
  }

  update() {
    if (this.dead) return;

    this.vy += PHYSICS.GRAVITY;
    this.y += this.vy;

    const map = this.game.level.map;
    const targetX = this.x + this.vx;
    let startCol = Math.floor(targetX / TILE_SIZE);
    let endCol = Math.floor((targetX + this.w - 0.1) / TILE_SIZE);
    let startRow = Math.floor(this.y / TILE_SIZE);
    let endRow = Math.floor((this.y + this.h - 0.1) / TILE_SIZE);

    let colHit = false;
    for (let r = startRow; r <= endRow; r++) {
      const leftTile = map[r]?.[startCol] ?? ' ';
      const rightTile = map[r]?.[endCol] ?? ' ';
      if (this.vx < 0 && isSolidTile(leftTile)) colHit = true;
      if (this.vx > 0 && isSolidTile(rightTile)) colHit = true;
    }

    if (colHit) this.vx *= -1;
    else this.x += this.vx;

    startCol = Math.floor(this.x / TILE_SIZE);
    endCol = Math.floor((this.x + this.w - 0.1) / TILE_SIZE);
    const endRowFall = Math.floor((this.y + this.h - 0.1) / TILE_SIZE);

    for (let c = startCol; c <= endCol; c++) {
      const tile = map[endRowFall]?.[c] ?? ' ';
      if (isSolidTile(tile)) {
        this.y = endRowFall * TILE_SIZE - this.h;
        this.vy = 0;
        this.isGrounded = true;
      }
    }

    this.handleMarioCollision();
    this.animTimer++;
  }

  handleMarioCollision() {
    const mario = this.game.mario;
    if (this.dead || mario.dead) return;

    const hit = (
      mario.x < this.x + this.w &&
      mario.x + mario.w > this.x &&
      mario.y < this.y + this.h &&
      mario.y + mario.h > this.y
    );

    if (!hit) return;

    if (mario.starTime > 0) {
      this.die();
      this.game.score += 100;
      return;
    }

    if (mario.vy > 0 && mario.y + mario.h - mario.vy <= this.y + 4) {
      this.stomped();
      mario.vy = PHYSICS.JUMP_FORCE * 0.8;
      mario.isGrounded = false;
      this.game.score += 100;
    } else {
      mario.takeDamage();
    }
  }

  die() {
    this.dead = true;
    playSound('kick');
  }

  stomped() {}
}

export class Goomba extends Enemy {
  constructor(game, x, y) {
    super(game, x, y, 16, 16);
    this.flat = false;
    this.flatTimer = 0;
  }

  stomped() {
    this.flat = true;
    this.dead = true;
    this.vx = 0;
    this.flatTimer = 30;
    playSound('stomp');
  }

  update() {
    if (this.flat) {
      this.flatTimer--;
      return;
    }
    super.update();
  }

  getRenderData() {
    if (this.flat && this.flatTimer <= 0) return { spriteId: 'goomba_flat', x: -9999, y: -9999 };
    if (this.flat) return { spriteId: 'goomba_flat', x: this.x, y: this.y, hitbox: this.hitbox };
    const frame = Math.floor(this.animTimer / 10) % 2 + 1;
    return { spriteId: `goomba_walk${frame}`, x: this.x, y: this.y, hitbox: this.hitbox };
  }
}

export class Koopa extends Enemy {
  constructor(game, x, y) {
    super(game, x, y, 16, 24);
    this.state = 'WALK';
    this.shellTimer = 0;
  }

  stomped() {
    if (this.state === 'WALK') {
      this.state = 'SHELL_IDLE';
      this.vx = 0;
      this.h = 16;
      this.y += 8;
      this.shellTimer = 300;
      playSound('stomp');
    } else if (this.state === 'SHELL_IDLE') {
      this.state = 'SHELL_SLIDE';
      this.vx = this.game.mario.x < this.x ? 3.5 : -3.5;
      playSound('kick');
    } else if (this.state === 'SHELL_SLIDE') {
      this.state = 'SHELL_IDLE';
      this.vx = 0;
      playSound('stomp');
    }
  }

  update() {
    if (this.dead) return;

    super.update();

    if (this.state === 'SHELL_IDLE') {
      this.shellTimer--;
      if (this.shellTimer <= 0) {
        this.state = 'WALK';
        this.h = 24;
        this.y -= 8;
        this.vx = -0.5;
      }
    }

    if (this.state === 'SHELL_SLIDE') {
      for (const e of this.game.entities) {
        if (e === this || e === this.game.mario || e.dead || e.flat) continue;
        const hit = this.x < e.x + e.w && this.x + this.w > e.x && this.y < e.y + e.h && this.y + this.h > e.y;
        if (hit) {
          e.die();
          this.game.score += 200;
        }
      }
    }
  }

  getRenderData() {
    if (this.state === 'WALK') {
      const frame = Math.floor(this.animTimer / 10) % 2 + 1;
      return { spriteId: `koopa_walk${frame}`, x: this.x, y: this.y, flipX: this.vx > 0, hitbox: this.hitbox };
    }
    return { spriteId: 'koopa_shell', x: this.x, y: this.y, hitbox: this.hitbox };
  }
}

export class PiranhaPlant extends Enemy {
  constructor(game, x, y) {
    super(game, x, y, 16, 24);
    this.baseY = y;
    this.state = 'HIDDEN';
    this.timer = 120;
    this.vx = 0;
    this.vy = 0;
  }

  update() {
    if (this.dead) return;

    this.animTimer++;
    const marioDist = Math.abs(this.game.mario.x - this.x);

    if (this.state === 'HIDDEN') {
      this.timer--;
      if (this.timer <= 0 && marioDist > 32) this.state = 'RISING';
    } else if (this.state === 'RISING') {
      this.y -= 0.5;
      if (this.y <= this.baseY - 24) {
        this.y = this.baseY - 24;
        this.state = 'UP';
        this.timer = 120;
      }
      this.handleMarioCollision();
    } else if (this.state === 'UP') {
      this.timer--;
      if (this.timer <= 0) this.state = 'FALLING';
      this.handleMarioCollision();
    } else if (this.state === 'FALLING') {
      this.y += 0.5;
      if (this.y >= this.baseY) {
        this.y = this.baseY;
        this.state = 'HIDDEN';
        this.timer = 120;
      }
      this.handleMarioCollision();
    }
  }

  stomped() {
    if (this.game.mario.starTime > 0) {
      this.die();
      this.game.score += 200;
    } else {
      this.game.mario.takeDamage();
    }
  }

  getRenderData() {
    if (this.state === 'HIDDEN') return { spriteId: 'piranha_1', x: -9999, y: -9999 };
    const frame = Math.floor(this.animTimer / 10) % 2 + 1;
    return { spriteId: `piranha_${frame}`, x: this.x, y: this.y, hitbox: this.hitbox };
  }
}

export class Mushroom extends Entity {
  constructor(game, x, y) {
    super(game, x, y, 16, 16);
    this.targetY = y;
    this.y = y + 16;
    this.emerging = true;
    this.emergeSpeed = 0.8;
    this.vx = 0;
    this.vy = 0;
  }

  update() {
    if (this.emerging) {
      this.y -= this.emergeSpeed;
      if (this.y <= this.targetY) {
        this.y = this.targetY;
        this.emerging = false;
        this.vx = 1;
      }
      return;
    }

    super.update();

    const map = this.game.level.map;
    const row = Math.floor(this.y / TILE_SIZE);
    const colRight = Math.floor((this.x + this.w + this.vx) / TILE_SIZE);
    const colLeft = Math.floor((this.x + this.vx) / TILE_SIZE);

    if (this.vx > 0 && isSolidTile(map[row]?.[colRight] ?? ' ')) this.vx *= -1;
    if (this.vx < 0 && isSolidTile(map[row]?.[colLeft] ?? ' ')) this.vx *= -1;

    const mario = this.game.mario;
    const hit = mario.x < this.x + this.w && mario.x + mario.w > this.x && mario.y < this.y + this.h && mario.y + mario.h > this.y;
    if (!hit) return;

    this.dead = true;
    this.game.score += 1000;
    if (mario.state === 'SMALL') {
      mario.state = 'BIG';
      mario.h = 32;
      mario.y -= 16;
      playSound('powerup');
    }
  }

  getRenderData() {
    return { spriteId: 'item_mushroom', x: this.x, y: this.y, hitbox: this.hitbox };
  }
}

export class Star extends Entity {
  constructor(game, x, y) {
    super(game, x, y, 16, 16);
    this.targetY = y;
    this.y = y + 16;
    this.emerging = true;
    this.emergeSpeed = 0.8;
    this.vx = 0;
    this.vy = 0;
  }

  update() {
    if (this.emerging) {
      this.y -= this.emergeSpeed;
      if (this.y <= this.targetY) {
        this.y = this.targetY;
        this.emerging = false;
        this.vx = 1.5;
        this.vy = -3;
      }
      return;
    }

    super.update();

    const map = this.game.level.map;
    const row = Math.floor(this.y / TILE_SIZE);
    const colRight = Math.floor((this.x + this.w + this.vx) / TILE_SIZE);
    const colLeft = Math.floor((this.x + this.vx) / TILE_SIZE);

    if (this.vx > 0 && isSolidTile(map[row]?.[colRight] ?? ' ')) this.vx *= -1;
    if (this.vx < 0 && isSolidTile(map[row]?.[colLeft] ?? ' ')) this.vx *= -1;

    const mario = this.game.mario;
    const hit = mario.x < this.x + this.w && mario.x + mario.w > this.x && mario.y < this.y + this.h && mario.y + mario.h > this.y;
    if (!hit) return;

    this.dead = true;
    this.game.score += 1000;
    mario.starTime = 600;
    playSound('starman_music');
  }

  getRenderData() {
    return { spriteId: 'item_star', x: this.x, y: this.y, hitbox: this.hitbox };
  }
}

export function createEntity(game, type, spawn, props = {}) {
  const x = spawn.x * TILE_SIZE;
  const y = spawn.y * TILE_SIZE;

  if (type === 'goomba') return new Goomba(game, x, y);
  if (type === 'koopa') return new Koopa(game, x, y - 8);
  if (type === 'piranha') return new PiranhaPlant(game, x, y);

  throw new Error(`Unknown entity type: ${type} (${JSON.stringify(props)})`);
}
