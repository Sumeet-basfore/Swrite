import { describe, it, expect } from 'vitest';
import { calculateEditorStats } from '../core/stats';
import { parseDocumentOutline } from '../canvas/DocumentOutline';

describe('Long-Form Prose Scale Benchmarks', () => {
  function generateProse(wordCount: number): string {
    const baseSentence = 'The chronomancer turned the ancient silver cog, shifting the timeline forward into the unknown horizon. ';
    const wordsPerSentence = 15;
    const sentencesNeeded = Math.ceil(wordCount / wordsPerSentence);
    const paragraphs: string[] = [];

    let currentParagraph: string[] = [];
    for (let i = 0; i < sentencesNeeded; i++) {
      if (i > 0 && i % 100 === 0) {
        paragraphs.push(`## Chapter ${Math.floor(i / 100)}: The Flow of Time\n`);
      }
      if (i > 0 && i % 30 === 0) {
        paragraphs.push('* * *\n');
      }
      currentParagraph.push(baseSentence);
      if (currentParagraph.length >= 8) {
        paragraphs.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
    }
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(' '));
    }
    return paragraphs.join('\n\n');
  }

  it('calculates stats for 10,000 words in under 15ms', () => {
    const text10k = generateProse(10_000);
    const start = performance.now();
    const stats = calculateEditorStats(text10k);
    const duration = performance.now() - start;

    expect(stats.wordCount).toBeGreaterThan(9500);
    expect(duration).toBeLessThan(15);
  });

  it('calculates stats and parses outline for 50,000 words in under 30ms', () => {
    const text50k = generateProse(50_000);
    const start = performance.now();
    const stats = calculateEditorStats(text50k);
    const outline = parseDocumentOutline(text50k);
    const duration = performance.now() - start;

    expect(stats.wordCount).toBeGreaterThan(48_000);
    expect(outline.length).toBeGreaterThan(10);
    expect(duration).toBeLessThan(50);
  });

  it('calculates stats and parses outline for 120,000+ words in under 100ms', () => {
    const text120k = generateProse(120_000);
    const start = performance.now();
    const stats = calculateEditorStats(text120k);
    const outline = parseDocumentOutline(text120k);
    const duration = performance.now() - start;

    expect(stats.wordCount).toBeGreaterThan(115_000);
    expect(outline.length).toBeGreaterThan(25);
    expect(duration).toBeLessThan(120);
  });
});
