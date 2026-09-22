/**
 * pixelCanvas.js — Lienzo de pixel art para generar sprites.
 *
 * Trabaja con una rejilla de píxeles RGBA y ofrece las primitivas que
 * necesita el arte del juego: píxel, rectángulo, círculo, elipse,
 * polígono, línea y espejado horizontal.
 *
 * Todo se dibuja en coordenadas ENTERAS: el pixel art no admite
 * suavizados.
 */

export class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    // RGBA inicial: totalmente transparente.
    this.data = new Uint8Array(width * height * 4);
  }

  /** Convierte '#rrggbb' o '#rgb' a [r,g,b]. */
  static hexToRgb(hex) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  /** Escribe un píxel con alfa (composición "over"). */
  setPixel(x, y, rgb, alpha = 1) {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (!this.inBounds(xi, yi) || alpha <= 0) return;

    const [r, g, b] = Array.isArray(rgb) ? rgb : PixelCanvas.hexToRgb(rgb);
    const i = (yi * this.width + xi) * 4;

    if (alpha >= 1) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = 255;
      return;
    }

    // Mezcla con lo que ya había.
    const srcA = alpha;
    const dstA = this.data[i + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);

    this.data[i] = Math.round((r * srcA + this.data[i] * dstA * (1 - srcA)) / outA);
    this.data[i + 1] = Math.round((g * srcA + this.data[i + 1] * dstA * (1 - srcA)) / outA);
    this.data[i + 2] = Math.round((b * srcA + this.data[i + 2] * dstA * (1 - srcA)) / outA);
    this.data[i + 3] = Math.round(outA * 255);
  }

  /** Rectángulo relleno. */
  rect(x, y, w, h, color, alpha = 1) {
    for (let yy = 0; yy < h; yy += 1) {
      for (let xx = 0; xx < w; xx += 1) {
        this.setPixel(x + xx, y + yy, color, alpha);
      }
    }
    return this;
  }

  /** Rectángulo con contorno. */
  rectOutline(x, y, w, h, color, thickness = 1) {
    this.rect(x, y, w, thickness, color);
    this.rect(x, y + h - thickness, w, thickness, color);
    this.rect(x, y, thickness, h, color);
    this.rect(x + w - thickness, y, thickness, h, color);
    return this;
  }

  /** Línea horizontal. */
  hLine(x, y, length, color) {
    return this.rect(x, y, length, 1, color);
  }

  /** Línea vertical. */
  vLine(x, y, length, color) {
    return this.rect(x, y, 1, length, color);
  }

  /** Círculo relleno (disco). */
  circle(cx, cy, radius, color, alpha = 1) {
    const r2 = radius * radius;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) this.setPixel(x, y, color, alpha);
      }
    }
    return this;
  }

  /** Elipse rellena (para sombras y follaje). */
  ellipse(cx, cy, rx, ry, color, alpha = 1) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.setPixel(x, y, color, alpha);
      }
    }
    return this;
  }

  /**
   * Polígono relleno (algoritmo de scanline por punto medio).
   * @param {Array<[number,number]>} points
   */
  polygon(points, color, alpha = 1) {
    if (points.length < 3) return this;

    const ys = points.map((p) => p[1]);
    const minY = Math.floor(Math.min(...ys));
    const maxY = Math.ceil(Math.max(...ys));

    for (let y = minY; y <= maxY; y += 1) {
      const crossings = [];

      for (let i = 0; i < points.length; i += 1) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % points.length];

        if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
          const t = (y - y1) / (y2 - y1);
          crossings.push(x1 + t * (x2 - x1));
        }
      }

      crossings.sort((a, b) => a - b);

      for (let i = 0; i + 1 < crossings.length; i += 2) {
        const xStart = Math.round(crossings[i]);
        const xEnd = Math.round(crossings[i + 1]);
        for (let x = xStart; x < xEnd; x += 1) this.setPixel(x, y, color, alpha);
      }
    }

    return this;
  }

  /** Línea de Bresenham (para tallos y ramas). */
  line(x0, y0, x1, y1, color) {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const ex = Math.round(x1);
    const ey = Math.round(y1);

    const dx = Math.abs(ex - x);
    const dy = Math.abs(ey - y);
    const sx = x < ex ? 1 : -1;
    const sy = y < ey ? 1 : -1;
    let err = dx - dy;

    for (;;) {
      this.setPixel(x, y, color);
      if (x === ex && y === ey) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }

    return this;
  }

  /**
   * Convierte una columna de PÍXELES a color.
   * El parámetro `palette` es un array de colores y el valor del
   * píxel es el índice (1 = primer color, 0 = transparente).
   * Permite definir sprites como "mapas de caracteres" legibles.
   */
  stampMask(mask, palette, offsetX = 0, offsetY = 0) {
    for (let y = 0; y < mask.length; y += 1) {
      const row = mask[y];
      for (let x = 0; x < row.length; x += 1) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const color = palette[ch];
        if (color) this.setPixel(x + offsetX, y + offsetY, color);
      }
    }
    return this;
  }

  /** Copia otro lienzo sobre este (para componer). */
  drawCanvas(source, offsetX = 0, offsetY = 0) {
    for (let y = 0; y < source.height; y += 1) {
      for (let x = 0; x < source.width; x += 1) {
        const i = (y * source.width + x) * 4;
        const a = source.data[i + 3];
        if (a === 0) continue;
        this.setPixel(
          x + offsetX,
          y + offsetY,
          [source.data[i], source.data[i + 1], source.data[i + 2]],
          a / 255
        );
      }
    }
    return this;
  }

  /** Devuelve una copia espejada horizontalmente. */
  mirroredHorizontal() {
    const out = new PixelCanvas(this.width, this.height);
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const src = (y * this.width + x) * 4;
        const dst = (y * this.width + (this.width - 1 - x)) * 4;
        out.data[dst] = this.data[src];
        out.data[dst + 1] = this.data[src + 1];
        out.data[dst + 2] = this.data[src + 2];
        out.data[dst + 3] = this.data[src + 3];
      }
    }
    return out;
  }

  /** Exporta a RGBA crudo para el codificador PNG. */
  toRgba() {
    return this.data;
  }
}

export default PixelCanvas;
