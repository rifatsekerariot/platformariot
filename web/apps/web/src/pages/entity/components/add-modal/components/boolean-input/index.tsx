import React from 'react';
import { TextField } from '@mui/material';
import cls from 'classnames';
import { useControllableValue } from 'ahooks';
import { useI18n } from '@milesight/shared/src/hooks';
import './style.less';

interface Props {
    label?: string;
    error?: boolean;
    required?: boolean;
    disabled?: boolean;
    value?: Partial<Record<'true' | 'false', string | undefined>>;
    onChange?: (value: Props['value']) => void;
}

const BooleanInput: React.FC<Props> = ({ label, error, required, disabled, ...props }) => {
    const { getIntlText } = useI18n();
    const [data, setData] = useControllableValue<Props['value']>(props);

    return (
        <div className={cls('ms-boolean-input', { error, disabled })}>
            <div className="ms-boolean-input-label">
                {label || getIntlText('entity.label.entity_items')}
                {required && <span className="asterisk">*</span>}
            </div>
            <div className="ms-boolean-input-fields">
                <div className="ms-boolean-input-field">
                    <div className="field-key">True</div>
                    <div className="field-value">
                        <TextField
                            fullWidth
                            sx={{ m: 0 }}
                            disabled={disabled}
                            value={data?.true || ''}
                            onChange={e => {
                                const { value } = e.target;
                                setData(d => {
                                    const newData = { ...d };
                                    newData.true = value;
                                    return newData;
                                });
                            }}
                        />
                    </div>
                </div>
                <div className="ms-boolean-input-field">
                    <div className="field-key">False</div>
                    <div className="field-value">
                        <TextField
                            fullWidth
                            sx={{ m: 0 }}
                            disabled={disabled}
                            value={data?.false || ''}
                            onChange={e => {
                                const { value } = e.target;
                                setData(d => {
                                    const newData = { ...d };
                                    newData.false = value;
                                    return newData;
                                });
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BooleanInput;
