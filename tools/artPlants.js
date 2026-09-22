/**
 * artPlants.js — Plantas de arándanos y frutos.
 *
 * REFERENCIA VISUAL (IMAGEN 1 del proyecto): las plantas NO son
 * arbustos sueltos, son una SETO/ARBUSTO DENSO en hilera:
 *
 *   - follaje verde oscuro muy tupido, con textura de hojas
 *   - lleno de arándanos por todos lados
 *   - flores blancas pequeñas entre el follaje
 *   - frutos AZULES muy saturados (maduros) y ROSADOS/VERDOSOS (pintones)
 *   - los frutos recogibles llevan un ARO BLANCO de resalte
 *
 * ARQUITECTURA DE COMPOSICIÓN (§7):
 * El juego no depende de 8 imágenes fijas. Se compone:
 *
 *     PLANTA BASE (follaje)  +  FRUTOS INDIVIDUALES
 *
 * Así la posición y la cantidad de frutos se puede variar por código,
 * que es lo que hace el motor al generar cada planta del mapa.
 *
 * Se generan además las 8 variantes completas (para el catálogo y para
 * poder usarlas directamente si conviene).
 */

import { PixelCanvas } from './pixelCanvas.js';
import { PAL } from './palette.js';

/* ============================================================
   TAMAÑOS
   ============================================================ */
const PLANT_W = 32;
const PLANT_H = 32;
const FRUIT_SIZE = 16;

/* ============================================================
   PLANTA BASE — solo follaje, sin frutos
   ============================================================ */

/**
 * Dibuja el follaje de una planta de arándanos.
 *
 * Es la BASE sobre la que se colocan los frutos. Mucho más tupido y
 * con más textura que un arbusto decorativo: es la "seto" de cultivo
 * de la referencia.
 *
 * @param {object} opts
 * @param {number} opts.density 0-1 densidad del follaje
 * @param {boolean} opts.harvested planta ya recogida (follaje apagado)
 * @param {boolean} opts.tall variante alta (para filas de cultivo)
 * @param {number} opts.seed semilla para variar la textura
 */
export function drawPlantBase({
  density = 0.9,
  harvested = false,
  tall = false,
  seed = 1,
} = {}) {
  const c = new PixelCanvas(PLANT_W, PLANT_H);
  const cx = 16;

  // Paleta del follaje: apagada si ya se cosechó
  const leafDark = harvested ? '#42583a' : PAL.leafDark;
  const leafMid = harvested ? '#55704a' : PAL.leaf;
  const leafLight = harvested ? '#6d8a58' : PAL.leafMid;
  const leafHi = harvested ? '#84a06e' : PAL.leafLight;

  // ---- Sombra en la base ----
  c.ellipse(cx, 29, 12, 3, PAL.shadow, 0.22);

  // ---- Montículo de tierra ----
  c.rect(3, 27, 26, 3, PAL.soilDark);
  c.rect(3, 27, 26, 1, PAL.soil);

  // ---- Estructura principal: varias capas de elipses solapadas ----
  // (da volumen de mata tupida, no un bloque plano)
  const layers = tall
    ? [
        { y: 22, rx: 13, ry: 8, col: leafDark },
        { y: 18, rx: 12, ry: 8, col: leafMid },
        { y: 13, rx: 11, ry: 7, col: leafLight },
        { y: 9, rx: 8, ry: 6, col: leafHi },
      ]
    : [
        { y: 23, rx: 12, ry: 7, col: leafDark },
        { y: 19, rx: 11, ry: 7, col: leafMid },
        { y: 15, rx: 9, ry: 6, col: leafLight },
        { y: 12, rx: 6, ry: 4, col: leafHi },
      ];

  layers.forEach((l) => {
    if (density < 0.5 && l.col === leafHi) return;
    c.ellipse(cx, l.y, l.rx, l.ry, l.col);
  });

  // ---- Textura de hojas: bultos irregulares en el borde ----
  // Determinista a partir de la semilla: cada planta se ve algo distinta.
  const bumps = tall ? 16 : 12;
  for (let i = 0; i < bumps; i += 1) {
    if (i / bumps > density + 0.1) continue;

    const a = (i / bumps) * Math.PI * 2 + seed;
    const rx = (tall ? 12 : 11) - 1;
    const ry = (tall ? 9 : 8) - 1;
    const bx = cx + Math.cos(a) * rx;
    const by = 18 + Math.sin(a) * ry;

    c.circle(bx, by, 3, i % 2 === 0 ? leafMid : leafDark);
    // Brillo en la parte alta de cada bulto
    if (by < 16) c.circle(bx - 1, by - 1, 1, leafLight);
  }

  // ---- Hojas sueltas que sobresalen (silueta irregular) ----
  const spikes = [
    [2, 20], [29, 19], [6, 11], [25, 12], [1, 15], [30, 23], [10, 7], [21, 6],
  ];
  spikes.forEach(([x, y], i) => {
    if (i / spikes.length > density) return;
    c.circle(x, y, 3, i % 2 === 0 ? leafDark : leafMid);
    c.circle(x + 1, y - 1, 1, leafLight);
  });

  // ---- Ramitas visibles en la parte baja ----
  c.line(cx - 2, 26, cx - 7, 20, PAL.branch);
  c.line(cx + 2, 26, cx + 8, 21, PAL.branch);
  c.line(cx, 26, cx + 1, 18, PAL.branch);

  // ---- Brillos de hoja ----
  for (let i = 0; i < 8; i += 1) {
    const hx = 4 + ((i * 5 + seed * 3) % 24);
    const hy = 8 + ((i * 7 + seed * 2) % 16);
    c.rect(hx, hy, 1, 2, leafHi, 0.8);
  }

  // ---- Flores blancas pequeñas entre el follaje ----
  // (la referencia las muestra repartidas por la mata)
  if (!harvested) {
    const flowers = [[7, 14], [23, 16], [15, 8], [26, 22], [5, 22]];
    flowers.forEach(([fx, fy], i) => {
      if (i / flowers.length > density) return;
      c.rect(fx, fy, 2, 2, '#ffffff', 0.9);
      c.setPixel(fx + 1, fy + 1, '#f0e0b0');
    });
  }

  return c;
}

