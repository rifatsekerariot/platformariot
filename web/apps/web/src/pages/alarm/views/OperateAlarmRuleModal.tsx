import React, { useEffect, useMemo } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { useMemoizedFn } from 'ahooks';
import classNames from 'classnames';
import {
    Stack,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Switch,
    Autocomplete,
} from '@mui/material';

import { useI18n } from '@milesight/shared/src/hooks';
import { Modal } from '@milesight/shared/src/components';
import { checkRequired } from '@milesight/shared/src/utils/validators';
import { useRequest } from 'ahooks';
import { deviceAPI, awaitWrap, getResponseData, isRequestSuccess } from '@/services/http';
import { objectToCamelCase } from '@milesight/shared/src/utils/tools';

export type OperateAlarmRuleModalType = 'add' | 'edit';

export const CONDITION_OPS = [
    { value: 'gt', labelKey: 'alarm.rule_op_gt' },
    { value: 'lt', labelKey: 'alarm.rule_op_lt' },
    { value: 'gte', labelKey: 'alarm.rule_op_gte' },
    { value: 'lte', labelKey: 'alarm.rule_op_lte' },
    { value: 'eq', labelKey: 'alarm.rule_op_eq' },
    { value: 'neq', labelKey: 'alarm.rule_op_neq' },
    { value: 'between', labelKey: 'alarm.rule_op_between' },
    { value: 'is_not_empty', labelKey: 'alarm.rule_op_is_not_empty' },
] as const;

export type ConditionOp = (typeof CONDITION_OPS)[number]['value'];

export interface AlarmRuleFormValues {
    name: string;
    devices: { id: ApiKey; name: string }[];
    entityKey: string;
    conditionOp: ConditionOp;
    conditionValue: string;
    actionRaiseAlarm: boolean;
    actionNotifyEmail: boolean;
    actionNotifyWebhook: boolean;
    enabled: boolean;
}

export interface AlarmRuleRow {
    id: string;
    name: string;
    deviceIds: ApiKey[];
    deviceNames: string[];
    entityKey: string;
    conditionOp: ConditionOp;
    conditionValue: string;
    actionRaiseAlarm: boolean;
    actionNotifyEmail: boolean;
    actionNotifyWebhook: boolean;
    enabled: boolean;
}

export const formToRow = (
    form: AlarmRuleFormValues,
    existingId?: string,
): Omit<AlarmRuleRow, 'id'> & { id?: string } => ({
    id: existingId,
    name: form.name.trim(),
    deviceIds: form.devices.map(d => d.id),
    deviceNames: form.devices.map(d => d.name || String(d.id)),
    entityKey: form.entityKey.trim(),
    conditionOp: form.conditionOp,
    conditionValue: form.conditionValue.trim(),
    actionRaiseAlarm: form.actionRaiseAlarm,
    actionNotifyEmail: form.actionNotifyEmail,
    actionNotifyWebhook: form.actionNotifyWebhook,
    enabled: form.enabled,
});

export const rowToForm = (row: AlarmRuleRow): AlarmRuleFormValues => ({
    name: row.name,
    devices: row.deviceIds.map((id, i) => ({ id, name: row.deviceNames[i] || String(id) })),
    entityKey: row.entityKey,
    conditionOp: row.conditionOp,
    conditionValue: row.conditionValue,
    actionRaiseAlarm: row.actionRaiseAlarm,
    actionNotifyEmail: row.actionNotifyEmail,
    actionNotifyWebhook: row.actionNotifyWebhook,
    enabled: row.enabled,
});

interface OperateAlarmRuleModalProps {
    visible: boolean;
    operateType: OperateAlarmRuleModalType;
    data?: AlarmRuleRow | null;
    onCancel: () => void;
    onOk: (values: AlarmRuleFormValues) => void;
}

