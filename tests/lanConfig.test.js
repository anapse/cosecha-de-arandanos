/**
 * lanConfig.test.js — Comprueba que el juego puede servirse por LAN.
 *
 * El juego es 100% INDIVIDUAL: no hay multijugador ni servidor de
 * partidas. Lo único que se verifica aquí es que OTRO dispositivo de la
 * misma red (otra PC, un teléfono) pueda DESCARGAR el juego: HTML, JS y
 * sprites. Cada dispositivo juega después su propia partida.
 *
 * Estos ajustes se rompen con facilidad (alguien cambia el host, mete
 * una ruta absoluta, fija una IP...), así que se comprueban aquí en vez
 * de descubrirlo cuando un móvil no carga los sprites.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { uniquePaths, ASSET_MANIFEST, SOUND_MANIFEST } from '../src/data/assets.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const viteConfig = readFileSync(join(ROOT, 'vite.config.js'), 'utf8');
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8');

describe('Servido por LAN (el juego sigue siendo individual)', () => {
  it('Vite escucha en toda la red, no solo en localhost', () => {
    // Sin host:true, el móvil no puede abrir el juego: su "localhost"
    // es el propio teléfono, no la PC.
    expect(viteConfig).toMatch(/host:\s*true/);
  });

  it('el puerto es fijo para que la dirección compartida no cambie', () => {
    expect(viteConfig).toMatch(/strictPort:\s*true/);
    expect(viteConfig).toMatch(/port:\s*5173/);
  });

  it('`npm run preview` (build de producción) también escucha en la red', () => {
    expect(viteConfig).toMatch(/preview:\s*\{[\s\S]*host:\s*true/);
  });

  it('el build usa rutas relativas', () => {
    // Con base '/', los assets se piden a la raíz del dominio y fallan
    // si el juego se sirve desde una subcarpeta.
    expect(viteConfig).toMatch(/base:\s*'\.\/'/);
  });
});

describe('Assets con rutas locales/relativas', () => {
  it('NINGUNA ruta de asset es absoluta', () => {
    const absolute = uniquePaths().filter((p) => p.startsWith('/'));
    expect(
      absolute,
      `Rutas absolutas (fallarían fuera de la raíz del dominio):\n${absolute.join('\n')}`
    ).toEqual([]);
  });

  it('NINGUNA ruta de asset depende de un host o CDN', () => {
    const remote = uniquePaths().filter((p) => /^(https?:)?\/\//.test(p));
    expect(
      remote,
      `Rutas remotas (el juego debe funcionar sin Internet):\n${remote.join('\n')}`
    ).toEqual([]);
    expect(remote).toEqual([]);
  });

  it('NINGUNA ruta contiene una IP fija', () => {
    // La IP de la PC cambia; no puede estar escrita en el código.
    const withIp = uniquePaths().filter((p) => /\d{1,3}(\.\d{1,3}){3}/.test(p));
    expect(withIp, `Rutas con IP fija:\n${withIp.join('\n')}`).toEqual([]);
  });

  it('NINGUNA ruta contiene localhost', () => {
    const withLocalhost = uniquePaths().filter((p) => /localhost|127\.0\.0\.1/.test(p));
    expect(withLocalhost).toEqual([]);
  });

  it('todas las rutas son relativas y apuntan a assets/', () => {
    uniquePaths().forEach((p) => {
      expect(p.startsWith('assets/'), `${p} debe empezar por assets/`).toBe(true);
    });
  });

  it('los sonidos también usan rutas relativas', () => {
    Object.values(SOUND_MANIFEST).forEach((entry) => {
      expect(entry.path.startsWith('assets/')).toBe(true);
      expect(/^(https?:)?\/\//.test(entry.path)).toBe(false);
    });
  });

  it('cada ruta relativa corresponde a un archivo real en public/', () => {
    // Si la ruta no existe en disco, otro dispositivo recibiría un 404.
    uniquePaths().forEach((p) => {
      expect(existsSync(join(ROOT, 'public', p)), `falta public/${p}`).toBe(true);
    });
  });
});

describe('index.html cargable desde cualquier origen', () => {
  it('el favicon usa ruta relativa', () => {
    expect(indexHtml).toMatch(/href="\.\/favicon\//);
    expect(indexHtml).not.toMatch(/href="\/favicon\//);
  });

  it('no hay referencias REALES a localhost (comentarios aparte)', () => {
    // Se quitan los comentarios HTML antes de comprobar: mencionar
    // localhost en la documentación está bien, usarlo como ruta no.
    const withoutComments = indexHtml.replace(/<!--[\s\S]*?-->/g, '');

    expect(withoutComments).not.toMatch(/localhost/);
    expect(withoutComments).not.toMatch(/127\.0\.0\.1/);
    expect(withoutComments).not.toMatch(/https?:\/\/\d/);
  });

  it('declara el viewport para móvil', () => {
    expect(indexHtml).toMatch(/name="viewport"/);
    expect(indexHtml).toMatch(/width=device-width/);
  });
});

describe('Sin multijugador (juego individual)', () => {
  it('no existe capa de red en el proyecto', () => {
    // La especificación corregida no quiere multijugador: nada de
    // NetworkManager, salas, WebSocket ni sincronización.
    const forbidden = [
      join(ROOT, 'src', 'network'),
      join(ROOT, 'server'),
    ];

    forbidden.forEach((dir) => {
      expect(existsSync(dir), `no debe existir ${dir}`).toBe(false);
    });
  });

  it('el motor no abre conexiones de red', () => {
    const engine = readFileSync(join(ROOT, 'src', 'game', 'GameEngine.js'), 'utf8');

    expect(engine).not.toMatch(/new WebSocket/);
    expect(engine).not.toMatch(/\bfetch\(/);
    expect(engine).not.toMatch(/XMLHttpRequest/);
    expect(engine).not.toMatch(/EventSource/);
  });

  it('el juego funciona sin conexión: solo usa recursos locales', () => {
    // Todos los assets son archivos locales del proyecto, así que
    // JUGAR SOLO funciona sin Internet ni servidor.
    expect(uniquePaths().length).toBeGreaterThan(100);
    Object.keys(ASSET_MANIFEST).forEach((key) => {
      expect(ASSET_MANIFEST[key].path.startsWith('assets/')).toBe(true);
    });
  });
});
