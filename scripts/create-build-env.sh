#!/bin/sh
# Create build-docker/.env for CI. Monorepo: no API/WEB git URLs needed for local dockerfiles.
# Run from repo root.

set -e
cd "$(dirname "$0")/../build-docker"
cat << ENVEOF > .env
API_GIT_REPO_URL=${API_GIT_REPO_URL:-}
API_GIT_BRANCH=${API_GIT_BRANCH:-}
WEB_GIT_REPO_URL=${WEB_GIT_REPO_URL:-}
WEB_GIT_BRANCH=${WEB_GIT_BRANCH:-}
DOCKER_REPO=milesight
PRODUCTION_TAG=latest
ENVEOF
echo "Created build-docker/.env (monorepo, DOCKER_REPO=milesight)"
