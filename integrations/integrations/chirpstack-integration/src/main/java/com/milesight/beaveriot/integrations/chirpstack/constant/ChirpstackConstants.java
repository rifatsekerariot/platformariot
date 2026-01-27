package com.milesight.beaveriot.integrations.chirpstack.constant;

public final class ChirpstackConstants {

    private ChirpstackConstants() {
    }

    public static final String INTEGRATION_ID = "chirpstack-integration";

    /**
     * Env var for default tenant when X-Tenant-Id header is not present (no token/password).
     */
    public static final String ENV_DEFAULT_TENANT_ID = "CHIRPSTACK_DEFAULT_TENANT_ID";

    public static final String HEADER_TENANT_ID = "X-Tenant-Id";

    public static final String QUERY_EVENT = "event";

    /** Device additional key for selected sensor model (e.g. am102, em500-udl). */
    public static final String DEVICE_ADDITIONAL_SENSOR_MODEL = "sensorModel";
}
