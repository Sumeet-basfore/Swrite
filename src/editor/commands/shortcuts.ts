export * from '../shortcuts/shortcutRegistry';
import { EditorView } from '@milkdown/prose/view';
import { dispatchEditorKeydown, EditorShortcutHandlers } from '../shortcuts/shortcutRegistry';

export type ShortcutCallbacks = EditorShortcutHandlers;

export function handleEditorKeydown(
  view: EditorView,
  event: KeyboardEvent,
  callbacks: ShortcutCallbacks = {}
): boolean {
  return dispatchEditorKeydown(view, event, callbacks);
}
