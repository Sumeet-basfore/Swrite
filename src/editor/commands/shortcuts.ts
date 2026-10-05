import { EditorView } from '@milkdown/prose/view';
import { FormattingCommands } from './formatting';

export interface ShortcutCallbacks {
  onToggleFocusMode?: () => void;
  onToggleSourceMode?: () => void;
  onSave?: () => void;
}

export function handleEditorKeydown(
  view: EditorView,
  event: KeyboardEvent,
  callbacks: ShortcutCallbacks = {}
): boolean {
  const isMod = event.ctrlKey || event.metaKey;
  const isShift = event.shiftKey;
  const isAlt = event.altKey;
  const key = event.key.toLowerCase();

  // Save: Mod+S
  if (isMod && !isShift && !isAlt && key === 's') {
    event.preventDefault();
    callbacks.onSave?.();
    return true;
  }

  // Toggle Focus Mode: Mod+Shift+F
  if (isMod && isShift && key === 'f') {
    event.preventDefault();
    callbacks.onToggleFocusMode?.();
    return true;
  }

  // Toggle Source Mode: Mod+/ or Mod+Shift+M
  if ((isMod && key === '/') || (isMod && isShift && key === 'm')) {
    event.preventDefault();
    callbacks.onToggleSourceMode?.();
    return true;
  }

  // Scene Break: Mod+Shift+D
  if (isMod && isShift && key === 'd') {
    event.preventDefault();
    return FormattingCommands.insertSceneBreak(view);
  }

  // Page Break: Mod+Enter
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

  // Formatting shortcuts
  if (isMod && !isShift && !isAlt) {
    if (key === 'b') {
      event.preventDefault();
      return FormattingCommands.toggleBold(view);
    }
    if (key === 'i') {
      event.preventDefault();
      return FormattingCommands.toggleItalic(view);
    }
    if (key === '`') {
      event.preventDefault();
      return FormattingCommands.toggleCode(view);
    }
  }

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
