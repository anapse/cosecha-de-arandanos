/**
 * assets.js
 * ---------------------------------------------------------------
 * Catálogo central de assets (§27).
 *
 * REGLA CLAVE: ningún sistema del motor debe conocer nombres de
 * archivo. Todos piden assets por su clave lógica (por ejemplo
 * 'player.walkDown') y este módulo resuelve la ruta.
 *
 * Así, en la fase de arte se pueden sustituir los placeholders por
 * PNG 32x32 / 48x48 / 64x64 o spritesheets SIN tocar el motor.
 *
 * Si un asset no existe todavía en disco, el AssetLoader lo marca
 * como "missing" y el SpriteRenderer dibuja el placeholder generado
 * por código. Nunca se rompe el juego por un sprite ausente.
 */

/* Carpeta raíz de assets servida por Vite (public/). */
export const ASSET_BASE = '/assets';

/* ---------- Descripciones de spritesheet (para la fase de arte) ---------- */
/* Formato compatible con futuras hojas de sprites. */
export const FRAME_SIZE = {
  small: 32,
  medium: 48,
  large: 64,
};

/* ---------- Jugador (§8) ---------- */
export const PLAYER_ASSETS = {
  'player.idle': { path: 'player/idle.png', frames: 4, frameSize: 32 },
  'player.walkDown': { path: 'player/walk-down.png', frames: 4, frameSize: 32 },
  'player.walkUp': { path: 'player/walk-up.png', frames: 4, frameSize: 32 },
  'player.walkLeft': { path: 'player/walk-left.png', frames: 4, frameSize: 32 },
  'player.walkRight': { path: 'player/walk-right.png', frames: 4, frameSize: 32 },
  'player.harvestLeft': { path: 'player/harvest-left.png', frames: 6, frameSize: 32 },
  'player.harvestRight': { path: 'player/harvest-right.png', frames: 6, frameSize: 32 },
  'player.error': { path: 'player/error.png', frames: 4, frameSize: 32 },
  'player.tired': { path: 'player/tired.png', frames: 4, frameSize: 32 },
  'player.victory': { path: 'player/victory.png', frames: 6, frameSize: 32 },
  'player.defeat': { path: 'player/defeat.png', frames: 6, frameSize: 32 },
};

/* ---------- Supervisor (§18) ---------- */
export const SUPERVISOR_ASSETS = {
  'supervisor.walkDown': { path: 'supervisor/walk-down.png', frames: 4, frameSize: 32 },
  'supervisor.walkUp': { path: 'supervisor/walk-up.png', frames: 4, frameSize: 32 },
  'supervisor.walkLeft': { path: 'supervisor/walk-left.png', frames: 4, frameSize: 32 },
  'supervisor.walkRight': { path: 'supervisor/walk-right.png', frames: 4, frameSize: 32 },
  'supervisor.inspect': { path: 'supervisor/inspect.png', frames: 4, frameSize: 32 },
  'supervisor.write': { path: 'supervisor/write.png', frames: 4, frameSize: 32 },
  'supervisor.detectError': { path: 'supervisor/detect-error.png', frames: 4, frameSize: 32 },
  'supervisor.approve': { path: 'supervisor/approve.png', frames: 4, frameSize: 32 },
};

/* ---------- Plantas (§9, §15) ---------- */
export const PLANT_ASSETS = {
  'plant.empty': { path: 'plants/empty.png', frames: 1, frameSize: 32 },
  'plant.few': { path: 'plants/few.png', frames: 1, frameSize: 32 },
  'plant.medium': { path: 'plants/medium.png', frames: 1, frameSize: 32 },
  'plant.abundant': { path: 'plants/abundant.png', frames: 1, frameSize: 32 },
  'plant.ripe': { path: 'plants/ripe.png', frames: 1, frameSize: 32 },
  'plant.unripe': { path: 'plants/unripe.png', frames: 1, frameSize: 32 },
  'plant.mixed': { path: 'plants/mixed.png', frames: 1, frameSize: 32 },
  'plant.harvested': { path: 'plants/harvested.png', frames: 1, frameSize: 32 },
};

/* ---------- Frutos (§10, §16) ---------- */
export const FRUIT_ASSETS = {
  'fruit.ripe': { path: 'fruits/ripe.png', frames: 1, frameSize: 8 },
  'fruit.unripe': { path: 'fruits/unripe.png', frames: 1, frameSize: 8 },
  'fruit.small': { path: 'fruits/small.png', frames: 1, frameSize: 8 },
  'fruit.damaged': { path: 'fruits/damaged.png', frames: 1, frameSize: 8 },
  'fruit.special': { path: 'fruits/special.png', frames: 1, frameSize: 8 },
  'fruit.bonus': { path: 'fruits/bonus.png', frames: 1, frameSize: 8 },
};

/* ---------- Terreno (§30) ---------- */
export const TERRAIN_ASSETS = {
  'terrain.soil': { path: 'terrain/soil.png', frames: 1, frameSize: 32 },
  'terrain.soilLight': { path: 'terrain/soil-light.png', frames: 1, frameSize: 32 },
  'terrain.soilDark': { path: 'terrain/soil-dark.png', frames: 1, frameSize: 32 },
  'terrain.path': { path: 'terrain/path.png', frames: 1, frameSize: 32 },
  'terrain.pathH': { path: 'terrain/path-h.png', frames: 1, frameSize: 32 },
  'terrain.corner': { path: 'terrain/corner.png', frames: 1, frameSize: 32 },
  'terrain.cross': { path: 'terrain/cross.png', frames: 1, frameSize: 32 },
  'terrain.border': { path: 'terrain/border.png', frames: 1, frameSize: 32 },
  'terrain.grass': { path: 'terrain/grass.png', frames: 1, frameSize: 32 },
  'terrain.fence': { path: 'terrain/fence.png', frames: 1, frameSize: 32 },
  'terrain.delivery': { path: 'terrain/delivery.png', frames: 1, frameSize: 32 },
};

