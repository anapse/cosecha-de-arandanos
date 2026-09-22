# 📋 ASSET MANIFEST — Cosecha de Arándanos

> **Documento GENERADO automáticamente.** No lo edites a mano:
> se produce con `npm run manifest` a partir de `src/data/assets.js`.
> Así el manifiesto y el código nunca se desincronizan.

## Resumen

| Métrica | Valor |
|---|---|
| Archivos PNG distintos | **114** |
| Entradas del catálogo (claves lógicas) | **114** |
| Assets DEFINITIVO | **114** |
| Assets PLACEHOLDER | **0** |
| Assets PENDIENTE | **0** |
| Peso total | **30.2 KB** |

### Estados

- **DEFINITIVO** — arte pixel-art hecho para el juego, listo para producción.
- **PLACEHOLDER** — arte temporal generado por código, pendiente de sustituir.
- **PENDIENTE** — el archivo todavía no existe.

### Convenciones

- **Tipo:** `png` = imagen suelta · `spritesheet` = tira horizontal de N frames.
- **Tamaño:** lado del frame en píxeles. Un spritesheet de 4 frames de 32px
  mide 128x32 px en disco.
- **Frames:** número de cuadros de la animación.
- **Escala lógica:** el motor dibuja 1 px de sprite = 1 px lógico del
  viewport (360x640), sin suavizado.

---

### 01 PLAYER

| ID | Ruta | Tipo | Tamaño | Frames | Estado | Uso | Peso |
|---|---|---|---|---|---|---|---|
| `player_idle` | `assets/player/idle/player_idle.png` | spritesheet | 128x32 | 4 | DEFINITIVO | quieto | 0.41 KB |
| `player_walk_up` | `assets/player/walk/player_walk_up.png` | spritesheet | 128x32 | 4 | DEFINITIVO | caminar arriba | 0.40 KB |
| `player_walk_down` | `assets/player/walk/player_walk_down.png` | spritesheet | 128x32 | 4 | DEFINITIVO | caminar abajo | 0.43 KB |
| `player_walk_left` | `assets/player/walk/player_walk_left.png` | spritesheet | 128x32 | 4 | DEFINITIVO | caminar izquierda | 0.43 KB |
| `player_walk_right` | `assets/player/walk/player_walk_right.png` | spritesheet | 128x32 | 4 | DEFINITIVO | caminar derecha | 0.43 KB |
| `player_harvest_left` | `assets/player/harvest/player_harvest_left.png` | spritesheet | 128x32 | 4 | DEFINITIVO | recoger izquierda | 0.35 KB |
| `player_harvest_right` | `assets/player/harvest/player_harvest_right.png` | spritesheet | 128x32 | 4 | DEFINITIVO | recoger derecha | 0.38 KB |
| `player_states_wait` | `assets/player/states/player_wait.png` | png | 32x32 | 1 | DEFINITIVO | esperar | 0.24 KB |
| `player_states_full` | `assets/player/states/player_full.png` | png | 32x32 | 1 | DEFINITIVO | canasta llena | 0.24 KB |
| `player_states_tired` | `assets/player/states/player_tired.png` | png | 32x32 | 1 | DEFINITIVO | cansado | 0.28 KB |
| `player_states_error` | `assets/player/states/player_error.png` | png | 32x32 | 1 | DEFINITIVO | error | 0.26 KB |
| `player_states_victory` | `assets/player/states/player_victory.png` | png | 32x32 | 1 | DEFINITIVO | victoria | 0.27 KB |
| `player_states_defeat` | `assets/player/states/player_defeat.png` | png | 32x32 | 1 | DEFINITIVO | derrota | 0.27 KB |

---

### 02 SUPERVISOR

