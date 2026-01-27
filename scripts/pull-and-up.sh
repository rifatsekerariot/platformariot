#!/bin/sh
# pull-and-up.sh
# Git pull + docker compose pull + docker compose up -d (veri kaybi yok; volume'lar korunur).
# Compose dosyasini COMPOSE_FILE ile verebilirsin; yoksa asagidaki sirayla aranir.

set -e

# --- 1) beaver-iot-docker kokunu bul
ROOT="${BEAVER_DOCKER_ROOT}"
if [ -z "$ROOT" ]; then
    # Script beaver-iot-docker/scripts/ icindeyse: ust dizin = repo koku
    ROOT="$(cd "$(dirname "$0")/.." && pwd)"
    if [ ! -d "$ROOT/build-docker" ] && [ ! -d "$ROOT/examples" ]; then
        cur="$ROOT"
        while [ -n "$cur" ]; do
            [ -f "$cur/examples/monolith.yaml" ] && ROOT="$cur" && break
            par="$(dirname "$cur")"
            [ "$par" = "$cur" ] && break
            cur="$par"
        done
    fi
fi
if [ -z "$ROOT" ] || [ ! -d "$ROOT" ]; then
    echo "HATA: beaver-iot-docker koku bulunamadi. BEAVER_DOCKER_ROOT ile ayarla veya scripti beaver-iot-docker/scripts icinde calistir."
    exit 1
fi

# --- 2) Compose dosyasi
COMPOSE="${COMPOSE_FILE}"
if [ -z "$COMPOSE" ]; then
    for c in "$ROOT/examples/chirpstack-prebuilt.yaml" "$ROOT/examples/monolith.yaml" "$ROOT/build-docker/docker-compose.yaml"; do
        [ -f "$c" ] && COMPOSE="$c" && break
    done
fi
if [ -z "$COMPOSE" ] || [ ! -f "$COMPOSE" ]; then
    echo "HATA: Compose dosyasi bulunamadi. COMPOSE_FILE ile tam yolu ver. Aranan: examples/chirpstack-prebuilt.yaml, examples/monolith.yaml, build-docker/docker-compose.yaml"
    exit 1
fi

echo "[pull-and-up] Root: $ROOT"
echo "[pull-and-up] Compose: $COMPOSE"

cd "$ROOT"

# --- 3) git pull
echo "[pull-and-up] git pull..."
git pull

# --- 4) docker compose pull + up -d
echo "[pull-and-up] docker compose pull..."
docker compose -f "$COMPOSE" pull

echo "[pull-and-up] docker compose up -d..."
docker compose -f "$COMPOSE" up -d

echo "[pull-and-up] Bitti. (docker compose down -v KULLANMA; volume siler, veri kaybi olur.)"
