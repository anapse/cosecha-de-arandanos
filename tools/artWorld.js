/**
 * artWorld.js — Arte de plantas, frutos, terreno, canastas, camión,
 * UI, efectos y entorno.
 *
 * Todo el arte sigue las referencias visuales: pixel art, colores
 * vivos, contornos marcados, paleta de campo de arándanos.
 * Los tiles de 32x32 encajan entre sí para poder combinarlos.
 */

import { PixelCanvas } from './pixelCanvas.js';
import { PAL } from './palette.js';

/* ============================================================
   03. PLANTAS — arbusto de arándanos (32x32)
   ============================================================ */

/**
 * Dibuja un arbusto de arándanos.
 * @param {object} opts
 * @param {number} opts.density 0-1 densidad del follaje
 * @param {string} opts.leafColor color base de la hoja
 * @param {Array<'ripe'|'unripe'|'unripeGreen'>} opts.berries frutos visibles
 * @param {boolean} opts.harvested arbusto ya recogido
 */
export function drawPlant({
  density = 0.8,
  leafColor = PAL.leaf,
  berries = [],
  harvested = false,
  seed = 1,
} = {}) {
  const c = new PixelCanvas(32, 32);
  const cx = 16;

  // Sombra
  c.ellipse(cx, 28, 11, 3, PAL.shadow, 0.22);

  // Montículo de tierra
  c.rect(cx - 12, 25, 24, 4, PAL.soilDark);
  c.rect(cx - 12, 25, 24, 1, PAL.soil);

  if (harvested) {
    // Arbusto ya recogido: follaje apagado y sin frutos.
    c.circle(cx, 17, 10, '#5d7a4a');
    c.circle(cx - 3, 14, 7, '#6d8a58');
    c.circle(cx + 3, 16, 6, '#4e6a3e');
    c.rect(cx - 8, 20, 16, 3, PAL.leafDark);
    return c;
  }

  const dark = leafColor === PAL.leaf ? PAL.leafDark : '#2b5a28';
  const mid = leafColor === PAL.leaf ? PAL.leafMid : leafColor;
  const light = PAL.leafLight;
  const hi = PAL.leafHighlight;

  // Follaje en capas: oscuro → medio → claro → brillo
  const r = Math.round(8 + density * 3);
  c.circle(cx, 18, r, dark);
  c.circle(cx - 1, 16, r - 2, mid);
  c.circle(cx - 3, 13, r - 5, light);
  c.circle(cx - 4, 11, 3, hi);

  // Hojas irregulares alrededor del borde (evita que parezca un bloque)
  const leafSpots = [
    [-9, 20], [8, 19], [-7, 12], [7, 13], [-10, 16], [9, 23],
  ];
  leafSpots.forEach(([dx, dy], i) => {
    if (i / leafSpots.length > density) return;
    c.circle(cx + dx, dy, 3, i % 2 === 0 ? mid : dark);
  });

  // Ramitas
  c.line(cx, 24, cx - 5, 19, PAL.branch);
  c.line(cx, 24, cx + 5, 20, PAL.branch);

  // Frutos visibles
  const positions = [
    [cx - 5, 15], [cx + 4, 13], [cx - 2, 11], [cx + 6, 18],
    [cx - 6, 19], [cx + 2, 16],
  ];

  berries.forEach((type, i) => {
    const [bx, by] = positions[i % positions.length];
    drawBerryAt(c, bx, by, type, 4);
  });

  return c;
}

/** Dibuja un arándano individual dentro de un lienzo. */
export function drawBerryAt(c, cx, cy, type = 'ripe', radius = 4) {
  const colors = {
    ripe: [PAL.berry, PAL.berryDark, PAL.berryLight],
    unripe: [PAL.berryPink, PAL.berryPinkDark, PAL.berryPinkLight],
    unripeGreen: [PAL.berryGreen, PAL.berryGreenDark, PAL.berryGreenLight],
  }[type] ?? [PAL.berry, PAL.berryDark, PAL.berryLight];

  const [base, dark, light] = colors;

  c.circle(cx, cy, radius, PAL.outline);        // contorno
  c.circle(cx, cy, radius - 1, base);           // cuerpo
  c.circle(cx + 1, cy + 2, radius - 3, dark);   // volumen inferior
  c.circle(cx - 1, cy - 1, 2, light);           // brillo

  // Corona del arándano
  c.rect(cx - 1, cy - radius, 3, 1, '#4a3b2a');
}

/* ============================================================
   04. FRUTOS — items sueltos (16x16)
   ============================================================ */
export function drawFruit(type = 'ripe') {
  const c = new PixelCanvas(16, 16);
  drawBerryAt(c, 8, 9, type, 5);
  return c;
}

/** Grupo de frutos (x2, x3). */
export function drawFruitGroup(count = 2) {
  const c = new PixelCanvas(16, 16);

  if (count === 2) {
    drawBerryAt(c, 6, 10, 'ripe', 4);
    drawBerryAt(c, 11, 7, 'ripe', 4);
  } else {
    drawBerryAt(c, 5, 11, 'ripe', 3);
    drawBerryAt(c, 8, 7, 'ripe', 4);
    drawBerryAt(c, 12, 10, 'ripe', 3);
  }

  return c;
}

