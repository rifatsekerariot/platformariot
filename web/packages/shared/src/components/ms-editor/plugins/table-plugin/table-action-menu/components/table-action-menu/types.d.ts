import { MenuType } from '../../../../../types';

export type MenuDividerType = {
    type: 'divider';
};
export type MenuItemType = {
    key: MenuType;
    text: string;
};
export type ItemType = MenuDividerType | MenuItemType;
