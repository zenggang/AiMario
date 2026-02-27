import { TILE_SIZE } from '../constants.js';

const MIN_WIDTH = 64;
const MAX_WIDTH = 512;
const MIN_HEIGHT = 16;
const MAX_HEIGHT = 32;
const KNOWN_ENTITY_TYPES = new Set(['goomba', 'koopa', 'piranha']);

function createEmptyMap(width, height) {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => ' '));
}

function applyOp(map, op) {
  const startX = Math.max(0, op.x);
  const startY = Math.max(0, op.y);
  const endX = Math.min(map[0].length, op.x + op.w);
  const endY = Math.min(map.length, op.y + op.h);
  let changed = 0;

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      if (op.op === 'fill') {
        map[y][x] = op.tile;
        changed++;
      }
      if (op.op === 'clear') {
        map[y][x] = ' ';
        changed++;
      }
    }
  }

  return changed;
}

function assertInBounds(name, p, width, height) {
  if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height) {
    throw new Error(`${name} out of bounds: (${p.x}, ${p.y})`);
  }
}

function validateEntityTypes(entities = []) {
  for (const e of entities) {
    if (!KNOWN_ENTITY_TYPES.has(e.type)) {
      throw new Error(`Unknown entity type in level JSON: ${e.type}`);
    }
    if (e.x < 0 || e.y < 0) {
      throw new Error(`Entity position must be non-negative: ${JSON.stringify(e)}`);
    }
  }
}

function hasAnyUpperTile(map, col) {
  for (let r = 0; r < map.length - 2; r++) {
    if (map[r][col] !== ' ') return true;
  }
  return false;
}

function buildInteractionColumns(levelData, map) {
  const cols = Array.from({ length: levelData.width }, () => false);
  const groundTopRow = levelData.height - 2;

  // Any upper tile / pit / reward tile counts as interaction.
  for (let c = 0; c < levelData.width; c++) {
    const isPit = map[groundTopRow]?.[c] === ' ';
    const hasUpper = hasAnyUpperTile(map, c);
    let hasReward = false;
    for (let r = 0; r < map.length; r++) {
      const t = map[r][c];
      if (t === '3' || t === '4' || t === '5') {
        hasReward = true;
        break;
      }
    }
    cols[c] = isPit || hasUpper || hasReward;
  }

  for (const e of levelData.entities || []) {
    if (e.x >= 0 && e.x < cols.length) cols[e.x] = true;
  }

  return cols;
}

function validateDensity(levelData, map) {
  const cols = buildInteractionColumns(levelData, map);
  const groundTopRow = levelData.height - 2;
  const groundBottomRow = levelData.height - 1;

  for (let start = 0; start <= cols.length - 16; start++) {
    let hasInteraction = false;
    for (let i = start; i < start + 16; i++) {
      if (cols[i]) {
        hasInteraction = true;
        break;
      }
    }
    if (!hasInteraction) {
      throw new Error(`Density check failed: no interaction in 16-column window starting at ${start}`);
    }
  }

  let flatRun = 0;
  for (let c = 0; c < cols.length; c++) {
    const plainGround = map[groundTopRow]?.[c] !== ' ' && map[groundBottomRow]?.[c] !== ' ' && !cols[c];
    if (plainGround) {
      flatRun++;
      if (flatRun > 8) {
        throw new Error(`Density check failed: plain-ground run exceeds 8 columns near ${c}`);
      }
    } else {
      flatRun = 0;
    }
  }
}

function validateLevel(data) {
  const required = ['meta', 'width', 'height', 'tileSize', 'layers', 'goal', 'spawn'];
  for (const key of required) {
    if (!(key in data)) throw new Error(`Level missing field: ${key}`);
  }
  if (data.tileSize !== TILE_SIZE) throw new Error(`Level tileSize must be ${TILE_SIZE}`);
  if (data.width < MIN_WIDTH || data.width > MAX_WIDTH) {
    throw new Error(`Level width must be between ${MIN_WIDTH} and ${MAX_WIDTH}`);
  }
  if (data.height < MIN_HEIGHT || data.height > MAX_HEIGHT) {
    throw new Error(`Level height must be between ${MIN_HEIGHT} and ${MAX_HEIGHT}`);
  }

  assertInBounds('spawn', data.spawn, data.width, data.height);
  if (data.goal.flagPoleX < Math.floor(data.width * 0.8)) {
    throw new Error('goal.flagPoleX must be in the last 20% of level width');
  }
  if (data.goal.flagTopRow < 0 || data.goal.flagBottomRow >= data.height) {
    throw new Error('goal flag rows out of bounds');
  }
  if (data.goal.flagTopRow >= data.goal.flagBottomRow) {
    throw new Error('goal flag rows invalid: top must be less than bottom');
  }
  validateEntityTypes(data.entities);
}

export async function loadLevelData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed loading level JSON: ${url}`);
  const data = await res.json();
  validateLevel(data);
  return data;
}

export function buildRuntimeLevel(levelData) {
  const map = createEmptyMap(levelData.width, levelData.height);
  for (const op of levelData.layers.solids || []) {
    const changed = applyOp(map, op);
    if (changed === 0) {
      console.warn('Level op had no effect (possibly fully out of bounds):', op);
    }
  }
  validateDensity(levelData, map);

  const decorBack = levelData.layers.decorBack || levelData.layers.decor || { clouds: [], castle: null };
  const decorFront = levelData.layers.decorFront || { bushes: [] };

  return {
    map,
    width: levelData.width,
    height: levelData.height,
    zones: levelData.zones || [],
    decorBack,
    decorFront,
    goal: levelData.goal,
    spawn: levelData.spawn,
    entities: levelData.entities || [],
    items: levelData.items || [],
    checkpoints: levelData.checkpoints || [],
  };
}
