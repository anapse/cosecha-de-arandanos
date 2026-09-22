/**
 * makeContactSheet.js — Compone una sola imagen PNG con TODOS los
 * sprites en cuadrícula, para poder revisarlos de un vistazo.
 *
 * Uso: node tools/makeContactSheet.js
 * Salida: tools/contact-sheet.png
 *
 * Es una herramienta de revisión del arte: no forma parte del juego.
 */

import { readdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

import { encodePng } from './png.js';
import { PixelCanvas } from './pixelCanvas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, '..', 'public', 'assets');

/**
 * Decodifica un PNG RGBA generado por nosotros (filtro 0).
 * Suficiente para esta herramienta interna.
 */
function decodePng(buffer) {
  let pos = 8;
  let width = 0;
  let height = 0;
  const idat = [];

  while (pos < buffer.length) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.toString('ascii', pos + 4, pos + 8);
    const data = buffer.subarray(pos + 8, pos + 8 + length);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + length;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const rgba = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    const src = y * (stride + 1) + 1;
    rgba.set(raw.subarray(src, src + stride), y * stride);
  }

  return { width, height, rgba };
}

const SCALE = 3;
const PAD = 6;
const BG_A = [24, 40, 26];
const BG_B = [40, 62, 42];

const FOLDERS = [
  'player', 'supervisor', 'plants', 'fruits', 'terrain',
  'basket', 'truck', 'ui', 'effects', 'environment',
];

/** Recoge todos los sprites con su carpeta. */
function collect() {
  const items = [];
  FOLDERS.forEach((folder) => {
    const dir = join(ASSETS, folder);
    if (!existsSync(dir)) return;
    readdirSync(dir)
      .filter((f) => f.endsWith('.png'))
      .sort()
      .forEach((file) => {
        items.push({ folder, file, path: join(dir, file) });
      });
  });
  return items;
}

function main() {
  const items = collect();
  console.log(`Componiendo ${items.length} sprites...`);

  // Ancho de columna = el sprite más ancho (escalado)
  let maxW = 0;
  let maxH = 0;
  const decoded = items.map((item) => {
    const img = decodePng(readFileSync(item.path));
    maxW = Math.max(maxW, img.width);
    maxH = Math.max(maxH, img.height);
    return { ...item, img };
  });

  const cellW = maxW * SCALE + PAD * 2;
  const cellH = maxH * SCALE + PAD * 2;

  const COLS = 10;
  const rows = Math.ceil(decoded.length / COLS);

  const sheet = new PixelCanvas(COLS * cellW, rows * cellH);

  // Fondo a cuadros tenues: deja ver la transparencia
  for (let y = 0; y < sheet.height; y += 1) {
    for (let x = 0; x < sheet.width; x += 1) {
      const checker = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
      sheet.setPixel(x, y, checker ? BG_A : BG_B);
    }
  }

  decoded.forEach((item, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cellX = col * cellW;
    const cellY = row * cellH;

    const { width, height, rgba } = item.img;

    // Centrado dentro de la celda y ampliado con nearest-neighbor
    const offsetX = cellX + Math.floor((cellW - width * SCALE) / 2);
    const offsetY = cellY + Math.floor((cellH - height * SCALE) / 2);

    for (let sy = 0; sy < height; sy += 1) {
      for (let sx = 0; sx < width; sx += 1) {
        const si = (sy * width + sx) * 4;
        const a = rgba[si + 3];
        if (a === 0) continue;

        const rgb = [rgba[si], rgba[si + 1], rgba[si + 2]];

        for (let py = 0; py < SCALE; py += 1) {
          for (let px = 0; px < SCALE; px += 1) {
            sheet.setPixel(
              offsetX + sx * SCALE + px,
              offsetY + sy * SCALE + py,
              rgb,
              a / 255
            );
          }
        }
      }
    }
  });

  const out = encodePng(sheet.toRgba(), sheet.width, sheet.height);
  const outPath = join(__dirname, 'contact-sheet.png');
  writeFileSync(outPath, out);

  console.log(`Guardado: ${outPath}`);
  console.log(`Tamano: ${sheet.width}x${sheet.height}px, ${(out.length / 1024).toFixed(1)} KB`);
  console.log(`Celdas: ${COLS} columnas x ${rows} filas (escala ${SCALE}x)`);
}

main();
