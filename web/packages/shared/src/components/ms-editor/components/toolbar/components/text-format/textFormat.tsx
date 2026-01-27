import React, { useMemo } from 'react';
import {
    FormatBoldIcon,
    FormatItalicIcon,
    FormatUnderlinedIcon,
    FormatStrikethroughIcon,
} from '../../../../../icons';

import { ToolbarPart } from '../toolbar-part';
import { useFormat } from './hooks';
import type { TextFormatItemConfig } from '../../../../types';

interface IProps {
    disabled: boolean;
    /** Configuration of the control of show and hide */
    items?: Required<TextFormatItemConfig>['items'];
}
export default React.memo(({ disabled, items }: IProps) => {
    const { textFormatState, onClick } = useFormat();
    const { isBold, isItalic, isUnderline, isStrikethrough } = textFormatState || {};

    /** Controlling Component Visibility */
    const { fontBold, fontItalic, fontUnderline, fontStrikethrough } = useMemo(() => {
        return (items || []).reduce(
            (pre, cur) => {
                const { name, visible } = cur;
                pre[name] = visible ?? true;
                return pre;
            },
            {
                fontBold: true,
                fontItalic: true,
                fontUnderline: true,
                fontStrikethrough: true,
            } as Record<Required<IProps>['items'][number]['name'], boolean>,
        );
    }, [items]);

    return (
        <>
            {fontBold && (
                <ToolbarPart isActive={isBold} disabled={disabled} onClick={() => onClick('bold')}>
                    <FormatBoldIcon color="action" className="ms-toolbar__icon" />
                </ToolbarPart>
            )}
            {fontItalic && (
                <ToolbarPart
                    isActive={isItalic}
                    disabled={disabled}
                    onClick={() => onClick('italic')}
                >
                    <FormatItalicIcon
                        color="action"
                        type="icon-tilt"
                        className="ms-toolbar__icon"
                    />
                </ToolbarPart>
            )}
            {fontUnderline && (
                <ToolbarPart
                    isActive={isUnderline}
                    disabled={disabled}
                    onClick={() => onClick('underline')}
                >
                    <FormatUnderlinedIcon color="action" className="ms-toolbar__icon" />
                </ToolbarPart>
            )}
            {fontStrikethrough && (
                <ToolbarPart
                    isActive={isStrikethrough}
                    disabled={disabled}
                    onClick={() => onClick('strikethrough')}
                >
                    <FormatStrikethroughIcon color="action" className="ms-toolbar__icon" />
                </ToolbarPart>
            )}
        </>
    );
});
