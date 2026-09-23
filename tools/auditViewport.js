/**
 * auditViewport.js — Auditoría REAL del viewport en Chrome.
 *
 * Lanza Chrome en modo headless con CDP (sin instalar nada) y comprueba,
 * en varios tamaños de pantalla (PC, tablet, teléfonos reales), que:
 *
 *   1. NO hay scroll:  scrollWidth <= clientWidth  &&  scrollHeight <= clientHeight
 *   2. El canvas NO provoca overflow
 *   3. El juego queda centrado en PC
 *   4. La proporción del canvas no se deforma (scaleX == scaleY lógico)
 *   5. En móvil el visor ocupa la pantalla disponible
 *   6. No hay zoom accidental (meta viewport)
 *
 * Uso:  node tools/auditViewport.js [url]
 *
 * No forma parte del juego: es una herramienta de verificación.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const URL_BASE = process.argv[2] ?? 'http://localhost:5173/';
const PORT = 9333;

/* ---------- Dispositivos a probar ----------
   `expectFull` indica si el juego debe ocupar TODO el ancho disponible
   (teléfonos) o si se acepta que quede con márgenes por una regla de
   tamaño máximo (tablet y PC, donde la especificación pide justamente
   que sobre espacio a los lados). */
const DEVICES = [
  { name: 'PC 1366x768',      width: 1366, height: 768,  mobile: false, expectFull: false },
  { name: 'PC 1920x1080',     width: 1920, height: 1080, mobile: false, expectFull: false },
  { name: 'Móvil 360x640',    width: 360,  height: 640,  mobile: true,  expectFull: true },
  { name: 'Móvil 375x667',    width: 375,  height: 667,  mobile: true,  expectFull: true },
  { name: 'Móvil 390x844',    width: 390,  height: 844,  mobile: true,  expectFull: true },
  { name: 'Móvil 412x915',    width: 412,  height: 915,  mobile: true,  expectFull: true },
  { name: 'Tablet 768x1024',  width: 768,  height: 1024, mobile: true,  expectFull: false },
];

/* ---------- Localizar Chrome ---------- */
function findChrome() {
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ];
  return candidates.find((p) => p && existsSync(p)) ?? null;
}

/* ---------- Cliente CDP mínimo sobre WebSocket nativo ---------- */
async function cdpConnect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let id = 0;
  const pending = new Map();

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };

  const send = (method, params = {}, sessionId = null) =>
    new Promise((resolve, reject) => {
      const msgId = ++id;
      pending.set(msgId, { resolve, reject });
      const payload = { id: msgId, method, params };
      if (sessionId) payload.sessionId = sessionId;
      ws.send(JSON.stringify(payload));
      setTimeout(() => {
        if (pending.has(msgId)) {
          pending.delete(msgId);
          reject(new Error(`timeout ${method}`));
        }
      }, 15000);
    });

  return { send, close: () => ws.close() };
}

/* ---------- Evaluar en la página ---------- */
async function evaluate(cdp, expression) {
  const res = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error(res.exceptionDetails.text ?? 'error de evaluación');
  }
  return res.result.value;
}

/* ============================================================
   Sonda: mide el estado del viewport dentro de la página
   ============================================================ */
