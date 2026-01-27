import type { LexicalEditor, SerializedEditorState, SerializedLexicalNode } from 'lexical';
import type { InsertTableCommandPayload } from '@lexical/table';
import { MODE } from '../constant';

/** editor instance type */
export type MSEditor = LexicalEditor;
export interface IEditorProps {
    /** default edit mode */
    defaultEditable?: boolean;
    /** whether editable */
    isEditable?: boolean;
    onEditableChange?: (editable: boolean) => void;
    mode?: MODE;
    /** enter prompt text */
    placeholder?: string;
    onSave?: (content: SerializedEditorState<SerializedLexicalNode>) => void;
    onCancel?: () => Promise<void> | void;
    editorConfig?: EditorConfig;
    /** render custom component to operate */
    renderOperator?: (node: React.ReactNode) => React.ReactNode;
    /** whether auto focus */
    autoFocus?: boolean;
    /** render custom toolbar */
    renderToolbar?: React.ReactNode;
    /** extra custom toolbar */
    extraToolbar?: React.ReactNode;
    /** the editor state change callbacks */
    onChange?: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;
    /** enable table functions */
    enableTable?: boolean;
}
export interface EditorConfig {
    /** toolbar config */
    toolbar?:
        | (
              | FontSizeItemConfig
              | TextFormatItemConfig
              | FontColorItemConfig
              | TextAlignItemConfig
              | TableItemConfig
          )[]
        | boolean;
    /** plugin config */
    plugin?: EditorPlugin;
}

export interface EditorPlugin {
    table: (HoverActionTablePlugin | CellResizeTablePlugin | actionMenuTablePlugin)[];
}
export interface EditorTablePlugin<T extends string> {
    name: T;
    load?: boolean;
}
export interface HoverActionTablePlugin extends EditorTablePlugin<'table-hover-action'> {
    config?: {
        row?: boolean;
        column?: boolean;
    };
}
export interface CellResizeTablePlugin extends EditorTablePlugin<'table-cell-resizer'> {
    config?: {
        row?: boolean;
        column?: boolean;
    };
}
export interface actionMenuTablePlugin extends EditorTablePlugin<'table-action-menu'> {
    config?: {
        /** operation menu display config handle */
        menus: Partial<Record<MenuType, boolean>>;
        /** whether show divider */
        isDivider?: boolean;
    };
}

/** toolbar config */
export interface ToolbarItemConfig<T extends string = string> {
    name: T;
    visible?: boolean;
}
/** font size config */
export type FontSizeItemConfig = ToolbarItemConfig<'fontSize'>;

/** text format config */
export interface TextFormatItemConfig extends ToolbarItemConfig<'textFormat'> {
    items?: ToolbarItemConfig<'fontBold' | 'fontItalic' | 'fontUnderline' | 'fontStrikethrough'>[];
}
/** font color config */
export type FontColorItemConfig = ToolbarItemConfig<'fontColor'>;

/** text align config */
export interface TextAlignItemConfig extends ToolbarItemConfig<'textAlign'> {
    items?: ToolbarItemConfig<'textAlignLeft' | 'textAlignCenter' | 'textAlignRight'>[];
}
/** table config */
export interface TableItemConfig extends ToolbarItemConfig<'table'> {
    initConfig?: Partial<InsertTableCommandPayload>;
}

export interface EditorHandlers {
    /** get editor instance */
    getEditor: () => MSEditor;
    /** get editor html content result */
    getEditorHtml: () => Promise<string>;
    setEditorContent: (content: string | SerializedEditorState) => void;
    /** insert text content to current selection */
    insertTextContent: (text: string) => void;
    /** HTML -> Lexical */
    setEditorHtmlContent: (htmlString: string, isFocus?: boolean) => void;
}

/** toolbar props */
export interface ToolbarProps {
    className?: string;
    disabled?: boolean;
    /** whether selected */
    isActive?: boolean;
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    children: React.ReactNode;
}

/** table context menu all type */
export type MenuType =
    | 'insertAbove'
    | 'insertBelow'
    | 'insertLeft'
    | 'insertRight'
    | 'deleteRow'
    | 'deleteColumn'
    | 'deleteTable'
    | 'toggleRowHeader'
    | 'toggleColumnHeader'
    | 'mergeCells'
    | 'unMergeCells';

export type * from 'lexical';
export type * from '@lexical/table';
