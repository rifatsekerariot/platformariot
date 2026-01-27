import { useEffect, useState } from 'react';
import { useDebounceFn, useMemoizedFn } from 'ahooks';

import { $getNearestNodeFromDOMNode } from 'lexical';
import {
    $getTableColumnIndexFromTableCellNode,
    $getTableRowIndexFromTableCellNode,
    $isTableCellNode,
    $isTableNode,
    TableCellNode,
    TableNode,
    TableRowNode,
} from '@lexical/table';
import { $findMatchingParent } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { getMouseInfo } from '../helper';
import { useWhenScroll } from './useWhenScroll';
import { BUTTON_CONTAINER_WIDTH } from '../../constants';

interface IProps {
    anchorElem: HTMLElement;
    isEditable: boolean;
    shouldListenMouseMove: boolean;
    setShownRow: React.Dispatch<React.SetStateAction<boolean>>;
    setShownColumn: React.Dispatch<React.SetStateAction<boolean>>;
    tableDOMNodeRef: React.MutableRefObject<HTMLElement | null>;
}
export const useShowBtn = ({
    anchorElem,
    isEditable,
    shouldListenMouseMove,
    setShownRow,
    setShownColumn,
    tableDOMNodeRef,
}: IProps) => {
    const [editor] = useLexicalComposerContext();
    const [position, setPosition] = useState({});

    /**
     * get table node
     */
    const getTableNodeElement = useMemoizedFn((tableDOMNode: HTMLElement) => {
        if (!tableDOMNode) return;

        tableDOMNodeRef.current = tableDOMNode;

        let hoveredRowNode: TableCellNode | null = null;
        let hoveredColumnNode: TableCellNode | null = null;
        let tableDOMElement: HTMLElement | null = null;

        editor.update(() => {
            // get the nearest table cell node
            const maybeTableCell = $getNearestNodeFromDOMNode(tableDOMNode);
            if (!$isTableCellNode(maybeTableCell)) return;

            // find included the table cell node
            const table = $findMatchingParent(maybeTableCell, node => $isTableNode(node));
            if (!$isTableNode(table)) return;

            // get table node element
            tableDOMElement = editor.getElementByKey(table?.getKey());
            if (!tableDOMElement) return;

            // get table row and column
            const rowCount = table.getChildrenSize();
            const colCount = (
                (table as TableNode).getChildAtIndex(0) as TableRowNode
            )?.getChildrenSize();

            // get current table cell row index and column index
            const rowIndex = $getTableRowIndexFromTableCellNode(maybeTableCell);
            const colIndex = $getTableColumnIndexFromTableCellNode(maybeTableCell);

            // determine current cell is the last row or the last column, then set `hoveredRowNode` or `hoveredColumnNode。`
            if (rowIndex === rowCount - 1) {
                hoveredRowNode = maybeTableCell;
            } else if (colIndex === colCount - 1) {
                hoveredColumnNode = maybeTableCell;
            }
        });

        return {
            tableDOMElement,
            hoveredRowNode,
            hoveredColumnNode,
        };
    });

    /**
     * set button style
     */
    const setupBtnStyle = useMemoizedFn(
        (
            tableDOMElement: HTMLElement,
            hoveredRowNode: TableCellNode | null,
            hoveredColumnNode: TableCellNode | null,
        ) => {
            if (!tableDOMElement) return;

            // get table dom element position information
            const {
                width: tableElemWidth,
                y: tableElemY,
                x: tableElemX,
                right: tableElemRight,
                bottom: tableElemBottom,
                height: tableElemHeight,
            } = (tableDOMElement as HTMLTableElement).getBoundingClientRect();
            // get the location information of the mount point
            const { y: editorElemY, left: editorElemLeft } = anchorElem.getBoundingClientRect();

            //  updates the Ui based on where the mouse is hovering
            if (hoveredRowNode) {
                setShownColumn(false);
                setShownRow(true);
                setPosition({
                    height: BUTTON_CONTAINER_WIDTH,
                    left: tableElemX - editorElemLeft,
                    top: tableElemBottom - editorElemY,
                    width: tableElemWidth,
                });
            } else if (hoveredColumnNode) {
                setShownColumn(true);
                setShownRow(false);
                setPosition({
                    height: tableElemHeight,
                    left: tableElemRight - editorElemLeft,
                    top: tableElemY - editorElemY,
                    width: BUTTON_CONTAINER_WIDTH,
                });
            }
        },
    );

    /** hide the add button */
    const hiddenButton = useMemoizedFn(() => {
        setShownRow(false);
        setShownColumn(false);
        cancelDebouncedOnMouseMove();
    });
    // hide button when scrolling
    const { getIsScroll } = useWhenScroll(hiddenButton);

    const { run: debouncedOnMouseMove, cancel: cancelDebouncedOnMouseMove } = useDebounceFn(
        (event: MouseEvent) => {
            if (getIsScroll()) return;

            const { isOutside, tableDOMNode } = getMouseInfo(event);

            if (isOutside) {
                // Mouse is not in the form, then the add button is not displayed
                setShownRow(false);
                setShownColumn(false);
                return;
            }
            if (!tableDOMNode) return;

            const { tableDOMElement, hoveredRowNode, hoveredColumnNode } =
                getTableNodeElement(tableDOMNode) || {};
            if (!tableDOMElement) return;

            setupBtnStyle(tableDOMElement, hoveredRowNode!, hoveredColumnNode!);
        },
        {
            wait: 50,
            maxWait: 250,
        },
    );

    useEffect(() => {
        if (!shouldListenMouseMove || !isEditable) return;

        document.addEventListener('mousemove', debouncedOnMouseMove);

        return () => {
            document.removeEventListener('mousemove', debouncedOnMouseMove);
        };
    }, [shouldListenMouseMove, debouncedOnMouseMove, cancelDebouncedOnMouseMove, isEditable]);

    return {
        position,
    };
};
