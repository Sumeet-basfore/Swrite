import { describe, it, expect } from 'vitest';
import { buildSectionTree, naturalCompare, formatBytes } from '../treeUtils';
import { DiscoveredFile } from '../../types/ipc';

describe('Tree Utilities & Natural Sorting', () => {
  it('correctly compares strings numerically with naturalCompare', () => {
    expect(naturalCompare('Chapter 2.md', 'Chapter 10.md')).toBeLessThan(0);
    expect(naturalCompare('Chapter 01.md', 'Chapter 02.md')).toBeLessThan(0);
    expect(naturalCompare('Scene 10.md', 'Scene 9.md')).toBeGreaterThan(0);
    expect(naturalCompare('Act I', 'Act II')).toBeLessThan(0);
  });

  it('builds a hierarchical section tree with folders first and natural sorting', () => {
    const rawFiles: DiscoveredFile[] = [
      {
        relative_path: 'Manuscript/Chapter 10.md',
        name: 'Chapter 10.md',
        is_directory: false,
        format: 'markdown',
        size_bytes: 1200,
      },
      {
        relative_path: 'Manuscript/Chapter 2.md',
        name: 'Chapter 2.md',
        is_directory: false,
        format: 'markdown',
        size_bytes: 800,
      },
      {
        relative_path: 'Manuscript/Act 1',
        name: 'Act 1',
        is_directory: true,
        format: 'txt',
        size_bytes: 0,
      },
      {
        relative_path: 'Manuscript/Act 1/Scene 01.md',
        name: 'Scene 01.md',
        is_directory: false,
        format: 'markdown',
        size_bytes: 500,
      },
    ];

    const tree = buildSectionTree(rawFiles, 'Manuscript');

    expect(tree.length).toBe(3); // "Act 1" (dir), "Chapter 2.md", "Chapter 10.md"
    expect(tree[0].name).toBe('Act 1');
    expect(tree[0].isDirectory).toBe(true);
    expect(tree[0].children.length).toBe(1);
    expect(tree[0].children[0].name).toBe('Scene 01.md');

    expect(tree[1].name).toBe('Chapter 2.md');
    expect(tree[2].name).toBe('Chapter 10.md');
  });

  it('formats byte sizes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });
});
