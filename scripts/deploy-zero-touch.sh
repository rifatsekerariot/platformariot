#!/bin/sh
# platformariot: Tek curl ile PostgreSQL + Beaver IoT (Alarm, widget'lar) ayağa kaldırır.
# Linux. Prebuilt: ghcr.io/rifatsekerariot/beaver-iot:latest
#
#   curl -sSL https://raw.githubusercontent.com/rifatsekerariot/platformariot/main/scripts/deploy-zero-touch.sh | sudo sh -s -- [--workspace DIR] [--skip-docker-install] [--postgres-password PWD] [--tenant-id ID]
#
# --workspace: Kurulum dizini (varsayılan: /opt/platformariot)
# --skip-docker-install: Docker kurma (CI / zaten kurulu ortam)
# --postgres-password: POSTGRES_PASSWORD (varsayılan: postgres)
# --tenant-id: CHIRPSTACK_DEFAULT_TENANT_ID (ChirpStack webhook; varsayılan: default)

set -e

REPO="${REPO:-https://github.com/rifatsekerariot/platformariot.git}"
REPO_BRANCH="${REPO_BRANCH:-main}"
BEAVER_IMAGE="${BEAVER_IMAGE:-ghcr.io/rifatsekerariot/beaver-iot:latest}"
WORKSPACE="${WORKSPACE:-/opt/platformariot}"
SKIP_DOCKER_INSTALL=""
POSTGRES_PWD=""
TENANT_ID=""

while [ $# -gt 0 ]; do
  case "$1" in
    --workspace)
      [ $# -lt 2 ] && { echo "[deploy] --workspace requires a value"; exit 1; }
      WORKSPACE="$2"; shift 2 ;;
    --skip-docker-install)
      SKIP_DOCKER_INSTALL=1; shift ;;
    --postgres-password)
      [ $# -lt 2 ] && { echo "[deploy] --postgres-password requires a value"; exit 1; }
      POSTGRES_PWD="$2"; shift 2 ;;
    --tenant-id)
      [ $# -lt 2 ] && { echo "[deploy] --tenant-id requires a value"; exit 1; }
      TENANT_ID="$2"; shift 2 ;;
    *)
      echo "[deploy] Unknown option: $1"; exit 1 ;;
  esac
done

export WORKSPACE
export BEAVER_IMAGE
export CHIRPSTACK_DEFAULT_TENANT_ID="${TENANT_ID:-default}"
[ -n "$POSTGRES_PWD" ] && export POSTGRES_PASSWORD="$POSTGRES_PWD"

echo "[deploy] platformariot: PostgreSQL + Beaver IoT (Alarm, widget'lar)"
echo "[deploy] Workspace: $WORKSPACE | Image: $BEAVER_IMAGE"

# Docker
install_docker() {
  command -v docker >/dev/null 2>&1 && { echo "[deploy] Docker already installed."; return 0; }
  echo "[deploy] Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  if command -v systemctl >/dev/null 2>&1; then
    systemctl enable docker 2>/dev/null || true
    systemctl start docker 2>/dev/null || true
    sleep 2
  fi
}

if [ -z "$SKIP_DOCKER_INSTALL" ]; then
  install_docker
else
  command -v docker >/dev/null 2>&1 || { echo "[deploy] Docker not found. Run without --skip-docker-install."; exit 1; }
fi

# Docker Compose
COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "[deploy] ERROR: docker compose or docker-compose not found."
  exit 1
fi

# Git
if ! command -v git >/dev/null 2>&1; then
  echo "[deploy] Installing Git..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq && apt-get install -y -qq git
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y -q git
  elif command -v yum >/dev/null 2>&1; then
    yum install -y -q git
  else
    echo "[deploy] Install Git and re-run."; exit 1
  fi
fi

# Clone / güncelle
mkdir -p "$WORKSPACE"
cd "$WORKSPACE"
if [ ! -d platformariot ]; then
  echo "[deploy] Cloning platformariot..."
  git clone --depth 1 -b "$REPO_BRANCH" "$REPO" platformariot
else
  echo "[deploy] Updating platformariot..."
  (cd platformariot && git fetch origin "$REPO_BRANCH" 2>/dev/null && git checkout "$REPO_BRANCH" 2>/dev/null && git reset --hard "origin/$REPO_BRANCH" 2>/dev/null) || true
fi

# Compose up
echo "[deploy] Pulling image and starting stack (examples/stack.yaml)..."
cd "$WORKSPACE/platformariot/examples"
$COMPOSE_CMD -f stack.yaml pull
$COMPOSE_CMD -f stack.yaml up -d

SERVER_IP=""
command -v hostname >/dev/null 2>&1 && hostname -I 2>/dev/null | grep -q . && SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$SERVER_IP" ] && SERVER_IP="<sunucu-ip>"

echo ""
echo "[deploy] Tamamlandı."
echo "  UI:    http://${SERVER_IP}:9080"
echo "  Logs:  docker logs -f beaver-iot"
echo "  (ChirpStack webhook: http://${SERVER_IP}:9080/public/integration/chirpstack/webhook?event=uplink)"
