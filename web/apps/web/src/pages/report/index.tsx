import React, { useState, useCallback, useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { Box, Button, FormControl, Stack, TextField, Select, MenuItem, InputLabel, FormHelperText, type SelectChangeEvent } from '@mui/material';
import { useRequest } from 'ahooks';
import { useI18n, useTime } from '@milesight/shared/src/hooks';
import { objectToCamelCase } from '@milesight/shared/src/utils/tools';
import { linkDownload, genRandomString } from '@milesight/shared/src/utils/tools';
import { toast } from '@milesight/shared/src/components';
import { DateRangePickerValueType } from '@/components/date-range-picker';
import { DateRangePicker } from '@/components';
import { Breadcrumbs } from '@/components';
import { entityAPI, dashboardAPI, deviceAPI, awaitWrap, getResponseData, isRequestSuccess, type DashboardListProps } from '@/services/http';
import { ENTITY_TYPE } from '@/constants';
import { getDeviceIdsInuse } from '@/components/drawing-board/utils';
import type { WidgetDetail } from '@/services/http/dashboard';
import { buildTelemetryPdf, type PdfReportRow, type PdfReportDeviceSection } from './utils/pdfReport';

import './style.less';

type FormData = {
    dashboardId?: ApiKey;
    reportTitle?: string;
    companyName?: string;
    dateRange?: DateRangePickerValueType | null;
};

type DeviceEntityGroup = {
    deviceId: ApiKey;
    deviceName: string;
    entities: Array<{
        entityId: ApiKey;
        entityName: string;
        entityKey: string;
        unit?: string;
    }>;
};

export default function ReportPage() {
    const { getIntlText } = useI18n();
    const { dayjs, getTimeFormat, timezone } = useTime();
    const [generating, setGenerating] = useState(false);
    const [dashboardName, setDashboardName] = useState<string>('');

    const { control, handleSubmit, watch, getValues, setValue } = useForm<FormData>({ 
        defaultValues: {
            dashboardId: undefined,
            reportTitle: '',
            companyName: '',
            dateRange: null,
        },
        mode: 'onChange', // Validate on change
    });
    const dashboardId = watch('dashboardId');
    const dateRange = watch('dateRange');

    // Fetch dashboard list
    const {
        data: dashboardList,
        loading: loadingDashboards,
        run: fetchDashboards,
    } = useRequest(
        async () => {
            console.log('[ReportPage] [API] Starting fetchDashboards API call...');
            const [error, resp] = await awaitWrap(
                dashboardAPI.getDashboards({
                    name: '',
                }),
            );
            console.log('[ReportPage] [API] fetchDashboards response - error:', error, 'resp:', resp);
            
            const data = getResponseData(resp);
            console.log('[ReportPage] [API] fetchDashboards - extracted data:', data, 'isRequestSuccess:', isRequestSuccess(resp));
            
            if (error || !data || !isRequestSuccess(resp)) {
                console.error('[ReportPage] [API] fetchDashboards failed - error:', error, 'data:', data, 'resp:', resp);
                return;
            }
            // Use raw response (snake_case). objectToCamelCase breaks dashboard_id -> undefined.
            const list = (Array.isArray(data) ? data : (data as any)?.data ?? data) as DashboardListProps[];
            console.log('[ReportPage] [API] fetchDashboards success - count:', list?.length, 'dashboards:', list?.map(d => ({ id: d.dashboard_id, name: d.name })));
            return list;
        },
        { 
            manual: true,
        },
    );

    // Fetch dashboard list on mount
    useEffect(() => {
        console.log('[ReportPage] Component mounted, fetching dashboards...');
        fetchDashboards();
    }, [fetchDashboards]);
    
    // Debug: Log dashboard list when it changes
    useEffect(() => {
        if (dashboardList) {
            console.log('[ReportPage] Dashboard list updated:', dashboardList.length, 'dashboards:', dashboardList.map(d => ({ id: d.dashboard_id, name: d.name })));
        }
    }, [dashboardList]);

    // Fetch dashboard detail when dashboard is selected
    useEffect(() => {
        console.log('[ReportPage] dashboardId changed:', dashboardId, 'Type:', typeof dashboardId);
        if (dashboardId != null && dashboardId !== '' && dashboardId !== 'undefined') {
            // Compare as strings since we convert to string in Select
            const selected = dashboardList?.find(d => {
                const dId = d.dashboard_id;
                const match = String(dId) === String(dashboardId) || dId === dashboardId;
                if (match) {
                    console.log('[ReportPage] Found matching dashboard:', { dId, dashboardId, name: d.name });
                }
                return match;
            });
            const name = selected?.name ?? '';
            setDashboardName(name);
            console.log('[ReportPage] Dashboard name updated:', name);
        } else {
            setDashboardName('');
            console.log('[ReportPage] Dashboard ID is null/empty, clearing dashboard name');
        }
    }, [dashboardId, dashboardList]);

    const onGenerate: SubmitHandler<FormData> = useCallback(
        async (formData) => {
            console.log('[ReportPage] [FORM] ========== FORM SUBMIT STARTED ==========');
            console.log('[ReportPage] [FORM] formData:', JSON.stringify(formData, null, 2));
            
            // Get current form values to ensure we have the latest dashboardId
            const currentValues = getValues();
            console.log('[ReportPage] [FORM] currentValues (getValues):', JSON.stringify(currentValues, null, 2));
            console.log('[ReportPage] [FORM] watch dashboardId:', dashboardId, 'Type:', typeof dashboardId);
            
            // Try multiple sources: formData, currentValues, watch value
            const dbId = formData.dashboardId || currentValues.dashboardId || dashboardId;
            console.log('[ReportPage] [FORM] Dashboard ID resolution:');
            console.log('[ReportPage] [FORM]   - formData.dashboardId:', formData.dashboardId, 'Type:', typeof formData.dashboardId);
            console.log('[ReportPage] [FORM]   - currentValues.dashboardId:', currentValues.dashboardId, 'Type:', typeof currentValues.dashboardId);
            console.log('[ReportPage] [FORM]   - watch dashboardId:', dashboardId, 'Type:', typeof dashboardId);
            console.log('[ReportPage] [FORM]   - final dbId:', dbId, 'Type:', typeof dbId);
            
            // Validate dashboardId is not undefined, null, or empty string
            if (!dbId || dbId === '' || dbId === 'undefined' || dbId === 'null' || String(dbId).trim() === '') {
                console.error('[ReportPage] [FORM] ❌ Dashboard ID validation failed:', dbId);
                console.error('[ReportPage] [FORM] formData:', formData);
                console.error('[ReportPage] [FORM] currentValues:', currentValues);
                toast.error(getIntlText('report.message.select_dashboard'));
                return;
            }
            console.log('[ReportPage] [FORM] ✅ Dashboard ID validation passed:', dbId);
            
            const { reportTitle, companyName, dateRange: dr } = formData;
            console.log('[ReportPage] [FORM] Form fields - reportTitle:', reportTitle, 'companyName:', companyName, 'dateRange:', dr);
            
            const start = dr?.start?.valueOf();
            const end = dr?.end?.valueOf();
            console.log('[ReportPage] [FORM] Date range - start:', start, 'end:', end);
            if (start == null || end == null) {
                console.error('[ReportPage] [FORM] ❌ Date range validation failed');
                toast.error(getIntlText('report.message.select_date_range'));
                return;
            }
            if (end <= start) {
                console.error('[ReportPage] [FORM] ❌ End date must be after start date');
                toast.error(getIntlText('report.message.invalid_date_range'));
                return;
            }
            let startMs = start;
            let endMs = end;
            if (dr?.end && dr.end.hour() === 0 && dr.end.minute() === 0 && dr.end.second() === 0 && dr.end.millisecond() === 0) {
                endMs = dayjs(dr.end).endOf('day').valueOf();
                console.log('[ReportPage] [FORM] End date at start-of-day, extended to end-of-day:', endMs);
            }
            console.log('[ReportPage] [FORM] ✅ Date range validation passed (startMs, endMs sent to API)');
            
            console.log('[ReportPage] [FORM] Setting generating=true');
            setGenerating(true);
            try {
                console.log('[ReportPage] [API] ========== API CALLS STARTING ==========');
                
                // 1. Get dashboard detail (entity_ids)
                // Ensure id is converted to the correct type (number if needed)
                console.log('[ReportPage] [API] Step 1: Converting dashboard ID for API...');
                console.log('[ReportPage] [API]   - dbId:', dbId, 'Type:', typeof dbId);
                
                let dashboardIdForApi: ApiKey;
                if (typeof dbId === 'string') {
                    // Check if it's a valid number string
                    const trimmed = dbId.trim();
                    if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') {
                        console.error('[ReportPage] [API] ❌ Dashboard ID is invalid string:', dbId);
                        toast.error(getIntlText('report.message.select_dashboard'));
                        return;
                    }
                    const numValue = Number(trimmed);
                    // Büyük ID'ler (örn. 2016084489482240000) Number'da precision kaybına uğrar; string bırak.
                    const safeAsNumber = !isNaN(numValue) && numValue >= -Number.MAX_SAFE_INTEGER && numValue <= Number.MAX_SAFE_INTEGER;
                    if (safeAsNumber && trimmed !== '') {
                        dashboardIdForApi = numValue;
                        console.log('[ReportPage] [API]   - Converted string to number:', dashboardIdForApi);
                    } else {
                        dashboardIdForApi = trimmed;
                        console.log('[ReportPage] [API]   - Kept as string (non-numeric or large ID):', dashboardIdForApi);
                    }
                } else if (typeof dbId === 'number') {
                    dashboardIdForApi = dbId;
                    console.log('[ReportPage] [API]   - Already number:', dashboardIdForApi);
                } else {
                    console.error('[ReportPage] [API] ❌ Dashboard ID has invalid type:', typeof dbId, dbId);
                    toast.error(getIntlText('report.message.select_dashboard'));
                    return;
                }
                
                // Final validation before API call
                if (dashboardIdForApi == null || dashboardIdForApi === '' || String(dashboardIdForApi).trim() === '') {
                    console.error('[ReportPage] [API] ❌ Dashboard ID is invalid after conversion:', dashboardIdForApi);
                    toast.error(getIntlText('report.message.select_dashboard'));
                    return;
                }
                console.log('[ReportPage] [API] ✅ Dashboard ID for API:', dashboardIdForApi, 'Type:', typeof dashboardIdForApi);
                
                // Use getDrawingBoardDetail(canvas_id) instead of getDashboardDetail(id).
                // GET /dashboard/:id returns 500 (backend "GET not supported"); GET /canvas/:canvas_id works.
                const selectedDashboard = dashboardList?.find(
                    d => String(d.dashboard_id) === String(dashboardIdForApi) || d.dashboard_id === dashboardIdForApi,
                );
                let mainCanvasId: ApiKey | undefined | null = selectedDashboard?.main_canvas_id;
                // Fallback: POST /dashboard/search bazen main_canvas_id döndürmeyebilir. Canvas listesinden al.
                if (mainCanvasId == null || mainCanvasId === '') {
                    console.log('[ReportPage] [API] main_canvas_id list item\'da yok, getDrawingBoardList ile alınıyor...');
                    const [errList, respList] = await awaitWrap(
                        dashboardAPI.getDrawingBoardList({ dashboard_id: dashboardIdForApi }),
                    );
                    if (!errList && isRequestSuccess(respList)) {
                        const listData = getResponseData(respList) as unknown;
                        let arr: Array<{ canvas_id?: string; id?: string }> = [];
                        if (Array.isArray(listData)) {
                            arr = listData;
                        } else if (listData != null && typeof listData === 'object') {
                            const o = listData as Record<string, unknown>;
                            if (Array.isArray(o.data)) arr = o.data as Array<{ canvas_id?: string; id?: string }>;
                            else if (Array.isArray(o.content)) arr = o.content as Array<{ canvas_id?: string; id?: string }>;
                            else if (o.canvas_id != null || (o as { id?: string }).id != null) arr = [o as { canvas_id?: string; id?: string }];
                        }
                        const first = arr[0];
                        const cid = first?.canvas_id ?? first?.id;
                        if (cid != null && cid !== '') {
                            mainCanvasId = cid as ApiKey;
                            console.log('[ReportPage] [API] getDrawingBoardList fallback: canvas_id=', mainCanvasId);
                        }
                    }
                }
                if (!mainCanvasId && mainCanvasId !== 0) {
                    console.error('[ReportPage] [API] ❌ main_canvas_id not found for dashboard:', dashboardIdForApi);
                    toast.error(getIntlText('report.message.dashboard_not_found'));
                    return;
                }
                console.log('[ReportPage] [API] Step 1.1: Calling getDrawingBoardDetail (GET /canvas/:id)...');
                console.log('[ReportPage] [API]   - canvas_id:', mainCanvasId);
                
                const [err1, resp1] = await awaitWrap(
                    dashboardAPI.getDrawingBoardDetail({
                        canvas_id: mainCanvasId as ApiKey,
                    }),
                );
                
                console.log('[ReportPage] [API] Step 1.2: getDrawingBoardDetail response received');
                console.log('[ReportPage] [API]   - error:', err1);
                console.log('[ReportPage] [API]   - response:', resp1);
                console.log('[ReportPage] [API]   - isRequestSuccess:', isRequestSuccess(resp1));
                
                if (err1 || !isRequestSuccess(resp1)) {
                    console.error('[ReportPage] [API] ❌ getDrawingBoardDetail failed');
                    console.error('[ReportPage] [API]   - error:', err1);
                    console.error('[ReportPage] [API]   - response:', resp1);
                    
                    const errorCode = (resp1?.data as ApiResponse)?.error_code;
                    console.log('[ReportPage] [API]   - error_code:', errorCode);
                    if (errorCode === 'authentication_failed') {
                        console.log('[ReportPage] [API]   - Authentication failed, redirecting to login...');
                        return;
                    }
                    toast.error(getIntlText('report.message.dashboard_not_found'));
                    return;
                }
                
                type NormalizedEntity = { entityId: ApiKey; entityKey: string; entityName: string; deviceId?: ApiKey; entityValueAttribute?: { unit?: string } };
                const canvasDetail = getResponseData(resp1) as {
                    entity_ids?: ApiKey[];
                    entities?: Array<{
                        id?: ApiKey;
                        entity_id?: ApiKey;
                        key?: string;
                        entity_key?: string;
                        name?: string;
                        entity_name?: string;
                        device_id?: ApiKey;
                        value_attribute?: { unit?: string };
                        entity_value_attribute?: { unit?: string };
                    }>;
                    widgets?: WidgetDetail[];
                    device_ids?: ApiKey[];
                    name?: string;
                } | null;
                console.log('[ReportPage] [API] ✅ getDrawingBoardDetail success');
                console.log('[ReportPage] [API]   - canvasDetail:', canvasDetail);
                const entityIds = canvasDetail?.entity_ids ?? [];
                const rawEntities = canvasDetail?.entities ?? [];
                const widgets = (canvasDetail?.widgets ?? []) as WidgetDetail[];
                console.log('[ReportPage] [API]   - entity_ids:', entityIds, 'count:', entityIds.length);
                console.log('[ReportPage] [API]   - entities:', rawEntities?.length ?? 0);
                console.log('[ReportPage] [API]   - widgets:', widgets?.length ?? 0);

                const entityIdSet = new Set<string>();
                const addId = (id: ApiKey | null | undefined) => {
                    if (id != null && String(id).trim() !== '') entityIdSet.add(String(id));
                };
                entityIds.forEach(addId);
                if (rawEntities.length && !entityIds.length) {
                    rawEntities.forEach(e => addId((e.id ?? e.entity_id) as ApiKey));
                }
                const entityLikeKeys = ['entity', 'adc', 'adv', 'modbus', 'co2', 'tvoc', 'pm25', 'pm10'] as const;
                const scan = (obj: unknown): void => {
                    if (obj == null || typeof obj !== 'object') return;
                    const o = obj as Record<string, unknown>;
                    const id =
                        o.entity_id ??
                        o.entityId ??
                        (o.entity && typeof o.entity === 'object' && (o.entity as Record<string, unknown>).value) ??
                        (typeof o.value === 'string' || typeof o.value === 'number' ? o.value : null);
                    if (id != null && (typeof id === 'string' || typeof id === 'number')) addId(id as ApiKey);
                    entityLikeKeys.forEach(k => {
                        const v = o[k];
                        if (v && typeof v === 'object' && 'value' in v) {
                            const vv = (v as Record<string, unknown>).value;
                            if (typeof vv === 'string' || typeof vv === 'number') addId(vv as ApiKey);
                        }
                    });
                    if (Array.isArray(o.entities)) o.entities.forEach((e: unknown) => scan(e));
                    if (Array.isArray(o.entityList)) o.entityList.forEach((e: unknown) => scan(e));
                    if (o.data && typeof o.data === 'object') scan(o.data);
                    if (o.config && typeof o.config === 'object') scan(o.config);
                };
                widgets.forEach(w => scan(w.data));

                let entities: NormalizedEntity[] = [];

                if (rawEntities.length > 0) {
                    const mapped: NormalizedEntity[] = rawEntities.flatMap(
                        (e: Record<string, unknown>): NormalizedEntity[] => {
                            const id = (e.id ?? e.entity_id) as ApiKey | undefined;
                            if (!id) return [];
                            const key = String(e.key ?? e.entity_key ?? '');
                            const name = String(e.name ?? e.entity_name ?? '');
                            const deviceId = (e.device_id as ApiKey | undefined) ?? undefined;
                            const va = (e.value_attribute ?? e.entity_value_attribute) as { unit?: string } | undefined;
                            return [{ entityId: id, entityKey: key, entityName: name, deviceId, entityValueAttribute: va }];
                        },
                    );
                    const withDevice = mapped.filter((e): e is NormalizedEntity & { deviceId: ApiKey } => e.deviceId != null);
                    if (withDevice.length > 0) {
                        console.log('[ReportPage] [API] Using canvas.entities (skip API), count:', withDevice.length);
                        entities = withDevice;
                    }
                }

                if (entities.length === 0) {
                    let deviceIds: ApiKey[] = Array.from(
                        new Set([
                            ...(canvasDetail?.device_ids ?? []),
                            ...(getDeviceIdsInuse(widgets) ?? []),
                        ]),
                    ).filter(Boolean);
                    if (deviceIds.length === 0) {
                        console.log('[ReportPage] [API] Step 2a: No device_ids from canvas/widgets, fetching all devices...');
                        const [errDev, respDev] = await awaitWrap(
                            deviceAPI.getList({ page_size: 100, page_number: 1 }),
                        );
                        if (errDev || !isRequestSuccess(respDev)) {
                            console.error('[ReportPage] [API] ❌ deviceAPI.getList (all) failed');
                            toast.error(getIntlText('report.message.failed_to_fetch_entities'));
                            return;
                        }
                        const devData = getResponseData(respDev) as { content?: Array<{ id?: ApiKey }> } | null;
                        deviceIds = (devData?.content ?? []).map(d => d.id).filter(Boolean) as ApiKey[];
                        console.log('[ReportPage] [API]   - devices from getList:', deviceIds.length);
                    }
                    if (deviceIds.length === 0) {
                        console.error('[ReportPage] [API] ❌ No devices available for entity fetch');
                        toast.error(getIntlText('report.message.no_entities_in_dashboard'));
                        return;
                    }
                    const cap = 50;
                    const idsToQuery = deviceIds.slice(0, cap);
                    console.log('[ReportPage] [API] Step 2b: Fetching entities per device (DEVICE_ID EQ, like Device Entity Data), devices:', idsToQuery.length);

                    const allRaw: NormalizedEntity[] = [];
                    for (const did of idsToQuery) {
                        const [err2, r2] = await awaitWrap(
                            entityAPI.advancedSearch({
                                page_size: 1000,
                                page_number: 1,
                                sorts: [{ direction: 'ASC' as const, property: 'key' }],
                                entity_filter: {
                                    DEVICE_ID: { operator: 'EQ' as const, values: [did] },
                                    ENTITY_TYPE: { operator: 'ANY_EQUALS' as const, values: [ENTITY_TYPE.PROPERTY] },
                                },
                            }),
                        );
                        if (err2 || !isRequestSuccess(r2)) {
                            console.warn('[ReportPage] [API] advancedSearch(DEVICE_ID EQ) failed for device:', did, err2);
                            continue;
                        }
                        const entityData = getResponseData(r2);
                        const list = Array.isArray((entityData as any)?.content)
                            ? (entityData as any).content
                            : Array.isArray((entityData as any)?.data)
                              ? (entityData as any).data
                              : [];
                        list.forEach((item: Record<string, unknown>) => {
                            const id = (item.id ?? item.entity_id) as ApiKey | undefined;
                            if (!id) return;
                            const key = String(item.key ?? item.entity_key ?? '');
                            const name = String(item.name ?? item.entity_name ?? '');
                            const deviceId = (item.device_id as ApiKey | undefined) ?? (did as ApiKey);
                            const va = (item.value_attribute ?? item.entity_value_attribute) as { unit?: string } | undefined;
                            allRaw.push({ entityId: id, entityKey: key, entityName: name, deviceId, entityValueAttribute: va });
                        });
                    }
                    // Report only dashboard-selected telemetry (aşı dolabı ısı takibi vb.): filter by
                    // entityIdSet (canvas entity_ids + widget-bound entities). Never list all entities.
                    if (entityIdSet.size > 0) {
                        entities = allRaw.filter(e => entityIdSet.has(String(e.entityId)));
                        console.log('[ReportPage] [API]   - filtered by dashboard-selected entity_ids:', entities.length, 'of', allRaw.length);
                    } else {
                        entities = allRaw;
                        console.log('[ReportPage] [API]   - no entityIdSet, using all entities for devices');
                    }
                    console.log('[ReportPage] [API] ✅ entities fetched by DEVICE_ID (EQ per device), count:', entities.length);
                }

                if (!entities.length) {
                    console.error('[ReportPage] [API] ❌ No entities in dashboard');
                    toast.error(getIntlText('report.message.no_entities_in_dashboard'));
                    return;
                }
                console.log('[ReportPage] [API] ✅ Using', entities.length, 'entities');

                // 3. Group entities by device_id and get unique device_ids
                console.log('[ReportPage] [API] Step 3: Grouping entities by device_id...');
                const deviceIdSet = new Set<ApiKey>();
                const entityMap = new Map<ApiKey, typeof entities>();
                entities.forEach(entity => {
                    const did = entity.deviceId;
                    if (did) {
                        deviceIdSet.add(did);
                        if (!entityMap.has(did)) {
                            entityMap.set(did, []);
                        }
                        entityMap.get(did)!.push(entity);
                    }
                });
                console.log('[ReportPage] [API]   - deviceIdSet size:', deviceIdSet.size);

                const deviceIds = Array.from(deviceIdSet);
                console.log('[ReportPage] [API]   - deviceIds:', deviceIds);
                if (!deviceIds.length) {
                    console.error('[ReportPage] [API] ❌ No devices found in entities');
                    toast.error(getIntlText('report.message.no_devices_in_dashboard'));
                    return;
                }
                console.log('[ReportPage] [API] ✅ Found', deviceIds.length, 'devices');

                // 4. Get device names
                console.log('[ReportPage] [API] Step 4: Calling deviceAPI.getList...');
                console.log('[ReportPage] [API]   - Request: deviceIds:', deviceIds);
                
                const [err3, resp3] = await awaitWrap(
                    deviceAPI.getList({
                        page_size: 1000,
                        page_number: 1,
                        id_list: deviceIds,
                    }),
                );
                
                console.log('[ReportPage] [API] Step 4.1: deviceAPI.getList response received');
                console.log('[ReportPage] [API]   - error:', err3);
                console.log('[ReportPage] [API]   - response:', resp3);
                console.log('[ReportPage] [API]   - isRequestSuccess:', isRequestSuccess(resp3));
                
                if (err3 || !isRequestSuccess(resp3)) {
                    console.error('[ReportPage] [API] ❌ deviceAPI.getList failed');
                    console.error('[ReportPage] [API]   - error:', err3);
                    console.error('[ReportPage] [API]   - response:', resp3);
                    
                    // Check if it's an authentication error
                    const errorCode = (resp3?.data as ApiResponse)?.error_code;
                    console.log('[ReportPage] [API]   - error_code:', errorCode);
                    if (errorCode === 'authentication_failed') {
                        console.log('[ReportPage] [API]   - Authentication failed, redirecting to login...');
                        return;
                    }
                    toast.error(getIntlText('report.message.failed_to_fetch_devices'));
                    return;
                }
                
                const deviceData = getResponseData(resp3);
                console.log('[ReportPage] [API] ✅ deviceAPI.getList success');
                console.log('[ReportPage] [API]   - deviceData:', deviceData);
                
                if (!deviceData || typeof deviceData !== 'object') {
                    console.error('[ReportPage] [API] ❌ deviceData is invalid:', deviceData);
                    toast.error(getIntlText('report.message.failed_to_fetch_devices'));
                    return;
                }
                console.log('[ReportPage] [API] ✅ deviceData is valid object');
                const deviceDataCamel = objectToCamelCase(deviceData) as { content?: Array<{
                    id: ApiKey;
                    name: string;
                }> } | null;
                const devices = deviceDataCamel?.content ?? [];
                const deviceNameMap = new Map<ApiKey, string>();
                devices.forEach(device => {
                    deviceNameMap.set(device.id, device.name);
                });

                // 5. Build device-entity groups
                const deviceGroups: DeviceEntityGroup[] = deviceIds.map(deviceId => ({
                    deviceId,
                    deviceName: deviceNameMap.get(deviceId) ?? `Device ${deviceId}`,
                    entities: (entityMap.get(deviceId) ?? []).map(entity => ({
                        entityId: entity.entityId,
                        entityName: entity.entityName,
                        entityKey: entity.entityKey,
                        unit: entity.entityValueAttribute?.unit,
                    })),
                }));

                // 6. Fetch history (timestamped list) per entity; compute last/min/max/avg from it
                const HISTORY_PAGE_SIZE = 500;
                const MAX_HISTORY_PAGES = 20;
                /** Normalize API timestamp to ms. Backend may return seconds (1e9..1e10) or ms (1e12+). */
                const toTimestampMs = (ts: number): number => {
                    if (typeof ts !== 'number' || Number.isNaN(ts)) return 0;
                    if (ts > 0 && ts < 1e11) return ts * 1000;
                    return ts;
                };
                console.log('[ReportPage] [API] Step 6: Fetching entity history (timestamped) for report...');
                console.log('[ReportPage] [API]   - deviceGroups count:', deviceGroups.length);
                console.log('[ReportPage] [API]   - Date range (ms): start:', startMs, 'end:', endMs);

                const deviceSections: PdfReportDeviceSection[] = [];
                for (const group of deviceGroups) {
                    console.log('[ReportPage] [API]   - Processing device:', group.deviceName, 'entities:', group.entities.length);
                    const rows: PdfReportRow[] = [];
                    for (const entity of group.entities) {
                        const allPoints: { timestamp: number; value: number }[] = [];
                        const rawHistory: { timestamp: number; value: unknown }[] = [];
                        let page = 1;
                        let hasMore = true;
                        while (hasMore && page <= MAX_HISTORY_PAGES) {
                            const [err, resp] = await awaitWrap(
                                entityAPI.getHistory({
                                    entity_id: entity.entityId,
                                    start_timestamp: startMs,
                                    end_timestamp: endMs,
                                    page_size: HISTORY_PAGE_SIZE,
                                    page_number: page,
                                }),
                            );
                            if (err || !isRequestSuccess(resp)) {
                                if (resp && (resp?.data as ApiResponse)?.error_code === 'authentication_failed') return;
                                break;
                            }
                            const data = getResponseData(resp) as { content?: Array<{ timestamp?: number; value?: unknown }>; total?: number } | null;
                            const content = data?.content ?? [];
                            content.forEach((item: { timestamp?: number; value?: unknown }) => {
                                const ts = item.timestamp;
                                const v = item.value;
                                if (ts == null) return;
                                if (v != null && v !== '') rawHistory.push({ timestamp: ts, value: v });
                                const n = typeof v === 'number' && !Number.isNaN(v) ? v : Number(v);
                                if (!Number.isNaN(n)) allPoints.push({ timestamp: ts, value: n });
                            });
                            hasMore = content.length >= HISTORY_PAGE_SIZE;
                            page += 1;
                        }
                        allPoints.sort((a, b) => toTimestampMs(a.timestamp) - toTimestampMs(b.timestamp));
                        rawHistory.sort((a, b) => toTimestampMs(Number(a.timestamp)) - toTimestampMs(Number(b.timestamp)));
                        const nums = allPoints.map(p => p.value);
                        const last = allPoints.length > 0 ? allPoints[allPoints.length - 1].value : NaN;
                        const min = nums.length ? Math.min(...nums) : NaN;
                        const max = nums.length ? Math.max(...nums) : NaN;
                        const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : NaN;
                        const history = rawHistory.map(p => {
                            const ms = toTimestampMs(Number(p.timestamp));
                            return {
                                timestamp: getTimeFormat(dayjs(ms), 'fullDateTimeSecondFormat'),
                                value: p.value != null && p.value !== '' ? String(p.value) : '—',
                            };
                        });

                        rows.push({
                            entityName: entity.entityName,
                            unit: entity.unit ?? '',
                            last,
                            min,
                            max,
                            avg,
                            history,
                        });
                        console.log('[ReportPage] [API]     -', entity.entityName, 'history points:', rawHistory.length, 'last/min/max/avg:', { last, min, max, avg });
                    }
                    if (rows.length > 0) {
                        deviceSections.push({ deviceName: group.deviceName, rows });
                    }
                }
                
                console.log('[ReportPage] [API] ✅ Entity history fetch completed');
                console.log('[ReportPage] [API]   - deviceSections count:', deviceSections.length);

                if (deviceSections.length === 0) {
                    console.error('[ReportPage] [API] ❌ No device sections with data');
                    toast.error(getIntlText('report.message.no_data_in_range'));
                    return;
                }
                console.log('[ReportPage] [API] ✅ Found', deviceSections.length, 'device sections with data');

                // 7. Generate PDF
                console.log('[ReportPage] [PDF] Step 7: Generating PDF...');
                const dateRangeStr = `${getTimeFormat(dayjs(startMs), 'simpleDateFormat')} – ${getTimeFormat(dayjs(endMs), 'simpleDateFormat')}`;
                const generatedAt = getTimeFormat(dayjs(), 'fullDateTimeSecondFormat');
                console.log('[ReportPage] [PDF]   - dateRangeStr:', dateRangeStr);
                console.log('[ReportPage] [PDF]   - generatedAt:', generatedAt);
                console.log('[ReportPage] [PDF]   - reportTitle:', reportTitle);
                console.log('[ReportPage] [PDF]   - companyName:', companyName);
                console.log('[ReportPage] [PDF]   - dashboardName:', dashboardName);
                console.log('[ReportPage] [PDF]   - deviceSections count:', deviceSections.length);
                
                const blob = buildTelemetryPdf({
                    title: reportTitle ?? '',
                    companyName: companyName ?? '',
                    dashboardName: dashboardName || (canvasDetail as { name?: string } | null)?.name || '',
                    dateRange: dateRangeStr,
                    deviceSections,
                    generatedAt,
                    defaultTitle: getIntlText('report.pdf.default_title'),
                    generatedAtLabel: getIntlText('report.pdf.generated_at'),
                    ariotLabel: getIntlText('report.pdf.ariot'),
                    dashboardLabel: getIntlText('report.pdf.dashboard'),
                    deviceLabel: getIntlText('report.pdf.device'),
                    tableHeaders: {
                        entityName: getIntlText('report.table.entity_name'),
                        unit: getIntlText('report.table.unit'),
                        last: getIntlText('report.table.last'),
                        min: getIntlText('report.table.min'),
                        max: getIntlText('report.table.max'),
                        avg: getIntlText('report.table.avg'),
                        timestamp: getIntlText('report.table.timestamp'),
                        value: getIntlText('report.table.value'),
                    },
                });

                const fileName = `TelemetryReport_${getTimeFormat(dayjs(), 'simpleDateFormat').replace(/-/g, '_')}_${genRandomString(6, { upperCase: false, lowerCase: true })}.pdf`;
                console.log('[ReportPage] [PDF]   - fileName:', fileName);
                console.log('[ReportPage] [PDF]   - Downloading PDF...');
                
                linkDownload(blob, fileName);
                console.log('[ReportPage] [PDF] ✅ PDF download initiated');
                console.log('[ReportPage] [FORM] ========== FORM SUBMIT SUCCESS ==========');
                toast.success(getIntlText('report.message.success'));
            } catch (e) {
                console.error('[ReportPage] [ERROR] ========== PDF GENERATION ERROR ==========');
                console.error('[ReportPage] [ERROR] Error:', e);
                console.error('[ReportPage] [ERROR] Error stack:', e instanceof Error ? e.stack : 'No stack trace');
                console.error('[ReportPage] [ERROR] ============================================');
                toast.error(getIntlText('report.message.generate_failed'));
            } finally {
                console.log('[ReportPage] [FORM] Setting generating=false');
                setGenerating(false);
            }
        },
        [dashboardName, getIntlText, dayjs, getTimeFormat, getValues, dashboardId, dashboardList],
    );

    return (
        <div className="ms-main">
            <Breadcrumbs />
            <div className="ms-view ms-view-report">
                <Box
                    component="form"
                    onSubmit={handleSubmit(onGenerate)}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}
                >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
                        <Controller
                            name="dashboardId"
                            control={control}
                            rules={{ required: getIntlText('report.message.select_dashboard') }}
                            render={({ field, fieldState: { error } }) => {
                                // Convert field value to string for Select component
                                const selectValue = field.value != null && field.value !== undefined ? String(field.value) : '';
                                
                                return (
                                    <FormControl size="small" sx={{ minWidth: 280 }} error={!!error} required>
                                        <InputLabel id="dashboard-select-label">{getIntlText('report.form.dashboard')}</InputLabel>
                                        <Select
                                            labelId="dashboard-select-label"
                                            disabled={loadingDashboards || generating}
                                            displayEmpty
                                            value={selectValue}
                                        onChange={(e: SelectChangeEvent<string>) => {
                                            const selectedValue = e.target.value;
                                            console.log('[ReportPage] [SELECT] ========== DASHBOARD SELECT onChange ==========');
                                            console.log('[ReportPage] [SELECT] selectedValue:', selectedValue, 'Type:', typeof selectedValue);
                                            console.log('[ReportPage] [SELECT] current field.value:', field.value, 'Type:', typeof field.value);
                                            console.log('[ReportPage] [SELECT] dashboardList length:', dashboardList?.length);
                                            
                                            // Handle empty selection
                                            if (!selectedValue || selectedValue === '') {
                                                console.log('[ReportPage] [SELECT] Empty selection, setting to undefined');
                                                field.onChange(undefined);
                                                console.log('[ReportPage] [SELECT] After onChange - field.value:', field.value);
                                                return;
                                            }
                                            
                                            // Find dashboard in list by matching string ID
                                            console.log('[ReportPage] [SELECT] Searching for dashboard in list...');
                                            const foundDashboard = dashboardList?.find(d => {
                                                const dId = d.dashboard_id;
                                                const dIdString = String(dId);
                                                const match = dIdString === selectedValue;
                                                if (match) {
                                                    console.log('[ReportPage] [SELECT]   - Match found:', { dId, dIdString, selectedValue, name: d.name });
                                                }
                                                return match;
                                            });
                                            
                                            if (!foundDashboard) {
                                                console.error('[ReportPage] [SELECT] ❌ Dashboard not found for value:', selectedValue);
                                                console.error('[ReportPage] [SELECT] Available dashboards:', dashboardList?.map(d => ({ 
                                                    id: d.dashboard_id, 
                                                    idString: String(d.dashboard_id),
                                                    name: d.name 
                                                })));
                                                field.onChange(undefined);
                                                console.log('[ReportPage] [SELECT] After onChange (not found) - field.value:', field.value);
                                                return;
                                            }
                                            
                                            // Get original ID from dashboard object (preserve type: number or string)
                                            const originalId = foundDashboard.dashboard_id;
                                            console.log('[ReportPage] [SELECT] ✅ Found dashboard:', foundDashboard.name);
                                            console.log('[ReportPage] [SELECT]   - originalId:', originalId, 'Type:', typeof originalId);
                                            
                                            // Update form state with original ID
                                            console.log('[ReportPage] [SELECT] Calling field.onChange with:', originalId);
                                            field.onChange(originalId as ApiKey);
                                            
                                            // Verify the update immediately
                                            console.log('[ReportPage] [SELECT] After field.onChange - field.value:', field.value, 'Type:', typeof field.value);
                                            console.log('[ReportPage] [SELECT] ============================================');
                                        }}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            inputRef={field.ref}
                                        >
                                            {dashboardList && dashboardList.length > 0 ? (
                                                dashboardList.map(dashboard => {
                                                    const id = dashboard.dashboard_id;
                                                    const stringId = String(id);
                                                    return (
                                                        <MenuItem key={stringId} value={stringId}>
                                                            {dashboard.name}
                                                        </MenuItem>
                                                    );
                                                })
                                            ) : (
                                                <MenuItem disabled value="">
                                                    {loadingDashboards ? getIntlText('common.loading') : getIntlText('report.message.no_dashboards')}
                                                </MenuItem>
                                            )}
                                        </Select>
                                        {error && <FormHelperText>{error.message || getIntlText('report.message.select_dashboard')}</FormHelperText>}
                                    </FormControl>
                                );
                            }}
                        />
                        <Controller
                            name="reportTitle"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={getIntlText('report.form.report_title')}
                                    placeholder={getIntlText('report.form.report_title_placeholder')}
                                    size="small"
                                    sx={{ minWidth: 220 }}
                                    disabled={generating}
                                />
                            )}
                        />
                        <Controller
                            name="companyName"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={getIntlText('report.form.company_name')}
                                    placeholder={getIntlText('report.form.company_name_placeholder')}
                                    size="small"
                                    sx={{ minWidth: 220 }}
                                    disabled={generating}
                                />
                            )}
                        />
                        <Controller
                            name="dateRange"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <FormControl size="small" sx={{ minWidth: 280 }}>
                                    <DateRangePicker
                                        label={{
                                            start: getIntlText('common.label.start_date'),
                                            end: getIntlText('common.label.end_date'),
                                        }}
                                        value={value as DateRangePickerValueType | null}
                                        onChange={onChange}
                                        disabled={generating}
                                    />
                                </FormControl>
                            )}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={generating || !dashboardId || dashboardId === '' || dashboardId === 'undefined'}
                            sx={{ height: 40, textTransform: 'none' }}
                        >
                            {generating
                                ? getIntlText('report.form.generate_pdf_loading')
                                : getIntlText('report.form.generate_pdf')}
                        </Button>
                    </Stack>
                </Box>
            </div>
        </div>
    );
}
