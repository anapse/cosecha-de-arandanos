/**
 * assets.js
 * ---------------------------------------------------------------
 * Catálogo central de assets (§27, §31).
 *
 * FUENTE DE VERDAD: los nombres de archivo, las carpetas y el número
 * de frames coinciden EXACTAMENTE con las dos láminas de referencia
 * del proyecto:
 *
 *   1. "LISTA DE SPRITES Y ASSETS – JUEGO DE COSECHA DE ARÁNDANOS"
 *      (catálogo por secciones, 80-120 sprites estimados)
 *   2. "public/assets/" (árbol real de carpetas con cada .png)
 *
 * REGLA CLAVE: ningún sistema del motor conoce nombres de archivo.
 * Todos piden assets por su CLAVE LÓGICA (por ejemplo
 * 'player.walkDown') y este módulo resuelve la ruta real.
 *
 * Así el arte se puede sustituir o ampliar sin tocar el motor.
 *
 * Estilo: PIXEL ART 16x16 / 32x32, vista top-down (2D).
 * Formato: PNG transparente.
 */

/* Carpeta raíz de assets servida por Vite (public/). */
export const ASSET_BASE = '/assets';

/* ---------- Tamaños de sprite del proyecto ---------- */
export const SPRITE_SIZES = {
  icon: 16,     // iconos de UI y efectos
  small: 16,    // efectos / frutos en mano
  base: 32,     // sprites base (16x16 o 32x32 según la lámina)
  medium: 48,
  large: 64,    // entorno y camión
  wide: 128,    // montañas, camión lateral
};

/* ============================================================
   01. PLAYER — Personaje recolector (24 sprites básicos)
   ============================================================ */
export const PLAYER_ASSETS = {
  'player.idle': { path: 'player/player_idle.png', frames: 4, frameSize: 32 },
  'player.walkDown': { path: 'player/player_walk_down.png', frames: 4, frameSize: 32 },
  'player.walkUp': { path: 'player/player_walk_up.png', frames: 4, frameSize: 32 },
  'player.walkLeft': { path: 'player/player_walk_left.png', frames: 4, frameSize: 32 },
  'player.walkRight': { path: 'player/player_walk_right.png', frames: 4, frameSize: 32 },
  'player.harvestLeft': { path: 'player/player_harvest_left.png', frames: 4, frameSize: 32 },
  'player.harvestRight': { path: 'player/player_harvest_right.png', frames: 4, frameSize: 32 },

  /* Estados extra */
  'player.wait': { path: 'player/player_wait.png', frames: 1, frameSize: 32 },
  'player.full': { path: 'player/player_full.png', frames: 1, frameSize: 32 },
  'player.tired': { path: 'player/player_tired.png', frames: 1, frameSize: 32 },
  'player.error': { path: 'player/player_error.png', frames: 1, frameSize: 32 },
  'player.victory': { path: 'player/player_victory.png', frames: 1, frameSize: 32 },
  'player.defeat': { path: 'player/player_defeat.png', frames: 1, frameSize: 32 },
};

/* ============================================================
   02. SUPERVISOR — Supervisor de calidad (16 sprites)
   ============================================================ */
export const SUPERVISOR_ASSETS = {
  'supervisor.idle': { path: 'supervisor/supervisor_idle.png', frames: 4, frameSize: 32 },
  'supervisor.walkDown': { path: 'supervisor/supervisor_walk_down.png', frames: 4, frameSize: 32 },
  'supervisor.walkUp': { path: 'supervisor/supervisor_walk_up.png', frames: 4, frameSize: 32 },
  'supervisor.walkLeft': { path: 'supervisor/supervisor_walk_left.png', frames: 4, frameSize: 32 },
  'supervisor.walkRight': { path: 'supervisor/supervisor_walk_right.png', frames: 4, frameSize: 32 },
  'supervisor.review': { path: 'supervisor/supervisor_review.png', frames: 4, frameSize: 32 },
  'supervisor.write': { path: 'supervisor/supervisor_write.png', frames: 4, frameSize: 32 },
  'supervisor.detectError': { path: 'supervisor/supervisor_detect_error.png', frames: 4, frameSize: 32 },
  'supervisor.approve': { path: 'supervisor/supervisor_approve.png', frames: 4, frameSize: 32 },
  'supervisor.talk': { path: 'supervisor/supervisor_talk.png', frames: 4, frameSize: 32 },

  /* Alias: el motor llamaba 'inspect' a la animación de revisar. */
  'supervisor.inspect': { path: 'supervisor/supervisor_review.png', frames: 4, frameSize: 32 },
};