| ID | Ruta | Tipo | Tamaño | Frames | Estado | Uso | Peso |
|---|---|---|---|---|---|---|---|
| `supervisor_walk_up` | `assets/supervisor/walk/supervisor_walk_up.png` | spritesheet | 128x32 | 4 | DEFINITIVO | caminar arriba | 0.40 KB |
| `supervisor_walk_down` | `assets/supervisor/walk/supervisor_walk_down.png` | spritesheet | 128x32 | 4 | DEFINITIVO | caminar abajo | 0.43 KB |
| `supervisor_walk_left` | `assets/supervisor/walk/supervisor_walk_left.png` | spritesheet | 128x32 | 4 | DEFINITIVO | caminar izquierda | 0.44 KB |
| `supervisor_walk_right` | `assets/supervisor/walk/supervisor_walk_right.png` | spritesheet | 128x32 | 4 | DEFINITIVO | caminar derecha | 0.44 KB |
| `supervisor_inspection_review` | `assets/supervisor/inspection/supervisor_review.png` | spritesheet | 128x32 | 4 | DEFINITIVO | revisar | 0.38 KB |
| `supervisor_inspection_write` | `assets/supervisor/inspection/supervisor_write.png` | spritesheet | 128x32 | 4 | DEFINITIVO | anotar | 0.39 KB |
| `supervisor_inspection_detectError` | `assets/supervisor/inspection/supervisor_detect_error.png` | spritesheet | 128x32 | 4 | DEFINITIVO | detectar error | 0.38 KB |
| `supervisor_inspection_approve` | `assets/supervisor/inspection/supervisor_approve.png` | spritesheet | 128x32 | 4 | DEFINITIVO | aprobar | 0.41 KB |
| `supervisor_states_talk` | `assets/supervisor/states/supervisor_talk.png` | spritesheet | 128x32 | 4 | DEFINITIVO | hablar | 0.40 KB |

---

### 03 PLANTS

| ID | Ruta | Tipo | Tamaño | Frames | Estado | Uso | Peso |
|---|---|---|---|---|---|---|---|
| `plants_empty` | `assets/plants/plant_empty.png` | png | 32x32 | 1 | DEFINITIVO | vacía | 0.45 KB |
| `plants_few` | `assets/plants/plant_few.png` | png | 32x32 | 1 | DEFINITIVO | pocos frutos | 0.55 KB |
| `plants_medium` | `assets/plants/plant_medium.png` | png | 32x32 | 1 | DEFINITIVO | media | 0.60 KB |
| `plants_abundant` | `assets/plants/plant_abundant.png` | png | 32x32 | 1 | DEFINITIVO | abundante | 0.61 KB |
| `plants_ripe` | `assets/plants/plant_ripe.png` | png | 32x32 | 1 | DEFINITIVO | madura | 0.59 KB |
| `plants_unripe` | `assets/plants/plant_unripe.png` | png | 32x32 | 1 | DEFINITIVO | pintona | 0.56 KB |
| `plants_mixed` | `assets/plants/plant_mixed.png` | png | 32x32 | 1 | DEFINITIVO | mixta | 0.67 KB |
| `plants_harvested` | `assets/plants/plant_harvested.png` | png | 32x32 | 1 | DEFINITIVO | cosechada | 0.41 KB |
| `plants_base` | `assets/plants/plant_base.png` | png | 32x32 | 1 | DEFINITIVO | follaje base sin frutos | 0.50 KB |
| `plants_row` | `assets/plants/plant_row.png` | png | 32x64 | 1 | DEFINITIVO | hilera alta de cultivo (32x64) | 0.74 KB |

---

### 04 FRUITS

| ID | Ruta | Tipo | Tamaño | Frames | Estado | Uso | Peso |
|---|---|---|---|---|---|---|---|
| `fruits_ripe` | `assets/fruits/fruit_ripe.png` | png | 16x16 | 1 | DEFINITIVO | fruto maduro (con aro) | 0.21 KB |
| `fruits_unripe` | `assets/fruits/fruit_unripe.png` | png | 16x16 | 1 | DEFINITIVO | fruto pintón | 0.16 KB |
| `fruits_ripePlain` | `assets/fruits/fruit_ripe_plain.png` | png | 16x16 | 1 | DEFINITIVO | maduro sin aro | 0.16 KB |
| `fruits_unripeGreen` | `assets/fruits/fruit_unripe_green.png` | png | 16x16 | 1 | DEFINITIVO | pintón verdoso | 0.16 KB |
| `fruits_groupX2` | `assets/fruits/fruit_group_x2.png` | png | 16x16 | 1 | DEFINITIVO | grupo de 2 | 0.17 KB |
| `fruits_groupX3` | `assets/fruits/fruit_group_x3.png` | png | 16x16 | 1 | DEFINITIVO | grupo de 3 | 0.18 KB |
| `fruits_inHand` | `assets/fruits/fruit_in_hand.png` | png | 16x16 | 1 | DEFINITIVO | en la mano | 0.19 KB |
| `fruits_fall` | `assets/fruits/fruit_fall.png` | png | 16x16 | 1 | DEFINITIVO | cayendo | 0.18 KB |

---

### 05 TERRAIN

