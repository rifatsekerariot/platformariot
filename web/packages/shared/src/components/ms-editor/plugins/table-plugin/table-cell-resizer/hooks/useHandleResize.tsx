import { MouseEventHandler, useCallback } from 'react';

import { $getNearestNodeFromDOMNode, type LexicalEditor } from 'lexical';
import {
    $computeTableMapSkipCellCheck,
    $getTableNodeFromLexicalNodeOrThrow,
    $getTableRowIndexFromTableCellNode,
    $isTableCellNode,
    $isTableRowNode,
} from '@lexical/table';
import { calculateZoomLevel } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { TableCellNode, TableDOMCell, TableMapType, TableMapValueType } from '@lexical/table';

import { MIN_COLUMN_WIDTH, MIN_ROW_HEIGHT } from '../constant';
import { isHeightChanging } from '../helper';
import type { MouseDraggingDirection, MousePosition } from '../type';

interface IProps {
    activeCell: TableDOMCell | null;
    mouseStartPosRef: React.MutableRefObject<MousePosition | null>;
    updateDraggingDirection: React.Dispatch<React.SetStateAction<MouseDraggingDirection | null>>;
    updateMouseCurrentPos: React.Dispatch<React.SetStateAction<MousePosition | null>>;
    resetState: () => void;
}
export const useHandleResize = ({
    activeCell,
    mouseStartPosRef,
    updateMouseCurrentPos,
    updateDraggingDirection,
    resetState,
}: IProps) => {
    const [editor] = useLexicalComposerContext();

    /** Gets the width of the cell. */
    const getCellNodeWidth = (
        cell: TableCellNode,
        activeEditor: LexicalEditor,
    ): number | undefined => {
        const width = cell.getWidth();
        if (width !== undefined) return width;

        const domCellNode = activeEditor.getElementByKey(cell.getKey());
        if (domCellNode == null) return;

        const computedStyle = getComputedStyle(domCellNode);
        return (
            domCellNode.clientWidth -
            parseFloat(computedStyle.paddingLeft) -
            parseFloat(computedStyle.paddingRight)
        );
    };
    /** Gets the height of the cell. */
    const getCellNodeHeight = (
        cell: TableCellNode,
        activeEditor: LexicalEditor,
    ): number | undefined => {
        const domCellNode = activeEditor.getElementByKey(cell.getKey());
        return domCellNode?.clientHeight;
    };
    /** Getting the column index of a cell in a table */
    const getCellColumnIndex = (tableCellNode: TableCellNode, tableMap: TableMapType) => {
        for (let row = 0; row < tableMap.length; row++) {
            for (let column = 0; column < tableMap[row].length; column++) {
                if (tableMap[row][column].cell === tableCellNode) {
                    return column;
                }
            }
        }
    };

    /** Updating the height of a table row */
    const updateRowHeight = useCallback(
        (heightChange: number) => {
            if (!activeCell) {
                throw new Error('TableCellResizer: Expected active cell.');
            }

            editor.update(
                () => {
                    // Get the nearest table cell node tableCellNode
                    const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
                    if (!$isTableCellNode(tableCellNode)) {
                        throw new Error('TableCellResizer: Table cell node not found.');
                    }
                    // Fetch table node tableNode
                    const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

                    // Get the row index of the table cell tableRowIndex
                    const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
                    // Get all rows of the table tableRows
                    const tableRows = tableNode.getChildren();

                    // Check if tableRowIndex is in the valid range
                    if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
                        throw new Error('Expected table cell to be inside of table row.');
                    }
                    // Get the corresponding table row tableRow
                    const tableRow = tableRows[tableRowIndex];

                    if (!$isTableRowNode(tableRow)) {
                        throw new Error('Expected table row');
                    }

                    // Get the height of the table row height
                    let height = tableRow.getHeight();
                    // If the height is undefined, gets all the cells in the row and calculates the minimum height of those cells.
                    if (height === undefined) {
                        const rowCells = tableRow.getChildren<TableCellNode>();
                        height = Math.min(
                            ...rowCells.map(cell => getCellNodeHeight(cell, editor) ?? Infinity),
                        );
                    }
                    // Calculate the newHeight newHeight, making sure it is not less than the minimum row height MIN_ROW_HEIGHT.
                    const newHeight = Math.max(height + heightChange, MIN_ROW_HEIGHT);
                    // Sets the new height of the table rows newHeight.
                    tableRow.setHeight(newHeight);
                },
                { tag: 'skip-scroll-into-view' },
            );
        },
        [activeCell, editor],
    );
    /** Updating the width of table columns */
    const updateColumnWidth = useCallback(
        (widthChange: number) => {
            if (!activeCell) {
                throw new Error('TableCellResizer: Expected active cell.');
            }
            editor.update(
                () => {
                    // Get the most recent table cell node tableCellNode.
                    const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
                    // Checks if tableCellNode is a table cell node.
                    if (!$isTableCellNode(tableCellNode)) {
                        throw new Error('TableCellResizer: Table cell node not found.');
                    }
                    // Gets the table node tableNode.
                    const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
                    // Compute the table map tableMap
                    const [tableMap] = $computeTableMapSkipCellCheck(tableNode, null, null);
                    // Get the index of the column where the cell is located columnIndex
                    const columnIndex = getCellColumnIndex(tableCellNode, tableMap);
                    if (columnIndex === undefined) {
                        throw new Error('TableCellResizer: Table column not found.');
                    }

                    for (let row = 0; row < tableMap.length; row++) {
                        // Iterate through each row of the tableMap to get the cell in the current column.
                        const cell: TableMapValueType = tableMap[row][columnIndex];
                        // Checks if the current cell is the start cell of the row and if it is different from the last cell or the next cell in the column.
                        if (
                            cell.startRow === row &&
                            (columnIndex === tableMap[row].length - 1 ||
                                tableMap[row][columnIndex].cell !==
                                    tableMap[row][columnIndex + 1].cell)
                        ) {
                            // Get the width of the cell width.
                            const width = getCellNodeWidth(cell.cell, editor);
                            if (width === undefined) {
                                continue;
                            }
                            // Calculate the newWidth, making sure it is not less than the minimum column width `MIN_COLUMN_WIDTH`.
                            const newWidth = Math.max(width + widthChange, MIN_COLUMN_WIDTH);
                            // Set the new width of the cell newWidth
                            cell.cell.setWidth(newWidth);
                        }
                    }
                },
                { tag: 'skip-scroll-into-view' },
            );
        },
        [activeCell, editor],
    );

    /** Handling mouse up events */
    const mouseUpHandler = useCallback(
        (direction: MouseDraggingDirection) => {
            const handler = (event: MouseEvent) => {
                event.preventDefault();
                event.stopPropagation();
                if (!activeCell) {
                    throw new Error('TableCellResizer: Expected active cell.');
                }
                if (!mouseStartPosRef.current) return;

                // Get the x and y coordinates of the mouse start position.
                const { x, y } = mouseStartPosRef.current;
                if (activeCell === null) return;

                // The current zoom level is then calculated zoom
                const zoom = calculateZoomLevel(event.target as Element);

                // If you're adjusting the height, calculate the heightChange and call `updateRowHeight` to update the row height.
                if (isHeightChanging(direction)) {
                    const heightChange = (event.clientY - y) / zoom;
                    updateRowHeight(heightChange);
                } else {
                    // If you are adjusting the width, calculate the widthChange and call `updateColumnWidth` to update the column width.
                    const widthChange = (event.clientX - x) / zoom;
                    updateColumnWidth(widthChange);
                }

                resetState();
                document.removeEventListener('mouseup', handler);
            };
            return handler;
        },
        [activeCell, resetState, updateColumnWidth, updateRowHeight],
    );

    /** Used to toggle the adjustment state. Record the mouse start position and update the drag direction, and add a mouse lift event listener.。 */
    const toggleResize = useCallback(
        (direction: MouseDraggingDirection): MouseEventHandler<HTMLDivElement> =>
            event => {
                event.preventDefault();
                event.stopPropagation();
                if (!activeCell) {
                    throw new Error('TableCellResizer: Expected active cell.');
                }

                mouseStartPosRef.current = {
                    x: event.clientX,
                    y: event.clientY,
                };
                updateMouseCurrentPos(mouseStartPosRef.current);
                updateDraggingDirection(direction);

                document.addEventListener('mouseup', mouseUpHandler(direction));
            },
        [activeCell, mouseUpHandler],
    );

    return {
        toggleResize,
    };
};
