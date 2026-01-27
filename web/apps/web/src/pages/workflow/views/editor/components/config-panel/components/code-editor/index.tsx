import React, { useCallback, useState } from 'react';
import { IconButton, Popover } from '@mui/material';
import { useCopy } from '@milesight/shared/src/hooks';
import { AddCircleOutlineIcon, ContentCopyIcon } from '@milesight/shared/src/components';
import {
    CodeEditor as CodeMirror,
    CodeEditorSelect,
    type EditorProps,
    type EditorHandlers,
    type EditorSupportLang,
} from '@/components';
import { PARAM_REFERENCE_PREFIX } from '../../../../constants';
import { CODE_EXPRESSION_DEFAULT_VALUE } from '../../constants';
import UpstreamNodeList from '../upstream-node-list';
import './style.less';

export interface CodeEditorData {
    language: EditorSupportLang;
    expression: string;
}
export interface IProps extends Omit<EditorProps, 'value' | 'onChange'> {
    /**
     * Title
     */
    title?: string;
    /**
     * Whether to enable read-only mode
     */
    readonly?: boolean;
    /**
     * Whether to enable the ability to copy the value
     */
    copyable?: boolean;
    /**
     * Whether to enable the ability to select upstream variables
     */
    variableSelectable?: boolean;
    /** Whether to automatically fill in the default value when language change. */
    autoFillDefaultValue?: boolean;
    defaultValues?: Partial<Record<EditorSupportLang, string>>;
    value: CodeEditorData;
    onChange: (value: CodeEditorData) => void;
}

export const DEFAULT_LANGUAGE = 'js';
export const SUPPORT_LANGUAGES: EditorSupportLang[] = ['groovy', 'js', 'python', 'mvel'];

/**
 * Code Editor Component
 *
 * Note: Use in CodeNode, IfelseNode
 */
const CodeEditor: React.FC<IProps> = ({
    title,
    readOnly = false,
    copyable = true,
    variableSelectable = false,
    autoFillDefaultValue,
    defaultValues = CODE_EXPRESSION_DEFAULT_VALUE,
    supportLangs = SUPPORT_LANGUAGES,
    value,
    onChange,
    ...props
}) => {
    const { language = DEFAULT_LANGUAGE, expression } = value || {};

    // ---------- Value change callback ----------
    /** Actual form change callbacks */
    const handleChange = useCallback(
        (data: CodeEditorData) => {
            const { language, expression } = data;

            onChange?.({
                language,
                expression,
            });
        },
        [onChange],
    );

    /** Callback function triggered when the language changes. */
    const handleEditorLangChange = useCallback(
        (language: EditorSupportLang) => {
            let expression = '';

            if (autoFillDefaultValue && defaultValues[language]) {
                expression = defaultValues[language] || '';
            }

            handleChange?.({
                language,
                expression,
            });
        },
        [autoFillDefaultValue, defaultValues, handleChange],
    );

    /** Callback function triggered when the content value changes. */
    const handleEditorValueChange = useCallback(
        (expression: string) => {
            handleChange?.({ language, expression });
        },
        [handleChange, language],
    );

    // ---------- Render Upstream Node Select ----------
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const renderNodeParamSelect = useCallback(
        (editorInstance?: EditorHandlers | null) => {
            return (
                <>
                    <IconButton
                        onClick={e => {
                            e.stopPropagation();
                            setAnchorEl(e.currentTarget);
                        }}
                    >
                        <AddCircleOutlineIcon />
                    </IconButton>
                    <Popover
                        open={!!anchorEl}
                        anchorEl={anchorEl}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        sx={{
                            '.MuiList-root': {
                                width: 230,
                            },
                        }}
                    >
                        <UpstreamNodeList
                            onChange={({ nodeId, valueOriginKey }) => {
                                const key = `${PARAM_REFERENCE_PREFIX}['${nodeId}']['${valueOriginKey}']`;
                                setAnchorEl(null);
                                editorInstance?.insert(key);
                                setTimeout(() => {
                                    editorInstance?.getEditorView()?.focus();
                                }, 0);
                            }}
                        />
                    </Popover>
                </>
            );
        },
        [anchorEl],
    );

    // ---------- Render Common Header ----------
    const { handleCopy } = useCopy();
    const renderHeader = useCallback<NonNullable<EditorProps['renderHeader']>>(
        ({ editorValue, editorLang, editorHandlers, setEditorLang }) => {
            return (
                <div className="ms-workflow-code-editor-header">
                    <div className="ms-workflow-code-editor-header-title">
                        {title ? (
                            <span>{title}</span>
                        ) : (
                            <CodeEditorSelect
                                editorLang={editorLang}
                                onEditorLangChange={setEditorLang}
                                supportLangs={supportLangs}
                            />
                        )}
                    </div>
                    <div className="ms-workflow-code-editor-header-actions">
                        <div className="ms-workflow-code-editor-header-action">
                            {readOnly || !variableSelectable
                                ? null
                                : renderNodeParamSelect(editorHandlers)}
                            {copyable && (
                                <IconButton
                                    disabled={!editorValue}
                                    onClick={e => {
                                        e.stopPropagation();
                                        if (!editorValue) return;
                                        handleCopy(
                                            editorValue,
                                            e.currentTarget.parentNode as HTMLElement,
                                        );
                                    }}
                                >
                                    <ContentCopyIcon />
                                </IconButton>
                            )}
                            {/* {extendable && (
                                <IconButton
                                    onClick={() => {
                                        if (!inModal) setModalEditorCont(value || '');
                                        setShowModal(!inModal);
                                    }}
                                >
                                    {inModal ? <CloseIcon /> : <OpenInFullIcon />}
                                </IconButton>
                            )} */}
                        </div>
                    </div>
                </div>
            );
        },
        [
            title,
            supportLangs,
            readOnly,
            copyable,
            variableSelectable,
            handleCopy,
            renderNodeParamSelect,
        ],
    );

    return (
        <div className="ms-workflow-code-editor">
            <CodeMirror
                {...props}
                readOnly={readOnly}
                editable={!readOnly}
                editorLang={language}
                supportLangs={supportLangs}
                renderHeader={renderHeader}
                onLangChange={handleEditorLangChange}
                value={expression}
                onChange={handleEditorValueChange}
            />
        </div>
    );
};

export default CodeEditor;
