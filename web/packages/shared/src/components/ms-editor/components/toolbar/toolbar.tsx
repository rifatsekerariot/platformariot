import { Fragment } from 'react';
import { Button, Stack } from '@mui/material';
import cls from 'classnames';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useI18n, useSignalState } from '../../../../hooks';
import { hasEditable, hasReadOnly } from '../../helper';
import { MODE } from '../../constant';
import { useGroup } from './hooks';
import type { EditorState, IEditorProps } from '../../types';
import './style.less';

type IProps = Pick<
    IEditorProps,
    | 'isEditable'
    | 'onEditableChange'
    | 'onSave'
    | 'onCancel'
    | 'mode'
    | 'editorConfig'
    | 'renderOperator'
    | 'extraToolbar'
    | 'enableTable'
>;
const Divider = () => <div className="ms-toolbar__divider" />;
export default function ToolbarPlugin({
    mode = MODE.ALL,
    isEditable,
    editorConfig,
    onEditableChange,
    onSave,
    onCancel,
    renderOperator,
    extraToolbar,
    enableTable,
}: IProps) {
    const { getIntlText } = useI18n();
    const [editor] = useLexicalComposerContext();
    const [getEditableState, updateEditableState] = useSignalState<EditorState | null>(null);

    /** When clicking Save/Edit */
    const handleClick = () => {
        const prevIsEditable = isEditable;

        if (!prevIsEditable) {
            // Save the current snapshot
            const editorState = editor.getEditorState();
            updateEditableState(editorState);
        } else {
            updateEditableState(null);
        }

        // Change current read-only/edit
        onEditableChange?.(!prevIsEditable);
        if (prevIsEditable) {
            // save
            const data = editor.getEditorState().toJSON();
            onSave && onSave(data);
        }
    };
    /** cancel */
    const handleCancel = async () => {
        await (onCancel && onCancel());

        // Restore default content
        const editableState = getEditableState();
        editableState && editor.setEditorState(editableState);

        // Change current read-only/edit
        onEditableChange?.(!isEditable);
    };
    const ToolbarGroup = useGroup({ editorConfig, enableTable });

    const saveBtnNode = (
        <Stack
            direction="row"
            spacing="4px"
            sx={{ height: '100%', alignItems: 'center', justifyContent: 'end' }}
        >
            <Button variant="outlined" onClick={handleCancel}>
                {getIntlText('common.button.cancel')}
            </Button>
            <Button variant="contained" onClick={handleClick}>
                {getIntlText('common.button.save')}
            </Button>
        </Stack>
    );
    const editBtnNode = (
        <Button variant="outlined" onClick={handleClick} className="ms-toolbar__btn">
            {getIntlText('common.button.edit')}
        </Button>
    );

    return (
        <div className="ms-editor-toolbar">
            <div
                className={cls('ms-toolbar__container', {
                    'ms-toolbar__container--editable': isEditable,
                    'ms-toolbar__container--readonly': !isEditable,
                })}
            >
                {isEditable ? (
                    <>
                        <div className="ms-toolbar__functions">
                            {ToolbarGroup?.map((toolbarItem, index) => {
                                const { type, Component } = toolbarItem! || {};
                                const props = (toolbarItem as any)?.props || {};

                                return (
                                    <Fragment key={toolbarItem?.type}>
                                        <Component key={type} disabled={!isEditable} {...props} />
                                        {index !== ToolbarGroup.length - 1 && <Divider />}
                                    </Fragment>
                                );
                            })}
                            {extraToolbar}
                        </div>
                        {hasReadOnly(mode) && (
                            <div className="ms-toolbar__operator">
                                {renderOperator ? renderOperator(saveBtnNode) : saveBtnNode}
                            </div>
                        )}
                    </>
                ) : (
                    hasEditable(mode) && (
                        <div className="ms-toolbar__operator">
                            {renderOperator ? renderOperator(editBtnNode) : editBtnNode}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
