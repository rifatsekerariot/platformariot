import { useEffect } from 'react';
import { useRequest, clearCache } from 'ahooks';
import { useStoreShallow } from '@milesight/shared/src/hooks';
import { credentialsApi, awaitWrap, getResponseData, isRequestSuccess } from '@/services/http';
import useFlowStore from '../store';

const mqttCacheKey = 'workflow-mqtt-credentials';
const httpCacheKey = 'workflow-http-credentials';

const useCredential = () => {
    const { mqttCredentials, httpCredentials, setMqttCredentials, setHttpCredentials } =
        useFlowStore(
            useStoreShallow([
                'mqttCredentials',
                'httpCredentials',
                'setMqttCredentials',
                'setHttpCredentials',
            ]),
        );

    // Get MQTT credentials and broker info
    const { loading: mqttCredentialsLoading } = useRequest(
        async () => {
            const [err, resp] = await awaitWrap(
                Promise.all([
                    credentialsApi.getDefaultCredential({
                        credentialsType: 'MQTT',
                        auto_generate_password: true,
                    }),
                    credentialsApi.getMqttBrokerInfo(),
                ]),
            );
            const [basicResp, brokerResp] = resp || [];

            if (err || !isRequestSuccess(basicResp) || !isRequestSuccess(brokerResp)) {
                return;
            }
            const basicInfo = getResponseData(basicResp);
            const brokerInfo = getResponseData(brokerResp);
            const result =
                basicInfo && brokerInfo
                    ? {
                          ...basicInfo,
                          ...brokerInfo,
                      }
                    : null;

            setMqttCredentials(result);
        },
        {
            debounceWait: 300,
            cacheKey: mqttCacheKey,
            staleTime: 10 * 1000,
        },
    );

    const { loading: httpCredentialsLoading } = useRequest(
        async () => {
            const [err, resp] = await awaitWrap(
                credentialsApi.getDefaultCredential({
                    credentialsType: 'HTTP',
                    auto_generate_password: true,
                }),
            );

            if (err) return;
            const result = getResponseData(resp);
            setHttpCredentials(result);
        },
        {
            debounceWait: 300,
            cacheKey: httpCacheKey,
            staleTime: 10 * 1000,
        },
    );

    useEffect(() => {
        return () => {
            clearCache(mqttCacheKey);
            clearCache(httpCacheKey);
        };
    }, []);

    return {
        mqttCredentials,
        mqttCredentialsLoading,

        httpCredentials,
        httpCredentialsLoading,
    };
};

export default useCredential;
