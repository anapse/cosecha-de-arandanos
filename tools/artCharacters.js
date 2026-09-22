/**
 * artCharacters.js — Arte del jugador y del supervisor.
 *
 * Estilo de la referencia visual: pixel art 16x16 / 32x32, vista
 * top-down, personajes pequeños y muy reconocibles.
 *
 *   Jugador    → sombrero ROSA, camisa azul, pantalón oscuro, mochila.
 *   Supervisor → sombrero claro, camisa azul oscuro, portapapeles.
 *
 * ANATOMÍA FIJA (canvas de 32x32 por frame). Todas las partes se
 * colocan a partir de estas constantes para que NUNCA se solapen ni
 * dejen huecos:
 *
 *   y = 0..1   margen superior
 *   y = 2..7   sombrero (copa + ala)
 *   y = 8..15  cabeza
 *   y = 16..24 torso (camisa)
 *   y = 25..28 piernas
 *   y = 29..31 zapatos
 *   sombra     y = 30
 */

import { PixelCanvas } from './pixelCanvas.js';
import { PAL } from './palette.js';

/* ============================================================
   ANATOMÍA (una sola fuente de verdad)
   ============================================================ */
const W = 32;
const H = 32;
const CX = 16;

const ANATOMY = {
  hatTop: 2,
  hatBrim: 6,      // fila del ala
  hatBottom: 8,
  headTop: 8,
  headHeight: 8,
  torsoTop: 16,
  torsoHeight: 9,
  legTop: 25,
  legHeight: 4,
  shoeTop: 29,
  shadowY: 30,
};

/** Fase de caminado: mueve piernas, brazos y da un balanceo vertical. */
function walkPhase(variant) {
  switch (variant) {
    case 0: return { legL: 0, legR: 0, bob: 0, armSwing: 0 };
    case 1: return { legL: -1, legR: 1, bob: -1, armSwing: 1 };
    case 2: return { legL: 0, legR: 0, bob: 0, armSwing: 0 };
    default: return { legL: 1, legR: -1, bob: -1, armSwing: -1 };
  }
}

/** Sombra elíptica bajo los pies. */
function drawShadow(canvas) {
  canvas.ellipse(CX, ANATOMY.shadowY + 1, 9, 3, PAL.shadow, 0.24);
}

/**
 * Piernas y zapatos.
 * @param {number} offset vertical por el balanceo del caminado
 */
function drawLegs(canvas, offset, opts = {}) {
  const {
    pants = PAL.pants,
    pantsDark = PAL.pantsDark,
    shoes = PAL.shoes,
    legL = 0,
    legR = 0,
  } = opts;

  const top = ANATOMY.legTop + offset;
  const shoeY = ANATOMY.shoeTop + offset;

  // Pierna izquierda
  canvas.rect(CX - 5, top + legL, 4, ANATOMY.legHeight, pants);
  canvas.rect(CX - 5, top + legL, 4, 1, pantsDark);
  canvas.rect(CX - 6, shoeY + legL, 5, 2, shoes);

  // Pierna derecha
  canvas.rect(CX + 1, top + legR, 4, ANATOMY.legHeight, pants);
  canvas.rect(CX + 1, top + legR, 4, 1, pantsDark);
  canvas.rect(CX + 1, shoeY + legR, 5, 2, shoes);
}

/** Torso con camisa y cuello. */
function drawTorso(canvas, offset, opts = {}) {
  const {
    shirt = PAL.shirt,
    shirtDark = PAL.shirtDark,
    width = 12,
  } = opts;

  const top = ANATOMY.torsoTop + offset;
  const half = Math.floor(width / 2);

  canvas.rect(CX - half, top, width, ANATOMY.torsoHeight, shirt);
  canvas.rect(CX - half, top, width, 2, shirtDark);                          // hombros
  canvas.rect(CX - half, top + ANATOMY.torsoHeight - 1, width, 1, shirtDark); // cinturón
  // Cuello
  canvas.rect(CX - 2, top - 1, 4, 2, PAL.skinShade);
}

