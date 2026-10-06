import { describe, it, expect } from 'vitest';
import { parseDocumentOutline } from '../canvas/DocumentOutline';

describe('Document Outline & Bookmarks Parsing', () => {
  it('extracts hierarchical headings, scenes, and bookmarks correctly', () => {
    const sampleMarkdown = `# Act I: The Awakening

Deep inside the fortress, the clock chimed.

## Chapter 1: The Obsidian Citadel

The gate swung wide open with a metallic shriek.

* * *

<!-- bookmark: Rewrite confrontation scene -->

### Scene Beat 1: Approaching the Spire

The spire pierced the stormy clouds above.
`;

    const items = parseDocumentOutline(sampleMarkdown);

    expect(items.length).toBe(5);

    expect(items[0]).toMatchObject({
      type: 'h1',
      title: 'Act I: The Awakening',
      line: 1,
    });

    expect(items[1]).toMatchObject({
      type: 'h2',
      title: 'Chapter 1: The Obsidian Citadel',
      line: 5,
    });

    expect(items[2]).toMatchObject({
      type: 'scene',
      title: 'Scene Break (Line 9)',
      line: 9,
    });

    expect(items[3]).toMatchObject({
      type: 'bookmark',
      title: 'Rewrite confrontation scene',
      line: 11,
    });

    expect(items[4]).toMatchObject({
      type: 'h3',
      title: 'Scene Beat 1: Approaching the Spire',
      line: 13,
    });
  });

  it('returns empty array when no outline nodes are present', () => {
    const plainText = `Just regular prose without any headings or breaks.
Another paragraph of simple narration.`;

    const items = parseDocumentOutline(plainText);
    expect(items.length).toBe(0);
  });
});
