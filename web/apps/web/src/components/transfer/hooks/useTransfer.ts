import { useState, useEffect, useMemo } from 'react';
import { useMemoizedFn } from 'ahooks';

import type { TransferListProps, TransferItem } from '../interface';

function not(a: readonly TransferItem[], b: readonly TransferItem[]) {
    return a.filter(ai => !b.some(bi => bi.key === ai.key));
}

function intersection(a: readonly TransferItem[], b: readonly TransferItem[]) {
    return a.filter(ai => b.some(bi => bi.key === ai.key));
}

function union(a: readonly TransferItem[], b: readonly TransferItem[]) {
    return [...a, ...not(b, a)];
}

/**
 * use transfer hooks
 */
const useTransfer = (props: TransferListProps) => {
    const { dataSource, targetKeys, selectedKeys, onChange, onSelectChange } = props;

    const [checked, setChecked] = useState<readonly TransferItem[]>([]);
    const [left, setLeft] = useState<readonly TransferItem[]>([]);
    const [right, setRight] = useState<readonly TransferItem[]>([]);

    /**
     * update checked
     */
    useEffect(() => {
        setChecked([...(dataSource || []).filter(d => (selectedKeys || []).includes(d.key))]);
    }, [dataSource, selectedKeys]);

    /**
     * update left / right
     */
    useEffect(() => {
        setLeft([...(dataSource || []).filter(d => !(targetKeys || []).includes(d.key))]);
        setRight([...(dataSource || []).filter(d => (targetKeys || []).includes(d.key))]);
    }, [dataSource, targetKeys]);

    const leftChecked = useMemo(() => {
        return intersection(checked, left);
    }, [checked, left]);

    const rightChecked = useMemo(() => {
        return intersection(checked, right);
    }, [checked, right]);

    const handleToggle = useMemoizedFn((item: TransferItem) => {
        return () => {
            const currentIndex = checked.findIndex(c => c.key === item.key);
            const newChecked = [...checked];

            if (currentIndex === -1) {
                newChecked.push(item);
            } else {
                newChecked.splice(currentIndex, 1);
            }

            setChecked(newChecked);
            onSelectChange?.(newChecked.map(c => c.key));
        };
    });

    const numberOfChecked = useMemoizedFn(
        (items: readonly TransferItem[]) => intersection(checked, items).length,
    );

    const handleToggleAll = useMemoizedFn((items: readonly TransferItem[]) => {
        return () => {
            let newChecked = [];

            if (numberOfChecked(items) === items.length) {
                newChecked = not(checked, items);
            } else {
                newChecked = union(checked, items);
            }

            setChecked(newChecked);
            onSelectChange?.(newChecked.map(c => c.key));
        };
    });

    const handleCheckedRight = useMemoizedFn(() => {
        const result = right.concat(leftChecked);
        const newChecked = not(checked, leftChecked);

        setRight(result);
        setLeft(not(left, leftChecked));
        setChecked(newChecked);

        onChange?.(result.map(c => c.key));
        onSelectChange?.(newChecked.map(c => c.key));
    });

    const handleCheckedLeft = useMemoizedFn(() => {
        const result = not(right, rightChecked);
        const newChecked = not(checked, rightChecked);

        setLeft(left.concat(rightChecked));
        setRight(not(right, rightChecked));
        setChecked(not(checked, rightChecked));

        onChange?.(result.map(c => c.key));
        onSelectChange?.(newChecked.map(c => c.key));
    });

    return {
        checked,
        left,
        right,
        leftChecked,
        rightChecked,
        handleToggle,
        handleToggleAll,
        handleCheckedRight,
        handleCheckedLeft,
        numberOfChecked,
    };
};

export default useTransfer;
