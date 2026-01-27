import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { cloneDeep, pickBy } from 'lodash-es';
import {
    type WorkflowAPISchema,
    type FlowNodeTraceInfo,
    type CredentialAPISchema,
} from '@/services/http';
import { basicNodeConfigs } from '../../config';
import type { NodesDataValidResult } from './hooks';
import type { NodeConfigItem, NodeDataValidator } from './typings';

type DynamicValidatorItem = {
    nodeId: string;
    nodeType: WorkflowNodeType;
    fieldName: string;
    validators: NodeDataValidator[] | null;
};

type CredentialType = CredentialAPISchema['getDefaultCredential']['request']['credentialsType'];
type CredentialData = CredentialAPISchema['getDefaultCredential']['response'];

export interface FlowStore {
    selectedNode?: WorkflowNode;

    /** Workflow Node Configs */
    nodeConfigs: Record<WorkflowNodeType, NodeConfigItem>;

    /**
     * Log Panel Mode
     *
     * @param testRun Render Test Run Panel
     * @param testLog Render Test Log Detail
     * @param runLog Render Run Log Detail
     * @param feVerify Render Frontend Verification Detail
     */
    logPanelMode?: 'testRun' | 'testLog' | 'runLog' | 'feVerify';

    /**
     * Open Log Panel
     */
    openLogPanel?: boolean;

    /**
     * Test Log List
     */
    testLogs?: (PartialOptional<
        WorkflowAPISchema['getLogList']['response']['content'][number],
        'version'
    > & {
        trace_infos?: FlowNodeTraceInfo[];
        flow_data?: Pick<WorkflowSchema, 'nodes' | 'edges'>;
    })[];

    /**
     * Run Log List
     */
    runLogs?: WorkflowAPISchema['getLogList']['response']['content'];

    /**
     * Nodes Data Valid Result
     */
    logDetail?: {
        flowData?: Pick<WorkflowSchema, 'nodes' | 'edges'>;
        traceInfos: PartialOptional<FlowNodeTraceInfo, 'start_time' | 'time_cost'>[];
    };

    logDetailLoading?: boolean;

    /**
     * Dynamic Validators
     *
     * key: `${nodeId}.${nodeType}.${fieldName}`
     */
    dynamicValidators?: Record<`${string}.${WorkflowNodeType}.${string}`, DynamicValidatorItem>;

    /**
     * Credentials
     */
    credentials?: Partial<Record<CredentialType, CredentialData>>;

    mqttCredentials?:
        | null
        | (CredentialAPISchema['getDefaultCredential']['response'] &
              CredentialAPISchema['getMqttBrokerInfo']['response']);

    httpCredentials?: null | CredentialAPISchema['getDefaultCredential']['response'];

    isLogMode: () => boolean;

    setSelectedNode: (node?: FlowStore['selectedNode']) => void;

    setNodeConfigs: (nodeConfigs: WorkflowAPISchema['getFlowNodes']['response']) => void;

    setLogPanelMode: (logPanelMode: FlowStore['logPanelMode']) => void;

    setOpenLogPanel: (open: FlowStore['openLogPanel']) => void;

    setTestLogs: (testLogs: FlowStore['testLogs']) => void;
    addTestLog: (log?: NonNullable<FlowStore['testLogs']>[0]) => void;

    setRunLogs: (runLogs: FlowStore['runLogs']) => void;

    setLogDetail: (detail?: FlowStore['logDetail']) => void;

    setLogDetailLoading: (loading: FlowStore['logDetailLoading']) => void;

    setNodesDataValidResult: (
        data: NodesDataValidResult | null,
        logPanelMode?: FlowStore['logPanelMode'],
    ) => void;

    setDynamicValidators: (props: DynamicValidatorItem) => void;

    getDynamicValidators: (
        nodeId: string,
        nodeType: WorkflowNodeType,
    ) => Record<`${WorkflowNodeType}.${string}`, Record<string, NodeDataValidator>>;

    setMqttCredentials: (credentials?: FlowStore['mqttCredentials']) => void;
    setHttpCredentials: (credentials?: FlowStore['httpCredentials']) => void;
}

