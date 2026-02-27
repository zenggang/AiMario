// ====== 画布与渲染系统 ======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false; // 保持像素风格
}
window.addEventListener("resize", resize);
resize();

// ====== 游戏常量与物理参数 ======
const TILE_SIZE = 16;
const SCALE = 3;
const GRAVITY = 0.25;
const FRICTION = 0.90;
const MIN_SPEED = 0.1;
const MAX_FALL_SPEED = 7;
const MAX_WALK_SPEED = 2.5;
const MAX_RUN_SPEED = 4.0;
const ACCEL_WALK = 0.06;
const ACCEL_RUN = 0.1;
const JUMP_FORCE = -6.5;
const JUMP_HOLD_GRAVITY_MODIFIER = 0.5;

// ====== 音效占位符 ======
function playSound(name) {
    console.log(`[Sound] 播放音效: ${name}`);
}

// ====== 输入系统 ======
const keys = { left: false, right: false, up: false, shift: false, lastUp: false };
window.addEventListener("keydown", e => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.up = true;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = true;
    if (e.code === "KeyR" && gameState === "CLEAR") init();
});
window.addEventListener("keyup", e => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.up = false;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = false;
});

// ====== Sprite Sheet 加载与配置 ======
// 需根据实际 SpriteSheet.png 像素位调整，这里提供经典版模拟坐标
const spriteSheet = new Image();
spriteSheet.src = "SpriteSheet.png";

// ====================
// Sprite Sheet 配置
// ====================
// 精灵图为不规则排列的素材，坐标通过像素扫描精确测量得出。
// 背景是不透明的灰白棋盘格，嘄渲时我们用 ctx.drawImage 截取原图像素，
// 然后通过 Canvas 绘制缩放到游戏内 TILE_SIZE*SCALE 的尺寸。
const Sprites = {
    // --- 大马里奥 (y≈8-101, 约 77px 高) ---
    mario_big_stand:  { x: 41,  y: 25, w: 48, h: 77, gw: 16, gh: 32 },
    mario_big_walk1:  { x: 111, y: 23, w: 59, h: 79, gw: 16, gh: 32 },
    mario_big_walk2:  { x: 188, y: 14, w: 65, h: 85, gw: 16, gh: 32 },
    mario_big_walk3:  { x: 276, y: 14, w: 42, h: 88, gw: 16, gh: 32 },
    mario_big_duck:   { x: 346, y: 20, w: 60, h: 82, gw: 16, gh: 32 },
    mario_big_jump:   { x: 487, y: 14, w: 55, h: 88, gw: 16, gh: 32 },
    
    // --- 小马里奥 (y≈128-220, 约 88px 高) ---
    mario_small_stand: { x: 41,  y: 132, w: 54, h: 88, gw: 16, gh: 16 },
    mario_small_walk1: { x: 118, y: 128, w: 53, h: 92, gw: 16, gh: 16 },
    mario_small_walk2: { x: 205, y: 128, w: 42, h: 91, gw: 16, gh: 16 },
    mario_small_walk3: { x: 273, y: 142, w: 80, h: 75, gw: 16, gh: 16 },
    mario_small_jump:  { x: 487, y: 133, w: 59, h: 83, gw: 16, gh: 16 },
    mario_small_die:   { x: 576, y: 133, w: 61, h: 86, gw: 16, gh: 16 },
    
    // --- 板栗仔 Goomba (y≈303-365) ---
    goomba_walk1: { x: 40,  y: 303, w: 62, h: 63, gw: 16, gh: 16 },
    goomba_walk2: { x: 119, y: 276, w: 58, h: 90, gw: 16, gh: 16 },
    goomba_flat:  { x: 198, y: 282, w: 57, h: 84, gw: 16, gh: 16 },
    
    // --- Koopa 绿龟 (y≈278-365) ---
    koopa_walk1: { x: 486, y: 278, w: 68, h: 88, gw: 16, gh: 24 },
    koopa_walk2: { x: 575, y: 276, w: 68, h: 90, gw: 16, gh: 24 },
    koopa_shell:  { x: 669, y: 292, w: 62, h: 74, gw: 16, gh: 16 },
    
    // --- 食人花 Piranha (y≈271-365) ---
    piranha_1: { x: 949, y: 271, w: 58, h: 95, gw: 16, gh: 24 },
    piranha_2: { x: 949, y: 271, w: 58, h: 95, gw: 16, gh: 24 },
    
    // --- 方块/地砖 (连续带状，y≈452-503) ---
    // 地砖带总宽 846px，个体宽约 53px，纵向约 52px
    tile_ground:       { x: 47,  y: 452, w: 53, h: 52, gw: 16, gh: 16 },
    tile_brick:        { x: 100, y: 452, w: 53, h: 52, gw: 16, gh: 16 },
    tile_qblock1:      { x: 264, y: 452, w: 53, h: 52, gw: 16, gh: 16 },
    tile_qblock_empty: { x: 370, y: 452, w: 53, h: 52, gw: 16, gh: 16 },
    
    // --- 管道 (y≈594-713) ---
    tile_pipe_top_l:  { x: 47, y: 594, w: 47, h: 60, gw: 16, gh: 16 },
    tile_pipe_top_r:  { x: 94, y: 594, w: 47, h: 60, gw: 16, gh: 16 },
    tile_pipe_body_l: { x: 47, y: 654, w: 47, h: 60, gw: 16, gh: 16 },
    tile_pipe_body_r: { x: 94, y: 654, w: 47, h: 60, gw: 16, gh: 16 },
    
    // --- 道具 (y≈652-711) ---
    item_mushroom: { x: 1044, y: 652, w: 60, h: 60, gw: 16, gh: 16 },
    item_coin1:    { x: 916,  y: 652, w: 38, h: 59, gw: 16, gh: 16 },
    item_coin2:    { x: 977,  y: 653, w: 50, h: 59, gw: 16, gh: 16 },
    item_coin3:    { x: 916,  y: 652, w: 38, h: 59, gw: 16, gh: 16 },
    item_star:     { x: 1185, y: 652, w: 53, h: 60, gw: 16, gh: 16 }
};

