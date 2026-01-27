/**
 * Param Input Component
 *
 * Note: use in TriggerNode, CodeNode
 */
import { useEffect, useLayoutEffect, useMemo } from 'react';
import {
    Select,
    Button,
    IconButton,
    MenuItem,
    TextField,
    Checkbox,
    type SelectProps,
    type TextFieldProps,
    type CheckboxProps,
} from '@mui/material';
import { isEqual, cloneDeep } from 'lodash-es';
import { useDynamicList, useControllableValue } from 'ahooks';
import { useI18n } from '@milesight/shared/src/hooks';
import { genRandomString } from '@milesight/shared/src/utils/tools';
import { AddIcon, CloseIcon, KeyboardArrowDownIcon } from '@milesight/shared/src/components';
import './style.less';
import { entityTypeOptions } from '@/constants';

export type ParamInputValueType = NonNullable<
    TriggerNodeDataType['parameters']
>['entityConfigs'][0] & {
    context?: boolean;
};

export interface ParamInputProps {
    /**
     * Is required
     */
    required?: boolean;
    /**
     * Is disabled
     */
    disabled?: boolean;
    /**
     * Default value
     */
    defaultValue?: ParamInputValueType[];
    /**
     * Show required option
     */
    showRequired?: boolean;
    /**
     * Is show `Other` option in type select
     */
    isOutput?: boolean;
    /**
     * The maximum number of items that can be added
     */
    maxAddNum?: number;
    /**
     * The properties of the select component
     */
    selectProps?: SelectProps;
    /**
     * The properties of the input component
     */
    inputProps?: TextFieldProps;
    /**
     * The properties of the checkbox component
     */
    checkboxProps?: CheckboxProps & { label?: string };
    /**
     * The value of the component
     */
    value?: ParamInputValueType[];
    /**
     * Callback function when the value changes
     */
    onChange?: (value: ParamInputValueType[]) => void;
}

const MAX_VALUE_LENGTH = 10;

const DEFAULT_EMPTY_VALUE: ParamInputValueType = {
    identify: '',
    name: '',
    type: '' as EntityValueDataType,
};
const ParamInput: React.FC<ParamInputProps> = ({
    required,
    disabled,
    showRequired,
    isOutput = false,
    maxAddNum = MAX_VALUE_LENGTH,
    inputProps,
    selectProps,
    checkboxProps,
    ...props
}) => {
    const { getIntlText } = useI18n();
    const [innerValue, setInnerValue] = useControllableValue<ParamInputValueType[]>(props);
    const { list, remove, getKey, insert, replace, resetList } =
        useDynamicList<ParamInputValueType>(innerValue || []);

    useLayoutEffect(() => {
        if (isEqual(innerValue, list)) return;
        resetList(innerValue || []);
    }, [innerValue, resetList]);

    useEffect(() => {
        setInnerValue?.(list);
    }, [list, setInnerValue]);

    const handleChange = (
        index: number,
        rowItem: ParamInputValueType,
        key: string,
        value: string | boolean,
    ) => {
        replace(index, { ...rowItem, [key]: value });
    };

    const disabledAdd = useMemo(() => {
        return maxAddNum !== undefined && Number.isInteger(maxAddNum) && list.length >= maxAddNum;
    }, [list, maxAddNum]);

    const handleAdd = () => {
        if (disabledAdd) return;
        insert(list.length, {
            ...DEFAULT_EMPTY_VALUE,
            identify: `param_${genRandomString(8, { lowerCase: true })}`,
        });
    };

    const typeOptions = useMemo(() => {
        const result = cloneDeep(entityTypeOptions);

        if (isOutput) {
            result.push({
                value: 'OTHER',
                label: 'workflow.label.param_type_other',
            });
        }

        return result;
    }, [isOutput]);

    return (
        <div className="ms-param-input">
            {list.map((item, index) => (
                <div className="ms-param-input-item" key={getKey(index) || index}>
                    <div className="ms-param-input-name">
                        <div className="label">
                            {inputProps?.label || getIntlText('common.label.name')}
                        </div>
                        <TextField
                            slotProps={{
                                input: { size: 'small' },
                            }}
                            required={required}
                            disabled={disabled}
                            value={item.name}
                            onChange={e =>
                                handleChange(index, item, 'name', e.target.value as string)
                            }
                        />
                    </div>
                    <div className="ms-param-input-type">
                        <div className="label">
                            {selectProps?.label || getIntlText('common.label.type')}
                        </div>
                        <Select
                            notched
                            fullWidth
                            size="small"
                            labelId="param-input-type-label"
                            IconComponent={KeyboardArrowDownIcon}
                            value={item.type}
                            onChange={e =>
                                handleChange(index, item, 'type', e.target.value as string)
                            }
                        >
                            {typeOptions.map(item => (
                                <MenuItem key={item.value} value={item.value}>
                                    {getIntlText(item.label)}
                                </MenuItem>
                            ))}
                        </Select>
                    </div>
                    {showRequired && (
                        <div className="ms-param-input-required">
                            <div className="label">
                                {checkboxProps?.label || getIntlText('common.label.required')}
                            </div>
                            <Checkbox
                                size="small"
                                disabled={disabled}
                                checked={!!item?.required}
                                onChange={e => {
                                    handleChange(index, item, 'required', e.target.checked);
                                }}
                            />
                        </div>
                    )}
                    <IconButton className="btn-delete" onClick={() => remove(index)}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </div>
            ))}
            <Button
                variant="text"
                className="btn-add"
                startIcon={<AddIcon />}
                disabled={disabledAdd}
                onClick={handleAdd}
            >
                {getIntlText('common.label.add')}
            </Button>
        </div>
    );
};

export default ParamInput;
