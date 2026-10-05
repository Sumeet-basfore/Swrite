import { describe, it, expect } from 'vitest';
import { calculateEditorStats } from '../core/stats';

describe('Editor Stats Calculation', () => {
  it('handles empty text correctly', () => {
    const stats = calculateEditorStats('');
    expect(stats.wordCount).toBe(0);
    expect(stats.charCount).toBe(0);
    expect(stats.paragraphCount).toBe(0);
    expect(stats.readingTimeMinutes).toBe(0);
  });

  it('calculates word count and char count for literary text', () => {
    const text = 'Julian stepped across the threshold into the dark.\n\nHe hesitated for a brief moment.';
    const stats = calculateEditorStats(text);
    expect(stats.wordCount).toBe(14);
    expect(stats.charCount).toBe(text.length);
    expect(stats.paragraphCount).toBe(2);
    expect(stats.readingTimeMinutes).toBe(1);
  });

  it('handles hyphenated words and punctuation', () => {
    const text = 'The well-known cartographer’s shadow-realm was dark.';
    const stats = calculateEditorStats(text);
    expect(stats.wordCount).toBe(6);
  });

  it('estimates reading time for larger word counts', () => {
    // 900 words at 225 wpm = 4 minutes
    const text = Array(900).fill('word').join(' ');
    const stats = calculateEditorStats(text);
    expect(stats.wordCount).toBe(900);
    expect(stats.readingTimeMinutes).toBe(4);
  });
});