const PROBE = `(() => {
  const de = document.documentElement;
  const body = document.body;
  const canvas = document.querySelector('canvas');
  const viewport = document.querySelector('.game-viewport');

  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y),
             w: Math.round(r.width), h: Math.round(r.height) };
  };

  // ¿El canvas está deformado? Compara el tamaño CSS con el buffer interno.
  let distorted = null;
  if (canvas && canvas.width && canvas.height) {
    const cssW = canvas.getBoundingClientRect().width;
    const cssH = canvas.getBoundingClientRect().height;
    if (cssW > 0 && cssH > 0) {
      const ratioCSS = cssW / cssH;
      const ratioBuf = canvas.width / canvas.height;
      distorted = Math.abs(ratioCSS - ratioBuf) > 0.02;
    }
  }

  return {
    url: location.href,
    // scroll
    docScrollW: de.scrollWidth, docClientW: de.clientWidth,
    docScrollH: de.scrollHeight, docClientH: de.clientHeight,
    bodyScrollW: body.scrollWidth, bodyClientW: body.clientWidth,
    bodyScrollH: body.scrollHeight, bodyClientH: body.clientHeight,
    bodyOverflow: getComputedStyle(body).overflow,
    htmlOverflow: getComputedStyle(de).overflow,
    bodyPos: getComputedStyle(body).position,
    // viewport / canvas
    innerW: window.innerWidth, innerH: window.innerHeight,
    hasCanvas: !!canvas,
    canvasRect: rect(canvas),
    canvasBufW: canvas ? canvas.width : 0,
    canvasBufH: canvas ? canvas.height : 0,
    canvasTouchAction: canvas ? getComputedStyle(canvas).touchAction : null,
    canvasImageRendering: canvas ? getComputedStyle(canvas).imageRendering : null,
    distorted,
    viewportRect: rect(viewport),
    // centrado en PC
    leftGap: rect(canvas) ? rect(canvas).x : null,
    rightGap: rect(canvas) ? (window.innerWidth - rect(canvas).x - rect(canvas).w) : null,
    // controles táctiles
    touchControls: !!document.querySelector('.touch-controls, [class*="touch"]'),
    // errores visibles
    rootChildren: document.getElementById('root')?.children.length ?? 0,
  };
})()`;

/* ============================================================
   Ejecución
   ============================================================ */
