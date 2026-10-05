import { describe, it, expect } from 'vitest';
import { locateCommentAnchor } from '../schema/anchors';
import { CommentAnchor } from '../core/types';

describe('Comment Anchor Resilient Locator', () => {
  const baseDocument = `Chapter 1: The Gathering

The winter winds swept through the high mountain passes of Eldoria, chilling the bones of every traveler.
Julian held his torch high, searching for the ancient rune carved into the cavern wall.
Suddenly, a shadow flickered against the stalactites.`;

  const targetText = 'ancient rune';
  const targetPos = baseDocument.indexOf(targetText);

  const anchor: CommentAnchor = {
    anchorId: 'test-anchor-1',
    documentId: 'Manuscript/Chapter 01.md',
    blockIndex: 2,
    from: targetPos,
    to: targetPos + targetText.length,
    selectedText: targetText,
    contextBefore: 'Julian held his torch high, searching for the ',
    contextAfter: ' carved into the cavern wall.',
  };

  it('locates anchor at exact original position when document is unchanged', () => {
    const result = locateCommentAnchor(baseDocument, anchor);
    expect(result).not.toBeNull();
    expect(result?.confidence).toBe('exact');
    expect(baseDocument.substring(result!.from, result!.to)).toBe('ancient rune');
  });

  it('locates anchor via context when text is prepended before the anchor', () => {
    const modifiedDoc = 'PREPENDED TEXT AT TOP.\n\n' + baseDocument;
    const result = locateCommentAnchor(modifiedDoc, anchor);
    expect(result).not.toBeNull();
    expect(result?.confidence).toBe('context');
    expect(modifiedDoc.substring(result!.from, result!.to)).toBe('ancient rune');
  });

  it('returns null if the selected text and context are completely deleted', () => {
    const deletedDoc = 'Chapter 1: Empty text with no runes anywhere.';
    const result = locateCommentAnchor(deletedDoc, anchor);
    expect(result).toBeNull();
  });
});
