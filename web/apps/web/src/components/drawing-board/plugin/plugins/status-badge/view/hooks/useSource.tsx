import { useEffect } from 'react';
import { useRequest } from 'ahooks';
import { awaitWrap, entityAPI, getResponseData, isRequestSuccess } from '@/services/http';
import { useActivityEntity } from '@/components/drawing-board/plugin/hooks';

interface IProps {
    widgetId: ApiKey;
    dashboardId: ApiKey;
    entity: EntityOptionType | undefined;
}

export function useSource(props: IProps) {
    const { entity, widgetId, dashboardId } = props;

    const { data: entityStatus, run: getEntityStatusValue } = useRequest(
        async () => {
            if (!entity?.value) return;
            const [error, resp] = await awaitWrap(
                entityAPI.getEntityStatus({ id: entity.value }),
            );
            if (error || !isRequestSuccess(resp)) return;
            return getResponseData(resp);
        },
        { manual: true, debounceWait: 300 },
    );

    useEffect(() => {
        getEntityStatusValue();
    }, [entity?.value]);

    const { addEntityListener } = useActivityEntity();
    useEffect(() => {
        const entityId = entity?.value;
        if (!widgetId || !dashboardId || !entityId) return;
        const remove = addEntityListener(entityId, {
            widgetId,
            dashboardId,
            callback: getEntityStatusValue,
        });
        return remove;
    }, [entity?.value, widgetId, dashboardId, addEntityListener, getEntityStatusValue]);

    return { entityStatus };
}
