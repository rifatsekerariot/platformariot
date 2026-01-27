#!/bin/sh
# Tag monolith as ghcr.io/rifatsekerariot/beaver-iot:latest and push (CI).
# IMAGE env must be set (e.g. ghcr.io/rifatsekerariot/beaver-iot).

set -e
docker tag milesight/beaver-iot:latest "${IMAGE:?}:latest"
docker push "${IMAGE}:latest"
