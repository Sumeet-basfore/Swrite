import { describe, it, expect } from 'vitest';
import { getNodeKind } from '../treeUtils';
import { TreeNode } from '../types';

function node(name: string, relativePath: string, format: TreeNode['format'] = 'markdown'): TreeNode {
  return {
    id: relativePath,
    name,
    relativePath,
    isDirectory: false,
    format,
    sizeBytes: 100,
    children: [],
  };
}

describe('getNodeKind', () => {
  it('classifies the novel project roles from the screenshot', () => {
    expect(getNodeKind(node('Chapter 7 - The Amber Cargo.md', 'draft chapters/Chapter 7 - The Amber Cargo.md'))).toBe('chapter');
    expect(getNodeKind(node('Lucan.md', '02.Characters/Lucan.md'))).toBe('character');
    expect(getNodeKind(node('Scoria.md', '02.Characters/Scoria.md'))).toBe('character');
    expect(getNodeKind(node('MASTER_STORY_BIBLE.md', 'MASTER_STORY_BIBLE.md'))).toBe('bible');
    expect(getNodeKind(node('Story Overview.md', 'Story Overview.md'))).toBe('bible');
    expect(getNodeKind(node('Notes on Writing my First Draft.md', 'Notes on Writing my First Draft.md'))).toBe('note');
  });

  it('detects lore sections and chapter patterns anywhere', () => {
    expect(getNodeKind(node('Runes.md', '04.Power & Magic/Runes.md'))).toBe('lore');
    expect(getNodeKind(node('Harbor.md', '03.World/Harbor.md'))).toBe('lore');
    expect(getNodeKind(node('Scene 01.md', 'Manuscript/Act 1/Scene 01.md'))).toBe('chapter');
    expect(getNodeKind(node('Prologue.md', 'Manuscript/Prologue.md'))).toBe('chapter');
  });

  it('keeps format icons for non-markdown and falls back to document', () => {
    expect(getNodeKind(node('cover.png', 'Assets/cover.png', 'binary'))).toBe('image');
    expect(getNodeKind(node('contract.docx', 'contract.docx', 'docx'))).toBe('word');
    expect(getNodeKind(node('todo.txt', 'todo.txt', 'txt'))).toBe('text');
    expect(getNodeKind(node('random.md', 'Desk/random.md'))).toBe('document');
  });
});