// 辅助绘制函数，支持镜像翻转
// 每个精灵定义了 gw/gh（游戏内逻辑宽高，单位为像素）。
// 渲染时缩放到 gw*SCALE, gh*SCALE 大小。
function drawSprite(ctx, id, x, y, flipX = false) {
    const s = Sprites[id];
    if (!s) return;
    // 优先使用去除棋盘格背景后的 canvas，否则用原图
    const src = window._processedSheet || spriteSheet;
    if (!src) return;
    
    const drawW = s.gw * SCALE;
    const drawH = s.gh * SCALE;

    ctx.save();
    if (flipX) {
        ctx.scale(-1, 1);
        ctx.drawImage(src, s.x, s.y, s.w, s.h, -x - drawW, y, drawW, drawH);
    } else {
        ctx.drawImage(src, s.x, s.y, s.w, s.h, x, y, drawW, drawH);
    }
    ctx.restore();
}

// ====== 关卡定义 ======
// 字符: 1=地面, 2=砖块, 3=硬币问号箱, 4=蘑菇问号箱, 5=星问号箱, e=空问号箱
//       7=左上管, 8=右上管, 9=左管身, a=右管身
//       g=Goomba, k=Koopa, p=食人花
//       s=台阶砖(不可破坏), f=旗杆底座
const mapRaw = [
//   0         1         2         3         4         5         6         7         8         9         10        11        12        13        14        15        16        17        18        19        20
//   0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
    "                                                                                                                                                                                                              ",
    "                                                                                                                                                                                                              ",
    "                                                                                                                                                                                                              ",
    "                                                                                                                                                                                                              ",
    "                                                                                                                                                                                                              ",
    "                                                                                                                                                                                                              ",
    "                                                                                                    2   2 3 2                                                                                    s            ",
    "                                                                                                                                                                                                 ss           ",
    "                                                                                                                                                                                                 sss          ",
    "                 3   2 4 2 3                                                                       2 2 2 2 2 2                                                                                   ssss         ",
    "                                                                                                                                                                                                 sssss        ",
    "                                       78                   78                                                                                                                                   ssssss       ",
    "                             78        9a                   9a                                                                                                                                   sssssss      ",
    "                   g         9a  k  p  9a          g   g   9a                                                                                                                                   ssssssss     ",
    "111111111111111111111111111  1111111111111111111  111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111ssssssssf    ",
    "111111111111111111111111111  1111111111111111111  111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"
];

let map = [];
let entities = [];
let items = [];
let particles = [];
let gameTime = 400;
let lastTimeUpdate = 0;
let score = 0;
let coins = 0;
let lives = 3;
let isGameOver = false;
let frameCount = 0;
let gameState = "PLAYING"; // "PLAYING" | "FLAGPOLE" | "CLEAR"
let flagY = 0;
let flagPoleX = 0;
let clearTimer = 0;
const FLAG_TOP_ROW = 6;
const FLAG_BOTTOM_ROW = 14;