/* ============================================================
   03. PLANTS — Plantas de arándanos (12-20 sprites)
   ============================================================ */
export const PLANT_ASSETS = {
  'plant.empty': { path: 'plants/plant_empty.png', frames: 1, frameSize: 32 },
  'plant.few': { path: 'plants/plant_few.png', frames: 1, frameSize: 32 },
  'plant.medium': { path: 'plants/plant_medium.png', frames: 1, frameSize: 32 },
  'plant.abundant': { path: 'plants/plant_abundant.png', frames: 1, frameSize: 32 },
  'plant.ripe': { path: 'plants/plant_ripe.png', frames: 1, frameSize: 32 },
  'plant.unripe': { path: 'plants/plant_unripe.png', frames: 1, frameSize: 32 },
  'plant.mixed': { path: 'plants/plant_mixed.png', frames: 1, frameSize: 32 },
  'plant.harvested': { path: 'plants/plant_harvested.png', frames: 1, frameSize: 32 },
};

/* ============================================================
   04. FRUITS — Frutos / items (6 sprites)
   ============================================================ */
export const FRUIT_ASSETS = {
  'fruit.ripe': { path: 'fruits/fruit_ripe.png', frames: 1, frameSize: 16 },
  'fruit.unripe': { path: 'fruits/fruit_unripe.png', frames: 1, frameSize: 16 },
  'fruit.group2': { path: 'fruits/fruit_group_x2.png', frames: 1, frameSize: 16 },
  'fruit.group3': { path: 'fruits/fruit_group_x3.png', frames: 1, frameSize: 16 },
  'fruit.inHand': { path: 'fruits/fruit_in_hand.png', frames: 1, frameSize: 16 },
  'fruit.fall': { path: 'fruits/fruit_fall.png', frames: 1, frameSize: 16 },
};

/* ============================================================
   05. TERRAIN — Terreno / tiles (10-16 tiles)
   ============================================================ */
export const TERRAIN_ASSETS = {
  'terrain.soil': { path: 'terrain/ground_soil.png', frames: 1, frameSize: 32 },
  'terrain.path': { path: 'terrain/path_vertical.png', frames: 1, frameSize: 32 },
  'terrain.pathH': { path: 'terrain/path_horizontal.png', frames: 1, frameSize: 32 },
  'terrain.corner': { path: 'terrain/path_corner.png', frames: 1, frameSize: 32 },
  'terrain.cross': { path: 'terrain/path_intersection.png', frames: 1, frameSize: 32 },
  'terrain.grass': { path: 'terrain/grass.png', frames: 1, frameSize: 32 },
  'terrain.grassEdge': { path: 'terrain/grass_edge.png', frames: 1, frameSize: 32 },
  'terrain.fenceH': { path: 'terrain/fence_horizontal.png', frames: 1, frameSize: 32 },
  'terrain.fenceV': { path: 'terrain/fence_vertical.png', frames: 1, frameSize: 32 },
  'terrain.fenceCorner': { path: 'terrain/fence_corner.png', frames: 1, frameSize: 32 },
  'terrain.deliveryZone': { path: 'terrain/delivery_zone.png', frames: 1, frameSize: 32 },
  'terrain.deliveryMarker': { path: 'terrain/delivery_marker.png', frames: 1, frameSize: 32 },
  'terrain.detail': { path: 'terrain/ground_detail.png', frames: 1, frameSize: 32 },
  'terrain.rock': { path: 'terrain/rock.png', frames: 1, frameSize: 32 },
  'terrain.flower': { path: 'terrain/flower.png', frames: 1, frameSize: 32 },

  /* Alias de compatibilidad: el motor usa nombres antiguos para
     algunos tiles. Apuntan a los mismos archivos de la referencia. */
  'terrain.soilLight': { path: 'terrain/ground_soil.png', frames: 1, frameSize: 32 },
  'terrain.soilDark': { path: 'terrain/ground_soil.png', frames: 1, frameSize: 32 },
  'terrain.fence': { path: 'terrain/fence_horizontal.png', frames: 1, frameSize: 32 },
  'terrain.delivery': { path: 'terrain/delivery_zone.png', frames: 1, frameSize: 32 },
  'terrain.border': { path: 'terrain/grass_edge.png', frames: 1, frameSize: 32 },
};

