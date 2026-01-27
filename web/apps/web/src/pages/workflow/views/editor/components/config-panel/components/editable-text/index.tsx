import React, { useState } from 'react';
import { useControllableValue } from 'ahooks';
import cls from 'classnames';
import { Tooltip } from '@/components';
import './style.less';

interface Props {
    value?: string;
    defaultValue?: string;
    className?: string;
    placeholder?: string;
    onChange?: (value: Props['value']) => void;
}

const EditableText: React.FC<Props> = ({ className, placeholder = '', ...props }) => {
    const [value, setValue] = useControllableValue(props);
    const [editing, setEditing] = useState(false);

    return (
        <div className={cls('ms-editable-text', className)}>
            {!editing ? (
                <div
                    className={cls('ms-editable-text-view', { 'is-placeholder': !value })}
                    onClick={() => setEditing(true)}
                >
                    <Tooltip autoEllipsis title={value || placeholder || ''} />
                </div>
            ) : (
                <input
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    type="text"
                    className="ms-editable-text-input"
                    placeholder={placeholder}
                    value={value}
                    onBlur={() => setEditing(false)}
                    onChange={e => setValue(e.target.value)}
                />
            )}
        </div>
    );
};

export default EditableText;