// ====== 镜头对象 ======
const camera = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    update(target) {
        this.width = canvas.width;
        this.height = canvas.height;
        let targetX = target.x * SCALE - this.width * 0.4;
        // 镜头只能向右
        if (targetX > this.x) {
            this.x = targetX;
        }
        // 限制底部边界
        this.x = Math.max(0, this.x);
    }
};

// ====== 核心实体类 ======
class Entity {
    constructor(x, y, w, h) {
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

    update() {
        if(this.dead) return;
        this.vy += GRAVITY;
        if(this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;
        
        // 分离 X Y 轴碰撞检测以防止斜对角穿模
        this.x += this.vx;
        this.checkCollision(this.vx, 0);
        
        this.y += this.vy;
        this.checkCollision(0, this.vy);
    }

    // AABB 碰撞检测
    checkCollision(vx, vy) {
        this.isGrounded = false;
        
        let startCol = Math.floor(this.x / TILE_SIZE);
        let endCol = Math.floor((this.x + this.w - 0.1) / TILE_SIZE);
        let startRow = Math.floor(this.y / TILE_SIZE);
        let endRow = Math.floor((this.y + this.h - 0.1) / TILE_SIZE);

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                if (row >= 0 && row < map.length && col >= 0 && col < map[0].length) {
                    let tile = map[row][col];
                    if (tile !== " " && tile !== "g" && tile !== "k" && tile !== "p") { // solid tiles
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
        }
    }

    collideTop(col, row, tile) {
        // 重写此方法处理顶撞砖块
    }
}

// ====== 马里奥类 ======
class Mario extends Entity {
    constructor(x, y) {
        super(x, y, 12, 16);
        this.state = "SMALL"; // SMALL, BIG, FIRE
        this.starTime = 0;
        this.invincibilityTimer = 0;
        this.animTimer = 0;
        this.isJumping = false;
        this.jumpKilledTarget = false;
    }

    update() {
        if(this.dead) {
            this.vy += GRAVITY;
            this.y += this.vy;
            if(this.y > 300) restartGame();
            return;
        }

        if (gameState !== "PLAYING") {
            this.vy += GRAVITY;
            if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;
            this.y += this.vy;
            this.checkCollision(0, this.vy);
            this.animTimer++;
            return;
        }

        if(this.y > 300) { // 掉下悬崖
            this.die();
            return;
        }

        // 状态更新
        if(this.starTime > 0) this.starTime--;
        if(this.invincibilityTimer > 0) this.invincibilityTimer--;

        // 水平运动控制
        let maxSpeed = keys.shift ? MAX_RUN_SPEED : MAX_WALK_SPEED;
        let accel = keys.shift ? ACCEL_RUN : ACCEL_WALK;

        if (keys.left) {
            this.vx -= accel;
            this.facingRight = false;
        } else if (keys.right) {
            this.vx += accel;
            this.facingRight = true;
        } else {
            // 摩擦力
            this.vx *= FRICTION;
            if (Math.abs(this.vx) < MIN_SPEED) this.vx = 0;
        }

        // 限制速度
        if (this.vx > maxSpeed) this.vx = maxSpeed;
        if (this.vx < -maxSpeed) this.vx = -maxSpeed;

        // 跳跃控制 (按住跳得更高)
        if (keys.up && this.isGrounded && !keys.lastUp) {
            this.vy = JUMP_FORCE;
            this.isGrounded = false;
            this.isJumping = true;
            playSound("jump");
        }
        
        // 重力(如果在跳升阶段且仍按住跳跃键，减小重力)
        let frameGrav = GRAVITY;
        if(this.isJumping && keys.up && this.vy < 0) {
            frameGrav *= JUMP_HOLD_GRAVITY_MODIFIER;
        } else if (this.vy >= 0) {
            this.isJumping = false;
        }
        
        this.vy += frameGrav;
        if(this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

        keys.lastUp = keys.up;

        // X轴碰撞
        this.x += this.vx;
        // 阻止马里奥走到镜头左边外面
        let cameraLeftBound = camera.x / SCALE;
        if(this.x < cameraLeftBound) {
            this.x = cameraLeftBound;
            this.vx = 0;
        }
        this.checkCollision(this.vx, 0);

        // Y轴碰撞
        this.y += this.vy;
        this.checkCollision(0, this.vy);

        this.animTimer++;

        // 旗杆碰撞检测
        if (gameState === "PLAYING" && flagPoleX > 0) {
            if (Math.floor((this.x + this.w / 2) / TILE_SIZE) >= flagPoleX) {
                triggerFlagpole();
            }
        }
    }

    collideTop(col, row, tile) {
        if(tile === "3" || tile === "4" || tile === "5") {
            // 处理顶问号箱
            map[row][col] = "e"; // empty q block
            playSound("bump");
            if(tile === "3") {
                spawnCoinPoint(col * TILE_SIZE, row * TILE_SIZE);
                score += 100;
                coins++;
                playSound("coin");
            } else if (tile === "4") {
                items.push(new Mushroom(col * TILE_SIZE, (row-1) * TILE_SIZE));
                playSound("powerup_appears");
            } else if (tile === "5") {
                items.push(new Star(col * TILE_SIZE, (row-1) * TILE_SIZE));
                playSound("powerup_appears");
            }
        } else if (tile === "2" && this.state !== "SMALL") {
            // 大马里奥打碎砖块
            map[row][col] = " ";
            playSound("break_block");
            score += 50;
        } else if (tile === "2") {
            playSound("bump");
        }
    }

    takeDamage() {
        if (this.starTime > 0 || this.invincibilityTimer > 0) return;
        if (this.state === "BIG" || this.state === "FIRE") {
            this.state = "SMALL";
            this.y += 16;
            this.h = 16;
            this.invincibilityTimer = 120; // 2秒无敌闪烁
            playSound("pipe"); // 借用音效代表受伤变小
        } else {
            this.die();
        }
    }

    die() {
        this.dead = true;
        this.vy = -5;
        this.vx = 0;
        playSound("die");
        lives--;
    }

    draw(ctx) {
        if (this.invincibilityTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            return; // 闪烁隐藏
        }
        
        let spriteId = "mario_small_stand";
        let prefix = this.state === "SMALL" ? "mario_small" : "mario_big";
        
        if (this.dead) {
            spriteId = `${prefix}_die`;
        } else if (!this.isGrounded) {
            spriteId = `${prefix}_jump`;
        } else if (Math.abs(this.vx) > MIN_SPEED) {
            // 简单步行帧动画计算
            let frame = Math.floor(this.animTimer / 5) % 3 + 1;
            spriteId = `${prefix}_walk${frame}`;
            // 检查滑行 (方向键和移动方向相反)
            if((keys.left && this.vx > 0) || (keys.right && this.vx < 0)) {
                // 没有单独滑行动画，先暂时代替
                spriteId = `${prefix}_stand`; 
            }
        } else {
            spriteId = `${prefix}_stand`;
        }

        drawSprite(ctx, spriteId, this.x * SCALE - camera.x, this.y * SCALE - camera.y, !this.facingRight);
    }
}

// ====== 敌人基类 ======
class Enemy extends Entity {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.vx = -0.5; // 默认向左走
        this.animTimer = 0;
    }
    
    update() {
        if(this.dead) return;
        this.vy += GRAVITY;
        this.y += this.vy;
        
        let targetX = this.x + this.vx;
        // 敌人碰撞反弹逻辑 (简化)
        let startCol = Math.floor(targetX / TILE_SIZE);
        let endCol = Math.floor((targetX + this.w - 0.1) / TILE_SIZE);
        let startRow = Math.floor(this.y / TILE_SIZE);
        let endRow = Math.floor((this.y + this.h - 0.1) / TILE_SIZE);
        
        let colHit = false;
        let rowHit = false;
        
        // 检查墙壁碰撞
        for(let r = startRow; r <= endRow; r++) {
            if(map[r] && (map[r][startCol] !== " " || map[r][endCol] !== " ")) {
                let leftTile = map[r][startCol];
                let rightTile = map[r][endCol];
                if(leftTile != " " && leftTile != "g" && leftTile != "k" && leftTile != "p" && this.vx < 0) colHit = true;
                if(rightTile != " " && rightTile != "g" && rightTile != "k" && rightTile != "p" && this.vx > 0) colHit = true;
            }
        }
        if(colHit) this.vx *= -1; // 碰墙转身
        else this.x += this.vx;
        
        // 检查地面碰撞
        startCol = Math.floor(this.x / TILE_SIZE);
        endCol = Math.floor((this.x + this.w - 0.1) / TILE_SIZE);
        startRow = Math.floor((this.y + this.vy) / TILE_SIZE);
        endRow = Math.floor((this.y + this.vy + this.h - 0.1) / TILE_SIZE);
        
        for(let c = startCol; c <= endCol; c++) {
            if(map[endRow] && map[endRow][c] !== " " && map[endRow][c] !== "g" && map[endRow][c] !== "k" && map[endRow][c] !== "p") {
                rowHit = true;
                this.y = endRow * TILE_SIZE - this.h;
                this.vy = 0;
                this.isGrounded = true;
            }
        }
        
        this.handleMarioCollision();
        this.animTimer++;
    }

    handleMarioCollision() {
        if (this.dead || mario.dead) return;
        
        // AABB 碰撞检测
        let hit = (mario.x < this.x + this.w &&
                   mario.x + mario.w > this.x &&
                   mario.y < this.y + this.h &&
                   mario.y + mario.h > this.y);
                   
        if (hit) {
            if (mario.starTime > 0) {
                this.die();
                score += 100;
            } else if (mario.vy > 0 && mario.y + mario.h - mario.vy <= this.y + 4) {
                // 马里奥从上方踩踏 (允许小误差)
                this.stomped();
                mario.vy = JUMP_FORCE * 0.8; // 小弹跳
                mario.isGrounded = false;
                score += 100;
            } else {
                mario.takeDamage();
            }
        }
    }

    die() {
        this.dead = true;
        playSound("kick");
    }

    stomped() {
        // 子类重写
    }
}

class Goomba extends Enemy {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.flat = false;
        this.flatTimer = 0;
    }

    stomped() {
        this.flat = true;
        this.dead = true;
        this.vx = 0;
        this.flatTimer = 30; // 显示一会压扁动画
        playSound("stomp");
    }

    update() {
        if(this.flat) {
            this.flatTimer--;
            return;
        }
        super.update();
    }

    draw(ctx) {
        if(this.flat && this.flatTimer > 0) {
            drawSprite(ctx, "goomba_flat", this.x * SCALE - camera.x, this.y * SCALE - camera.y);
            return;
        }
        if(this.flatTimer <= 0 && this.flat) return; // 消失

        let frame = Math.floor(this.animTimer / 10) % 2 + 1;
        drawSprite(ctx, `goomba_walk${frame}`, this.x * SCALE - camera.x, this.y * SCALE - camera.y);
    }
}

class Koopa extends Enemy {
    constructor(x, y) {
        super(x, y, 16, 24);
        this.state = "WALK"; // WALK, SHELL_IDLE, SHELL_SLIDE
        this.shellTimer = 0;
    }
    
    stomped() {
        if(this.state === "WALK") {
            this.state = "SHELL_IDLE";
            this.vx = 0;
            this.h = 16;
            this.y += 8;
            this.shellTimer = 300; // 5秒后复苏
            playSound("stomp");
        } else if (this.state === "SHELL_IDLE") {
            // 推龟壳
            this.state = "SHELL_SLIDE";
            this.vx = mario.x < this.x ? 3.5 : -3.5;
            playSound("kick");
        } else if (this.state === "SHELL_SLIDE") {
            // 踩停滑动的龟壳
            this.state = "SHELL_IDLE";
            this.vx = 0;
            playSound("stomp");
        }
    }

    update() {
        if(this.dead) return;
        super.update(); // 基础移动与碰撞
        
        if (this.state === "SHELL_IDLE") {
            this.shellTimer--;
            if(this.shellTimer <= 0) {
                this.state = "WALK";
                this.h = 24;
                this.y -= 8;
                this.vx = -0.5;
            }
        }
        
        // 龟壳滑动消灭其他敌人 (简易遍历)
        if (this.state === "SHELL_SLIDE") {
            for(let e of entities) {
                if(e !== this && e !== mario && !e.dead && !e.flat) {
                    if(this.x < e.x + e.w && this.x + this.w > e.x && this.y < e.y + e.h && this.y + this.h > e.y) {
                        e.die();
                        score += 200;
                    }
                }
            }
        }
    }

    draw(ctx) {
        if(this.state === "WALK") {
            let frame = Math.floor(this.animTimer / 10) % 2 + 1;
            drawSprite(ctx, `koopa_walk${frame}`, this.x * SCALE - camera.x, this.y * SCALE - camera.y, this.vx > 0);
        } else {
            drawSprite(ctx, "koopa_shell", this.x * SCALE - camera.x, this.y * SCALE - camera.y);
        }
    }
}

// ====== 物品类 ======
class Mushroom extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.vx = 1.0;
        this.vy = -2.0;
    }
    update() {
        super.update();
        let colHit = false;
        let startRow = Math.floor(this.y / TILE_SIZE);
        // ... 简化的蘑菇墙壁碰撞 ...
        let colRight = Math.floor((this.x + this.w + this.vx) / TILE_SIZE);
        if(map[startRow] && map[startRow][colRight] && map[startRow][colRight] !== " " && this.vx > 0) this.vx *= -1;
        
        let hit = (mario.x < this.x + this.w && mario.x + mario.w > this.x && mario.y < this.y + this.h && mario.y + mario.h > this.y);
        if(hit) {
            this.dead = true;
            score += 1000;
            if(mario.state === "SMALL") {
                mario.state = "BIG";
                mario.h = 32;
                mario.y -= 16;
                playSound("powerup");
            }
        }
    }
    draw(ctx) {
        drawSprite(ctx, "item_mushroom", this.x * SCALE - camera.x, this.y * SCALE - camera.y);
    }
}