/* ============================================================
   06. BASKET / BOXES / TRUCK (8 + camión)
   ============================================================ */
export const BASKET_ASSETS = {
  'basket.empty': { path: 'basket/basket_empty.png', frames: 1, frameSize: 32 },
  'basket.low': { path: 'basket/basket_low.png', frames: 1, frameSize: 32 },
  'basket.medium': { path: 'basket/basket_medium.png', frames: 1, frameSize: 32 },
  'basket.full': { path: 'basket/basket_full.png', frames: 1, frameSize: 32 },
  'basket.boxEmpty': { path: 'basket/box_empty.png', frames: 1, frameSize: 32 },
  'basket.boxFilled': { path: 'basket/box_filled.png', frames: 1, frameSize: 32 },
  'basket.boxStack': { path: 'basket/box_stack.png', frames: 1, frameSize: 32 },
  'basket.boxOnTruck': { path: 'basket/box_on_truck.png', frames: 1, frameSize: 32 },

  /* Alias de compatibilidad con las claves que usa el motor */
  'basket.box': { path: 'basket/box_empty.png', frames: 1, frameSize: 32 },
  'basket.boxFull': { path: 'basket/box_filled.png', frames: 1, frameSize: 32 },
};

export const TRUCK_ASSETS = {
  'truck.side': { path: 'truck/truck_side.png', frames: 1, frameSize: 64 },
  'truck.loaded': { path: 'truck/truck_loaded.png', frames: 1, frameSize: 64 },

  /* Alias de compatibilidad */
  'truck.idle': { path: 'truck/truck_side.png', frames: 1, frameSize: 64 },
  'truck.loading': { path: 'truck/truck_loaded.png', frames: 1, frameSize: 64 },
  'truck.leaving': { path: 'truck/truck_loaded.png', frames: 1, frameSize: 64 },
};

/* ============================================================
   07. UI — Interfaz (10-15 sprites)
   ============================================================ */
export const UI_ASSETS = {
  'ui.heartFull': { path: 'ui/heart_full.png', frames: 1, frameSize: 16 },
  'ui.heartMedium': { path: 'ui/heart_medium.png', frames: 1, frameSize: 16 },
  'ui.heartEmpty': { path: 'ui/heart_empty.png', frames: 1, frameSize: 16 },
  'ui.iconBlueberry': { path: 'ui/icon_blueberry.png', frames: 1, frameSize: 16 },
  'ui.iconTime': { path: 'ui/icon_time.png', frames: 1, frameSize: 16 },
  'ui.qualityBar': { path: 'ui/quality_bar.png', frames: 1, frameSize: 32 },
  'ui.progressBar': { path: 'ui/progress_bar.png', frames: 1, frameSize: 32 },
  'ui.buttonPause': { path: 'ui/button_pause.png', frames: 1, frameSize: 16 },
  'ui.buttonPlay': { path: 'ui/button_play.png', frames: 1, frameSize: 16 },
  'ui.buttonContinue': { path: 'ui/button_continue.png', frames: 1, frameSize: 16 },
  'ui.buttonRestart': { path: 'ui/button_restart.png', frames: 1, frameSize: 16 },
  'ui.panelFrame': { path: 'ui/panel_frame.png', frames: 1, frameSize: 32 },

  /* Alias de compatibilidad con las claves del motor */
  'ui.iconRipe': { path: 'ui/icon_blueberry.png', frames: 1, frameSize: 16 },
  'ui.lifeFull': { path: 'ui/heart_full.png', frames: 1, frameSize: 16 },
  'ui.lifeEmpty': { path: 'ui/heart_empty.png', frames: 1, frameSize: 16 },
  'ui.iconError': { path: 'effects/text_error.png', frames: 1, frameSize: 32 },
  'ui.iconBasket': { path: 'ui/icon_blueberry.png', frames: 1, frameSize: 16 },
  'ui.iconPause': { path: 'ui/button_pause.png', frames: 1, frameSize: 16 },
  'ui.panel': { path: 'ui/panel_frame.png', frames: 1, frameSize: 32 },
  'ui.button': { path: 'ui/button_play.png', frames: 1, frameSize: 16 },
  'ui.iconUnripe': { path: 'fruits/fruit_unripe.png', frames: 1, frameSize: 16 },
};