/* ============================================================
   FRUTOS INDIVIDUALES
   ============================================================ */

/**
 * Dibuja un arándano con volumen y brillo.
 * @param {PixelCanvas} c lienzo
 * @param {number} cx centro X
 * @param {number} cy centro Y
 * @param {number} r radio
 * @param {object} colors { base, dark, light, outline }
 */
export function berryAt(c, cx, cy, r, colors) {
  const { base, dark, light, outline } = colors;

  // Contorno oscuro (recorta contra el follaje)
  c.circle(cx, cy, r, outline);
  // Cuerpo
  c.circle(cx, cy, r - 1, base);
  // Volumen inferior
  c.circle(cx + 1, cy + 2, r - 2, dark);
  // Brillo superior-izquierdo
  c.circle(cx - Math.round(r / 2), cy - Math.round(r / 2), Math.max(1, r - 3), light);
  // Chispa puntual
  c.setPixel(cx - r + 2, cy - r + 2, '#ffffff');
  // Corona del arándano (estrella pequeña)
  c.setPixel(cx, cy - r, '#3a2a1a');
  c.setPixel(cx - 1, cy - r, '#3a2a1a');
  c.setPixel(cx + 1, cy - r, '#3a2a1a');
}

/** Colores por tipo de fruto. */
export const BERRY_COLORS = {
  ripe: {
    base: PAL.berry,
    dark: PAL.berryDark,
    light: PAL.berryLight,
    outline: '#1b2a5c',
  },
  unripe: {
    base: PAL.berryPink,
    dark: PAL.berryPinkDark,
    light: PAL.berryPinkLight,
    outline: '#7a4a5a',
  },
  unripeGreen: {
    base: PAL.berryGreen,
    dark: PAL.berryGreenDark,
    light: PAL.berryGreenLight,
    outline: '#5a6a3a',
  },
};

/**
 * Arándano suelto (item), 16x16.
 *
 * Los MADUROS llevan el ARO BLANCO de resalte que se ve en la
 * referencia: marca visualmente que se pueden recoger.
 */
export function drawFruit(type = 'ripe', { highlightRing = false } = {}) {
  const c = new PixelCanvas(FRUIT_SIZE, FRUIT_SIZE);
  const colors = BERRY_COLORS[type] ?? BERRY_COLORS.ripe;

  if (highlightRing) drawHighlightRing(c, 8, 8, 7);

  berryAt(c, 8, 8, 6, colors);

  return c;
}

/**
 * Aro blanco de resalte (el que marca el fruto recogible en la
 * referencia visual).
 *
 * Debe ser FINO (1px) y pegado al fruto: en la referencia es un
 * contorno sutil, no un globo alrededor. Un aro grueso se come el
 * sprite y hace que la planta parezca una burbuja.
 */
export function drawHighlightRing(c, cx, cy, r) {
  const steps = Math.max(24, r * 8);
  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    const x = Math.round(cx + Math.cos(a) * r);
    const y = Math.round(cy + Math.sin(a) * r);
    c.setPixel(x, y, '#ffffff', 0.9);
  }
  return c;
}

