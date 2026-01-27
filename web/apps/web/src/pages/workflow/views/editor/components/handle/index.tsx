import React, { useState, useCallback, useMemo, forwardRef, useEffect } from 'react';
import cls from 'classnames';
import { useDebounceFn } from 'ahooks';
import {
    Handle as XHandle,
    useEdges,
    useViewport,
    type HandleProps,
    type NodeProps,
} from '@xyflow/react';
import { Stack, Portal } from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';
import { AddCircleIcon } from '@milesight/shared/src/components';
import NodeMenu from '../node-menu';
import useFlowStore from '../../store';
import './style.less';

export interface Props extends HandleProps {
    /**
     * Node Props
     */
    nodeProps: NodeProps<WorkflowNode>;
}

/**
 * Custom Handle Component
 */
const Handle = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & Props>(
    ({ nodeProps, className, ...props }, ref) => {
        const { getIntlHtml } = useI18n();
        const isLogMode = useFlowStore(state => state.isLogMode());
        const edges = useEdges();
        const isTargetHandle = props.type === 'target';
        const targetAddEnabled = edges.every(edge => edge.target !== nodeProps.id);

        // ---------- Handle Tooltip Open ----------
        const { zoom } = useViewport();
        const [tooltipPosition, setTooltipPosition] = useState<null | {
            top: number;
            left: number;
        }>(null);
        const { run: handleMouseEnter, cancel: cancelHandleMouseEnter } = useDebounceFn(
            (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                if (isLogMode || (isTargetHandle && !targetAddEnabled)) return;
                const rect = (e.target as HTMLDivElement).getBoundingClientRect();
                const position = { top: rect.top - 12, left: rect.left + rect.width / 2 };

                setTooltipPosition(position);
            },
            { wait: 500 },
        );

        useEffect(() => setTooltipPosition(null), [zoom]);

        // ---------- Handle Click Callback ----------
        const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
        const handleClick = useCallback(
            (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                if (isLogMode || (isTargetHandle && !targetAddEnabled)) return;
                setAnchorEl(e.currentTarget);
                e.stopPropagation();
            },
            [isLogMode, isTargetHandle, targetAddEnabled],
        );

        const closestNodeProps = useMemo(() => {
            return props.type === 'target'
                ? {
                      nextNodeId: nodeProps.id,
                      nextNodeTargetHandle: props.id,
                  }
                : {
                      prevNodeId: nodeProps.id,
                      prevNodeSourceHandle: props.id,
                  };
        }, [props, nodeProps]);

        return (
            <>
                <XHandle
                    {...props}
                    ref={ref}
                    className={cls('ms-workflow-handle', className, {
                        addable: !isLogMode,
                        'target-addable': props.type === 'target' && targetAddEnabled && !isLogMode,
                        'is-menu-open': !!anchorEl,
                    })}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={() => {
                        setTooltipPosition(null);
                        cancelHandleMouseEnter();
                    }}
                >
                    {/* Use Custom Tooltip, resolve the issue of Edge connect failure when Mui Tooltip component is enabled */}
                    {!anchorEl && !!tooltipPosition && (
                        <Portal>
                            <span
                                className="ms-workflow-handle-tooltip"
                                style={{
                                    top: tooltipPosition.top,
                                    left: tooltipPosition.left,
                                }}
                            >
                                {getIntlHtml('workflow.label.handle_tooltip')}
                            </span>
                        </Portal>
                    )}
                    <Stack sx={{ pointerEvents: 'none' }}>
                        <AddCircleIcon />
                    </Stack>
                </XHandle>
                <NodeMenu
                    open={!!anchorEl}
                    anchorEl={anchorEl}
                    {...closestNodeProps}
                    onClose={() => setAnchorEl(null)}
                />
            </>
        );
    },
);

export default Handle;