/** Arándano en la mano del jugador. */
export function drawFruitInHand() {
  const c = new PixelCanvas(16, 16);
  // Mano
  c.rect(4, 6, 8, 7, PAL.skin);
  c.rect(4, 6, 8, 2, PAL.skinShade);
  c.rect(3, 4, 2, 3, PAL.skin);   // dedos
  c.rect(6, 3, 2, 3, PAL.skin);
  c.rect(9, 4, 2, 3, PAL.skin);
  // Arándano sujeto
  drawBerryAt(c, 8, 5, 'ripe', 4);
  return c;
}

/** Fruto cayendo con estela. */
export function drawFruitFall() {
  const c = new PixelCanvas(16, 16);
  // Estela de movimiento
  c.rect(7, 1, 2, 3, PAL.berryLight, 0.5);
  c.rect(6, 5, 3, 2, PAL.berryLight, 0.7);
  drawBerryAt(c, 8, 11, 'ripe', 4);
  return c;
}

/* ============================================================
   05. TERRENO — tiles de 32x32 que encajan entre sí
   ------------------------------------------------------------
   REFERENCIA (IMAGEN 1): el campo se ve como
     [SURCO DE PLANTAS] [CAMINO DE TIERRA] [SURCO DE PLANTAS] ...
   El camino es una franja de tierra apisonada con huellas y
   piedrecitas; el suelo de cultivo es tierra arada más oscura.
   ============================================================ */
