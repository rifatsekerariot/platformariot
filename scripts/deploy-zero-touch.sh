#!/bin/sh
# Zero-touch deploy: Beaver IoT + ChirpStack v4 on a Linux server.
# Linux only. Usage:
#   curl -sSL .../deploy-zero-touch.sh | sudo sh -s -- [--tenant-id ID] [--workspace DIR] [--skip-docker-install] [--build-images] [--postgres] [--postgres-password PWD] [--web-repo URL] [--web-branch BRANCH]
#   ./deploy-zero-touch.sh [options]
#
# --build-images: Build api/web/monolith from source (WEB from your fork). Use for live-server
#   testing with Alarm/Map/DeviceList widgets. Omitting uses prebuilt image (pull); no JAR build.
# --postgres: Use PostgreSQL instead of H2 (chirpstack-prebuilt-postgres.yaml).
# --postgres-password PWD: Set POSTGRES_PASSWORD (default: postgres).

set -e

REPO_INTEGRATIONS="${REPO_INTEGRATIONS:-https://github.com/rifatsekerariot/beaver-iot-integrations.git}"
REPO_DOCKER="${REPO_DOCKER:-https://github.com/rifatsekerariot/beaver-iot-docker.git}"
REPO_WEB="${REPO_WEB:-https://github.com/rifatsekerariot/beaver-iot-web.git}"
REPO_WEB_BRANCH="${REPO_WEB_BRANCH:-origin/main}"
REPO_API="${REPO_API:-https://github.com/Milesight-IoT/beaver-iot.git}"
REPO_API_BRANCH="${REPO_API_BRANCH:-origin/release}"
MAVEN_IMAGE="${MAVEN_IMAGE:-maven:3.8-eclipse-temurin-17-alpine}"
WORKSPACE="${WORKSPACE:-/opt/beaver-chirpstack}"
TENANT_ID=""
SKIP_DOCKER_INSTALL=""
BUILD_IMAGES=""
USE_POSTGRES=""
POSTGRES_PWD=""

# POSIX-friendly option parsing
while [ $# -gt 0 ]; do
  case "$1" in
    --tenant-id)
      if [ $# -lt 2 ]; then
        echo "[zero-touch] --tenant-id requires a value"
        exit 1
      fi
      TENANT_ID="$2"
      shift 2
      ;;
    --workspace)
      if [ $# -lt 2 ]; then
        echo "[zero-touch] --workspace requires a value"
        exit 1
      fi
      WORKSPACE="$2"
      shift 2
      ;;
    --skip-docker-install)
      SKIP_DOCKER_INSTALL=1
      shift
      ;;
    --build-images)
      BUILD_IMAGES=1
      shift
      ;;
    --postgres)
      USE_POSTGRES=1
      shift
      ;;
    --postgres-password)
      if [ $# -lt 2 ]; then
        echo "[zero-touch] --postgres-password requires a value"
        exit 1
      fi
      POSTGRES_PWD="$2"
      shift 2
      ;;
    --web-repo)
      if [ $# -lt 2 ]; then
        echo "[zero-touch] --web-repo requires a value"
        exit 1
      fi
      REPO_WEB="$2"
      shift 2
      ;;
    --web-branch)
      if [ $# -lt 2 ]; then
        echo "[zero-touch] --web-branch requires a value"
        exit 1
      fi
      REPO_WEB_BRANCH="$2"
      shift 2
      ;;
    *)
      echo "[zero-touch] Unknown option: $1"
      exit 1
      ;;
  esac
done

export WORKSPACE
export CHIRPSTACK_DEFAULT_TENANT_ID="${TENANT_ID:-default}"

echo "[zero-touch] Linux zero-touch deploy: Beaver IoT + ChirpStack v4"
echo "[zero-touch] Workspace: $WORKSPACE"
echo "[zero-touch] Tenant ID:  ${TENANT_ID:-default (use --tenant-id to override)}"
if [ -n "$USE_POSTGRES" ]; then
  echo "[zero-touch] Database: PostgreSQL (chirpstack-prebuilt-postgres.yaml)"