/* ---------- Canasta y cajas (§17) ---------- */
export const BASKET_ASSETS = {
  'basket.empty': { path: 'basket/basket-empty.png', frames: 1, frameSize: 32 },
  'basket.low': { path: 'basket/basket-low.png', frames: 1, frameSize: 32 },
  'basket.medium': { path: 'basket/basket-medium.png', frames: 1, frameSize: 32 },
  'basket.full': { path: 'basket/basket-full.png', frames: 1, frameSize: 32 },
  'basket.box': { path: 'basket/box.png', frames: 1, frameSize: 32 },
  'basket.boxFull': { path: 'basket/box-full.png', frames: 1, frameSize: 32 },
  'basket.boxStack': { path: 'basket/box-stack.png', frames: 1, frameSize: 32 },
};

/* ---------- Camión (§16) ---------- */
export const TRUCK_ASSETS = {
  'truck.idle': { path: 'truck/truck-idle.png', frames: 1, frameSize: 64 },
  'truck.loading': { path: 'truck/truck-loading.png', frames: 2, frameSize: 64 },
  'truck.leaving': { path: 'truck/truck-leaving.png', frames: 2, frameSize: 64 },
};

/* ---------- UI (§34) ---------- */
export const UI_ASSETS = {
  'ui.iconPause': { path: 'ui/icon-pause.png', frames: 1, frameSize: 16 },
  'ui.iconRipe': { path: 'ui/icon-ripe.png', frames: 1, frameSize: 16 },
  'ui.iconUnripe': { path: 'ui/icon-unripe.png', frames: 1, frameSize: 16 },
  'ui.iconError': { path: 'ui/icon-error.png', frames: 1, frameSize: 16 },
  'ui.iconBasket': { path: 'ui/icon-basket.png', frames: 1, frameSize: 16 },
  'ui.lifeFull': { path: 'ui/life-full.png', frames: 1, frameSize: 16 },
  'ui.lifeEmpty': { path: 'ui/life-empty.png', frames: 1, frameSize: 16 },
  'ui.panel': { path: 'ui/panel.png', frames: 1, frameSize: 32 },
  'ui.button': { path: 'ui/button.png', frames: 1, frameSize: 32 },
};

/* ---------- Efectos (§39) ---------- */
export const EFFECT_ASSETS = {
  'fx.spark': { path: 'effects/spark.png', frames: 4, frameSize: 16 },
  'fx.puff': { path: 'effects/puff.png', frames: 4, frameSize: 16 },
  'fx.leaves': { path: 'effects/leaves.png', frames: 6, frameSize: 16 },
  'fx.alert': { path: 'effects/alert.png', frames: 2, frameSize: 16 },
  'fx.check': { path: 'effects/check.png', frames: 1, frameSize: 16 },
  'fx.cross': { path: 'effects/cross.png', frames: 1, frameSize: 16 },
};

/* ---------- Entorno (§33) ---------- */
export const ENVIRONMENT_ASSETS = {
  'env.tree': { path: 'environment/tree.png', frames: 1, frameSize: 64 },
  'env.mountain': { path: 'environment/mountain.png', frames: 1, frameSize: 128 },
  'env.cloud': { path: 'environment/cloud.png', frames: 1, frameSize: 64 },
  'env.rock': { path: 'environment/rock.png', frames: 1, frameSize: 16 },
  'env.sign': { path: 'environment/sign.png', frames: 1, frameSize: 32 },
  'env.bush': { path: 'environment/bush.png', frames: 1, frameSize: 32 },
};

/* ---------- Sonidos (§40) ---------- */
export const SOUND_ASSETS = {
  'sfx.harvest': { path: 'sounds/harvest.wav' },
  'sfx.error': { path: 'sounds/error.wav' },
  'sfx.deliver': { path: 'sounds/deliver.wav' },
  'sfx.supervisorAlert': { path: 'sounds/supervisor-alert.wav' },
  'sfx.victory': { path: 'sounds/victory.wav' },
  'sfx.defeat': { path: 'sounds/defeat.wav' },
  'sfx.button': { path: 'sounds/button.wav' },
  'sfx.truck': { path: 'sounds/truck.wav' },
};

/* ---------- Catálogo completo ---------- */
export const ASSET_MANIFEST = {
  ...PLAYER_ASSETS,
  ...SUPERVISOR_ASSETS,
  ...PLANT_ASSETS,
  ...FRUIT_ASSETS,
  ...TERRAIN_ASSETS,
  ...BASKET_ASSETS,
  ...TRUCK_ASSETS,
  ...UI_ASSETS,
  ...EFFECT_ASSETS,
  ...ENVIRONMENT_ASSETS,
};

export const SOUND_MANIFEST = { ...SOUND_ASSETS };

/** Resuelve la URL pública de un asset a partir de su clave lógica. */
export function assetUrl(key, manifest = ASSET_MANIFEST) {
  const entry = manifest[key];
  if (!entry) return null;
  return `${ASSET_BASE}/${entry.path}`;
}

/** Lista de claves de un grupo (útil para precarga selectiva). */
export function assetKeysByPrefix(prefix, manifest = ASSET_MANIFEST) {
  return Object.keys(manifest).filter((k) => k.startsWith(`${prefix}.`));
}

export default ASSET_MANIFEST;
