import { useCallback } from 'react';
import { useReactFlow, getIncomers, getOutgoers, type IsValidConnection } from '@xyflow/react';
import { uniqBy, omit, cloneDeep, get as getObjectValue, isEmpty, isObject } from 'lodash-es';
import { useI18n, useStoreShallow } from '@milesight/shared/src/hooks';
import { toast } from '@milesight/shared/src/components';
import { basicNodeConfigs } from '@/pages/workflow/config';
import { entityTypeOptions } from '@/constants';
import { useEntityStore } from '@/components';
import useFlowStore from '../store';
import {
    PARALLEL_LIMIT,
    PARALLEL_DEPTH_LIMIT,
    NODE_MIN_NUMBER_LIMIT,
    ENTRY_NODE_NUMBER_LIMIT,
    DEFAULT_BOOLEAN_DATA_ENUMS,
} from '../constants';
import { genRefParamKey, isRefParamKey, getUrlParams } from '../helper';
import type { NodeParamType, FlattenNodeParamType } from '../typings';
import { getParallelInfo } from './utils';

export type UpdateNodeStatusOptions = {
    /**
     * If only render the given nodes (Default is `false`, render all nodes)
     */
    partial?: boolean;
};

const entryNodeTypes = Object.values(basicNodeConfigs)
    .filter(item => item.category === 'entry')
    .map(item => item.type);

