/**
 * artHud.js — Elementos de interfaz del HUD.
 *
 * REFERENCIA (IMAGEN 1): el HUD es característico y muy reconocible:
 *
 *   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  ┌──┐
 *   │ 🫐 COSECHA   │ │ NIVEL: 1/12  │ │ OBJETIVO:    │  │II│
 *   │ DE ARÁNDANOS │ │ TIEMPO:01:45 │ │ Recolecta... │  └──┘
 *   │ FUNDO SAN... │ │ COSECHADOS:28│ │              │
 *   └──────────────┘ └──────────────┘ └──────────────┘
 *
 *   Abajo:
 *   ┌────────┐ ┌──────────────┐ ┌─────────────────┐
 *   │ VIDAS  │ │ PUNTUACIÓN   │ │ SIGUIENTE REV.  │
 *   └────────┘ └──────────────┘ └─────────────────┘
 *
 * Paneles de madera con borde oscuro, esquinas redondeadas y textos
 * con sombra dura. Se generan de 9 segmentos (esquinas + bordes +
 * centro) para poder dibujarlos a cualquier tamaño con drawImage.
 */

import { PixelCanvas } from './pixelCanvas.js';
import { PAL } from './palette.js';

/* ============================================================
   PALETA DEL HUD
   ============================================================ */
export const HUD = {
  panelDark: '#0f2a45',
  panelMid: '#14395c',
  panelLight: '#1c4d78',
  panelBorder: '#5a8fc0',
  panelBorderLight: '#8fc0e8',
  wood: '#8b5a2b',
  woodLight: '#c98f4e',
  woodDark: '#5c3a17',
  text: '#ffffff',
  textSoft: '#cfe0d2',
  textDim: '#8fa394',
  gold: '#ffd93d',
  green: '#4fbf5a',
  red: '#e2453c',
};

/**
 * Panel oscuro tipo HUD (para NIVEL/TIEMPO, VIDAS, PUNTUACIÓN...).
 * @param {number} w
 * @param {number} h
 * @param {object} opts { border, fill }
 */
export function drawHudPanel(w, h, { border = HUD.panelBorder, fill = HUD.panelMid } = {}) {
  const c = new PixelCanvas(w, h);

  // Borde exterior oscuro
  c.rect(0, 0, w, h, '#0a1a2a');
  // Cuerpo del panel
  c.rect(1, 1, w - 2, h - 2, fill);
  // Borde interior claro (bisel)
  c.rect(1, 1, w - 2, 1, border);
  c.rect(1, 1, 1, h - 2, border);
  c.rect(1, h - 2, w - 2, 1, '#0a1a2a');
  c.rect(w - 2, 1, 1, h - 2, '#0a1a2a');
  // Brillo superior
  c.rect(2, 2, w - 4, 1, HUD.panelLight, 0.6);

  return c;
}

/**
 * Panel de madera con cartel (para el logo del título).
 */
export function drawWoodPanel(w, h, { post = true } = {}) {
  const c = new PixelCanvas(w, h);

  // Postes de madera laterales (como el cartel de la referencia)
  if (post) {
    c.rect(2, 4, 3, h - 4, PAL.woodDark);
    c.rect(w - 5, 4, 3, h - 4, PAL.woodDark);
  }

  // Tabla de madera
  c.rect(0, 0, w, h - 4, HUD.wood);
  c.rect(0, 0, w, 2, HUD.woodLight);
  c.rect(0, h - 6, w, 2, HUD.woodDark);
  c.rectOutline(0, 0, w, h - 4, PAL.outline, 1);

  // Vetas de madera
  c.rect(4, Math.round(h * 0.35), w - 8, 1, HUD.woodLight, 0.5);
  c.rect(4, Math.round(h * 0.7), w - 8, 1, HUD.woodDark, 0.5);

  return c;
}

/* ============================================================
   BARRAS
   ============================================================ */

/** Fondo de barra de progreso. */
export function drawBarTrack(w = 32, h = 10) {
  const c = new PixelCanvas(w, h);
  c.rect(0, 0, w, h, '#0a1a2a');
  c.rect(1, 1, w - 2, h - 2, '#1a2c3e');
  c.rect(1, 1, w - 2, 1, '#2a4a5e');
  return c;
}

