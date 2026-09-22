/**
 * HudRenderer.js
 * ---------------------------------------------------------------
 * Dibuja el HUD completo en el canvas, siguiendo la composición de la
 * imagen de referencia del proyecto.
 *
 * Layout de referencia (vertical, 360x640 lógicos):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ ┌──────────┐ ┌──────────────┐ ┌────────────┐  │  HUD superior
 *   │ │COSECHA DE│ │NIVEL:  1/12  │ │OBJETIVO:   │  │
 *   │ │ARÁNDANOS │ │TIEMPO: 01:45 │ │Recolecta   │  │
 *   │ │FUNDO SAN │ │COSECHADOS:28 │ │arándanos...│  │
 *   │ │JORGE-ICA │ │ERRORES:  1   │ │            │  │
 *   │ └──────────┘ └──────────────┘ └────────────┘  │
 *   ├──────────────────────────────────────────────┤
 *   │  🫐 Maduro (Recoge)                          │  Leyenda
 *   │  🩷 Pintón (No recoger)                      │
 *   │  ❌ Error  (Baja puntos)                     │
 *   ├──────────────────────────────────────────────┤
 *   │                 CAMPO                        │  Campo
 *   ├──────────────────────────────────────────────┤
 *   │ ┌──────┐ ┌──────────────┐ ┌───────────────┐  │  HUD inferior
 *   │ │VIDAS │ │ PUNTUACIÓN   │ │SIGUIENTE REV. │  │
 *   │ │❤❤❤  │ │    280       │ │ ▓▓▓░░  00:25  │  │
 *   │ └──────┘ └──────────────┘ └───────────────┘  │
 *   └──────────────────────────────────────────────┘
 *
 * Reglas:
 *   - Todo se dibuja con rectángulos y sprites YA existentes.
 *   - Cero suavizado: los sprites se pintan 1:1 sin deformar (§12, §10).
 *   - Nada de HTML flotante: el HUD vive dentro del canvas.
 */

import { PALETTE, withAlpha } from '../../utils/colors.js';
import { formatTime } from '../../utils/math.js';

/* ============================================================
   PALETA DEL HUD
   ============================================================ */
const HUD_COLORS = {
  panelDark: '#132a44',
  panelMid: '#1b3a5c',
  panelLight: '#254e78',
  panelBorder: '#4a7ba8',
  panelBorderHi: '#7aa8d0',
  wood: '#8b5a2b',
  woodLight: '#c98f4e',
  woodDark: '#5c3a17',
  text: '#ffffff',
  textSoft: '#cfe0f0',
  textDim: '#8fa8bd',
  gold: '#ffd93d',
  green: '#4fbf5a',
  greenLight: '#6ee87a',
  red: '#e2453c',
  pink: '#e8a0b4',
};

/* ============================================================
   TEXTO DEL OBJETIVO POR DEFECTO (§2)
   ============================================================ */
export const OBJETIVO_TEXT =
  'Recolecta arándanos maduros y llévalos a la canasta. Evita los pintones.';

/* ============================================================
   HUD RENDERER
   ============================================================ */
export class HudRenderer {
  /**
   * @param {import('./SpriteRenderer.js').SpriteRenderer} sprites
   */
  constructor(sprites) {
    this.sprites = sprites;
    /** Alto lógico de la ventana; lo fija GameEngine. */
    this.width = 360;
    this.height = 640;
    this.hudHeight = 62;
    this.bottomHeight = 46;
  }

  /** Ajusta las dimensiones lógicas. */
  resize(width, height, { hudHeight, bottomHeight } = {}) {
    this.width = width;
    this.height = height;
    if (hudHeight) this.hudHeight = hudHeight;
    if (bottomHeight) this.bottomHeight = bottomHeight;
  }

  /* ============================================================
     UTILIDADES DE DIBUJO
     ============================================================ */

