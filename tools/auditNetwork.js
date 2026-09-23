/**
 * auditNetwork.js — Comprueba que TODOS los assets cargan por LAN.
 *
 * Abre el juego con la IP de la red (no localhost) en Chrome real y
 * verifica:
 *   1. No hay peticiones a localhost / 127.0.0.1.
 *   2. No hay peticiones fallidas (404, 500...).
 *   3. Los sprites se cargan de verdad (peticiones 200 a /assets/).
 *   4. No hay errores en la consola.
 *   5. El canvas recibe píxeles (el juego dibuja).
 *
 * Uso: node tools/auditNetwork.js [url]
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const URL_BASE = process.argv[2] ?? 'http://192.168.1.3:5173/';
const PORT = 9337;

const chrome = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

async function main() {
  const child = spawn(chrome, [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    '--no-first-run', '--disable-gpu', '--hide-scrollbars',
    '--user-data-dir=' + (process.env.TEMP ?? '/tmp') + '/cosecha-net',
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
  const events = [];

  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
    } else if (m.method) {
      events.push(m);
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
  await tab.send('Network.enable');
  await tab.send('Log.enable');

  await tab.send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  });

  console.log(`\n=== AUDITORÍA DE RED: ${URL_BASE} ===\n`);

  await tab.send('Page.navigate', { url: URL_BASE });
  await sleep(3000);

  // Entrar al juego para que cargue TODOS los sprites
  await tab.send('Runtime.evaluate', {
    expression: `(() => {
      const b = [...document.querySelectorAll('button')].find(x => /jugar/i.test(x.textContent));
      if (b) b.click();
    })()`,
  });
  await sleep(4000);

  /* ---------- Analizar peticiones ---------- */
  const requests = new Map();
  events.forEach((e) => {
    if (e.method === 'Network.requestWillBeSent') {
      requests.set(e.params.requestId, {
        url: e.params.request.url,
        type: e.params.type,
        status: null,
        failed: null,
      });
    }
    if (e.method === 'Network.responseReceived') {
      const r = requests.get(e.params.requestId);
      if (r) r.status = e.params.response.status;
    }
    if (e.method === 'Network.loadingFailed') {
      const r = requests.get(e.params.requestId);
      if (r) r.failed = e.params.errorText;
    }
  });

  const all = [...requests.values()];

  // 1. Peticiones a localhost / 127.0.0.1
  const localhostReqs = all.filter((r) =>
    /localhost|127\.0\.0\.1/i.test(r.url) && !r.url.startsWith('http://127.0.0.1:' + PORT)
  );

  // 2. Peticiones fallidas
  const failed = all.filter((r) => r.failed);

  // 3. Respuestas con error HTTP
  const httpErrors = all.filter((r) => r.status !== null && r.status >= 400);

  // 4. Sprites cargados
  const assets = all.filter((r) => /\/assets\/.*\.(png|wav|svg)$/i.test(r.url));
  const assetsOk = assets.filter((r) => r.status === 200);

  // 5. Errores de consola
  const consoleErrors = events
    .filter((e) => e.method === 'Log.entryAdded' && e.params.entry.level === 'error')
    .map((e) => e.params.entry.text)
    .filter((t) => !/favicon|DevTools/i.test(t));

  const runtimeErrors = events
    .filter((e) => e.method === 'Runtime.exceptionThrown')
    .map((e) => e.params.exceptionDetails?.text ?? 'error');

  /* ---------- 6. El canvas dibuja ---------- */
  const canvasInfo = await tab.send('Runtime.evaluate', {
    expression: `(() => {
      const c = document.querySelector('canvas');
      if (!c) return null;
      const ctx = c.getContext('2d');
      // Muestrear píxeles: si hay variedad, el juego está dibujando.
      const d = ctx.getImageData(0, 0, c.width, Math.min(c.height, 200)).data;
      const seen = new Set();
      for (let i = 0; i < d.length; i += 4 * 97) {
        seen.add((d[i] << 16) | (d[i+1] << 8) | d[i+2]);
      }
      return { w: c.width, h: c.height, distinctColors: seen.size };
    })()`,
    returnByValue: true,
  });

  /* ---------- Informe ---------- */
  const results = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok });
    console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? `  ${detail}` : ''}`);
  };

  console.log(`  Total de peticiones: ${all.length}`);
  console.log('');

  check('ninguna petición a localhost / 127.0.0.1', localhostReqs.length === 0,
    localhostReqs.length ? localhostReqs.map((r) => r.url).join(', ') : '');

  check('ninguna petición fallida', failed.length === 0,
    failed.length ? failed.slice(0, 3).map((r) => `${r.url}: ${r.failed}`).join(' | ') : '');

  check('ningún error HTTP (404/500)', httpErrors.length === 0,
    httpErrors.length ? httpErrors.slice(0, 3).map((r) => `${r.status} ${r.url}`).join(' | ') : '');

  check('los sprites cargan (200) por la IP de la red',
    assets.length > 0 && assetsOk.length === assets.length,
    `${assetsOk.length}/${assets.length} assets`);

  check('sin errores en consola', consoleErrors.length === 0,
    consoleErrors.slice(0, 3).join(' | '));

  check('sin excepciones de JavaScript', runtimeErrors.length === 0,
    runtimeErrors.slice(0, 3).join(' | '));

  const cInfo = canvasInfo.result.value;
  check('el canvas dibuja (contenido variado)', cInfo && cInfo.distinctColors > 5,
    cInfo ? `${cInfo.w}x${cInfo.h}, ${cInfo.distinctColors} colores distintos` : 'sin canvas');

  console.log('');
  const passed = results.filter((r) => r.ok).length;
  console.log(`RESULTADO: ${passed}/${results.length} correctos`);

  await send('Target.closeTarget', { targetId });
  ws.close();
  child.kill();

  if (passed < results.length) process.exit(1);
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
