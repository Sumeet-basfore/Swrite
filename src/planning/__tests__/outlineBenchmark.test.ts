import { describe, it, expect } from 'vitest';
import { DiscoveredFile } from '../../types/ipc';
import { naturalCompare } from '../../shell/treeUtils';
import { OutlineItem } from '../types';

describe('Planning Outline Performance Benchmark', () => {
  function generateBenchmarkManuscript(actCount: number, chaptersPerAct: number, scenesPerChapter: number): DiscoveredFile[] {
    const files: DiscoveredFile[] = [];

    for (let a = 1; a <= actCount; a++) {
      const actDir = `Manuscript/Act ${a}`;
      files.push({
        relative_path: actDir,
        name: `Act ${a}`,
        is_directory: true,
        format: 'txt',
        size_bytes: 0,
      });

      for (let c = 1; c <= chaptersPerAct; c++) {
        const cPad = c < 10 ? `0${c}` : `${c}`;
        const chapterDir = `${actDir}/Chapter ${cPad}`;
        files.push({
          relative_path: chapterDir,
          name: `Chapter ${cPad}`,
          is_directory: true,
          format: 'txt',
          size_bytes: 0,
        });

        for (let s = 1; s <= scenesPerChapter; s++) {
          const sPad = s < 10 ? `0${s}` : `${s}`;
          const sceneFile = `${chapterDir}/Scene ${sPad}.md`;
          files.push({
            relative_path: sceneFile,
            name: `Scene ${sPad}.md`,
            is_directory: false,
            format: 'markdown',
            size_bytes: 1024,
          });
        }
      }
    }

    return files;
  }

  function buildOutlineTreeSync(manuscriptFiles: DiscoveredFile[]): OutlineItem[] {
    const items: OutlineItem[] = [];
    const itemMap = new Map<string, OutlineItem>();

    for (const file of manuscriptFiles) {
      const pathParts = file.relative_path.split('/');
      let level: 'act' | 'chapter' | 'scene' = 'chapter';

      if (file.is_directory) {
        if (file.name.toLowerCase().startsWith('act')) {
          level = 'act';
        } else {
          level = 'chapter';
        }
      } else {
        if (file.name.toLowerCase().startsWith('scene') || pathParts.length > 2) {
          level = 'scene';
        } else {
          level = 'chapter';
        }
      }

      const outlineItem: OutlineItem = {
        id: file.relative_path,
        name: file.name.replace(/\.(md|txt|docx)$/, ''),
        relativePath: file.relative_path,
        level,
        isDirectory: file.is_directory,
        children: [],
      };

      itemMap.set(file.relative_path, outlineItem);
    }

    for (const file of manuscriptFiles) {
      const item = itemMap.get(file.relative_path)!;
      const pathParts = file.relative_path.split('/');

      if (pathParts.length <= 2) {
        items.push(item);
      } else {
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = itemMap.get(parentPath);
        if (parent) {
          parent.children.push(item);
        } else {
          items.push(item);
        }
      }
    }

    const sortTree = (nodes: OutlineItem[]) => {
      nodes.sort((a, b) => naturalCompare(a.relativePath, b.relativePath));
      for (const n of nodes) {
        if (n.children.length > 0) {
          sortTree(n.children);
        }
      }
    };

    sortTree(items);
    return items;
  }

  it('builds a large outline tree of 500 scenes in < 50ms', () => {
    // 5 Acts x 10 Chapters x 10 Scenes = 500 scenes (+ 55 folder nodes = 555 total nodes)
    const dataset = generateBenchmarkManuscript(5, 10, 10);
    expect(dataset.length).toBe(555);

    // Warm-up JIT
    for (let i = 0; i < 5; i++) {
      buildOutlineTreeSync(dataset);
    }

    const start = performance.now();
    const tree = buildOutlineTreeSync(dataset);
    const duration = performance.now() - start;

    expect(tree.length).toBe(5); // 5 Acts
    expect(tree[0].children.length).toBe(10); // 10 Chapters in Act 1
    expect(tree[0].children[0].children.length).toBe(10); // 10 Scenes in Chapter 1

    // Verify benchmark threshold
    expect(duration).toBeLessThan(50);
  });
});
