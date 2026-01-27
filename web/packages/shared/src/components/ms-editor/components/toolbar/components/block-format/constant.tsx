/** block type */
export enum BLOCK_TYPE {
    PARAGRAPH = 'paragraph',
    HEADING_1 = 'h1',
    HEADING_2 = 'h2',
    HEADING_3 = 'h3',
}

/** block type options */
export const BlockTypeOptions = [
    {
        label: 'Normal',
        value: BLOCK_TYPE.PARAGRAPH,
    },
    {
        label: 'Heading 1',
        value: BLOCK_TYPE.HEADING_1,
    },
    {
        label: 'Heading 2',
        value: BLOCK_TYPE.HEADING_2,
    },
    {
        label: 'Heading 3',
        value: BLOCK_TYPE.HEADING_3,
    },
];

/** default block type */
export const DEFAULT_BLOCK_TYPE = BLOCK_TYPE.PARAGRAPH;