class Star extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.vx = 1.5;
        this.vy = -3.0;
    }
    update() {
        super.update();
        let colHit = false;
        let startRow = Math.floor(this.y / TILE_SIZE);
        let colRight = Math.floor((this.x + this.w + this.vx) / TILE_SIZE);
        if(map[startRow] && map[startRow][colRight] && map[startRow][colRight] !== " " && this.vx > 0) this.vx *= -1;
        
        let hit = (mario.x < this.x + this.w && mario.x + mario.w > this.x && mario.y < this.y + this.h && mario.y + mario.h > this.y);
        if(hit) {
            this.dead = true;
            score += 1000;
            mario.starTime = 600; // 10秒无敌
            playSound("starman_music");
        }
    }
    draw(ctx) {
        drawSprite(ctx, "item_star", this.x * SCALE - camera.x, this.y * SCALE - camera.y);
    }
}

class PiranhaPlant extends Enemy {
    constructor(x, y) {
        super(x, y, 16, 24);
        this.baseY = y;
        this.state = "HIDDEN"; // HIDDEN, RISING, UP, FALLING
        this.timer = 120; // 初始隐藏时间
        this.vx = 0;
        this.vy = 0;
    }
    update() {
        if(this.dead) return;
        this.animTimer++;
        
        let marioDist = Math.abs(mario.x - this.x);
        
        if(this.state === "HIDDEN") {
            this.timer--;
            // 马里奥不在正上方附近时才升起
            if(this.timer <= 0 && marioDist > 32) {
                this.state = "RISING";
            }
        } else if (this.state === "RISING") {
            this.y -= 0.5;
            if(this.y <= this.baseY - 24) {
                this.y = this.baseY - 24;
                this.state = "UP";
                this.timer = 120; // 停留2秒
            }
            this.handleMarioCollision();
        } else if (this.state === "UP") {
            this.timer--;
            if(this.timer <= 0) {
                this.state = "FALLING";
            }
            this.handleMarioCollision();
        } else if (this.state === "FALLING") {
            this.y += 0.5;
            if(this.y >= this.baseY) {
                this.y = this.baseY;
                this.state = "HIDDEN";
                this.timer = 120; // 隐藏2秒
            }
            this.handleMarioCollision();
        }
    }
    stomped() {
        // 食人花不能直接被踩死，除非马里奥无敌
        if(mario.starTime > 0) {
            this.die();
            score += 200;
        } else {
            mario.takeDamage(); // 反杀马里奥
        }
    }
    draw(ctx) {
        if(this.state === "HIDDEN") return;
        let frame = Math.floor(this.animTimer / 10) % 2 + 1;
        drawSprite(ctx, `piranha_${frame}`, this.x * SCALE - camera.x, this.y * SCALE - camera.y);
    }
}

