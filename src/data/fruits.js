/**
 * fruits.js
 * ---------------------------------------------------------------
 * Definición de los tipos de fruto (§16, §10).
 *
 * RIPE   = maduro   → azul, recogible, suma puntos.
 * UNRIPE = pintón   → rosado/verdoso, NO recogible, genera error.
 *
 * Tipos futuros ya reservados en el catálogo (pequeño, dañado,
 * especial, bonus) pero no activos todavía.
 */

import { FRUIT_TYPES } from '../game/config/constants.js';
import { GAME_CONFIG } from '../game/config/gameConfig.js';

export const FRUITS = {
  [FRUIT_TYPES.RIPE]: {
    id: FRUIT_TYPES.RIPE,
    label: 'Maduro',
    description: 'Azul. Se puede recoger. Da puntos.',
    collectable: true,
    color: '#3a5fcd',
    colorLight: '#6f8ff0',
    colorDark: '#24409a',
    highlightColor: '#ffffff',
    points: GAME_CONFIG.scoreRipe,
    qualityDelta: 0,
    countsAsError: false,
    sprite: 'fruits/ripe.png',
    atlasFrame: 0,
    size: 8,
  },

  [FRUIT_TYPES.UNRIPE]: {
    id: FRUIT_TYPES.UNRIPE,
    label: 'Pintón',
    description: 'Rosado/verdoso. No se debe recoger.',
    collectable: false,
    color: '#e8a0b4',
    colorLight: '#f6c6d4',
    colorDark: '#b9718a',
    highlightColor: '#fff0f4',
    points: GAME_CONFIG.scoreUnripe,
    qualityDelta: -GAME_CONFIG.qualityLossPerUnripe,
    countsAsError: true,
    sprite: 'fruits/unripe.png',
    atlasFrame: 1,
    size: 8,
  },
};

/** Colores de pintón alternativos para variar visualmente (§11). */
export const UNRIPE_VARIANTS = [
  { color: '#e8a0b4', colorLight: '#f6c6d4', colorDark: '#b9718a' }, // rosado
  { color: '#c9d98a', colorLight: '#e2edb0', colorDark: '#96a862' }, // verdoso
  { color: '#d98a8a', colorLight: '#efb3b3', colorDark: '#a86262' }, // rojizo
];

/** Distribución de frutos por planta: 0, 1, 2, 3 o 4 (§11). */
export const FRUITS_PER_PLANT_WEIGHTS = [
  { count: 0, weight: 0.1 },
  { count: 1, weight: 0.22 },
  { count: 2, weight: 0.3 },
  { count: 3, weight: 0.24 },
  { count: 4, weight: 0.14 },
];

export function getFruitDef(type) {
  return FRUITS[type] ?? FRUITS[FRUIT_TYPES.RIPE];
}

export default FRUITS;
