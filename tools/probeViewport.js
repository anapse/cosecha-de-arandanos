/**
 * probeViewport.js — Inspecciona UN tamaño con detalle.
 *
 * Uso: node tools/probeViewport.js <ancho> <alto> [movil] [url]
 * Ej.: node tools/probeViewport.js 360 640 1
 *
 * Muestra las medidas de html, body, .app, .game-viewport y canvas para
 * ver qué regla CSS está encogiendo el juego.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const W = Number(process.argv[2] ?? 360);
const H = Number(process.argv[3] ?? 640);
const MOBILE = process.argv[4] !== '0';
const URL_BASE = process.argv[5] ?? 'http://localhost:5173/';
const PORT = 9334;

const chrome = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

async function main() {
  const child = spawn(chrome, [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    '--no-first-run', '--disable-gpu', '--hide-scrollbars',
    '--user-data-dir=' + (process.env.TEMP ?? '/tmp') + '/cosecha-probe',
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
      }, 15000);
    });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const tab = { send: (m, p) => send(m, p, sessionId) };

  await tab.send('Page.enable');
  await tab.send('Runtime.enable');
  await tab.send('Emulation.setDeviceMetricsOverride', {
    width: W, height: H, deviceScaleFactor: MOBILE ? 2 : 1, mobile: MOBILE,
  });
  await tab.send('Emulation.setTouchEmulationEnabled', { enabled: MOBILE });

  await tab.send('Page.navigate', { url: URL_BASE });
  await sleep(2500);

  // Entrar al juego
  await tab.send('Runtime.evaluate', {
    expression: `(() => {
      const b = [...document.querySelectorAll('button')].find(x => /jugar/i.test(x.textContent));
      if (b) b.click();
    })()`,
  });
  await sleep(2500);

  const expr = `(() => {
    const info = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        w: Math.round(r.width), h: Math.round(r.height),
        x: Math.round(r.x),
        cssW: cs.width, cssH: cs.height,
        aspect: cs.aspectRatio,
        maxW: cs.maxWidth, maxH: cs.maxHeight,
        display: cs.display,
      };
    };
    const c = document.querySelector('canvas');
    return JSON.stringify({
      screen: [window.innerWidth, window.innerHeight],
      html: info('html'),
      body: info('body'),
      root: info('#root'),
      app: info('.app'),
      viewport: info('.game-viewport'),
      shell: info('.game-shell'),
      canvas: info('canvas'),
      canvasBuf: c ? [c.width, c.height] : null,
      canvasStyle: c ? c.getAttribute('style') : null,
    }, null, 2);
  })()`;

  const res = await tab.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  console.log(`\n=== ${W}x${H} ${MOBILE ? '(móvil)' : '(PC)'} ===`);
  console.log(res.result.value);

  await send('Target.closeTarget', { targetId });
  ws.close();
  child.kill();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
