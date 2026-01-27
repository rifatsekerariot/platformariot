#!/bin/sh
# Beaver IoT + PostgreSQL + Caddy: tek curl ile kurulum, domain ile HTTPS (443).
#
# curl -sSL https://raw.githubusercontent.com/rifatsekerariot/beaver-iot-docker/main/scripts/deploy-caddy-postgres.sh | sudo sh -s --
# curl -sSL .../deploy-caddy-postgres.sh | sudo sh -s -- --domain beaver.example.com
#
# Ilk kurulumda domain ister; --domain verilmezse .beaver-domain dosyasi yoksa prompt.
# Domain .beaver-domain'e yazilir; degistirmek icin bu dosyayi silip tekrar calistirin.
#
# Caddy: Let's Encrypt ile otomatik HTTPS, sertifika yenileme Caddy icinde.
# Gereksinim: Domain A kaydi sunucu IP'sine, 80/443 dis dunyaya acik.

set -e

REPO_DOCKER="${REPO_DOCKER:-https://github.com/rifatsekerariot/beaver-iot-docker.git}"
WORKSPACE="${WORKSPACE:-/opt/beaver-chirpstack}"
DOMAIN_ARG=""
SKIP_DOCKER_INSTALL=""
POSTGRES_PWD=""
TENANT_ID=""

while [ $# -gt 0 ]; do
  case "$1" in
    --domain)
      if [ $# -lt 2 ]; then
        echo "[caddy-pg] --domain degeri gerekli"
        exit 1
      fi
      DOMAIN_ARG="$2"
      shift 2
      ;;
    --workspace)
      if [ $# -lt 2 ]; then
        echo "[caddy-pg] --workspace degeri gerekli"
        exit 1
      fi
      WORKSPACE="$2"
      shift 2
      ;;
    --skip-docker-install)
      SKIP_DOCKER_INSTALL=1
      shift
      ;;
    --postgres-password)
      if [ $# -lt 2 ]; then
        echo "[caddy-pg] --postgres-password degeri gerekli"
        exit 1
      fi
      POSTGRES_PWD="$2"
      shift 2
      ;;
    --tenant-id)
      if [ $# -lt 2 ]; then
        echo "[caddy-pg] --tenant-id degeri gerekli"
        exit 1
      fi
      TENANT_ID="$2"
      shift 2
      ;;
    *)
      echo "[caddy-pg] Bilinmeyen secenek: $1"
      exit 1
      ;;
  esac
done

export WORKSPACE
export CHIRPSTACK_DEFAULT_TENANT_ID="${TENANT_ID:-default}"
[ -n "$POSTGRES_PWD" ] && export POSTGRES_PASSWORD="$POSTGRES_PWD"

echo "[caddy-pg] Beaver IoT + PostgreSQL + Caddy (HTTPS, 443)"
echo "[caddy-pg] Workspace: $WORKSPACE"

# --- Domain ---
DOMAIN_FILE="$WORKSPACE/.beaver-domain"
if [ -n "$DOMAIN_ARG" ]; then
  DOMAIN="$DOMAIN_ARG"
  echo "[caddy-pg] Domain (--domain): $DOMAIN"
else
  if [ -f "$DOMAIN_FILE" ]; then
    DOMAIN=$(cat "$DOMAIN_FILE" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    echo "[caddy-pg] Domain (.beaver-domain): $DOMAIN"
  else
    echo "[caddy-pg] Ilk kurulum: Domain adresinizi girin (orn. beaver.sirket.com):"
    if [ -c /dev/tty ] 2>/dev/null; then
      read -r DOMAIN </dev/tty
    else
      read -r DOMAIN
    fi
    DOMAIN=$(echo "$DOMAIN" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  fi
fi
DOMAIN=$(printf '%s' "$DOMAIN" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

if [ -z "$DOMAIN" ]; then
  echo "[caddy-pg] HATA: Domain bos olamaz. --domain verin veya soruldugunda girin."
  exit 1
fi

mkdir -p "$WORKSPACE"
printf '%s' "$DOMAIN" > "$DOMAIN_FILE"
echo "[caddy-pg] Domain kaydedildi: $DOMAIN_FILE (degistirmek icin silin)"

# --- Docker ---
install_docker() {
  if command -v docker >/dev/null 2>&1; then
    echo "[caddy-pg] Docker zaten kurulu."
    return 0
  fi
  echo "[caddy-pg] Docker kuruluyor..."
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
    echo "[caddy-pg] Docker bulunamadi. --skip-docker-install kullanmayin veya Docker kurun."
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
  echo "[caddy-pg] HATA: docker compose veya docker-compose gerekli."
  exit 1
fi

# --- Git ---
if ! command -v git >/dev/null 2>&1; then
  echo "[caddy-pg] Git kuruluyor..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq && apt-get install -y -qq git
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y -q git
  elif command -v yum >/dev/null 2>&1; then
    yum install -y -q git
  else
    echo "[caddy-pg] Git kuralamadim. Git kurup tekrar calistirin."
    exit 1
  fi
fi

# --- Clone beaver-iot-docker ---
mkdir -p "$WORKSPACE"
cd "$WORKSPACE"
if [ ! -d beaver-iot-docker ]; then
  echo "[caddy-pg] beaver-iot-docker klonlaniyor..."
  git clone --depth 1 -b main "$REPO_DOCKER" beaver-iot-docker
else
  echo "[caddy-pg] beaver-iot-docker guncelleniyor..."
  (cd beaver-iot-docker && git fetch origin main 2>/dev/null && git checkout main 2>/dev/null && git reset --hard origin/main 2>/dev/null) || true
fi

# --- Caddyfile (domain ile) ---
CADDYFILE="$WORKSPACE/beaver-iot-docker/examples/Caddyfile"
cat > "$CADDYFILE" << EOF
# Otomatik uretildi; domain: $DOMAIN
$DOMAIN {
    reverse_proxy monolith:80
}
EOF
echo "[caddy-pg] Caddyfile yazildi: $CADDYFILE"

# --- Compose up ---
export BEAVER_IMAGE="${BEAVER_IMAGE:-ghcr.io/rifatsekerariot/beaver-iot:latest}"
COMPOSE_FILE="chirpstack-prebuilt-postgres-caddy.yaml"
EX_DIR="$WORKSPACE/beaver-iot-docker/examples"
cd "$EX_DIR"

echo "[caddy-pg] Imajlar cekiliyor (PostgreSQL, Beaver, Caddy)..."
$COMPOSE_CMD -f "$COMPOSE_FILE" pull

echo "[caddy-pg] PostgreSQL + Beaver + Caddy baslatiliyor..."
$COMPOSE_CMD -f "$COMPOSE_FILE" up -d

# --- Ozet ---
echo ""
echo "[caddy-pg] Kurulum tamam."
echo "  HTTPS:    https://$DOMAIN"
echo "  (Ilk acilista Caddy sertifika alir; 1-2 dakika surebilir.)"
echo "  Yedek:    http://localhost:9080 (sadece HTTP, yerel)"
echo "  Webhook:  https://$DOMAIN/public/integration/chirpstack/webhook"
echo "  Log:      docker logs -f beaver-iot ; docker logs -f beaver-iot-caddy"
echo "  Domain:   $DOMAIN_FILE (degistirmek icin silin, scripti tekrar calistirin)"
