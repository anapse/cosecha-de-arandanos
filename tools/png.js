/**
 * png.js — Codificador PNG mínimo, sin dependencias externas.
 *
 * ¿Por qué a mano? El proyecto tiene la regla de no añadir librerías
 * innecesarias (§34, §41). Generar PNG solo necesita:
 *   firma PNG + IHDR + IDAT (zlib/deflate) + IEND
 * y Node ya trae `zlib`, así que no hace falta ninguna dependencia.
 *
 * Salida: PNG RGBA de 8 bits, sin filtros (filtro 0 por scanline),
 * con transparencia real.
 */

import { deflateSync } from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

/** Construye un chunk PNG: longitud + tipo + datos + CRC. */
function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

/**
 * Codifica una imagen RGBA cruda a PNG.
 *
 * @param {Uint8Array} rgba píxeles RGBA, longitud = width*height*4
 * @param {number} width
 * @param {number} height
 * @returns {Buffer} contenido del archivo .png
 */
export function encodePng(rgba, width, height) {
  if (rgba.length !== width * height * 4) {
    throw new Error(
      `encodePng: se esperaban ${width * height * 4} bytes y llegaron ${rgba.length}`
    );
  }

  /* ---- IHDR ---- */
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // profundidad de bits
  ihdr[9] = 6;   // tipo de color 6 = RGBA
  ihdr[10] = 0;  // compresión (deflate)
  ihdr[11] = 0;  // filtro (adaptativo)
  ihdr[12] = 0;  // sin entrelazado

  /* ---- IDAT: cada scanline lleva un byte de filtro (0 = none) ---- */
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filtro "None"
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1
    );
  }

  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export default encodePng;
