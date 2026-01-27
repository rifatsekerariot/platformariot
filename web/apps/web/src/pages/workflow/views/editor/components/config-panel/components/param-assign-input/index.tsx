import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import { Button, IconButton, TextField } from '@mui/material';
import { isEqual, isNil, isEmpty } from 'lodash-es';
import { useDynamicList, useControllableValue } from 'ahooks';
import { useI18n } from '@milesight/shared/src/hooks';
import { AddIcon, CloseIcon } from '@milesight/shared/src/components';
import ParamSelect from '../param-select';
import ParamInputSelect from '../param-input-select';
import './style.less';

export type ParamAssignInputValueType =
    | NonNullable<CodeNodeDataType['parameters']>['inputArguments']
    | undefined;

export type ParamAssignInputInnerValueType = [string, string] | undefined;

export interface ParamAssignInputProps {
    label?: string[];
    required?: boolean;
    multiple?: boolean;
    error?: boolean;
    helperText?: React.ReactNode;
    /**
     * The minimum number of items to be reserved for the list.
     */
    minCount?: number;
    /**
     * Whether disable input custom value
     */
    disableInput?: boolean;
    value?: ParamAssignInputValueType;
    defaultValue?: ParamAssignInputValueType;
    onChange?: (value: ParamAssignInputValueType) => void;
}

const MAX_VALUE_LENGTH = 10;
const DEFAULT_EMPTY_DATA = {};
const DEFAULT_ONE_DATA = { '': '' };

const arrayToObject = (arr: ParamAssignInputInnerValueType[]) => {
    const result: ParamAssignInputValueType = {};
    arr?.forEach(item => {
        if (!item) return;
        result[item[0]] = item[1];
    });
    return result;
};

/**
 * Param Assignment Input Component
 *
 * Note: use in CodeNode
 */
const ParamAssignInput: React.FC<ParamAssignInputProps> = ({
    label,
    required = false,
    multiple = true,
    minCount = 0,
    disableInput,
    ...props
}) => {
    const { getIntlText } = useI18n();
    const [data, setData] = useControllableValue<ParamAssignInputValueType>(props);
    const DEFAULT_DATA = useMemo(
        () => (minCount > 0 ? DEFAULT_ONE_DATA : DEFAULT_EMPTY_DATA),
        [minCount],
    );
    const { list, remove, getKey, insert, replace, resetList } =
        useDynamicList<ParamAssignInputInnerValueType>(Object.entries(data || DEFAULT_DATA));

    useLayoutEffect(() => {
        if (isEqual(data, arrayToObject(list))) return;
        resetList(Object.entries(!isEmpty(data) ? data : DEFAULT_DATA));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, resetList]);

    useEffect(() => {
        const result = arrayToObject(list);

        setData?.(result);
    }, [list, setData]);

    return (
        <div className="ms-param-assign-input">
            {list.map((item, index) => (
                <div className="ms-param-assign-input-item" key={getKey(index) || index}>
                    <TextField
                        autoComplete="off"
                        slotProps={{
                            input: { size: 'small' },
                        }}
                        label={label?.[0] || getIntlText('common.label.name')}
                        required={required}
                        value={item?.[0] || ''}
                        onChange={e => replace(index, [e.target.value, item?.[1] || ''])}
                    />
                    {disableInput ? (
                        <ParamSelect
                            size="small"
                            label={label?.[1]}
                            required={required}
                            value={item?.[1]}
                            onChange={e => {
                                const val = e.target.value;
                                replace(index, [item?.[0] || '', isNil(val) ? '' : `${val}`]);
                            }}
                        />
                    ) : (
                        <ParamInputSelect
                            size="small"
                            label={label?.[1]}
                            required={required}
                            value={item?.[1]}
                            onChange={data => {
                                replace(index, [item?.[0] || '', isNil(data) ? '' : `${data}`]);
                            }}
                        />
                    )}
                    {list.length > minCount && (
                        <IconButton className="btn-delete" onClick={() => remove(index)}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    )}
                </div>
            ))}
            {multiple && (
                <Button
                    variant="text"
                    className="btn-add"
                    startIcon={<AddIcon />}
                    disabled={list.length >= MAX_VALUE_LENGTH}
                    onClick={() => {
                        if (list.length >= MAX_VALUE_LENGTH) return;
                        insert(list.length, ['', '']);
                    }}
                >
                    {getIntlText('common.label.add')}
                </Button>
            )}
        </div>
    );
};

export default ParamAssignInput;