/** Relleno de barra (se estira según el valor). */
export function drawBarFill(w = 32, h = 8, kind = 'green') {
  const c = new PixelCanvas(w, h);
  const colors = {
    green: ['#6ee87a', '#4fbf5a', '#2d8a38'],
    yellow: ['#ffe07a', '#f2c14e', '#b8901a'],
    red: ['#ff8a7a', '#e2453c', '#a82520'],
    blue: ['#8fd0ff', '#4a9eff', '#2d6ec2'],
  }[kind] ?? ['#6ee87a', '#4fbf5a', '#2d8a38'];

  c.rect(0, 0, w, h, colors[1]);
  c.rect(0, 0, w, 1, colors[0]);       // brillo
  c.rect(0, h - 1, w, 1, colors[2]);   // sombra

  return c;
}

/** Barra de calidad con degradado verde→rojo. */
export function drawQualityBar(w = 32, h = 8) {
  const c = new PixelCanvas(w, h);
  c.rect(0, 0, w, h, '#0a1a2a');
  c.rect(1, 1, w - 2, h - 2, '#3a4a3a');
  // Marcas de referencia
  for (let i = 1; i < 4; i += 1) {
    c.rect(Math.round((w / 4) * i), 1, 1, h - 2, '#5a6a5a', 0.7);
  }
  return c;
}

/* ============================================================
   ICONOS
   ============================================================ */

/** Corazón (vida) en tres estados. */
export function drawHeart(state = 'full') {
  const c = new PixelCanvas(16, 16);

  const mask = [
    '..XXX..XXX..',
    '.XXXXXXXXXX.',
    'XXXXXXXXXXXX',
    'XXXXXXXXXXXX',
    'XXXXXXXXXXXX',
    '.XXXXXXXXXX.',
    '..XXXXXXXX..',
    '...XXXXXX...',
    '....XXXX....',
    '.....XX.....',
  ];

  const fills = {
    full: { body: '#e2453c', light: '#ff8078', dark: '#a82520', outline: '#5a1510' },
    medium: { body: '#e2453c', light: '#ff8078', dark: '#a82520', outline: '#5a1510' },
    empty: { body: '#3a4a5a', light: '#5a6a7a', dark: '#243040', outline: '#0a1a2a' },
  }[state] ?? {};

  const ox = 2;
  const oy = 3;

  for (let y = 0; y < mask.length; y += 1) {
    for (let x = 0; x < mask[y].length; x += 1) {
      if (mask[y][x] !== 'X') continue;

      const px = x + ox;
      const py = y + oy;

      // "medio": solo la mitad izquierda está llena
      const emptySide = state === 'medium' && x >= 6;

      c.setPixel(px, py, emptySide ? fills.dark : fills.body);
      if (!emptySide) c.setPixel(px, py + 1, fills.dark);
    }
  }

  // Contorno
  for (let y = 0; y < mask.length; y += 1) {
    for (let x = 0; x < mask[y].length; x += 1) {
      if (mask[y][x] !== 'X') continue;
      const px = x + ox;
      const py = y + oy;
      const isEdge =
        !mask[y - 1]?.[x] || !mask[y + 1]?.[x] ||
        mask[y][x - 1] !== 'X' || mask[y][x + 1] !== 'X';
      if (isEdge) c.setPixel(px, py, fills.outline);
    }
  }

  // Brillo en el lóbulo izquierdo
  if (state !== 'empty') {
    c.rect(4, oy + 1, 2, 2, fills.light);
    c.setPixel(3, oy + 2, fills.light);
  }

  return c;
}

/** Icono de arándano del HUD (el contador de cosechados). */
export function drawIconBlueberry(size = 16) {
  const c = new PixelCanvas(size, size);
  const r = Math.floor(size / 2) - 1;
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 2) + 1;

  c.circle(cx, cy, r, '#1b2a5c');
  c.circle(cx, cy, r - 1, PAL.berry);
  c.circle(cx + 1, cy + 1, r - 2, PAL.berryDark);
  c.circle(cx - 1, cy - 1, 2, PAL.berryLight);
  c.setPixel(cx - 1, cy - 1, '#ffffff');
  // Corona
  c.rect(cx - 1, cy - r - 1, 3, 1, '#3a2a1a');

  return c;
}

