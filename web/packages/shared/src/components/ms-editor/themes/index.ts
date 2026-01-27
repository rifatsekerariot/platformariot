import type { EditorThemeClasses } from 'lexical';
import { getEditorClass } from '../helper';

import { TableEditorTheme } from './table';
import { TextEditorTheme } from './text';

/** normal css editor theme define */
export const EditorTheme: EditorThemeClasses = {
    paragraph: getEditorClass('paragraph'),
    ...TableEditorTheme, // table theme class
    ...TextEditorTheme, // text theme class
};
