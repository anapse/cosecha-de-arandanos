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
  drawTerrain(tileMap, camera) {
    const ts = tileMap.tileSize;
    const view = camera.viewRect;

    const col0 = Math.max(0, Math.floor(view.x / ts));
    const col1 = Math.min(tileMap.cols - 1, Math.floor((view.x + view.w) / ts));
    const row0 = Math.max(0, Math.floor(view.y / ts));
    const row1 = Math.min(tileMap.rows - 1, Math.floor((view.y + view.h) / ts));

    for (let row = row0; row <= row1; row += 1) {
      for (let col = col0; col <= col1; col += 1) {
        const type = tileMap.grid[row][col];
        this.#drawTile(type, col * ts, row * ts, ts, col, row);
      }
    }
  }

  #drawTile(type, x, y, size, col, row) {
    const sprites = this.sprites;

    switch (type) {
      case TILE_TYPES.PLANT_ROW:
        // Lecho de la hilera de cultivo: una BANDA CONTINUA, no una
        // baldosa por celda.
        //
        // Antes se dibujaba el mismo cuadro de tierra en cada celda y
        // encima una línea horizontal en cada tile: eso marcaba una
        // frontera dura cada 48px y hacía que la hilera pareciera una
        // cuadrícula de cuadrados de tierra (efecto "hoja de Excel").
        //
        // Ahora se rellena con un color plano y solo se añaden surcos
        // verticales largos, de modo que las celdas contiguas se leen
        // como una sola franja de tierra arada.
        this.#drawHedgeBed(x, y, size, col, row);
        break;

      case TILE_TYPES.PATH:
        sprites.draw('terrain.path', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.PATH_H:
        sprites.draw('terrain.pathH', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.CROSS:
        sprites.draw('terrain.cross', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.GRASS:
        sprites.draw('terrain.grass', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.FENCE:
        sprites.draw('terrain.fence', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.BORDER:
        sprites.draw('terrain.border', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.DELIVERY:
        sprites.draw('terrain.delivery', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.SOIL_LIGHT:
        sprites.draw('terrain.soilLight', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.SOIL:
      default:
        // Tierra del campo, en franjas continuas.
        //
        // Antes se alternaba soil/soilLight con (col+row) % 2, lo que
        // producía un TABLERO DE AJEDREZ: el campo entero se veía como
        // una cuadrícula de cuadrados claros y oscuros. Ahora la
        // variación es por COLUMNA, así que se lee como surcos
        // verticales de tierra, no como casillas.
        sprites.draw(col % 2 === 0 ? 'terrain.soil' : 'terrain.soilLight', x, y, {
          frameSize: size,
          width: size,
          height: size,
        });
        break;
    }
  }

  /**
   * Lecho continuo de una hilera de cultivo.
   *
   * Las celdas de una misma columna de cultivo deben leerse como UNA
   * sola franja de tierra arada. Para lograrlo:
   *
   *   - no se dibuja ninguna frontera horizontal entre celdas (antes
   *     había una línea por tile, que marcaba la cuadrícula)
   *   - los surcos son VERTICALES y atraviesan la celda de arriba
   *     abajo, así que se continúan de una celda a la siguiente
   *
   * @param {number} x posición x en el mundo
   * @param {number} y posición y en el mundo
   * @param {number} size lado del tile
   */
  #drawHedgeBed(x, y, size) {
    const ctx = this.ctx;
    const left = Math.round(x);
    const top = Math.round(y);

    // Base de tierra arada, algo más oscura que el suelo del campo
    // para que la hilera se distinga como zona de cultivo.
    ctx.fillStyle = PALETTE.soilDark ?? '#5b3f28';
    ctx.fillRect(left, top, size, size);

    // Surcos verticales: tres por celda, siempre en las mismas
    // posiciones relativas, de modo que siguen alineados entre celdas
    // contiguas y forman líneas largas.
    ctx.fillStyle = withAlpha(PALETTE.soilShadow ?? '#3d2a1a', 0.45);

    const groove = Math.max(2, Math.round(size / 16));
    for (let i = 1; i <= 3; i += 1) {
      const gx = left + Math.round((size * i) / 4);
      ctx.fillRect(gx, top, groove, size);
    }

    // Un borde interior a cada lado, para dar volumen al lecho.
    ctx.fillStyle = withAlpha(PALETTE.soilLight ?? '#7a5a3a', 0.35);
    ctx.fillRect(left, top, 1, size);
    ctx.fillRect(left + size - 1, top, 1, size);
  }

  /* ============================================================
     PAISAJE (§8)
     ------------------------------------------------------------
     La referencia muestra una franja vertical de profundidad:

        CIELO  →  MONTAÑAS  →  ÁRBOLES  →  (campo de cultivo)

     Se dibuja al principio del frame, ANTES del terreno, ocupando las
     primeras filas del mundo. Como el mundo es más alto que la pantalla
     y la cámara hace scroll, el paisaje queda arriba del todo y se ve
     al subir por el campo.
     ============================================================ */

  /**
   * Dibuja la franja de paisaje al inicio del mundo.
   *
   * @param {import('./Camera.js').Camera} camera
   * @param {object} layout { height, skyHeight, mountainHeight, treesY }
   */
  drawLandscape(camera, layout = {}) {
    const {
      height = 96,
      skyHeight = 42,
      mountainHeight = 30,
      treesY = 62,
    } = layout;

    const ctx = this.ctx;
    const vw = this.viewWidth;

    // Culling: si el paisaje no está en la vista, no se dibuja.
    if (!camera.isVisible({ x: 0, y: 0, w: vw, h: height }, 8)) return;

    // Parallax suave: el paisaje se mueve menos que el campo.
    const px = camera.originX * 0.35;

    /* ---------- 1. Cielo ---------- */
    // Sprite del catálogo, repetido horizontalmente para cubrir el ancho.
    const skyW = 128;
    for (let x = -Math.floor(px) - skyW; x < vw + skyW; x += skyW) {
      this.sprites.draw('env.sky', x, 0, {
        frameSize: 128, width: skyW, height: 64,
      });
    }
    // Relleno por si el sprite es más bajo que la franja de cielo
    if (skyHeight > 64) {
      ctx.fillStyle = '#5aa8e8';
      ctx.fillRect(0, 64, vw, skyHeight - 64);
    }

    /* ---------- 2. Nubes ---------- */
    // Se desplazan algo más rápido que el cielo, bajo las montañas.
    const cloudX = camera.originX * 0.5;
    for (let x = -Math.floor(cloudX) - 128; x < vw + 128; x += 128) {
      this.sprites.draw('env.clouds', x, 6, {
        frameSize: 128, width: 128, height: 64, alpha: 0.9,
      });
    }

    /* ---------- 3. Montañas ---------- */
    const mtnX = camera.originX * 0.4;
    const mtnY = skyHeight - 22;
    for (let x = -Math.floor(mtnX) - 128; x < vw + 128; x += 128) {
      this.sprites.draw('env.mountains', x, mtnY, {
        frameSize: 128, width: 128, height: 64,
      });
    }

    /* ---------- 4. Franja de césped y árboles ---------- */
    const grassY = skyHeight + mountainHeight - 6;
    ctx.fillStyle = '#4a7a3a';
    ctx.fillRect(0, grassY, vw, height - grassY);

    // Árboles repartidos por la franja (variante determinista)
    const treeSpacing = 54;
    const treeOffset = camera.originX * 0.55;
    const firstTree = Math.floor((treeOffset - treeSpacing) / treeSpacing) * treeSpacing;

    for (let i = 0; i < 14; i += 1) {
      const wx = firstTree + i * treeSpacing;
      const sx = wx - treeOffset;
      if (sx < -64 || sx > vw + 64) continue; // culling

      // Variante estable por posición (no cambia entre frames)
      const variant = ((wx / treeSpacing) | 0) % 3;
      const key = `env.treesTree${variant + 1}`;

      this.sprites.draw(key, sx, treesY - 26, {
        frameSize: 64, width: 44, height: 44,
      });
    }

    // Arbustos en el borde con el campo
    for (let i = 0; i < 10; i += 1) {
      const wx = firstTree + i * treeSpacing + 26;
      const sx = wx - treeOffset;
      if (sx < -32 || sx > vw + 32) continue;

      this.sprites.draw('env.treesBush', sx, grassY + 2, {
        frameSize: 32, width: 26, height: 26,
      });
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
   * Dibuja las plantas visibles. Solo las que ocupan la vista.
   * @param {Array<import('../entities/Plant.js').Plant>} plants
   * @param {import('./Camera.js').Camera} camera
   * @param {object} highlight info sobre la planta resaltada
   */
  drawPlants(plants, camera, highlight = null) {
    const ts = TILE_SIZE;

    for (let i = 0; i < plants.length; i += 1) {
      const plant = plants[i];
      const rect = { x: plant.x, y: plant.y, w: ts, h: ts };

      if (!camera.isVisible(rect, 16)) continue;

      // El sprite de planta mide 32x32 y se escala uniformemente
      // (scaleX == scaleY == 2) para que sea prominente sin deformar el
      // pixel art. 64x64 world px ensures las plantas se ven grandes y
      // reconocibles.
      const plantDrawSize = 64;
      this.sprites.draw(plant.spriteKey, plant.x, plant.y, {
        frameSize: 32,
        width: plantDrawSize,
        height: plantDrawSize,
      });

      // Marca sutil en la planta apuntada por el jugador.
      if (highlight && highlight.plantId === plant.id) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.35;
        this.ctx.fillStyle = highlight.color ?? PALETTE.warn;
        this.ctx.fillRect(Math.round(plant.x), Math.round(plant.y), ts, ts);
        this.ctx.restore();
      }
    }
  }

  /**
   * Dibuja los frutos que siguen en las plantas.
   * @param {Array} plants
   * @param {import('./Camera.js').Camera} camera
   */
  drawFruits(plants, camera) {
    for (let i = 0; i < plants.length; i += 1) {
      const plant = plants[i];
      if (!plant.hasFruits) continue;
      if (!camera.isVisible({ x: plant.x - 16, y: plant.y - 16, w: 64, h: 64 })) continue;

      const fruits = plant.fruits;
      for (let f = 0; f < fruits.length; f += 1) {
        const fruit = fruits[f];
        if (fruit.collected) continue;

        const pos = plant.fruitPosition(fruit);
        const key = fruit.type === 'RIPE' ? 'fruit.ripe' : 'fruit.unripe';
        // Fruto visible con tamaño uniforme, sin deformar (scaleX == scaleY).
        // 20px de ancho es lo suficientemente grande para ser distinguible
        // sin distorsionar el sprite.
        const fruitDrawSize = 20;

        this.sprites.draw(key, pos.x - fruitDrawSize / 2, pos.y - fruitDrawSize / 2, {
          frameSize: fruitDrawSize,
          width: fruitDrawSize,
          height: fruitDrawSize,
        });
      }
    }
  }

  /**
   * Dibuja una entidad con sprite (jugador, supervisor).
   * @param {object} entity
   * @param {import('./Camera.js').Camera} camera
   * @param {object} [options]
   */
  drawEntity(entity, camera, options = {}) {
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

  /** Canasta/caja de cosecha (§14). */
  drawBasket(basket) {
    this.sprites.drawShadow(
      Math.round(basket.centerX),
      Math.round(basket.y + basket.height * 0.85),
      basket.width * 0.4,
      basket.height * 0.16,
      0.25
    );

    this.sprites.draw(basket.spriteKey, basket.x, basket.y, {
      frameSize: TILE_SIZE,
      width: basket.width,
      height: basket.height,
    });

    // Destello al recibir frutos
    if (basket.flashTimer > 0) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.min(0.5, basket.flashTimer * 2);
      this.ctx.fillStyle = PALETTE.warn;
      this.ctx.fillRect(basket.x - 2, basket.y - 2, basket.width + 4, basket.height + 4);
      this.ctx.restore();
    }
  }

  /** Cajas de cosecha (§16). */
  drawBoxes(boxes) {
    for (let i = 0; i < boxes.length; i += 1) {
      const box = boxes[i];
      this.sprites.draw(box.spriteKey, box.x, box.y + box.offsetY, {
        frameSize: TILE_SIZE,
        width: box.width,
        height: box.height,
      });
    }
  }

  /** Camión (§16). */
  drawTruck(truck) {
    if (!truck.isVisible) return;
    this.sprites.draw(truck.spriteKey, truck.x, truck.y, {
      frame: truck.animationFrame,
      frameSize: 64,
      width: truck.width,
      height: truck.height,
    });
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

  /** Burbuja de diálogo (supervisor, avisos, §54). */
  drawBubble(cx, cy, text, {
    color = PALETTE.panel,
    borderColor = PALETTE.panelBorder,
    textColor = PALETTE.text,
    fontSize = 7,
  } = {}) {
    const ctx = this.ctx;
    const padding = 6;
    const textWidth = this.sprites.measureText(text, fontSize);
    const w = textWidth + padding * 2 + 4;
    const h = fontSize + padding * 2;

    // Se mantiene dentro de la pantalla lógica.
    const x = Math.round(Math.max(4, Math.min(this.width - w - 4, cx - w / 2)));
    const y = Math.round(Math.max(4, cy - h));

    ctx.save();
    // Panel
    this.sprites.drawRect(x, y, w, h, color, { borderColor, borderWidth: 1 });

    // Rabito inferior
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(cx - 2), y + h, 5, 4);

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
