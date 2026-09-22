/**
 * assets.js
 * ---------------------------------------------------------------
 * CATÁLOGO CENTRAL DE ASSETS (§15 de la especificación).
 *
 * Este archivo es la ÚNICA fuente de verdad de las rutas de imágenes.
 * Ningún otro módulo debe escribir una ruta de asset directamente.
 *
 * Se ofrecen DOS vistas del mismo catálogo:
 *
 *   1. ASSETS      → estructura ANIDADA por categoría (legible,
 *                    organizada como la referencia visual de carpetas).
 *                    Es la que se usa para consultar/documentar.
 *
 *   2. ASSET_MANIFEST → estructura PLANA con claves lógicas
 *                    ('player.walkDown'), que es lo que pide el motor.
 *                    Se DERIVA de ASSETS para que nunca se
 *                    desincronicen.
 *
 * REGLA DE ORO (§16): si el PNG no existe, el AssetLoader cae al
 * placeholder generado por código, así el juego nunca se rompe.
 */

/* ============================================================
   0. RAÍZ PÚBLICA
   ============================================================ */
const ROOT = '/assets';

/** Une la raíz con una ruta relativa. */
const p = (rel) => `${ROOT}/${rel}`;

/* ============================================================
   1. ESTADOS DE ASSET (§17)
   ------------------------------------------------------------
   DEFINITIVO → arte pixel-art hecho para el juego
   PLACEHOLDER→ arte temporal generado por código
   PENDIENTE  → todavía no existe el archivo
   ============================================================ */
export const ASSET_STATUS = Object.freeze({
  DEFINITIVO: 'DEFINITIVO',
  PLACEHOLDER: 'PLACEHOLDER',
  PENDIENTE: 'PENDIENTE',
});

/* ============================================================
   2. CATÁLOGO ANIDADO (§15)
   ------------------------------------------------------------
   Cada entrada hoja: { path, frames, frameSize, status, use }
   ============================================================ */

/**
 * Helper para declarar una entrada de asset.
 *
 * @param {string} path ruta pública del PNG
 * @param {number} frames nº de frames (spritesheet en tira horizontal)
 * @param {number} frameSize lado del frame en px (ancho de cada frame).
 *   Para sprites NO cuadrados, `frameSize` es el ANCHO del frame y
 *   conviene declarar `h` con la altura real.
 * @param {string} status DEFINITIVO | PLACEHOLDER | PENDIENTE
 * @param {string} use descripción corta de para qué sirve
 * @param {object} [dims] dimensiones explícitas para sprites no cuadrados
 *   @param {number} [dims.w] ancho TOTAL en px del PNG
 *   @param {number} [dims.h] alto TOTAL en px del PNG
 */
const A = (path, frames, frameSize, status, use, dims = null) => ({
  path,
  frames,
  frameSize,
  status,
  use,
  /** Ancho total del PNG. Si no se indica, frames x frameSize. */
  width: dims?.w ?? frames * frameSize,
  /** Alto total del PNG. Si no se indica, frameSize (frame cuadrado). */
  height: dims?.h ?? frameSize,
});

const D = ASSET_STATUS.DEFINITIVO;

