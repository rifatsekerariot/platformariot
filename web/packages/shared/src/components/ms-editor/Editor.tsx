import React, { forwardRef, useImperativeHandle, useState } from 'react';
import cls from 'classnames';

import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';

import { Toolbar } from './components';
import { TableHoverActionsPlugin, TableActionMenuPlugin, TableCellResizerPlugin } from './plugins';
import { useTransmit, useEditable, useEditConfigure } from './hooks';
import type { EditorHandlers, IEditorProps } from './types';

import './style.less';

export const LexicalEditor = forwardRef<EditorHandlers, IEditorProps>((props, ref) => {
    const {
        mode,
        placeholder,
        editorConfig,
        onSave,
        onCancel,
        renderOperator,
        autoFocus,
        renderToolbar,
        extraToolbar,
        enableTable = false,
        onChange,
    } = props;
    const { toolbar = true, plugin } = editorConfig || {};
    const { table: tablePlugin } = plugin || {};
    const [isEditable, onEditableChange] = useEditable(props);

    const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);
    const onRef = (_floatingAnchorElem: HTMLDivElement) => {
        if (_floatingAnchorElem !== null) {
            setFloatingAnchorElem(_floatingAnchorElem);
        }
    };

    const handler = useTransmit({ onEditableChange });
    /** expose methods to parent component */
    useImperativeHandle(ref, handler);

    return (
        <div
            className={cls('ms-editor-container', {
                'ms-editor-container--readonly': !isEditable,
            })}
        >
            {!!toolbar && !renderToolbar && (
                <Toolbar
                    mode={mode}
                    isEditable={isEditable}
                    onEditableChange={onEditableChange}
                    onSave={onSave}
                    onCancel={onCancel}
                    editorConfig={editorConfig}
                    renderOperator={renderOperator}
                    extraToolbar={extraToolbar}
                    enableTable={enableTable}
                />
            )}

            {/* custom render toolbar */}
            {renderToolbar}

            <div className="ms-editor-inner">
                <RichTextPlugin
                    contentEditable={
                        <div className="ms-editor-content" ref={onRef}>
                            <ContentEditable className="ms-editor-input" />
                        </div>
                    }
                    placeholder={<div className="ms-editor-placeholder">{placeholder}</div>}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                {autoFocus && <AutoFocusPlugin />}
                {/* { lexical editor state on change callbacks } */}
                <OnChangePlugin onChange={(...args) => onChange?.(...args)} />

                {enableTable && <TablePlugin />}
                {enableTable && floatingAnchorElem && (
                    <>
                        <TableHoverActionsPlugin
                            anchorElem={floatingAnchorElem!}
                            plugins={tablePlugin}
                        />
                        <TableCellResizerPlugin
                            anchorElem={floatingAnchorElem!}
                            plugins={tablePlugin}
                        />
                    </>
                )}
                {enableTable && <TableActionMenuPlugin plugins={tablePlugin} />}
            </div>
        </div>
    );
});

export default React.memo(
    forwardRef<EditorHandlers, IEditorProps>((props, ref) => {
        const editorConfigure = useEditConfigure(props);

        return (
            <LexicalComposer initialConfig={editorConfigure}>
                <LexicalEditor {...props} ref={ref} />
            </LexicalComposer>
        );
    }),
);
