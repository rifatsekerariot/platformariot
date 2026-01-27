#!/bin/sh
# Monorepo: web/ is already in repo. No-op if web/ exists with expected content.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -d "$ROOT/web" ] && [ -f "$ROOT/web/package.json" ]; then
  echo "Monorepo: web/ already present, skipping clone."
  exit 0
fi
echo "ERROR: web/ or web/package.json not found."
exit 1