/** Icono de reloj (temporizador). */
export function drawIconTime() {
  const c = new PixelCanvas(16, 16);
  c.circle(8, 9, 6, '#0a1a2a');
  c.circle(8, 9, 5, '#e8eef4');
  c.circle(8, 9, 4, '#ffffff');
  // Manecillas
  c.rect(7, 5, 2, 5, '#1a2a3a');
  c.rect(8, 8, 4, 2, '#1a2a3a');
  c.setPixel(8, 9, HUD.red);
  // Corona de cuerda
  c.rect(7, 1, 2, 2, '#8a95a5');
  c.rect(5, 2, 2, 1, '#8a95a5');
  c.rect(9, 2, 2, 1, '#8a95a5');
  return c;
}

/** Icono de fruto pintón con "prohibido" (leyenda del HUD). */
export function drawIconUnripe() {
  const c = new PixelCanvas(16, 16);
  c.circle(8, 8, 6, '#7a4a5a');
  c.circle(8, 8, 5, PAL.berryPink);
  c.circle(9, 10, 3, PAL.berryPinkDark);
  c.circle(6, 6, 2, PAL.berryPinkLight);
  return c;
}

/** Icono de error (cruz roja). */
export function drawIconError() {
  const c = new PixelCanvas(16, 16);
  c.circle(8, 8, 7, '#5a1510');
  c.circle(8, 8, 6, HUD.red);
  // Cruz blanca
  c.rect(6, 4, 3, 8, '#ffffff');
  c.rect(4, 6, 8, 3, '#ffffff');
  return c;
}

/** Icono de alerta (triángulo amarillo). */
export function drawIconAlert() {
  const c = new PixelCanvas(16, 16);
  // Triángulo
  for (let y = 0; y < 12; y += 1) {
    const half = Math.floor(y * 0.55);
    c.rect(8 - half, y + 2, half * 2 + 1, 1, '#8a6a1a');
  }
  for (let y = 0; y < 11; y += 1) {
    const half = Math.floor(y * 0.5);
    c.rect(8 - half, y + 3, half * 2 + 1, 1, PAL.warn);
  }
  c.rect(7, 5, 2, 4, '#3a2a0a');
  c.rect(7, 10, 2, 2, '#3a2a0a');
  return c;
}

/** Icono de acierto (check verde). */
export function drawIconCheck() {
  const c = new PixelCanvas(16, 16);
  c.circle(8, 8, 7, '#1a4a20');
  c.circle(8, 8, 6, HUD.green);
  // Check
  c.rect(4, 8, 2, 2, '#ffffff');
  c.rect(6, 10, 2, 2, '#ffffff');
  c.rect(8, 8, 2, 2, '#ffffff');
  c.rect(10, 6, 2, 2, '#ffffff');
  c.rect(12, 4, 2, 2, '#ffffff');
  return c;
}

/* ============================================================
   BOTONES
   ============================================================ */

/**
 * Botón cuadrado del HUD.
 * @param {string} kind 'pause' | 'play' | 'continue' | 'restart'
 */
