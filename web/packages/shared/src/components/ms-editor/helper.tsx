import {
    $isTextNode,
    type DOMConversionMap,
    type DOMExportOutput,
    isHTMLElement,
    type Klass,
    LexicalEditor,
    LexicalNode,
    ParagraphNode,
    TextNode,
} from 'lexical';
import { HeadingNode } from '@lexical/rich-text';
import { ExtendedTextNode } from './nodes';

/* eslint-disable no-bitwise */
import { MODE, THEME_PREFIX } from './constant';

/**
 * returns the editor class name
 */
export const getEditorClass = (className: string) => {
    return `${THEME_PREFIX}__${className}`;
};

/**
 * whether editable
 * @param mode
 */
export const hasEditable = (mode: number | MODE) => {
    return !!(mode & MODE.EDITABLE);
};

/**
 * whether read only
 * @param mode
 */
export const hasReadOnly = (mode: number | MODE) => {
    return !!(mode & MODE.READONLY);
};

/**
 * get editor container html node
 */
export const getEditorContent = () => {
    return document.querySelector('.ms-editor-content') as HTMLElement;
};
/**
 * Remove all classes if the element is an HTMLElement
 * Children are checked as well since TextNode can be nested
 * in i, b, and strong tags.
 */
export const removeStylesExportDOM = (
    editor: LexicalEditor,
    target: LexicalNode,
): DOMExportOutput => {
    const output = target.exportDOM(editor);

    if (output?.element && isHTMLElement(output.element)) {
        for (const el of [
            output.element,
            ...output.element.querySelectorAll('[class],[dir="ltr"]'),
        ]) {
            el.removeAttribute('class');
            if (el.getAttribute('dir') === 'ltr') {
                el.removeAttribute('dir');
            }
        }
    }

    return output;
};

/**
 * html export map
 */
export const exportMap: Map<
    Klass<LexicalNode>,
    (editor: LexicalEditor, target: LexicalNode) => DOMExportOutput
> = new Map<Klass<LexicalNode>, (editor: LexicalEditor, target: LexicalNode) => DOMExportOutput>([
    [ParagraphNode, removeStylesExportDOM],
    [ExtendedTextNode, removeStylesExportDOM],
    [HeadingNode, removeStylesExportDOM],
]);

/**
 * limit font size
 */
const MIN_ALLOWED_FONT_SIZE = 8;
const MAX_ALLOWED_FONT_SIZE = 72;
const parseAllowedFontSize = (input: string): string => {
    const match = input.match(/^(\d+(?:\.\d+)?)px$/);
    if (!match) return '';

    const n = Number(match[1]);
    if (n >= MIN_ALLOWED_FONT_SIZE && n <= MAX_ALLOWED_FONT_SIZE) {
        return input;
    }

    return '';
};

/**
 * Parse styles from pasted input, but only if they match exactly the
 * sort of styles that would be produced by exportDOM
 */
export const getExtraStyles = (element: HTMLElement): string => {
    let extraStyles = '';
    const fontSize = parseAllowedFontSize(element.style.fontSize);

    if (fontSize !== '' && fontSize !== '14px') {
        extraStyles += `font-size: ${fontSize};`;
    }

    return extraStyles;
};

/**
 * Wrap all TextNode importers with a function that also imports
 * the custom styles implemented by the playground
 */
export const constructImportMap = (): DOMConversionMap => {
    const importMap: DOMConversionMap = {};

    for (const [tag, fn] of Object.entries(TextNode.importDOM() || {})) {
        importMap[tag] = importNode => {
            const importer = fn(importNode);

            if (!importer) {
                return null;
            }

            return {
                ...importer,
                conversion: element => {
                    const output = importer.conversion(element);
                    if (
                        output === null ||
                        output?.forChild === undefined ||
                        output?.after !== undefined ||
                        output?.node !== null
                    ) {
                        return output;
                    }

                    const extraStyles = getExtraStyles(element);
                    if (extraStyles) {
                        const { forChild } = output;
                        return {
                            ...output,
                            forChild: (child, parent) => {
                                const textNode = forChild(child, parent);
                                if ($isTextNode(textNode)) {
                                    textNode.setStyle(textNode.getStyle() + extraStyles);
                                }

                                return textNode;
                            },
                        };
                    }

                    return output;
                },
            };
        };
    }

    return importMap;
};