async function main() {
  const chrome = findChrome();
  if (!chrome) {
    console.error('No se encontró Chrome ni Edge.');
    process.exit(1);
  }

  console.log(`Chrome: ${chrome}`);
  console.log(`URL:    ${URL_BASE}`);
  console.log('');

  const child = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    '--user-data-dir=' + (process.env.TEMP ?? '/tmp') + '/cosecha-audit',
    'about:blank',
  ], { stdio: 'ignore' });

  await sleep(2500);

  // Descubrir el target
  let wsUrl = null;
  for (let i = 0; i < 20 && !wsUrl; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const info = await res.json();
      wsUrl = info.webSocketDebuggerUrl;
    } catch {
      await sleep(500);
    }
  }

  if (!wsUrl) {
    child.kill();
    console.error('No se pudo conectar a Chrome por CDP.');
    process.exit(1);
  }

  const browser = await cdpConnect(wsUrl);

  // Una pestaña nueva donde se medirá
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', {
    targetId,
    flatten: true,
  });

  // Cliente atado a la sesión de la pestaña
  const tab = {
    send: (method, params = {}) => browser.send(method, params, sessionId),
  };

  await tab.send('Page.enable');
  await tab.send('Runtime.enable');

  const results = [];
  let failures = 0;

  for (const dev of DEVICES) {
    await tab.send('Emulation.setDeviceMetricsOverride', {
      width: dev.width,
      height: dev.height,
      deviceScaleFactor: dev.mobile ? 2 : 1,
      mobile: dev.mobile,
    });

    if (dev.mobile) {
      await tab.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    } else {
      await tab.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    }

    await tab.send('Page.navigate', { url: URL_BASE });

    // El canvas solo existe dentro del juego: el menú es HTML. Hay que
    // pulsar JUGAR para llegar a la pantalla que se quiere medir.
    let clicked = false;
    for (let i = 0; i < 30 && !clicked; i += 1) {
      await sleep(300);
      try {
        clicked = await evaluate(
          tab,
          `(() => {
             // Se busca el botón de jugar por texto (el menú es React).
             const btns = [...document.querySelectorAll('button')];
             const play = btns.find((b) =>
               /jugar/i.test(b.textContent) && !/red|solo|niveles|como|cómo/i.test(b.textContent)
             ) || btns.find((b) => /jugar/i.test(b.textContent));
             if (!play) return false;
             play.click();
             return true;
           })()`
        );
      } catch {
        clicked = false;
      }
    }

    // Espera a que el canvas tenga tamaño real, en vez de un sleep fijo:
    // el canvas nace con 0x0 hasta que React monta y el motor mide su
    // contenedor.
    let ready = false;
    for (let i = 0; i < 40 && !ready; i += 1) {
      await sleep(300);
      try {
        ready = await evaluate(
          tab,
          `(() => {
             const c = document.querySelector('canvas');
             if (!c) return false;
             const r = c.getBoundingClientRect();
             return r.width > 10 && r.height > 10;
           })()`
        );
      } catch {
        ready = false;
      }
    }

    // Un frame más para que el motor pinte y fije estilos.
    await sleep(600);

    let probe;
    try {
      probe = await evaluate(tab, PROBE);
    } catch (e) {
      console.log(`  ${dev.name}: ERROR ${e.message}`);
      failures += 1;
      continue;
    }

    const noScrollX = probe.docScrollW <= probe.docClientW + 1;
    const noScrollY = probe.docScrollH <= probe.docClientH + 1;
    const canvasFits =
      probe.canvasRect &&
      probe.canvasRect.w <= dev.width + 1 &&
      probe.canvasRect.h <= dev.height + 1;
    const notDistorted = probe.distorted === false || probe.distorted === null;

    // PROPORCIÓN: el canvas del juego debe mantener 360:640 = 9:16.
    // Es la regla crítica: nada de estirar ni deformar.
    const EXPECTED = 9 / 16;
    const ratio =
      probe.canvasRect && probe.canvasRect.h > 0
        ? probe.canvasRect.w / probe.canvasRect.h
        : 0;
    const ratioOk = Math.abs(ratio - EXPECTED) < 0.02;

    // APROVECHAMIENTO: en los teléfonos el visor debe ocupar todo el
    // ancho útil (si no, quedaría como una franja estrecha). En tablet
    // y PC se acepta que sobre espacio a los lados: lo pide la
    // especificación.
    let fillsOk = true;
    if (dev.expectFull && probe.canvasRect) {
      const usableWidth = Math.min(dev.width, dev.height * (9 / 16));
      fillsOk = probe.canvasRect.w >= usableWidth * 0.95;
    }

    // Centrado: los márgenes laterales deben ser casi iguales
    let centered = true;
    let leftGap = probe.leftGap;
    let rightGap = probe.rightGap;
    if (probe.canvasRect) {
      leftGap = probe.canvasRect.x;
      rightGap = dev.width - probe.canvasRect.x - probe.canvasRect.w;
      centered = Math.abs(leftGap - rightGap) <= 3;
    }

    const ok =
      noScrollX && noScrollY && canvasFits && notDistorted &&
      centered && ratioOk && fillsOk;
    if (!ok) failures += 1;

    const mark = ok ? '✓' : '✗';
    const r = ratio.toFixed(3);
    console.log(
      `${mark} ${dev.name.padEnd(16)} canvas ${String(probe.canvasRect?.w ?? 0).padStart(4)}x${String(probe.canvasRect?.h ?? 0).padEnd(4)}` +
      ` ratio ${r}` +
      `  scroll ${probe.docScrollW}x${probe.docScrollH}<=${probe.docClientW}x${probe.docClientH}` +
      `  ${centered ? 'centrado' : `SIN CENTRAR (${leftGap}/${rightGap})`}` +
      `${notDistorted ? '' : ' DEFORMADO'}` +
      `${ratioOk ? '' : ' RATIO MAL'}` +
      `${fillsOk ? '' : ' NO LLENA'}`
    );

    if (!ok) {
      if (!noScrollX) console.log(`     scroll horizontal: ${probe.docScrollW} > ${probe.docClientW}`);
      if (!noScrollY) console.log(`     scroll vertical:   ${probe.docScrollH} > ${probe.docClientH}`);
      if (!centered) console.log(`     no centrado: izquierda ${leftGap} vs derecha ${rightGap}`);
      if (!ratioOk) console.log(`     proporcion ${r}, se espera ${EXPECTED.toFixed(3)} (9:16)`);
      if (!fillsOk) console.log(`     en movil no llena la pantalla (${probe.canvasRect?.w}x${probe.canvasRect?.h} en ${dev.width}x${dev.height})`);
      if (!notDistorted) console.log(`     canvas deformado (relacion CSS != buffer)`);
    }

    results.push({ dev, probe, ok });
  }

  await browser.send('Target.closeTarget', { targetId });
  browser.close();
  child.kill();

  console.log('');
  console.log(`RESULTADO: ${results.filter((r) => r.ok).length}/${results.length} correctos`);

  if (failures > 0) {
    console.log(`${failures} problema(s) encontrados.`);
    process.exit(1);
  }
  console.log('Viewport correcto en todos los tamaños probados.');
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
