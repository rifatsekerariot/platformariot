import React, { useState, useMemo, useCallback } from 'react';
import { useMemoizedFn } from 'ahooks';
import { Box, Button, Stack, IconButton, Chip, Typography } from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';
import { AddIcon, DeleteOutlineIcon, EditIcon } from '@milesight/shared/src/components';
import { TablePro, Tooltip } from '@/components';
import {
    OperateAlarmRuleModal,
    CONDITION_OPS,
    formToRow,
    type AlarmRuleRow,
    type AlarmRuleFormValues,
} from './OperateAlarmRuleModal';

import './style.less';

const genId = () => `rule_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const AlarmRules: React.FC = () => {
    const { getIntlText } = useI18n();
    const [rules, setRules] = useState<AlarmRuleRow[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [operateType, setOperateType] = useState<'add' | 'edit'>('add');
    const [editingRule, setEditingRule] = useState<AlarmRuleRow | null>(null);
    const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

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

    const handleFormOk = useMemoizedFn((values: AlarmRuleFormValues) => {
        if (operateType === 'add') {
            const r = formToRow(values) as AlarmRuleRow;
            r.id = genId();
            setRules(prev => [...prev, r]);
        } else if (editingRule) {
            const r = formToRow(values, editingRule.id) as AlarmRuleRow;
            r.id = editingRule.id;
            setRules(prev => prev.map(x => (x.id === editingRule.id ? r : x)));
        }
        hideModal();
    });

    const handleDelete = useMemoizedFn((rows: AlarmRuleRow[]) => {
        const ids = new Set(rows.map(r => r.id));
        setRules(prev => prev.filter(x => !ids.has(x.id)));
        setSelectedIds([]);
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
                    onClick={() =>
                        handleDelete(rules.filter(r => selectedIds.includes(r.id)))
                    }
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
            <Tooltip title={getIntlText('alarm.rule_tip_no_backend')} placement="bottom-start">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {getIntlText('alarm.rule_tip_no_backend')}
                </Typography>
            </Tooltip>
            <TablePro<AlarmRuleRow>
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
            />
        </Box>
    );
};

export default AlarmRules;