export function drawTerrain(type) {
  const c = new PixelCanvas(32, 32);
  const S = 32;

  switch (type) {
    case 'ground_soil':
      // Tierra arada: base del campo de cultivo
      c.rect(0, 0, S, S, PAL.soil);
      // Terrones y piedrecitas, deterministas
      for (let i = 0; i < 18; i += 1) {
        const x = (i * 7 + 3) % S;
        const y = (i * 11 + 5) % S;
        const shade = i % 3 === 0 ? PAL.soilSpeck : PAL.soilDark;
        c.rect(x, y, 2, 2, shade);
      }
      // Alguna piedra más grande
      c.rect(20, 9, 3, 2, '#c8a878');
      c.rect(6, 24, 2, 2, '$b09060'.replace('$', '#'));
      break;

    case 'path_vertical':
      // Camino vertical: tierra apisonada, más clara y lisa
      c.rect(0, 0, S, S, PAL.path);
      // Bordes iluminados (por donde se camina)
      c.rect(0, 0, 2, S, PAL.pathLight);
      c.rect(S - 2, 0, 2, S, PAL.pathDark);
      // Huellas y piedrecitas a lo largo
      for (let i = 0; i < 10; i += 1) {
        c.rect((i * 9 + 4) % S, (i * 7 + 6) % S, 2, 2, PAL.pathDark);
      }
      c.rect(14, 4, 3, 2, '#e8d0a8', 0.7);
      c.rect(8, 26, 2, 2, '#e8d0a8', 0.7);
      break;

    case 'path_horizontal':
      c.rect(0, 0, S, S, PAL.path);
      c.rect(0, 0, S, 2, PAL.pathLight);
      c.rect(0, S - 2, S, 2, PAL.pathDark);
      for (let i = 0; i < 10; i += 1) {
        c.rect((i * 6 + 5) % S, (i * 9 + 8) % S, 2, 2, PAL.pathDark);
      }
      c.rect(4, 14, 3, 2, '#e8d0a8', 0.7);
      c.rect(24, 8, 2, 2, '#e8d0a8', 0.7);
      break;

    case 'path_corner':
      // Esquina: camino que gira
      c.rect(0, 0, S, S, PAL.soil);
      // Franja vertical (mitad izquierda)
      c.rect(0, 0, 16, S, PAL.path);
      // Franja horizontal (mitad inferior)
      c.rect(0, 16, S, 16, PAL.path);
      // Luz de las juntas
      c.rect(0, 0, 2, S, PAL.pathLight);
      c.rect(0, 16, S, 2, PAL.pathLight);
      // Sombra interior de la esquina
      c.rect(16, 16, 2, 16, PAL.pathDark);
      c.rect(16, 16, 16, 2, PAL.pathDark);
      for (let i = 0; i < 6; i += 1) {
        c.rect((i * 8 + 2) % S, (i * 6 + 3) % S, 2, 2, PAL.pathDark);
      }
      break;

    case 'path_intersection':
      // Cruce: caminos en cruz
      c.rect(0, 0, S, S, PAL.path);
      c.rect(0, 0, S, 2, PAL.pathLight);
      c.rect(0, 0, 2, S, PAL.pathLight);
      c.rect(0, S - 2, S, 2, PAL.pathDark);
      c.rect(S - 2, 0, 2, S, PAL.pathDark);
      for (let i = 0; i < 6; i += 1) {
        c.rect((i * 7 + 6) % S, (i * 5 + 7) % S, 2, 2, PAL.pathDark);
      }
      break;

    case 'grass':
      c.rect(0, 0, S, S, PAL.grass);
      for (let i = 0; i < 22; i += 1) {
        const x = (i * 5 + 2) % S;
        const y = (i * 7 + 3) % S;
        c.rect(x, y, 1, 2, i % 2 === 0 ? PAL.grassLight : PAL.grassDark);
      }
      // Matas altas
      for (let i = 0; i < 7; i += 1) {
        const x = (i * 9 + 4) % S;
        const y = (i * 11 + 5) % S;
        c.vLine(x, y, 3, PAL.grassHi);
      }
      break;

    case 'grass_edge':
      // Transición césped → tierra: borde ondulado
      c.rect(0, 0, S, S, PAL.grass);
      for (let x = 0; x < S; x += 1) {
        const wave = Math.round(Math.sin(x / 3.2) * 1.5);
        const h = 20 + wave;
        c.rect(x, h, 1, S - h, PAL.soil);
        // Briznas en el borde
        if (x % 4 === 0) c.rect(x, h - 2, 1, 2, PAL.grassHi);
      }
      for (let i = 0; i < 8; i += 1) {
        c.rect((i * 7 + 2) % S, (i * 5 + 3) % S, 1, 2, PAL.grassLight);
      }
      break;

    case 'fence_horizontal':
      // Cerca de madera horizontal (como la del borde inferior)
      c.rect(0, 0, S, S, PAL.grass);
      // Dos travesaños
      c.rect(0, 11, S, 4, PAL.wood);
      c.rect(0, 11, S, 1, PAL.woodLight);
      c.rect(0, 14, S, 1, PAL.woodDark);
      c.rect(0, 21, S, 4, PAL.wood);
      c.rect(0, 21, S, 1, PAL.woodLight);
      c.rect(0, 24, S, 1, PAL.woodDark);
      // Postes con sombra
      c.rect(5, 7, 5, 22, PAL.woodDark);
      c.rect(5, 7, 5, 2, PAL.wood);
      c.rect(5, 7, 1, 22, PAL.woodLight);
      c.rect(22, 7, 5, 22, PAL.woodDark);
      c.rect(22, 7, 5, 2, PAL.wood);
      c.rect(22, 7, 1, 22, PAL.woodLight);
      break;

    case 'fence_vertical':
      c.rect(0, 0, S, S, PAL.grass);
      c.rect(6, 0, 5, S, PAL.wood);
      c.rect(6, 0, 1, S, PAL.woodLight);
      c.rect(9, 0, 2, S, PAL.woodDark);
      c.rect(21, 0, 5, S, PAL.wood);
      c.rect(21, 0, 1, S, PAL.woodLight);
      c.rect(24, 0, 2, S, PAL.woodDark);
      // Travesaños
      c.rect(11, 11, 10, 3, PAL.woodDark);
      c.rect(11, 21, 10, 3, PAL.woodDark);
      break;

    case 'fence_corner':
      c.rect(0, 0, S, S, PAL.grass);
      // Esquina en L
      c.rect(4, 7, 24, 5, PAL.wood);
      c.rect(4, 7, 24, 1, PAL.woodLight);
      c.rect(4, 7, 5, 24, PAL.wood);
      c.rect(4, 7, 1, 24, PAL.woodLight);
      c.rect(4, 11, 24, 1, PAL.woodDark);
      c.rect(8, 7, 1, 24, PAL.woodDark);
      break;

    case 'delivery_zone':
      // Zona de entrega: tierra clara apisonada
      c.rect(0, 0, S, S, '#c9b08a');
      for (let i = 0; i < 20; i += 1) {
        const x = (i * 6 + 2) % S;
        const y = (i * 9 + 4) % S;
        c.rect(x, y, 2, 2, i % 3 === 0 ? '#ded0ae' : '#a89070');
      }
      c.rect(0, 0, S, 1, '#e8dcc0');
      break;

    case 'delivery_marker':
      // Marcador amarillo de esquina (indica la zona de entrega)
      c.rect(4, 4, 12, 3, PAL.warn);
      c.rect(4, 4, 3, 12, PAL.warn);
      c.rect(4, 4, 3, 3, '#fff0b0');
      c.rect(4, 13, 3, 3, PAL.warn);
      c.rect(13, 4, 3, 3, PAL.warn);
      break;

    case 'ground_detail':
      // Manchas de tierra / hierba seca
      c.rect(0, 0, S, S, PAL.soil);
      c.circle(10, 12, 3, PAL.soilDark, 0.8);
      c.circle(20, 20, 4, PAL.soilDark, 0.7);
      c.circle(24, 8, 2, PAL.soilSpeck, 0.9);
      c.circle(8, 24, 2, PAL.soilSpeck, 0.9);
      c.rect(15, 15, 2, 2, '#c8a878');
      break;

    case 'rock':
      c.ellipse(16, 22, 10, 7, PAL.mountainDark);
      c.ellipse(15, 19, 8, 6, PAL.mountain);
      c.ellipse(13, 17, 4, 3, '#c8b098');
      c.ellipse(16, 26, 10, 3, PAL.shadow, 0.2);
      // Grietas
      c.line(14, 14, 17, 24, PAL.mountainDark);
      break;

    case 'flower':
      // Flores silvestres sobre césped
      c.rect(0, 0, S, S, PAL.grass);
      const flowerColors = ['#ff6b9d', '#ffffff', '#ffd93d'];
      for (let i = 0; i < 6; i += 1) {
        const x = 5 + (i * 6) % 22;
        const y = 6 + (i * 9) % 20;
        const col = flowerColors[i % flowerColors.length];
        c.rect(x, y, 3, 3, col);
        c.setPixel(x + 1, y + 1, '#c88a2a');
      }
      break;

    default:
      c.rect(0, 0, S, S, PAL.soil);
  }

  return c;
}