  /**
   * Panel con bisel pixel art: borde oscuro, cuerpo, borde claro
   * arriba/izquierda y sombra abajo/derecha. Es el "look" de la
   * referencia.
   */
  panel(x, y, w, h, {
    fill = HUD_COLORS.panelMid,
    border = HUD_COLORS.panelBorder,
    borderHi = HUD_COLORS.panelBorderHi,
    dark = '#0a1a2a',
    alpha = 1,
  } = {}) {
    const ctx = this.sprites.ctx;
    ctx.save();
    if (alpha !== 1) ctx.globalAlpha = alpha;

    // Cuerpo + borde exterior
    ctx.fillStyle = dark;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    ctx.fillStyle = fill;
    ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, Math.round(w) - 2, Math.round(h) - 2);

    // Bisel: luz arriba/izquierda
    ctx.fillStyle = borderHi;
    ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, Math.round(w) - 2, 1);
    ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, 1, Math.round(h) - 2);

    // Sombra abajo/derecha
    ctx.fillStyle = border;
    ctx.fillRect(Math.round(x) + 1, Math.round(y) + Math.round(h) - 2, Math.round(w) - 2, 1);
    ctx.fillRect(Math.round(x) + Math.round(w) - 2, Math.round(y) + 1, 1, Math.round(h) - 2);

    ctx.restore();
  }

  /** Panel de madera (cartel del logo). */
  woodPanel(x, y, w, h) {
    const ctx = this.sprites.ctx;

    // Postes
    ctx.fillStyle = HUD_COLORS.woodDark;
    ctx.fillRect(x + 1, y + 3, 2, h - 1);
    ctx.fillRect(x + w - 3, y + 3, 2, h - 1);

    // Tabla
    ctx.fillStyle = HUD_COLORS.wood;
    ctx.fillRect(x, y, w, h - 3);

    // Bisel de la madera
    ctx.fillStyle = HUD_COLORS.woodLight;
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y, 1, h - 3);
    ctx.fillStyle = HUD_COLORS.woodDark;
    ctx.fillRect(x, y + h - 4, w, 1);
    ctx.fillRect(x + w - 1, y, 1, h - 3);

    // Vetas
    ctx.fillStyle = withAlpha(HUD_COLORS.woodLight, 0.4);
    ctx.fillRect(x + 3, y + Math.round(h * 0.5), w - 6, 1);
  }

  /** Barra rellenable con marco. */
  bar(x, y, w, h, ratio, color) {
    const ctx = this.sprites.ctx;

    // Fondo
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#22384e';
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

    // Relleno
    const fillW = Math.max(0, Math.min(w - 2, Math.round((w - 2) * ratio)));
    if (fillW > 0) {
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 1, fillW, h - 2);
      // Brillo superior del relleno
      ctx.fillStyle = withAlpha('#ffffff', 0.28);
      ctx.fillRect(x + 1, y + 1, fillW, 1);
    }
  }

  /** Texto con sombra dura (legible sobre cualquier fondo). */
  text(str, x, y, { size = 7, color = HUD_COLORS.text, align = 'left', shadow = true } = {}) {
    if (shadow) {
      this.sprites.drawText(str, x + 1, y + 1, {
        size, color: withAlpha('#000000', 0.65), align,
      });
    }
    this.sprites.drawText(str, x, y, { size, color, align });
  }

  /** Sprite del catálogo, dibujado 1:1 sin deformar. */
  sprite(key, x, y, { frame = 0, frameSize = 16, w = null, h = null } = {}) {
    this.sprites.draw(key, x, y, {
      frame,
      frameSize,
      width: w ?? frameSize,
      height: h ?? frameSize,
    });
  }

  /** Texto que se parte en varias líneas dentro de un ancho dado. */
  wrapText(str, x, y, maxWidth, { size = 6, color = HUD_COLORS.textSoft, lineHeight = 8 } = {}) {
    const words = String(str).split(' ');
    let line = '';
    let ly = y;

    for (let i = 0; i < words.length; i += 1) {
      const test = line ? `${line} ${words[i]}` : words[i];
      if (this.sprites.measureText(test, size) > maxWidth && line) {
        this.text(line, x, ly, { size, color });
        line = words[i];
        ly += lineHeight;
      } else {
        line = test;
      }
    }

    if (line) this.text(line, x, ly, { size, color });
    return ly + lineHeight;
  }

  /* ============================================================
     HUD SUPERIOR (§2)
     ============================================================ */

  /**
   * @param {object} hud datos del nivel (ver GameEngine.#hudData)
   */
  drawTop(hud) {
    const { ctx } = this.sprites;
    const W = this.width;
    const H = this.hudHeight;

    // ---- Fondo de la franja ----
    ctx.save();
    ctx.fillStyle = HUD_COLORS.panelDark;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = withAlpha('#000000', 0.35);
    ctx.fillRect(0, H - 2, W, 2);
    ctx.restore();

    const pad = 4;
    const top = 4;
    const panelH = H - 10;

    /* ---------- 1. Logo: COSECHA DE ARÁNDANOS ---------- */
    const logoW = 122;
    this.woodPanel(pad, top, logoW, panelH);

    // Arándano del logo (sprite real del catálogo)
    this.sprite('ui.hudLogoBerry', pad + 3, top + 5, { frameSize: 32, w: 20, h: 20 });

    this.text('COSECHA DE', pad + 25, top + 4, {
      size: 7, color: '#ffffff',
    });
    this.text('ARÁNDANOS', pad + 25, top + 12, {
      size: 7, color: '#ffffff',
    });
    this.text('FUNDO SAN JORGE - ICA', pad + 25, top + 22, {
      size: 5, color: '#ffe8b0',
    });

    /* ---------- 2. Estadísticas: NIVEL / TIEMPO / COSECHADOS / ERRORES ---------- */
    const statsX = pad + logoW + 4;
    const statsW = 108;
    this.panel(statsX, top, statsW, panelH);

    const rowH = 11;
    const statsRows = [
      {
        label: 'NIVEL:',
        value: `${hud.level} / ${hud.totalLevels}`,
        valueColor: HUD_COLORS.text,
      },
      {
        label: 'TIEMPO:',
        value: formatTime(hud.timeLeft),
        valueColor: hud.timeLeft <= 20 ? HUD_COLORS.red : HUD_COLORS.gold,
      },
      {
        label: 'COSECHADOS:',
        value: `${hud.harvested}`,
        valueColor: HUD_COLORS.text,
      },
      {
        label: 'ERRORES:',
        value: `${hud.errors}`,
        valueColor: hud.errors > 0 ? HUD_COLORS.red : HUD_COLORS.textSoft,
      },
    ];

    statsRows.forEach((row, i) => {
      const ry = top + 4 + i * rowH;
      this.text(row.label, statsX + 4, ry, { size: 6, color: HUD_COLORS.textDim });
      this.text(row.value, statsX + statsW - 4, ry, {
        size: 6, color: row.valueColor, align: 'right',
      });
    });

    /* ---------- 3. Objetivo ---------- */
    const objX = statsX + statsW + 4;
    const objW = W - objX - pad;
    this.panel(objX, top, objW, panelH);

    this.text('OBJETIVO:', objX + 4, top + 4, { size: 6, color: HUD_COLORS.gold });

    // El texto del objetivo se ajusta al nivel si lo define.
    const objetivo = hud.objective || OBJETIVO_TEXT;
    this.wrapText(objetivo, objX + 4, top + 13, objW - 8, {
      size: 5,
      color: HUD_COLORS.textSoft,
      lineHeight: 7,
    });

    /* ---------- 4. Barra de calidad (bajo las stats) ---------- */
    // Se dibuja como una fina franja inferior dentro del panel de stats
    // para no ocupar más alto.
    const qBarY = top + panelH - 7;
    const qBarW = statsW - 8;
    const qRatio = Math.max(0, Math.min(1, hud.quality / 100));
    const qColor =
      hud.quality >= 90 ? HUD_COLORS.green :
      hud.quality >= 75 ? HUD_COLORS.gold : HUD_COLORS.red;

    this.bar(statsX + 4, qBarY, qBarW - 22, 5, qRatio, qColor);
    this.text(`CALIDAD ${Math.round(hud.quality)}%`, statsX + qBarW - 20, qBarY - 1, {
      size: 5, color: qColor,
    });

    /* ---------- 5. Botón de pausa ---------- */
    const pauseX = W - pad - 18;
    // El botón vive dentro del panel de objetivo en la esquina.
    this.panel(pauseX, top + 1, 17, 16, {
      fill: HUD_COLORS.panelLight,
      border: HUD_COLORS.panelBorder,
    });
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pauseX + 5, top + 5, 2, 8);
    ctx.fillRect(pauseX + 10, top + 5, 2, 8);
    ctx.restore();

    // Aviso de tiempo crítico
    if (hud.timeLeft <= 20 && hud.timeLeft > 0) {
      const pulse = 0.45 + Math.sin(Date.now() / 150) * 0.45;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = HUD_COLORS.red;
      ctx.fillRect(0, H - 2, W, 2);
      ctx.restore();
    }
  }

  /* ============================================================
     LEYENDA DE FRUTOS (§3)
     ============================================================ */

  /**
   * Panel flotante con la leyenda Maduro / Pintón / Error.
   * Se coloca en la esquina superior derecha DEL CAMPO, flotando sobre
   * el mundo (no dentro del HUD), como en la referencia.
   *
   * @param {number} screenX posición en pantalla
   * @param {number} screenY
   */
  drawLegend(screenX, screenY) {
    const rowH = 15;
    const w = 84;
    const h = 8 + rowH * 3;

    this.panel(screenX, screenY, w, h, { alpha: 0.94 });

    const rows = [
      { icon: 'ui.iconsBlueberry', label: 'Maduro', sub: '(Recoge)', color: HUD_COLORS.greenLight },
      { icon: 'ui.iconsUnripe', label: 'Pintón', sub: '(No recoger)', color: HUD_COLORS.pink },
      { icon: 'ui.iconsError', label: 'Error', sub: '(Baja puntos)', color: HUD_COLORS.red },
    ];

    rows.forEach((row, i) => {
      const ry = screenY + 4 + i * rowH;

      // Icono del catálogo, 1:1
      this.sprite(row.icon, screenX + 4, ry, { frameSize: 16, w: 12, h: 12 });

      this.text(row.label, screenX + 19, ry, { size: 6, color: '#ffffff' });
      this.text(row.sub, screenX + 19, ry + 7, { size: 5, color: row.color });
    });
  }

  /* ============================================================
     HUD INFERIOR (§7)
     ============================================================ */

  /**
   * Tres paneles: VIDAS · PUNTUACIÓN · SIGUIENTE REVISIÓN.
   */
  drawBottom(hud) {
    const { ctx } = this.sprites;
    const W = this.width;
    const H = this.height;
    const barH = this.bottomHeight;
    const top = H - barH;

    // ---- Fondo ----
    ctx.save();
    ctx.fillStyle = HUD_COLORS.panelDark;
    ctx.fillRect(0, top, W, barH);
    ctx.fillStyle = withAlpha('#000000', 0.35);
    ctx.fillRect(0, top, W, 2);
    ctx.restore();

    const pad = 4;
    const panelTop = top + 4;
    const panelH = barH - 8;

    /* ---------- VIDAS ---------- */
    const lifeW = 84;
    this.panel(pad, panelTop, lifeW, panelH);

    this.text('VIDAS:', pad + 4, panelTop + 3, { size: 6, color: HUD_COLORS.textDim });

    const heartSize = 13;
    for (let i = 0; i < hud.maxLives; i += 1) {
      const key = i < hud.lives ? 'ui.heartFull'
        : i < hud.maxLives ? 'ui.heartMedium' : 'ui.heartEmpty';
      this.sprite(key, pad + 5 + i * (heartSize + 3), panelTop + 12, {
        frameSize: 16, w: heartSize, h: heartSize,
      });
    }

    /* ---------- PUNTUACIÓN ---------- */
    const scoreX = pad + lifeW + 4;
    const scoreW = 106;
    this.panel(scoreX, panelTop, scoreW, panelH, {
      fill: '#1a3350',
    });

    this.text('PUNTUACIÓN:', scoreX + scoreW / 2, panelTop + 3, {
      size: 6, color: HUD_COLORS.textDim, align: 'center',
    });
    this.text(`${hud.score}`, scoreX + scoreW / 2, panelTop + 13, {
      size: 10, color: HUD_COLORS.gold, align: 'center',
    });

    /* ---------- SIGUIENTE REVISIÓN ---------- */
    const revX = scoreX + scoreW + 4;
    const revW = W - revX - pad;
    this.panel(revX, panelTop, revW, panelH);

    this.text('SIGUIENTE REVISIÓN:', revX + 4, panelTop + 3, {
      size: 5, color: HUD_COLORS.textDim,
    });

    const active = hud.supervisorActive;
    const revRatio = active
      ? 1
      : Math.max(0, Math.min(1, 1 - hud.supervisorTimer / Math.max(1, hud.supervisorInterval)));

    this.bar(revX + 4, panelTop + 13, revW - 8, 8, revRatio,
      active ? HUD_COLORS.red : HUD_COLORS.green);

    this.text(
      active ? 'REVISANDO' : formatTime(hud.supervisorTimer),
      revX + revW - 6,
      panelTop + 14,
      { size: 6, color: active ? HUD_COLORS.red : HUD_COLORS.text, align: 'right' }
    );
  }

  /* ============================================================
     PANEL DE CANASTA (§5)
     ============================================================ */

  /**
   * Contador flotante sobre la canasta (o en pantalla), como el
   * "28 / 50" de la referencia.
   *
   * @param {number} x centro en pantalla
   * @param {number} y borde superior del panel
   * @param {number} current
   * @param {number} capacity
   * @param {boolean} full
   */
  drawBasketCounter(x, y, current, capacity, full = false) {
    const label = `${current} / ${capacity}`;
    const w = Math.max(56, this.sprites.measureText(label, 8) + 26);
    const h = 20;
    const px = Math.round(x - w / 2);
    const py = Math.round(y - h);

    this.panel(px, py, w, h, { fill: '#f0e4c8', border: '#8a7050', borderHi: '#ffffff' });

    // Arándano a la izquierda del contador
    this.sprite('ui.iconsBlueberry', px + 3, py + 3, { frameSize: 16, w: 14, h: 14 });

    this.sprites.drawText(label, px + w - 6, py + 5, {
      size: 8,
      color: full ? HUD_COLORS.red : '#3a2a15',
      align: 'right',
    });

    // Aviso de canasta llena
    if (full) {
      const pulse = 0.5 + Math.sin(Date.now() / 160) * 0.5;
      const ctx = this.sprites.ctx;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = HUD_COLORS.red;
      ctx.fillRect(px, py, w, 2);
      ctx.fillRect(px, py + h - 2, w, 2);
      ctx.restore();
    }
  }

  /* ============================================================
     BARRA SUPERIOR DE LA ZONA DE ENTREGA (§4)
     ============================================================ */

  /** Rótulo "ZONA DE ENTREGA" que separa el campo de la entrega. */
  drawDeliveryBanner(x, y, w, { label = 'ZONA DE ENTREGA', sub = null } = {}) {
    const h = sub ? 26 : 18;
    const px = Math.round(x);
    const py = Math.round(y);

    this.woodPanel(px, py, w, h);
    this.text(label, px + w / 2, py + 4, {
      size: 7, color: '#ffffff', align: 'center',
    });
    if (sub) {
      this.text(sub, px + w / 2, py + 14, {
        size: 5, color: '#ffe8b0', align: 'center',
      });
    }
  }

  /* ============================================================
     INDICADOR "ENTREGAR" (§4)
     ============================================================ */

  /** Flecha verde que señala la canasta cuando se puede entregar. */
  drawDeliverArrow(x, y, t = 0) {
    // Rebote suave para llamar la atención
    const bob = Math.round(Math.sin(t) * 2);

    this.sprites.ctx.save();
    this.sprites.ctx.globalAlpha = 0.95;
    this.sprite('ui.promptsDeliverArrow', x, y + bob, {
      frameSize: 24, w: 22, h: 22,
    });
    this.sprites.ctx.restore();
  }
}

export { HUD_COLORS };
export default HudRenderer;
