import { $node } from '@milkdown/utils';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { Node as ProseNode } from '@milkdown/prose/model';

/**
 * Scene Break Symbol / Custom Node
 * Serializes to: `* * *`
 */
export const sceneBreakNode = $node('scene_break', () => ({
  group: 'block',
  selectable: true,
  draggable: false,
  atom: true,
  parseDOM: [
    {
      tag: 'div[data-type="scene-break"]',
    },
    {
      tag: 'hr.scene-break',
    },
  ],
  toDOM: () => ['div', { class: 'swrite-scene-break', 'data-type': 'scene-break' }, ['span', { class: 'scene-break-ornament' }, '✦  ✦  ✦']],
  parseMarkdown: {
    match: ({ type, value }: { type: string; value?: string }) =>
      type === 'thematicBreak' && (value === '* * *' || value === '***' || value === '* * * * *'),
    runner: (state, _, type) => {
      state.addNode(type);
    },
  },
  toMarkdown: {
    match: (node: ProseNode) => node.type.name === 'scene_break',
    runner: (state) => {
      state.addNode('thematicBreak', undefined, undefined, { value: '* * *' });
    },
  },
}));

/**
 * Page Break Custom Node
 * Serializes to: `<!-- pagebreak -->`
 */
export const pageBreakNode = $node('page_break', () => ({
  group: 'block',
  selectable: true,
  draggable: false,
  atom: true,
  parseDOM: [
    {
      tag: 'div[data-type="page-break"]',
    },
  ],
  toDOM: () => [
    'div',
    { class: 'swrite-page-break', 'data-type': 'page-break' },
    ['div', { class: 'page-break-line' }],
    ['span', { class: 'page-break-label' }, 'PAGE BREAK'],
    ['div', { class: 'page-break-line' }],
  ],
  parseMarkdown: {
    match: (node: { type: string; value?: string }) =>
      node.type === 'html' && (node.value?.trim() === '<!-- pagebreak -->' || node.value?.trim() === '<!--pagebreak-->'),
    runner: (state, _, type) => {
      state.addNode(type);
    },
  },
  toMarkdown: {
    match: (node: ProseNode) => node.type.name === 'page_break',
    runner: (state) => {
      state.addNode('html', undefined, undefined, { value: '<!-- pagebreak -->\n\n' });
    },
  },
}));

/**
 * ProseMirror Plugin for Highlighting / Decorating Active Line & Focus Mode
 */
export const focusModePluginKey = new PluginKey('swrite-focus-mode');

export function createFocusModePlugin(options: { typewriterMode?: boolean; dimInactive?: boolean }) {
  return new Plugin({
    key: focusModePluginKey,
    props: {
      decorations(state) {
        if (!options.dimInactive) return DecorationSet.empty;
        const { selection } = state;
        const { $from } = selection;
        const currentBlockPos = $from.before(1);
        const currentBlock = state.doc.nodeAt(currentBlockPos);

        if (!currentBlock) return DecorationSet.empty;

        const decorations: Decoration[] = [];
        state.doc.forEach((node, pos) => {
          if (pos !== currentBlockPos && node.isBlock) {
            decorations.push(
              Decoration.node(pos, pos + node.nodeSize, {
                class: 'swrite-dimmed-paragraph',
              })
            );
          } else if (pos === currentBlockPos) {
            decorations.push(
              Decoration.node(pos, pos + node.nodeSize, {
                class: 'swrite-active-paragraph',
              })
            );
          }
        });

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
}