export const ASSETS = {
  /* ---------- 01 PLAYER ---------- */
  player: {
    idle: A(p('player/idle/player_idle.png'), 4, 32, D, 'quieto'),
    walk: {
      up: A(p('player/walk/player_walk_up.png'), 4, 32, D, 'caminar arriba'),
      down: A(p('player/walk/player_walk_down.png'), 4, 32, D, 'caminar abajo'),
      left: A(p('player/walk/player_walk_left.png'), 4, 32, D, 'caminar izquierda'),
      right: A(p('player/walk/player_walk_right.png'), 4, 32, D, 'caminar derecha'),
    },
    harvest: {
      left: A(p('player/harvest/player_harvest_left.png'), 4, 32, D, 'recoger izquierda'),
      right: A(p('player/harvest/player_harvest_right.png'), 4, 32, D, 'recoger derecha'),
    },
    states: {
      wait: A(p('player/states/player_wait.png'), 1, 32, D, 'esperar'),
      full: A(p('player/states/player_full.png'), 1, 32, D, 'canasta llena'),
      tired: A(p('player/states/player_tired.png'), 1, 32, D, 'cansado'),
      error: A(p('player/states/player_error.png'), 1, 32, D, 'error'),
      victory: A(p('player/states/player_victory.png'), 1, 32, D, 'victoria'),
      defeat: A(p('player/states/player_defeat.png'), 1, 32, D, 'derrota'),
    },
  },

  /* ---------- 02 SUPERVISOR ---------- */
  supervisor: {
    walk: {
      up: A(p('supervisor/walk/supervisor_walk_up.png'), 4, 32, D, 'caminar arriba'),
      down: A(p('supervisor/walk/supervisor_walk_down.png'), 4, 32, D, 'caminar abajo'),
      left: A(p('supervisor/walk/supervisor_walk_left.png'), 4, 32, D, 'caminar izquierda'),
      right: A(p('supervisor/walk/supervisor_walk_right.png'), 4, 32, D, 'caminar derecha'),
    },
    inspection: {
      review: A(p('supervisor/inspection/supervisor_review.png'), 4, 32, D, 'revisar'),
      write: A(p('supervisor/inspection/supervisor_write.png'), 4, 32, D, 'anotar'),
      detectError: A(p('supervisor/inspection/supervisor_detect_error.png'), 4, 32, D, 'detectar error'),
      approve: A(p('supervisor/inspection/supervisor_approve.png'), 4, 32, D, 'aprobar'),
    },
    states: {
      talk: A(p('supervisor/states/supervisor_talk.png'), 4, 32, D, 'hablar'),
    },
  },

  /* ---------- 03 PLANTS ---------- */
  plants: {
    empty: A(p('plants/plant_empty.png'), 1, 32, D, 'vacía'),
    few: A(p('plants/plant_few.png'), 1, 32, D, 'pocos frutos'),
    medium: A(p('plants/plant_medium.png'), 1, 32, D, 'media'),
    abundant: A(p('plants/plant_abundant.png'), 1, 32, D, 'abundante'),
    ripe: A(p('plants/plant_ripe.png'), 1, 32, D, 'madura'),
    unripe: A(p('plants/plant_unripe.png'), 1, 32, D, 'pintona'),
    mixed: A(p('plants/plant_mixed.png'), 1, 32, D, 'mixta'),
    harvested: A(p('plants/plant_harvested.png'), 1, 32, D, 'cosechada'),
    /* Piezas para la composición planta + frutos (§7) */
    base: A(p('plants/plant_base.png'), 1, 32, D, 'follaje base sin frutos'),
    row: A(p('plants/plant_row.png'), 1, 32, D, 'hilera alta de cultivo (32x64)', { w: 32, h: 64 }),
  },

  /* ---------- 04 FRUITS ---------- */
  fruits: {
    ripe: A(p('fruits/fruit_ripe.png'), 1, 16, D, 'fruto maduro (con aro)'),
    unripe: A(p('fruits/fruit_unripe.png'), 1, 16, D, 'fruto pintón'),
    ripePlain: A(p('fruits/fruit_ripe_plain.png'), 1, 16, D, 'maduro sin aro'),
    unripeGreen: A(p('fruits/fruit_unripe_green.png'), 1, 16, D, 'pintón verdoso'),
    groupX2: A(p('fruits/fruit_group_x2.png'), 1, 16, D, 'grupo de 2'),
    groupX3: A(p('fruits/fruit_group_x3.png'), 1, 16, D, 'grupo de 3'),
    inHand: A(p('fruits/fruit_in_hand.png'), 1, 16, D, 'en la mano'),
    fall: A(p('fruits/fruit_fall.png'), 1, 16, D, 'cayendo'),
  },

  /* ---------- 05 TERRAIN ---------- */
  terrain: {
    soil: A(p('terrain/ground_soil.png'), 1, 32, D, 'tierra de cultivo'),
    pathV: A(p('terrain/path_vertical.png'), 1, 32, D, 'camino vertical'),
    pathH: A(p('terrain/path_horizontal.png'), 1, 32, D, 'camino horizontal'),
    corner: A(p('terrain/path_corner.png'), 1, 32, D, 'esquina de camino'),
    cross: A(p('terrain/path_intersection.png'), 1, 32, D, 'intersección'),
    grass: A(p('terrain/grass.png'), 1, 32, D, 'césped'),
    grassEdge: A(p('terrain/grass_edge.png'), 1, 32, D, 'borde de césped'),
    fenceH: A(p('terrain/fence_horizontal.png'), 1, 32, D, 'cerca horizontal'),
    fenceV: A(p('terrain/fence_vertical.png'), 1, 32, D, 'cerca vertical'),
    fenceCorner: A(p('terrain/fence_corner.png'), 1, 32, D, 'esquina de cerca'),
    deliveryZone: A(p('terrain/delivery_zone.png'), 1, 32, D, 'zona de entrega'),
    deliveryMarker: A(p('terrain/delivery_marker.png'), 1, 32, D, 'marcador de entrega'),
    detail: A(p('terrain/ground_detail.png'), 1, 32, D, 'detalle de tierra'),
    rock: A(p('terrain/rock.png'), 1, 32, D, 'piedra'),
    flower: A(p('terrain/flower.png'), 1, 32, D, 'flores'),
  },

  /* ---------- 06 BASKET / BOXES / TRUCK ---------- */
  basket: {
    empty: A(p('basket/basket_empty.png'), 1, 32, D, 'canasta vacía'),
    low: A(p('basket/basket_low.png'), 1, 32, D, 'canasta con pocos'),
    medium: A(p('basket/basket_medium.png'), 1, 32, D, 'canasta media'),
    full: A(p('basket/basket_full.png'), 1, 32, D, 'canasta llena'),
    box: A(p('basket/box_empty.png'), 1, 32, D, 'caja vacía'),
    boxFilled: A(p('basket/box_filled.png'), 1, 32, D, 'caja con frutos'),
    boxStack: A(p('basket/box_stack.png'), 1, 32, D, 'cajas apiladas'),
    boxOnTruck: A(p('basket/box_on_truck.png'), 1, 32, D, 'caja en el camión'),
    truck: A(p('basket/truck_side.png'), 1, 64, D, 'camión lateral', { w: 64, h: 40 }),
    truckLoaded: A(p('basket/truck_loaded.png'), 1, 64, D, 'camión cargado', { w: 64, h: 40 }),
  },

  /* ---------- 07 UI ---------- */
  ui: {
    hud: {
      logoPanel: A(p('ui/hud/hud_logo_panel.png'), 1, 110, D, 'panel del título', { w: 110, h: 44 }),
      logoBerry: A(p('ui/hud/hud_logo_berry.png'), 1, 32, D, 'arándano del logo'),
    },
    icons: {
      heartFull: A(p('ui/icons/heart_full.png'), 1, 16, D, 'vida llena'),
      heartMedium: A(p('ui/icons/heart_medium.png'), 1, 16, D, 'vida media'),
      heartEmpty: A(p('ui/icons/heart_empty.png'), 1, 16, D, 'vida vacía'),
      blueberry: A(p('ui/icons/icon_blueberry.png'), 1, 16, D, 'icono arándano'),
      time: A(p('ui/icons/icon_time.png'), 1, 16, D, 'icono tiempo'),
      unripe: A(p('ui/icons/icon_unripe.png'), 1, 16, D, 'icono pintón'),
      error: A(p('ui/icons/icon_error.png'), 1, 16, D, 'icono error'),
      alert: A(p('ui/icons/icon_alert.png'), 1, 16, D, 'icono alerta'),
      check: A(p('ui/icons/icon_check.png'), 1, 16, D, 'icono acierto'),
    },
    buttons: {
      pause: A(p('ui/buttons/button_pause.png'), 1, 32, D, 'botón pausa'),
      play: A(p('ui/buttons/button_play.png'), 1, 32, D, 'botón jugar'),
      continue: A(p('ui/buttons/button_continue.png'), 1, 32, D, 'botón continuar'),
      restart: A(p('ui/buttons/button_restart.png'), 1, 32, D, 'botón reiniciar'),
    },
    bars: {
      track: A(p('ui/bars/bar_track.png'), 1, 64, D, 'fondo de barra', { w: 64, h: 10 }),
      fillGreen: A(p('ui/bars/bar_fill_green.png'), 1, 64, D, 'relleno verde', { w: 64, h: 8 }),
      fillYellow: A(p('ui/bars/bar_fill_yellow.png'), 1, 64, D, 'relleno amarillo', { w: 64, h: 8 }),
      fillRed: A(p('ui/bars/bar_fill_red.png'), 1, 64, D, 'relleno rojo', { w: 64, h: 8 }),
      fillBlue: A(p('ui/bars/bar_fill_blue.png'), 1, 64, D, 'relleno azul', { w: 64, h: 8 }),
      quality: A(p('ui/bars/quality_bar.png'), 1, 64, D, 'barra de calidad', { w: 64, h: 8 }),
      progress: A(p('ui/bars/progress_bar.png'), 1, 64, D, 'barra de progreso', { w: 64, h: 8 }),
    },
    panels: {
      frame: A(p('ui/panels/panel_frame.png'), 1, 64, D, 'marco de panel', { w: 64, h: 40 }),
      hud: A(p('ui/panels/panel_hud.png'), 1, 96, D, 'panel del HUD', { w: 96, h: 56 }),
      hudSmall: A(p('ui/panels/panel_hud_small.png'), 1, 64, D, 'panel pequeño', { w: 64, h: 32 }),
      legend: A(p('ui/panels/panel_legend.png'), 1, 64, D, 'panel de leyenda', { w: 64, h: 78 }),
    },
    prompts: {
      deliverArrow: A(p('ui/prompts/prompt_deliver_arrow.png'), 1, 24, D, 'flecha de entrega'),
      selection: A(p('ui/prompts/prompt_selection.png'), 1, 32, D, 'indicador de selección'),
      speechBubble: A(p('ui/prompts/prompt_speech_bubble.png'), 1, 64, D, 'burbuja de diálogo', { w: 64, h: 24 }),
    },
  },

  /* ---------- 08 EFFECTS ---------- */
  effects: {
    harvest: {
      particle: A(p('effects/harvest/particle_harvest.png'), 4, 16, D, 'partícula al recoger'),
    },
    error: {
      particle: A(p('effects/error/particle_error.png'), 4, 16, D, 'partícula de error'),
      text: A(p('effects/error/text_error.png'), 1, 32, D, 'texto de error', { w: 32, h: 16 }),
    },
    inspection: {
      flash: A(p('effects/inspection/inspect_flash.png'), 1, 16, D, 'destello de revisión', { w: 16, h: 16 }),
    },
    particles: {
      leaf: A(p('effects/particles/leaf.png'), 1, 16, D, 'hoja'),
    },
    shadows: {
      player: A(p('effects/shadows/shadow_player.png'), 1, 32, D, 'sombra del jugador'),
      supervisor: A(p('effects/shadows/shadow_supervisor.png'), 1, 32, D, 'sombra del supervisor'),
    },
    floatingText: {
      plus10: A(p('effects/floating-text/text_plus10.png'), 1, 32, D, 'texto +10', { w: 32, h: 16 }),
    },
  },

  /* ---------- 09 ENVIRONMENT ---------- */
  environment: {
    sky: {
      sky: A(p('environment/sky/sky.png'), 1, 128, D, 'cielo', { w: 128, h: 64 }),
    },
    clouds: {
      clouds: A(p('environment/clouds/clouds.png'), 1, 128, D, 'nubes', { w: 128, h: 64 }),
    },
    mountains: {
      mountains: A(p('environment/mountains/mountains.png'), 1, 128, D, 'montañas', { w: 128, h: 64 }),
    },
    trees: {
      tree1: A(p('environment/trees/tree_01.png'), 1, 64, D, 'árbol 1'),
      tree2: A(p('environment/trees/tree_02.png'), 1, 64, D, 'árbol 2'),
      tree3: A(p('environment/trees/tree_03.png'), 1, 64, D, 'árbol 3'),
      bush: A(p('environment/trees/bush.png'), 1, 32, D, 'arbusto'),
    },
    signs: {
      fundo: A(p('environment/signs/sign_fundo.png'), 1, 64, D, 'cartel del fundo'),
      grupo: A(p('environment/signs/sign_grupo.png'), 1, 64, D, 'cartel del grupo'),
    },
    decorations: {
      rockLarge: A(p('environment/decorations/rock_large.png'), 1, 32, D, 'roca grande'),
      grassDetail: A(p('environment/decorations/grass_detail2.png'), 1, 32, D, 'césped de detalle'),
      flowers: A(p('environment/decorations/flowers.png'), 1, 32, D, 'flores'),
    },
  },
};

