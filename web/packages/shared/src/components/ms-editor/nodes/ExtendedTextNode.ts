import {
    $isTextNode,
    DOMConversion,
    DOMConversionMap,
    DOMConversionOutput,
    TextNode,
    SerializedTextNode,
    LexicalNode,
} from 'lexical';

const EXTENDED_TEXT_TYPE = 'extended-text';

function patchStyleConversion(
    originalDOMConverter?: (node: HTMLElement) => DOMConversion | null,
): (node: HTMLElement) => DOMConversionOutput | null {
    return node => {
        const original = originalDOMConverter?.(node);
        if (!original) {
            return null;
        }
        const originalOutput = original.conversion(node);

        if (!originalOutput) {
            return originalOutput;
        }

        const {
            backgroundColor,
            color,
            fontFamily,
            fontWeight,
            fontSize,
            textDecoration,
            whiteSpace,
        } = node.style || {};

        return {
            ...originalOutput,
            forChild: (lexicalNode, parent) => {
                const originalForChild = originalOutput?.forChild ?? (x => x);
                const result = originalForChild(lexicalNode, parent);
                if ($isTextNode(result)) {
                    const style = [
                        backgroundColor ? `background-color: ${backgroundColor}` : null,
                        color ? `color: ${color}` : null,
                        fontFamily ? `font-family: ${fontFamily}` : null,
                        fontWeight ? `font-weight: ${fontWeight}` : null,
                        fontSize ? `font-size: ${fontSize}` : null,
                        textDecoration ? `text-decoration: ${textDecoration}` : null,
                        whiteSpace ? `white-space: ${whiteSpace}` : null,
                    ]
                        .filter(value => value != null)
                        .join('; ');
                    if (style.length) {
                        return result.setStyle(style);
                    }
                }
                return result;
            },
        };
    };
}

export class ExtendedTextNode extends TextNode {
    static getType(): string {
        return EXTENDED_TEXT_TYPE;
    }

    static clone(node: ExtendedTextNode): ExtendedTextNode {
        return new ExtendedTextNode(node.__text, node.__key);
    }

    static importDOM(): DOMConversionMap | null {
        const importers = TextNode.importDOM();
        return {
            ...importers,
            code: () => ({
                conversion: patchStyleConversion(importers?.code),
                priority: 1,
            }),
            em: () => ({
                conversion: patchStyleConversion(importers?.em),
                priority: 1,
            }),
            span: () => ({
                conversion: patchStyleConversion(importers?.span),
                priority: 1,
            }),
            strong: () => ({
                conversion: patchStyleConversion(importers?.strong),
                priority: 1,
            }),
            sub: () => ({
                conversion: patchStyleConversion(importers?.sub),
                priority: 1,
            }),
            sup: () => ({
                conversion: patchStyleConversion(importers?.sup),
                priority: 1,
            }),
        };
    }

    static importJSON(serializedNode: SerializedTextNode): TextNode {
        return super.importJSON(serializedNode);
    }

    isSimpleText() {
        return this.__type === EXTENDED_TEXT_TYPE && this.__mode === 0;
    }

    exportJSON(): SerializedTextNode {
        return {
            ...super.exportJSON(),
            type: EXTENDED_TEXT_TYPE,
        };
    }
}

export function $isExtendedTextNode(
    node: LexicalNode | null | undefined,
): node is ExtendedTextNode {
    return node instanceof ExtendedTextNode;
}
