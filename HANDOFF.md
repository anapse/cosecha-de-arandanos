# HANDOFF — Estado del proyecto

> **Estado cambiante.** Se actualiza al final de cada sesión.
> El contexto estable (arquitectura, reglas) está en `AGENTS.md`.

**Última actualización:** 2026-09-24 · sesión de reorganización de perfiles

---

## Dónde quedamos

El proyecto se **movió** de `D:\cosecha-de-arandanos` a
**`D:\PROYECTOS\cosecha-de-arandanos`**. Verificado: 363 archivos, 24 commits,
`.git` intacto.

**Fase actual del juego:** presentación visual (FASE 3 de la fase de
presentación — hileras continuas de cultivo).

---

## ⚠️ Estado de los tests — LEER

```
Tests:  156 totales · 151 pasan · 5 FALLAN
Build:  OK
```

**Los 5 fallos son de trabajo a medias** (no regresiones):
- `recoger un maduro llena la canasta y suma puntos`
- `recoger un pintón genera error y baja la calidad`
- `la posición de cada fruto cae dentro del rectángulo de su planta`
- `frutos del mismo lado se sitúan en la mitad correcta`
- `recoger pintones a propósito reduce la calidad y suma errores`

**Causa:** se intentó pasar las hileras de 1 tile a 2 tiles de ancho
(para que se vieran como setos continuos). Se cambió el ancho, pero
**no se unificó el origen** entre:
- dónde se dibuja el follaje
- dónde colisiona (`plant.rect`)
- dónde se sitúan los frutos (`fruitPosition`)

Los tres usan referencias distintas → el jugador queda fuera del
rectángulo de la mata en el camino derecho, y los frutos del lado
"derecho" quedan inalcanzables.

**NO he revertido eso.** El árbol tiene los cambios sin commitear
(16 archivos modificados).

---

## Qué se hizo (sesión anterior)

1. **Escala:** `TILE_SIZE 32 → 48`. Campo compacto (14 → 9 hileras).
   Se corrigió `harvestReach` (fallaba en silencio) y `Camera.setWorldSize`.
2. **Hileras continuas:** el arte se regeneró para que el follaje llegue
   a los bordes del tile (`tools/artPlants.js`).
3. **Recolección por click/toque:** funciona (7/7 en Chrome real).
   Se corrigió la conversión CSS→mundo (DPR × escala × centrado).
4. **Prototipo de seto:** `tools/artHedge.js` + `tools/previewHedge.js`
   (segmento 96×96 continuo). **Validado visualmente, sin integrar.**

---

## Pendiente (en orden)

| # | Tarea | Estado |
|---|---|---|
| 1 | **ARREGLAR los 5 tests** — unificar origen/ancho de la hilera | 🔴 **primero** |
| 2 | Hileras continuas de cultivo (integrar `artHedge.js`) | ⏸️ bloqueado por #1 |
| 3 | Zona de entrega (cerca, cartel Grupo Brigitte, camión) | ⏸️ |
| 4 | HUD simplificado (3 paneles → uno legible) | ⏸️ |
| 5 | D-pad móvil compacto (los actuales tapan el campo) | ⏸️ |
| 6 | Mensajes del supervisor ("Revisando calidad…", "Pintones: 1") | ⏸️ |

---

## Siguiente paso EXACTO

**Arreglar la coherencia geométrica de la hilera.** El problema:

```
Dibujo del seto    → plant.x + (hw - ts)/2   (centrado)
Rect de colisión   → plant.x                 (sin centrar)
Posición de frutos → plant.x + ancho*offset
```

Con hileras de 1 tile los tres coincidían. Con 2, no.

**Solución:** definir **UN solo origen y UN solo ancho** para la hilera,
y que los tres (dibujo, colisión, frutos) lo usen. Probablemente en
`Plant.js` (getters `rect`, `centerX`, `fruitPosition`) + `Renderer.drawPlants`.

**Verificar con:** `npm test` — deben volver a **156/156**.

---

## Pruebas realizadas

- ✅ Movimiento del proyecto verificado (363 archivos, `.git` intacto)
- ✅ `npm test` corre desde la nueva ubicación
- ✅ Los 5 fallos existían **antes** del movimiento (no es regresión)

---

## Notas

- **Puerto 5173** libre. El bot BDV usa el 3721 (proyecto distinto).
- El directorio viejo `D:\cosecha-de-arandanos` quedó **vacío** pero
  bloqueado por el shell. Es inofensivo; se puede borrar al reiniciar.
