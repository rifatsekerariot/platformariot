import React, { useState, useMemo, useCallback } from 'react';
import { useRequest, useMemoizedFn } from 'ahooks';
import { Box, Stack, Select, MenuItem, FormControl, InputLabel, IconButton } from '@mui/material';
import { useI18n, useTime } from '@milesight/shared/src/hooks';
import {
    SaveAltIcon,
    CheckCircleOutlineIcon,
    NearMeOutlinedIcon,
    LoadingWrapper,
} from '@milesight/shared/src/components';
import { objectToCamelCase, linkDownload, genRandomString } from '@milesight/shared/src/utils/tools';
import { HoverSearchInput, TablePro, Tooltip } from '@/components';
import { toSixDecimals, openGoogleMap } from '@/components/drawing-board/plugin/utils';
import { deviceAPI, awaitWrap, getResponseData, isRequestSuccess } from '@/services/http';

import './style.less';

type AlarmStatusFilter = 'all' | 'unclaimed' | 'claimed';

const TIME_OPTIONS = [
    { labelKey: 'dashboard.label_nearly_one_days', value: 1440 * 60 * 1000 },
    { labelKey: 'dashboard.label_nearly_three_days', value: 1440 * 60 * 1000 * 3 },
    { labelKey: 'dashboard.label_nearly_one_week', value: 1440 * 60 * 1000 * 7 },
    { labelKey: 'dashboard.label_nearly_one_month', value: 1440 * 60 * 1000 * 30 },
    { labelKey: 'dashboard.label_nearly_three_month', value: 1440 * 60 * 1000 * 90 },
];

const getAlarmTimeRange = (selectTime: number): [number, number] => {
    return [Date.now() - selectTime, Date.now()];
};

