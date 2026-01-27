import { getEditorClass } from '../../../helper';
import {
    RESIZER_CELL_CLASS,
    TABLE_CELL,
    TABLE_ADD_BUTTON_CLASS,
    TABLE_ADD_CONTAINER_CLASS,
    TABLE_ADD_ICON_CLASS,
} from '../constants';

/**
 * determines if the mouse is in the table
 * @returns `isOutside`: indicates whether the mouse is outside a specific element.
 * @returns `tableDOMNode`: is the closest table cell node found
 */
export const getMouseInfo = (
    event: MouseEvent,
): {
    tableDOMNode: HTMLElement | null;
    isOutside: boolean;
} => {
    const { target } = event;
    const isValidElement =
        target && (target instanceof HTMLElement || target instanceof SVGElement);

    if (isValidElement) {
        const tableDOMNode = target.closest<HTMLElement>(
            `td.${getEditorClass(TABLE_CELL)}, th.${getEditorClass(TABLE_CELL)}`,
        );

        const isOutside = !(
            tableDOMNode ||
            target.closest<HTMLElement>(`.${TABLE_ADD_ICON_CLASS}`) ||
            target.closest<HTMLElement>(`.${TABLE_ADD_ICON_CLASS} > svg`) ||
            target.closest<HTMLElement>(`div.${TABLE_ADD_BUTTON_CLASS}`) ||
            target.closest<HTMLElement>(`div.${TABLE_ADD_CONTAINER_CLASS}`) ||
            target.closest<HTMLElement>(`div.${RESIZER_CELL_CLASS}`)
        );

        return { isOutside, tableDOMNode };
    }
    return { isOutside: true, tableDOMNode: null };
};
