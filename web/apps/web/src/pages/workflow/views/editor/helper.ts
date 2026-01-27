import { omitBy, cloneDeep } from 'lodash-es';
import {
    safeJsonParse,
    genRandomString,
    checkPrivateProperty,
} from '@milesight/shared/src/utils/tools';
import {
    checkRequired,
    checkRangeLength,
    type Validate,
} from '@milesight/shared/src/utils/validators';
import { PARAM_REFERENCE_PATTERN, PARAM_REFERENCE_PREFIX, URL_PARAM_PATTERN } from './constants';
import type { NodeConfigItem } from './typings';

/**
 * Node Data Validators Config
 */
export const validatorsConfig: Record<string, Record<string, Validate>> = {
    name: {
        checkRequired: checkRequired(),
        checkRangeLength: checkRangeLength({ min: 1, max: 50 }),
    },
    remark: {
        checkRangeLength: checkRangeLength({ min: 1, max: 1000 }),
    },
};

/**
 * Generate Reference Param Key
 */
export const genRefParamKey = (nodeId: ApiKey, valueKey: ApiKey) => {
    return `#{${PARAM_REFERENCE_PREFIX}.${nodeId}['${valueKey}']}`;
};

/**
 * Check if the value is a reference param key
 */
export const isRefParamKey = (key?: string) => {
    return key && PARAM_REFERENCE_PATTERN.test(key);
};

/**
 * Parse the reference param key
 */
export const parseRefParamKey = (key?: string) => {
    if (!key || !isRefParamKey(key)) return;
    const matches = key.match(PARAM_REFERENCE_PATTERN);

    if (!matches) return;
    const [, nodeId, valueKey] = matches;
    return {
        nodeId,
        valueKey,
    };
};

/**
 * Generate Workflow Node, Edge or Condition uuid, format as `{node}:{8-bit random string}:{timestamp}`
 * @param type node/edge
 */
export const genUuid = (type: 'node' | 'edge' | 'condition' | 'subcondition' | 'temp') => {
    return `${type}_${genRandomString(8, { lowerCase: true })}`;
};

/**
 * Normalize nodes data
 * @description Remove private properties and exclude keys
 */
export const normalizeNodes = (nodes: WorkflowNode[], excludeKeys?: string[]): WorkflowNode[] => {
    return nodes.map(node => {
        const result = omitBy(node, (_, key) => excludeKeys?.includes(key));

        result.data = omitBy(node.data, (_, key) => checkPrivateProperty(key));
        return result as WorkflowNode;
    });
};

/**
 * Normalize edges data
 * @description Remove private properties
 */
export const normalizeEdges = (edges: WorkflowEdge[]) => {
    return edges.map(edge => {
        delete edge.selected;
        edge.data = omitBy(edge.data, (_, key) => checkPrivateProperty(key));
        return edge;
    });
};

/**
 * Extract path parameters from the URL
 * @param url - The URL string to parse (e.g. '/users/{userId}/posts/{postId}')
 * @returns An array of parameter names found in the URL (e.g. ['userId', 'postId'])
 */
export const getUrlParams = (url?: string) => {
    const result: string[] = [];
    if (!url) return result;

    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = URL_PARAM_PATTERN.exec(url)) !== null) {
        result.push(match[1]);
    }

    return result;
};

/**
 * Get node initial params
 */
export const getNodeInitialParams = (config: NodeConfigItem) => {
    const { properties = {}, outputProperties = {} } = config.schema || {};
    const paramConfigs = cloneDeep(Object.entries(properties))
        .filter(([_, item]) => item.initialValue)
        .map(([name, item]) => {
            item.name = item.name || name;
            return item;
        })
        .concat(
            cloneDeep(Object.entries(outputProperties))
                .filter(([_, item]) => item.editable)
                .map(([name, item]) => {
                    item.name = item.name || name;
                    return item;
                }),
        );
    if (!paramConfigs.length) return;
    const result: Record<string, any> = {};

    paramConfigs.forEach(item => {
        const value = safeJsonParse(item.initialValue) || item.initialValue;
        result[item.name] = value;
    });

    return result;
};

/**
 * Get node param name
 */
export const getNodeParamName = (key: string, config: NodeConfigItem) => {
    const { properties } = config.schema || {};
    const paramConfig = properties?.[key];

    return paramConfig?.displayName || key;
};
