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

const ROWS: { key: 'rssi' | 'snr' | 'sf'; label: string }[] = [
    { key: 'rssi', label: 'RSSI' },
    { key: 'snr', label: 'SNR' },
    { key: 'sf', label: 'SF' },
];

interface ViewConfig {
    rssi?: EntityOptionType;
    snr?: EntityOptionType;
    sf?: EntityOptionType;
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
    const { title, rssi, snr, sf } = config || {};
    const { isPreview, pos } = configJson || {};

    const { matchTablet } = useTheme();
    const { getLatestEntityDetail } = useActivityEntity();
    const { wGrid = 2, hGrid = 2 } = useGridLayout(isPreview ? { w: 2, h: 2 } : pos);
    const { containerRef } = useContainerRect();

    const entities = useMemo(
        () => [rssi, snr, sf].filter((e): e is EntityOptionType => !!e),
        [rssi, snr, sf],
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
        const cfg: Record<string, EntityOptionType | undefined> = { rssi, snr, sf };
        return ROWS.filter(({ key }) => !!cfg[key]).map(({ key, label }) => {
            const entity = cfg[key]!;
            const latest = getLatestEntityDetail(entity) as EntityOptionType;
            const status = latest?.value ? statusMap[String(latest.value)] : undefined;
            return { key, label, value: formatValue(latest, status) };
        });
    }, [rssi, snr, sf, statusMap, getLatestEntityDetail]);

    return (
        <div
            ref={containerRef}
            className={cls('ms-signal-quality-dial', {
                'ms-signal-quality-dial--preview': isPreview,
            })}
        >
            <div className="ms-signal-quality-dial__card">
                <div
                    className={cls('ms-signal-quality-dial__header', {
                        'mb-1': matchTablet,
                        'mb-2': !matchTablet,
                    })}
                >
                    <Tooltip
                        className="ms-signal-quality-dial__title"
                        autoEllipsis
                        title={title}
                    />
                </div>
                <div className="ms-signal-quality-dial__body">
                    {rows.length === 0 ? (
                        <div className="ms-signal-quality-dial__empty">—</div>
                    ) : (
                        rows.map(({ key, label, value }) => (
                            <div key={key} className="ms-signal-quality-dial__row">
                                <span className="ms-signal-quality-dial__label">{label}</span>
                                <Tooltip
                                    className="ms-signal-quality-dial__value"
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