/* ============================================================
   06. CANASTA / CAJAS / CAMIÓN
   ============================================================ */

/**
 * Canasta de mimbre con arándanos dentro.
 * @param {number} fill 0-1 nivel de llenado
 */
export function drawBasket(fill = 0) {
  const c = new PixelCanvas(32, 32);
  const cx = 16;

  c.ellipse(cx, 27, 11, 4, PAL.shadow, 0.25);

  // Arándanos asomando por arriba (según el llenado)
  const berryCount = Math.round(fill * 7);
  if (berryCount > 0) {
    const spots = [
      [11, 12], [16, 10], [21, 12], [13, 15], [19, 15], [16, 13], [14, 11],
    ];
    for (let i = 0; i < berryCount; i += 1) {
      const [bx, by] = spots[i % spots.length];
      c.circle(bx, by, 3, PAL.berry);
      c.circle(bx - 1, by - 1, 1, PAL.berryLight);
    }
  }

  // Cuerpo de la canasta
  c.rect(7, 14, 18, 13, PAL.basket);
  c.rect(7, 14, 18, 2, PAL.basketLight);
  c.rect(7, 25, 18, 2, PAL.basketDark);

  // Trama de mimbre
  for (let y = 17; y < 26; y += 4) {
    c.rect(7, y, 18, 1, PAL.basketDark);
  }
  for (let x = 9; x < 25; x += 4) {
    c.rect(x, 16, 1, 10, PAL.basketDark);
  }

  // Borde superior (aro)
  c.rect(6, 12, 20, 3, PAL.basketDark);
  c.rect(6, 12, 20, 1, PAL.basketLight);

  // Asas
  c.rect(7, 8, 2, 5, PAL.basketDark);
  c.rect(23, 8, 2, 5, PAL.basketDark);
  c.rect(9, 8, 14, 1, PAL.basketDark);

  return c;
}

/** Caja de madera vacía. */
export function drawBox(filled = false, stacked = false) {
  const c = new PixelCanvas(32, 32);

  const drawOne = (oy = 0) => {
    c.ellipse(16, 28 + oy, 11, 3, PAL.shadow, 0.2);
    c.rect(6, 10 + oy, 20, 16, PAL.crate);
    c.rect(6, 10 + oy, 20, 3, PAL.crateLight);
    c.rect(6, 23 + oy, 20, 3, PAL.crateDark);

    // Listones verticales
    c.rect(9, 13 + oy, 2, 10, PAL.crateDark);
    c.rect(15, 13 + oy, 2, 10, PAL.crateDark);
    c.rect(21, 13 + oy, 2, 10, PAL.crateDark);
    // Travesaño horizontal
    c.rect(6, 17 + oy, 20, 1, PAL.crateDark);

    if (filled) {
      // Arándanos asomando
      for (let i = 0; i < 5; i += 1) {
        const bx = 9 + i * 4;
        c.circle(bx, 9 + oy, 3, PAL.berry);
        c.circle(bx - 1, 8 + oy, 1, PAL.berryLight);
      }
    }
  };

  if (stacked) {
    drawOne(-6);
    drawOne(6);
  } else {
    drawOne(0);
  }

  return c;
}

/** Caja encima del camión (para la animación de carga). */
export function drawBoxOnTruck() {
  return drawBox(true);
}