/* ============================================================
   3. DERIVADOS: vistas planas para el motor
   ============================================================ */

/**
 * Manifiesto PLANO con claves lógicas que usa el motor.
 * Se deriva de ASSETS, así que no puede desincronizarse.
 *
 * Clave lógica: 'categoria.subcategoria' en minúsculas.
 * Ej: player.walk.down → 'player.walkDown'
 *     ui.bars.fillGreen → 'ui.fillGreen'
 */
function buildManifest() {
  const out = {};

  // Grupo (nivel 1) → clave lógica (nivel 2 + resto)
  const groups = {
    player: 'player',
    supervisor: 'supervisor',
    // Las categorías de un solo nivel usan singular/plural del motor
    plants: 'plant',
    fruits: 'fruit',
    terrain: 'terrain',
    basket: 'basket',
    ui: 'ui',
    effects: 'fx',
    environment: 'env',
  };

  const flatten = (node, prefix, groupKey) => {
    Object.entries(node).forEach(([key, value]) => {
      if (value && typeof value === 'object' && 'path' in value) {
        // Es una hoja
        const logical = prefix ? `${groupKey}.${prefix}${cap(key)}` : `${groupKey}.${key}`;
        out[logical] = value;
      } else if (value && typeof value === 'object') {
        flatten(value, prefix ? `${prefix}${cap(key)}` : key, groupKey);
      }
    });
  };

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  Object.entries(ASSETS).forEach(([group, node]) => {
    flatten(node, '', groups[group] ?? group);
  });

  return out;
}