/** Cabeza con rasgos según la dirección. */
function drawHead(canvas, offset, facing, opts = {}) {
  const { skin = PAL.skin, skinShade = PAL.skinShade, hair = '#5a3a22' } = opts;

  const top = ANATOMY.headTop + offset;
  const h = ANATOMY.headHeight;

  canvas.rect(CX - 5, top, 10, h, skin);
  canvas.rect(CX - 5, top, 10, 1, skinShade);

  if (facing === 'up') {
    // De espaldas: pelo, sin cara.
    canvas.rect(CX - 5, top, 10, 5, hair);
    canvas.rect(CX - 5, top + 5, 10, 3, skin);
    return;
  }

  const eyeY = top + 3;

  if (facing === 'left') {
    canvas.rect(CX - 4, eyeY, 2, 2, PAL.outline);
    canvas.rect(CX - 5, eyeY + 1, 1, 1, skinShade);
    return;
  }

  if (facing === 'right') {
    canvas.rect(CX + 2, eyeY, 2, 2, PAL.outline);
    canvas.rect(CX + 4, eyeY + 1, 1, 1, skinShade);
    return;
  }

  // De frente: dos ojos y boca
  canvas.rect(CX - 3, eyeY, 2, 2, PAL.outline);
  canvas.rect(CX + 1, eyeY, 2, 2, PAL.outline);
  canvas.rect(CX - 1, eyeY + 3, 3, 1, skinShade);
}

/** Sombrero del jugador (rosa). */
function drawPlayerHat(canvas, offset) {
  const brim = ANATOMY.hatBrim + offset;
  const top = ANATOMY.hatTop + offset;

  // Copa
  canvas.rect(CX - 5, top, 10, brim - top + 1, PAL.hat);
  canvas.rect(CX - 5, top, 10, 1, PAL.hatLight);
  canvas.rect(CX - 5, brim - 1, 10, 1, PAL.hatDark);
  // Ala (más ancha que la cabeza)
  canvas.rect(CX - 8, brim, 16, 2, PAL.hat);
  canvas.rect(CX - 8, brim, 16, 1, PAL.hatLight);
  canvas.rect(CX - 8, brim + 1, 16, 1, PAL.hatDark);
}

/** Sombrero del supervisor (claro con banda). */
function drawSupervisorHat(canvas, offset) {
  const brim = ANATOMY.hatBrim + offset;
  const top = ANATOMY.hatTop + offset;

  canvas.rect(CX - 5, top, 10, brim - top + 1, PAL.supHat);
  canvas.rect(CX - 5, top, 10, 1, PAL.white);
  canvas.rect(CX - 8, brim, 16, 2, PAL.supHat);
  canvas.rect(CX - 8, brim, 16, 1, PAL.white);
  canvas.rect(CX - 5, brim - 1, 10, 1, PAL.supHatDark); // banda
  canvas.rect(CX - 8, brim + 1, 16, 1, PAL.supHatDark);
}

/* ============================================================
   JUGADOR
   ============================================================ */
/**
 * Dibuja un frame del jugador.
 * @param {object} opts
 * @param {string} opts.facing 'down' | 'up' | 'left' | 'right'
 * @param {number} opts.variant fase de animación (0-3)
 * @param {string} opts.state 'walk'|'idle'|'harvest'|'wait'|'full'|'tired'|'error'|'victory'|'defeat'
 * @param {number} opts.armReach 0-1 extensión del brazo al recoger
 * @param {string} opts.armSide 'left' | 'right' | null
 */
