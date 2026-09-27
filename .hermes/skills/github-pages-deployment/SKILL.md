name: github-pages-deployment
description: "Despliega proyectos Vite/React en GitHub Pages usando acciones oficiales."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [GitHub, Pages, Deployment, Vite, React, CI]
    related_skills: []

# Despliegue de GitHub Pages con Actions Oficiales

Este skill cubre la configuración y ejecución del despliegue de GitHub Pages usando las acciones oficiales de GitHub, específicamente para proyectos Vite/React.

## Cuándo usar esto

Utiliza este skill cuando necesites publicar un proyecto Vite o React en GitHub Pages con source configurado como "GitHub Actions" en Settings → Pages.

## Configuración previa

1. El repositorio debe ser **público** (GitHub Pages no funciona en repositorios privados)
2. En GitHub Settings → Pages, source debe estar configurado como "GitHub Actions"
3. El workflow se ejecutará en cada push a la rama configurada

## Workflow (.github/workflows/deploy.yml)

El workflow utiliza las acciones oficiales en esta orden:

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [master]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-24.04
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Configure GitHub Pages
        uses: actions/configure-pages@v5

      - name: Build Vite
        run: npm run build

      - name: Upload artifact for GitHub Pages
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

## Puntos críticos

1. **Repositorio público**: GitHub Pages requiere repositorios públicos. Si el repositorio era privado, debe hacerse público primero (Settings → GitHub Features → Popularise)

2. **Permissions**: El workflow necesita `contents: read, pages: write, id-token: write` en la sección de permisos

3. **Runner**: Se recomienda `ubuntu-24.04` para evitar migraciones de runner próximas

4. **Node 20**: La configuración usa Node 20 para la compatibilidad con Vite

5. **Sin terceros**: No uses `peaceiris/actions-gh-pages` ni otros paquetes de terceros. Las acciones oficiales (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`) son la vía soportada.

## Flujo completo

1. Push a master trigger el workflow
2. Actions checkoutea el repositorio
3. Setup Node 20 con cache npm
4. `npm ci` instala dependencias limpias
5. `npm run build` genera dist/ (Vite production build)
6. `actions/upload-pages-artifact@v3` sube dist/ como artifact
7. `actions/configure-pages@v5` configura GitHub Pages
8. `actions/deploy-pages@v4` publica el sitio

## Verificación posterior

- Ir a Settings → Pages: source debe mostrar "GitHub Actions"
- Ir a Actions: ver workflow "Deploy GitHub Pages" completarse
- La URL `https://<usuario>.github.io/<repo>/` debe cargar el juego
- Las rutas de assets deben incluir el prefijo del repositorio (ej. `/cosecha-de-arandanos/`)