import React, { useMemo } from 'react';
import {
    FormatAlignCenterIcon,
    FormatAlignLeftIcon,
    FormatAlignRightIcon,
} from '../../../../../icons';
import { ToolbarPart } from '../toolbar-part';
import { useAlign } from './hooks';
import type { TextAlignItemConfig } from '../../../../types';

interface IProps {
    disabled: boolean;
    /** Configuration of the control of show and hide */
    items?: Required<TextAlignItemConfig>['items'];
}
export default React.memo(({ disabled, items }: IProps) => {
    const { textAlignState, onClick } = useAlign();
    const { isLeft, isCenter, isRight } = textAlignState || {};

    /** Controlling Component Visibility */
    const { textAlignLeft, textAlignCenter, textAlignRight } = useMemo(() => {
        return (items || []).reduce(
            (pre, cur) => {
                const { name, visible } = cur;
                pre[name] = visible ?? true;
                return pre;
            },
            {
                textAlignLeft: true,
                textAlignCenter: true,
                textAlignRight: true,
            } as Record<Required<IProps>['items'][number]['name'], boolean>,
        );
    }, [items]);

    return (
        <>
            {textAlignLeft && (
                <ToolbarPart disabled={disabled} isActive={isLeft} onClick={() => onClick('left')}>
                    <FormatAlignLeftIcon className="ms-toolbar__icon" />
                </ToolbarPart>
            )}
            {textAlignCenter && (
                <ToolbarPart
                    disabled={disabled}
                    isActive={isCenter}
                    onClick={() => onClick('center')}
                >
                    <FormatAlignCenterIcon className="ms-toolbar__icon" />
                </ToolbarPart>
            )}
            {textAlignRight && (
                <ToolbarPart
                    disabled={disabled}
                    isActive={isRight}
                    onClick={() => onClick('right')}
                >
                    <FormatAlignRightIcon className="ms-toolbar__icon" />
                </ToolbarPart>
            )}
        </>
    );
});
