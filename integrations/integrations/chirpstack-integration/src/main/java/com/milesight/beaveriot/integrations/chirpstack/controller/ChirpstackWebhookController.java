package com.milesight.beaveriot.integrations.chirpstack.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.milesight.beaveriot.context.security.TenantContext;
import com.milesight.beaveriot.integrations.chirpstack.constant.ChirpstackConstants;
import com.milesight.beaveriot.integrations.chirpstack.service.ChirpstackWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * Public webhook for ChirpStack v4 HTTP Integration. No token or password.
 * Tenant from {@link ChirpstackConstants#HEADER_TENANT_ID} or env
 * {@link ChirpstackConstants#ENV_DEFAULT_TENANT_ID}.
 */
@Slf4j
@RestController
@RequestMapping("/public/integration/chirpstack")
@RequiredArgsConstructor
public class ChirpstackWebhookController {

    private final ChirpstackWebhookService chirpstackWebhookService;

    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(
            @RequestParam(name = ChirpstackConstants.QUERY_EVENT, required = false) String event,
            @RequestHeader(name = ChirpstackConstants.HEADER_TENANT_ID, required = false) String tenantIdHeader,
            @RequestBody JsonNode body) {

        String tenantId = Optional.ofNullable(tenantIdHeader)
                .filter(s -> !s.isBlank())
                .or(() -> Optional.ofNullable(System.getenv(ChirpstackConstants.ENV_DEFAULT_TENANT_ID)))
                .filter(s -> !s.isBlank())
                .orElse(null);

        if (tenantId == null) {
            log.warn("ChirpStack webhook: tenant not configured (set X-Tenant-Id header or {} env)", ChirpstackConstants.ENV_DEFAULT_TENANT_ID);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("tenant not configured");
        }

        TenantContext.setTenantId(tenantId);
        try {
            chirpstackWebhookService.handle(event, body);
            return ResponseEntity.ok("ok");
        } catch (Exception e) {
            log.error("ChirpStack webhook error: event={}", event, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error");
        }
        // Note: TenantContext.setTenantId(null) throws; per-request thread typically cleared by framework.
    }
}