/** Camión lateral (64x40). */
export function drawTruck(loaded = false) {
  const c = new PixelCanvas(64, 40);

  c.ellipse(30, 36, 26, 3, PAL.shadow, 0.25);

  // Caja de carga
  c.rect(2, 8, 34, 22, PAL.crate);
  c.rect(2, 8, 34, 3, PAL.crateLight);
  c.rect(2, 27, 34, 3, PAL.crateDark);

  // Listones de la caja
  for (let x = 6; x < 34; x += 7) {
    c.rect(x, 11, 2, 16, PAL.crateDark);
  }

  // Carga visible si va cargado
  if (loaded) {
    c.rect(6, 6, 12, 4, PAL.crateLight);
    c.rect(20, 5, 12, 5, PAL.crateLight);
    c.rect(6, 6, 12, 1, PAL.crate);
    c.rect(20, 5, 12, 1, PAL.crate);
  }

  // Cabina
  c.rect(36, 12, 20, 18, PAL.metal);
  c.rect(36, 12, 20, 2, '#e0e6ee');
  c.rect(38, 15, 11, 7, PAL.glass);          // parabrisas
  c.rect(38, 15, 11, 1, '#a8d8ff');
  c.rect(50, 16, 4, 6, PAL.glass);           // ventana lateral
  c.rect(36, 28, 20, 2, PAL.metalDark);

  // Parachoques y faro
  c.rect(54, 24, 4, 6, PAL.metalDark);
  c.rect(55, 22, 3, 2, PAL.warn);

  // Chasis
  c.rect(2, 30, 54, 4, PAL.metalDark);
  c.rect(2, 30, 54, 1, '#5a6470');

  // Ruedas
  const wheels = [12, 46, 56];
  wheels.forEach((wx) => {
    c.circle(wx, 34, 6, PAL.tire);
    c.circle(wx, 34, 3, PAL.tireHub);
    c.circle(wx, 34, 1, PAL.metalDark);
  });

  return c;
}

/* ============================================================
   07. UI — iconos (16x16 y barras)
   ============================================================ */

/** Corazón en tres estados (lleno, medio, vacío). */
export function drawHeart(state = 'full') {
  const c = new PixelCanvas(16, 16);

  const heartMask = [
    '..XX..XX..',
    '.XXXX.XXXX',
    'XXXXXXXXXX',
    'XXXXXXXXXX',
    '.XXXXXXXX.',
    '..XXXXXX..',
    '...XXXX...',
    '....XX....',
  ];

  const colors = {
    full: { fill: PAL.heartRed, light: PAL.heartLight, dark: PAL.heartDark },
    medium: { fill: PAL.heartRed, light: PAL.heartLight, dark: PAL.heartDark },
    empty: { fill: '#4a4a4a', light: '#6a6a6a', dark: '#2a2a2a' },
  }[state] ?? { fill: PAL.heartRed, light: PAL.heartLight, dark: PAL.heartDark };

  const offsetY = 3;

  for (let y = 0; y < heartMask.length; y += 1) {
    for (let x = 0; x < heartMask[y].length; x += 1) {
      if (heartMask[y][x] !== 'X') continue;

      const px = x + 3;
      const py = y + offsetY;

      // Estado "medio": mitad izquierda rellena, derecha vacía.
      if (state === 'medium' && x >= 5) {
        c.setPixel(px, py, '#3a3a3a');
      } else {
        c.setPixel(px, py, colors.fill);
      }
    }
  }

  // Brillo
  if (state !== 'empty') {
    c.rect(5, offsetY + 1, 2, 2, colors.light);
    c.rect(4, offsetY + 2, 1, 1, colors.light);
  }

  return c;
}

/** Icono de arándano para el HUD. */
export function drawIconBlueberry() {
  const c = new PixelCanvas(16, 16);
  c.circle(8, 9, 6, PAL.outline);
  c.circle(8, 9, 5, PAL.berry);
  c.circle(9, 11, 3, PAL.berryDark);
  c.circle(6, 7, 2, PAL.berryLight);
  c.rect(7, 3, 3, 1, '#4a3b2a');
  return c;
}

/** Reloj para el temporizador. */
export function drawIconTime() {
  const c = new PixelCanvas(16, 16);
  c.circle(8, 8, 7, PAL.outline);
  c.circle(8, 8, 6, PAL.white);
  c.circle(8, 8, 5, '#e8eef4');
  // Manecillas
  c.rect(7, 4, 2, 5, PAL.outline);   // horario
  c.rect(8, 7, 4, 2, PAL.outline);   // minutero
  c.setPixel(8, 8, PAL.danger);
  // Corona
  c.rect(7, 0, 2, 2, PAL.metalDark);
  return c;
}

/** Barra de calidad (fondo de 32x8). */
export function drawQualityBar() {
  const c = new PixelCanvas(32, 8);
  c.rect(0, 0, 32, 8, PAL.outline);
  c.rect(1, 1, 30, 6, '#2a2a2a');
  return c;
}

/** Barra de progreso (fondo de 32x8). */
export function drawProgressBar() {
  const c = new PixelCanvas(32, 8);
  c.rect(0, 0, 32, 8, PAL.outline);
  c.rect(1, 1, 30, 6, '#1a2c4e');
  return c;
}

/** Botón de pausa. */
export function drawButtonPause() {
  const c = new PixelCanvas(16, 16);
  c.rect(0, 0, 16, 16, PAL.outline);
  c.rect(1, 1, 14, 14, PAL.white);
  c.rect(5, 4, 2, 8, PAL.outline);
  c.rect(9, 4, 2, 8, PAL.outline);
  return c;
}

