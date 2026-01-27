# Monorepo: build Web from local web/ (no git clone).
# Build context: repo root. Example: docker build -f build-docker/beaver-iot-web-local.dockerfile -t web .

FROM node:20.18.0-alpine3.20 AS web-builder

WORKDIR /beaver-iot-web
COPY web/ .

ENV CI=true
# Install pnpm (version 9 as required by preinstall script)
RUN npm install -g pnpm@9
# Install dependencies with frozen lockfile (CI best practice)
# Note: postinstall script will run build:pkgs automatically
RUN pnpm install --frozen-lockfile
# Build apps (packages already built by postinstall script)
RUN pnpm run build:apps

FROM alpine:3.20 AS web
COPY --from=web-builder /beaver-iot-web/apps/web/dist /web

RUN apk add --no-cache envsubst nginx nginx-mod-http-headers-more
COPY build-docker/nginx/envsubst-on-templates.sh /envsubst-on-templates.sh
RUN chmod +x /envsubst-on-templates.sh
COPY build-docker/nginx/main.conf /etc/nginx/nginx.conf
COPY build-docker/nginx/templates /etc/nginx/templates

ENV BEAVER_IOT_API_HOST=172.17.0.1
ENV BEAVER_IOT_API_PORT=9200
ENV MQTT_BROKER_WS_PATH=/mqtt
ENV MQTT_BROKER_WS_PORT=""
ENV MQTT_BROKER_MOQUETTE_WEBSOCKET_PORT=8083

EXPOSE 80

RUN mkdir -p /run/nginx

COPY build-docker/docker-entrypoint.sh /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/bin/sh", "-c", "/envsubst-on-templates.sh && nginx -g 'daemon off;'"]