/** Grupo de frutos (x2, x3) que cuelgan juntos. */
export function drawFruitGroup(count = 2) {
  const c = new PixelCanvas(FRUIT_SIZE, FRUIT_SIZE);
  const colors = BERRY_COLORS.ripe;

  if (count === 2) {
    berryAt(c, 6, 10, 4, colors);
    berryAt(c, 11, 7, 4, colors);
  } else {
    berryAt(c, 5, 11, 3, colors);
    berryAt(c, 8, 6, 4, colors);
    berryAt(c, 12, 10, 3, colors);
  }

  return c;
}

/** Arándano en la mano del jugador. */
export function drawFruitInHand() {
  const c = new PixelCanvas(FRUIT_SIZE, FRUIT_SIZE);

  // Mano con guante de trabajo
  c.rect(4, 7, 8, 7, PAL.skin);
  c.rect(4, 7, 8, 2, PAL.skinShade);
  c.rect(3, 5, 2, 3, PAL.skin);
  c.rect(6, 4, 2, 3, PAL.skin);
  c.rect(9, 5, 2, 3, PAL.skin);
  c.rect(4, 13, 8, 2, PAL.shirtDark);

  // Arándano sujeto
  berryAt(c, 8, 5, 5, BERRY_COLORS.ripe);

  return c;
}

/** Fruto cayendo con estela de movimiento. */
export function drawFruitFall() {
  const c = new PixelCanvas(FRUIT_SIZE, FRUIT_SIZE);

  // Estela
  c.rect(7, 1, 2, 3, PAL.berryLight, 0.45);
  c.rect(6, 5, 4, 2, PAL.berryLight, 0.65);
  c.rect(7, 3, 2, 2, '#ffffff', 0.3);

  berryAt(c, 8, 11, 5, BERRY_COLORS.ripe);

  return c;
}

/* ============================================================
   COMPOSICIÓN: planta + frutos
   ============================================================ */

/**
 * Posiciones de frutos sobre una planta de 32x32.
 *
 * REFERENCIA (IMAGEN 1): las plantas están MUY cargadas de frutos
 * repartidos por TODA la mata (arriba, medio y abajo), no agrupados
 * en el centro. Estas posiciones cubren el arbusto completo.
 */
export const FRUIT_SLOTS = [
  // Parte alta
  { x: 10, y: 12, side: 'left' },
  { x: 21, y: 11, side: 'right' },
  { x: 15, y: 10, side: 'left' },
  // Parte media (la zona más ancha)
  { x: 7, y: 18, side: 'left' },
  { x: 24, y: 17, side: 'right' },
  { x: 15, y: 17, side: 'left' },
  { x: 19, y: 20, side: 'right' },
  // Parte baja
  { x: 10, y: 23, side: 'left' },
  { x: 22, y: 24, side: 'right' },
  { x: 15, y: 25, side: 'left' },
  // Bordes (asomando por los lados)
  { x: 5, y: 20, side: 'left' },
  { x: 27, y: 20, side: 'right' },
];

/**
 * Compone una planta COMPLETA: follaje base + frutos encima.
 *
 * Esta es la función que permite la arquitectura
 * "PLANTA BASE + FRUTOS INDIVIDUALES" del punto 7 de la especificación.
 *
 * IMPORTANTE sobre el aro de resalte (REFERENCIA IMAGEN 1):
 * En la referencia solo UN fruto lleva el aro blanco: el que el
 * jugador tiene como objetivo. Si se pone el aro a todos los frutos,
 * los anillos se solapan y la mata se ve como una burbuja ilegible.
 * Por eso `ring: true` debe marcarse en UN solo fruto.
 *
 * @param {object} opts
 * @param {number} opts.density densidad del follaje
 * @param {Array<{type: string, slot?: number, x?: number, y?: number, ring?: boolean}>} opts.fruits
 * @param {boolean} opts.harvested
 * @param {number} opts.seed
 * @returns {PixelCanvas} planta de 32x32
 */