/* ============================================================
   08. EFFECTS — Efectos (6-10 sprites)
   ============================================================ */
export const EFFECT_ASSETS = {
  'fx.harvestParticle': { path: 'effects/particle_harvest.png', frames: 4, frameSize: 16 },
  'fx.errorParticle': { path: 'effects/particle_error.png', frames: 4, frameSize: 16 },
  'fx.inspectFlash': { path: 'effects/inspect_flash.png', frames: 1, frameSize: 16 },
  'fx.leaf': { path: 'effects/leaf.png', frames: 1, frameSize: 16 },
  'fx.textPlus10': { path: 'effects/text_plus10.png', frames: 1, frameSize: 32 },
  'fx.textError': { path: 'effects/text_error.png', frames: 1, frameSize: 32 },
  'fx.shadowPlayer': { path: 'effects/shadow_player.png', frames: 1, frameSize: 32 },
  'fx.shadowSupervisor': { path: 'effects/shadow_supervisor.png', frames: 1, frameSize: 32 },
  'fx.selection': { path: 'effects/selection.png', frames: 1, frameSize: 32 },

  /* Alias de compatibilidad con las claves del motor */
  'fx.spark': { path: 'effects/particle_harvest.png', frames: 4, frameSize: 16 },
  'fx.puff': { path: 'effects/particle_error.png', frames: 4, frameSize: 16 },
  'fx.leaves': { path: 'effects/leaf.png', frames: 1, frameSize: 16 },
  'fx.alert': { path: 'effects/inspect_flash.png', frames: 1, frameSize: 16 },
  'fx.check': { path: 'effects/selection.png', frames: 1, frameSize: 32 },
  'fx.cross': { path: 'effects/text_error.png', frames: 1, frameSize: 32 },
};

/* ============================================================
   09. ENVIRONMENT — Entorno y fondo
   ============================================================ */
export const ENVIRONMENT_ASSETS = {
  'env.sky': { path: 'environment/sky.png', frames: 1, frameSize: 128 },
  'env.clouds': { path: 'environment/clouds.png', frames: 1, frameSize: 128 },
  'env.mountains': { path: 'environment/mountains.png', frames: 1, frameSize: 128 },
  'env.tree1': { path: 'environment/tree_01.png', frames: 1, frameSize: 64 },
  'env.tree2': { path: 'environment/tree_02.png', frames: 1, frameSize: 64 },
  'env.tree3': { path: 'environment/tree_03.png', frames: 1, frameSize: 64 },
  'env.signFundo': { path: 'environment/sign_fundo.png', frames: 1, frameSize: 64 },
  'env.signGrupo': { path: 'environment/sign_grupo.png', frames: 1, frameSize: 64 },
  'env.bush': { path: 'environment/bush.png', frames: 1, frameSize: 32 },
  'env.rockLarge': { path: 'environment/rock_large.png', frames: 1, frameSize: 32 },
  'env.grassDetail': { path: 'environment/grass_detail2.png', frames: 1, frameSize: 32 },
  'env.flowers': { path: 'environment/flowers.png', frames: 1, frameSize: 32 },

  /* Alias de compatibilidad con las claves del motor */
  'env.tree': { path: 'environment/tree_01.png', frames: 1, frameSize: 64 },
  'env.cloud': { path: 'environment/clouds.png', frames: 1, frameSize: 128 },
  'env.mountain': { path: 'environment/mountains.png', frames: 1, frameSize: 128 },
  'env.rock': { path: 'environment/rock_large.png', frames: 1, frameSize: 32 },
  'env.sign': { path: 'environment/sign_fundo.png', frames: 1, frameSize: 64 },
};

/* ============================================================
   CATÁLOGO COMPLETO
   ============================================================ */
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

/** Nº total de sprites declarados (sin contar alias). */
export function countUniqueSprites() {
  const files = new Set(Object.values(ASSET_MANIFEST).map((a) => a.path));
  return files.size;
}

export default ASSET_MANIFEST;
