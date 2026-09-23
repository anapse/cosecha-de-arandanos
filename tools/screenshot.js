/**
 * screenshot.js — Captura el juego a PNG para revisión visual.
 *
 * Uso: node tools/screenshot.js [salida.png] [ancho] [alto] [movil] [url]
 * Ej.: node tools/screenshot.js tools/shot-movil.png 390 844 1
 *
 * Abre el juego en Chrome headless, entra al nivel 1 y guarda una
 * captura. Sirve para comparar el resultado con la referencia visual.
 */

import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const OUT = process.argv[2] ?? 'tools/shot.png';
const W = Number(process.argv[3] ?? 390);
const H = Number(process.argv[4] ?? 844);
const MOBILE = process.argv[5] !== '0';
const URL_BASE = process.argv[6] ?? 'http://localhost:5173/';
const PORT = 9340;

const chrome = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

async function main() {
  const child = spawn(chrome, [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    '--no-first-run', '--disable-gpu', '--hide-scrollbars',
    '--user-data-dir=' + (process.env.TEMP ?? '/tmp') + '/cosecha-shot',
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
    width: W, height: H, deviceScaleFactor: 2, mobile: MOBILE,
  });
  await tab.send('Emulation.setTouchEmulationEnabled', { enabled: MOBILE });

  await tab.send('Page.navigate', { url: URL_BASE });

  // Entrar al juego
  for (let i = 0; i < 30; i += 1) {
    await sleep(300);
    const ok = await tab.send('Runtime.evaluate', {
      expression: `(() => {
        const b = [...document.querySelectorAll('button')].find(x => /jugar/i.test(x.textContent));
        if (b) { b.click(); return true; }
        return false;
      })()`,
      returnByValue: true,
    });
    if (ok.result.value) break;
  }

  // Esperar a que el canvas dibuje
  for (let i = 0; i < 30; i += 1) {
    await sleep(300);
    const ok = await tab.send('Runtime.evaluate', {
      expression: `(() => {
        const c = document.querySelector('canvas');
        if (!c) return false;
        const r = c.getBoundingClientRect();
        return r.width > 50;
      })()`,
      returnByValue: true,
    });
    if (ok.result.value) break;
  }

  // Dejar correr un poco para que se muevan animaciones
  await sleep(2000);

  const shot = await tab.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });

  writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log(`Captura guardada: ${OUT} (${W}x${H}${MOBILE ? ' movil' : ''})`);

  await send('Target.closeTarget', { targetId });
  ws.close();
  child.kill();
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
