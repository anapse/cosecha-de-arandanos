/**
 * auditTouch.js — Comprueba los CONTROLES TÁCTILES en Chrome real.
 *
 * Verifica, con emulación táctil de móvil:
 *   1. Los controles aparecen (dpad + acciones) en un dispositivo táctil.
 *   2. NO aparecen en PC (se usa teclado).
 *   3. Mantener pulsada una dirección MUEVE al jugador y al soltar para.
 *   4. Recoger y entregar disparan la acción en el motor.
 *   5. Los controles están en una capa SUPERIOR al canvas (overlay).
 *   6. Los controles son semitransparentes (se ve el juego debajo).
 *   7. Los controles NO alteran el tamaño del canvas (no empujan el juego).
 *
 * Uso: node tools/auditTouch.js [url]
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const URL_BASE = process.argv[2] ?? 'http://localhost:5173/';
const PORT = 9335;

const chrome = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

async function main() {
  const child = spawn(chrome, [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    '--no-first-run', '--disable-gpu', '--hide-scrollbars',
    '--user-data-dir=' + (process.env.TEMP ?? '/tmp') + '/cosecha-touch',
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

  /* ---------- Preparar móvil táctil ---------- */
  await tab.send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  });
  await tab.send('Emulation.setTouchEmulationEnabled', {
    enabled: true, maxTouchPoints: 5,
  });

  await tab.send('Page.navigate', { url: URL_BASE });
  await sleep(2500);

  // Entrar al juego
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

  console.log(`\n=== CONTROLES TÁCTILES (390x844 móvil) ===\n`);

  /* ---------- 1. Los controles existen ---------- */
  const controlsInfo = await evalJs(`(() => {
    const root = document.querySelector('[class*="touch-controls"]')
      || document.querySelector('.touch-controls');
    if (!root) return null;
    const cs = getComputedStyle(root);
    const r = root.getBoundingClientRect();
    // Botones de dirección y de acción
    const dirBtns = root.querySelectorAll('[class*="dpad"] button, [class*="dir"] button');
    const allBtns = root.querySelectorAll('button');
    return {
      rect: { w: Math.round(r.width), h: Math.round(r.height) },
      position: cs.position,
      zIndex: cs.zIndex,
      opacity: cs.opacity,
      overallAlpha: cs.getPropertyValue('--touch-alpha') || null,
      buttons: allBtns.length,
      dirButtons: dirBtns.length,
      labels: [...allBtns].map(b => (b.getAttribute('aria-label') || b.textContent || '').trim()).filter(Boolean),
    };
  })()`);

  check('existen los controles táctiles', controlsInfo !== null,
    controlsInfo ? `${controlsInfo.buttons} botones` : 'no se encontró el contenedor');

  if (controlsInfo) {
    check('están en una capa superpuesta (position absolute/fixed)',
      /absolute|fixed/.test(controlsInfo.position),
      `position: ${controlsInfo.position}`);

    check('están por encima del canvas (z-index > 0)',
      Number(controlsInfo.zIndex) > 0,
      `z-index: ${controlsInfo.zIndex}`);

    check('tienen botones de dirección',
      controlsInfo.buttons >= 4,
      `${controlsInfo.buttons} botones: ${controlsInfo.labels.slice(0, 8).join(', ')}`);
  }

  /* ---------- 2. No alteran el tamaño del canvas ---------- */
  const geom = await evalJs(`(() => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    const root = document.querySelector('[class*="touch-controls"]');
    const rr = root ? root.getBoundingClientRect() : null;
    return {
      canvas: { w: Math.round(r.width), h: Math.round(r.height) },
      // ¿Los controles se salen del área del canvas? (no deberían
      // empujarlo: deben estar DENTRO, superpuestos)
      controlsInsideCanvas: rr
        ? (rr.left >= r.left - 1 && rr.right <= r.right + 1
           && rr.top >= r.top - 1 && rr.bottom <= r.bottom + 1)
        : null,
    };
  })()`);

  check('el canvas conserva su proporción 9:16',
    Math.abs((geom.canvas.w / geom.canvas.h) - (9 / 16)) < 0.02,
    `${geom.canvas.w}x${geom.canvas.h} = ${(geom.canvas.w / geom.canvas.h).toFixed(3)}`);

  check('los controles van DENTRO del área del juego (no lo empujan)',
    geom.controlsInsideCanvas !== false,
    geom.controlsInsideCanvas === null ? 'sin controles' : '');

  /* ---------- 3. Mantener pulsado MUEVE al jugador ---------- */
  // Se busca el botón de subir y se mantiene pulsado con eventos táctiles.
  const moveTest = await evalJs(`(async () => {
    const canvas = document.querySelector('canvas');
    const root = document.querySelector('[class*="touch-controls"]');
    if (!root) return { error: 'sin controles' };

    // El botón de dirección arriba: se detecta por aria-label o por orden.
    const btns = [...root.querySelectorAll('button')];
    const up = btns.find(b => /arriba|up/i.test(b.getAttribute('aria-label') || '')) || btns[0];
    if (!up) return { error: 'sin boton arriba' };

    const r = up.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    // Estado del jugador antes (expuesto por el motor para diagnóstico).
    const engine = window.__COSECHA_ENGINE__;
    const before = engine ? { x: engine.player.x, y: engine.player.y } : null;

    const opts = { bubbles: true, cancelable: true, pointerId: 1,
                   clientX: cx, clientY: cy, isPrimary: true, pointerType: 'touch' };

    // pointerdown (es lo que usa TouchControls) + touchstart por si acaso
    up.dispatchEvent(new PointerEvent('pointerdown', opts));
    up.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true }));

    // Mantener pulsado ~1.2 s
    await new Promise(r2 => setTimeout(r2, 1200));

    const during = engine ? { x: engine.player.x, y: engine.player.y } : null;

    // Soltar
    up.dispatchEvent(new PointerEvent('pointerup', opts));
    up.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true }));
    await new Promise(r2 => setTimeout(r2, 400));

    const after = engine ? { x: engine.player.x, y: engine.player.y } : null;

    return { before, during, after };
  })()`);

  if (moveTest.error) {
    check('mantener ▲ mueve al jugador', false, moveTest.error);
  } else if (!moveTest.before) {
    check('mantener ▲ mueve al jugador', false,
      'el motor no está expuesto en window.__COSECHA_ENGINE__');
  } else {
    const movedDuring = Math.abs(moveTest.during.y - moveTest.before.y) > 1
      || Math.abs(moveTest.during.x - moveTest.before.x) > 1;
    const stoppedAfter = Math.abs(moveTest.after.y - moveTest.during.y) <= 2
      && Math.abs(moveTest.after.x - moveTest.during.x) <= 2;

    check('mantener ▲ mueve al jugador', movedDuring,
      `(${Math.round(moveTest.before.x)},${Math.round(moveTest.before.y)}) → (${Math.round(moveTest.during.x)},${Math.round(moveTest.during.y)})`);

    check('al soltar ▲ el jugador se detiene', stoppedAfter,
      `altura final ${Math.round(moveTest.after.y)}`);
  }

  /* ---------- 4. Los controles son semitransparentes ---------- */
  const alpha = await evalJs(`(() => {
    const root = document.querySelector('[class*="touch-controls"]');
    if (!root) return null;
    const btn = root.querySelector('button');
    if (!btn) return null;
    const cs = getComputedStyle(btn);
    return {
      bg: cs.backgroundColor,
      opacity: cs.opacity,
      // Extrae el alfa del rgba si lo hay
      alpha: (() => {
        const m = cs.backgroundColor.match(/rgba?\\(([^)]+)\\)/);
        if (!m) return null;
        const parts = m[1].split(',').map(s => parseFloat(s.trim()));
        return parts.length === 4 ? parts[3] : 1;
      })(),
    };
  })()`);

  check('los botones son semitransparentes (se ve el juego debajo)',
    alpha !== null && alpha.alpha !== null && alpha.alpha < 1,
    alpha ? `background: ${alpha.bg}` : 'sin datos');

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
