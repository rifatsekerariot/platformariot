import { type ReactFlowJsonObject } from '@xyflow/react';
import { type WorkflowAPISchema } from '@/services/http';

/**
 * Action Log Type
 */
export interface AccordionLog extends ObjectToCamelCase<WorkflowTraceType> {
    /**
     * Unique ID of web usage
     */
    $$token: string;
    /**
     * Node Type
     */
    type: WorkflowNodeType;
    /**
     * Node Name
     */
    name: string;
    /**
     * Custom header render config
     */
    config?: CustomConfigItemType;
    /**
     * Children
     */
    children?: AccordionLog[];
}

/**
 * Custom header render config
 */
export type CustomConfigItemType = {
    /**
     * Label i18n key
     */
    labelIntlKey?: string;
    /**
     * Node Icon
     */
    icon?: React.ReactNode;
    /**
     * Node Icon background color
     */
    iconBgColor?: string;
};

/**  Workflow Trace Type */
export type WorkflowTraceType = PartialOptional<
    WorkflowAPISchema['getLogDetail']['response']['trace_info'][number],
    'start_time' | 'time_cost'
>;

/**  Workflow Data Type */
export type WorkflowDataType = PartialOptional<
    ReactFlowJsonObject<WorkflowNode, WorkflowEdge>,
    'viewport'
>;

/** Workflow Custom Node Type */
export type WorkflowNestNode<T extends WorkflowNodeType = WorkflowNodeType> = WorkflowNode<T> & {
    attrs: AccordionLog;
    children?: WorkflowNestNode<T>[];
};
/** Workflow Nested Data Type */
export interface WorkflowNestDataType extends WorkflowDataType {
    nodes: WorkflowNestNode[];
}

/** Parallel Node Result */
export interface ParallelNodeResult {
    node: WorkflowNestNode;
    incomers: WorkflowNestNode[];
    usableIncome: WorkflowNestNode;
}

/** action log props */
export interface ActionLogProps {
    traceData: WorkflowTraceType[];
    workflowData: WorkflowDataType;
    logType?: 'validate' | 'test' | 'run';
}