export function drawPlayerFrame({
  facing = 'down',
  variant = 0,
  state = 'walk',
  armReach = 0,
  armSide = null,
} = {}) {
  const canvas = new PixelCanvas(W, H);
  const phase = walkPhase(variant);

  const isIdle = state === 'idle' || state === 'wait';
  const legL = isIdle ? 0 : phase.legL;
  const legR = isIdle ? 0 : phase.legR;
  const bob = isIdle ? (variant === 1 ? -1 : 0) : phase.bob;

  drawShadow(canvas);

  /* ---------- De atrás hacia delante (orden de dibujo) ---------- */

  // Mochila a la espalda
  if (facing === 'up') {
    canvas.rect(CX - 6, ANATOMY.torsoTop + bob, 12, 7, PAL.wood);
    canvas.rect(CX - 6, ANATOMY.torsoTop + bob, 12, 2, PAL.woodDark);
    canvas.rect(CX - 1, ANATOMY.torsoTop + 2 + bob, 2, 4, PAL.woodLight);
  } else {
    canvas.rect(CX - 8, ANATOMY.torsoTop + 1 + bob, 3, 6, PAL.wood);
    canvas.rect(CX - 8, ANATOMY.torsoTop + 1 + bob, 3, 2, PAL.woodDark);
  }

  drawLegs(canvas, bob, { legL, legR });
  drawTorso(canvas, bob);

  /* ---------- Brazos ---------- */
  const armTop = ANATOMY.torsoTop + 1 + bob;

  if (state === 'harvest' && armSide) {
    const reach = Math.round(armReach * 7);
    if (armSide === 'left') {
      canvas.rect(CX - 10 - reach, armTop, 6 + reach, 3, PAL.shirt);
      canvas.rect(CX - 12 - reach, armTop, 3, 3, PAL.skin);
    } else {
      canvas.rect(CX + 4, armTop, 6 + reach, 3, PAL.shirt);
      canvas.rect(CX + 9 + reach, armTop, 3, 3, PAL.skin);
    }
  } else if (state === 'full') {
    // Lleva la canasta con las dos manos delante
    canvas.rect(CX - 10, armTop, 4, 4, PAL.shirt);
    canvas.rect(CX + 6, armTop, 4, 4, PAL.shirt);
    canvas.rect(CX - 6, ANATOMY.legTop + bob - 2, 12, 6, PAL.basket);
    canvas.rect(CX - 6, ANATOMY.legTop + bob - 2, 12, 2, PAL.basketLight);
    canvas.rect(CX - 6, ANATOMY.legTop + bob + 3, 12, 1, PAL.basketDark);
  } else if (state === 'tired' || state === 'defeat') {
    canvas.rect(CX - 9, armTop + 3, 3, 6, PAL.shirt, 0.9);
    canvas.rect(CX + 6, armTop + 3, 3, 6, PAL.shirt, 0.9);
  } else if (state === 'victory') {
    // Brazos en alto
    canvas.rect(CX - 10, ANATOMY.hatBottom + bob, 3, 6, PAL.shirt);
    canvas.rect(CX + 7, ANATOMY.hatBottom + bob, 3, 6, PAL.shirt);
    canvas.rect(CX - 10, ANATOMY.hatTop + bob, 3, 3, PAL.skin);
    canvas.rect(CX + 7, ANATOMY.hatTop + bob, 3, 3, PAL.skin);
  } else {
    const swing = isIdle ? 0 : phase.armSwing;
    canvas.rect(CX - 9, armTop + swing, 3, 7, PAL.shirt);
    canvas.rect(CX + 6, armTop - swing, 3, 7, PAL.shirt);
    canvas.rect(CX - 9, armTop + swing + 7, 3, 2, PAL.skin);
    canvas.rect(CX + 6, armTop - swing + 7, 3, 2, PAL.skin);
  }

  /* ---------- Cabeza y sombrero ---------- */
  drawHead(canvas, bob, facing);
  drawPlayerHat(canvas, bob);

  /* ---------- Detalles según estado ---------- */
  if (state === 'error') {
    // Signo de exclamación rojo
    canvas.rect(CX + 10, ANATOMY.hatTop + bob, 3, 7, PAL.errorRed);
    canvas.rect(CX + 10, ANATOMY.hatTop + 9 + bob, 3, 3, PAL.errorRed);
  }

  if (state === 'tired') {
    canvas.rect(CX - 12, ANATOMY.headTop + bob + 2, 2, 3, PAL.skyDeep);
    canvas.rect(CX + 10, ANATOMY.headTop + bob + 4, 2, 3, PAL.skyDeep);
  }

  return canvas;
}

/* ============================================================
   SUPERVISOR
   ============================================================ */
/**
 * Dibuja un frame del supervisor.
 * @param {object} opts
 * @param {string} opts.facing
 * @param {number} opts.variant
 * @param {string} opts.state 'walk'|'idle'|'review'|'write'|'detectError'|'approve'|'talk'
 */