const useFlowStore = create(
    immer<FlowStore>((set, get) => ({
        nodeConfigs: basicNodeConfigs,

        testLogs: [],

        isLogMode: () => {
            const { openLogPanel, logDetail, logPanelMode } = get();
            return !!(
                openLogPanel &&
                logDetail &&
                (logPanelMode === 'runLog' || logPanelMode === 'testLog')
            );
        },

        setSelectedNode: node => set({ selectedNode: node }),

        setNodeConfigs: nodeConfigs => {
            const configs = Object.entries(nodeConfigs).reduce((acc, [cat, configs]) => {
                const result = configs.map(config => {
                    const schema =
                        typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
                    const basicConfig = Object.values(basicNodeConfigs).find(
                        item => item.componentName === config.name,
                    );

                    // console.log(config.name, schema);
                    return {
                        type: config.name,
                        label: config.title || config.name,
                        ...basicConfig,
                        category: cat,
                        testable: schema?.component?.testable,
                        schema,
                    } as NodeConfigItem;
                });

                acc = acc.concat(result);
                return acc;
            }, [] as NodeConfigItem[]);
            const result = configs.reduce(
                (acc, config) => {
                    acc[config.type] = config;
                    return acc;
                },
                {} as FlowStore['nodeConfigs'],
            );

            // Mock data
            // result.mqtt = {
            //     ...basicNodeConfigs.mqtt,
            //     schema: {
            //         properties: {
            //             // @ts-ignore
            //             topic: {
            //                 name: 'topic',
            //                 type: 'string',
            //                 required: true,
            //                 displayName: 'Topic',
            //                 uiComponentGroup: 'Topic Subscription',
            //                 uiComponent: 'mqttTopicInput',
            //             },
            //         },
            //     },
            // };

            set({ nodeConfigs: result });
        },
        setLogPanelMode: logPanelMode => set({ logPanelMode }),
        setOpenLogPanel: open => set({ openLogPanel: open }),
        setTestLogs: testLogs => set({ testLogs }),
        addTestLog: log => {
            set(state => {
                if (!log) return;
                const testLogs = [log, ...(state.testLogs || [])];
                return { testLogs };
            });
        },
        setRunLogs: runLogs => set({ runLogs }),
        setLogDetail: detail => set({ logDetail: detail }),
        setLogDetailLoading: loading => set({ logDetailLoading: loading }),
        setNodesDataValidResult(data, logPanelMode = 'feVerify') {
            if (!data) {
                set({ openLogPanel: false, logPanelMode: undefined, logDetail: undefined });
                return;
            }
            // console.log(data);
            const traceInfos = Object.entries(data).map(([id, { type, name, label, errMsgs }]) => {
                const result: NonNullable<FlowStore['logDetail']>['traceInfos'][0] = {
                    node_id: id,
                    node_label: label!,
                    status: 'ERROR',
                    error_message: errMsgs[0],
                };
                return result;
            });

            // console.log(logDetail);
            set({ openLogPanel: true, logPanelMode, logDetail: { traceInfos } });
        },
        setDynamicValidators({ nodeId, nodeType, fieldName, validators }) {
            set(state => {
                const key = `${nodeId}.${nodeType}.${fieldName}` as const;

                if (!validators?.length) {
                    delete state.dynamicValidators?.[key];
                } else {
                    state.dynamicValidators = {
                        ...state.dynamicValidators,
                        [key]: {
                            nodeId,
                            nodeType,
                            fieldName,
                            validators,
                        },
                    };
                }

                return state;
            });
        },

        getDynamicValidators(nodeId, nodeType) {
            const { dynamicValidators } = get();
            const validators = Object.values(dynamicValidators || {}).filter(item => {
                return item.nodeId === nodeId && item.nodeType === nodeType;
            });
            const result = cloneDeep(validators).reduce(
                (acc, item) => {
                    const key = `${item.nodeType}.${item.fieldName}` as const;
                    acc[key] = acc[key] || {};

                    item.validators?.forEach((validator, index) => {
                        acc[key][`dynamicChecker${index}`] = validator;
                    });

                    return acc;
                },
                {} as ReturnType<FlowStore['getDynamicValidators']>,
            );

            return result;
        },

        setMqttCredentials(credentials) {
            set(state => {
                state.mqttCredentials = credentials;
            });
        },

        setHttpCredentials(credentials) {
            set(state => {
                state.httpCredentials = credentials;
            });
        },
    })),
);

export default useFlowStore;