function spawnCoinPoint(x, y) {
    // 短暂显示的弹起硬币 (略过具体实体，直接文字特效或简单音效)
}

// ====== 初始化系统 ======
let mario;

function parseMap() {
    map = [];
    entities = [];
    items = [];
    for(let r=0; r<mapRaw.length; r++) {
        let row = mapRaw[r].split("");
        for(let c=0; c<row.length; c++) {
            let char = row[c];
            if(char === "g") {
                entities.push(new Goomba(c * TILE_SIZE, r * TILE_SIZE));
                row[c] = " "; // 清空实体占位
            } else if (char === "k") {
                entities.push(new Koopa(c * TILE_SIZE, r * TILE_SIZE - 8)); // koopa is 24h
                row[c] = " ";
            } else if (char === "p") {
                entities.push(new PiranhaPlant(c * TILE_SIZE, r * TILE_SIZE)); // hidden in pipe
                row[c] = " ";
            }
        }
        map.push(row);
    }
    mario = new Mario(40, 100);
    entities.push(mario);

    // 初始化旗杆状态
    flagPoleX = 0;
    flagY = FLAG_TOP_ROW;
    gameState = "PLAYING";
    clearTimer = 0;
    for (let c = 0; c < map[0].length; c++) {
        if (map[FLAG_BOTTOM_ROW][c] === "f") { flagPoleX = c; break; }
    }
}

