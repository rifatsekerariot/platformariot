#!/bin/sh
# Start API first, wait for it, then nginx. Avoids 502 on /api while Java boots.
# Loading page (/loading.html) will check backend status and redirect when ready.
set -e

/envsubst-on-templates.sh

java -Dloader.path="${HOME}/beaver-iot/integrations" ${JAVA_OPTS} -jar /application.jar ${SPRING_OPTS} &

# Wait for API port 9200 (max 120s)
i=0
while [ $i -lt 120 ]; do
  if nc -z 127.0.0.1 9200 2>/dev/null; then
    break
  fi
  sleep 2
  i=$((i + 2))
done

# Note: Even if port is open, Spring Boot may still be initializing.
# The loading.html page will handle the final readiness check via JavaScript.

exec nginx -g 'daemon off;'
