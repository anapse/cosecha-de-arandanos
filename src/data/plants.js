/**
 * plants.js
 * ---------------------------------------------------------------
 * Variantes reutilizables de planta de arándano (§9, §15).
 * No se crea una imagen distinta por arbusto: se combinan variantes.
 *
 * Cada variante describe cómo dibujar el arbusto según la cantidad
 * de frutos y su estado. El sprite real podrá sustituir al
 * placeholder sin cambiar esta tabla.
 */

import { PLANT_STATES } from '../game/config/constants.js';
import { TILE_SIZE } from '../game/config/constants.js';

export const PLANTS = {
  [PLANT_STATES.EMPTY]: {
    id: PLANT_STATES.EMPTY,
    label: 'Vacía',
    description: 'Sin frutos.',
    foliage: 0.55,       // 0-1 densidad del follaje (para el placeholder)
    minFruits: 0,
    maxFruits: 0,
    sprite: 'plants/empty.png',
  },

  [PLANT_STATES.FEW]: {
    id: PLANT_STATES.FEW,
    label: 'Pocos frutos',
    description: '1 fruto.',
    foliage: 0.7,
    minFruits: 1,
    maxFruits: 1,
    sprite: 'plants/few.png',
  },

  [PLANT_STATES.MEDIUM]: {
    id: PLANT_STATES.MEDIUM,
    label: 'Varios frutos',
    description: '2 frutos.',
    foliage: 0.85,
    minFruits: 2,
    maxFruits: 2,
    sprite: 'plants/medium.png',
  },

  [PLANT_STATES.ABUNDANT]: {
    id: PLANT_STATES.ABUNDANT,
    label: 'Abundante',
    description: '3 o 4 frutos.',
    foliage: 1,
    minFruits: 3,
    maxFruits: 4,
    sprite: 'plants/abundant.png',
  },

  [PLANT_STATES.RIPE]: {
    id: PLANT_STATES.RIPE,
    label: 'Con frutos maduros',
    description: 'Solo maduros.',
    foliage: 0.9,
    minFruits: 1,
    maxFruits: 4,
    sprite: 'plants/ripe.png',
  },

  [PLANT_STATES.UNRIPE]: {
    id: PLANT_STATES.UNRIPE,
    label: 'Con pintones',
    description: 'Solo pintones.',
    foliage: 0.9,
    minFruits: 1,
    maxFruits: 4,
    sprite: 'plants/unripe.png',
  },

  [PLANT_STATES.MIXED]: {
    id: PLANT_STATES.MIXED,
    label: 'Mixta',
    description: 'Maduros y pintones.',
    foliage: 0.95,
    minFruits: 2,
    maxFruits: 4,
    sprite: 'plants/mixed.png',
  },

  [PLANT_STATES.HARVESTED]: {
    id: PLANT_STATES.HARVESTED,
    label: 'Ya recolectada',
    description: 'Sin frutos, fue cosechada.',
    foliage: 0.5,
    minFruits: 0,
    maxFruits: 0,
    sprite: 'plants/harvested.png',
  },
};

/** Paleta del follaje para los placeholders. */
export const PLANT_COLORS = {
  leaf: '#3f7d3a',
  leafDark: '#2b5a28',
  leafLight: '#57a04f',
  trunk: '#6b4423',
  trunkDark: '#4a2f18',
  soil: '#a9764a',
  soilDark: '#7d5533',
};

/** Dimensiones base de una planta (ocupa 1 tile, con algo de altura). */
export const PLANT_SIZE = {
  width: TILE_SIZE,
  height: Math.round(TILE_SIZE * 1.1),
};

/** Elige la variante de planta según la composición de sus frutos. */
export function resolvePlantState({ totalFruits, ripeCount, unripeCount, harvested }) {
  if (harvested && totalFruits === 0) return PLANT_STATES.HARVESTED;
  if (totalFruits === 0) return PLANT_STATES.EMPTY;
  if (ripeCount > 0 && unripeCount > 0) return PLANT_STATES.MIXED;
  if (unripeCount > 0) return PLANT_STATES.UNRIPE;
  if (ripeCount > 0) return PLANT_STATES.RIPE;
  return PLANT_STATES.EMPTY;
}

export function getPlantDef(state) {
  return PLANTS[state] ?? PLANTS[PLANT_STATES.EMPTY];
}

export default PLANTS;
