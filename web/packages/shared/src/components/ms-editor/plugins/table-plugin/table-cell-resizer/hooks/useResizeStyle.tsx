import { useCallback } from 'react';
import { TableDOMCell } from '@lexical/table';
import { calculateZoomLevel } from '@lexical/utils';
import { useMemoizedFn } from 'ahooks';
import { useTheme } from '../../../../../../hooks';
import { isHeightChanging } from '../helper';
import type { MouseDraggingDirection, MousePosition } from '../type';

interface IProps {
    activeCell: TableDOMCell | null;
    draggingDirection: MouseDraggingDirection | null;
    mouseCurrentPos: MousePosition | null;
    tableRectRef: React.MutableRefObject<DOMRect | null>;
    anchorElem: HTMLElement;
}
interface IStyle {
    bottom: React.CSSProperties;
    right: React.CSSProperties;
}
export const useResizeStyle = ({
    activeCell,
    draggingDirection,
    mouseCurrentPos,
    tableRectRef,
    anchorElem,
}: IProps) => {
    const { getCSSVariableValue } = useTheme();

    /**
     * Two basic style objects, styles, are defined to adjust the bottom and right handles.
     */
    const initStyles = useMemoizedFn((activeCell: TableDOMCell): IStyle => {
        // Get the size and position of the active cell
        const { height, width, top, left } = activeCell.elem.getBoundingClientRect();
        const zoneWidth = 4; // Defines the width of the edge area that can be dragged

        const { y: editorElemY, left: editorElemLeft } = anchorElem.getBoundingClientRect();
        return {
            bottom: {
                backgroundColor: 'none',
                cursor: 'row-resize',
                height: `${zoneWidth}px`,
                left: `${window.scrollX - editorElemLeft + left}px`,
                top: `${window.scrollY - editorElemY + top + height - zoneWidth / 2}px`,
                width: `${width}px`,
            },
            right: {
                backgroundColor: 'none',
                cursor: 'col-resize',
                height: `${height}px`,
                left: `${window.scrollX - editorElemLeft + left + width - zoneWidth / 2}px`,
                top: `${window.scrollY - editorElemY + top}px`,
                width: `${zoneWidth}px`,
            },
        };
    });

    /** Adjust the handle style according to the dragging direction and position */
    const updateStyle = useMemoizedFn(
        (
            activeCell: TableDOMCell,
            styles: IStyle,
            draggingDirection: MouseDraggingDirection | null,
        ) => {
            const tableRect = tableRectRef.current;
            if (!(draggingDirection && mouseCurrentPos && tableRect)) return styles;

            const { y: editorElemY, left: editorElemLeft } = anchorElem.getBoundingClientRect();
            const zoom = calculateZoomLevel(activeCell!.elem);
            // Set the width of the drag line
            const solidWidth = 2;
            // Setting the colour of the dragline
            const solidColor = getCSSVariableValue('--border-color-blue');

            // Adjust the handle style accordingly to the direction of dragging:
            if (isHeightChanging(draggingDirection)) {
                // If the drag direction is to adjust the height, update the position of the handle and the vertical line
                styles[draggingDirection].left = `${
                    window.scrollX - editorElemLeft + tableRect.left
                }px`;
                styles[draggingDirection].top = `${
                    window.scrollY - editorElemY + mouseCurrentPos.y / zoom
                }px`;
                styles[draggingDirection].height = `${solidWidth}px`;
                styles[draggingDirection].width = `${tableRect.width}px`;
            } else {
                // If the drag direction is to adjust the width, update the position of the handle and the horizontal line
                styles[draggingDirection].top = `${window.scrollY - editorElemY + tableRect.top}px`;
                styles[draggingDirection].left = `${
                    window.scrollX - editorElemLeft + mouseCurrentPos.x / zoom
                }px`;
                styles[draggingDirection].width = `${solidWidth}px`;
                styles[draggingDirection].height = `${tableRect.height}px`;
            }

            styles[draggingDirection].backgroundColor = solidColor;
            return styles;
        },
    );

    /** Used to get the style of the adjustment handle.
     * The style of the adjustment handle is calculated based on the position
     * and size of the active cell, as well as the drag direction and the current position of the mouse. */
    const getResizes = useCallback(() => {
        if (!activeCell) {
            // If there is no active cell, an empty object is returned.
            return {
                bottom: null,
                left: null,
                right: null,
                top: null,
            };
        }

        // Initial handle style
        const styles = initStyles(activeCell);
        // Adjust the handle style according to the dragging direction and position
        return updateStyle(activeCell, styles, draggingDirection);
    }, [activeCell, draggingDirection, mouseCurrentPos, getCSSVariableValue]);

    return {
        getResizes,
    };
};
