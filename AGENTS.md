# COSECHA DE ARÁNDANOS — reglas mínimas para Hermes

## Objetivo
Microjuego web 2D pixel-art top-down, single-player, React + Vite + Canvas.

## Arquitectura
- `src/game/`: motor y lógica del juego; no depende de React.
- `src/components/`: shell, menús y UI React.
- `src/data/assets.js`: catálogo único de assets.
- `src/game/map/`: mapa y composición.
- `src/game/rendering/`: renderizado, cámara y HUD.
- `public/assets/`: assets finales.

## Reglas que sí importan
1. No convertirlo en multijugador ni agregar backend/servidor de partidas.
2. No deformar sprites: mantener proporciones uniformes.
3. No cambiar `TILE_SIZE` ni la composición del mapa sin medir primero el efecto.
4. No eliminar funcionalidad existente para mejorar una captura.
5. Auditar el código real antes de modificarlo y verificar build/tests después.
6. En cambios de limpieza, identificar dependencias antes de borrar archivos.
7. No inventar requisitos: si una regla no está aquí o en una instrucción actual del usuario, no asumirla.

## Comandos principales
```bash
npm run dev
npm run build
npm test
npm run lint
npm run manifest
npm run sprites
```

## Documentación
- `HANDOFF.md`: estado actual y siguiente trabajo.
- `README.md`: documentación pública breve.
- `public/assets/ASSET_MANIFEST.md`: generado automáticamente; no editar a mano.

## Principio
Priorizar las instrucciones actuales del usuario y el código real del repositorio sobre documentación histórica.
