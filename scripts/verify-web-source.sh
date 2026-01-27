#!/bin/sh
# Verify web/ has expected files (monorepo: .git/origin check skipped).
# Run from repo root. Arg: web dir (default web).

set -e
WEB_DIR="${1:-web}"
COMPONENTS="apps/web/src/components/drawing-board/plugin/plugins/components.ts"
FILTER="apps/web/src/components/drawing-board/hooks/useFilterPlugins.tsx"

if [ ! -d "$WEB_DIR" ]; then
  echo "ERROR: $WEB_DIR not found"
  exit 1
fi

# Monorepo: skip git origin check

# components.ts: import.meta.glob('./*/control-panel/index.ts')
if ! grep -q "control-panel/index.ts" "$WEB_DIR/$COMPONENTS" 2>/dev/null || ! grep -q "import.meta.glob" "$WEB_DIR/$COMPONENTS" 2>/dev/null; then
  echo "ERROR: components.ts missing widget glob (expected control-panel glob)"
  exit 1
fi

# useFilterPlugins: return pluginsControlPanel
if ! grep -q "return pluginsControlPanel" "$WEB_DIR/$FILTER" 2>/dev/null; then
  echo "ERROR: useFilterPlugins missing 'return pluginsControlPanel'"
  exit 1
fi

echo "OK: web/ has components.ts + useFilterPlugins widget fixes"
