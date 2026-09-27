# HANDOFF — estado actual

## Proyecto
Microjuego web 2D pixel-art de cosecha de arándanos.
React + Vite + Canvas. Single-player.

## Estado
- Rama principal: `master`.
- El proyecto está en `D:\PROYECTOS\cosecha-de-arandanos` en el entorno local de desarrollo.
- La presentación/escala del viewport ha tenido varios ajustes recientes.
- La prioridad actual es la composición visual: el juego debe aprovechar correctamente la altura disponible y mantener el campo legible.

## Arquitectura que no se debe romper
- `src/game/` = motor y lógica.
- `src/components/` = shell/UI React.
- `src/data/assets.js` = catálogo de assets.
- `public/assets/` = assets finales.

## Antes de modificar
1. Leer el código real afectado.
2. Buscar referencias al archivo/constante que se quiere cambiar.
3. Hacer el cambio mínimo necesario.
4. Ejecutar `npm test` y `npm run build` cuando corresponda.
5. Verificar visualmente los cambios de presentación.

## Limpieza
La documentación histórica que contradiga el código actual no debe usarse como fuente de requisitos. Las reglas permanentes están en `AGENTS.md`; este archivo solo conserva contexto de la sesión actual.

## Comandos
```bash
npm run dev
npm run build
npm test
npm run lint
```