export function composePlant({
  density = 0.9,
  fruits = [],
  harvested = false,
  tall = false,
  seed = 1,
} = {}) {
  const base = drawPlantBase({ density, harvested, tall, seed });

  // ---- Capa 1: frutos ----
  const placed = fruits.map((fruit, i) => {
    const slot = FRUIT_SLOTS[(fruit.slot ?? i) % FRUIT_SLOTS.length];
    const x = fruit.x ?? slot.x;
    const y = fruit.y ?? slot.y;
    const colors = BERRY_COLORS[fruit.type] ?? BERRY_COLORS.ripe;

    berryAt(base, x, y, 3, colors);

    return { x, y, ring: Boolean(fruit.ring) };
  });

  // ---- Capa 2: aro blanco SOLO en el fruto objetivo ----
  // Se dibuja después de TODOS los frutos para que ningún otro lo tape.
  placed.filter((p) => p.ring).forEach((p) => {
    drawHighlightRing(base, p.x, p.y, 5);
  });

  // ---- Capa 3: hojas sueltas para integrar los frutos en la mata ----
  if (!harvested && placed.length > 0) {
    const leafDark = '#2b5a28';

    placed.forEach((p, i) => {
      if (i % 2 !== 0) return; // solo la mitad, para no tapar frutos
      const side = i % 4 === 0 ? -1 : 1;
      base.circle(p.x + side * 5, p.y + 3, 2, leafDark);
    });
  }

  return base;
}

/**
 * Genera las 8 variantes oficiales del catálogo.
 *
 * REFERENCIA (IMAGEN 1): las matas están CARGADAS. Incluso la variante
 * "pocas" lleva varios frutos, y las maduras van cuajadas. Se usan
 * muchos slots por planta para lograr esa densidad.
 *
 * @returns {Record<string, PixelCanvas>}
 */
export function buildPlantVariants() {
  // Helper: frutos SIN aro (el caso normal en la mata)
  const plain = (count, type, startSlot = 0) =>
    Array.from({ length: count }, (_, i) => ({
      type,
      slot: (startSlot + i) % FRUIT_SLOTS.length,
      ring: false,
    }));

  return {
    // Vacía: solo follaje claro, sin frutos
    plant_empty: composePlant({ density: 0.6, fruits: [], seed: 1 }),

    // Pocas: 3 maduros (uno con aro, el "objetivo")
    plant_few: composePlant({
      density: 0.75,
      fruits: [
        { type: 'ripe', slot: 0, ring: true },
        { type: 'ripe', slot: 1 },
        { type: 'ripe', slot: 2 },
      ],
      seed: 2,
    }),

    // Media: 6 frutos (4 maduros, 2 pintones)
    plant_medium: composePlant({
      density: 0.9,
      fruits: [
        { type: 'ripe', slot: 0, ring: true },
        ...plain(3, 'ripe', 1),
        ...plain(2, 'unripe', 4),
      ],
      seed: 3,
    }),

    // Abundante: 9 frutos (7 maduros, 2 pintones)
    plant_abundant: composePlant({
      density: 1,
      fruits: [
        { type: 'ripe', slot: 0, ring: true },
        ...plain(6, 'ripe', 1),
        ...plain(2, 'unripeGreen', 7),
      ],
      seed: 4,
    }),

    // Madura: 8 maduros
    plant_ripe: composePlant({
      density: 1,
      fruits: [
        { type: 'ripe', slot: 0, ring: true },
        ...plain(7, 'ripe', 1),
      ],
      seed: 5,
    }),

    // Pintona: 8 pintones (rosados y verdosos). SIN aro: no se recogen.
    plant_unripe: composePlant({
      density: 1,
      fruits: [
        ...plain(5, 'unripe', 0),
        ...plain(3, 'unripeGreen', 5),
      ],
      seed: 6,
    }),

    // Mixta: maduros y pintones mezclados — el caso más común
    plant_mixed: composePlant({
      density: 1,
      fruits: [
        { type: 'ripe', slot: 0, ring: true },
        { type: 'unripe', slot: 1 },
        { type: 'ripe', slot: 2 },
        { type: 'unripeGreen', slot: 3 },
        { type: 'ripe', slot: 4 },
        { type: 'unripe', slot: 5 },
        { type: 'ripe', slot: 6 },
        { type: 'unripeGreen', slot: 7 },
        { type: 'ripe', slot: 8 },
      ],
      seed: 7,
    }),

    // Cosechada: follaje apagado, sin frutos
    plant_harvested: composePlant({
      density: 0.55,
      fruits: [],
      harvested: true,
      seed: 8,
    }),
  };
}

/**
 * Hilera de cultivo completa (32x64): dos plantas apiladas.
 * Se usa para las filas altas y tupidas de la referencia.
 */
export function drawPlantRow(seed = 1) {
  const c = new PixelCanvas(32, 64);

  const top = composePlant({ density: 0.95, tall: true, seed, fruits: [] });
  const bottom = composePlant({ density: 0.95, tall: true, seed: seed + 1, fruits: [] });

  c.drawCanvas(top, 0, 0);
  c.drawCanvas(bottom, 0, 32);

  return c;
}

export { PLANT_W, PLANT_H, FRUIT_SIZE };
