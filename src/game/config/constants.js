/**
 * constants.js
 * ---------------------------------------------------------------
 * Constantes inmutables del motor: tamaños de tile, direcciones,
 * estados y nombres de eventos. Nada de esto se ajusta por nivel.
 */

/* ---------- Tamaños ---------- */
export const TILE_SIZE = 32;         // tiles de terreno 32x32 (§30)
export const FRUIT_SIZE = 8;
export const SPRITE_SIZE = 32;

/* ---------- Direcciones (vista top-down) ---------- */
export const DIRECTIONS = Object.freeze({
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
});

export const DIRECTION_VECTORS = Object.freeze({
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
});

/* ---------- Lados de recolección (§7) ---------- */
export const HARVEST_SIDES = Object.freeze({
  LEFT: 'left',
  RIGHT: 'right',
});

/* ---------- Estados del juego (§43) ---------- */
export const GAME_STATES = Object.freeze({
  MENU: 'MENU',
  TUTORIAL: 'TUTORIAL',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  INSPECTION: 'INSPECTION',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  GAME_OVER: 'GAME_OVER',
});

/* ---------- Estados del jugador (§14) ---------- */
export const PLAYER_STATES = Object.freeze({
  IDLE: 'idle',
  WALK_UP: 'walkUp',
  WALK_DOWN: 'walkDown',
  WALK_LEFT: 'walkLeft',
  WALK_RIGHT: 'walkRight',
  HARVEST_LEFT: 'harvestLeft',
  HARVEST_RIGHT: 'harvestRight',
  ERROR: 'error',
  TIRED: 'tired',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
});

/* ---------- Estados de la planta (§15, §9) ---------- */
export const PLANT_STATES = Object.freeze({
  EMPTY: 'empty',
  FEW: 'few',
  MEDIUM: 'medium',
  ABUNDANT: 'abundant',
  RIPE: 'ripe',
  UNRIPE: 'unripe',
  MIXED: 'mixed',
  HARVESTED: 'harvested',
});

/* ---------- Tipos de fruto (§16, §10) ---------- */
export const FRUIT_TYPES = Object.freeze({
  RIPE: 'RIPE',
  UNRIPE: 'UNRIPE',
});

/* ---------- Estados de la canasta (§17) ---------- */
export const BASKET_STATES = Object.freeze({
  EMPTY: 'empty',
  LOW: 'low',
  MEDIUM: 'medium',
  FULL: 'full',
});

/* ---------- Estados del supervisor (§18) ---------- */
export const SUPERVISOR_STATES = Object.freeze({
  IDLE: 'idle',
  WALK: 'walk',
  INSPECT: 'inspect',
  WRITE: 'write',
  DETECT_ERROR: 'detectError',
  APPROVE: 'approve',
  TALK: 'talk',
});

/* ---------- Tipos de tile del terreno (§30) ---------- */
export const TILE_TYPES = Object.freeze({
  SOIL: 'soil',
  SOIL_LIGHT: 'soilLight',
  SOIL_DARK: 'soilDark',
  PATH: 'path',
  PATH_H: 'pathH',
  CORNER: 'corner',
  CROSS: 'cross',
  BORDER: 'border',
  GRASS: 'grass',
  PLANT_ROW: 'plantRow',
  FENCE: 'fence',
  DELIVERY: 'delivery',
});

/* ---------- Resultado de la revisión (§20) ---------- */
export const INSPECTION_RESULTS = Object.freeze({
  APPROVED: 'approved',
  WARNING: 'warning',
  REJECTED: 'rejected',
});

/* ---------- Umbrales de calidad (§13) ---------- */
export const QUALITY_THRESHOLDS = Object.freeze({
  EXCELLENT: 90,
  GOOD: 75,
  DANGER: 50,
});

/* ---------- Eventos del motor hacia React ---------- */
export const ENGINE_EVENTS = Object.freeze({
  READY: 'engine:ready',
  STATE_CHANGE: 'engine:stateChange',
  HUD_UPDATE: 'engine:hudUpdate',
  LEVEL_COMPLETE: 'engine:levelComplete',
  GAME_OVER: 'engine:gameOver',
  PAUSE_REQUEST: 'engine:pauseRequest',
  TOAST: 'engine:toast',
});

/* ---------- Teclas (§25) ---------- */
export const KEY_BINDINGS = Object.freeze({
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  harvestLeft: ['KeyQ', 'KeyJ'],
  harvestRight: ['KeyE', 'KeyL'],
  harvestContext: ['KeyE', 'Space'],
  deliver: ['Space', 'Enter'],
  pause: ['Escape', 'KeyP'],
});
