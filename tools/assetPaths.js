/**
 * assetPaths.js — Estructura OFICIAL de carpetas de assets.
 *
 * Fuente de verdad de dónde va cada PNG. La usan el generador y el
 * catálogo (src/data/assets.js) para que NUNCA se desincronicen.
 *
 * Estructura (§4-§13 de la especificación):
 *
 * public/assets/
 * ├── player/
 * │   ├── idle/  walk/  harvest/  states/
 * ├── supervisor/
 * │   ├── walk/  inspection/  states/
 * ├── plants/
 * ├── fruits/
 * ├── terrain/
 * ├── basket/
 * ├── ui/
 * │   ├── hud/  icons/  buttons/  bars/  panels/  prompts/
 * ├── effects/
 * │   ├── harvest/  error/  inspection/  particles/  shadows/  floating-text/
 * └── environment/
 *     ├── sky/  clouds/  mountains/  trees/  signs/  decorations/
 */

export const ASSET_FOLDERS = {
  /* ---------- 01 PLAYER ---------- */
  'player.idle': 'player/idle',
  'player.walk': 'player/walk',
  'player.harvest': 'player/harvest',
  'player.states': 'player/states',

  /* ---------- 02 SUPERVISOR ---------- */
  'supervisor.walk': 'supervisor/walk',
  'supervisor.inspection': 'supervisor/inspection',
  'supervisor.states': 'supervisor/states',

  /* ---------- 03 PLANTS ---------- */
  plants: 'plants',

  /* ---------- 04 FRUITS ---------- */
  fruits: 'fruits',

  /* ---------- 05 TERRAIN ---------- */
  terrain: 'terrain',

  /* ---------- 06 BASKET / BOXES / TRUCK ---------- */
  basket: 'basket',

  /* ---------- 07 UI ---------- */
  'ui.hud': 'ui/hud',
  'ui.icons': 'ui/icons',
  'ui.buttons': 'ui/buttons',
  'ui.bars': 'ui/bars',
  'ui.panels': 'ui/panels',
  'ui.prompts': 'ui/prompts',

  /* ---------- 08 EFFECTS ---------- */
  'effects.harvest': 'effects/harvest',
  'effects.error': 'effects/error',
  'effects.inspection': 'effects/inspection',
  'effects.particles': 'effects/particles',
  'effects.shadows': 'effects/shadows',
  'effects.floatingText': 'effects/floating-text',

  /* ---------- 09 ENVIRONMENT ---------- */
  'environment.sky': 'environment/sky',
  'environment.clouds': 'environment/clouds',
  'environment.mountains': 'environment/mountains',
  'environment.trees': 'environment/trees',
  'environment.signs': 'environment/signs',
  'environment.decorations': 'environment/decorations',
};

/**
 * Lista completa de carpetas que deben existir.
 * Incluye `sounds` aunque sea opcional.
 */
export const ALL_FOLDERS = [
  ...Object.values(ASSET_FOLDERS),
  'sounds',
];

/**
 * Estado de cada asset (§17).
 *   DEFINITIVO → arte pixel-art dibujado a mano para el juego
 *   PLACEHOLDER→ arte temporal generado por código
 *   PENDIENTE  → todavía no existe el archivo
 */
export const ASSET_STATUS = {
  DEFINITIVO: 'DEFINITIVO',
  PLACEHOLDER: 'PLACEHOLDER',
  PENDIENTE: 'PENDIENTE',
};

/**
 * Resuelve la carpeta destino de un asset a partir de su grupo.
 * @param {string} group clave de ASSET_FOLDERS
 */
export function folderFor(group) {
  return ASSET_FOLDERS[group] ?? 'misc';
}
