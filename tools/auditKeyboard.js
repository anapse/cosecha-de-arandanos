/**
 * auditKeyboard.js — Comprueba los CONTROLES DE TECLADO en Chrome real.
 *
 * Verifica que en PC:
 *   1. NO se muestran los controles táctiles.
 *   2. Las flechas y WASD mueven al jugador.
 *   3. Al soltar la tecla, el jugador se detiene.
 *   4. La tecla de pausa (ESC/P) pausa el juego.
 *   5. El juego permanece centrado y sin scroll.
 *
 * Uso: node tools/auditKeyboard.js [url]
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const URL_BASE = process.argv[2] ?? 'http://localhost:5173/';
const PORT = 9336;

const chrome = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

/* Teclas por nombre CDP → código */
const KEYCODES = {
  ArrowUp:    { windowsVirtualKeyCode: 38, code: 'ArrowUp',    key: 'ArrowUp' },
  ArrowDown:  { windowsVirtualKeyCode: 40, code: 'ArrowDown',  key: 'ArrowDown' },
  ArrowLeft:  { windowsVirtualKeyCode: 37, code: 'ArrowLeft',  key: 'ArrowLeft' },
  ArrowRight: { windowsVirtualKeyCode: 39, code: 'ArrowRight', key: 'ArrowRight' },
  KeyW:       { windowsVirtualKeyCode: 87, code: 'KeyW',       key: 'w' },
  KeyA:       { windowsVirtualKeyCode: 65, code: 'KeyA',       key: 'a' },
  KeyS:       { windowsVirtualKeyCode: 83, code: 'KeyS',       key: 's' },
  KeyD:       { windowsVirtualKeyCode: 68, code: 'KeyD',       key: 'd' },
  Escape:     { windowsVirtualKeyCode: 27, code: 'Escape',     key: 'Escape' },
  KeyP:       { windowsVirtualKeyCode: 80, code: 'KeyP',       key: 'p' },
};

async function main() {
  const child = spawn(chrome, [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    '--no-first-run', '--disable-gpu', '--hide-scrollbars',
    '--user-data-dir=' + (process.env.TEMP ?? '/tmp') + '/cosecha-kbd',
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

  const evalJs = async (expression) => {
    const r = await tab.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };

  /* ---------- PC: 1366x768, sin táctil ---------- */
  await tab.send('Emulation.setDeviceMetricsOverride', {
    width: 1366, height: 768, deviceScaleFactor: 1, mobile: false,
  });
  await tab.send('Emulation.setTouchEmulationEnabled', { enabled: false });

  await tab.send('Page.navigate', { url: URL_BASE });
  await sleep(2500);

  await evalJs(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => /jugar/i.test(x.textContent));
    if (b) b.click();
  })()`);
  await sleep(3000);

  const results = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? `  ${detail}` : ''}`);
  };

  console.log(`\n=== CONTROLES DE TECLADO (PC 1366x768) ===\n`);

  /* ---------- 1. No hay controles táctiles visibles ---------- */
  const touchVisible = await evalJs(`(() => {
    const root = document.querySelector('[class*="touch-controls"]');
    if (!root) return false;
    const cs = getComputedStyle(root);
    const r = root.getBoundingClientRect();
    // Visible = tiene tamaño y no está oculto
    return cs.display !== 'none' && cs.visibility !== 'hidden'
      && Number(cs.opacity) > 0 && r.width > 0 && r.height > 0;
  })()`);

  check('en PC NO se muestran los controles táctiles', touchVisible === false,
    touchVisible ? 'aparecen (deberían ocultarse)' : '');

  /* ---------- 2. Mover con teclado ---------- */
  const readPos = () => evalJs(`(() => {
    const e = window.__COSECHA_ENGINE__;
    return e ? { x: e.player.x, y: e.player.y } : null;
  })()`);

  async function pressKey(name, holdMs) {
    const k = KEYCODES[name];
    await tab.send('Input.dispatchKeyEvent', {
      type: 'keyDown', ...k, nativeVirtualKeyCode: k.windowsVirtualKeyCode,
    });
    await sleep(holdMs);
    await tab.send('Input.dispatchKeyEvent', {
      type: 'keyUp', ...k, nativeVirtualKeyCode: k.windowsVirtualKeyCode,
    });
  }

  const engineOk = await evalJs(`!!window.__COSECHA_ENGINE__`);
  check('el motor está accesible para la prueba', engineOk,
    engineOk ? '' : 'falta window.__COSECHA_ENGINE__');

  if (engineOk) {
    // --- Flecha ARRIBA ---
    let before = await readPos();
    await pressKey('ArrowUp', 900);
    await sleep(250);
    let after = await readPos();
    check('Flecha ▲ mueve al jugador hacia arriba', after.y < before.y - 1,
      `y ${Math.round(before.y)} → ${Math.round(after.y)}`);

    // --- Flecha DERECHA ---
    before = await readPos();
    await pressKey('ArrowRight', 900);
    await sleep(250);
    after = await readPos();
    check('Flecha ▶ mueve al jugador hacia la derecha', after.x > before.x + 1,
      `x ${Math.round(before.x)} → ${Math.round(after.x)}`);

    // --- Tecla W ---
    before = await readPos();
    await pressKey('KeyW', 900);
    await sleep(250);
    after = await readPos();
    check('Tecla W mueve al jugador', after.y !== before.y,
      `y ${Math.round(before.y)} → ${Math.round(after.y)}`);

    // --- Se detiene al soltar ---
    const afterRelease = await readPos();
    await sleep(500);
    const still = await readPos();
    check('al soltar la tecla el jugador se detiene',
      Math.abs(still.x - afterRelease.x) <= 2 && Math.abs(still.y - afterRelease.y) <= 2,
      `(x,y) ${Math.round(still.x)},${Math.round(still.y)}`);
  }

  /* ---------- 3. Pausa con ESC ---------- */
  const statusBefore = await evalJs(`window.__COSECHA_ENGINE__?.state?.status`);
  await pressKey('Escape', 120);
  await sleep(700);
  const statusAfter = await evalJs(`window.__COSECHA_ENGINE__?.state?.status`);
  const pausedShown = await evalJs(`!!document.querySelector('[class*="pause"]')`);

  check('ESC pausa el juego',
    statusBefore !== statusAfter || pausedShown === true,
    `estado ${statusBefore} → ${statusAfter}${pausedShown ? ' (menú de pausa visible)' : ''}`);

  /* ---------- 4. Centrado y sin scroll ---------- */
  const geom = await evalJs(`(() => {
    const de = document.documentElement;
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    return {
      ratio: r.width / r.height,
      scrollX: de.scrollWidth <= de.clientWidth + 1,
      scrollY: de.scrollHeight <= de.clientHeight + 1,
      left: r.left,
      right: window.innerWidth - r.right,
    };
  })()`);

  check('canvas sin deformar (9:16)', Math.abs(geom.ratio - 9 / 16) < 0.02,
    `ratio ${geom.ratio.toFixed(3)}`);

  check('sin scroll en la página', geom.scrollX && geom.scrollY);

  check('el juego está centrado en PC', Math.abs(geom.left - geom.right) <= 3,
    `margen izq ${Math.round(geom.left)} vs der ${Math.round(geom.right)}`);

  /* ---------- Resumen ---------- */
  const passed = results.filter((r) => r.ok).length;
  console.log('');
  console.log(`RESULTADO: ${passed}/${results.length} correctos`);

  await send('Target.closeTarget', { targetId });
  ws.close();
  child.kill();

  if (passed < results.length) process.exit(1);
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
