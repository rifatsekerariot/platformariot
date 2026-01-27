import { useMemo } from 'react';
import { FontSize, FontColor, TextFormat, TextAlign, TablePart, BlockFormat } from '../components';
import type { IEditorProps, TextAlignItemConfig, TextFormatItemConfig } from '../../../types';

type IProps = Pick<IEditorProps, 'editorConfig' | 'enableTable'>;
export const useGroup = ({ editorConfig, enableTable = false }: IProps) => {
    const groupList = useMemo(() => {
        return [
            {
                type: 'blockFormat',
                Component: BlockFormat,
            },
            {
                type: 'fontSize',
                Component: FontSize,
            },
            {
                type: 'textFormat',
                Component: TextFormat,
                hidden: (items: TextFormatItemConfig['items']) => {
                    return ['fontBold', 'fontItalic', 'fontUnderline', 'fontStrikethrough'].every(
                        key => {
                            return items?.find(item => item.name === key)?.visible === false;
                        },
                    );
                },
            },
            {
                type: 'fontColor',
                Component: FontColor,
            },
            {
                type: 'textAlign',
                Component: TextAlign,
                hidden: (items: TextAlignItemConfig['items']) => {
                    return ['textAlignLeft', 'textAlignCenter', 'textAlignRight'].every(key => {
                        return items?.find(item => item.name === key)?.visible === false;
                    });
                },
            },
            ...(enableTable
                ? [
                      {
                          type: 'table',
                          Component: TablePart,
                      },
                  ]
                : []),
        ];
    }, [enableTable]);

    return useMemo(() => {
        const { toolbar = true } = editorConfig || {};
        if (typeof toolbar === 'boolean') return groupList;

        return groupList
            .map(item => {
                const { type, Component, hidden } = item;
                const toolbarItem = toolbar.find(toolbarItem => toolbarItem.name === type);
                if (!toolbarItem) return item;

                const { visible, initConfig, items } = (toolbarItem as any) || {};
                if (visible === false) return null;
                if (items && hidden?.(items)) return null;

                const props = {
                    initConfig,
                    items,
                };
                return {
                    type,
                    Component,
                    props,
                };
            })
            .filter(Boolean);
    }, [editorConfig, groupList]);
};
