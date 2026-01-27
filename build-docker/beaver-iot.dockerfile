ARG BASE_API_IMAGE=milesight/beaver-iot-api
ARG BASE_WEB_IMAGE=milesight/beaver-iot-web

FROM ${BASE_WEB_IMAGE} AS web

FROM ${BASE_API_IMAGE} AS monolith
COPY --from=web /web /web
RUN apk add --no-cache envsubst nginx nginx-mod-http-headers-more netcat-openbsd
COPY nginx/envsubst-on-templates.sh /envsubst-on-templates.sh
RUN chmod +x /envsubst-on-templates.sh
COPY nginx/main.conf /etc/nginx/nginx.conf
COPY nginx/templates /etc/nginx/templates
COPY nginx/loading.html /web/loading.html
COPY monolith-start.sh /monolith-start.sh
RUN chmod +x /monolith-start.sh

RUN mkdir -p /root/beaver-iot/integrations
COPY integrations/ /root/beaver-iot/integrations/

ENV BEAVER_IOT_API_HOST=localhost
ENV BEAVER_IOT_API_PORT=9200
ENV MQTT_BROKER_WS_PATH=/mqtt
ENV MQTT_BROKER_WS_PORT=""
ENV MQTT_BROKER_MOQUETTE_WEBSOCKET_PORT=8083

EXPOSE 80
EXPOSE 9200
EXPOSE 1883
EXPOSE 8083

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/monolith-start.sh"]
