import { ElementFormatType } from 'lexical';

export const IS_ALIGN_LEFT = 1;
export const IS_ALIGN_CENTER = 2;
export const IS_ALIGN_RIGHT = 3;
export const IS_ALIGN_JUSTIFY = 4;
export const IS_ALIGN_START = 5;
export const IS_ALIGN_END = 6;

/** position map */
export const ELEMENT_TYPE_TO_FORMAT: Record<Exclude<ElementFormatType, ''>, number> = {
    center: IS_ALIGN_CENTER,
    end: IS_ALIGN_END,
    justify: IS_ALIGN_JUSTIFY,
    left: IS_ALIGN_LEFT,
    right: IS_ALIGN_RIGHT,
    start: IS_ALIGN_START,
};
