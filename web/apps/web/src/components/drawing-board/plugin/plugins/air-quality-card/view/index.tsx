import { useMemo } from 'react';
import cls from 'classnames';

import { useTheme } from '@milesight/shared/src/hooks';
import { Tooltip } from '@/components';
import {
    useActivityEntity,
    useGridLayout,
    useContainerRect,
    checkAlarmEmphasisMulti,
} from '@/components/drawing-board/plugin/hooks';
import { useSource } from './hooks';
import type { BoardPluginProps } from '@/components/drawing-board/plugin/types';
import './style.less';

const ROWS: { key: 'co2' | 'tvoc' | 'pm25' | 'pm10'; label: string }[] = [
    { key: 'co2', label: 'CO2' },
    { key: 'tvoc', label: 'TVOC' },
    { key: 'pm25', label: 'PM2.5' },
    { key: 'pm10', label: 'PM10' },
];

interface ViewConfig {
    co2?: EntityOptionType;
    tvoc?: EntityOptionType;
    pm25?: EntityOptionType;
    pm10?: EntityOptionType;
    title?: string;
}

interface Props {
    widgetId: ApiKey;
    dashboardId: ApiKey;
    config: ViewConfig;
    configJson: BoardPluginProps;
}

function formatValue(
    entity: EntityOptionType | undefined,
    status: { value?: unknown } | undefined,
): string {
    if (!entity?.rawData || status == null) return '—';
    const { entityValueAttribute } = entity.rawData;
    const { enum: enumStruct, unit } = entityValueAttribute || {};
    const v = status.value;
    const str = v != null ? String(v) : '—';
    if (enumStruct && str in enumStruct) {
        return String(enumStruct[str as keyof typeof enumStruct]);
    }
    return unit ? `${str} ${unit}` : str;
}

const View = (props: Props) => {
    const { config, configJson, widgetId, dashboardId } = props;
    const { title, co2, tvoc, pm25, pm10 } = config || {};
    const { isPreview, pos } = configJson || {};

    const { matchTablet } = useTheme();
    const { getLatestEntityDetail } = useActivityEntity();
    const { wGrid = 2, hGrid = 2 } = useGridLayout(isPreview ? { w: 2, h: 2 } : pos);
    const { containerRef } = useContainerRect();

    const entities = useMemo(
        () => [co2, tvoc, pm25, pm10].filter((e): e is EntityOptionType => !!e),
        [co2, tvoc, pm25, pm10],
    );
    const latestEntities = useMemo(
        () =>
            entities.map(e => getLatestEntityDetail(e) as EntityOptionType).filter(Boolean),
        [entities, getLatestEntityDetail],
    );

    const { statusMap } = useSource({
        entities: latestEntities,
        widgetId,
        dashboardId,
    });

    const { emphasisClass } = useMemo(
        () => checkAlarmEmphasisMulti(latestEntities, statusMap),
        [latestEntities, statusMap],
    );

    const rows = useMemo(() => {
        const cfg: Record<string, EntityOptionType | undefined> = {
            co2,
            tvoc,
            pm25,
            pm10,
        };
        return ROWS.filter(({ key }) => !!cfg[key]).map(({ key, label }) => {
            const entity = cfg[key]!;
            const latest = getLatestEntityDetail(entity) as EntityOptionType;
            const status = latest?.value
                ? statusMap[String(latest.value)]
                : undefined;
            return {
                key,
                label,
                value: formatValue(latest, status),
            };
        });
    }, [co2, tvoc, pm25, pm10, statusMap, getLatestEntityDetail]);

    return (
        <div
            ref={containerRef}
            className={cls('ms-air-quality-card', {
                'ms-air-quality-card--preview': isPreview,
                [emphasisClass ?? '']: !!emphasisClass,
            })}
        >
            <div className="ms-air-quality-card__card">
                <div
                    className={cls('ms-air-quality-card__header', {
                        'mb-1': matchTablet,
                        'mb-2': !matchTablet,
                    })}
                >
                    <Tooltip
                        className="ms-air-quality-card__title"
                        autoEllipsis
                        title={title}
                    />
                </div>
                <div className="ms-air-quality-card__body">
                    {rows.length === 0 ? (
                        <div className="ms-air-quality-card__empty">
                            —
                        </div>
                    ) : (
                        rows.map(({ key, label, value }) => (
                            <div
                                key={key}
                                className={cls('ms-air-quality-card__row', {
                                    'ms-air-quality-card__row--compact':
                                        (hGrid <= 1) || rows.length > 2,
                                })}
                            >
                                <span className="ms-air-quality-card__label">
                                    {label}
                                </span>
                                <Tooltip
                                    className="ms-air-quality-card__value"
                                    autoEllipsis
                                    title={value}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default View;
