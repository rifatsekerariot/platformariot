import { useLayoutEffect, useState, useRef, useCallback, useMemo } from 'react';
import cls from 'classnames';
import { isEmpty, isNil } from 'lodash-es';
import { useControllableValue, useSize } from 'ahooks';
import {
    TextField,
    IconButton,
    Chip,
    Popover,
    Divider,
    Menu,
    MenuItem,
    type TextFieldProps,
    type PopoverProps,
} from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';
import { SettingsOutlinedIcon, KeyboardArrowDownIcon } from '@milesight/shared/src/components';
import { Tooltip } from '@/components';
import { type FlattenNodeParamType } from '@/pages/workflow/views/editor/typings';
import useWorkflow from '@/pages/workflow/views/editor/hooks/useWorkflow';
import { isRefParamKey } from '@/pages/workflow/views/editor/helper';
import UpstreamNodeList, { type UpstreamNodeListProps } from '../upstream-node-list';
import './style.less';

type ParamInputSelectValueType = string | boolean | undefined;

export interface ParamInputSelectProps {
    label?: string;

    required?: boolean;

    /**
     * The size of the input
     */
    size?: TextFieldProps['size'];

    /**
     * Param Select Placeholder
     */
    placeholder?: string;

    filter?: UpstreamNodeListProps['filter'];

    value?: ParamInputSelectValueType;

    valueType?: EntityValueDataType;

    enums?: Record<string, any>;

    defaultValue?: ParamInputSelectValueType;

    onChange?: (value: ParamInputSelectValueType) => void;
}

/**
 * Param Input Select Component
 *
 * Note: This is a basic component., use in CodeNode, ServiceNode, EntityAssignmentNode
 */
const ParamInputSelect: React.FC<ParamInputSelectProps> = ({
    label,
    required = true,
    size = 'medium',
    placeholder,
    filter,
    valueType,
    enums,
    ...props
}) => {
    const { getIntlText } = useI18n();

    // ---------- Render Upstream Param Options ----------
    const { getUpstreamNodeParams } = useWorkflow();
    const [, options] = getUpstreamNodeParams();
    const containerRef = useRef<HTMLDivElement>(null);
    const { width: containerWidth } = useSize(containerRef) || {};
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const commonPopoverProps = useMemo<
        Pick<PopoverProps, 'anchorOrigin' | 'transformOrigin' | 'sx'>
    >(
        () => ({
            anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'right',
            },
            transformOrigin: {
                vertical: 'top',
                horizontal: 'right',
            },
            sx: {
                '& .MuiList-root': {
                    width: containerWidth,
                    minWidth: 300,
                    maxHeight: 420,
                },
            },
        }),
        [containerWidth],
    );

    // ---------- Render Enum Options ----------
    const isEnumValue = enums && !isEmpty(enums);
    const endAdornment = useMemo(() => {
        const result = [
            <IconButton
                onClick={e => {
                    e.stopPropagation();
                    setAnchorEl(containerRef.current);
                }}
            >
                <SettingsOutlinedIcon />
            </IconButton>,
        ];

        if (isEnumValue) {
            result.unshift(
                <KeyboardArrowDownIcon sx={{ color: 'text.tertiary' }} />,
                <Divider
                    variant="middle"
                    orientation="vertical"
                    sx={{ height: 16, m: 0, ml: 0.5 }}
                />,
            );
        }

        return result;
    }, [isEnumValue]);
    const [enumsAnchorEl, setEnumsAnchorEl] = useState<HTMLElement | null>(null);

    // ---------- Data Interaction ----------
    const [data, setData] = useControllableValue<ParamInputSelectValueType>(props);
    const [inputValue, setInputValue] = useState<string>('');
    const [selectValue, setSelectValue] = useState<FlattenNodeParamType>();
    const [focused, setFocused] = useState(false);
    const handleInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
        e => {
            const { value } = e.target;

            // input value
            if (!isRefParamKey(value)) {
                setData(value);
                setInputValue(value);
                return;
            }

            // Reference to an entity
            setInputValue('');
            const option = options?.find(item => item.valueKey === value);

            if (!option) return;
            setData(value);
            setSelectValue(option);
        },
        [options, setData],
    );

    const handleEnumChange = useCallback(
        (key: ApiKey, label: string) => {
            setFocused(false);
            setEnumsAnchorEl(null);
            setInputValue(label);

            if (valueType === 'BOOLEAN') {
                setData(key === 'true');
            } else {
                setData(`${key}`);
            }
        },
        [valueType, setData],
    );

    useLayoutEffect(() => {
        // Direct input value
        if (!isRefParamKey(`${data}`)) {
            if (isEnumValue) {
                setInputValue(enums?.[`${data}`] || '');
            } else {
                setInputValue(!isNil(data) ? `${data}` : '');
            }
            setSelectValue(undefined);
            return;
        }

        // Reference to an entity
        setInputValue('');
        const option = options?.find(item => item.valueKey === data);

        setSelectValue(val => {
            if (val && val.valueKey === data) {
                return val;
            }
            return option;
        });
    }, [data, options, enums, isEnumValue]);

    return (
        <div
            ref={containerRef}
            className={cls('ms-param-input-select', { 'size-small': size === 'small' })}
        >
            <TextField
                fullWidth
                color="primary"
                autoComplete="off"
                label={!isNil(label) ? '' : getIntlText('common.label.value')}
                required={required}
                placeholder={
                    selectValue
                        ? ''
                        : placeholder ||
                          getIntlText('workflow.editor.form_param_select_placeholder')
                }
                slotProps={{
                    input: {
                        size,
                        readOnly: !!selectValue || isEnumValue,
                        endAdornment,
                    },
                }}
                value={inputValue}
                onChange={handleInputChange}
                focused={focused || !!anchorEl || !!enumsAnchorEl}
                onClick={() => {
                    if (!isEnumValue) return;
                    setEnumsAnchorEl(containerRef.current);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
            {isEnumValue && (
                <Menu
                    className="ms-param-input-enums-menu"
                    open={!!enumsAnchorEl}
                    anchorEl={enumsAnchorEl}
                    onClose={() => {
                        setFocused(false);
                        setEnumsAnchorEl(null);
                    }}
                    {...commonPopoverProps}
                >
                    {Object.entries(enums!).map(([key, label]) => (
                        <MenuItem
                            key={key}
                            selected={key === `${data}`}
                            onClick={() => handleEnumChange(key, label)}
                        >
                            {label}
                        </MenuItem>
                    ))}
                </Menu>
            )}
            {!!selectValue && (
                <Chip
                    className="ms-param-input-select-chip"
                    label={
                        <Tooltip title={`${selectValue.valueName} / ${selectValue.valueTypeLabel}`}>
                            <span className="name">{selectValue.valueName}</span>
                        </Tooltip>
                    }
                    onDelete={() => setData(undefined)}
                />
            )}
            <Popover
                className="ms-param-input-select-menu"
                open={!!anchorEl}
                anchorEl={anchorEl}
                onClose={() => {
                    setFocused(false);
                    setAnchorEl(null);
                }}
                {...commonPopoverProps}
            >
                <UpstreamNodeList
                    filter={filter}
                    value={selectValue}
                    onChange={node => {
                        setFocused(false);
                        setAnchorEl(null);
                        setData(node.valueKey);
                    }}
                />
            </Popover>
        </div>
    );
};

export default ParamInputSelect;
