#!/bin/sh
# Monorepo: build web (web/) + api (backend/) with local dockerfiles, push web to GHCR,
# then build api + monolith. Monolith uses BASE_WEB_IMAGE from .env.
# Run from repo root. Expects { web/, backend/, build-docker/ }.
#
# Web image: ghcr.io/rifatsekerariot/platformariot-web (repo-specific name to avoid
# GHCR permission_denied: write_package when beaver-iot-web is owned by another repo).
# Override with WEB_GHCR_IMAGE env if needed.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BD="$ROOT/build-docker"
WEB_GHCR="${WEB_GHCR_IMAGE:-ghcr.io/rifatsekerariot/platformariot-web:latest}"

cd "$ROOT"
# 1. Web – beaver-iot-web-local.dockerfile (context: repo root, web/)
echo "Building web image with beaver-iot-web-local.dockerfile (context: repo root)"
if [ ! -d "web" ]; then
  echo "ERROR: web directory not found!"
  exit 1
fi
echo "web/ exists."
docker build --no-cache --network=host \
  -f build-docker/beaver-iot-web-local.dockerfile \
  -t milesight/beaver-iot-web:latest \
  -t "$WEB_GHCR" .

# 2. Push web to GHCR so compose uses OUR image
docker push "$WEB_GHCR"

# 3. Point monolith at our web image; then api + monolith
echo "BASE_WEB_IMAGE=$WEB_GHCR" >> "$BD/.env"
cd "$BD"
docker compose build --no-cache api monolith
