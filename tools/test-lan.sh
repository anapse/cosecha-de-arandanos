#!/usr/bin/env bash
# test-lan.sh — Verifica que el juego se sirve correctamente por LAN.
#
# Simula lo que hace otro dispositivo (PC o teléfono) de la red: pide el
# HTML y TODOS los recursos del juego usando la IP de la LAN, no
# localhost. Si algo (sprites, JS, favicon) falla aquí, fallará también
# en el móvil.
#
# Uso:  bash tools/test-lan.sh [IP]
# Ej.:  bash tools/test-lan.sh 192.168.1.3

IP="${1:-192.168.1.3}"
BASE="http://${IP}:5173"

pass=0
fail=0

check() {
  local label="$1"
  local url="$2"
  local code
  # -w imprime solo el código; -o /dev/null descarta el cuerpo.
  # El `|| echo 000` cubre el caso de que curl no pueda conectar.
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$url" 2>/dev/null)
  [ -z "$code" ] && code="000"
  # Por si curl imprimiese algo extra, se toman los 3 últimos dígitos.
  code="${code: -3}"

  if [ "$code" = "200" ]; then
    printf "  OK    %-42s %s\n" "$label" "$code"
    pass=$((pass + 1))
  else
    printf "  FALLA %-42s %s\n" "$label" "$code"
    fail=$((fail + 1))
  fi
}

echo "=== Prueba de acceso LAN: $BASE ==="
echo ""

echo "--- Aplicacion ---"
check "index.html"                "$BASE/"
check "main.jsx"                  "$BASE/src/main.jsx"
check "favicon"                   "$BASE/favicon/blueberry.svg"

echo ""
echo "--- Sprites (una muestra de cada categoria) ---"
check "player"                    "$BASE/assets/player/walk/player_walk_down.png"
check "supervisor"                "$BASE/assets/supervisor/walk/supervisor_walk_down.png"
check "plants"                    "$BASE/assets/plants/plant_ripe.png"
check "fruits"                    "$BASE/assets/fruits/fruit_ripe.png"
check "terrain"                   "$BASE/assets/terrain/path_vertical.png"
check "basket"                    "$BASE/assets/basket/basket_full.png"
check "ui icons"                  "$BASE/assets/ui/icons/heart_full.png"
check "ui panels"                 "$BASE/assets/ui/panels/panel_hud.png"
check "effects"                   "$BASE/assets/effects/harvest/particle_harvest.png"
check "environment"               "$BASE/assets/environment/sky/sky.png"

echo ""
if [ "$fail" -eq 0 ]; then
  echo "RESULTADO: $pass pruebas correctas, 0 fallos."
  echo "El juego se sirve bien por LAN: otro dispositivo puede abrirlo."
  exit 0
else
  echo "RESULTADO: $pass correctas, $fail FALLOS."
  echo ""
  echo "Posibles causas si todo falla:"
  echo "  - El servidor no esta arrancado (npm run dev)."
  echo "  - El cortafuegos de Windows bloquea el puerto 5173."
  echo "  - La IP no es la de esta maquina (revisa la que muestra Vite en 'Network')."
  exit 1
fi