/** Botones del menú (play, continuar, reiniciar). */
export function drawButton(kind = 'play') {
  const c = new PixelCanvas(16, 16);

  if (kind === 'play') {
    c.rect(0, 0, 16, 16, '#2a7a35');
    c.rect(1, 1, 14, 14, PAL.ok);
    // Triángulo
    c.polygon([[6, 4], [6, 12], [12, 8]], PAL.white);
  } else if (kind === 'continue') {
    c.rect(0, 0, 16, 16, '#1a4a8a');
    c.rect(1, 1, 14, 14, PAL.accent);
    c.polygon([[5, 4], [5, 12], [11, 8]], PAL.white);
    c.rect(11, 4, 2, 8, PAL.white);
  } else {
    // Reiniciar: flecha circular
    c.rect(0, 0, 16, 16, '#8a6a1a');
    c.rect(1, 1, 14, 14, PAL.warn);
    c.circle(8, 8, 5, PAL.white);
    c.circle(8, 8, 3, PAL.warn);
    c.polygon([[8, 1], [12, 4], [8, 5]], PAL.white);
  }

  return c;
}

/** Marco de panel (32x32, se estira en la UI). */
export function drawPanelFrame() {
  const c = new PixelCanvas(32, 32);
  c.rect(0, 0, 32, 32, '#5c3a17');
  c.rect(1, 1, 30, 30, '#8b5a2b');
  c.rect(2, 2, 28, 28, '#a9713d');
  // Vetas de madera
  c.rect(2, 8, 28, 1, '#8b5a2b');
  c.rect(2, 18, 28, 1, '#8b5a2b');
  c.rect(2, 26, 28, 1, '#8b5a2b');
  // Esquinas
  c.rect(1, 1, 3, 3, '#c98f4e');
  c.rect(28, 1, 3, 3, '#c98f4e');
  c.rect(1, 28, 3, 3, '#c98f4e');
  c.rect(28, 28, 3, 3, '#c98f4e');
  return c;
}

/* ============================================================
   08. EFECTOS (16x16)
   ============================================================ */

/** Chispa de recogida (4 frames de expansión). */
export function drawHarvestParticle(frame = 0) {
  const c = new PixelCanvas(16, 16);
  const cx = 8;
  const cy = 8;
  const size = 2 + frame * 2;

  // Cruz de chispa
  c.rect(cx - 1, cy - size, 2, size * 2, PAL.spark, 0.9 - frame * 0.15);
  c.rect(cx - size, cy - 1, size * 2, 2, PAL.spark, 0.9 - frame * 0.15);
  // Diagonal
  c.rect(cx - size / 2, cy - size / 2, 2, 2, PAL.sparkGold, 0.8 - frame * 0.15);
  c.rect(cx + size / 2 - 1, cy + size / 2 - 1, 2, 2, PAL.sparkGold, 0.8 - frame * 0.15);
  // Núcleo
  c.circle(cx, cy, Math.max(1, 3 - frame), PAL.white, 1 - frame * 0.2);

  return c;
}

/** Estrella de error (4 frames). */
export function drawErrorParticle(frame = 0) {
  const c = new PixelCanvas(16, 16);
  const cx = 8;
  const cy = 8;
  const size = 3 + frame * 2;

  const pts = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const r = i % 2 === 0 ? size : size / 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  c.polygon(pts, PAL.errorRed, 0.9 - frame * 0.2);
  c.circle(cx, cy, Math.max(1, 3 - frame), '#ffd0c8', 1 - frame * 0.2);

  return c;
}

/** Destello de revisión (signo de exclamación amarillo). */
export function drawInspectFlash() {
  const c = new PixelCanvas(16, 16);
  c.rect(6, 1, 4, 8, PAL.warn);
  c.rect(6, 1, 2, 8, '#ffe9a0');
  c.rect(6, 11, 4, 4, PAL.warn);
  c.rect(6, 11, 2, 4, '#ffe9a0');
  return c;
}

/** Hoja cayendo. */
export function drawLeaf() {
  const c = new PixelCanvas(16, 16);
  c.polygon([[8, 2], [13, 8], [8, 14], [3, 8]], PAL.leaf);
  c.polygon([[8, 3], [11, 8], [8, 12], [5, 8]], PAL.leafLight);
  c.line(8, 2, 8, 14, PAL.leafDark);
  return c;
}

/** Texto "+10". */
export function drawTextPlus10() {
  const c = new PixelCanvas(32, 16);
  // "+10" dibujado en píxeles (3x5 por carácter)
  const glyphs = {
    '+': ['.X.', 'XXX', '.X.'],
    '1': ['X.', 'XX', 'X.', 'X.', 'X.'],
    '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
  };

  const drawGlyph = (ch, ox) => {
    const g = glyphs[ch];
    if (!g) return;
    for (let y = 0; y < g.length; y += 1) {
      for (let x = 0; x < g[y].length; x += 1) {
        if (g[y][x] === 'X') {
          c.setPixel(ox + x, 5 + y, PAL.white);
          c.setPixel(ox + x + 1, 6 + y, PAL.ok); // sombra dura
        }
      }
    }
  };

  drawGlyph('+', 4);
  drawGlyph('1', 12);
  drawGlyph('0', 16);

  return c;
}

