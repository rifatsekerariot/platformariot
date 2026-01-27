import { memo, useEffect, useLayoutEffect } from 'react';
import { Button, IconButton } from '@mui/material';
import { isEqual } from 'lodash-es';
import { useDynamicList, useControllableValue } from 'ahooks';
import { useI18n } from '@milesight/shared/src/hooks';
import { AddIcon, CloseIcon } from '@milesight/shared/src/components';
import EntitySelect, { type EntitySelectProps } from '../entity-select';
import './style.less';

export type EntityMultipleSelectValueType = ApiKey;

export interface EntityMultipleSelectProps {
    required?: boolean;
    disabled?: boolean;
    multiple?: boolean;
    error?: boolean;
    helperText?: React.ReactNode;
    defaultValue?: EntityMultipleSelectValueType[];
    value?: EntityMultipleSelectValueType[];
    onChange?: (value: EntityMultipleSelectValueType[]) => void;
    filterModel?: EntitySelectProps['filterModel'];
}

const MAX_VALUE_LENGTH = 10;

/**
 * Entity Filter Select Component
 */
const EntityMultipleSelect: React.FC<EntityMultipleSelectProps> = ({
    required,
    disabled,
    multiple = true,
    error,
    helperText,
    filterModel,
    ...props
}) => {
    const { getIntlText } = useI18n();
    const [innerValue, setInnerValue] =
        useControllableValue<EntityMultipleSelectValueType[]>(props);
    const { list, remove, getKey, insert, replace, resetList } =
        useDynamicList<EntityMultipleSelectValueType>(innerValue || []);

    useLayoutEffect(() => {
        if (isEqual(innerValue, list)) return;
        resetList(innerValue || ['']);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [innerValue, resetList]);

    useEffect(() => {
        setInnerValue?.(list || ['']);
    }, [list, setInnerValue]);

    return (
        <div className="ms-entity-filter-select">
            {list.map((item, index) => (
                <div className="ms-entity-filter-select-item" key={getKey(index) || index}>
                    <EntitySelect
                        label=""
                        size="small"
                        placeholder={getIntlText('common.label.entity')}
                        required={required}
                        disabled={disabled}
                        filterModel={filterModel}
                        value={item}
                        onChange={value => {
                            replace(index, value);
                        }}
                    />
                    {list.length > 1 && (
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
                        insert(list.length, '');
                    }}
                >
                    {getIntlText('common.label.add')}
                </Button>
            )}
        </div>
    );
};

export default memo(EntityMultipleSelect);
