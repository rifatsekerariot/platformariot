import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import type { TableDOMCell } from '@lexical/table';

import { useHandleResize, useMouseEvent, useResizeStyle } from './hooks';
import { RESIZER_CELL_CLASS } from '../constants';
import type { MouseDraggingDirection, MousePosition } from './type';
import type { CellResizeTablePlugin, EditorPlugin } from '../../../types';
import './index.less';

const TableCellResizer = ({
    anchorElem,
    plugin,
}: {
    anchorElem: HTMLElement;
    plugin?: CellResizeTablePlugin;
}) => {
    const { config } = plugin || {};
    const { row = true, column = true } = config || {};
    const targetRef = useRef<HTMLElement | null>(null);
    const resizerRef = useRef<HTMLDivElement | null>(null);
    const tableRectRef = useRef<DOMRect | null>(null);
    const mouseStartPosRef = useRef<MousePosition | null>(null);
    const [mouseCurrentPos, updateMouseCurrentPos] = useState<MousePosition | null>(null);
    const [activeCell, updateActiveCell] = useState<TableDOMCell | null>(null);
    const [isMouseDown, updateIsMouseDown] = useState<boolean>(false);
    const [draggingDirection, updateDraggingDirection] = useState<MouseDraggingDirection | null>(
        null,
    );

    /** reset state */
    const resetState = useCallback(() => {
        updateActiveCell(null);
        targetRef.current = null;
        updateDraggingDirection(null);
        mouseStartPosRef.current = null;
        tableRectRef.current = null;
    }, []);

    // Listen to mouse events to get the active form
    useMouseEvent({
        resetState,
        updateMouseCurrentPos,
        updateIsMouseDown,
        draggingDirection,
        tableRectRef,
        activeCell,
        updateActiveCell,
    });
    // Calculate the position of the drag
    const { getResizes } = useResizeStyle({
        activeCell,
        draggingDirection,
        mouseCurrentPos,
        tableRectRef,
        anchorElem,
    });
    const { toggleResize } = useHandleResize({
        activeCell,
        mouseStartPosRef,
        updateMouseCurrentPos,
        updateDraggingDirection,
        resetState,
    });

    const resizerStyles = getResizes();
    return (
        <div ref={resizerRef}>
            {activeCell != null && !isMouseDown && (
                <>
                    {column && (
                        <div
                            className={RESIZER_CELL_CLASS}
                            style={resizerStyles.right || undefined}
                            onMouseDown={toggleResize('right')}
                        />
                    )}
                    {row && (
                        <div
                            className={RESIZER_CELL_CLASS}
                            style={resizerStyles.bottom || undefined}
                            onMouseDown={toggleResize('bottom')}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default React.memo(
    ({
        anchorElem = document.body,
        plugins,
    }: {
        anchorElem?: HTMLElement;
        plugins?: EditorPlugin['table'];
    }) => {
        const isEditable = useLexicalEditable();
        const resizerPlugin = plugins?.find(
            plugin => plugin.name === 'table-cell-resizer',
        ) as CellResizeTablePlugin;
        const { load = true } = resizerPlugin || {};

        return createPortal(
            isEditable && load ? (
                <TableCellResizer anchorElem={anchorElem} plugin={resizerPlugin} />
            ) : null,
            anchorElem,
        );
    },
);
