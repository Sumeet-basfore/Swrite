import { EditorView } from '@milkdown/prose/view';
import { FormattingCommands } from './formatting';

export interface SlashAction {
  id: string;
  title: string;
  subtitle: string;
  shortcut?: string;
  keywords: string[];
  icon: string;
  run: (view: EditorView) => void;
}

export const SLASH_ACTIONS: SlashAction[] = [
  {
    id: 'h1',
    title: 'Heading 1',
    subtitle: 'Major section / Chapter title',
    shortcut: '# / Ctrl+Alt+1',
    keywords: ['h1', 'heading', 'title', 'chapter'],
    icon: 'Heading1',
    run: (view) => FormattingCommands.setHeading(view, 1),
  },
  {
    id: 'h2',
    title: 'Heading 2',
    subtitle: 'Sub-section / Scene title',
    shortcut: '## / Ctrl+Alt+2',
    keywords: ['h2', 'heading', 'scene', 'subtitle'],
    icon: 'Heading2',
    run: (view) => FormattingCommands.setHeading(view, 2),
  },
  {
    id: 'h3',
    title: 'Heading 3',
    subtitle: 'Minor sub-heading or beat',
    shortcut: '### / Ctrl+Alt+3',
    keywords: ['h3', 'heading', 'beat', 'sub'],
    icon: 'Heading3',
    run: (view) => FormattingCommands.setHeading(view, 3),
  },
  {
    id: 'paragraph',
    title: 'Text Paragraph',
    subtitle: 'Plain literary body text',
    shortcut: 'Ctrl+Alt+0',
    keywords: ['text', 'paragraph', 'body', 'plain'],
    icon: 'Pilcrow',
    run: (view) => FormattingCommands.setParagraph(view),
  },
  {
    id: 'scene_break',
    title: 'Scene Break',
    subtitle: 'Ornamental scene separator (✦ ✦ ✦)',
    shortcut: '*** / Ctrl+Shift+D',
    keywords: ['scene', 'break', 'separator', 'divider', 'ornament'],
    icon: 'Sparkles',
    run: (view) => FormattingCommands.insertSceneBreak(view),
  },
  {
    id: 'page_break',
    title: 'Page Break',
    subtitle: 'Force manuscript page boundary',
    shortcut: 'Ctrl+Enter',
    keywords: ['page', 'break', 'section', 'pagebreak'],
    icon: 'FileText',
    run: (view) => FormattingCommands.insertPageBreak(view),
  },
  {
    id: 'quote',
    title: 'Blockquote',
    subtitle: 'Epigraph, excerpt, or letter',
    shortcut: '> ',
    keywords: ['quote', 'blockquote', 'epigraph', 'letter'],
    icon: 'Quote',
    run: (view) => FormattingCommands.wrapInBlockquote(view),
  },
  {
    id: 'bullet_list',
    title: 'Bullet List',
    subtitle: 'Unordered point list',
    shortcut: '- / * ',
    keywords: ['bullet', 'list', 'unordered'],
    icon: 'List',
    run: (view) => FormattingCommands.wrapInBulletList(view),
  },
  {
    id: 'ordered_list',
    title: 'Numbered List',
    subtitle: 'Sequential step list',
    shortcut: '1. ',
    keywords: ['number', 'ordered', 'list', 'sequence'],
    icon: 'ListOrdered',
    run: (view) => FormattingCommands.wrapInOrderedList(view),
  },
];

export function filterSlashActions(query: string): SlashAction[] {
  if (!query || query.trim() === '') {
    return SLASH_ACTIONS;
  }
  const clean = query.toLowerCase().trim();
  return SLASH_ACTIONS.filter(
    (action) =>
      action.title.toLowerCase().includes(clean) ||
      action.subtitle.toLowerCase().includes(clean) ||
      action.keywords.some((k) => k.includes(clean))
  );
}