export function drawSupervisorFrame({
  facing = 'down',
  variant = 0,
  state = 'walk',
} = {}) {
  const canvas = new PixelCanvas(W, H);
  const phase = walkPhase(variant);

  const isIdle = state !== 'walk';
  const legL = isIdle ? 0 : phase.legL;
  const legR = isIdle ? 0 : phase.legR;
  const bob = isIdle ? (variant === 1 ? -1 : 0) : phase.bob;

  drawShadow(canvas);

  drawLegs(canvas, bob, {
    pants: PAL.supPants,
    pantsDark: PAL.supPantsDark,
    shoes: '#2a2a2a',
    legL,
    legR,
  });

  drawTorso(canvas, bob, {
    shirt: PAL.supShirt,
    shirtDark: PAL.supShirtDark,
  });

  // Corbata
  canvas.rect(CX - 1, ANATOMY.torsoTop + 2 + bob, 2, 5, PAL.supShirtDark);

  /* ---------- Brazos / portapapeles ---------- */
  const armTop = ANATOMY.torsoTop + 1 + bob;

  if (state === 'write' || state === 'approve') {
    canvas.rect(CX - 10, armTop, 4, 5, PAL.supShirt);
    canvas.rect(CX + 6, armTop, 4, 5, PAL.supShirt);
    // Portapapeles delante
    canvas.rect(CX - 5, armTop + 2, 10, 9, PAL.clipboard);
    canvas.rect(CX - 5, armTop + 2, 10, 1, PAL.clipboardDark);
    canvas.rect(CX - 4, armTop + 4, 8, 5, PAL.paper);
    canvas.rect(CX - 3, armTop + 5, 6, 1, PAL.outlineSoft);
    canvas.rect(CX - 3, armTop + 7, 5, 1, PAL.outlineSoft);
    canvas.rect(CX - 1, armTop + 1, 3, 1, PAL.metalDark);
    if (state === 'approve') {
      // Marca verde de aprobado
      canvas.rect(CX + 1, armTop + 5, 2, 1, PAL.ok);
      canvas.rect(CX, armTop + 6, 1, 1, PAL.ok);
      canvas.rect(CX + 3, armTop + 4, 1, 1, PAL.ok);
    }
  } else if (state === 'detectError') {
    canvas.rect(CX - 10, armTop, 4, 6, PAL.supShirt);
    // Señala con el dedo
    canvas.rect(CX + 6, armTop - 1, 7, 3, PAL.supShirt);
    canvas.rect(CX + 13, armTop - 1, 3, 3, PAL.skin);
    // Signo de exclamación rojo
    canvas.rect(CX + 10, ANATOMY.hatTop + bob, 3, 6, PAL.errorRed);
    canvas.rect(CX + 10, ANATOMY.hatTop + 8 + bob, 3, 3, PAL.errorRed);
  } else if (state === 'talk') {
    canvas.rect(CX - 10, armTop, 4, 6, PAL.supShirt);
    canvas.rect(CX + 6, ANATOMY.torsoTop + bob, 3, 6, PAL.supShirt);
    canvas.rect(CX + 6, ANATOMY.headTop + bob, 3, 3, PAL.skin);
    // Burbuja de diálogo
    canvas.rect(CX + 10, ANATOMY.hatTop + bob - 2, 9, 7, PAL.white);
    canvas.rectOutline(CX + 10, ANATOMY.hatTop + bob - 2, 9, 7, PAL.outline, 1);
    canvas.rect(CX + 12, ANATOMY.hatTop + bob + 1, 2, 1, PAL.outline);
    canvas.rect(CX + 15, ANATOMY.hatTop + bob + 1, 1, 1, PAL.outline);
    canvas.rect(CX + 13, ANATOMY.hatTop + bob + 8, 2, 3, PAL.white);
  } else if (state === 'review') {
    // Un brazo con el portapapeles, el otro al costado
    canvas.rect(CX - 10, armTop, 4, 6, PAL.supShirt);
    canvas.rect(CX + 6, armTop, 4, 6, PAL.supShirt);
    canvas.rect(CX - 4, armTop + 3, 8, 8, PAL.clipboard);
    canvas.rect(CX - 4, armTop + 3, 8, 1, PAL.clipboardDark);
    canvas.rect(CX - 3, armTop + 5, 6, 4, PAL.paper);
  } else {
    const swing = isIdle ? 0 : phase.armSwing;
    canvas.rect(CX - 9, armTop + swing, 3, 7, PAL.supShirt);
    canvas.rect(CX + 6, armTop - swing, 3, 7, PAL.supShirt);
    canvas.rect(CX - 9, armTop + swing + 7, 3, 2, PAL.skin);
    canvas.rect(CX + 6, armTop - swing + 7, 3, 2, PAL.skin);
  }

  /* ---------- Cabeza, sombrero y bigote ---------- */
  drawHead(canvas, bob, facing, { skin: '#f0c49a', skinShade: '#d0a078' });
  drawSupervisorHat(canvas, bob);

  if (facing !== 'up') {
    canvas.rect(CX - 3, ANATOMY.headTop + bob + 6, 6, 1, PAL.outlineSoft); // bigote
  }

  return canvas;
}

export { W as FRAME_W, H as FRAME_H, ANATOMY };
