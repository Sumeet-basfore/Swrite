import { describe, it, expect } from 'vitest';
import { generateMarkdownTable } from '../commands/tableCommands';

describe('Table Commands & Serialization', () => {
  it('generates standard 3x3 Markdown table', () => {
    const table = generateMarkdownTable(3, 3);
    expect(table).toContain('| Header 1 | Header 2 | Header 3 |');
    expect(table).toContain('| --- | --- | --- |');
    expect(table).toContain('| Cell 1,1 | Cell 1,2 | Cell 1,3 |');
    expect(table).toContain('| Cell 2,1 | Cell 2,2 | Cell 2,3 |');
  });

  it('clamps row and column dimensions safely', () => {
    const tableMin = generateMarkdownTable(0, 0);
    expect(tableMin).toContain('| Header 1 |');

    const tableMax = generateMarkdownTable(50, 50);
    // Columns should be clamped to 10 max
    expect(tableMax).toContain('| Header 10 |');
    expect(tableMax).not.toContain('| Header 11 |');
  });
});