| ID | Ruta | Tipo | Tamaño | Frames | Estado | Uso | Peso |
|---|---|---|---|---|---|---|---|
| `terrain_soil` | `assets/terrain/ground_soil.png` | png | 32x32 | 1 | DEFINITIVO | tierra de cultivo | 0.20 KB |
| `terrain_pathV` | `assets/terrain/path_vertical.png` | png | 32x32 | 1 | DEFINITIVO | camino vertical | 0.17 KB |
| `terrain_pathH` | `assets/terrain/path_horizontal.png` | png | 32x32 | 1 | DEFINITIVO | camino horizontal | 0.19 KB |
| `terrain_corner` | `assets/terrain/path_corner.png` | png | 32x32 | 1 | DEFINITIVO | esquina de camino | 0.16 KB |
| `terrain_cross` | `assets/terrain/path_intersection.png` | png | 32x32 | 1 | DEFINITIVO | intersección | 0.16 KB |
| `terrain_grass` | `assets/terrain/grass.png` | png | 32x32 | 1 | DEFINITIVO | césped | 0.24 KB |
| `terrain_grassEdge` | `assets/terrain/grass_edge.png` | png | 32x32 | 1 | DEFINITIVO | borde de césped | 0.19 KB |
| `terrain_fenceH` | `assets/terrain/fence_horizontal.png` | png | 32x32 | 1 | DEFINITIVO | cerca horizontal | 0.17 KB |
| `terrain_fenceV` | `assets/terrain/fence_vertical.png` | png | 32x32 | 1 | DEFINITIVO | cerca vertical | 0.13 KB |
| `terrain_fenceCorner` | `assets/terrain/fence_corner.png` | png | 32x32 | 1 | DEFINITIVO | esquina de cerca | 0.14 KB |
| `terrain_deliveryZone` | `assets/terrain/delivery_zone.png` | png | 32x32 | 1 | DEFINITIVO | zona de entrega | 0.21 KB |
| `terrain_deliveryMarker` | `assets/terrain/delivery_marker.png` | png | 32x32 | 1 | DEFINITIVO | marcador de entrega | 0.11 KB |
| `terrain_detail` | `assets/terrain/ground_detail.png` | png | 32x32 | 1 | DEFINITIVO | detalle de tierra | 0.20 KB |
| `terrain_rock` | `assets/terrain/rock.png` | png | 32x32 | 1 | DEFINITIVO | piedra | 0.24 KB |
| `terrain_flower` | `assets/terrain/flower.png` | png | 32x32 | 1 | DEFINITIVO | flores | 0.18 KB |

---

### 06 BASKET / BOXES / TRUCK

| ID | Ruta | Tipo | Tamaño | Frames | Estado | Uso | Peso |
|---|---|---|---|---|---|---|---|
| `basket_empty` | `assets/basket/basket_empty.png` | png | 32x32 | 1 | DEFINITIVO | canasta vacía | 0.17 KB |
| `basket_low` | `assets/basket/basket_low.png` | png | 32x32 | 1 | DEFINITIVO | canasta con pocos | 0.20 KB |
| `basket_medium` | `assets/basket/basket_medium.png` | png | 32x32 | 1 | DEFINITIVO | canasta media | 0.21 KB |
| `basket_full` | `assets/basket/basket_full.png` | png | 32x32 | 1 | DEFINITIVO | canasta llena | 0.21 KB |
| `basket_box` | `assets/basket/box_empty.png` | png | 32x32 | 1 | DEFINITIVO | caja vacía | 0.14 KB |
| `basket_boxFilled` | `assets/basket/box_filled.png` | png | 32x32 | 1 | DEFINITIVO | caja con frutos | 0.19 KB |
| `basket_boxStack` | `assets/basket/box_stack.png` | png | 32x32 | 1 | DEFINITIVO | cajas apiladas | 0.14 KB |
| `basket_boxOnTruck` | `assets/basket/box_on_truck.png` | png | 32x32 | 1 | DEFINITIVO | caja en el camión | 0.19 KB |
| `basket_truck` | `assets/basket/truck_side.png` | png | 64x40 | 1 | DEFINITIVO | camión lateral | 0.35 KB |
| `basket_truckLoaded` | `assets/basket/truck_loaded.png` | png | 64x40 | 1 | DEFINITIVO | camión cargado | 0.37 KB |

---

### 07 UI