const AlarmList: React.FC = () => {
    const { getIntlText } = useI18n();
    const { getTimeFormat, dayjs, timezone } = useTime();
    const [keyword, setKeyword] = useState('');
    const [selectTime, setSelectTime] = useState(TIME_OPTIONS[0].value);
    const [statusFilter, setStatusFilter] = useState<AlarmStatusFilter>('all');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [exportLoading, setExportLoading] = useState(false);
    const [claimLoading, setClaimLoading] = useState<Record<string, boolean>>({});

    const alarmStatusApi = useMemo((): boolean[] | undefined => {
        if (statusFilter === 'all') return undefined;
        if (statusFilter === 'unclaimed') return [true];
        return [false];
    }, [statusFilter]);

    const { loading, data, run: refreshList } = useRequest(
        async () => {
            const [start, end] = getAlarmTimeRange(selectTime);
            const [error, resp] = await awaitWrap(
                deviceAPI.getDeviceAlarms({
                    keyword: keyword || undefined,
                    device_ids: [],
                    start_timestamp: start,
                    end_timestamp: end,
                    alarm_status: alarmStatusApi,
                    page_number: paginationModel.page + 1,
                    page_size: paginationModel.pageSize,
                }),
            );
            const d = getResponseData(resp);
            if (error || !isRequestSuccess(resp) || !d) return;
            return objectToCamelCase(d);
        },
        { debounceWait: 300, refreshDeps: [keyword, selectTime, alarmStatusApi, paginationModel] },
    );

    const handleExport = useMemoizedFn(async () => {
        try {
            setExportLoading(true);
            const [start, end] = getAlarmTimeRange(selectTime);
            const [err, resp] = await awaitWrap(
                deviceAPI.exportDeviceAlarms({
                    start_timestamp: start,
                    end_timestamp: end,
                    device_ids: [],
                    alarm_status: alarmStatusApi,
                    keyword: keyword || undefined,
                    timezone,
                }),
            );
            if (err || !isRequestSuccess(resp)) return;
            const blob = getResponseData(resp);
            const fileName = `AlarmData_${dayjs().format('YYYY_MM_DD')}_${genRandomString(6, { upperCase: false, lowerCase: true })}.csv`;
            linkDownload(blob!, fileName);
        } finally {
            setExportLoading(false);
        }
    });

    const claimAlarm = useMemoizedFn(async (deviceId: ApiKey) => {
        try {
            setClaimLoading(prev => ({ ...prev, [String(deviceId)]: true }));
            const [err, resp] = await awaitWrap(deviceAPI.claimDeviceAlarm({ device_id: deviceId }));
            if (!err && isRequestSuccess(resp)) refreshList();
        } finally {
            setClaimLoading(prev => ({ ...prev, [String(deviceId)]: false }));
        }
    });

    const handleSearch = useCallback((v: string) => {
        setKeyword(v);
        setPaginationModel(m => ({ ...m, page: 0 }));
    }, []);

    const columns = useMemo(
        () => [
            {
                field: 'alarmStatus',
                headerName: getIntlText('device.label.device_status'),
                flex: 1,
                minWidth: 120,
                renderCell: ({ value }: { value?: boolean }) => (
                    <span className={value ? 'alarm-list__chip--unclaimed' : 'alarm-list__chip--claimed'}>
                        {value ? getIntlText('common.label.unclaimed') : getIntlText('common.label.claimed')}
                    </span>
                ),
            },
            {
                field: 'alarmContent',
                headerName: getIntlText('common.label.content'),
                flex: 3,
                minWidth: 240,
                renderCell: ({ row }: { row?: { deviceName?: string; alarmContent?: string } }) => (
                    <Tooltip autoEllipsis title={[row?.deviceName, row?.alarmContent].filter(Boolean).join(' — ') || '-'} />
                ),
            },
            {
                field: 'alarmTime',
                headerName: getIntlText('common.label.time'),
                flex: 1,
                minWidth: 138,
                renderCell: ({ value }: { value?: number }) => getTimeFormat(value, 'fullDateTimeMinuteFormat'),
            },
            {
                field: 'position',
                headerName: getIntlText('common.label.position'),
                flex: 1,
                minWidth: 178,
                renderCell: ({ row }: { row?: { latitude?: number; longitude?: number } }) =>
                    row?.latitude != null && row?.longitude != null
                        ? `${toSixDecimals(row.latitude)}, ${toSixDecimals(row.longitude)}`
                        : '-',
            },
            {
                field: '$operation',
                type: 'string',
                headerName: getIntlText('common.label.operation'),
                width: 100,
                fixed: 'right',
                renderCell: ({ row }: { row?: { id?: ApiKey; deviceId?: ApiKey; alarmStatus?: boolean; latitude?: number; longitude?: number } }) => (
                    <Stack direction="row" spacing={0.5}>
                        <LoadingWrapper size={20} loading={!!(row && claimLoading[String(row.deviceId)])}>
                            <Tooltip title={!row?.alarmStatus ? null : getIntlText('common.tip.click_to_claim')}>
                                <IconButton
                                    size="small"
                                    disabled={!row?.alarmStatus}
                                    onClick={() => row && claimAlarm(row.deviceId!)}
                                >
                                    <CheckCircleOutlineIcon sx={{ width: 18, height: 18 }} />
                                </IconButton>
                            </Tooltip>
                        </LoadingWrapper>
                        <Tooltip title={row?.latitude != null && row?.longitude != null ? getIntlText('dashboard.tip.navigate_here') : ''}>
                            <IconButton
                                size="small"
                                disabled={row?.latitude == null || row?.longitude == null}
                                onClick={() => row && openGoogleMap(row.latitude!, row.longitude!)}
                            >
                                <NearMeOutlinedIcon sx={{ width: 18, height: 18 }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                ),
            },
        ],
        [getIntlText, getTimeFormat, claimLoading, claimAlarm],
    );

    return (
        <Box className="alarm-list">
            <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" alignItems="center">
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>{getIntlText('common.label.time')}</InputLabel>
                    <Select
                        value={selectTime}
                        label={getIntlText('common.label.time')}
                        onChange={e => {
                            setSelectTime(Number(e.target.value));
                            setPaginationModel(m => ({ ...m, page: 0 }));
                        }}
                    >
                        {TIME_OPTIONS.map(o => (
                            <MenuItem key={o.value} value={o.value}>
                                {getIntlText(o.labelKey)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>{getIntlText('device.label.device_status')}</InputLabel>
                    <Select
                        value={statusFilter}
                        label={getIntlText('device.label.device_status')}
                        onChange={e => {
                            setStatusFilter(e.target.value as AlarmStatusFilter);
                            setPaginationModel(m => ({ ...m, page: 0 }));
                        }}
                    >
                        <MenuItem value="all">{getIntlText('common.label.all')}</MenuItem>
                        <MenuItem value="unclaimed">{getIntlText('common.label.unclaimed')}</MenuItem>
                        <MenuItem value="claimed">{getIntlText('common.label.claimed')}</MenuItem>
                    </Select>
                </FormControl>
                <HoverSearchInput
                    inputWidth={160}
                    keyword={keyword}
                    changeKeyword={handleSearch}
                    placeholder={getIntlText('dashboard.placeholder.search_alarm')}
                />
                <LoadingWrapper size={20} loading={exportLoading}>
                    <IconButton onClick={handleExport} title={getIntlText('common.button.download')}>
                        <SaveAltIcon sx={{ width: 20, height: 20 }} />
                    </IconButton>
                </LoadingWrapper>
            </Stack>
            <TablePro
                loading={loading}
                columns={columns}
                getRowId={row => row.id}
                rows={data?.content ?? []}
                rowCount={data?.total ?? 0}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 20, 50]}
            />
        </Box>
    );
};

export default AlarmList;
