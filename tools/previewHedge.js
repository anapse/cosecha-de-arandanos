/**
 * previewHedge.js — Vista previa del PROTOTIPO de hilera de cultivo.
 *
 * Genera una tira de varios segmentos de seto unidos, tal y como se
 * verían en el campo: repetidos en horizontal y en vertical. Sirve
 * para comprobar, ANTES de integrarlos, que:
 *
 *   - el follaje es una masa continua (sin cuadros)
 *   - NO se ve costura entre segmentos contiguos
 *   - la tierra se lee como franja, no como caja
 *
 * Uso: node tools/previewHedge.js
 * Salida: tools/preview-hedge.png
 */

import { writeFileSync } from 'node:fs';
import { drawHedgeSegment } from './artHedge.js';
import { PixelCanvas } from './pixelCanvas.js';
import { encodePng } from './png.js';

const SCALE = 4;
const COLS = 3;   // segmentos en horizontal
const ROWS = 4;   // segmentos en vertical

const { HEDGE_W, HEDGE_H } = await import('./artHedge.js');

/* Lienzo de la tira: varios segmentos juntos, como en el campo */
const strip = new PixelCanvas(HEDGE_W * COLS, HEDGE_H * ROWS);

for (let row = 0; row < ROWS; row += 1) {
  for (let col = 0; col < COLS; col += 1) {
    // Semilla distinta por segmento para que no se note la repetición.
    const seg = drawHedgeSegment({ seed: 1 + row * COLS + col });
    strip.drawCanvas(seg, col * HEDGE_W, row * HEDGE_H);
  }
}

/* Ampliación nearest-neighbor para ver el pixel art */
const out = new PixelCanvas(strip.width * SCALE, strip.height * SCALE);
for (let y = 0; y < strip.height; y += 1) {
  for (let x = 0; x < strip.width; x += 1) {
    const i = (y * strip.width + x) * 4;
    if (strip.data[i + 3] < 10) continue;
    const [r, g, b, a] = [
      strip.data[i], strip.data[i + 1], strip.data[i + 2], strip.data[i + 3],
    ];
    const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    out.rect(x * SCALE, y * SCALE, SCALE, SCALE, hex, a / 255);
  }
}

const png = encodePng(out.toRgba(), out.width, out.height);
writeFileSync('tools/preview-hedge.png', png);

console.log('');
console.log('Generado: tools/preview-hedge.png');
console.log(`${out.width}x${out.height}px  (${COLS}x${ROWS} segmentos de ${HEDGE_W}x${HEDGE_H}, escala ${SCALE}x)`);
console.log('');
console.log('Comprobar en la imagen:');
console.log('  1. El follaje es una masa continua, sin cuadros cerrados.');
console.log('  2. No se ve costura entre segmentos contiguos.');
console.log('  3. La tierra se lee como franja, no como caja.');
console.log('');
