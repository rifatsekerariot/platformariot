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

interface ViewConfig {
    entity?: EntityOptionType;
    title?: string;
}

interface Props {
    widgetId: ApiKey;
    dashboardId: ApiKey;
    config: ViewConfig;
    configJson: BoardPluginProps;
}

const View = (props: Props) => {
    const { config, configJson, widgetId, dashboardId } = props;
    const { title, entity } = config || {};
    const { isPreview, pos } = configJson || {};

    const { matchTablet } = useTheme();
    const { getLatestEntityDetail } = useActivityEntity();
    const { wGrid = 2, hGrid = 1 } = useGridLayout(isPreview ? { w: 2, h: 1 } : pos);
    const { containerRef } = useContainerRect();

    const latestEntity = useMemo(() => {
        if (!entity) return undefined;
        return getLatestEntityDetail(entity) as EntityOptionType | undefined;
    }, [entity, getLatestEntityDetail]);

    const { entityStatus } = useSource({
        entity: latestEntity,
        widgetId,
        dashboardId,
    });

    const displayValue = useMemo(() => {
        const raw = latestEntity?.rawData;
        if (!raw) return '—';
        const { entityValueAttribute } = raw;
        const { unit } = entityValueAttribute || {};
        const v = entityStatus?.value;
        const str = v != null ? String(v) : '—';
        return unit ? `${str} ${unit}` : str;
    }, [latestEntity, entityStatus]);

    return (
        <div
            ref={containerRef}
            className={cls('ms-rainfall-histogram', {
                'ms-rainfall-histogram--preview': isPreview,
            })}
        >
            <div className="ms-rainfall-histogram__card">
                <div
                    className={cls('ms-rainfall-histogram__header', {
                        'mb-1': matchTablet,
                        'mb-2': !matchTablet,
                    })}
                >
                    <Tooltip className="ms-rainfall-histogram__title" autoEllipsis title={title} />
                </div>
                <div className="ms-rainfall-histogram__body">
                    <div className={cls('ms-rainfall-histogram__value', { 'text-lg': wGrid > 1 && hGrid > 1 })}>
                        <Tooltip autoEllipsis title={displayValue} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default View;
