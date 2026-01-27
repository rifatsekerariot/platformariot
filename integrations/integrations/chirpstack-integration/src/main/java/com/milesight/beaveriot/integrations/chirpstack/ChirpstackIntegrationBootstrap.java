package com.milesight.beaveriot.integrations.chirpstack;

import com.milesight.beaveriot.context.integration.bootstrap.IntegrationBootstrap;
import com.milesight.beaveriot.context.integration.model.Integration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Bootstrap for ChirpStack HTTP Integration. No token or password.
 */
@Slf4j
@Component
public class ChirpstackIntegrationBootstrap implements IntegrationBootstrap {

    @Override
    public void onPrepared(Integration integration) {
        // no-op
    }

    @Override
    public void onStarted(Integration integration) {
        log.info("ChirpStack HTTP integration started (webhook: POST /public/integration/chirpstack/webhook)");
    }

    @Override
    public void onDestroy(Integration integration) {
        log.info("ChirpStack HTTP integration destroyed");
    }
}