function init() {
    score = 0;
    coins = 0;
    gameTime = 400;
    lives = 3;
    isGameOver = false;
    parseMap();
    lastTimeUpdate = Date.now();
    loop();
}

function restartGame() {
    if(lives <= 0) {
        isGameOver = true;
        return;
    }
    parseMap();
}

// ====== 游戏循环与渲染 ======

function triggerFlagpole() {
    gameState = "FLAGPOLE";
    mario.vx = 0;
    mario.vy = 0;
    flagY = FLAG_TOP_ROW;
    clearTimer = 0;
    playSound("flagpole");
}

function drawClouds(ctx) {
    const clouds = [
        { wx: 11, wy: 2 }, { wx: 23, wy: 1 }, { wx: 37, wy: 2 },
        { wx: 55, wy: 1 }, { wx: 70, wy: 2 }, { wx: 88, wy: 1 },
        { wx: 105, wy: 2 }, { wx: 120, wy: 1 }, { wx: 140, wy: 2 },
        { wx: 160, wy: 1 }, { wx: 175, wy: 2 }
    ];
    ctx.fillStyle = "white";
    for (const cl of clouds) {
        const sx = cl.wx * TILE_SIZE * SCALE - camera.x;
        const sy = cl.wy * TILE_SIZE * SCALE - camera.y;
        if (sx < -80 || sx > canvas.width + 80) continue;
        ctx.beginPath();
        ctx.arc(sx + 20, sy + 20, 14, Math.PI, 0);
        ctx.arc(sx + 36, sy + 10, 18, Math.PI, 0);
        ctx.arc(sx + 52, sy + 20, 14, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
    }
}

function drawFlagpole(ctx) {
    if (flagPoleX === 0) return;
    const px = flagPoleX * TILE_SIZE * SCALE - camera.x + TILE_SIZE * SCALE / 2;
    const topY = FLAG_TOP_ROW * TILE_SIZE * SCALE - camera.y;
    const botY = FLAG_BOTTOM_ROW * TILE_SIZE * SCALE - camera.y;

    ctx.strokeStyle = "#888";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px, topY);
    ctx.lineTo(px, botY);
    ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(px, topY, 6, 0, Math.PI * 2);
    ctx.fill();

    const fy = flagY * TILE_SIZE * SCALE - camera.y;
    ctx.fillStyle = "#00AA00";
    ctx.beginPath();
    ctx.moveTo(px, fy);
    ctx.lineTo(px + 28, fy + 10);
    ctx.lineTo(px, fy + 20);
    ctx.closePath();
    ctx.fill();
}

