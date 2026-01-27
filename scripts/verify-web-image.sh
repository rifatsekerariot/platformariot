#!/bin/sh
# Verify web image has /web, index.html, assets, and widget-related chunks.
# Our build emits useAlarmEmphasis-*, DrawingBoard-* (not Alarm-/Map-); check those.

set -e
IMAGE="${VERIFY_WEB_IMAGE:-milesight/beaver-iot-web:latest}"

echo "=== Verifying web image: $IMAGE ==="
echo "=== Listing /web contents ==="
docker run --rm --entrypoint sh "$IMAGE" -c 'ls -la /web || true'

echo "=== Checking /web structure ==="
docker run --rm --entrypoint sh "$IMAGE" -c '
  test -f /web/index.html || { echo "ERROR: missing /web/index.html"; exit 1; }
  echo "✓ /web/index.html exists"
  
  # Check if assets directory exists (may be in different location)
  if [ -d /web/assets ]; then
    echo "✓ /web/assets directory exists"
    test -d /web/assets/js || { echo "ERROR: missing /web/assets/js"; exit 1; }
    echo "✓ /web/assets/js directory exists"
    
    echo "=== Listing /web/assets/js (first 20) ==="
    ls /web/assets/js | head -20 || true
    
    ls /web/assets/js | grep -qE "^useAlarmEmphasis-" || { echo "WARNING: missing useAlarmEmphasis-*.js (widget hook)"; }
    ls /web/assets/js | grep -qE "^DrawingBoard-"     || { echo "WARNING: missing DrawingBoard-*.js"; }
  else
    echo "ERROR: /web/assets directory not found"
    echo "=== Checking if build actually ran ==="
    # Check if there are any JS files at all (might indicate incomplete build)
    JS_COUNT=$(find /web -name "*.js" -type f 2>/dev/null | wc -l || echo "0")
    echo "Found $JS_COUNT .js files in /web"
    
    # List all directories in /web
    echo "=== All directories in /web ==="
    find /web -type d -maxdepth 2 | head -20 || true
    echo "=== All files in /web ==="
    find /web -type f -maxdepth 2 | head -30 || true
    echo "=== All .js files in /web ==="
    find /web -name "*.js" -type f | head -20 || true
    
    # This is a critical error - build likely failed
    echo "ERROR: /web/assets directory not found - build may have failed or output structure is incorrect"
    exit 1;
  fi
'
echo "OK: web image verification passed ($IMAGE)"
