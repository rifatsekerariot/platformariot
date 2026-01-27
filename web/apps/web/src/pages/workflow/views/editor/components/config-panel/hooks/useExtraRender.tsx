import { useCallback, useMemo } from 'react';
import { useI18n } from '@milesight/shared/src/hooks';
import { safeJsonParse } from '@milesight/shared/src/utils/tools';
import { Result as ParseResult } from '@milesight/shared/src/utils/curl-parser';
import {
    HttpCurlDialog,
    HttpCurlInfo,
    HttpOutputInfo,
    ParamsList,
    type HttpOutputInfoProps,
    type ParamsListProps,
} from '../components';
import useCredential from '../../../hooks/useCredential';
import useFlowStore from '../../../store';

interface RenderFunctionProps {
    /**
     * Current Node
     */
    node?: WorkflowNode;

    /**
     * The name of the form group
     */
    formGroupName?: string;

    /**
     * The index of the form group in the form group list
     */
    formGroupIndex?: number;

    /**
     * Current Form Data
     */
    data?: Record<string, any>;
}

interface RenderActionProps extends RenderFunctionProps {
    /**
     * Callback when the form data changes
     */
    onChange: (data: Record<string, any>) => void;
}

interface RenderGroupContentProps extends RenderFunctionProps {
    /**
     * Whether the form group is the last one in the list
     */
    isLastFormGroup?: boolean;
}

interface Props {
    isLogMode?: boolean;
}

type RenderGroupFooterProps = Pick<RenderFunctionProps, 'node' | 'data'>;

const memoTimestamp = Date.now();

const useExtraRender = ({ isLogMode }: Props = {}) => {
    const { getIntlText } = useI18n();
    const nodeConfigs = useFlowStore(state => state.nodeConfigs);
    const { mqttCredentials, httpCredentials } = useCredential();

    /**
     * Render Form group action in the form group header
     */
    const renderFormGroupAction = useCallback(
        ({ node, formGroupIndex, onChange }: RenderActionProps) => {
            switch (node?.type) {
                case 'http': {
                    if (formGroupIndex !== 0) return null;
                    const handleCurlCmdChange = ({
                        url,
                        header,
                        data,
                        params,
                        method,
                    }: ParseResult) => {
                        const result: Partial<HttpNodeDataType['parameters']> = {
                            url,
                            params: params || {},
                            method: method?.toLocaleUpperCase() as HttpMethodType,
                        };
                        const { 'Content-Type': contentType, ...restHeaders } = header || {};
                        const body: NonNullable<HttpNodeDataType['parameters']>['body'] = {
                            type: '',
                            value: '',
                        };

                        switch (contentType as HttpBodyContentType) {
                            case 'text/plain': {
                                body.type = contentType as HttpBodyContentType;
                                body.value =
                                    typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
                                break;
                            }
                            case 'application/json': {
                                body.type = contentType as HttpBodyContentType;
                                body.value =
                                    typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
                                break;
                            }
                            /**
                             * Attention: There is no `multipart/form-data` type in the select
                             * options now, so we need to convert it to
                             * `application/x-www-form-urlencoded` type.
                             * The `multipart/form-data` type is used to upload files, and the
                             * `application/x-www-form-urlencoded` type is used to submit
                             * form data.
                             */
                            case 'multipart/form-data':
                            case 'application/x-www-form-urlencoded': {
                                body.type = 'application/x-www-form-urlencoded';
                                body.value =
                                    typeof data === 'object' ? data : safeJsonParse(data, {});
                                break;
                            }
                            default: {
                                body.type = 'text/plain';
                                body.value =
                                    typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
                                if (contentType) restHeaders['Content-Type'] = contentType;
                                break;
                            }
                        }

                        result.header = restHeaders || {};
                        result.body = body;

                        // console.log({ restHeaders, data, contentType, result });
                        onChange?.(result);
                    };

                    return <HttpCurlDialog onChange={handleCurlCmdChange} />;
                }
                default: {
                    break;
                }
            }

            return null;
        },
        [],
    );

    /**
     * Render extra content in the form group body
     */
    const renderFormGroupContent = useCallback(
        ({ node, isLastFormGroup, data }: RenderGroupContentProps) => {
            switch (node?.type) {
                case 'httpin': {
                    if (isLastFormGroup) {
                        return (
                            <HttpCurlInfo
                                data={data as HttpinNodeDataType['parameters']}
                                credential={{
                                    username: httpCredentials?.access_key,
                                    password: httpCredentials?.access_secret,
                                }}
                            />
                        );
                    }
                    break;
                }
                default: {
                    break;
                }
            }

            return null;
        },
        [httpCredentials],
    );

    /**
     * Render extra form group in the end of group list
     */
    const renderFormGroupFooter = useCallback(
        ({ node }: RenderGroupFooterProps) => {
            switch (node?.type) {
                case 'http':
                case 'httpin': {
                    const nodeConfig = nodeConfigs[node.type];
                    const options: HttpOutputInfoProps['options'] = nodeConfig?.outputs?.map(
                        item => {
                            return {
                                name: item.label || item.key,
                                type: item.valueType || '',
                                placeholder: !item.descIntlKey ? '' : getIntlText(item.descIntlKey),
                            };
                        },
                    );
                    return (
                        <HttpOutputInfo
                            title={getIntlText('workflow.label.output_variables')}
                            options={options}
                        />
                    );
                }
                case 'mqtt': {
                    const nodeConfig = nodeConfigs[node.type];
                    const {
                        host = window.location.hostname,
                        mqtt_port: mqttPort,
                        mqtts_port: mqttsPort,
                        access_key: username,
                        access_secret: password,
                    } = mqttCredentials || {};
                    const clientId = `${username}#${memoTimestamp}`;
                    const port = mqttsPort || mqttPort;
                    const protocol = mqttsPort ? 'mqtts:' : 'mqtt:';
                    const address = `${protocol}//${host}:${port}`;

                    const paramsOptions: ParamsListProps['options'] = [
                        {
                            label: getIntlText('common.label.broker_address'),
                            value: !isLogMode ? address : undefined,
                        },
                        {
                            label: getIntlText('common.label.broker_port'),
                            value: !isLogMode ? port : undefined,
                        },
                        {
                            label: getIntlText('common.label.client_id'),
                            value: !isLogMode ? clientId : undefined,
                        },
                        {
                            label: getIntlText('common.label.username'),
                            value: !isLogMode ? username : undefined,
                        },
                        {
                            label: getIntlText('common.label.password'),
                            value: !isLogMode ? password : undefined,
                            type: 'password',
                        },
                    ];
                    const outputOptions: HttpOutputInfoProps['options'] = nodeConfig?.outputs?.map(
                        item => {
                            return {
                                name: item.label || item.key,
                                type: item.valueType || '',
                                placeholder: !item.descIntlKey ? '' : getIntlText(item.descIntlKey),
                            };
                        },
                    );
                    return (
                        <>
                            <ParamsList
                                title={getIntlText('workflow.label.connection_parameters')}
                                options={paramsOptions}
                            />
                            <HttpOutputInfo
                                title={getIntlText('workflow.label.output_variables')}
                                options={outputOptions}
                            />
                        </>
                    );
                }
                default: {
                    break;
                }
            }

            return null;
        },
        [nodeConfigs, mqttCredentials, isLogMode, getIntlText],
    );

    return {
        /**
         * Render Form group action in the form group header
         */
        renderFormGroupAction,

        /**
         * Render extra content in the form group body
         */
        renderFormGroupContent,

        /**
         * Render extra form group in the end of group list
         */
        renderFormGroupFooter,
    };
};

export default useExtraRender;
