import { $getSelection, $isElementNode, $isParagraphNode, $isRangeSelection } from 'lexical';
import {
    $getNodeTriplet,
    $isTableCellNode,
    $isTableSelection,
    TableCellNode,
    TableSelection,
} from '@lexical/table';
import type { ElementNode } from 'lexical';
import { $isExtendedTextNode } from '../../../../../nodes/ExtendedTextNode';

export const computeSelectionCount = (
    selection: TableSelection,
): {
    columns: number;
    rows: number;
} => {
    const selectionShape = selection.getShape();
    return {
        columns: selectionShape.toX - selectionShape.fromX + 1,
        rows: selectionShape.toY - selectionShape.fromY + 1,
    };
};

export const isTableSelectionRectangular = (selection: TableSelection): boolean => {
    const nodes = selection.getNodes();
    const currentRows: Array<number> = [];
    let currentRow = null;
    let expectedColumns = null;
    let currentColumns = 0;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if ($isTableCellNode(node)) {
            const row = node.getParentOrThrow();
            if (currentRow !== row) {
                if (expectedColumns !== null && currentColumns !== expectedColumns) {
                    return false;
                }
                if (currentRow !== null) {
                    expectedColumns = currentColumns;
                }
                currentRow = row;
                currentColumns = 0;
            }
            const colSpan = node.__colSpan;
            for (let j = 0; j < colSpan; j++) {
                if (currentRows[currentColumns + j] === undefined) {
                    currentRows[currentColumns + j] = 0;
                }
                currentRows[currentColumns + j] += node.__rowSpan;
            }
            currentColumns += colSpan;
        }
    }
    return (
        (expectedColumns === null || currentColumns === expectedColumns) &&
        currentRows.every(v => v === currentRows[0])
    );
};

export const $canUnmerge = (): boolean => {
    const selection = $getSelection();
    if (
        ($isRangeSelection(selection) && !selection.isCollapsed()) ||
        ($isTableSelection(selection) && !selection.anchor.is(selection.focus)) ||
        (!$isRangeSelection(selection) && !$isTableSelection(selection))
    ) {
        return false;
    }
    const [cell] = $getNodeTriplet(selection.anchor);
    return cell.__colSpan > 1 || cell.__rowSpan > 1;
};

export const $cellContainsEmptyParagraph = (cell: TableCellNode): boolean => {
    if (cell.getChildrenSize() !== 1) {
        return false;
    }
    const firstChild = cell.getFirstChildOrThrow();
    if (!$isParagraphNode(firstChild) || !firstChild.isEmpty()) {
        return false;
    }
    return true;
};

export const $selectLastDescendant = (node: ElementNode): void => {
    const lastDescendant = node.getLastDescendant();
    if ($isExtendedTextNode(lastDescendant)) {
        lastDescendant.select();
    } else if ($isElementNode(lastDescendant)) {
        lastDescendant.selectEnd();
    } else if (lastDescendant !== null) {
        lastDescendant.selectNext();
    }
};
