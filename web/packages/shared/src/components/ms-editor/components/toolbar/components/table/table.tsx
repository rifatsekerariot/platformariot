import React from 'react';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ToolbarPart } from '../toolbar-part';
import { TableViewIcon } from '../../../../../icons';
import type { TableItemConfig } from '../../../../types';

interface IProps {
    disabled: boolean;
    initConfig?: TableItemConfig['initConfig'];
}
export default React.memo(({ disabled, initConfig }: IProps) => {
    const [editor] = useLexicalComposerContext();

    /** Click Insert Table */
    const handleTable = () => {
        const { rows = '4', columns = '4', includeHeaders } = initConfig || {};

        editor.dispatchCommand(INSERT_TABLE_COMMAND, {
            columns,
            rows,
            includeHeaders: includeHeaders ?? {
                rows: true,
                columns: false,
            },
        });
    };

    return (
        <ToolbarPart disabled={disabled} onClick={handleTable}>
            <TableViewIcon className="ms-toolbar__icon" />
        </ToolbarPart>
    );
});