export function drawButton(kind = 'pause', size = 32) {
  const c = new PixelCanvas(size, size);
  const s = size;

  // Base del botón (madera)
  c.rect(0, 0, s, s, PAL.outline);
  c.rect(1, 1, s - 2, s - 2, HUD.wood);
  c.rect(1, 1, s - 2, 2, HUD.woodLight);
  c.rect(1, s - 3, s - 2, 2, HUD.woodDark);
  // Bisel interior
  c.rect(2, 2, s - 4, s - 4, '#a06a35');
  c.rect(2, 2, s - 4, 1, '#d4a05a');

  const mid = Math.floor(s / 2);

  switch (kind) {
    case 'pause':
      c.rect(mid - 5, mid - 6, 3, 12, HUD.text);
      c.rect(mid + 2, mid - 6, 3, 12, HUD.text);
      break;

    case 'play':
      // Triángulo
      for (let i = 0; i < 9; i += 1) {
        c.rect(mid - 4 + i, mid - i, 2, i * 2 + 1, HUD.green);
      }
      break;

    case 'continue':
      for (let i = 0; i < 8; i += 1) {
        c.rect(mid - 6 + i, mid - i, 2, i * 2 + 1, '#8fd0ff');
      }
      c.rect(mid + 3, mid - 6, 3, 12, '#8fd0ff');
      break;

    case 'restart':
      // Flecha circular
      c.circle(mid, mid, 6, HUD.gold);
      c.circle(mid, mid, 4, HUD.wood);
      c.rect(mid - 1, mid - 8, 4, 4, HUD.gold);
      c.rect(mid + 1, mid - 7, 2, 2, HUD.wood);
      break;

    default:
      break;
  }

  return c;
}

/* ============================================================
   PANEL DE LEYENDA (el de la derecha en la referencia)
   ============================================================ */

/**
 * Panel de leyenda: "Maduro / Pintón / Error".
 * Se dibuja como una tira vertical con los tres iconos.
 */
export function drawLegendPanel(width = 64, height = 76) {
  const c = new PixelCanvas(width, height);

  // Fondo del panel
  c.rect(0, 0, width, height, '#0a1a2a', 0.88);
  c.rectOutline(0, 0, width, height, HUD.panelBorder, 1);

  // Iconos con su etiqueta (barras de texto representativas)
  const rows = [
    { icon: drawIconBlueberry(12), label: '#ffffff', y: 6 },
    { icon: drawIconUnripe(), label: '#e8a0b4', y: 30 },
    { icon: drawIconError(), label: '#e2453c', y: 54 },
  ];

  rows.forEach((row) => {
    c.drawCanvas(row.icon, 3, row.y);
    // Etiqueta en barras (el texto real lo dibuja el canvas del juego)
    c.rect(18, row.y + 2, 34, 3, row.label);
    c.rect(18, row.y + 8, 26, 2, row.label, 0.6);
  });

  return c;
}

/* ============================================================
   PROMPTS / INDICADORES
   ============================================================ */

/** Flecha verde de entrega (la que señala la caja en la referencia). */
export function drawDeliverArrow() {
  const c = new PixelCanvas(24, 24);

  // Flecha hacia abajo
  c.polygon([[4, 2], [20, 2], [20, 10], [24, 10], [12, 24], [0, 10], [4, 10]], PAL.outline);
  c.polygon([[5, 3], [19, 3], [19, 11], [22, 11], [12, 22], [2, 11], [5, 11]], '#4fbf5a');
  // Brillo
  c.rect(7, 4, 3, 8, '#6ee87a');
  c.rect(9, 12, 4, 6, '#6ee87a');

  return c;
}

/** Indicador de selección (marco de esquinas amarillas). */
export function drawSelection(size = 32) {
  const c = new PixelCanvas(size, size);
  const corner = Math.round(size * 0.28);
  const t = 2;

  c.rect(0, 0, corner, t, PAL.warn);
  c.rect(0, 0, t, corner, PAL.warn);
  c.rect(size - corner, 0, corner, t, PAL.warn);
  c.rect(size - t, 0, t, corner, PAL.warn);
  c.rect(0, size - t, corner, t, PAL.warn);
  c.rect(0, size - corner, t, corner, PAL.warn);
  c.rect(size - corner, size - t, corner, t, PAL.warn);
  c.rect(size - t, size - corner, t, corner, PAL.warn);

  return c;
}

/** Burbuja de diálogo del supervisor. */
export function drawSpeechBubble(w = 64, h = 24) {
  const c = new PixelCanvas(w, h);
  c.rect(0, 0, w, h, '#ffffff');
  c.rectOutline(0, 0, w, h, PAL.outline, 1);
  // Rabito
  c.rect(6, h, 4, 4, '#ffffff');
  c.rect(6, h, 1, 4, PAL.outline);
  c.rect(9, h, 1, 4, PAL.outline);
  c.rect(6, h + 3, 4, 1, PAL.outline);
  return c;
}

export { PAL };
