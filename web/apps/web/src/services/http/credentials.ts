import { client, attachAPI, API_PREFIX } from './client';

/** Credential Encryption Type */
export type CredentialEncryption = 'TLS' | 'STARTTLS' | 'NONE';

/** Credential additionalData Type */
export type CredentialsAdditionalData = {
    host: string;
    port: string;
    username: string;
    password: string;
    encryption: CredentialEncryption;
};

/** Credential Type */
export type CredentialType = {
    id: string;
    tenant_id: string;
    credentials_type: string;
    description: string;
    access_key: string;
    access_secret: string;
    additional_data?: Record<string, any>;
    editable: boolean;
    created_at: number;
    updated_at: number;
};

export interface CredentialAPISchema extends APISchema {
    /** Get default credential */
    getDefaultCredential: {
        request: {
            credentialsType: 'SMTP' | 'MQTT' | 'HTTP';
            auto_generate_password?: boolean;
        };
        response: CredentialType;
    };

    /** Get MQTT credential */
    getMqttCredential: {
        request: void;
        response: {
            client_id: string;
            username: string;
            password: string;
        };
    };

    /** Get MQTT broker info */
    getMqttBrokerInfo: {
        request: void;
        response: {
            host?: string;
            mqtt_port?: number;
            mqtts_port?: number;
            ws_path?: string;
            ws_port?: number;
            wss_port?: number;
        };
    };

    /** update smtp credential */
    editCredential: {
        request: {
            id: string;
            description: string;
            access_key: string;
            access_secret: string;
            additional_data?: Record<string, any>;
        };
        response: unknown;
    };
}

/**
 * credentials related API services
 */
export default attachAPI<CredentialAPISchema>(client, {
    apis: {
        getDefaultCredential: `GET ${API_PREFIX}/credentials/default/:credentialsType`,
        getMqttCredential: `GET ${API_PREFIX}/mqtt/web/credentials`,
        getMqttBrokerInfo: `GET ${API_PREFIX}/mqtt/broker-info`,
        editCredential: `PUT ${API_PREFIX}/credentials/:id`,
    },
});
