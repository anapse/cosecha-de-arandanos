/**
 * artHedge.js — PROTOTIPO de hilera de cultivo continua.
 *
 * ¿POR QUÉ EXISTE ESTE ARCHIVO?
 *
 * El campo se veía como una cuadrícula porque cada celda dibujaba su
 * propio cuadrado de tierra y, encima, una mata cuadrada. Aunque las
 * matas se tocaran, la frontera entre celdas seguía marcando la rejilla.
 *
 * Aquí se genera un SEGMENTO DE SETO pensado para repetirse:
 *
 *   - 96 px de ancho (2 tiles) y 96 px de alto (2 tiles)
 *   - el follaje es UNA masa continua de lado a lado, SIN bordes
 *     redondeados que delaten la celda
 *   - los bordes izquierdo y derecho están CORTADOS a ras, de modo que
 *     al poner un segmento junto a otro (o al repetirlo en vertical)
 *     las hojas CONTINÚAN sin costura visible
 *   - el follaje llega al borde superior e inferior por el mismo motivo
 *   - la tierra va integrada en la parte baja, sin formar un cuadro
 *
 * ESTADO: prototipo temporal para validar la composición (FASE 3).
 * NO es el asset definitivo.
 */

import { PixelCanvas } from './pixelCanvas.js';
import { PAL } from './palette.js';

/** Dimensiones del segmento, en px. 2 tiles x 2 tiles. */
export const HEDGE_W = 96;
export const HEDGE_H = 96;

/** Alto de la franja de tierra dentro del segmento. */
const SOIL_H = 18;

/**
 * Dibuja un segmento de seto continuo.
 *
 * El truco para que se vea continuo: las formas se generan con una
 * función que depende SOLO de x (columnas verticales de hojas) y el
 * ruido del borde superior/inferior es periódico, de forma que la
 * última fila del segmento encaja con la primera del siguiente.
 *
 * @param {object} opts
 * @param {number} opts.seed semilla para variar la textura
 * @param {number} opts.density 0-1 densidad del follaje
 * @param {boolean} opts.harvested follaje apagado (ya recogido)
 * @param {number} opts.leafH alto del follaje sobre la tierra
 * @returns {PixelCanvas} segmento de 96x96
 */
export function drawHedgeSegment({
  seed = 1,
  density = 0.95,
  harvested = false,
  leafH = 0,
} = {}) {
  const c = new PixelCanvas(HEDGE_W, HEDGE_H);

  const leafDark = harvested ? '#42583a' : PAL.leafDark;
  const leafMid = harvested ? '#55704a' : PAL.leaf;
  const leafLight = harvested ? '#6d8a58' : PAL.leafMid;
  const leafHi = harvested ? '#84a06e' : PAL.leafLight;

  /* ---------- 1. Tierra integrada abajo ---------- */
  // No es un cuadrado: es una franja que ocupa todo el ancho, con el
  // borde superior ligeramente ondulado para que no se lea como caja.
  const soilTop = HEDGE_H - SOIL_H;

  for (let x = 0; x < HEDGE_W; x += 1) {
    // Onda suave y periódica (2 pi / 32): encaja entre segmentos.
    const wave = Math.sin((x / 32) * Math.PI * 2 + seed) * 2;
    const y0 = Math.round(soilTop + wave);

    c.rect(x, y0, 1, HEDGE_H - y0, PAL.soilDark);
    c.rect(x, y0, 1, 2, PAL.soil);

    // Surcos de arado verticales, cada 12 px: siguen al repetir.
    if (x % 12 === 0) {
      c.rect(x, y0 + 3, 2, HEDGE_H - y0 - 3, PAL.soilShadow);
    }
  }

  /* ---------- 2. Masa de follaje CONTINUA ---------- */
  // Se construye por COLUMNAS: para cada x se calcula la altura del
  // follaje. Es lo que garantiza que no haya cuadros: no hay ninguna
  // forma cerrada que empiece y acabe dentro del segmento.
  const baseY = soilTop + 6;

  for (let x = 0; x < HEDGE_W; x += 1) {
    // Perfil de la mata: ondas de varias frecuencias, todas múltiplos
    // de 2 pi/96 para que el perfil sea periódico y las orillas casen.
    const w1 = Math.sin((x / 96) * Math.PI * 2 + seed * 0.7) * 5;
    const w2 = Math.sin((x / 32) * Math.PI * 2 + seed * 1.9) * 3;
    const w3 = Math.sin((x / 16) * Math.PI * 2 + seed * 3.1) * 1.6;

    const top = Math.round(baseY - 34 + w1 + w2 + w3 - leafH);

    // Cuerpo de la mata, de arriba abajo, en tonos por capas.
    c.rect(x, top, 1, baseY - top, leafDark);

    // Luz: la parte alta recibe luz, así que se aclara por arriba.
    const lit = Math.round((baseY - top) * 0.45);
    c.rect(x, top, 1, lit, leafMid);

    const hi = Math.round((baseY - top) * 0.22);
    c.rect(x, top, 1, hi, leafLight);
  }

  /* ---------- 3. Textura de hojas (bultos) ---------- */
  // Se colocan en una rejilla de 8 px alineada con los bordes, así que
  // el patrón continúa igual en el segmento vecino.
  const bumps = Math.round(22 * density);
  for (let i = 0; i < bumps; i += 1) {
    // Posición determinista: alineada a 8 px y periódica.
    const bx = (i * 37 + Math.round(seed * 13)) % HEDGE_W;
    const by = soilTop - 6 - ((i * 53 + Math.round(seed * 29)) % 30);

    // Bulto de hoja: círculo pequeño en tono medio/oscuro alterno.
    const col = i % 3 === 0 ? leafMid : (i % 3 === 1 ? leafDark : leafLight);
    c.circle(bx, by, 3, col);

    // Reflejo en la parte alta del bulto.
    if (by < soilTop - 14) {
      c.circle(bx - 1, by - 1, 1, leafHi);
    }
  }

  /* ---------- 4. Flores blancas dispersas ---------- */
  // Detalle de la referencia: pequeñas flores entre el follaje.
  const flowers = Math.round(4 * density);
  for (let i = 0; i < flowers; i += 1) {
    const fx = 8 + ((i * 41 + Math.round(seed * 7)) % (HEDGE_W - 16));
    const fy = soilTop - 10 - ((i * 23 + Math.round(seed * 11)) % 24);
    c.circle(fx, fy, 1, '#f4f0e2');
  }

  return c;
}

/**
 * Segmento de seto ya recogido: mismo perfil, follaje apagado.
 * Reutiliza el mismo dibujo para que la silueta no cambie al cosechar.
 */
export function drawHedgeSegmentHarvested(seed = 1) {
  return drawHedgeSegment({ seed, density: 0.75, harvested: true, leafH: 4 });
}

export default { drawHedgeSegment, drawHedgeSegmentHarvested, HEDGE_W, HEDGE_H };
