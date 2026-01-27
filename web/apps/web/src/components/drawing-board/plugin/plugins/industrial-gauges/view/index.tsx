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

const ROWS: { key: 'adc' | 'adv' | 'modbus'; label: string }[] = [
    { key: 'adc', label: 'ADC' },
    { key: 'adv', label: 'ADV' },
    { key: 'modbus', label: 'Modbus' },
];

interface ViewConfig {
    adc?: EntityOptionType;
    adv?: EntityOptionType;
    modbus?: EntityOptionType;
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
    const { title, adc, adv, modbus } = config || {};
    const { isPreview, pos } = configJson || {};

    const { matchTablet } = useTheme();
    const { getLatestEntityDetail } = useActivityEntity();
    const { wGrid = 2, hGrid = 2 } = useGridLayout(isPreview ? { w: 2, h: 2 } : pos);
    const { containerRef } = useContainerRect();

    const entities = useMemo(
        () => [adc, adv, modbus].filter((e): e is EntityOptionType => !!e),
        [adc, adv, modbus],
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
            adc,
            adv,
            modbus,
        };
        return ROWS.filter(({ key }) => !!cfg[key]).map(({ key, label }) => {
            const entity = cfg[key]!;
            const latest = getLatestEntityDetail(entity) as EntityOptionType;
            const status = latest?.value ? statusMap[String(latest.value)] : undefined;
            return { key, label, value: formatValue(latest, status) };
        });
    }, [adc, adv, modbus, statusMap, getLatestEntityDetail]);

    return (
        <div
            ref={containerRef}
            className={cls('ms-industrial-gauges', {
                'ms-industrial-gauges--preview': isPreview,
            })}
        >
            <div className="ms-industrial-gauges__card">
                <div
                    className={cls('ms-industrial-gauges__header', {
                        'mb-1': matchTablet,
                        'mb-2': !matchTablet,
                    })}
                >
                    <Tooltip
                        className="ms-industrial-gauges__title"
                        autoEllipsis
                        title={title}
                    />
                </div>
                <div className="ms-industrial-gauges__body">
                    {rows.length === 0 ? (
                        <div className="ms-industrial-gauges__empty">—</div>
                    ) : (
                        rows.map(({ key, label, value }) => (
                            <div key={key} className="ms-industrial-gauges__row">
                                <span className="ms-industrial-gauges__label">{label}</span>
                                <Tooltip
                                    className="ms-industrial-gauges__value"
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