const OperateAlarmRuleModal: React.FC<OperateAlarmRuleModalProps> = ({
    visible,
    operateType,
    data,
    onCancel,
    onOk,
}) => {
    const { getIntlText } = useI18n();

    const { control, formState, handleSubmit, reset, watch } = useForm<AlarmRuleFormValues>({
        defaultValues: {
            name: '',
            devices: [],
            entityKey: '',
            conditionOp: 'gte',
            conditionValue: '',
            actionRaiseAlarm: true,
            actionNotifyEmail: false,
            actionNotifyWebhook: false,
            enabled: true,
        },
    });

    const conditionOp = watch('conditionOp');
    const devices = watch('devices');
    const isNotEmpty = conditionOp === 'is_not_empty';

    const { data: deviceListResp, run: loadDevices } = useRequest(
        async () => {
            const [err, resp] = await awaitWrap(
                deviceAPI.getList({ page_number: 1, page_size: 500 }),
            );
            if (err || !isRequestSuccess(resp)) return [];
            const d = getResponseData(resp);
            if (d == null || typeof d !== 'object') return [];
            const converted = objectToCamelCase(d) as { content?: { id: ApiKey; name: string }[] };
            return converted?.content ?? [];
        },
        { manual: true },
    );

    const deviceList = useMemo(() => deviceListResp || [], [deviceListResp]);

    useEffect(() => {
        if (visible) loadDevices();
    }, [visible, loadDevices]);

    useEffect(() => {
        if (operateType === 'edit' && data) {
            reset(rowToForm(data));
        } else if (operateType === 'add') {
            reset({
                name: '',
                devices: [],
                entityKey: '',
                conditionOp: 'gte',
                conditionValue: '',
                actionRaiseAlarm: true,
                actionNotifyEmail: false,
                actionNotifyWebhook: false,
                enabled: true,
            });
        }
    }, [operateType, data, reset]);

    const deviceOptions = useMemo(() => {
        const fromApi = (deviceList || []).map(d => ({ id: d.id, name: d.name || String(d.id) }));
        const fromSel = (devices || []).filter(
            s => !fromApi.some(x => String(x.id) === String(s.id)),
        );
        return [...fromApi, ...fromSel];
    }, [deviceList, devices]);

    const validateDevicesRequired = useMemoizedFn((v: { id: ApiKey; name: string }[] | undefined) =>
        v?.length ? true : (getIntlText('common.placeholder.select') || 'Required'),
    );

    const onSubmit: SubmitHandler<AlarmRuleFormValues> = useMemoizedFn(values => {
        onOk(values);
    });

    const handleCancel = useMemoizedFn(() => {
        reset();
        onCancel();
    });

    return (
        <Modal
            size="lg"
            visible={visible}
            title={operateType === 'add' ? getIntlText('alarm.rule_add') : getIntlText('alarm.rule_edit')}
            className={classNames({ loading: formState.isSubmitting })}
            onOk={handleSubmit(onSubmit)}
            onOkText={getIntlText('common.button.save')}
            onCancel={handleCancel}
        >
            <Stack spacing={2.5} sx={{ pt: 0.5 }}>
                <Controller
                    name="name"
                    control={control}
                    rules={{ validate: { checkRequired: checkRequired() } }}
                    render={({ field, fieldState }) => (
                        <TextField
                            {...field}
                            required
                            fullWidth
                            size="small"
                            label={getIntlText('alarm.rule_name')}
                            placeholder={getIntlText('common.placeholder.input')}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                        />
                    )}
                />

                <Controller
                    name="devices"
                    control={control}
                    rules={{ validate: { checkRequired: validateDevicesRequired } }}
                    render={({ field, fieldState }) => (
                        <Autocomplete
                            multiple
                            size="small"
                            options={deviceOptions}
                            value={field.value || []}
                            onChange={(_, v) => field.onChange(v || [])}
                            getOptionLabel={o => o?.name ?? String(o?.id ?? '')}
                            isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                            renderInput={params => (
                                <TextField
                                    {...params}
                                    required
                                    label={getIntlText('alarm.rule_devices')}
                                    placeholder={getIntlText('common.placeholder.select')}
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                />
                            )}
                        />
                    )}
                />

                <Controller
                    name="entityKey"
                    control={control}
                    rules={{ validate: { checkRequired: checkRequired() } }}
                    render={({ field, fieldState }) => (
                        <TextField
                            {...field}
                            required
                            fullWidth
                            size="small"
                            label={getIntlText('alarm.rule_entity_key')}
                            placeholder={getIntlText('alarm.rule_entity_key_placeholder')}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                        />
                    )}
                />

                <Stack direction="row" spacing={2}>
                    <Controller
                        name="conditionOp"
                        control={control}
                        render={({ field }) => (
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>{getIntlText('alarm.rule_condition_op')}</InputLabel>
                                <Select
                                    {...field}
                                    label={getIntlText('alarm.rule_condition_op')}>
                                    {CONDITION_OPS.map(o => (
                                        <MenuItem key={o.value} value={o.value}>
                                            {getIntlText(o.labelKey)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    />
                    {!isNotEmpty && (
                        <Controller
                            name="conditionValue"
                            control={control}
                            rules={{
                                validate: v =>
                                    isNotEmpty || (v && String(v).trim())
                                        ? true
                                        : (getIntlText('valid.required') || 'Required'),
                            }}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    fullWidth
                                    size="small"
                                    label={getIntlText('alarm.rule_condition_value')}
                                    placeholder={
                                        conditionOp === 'between'
                                            ? getIntlText('alarm.rule_condition_value_between')
                                            : getIntlText('common.placeholder.input')
                                    }
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                />
                            )}
                        />
                    )}
                </Stack>

                <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
                    <Controller
                        name="actionRaiseAlarm"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!!field.value}
                                        onChange={e => field.onChange(e.target.checked)}
                                    />
                                }
                                label={getIntlText('alarm.rule_action_raise_alarm')}
                            />
                        )}
                    />
                    <Controller
                        name="actionNotifyEmail"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!!field.value}
                                        onChange={e => field.onChange(e.target.checked)}
                                    />
                                }
                                label={getIntlText('alarm.rule_action_email')}
                            />
                        )}
                    />
                    <Controller
                        name="actionNotifyWebhook"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!!field.value}
                                        onChange={e => field.onChange(e.target.checked)}
                                    />
                                }
                                label={getIntlText('alarm.rule_action_webhook')}
                            />
                        )}
                    />
                </Stack>

                <Controller
                    name="enabled"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!field.value}
                                    onChange={e => field.onChange(e.target.checked)}
                                />
                            }
                            label={getIntlText('alarm.rule_enabled')}
                        />
                    )}
                />
            </Stack>
        </Modal>
    );
};

export { OperateAlarmRuleModal };
export default OperateAlarmRuleModal;
