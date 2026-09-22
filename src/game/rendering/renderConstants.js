/**
 * renderConstants.js
 * ---------------------------------------------------------------
 * Re-exporta las constantes que necesita la capa de render.
 * Evita que Renderer importe desde cinco sitios distintos y deja un
 * único punto de importación.
 */

export {
  TILE_SIZE,
  TILE_TYPES,
  BASKET_STATES,
  PLANT_STATES,
  FRUIT_TYPES,
  DIRECTIONS,
} from '../config/constants.js';

export { PALETTE } from '../../utils/colors.js';
