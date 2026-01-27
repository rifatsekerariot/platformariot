/* eslint-disable no-bitwise */
import type { MouseDraggingDirection } from './type';

/** Determine if the current drag direction is adjusting the height */
export const isHeightChanging = (direction: MouseDraggingDirection) => direction === 'bottom';

/** Check if the mouse is pressed */
export const isMouseDownOnEvent = (event: MouseEvent) => (event.buttons & 1) === 1;