| ID | Ruta | Tipo | Tamaño | Frames | Estado | Uso | Peso |
|---|---|---|---|---|---|---|---|
| `ui_hud_logoPanel` | `assets/ui/hud/hud_logo_panel.png` | png | 110x44 | 1 | DEFINITIVO | panel del título | 0.22 KB |
| `ui_hud_logoBerry` | `assets/ui/hud/hud_logo_berry.png` | png | 32x32 | 1 | DEFINITIVO | arándano del logo | 0.25 KB |
| `ui_icons_heartFull` | `assets/ui/icons/heart_full.png` | png | 16x16 | 1 | DEFINITIVO | vida llena | 0.14 KB |
| `ui_icons_heartMedium` | `assets/ui/icons/heart_medium.png` | png | 16x16 | 1 | DEFINITIVO | vida media | 0.14 KB |
| `ui_icons_heartEmpty` | `assets/ui/icons/heart_empty.png` | png | 16x16 | 1 | DEFINITIVO | vida vacía | 0.13 KB |
| `ui_icons_blueberry` | `assets/ui/icons/icon_blueberry.png` | png | 16x16 | 1 | DEFINITIVO | icono arándano | 0.17 KB |
| `ui_icons_time` | `assets/ui/icons/icon_time.png` | png | 16x16 | 1 | DEFINITIVO | icono tiempo | 0.17 KB |
| `ui_icons_unripe` | `assets/ui/icons/icon_unripe.png` | png | 16x16 | 1 | DEFINITIVO | icono pintón | 0.16 KB |
| `ui_icons_error` | `assets/ui/icons/icon_error.png` | png | 16x16 | 1 | DEFINITIVO | icono error | 0.13 KB |
| `ui_icons_alert` | `assets/ui/icons/icon_alert.png` | png | 16x16 | 1 | DEFINITIVO | icono alerta | 0.14 KB |
| `ui_icons_check` | `assets/ui/icons/icon_check.png` | png | 16x16 | 1 | DEFINITIVO | icono acierto | 0.14 KB |
| `ui_buttons_pause` | `assets/ui/buttons/button_pause.png` | png | 32x32 | 1 | DEFINITIVO | botón pausa | 0.15 KB |
| `ui_buttons_play` | `assets/ui/buttons/button_play.png` | png | 32x32 | 1 | DEFINITIVO | botón jugar | 0.20 KB |
| `ui_buttons_continue` | `assets/ui/buttons/button_continue.png` | png | 32x32 | 1 | DEFINITIVO | botón continuar | 0.19 KB |
| `ui_buttons_restart` | `assets/ui/buttons/button_restart.png` | png | 32x32 | 1 | DEFINITIVO | botón reiniciar | 0.20 KB |
| `ui_bars_track` | `assets/ui/bars/bar_track.png` | png | 64x10 | 1 | DEFINITIVO | fondo de barra | 0.10 KB |
| `ui_bars_fillGreen` | `assets/ui/bars/bar_fill_green.png` | png | 64x8 | 1 | DEFINITIVO | relleno verde | 0.10 KB |
| `ui_bars_fillYellow` | `assets/ui/bars/bar_fill_yellow.png` | png | 64x8 | 1 | DEFINITIVO | relleno amarillo | 0.10 KB |
| `ui_bars_fillRed` | `assets/ui/bars/bar_fill_red.png` | png | 64x8 | 1 | DEFINITIVO | relleno rojo | 0.10 KB |
| `ui_bars_fillBlue` | `assets/ui/bars/bar_fill_blue.png` | png | 64x8 | 1 | DEFINITIVO | relleno azul | 0.10 KB |
| `ui_bars_quality` | `assets/ui/bars/quality_bar.png` | png | 64x8 | 1 | DEFINITIVO | barra de calidad | 0.10 KB |
| `ui_bars_progress` | `assets/ui/bars/progress_bar.png` | png | 64x8 | 1 | DEFINITIVO | barra de progreso | 0.10 KB |
| `ui_panels_frame` | `assets/ui/panels/panel_frame.png` | png | 64x40 | 1 | DEFINITIVO | marco de panel | 0.20 KB |
| `ui_panels_hud` | `assets/ui/panels/panel_hud.png` | png | 96x56 | 1 | DEFINITIVO | panel del HUD | 0.19 KB |
| `ui_panels_hudSmall` | `assets/ui/panels/panel_hud_small.png` | png | 64x32 | 1 | DEFINITIVO | panel pequeño | 0.15 KB |
| `ui_panels_legend` | `assets/ui/panels/panel_legend.png` | png | 64x78 | 1 | DEFINITIVO | panel de leyenda | 0.50 KB |
| `ui_prompts_deliverArrow` | `assets/ui/prompts/prompt_deliver_arrow.png` | png | 24x24 | 1 | DEFINITIVO | flecha de entrega | 0.18 KB |
| `ui_prompts_selection` | `assets/ui/prompts/prompt_selection.png` | png | 32x32 | 1 | DEFINITIVO | indicador de selección | 0.12 KB |
| `ui_prompts_speechBubble` | `assets/ui/prompts/prompt_speech_bubble.png` | png | 64x24 | 1 | DEFINITIVO | burbuja de diálogo | 0.12 KB |

