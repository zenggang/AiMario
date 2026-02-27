export const TILE_SIZE = 16;
export const SCALE = 3;

export const PHYSICS = {
  GRAVITY: 0.25,
  FRICTION: 0.9,
  MIN_SPEED: 0.1,
  MAX_FALL_SPEED: 7,
  MAX_WALK_SPEED: 2.5,
  MAX_RUN_SPEED: 4.0,
  ACCEL_WALK: 0.06,
  ACCEL_RUN: 0.1,
  JUMP_FORCE: -6.5,
  JUMP_HOLD_GRAVITY_MODIFIER: 0.5,
};

export const FLAG_ROWS = {
  TOP: 6,
  BOTTOM: 14,
};

export const GAME_STATES = {
  PLAYING: 'PLAYING',
  FLAGPOLE: 'FLAGPOLE',
  CLEAR: 'CLEAR',
};
