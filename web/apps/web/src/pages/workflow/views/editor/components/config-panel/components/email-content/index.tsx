import React from 'react';
import { useControllableValue } from 'ahooks';
import { IconButton } from '@mui/material';

import { MSRichtextEditor, OpenInFullIcon } from '@milesight/shared/src/components';
import { useI18n } from '@milesight/shared/src/hooks';

import { RichTextModal } from './components';
import { useEmailContent } from './hooks';

import styles from './style.module.less';

export interface EmailContentProps {
    /** Whether rich text can select upstream nodes */
    upstreamNodeSelectable?: boolean;
    value?: string;
    onChange: (value: string) => void;
}

/**
 * Email Notify Node
 * The Email Content Enter Component
 */
const EmailContent: React.FC<EmailContentProps> = props => {
    const { upstreamNodeSelectable = true, value, onChange } = props;

    const { getIntlText } = useI18n();
    const [content, setContent] = useControllableValue<string>({
        value: value || '',
        onChange,
    });
    const { modalVisible, showModal, hiddenModal, editorRef, handleSmallEditorChange } =
        useEmailContent(content, setContent);

    const renderToolbar = () => {
        return (
            <div className={styles['email-content__toolbar']}>
                <div className={styles.text}>{getIntlText('common.label.content')}</div>
                <IconButton onClick={showModal}>
                    <OpenInFullIcon />
                </IconButton>
            </div>
        );
    };

    return (
        <div className={styles['email-content']}>
            <MSRichtextEditor
                ref={editorRef}
                autoFocus={false}
                isEditable
                editorConfig={{
                    toolbar: false,
                }}
                renderToolbar={renderToolbar()}
                onChange={handleSmallEditorChange}
            />
            <RichTextModal
                data={content}
                visible={modalVisible}
                onCancel={hiddenModal}
                onOk={hiddenModal}
                onSave={setContent}
                upstreamNodeSelectable={upstreamNodeSelectable}
            />
        </div>
    );
};

export default EmailContent;