/**
 * Manifiesto plano. Claves lógicas → entrada de asset.
 * Es lo que consume el AssetLoader.
 */
export const ASSET_MANIFEST = buildManifest();

/* ============================================================
   4. COMPATIBILIDAD CON EL MOTOR
   ------------------------------------------------------------
   El motor ya usaba ciertos nombres. Se declaran aquí como ALIAS
   explícitos para no tocar la lógica del juego (§20).
   ============================================================ */
const ALIASES = {
  // El motor llama 'inspect' a la animación de revisar
  'supervisor.inspect': 'supervisor.inspectionReview',

  // El motor llamaba 'path' al camino vertical
  'terrain.path': 'terrain.pathV',

  // Terreno: nombre corto usado por el render
  'terrain.fence': 'terrain.fenceH',

  // Frutos: el motor usa estos nombres
  'fruit.ripePlain': 'fruit.ripePlain',
  'fruit.group2': 'fruit.groupX2',
  'fruit.group3': 'fruit.groupX3',

  // Cajas
  'basket.boxEmpty': 'basket.box',
  'basket.boxFull': 'basket.boxFilled',

  // Camión
  'truck.idle': 'basket.truck',
  'truck.side': 'basket.truck',
  'truck.loaded': 'basket.truckLoaded',
  'truck.loading': 'basket.truck',
  'truck.leaving': 'basket.truckLoaded',

  // Plantas: nombres que usa el render
  'plant.pocas': 'plant.few',

  // UI: nombres del render
  'ui.iconRipe': 'ui.iconsBlueberry',
  'ui.iconBasket': 'ui.iconsBlueberry',
  'ui.iconTime': 'ui.iconsTime',
  'ui.iconError': 'ui.iconsError',
  'ui.iconPause': 'ui.buttonsPause',
  'ui.iconFruit': 'ui.iconsBlueberry',
  'ui.lifeFull': 'ui.iconsHeartFull',
  'ui.lifeMedium': 'ui.iconsHeartMedium',
  'ui.lifeEmpty': 'ui.iconsHeartEmpty',
  'ui.heartFull': 'ui.iconsHeartFull',
  'ui.heartMedium': 'ui.iconsHeartMedium',
  'ui.heartEmpty': 'ui.iconsHeartEmpty',
  'ui.qualityBar': 'ui.barsQuality',
  'ui.progressBar': 'ui.barsProgress',
  'ui.barTrack': 'ui.barsTrack',
  'ui.panel': 'ui.panelsHud',
  'ui.panelFrame': 'ui.panelsFrame',
  'ui.buttonPause': 'ui.buttonsPause',
  'ui.buttonPlay': 'ui.buttonsPlay',
  'ui.buttonContinue': 'ui.buttonsContinue',
  'ui.buttonRestart': 'ui.buttonsRestart',
  'ui.button': 'ui.buttonsPause',
  'ui.deliverArrow': 'ui.promptsDeliverArrow',
  'ui.selection': 'ui.promptsSelection',
  'ui.speechBubble': 'ui.promptsSpeechBubble',

  // Efectos: nombres del render
  'fx.harvestParticle': 'fx.harvestParticle',
  'fx.errorParticle': 'fx.errorParticle',
  'fx.textError': 'fx.errorText',
  'fx.inspectFlash': 'fx.inspectionFlash',
  'fx.leaf': 'fx.particlesLeaf',
  'fx.leaves': 'fx.particlesLeaf',
  'fx.spark': 'fx.harvestParticle',
  'fx.puff': 'fx.harvestParticle',
  'fx.shadowPlayer': 'fx.shadowsPlayer',
  'fx.shadowSupervisor': 'fx.shadowsSupervisor',
  'fx.selection': 'fx.inspectionFlash',
  'fx.textPlus10': 'fx.floatingTextPlus10',
  'fx.alert': 'ui.iconsAlert',
  'fx.check': 'ui.iconsCheck',
  'fx.cross': 'ui.iconsError',

  // Entorno
  'env.sky': 'env.skySky',
  'env.cloud': 'env.cloudsClouds',
  'env.clouds': 'env.cloudsClouds',
  'env.mountain': 'env.mountainsMountains',
  'env.mountains': 'env.mountainsMountains',
  'env.tree': 'env.treesTree1',
  'env.tree1': 'env.treesTree1',
  'env.tree2': 'env.treesTree2',
  'env.tree3': 'env.treesTree3',
  'env.bush': 'env.treesBush',
  'env.sign': 'env.signsFundo',
  'env.signFundo': 'env.signsFundo',
  'env.signGrupo': 'env.signsGrupo',
  'env.rock': 'env.decorationsRockLarge',
  'env.rockLarge': 'env.decorationsRockLarge',
  'env.grassDetail': 'env.decorationsGrassDetail',
  'env.flowers': 'env.decorationsFlowers',

  // Terreno: detalles
  'terrain.delivery': 'terrain.deliveryZone',
  'terrain.border': 'terrain.grassEdge',


  // Supervisor: el motor pide los estados de inspección en plano
  'supervisor.review': 'supervisor.inspectionReview',
  'supervisor.write': 'supervisor.inspectionWrite',
  'supervisor.detectError': 'supervisor.inspectionDetectError',
  'supervisor.approve': 'supervisor.inspectionApprove',
  'supervisor.talk': 'supervisor.statesTalk',
  'supervisor.idle': 'supervisor.walkDown',
  'supervisor.walkUp': 'supervisor.walkUp',
  'supervisor.walkDown': 'supervisor.walkDown',
  'supervisor.walkLeft': 'supervisor.walkLeft',
  'supervisor.walkRight': 'supervisor.walkRight',

  // Terreno: el motor distingue dos tonos de tierra (no hay sprite
  // aparte; se reutiliza el suelo base y se tinta en el render)
  'terrain.soilDark': 'terrain.soil',
  'terrain.soilLight': 'terrain.soil',
  'terrain.delivery': 'terrain.deliveryZone',
  'terrain.border': 'terrain.grassEdge',
  'terrain.detail': 'terrain.detail',

  // Barras: nombre corto usado por el render
  'ui.fillGreen': 'ui.barsFillGreen',
  'ui.fillYellow': 'ui.barsFillYellow',
  'ui.fillRed': 'ui.barsFillRed',
  'ui.fillBlue': 'ui.barsFillBlue',
};