/** Texto de error "!". */
export function drawTextError() {
  const c = new PixelCanvas(32, 16);
  // "ERROR" abreviado con "!"
  c.rect(6, 3, 4, 7, PAL.danger);
  c.rect(6, 12, 4, 3, PAL.danger);
  // Sombra
  c.rect(7, 4, 4, 7, PAL.errorRed, 0.5);

  const word = ['X', 'XXX', 'XX'];
  // Letra "E" simple
  c.rect(13, 4, 6, 2, PAL.danger);
  c.rect(13, 7, 5, 2, PAL.danger);
  c.rect(13, 10, 6, 2, PAL.danger);
  c.rect(13, 4, 2, 8, PAL.danger);

  return c;
}

/** Sombra del jugador (elipse suave). */
export function drawShadowPlayer() {
  const c = new PixelCanvas(32, 32);
  c.ellipse(16, 22, 9, 4, PAL.shadow, 0.28);
  return c;
}

/** Sombra del supervisor. */
export function drawShadowSupervisor() {
  const c = new PixelCanvas(32, 32);
  c.ellipse(16, 22, 9, 4, PAL.shadow, 0.28);
  return c;
}

/** Indicador de selección (marco amarillo con esquinas). */
export function drawSelection() {
  const c = new PixelCanvas(32, 32);
  const corner = 7;
  const t = 2;

  // Esquinas del marco
  c.rect(0, 0, corner, t, PAL.warn);
  c.rect(0, 0, t, corner, PAL.warn);
  c.rect(32 - corner, 0, corner, t, PAL.warn);
  c.rect(32 - t, 0, t, corner, PAL.warn);
  c.rect(0, 32 - t, corner, t, PAL.warn);
  c.rect(0, 32 - corner, t, corner, PAL.warn);
  c.rect(32 - corner, 32 - t, corner, t, PAL.warn);
  c.rect(32 - t, 32 - corner, t, corner, PAL.warn);

  return c;
}

/* ============================================================
   09. ENTORNO
   ============================================================ */

/** Cielo con degradado y nubes (128x64). */
export function drawSky() {
  const c = new PixelCanvas(128, 64);

  // Degradado de azul profundo a claro
  for (let y = 0; y < 64; y += 1) {
    const t = y / 63;
    const r = Math.round(74 + t * (126 - 74));
    const g = Math.round(158 + t * (200 - 158));
    const b = Math.round(255);
    c.hLine(0, y, 128, `rgb(${r},${g},${b})`);
  }

  // Nubes
  const cloud = (cx, cy, scale = 1) => {
    c.ellipse(cx, cy, 14 * scale, 6 * scale, PAL.cloud, 0.9);
    c.ellipse(cx - 8 * scale, cy + 2 * scale, 8 * scale, 4 * scale, PAL.cloud, 0.85);
    c.ellipse(cx + 9 * scale, cy + 2 * scale, 9 * scale, 5 * scale, PAL.cloud, 0.85);
  };

  cloud(22, 16, 1);
  cloud(70, 10, 0.8);
  cloud(104, 22, 0.9);

  return c;
}

/** Nubes sueltas sobre fondo transparente (128x64). */
export function drawClouds() {
  const c = new PixelCanvas(128, 64);

  const cloud = (cx, cy, scale = 1) => {
    c.ellipse(cx, cy, 13 * scale, 6 * scale, PAL.cloud, 0.95);
    c.ellipse(cx - 7 * scale, cy + 3 * scale, 8 * scale, 4 * scale, PAL.cloud, 0.9);
    c.ellipse(cx + 8 * scale, cy + 3 * scale, 9 * scale, 5 * scale, PAL.cloud, 0.9);
    // Sombra inferior
    c.ellipse(cx, cy + 5 * scale, 12 * scale, 2 * scale, '#d0e4f4', 0.7);
  };

  cloud(24, 18, 1);
  cloud(74, 12, 0.75);
  cloud(106, 26, 0.85);

  return c;
}

/** Montañas (128x64) — inspiradas en el paisaje de Ica. */
export function drawMountains() {
  const c = new PixelCanvas(128, 64);

  // Montaña trasera
  c.polygon([[0, 64], [34, 14], [70, 64]], PAL.mountainDark);
  // Montaña delantera
  c.polygon([[38, 64], [80, 6], [128, 64]], PAL.mountain);
  // Nieve en la cima
  c.polygon([[74, 14], [80, 6], [86, 15]], PAL.mountainSnow);
  // Sombra lateral
  c.polygon([[80, 6], [128, 64], [104, 64]], '#8a7460');
  // Base
  c.rect(0, 60, 128, 4, '#6a5642');

  return c;
}

