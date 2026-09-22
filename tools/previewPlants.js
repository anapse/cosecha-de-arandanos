/**
 * previewPlants.js — Genera una imagen comparativa de las plantas y
 * frutos a 6x para revisar el detalle del arte.
 *
 * Uso: node tools/previewPlants.js
 * Salida: tools/preview-plants.png
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

import { encodePng } from './png.js';
import { PixelCanvas } from './pixelCanvas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, '..', 'public', 'assets');

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
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    rgba.set(raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride), y * stride);
  }
  return { width, height, rgba };
}

const SCALE = 6;
const PAD = 10;
const BG = [30, 46, 32];

const FILES = [
  'plants/plant_empty.png',
  'plants/plant_few.png',
  'plants/plant_medium.png',
  'plants/plant_abundant.png',
  'plants/plant_ripe.png',
  'plants/plant_unripe.png',
  'plants/plant_mixed.png',
  'plants/plant_harvested.png',
  'plants/plant_row.png',
  'fruits/fruit_ripe.png',
  'fruits/fruit_unripe.png',
  'fruits/fruit_group_x3.png',
];

function main() {
  const items = FILES.map((rel) => ({
    rel,
    img: decodePng(readFileSync(join(ASSETS, rel))),
  }));

  const cellW = 32 * SCALE + PAD * 2;
  const cellH = 64 * SCALE + PAD * 2;
  const COLS = 6;
  const rows = Math.ceil(items.length / COLS);

  const sheet = new PixelCanvas(COLS * cellW, rows * cellH);

  for (let y = 0; y < sheet.height; y += 1) {
    for (let x = 0; x < sheet.width; x += 1) {
      const checker = (Math.floor(x / 12) + Math.floor(y / 12)) % 2 === 0;
      sheet.setPixel(x, y, checker ? BG : [38, 56, 40]);
    }
  }

  items.forEach((item, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cellX = col * cellW;
    const cellY = row * cellH;

    const { width, height, rgba } = item.img;
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
            sheet.setPixel(offsetX + sx * SCALE + px, offsetY + sy * SCALE + py, rgb, a / 255);
          }
        }
      }
    }
  });

  const out = encodePng(sheet.toRgba(), sheet.width, sheet.height);
  const outPath = join(__dirname, 'preview-plants.png');
  writeFileSync(outPath, out);
  console.log(`Generado: ${outPath}`);
  console.log(`${sheet.width}x${sheet.height}px, escala ${SCALE}x, ${items.length} sprites`);
}

main();
