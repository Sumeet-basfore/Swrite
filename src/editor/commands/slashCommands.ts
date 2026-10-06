import { EditorView } from '@milkdown/prose/view';
import { FormattingCommands } from './formatting';
import { TableCommands } from './tableCommands';

export interface SlashActionContext {
  onOpenFind?: () => void;
  onOpenLinkModal?: () => void;
  onOpenImageModal?: () => void;
  onOpenCommentModal?: () => void;
  onToggleFocusMode?: () => void;
  onToggleReadingMode?: () => void;
}

export interface SlashAction {
  id: string;
  title: string;
  subtitle: string;
  shortcut?: string;
  keywords: string[];
  icon: string;
  run: (view: EditorView, context?: SlashActionContext) => void;
}

export const SLASH_ACTIONS: SlashAction[] = [
  // Headings
  {
    id: 'h1',
    title: 'Heading 1',
    subtitle: 'Major section / Chapter title',
    shortcut: 'Mod+Alt+1',
    keywords: ['h1', 'heading', 'title', 'chapter'],
    icon: 'Heading1',
    run: (view) => FormattingCommands.setHeading(view, 1),
  },
  {
    id: 'h2',
    title: 'Heading 2',
    subtitle: 'Sub-section / Scene title',
    shortcut: 'Mod+Alt+2',
    keywords: ['h2', 'heading', 'scene', 'subtitle'],
    icon: 'Heading2',
    run: (view) => FormattingCommands.setHeading(view, 2),
  },
  {
    id: 'h3',
    title: 'Heading 3',
    subtitle: 'Minor sub-heading or narrative beat',
    shortcut: 'Mod+Alt+3',
    keywords: ['h3', 'heading', 'beat', 'sub'],
    icon: 'Heading3',
    run: (view) => FormattingCommands.setHeading(view, 3),
  },
  {
    id: 'text',
    title: 'Plain Text',
    subtitle: 'Body paragraph text',
    shortcut: 'Mod+Alt+0',
    keywords: ['text', 'paragraph', 'body', 'plain'],
    icon: 'Pilcrow',
    run: (view) => FormattingCommands.setParagraph(view),
  },

  // Inline Formatting
  {
    id: 'bold',
    title: 'Bold',
    subtitle: 'Strong emphasis',
    shortcut: 'Mod+B',
    keywords: ['bold', 'strong', 'emphasis'],
    icon: 'Bold',
    run: (view) => FormattingCommands.toggleBold(view),
  },
  {
    id: 'italic',
    title: 'Italic',
    subtitle: 'Slanted emphasis or internal monologue',
    shortcut: 'Mod+I',
    keywords: ['italic', 'em', 'emphasis', 'thought'],
    icon: 'Italic',
    run: (view) => FormattingCommands.toggleItalic(view),
  },
  {
    id: 'underline',
    title: 'Underline',
    subtitle: 'Underlined text',
    shortcut: 'Mod+U',
    keywords: ['underline'],
    icon: 'Underline',
    run: (view) => FormattingCommands.toggleUnderline(view),
  },
  {
    id: 'strike',
    title: 'Strikethrough',
    subtitle: 'Cross out text',
    shortcut: 'Mod+Shift+X',
    keywords: ['strike', 'strikethrough', 'delete'],
    icon: 'Strikethrough',
    run: (view) => FormattingCommands.toggleStrikethrough(view),
  },
  {
    id: 'code',
    title: 'Inline Code',
    subtitle: 'Monospace code span',
    shortcut: 'Mod+`',
    keywords: ['code', 'inline', 'monospace'],
    icon: 'Code',
    run: (view) => FormattingCommands.toggleCode(view),
  },

  // Blocks & Quotes
  {
    id: 'quote',
    title: 'Blockquote',
    subtitle: 'Epigraph, excerpt, or letter',
    shortcut: 'Mod+Shift+Q',
    keywords: ['quote', 'blockquote', 'epigraph', 'letter'],
    icon: 'Quote',
    run: (view) => FormattingCommands.wrapInBlockquote(view),
  },
  {
    id: 'bullet',
    title: 'Bullet List',
    subtitle: 'Unordered bullet points',
    shortcut: 'Mod+Shift+8',
    keywords: ['bullet', 'list', 'unordered'],
    icon: 'List',
    run: (view) => FormattingCommands.wrapInBulletList(view),
  },
  {
    id: 'numbered',
    title: 'Numbered List',
    subtitle: 'Sequential ordered list',
    shortcut: 'Mod+Shift+7',
    keywords: ['number', 'numbered', 'ordered', 'list'],
    icon: 'ListOrdered',
    run: (view) => FormattingCommands.wrapInOrderedList(view),
  },
  {
    id: 'checklist',
    title: 'Checklist / Task List',
    subtitle: 'Interactive task items',
    keywords: ['checklist', 'task', 'todo', 'check'],
    icon: 'CheckSquare',
    run: (view) => {
      const { state, dispatch } = view;
      const textNode = state.schema.text('- [ ] ');
      const tr = state.tr.replaceSelectionWith(textNode).scrollIntoView();
      dispatch(tr);
    },
  },
  {
    id: 'table',
    title: 'Table (3x3)',
    subtitle: 'Structured tabular data grid',
    keywords: ['table', 'grid', 'columns', 'rows'],
    icon: 'Table',
    run: (view) => TableCommands.insertTable(view, 3, 3),
  },

  // Media & Links
  {
    id: 'link',
    title: 'Link',
    subtitle: 'Insert or edit hyperlink',
    shortcut: 'Mod+K',
    keywords: ['link', 'url', 'href', 'web'],
    icon: 'Link',
    run: (view, ctx) => {
      if (ctx?.onOpenLinkModal) {
        ctx.onOpenLinkModal();
      } else {
        FormattingCommands.insertLink(view, 'https://', 'Link Text');
      }
    },
  },
  {
    id: 'image',
    title: 'Image',
    subtitle: 'Insert illustration or reference image',
    keywords: ['image', 'picture', 'photo', 'art', 'illustration'],
    icon: 'Image',
    run: (view, ctx) => {
      if (ctx?.onOpenImageModal) {
        ctx.onOpenImageModal();
      } else {
        FormattingCommands.insertImage(view, 'image.png', 'Illustration');
      }
    },
  },

  // Dividers & Breaks
  {
    id: 'divider',
    title: 'Horizontal Divider',
    subtitle: 'Standard separator line (---)',
    keywords: ['divider', 'line', 'separator', 'hr'],
    icon: 'Minus',
    run: (view) => FormattingCommands.insertSceneBreak(view),
  },
  {
    id: 'scene-break',
    title: 'Scene Break',
    subtitle: 'Ornamental scene separator (✦ ✦ ✦)',
    shortcut: 'Mod+Shift+D',
    keywords: ['scene', 'break', 'separator', 'divider', 'ornament', 'star'],
    icon: 'Sparkles',
    run: (view) => FormattingCommands.insertSceneBreak(view),
  },
  {
    id: 'page-break',
    title: 'Page Break',
    subtitle: 'Force manuscript page boundary',
    shortcut: 'Mod+Shift+Enter',
    keywords: ['page', 'break', 'section', 'pagebreak'],
    icon: 'FileText',
    run: (view) => FormattingCommands.insertPageBreak(view),
  },

  // Notes & Editorial
  {
    id: 'note',
    title: 'Author Note',
    subtitle: 'Lightweight inline scratch comment',
    keywords: ['note', 'scratch', 'todo', 'idea', 'author'],
    icon: 'StickyNote',
    run: (view) => {
      const { state, dispatch } = view;
      const textNode = state.schema.text('> [!NOTE] Author note: \n');
      const tr = state.tr.replaceSelectionWith(textNode).scrollIntoView();
      dispatch(tr);
    },
  },
  {
    id: 'comment',
    title: 'Editorial Comment',
    subtitle: 'Anchor review comment on text',
    shortcut: 'Mod+Shift+C',
    keywords: ['comment', 'review', 'feedback', 'annotation'],
    icon: 'MessageSquare',
    run: (_view, ctx) => {
      ctx?.onOpenCommentModal?.();
    },
  },
  {
    id: 'bookmark',
    title: 'Bookmark',
    subtitle: 'Tag spot to fix or revisit later',
    shortcut: 'Mod+Shift+B',
    keywords: ['bookmark', 'mark', 'flag', 'fix', 'later'],
    icon: 'Bookmark',
    run: (view) => FormattingCommands.insertBookmark(view, 'Revisit later'),
  },

  // Author Workflow
  {
    id: 'scene',
    title: 'New Scene Heading',
    subtitle: 'Insert H2 with scene separator',
    keywords: ['scene', 'new scene', 'section'],
    icon: 'Feather',
    run: (view) => {
      FormattingCommands.insertSceneBreak(view);
      FormattingCommands.setHeading(view, 2);
    },
  },
  {
    id: 'chapter',
    title: 'New Chapter Title',
    subtitle: 'Insert page break and Chapter H1',
    keywords: ['chapter', 'new chapter', 'act'],
    icon: 'BookOpen',
    run: (view) => {
      FormattingCommands.insertPageBreak(view);
      FormattingCommands.setHeading(view, 1);
    },
  },
  {
    id: 'wordcount',
    title: 'Word Count Stats',
    subtitle: 'Inspect live statistics',
    keywords: ['wordcount', 'words', 'statistics', 'count', 'length'],
    icon: 'BarChart2',
    run: () => {},
  },
  {
    id: 'find',
    title: 'Find & Replace',
    subtitle: 'Search within active document',
    shortcut: 'Mod+F',
    keywords: ['find', 'search', 'replace', 'lookup'],
    icon: 'Search',
    run: (_view, ctx) => ctx?.onOpenFind?.(),
  },
  {
    id: 'focus',
    title: 'Toggle Focus Mode',
    subtitle: 'Distraction-free writing surface',
    shortcut: 'Mod+Shift+F',
    keywords: ['focus', 'distraction', 'zen', 'fullscreen'],
    icon: 'Eye',
    run: (_view, ctx) => ctx?.onToggleFocusMode?.(),
  },
  {
    id: 'reading',
    title: 'Toggle Reading Mode',
    subtitle: 'Clean read-only presentation',
    shortcut: 'Mod+Shift+R',
    keywords: ['reading', 'read', 'presentation', 'proof'],
    icon: 'Book',
    run: (_view, ctx) => ctx?.onToggleReadingMode?.(),
  },
];

export function filterSlashActions(query: string): SlashAction[] {
  if (!query || query.trim() === '') {
    return SLASH_ACTIONS;
  }
  const clean = query.toLowerCase().trim().replace(/^\//, '');
  return SLASH_ACTIONS.filter(
    (action) =>
      action.id.toLowerCase().includes(clean) ||
      action.title.toLowerCase().includes(clean) ||
      action.subtitle.toLowerCase().includes(clean) ||
      action.keywords.some((k) => k.includes(clean))
  );
}
