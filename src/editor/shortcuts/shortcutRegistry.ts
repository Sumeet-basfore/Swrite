import { EditorView } from '@milkdown/prose/view';
import { FormattingCommands } from '../commands/formatting';

export interface ShortcutDefinition {
  id: string;
  category: 'formatting' | 'editing' | 'navigation' | 'modes';
  name: string;
  keys: string;
  description: string;
}

export const SHORTCUT_REGISTRY: ShortcutDefinition[] = [
  // Formatting
  { id: 'bold', category: 'formatting', name: 'Bold', keys: 'Mod+B', description: 'Toggle bold formatting on selection' },
  { id: 'italic', category: 'formatting', name: 'Italic', keys: 'Mod+I', description: 'Toggle italic formatting on selection' },
  { id: 'underline', category: 'formatting', name: 'Underline', keys: 'Mod+U', description: 'Toggle underline formatting on selection' },
  { id: 'strikethrough', category: 'formatting', name: 'Strikethrough', keys: 'Mod+Shift+X', description: 'Toggle strikethrough on selection' },
  { id: 'code', category: 'formatting', name: 'Inline Code', keys: 'Mod+`', description: 'Format selection as inline code' },
  { id: 'h1', category: 'formatting', name: 'Heading 1', keys: 'Mod+Alt+1', description: 'Convert block to Heading 1' },
  { id: 'h2', category: 'formatting', name: 'Heading 2', keys: 'Mod+Alt+2', description: 'Convert block to Heading 2' },
  { id: 'h3', category: 'formatting', name: 'Heading 3', keys: 'Mod+Alt+3', description: 'Convert block to Heading 3' },
  { id: 'paragraph', category: 'formatting', name: 'Paragraph', keys: 'Mod+Alt+0', description: 'Convert block to standard body paragraph' },
  { id: 'blockquote', category: 'formatting', name: 'Blockquote', keys: 'Mod+Shift+Q', description: 'Wrap block in blockquote' },
  { id: 'bullet_list', category: 'formatting', name: 'Bullet List', keys: 'Mod+Shift+8', description: 'Wrap block in bullet list' },
  { id: 'ordered_list', category: 'formatting', name: 'Numbered List', keys: 'Mod+Shift+7', description: 'Wrap block in numbered list' },
  { id: 'scene_break', category: 'formatting', name: 'Scene Break', keys: 'Mod+Shift+D', description: 'Insert ornamental scene break' },
  { id: 'page_break', category: 'formatting', name: 'Page Break', keys: 'Mod+Shift+Enter', description: 'Insert manual page break' },

  // Editing
  { id: 'save', category: 'editing', name: 'Save Document', keys: 'Mod+S', description: 'Force immediate atomic save to disk' },
  { id: 'find', category: 'editing', name: 'Find & Replace', keys: 'Mod+F', description: 'Open in-document search and replace' },
  { id: 'comment', category: 'editing', name: 'Add Comment', keys: 'Mod+Shift+C', description: 'Add editorial review comment on selection' },
  { id: 'bookmark', category: 'editing', name: 'Add Bookmark', keys: 'Mod+Shift+B', description: 'Bookmark current passage for later' },
  { id: 'outline', category: 'editing', name: 'Document Outline', keys: 'Mod+Shift+O', description: 'Toggle document heading outline' },

  // Modes
  { id: 'focus_mode', category: 'modes', name: 'Focus Mode', keys: 'Mod+Shift+F', description: 'Toggle distraction-free canvas' },
  { id: 'reading_mode', category: 'modes', name: 'Reading Mode', keys: 'Mod+Shift+R', description: 'Toggle clean read-only manuscript view' },
  { id: 'source_mode', category: 'modes', name: 'Markdown Source', keys: 'Mod+/', description: 'Switch between Rich and Source Markdown' },

  // Navigation
  { id: 'studio_write', category: 'navigation', name: 'Write Studio', keys: 'Mod+1', description: 'Switch to Write studio' },
  { id: 'studio_plan', category: 'navigation', name: 'Plan Studio', keys: 'Mod+2', description: 'Switch to Plan studio' },
  { id: 'studio_desk', category: 'navigation', name: 'Desk Studio', keys: 'Mod+3', description: 'Switch to Desk studio' },
  { id: 'studio_edit', category: 'navigation', name: 'Edit Studio', keys: 'Mod+4', description: 'Switch to Edit studio' },
  { id: 'studio_publish', category: 'navigation', name: 'Publish Studio', keys: 'Mod+5', description: 'Switch to Publish studio' },
  { id: 'quick_search', category: 'navigation', name: 'File Navigator', keys: 'Mod+P', description: 'Quick jump to any document' },
  { id: 'toggle_sidebar', category: 'navigation', name: 'Toggle Sidebar', keys: 'Mod+B', description: 'Toggle project file sidebar (when no text selected)' },
  { id: 'global_search', category: 'navigation', name: 'Project Search', keys: 'Mod+Shift+F', description: 'Search entire manuscript' },
];

