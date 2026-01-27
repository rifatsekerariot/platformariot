#!/bin/sh
# Monorepo: build ChirpStack JAR from local integrations/, copy to build-docker/integrations.
# Run from repo root.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ ! -f "$ROOT/integrations/pom.xml" ]; then
  echo "ERROR: integrations/pom.xml not found"
  exit 1
fi

docker run --rm \
  -v "$ROOT/integrations:/workspace" \
  -w /workspace \
  maven:3.8-eclipse-temurin-17-alpine \
  mvn clean package -DskipTests -pl integrations/chirpstack-integration -am -q

JAR=$(find "$ROOT/integrations/integrations/chirpstack-integration/target" -maxdepth 1 -name 'chirpstack-integration-*.jar' ! -name '*original*' 2>/dev/null | head -1)
if [ -z "$JAR" ] || [ ! -f "$JAR" ]; then
  echo "ERROR: ChirpStack JAR not found"
  exit 1
fi
mkdir -p "$ROOT/build-docker/integrations"
cp -f "$JAR" "$ROOT/build-docker/integrations/"
echo "JAR copied to build-docker/integrations"
