import { describe, it, expect } from 'vitest';
import { resolveWikilink, findWikilinksInText } from '../links/wikilinkResolver';
import { DiscoveredFile } from '../../types/ipc';

describe('Wikilink System & Target Resolution', () => {
  const sampleFiles: DiscoveredFile[] = [
    {
      relative_path: 'Manuscript/draft chapters/Chapter 1 - The Sanctuary of Routine.md',
      name: 'Chapter 1 - The Sanctuary of Routine.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 4500,
    },
    {
      relative_path: 'Manuscript/draft chapters/Chapter 2 - The Breach.md',
      name: 'Chapter 2 - The Breach.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 3800,
    },
    {
      relative_path: 'Desk/02.Characters/Lucan.md',
      name: 'Lucan.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 2100,
    },
    {
      relative_path: 'Planning/Timeline.md',
      name: 'Timeline.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 1200,
    },
  ];

  it('resolves exact relative paths', () => {
    const res = resolveWikilink('Desk/02.Characters/Lucan.md', sampleFiles);
    expect(res).toBe('Desk/02.Characters/Lucan.md');
  });

  it('resolves filename with .md and without path', () => {
    const res = resolveWikilink('Lucan.md', sampleFiles);
    expect(res).toBe('Desk/02.Characters/Lucan.md');
  });

  it('resolves filename without .md extension', () => {
    const res = resolveWikilink('Lucan', sampleFiles);
    expect(res).toBe('Desk/02.Characters/Lucan.md');
  });

  it('resolves case-insensitively', () => {
    const res = resolveWikilink('timeline', sampleFiles);
    expect(res).toBe('Planning/Timeline.md');
  });

  it('resolves chapter prefixes and stems', () => {
    const res = resolveWikilink('Chapter 1', sampleFiles);
    expect(res).toBe('Manuscript/draft chapters/Chapter 1 - The Sanctuary of Routine.md');

    const res2 = resolveWikilink('Chapter 2 - The Breach', sampleFiles);
    expect(res2).toBe('Manuscript/draft chapters/Chapter 2 - The Breach.md');
  });

  it('handles piped alias wikilinks cleanly', () => {
    const res = resolveWikilink('Chapter 2|The Breach Scene', sampleFiles);
    expect(res).toBe('Manuscript/draft chapters/Chapter 2 - The Breach.md');
  });

  it('returns null for non-existent documents', () => {
    const res = resolveWikilink('NonExistentChapter', sampleFiles);
    expect(res).toBeNull();
  });

  it('extracts multiple wikilinks from prose text', () => {
    const prose = 'As noted in [[Chapter 1 - The Sanctuary of Routine.md]], [[Lucan|The protagonist]] consulted [[Timeline]].';
    const matches = findWikilinksInText(prose);

    expect(matches).toHaveLength(3);
    expect(matches[0].target).toBe('Chapter 1 - The Sanctuary of Routine.md');
    expect(matches[0].alias).toBeUndefined();

    expect(matches[1].target).toBe('Lucan');
    expect(matches[1].alias).toBe('The protagonist');

    expect(matches[2].target).toBe('Timeline');
  });
});