---

### 08 EFFECTS

| ID | Ruta | Tipo | Tamaño | Frames | Estado | Uso | Peso |
|---|---|---|---|---|---|---|---|
| `effects_harvest_particle` | `assets/effects/harvest/particle_harvest.png` | spritesheet | 64x16 | 4 | DEFINITIVO | partícula al recoger | 0.29 KB |
| `effects_error_particle` | `assets/effects/error/particle_error.png` | spritesheet | 64x16 | 4 | DEFINITIVO | partícula de error | 0.22 KB |
| `effects_error_text` | `assets/effects/error/text_error.png` | png | 32x16 | 1 | DEFINITIVO | texto de error | 0.12 KB |
| `effects_inspection_flash` | `assets/effects/inspection/inspect_flash.png` | png | 16x16 | 1 | DEFINITIVO | destello de revisión | 0.09 KB |
| `effects_particles_leaf` | `assets/effects/particles/leaf.png` | png | 16x16 | 1 | DEFINITIVO | hoja | 0.14 KB |
| `effects_shadows_player` | `assets/effects/shadows/shadow_player.png` | png | 32x32 | 1 | DEFINITIVO | sombra del jugador | 0.11 KB |
| `effects_shadows_supervisor` | `assets/effects/shadows/shadow_supervisor.png` | png | 32x32 | 1 | DEFINITIVO | sombra del supervisor | 0.11 KB |
| `effects_floatingText_plus10` | `assets/effects/floating-text/text_plus10.png` | png | 32x16 | 1 | DEFINITIVO | texto +10 | 0.13 KB |

---

### 09 ENVIRONMENT

| ID | Ruta | Tipo | Tamaño | Frames | Estado | Uso | Peso |
|---|---|---|---|---|---|---|---|
| `environment_sky_sky` | `assets/environment/sky/sky.png` | png | 128x64 | 1 | DEFINITIVO | cielo | 0.65 KB |
| `environment_clouds_clouds` | `assets/environment/clouds/clouds.png` | png | 128x64 | 1 | DEFINITIVO | nubes | 0.41 KB |
| `environment_mountains_mountains` | `assets/environment/mountains/mountains.png` | png | 128x64 | 1 | DEFINITIVO | montañas | 0.48 KB |
| `environment_trees_tree1` | `assets/environment/trees/tree_01.png` | png | 64x64 | 1 | DEFINITIVO | árbol 1 | 0.45 KB |
| `environment_trees_tree2` | `assets/environment/trees/tree_02.png` | png | 64x64 | 1 | DEFINITIVO | árbol 2 | 0.47 KB |
| `environment_trees_tree3` | `assets/environment/trees/tree_03.png` | png | 64x64 | 1 | DEFINITIVO | árbol 3 | 0.51 KB |
| `environment_trees_bush` | `assets/environment/trees/bush.png` | png | 32x32 | 1 | DEFINITIVO | arbusto | 0.23 KB |
| `environment_signs_fundo` | `assets/environment/signs/sign_fundo.png` | png | 64x64 | 1 | DEFINITIVO | cartel del fundo | 0.19 KB |
| `environment_signs_grupo` | `assets/environment/signs/sign_grupo.png` | png | 64x64 | 1 | DEFINITIVO | cartel del grupo | 0.20 KB |
| `environment_decorations_rockLarge` | `assets/environment/decorations/rock_large.png` | png | 32x32 | 1 | DEFINITIVO | roca grande | 0.24 KB |
| `environment_decorations_grassDetail` | `assets/environment/decorations/grass_detail2.png` | png | 32x32 | 1 | DEFINITIVO | césped de detalle | 0.22 KB |
| `environment_decorations_flowers` | `assets/environment/decorations/flowers.png` | png | 32x32 | 1 | DEFINITIVO | flores | 0.21 KB |

---

## Estructura de carpetas

```
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
```

---

## Cómo regenerar

```bash
npm run sprites     # regenera los PNG
npm run manifest    # regenera este documento
npm test            # comprueba que cada ruta existe en disco
```
