import { useEffect, useMemo } from 'react';
import { useRequest } from 'ahooks';
import { awaitWrap, entityAPI, getResponseData, isRequestSuccess } from '@/services/http';
import { useActivityEntity } from '@/components/drawing-board/plugin/hooks';

export type StatusMap = Record<string, { value?: unknown; timestamp?: number } | undefined>;

interface IProps {
    widgetId: ApiKey;
    dashboardId: ApiKey;
    entities: (EntityOptionType | undefined | null)[];
}

export function useSource(props: IProps) {
    const { entities, widgetId, dashboardId } = props;
    const list = useMemo(
        () => (entities || []).filter((e): e is EntityOptionType => !!e?.value),
        [entities],
    );

    const { data: statusMap, run: runFetch } = useRequest(
        async (lst: EntityOptionType[]): Promise<StatusMap> => {
            const map: StatusMap = {};
            await Promise.all(
                lst.map(async entity => {
                    const id = entity.value;
                    if (!id) return;
                    const [err, resp] = await awaitWrap(
                        entityAPI.getEntityStatus({ id }),
                    );
                    if (err || !isRequestSuccess(resp)) return;
                    const d = getResponseData(resp);
                    map[String(id)] = d;
                }),
            );
            return map;
        },
        { manual: true, debounceWait: 300 },
    );

    const listKey = useMemo(() => list.map(e => e.value).join(','), [list]);

    useEffect(() => {
        if (list.length) runFetch(list);
    }, [listKey, list.length, runFetch]);

    const { addEntityListener } = useActivityEntity();
    const entityIds = useMemo(() => list.map(e => e.value), [list]);

    useEffect(() => {
        if (!widgetId || !dashboardId || !entityIds.length) return;
        const remove = addEntityListener(entityIds, {
            widgetId,
            dashboardId,
            callback: () => runFetch(list),
        });
        return remove;
    }, [listKey, widgetId, dashboardId, addEntityListener, runFetch]);

    return { statusMap: statusMap ?? {} };
}
