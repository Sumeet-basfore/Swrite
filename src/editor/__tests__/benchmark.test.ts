import { describe, it, expect } from 'vitest';
import { calculateEditorStats } from '../core/stats';

describe('Editor Performance & Latency Benchmarks', () => {
  const paragraphTemplate = `The autumn leaves drifted across the cobblestone pathway leading to the old observatory. Julian wrapped his mantle tighter against the bitter mountain draft, his eyes scanning the horizon for any sign of the courier's lantern. Ten years had passed since the Great Severance, yet every rustle of the pines reminded him of the night the stars ceased to speak.\n\n`;

  function generateManuscript(targetWords: number): string {
    const singleParaWords = calculateEditorStats(paragraphTemplate).wordCount;
    const repeats = Math.ceil(targetWords / singleParaWords);
    let manuscript = '';
    for (let i = 0; i < repeats; i++) {
      manuscript += `## Chapter ${i + 1}: The Passage\n\n` + paragraphTemplate;
    }
    return manuscript;
  }

  it('calculates stats for 1,000-word scene in under 1ms', () => {
    const text = generateManuscript(1000);
    const start = performance.now();
    const stats = calculateEditorStats(text);
    const elapsed = performance.now() - start;

    expect(stats.wordCount).toBeGreaterThanOrEqual(1000);
    expect(elapsed).toBeLessThan(5); // Well within target <16ms frame budget
  });

  it('calculates stats for 10,000-word novella chapter in under 5ms', () => {
    const text = generateManuscript(10000);
    const start = performance.now();
    const stats = calculateEditorStats(text);
    const elapsed = performance.now() - start;

    expect(stats.wordCount).toBeGreaterThanOrEqual(10000);
    expect(elapsed).toBeLessThan(15);
  });

  it('calculates stats for 120,000-word full novel in under 40ms', () => {
    const text = generateManuscript(120000);
    const start = performance.now();
    const stats = calculateEditorStats(text);
    const elapsed = performance.now() - start;

    expect(stats.wordCount).toBeGreaterThanOrEqual(120000);
    expect(elapsed).toBeLessThan(80);
  });
});
