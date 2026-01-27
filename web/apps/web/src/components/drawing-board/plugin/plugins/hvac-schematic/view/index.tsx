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

const ROWS: { key: 'fanStatus' | 'valveStatus'; label: string }[] = [
    { key: 'fanStatus', label: 'Fan' },
    { key: 'valveStatus', label: 'Valve' },
];

interface ViewConfig {
    fanStatus?: EntityOptionType;
    valveStatus?: EntityOptionType;
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
    if (enumStruct && str in enumStruct) return String(enumStruct[str as keyof typeof enumStruct]);
    return unit ? `${str} ${unit}` : str;
}

const View = (props: Props) => {
    const { config, configJson, widgetId, dashboardId } = props;
    const { title, fanStatus, valveStatus } = config || {};
    const { isPreview, pos } = configJson || {};

    const { matchTablet } = useTheme();
    const { getLatestEntityDetail } = useActivityEntity();
    const { wGrid = 2, hGrid = 2 } = useGridLayout(isPreview ? { w: 2, h: 2 } : pos);
    const { containerRef } = useContainerRect();

    const entities = useMemo(
        () => [fanStatus, valveStatus].filter((e): e is EntityOptionType => !!e),
        [fanStatus, valveStatus],
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
            fanStatus,
            valveStatus,
        };
        return ROWS.filter(({ key }) => !!cfg[key]).map(({ key, label }) => {
            const entity = cfg[key]!;
            const latest = getLatestEntityDetail(entity) as EntityOptionType;
            const status = latest?.value ? statusMap[String(latest.value)] : undefined;
            return { key, label, value: formatValue(latest, status) };
        });
    }, [fanStatus, valveStatus, statusMap, getLatestEntityDetail]);

    return (
        <div
            ref={containerRef}
            className={cls('ms-hvac-schematic', {
                'ms-hvac-schematic--preview': isPreview,
            })}
        >
            <div className="ms-hvac-schematic__card">
                <div
                    className={cls('ms-hvac-schematic__header', {
                        'mb-1': matchTablet,
                        'mb-2': !matchTablet,
                    })}
                >
                    <Tooltip
                        className="ms-hvac-schematic__title"
                        autoEllipsis
                        title={title}
                    />
                </div>
                <div className="ms-hvac-schematic__body">
                    {rows.length === 0 ? (
                        <div className="ms-hvac-schematic__empty">—</div>
                    ) : (
                        rows.map(({ key, label, value }) => (
                            <div key={key} className="ms-hvac-schematic__row">
                                <span className="ms-hvac-schematic__label">{label}</span>
                                <Tooltip
                                    className="ms-hvac-schematic__value"
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