function drawCastle(ctx) {
    const castleCol = 196;
    const cx = castleCol * TILE_SIZE * SCALE - camera.x;
    const cy = 10 * TILE_SIZE * SCALE - camera.y;
    const tw = TILE_SIZE * SCALE;
    const th = TILE_SIZE * SCALE;

    if (cx > canvas.width + 200 || cx < -200) return;

    ctx.fillStyle = "#888";
    ctx.fillRect(cx, cy, tw * 5, th * 4);
    ctx.fillRect(cx,          cy - th, tw, th);
    ctx.fillRect(cx + tw * 2, cy - th, tw, th);
    ctx.fillRect(cx + tw * 4, cy - th, tw, th);

    ctx.fillStyle = "#000";
    ctx.fillRect(cx + tw * 1.5, cy + th * 2, tw * 2, th * 2);
    ctx.fillRect(cx + tw * 0.5, cy + th, tw, th);
    ctx.fillRect(cx + tw * 3.5, cy + th, tw, th);
}

function update() {
    if(isGameOver) return;
    frameCount++;

    if (gameState === "FLAGPOLE") {
        clearTimer++;
        if (clearTimer % 3 === 0 && flagY < FLAG_BOTTOM_ROW) flagY++;
        if (flagY >= FLAG_BOTTOM_ROW && clearTimer > 90) { gameState = "CLEAR"; clearTimer = 0; }
        camera.update(mario);
        mario.update();
        return;
    }
    if (gameState === "CLEAR") { clearTimer++; return; }

    // 时间倒计时
    if (Date.now() - lastTimeUpdate > 1000) {
        gameTime--;
        lastTimeUpdate = Date.now();
        if (gameTime <= 0) mario.die();
    }

    // 更新实体
    items = items.filter(i => !i.dead);
    items.forEach(i => i.update());
    
    entities = entities.filter(e => !(e.flat && e.flatTimer <= 0));
    entities.forEach(e => e.update());

    camera.update(mario);
}

