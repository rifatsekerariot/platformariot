import React, { useState, useMemo, useCallback } from 'react';
import { useRequest, useMemoizedFn } from 'ahooks';
import { Box, Button, Stack, IconButton, Chip, Alert } from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';
import { AddIcon, DeleteOutlineIcon, EditIcon, toast } from '@milesight/shared/src/components';
import { objectToCamelCase } from '@milesight/shared/src/utils/tools';
import { TablePro, Tooltip } from '@/components';
import { deviceAPI, awaitWrap, getResponseData, isRequestSuccess } from '@/services/http';
import {
    OperateAlarmRuleModal,
    CONDITION_OPS,
    type AlarmRuleRow,
    type AlarmRuleFormValues,
} from './OperateAlarmRuleModal';

import './style.less';

const ALARM_RULE_IGNORE_ERROR_CODES = [
    'ERR_BAD_REQUEST',
    'ERR_BAD_RESPONSE',
    'ERR_NETWORK',
    'ECONNABORTED',
    'server_error',
];

function apiItemToRow(item: Record<string, unknown>): AlarmRuleRow {
    const c = objectToCamelCase(item) as Record<string, unknown>;
    return {
        id: String(c.id ?? ''),
        name: String(c.name ?? ''),
        deviceIds: (Array.isArray(c.deviceIds) ? c.deviceIds : []) as ApiKey[],
        deviceNames: (Array.isArray(c.deviceNames) ? c.deviceNames : []).map(String),
        entityKey: String(c.entityKey ?? ''),
        conditionOp: String(c.conditionOp ?? 'gte') as AlarmRuleRow['conditionOp'],
        conditionValue: String(c.conditionValue ?? ''),
        actionRaiseAlarm: !!c.actionRaiseAlarm,
        actionNotifyEmail: !!c.actionNotifyEmail,
        actionNotifyWebhook: !!c.actionNotifyWebhook,
        enabled: !!c.enabled,
    };
}