const useWorkflow = () => {
    const { getNodes, getEdges, setNodes, setEdges, fitView } = useReactFlow<
        WorkflowNode,
        WorkflowEdge
    >();
    const { getIntlText } = useI18n();
    const { selectedNode, nodeConfigs } = useFlowStore(
        useStoreShallow(['selectedNode', 'nodeConfigs']),
    );

    // Fetch Entity List
    const { entityList } = useEntityStore(
        useStoreShallow(['status', 'entityList', 'initEntityList']),
    );

    const getEntityDetail = useCallback(
        (key?: ApiKey) => {
            if (!key) return;
            return entityList.find(item => item.entity_key === key);
        },
        [entityList],
    );

    // Check node number limit
    const checkNodeNumberLimit = useCallback(
        (nodes?: WorkflowNode[]) => {
            nodes = nodes || getNodes();

            if (nodes.length < NODE_MIN_NUMBER_LIMIT) {
                toast.error({
                    key: 'node-min-number-limit',
                    content: getIntlText('workflow.label.node_min_number_limit_tip', {
                        1: NODE_MIN_NUMBER_LIMIT,
                    }),
                });
                return false;
            }

            const entryNodes = nodes.filter(node =>
                entryNodeTypes.includes(node.type as WorkflowNodeType),
            );

            if (entryNodes.length !== ENTRY_NODE_NUMBER_LIMIT) {
                toast.error({
                    key: 'entry-node-number-limit',
                    content: getIntlText('workflow.label.entry_node_number_limit_tip', {
                        1: ENTRY_NODE_NUMBER_LIMIT,
                    }),
                });
                return false;
            }

            return true;
        },
        [getNodes, getIntlText],
    );

    // Check Parallel Limit
    const checkParallelLimit = useCallback(
        (nodeId: ApiKey, nodeHandle?: string | null, edges?: WorkflowEdge[]) => {
            edges = edges || getEdges();
            const connectedEdges = edges.filter(
                edge =>
                    edge.source === nodeId &&
                    ((!nodeHandle && !edge.sourceHandle) || edge.sourceHandle === nodeHandle),
            );

            if (connectedEdges.length > PARALLEL_LIMIT - 1) {
                toast.error({
                    key: 'parallel-limit',
                    content: getIntlText('workflow.label.parallel_limit_tip', {
                        1: PARALLEL_LIMIT,
                    }),
                });
                return false;
            }

            return true;
        },
        [getEdges, getIntlText],
    );

    // Check nested parallel limit
    const checkNestedParallelLimit = useCallback(
        (nodes: WorkflowNode[], edges: WorkflowEdge[], parentNodeId?: ApiKey) => {
            const { parallelList, hasAbnormalEdges } = getParallelInfo(nodes, edges, parentNodeId);

            // console.log({ parallelList, hasAbnormalEdges });
            if (hasAbnormalEdges) {
                toast.error({
                    key: 'abnormal-edge',
                    content: getIntlText('workflow.label.abnormal_edge_tip'),
                });
                return false;
            }

            const isGtLimit = parallelList.some(item => item.depth > PARALLEL_DEPTH_LIMIT);

            if (isGtLimit) {
                toast.error({
                    key: 'parallel-depth-limit',
                    content: getIntlText('workflow.label.parallel_depth_limit_tip', {
                        1: PARALLEL_DEPTH_LIMIT,
                    }),
                });
                return false;
            }

            return true;
        },
        [getIntlText],
    );

    // Check node connection cycle
    const isValidConnection = useCallback<IsValidConnection>(
        connection => {
            // we are using getNodes and getEdges helpers here
            // to make sure we create isValidConnection function only once
            const nodes = getNodes();
            const edges = getEdges();
            const target = nodes.find(node => node.id === connection.target);
            const hasCycle = (node: WorkflowNode, visited = new Set()) => {
                if (visited.has(node.id)) return false;

                visited.add(node.id);

                for (const outgoer of getOutgoers(node, nodes, edges)) {
                    if (outgoer.id === connection.source) return true;
                    if (hasCycle(outgoer, visited)) return true;
                }
            };

            if (!checkParallelLimit(connection.source, connection.sourceHandle)) return false;

            if (target?.id === connection.source) return false;
            return !hasCycle(target!);
        },
        [getNodes, getEdges, checkParallelLimit],
    );

    // Get all upstream nodes of the current node
    const getUpstreamNodes = useCallback(
        (currentNode?: WorkflowNode, nodes?: WorkflowNode[], edges?: WorkflowEdge[]) => {
            nodes = nodes || getNodes();
            edges = edges || getEdges();
            currentNode = currentNode || selectedNode;

            const getAllIncomers = (
                node: WorkflowNode,
                data: Record<ApiKey, WorkflowNode[]> = {},
                depth = 1,
            ) => {
                if (!node) return [];
                const incomers = getIncomers(node, nodes, edges);

                data[depth] = data[depth] || [];
                data[depth].push(...incomers);
                incomers.forEach(item => getAllIncomers(item, data, depth + 1));

                const keys = Object.keys(data).sort((a, b) => +a - +b);
                const result = keys.reduce((acc, key) => {
                    acc.push(...data[key]);
                    return acc;
                }, [] as WorkflowNode[]);

                return uniqBy(result, 'id');
            };

            return getAllIncomers(currentNode!);
        },
        [getNodes, getEdges, selectedNode],
    );

    // Get the parameters of the upstream nodes of the current node
    const getUpstreamNodeParams = useCallback(
        (
            currentNode?: WorkflowNode,
            nodes?: WorkflowNode[],
            edges?: WorkflowEdge[],
        ): [NodeParamType[], FlattenNodeParamType[]] | [] => {
            nodes = nodes || getNodes();
            edges = edges || getEdges();
            currentNode = currentNode || selectedNode;
            if (!currentNode) return [];

            const incomeNodes = getUpstreamNodes(currentNode, nodes, edges);
            const result = incomeNodes
                .map(({ id: nodeId, type: nodeType, data }) => {
                    const { nodeName, parameters } = data || {};
                    const config = nodeConfigs[nodeType!];
                    const outputConfigs = config?.outputs;

                    if (!outputConfigs?.length) return;
                    const paramData: NodeParamType = {
                        nodeId,
                        nodeName,
                        nodeType,
                        nodeLabel: config?.labelIntlKey
                            ? getIntlText(config.labelIntlKey)
                            : config.label || '',
                        outputs: [],
                    };

                    outputConfigs.forEach(({ key, path, type, valueType, label }) => {
                        const outputData = getObjectValue(parameters, path || key);

                        switch (type) {
                            case 'static': {
                                const typeOption = entityTypeOptions.find(
                                    it => it.value === valueType,
                                );
                                paramData.outputs.push({
                                    name: label || key,
                                    type: valueType,
                                    typeLabel: !typeOption?.label
                                        ? valueType
                                        : getIntlText(typeOption.label),
                                    key: genRefParamKey(nodeId, key),
                                    originKey: key,
                                });
                                break;
                            }
                            case 'url': {
                                if (!outputData) return;
                                const originKey = Array.isArray(path) ? path.join('.') : path || '';
                                paramData.outputs.push({
                                    name: label || key,
                                    type: 'STRING',
                                    typeLabel: getIntlText(
                                        entityTypeOptions.find(it => it.value === 'STRING')
                                            ?.label || '',
                                    ),
                                    key: genRefParamKey(nodeId, originKey),
                                    originKey,
                                });

                                const params = getUrlParams(outputData);
                                if (!params.length) return;

                                params.forEach(param => {
                                    const typeOption = entityTypeOptions.find(
                                        it => it.value === valueType,
                                    );
                                    const originKey = `${key}.${param}`;
                                    paramData.outputs.push({
                                        name: `${label || key}.${param}`,
                                        type: valueType,
                                        typeLabel: !typeOption?.label
                                            ? valueType
                                            : getIntlText(typeOption.label),
                                        key: genRefParamKey(nodeId, originKey),
                                        originKey,
                                    });
                                });
                                break;
                            }
                            case 'object': {
                                // Data Format: { [key: string]: any }
                                if (!outputData || !isObject(outputData)) return;

                                Object.entries(outputData).forEach(([key, value]) => {
                                    if (!key || !value || isRefParamKey(value)) return;
                                    paramData.outputs.push({
                                        name: key,
                                        key: genRefParamKey(nodeId, key),
                                        originKey: key,
                                    });
                                });
                                break;
                            }
                            case 'objectArray': {
                                // Data Format: { identify?: string; name: string; type: string }[]
                                if (!Array.isArray(outputData)) return;
                                outputData.forEach((item: Record<string, any>) => {
                                    if (!item?.name || !item?.type) return;
                                    const enums =
                                        (item.type as EntityValueDataType) !== 'BOOLEAN'
                                            ? undefined
                                            : DEFAULT_BOOLEAN_DATA_ENUMS.map(item => ({
                                                  key: item.key,
                                                  label: getIntlText(item.labelIntlKey),
                                              }));
                                    const typeOption = entityTypeOptions.find(
                                        it => it.value === item.type,
                                    );
                                    const originKey =
                                        item.identify && nodeType === 'trigger'
                                            ? item.identify
                                            : item.name;
                                    paramData.outputs.push({
                                        name: item.name,
                                        type: item.type,
                                        typeLabel: !typeOption?.label
                                            ? item.type
                                            : getIntlText(typeOption.label),
                                        key: genRefParamKey(nodeId, originKey),
                                        originKey,
                                        enums,
                                    });
                                });
                                break;
                            }
                            case 'entities': {
                                // Data Format: string[]
                                if (!Array.isArray(outputData)) return;
                                outputData.forEach(item => {
                                    if (!item) return;
                                    const entity = getEntityDetail(item);
                                    const type = entity?.entity_value_type;
                                    const enums = (entity?.entity_value_attribute as any)?.enum;
                                    const typeOption = entityTypeOptions.find(
                                        it => it.value === type,
                                    );

                                    if (!entity) return;
                                    paramData.outputs.push({
                                        name: entity?.entity_name || item,
                                        type,
                                        typeLabel: !typeOption?.label
                                            ? type
                                            : getIntlText(typeOption.label),
                                        key: genRefParamKey(nodeId, item),
                                        originKey: item,
                                        enums: !isEmpty(enums)
                                            ? Object.entries(enums)?.map(([key, value]) => ({
                                                  key,
                                                  label: value as string | undefined,
                                              }))
                                            : type !== 'BOOLEAN'
                                              ? undefined
                                              : DEFAULT_BOOLEAN_DATA_ENUMS.map(item => ({
                                                    key: item.key,
                                                    label: getIntlText(item.labelIntlKey),
                                                })),
                                    });
                                });
                                break;
                            }
                            case 'objectEntities': {
                                // Data Format: { [entityKey: string]: string }
                                if (!outputData || isEmpty(outputData)) return;
                                Object.entries(outputData).forEach(([key, value]) => {
                                    if (!key || !value || isRefParamKey(value as string)) return;
                                    const entity = getEntityDetail(key);

                                    if (!entity) return;
                                    const type = entity?.entity_value_type;
                                    const enums = (entity?.entity_value_attribute as any)?.enum;
                                    const typeOption = entityTypeOptions.find(
                                        it => it.value === type,
                                    );

                                    paramData.outputs.push({
                                        name: entity?.entity_name || key,
                                        type,
                                        typeLabel: !typeOption?.label
                                            ? type
                                            : getIntlText(typeOption.label),
                                        key: genRefParamKey(nodeId, key),
                                        originKey: key,
                                        enums: !isEmpty(enums)
                                            ? Object.entries(enums)?.map(([key, value]) => ({
                                                  key,
                                                  label: value as string | undefined,
                                              }))
                                            : type !== 'BOOLEAN'
                                              ? undefined
                                              : DEFAULT_BOOLEAN_DATA_ENUMS.map(item => ({
                                                    key: item.key,
                                                    label: getIntlText(item.labelIntlKey),
                                                })),
                                    });
                                });
                                break;
                            }
                            default: {
                                break;
                            }
                        }
                    });

                    return paramData;
                })
                .filter(item => !!item);

            const flattenResult = result.reduce((acc, item) => {
                acc.push(
                    ...item.outputs.map(output => ({
                        nodeId: item.nodeId,
                        nodeName: item.nodeName,
                        nodeType: item.nodeType,
                        valueName: output.name,
                        valueType: output.type,
                        valueTypeLabel: output.typeLabel,
                        valueKey: output.key,
                        valueOriginKey: output.originKey,
                        enums: output.enums,
                    })),
                );
                return acc;
            }, [] as FlattenNodeParamType[]);

            return [result, flattenResult];
        },
        [
            nodeConfigs,
            selectedNode,
            getNodes,
            getEdges,
            getUpstreamNodes,
            getIntlText,
            getEntityDetail,
        ],
    );

    // Get the detail of the reference parameter
    const getReferenceParamDetail = useCallback(
        (key?: ApiKey) => {
            if (!key) return;
            const [, nodeParams] = getUpstreamNodeParams();
            const result = nodeParams?.find(item => item.valueKey === key);

            return result;
        },
        [getUpstreamNodeParams],
    );

    // Check if there is a node that is not connected to an entry node
    const checkFreeNodeLimit = useCallback(
        (nodes?: WorkflowNode[], edges?: WorkflowEdge[]) => {
            nodes = nodes || getNodes();
            edges = edges || getEdges();
            let result = false;

            result = nodes
                .filter(node => !entryNodeTypes.includes(node.type as WorkflowNodeType))
                .some(node => {
                    const upstreamNodes = getUpstreamNodes(node, nodes, edges);
                    const hasEntryNode = upstreamNodes.some(item =>
                        entryNodeTypes.includes(item.type as WorkflowNodeType),
                    );

                    return !hasEntryNode;
                });

            if (result) {
                toast.error({
                    key: 'free-node-limit',
                    content: getIntlText('workflow.label.free_node_limit_tip'),
                });
            }

            return result;
        },
        [getNodes, getEdges, getUpstreamNodes, getIntlText],
    );

    // Check if the Output node complies with the following rules:
    // 1. The entry node must be Trigger
    // 2. There is only one Output node
    const checkOutputNodeLimit = useCallback(
        (nodes?: WorkflowNode[]) => {
            nodes = nodes || getNodes();
            const hasTriggerNode = nodes.some(node => node.type === 'trigger');
            const outputNodes = nodes.filter(node => node.type === 'output');

            if (!hasTriggerNode) {
                if (outputNodes.length) {
                    toast.error({
                        key: 'output-node-limit',
                        content: getIntlText('workflow.valid.output_node_limit_has_trigger_tip'),
                    });
                    return false;
                }
                return true;
            }

            if (outputNodes.length > 1) {
                toast.error({
                    key: 'output-node-limit',
                    content: getIntlText('workflow.valid.output_node_limit_count_tip'),
                });
                return false;
            }

            return true;
        },
        [getNodes, getIntlText],
    );

    // Check edge cycle, if there is a cycle, return `true`, otherwise return `false`
    const checkEdgeCycle = useCallback(
        (nodes?: WorkflowNode[], edges?: WorkflowEdge[]) => {
            nodes = nodes || getNodes();
            edges = edges || getEdges();

            let result = false;
            const hasCycle = (node: WorkflowNode, visited = new Set()) => {
                const edge = edges.find(edge => edge.source === node.id);

                if (!edge) return false;
                if (visited.has(node.id) || edge.source === edge.target) return true;

                visited.add(node.id);
                for (const outgoer of getOutgoers(node, nodes, edges)) {
                    if (outgoer.id === edge?.source) return true;
                    if (hasCycle(outgoer, visited)) return true;
                }

                return false;
            };

            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (hasCycle(node)) {
                    result = true;
                    break;
                }
            }

            if (result) {
                toast.error({
                    key: 'edges-cycle',
                    content: getIntlText('workflow.label.cycle_connection_tip'),
                });
            }

            return result;
        },
        [getNodes, getEdges, getIntlText],
    );

    // Check if the workflow nodes&edges is valid
    const checkWorkflowValid = useCallback(
        (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
            if (!checkNodeNumberLimit(nodes)) return false;
            if (checkEdgeCycle(nodes, edges)) return false;
            if (checkFreeNodeLimit(nodes, edges)) return false;
            if (!checkNestedParallelLimit(nodes, edges)) return false;
            if (nodes.some(node => !checkParallelLimit(node.id, undefined, edges))) return false;
            if (!checkOutputNodeLimit(nodes)) return false;

            return true;
        },
        [
            checkNodeNumberLimit,
            checkFreeNodeLimit,
            checkNestedParallelLimit,
            checkParallelLimit,
            checkEdgeCycle,
            checkOutputNodeLimit,
        ],
    );

    // Update node status
    const updateNodesStatus = useCallback(
        (data: Record<string, WorkflowNodeStatus> | null, options?: UpdateNodeStatusOptions) => {
            const nodes = cloneDeep(getNodes());

            if (!data) {
                nodes.forEach(node => {
                    node.data = omit(node.data, ['$status', '$errMsg']);
                });
            } else {
                nodes.forEach(node => {
                    let status: WorkflowNodeStatus = data[node.id];

                    if (!options?.partial) {
                        status = status || 'SUCCESS';
                    }

                    node.data = {
                        ...node.data,
                        $status: status,
                    };
                });
                fitView({ duration: 300 });
            }

            setNodes(nodes);
        },
        [getNodes, setNodes, fitView],
    );

    // Clear excess edges
    const clearExcessEdges = useCallback(
        (nodes?: WorkflowNode[], edges?: WorkflowEdge[]) => {
            nodes = nodes || getNodes();
            edges = cloneDeep(edges || getEdges());

            const ids = nodes.reduce((acc, node) => {
                acc.push(node.id);

                if (node.type === 'ifelse') {
                    const { choice } =
                        (node.data.parameters as IfElseNodeDataType['parameters']) || {};
                    const { when, otherwise } = choice || {};

                    if (when?.length) {
                        acc.push(...when.map(item => `${item.id}`));
                    }
                    if (otherwise?.id) acc.push(`${otherwise.id}`);
                }

                return acc;
            }, [] as string[]);

            const newEdges = edges.filter(({ source, target, sourceHandle, targetHandle }) => {
                return (
                    ids.includes(source) &&
                    ids.includes(target) &&
                    (!sourceHandle || ids.includes(sourceHandle)) &&
                    (!targetHandle || ids.includes(targetHandle))
                );
            });

            if (edges.length === newEdges.length) return;
            setEdges(newEdges);

            return newEdges;
        },
        [getNodes, getEdges, setEdges],
    );

    return {
        isValidConnection,
        checkParallelLimit,
        checkNestedParallelLimit,
        checkNodeNumberLimit,
        checkFreeNodeLimit,
        checkWorkflowValid,
        getEntityDetail,
        getUpstreamNodes,
        getUpstreamNodeParams,
        getReferenceParamDetail,
        updateNodesStatus,
        clearExcessEdges,
    };
};

export default useWorkflow;
