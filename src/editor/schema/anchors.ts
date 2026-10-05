import { EditorState } from '@milkdown/prose/state';
import { CommentAnchor } from '../core/types';

/**
 * Extract a robust anchor from current selection in ProseMirror state
 */
export function extractCommentAnchor(
  state: EditorState,
  documentId: string,
  anchorId: string = crypto.randomUUID()
): CommentAnchor | null {
  const { selection } = state;
  if (selection.empty) {
    return null;
  }

  const { from, to } = selection;
  const doc = state.doc;
  const selectedText = doc.textBetween(from, to, ' ');

  // Calculate block index
  const $from = selection.$from;
  const blockIndex = $from.index(0);

  // Extract surrounding context (up to 60 characters before and after)
  const contextBeforeStart = Math.max(0, from - 60);
  const contextBefore = doc.textBetween(contextBeforeStart, from, ' ');

  const contextAfterEnd = Math.min(doc.content.size, to + 60);
  const contextAfter = doc.textBetween(to, contextAfterEnd, ' ');

  return {
    anchorId,
    documentId,
    blockIndex,
    from,
    to,
    selectedText,
    contextBefore,
    contextAfter,
  };
}

/**
 * Re-find anchor position in a potentially modified document
 * Returns [from, to] or null if completely lost
 */
export function locateCommentAnchor(
  docText: string,
  anchor: CommentAnchor
): { from: number; to: number; confidence: 'exact' | 'context' | 'fuzzy' } | null {
  // 1. Try exact match at exact previous position
  if (docText.substring(anchor.from, anchor.to) === anchor.selectedText) {
    return { from: anchor.from, to: anchor.to, confidence: 'exact' };
  }

  // 2. Try match with context before + selected + context after
  const fullContextSearch = `${anchor.contextBefore}${anchor.selectedText}${anchor.contextAfter}`;
  const fullIndex = docText.indexOf(fullContextSearch);
  if (fullIndex !== -1) {
    const from = fullIndex + anchor.contextBefore.length;
    const to = from + anchor.selectedText.length;
    return { from, to, confidence: 'context' };
  }

  // 3. Try unique exact match of selected text in document
  const firstIndex = docText.indexOf(anchor.selectedText);
  if (firstIndex !== -1 && docText.indexOf(anchor.selectedText, firstIndex + 1) === -1) {
    // Unique match
    return { from: firstIndex, to: firstIndex + anchor.selectedText.length, confidence: 'exact' };
  }

  // 4. Try nearest match to original offset
  let bestPos = -1;
  let minDiff = Infinity;
  let searchIdx = docText.indexOf(anchor.selectedText);
  while (searchIdx !== -1) {
    const diff = Math.abs(searchIdx - anchor.from);
    if (diff < minDiff) {
      minDiff = diff;
      bestPos = searchIdx;
    }
    searchIdx = docText.indexOf(anchor.selectedText, searchIdx + 1);
  }

  if (bestPos !== -1) {
    return { from: bestPos, to: bestPos + anchor.selectedText.length, confidence: 'fuzzy' };
  }

  return null;
}