const AlarmRules: React.FC = () => {
    const { getIntlText } = useI18n();
    const [rules, setRules] = useState<AlarmRuleRow[]>([]);
    const [listError, setListError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [operateType, setOperateType] = useState<'add' | 'edit'>('add');
    const [editingRule, setEditingRule] = useState<AlarmRuleRow | null>(null);
    const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [submitLoading, setSubmitLoading] = useState(false);

    const [listLoading, setListLoading] = useState(false);

    const fetchRules = useMemoizedFn(async () => {
        setListError(null);
        setListLoading(true);
        try {
            const [err, resp] = await awaitWrap(
                deviceAPI.getAlarmRules(
                    { page_number: 1, page_size: 500 },
                    { $ignoreError: ALARM_RULE_IGNORE_ERROR_CODES },
                ),
            );
            const code = (err?.response?.data as ApiResponse)?.error_code ?? (resp?.data as ApiResponse)?.error_code;
            if (code === 'authentication_failed') return;
            const d = getResponseData(resp);
            if (err || !isRequestSuccess(resp) || !d) {
                setListError(getIntlText('alarm.message.load_failed') ?? 'Unable to load alarm rules.');
                setRules([]);
                return;
            }
            const raw = (objectToCamelCase(d) as { content?: Record<string, unknown>[] })?.content ?? [];
            setRules(raw.map((x: Record<string, unknown>) => apiItemToRow(x)));
        } finally {
            setListLoading(false);
        }
    });

    useRequest(fetchRules, { manual: false });

    const openAdd = useMemoizedFn(() => {
        setOperateType('add');
        setEditingRule(null);
        setModalVisible(true);
    });

    const openEdit = useMemoizedFn((row: AlarmRuleRow) => {
        setOperateType('edit');
        setEditingRule(row);
        setModalVisible(true);
    });

    const hideModal = useMemoizedFn(() => {
        setModalVisible(false);
        setEditingRule(null);
    });

    const handleFormOk = useMemoizedFn(async (values: AlarmRuleFormValues) => {
        setSubmitLoading(true);
        try {
            const payload = {
                name: values.name.trim(),
                device_ids: values.devices.map(d => d.id),
                entity_key: values.entityKey.trim(),
                condition_op: values.conditionOp,
                condition_value: values.conditionValue?.trim() ?? '',
                action_raise_alarm: !!values.actionRaiseAlarm,
                action_notify_email: !!values.actionNotifyEmail,
                action_notify_webhook: !!values.actionNotifyWebhook,
                enabled: !!values.enabled,
            };
            if (operateType === 'add') {
                const [err, resp] = await awaitWrap(
                    deviceAPI.createAlarmRule(payload, { $ignoreError: ALARM_RULE_IGNORE_ERROR_CODES }),
                );
                const code = (err?.response?.data as ApiResponse)?.error_code ?? (resp?.data as ApiResponse)?.error_code;
                if (code === 'authentication_failed') return;
                if (err || !isRequestSuccess(resp)) {
                    toast.error(getIntlText('alarm.message.rule_save_failed') ?? 'Failed to save rule.');
                    return;
                }
            } else if (editingRule) {
                const [err, resp] = await awaitWrap(
                    deviceAPI.updateAlarmRule(
                        { id: editingRule.id, ...payload },
                        { $ignoreError: ALARM_RULE_IGNORE_ERROR_CODES },
                    ),
                );
                const code = (err?.response?.data as ApiResponse)?.error_code ?? (resp?.data as ApiResponse)?.error_code;
                if (code === 'authentication_failed') return;
                if (err || !isRequestSuccess(resp)) {
                    toast.error(getIntlText('alarm.message.rule_save_failed') ?? 'Failed to save rule.');
                    return;
                }
            }
            hideModal();
            await fetchRules();
        } finally {
            setSubmitLoading(false);
        }
    });

    const handleDelete = useMemoizedFn(async (rows: AlarmRuleRow[]) => {
        const ids = rows
            .map(r => (typeof r.id === 'number' ? r.id : Number(r.id)))
            .filter(n => !Number.isNaN(n));
        if (!ids.length) return;
        const [err, resp] = await awaitWrap(
            deviceAPI.batchDeleteAlarmRules(
                { ids },
                { $ignoreError: ALARM_RULE_IGNORE_ERROR_CODES },
            ),
        );
        const code = (err?.response?.data as ApiResponse)?.error_code ?? (resp?.data as ApiResponse)?.error_code;
        if (code === 'authentication_failed') return;
        if (err || !isRequestSuccess(resp)) {
            toast.error(getIntlText('alarm.message.rule_delete_failed') ?? 'Failed to delete rules.');
            return;
        }
        setSelectedIds([]);
        await fetchRules();
    });

    const opLabel = useCallback(
        (op: string) => {
            const found = CONDITION_OPS.find(o => o.value === op);
            return found ? getIntlText(found.labelKey) : op;
        },
        [getIntlText],
    );

    const columns = useMemo(
        () => [
            {
                field: 'name',
                headerName: getIntlText('alarm.rule_name'),
                flex: 1,
                minWidth: 140,
            },
            {
                field: 'deviceNames',
                headerName: getIntlText('alarm.rule_devices'),
                flex: 1,
                minWidth: 120,
                renderCell: ({ value }: { value?: string[] }) =>
                    (value && value.length)
                        ? (value.length > 2 ? `${value.slice(0, 2).join(', ')} +${value.length - 2}` : value.join(', '))
                        : '-',
            },
            {
                field: 'entityKey',
                headerName: getIntlText('alarm.rule_entity_key'),
                width: 120,
            },
            {
                field: 'condition',
                headerName: getIntlText('alarm.rule_condition'),
                flex: 1,
                minWidth: 140,
                renderCell: ({ row }: { row: AlarmRuleRow }) =>
                    row.conditionOp === 'is_not_empty'
                        ? opLabel(row.conditionOp)
                        : `${opLabel(row.conditionOp)} ${row.conditionValue || ''}`,
            },
            {
                field: 'actions',
                headerName: getIntlText('alarm.rule_action'),
                width: 180,
                renderCell: ({ row }: { row: AlarmRuleRow }) => (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {row.actionRaiseAlarm && (
                            <Chip size="small" label={getIntlText('alarm.rule_action_raise_alarm')} sx={{ height: 22 }} />
                        )}
                        {row.actionNotifyEmail && (
                            <Chip size="small" variant="outlined" label={getIntlText('alarm.rule_action_email')} sx={{ height: 22 }} />
                        )}
                        {row.actionNotifyWebhook && (
                            <Chip size="small" variant="outlined" label={getIntlText('alarm.rule_action_webhook')} sx={{ height: 22 }} />
                        )}
                        {!row.actionRaiseAlarm && !row.actionNotifyEmail && !row.actionNotifyWebhook && '-'}
                    </Stack>
                ),
            },
            {
                field: 'enabled',
                headerName: getIntlText('alarm.rule_enabled'),
                width: 90,
                renderCell: ({ row }: { row: AlarmRuleRow }) => (
                    <Chip
                        size="small"
                        label={row.enabled ? getIntlText('common.label.on') || 'On' : getIntlText('common.label.off') || 'Off'}
                        color={row.enabled ? 'success' : 'default'}
                        variant={row.enabled ? 'filled' : 'outlined'}
                    />
                ),
            },
            {
                field: '$operation',
                headerName: getIntlText('common.label.operation'),
                width: 100,
                fixed: 'right' as const,
                renderCell: ({ row }: { row: AlarmRuleRow }) => (
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip title={getIntlText('common.button.edit')}>
                            <IconButton size="small" onClick={() => openEdit(row)}>
                                <EditIcon sx={{ width: 18, height: 18 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={getIntlText('alarm.rule_delete')}>
                            <IconButton size="small" onClick={() => handleDelete([row])} color="inherit">
                                <DeleteOutlineIcon sx={{ width: 18, height: 18 }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                ),
            },
        ],
        [getIntlText, opLabel, openEdit, handleDelete],
    );

    const toolbarRender = useMemo(
        () => (
            <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                    variant="contained"
                    size="medium"
                    startIcon={<AddIcon />}
                    onClick={openAdd}
                    sx={{ textTransform: 'none' }}
                >
                    {getIntlText('alarm.rule_add')}
                </Button>
                <Button
                    variant="outlined"
                    size="medium"
                    startIcon={<DeleteOutlineIcon />}
                    disabled={!selectedIds.length}
                    onClick={() => handleDelete(rules.filter(r => selectedIds.includes(r.id)))}
                    sx={{ textTransform: 'none' }}
                >
                    {getIntlText('common.label.delete')}
                </Button>
            </Stack>
        ),
        [getIntlText, openAdd, selectedIds, rules, handleDelete],
    );

    return (
        <Box className="alarm-rules" sx={{ p: 0 }}>
            {listError && (
                <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setListError(null)}>
                    {listError}
                </Alert>
            )}
            <TablePro<AlarmRuleRow>
                loading={listLoading}
                checkboxSelection
                paginationMode="client"
                rows={rules}
                rowCount={rules.length}
                getRowId={row => row.id}
                columns={columns}
                toolbarRender={toolbarRender}
                rowSelectionModel={selectedIds}
                onRowSelectionModelChange={v => setSelectedIds((v as string[]) || [])}
                pageSizeOptions={[10, 20, 50]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
            />
            <OperateAlarmRuleModal
                visible={modalVisible}
                operateType={operateType}
                data={editingRule}
                onCancel={hideModal}
                onOk={handleFormOk}
                loading={submitLoading}
            />
        </Box>
    );
};

export default AlarmRules;
