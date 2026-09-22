/**
 * generateManifest.js — Genera public/assets/ASSET_MANIFEST.md
 * a partir del catálogo real (src/data/assets.js).
 *
 * Uso: node tools/generateManifest.js
 *
 * Se GENERA en vez de escribirse a mano para que el manifiesto y el
 * código no puedan desincronizarse nunca (§14 de la especificación).
 */

import { writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ASSETS, ASSET_MANIFEST, uniquePaths } from '../src/data/assets.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');

/** ¿Existe el archivo en disco? */
function fileInfo(assetPath) {
  const disk = join(PUBLIC, assetPath.replace('/assets/', 'assets/'));
  if (!existsSync(disk)) return { exists: false, bytes: 0 };
  return { exists: true, bytes: statSync(disk).size };
}

/** Filas de una sección del catálogo anidado. */
function rowsFor(node, prefix = '') {
  const rows = [];

  Object.entries(node).forEach(([key, value]) => {
    const id = prefix ? `${prefix}_${key}` : key;

    if (value && typeof value === 'object' && 'path' in value) {
      const info = fileInfo(value.path);
      rows.push({
        id,
        path: value.path,
        type: value.frames > 1 ? 'spritesheet' : 'png',
        size: `${value.width}x${value.height}`,
        frames: value.frames,
        status: value.status,
        use: value.use,
        bytes: info.bytes,
      });
    } else if (value && typeof value === 'object') {
      rows.push(...rowsFor(value, id));
    }
  });

  return rows;
}

/** Tabla markdown. */
function table(rows) {
  const head =
    '| ID | Ruta | Tipo | Tamaño | Frames | Estado | Uso | Peso |\n' +
    '|---|---|---|---|---|---|---|---|';

  const body = rows
    .map((r) =>
      `| \`${r.id}\` | \`${r.path}\` | ${r.type} | ${r.size} | ${r.frames} | ` +
      `${r.status} | ${r.use} | ${(r.bytes / 1024).toFixed(2)} KB |`
    )
    .join('\n');

  return `${head}\n${body}`;
}

const SECTIONS = [
  ['01 PLAYER', 'player'],
  ['02 SUPERVISOR', 'supervisor'],
  ['03 PLANTS', 'plants'],
  ['04 FRUITS', 'fruits'],
  ['05 TERRAIN', 'terrain'],
  ['06 BASKET / BOXES / TRUCK', 'basket'],
  ['07 UI', 'ui'],
  ['08 EFFECTS', 'effects'],
  ['09 ENVIRONMENT', 'environment'],
];

function main() {
  const allRows = [];

  const parts = SECTIONS.map(([title, key]) => {
    const rows = rowsFor(ASSETS[key], key);
    allRows.push(...rows);
    return `### ${title}\n\n${table(rows)}\n`;
  });

  const counts = allRows.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const totalBytes = allRows.reduce((s, r) => s + r.bytes, 0);
  const files = uniquePaths().length;

  const doc = `# 📋 ASSET MANIFEST — Cosecha de Arándanos

> **Documento GENERADO automáticamente.** No lo edites a mano:
> se produce con \`npm run manifest\` a partir de \`src/data/assets.js\`.
> Así el manifiesto y el código nunca se desincronizan.

## Resumen

| Métrica | Valor |
|---|---|
| Archivos PNG distintos | **${files}** |
| Entradas del catálogo (claves lógicas) | **${allRows.length}** |
| Assets DEFINITIVO | **${counts.DEFINITIVO ?? 0}** |
| Assets PLACEHOLDER | **${counts.PLACEHOLDER ?? 0}** |
| Assets PENDIENTE | **${counts.PENDIENTE ?? 0}** |
| Peso total | **${(totalBytes / 1024).toFixed(1)} KB** |

### Estados

- **DEFINITIVO** — arte pixel-art hecho para el juego, listo para producción.
- **PLACEHOLDER** — arte temporal generado por código, pendiente de sustituir.
- **PENDIENTE** — el archivo todavía no existe.

### Convenciones

- **Tipo:** \`png\` = imagen suelta · \`spritesheet\` = tira horizontal de N frames.
- **Tamaño:** lado del frame en píxeles. Un spritesheet de 4 frames de 32px
  mide 128x32 px en disco.
- **Frames:** número de cuadros de la animación.
- **Escala lógica:** el motor dibuja 1 px de sprite = 1 px lógico del
  viewport (360x640), sin suavizado.

---

${parts.join('\n---\n\n')}
---

## Estructura de carpetas

\`\`\`
public/assets/
├── player/
│   ├── idle/          player_idle.png
│   ├── walk/          player_walk_{down,up,left,right}.png
│   ├── harvest/       player_harvest_{left,right}.png
│   └── states/        player_{wait,full,tired,error,victory,defeat}.png
├── supervisor/
│   ├── walk/          supervisor_walk_{down,up,left,right}.png
│   ├── inspection/    supervisor_{review,write,detect_error,approve}.png
│   └── states/        supervisor_talk.png
├── plants/            plant_{empty,few,medium,abundant,ripe,unripe,mixed,harvested}.png
│                      plant_base.png · plant_row.png
├── fruits/            fruit_{ripe,unripe,ripe_plain,unripe_green}.png
│                      fruit_{group_x2,group_x3,in_hand,fall}.png
├── terrain/           ground_soil · path_{vertical,horizontal,corner,intersection}
│                      grass · grass_edge · fence_{horizontal,vertical,corner}
│                      delivery_{zone,marker} · ground_detail · rock · flower
├── basket/            basket_{empty,low,medium,full}.png
│                      box_{empty,filled,stack,on_truck}.png
│                      truck_{side,loaded}.png
├── ui/
│   ├── hud/           hud_logo_{panel,berry}.png
│   ├── icons/         heart_{full,medium,empty} · icon_{blueberry,time,unripe,error,alert,check}
│   ├── buttons/       button_{pause,play,continue,restart}.png
│   ├── bars/          bar_{track,fill_green,fill_yellow,fill_red,fill_blue}
│   │                  quality_bar · progress_bar
│   ├── panels/        panel_{frame,hud,hud_small,legend}.png
│   └── prompts/       prompt_{deliver_arrow,selection,speech_bubble}.png
├── effects/
│   ├── harvest/       particle_harvest.png      (spritesheet 4)
│   ├── error/         particle_error.png        (spritesheet 4)
│   │                  text_error.png
│   ├── inspection/    inspect_flash.png
│   ├── particles/     leaf.png
│   ├── shadows/       shadow_{player,supervisor}.png
│   └── floating-text/ text_plus10.png
├── environment/
│   ├── sky/           sky.png
│   ├── clouds/        clouds.png
│   ├── mountains/     mountains.png
│   ├── trees/         tree_{01,02,03}.png · bush.png
│   ├── signs/         sign_{fundo,grupo}.png
│   └── decorations/   rock_large · grass_detail2 · flowers
└── sounds/            (opcionales: .wav — el juego funciona sin ellos)
\`\`\`

---

## Cómo regenerar

\`\`\`bash
npm run sprites     # regenera los PNG
npm run manifest    # regenera este documento
npm test            # comprueba que cada ruta existe en disco
\`\`\`
`;

  const out = join(PUBLIC, 'assets', 'ASSET_MANIFEST.md');
  writeFileSync(out, doc);
  console.log(`Generado: ${out}`);
  console.log(`${files} archivos PNG · ${allRows.length} entradas · ${(totalBytes / 1024).toFixed(1)} KB`);
}

main();
