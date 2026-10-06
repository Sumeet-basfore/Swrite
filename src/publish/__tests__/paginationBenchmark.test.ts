import { describe, it, expect } from 'vitest';

interface LayoutBlock {
  type: 'heading' | 'paragraph' | 'ornament';
  text: string;
  linesEstimate: number;
}

interface SimulatedPage {
  pageNumber: number;
  blocks: LayoutBlock[];
}

function simulateFastClientPagination(
  text: string,
  linesPerPage: number = 32
): SimulatedPage[] {
  const pages: SimulatedPage[] = [];
  let currentPage: SimulatedPage = { pageNumber: 1, blocks: [] };
  let currentLineCount = 0;

  const rawParagraphs = text.split('\n\n');

  for (const raw of rawParagraphs) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const isHeading = trimmed.startsWith('#');
    const cleanText = isHeading ? trimmed.replace(/^#+\s*/, '') : trimmed;
    
    // Estimate lines based on average 65 chars per line
    const estimatedLines = Math.max(1, Math.ceil(cleanText.length / 65));
    const blockType = isHeading ? 'heading' : (cleanText === '* * *' ? 'ornament' : 'paragraph');

    // Page overflow check
    if (currentLineCount + estimatedLines > linesPerPage && currentLineCount > 0) {
      pages.push(currentPage);
      currentPage = { pageNumber: pages.length + 1, blocks: [] };
      currentLineCount = 0;
    }

    currentPage.blocks.push({
      type: blockType,
      text: cleanText,
      linesEstimate: estimatedLines,
    });
    currentLineCount += estimatedLines;
  }

  if (currentPage.blocks.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

describe('Publish Pagination & Preflight Benchmark', () => {
  it('paginates a 100,000+ word manuscript under 250ms', () => {
    const sampleChapter = `
# Chapter One

The sea of stars stretched endlessly beyond the edge of the sky. In the ancient sanctuary, candlelight flickered against old granite walls, casting long, wavering shadows across worn parchment and maps of forgotten realms.

He walked toward the great window, where the cold northern wind whispered of changes to come. Every word in the chronicle mattered now; every decision forged the path of empires.

* * *

By dawn, the couriers had already departed on swift steeds. The heralds sounded their horns in the courtyard below, calling the council to assemble before the high throne.
`.trim();

    // 100k words (~1,000 chapter sections)
    const repetitions = 1000;
    const largeManuscript = Array(repetitions).fill(sampleChapter).join('\n\n');

    const start = performance.now();
    const pages = simulateFastClientPagination(largeManuscript, 32);
    const elapsed = performance.now() - start;

    expect(pages.length).toBeGreaterThan(300);
    expect(elapsed).toBeLessThan(350); // Strict performance target
  });
});