// Se aplican los alias sobre el manifiesto.
Object.entries(ALIASES).forEach(([alias, target]) => {
  if (ASSET_MANIFEST[target]) {
    ASSET_MANIFEST[alias] = ASSET_MANIFEST[target];
  }
});

/* ============================================================
   5. SONIDOS (opcionales, §40)
   ============================================================ */
export const SOUND_MANIFEST = {
  harvest: { path: p('sounds/harvest.wav') },
  error: { path: p('sounds/error.wav') },
  deliver: { path: p('sounds/deliver.wav') },
  supervisorAlert: { path: p('sounds/supervisor-alert.wav') },
  victory: { path: p('sounds/victory.wav') },
  defeat: { path: p('sounds/defeat.wav') },
  button: { path: p('sounds/button.wav') },
  truck: { path: p('sounds/truck.wav') },
};

/* ============================================================
   6. API PÚBLICA
   ============================================================ */

/** URL pública de un asset por clave lógica. null si no existe. */
export function assetUrl(key) {
  return ASSET_MANIFEST[key]?.path ?? null;
}

/** Entrada completa de un asset por clave lógica. */
export function assetEntry(key) {
  return ASSET_MANIFEST[key] ?? null;
}

/** Nº de frames de una animación. */
export function frameCount(key) {
  return ASSET_MANIFEST[key]?.frames ?? 1;
}