/** Árbol (64x64) con variantes de forma. */
export function drawTree(variant = 1) {
  const c = new PixelCanvas(64, 64);
  const cx = 32;

  c.ellipse(cx, 58, 18, 5, PAL.shadow, 0.22);

  // Tronco
  c.rect(cx - 4, 40, 8, 18, PAL.stem);
  c.rect(cx - 4, 40, 2, 18, '#8a5a30');
  c.rect(cx + 2, 40, 2, 18, '#4a2f18');
  // Ramas
  c.line(cx, 46, cx - 10, 38, PAL.stem);
  c.line(cx, 44, cx + 10, 36, PAL.stem);

  // Copa según variante
  const copa = [
    { r: 17, y: 26 },
    { r: 15, y: 24 },
    { r: 19, y: 22 },
  ][(variant - 1) % 3];

  c.circle(cx, copa.y, copa.r, PAL.leafDark);
  c.circle(cx - 4, copa.y - 3, copa.r - 4, PAL.leaf);
  c.circle(cx + 4, copa.y + 1, copa.r - 6, PAL.leafMid);
  c.circle(cx - 6, copa.y - 7, 5, PAL.leafLight);
  c.circle(cx - 7, copa.y - 9, 3, PAL.leafHighlight);

  // Hojas sueltas en el borde
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const lx = cx + Math.cos(a) * (copa.r - 1);
    const ly = copa.y + Math.sin(a) * (copa.r - 1);
    c.circle(lx, ly, 3, i % 2 === 0 ? PAL.leaf : PAL.leafDark);
  }

  return c;
}

/** Cartel "Fundo San Jorge - Ica - Perú". */
export function drawSignFundo() {
  const c = new PixelCanvas(64, 64);

  // Postes
  c.rect(14, 34, 4, 24, PAL.woodDark);
  c.rect(46, 34, 4, 24, PAL.woodDark);

  // Tabla
  c.rect(4, 14, 56, 24, PAL.wood);
  c.rect(4, 14, 56, 2, PAL.woodLight);
  c.rect(4, 36, 56, 2, PAL.woodDark);
  c.rectOutline(4, 14, 56, 24, PAL.woodDark, 2);

  // Texto: "Fundo / San Jorge / Ica - Perú" representado con barras
  const line = (y, x, len, col) => c.rect(x, y, len, 3, col);
  line(18, 10, 20, '#fff0d0');   // Fundo
  line(24, 14, 28, '#ffffff');   // San Jorge
  line(30, 16, 22, '#fff0d0');   // Ica - Peru

  return c;
}

/** Cartel "GRUPO BRIGITTE". */
export function drawSignGrupo() {
  const c = new PixelCanvas(64, 64);

  // Soporte
  c.rect(30, 40, 4, 20, PAL.metalDark);

  // Panel con borde metálico
  c.rect(2, 16, 60, 26, PAL.metalDark);
  c.rect(4, 18, 56, 22, PAL.metal);
  c.rect(4, 18, 56, 2, PAL.white);

  // Texto "GRUPO / BRIGITTE" en barras
  c.rect(10, 22, 30, 3, PAL.white);
  c.rect(14, 28, 36, 4, '#2a3a5a');
  c.rect(16, 29, 32, 2, '#4a6a9a');

  // Tapa superior
  c.rect(2, 14, 60, 3, PAL.metalDark);

  return c;
}

/** Arbusto decorativo. */
export function drawBush() {
  const c = new PixelCanvas(32, 32);

  c.ellipse(16, 27, 11, 3, PAL.shadow, 0.22);
  c.circle(16, 19, 10, PAL.leafDark);
  c.circle(13, 16, 7, PAL.leaf);
  c.circle(11, 13, 4, PAL.leafLight);
  // Flores
  c.rect(19, 14, 3, 3, '#ff6b9d');
  c.rect(9, 20, 3, 3, '#ff6b9d');
  c.rect(21, 21, 2, 2, '#ffffff');

  return c;
}

/** Roca grande. */
export function drawRockLarge() {
  const c = new PixelCanvas(32, 32);

  c.ellipse(16, 26, 12, 4, PAL.shadow, 0.25);
  c.ellipse(16, 21, 11, 8, PAL.mountainDark);
  c.ellipse(15, 18, 9, 7, PAL.mountain);
  c.ellipse(12, 15, 4, 3, '#c8b098');
  // Grietas
  c.line(16, 12, 18, 24, PAL.mountainDark);
  c.line(10, 20, 14, 24, '#6a5642');

  return c;
}

/** Detalle de césped alto. */
export function drawGrassDetail2() {
  const c = new PixelCanvas(32, 32);

  c.rect(0, 0, 32, 32, PAL.grass);
  // Matas altas
  for (let i = 0; i < 14; i += 1) {
    const x = (i * 5 + 2) % 32;
    const y = (i * 9 + 4) % 30;
    const h = 3 + (i % 3);
    c.vLine(x, y, h, PAL.grassHi);
    c.vLine(x + 1, y + 1, h - 1, PAL.grassDark);
  }

  return c;
}

/** Flores decorativas. */
export function drawFlowers() {
  const c = new PixelCanvas(32, 32);

  c.rect(0, 0, 32, 32, PAL.grass);

  const flower = (cx, cy, col) => {
    c.rect(cx - 1, cy, 1, 4, PAL.grassDark);  // tallo
    c.circle(cx, cy, 2, col);
    c.circle(cx, cy, 1, '#ffd93d');
  };

  flower(8, 8, '#ff6b9d');
  flower(20, 12, '#ffffff');
  flower(12, 20, '#ff9ec4');
  flower(24, 22, '#ffd93d');

  return c;
}

export { PAL };
