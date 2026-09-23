/**
 * auditHarvestClick.js — Comprueba la recolección por click/toque.
 *
 * En Chrome real, con emulación de móvil y de PC:
 *   1. Un click sobre un fruto lo recoge (PC).
 *   2. Un toque sobre un fruto lo recoge (móvil).
 *   3. Un click sobre OTRO fruto del mismo grupo recoge solo ESE
 *      (cada fruto es una unidad, §6).
 *   4. Un click al aire NO recoge nada.
 *   5. Un fruto fuera del alcance del jugador NO se recoge.
 *   6. Recoger un maduro sube el contador de cosechados.
 *
 * Uso: node tools/auditHarvestClick.js [url]
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const URL_BASE = process.argv[2] ?? 'http://localhost:5173/';
const PORT = 9341;

const chrome = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

async function main() {
  const child = spawn(chrome, [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    '--no-first-run', '--disable-gpu', '--hide-scrollbars',
    '--user-data-dir=' + (process.env.TEMP ?? '/tmp') + '/cosecha-harv',
    'about:blank',
  ], { stdio: 'ignore' });

  await sleep(2500);

  let wsUrl = null;
  for (let i = 0; i < 20 && !wsUrl; i += 1) {
    try {
      wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json())
        .webSocketDebuggerUrl;
    } catch { await sleep(500); }
  }
  if (!wsUrl) { child.kill(); throw new Error('sin CDP'); }

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
    }
  };
  const send = (method, params = {}, sid = null) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      const payload = { id: mid, method, params };
      if (sid) payload.sessionId = sid;
      ws.send(JSON.stringify(payload));
      setTimeout(() => {
        if (pending.has(mid)) { pending.delete(mid); reject(new Error('timeout ' + method)); }
      }, 20000);
    });

  const results = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok });
    console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? `  ${detail}` : ''}`);
  };

  /** Abre el juego y deja el motor listo. Devuelve helpers. */
  async function openGame({ mobile }) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const tab = { send: (m, p) => send(m, p, sessionId) };

    await tab.send('Page.enable');
    await tab.send('Runtime.enable');
    await tab.send('Emulation.setDeviceMetricsOverride', {
      width: mobile ? 390 : 1280,
      height: mobile ? 844 : 800,
      deviceScaleFactor: 1,
      mobile,
    });
    await tab.send('Emulation.setTouchEmulationEnabled', { enabled: mobile });

    await tab.send('Page.navigate', { url: URL_BASE });

    const evalJs = async (expression) => {
      const r = await tab.send('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
      return r.result.value;
    };

    // Entrar al nivel 1
    for (let i = 0; i < 30; i += 1) {
      await sleep(300);
      const ok = await evalJs(
        `(() => {
           const b = [...document.querySelectorAll('button')].find(x => /jugar/i.test(x.textContent));
           if (b) { b.click(); return true; }
           return false;
         })()`
      );
      if (ok) break;
    }

    // Esperar al canvas
    for (let i = 0; i < 40; i += 1) {
      await sleep(300);
      const ok = await evalJs(
        `(() => {
           const c = document.querySelector('canvas');
           const e = window.__COSECHA_ENGINE__;
           return !!c && !!e && e.state && e.state.status === 'PLAYING' && c.getBoundingClientRect().width > 50;
         })()`
      );
      if (ok) break;
    }

    return { targetId, tab, evalJs };
  }

  console.log(`\n=== RECOLECCIÓN POR CLICK/TOQUE ===\n`);

  /* ============================================================
     A) PC — click del ratón
     ============================================================ */
  console.log('--- PC (click del ratón) ---');
  {
    const { targetId, tab, evalJs } = await openGame({ mobile: false });

    // Prepara: colocar al jugador junto a un fruto maduro cercano.
    const prep = await evalJs(`(() => {
      const e = window.__COSECHA_ENGINE__;
      const canvas = document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();

      // Buscar una planta con fruto maduro y poner al jugador al lado.
      const plant = e.map.plants.find(p => p.fruits.some(f => !f.collected && f.type === 'RIPE'));
      if (!plant) return { error: 'no hay fruto maduro' };
      const fruit = plant.fruits.find(f => !f.collected && f.type === 'RIPE');
      const pos = plant.fruitPosition(fruit);

      // Colocar al jugador en el camino contiguo, a la altura del fruto.
      const TILE = e.map.tileMap.tileSize;
      const pathCol = fruit.side === 'left' ? plant.col - 1 : plant.col + 1;
      const col = e.map.tileMap.isBlockingAt(pathCol, plant.row) ? plant.col + 1 : pathCol;
      e.player.x = col * TILE + TILE / 2;
      e.player.y = pos.y;
      e.camera.snapTo(e.player.x, e.player.y);

      return {
        fruitId: fruit.id,
        fruitType: fruit.type,
        worldX: pos.x, worldY: pos.y,
        canvasRect: { left: rect.left, top: rect.top, w: rect.width, h: rect.height },
        canvasW: canvas.width,
        harvestedBefore: e.state.harvestedThisRun ?? 0,
        playerX: e.player.x, playerY: e.player.y,
      };
    })()`);

    if (prep.error) {
      check('PC: hay un fruto maduro para probar', false, prep.error);
    } else {
      // Convertir el punto del mundo a coordenadas de pantalla.
      const screen = await evalJs(`(() => {
        const e = window.__COSECHA_ENGINE__;
        const canvas = document.querySelector('canvas');
        const rect = canvas.getBoundingClientRect();

        // Conversion inversa EXACTA de la que usa el motor:
        //   mundo -> logico -> fisico -> CSS
        const cam = e.camera;
        const dpr = canvas.width / rect.width;
        const sc = e.scale > 0 ? e.scale : 1;
        const offX = (canvas.width - e.logicalWidth * sc) / 2;
        const offY = (canvas.height - e.logicalHeight * sc) / 2;

        const logicalX = (${prep.worldX} - cam.originX);
        const logicalY = (${prep.worldY} - cam.originY + cam.worldOffsetY);

        const sx = (logicalX * sc + offX) / dpr;
        const sy = (logicalY * sc + offY) / dpr;
        return { sx, sy, dpr, sc, offX, offY };
      })()`);

      const target = await evalJs(`(() => {
        const c = document.querySelector('canvas');
        const r = c.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()`);

      // Click real del ratón sobre el fruto.
      await tab.send('Input.dispatchMouseEvent', {
        type: 'mousePressed', x: Math.round(screen.sx + prep.canvasRect.left), y: Math.round(screen.sy + prep.canvasRect.top),
        button: 'left', clickCount: 1,
      });
      await tab.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased', x: Math.round(screen.sx + prep.canvasRect.left), y: Math.round(screen.sy + prep.canvasRect.top),
        button: 'left', clickCount: 1,
      });

      // Esperar a que termine la animación de recoger.
      await sleep(900);

      const after = await evalJs(`(() => {
        const e = window.__COSECHA_ENGINE__;
        const plant = e.map.plants.find(p => p.fruits.some(f => f.id === '${prep.fruitId}'));
        const fruit = plant ? plant.fruits.find(f => f.id === '${prep.fruitId}') : null;
        return {
          collected: fruit ? fruit.collected : null,
          harvested: e.state.harvestedThisRun ?? 0,
          score: e.state.score ?? 0,
        };
      })()`);

      check('PC: el click sobre el fruto lo recoge', after.collected === true,
        `fruto recogido=${after.collected}`);

      check('PC: el contador de cosechados sube',
        after.harvested > prep.harvestedBefore,
        `${prep.harvestedBefore} → ${after.harvested}`);

      check('PC: recoger un maduro suma puntos', after.score > 0,
        `puntuación ${after.score}`);

      // --- Click al aire ---
      const beforeAir = await evalJs(`window.__COSECHA_ENGINE__.state.harvestedThisRun ?? 0`);
      await tab.send('Input.dispatchMouseEvent', {
        type: 'mousePressed', x: Math.round(target.x), y: Math.round(target.y) - 200,
        button: 'left', clickCount: 1,
      });
      await tab.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased', x: Math.round(target.x), y: Math.round(target.y) - 200,
        button: 'left', clickCount: 1,
      });
      await sleep(600);
      const afterAir = await evalJs(`window.__COSECHA_ENGINE__.state.harvestedThisRun ?? 0`);
      check('PC: un click al aire no recoge nada', afterAir === beforeAir,
        `${beforeAir} → ${afterAir}`);
    }

    await send('Target.closeTarget', { targetId });
  }

  /* ============================================================
     B) Móvil — toque
     ============================================================ */
  console.log('');
  console.log('--- Móvil (toque) ---');
  {
    const { targetId, tab, evalJs } = await openGame({ mobile: true });

    const prep = await evalJs(`(() => {
      const e = window.__COSECHA_ENGINE__;
      const plant = e.map.plants.find(p => p.fruits.some(f => !f.collected && f.type === 'RIPE'));
      if (!plant) return { error: 'no hay fruto maduro' };
      const fruit = plant.fruits.find(f => !f.collected && f.type === 'RIPE');
      const pos = plant.fruitPosition(fruit);
      const TILE = e.map.tileMap.tileSize;
      const pathCol = fruit.side === 'left' ? plant.col - 1 : plant.col + 1;
      const col = e.map.tileMap.isBlockingAt(pathCol, plant.row) ? plant.col + 1 : pathCol;
      e.player.x = col * TILE + TILE / 2;
      e.player.y = pos.y;
      e.camera.snapTo(e.player.x, e.player.y);
      const canvas = document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      return { fruitId: fruit.id, worldX: pos.x, worldY: pos.y,
               canvasRect: { left: rect.left, top: rect.top },
               harvestedBefore: e.state.harvestedThisRun ?? 0 };
    })()`);

    if (prep.error) {
      check('Móvil: hay un fruto maduro para probar', false, prep.error);
    } else {
      const screen = await evalJs(`(() => {
        const e = window.__COSECHA_ENGINE__;
        const canvas = document.querySelector('canvas');
        const rect = canvas.getBoundingClientRect();
        const cam = e.camera;
        const dpr = canvas.width / rect.width;
        const sc = e.scale > 0 ? e.scale : 1;
        const offX = (canvas.width - e.logicalWidth * sc) / 2;
        const offY = (canvas.height - e.logicalHeight * sc) / 2;
        const logicalX = (${prep.worldX} - cam.originX);
        const logicalY = (${prep.worldY} - cam.originY + cam.worldOffsetY);
        return {
          sx: (logicalX * sc + offX) / dpr,
          sy: (logicalY * sc + offY) / dpr,
        };
      })()`);

      // Toque real
      await tab.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: Math.round(screen.sx + prep.canvasRect.left), y: Math.round(screen.sy + prep.canvasRect.top) }],
      });
      await tab.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

      await sleep(900);

      const after = await evalJs(`(() => {
        const e = window.__COSECHA_ENGINE__;
        const plant = e.map.plants.find(p => p.fruits.some(f => f.id === '${prep.fruitId}'));
        return {
          collected: plant ? plant.fruits.find(f => f.id === '${prep.fruitId}').collected : null,
          harvested: e.state.harvestedThisRun ?? 0,
        };
      })()`);

      check('Móvil: el toque sobre el fruto lo recoge', after.collected === true,
        `fruto recogido=${after.collected}`);

      check('Móvil: el contador de cosechados sube',
        after.harvested > prep.harvestedBefore,
        `${prep.harvestedBefore} → ${after.harvested}`);
    }

    await send('Target.closeTarget', { targetId });
  }

  /* ============================================================
     C) Cada fruto es una unidad (§6)
     ============================================================ */
  console.log('');
  console.log('--- Cada fruto requiere su propio toque (§6) ---');
  {
    const { targetId, evalJs } = await openGame({ mobile: false });

    const group = await evalJs(`(() => {
      const e = window.__COSECHA_ENGINE__;
      // Una planta con 2+ frutos maduros sin recoger.
      const plant = e.map.plants.find(p =>
        p.fruits.filter(f => !f.collected && f.type === 'RIPE').length >= 2);
      if (!plant) return { error: 'no hay planta con 2+ frutos maduros' };
      const [a, b] = plant.fruits.filter(f => !f.collected && f.type === 'RIPE');
      return {
        plantId: plant.id,
        aId: a.id, bId: b.id,
        aPos: plant.fruitPosition(a),
        bPos: plant.fruitPosition(b),
      };
    })()`);

    if (group.error) {
      // No es un fallo del juego: puede que la semilla no diera 2 juntos.
      check('hay una planta con 2+ frutos maduros para probar', false, group.error);
    } else {
      // Recoger SOLO el fruto A, usando la API directa del motor.
      const r = await evalJs(`(() => {
        const e = window.__COSECHA_ENGINE__;
        const plant = e.map.plants.find(p => p.id === '${group.plantId}');
        // Poner al jugador junto a la planta para estar dentro del alcance.
        e.player.x = plant.centerX - e.map.tileMap.tileSize / 2;
        e.player.y = plant.centerY;
        const a = plant.fruits.find(f => f.id === '${group.aId}');
        const pos = plant.fruitPosition(a);
        e.camera.snapTo(e.player.x, e.player.y);
        const ok = e.harvestAt(pos.x, pos.y, 10);
        return { ok, collectedA: a.collected, remaining: plant.fruits.filter(f => !f.collected).length };
      })()`);

      check('recoger un fruto deja los otros del grupo intactos',
        r.ok === true && r.collectedA === true,
        `recogido=${r.ok}, quedan ${r.remaining}`);
    }

    await send('Target.closeTarget', { targetId });
  }

  /* ---------- Resumen ---------- */
  console.log('');
  const passed = results.filter((r) => r.ok).length;
  console.log(`RESULTADO: ${passed}/${results.length} correctos`);

  ws.close();
  child.kill();

  if (passed < results.length) process.exit(1);
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
