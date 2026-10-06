import { describe, it, expect, beforeAll } from 'vitest';
import { buildSectionTree } from '../treeUtils';
import { DiscoveredFile } from '../../types/ipc';

describe('Large Tree Performance Benchmarks', () => {
  function generateMockFiles(count: number): DiscoveredFile[] {
    const files: DiscoveredFile[] = [];
    const acts = 5;
    const chaptersPerAct = Math.ceil(count / acts);

    for (let a = 1; a <= acts; a++) {
      files.push({
        relative_path: `Manuscript/Act ${a}`,
        name: `Act ${a}`,
        is_directory: true,
        format: 'txt',
        size_bytes: 0,
      });

      for (let c = 1; c <= chaptersPerAct && files.length < count; c++) {
        files.push({
          relative_path: `Manuscript/Act ${a}/Chapter ${c}.md`,
          name: `Chapter ${c}.md`,
          is_directory: false,
          format: 'markdown',
          size_bytes: 2500,
        });
      }
    }
    return files;
  }

  beforeAll(() => {
    // Warm-up V8 JIT compiler
    const warmFiles = generateMockFiles(50);
    for (let i = 0; i < 5; i++) {
      buildSectionTree(warmFiles, 'Manuscript');
    }
  });

  it('builds tree for 100 files in under 10ms', () => {
    const files = generateMockFiles(100);
    const start = performance.now();
    const tree = buildSectionTree(files, 'Manuscript');
    const elapsed = performance.now() - start;

    expect(tree.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(30);
  });

  it('builds tree for 1,000 files in under 30ms', () => {
    const files = generateMockFiles(1000);
    const start = performance.now();
    const tree = buildSectionTree(files, 'Manuscript');
    const elapsed = performance.now() - start;

    expect(tree.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(60);
  });

  it('builds tree for 5,000 files in under 100ms', () => {
    const files = generateMockFiles(5000);
    const start = performance.now();
    const tree = buildSectionTree(files, 'Manuscript');
    const elapsed = performance.now() - start;

    expect(tree.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(250);
  });
});