fi
if [ -n "$BUILD_IMAGES" ]; then
  echo "[zero-touch] Build images: yes (api=$REPO_API $REPO_API_BRANCH, web=$REPO_WEB $REPO_WEB_BRANCH)"
else
  echo "[zero-touch] Build images: no (pull prebuilt, JAR baked in; no integrations clone or JAR build)"
fi

# --- Docker ---
install_docker() {
  if command -v docker >/dev/null 2>&1; then
    echo "[zero-touch] Docker already installed."
    return 0
  fi
  echo "[zero-touch] Installing Docker..."
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
  if ! command -v docker >/dev/null 2>&1; then
    echo "[zero-touch] Docker not found. Run without --skip-docker-install to install."
    exit 1
  fi
fi

# --- Docker Compose ---
COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "[zero-touch] ERROR: docker compose or docker-compose not found. Install Docker Compose and re-run."
  exit 1
fi

# --- Git ---
if ! command -v git >/dev/null 2>&1; then
  echo "[zero-touch] Installing Git..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq && apt-get install -y -qq git
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y -q git
  elif command -v yum >/dev/null 2>&1; then
    yum install -y -q git
  else
    echo "[zero-touch] Could not install Git (apt-get/dnf/yum not found). Install Git and re-run."
    exit 1
  fi
fi

# --- Workspace ---
mkdir -p "$WORKSPACE"
cd "$WORKSPACE"

# --- Clone beaver-iot-docker (always) ---
if [ ! -d beaver-iot-docker ]; then
  echo "[zero-touch] Cloning beaver-iot-docker..."
  git clone --depth 1 -b main "$REPO_DOCKER" beaver-iot-docker
else
  echo "[zero-touch] Updating beaver-iot-docker..."
  (cd beaver-iot-docker && git fetch origin main 2>/dev/null && git checkout main 2>/dev/null && git reset --hard origin/main 2>/dev/null) || true
fi

# --- Integrations + JAR only when building images ---
if [ -n "$BUILD_IMAGES" ]; then
  if [ ! -d beaver-iot-integrations ]; then
    echo "[zero-touch] Cloning beaver-iot-integrations..."
    git clone --depth 1 -b main "$REPO_INTEGRATIONS" beaver-iot-integrations
  else
    echo "[zero-touch] Updating beaver-iot-integrations..."
    (cd beaver-iot-integrations && git fetch origin main 2>/dev/null && git checkout main 2>/dev/null && git reset --hard origin/main 2>/dev/null) || true
  fi

  echo "[zero-touch] Building chirpstack-integration JAR (Docker Maven)..."
  docker run --rm \
    -v "$WORKSPACE/beaver-iot-integrations:/workspace" \
    -w /workspace \
    "$MAVEN_IMAGE" \
    mvn clean package -DskipTests -pl integrations/chirpstack-integration -am -q

  JAR_DIR="$WORKSPACE/beaver-iot-integrations/integrations/chirpstack-integration/target"
  JAR=$(find "$JAR_DIR" -maxdepth 1 -name 'chirpstack-integration-*.jar' ! -name '*original*' 2>/dev/null | head -1)
  if [ -z "$JAR" ] || [ ! -f "$JAR" ]; then
    echo "[zero-touch] ERROR: ChirpStack JAR not found in $JAR_DIR"
    exit 1
  fi
  echo "[zero-touch] Built: $JAR"

  TARGET_DIR="$WORKSPACE/beaver-iot-docker/examples/target/chirpstack/integrations"
  mkdir -p "$TARGET_DIR"
  cp -f "$JAR" "$TARGET_DIR/"
  echo "[zero-touch] Copied JAR to $TARGET_DIR"

  INTEGRATIONS_DIR="$WORKSPACE/beaver-iot-docker/build-docker/integrations"
  mkdir -p "$INTEGRATIONS_DIR"
  cp -f "$JAR" "$INTEGRATIONS_DIR/"
  echo "[zero-touch] Copied JAR to build-docker/integrations (bake into image)"
fi

# --- Optional: Build Docker images (api, web, monolith) ---
if [ -n "$BUILD_IMAGES" ]; then
  echo "[zero-touch] Building Docker images (api, web, monolith)... This may take 15-25 minutes."
  BD="$WORKSPACE/beaver-iot-docker/build-docker"
  if [ ! -d "$BD" ] || [ ! -f "$BD/docker-compose.yaml" ]; then
    echo "[zero-touch] ERROR: build-docker not found at $BD"
    exit 1
  fi
  # .env ensures WEB_GIT_BRANCH=origin/main (widget fix); avoid origin/develop default
  {
    echo "API_GIT_REPO_URL=$REPO_API"
    echo "API_GIT_BRANCH=$REPO_API_BRANCH"
    echo "WEB_GIT_REPO_URL=$REPO_WEB"
    echo "WEB_GIT_BRANCH=$REPO_WEB_BRANCH"
  } > "$BD/.env"
  export API_GIT_REPO_URL="$REPO_API"
  export API_GIT_BRANCH="$REPO_API_BRANCH"
  export WEB_GIT_REPO_URL="$REPO_WEB"
  export WEB_GIT_BRANCH="$REPO_WEB_BRANCH"
  cd "$BD"
  # Build order matters: monolith FROM web image; web must exist before monolith.
  if ! $COMPOSE_CMD build --no-cache api; then
    echo "[zero-touch] ERROR: Docker api build failed."
    exit 1
  fi
  if ! $COMPOSE_CMD build --no-cache web; then
    echo "[zero-touch] ERROR: Docker web build failed."
    exit 1
  fi
  if ! $COMPOSE_CMD build --no-cache monolith; then
    echo "[zero-touch] ERROR: Docker monolith build failed. Check logs above."
    exit 1
  fi
  cd "$WORKSPACE"
  echo "[zero-touch] Docker images built successfully."
fi

# --- Compose up ---
if [ -n "$USE_POSTGRES" ]; then
  COMPOSE_FILE="chirpstack-prebuilt-postgres.yaml"
  if [ -n "$BUILD_IMAGES" ]; then
    export BEAVER_IMAGE="milesight/monolith:latest"
  else
    export BEAVER_IMAGE="${BEAVER_IMAGE:-ghcr.io/rifatsekerariot/beaver-iot:latest}"
  fi
  [ -n "$POSTGRES_PWD" ] && export POSTGRES_PASSWORD="$POSTGRES_PWD"
else
  if [ -n "$BUILD_IMAGES" ]; then
    export BEAVER_IMAGE="milesight/beaver-iot:latest"
    COMPOSE_FILE="chirpstack.yaml"
  else
    export BEAVER_IMAGE="${BEAVER_IMAGE:-ghcr.io/rifatsekerariot/beaver-iot:latest}"
    COMPOSE_FILE="chirpstack-prebuilt.yaml"
  fi
fi
echo "[zero-touch] Starting Beaver IoT + ChirpStack stack (image: $BEAVER_IMAGE, compose: $COMPOSE_FILE)..."
cd "$WORKSPACE/beaver-iot-docker/examples"
if [ -z "$BUILD_IMAGES" ]; then
  echo "[zero-touch] Pulling latest prebuilt image (ensure Alarm/Map/Device List widgets)..."
  $COMPOSE_CMD -f "$COMPOSE_FILE" pull
fi
$COMPOSE_CMD -f "$COMPOSE_FILE" up -d

# --- Summary ---
SERVER_IP=""
if command -v hostname >/dev/null 2>&1; then
  if hostname -I 2>/dev/null | grep -q .; then
    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi
fi
if [ -z "$SERVER_IP" ]; then
  SERVER_IP="<sunucu-ip>"
fi

echo ""
echo "[zero-touch] Done."
echo "  UI:       http://${SERVER_IP}:9080"
echo "  Webhook:  http://${SERVER_IP}:9080/public/integration/chirpstack/webhook"
echo "  Logs:     docker logs -f beaver-iot"
echo "  Cihaz:    Device -> Add -> ChirpStack HTTP; DevEUI = External Device ID"
