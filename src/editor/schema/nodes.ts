import { $node } from '@milkdown/utils';
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
 * Active-block marking lives in ./activeBlockPlugin (single decoration +
 * CSS :not() dimming). A previous per-node dimming plugin was removed:
 * it was never registered and re-walked the whole doc on every keystroke.
 */