/** Estado (DEFINITIVO / PLACEHOLDER / PENDIENTE) de un asset. */
export function assetStatus(key) {
  return ASSET_MANIFEST[key]?.status ?? ASSET_STATUS.PENDIENTE;
}

/** Rutas únicas (dos alias pueden apuntar al mismo archivo). */
export function uniquePaths() {
  return [...new Set(Object.values(ASSET_MANIFEST).map((e) => e.path))];
}

/** Número de archivos PNG distintos del catálogo. */
export function countUniqueSprites() {
  return uniquePaths().length;
}

/** Resumen de estados para el informe. */
export function statusSummary() {
  const byStatus = { DEFINITIVO: 0, PLACEHOLDER: 0, PENDIENTE: 0 };
  Object.values(ASSET_MANIFEST).forEach((e) => {
    byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
  });
  return {
    keys: Object.keys(ASSET_MANIFEST).length,
    files: countUniqueSprites(),
    byStatus,
  };
}

/* ============================================================
   7. GRUPOS POR CATEGORÍA (informe y pruebas)
   ============================================================ */
export const PLAYER_ASSETS = ASSETS.player;
export const SUPERVISOR_ASSETS = ASSETS.supervisor;
export const PLANT_ASSETS = ASSETS.plants;
export const FRUIT_ASSETS = ASSETS.fruits;
export const TERRAIN_ASSETS = ASSETS.terrain;
export const BASKET_ASSETS = ASSETS.basket;
export const TRUCK_ASSETS = ASSETS.basket; // camión vive en basket/
export const UI_ASSETS = ASSETS.ui;
export const EFFECT_ASSETS = ASSETS.effects;
export const ENVIRONMENT_ASSETS = ASSETS.environment;