function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "24px Courier New";
    ctx.fontWeight = "bold";
    ctx.textAlign = "left";
    
    // MARIO  WORLD  TIME
    ctx.fillText("MARIO", 40, 40);
    ctx.fillText(score.toString().padStart(6, '0'), 40, 65);

    ctx.fillText("COINS", 200, 40);
    ctx.fillText("x" + coins.toString().padStart(2, '0'), 200, 65);

    ctx.fillText("WORLD", 350, 40);
    ctx.fillText("1-1", 350, 65);

    ctx.fillText("TIME", 500, 40);
    ctx.fillText(gameTime.toString().padStart(3, '0'), 500, 65);
    
    // Lives display
    ctx.fillText("LIVES: " + lives, 650, 40);

    if (isGameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
        ctx.font = "16px Courier New";
        ctx.fillText("Refresh page to restart", canvas.width/2, canvas.height/2 + 40);
    }

    if (gameState === "CLEAR" && clearTimer > 30) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "32px Courier New";
        ctx.fillText("COURSE CLEAR!", canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = "24px Courier New";
        ctx.fillText("SCORE: " + score.toString().padStart(6, "0"), canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 50);
    }
}

function draw() {
    // 渐变天空背景
    ctx.fillStyle = "#5c94fc"; // 经典天空蓝
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制瓦片地图 (仅渲染视野范围内的 tile)
    let startCol = Math.max(0, Math.floor(camera.x / (TILE_SIZE * SCALE)));
    let endCol = Math.min(map[0].length, Math.floor((camera.x + canvas.width) / (TILE_SIZE * SCALE)) + 1);

    for (let r = 0; r < map.length; r++) {
        for (let c = startCol; c < endCol; c++) {
            let tile = map[r][c];
            let x = c * TILE_SIZE * SCALE - camera.x;
            let y = r * TILE_SIZE * SCALE - camera.y;

            if (tile === "1") drawSprite(ctx, "tile_ground", x, y);
            else if (tile === "2") drawSprite(ctx, "tile_brick", x, y);
            else if (tile === "3" || tile === "4" || tile === "5") {
                // 问号箱简单动画（闪烁）
                if(Math.floor(frameCount / 15) % 2 === 0) drawSprite(ctx, "tile_qblock1", x, y);
                else drawSprite(ctx, "tile_qblock_empty", x, y);
            }
            else if (tile === "e") drawSprite(ctx, "tile_qblock_empty", x, y);
            else if (tile === "7") drawSprite(ctx, "tile_pipe_top_l", x, y);
            else if (tile === "8") drawSprite(ctx, "tile_pipe_top_r", x, y);
            else if (tile === "9") drawSprite(ctx, "tile_pipe_body_l", x, y);
            else if (tile === "a") drawSprite(ctx, "tile_pipe_body_r", x, y);
            else if (tile === "s" || tile === "f") drawSprite(ctx, "tile_ground", x, y);
        }
    }

    // 绘制装饰元素
    drawClouds(ctx);
    drawFlagpole(ctx);
    drawCastle(ctx);

    // 绘制实物和敌人
    items.forEach(i => i.draw(ctx));
    entities.forEach(e => {
        // 先判断是否在屏幕内再绘制以节约性能(简化省略判断)
        if(e !== mario) e.draw(ctx);
    });
    mario.draw(ctx); // 马里奥最后画

    drawHUD();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Ensure Sprite sheet is loaded before running
spriteSheet.onload = () => {
    // 去除不透明灰白棋盘格背景 → 设置为透明
    const cvs = document.createElement('canvas');
    cvs.width = spriteSheet.width;
    cvs.height = spriteSheet.height;
    const ctx2d = cvs.getContext('2d');
    ctx2d.drawImage(spriteSheet, 0, 0);
    const imgData = ctx2d.getImageData(0, 0, cvs.width, cvs.height);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2];
        // 与扫描脚本相同的灰度中性色判定：
        // RGB 三通道差值 ≤ 12 且亮度 ≥ 160
        const maxDiff = Math.max(Math.abs(r-g), Math.abs(g-b), Math.abs(r-b));
        if (maxDiff <= 12 && r >= 160) {
            d[i+3] = 0; // 设为透明
        }
    }
    ctx2d.putImageData(imgData, 0, 0);
    
    // 用处理后的 canvas 替换原始图片
    const processedImg = new Image();
    processedImg.onload = () => {
        spriteSheet.onload = null; // 防止循环
        // 将处理后的图片数据写回 spriteSheet 对象
        // 不能直接替换 spriteSheet.src，因为会触发 onload
        // 改为将 canvas 作为绘制源
        window._processedSheet = cvs;
        init();
    };
    processedImg.src = cvs.toDataURL('image/png');
};
