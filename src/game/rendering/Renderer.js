/**
 * Renderer.js
 * ---------------------------------------------------------------
 * Dibuja el mundo y el HUD en el canvas.
 *
 * Reglas de rendimiento (§34, §41):
 *   - Solo se dibujan tiles y entidades VISIBLES (culling por cámara).
 *   - El HUD se dibuja con rectángulos, no con imágenes escaladas.
 *   - Cero asignaciones pesadas dentro del bucle de dibujo.
 *
 * Orden de dibujo (de atrás hacia delante):
 *   1. Terreno (tiles)
 *   2. Zona de entrega / decoración de suelo
 *   3. Entidades ordenadas por Y (jugador, plantas, supervisor, cajas)
 *   4. Efectos (partículas, textos flotantes)
 *   5. HUD (en coordenadas de pantalla)
 */

import { TILE_SIZE, TILE_TYPES, BASKET_STATES } from './renderConstants.js';
import { PALETTE, withAlpha } from '../../utils/colors.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { formatTime } from '../../utils/math.js';

export class Renderer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./SpriteRenderer.js').SpriteRenderer} sprites
   */
  constructor(ctx, sprites) {
    this.ctx = ctx;
    this.sprites = sprites;
    this.width = GAME_CONFIG.logicalWidth;
    this.height = GAME_CONFIG.logicalHeight;
    this.viewWidth = this.width;
    this.viewHeight = this.height;
  }

  /** Ajusta el tamaño lógico (por si cambia la configuración). */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.viewWidth = width;
    this.viewHeight = height;
  }

  /** Limpia el frame completo. */
  clear() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = PALETTE.soilDark;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /* ============================================================
     MUNDO
     ============================================================ */

  /**
   * Dibuja el terreno visible.
   * @param {import('../map/TileMap.js').TileMap} tileMap
   * @param {import('./Camera.js').Camera} camera
   */
  /**
   * Dibuja el terreno del campo: suelo uniforme de arena cálida,
   * surcos de cultivo alineados bajo las 5 hileras y bordes de césped limpios.
   * Sin mosaicos desiguales ni texturas discordantes.
   * @param {import('../map/TileMap.js').TileMap} tileMap
   * @param {import('./Camera.js').Camera} camera
   */
  drawTerrain(tileMap, camera) {
    const ts = tileMap.tileSize;
    const width = tileMap.pixelWidth;
    const height = tileMap.pixelHeight;
    const ctx = this.ctx;
    const fieldTopY = 3 * ts; // Empieza debajo del paisaje superior (144px)
    const plantTopY = 4 * ts; // Inicio de las plantas (192px)
    const plantBottomY = 10 * ts; // Fin de hileras de plantas más cortas (480px)
    const fenceBottomY = plantBottomY + 6; // Cerca horizontal que divide el cultivo del acopio (486px)
    const deliveryTopY = 11 * ts; // Inicio zona de entrega amplia (528px)

    // 1. Suelo base uniforme y limpio de tierra/arena cálida de Ica
    ctx.fillStyle = PALETTE.soil;
    ctx.fillRect(0, fieldTopY, width, height - fieldTopY);

    // 2. Lechos de cultivo de arándanos (columnas 1, 3, 5, 7)
    const plantCols = [1, 3, 5, 7];
    plantCols.forEach((col) => {
      const bx = col * ts;
      // Camellón de tierra fértil enriquecida para los arándanos
      ctx.fillStyle = '#b87c3a';
      ctx.fillRect(bx - 3, plantTopY - 4, ts + 6, plantBottomY - plantTopY + 8);

      // Centro del surco
      ctx.fillStyle = '#9e6224';
      ctx.fillRect(bx + 4, plantTopY, ts - 8, plantBottomY - plantTopY);

      // Líneas de textura del surco
      ctx.fillStyle = withAlpha('#6a3d10', 0.25);
      ctx.fillRect(bx + Math.round(ts * 0.28), plantTopY, 2, plantBottomY - plantTopY);
      ctx.fillRect(bx + Math.round(ts * 0.72), plantTopY, 2, plantBottomY - plantTopY);
    });

    // 3. CAMINERÍAS TRANSITABLES DEL JUGADOR (columnas 0, 2, 4, 6, 8, 9)
    // Suelo firme, limpio y despejado donde camina el recolector
    const pathCols = [0, 2, 4, 6, 8, 9];
    pathCols.forEach((col) => {
      const px = col * ts;
      // Base de caminería en tono arena cálida clara
      ctx.fillStyle = '#dfaf72';
      ctx.fillRect(px, fieldTopY, ts, plantBottomY - fieldTopY + 6);

      // Huellas suaves y textura de pisadas en el camino
      ctx.fillStyle = withAlpha('#fae3be', 0.4);
      for (let y = fieldTopY + 12; y < plantBottomY; y += 28) {
        const hash = ((col * 41 + y * 19) % 100);
        ctx.fillRect(px + 8 + (hash % 24), y, 8, 3);
      }

      // Bordes de la caminería
      ctx.fillStyle = withAlpha('#a87034', 0.25);
      ctx.fillRect(px, fieldTopY, 1.5, plantBottomY - fieldTopY + 6);
      ctx.fillRect(px + ts - 1.5, fieldTopY, 1.5, plantBottomY - fieldTopY + 6);
    });

    // 4. Pasillo horizontal superior (fila 3) para cruzar entre caminerías
    ctx.fillStyle = '#e4b67b';
    ctx.fillRect(0, fieldTopY, width, ts);
    ctx.fillStyle = withAlpha('#fae3be', 0.35);
    for (let x = 12; x < width - 12; x += 32) {
      ctx.fillRect(x, fieldTopY + 16, 12, 4);
    }

    // 5. CERCA DE MADERA HORIZONTAL INFERIOR (idéntica a image.png)
    // Rieles de madera horizontales
    ctx.fillStyle = '#3a200a';
    ctx.fillRect(0, fenceBottomY - 1, width, 7);
    ctx.fillStyle = '#784318';
    ctx.fillRect(0, fenceBottomY, width, 5);
    ctx.fillStyle = '#a1612a';
    ctx.fillRect(0, fenceBottomY, width, 1.5);

    // Postes de madera verticales cada 48px
    for (let px = 18; px < width; px += 48) {
      ctx.fillStyle = '#3a200a';
      ctx.fillRect(px - 1, fenceBottomY - 12, 6, 20);
      ctx.fillStyle = '#784318';
      ctx.fillRect(px, fenceBottomY - 11, 4, 18);
      ctx.fillStyle = '#a1612a';
      ctx.fillRect(px, fenceBottomY - 11, 1.5, 18);
      ctx.fillStyle = '#d4bb98';
      ctx.fillRect(px + 1, fenceBottomY + 1, 2, 2);
    }

    // 6. Zona de entrega amplia (a partir de fila 11 / 528px)
    ctx.fillStyle = '#cb995c';
    ctx.fillRect(0, deliveryTopY, width, height - deliveryTopY);

    // Textura sutil de patio de carga afirmado
    ctx.fillStyle = withAlpha('#dfb074', 0.32);
    for (let x = 16; x < width - 16; x += 36) {
      for (let y = deliveryTopY + 12; y < height - 12; y += 28) {
        ctx.fillRect(x + ((y * 7) % 14), y, 5, 2.5);
      }
    }

    // 7. Arbustos decorativos con flores blancas en primer plano (borde inferior)
    const fgY = height - 44;
    const fgBushes = [
      { x: 30, r: 16 },
      { x: 180, r: 18 },
      { x: 310, r: 20 },
      { x: 410, r: 17 }
    ];

    for (const { x, r } of fgBushes) {
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(x, fgY + 10, r + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(x, fgY + 8, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(x - 2, fgY + 6, r * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Flores blancas
      const flowerOffsets = [[-6, -2], [4, -4], [-2, 6], [7, 4]];
      for (const [fx, fy] of flowerOffsets) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + fx, fgY + 8 + fy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x + fx - 0.5, fgY + 8 + fy - 0.5, 1, 1);
      }
    }

    // Cerca lateral a los costados
    for (let y = fieldTopY + 12; y < plantBottomY; y += 48) {
      ctx.fillStyle = '#3a200a';
      ctx.fillRect(0, y, 4, 18);
      ctx.fillStyle = '#784318';
      ctx.fillRect(1, y, 2.5, 16);

      ctx.fillStyle = '#3a200a';
      ctx.fillRect(width - 4, y, 4, 18);
      ctx.fillStyle = '#784318';
      ctx.fillRect(width - 3.5, y, 2.5, 16);
    }
  }

  /* ============================================================
     PAISAJE DE FONDO (CIELO, MONTAÑAS NEVADAS, ÁRBOLES Y CERCA)
     ============================================================ */

  /**
   * Dibuja la franja superior de paisaje (cielo, montañas nevadas, árboles y cerca).
   * Ocupa 3 filas completas (144px) para ser siempre visible detrás y debajo del HUD.
   */
  drawLandscape(camera, layout = {}) {
    const ctx = this.ctx;
    const vw = this.viewWidth;
    const ts = TILE_SIZE;
    const landscapeHeight = 3 * ts; // Franja superior de 144px

    // 1. Cielo con degradado azul nítido (cielo despejado de Ica)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 80);
    skyGrad.addColorStop(0, '#4da2f5');
    skyGrad.addColorStop(0.65, '#87c3fc');
    skyGrad.addColorStop(1, '#bfe1ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, vw, 82);

    // 2. Nubes blancas suaves estilo pixel art
    const cloudPositions = [
      { x: 18, y: 12, w: 58, h: 14 },
      { x: 135, y: 10, w: 78, h: 16 },
      { x: 255, y: 14, w: 68, h: 14 },
      { x: 355, y: 9, w: 62, h: 14 },
    ];
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    cloudPositions.forEach(({ x, y, w, h }) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, h / 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w * 0.45, y + 2, h * 0.6, 0, Math.PI * 2);
      ctx.arc(x + w * 0.65, y + 3, h * 0.48, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Montañas púrpuras con picos nevados (cordillera de los Andes)
    // Claramente visibles debajo del HUD
    const mountainPeaks = [
      { x: -15, w: 110, h: 48, snowH: 16 },
      { x: 72, w: 130, h: 58, snowH: 20 },
      { x: 175, w: 120, h: 50, snowH: 17 },
      { x: 260, w: 135, h: 60, snowH: 22 },
      { x: 360, w: 105, h: 52, snowH: 18 },
    ];

    const mountainBaseY = 100;

    mountainPeaks.forEach(({ x, w, h, snowH }) => {
      const topY = mountainBaseY - h;
      const midX = x + w / 2;

      // Silueta montaña púrpura/azul
      ctx.fillStyle = '#5c67a3';
      ctx.beginPath();
      ctx.moveTo(x, mountainBaseY);
      ctx.lineTo(midX, topY);
      ctx.lineTo(x + w, mountainBaseY);
      ctx.closePath();
      ctx.fill();

      // Sombra lado derecho de la montaña
      ctx.fillStyle = '#434b80';
      ctx.beginPath();
      ctx.moveTo(midX, topY);
      ctx.lineTo(x + w, mountainBaseY);
      ctx.lineTo(midX, mountainBaseY);
      ctx.closePath();
      ctx.fill();

      // Pico nevado blanco
      const snowBottomY = topY + snowH;
      const snowLeftX = midX - (w * (snowH / h)) / 2;
      const snowRightX = midX + (w * (snowH / h)) / 2;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(snowLeftX, snowBottomY);
      ctx.lineTo(midX, topY);
      ctx.lineTo(snowRightX, snowBottomY);
      ctx.lineTo(midX, snowBottomY - 2);
      ctx.closePath();
      ctx.fill();
    });

    // 4. Franja de árboles verdes cortavientos
    const treesY = 96;
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, treesY + 16, vw, 26);

    for (let x = -8; x < vw + 18; x += 20) {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(x + 10, treesY + 12, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(x + 8, treesY + 9, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Cerca horizontal rústica de madera (separa el paisaje del campo)
    const fenceY = landscapeHeight - 8;
    // Rieles de madera horizontales
    ctx.fillStyle = '#3a200a';
    ctx.fillRect(0, fenceY - 1, vw, 7);
    ctx.fillStyle = '#784318';
    ctx.fillRect(0, fenceY, vw, 5);
    ctx.fillStyle = '#a1612a';
    ctx.fillRect(0, fenceY, vw, 1.5);

    // Postes de madera verticales cada 48px
    for (let px = 24; px < vw; px += 48) {
      ctx.fillStyle = '#3a200a';
      ctx.fillRect(px - 1, fenceY - 12, 6, 19);
      ctx.fillStyle = '#784318';
      ctx.fillRect(px, fenceY - 11, 4, 17);
      ctx.fillStyle = '#a1612a';
      ctx.fillRect(px, fenceY - 11, 1.5, 17);
      // Clavo metálico
      ctx.fillStyle = '#d4bb98';
      ctx.fillRect(px + 1, fenceY + 1, 2, 2);
    }
  }

  /**
   * Valla de madera que separa el campo de la zona de entrega (§4).
   * Se dibuja como una línea horizontal de tiles de cerca.
   *
   * @param {number} width ancho del mapa en px
   * @param {number} y fila del mundo donde va la cerca
   */
  drawDeliveryFence(width, y) {
    const ts = TILE_SIZE;
    for (let x = 0; x < width; x += ts) {
      this.sprites.draw('terrain.fenceH', x, y, {
        frameSize: ts, width: ts, height: ts,
      });
    }
  }

  /**
   * Carteles del fundo y del grupo, integrados en el escenario (§14).
   *
   * @param {number} x
   * @param {number} y
   * @param {'fundo'|'grupo'} kind
   */
  drawSign(x, y, kind = 'fundo') {
    const key = kind === 'grupo' ? 'env.signsGrupo' : 'env.signsFundo';
    this.sprites.draw(key, x, y, {
      frameSize: 64, width: 52, height: 52,
    });
  }

  /**
   * Decoración de suelo: rocas, matas y flores (§13).
   * Se colocan de forma determinista para que no parpadeen.
   *
   * @param {number} width
   * @param {number} height
   * @param {number} y0 fila inicial (bajo el paisaje)
   */
  drawSceneryDecoration(width, height, y0) {
    const items = [
      { key: 'env.decorationsRockLarge', x: 8, y: y0 + 6, w: 22 },
      { key: 'env.decorationsRockLarge', x: width - 30, y: y0 + 40, w: 20 },
      { key: 'env.decorationsFlowers', x: 40, y: y0 + 30, w: 20 },
      { key: 'env.decorationsFlowers', x: width - 70, y: y0 + 8, w: 20 },
      { key: 'env.decorationsGrassDetail', x: 90, y: y0 + 14, w: 20 },
      { key: 'env.decorationsGrassDetail', x: width - 110, y: y0 + 52, w: 20 },
    ];

    items.forEach((item) => {
      this.sprites.draw(item.key, item.x, item.y, {
        frameSize: 32, width: item.w, height: item.w,
      });
    });
  }

  /* ============================================================
     ENTIDADES
     ============================================================ */

  /**
   * Dibuja las plantas visibles con follaje frondoso continuo,
   * silueta lobulada y flores blancas idénticas a la muestra de referencia.
   * @param {Array<import('../entities/Plant.js').Plant>} plants
   * @param {import('./Camera.js').Camera} camera
   * @param {object} highlight info sobre la planta resaltada
   */
  drawPlants(plants, camera, highlight = null) {
    const ts = TILE_SIZE;
    const ctx = this.ctx;

    for (let i = 0; i < plants.length; i += 1) {
      const plant = plants[i];
      const rect = { x: plant.x, y: plant.y, w: ts, h: ts };

      if (!camera.isVisible(rect, 24)) continue;

      const px = Math.round(plant.x);
      const py = Math.round(plant.y);

      // Arbusto tupido de alta fidelidad con capas de hojas y flores
      this.#drawLushHedgeSegment(px, py, ts, plant);

      // Marca sutil en la planta apuntada por el jugador
      if (highlight && highlight.plantId === plant.id) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = highlight.color ?? PALETTE.warn;
        ctx.beginPath();
        ctx.arc(px + ts / 2, py + ts / 2, ts * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  /**
   * Dibuja un segmento de seto continuo, frondoso y notablemente ancho.
   * Con 4 hileras los arbustos se extienden más horizontalmente (ancho ~66px),
   * con múltiples lóbulos de follaje verde vibrante y flores blancas.
   */
  #drawLushHedgeSegment(x, y, size, plant) {
    const ctx = this.ctx;
    const cx = x + size / 2;
    const cy = y + size / 2;
    // Arbustos esféricos y frondosos ampliados (radio 23px / diámetro 46px)
    // Otorgan mayor presencia visual manteniendo las caminerías de 48px despejadas
    const rx = 23;
    const ry = 20;

    ctx.save();

    // Sombra del follaje sobre el lecho arenoso
    ctx.fillStyle = 'rgba(50, 25, 8, 0.32)';
    ctx.beginPath();
    ctx.ellipse(cx, y + size * 0.84, rx * 1.05, ry * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Capa base oscura del arbusto (fondo profundo de hojas verde bosque)
    ctx.fillStyle = '#0e3312';
    ctx.beginPath();
    ctx.arc(cx - rx * 0.52, cy - ry * 0.18, rx * 0.52, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.52, cy - ry * 0.18, rx * 0.52, 0, Math.PI * 2);
    ctx.arc(cx, cy + ry * 0.28, rx * 0.56, 0, Math.PI * 2);
    ctx.arc(cx - rx * 0.62, cy + ry * 0.1, rx * 0.46, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.62, cy + ry * 0.1, rx * 0.46, 0, Math.PI * 2);
    ctx.arc(cx, cy - ry * 0.35, rx * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Capa media: verde esmeralda denso y frondoso
    ctx.fillStyle = '#1b691e';
    ctx.beginPath();
    ctx.arc(cx - rx * 0.4, cy - ry * 0.15, rx * 0.45, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.4, cy - ry * 0.15, rx * 0.45, 0, Math.PI * 2);
    ctx.arc(cx, cy + ry * 0.18, rx * 0.48, 0, Math.PI * 2);
    ctx.arc(cx - rx * 0.5, cy + ry * 0.05, rx * 0.4, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.5, cy + ry * 0.05, rx * 0.4, 0, Math.PI * 2);
    ctx.arc(cx, cy - ry * 0.25, rx * 0.44, 0, Math.PI * 2);
    ctx.fill();

    // 3. Capa de hojas iluminadas (verde hoja vibrante)
    ctx.fillStyle = '#329c2c';
    ctx.beginPath();
    ctx.arc(cx - rx * 0.28, cy - ry * 0.26, rx * 0.32, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.28, cy - ry * 0.26, rx * 0.32, 0, Math.PI * 2);
    ctx.arc(cx - rx * 0.06, cy - ry * 0.06, rx * 0.34, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.3, cy + ry * 0.08, rx * 0.28, 0, Math.PI * 2);
    ctx.arc(cx - rx * 0.32, cy + ry * 0.12, rx * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // 4. Puntas iluminadas por el sol (verde lima fresco)
    ctx.fillStyle = '#56c64c';
    ctx.beginPath();
    ctx.arc(cx - rx * 0.22, cy - ry * 0.34, rx * 0.15, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.2, cy - ry * 0.36, rx * 0.14, 0, Math.PI * 2);
    ctx.arc(cx - rx * 0.02, cy - ry * 0.16, rx * 0.16, 0, Math.PI * 2);
    ctx.arc(cx - rx * 0.42, cy - ry * 0.05, rx * 0.13, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.42, cy - ry * 0.05, rx * 0.13, 0, Math.PI * 2);
    ctx.fill();

    // 5. Pequeñas flores blancas de 5 pétalos con centro dorado
    const flowerSeed = (plant.col * 31 + plant.row * 19) % 100;
    const flowerPositions = [
      { fx: cx - rx * 0.45, fy: cy - ry * 0.2 },
      { fx: cx + rx * 0.44, fy: cy + ry * 0.12 },
      { fx: cx + (flowerSeed % 18 - 9), fy: cy - ry * 0.06 },
    ];

    flowerPositions.forEach(({ fx, fy }) => {
      ctx.fillStyle = '#ffffff';
      for (let a = 0; a < 5; a += 1) {
        const ang = (a * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(ang) * 2.2, fy + Math.sin(ang) * 2.2, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(fx, fy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * Dibuja los frutos que siguen en las plantas con acabado de arándano
   * pixel art realista (azul brillante con cáliz, morados y verdes).
   * @param {Array} plants
   * @param {import('./Camera.js').Camera} camera
   */
  drawFruits(plants, camera) {
    for (let i = 0; i < plants.length; i += 1) {
      const plant = plants[i];
      if (!plant.hasFruits) continue;
      if (!camera.isVisible({ x: plant.x - 20, y: plant.y - 20, w: 72, h: 72 })) continue;

      const fruits = plant.fruits;
      for (let f = 0; f < fruits.length; f += 1) {
        const fruit = fruits[f];
        if (fruit.collected) continue;

        const pos = plant.fruitPosition(fruit);
        const fx = Math.round(pos.x);
        const fy = Math.round(pos.y);

        this.#drawBerry(fx, fy, fruit);
      }
    }
  }

  /**
   * Dibuja un arándano individual (maduro azul, pintón púrpura o verde inmaduro).
   * Todos los frutos comparten el mismo tamaño y nítido contraste.
   */
  #drawBerry(x, y, fruit) {
    const ctx = this.ctx;
    const isRipe = fruit.type === 'RIPE';
    const isPurple = fruit.type === 'UNRIPE' && (fruit.variant % 2 === 1);
    const radius = 6.5;

    ctx.save();

    // Sombra del fruto en el follaje
    ctx.fillStyle = 'rgba(4, 16, 6, 0.45)';
    ctx.beginPath();
    ctx.arc(x + 1, y + 2, radius, 0, Math.PI * 2);
    ctx.fill();

    if (isRipe) {
      // Arándano maduro: azul zafiro/marino profundo con corona y reflejo
      ctx.fillStyle = '#0a1428';
      ctx.beginPath();
      ctx.arc(x, y, radius + 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Degradado azul
      const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, radius);
      grad.addColorStop(0, '#60a5fa');
      grad.addColorStop(0.35, '#2563eb');
      grad.addColorStop(0.85, '#1e3a8a');
      grad.addColorStop(1, '#172554');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Cáliz / corona central oscuro característico
      ctx.fillStyle = '#081024';
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x - 2, y - 0.6, 4, 1.2);
      ctx.fillRect(x - 0.6, y - 2, 1.2, 4);

      // Brillo especular blanco en luna creciente superior izquierda
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(x - 2.5, y - 2.5, 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(191, 219, 254, 0.55)';
      ctx.beginPath();
      ctx.arc(x - 1.2, y - 3.2, 1, 0, Math.PI * 2);
      ctx.fill();
    } else if (isPurple) {
      // Arándano pintón violeta/magenta (mismo tamaño, borde contrastado)
      ctx.fillStyle = '#2e1065';
      ctx.beginPath();
      ctx.arc(x, y, radius + 0.8, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, radius);
      grad.addColorStop(0, '#f472b6');
      grad.addColorStop(0.4, '#c026d3');
      grad.addColorStop(0.85, '#7e22ce');
      grad.addColorStop(1, '#4c1d95');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2e1065';
      ctx.beginPath();
      ctx.arc(x, y, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(x - 1.8, y - 0.5, 3.6, 1);
      ctx.fillRect(x - 0.5, y - 1.8, 1, 3.6);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(x - 2.5, y - 2.5, 1.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Arándano verde inmaduro: verde esmeralda puro, saturado y más oscuro con borde definido
      ctx.fillStyle = '#022c22';
      ctx.beginPath();
      ctx.arc(x, y, radius + 0.9, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, radius);
      grad.addColorStop(0, '#4ade80');
      grad.addColorStop(0.35, '#16a34a');
      grad.addColorStop(0.8, '#15803d');
      grad.addColorStop(1, '#064e3b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Cáliz oscuro central distintivo
      ctx.fillStyle = '#022c22';
      ctx.beginPath();
      ctx.arc(x, y, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
      ctx.fillRect(x - 1.8, y - 0.5, 3.6, 1);
      ctx.fillRect(x - 0.5, y - 1.8, 1, 3.6);

      // Brillo especular nítido para máximo contraste sobre el follaje
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.beginPath();
      ctx.arc(x - 2.5, y - 2.5, 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(187, 247, 208, 0.6)';
      ctx.beginPath();
      ctx.arc(x - 1.2, y - 3.2, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Cartel rústico de madera sobre poste (CESTA, SUPERVISOR, CAMIÓN).
   */
  drawWoodenSign(x, y, text) {
    const ctx = this.ctx;
    ctx.save();

    // Poste de madera
    ctx.fillStyle = '#3a200a';
    ctx.fillRect(Math.round(x - 2), Math.round(y), 4, 14);

    // Tablón de madera
    const paddingX = 8;
    ctx.font = 'bold 9px "Outfit", "Segoe UI", sans-serif';
    const textMetrics = ctx.measureText(text);
    const w = Math.max(46, Math.round(textMetrics.width + paddingX * 2));
    const h = 17;
    const bx = Math.round(x - w / 2);
    const by = Math.round(y - h);

    // Borde oscuro
    ctx.fillStyle = '#1d0f04';
    ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);

    // Cuerpo de madera
    ctx.fillStyle = '#784318';
    ctx.fillRect(bx, by, w, h);

    // Bisel superior iluminado
    ctx.fillStyle = '#a1612a';
    ctx.fillRect(bx, by, w, 2);

    // Bisel inferior en sombra
    ctx.fillStyle = '#45250b';
    ctx.fillRect(bx, by + h - 2, w, 2);

    // Clavos de esquina
    ctx.fillStyle = '#d4bb98';
    ctx.fillRect(bx + 2, by + 2, 2, 2);
    ctx.fillRect(bx + w - 4, by + 2, 2, 2);
    ctx.fillRect(bx + 2, by + h - 4, 2, 2);
    ctx.fillRect(bx + w - 4, by + h - 4, 2, 2);

    // Texto con contorno negro
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    for (let ox = -1; ox <= 1; ox += 1) {
      for (let oy = -1; oy <= 1; oy += 1) {
        if (ox !== 0 || oy !== 0) {
          ctx.fillText(text, x + ox, by + h / 2 + oy);
        }
      }
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, by + h / 2);

    ctx.restore();
  }

  /**
   * Burbuja de exclamación blanca con '!' rojo sobre el supervisor.
   */
  drawExclamationBubble(x, y) {
    const ctx = this.ctx;
    ctx.save();
    const w = 18;
    const h = 16;
    const bx = Math.round(x - w / 2);
    const by = Math.round(y - h);

    // Borde exterior oscuro
    ctx.fillStyle = '#1c1007';
    ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);

    // Cuerpo blanco de la burbuja
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx, by, w, h);

    // Rabito inferior
    ctx.fillStyle = '#1c1007';
    ctx.beginPath();
    ctx.moveTo(x - 3, by + h);
    ctx.lineTo(x, by + h + 5);
    ctx.lineTo(x + 3, by + h);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - 2, by + h - 1);
    ctx.lineTo(x, by + h + 4);
    ctx.lineTo(x + 2, by + h - 1);
    ctx.fill();

    // Signo de exclamación rojo
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(Math.round(x - 1.5), by + 2, 3, 7);
    ctx.fillRect(Math.round(x - 1.5), by + 11, 3, 3);

    ctx.restore();
  }

  /**
   * Dibuja una entidad con sprite (jugador, supervisor).
   * @param {object} entity
   * @param {import('./Camera.js').Camera} camera
   * @param {object} [options]
   */
  drawEntity(entity, camera, options = {}) {
    const isSupervisor = entity.isSupervisor || entity.spriteKey?.includes('supervisor');
    const ctx = this.ctx;

    // SUPERVISOR DE CALIDAD (idéntico a image.png: gorra azul, chaleco reflectante amarillo con 'CALIDAD')
    // Escala grande y proporcionada (46px x 70px) comparada con el player
    if (isSupervisor) {
      const sx = entity.x;
      const sy = entity.y;
      const sw = 46;
      const sh = 70;

      ctx.save();
      // Sombra bajo el supervisor
      this.sprites.drawShadow(sx, sy + sh * 0.38, sw * 0.44, 10, 0.35);

      const top = sy - sh * 0.45;

      // 1. Gorra azul de supervisor
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.ellipse(sx, top + 8, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Visera de la gorra
      ctx.fillStyle = '#172554';
      ctx.fillRect(sx - 11, top + 9, 22, 4);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(sx - 8, top + 4, 16, 4);

      // Pelo castaño y cabeza/cuello
      ctx.fillStyle = '#78350f';
      ctx.fillRect(sx - 9, top + 11, 18, 5);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(sx - 8, top + 13, 16, 8);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(sx - 10, top + 14, 2.5, 4);
      ctx.fillRect(sx + 7.5, top + 14, 2.5, 4);

      // 2. Camisa azul y Chaleco Reflectante Amarillo-Lima
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx - 17, top + 21, 34, 25);

      // Chaleco fluorescente
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(sx - 14, top + 21, 28, 24);

      // Franjas reflectantes plateadas
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(sx - 14, top + 24, 28, 3.5);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(sx - 14, top + 39, 28, 2.5);

      // LETRAS "CALIDAD" EN EL CHALECO
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CALIDAD', sx, top + 32);

      // Brazos con mangas azules y manos
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(sx - 18, top + 23, 5, 18);
      ctx.fillRect(sx + 13, top + 23, 5, 18);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(sx - 18, top + 39, 5, 5);
      ctx.fillRect(sx + 13, top + 39, 5, 5);

      // 3. Pantalones azul oscuro
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx - 12, top + 45, 9, 20);
      ctx.fillRect(sx + 3, top + 45, 9, 20);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx - 10, top + 46, 7, 18);
      ctx.fillRect(sx + 4, top + 46, 7, 18);

      // 4. Botas de trabajo marrones
      ctx.fillStyle = '#451a03';
      ctx.fillRect(sx - 13, top + 62, 10, 8);
      ctx.fillRect(sx + 3, top + 62, 10, 8);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(sx - 12, top + 63, 8, 5);
      ctx.fillRect(sx + 4, top + 63, 8, 5);

      ctx.restore();
      return;
    }

    const size = entity.width ?? 32;
    const drawW = options.width ?? size;
    const drawH = options.height ?? size;

    // Sombra bajo el personaje
    this.sprites.drawShadow(
      Math.round(entity.x),
      Math.round(entity.y + drawH * 0.34),
      drawW * 0.32,
      drawH * 0.14,
      0.28
    );

    const frame = options.frame ?? entity.frame ?? 0;

    this.sprites.draw(entity.spriteKey, entity.renderX ?? entity.x, entity.renderY ?? entity.y, {
      frame,
      frameSize: options.frameSize ?? 32,
      width: drawW,
      height: drawH,
      flipX: options.flipX ?? false,
      alpha: options.alpha ?? 1,
      tint: options.tint ?? null,
    });
  }

  /**
   * Gran Cesta / Bin de Cosecha Central (§14)
   * Cajón de madera ancho (116 x 74 px) con patas de palet, colmado de arándanos brillantes
   * y con la placa blanca frontal [🫐 28 / 50] (idéntico a image.png).
   */
  drawBasket(basket) {
    const ctx = this.ctx;
    const x = basket.x ?? 136;
    const y = basket.y ?? 548;
    const w = basket.width ?? 116;
    const h = basket.height ?? 74;

    ctx.save();

    // Sombra ovalada suave bajo el bin
    this.sprites.drawShadow(
      Math.round(x + w / 2),
      Math.round(y + h - 2),
      w * 0.46,
      12,
      0.38
    );

    // Patas / tacos de palet inferior
    ctx.fillStyle = '#3a1f0a';
    ctx.fillRect(x + 6, y + h - 10, 18, 10);
    ctx.fillRect(x + w / 2 - 9, y + h - 10, 18, 10);
    ctx.fillRect(x + w - 24, y + h - 10, 18, 10);

    ctx.fillStyle = '#6e3c15';
    ctx.fillRect(x + 7, y + h - 9, 16, 8);
    ctx.fillRect(x + w / 2 - 8, y + h - 9, 16, 8);
    ctx.fillRect(x + w - 23, y + h - 9, 16, 8);

    // Fondo oscuro interior de la cesta
    ctx.fillStyle = '#150c05';
    ctx.fillRect(x + 5, y + 2, w - 10, 26);

    // Arándanos cosechados dentro de la cesta (colina de arándanos)
    const berryCount = Math.max(16, Math.min(42, Math.round((basket.current / (basket.capacity || 50)) * 34) + 16));
    const berrySeed = [
      [10, 10], [22, 6], [34, 9], [46, 5], [58, 8], [70, 6], [82, 9], [94, 7], [102, 10],
      [16, 15], [28, 13], [40, 14], [52, 11], [64, 13], [76, 14], [88, 13], [98, 15],
      [12, 20], [24, 19], [36, 18], [48, 17], [60, 18], [72, 19], [84, 18], [96, 20],
      [30, 8], [42, 7], [54, 6], [66, 8], [78, 9], [18, 11], [90, 11],
      [8, 14], [104, 14], [38, 22], [56, 22], [74, 22], [92, 22]
    ];

    for (let i = 0; i < Math.min(berryCount, berrySeed.length); i++) {
      const [bx, by] = berrySeed[i];
      const px = x + 5 + bx;
      const py = y + by;

      // Base arándano azul profundo
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(px, py, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.arc(px, py, 4.8, 0, Math.PI * 2);
      ctx.fill();

      // Centro azul vibrante
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(px - 0.6, py - 0.6, 3.8, 0, Math.PI * 2);
      ctx.fill();

      // Brillo celeste
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(px - 1.5, py - 1.5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(px - 2, py - 2, 1.5, 1.5);

      // Estrella / cáliz oscuro
      ctx.fillStyle = '#091e42';
      ctx.fillRect(px + 0.8, py + 0.8, 2, 2);
    }

    // Estructura frontal de madera del bin
    const woodTop = y + 20;
    const woodH = h - 28;

    // Planchas horizontales de madera
    ctx.fillStyle = '#5c3210';
    ctx.fillRect(x, woodTop, w, woodH);

    ctx.fillStyle = '#9a5822';
    ctx.fillRect(x + 1, woodTop + 1, w - 2, woodH - 2);

    // Tablones horizontales
    const plankH = (woodH - 8) / 3;
    for (let p = 0; p < 3; p++) {
      const py = woodTop + 2 + p * (plankH + 2);
      ctx.fillStyle = '#b8742d';
      ctx.fillRect(x + 2, py, w - 4, plankH);
      ctx.fillStyle = '#cb873e';
      ctx.fillRect(x + 2, py, w - 4, 2.5);
      ctx.fillStyle = '#7a4214';
      ctx.fillRect(x + 2, py + plankH - 1, w - 4, 1.5);
    }

    // Postes esquineros verticales de refuerzo
    ctx.fillStyle = '#4a260b';
    ctx.fillRect(x, woodTop - 2, 9, woodH + 4);
    ctx.fillRect(x + w - 9, woodTop - 2, 9, woodH + 4);

    ctx.fillStyle = '#874919';
    ctx.fillRect(x + 1, woodTop - 1, 7, woodH + 2);
    ctx.fillRect(x + w - 8, woodTop - 1, 7, woodH + 2);

    ctx.fillStyle = '#c77e38';
    ctx.fillRect(x + 1, woodTop - 1, 2, woodH + 2);
    ctx.fillRect(x + w - 8, woodTop - 1, 2, woodH + 2);

    // Tornillos / remaches en las esquinas
    ctx.fillStyle = '#1c1007';
    ctx.fillRect(x + 3, woodTop + 3, 3, 3);
    ctx.fillRect(x + 3, woodTop + woodH - 6, 3, 3);
    ctx.fillRect(x + w - 6, woodTop + 3, 3, 3);
    ctx.fillRect(x + w - 6, woodTop + woodH - 6, 3, 3);

    // PLACA BLANCA FRONTAL CON ICONO DE ARÁNDANO Y CONTADOR [🫐 28 / 50] (Grande y Ultra Legible)
    const badgeW = 98;
    const badgeH = 29;
    const badgeX = x + (w - badgeW) / 2;
    const badgeY = woodTop + (woodH - badgeH) / 2 + 1;

    // Borde oscuro y sombra de la placa
    ctx.fillStyle = '#1e1005';
    ctx.fillRect(badgeX - 2, badgeY - 2, badgeW + 4, badgeH + 4);

    // Fondo blanco brillante de alta visibilidad
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

    // Icono pixel de arándano en la placa
    const iconX = badgeX + 14;
    const iconY = badgeY + 14.5;

    // Hojita verde
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(iconX - 1.5, iconY - 8, 3.5, 3.5);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(iconX - 3, iconY - 7, 3, 2.5);

    // Baya azul
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(iconX, iconY, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(iconX - 0.7, iconY - 0.7, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(iconX - 3, iconY - 3, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(iconX - 2.5, iconY - 2.5, 2, 2);

    // Texto de cantidad: "28 / 50" (Grande, negrita y negro puro para máxima legibilidad móvil)
    const countText = `${basket.current ?? 0} / ${basket.capacity ?? 50}`;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#090f1d';
    ctx.fillText(countText, iconX + 11, badgeY + badgeH / 2 + 1);

    // Destello al recibir frutos
    if (basket.flashTimer > 0) {
      ctx.globalAlpha = Math.min(0.5, basket.flashTimer * 2);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    }

    ctx.restore();
  }

  /**
   * Cajas de cosecha apiladas a la izquierda (§16).
   * Cluster escalonado amplio y visible idéntico a image.png.
   */
  drawBoxes(boxes) {
    const ctx = this.ctx;
    const crateStacks = [
      { x: 22, y: 598 },
      { x: 50, y: 598 }, { x: 50, y: 574 },
      { x: 78, y: 598 }, { x: 78, y: 574 }, { x: 78, y: 550 },
      { x: 106, y: 598 }, { x: 106, y: 574 }
    ];

    ctx.save();
    for (const { x, y } of crateStacks) {
      const cw = 26;
      const ch = 23;

      // Sombra
      this.sprites.drawShadow(x + cw / 2, y + ch, cw * 0.46, 6, 0.28);

      // Estructura de la caja de madera
      ctx.fillStyle = '#4a250a';
      ctx.fillRect(x, y, cw, ch);

      ctx.fillStyle = '#874919';
      ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);

      // Tablones exteriores
      ctx.fillStyle = '#b8742d';
      ctx.fillRect(x + 2, y + 2, cw - 4, 5);
      ctx.fillRect(x + 2, y + 8.5, cw - 4, 5);
      ctx.fillRect(x + 2, y + 15, cw - 4, 5);

      // Hueco interior oscuro
      ctx.fillStyle = '#261204';
      ctx.fillRect(x + 3.5, y + 3.5, cw - 7, 3);

      // Refuerzos esquineros
      ctx.fillStyle = '#5c3010';
      ctx.fillRect(x, y, 2.5, ch);
      ctx.fillRect(x + cw - 2.5, y, 2.5, ch);
      ctx.fillStyle = '#d48f44';
      ctx.fillRect(x + 0.5, y + 0.5, 1.2, ch - 1);
    }
    ctx.restore();
  }

  /**
   * Camión de reparto blanco (§16)
   * Gran tamaño y fidelidad (148 x 82 px) con tolva cargada (idéntico a image.png).
   */
  drawTruck(truck) {
    if (!truck.isVisible) return;
    const ctx = this.ctx;
    const x = truck.x ?? 296;
    const y = truck.y ?? 546;
    const w = truck.width ?? 148;
    const h = truck.height ?? 82;

    ctx.save();

    // Sombra del camión
    this.sprites.drawShadow(x + w / 2, y + h - 5, w * 0.46, 14, 0.38);

    // 1. Cajas de madera con arándanos en la tolva del camión
    const truckBoxes = [
      { bx: x + 8, by: y + 10 },
      { bx: x + 34, by: y - 2 },
      { bx: x + 62, by: y + 10 }
    ];

    for (const { bx, by } of truckBoxes) {
      const cw = 23;
      const ch = 20;
      // Caja
      ctx.fillStyle = '#4a250a';
      ctx.fillRect(bx, by, cw, ch);
      ctx.fillStyle = '#9a5822';
      ctx.fillRect(bx + 1, by + 1, cw - 2, ch - 2);
      ctx.fillStyle = '#b8742d';
      ctx.fillRect(bx + 2, by + 2, cw - 4, ch - 4);

      // Arándanos azules en la caja
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(bx + 6, by + 5, 4, 0, Math.PI * 2);
      ctx.arc(bx + 13, by + 4, 4, 0, Math.PI * 2);
      ctx.arc(bx + 18, by + 6, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(bx + 5, by + 4, 1.5, 1.5);
      ctx.fillRect(bx + 12, by + 3, 1.5, 1.5);
      ctx.fillRect(bx + 17, by + 5, 1.5, 1.5);
    }

    // 2. Plataforma / Tolva de carga blanca/plateada
    const bedX = x + 2;
    const bedY = y + 26;
    const bedW = 90;
    const bedH = 28;

    // Baranda / piso de la tolva
    ctx.fillStyle = '#334155';
    ctx.fillRect(bedX, bedY, bedW, bedH);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(bedX + 1, bedY + 1, bedW - 2, bedH - 2);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(bedX + 1, bedY + bedH - 5, bedW - 2, 4);

    // Barandas laterales de metal
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(bedX + 2, bedY + 2, bedW - 4, 4);
    ctx.fillRect(bedX + 2, bedY + 10, bedW - 4, 4);

    // Postes verticales de la tolva
    for (let px = bedX + 5; px < bedX + bedW - 5; px += 20) {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px, bedY, 2.5, bedH);
    }

    // 3. Cabina Blanca del Camión (Derecha)
    const cabX = x + 88;
    const cabY = y + 12;
    const cabW = 56;
    const cabH = 44;

    // Sombra de la cabina
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(cabX, cabY, cabW, cabH, [10, 5, 3, 0]);
    ctx.fill();

    // Cuerpo blanco de la cabina
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(cabX + 1, cabY + 1, cabW - 2, cabH - 2, [9, 4, 2, 0]);
    ctx.fill();

    // Sombreado inferior de la cabina
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(cabX + 1, cabY + 26, cabW - 2, cabH - 27);

    // Ventana / Parabrisas con tinte azul
    const winX = cabX + 7;
    const winY = cabY + 5;
    const winW = 26;
    const winH = 20;

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(winX - 1, winY - 1, winW + 2, winH + 2, 4);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, 3);
    ctx.fill();

    // Reflejo diagonal blanco en la ventana
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.moveTo(winX + 5, winY + 1);
    ctx.lineTo(winX + 11, winY + 1);
    ctx.lineTo(winX + 3, winY + winH - 2);
    ctx.lineTo(winX + 1, winY + winH - 2);
    ctx.closePath();
    ctx.fill();

    // Espejo retrovisor negro
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cabX + 3, cabY + 10, 4, 8);
    ctx.fillRect(cabX + 6, cabY + 13, 2.5, 2.5);

    // Manija de la puerta
    ctx.fillStyle = '#64748b';
    ctx.fillRect(cabX + 18, cabY + 28, 6, 2.5);

    // Faro delantero (luz halógena)
    const lightX = cabX + cabW - 8;
    const lightY = cabY + 24;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(lightX - 1, lightY - 1, 8, 9);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(lightX, lightY, 6, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(lightX + 1.5, lightY + 1.5, 3, 3);

    // Intermitente naranja
    ctx.fillStyle = '#f97316';
    ctx.fillRect(lightX, lightY + 7, 6, 2.5);

    // Paragolpes delantero plateado
    ctx.fillStyle = '#475569';
    ctx.fillRect(cabX + cabW - 5, cabY + 34, 8, 10);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cabX + cabW - 4, cabY + 35, 6, 8);

    // 4. Chasis inferior y Ruedas Negras con Llantas Plateadas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 14, y + 54, w - 22, 8);

    // Rueda Trasera (izquierda)
    const wheel1X = x + 32;
    const wheelY = y + 60;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(wheel1X, wheelY, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(wheel1X, wheelY, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(wheel1X, wheelY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(wheel1X, wheelY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Rueda Delantera (derecha)
    const wheel2X = cabX + 32;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(wheel2X, wheelY, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(wheel2X, wheelY, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(wheel2X, wheelY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(wheel2X, wheelY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /** Indicador de "puedes recoger" (§54). */
  drawHarvestIndicator(x, y, side, isUnripe = false) {
    const ctx = this.ctx;
    const color = isUnripe ? PALETTE.danger : PALETTE.warn;
    const dir = side === 'left' ? -1 : 1;

    ctx.save();
    ctx.globalAlpha = 0.9;

    // Triángulo apuntando al fruto
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(Math.round(x + dir * 4), Math.round(y - 5));
    ctx.lineTo(Math.round(x + dir * 4), Math.round(y + 5));
    ctx.lineTo(Math.round(x + dir * 11), Math.round(y));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /** Burbuja de diálogo (supervisor, avisos, §54) — Grande y Ultra Legible. */
  drawBubble(cx, cy, text, {
    color = '#090f1d',
    borderColor = '#38bdf8',
    textColor = '#ffffff',
    fontSize = 11,
  } = {}) {
    const ctx = this.ctx;
    const padding = 8;
    const textWidth = this.sprites.measureText(text, fontSize);
    const w = textWidth + padding * 2 + 6;
    const h = fontSize + padding * 2 + 2;

    // Se mantiene dentro de la pantalla lógica.
    const x = Math.round(Math.max(6, Math.min(this.width - w - 6, cx - w / 2)));
    const y = Math.round(Math.max(6, cy - h - 6));

    ctx.save();
    // Panel oscuro con borde nítido
    ctx.fillStyle = withAlpha(color, 0.94);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rabito inferior
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - 4, y + h);
    ctx.lineTo(cx + 4, y + h);
    ctx.lineTo(cx, y + h + 5);
    ctx.closePath();
    ctx.fill();

    this.sprites.drawText(text, x + w / 2, y + h / 2, {
      size: fontSize,
      color: textColor,
      align: 'center',
      baseline: 'middle',
    });
    ctx.restore();
  }

  /* ============================================================
     HUD (§34)
     ============================================================ */

  /**
   * Dibuja el HUD superior con los datos del nivel.
   * Diseñado primero para móvil: textos grandes y legibles.
   * @param {object} hud datos del estado
   */
  drawHud(hud) {
    const ctx = this.ctx;
    const h = GAME_CONFIG.hudHeight;

    // ---- Fondo del HUD ----
    ctx.save();
    ctx.fillStyle = withAlpha(PALETTE.panel, 0.94);
    ctx.fillRect(0, 0, this.width, h);
    ctx.fillStyle = PALETTE.panelBorder;
    ctx.fillRect(0, h - 2, this.width, 2);
    ctx.fillStyle = withAlpha('#000000', 0.3);
    ctx.fillRect(0, 0, this.width, 1);
    ctx.restore();

    // ---- Fila 1: NIVEL · TIEMPO · PAUSA ----
    const row1Y = 5;
    this.sprites.drawText(`NIVEL ${hud.level}/${hud.totalLevels}`, 6, row1Y, {
      size: 7,
      color: PALETTE.textSoft,
    });

    // Tiempo (centrado, cambia de color cuando queda poco — §22)
    const timeText = formatTime(hud.timeLeft);
    const dangerTime = hud.timeLeft <= 20;
    this.sprites.drawText(timeText, this.width / 2, row1Y, {
      size: 8,
      color: dangerTime ? PALETTE.danger : PALETTE.text,
      align: 'center',
    });

    // Botón de pausa visual (el toque lo maneja TouchControls/React)
    this.sprites.drawRect(this.width - 24, 3, 20, 16, PALETTE.panelLight, {
      borderColor: PALETTE.panelBorder,
      borderWidth: 1,
    });
    this.sprites.drawText('II', this.width - 14, 6, {
      size: 7,
      color: PALETTE.text,
      align: 'center',
    });

    // ---- Fila 2: COSECHADOS · ERRORES · CALIDAD · VIDAS ----
    const row2Y = 21;
    let x = 6;

    // Cosechados
    this.sprites.draw('ui.iconRipe', x, row2Y - 1, { frameSize: 16, width: 12, height: 12 });
    x += 15;
    const harvestText = `${hud.harvested}/${hud.target}`;
    this.sprites.drawText(harvestText, x, row2Y + 1, {
      size: 7,
      color: PALETTE.text,
    });
    x += this.sprites.measureText(harvestText, 7) + 8;

    // Errores
    this.sprites.draw('ui.iconError', x, row2Y - 1, { frameSize: 16, width: 12, height: 12 });
    x += 15;
    const errorText = `${hud.errors}`;
    this.sprites.drawText(errorText, x, row2Y + 1, {
      size: 7,
      color: hud.errors > 0 ? PALETTE.danger : PALETTE.textSoft,
    });
    x += this.sprites.measureText(errorText, 7) + 8;

    // Vidas (corazones)
    const lifeStartX = this.width - 6 - hud.lives * 13;
    for (let i = 0; i < hud.maxLives; i += 1) {
      this.sprites.draw(i < hud.lives ? 'ui.lifeFull' : 'ui.lifeEmpty', lifeStartX + i * 13, row2Y - 2, {
        frameSize: 16,
        width: 12,
        height: 12,
      });
    }

    // ---- Fila 3: Calidad (barra) + canasta ----
    const row3Y = 38;
    const barX = 6;
    const barW = this.width - 12;
    const barH = 7;

    // Etiqueta
    this.sprites.drawText('CALIDAD', barX, row3Y - 1, {
      size: 6,
      color: PALETTE.textDim,
    });
    const qualityLabelX = barX + 44;
    this.sprites.drawText(`${Math.round(hud.quality)}%`, qualityLabelX, row3Y - 1, {
      size: 6,
      color: hud.quality >= 90 ? PALETTE.ok : hud.quality >= 75 ? PALETTE.warn : PALETTE.danger,
    });

    // Barra
    const trackY = row3Y + 9;
    this.sprites.fillRect(barX, trackY, barW, barH, withAlpha('#000000', 0.5));
    const qualityColor =
      hud.quality >= 90 ? PALETTE.ok : hud.quality >= 75 ? PALETTE.warn : PALETTE.danger;
    const qualityW = Math.round((barW - 2) * clamp01(hud.quality / 100));
    this.sprites.fillRect(barX + 1, trackY + 1, qualityW, barH - 2, qualityColor);

    // Canasta: contador a la derecha de la barra
    const basketText = `CANASTA ${hud.basketCurrent}/${hud.basketCapacity}`;
    this.sprites.drawText(basketText, this.width - 6, trackY + barH + 2, {
      size: 6,
      color: hud.basketCurrent >= hud.basketCapacity ? PALETTE.warn : PALETTE.textSoft,
      align: 'right',
    });

    // Aviso de canasta llena (§14)
    if (hud.basketFull) {
      const pulse = 0.6 + Math.sin(Date.now() / 180) * 0.4;
      ctx.save();
      ctx.globalAlpha = pulse;
      this.sprites.drawText('CANASTA LLENA - REGRESA A ENTREGAR', this.width / 2, h - 10, {
        size: 6,
        color: PALETTE.warn,
        align: 'center',
      });
      ctx.restore();
    }

    // Alerta de tiempo (§22)
    if (dangerTime && hud.timeLeft > 0) {
      const pulse = 0.5 + Math.sin(Date.now() / 150) * 0.5;
      ctx.save();
      ctx.globalAlpha = pulse;
      this.sprites.fillRect(0, h - 2, this.width, 2, PALETTE.danger);
      ctx.restore();
    }
  }

  /**
   * Barra inferior con el temporizador del supervisor (§19).
   * Va sobre la zona de entrega, en la parte baja del canvas.
   */
  drawSupervisorTimer(hud) {
    if (hud.supervisorActive) return;

    const y = this.height - 26;
    const w = 150;
    const x = (this.width - w) / 2;

    this.sprites.drawRect(x, y, w, 20, withAlpha(PALETTE.panel, 0.9), {
      borderColor: PALETTE.panelBorder,
      borderWidth: 1,
    });

    this.sprites.drawText('SIGUIENTE REVISION', x + 6, y + 4, {
      size: 6,
      color: PALETTE.textDim,
    });

    this.sprites.drawText(formatTime(hud.supervisorTimer), x + w - 6, y + 4, {
      size: 7,
      color: hud.supervisorTimer <= 10 ? PALETTE.warn : PALETTE.text,
      align: 'right',
    });

    // Barra de progreso de la cuenta atrás
    const ratio = clamp01(1 - hud.supervisorTimer / Math.max(1, hud.supervisorInterval));
    this.sprites.fillRect(x + 5, y + 15, w - 10, 3, withAlpha('#000000', 0.5));
    this.sprites.fillRect(x + 5, y + 15, Math.round((w - 10) * ratio), 3, PALETTE.ok);
  }

  /**
   * Indicador contextual flotante sobre el jugador (§54):
   * "RECOGE", "ENTREGA", "NO RECOGER PINTÓN".
   */
  drawContextHint(x, y, text, { color = PALETTE.warn } = {}) {
    const w = this.sprites.measureText(text, 6) + 10;
    const h = 14;
    const px = Math.round(Math.max(4, Math.min(this.width - w - 4, x - w / 2)));
    const py = Math.round(y - 26);

    this.sprites.drawRect(px, py, w, h, withAlpha('#000000', 0.75), {
      borderColor: color,
      borderWidth: 1,
    });
    this.sprites.drawText(text, px + w / 2, py + h / 2, {
      size: 6,
      color,
      align: 'center',
      baseline: 'middle',
    });
  }

  /**
   * Overlay de pausa/estados (dentro del canvas, para que el juego
   * se vea congelado detrás).
   */
  drawOverlay(alpha = 0.6) {
    this.ctx.save();
    this.ctx.fillStyle = withAlpha('#000000', alpha);
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

export default Renderer;
