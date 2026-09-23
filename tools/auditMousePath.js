/**
 * auditMousePath.js — Aísla si el fallo del click en PC está en el
 * evento del navegador o en la lógica del motor.
 *
 * Llama directamente a engine.harvestAtScreen() con coordenadas
 * calculadas igual que las del ratón. Si esto funciona, el problema
 * está en cómo llega el evento; si no, está en la conversión.
 *
 * Uso: node tools/auditMousePath.js [url]
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const URL_BASE = process.argv[2] ?? 'http://localhost:5173/';
const PORT = 9342;

const chrome = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

async function main() {
  const child = spawn(chrome, [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    '--no-first-run', '--disable-gpu', '--hide-scrollbars',
    '--user-data-dir=' + (process.env.TEMP ?? '/tmp') + '/cosecha-mouse',
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

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const tab = { send: (m, p) => send(m, p, sessionId) };

  await tab.send('Page.enable');
  await tab.send('Runtime.enable');
  await tab.send('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 800, deviceScaleFactor: 1, mobile: false,
  });

  const evalJs = async (expression) => {
    const r = await tab.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };

  await tab.send('Page.navigate', { url: URL_BASE });

  for (let i = 0; i < 30; i += 1) {
    await sleep(300);
    if (await evalJs(`(() => { const b=[...document.querySelectorAll('button')].find(x=>/jugar/i.test(x.textContent)); if(b){b.click();return true;} return false; })()`)) break;
  }
  for (let i = 0; i < 40; i += 1) {
    await sleep(300);
    if (await evalJs(`(() => { const c=document.querySelector('canvas'); const e=window.__COSECHA_ENGINE__; return !!c&&!!e&&e.state&&e.state.status==='PLAYING'&&c.getBoundingClientRect().width>50; })()`)) break;
  }

  console.log(`\n=== DIAGNÓSTICO DEL CLICK EN PC ===\n`);

  // 1) ¿Se recibe pointerdown en el canvas?
  await evalJs(`(() => {
    window.__PD_COUNT__ = 0;
    window.__PD_LAST__ = null;
    const c = document.querySelector('canvas');
    if (!window.__PD_WIRED__) {
      c.addEventListener('pointerdown', (e) => {
        window.__PD_COUNT__ += 1;
        window.__PD_LAST__ = { x: e.clientX, y: e.clientY, button: e.button, type: e.pointerType };
      });
      window.__PD_WIRED__ = true;
    }
    return true;
  })()`);

  // 2) Preparar fruto maduro y colocar al jugador
  const prep = await evalJs(`(() => {
    const e = window.__COSECHA_ENGINE__;
    const plant = e.map.plants.find(p => p.fruits.some(f => !f.collected && f.type === 'RIPE'));
    if (!plant) return { error: 'sin fruto maduro' };
    const fruit = plant.fruits.find(f => !f.collected && f.type === 'RIPE');
    const pos = plant.fruitPosition(fruit);
    const TILE = e.map.tileMap.tileSize;
    const pathCol = fruit.side === 'left' ? plant.col - 1 : plant.col + 1;
    const col = e.map.tileMap.isBlockingAt(pathCol, plant.row) ? plant.col + 1 : pathCol;
    e.player.x = col * TILE + TILE / 2;
    e.player.y = pos.y;
    e.camera.snapTo(e.player.x, e.player.y);

    // Coordenadas de pantalla del fruto
    const canvas = document.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const cam = e.camera;
    const sx = (pos.x - cam.originX) * scale + rect.left;
    const sy = (pos.y - cam.originY + cam.worldOffsetY) * scale + rect.top;

    // Verificación: ¿qué devuelve screenToWorldWithHud para ese punto?
    const back = cam.screenToWorldWithHud(sx - rect.left, sy - rect.top, scale);

    return {
      fruitId: fruit.id,
      worldX: pos.x, worldY: pos.y,
      screenX: sx, screenY: sy,
      rectLeft: rect.left, rectTop: rect.top,
      canvasW: canvas.width, canvasH: canvas.height,
      rectW: rect.width, rectH: rect.height,
      scale,
      // ida y vuelta
      backX: back.x, backY: back.y,
      roundTripOk: Math.abs(back.x - pos.x) < 0.5 && Math.abs(back.y - pos.y) < 0.5,
      isTouchDevice: e.isTouchDevice,
      toleranceMouse: e.harvestSystem ? null : null,
      // ¿está dentro del alcance?
      playerX: e.player.x, playerY: e.player.y,
      reach: e.harvestSystem.reach,
    };
  })()`);

  console.log('Preparación:');
  console.log(`  fruto en mundo   (${prep.worldX}, ${prep.worldY})`);
  console.log(`  fruto en pantalla(${Math.round(prep.screenX)}, ${Math.round(prep.screenY)})`);
  console.log(`  rect canvas      left=${prep.rectLeft} top=${prep.rectTop} size=${Math.round(prep.rectW)}x${Math.round(prep.rectH)}`);
  console.log(`  buffer canvas    ${prep.canvasW}x${prep.canvasH}   scale=${prep.scale.toFixed(3)}`);
  console.log(`  ida y vuelta     (${prep.backX.toFixed(1)}, ${prep.backY.toFixed(1)})  ${prep.roundTripOk ? 'OK' : 'FALLA'}`);
  console.log(`  jugador          (${Math.round(prep.playerX)}, ${Math.round(prep.playerY)})  alcance=${prep.reach}`);
  console.log(`  isTouchDevice    ${prep.isTouchDevice}`);
  console.log('');

  // 3) Llamada DIRECTA a la API (sin evento)
  const direct = await evalJs(`(() => {
    const e = window.__COSECHA_ENGINE__;
    const before = e.state.harvestedThisRun;
    const ok = e.harvestAt(${prep.worldX}, ${prep.worldY}, 8);
    return { ok, before, after: e.state.harvestedThisRun };
  })()`);
  console.log(`API directa harvestAt(): devolvió ${direct.ok}, contador ${direct.before} -> ${direct.after}`);
  console.log('');

  // 4) Vía harvestAtScreen (la que usa el click)
  await evalJs(`(() => {
    // Reset: devolver el fruto a su sitio no es posible; se usa otro fruto.
    const e = window.__COSECHA_ENGINE__;
    e.state.harvestedThisRun = 0;
    return true;
  })()`);

  const viaScreen = await evalJs(`(() => {
    const e = window.__COSECHA_ENGINE__;
    const canvas = document.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    // Segundo fruto maduro
    const plant = e.map.plants.find(p => p.fruits.some(f => !f.collected && f.type === 'RIPE'));
    if (!plant) return { error: 'sin segundo fruto' };
    const fruit = plant.fruits.find(f => !f.collected && f.type === 'RIPE');
    const pos = plant.fruitPosition(fruit);
    const TILE = e.map.tileMap.tileSize;
    const pathCol = fruit.side === 'left' ? plant.col - 1 : plant.col + 1;
    const col = e.map.tileMap.isBlockingAt(pathCol, plant.row) ? plant.col + 1 : pathCol;
    e.player.x = col * TILE + TILE / 2;
    e.player.y = pos.y;
    e.camera.snapTo(e.player.x, e.player.y);

    const sx = (pos.x - e.camera.originX) * scale;   // relativo al canvas
    const sy = (pos.y - e.camera.originY + e.camera.worldOffsetY) * scale;
    const before = e.state.harvestedThisRun;
    const ok = e.harvestAtScreen(sx, sy, scale);
    return { ok, before, after: e.state.harvestedThisRun, sx, sy };
  })()`);

  console.log(`harvestAtScreen(): devolvió ${viaScreen.ok}, contador ${viaScreen.before} -> ${viaScreen.after}`);
  console.log('');

  // 5) Evento real de ratón
  const pdBefore = await evalJs(`window.__PD_COUNT__`);
  await tab.send('Input.dispatchMouseEvent', {
    type: 'mousePressed', x: Math.round(prep.screenX), y: Math.round(prep.screenY),
    button: 'left', clickCount: 1,
  });
  await tab.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: Math.round(prep.screenX), y: Math.round(prep.screenY),
    button: 'left', clickCount: 1,
  });
  await sleep(500);
  const pdAfter = await evalJs(`window.__PD_COUNT__`);
  const pdLast = await evalJs(`window.__PD_LAST__`);

  console.log(`Evento de ratón: pointerdown recibidos ${pdBefore} -> ${pdAfter}`);
  console.log(`  último: ${JSON.stringify(pdLast)}`);

  ws.close();
  child.kill();
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
