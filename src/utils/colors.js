/**
 * colors.js — Paleta central del juego.
 * Un único sitio para los colores del pixel art, usado por los
 * placeholders generados por código y por los efectos.
 * Cuando lleguen los sprites definitivos, estas constantes siguen
 * siendo útiles para partículas, textos y UI.
 */

export const PALETTE = {
  /* Terreno (Arena/tierra cálida como en la muestra) */
  soil: '#dca364',
  soilLight: '#ecc48a',
  soilDark: '#b87e42',
  soilShadow: '#96612c',
  path: '#dca364',
  pathLight: '#ecc48a',
  pathDark: '#b87e42',
  grass: '#3b872b',
  grassDark: '#265e1b',
  grassLight: '#52aa3e',
  gravel: '#bfa78a',

  /* Follaje denso y vibrante */
  leaf: '#2c7a26',
  leafDark: '#1a4e16',
  leafLight: '#44a33c',
  leafHighlight: '#68cc5e',
  stem: '#6b4423',

  /* Frutos */
  ripe: '#3a5fcd',
  ripeLight: '#6f8ff0',
  ripeDark: '#24409a',
  unripe: '#e8a0b4',
  unripeLight: '#f6c6d4',
  unripeDark: '#b9718a',

  /* Personajes */
  skin: '#e8b088',
  skinDark: '#c4885f',
  shirtPlayer: '#4a9eff',
  shirtPlayerDark: '#2d6ec2',
  pantsPlayer: '#2f4f7f',
  hatPlayer: '#d94f7a',
  hatPlayerDark: '#a83559',
  shirtSupervisor: '#2d3f6b',
  pantsSupervisor: '#1e2a47',
  hatSupervisor: '#e8e8e8',
  clipboard: '#e0cfa0',

  /* Estructuras */
  wood: '#8b5a2b',
  woodLight: '#c98f4e',
  woodDark: '#5c3a17',
  fence: '#a9713d',
  fenceDark: '#7a4f27',
  metal: '#b8c0cc',
  metalDark: '#7e8794',
  crate: '#b07b3f',
  crateDark: '#7d5426',

  /* Cielo / fondo */
  sky: '#7ec8ff',
  skyDeep: '#4a9eff',
  mountain: '#8fa3b8',
  mountainDark: '#6b7f94',
  cloud: '#ffffff',

  /* UI / semánticos */
  panel: '#1a2c4e',
  panelLight: '#22345c',
  panelBorder: '#4a6fa5',
  text: '#ffffff',
  textSoft: '#cfe0d2',
  ok: '#4fbf5a',
  warn: '#f2c14e',
  danger: '#e2453c',
  accent: '#4a9eff',
  shadow: 'rgba(0, 0, 0, 0.35)',
};

/** Convierte un hex a rgba con alfa, para sombras y partículas. */
export function withAlpha(hex, alpha = 1) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default PALETTE;