export interface EditorShortcutHandlers {
  onSave?: () => void;
  onFind?: () => void;
  onToggleFocusMode?: () => void;
  onToggleReadingMode?: () => void;
  onToggleSourceMode?: () => void;
  onAddComment?: () => void;
  onAddBookmark?: () => void;
  onToggleOutline?: () => void;
}

/**
 * Checks if the event target is an isolated typing field (like search input, dialog, modal, etc.)
 */
export function isTypingField(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  return Boolean(target.isContentEditable && !target.classList.contains('ProseMirror'));
}

/**
 * Dispatches editor shortcuts with full safety guarantees
 */
export function dispatchEditorKeydown(
  view: EditorView,
  event: KeyboardEvent,
  handlers: EditorShortcutHandlers = {}
): boolean {
  const isMod = event.ctrlKey || event.metaKey;
  const isShift = event.shiftKey;
  const isAlt = event.altKey;
  const key = event.key.toLowerCase();

  // Save: Mod+S
  if (isMod && !isShift && !isAlt && key === 's') {
    event.preventDefault();
    handlers.onSave?.();
    return true;
  }

  // Find: Mod+F
  if (isMod && !isShift && !isAlt && key === 'f') {
    event.preventDefault();
    handlers.onFind?.();
    return true;
  }

  // Toggle Focus Mode: Mod+Shift+F
  if (isMod && isShift && !isAlt && key === 'f') {
    event.preventDefault();
    handlers.onToggleFocusMode?.();
    return true;
  }

  // Toggle Reading Mode: Mod+Shift+R
  if (isMod && isShift && !isAlt && key === 'r') {
    event.preventDefault();
    handlers.onToggleReadingMode?.();
    return true;
  }

  // Toggle Source Mode: Mod+/ or Mod+Shift+M
  if ((isMod && key === '/') || (isMod && isShift && key === 'm')) {
    event.preventDefault();
    handlers.onToggleSourceMode?.();
    return true;
  }

  // Add Comment: Mod+Shift+C
  if (isMod && isShift && !isAlt && key === 'c') {
    event.preventDefault();
    handlers.onAddComment?.();
    return true;
  }

  // Add Bookmark: Mod+Shift+B
  if (isMod && isShift && !isAlt && key === 'b') {
    event.preventDefault();
    handlers.onAddBookmark?.();
    return true;
  }

  // Toggle Outline: Mod+Shift+O
  if (isMod && isShift && !isAlt && key === 'o') {
    event.preventDefault();
    handlers.onToggleOutline?.();
    return true;
  }

  // Scene Break: Mod+Shift+D
  if (isMod && isShift && !isAlt && key === 'd') {
    event.preventDefault();
    return FormattingCommands.insertSceneBreak(view);
  }

  // Page Break: Mod+Shift+Enter or Mod+Enter
  if (isMod && (event.key === 'Enter' || event.code === 'Enter') && isShift) {
    event.preventDefault();
    return FormattingCommands.insertPageBreak(view);
  }

  // Headings: Mod+Alt+1..6
  if (isMod && isAlt && ['1', '2', '3', '4', '5', '6'].includes(key)) {
    event.preventDefault();
    const level = parseInt(key, 10) as 1 | 2 | 3 | 4 | 5 | 6;
    return FormattingCommands.setHeading(view, level);
  }

  // Paragraph: Mod+Alt+0
  if (isMod && isAlt && key === '0') {
    event.preventDefault();
    return FormattingCommands.setParagraph(view);
  }

  // Inline formatting
  if (isMod && !isShift && !isAlt) {
    if (key === 'b') {
      event.preventDefault();
      return FormattingCommands.toggleBold(view);
    }
    if (key === 'i') {
      event.preventDefault();
      return FormattingCommands.toggleItalic(view);
    }
    if (key === 'u') {
      event.preventDefault();
      return FormattingCommands.toggleUnderline(view);
    }
    if (key === '`') {
      event.preventDefault();
      return FormattingCommands.toggleCode(view);
    }
  }

  // Shift combinations
  if (isMod && isShift && !isAlt) {
    if (key === 'x' || key === 's') {
      event.preventDefault();
      return FormattingCommands.toggleStrikethrough(view);
    }
    if (key === '8' || key === '*') {
      event.preventDefault();
      return FormattingCommands.wrapInBulletList(view);
    }
    if (key === '7' || key === '&') {
      event.preventDefault();
      return FormattingCommands.wrapInOrderedList(view);
    }
    if (key === 'q') {
      event.preventDefault();
      return FormattingCommands.wrapInBlockquote(view);
    }
  }

  return false;
}
