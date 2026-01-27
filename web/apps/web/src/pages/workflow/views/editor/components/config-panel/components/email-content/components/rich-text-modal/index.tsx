import React, { useRef, useEffect } from 'react';
import { useMemoizedFn } from 'ahooks';

import {
    Modal,
    type ModalProps,
    MSRichtextEditor,
    type EditorHandlers,
} from '@milesight/shared/src/components';
import { useI18n } from '@milesight/shared/src/hooks';

import PreviousNodeSelect from '../previous-node-select';

import './style.less';

export interface RichTextModalProps extends ModalProps {
    upstreamNodeSelectable?: boolean;
    data?: string;
    onSave?: (data: string) => void;
}

/**
 * rich text Modal
 */
const RichTextModal: React.FC<RichTextModalProps> = props => {
    const { visible, data, onSave, onOk, upstreamNodeSelectable = true, ...restProps } = props;

    const { getIntlText } = useI18n();
    const editorRef = useRef<EditorHandlers>(null);

    const handleOk = useMemoizedFn(async () => {
        try {
            const richTextContent = await editorRef.current?.getEditorHtml();
            onSave?.(richTextContent || '');
        } finally {
            onOk?.();
        }
    });

    useEffect(() => {
        if (visible) {
            /** waiting the editor render ok */
            setTimeout(() => {
                editorRef.current?.setEditorHtmlContent(data || '', true);
            }, 150);
        }
    }, [visible, data]);

    const renderExtraToolbar = () => {
        if (upstreamNodeSelectable) {
            return (
                <PreviousNodeSelect
                    onSelect={nodeKey => {
                        if (!nodeKey) return;

                        editorRef.current?.insertTextContent(nodeKey);
                    }}
                />
            );
        }

        return null;
    };

    const renderModal = () => {
        if (visible) {
            return (
                <Modal
                    width="900px"
                    visible={visible}
                    title={getIntlText('workflow.email.content_modal_title')}
                    onOkText={getIntlText('common.button.save')}
                    onOk={handleOk}
                    {...restProps}
                >
                    <div className="ms-rich-text-modal__body">
                        <MSRichtextEditor
                            ref={editorRef}
                            isEditable
                            autoFocus
                            renderOperator={() => null}
                            editorConfig={{
                                toolbar: [
                                    {
                                        name: 'textAlign',
                                        visible: false,
                                    },
                                    {
                                        name: 'fontColor',
                                        visible: false,
                                    },
                                ],
                            }}
                            extraToolbar={renderExtraToolbar()}
                        />
                    </div>
                </Modal>
            );
        }

        return null;
    };

    return renderModal();
};

export default RichTextModal;
