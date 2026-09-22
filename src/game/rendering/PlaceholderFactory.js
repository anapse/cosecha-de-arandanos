/**
 * PlaceholderFactory.js
 * ---------------------------------------------------------------
 * Genera pixel art temporal POR CÓDIGO (§28, §29).
 *
 * Todo placeholder se dibuja en un canvas offscreen del tamaño
 * lógico correcto y se devuelve como si fuera un sprite. El juego
 * completo es jugable y legible SIN ningún archivo de imagen.
 *
 * Cuando se sustituya por PNG real (32x32, 48x48, 64x64 o
 * spritesheet), esta fábrica simplemente deja de usarse para esas
 * claves y NADA MÁS cambia.
 */

import { PALETTE, withAlpha } from '../../utils/colors.js';
import { TILE_SIZE } from '../config/constants.js';

/** Crea un canvas offscreen. */
function makeCanvas(width, height) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.imageSmoothingEnabled = false;
  return canvas;
}

/** Rellena un rectángulo (coordenadas enteras = pixel art nítido). */
function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/* ============================================================
   PERSONAJE genérico (jugador y supervisor comparten esqueleto)
   Vista TOP-DOWN con sombrero visible (§8).
   ============================================================ */
function drawCharacter(ctx, opts) {
  const {
    size = 32,
    shirt = PALETTE.shirtPlayer,
    shirtDark = PALETTE.shirtPlayerDark,
    pants = PALETTE.pantsPlayer,
    hat = PALETTE.hatPlayer,
    hatDark = PALETTE.hatPlayerDark,
    skin = PALETTE.skin,
    facing = 'down',
    armSide = null,     // 'left' | 'right' | null
    armReach = 0,       // 0-1 extensión del brazo
    step = 0,           // 0 | 1 fase de caminado
    showBackpack = false,
    showClipboard = false,
  } = opts;

  const cx = Math.round(size / 2);

  // Sombra en el suelo
  ctx.fillStyle = withAlpha('#000000', 0.22);
  ctx.beginPath();
  ctx.ellipse(cx, size - 3, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Piernas (se alternan al caminar)
  const legOffset = step === 1 ? 1 : -1;
  px(ctx, cx - 5, size - 12 + legOffset, 4, 8, pants);
  px(ctx, cx + 1, size - 12 - legOffset, 4, 8, pants);
  px(ctx, cx - 5, size - 5 + legOffset, 4, 3, PALETTE.soilShadow);
  px(ctx, cx + 1, size - 5 - legOffset, 4, 3, PALETTE.soilShadow);

  // Torso
  px(ctx, cx - 6, size - 21, 12, 10, shirt);
  px(ctx, cx - 6, size - 21, 12, 3, shirtDark);
  px(ctx, cx - 6, size - 13, 12, 2, shirtDark);

  // Mochila/canasta a la espalda (§8)
  if (showBackpack) {
    px(ctx, cx - 8, size - 20, 3, 8, PALETTE.crate);
    px(ctx, cx - 8, size - 20, 3, 2, PALETTE.crateDark);
  }

  // Brazos
  const armY = size - 19;
  if (armSide === 'left') {
    const reach = Math.round(armReach * 8);
    px(ctx, cx - 11 - reach, armY, 5, 4, shirt);
    px(ctx, cx - 12 - reach, armY, 2, 4, skin);
  } else if (armSide === 'right') {
    const reach = Math.round(armReach * 8);
    px(ctx, cx + 6 + reach, armY, 5, 4, shirt);
    px(ctx, cx + 10 + reach, armY, 2, 4, skin);
  } else {
    px(ctx, cx - 10, armY, 4, 5, shirt);
    px(ctx, cx + 6, armY, 4, 5, shirt);
  }

  // Cabeza
  px(ctx, cx - 5, size - 29, 10, 9, skin);
  px(ctx, cx - 5, size - 29, 10, 2, PALETTE.skinDark);

  // Rasgos según orientación
  if (facing !== 'up') {
    const eyeY = size - 25;
    px(ctx, cx - 3, eyeY, 2, 2, '#2a2a2a');
    px(ctx, cx + 1, eyeY, 2, 2, '#2a2a2a');
  }

  // Sombrero
  px(ctx, cx - 7, size - 32, 14, 4, hat);      // ala
  px(ctx, cx - 5, size - 36, 10, 5, hat);      // copa
  px(ctx, cx - 5, size - 36, 10, 2, hatDark);

  // Portapapeles del supervisor (§18)
  if (showClipboard) {
    px(ctx, cx + 5, size - 20, 5, 7, PALETTE.clipboard);
    px(ctx, cx + 6, size - 19, 3, 1, '#5a4a30');
    px(ctx, cx + 6, size - 17, 3, 1, '#5a4a30');
  }
}

/* ============================================================
   PLANTA DE ARÁNDANO
   ============================================================ */
function drawPlant(ctx, opts) {
  const { size = TILE_SIZE, density = 1, dead = false } = opts;
  const cx = size / 2;

  ctx.fillStyle = withAlpha('#000000', 0.2);
  ctx.beginPath();
  ctx.ellipse(cx, size - 3, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Montículo de tierra
  px(ctx, cx - 12, size - 7, 24, 5, PALETTE.soilDark);

  // Follaje: varias capas para dar volumen
  const leaf = dead ? '#5d7a4a' : PALETTE.leaf;
  const leafDark = dead ? '#42583a' : PALETTE.leafDark;
  const leafLight = dead ? '#7a9663' : PALETTE.leafLight;

  px(ctx, cx - 11, size - 22, 22, 16, leafDark);
  px(ctx, cx - 9, size - 26, 18, 18, leaf);
  px(ctx, cx - 6, size - 29, 12, 12, leafLight);
  px(ctx, cx - 3, size - 31, 6, 6, dead ? '#8ba872' : PALETTE.leafHighlight);

  // Detalle de hojas irregulares para que no parezca un bloque
  const specks = density > 0.8 ? 7 : density > 0.6 ? 5 : 3;
  for (let i = 0; i < specks; i += 1) {
    const x = cx - 9 + ((i * 5) % 18);
    const y = size - 26 + ((i * 7) % 14);
    px(ctx, x, y, 3, 3, i % 2 === 0 ? leafLight : leafDark);
  }
}

/* ============================================================
   FRUTO (maduro / pintón). Se dibuja con brillo para el maduro.
   ============================================================ */
function drawFruit(ctx, opts) {
  const {
    size = 10,
    color = PALETTE.ripe,
    light = PALETTE.ripeLight,
    dark = PALETTE.ripeDark,
    outline = '#1b2a5c',
    highlight = true,
  } = opts;

  const r = size / 2;

  // Contorno oscuro redondo
  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.arc(r, r, r - 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Cuerpo
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(r, r, r - 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Volumen inferior
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(r, r + 1, r - 2.5, 0, Math.PI);
  ctx.fill();

  // Brillo superior (marca el maduro como apetecible)
  if (highlight) {
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(r - 1.2, r - 1.2, r / 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Corona del arándano
  px(ctx, r - 2, 1, 4, 1, '#4a3b2a');
}

/* ============================================================
   TILES DE TERRENO (§30)
   ============================================================ */
function drawTerrain(ctx, type, size = TILE_SIZE) {
  const s = size;

  switch (type) {
    case 'soil':
      px(ctx, 0, 0, s, s, PALETTE.soil);
      for (let i = 0; i < 10; i += 1) {
        px(ctx, (i * 7) % s, (i * 11) % s, 2, 2, PALETTE.soilDark);
      }
      break;

    case 'soilLight':
      px(ctx, 0, 0, s, s, PALETTE.soilLight);
      for (let i = 0; i < 8; i += 1) {
        px(ctx, (i * 9) % s, (i * 13) % s, 2, 2, PALETTE.soil);
      }
      break;

    case 'soilDark':
      px(ctx, 0, 0, s, s, PALETTE.soilDark);
      for (let i = 0; i < 8; i += 1) {
        px(ctx, (i * 6) % s, (i * 10) % s, 2, 2, PALETTE.soilShadow);
      }
      break;

    case 'path':
    case 'pathH':
      px(ctx, 0, 0, s, s, PALETTE.path);
      px(ctx, 0, 0, s, 2, PALETTE.pathLight);
      px(ctx, 0, s - 2, s, 2, PALETTE.pathDark);
      for (let i = 0; i < 6; i += 1) {
        px(ctx, (i * 11 + 3) % s, (i * 7 + 5) % s, 3, 2, PALETTE.pathDark);
      }
      break;

    case 'corner':
    case 'cross':
      px(ctx, 0, 0, s, s, PALETTE.grass);
      px(ctx, 4, 4, s - 8, s - 8, PALETTE.path);
      break;

    case 'border':
      px(ctx, 0, 0, s, s, PALETTE.grassDark);
      px(ctx, 0, s - 4, s, 4, PALETTE.fenceDark);
      break;

    case 'grass':
      px(ctx, 0, 0, s, s, PALETTE.grass);
      for (let i = 0; i < 12; i += 1) {
        px(ctx, (i * 7) % s, (i * 5) % s, 2, 3, PALETTE.grassLight);
      }
      break;

    case 'fence':
      px(ctx, 0, 0, s, s, PALETTE.grass);
      px(ctx, 0, 10, s, 5, PALETTE.fence);
      px(ctx, 0, 20, s, 4, PALETTE.fence);
      px(ctx, 6, 5, 5, 24, PALETTE.fenceDark);
      px(ctx, 21, 5, 5, 24, PALETTE.fenceDark);
      break;

    case 'delivery':
      px(ctx, 0, 0, s, s, PALETTE.gravel);
      px(ctx, 2, 2, s - 4, 2, '#d4c4a8');
      for (let i = 0; i < 6; i += 1) {
        px(ctx, (i * 9 + 2) % s, (i * 12 + 4) % s, 3, 2, '#9c8a70');
      }
      // Marca de zona de entrega
      px(ctx, 8, 8, 16, 2, withAlpha(PALETTE.warn, 0.7));
      px(ctx, 14, 12, 4, 8, withAlpha(PALETTE.warn, 0.7));
      break;

    default:
      px(ctx, 0, 0, s, s, PALETTE.soil);
  }
}

/* ============================================================
   CANASTA / CAJAS (§17)
   ============================================================ */
function drawBasket(ctx, opts) {
  const { size = 32, fill = 0, isBox = false } = opts;
  const s = size;

  if (isBox) {
    px(ctx, 3, 10, s - 6, s - 14, PALETTE.crate);
    px(ctx, 3, 10, s - 6, 3, PALETTE.crateDark);
    px(ctx, 3, s - 7, s - 6, 3, PALETTE.crateDark);
    px(ctx, 5, 13, 3, s - 20, PALETTE.crateDark);
    px(ctx, s - 8, 13, 3, s - 20, PALETTE.crateDark);
    return;
  }

  // Cuerpo de la canasta (trapecio aproximado con rectángulos)
  px(ctx, 4, 14, s - 8, s - 18, PALETTE.wood);
  px(ctx, 3, 12, s - 6, 4, PALETTE.woodLight);
  px(ctx, 4, s - 6, s - 8, 3, PALETTE.woodDark);

  // Trama de mimbre
  for (let i = 6; i < s - 6; i += 4) {
    px(ctx, i, 15, 2, s - 22, PALETTE.woodDark);
  }

  // Arándanos dentro según el llenado
  if (fill > 0) {
    const levels = Math.max(1, Math.round(fill * 3));
    for (let i = 0; i < levels * 3; i += 1) {
      const x = 8 + ((i * 7) % (s - 16));
      const y = 14 - i * 1.5;
      ctx.fillStyle = PALETTE.ripe;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.ripeLight;
      ctx.beginPath();
      ctx.arc(x - 1, y - 1, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* ============================================================
   CAMIÓN (§16)
   ============================================================ */
function drawTruck(ctx, { width = 64, height = 40 } = {}) {
  // Cabina
  px(ctx, width - 22, 8, 18, 18, PALETTE.metal);
  px(ctx, width - 20, 11, 12, 8, '#6fa8d6');
  px(ctx, width - 22, 8, 18, 3, PALETTE.metalDark);

  // Caja de carga
  px(ctx, 2, 4, width - 26, 24, PALETTE.crate);
  px(ctx, 2, 4, width - 26, 3, PALETTE.crateDark);
  for (let i = 8; i < width - 26; i += 8) {
    px(ctx, i, 7, 2, 20, PALETTE.crateDark);
  }

  // Chasis y ruedas
  px(ctx, 2, 28, width - 6, 5, PALETTE.metalDark);
  ctx.fillStyle = '#2a2a2a';
  [12, width - 26, width - 12].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, 34, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.metal;
    ctx.beginPath();
    ctx.arc(wx, 34, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2a2a';
  });
}

/* ============================================================
   INTERFAZ (§34)
   ============================================================ */
function drawUi(ctx, key, size = 16) {
  const s = size;

  if (key.includes('lifeFull')) {
    px(ctx, 1, 4, s - 2, s - 8, PALETTE.danger);
    px(ctx, 3, 2, 4, 5, PALETTE.danger);
    px(ctx, s - 7, 2, 4, 5, PALETTE.danger);
    px(ctx, 3, 2, 2, 2, '#ff9a94');
    return;
  }

  if (key.includes('lifeEmpty')) {
    ctx.strokeStyle = withAlpha(PALETTE.danger, 0.45);
    ctx.lineWidth = 2;
    px(ctx, 1, 4, s - 2, s - 8, withAlpha('#000000', 0.35));
    px(ctx, 3, 2, 4, 5, withAlpha('#000000', 0.35));
    px(ctx, s - 7, 2, 4, 5, withAlpha('#000000', 0.35));
    return;
  }

  if (key.includes('iconRipe')) {
    drawFruit(ctx, { size: s, color: PALETTE.ripe, light: PALETTE.ripeLight, dark: PALETTE.ripeDark });
    return;
  }

  if (key.includes('iconUnripe')) {
    drawFruit(ctx, { size: s, color: PALETTE.unripe, light: PALETTE.unripeLight, dark: PALETTE.unripeDark, outline: '#7a4a5a' });
    return;
  }

  if (key.includes('iconError')) {
    px(ctx, 2, 2, s - 4, s - 4, withAlpha(PALETTE.danger, 0.25));
    ctx.strokeStyle = PALETTE.danger;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(s - 4, s - 4);
    ctx.moveTo(s - 4, 4);
    ctx.lineTo(4, s - 4);
    ctx.stroke();
    return;
  }

  if (key.includes('iconBasket')) {
    drawBasket(ctx, { size: s, fill: 0.6 });
    return;
  }

  if (key.includes('pause')) {
    px(ctx, 3, 2, 4, s - 4, PALETTE.text);
    px(ctx, s - 7, 2, 4, s - 4, PALETTE.text);
    return;
  }

  if (key.includes('panel')) {
    px(ctx, 0, 0, s, s, PALETTE.panel);
    px(ctx, 0, 0, s, 2, PALETTE.panelBorder);
    px(ctx, 0, s - 2, s, 2, PALETTE.panelBorder);
    return;
  }

  if (key.includes('button')) {
    px(ctx, 0, 0, s, s, PALETTE.wood);
    px(ctx, 0, 0, s, 3, PALETTE.woodLight);
    px(ctx, 0, s - 4, s, 4, PALETTE.woodDark);
    return;
  }

  px(ctx, 0, 0, s, s, PALETTE.metal);
}

/* ============================================================
   EFECTOS (§39)
   ============================================================ */
function drawEffect(ctx, key, size = 16) {
  const s = size;
  const cx = s / 2;

  if (key.includes('spark')) {
    ctx.fillStyle = PALETTE.warn;
    ctx.beginPath();
    ctx.moveTo(cx, 1);
    ctx.lineTo(cx + 3, cx);
    ctx.lineTo(cx, s - 1);
    ctx.lineTo(cx - 3, cx);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff8d0';
    ctx.beginPath();
    ctx.arc(cx, cx, 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (key.includes('puff')) {
    ctx.fillStyle = withAlpha(PALETTE.gravel, 0.75);
    ctx.beginPath();
    ctx.arc(cx, cx, cx - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = withAlpha('#ffffff', 0.4);
    ctx.beginPath();
    ctx.arc(cx - 2, cx - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (key.includes('leaves')) {
    px(ctx, 3, 5, 4, 3, PALETTE.leafLight);
    px(ctx, 9, 8, 4, 3, PALETTE.leaf);
    px(ctx, 5, 11, 3, 2, PALETTE.leafDark);
    return;
  }

  if (key.includes('alert')) {
    px(ctx, cx - 3, 1, 6, 11, PALETTE.warn);
    px(ctx, cx - 3, 1, 6, 3, '#ffe9a0');
    px(ctx, cx - 3, 14, 6, 3, PALETTE.warn);
    return;
  }

  if (key.includes('check')) {
    ctx.strokeStyle = PALETTE.ok;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(3, cx);
    ctx.lineTo(cx - 1, s - 4);
    ctx.lineTo(s - 3, 3);
    ctx.stroke();
    return;
  }

  if (key.includes('cross')) {
    ctx.strokeStyle = PALETTE.danger;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(3, 3);
    ctx.lineTo(s - 3, s - 3);
    ctx.moveTo(s - 3, 3);
    ctx.lineTo(3, s - 3);
    ctx.stroke();
    return;
  }

  ctx.fillStyle = PALETTE.text;
  ctx.beginPath();
  ctx.arc(cx, cx, cx - 2, 0, Math.PI * 2);
  ctx.fill();
}

/* ============================================================
   ENTORNO (§33)
   ============================================================ */
function drawEnvironment(ctx, key, size = 64) {
  if (key.includes('tree')) {
    px(ctx, size / 2 - 4, size - 22, 8, 22, PALETTE.woodDark);
    ctx.fillStyle = PALETTE.leafDark;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2 - 6, size / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.leaf;
    ctx.beginPath();
    ctx.arc(size / 2 - 5, size / 2 - 12, size / 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.leafHighlight;
    ctx.beginPath();
    ctx.arc(size / 2 - 8, size / 2 - 16, size / 9, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (key.includes('mountain')) {
    ctx.fillStyle = PALETTE.mountainDark;
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(size * 0.3, size * 0.3);
    ctx.lineTo(size * 0.6, size);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.mountain;
    ctx.beginPath();
    ctx.moveTo(size * 0.35, size);
    ctx.lineTo(size * 0.68, size * 0.2);
    ctx.lineTo(size, size);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(size * 0.62, size * 0.32);
    ctx.lineTo(size * 0.68, size * 0.2);
    ctx.lineTo(size * 0.75, size * 0.33);
    ctx.closePath();
    ctx.fill();
    return;
  }

  if (key.includes('cloud')) {
    ctx.fillStyle = withAlpha('#ffffff', 0.92);
    [
      [size * 0.3, size * 0.5, size * 0.18],
      [size * 0.5, size * 0.42, size * 0.22],
      [size * 0.7, size * 0.52, size * 0.16],
    ].forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    return;
  }

  if (key.includes('rock')) {
    ctx.fillStyle = PALETTE.mountainDark;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2 + 2, size / 3, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = PALETTE.mountain;
    ctx.beginPath();
    ctx.arc(size / 2 - 2, size / 2, size / 5, Math.PI, 0);
    ctx.fill();
    return;
  }

  if (key.includes('sign')) {
    px(ctx, size / 2 - 2, size / 2, 4, size / 2 - 4, PALETTE.woodDark);
    px(ctx, 2, size / 2 - 14, size - 4, 16, PALETTE.wood);
    px(ctx, 2, size / 2 - 14, size - 4, 3, PALETTE.woodLight);
    px(ctx, 5, size / 2 - 9, size - 10, 2, '#3a2a14');
    px(ctx, 5, size / 2 - 5, size - 14, 2, '#3a2a14');
    return;
  }

  // Arbusto genérico
  ctx.fillStyle = PALETTE.leafDark;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.leaf;
  ctx.beginPath();
  ctx.arc(size / 2 - 3, size / 2 - 3, size / 4.5, 0, Math.PI * 2);
  ctx.fill();
}

/* ============================================================
   PUNTO DE ENTRADA
   ============================================================ */
/**
 * Crea el placeholder correspondiente a una clave del manifiesto.
 * @param {string} key  clave lógica, ej. 'player.walkDown'
 * @param {object} def  definición del manifiesto { path, frames, frameSize }
 * @returns {HTMLCanvasElement|null}
 */
export function createPlaceholder(key, def = {}) {
  const size = def.frameSize ?? inferSize(key);
  const frames = def.frames ?? 1;

  // Para animaciones se genera una tira horizontal; el motor toma el
  // frame 0 salvo que SpriteRenderer pida otro.
  const canvas = makeCanvas(size * frames, size);
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;

  for (let frame = 0; frame < frames; frame += 1) {
    ctx.save();
    ctx.translate(frame * size, 0);
    drawFrame(key, ctx, size, frame, frames);
    ctx.restore();
  }

  return canvas;
}

function inferSize(key) {
  if (key.startsWith('truck')) return 64;
  if (key.startsWith('env.mountain')) return 128;
  if (key.startsWith('env.')) return 64;
  if (key.startsWith('ui.')) return 16;
  if (key.startsWith('fx.')) return 16;
  if (key.startsWith('fruit.')) return 10;
  if (key.startsWith('terrain.')) return TILE_SIZE;
  return 32;
}

function drawFrame(key, ctx, size, frame, frames) {
  const [group] = key.split('.');

  if (group === 'player' || group === 'supervisor') {
    const isSupervisor = group === 'supervisor';
    const facing = key.includes('Up')
      ? 'up'
      : key.includes('Down')
        ? 'down'
        : key.includes('Left')
          ? 'left'
          : key.includes('Right')
            ? 'right'
            : 'down';

    const isHarvest = key.includes('harvest');
    // El brazo se extiende y vuelve: 0 → 1 → 1 → 0 (secuencia §6).
    const armReach = isHarvest
      ? Math.sin((frame / Math.max(1, frames - 1)) * Math.PI)
      : 0;
    const armSide = key.includes('Left')
      ? 'left'
      : key.includes('Right')
        ? 'right'
        : null;

    const isWalking = key.includes('walk');
    const step = isWalking ? frame % 2 : 0;

    drawCharacter(ctx, {
      size,
      facing,
      step,
      armSide,
      armReach,
      showBackpack: !isSupervisor,
      showClipboard: isSupervisor,
      shirt: isSupervisor ? PALETTE.shirtSupervisor : PALETTE.shirtPlayer,
      shirtDark: isSupervisor ? PALETTE.pantsSupervisor : PALETTE.shirtPlayerDark,
      pants: isSupervisor ? PALETTE.pantsSupervisor : PALETTE.pantsPlayer,
      hat: isSupervisor ? PALETTE.hatSupervisor : PALETTE.hatPlayer,
      hatDark: isSupervisor ? '#b0b0b0' : PALETTE.hatPlayerDark,
      skin: isSupervisor ? '#f0c49a' : PALETTE.skin,
    });
    return;
  }

  if (group === 'plant') {
    const dead = key.includes('harvested') || key.includes('empty');
    const density = key.includes('abundant') ? 1 : key.includes('medium') ? 0.8 : 0.6;
    drawPlant(ctx, { size, density, dead });
    return;
  }

  if (group === 'fruit') {
    const isUnripe = key.includes('unripe');
    const isDamaged = key.includes('damaged');
    const isSpecial = key.includes('special') || key.includes('bonus');
    drawFruit(ctx, {
      size,
      color: isUnripe ? PALETTE.unripe : isDamaged ? '#7a5a4a' : isSpecial ? '#c86fd6' : PALETTE.ripe,
      light: isUnripe ? PALETTE.unripeLight : isDamaged ? '#a08272' : isSpecial ? '#e0a0ea' : PALETTE.ripeLight,
      dark: isUnripe ? PALETTE.unripeDark : isDamaged ? '#54402f' : isSpecial ? '#8a3f9a' : PALETTE.ripeDark,
      outline: isUnripe ? '#7a4a5a' : '#1b2a5c',
    });
    return;
  }

  if (group === 'terrain') {
    const type = key.split('.')[1];
    drawTerrain(ctx, type, size);
    return;
  }

  if (group === 'basket') {
    const isBox = key.includes('box') && !key.includes('stack');
    const stack = key.includes('stack');
    const fillKey = key.split('.')[1];
    const fill = fillKey.includes('full') ? 1 : fillKey.includes('medium') ? 0.6 : fillKey.includes('low') ? 0.3 : 0;

    if (stack) {
      drawBasket(ctx, { size, isBox: true });
      ctx.save();
      ctx.translate(0, -6);
      drawBasket(ctx, { size, isBox: true });
      ctx.restore();
    } else {
      drawBasket(ctx, { size, fill, isBox });
    }
    return;
  }

  if (group === 'truck') {
    drawTruck(ctx, { width: size, height: size * 0.62 });
    return;
  }

  if (group === 'ui') {
    drawUi(ctx, key, size);
    return;
  }

  if (group === 'fx') {
    drawEffect(ctx, key, size);
    return;
  }

  if (group === 'env') {
    drawEnvironment(ctx, key, size);
    return;
  }

  // Fallback: cuadrado magenta visible (nunca silencioso)
  px(ctx, 0, 0, size, size, '#ff00ff');
}

export default createPlaceholder;
