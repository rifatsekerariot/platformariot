import { useMemo } from 'react';
import cls from 'classnames';

import { useTheme } from '@milesight/shared/src/hooks';
import { Tooltip } from '@/components';
import {
    useActivityEntity,
    useGridLayout,
    useContainerRect,
} from '@/components/drawing-board/plugin/hooks';
import { useSource } from './hooks';
import type { BoardPluginProps } from '@/components/drawing-board/plugin/types';
import './style.less';

const ROWS: { key: 'windDirection' | 'windSpeed'; label: string }[] = [
    { key: 'windDirection', label: 'Direction' },
    { key: 'windSpeed', label: 'Speed' },
];

interface ViewConfig {
    windDirection?: EntityOptionType;
    windSpeed?: EntityOptionType;
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
    const { unit } = entityValueAttribute || {};
    const v = status.value;
    const str = v != null ? String(v) : '—';
    return unit ? `${str} ${unit}` : str;
}

const View = (props: Props) => {
    const { config, configJson, widgetId, dashboardId } = props;
    const { title, windDirection, windSpeed } = config || {};
    const { isPreview, pos } = configJson || {};

    const { matchTablet } = useTheme();
    const { getLatestEntityDetail } = useActivityEntity();
    const { wGrid = 2, hGrid = 2 } = useGridLayout(isPreview ? { w: 2, h: 2 } : pos);
    const { containerRef } = useContainerRect();

    const entities = useMemo(
        () => [windDirection, windSpeed].filter((e): e is EntityOptionType => !!e),
        [windDirection, windSpeed],
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

    const rows = useMemo(() => {
        const cfg: Record<string, EntityOptionType | undefined> = {
            windDirection,
            windSpeed,
        };
        return ROWS.filter(({ key }) => !!cfg[key]).map(({ key, label }) => {
            const entity = cfg[key]!;
            const latest = getLatestEntityDetail(entity) as EntityOptionType;
            const status = latest?.value ? statusMap[String(latest.value)] : undefined;
            return { key, label, value: formatValue(latest, status) };
        });
    }, [windDirection, windSpeed, statusMap, getLatestEntityDetail]);

    return (
        <div
            ref={containerRef}
            className={cls('ms-wind-rose', {
                'ms-wind-rose--preview': isPreview,
            })}
        >
            <div className="ms-wind-rose__card">
                <div
                    className={cls('ms-wind-rose__header', {
                        'mb-1': matchTablet,
                        'mb-2': !matchTablet,
                    })}
                >
                    <Tooltip
                        className="ms-wind-rose__title"
                        autoEllipsis
                        title={title}
                    />
                </div>
                <div className="ms-wind-rose__body">
                    {rows.length === 0 ? (
                        <div className="ms-wind-rose__empty">—</div>
                    ) : (
                        rows.map(({ key, label, value }) => (
                            <div key={key} className="ms-wind-rose__row">
                                <span className="ms-wind-rose__label">{label}</span>
                                <Tooltip
                                    className="ms-wind-rose__value"
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
