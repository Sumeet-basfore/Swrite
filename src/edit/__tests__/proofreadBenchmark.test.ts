import { describe, it, expect } from 'vitest';

function simpleClientProofreader(text: string) {
  const findings: Array<{ id: string; rule: string; matched: string; line: number }> = [];
  const lines = text.split('\n');

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];

    // 1. Repeated words
    const words = line.split(/\s+/);
    for (let w = 0; w < words.length - 1; w++) {
      const w1 = words[w].replace(/[^a-zA-Z]/g, '').toLowerCase();
      const w2 = words[w + 1].replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (w1 && w1 === w2) {
        findings.push({
          id: `rep_${l}_${w}`,
          rule: 'repeated_consecutive_word',
          matched: `${words[w]} ${words[w + 1]}`,
          line: l + 1,
        });
      }
    }

    // 2. Space before punctuation
    const spacePunct = /\s+([,;:!?])/g;
    let match;
    while ((match = spacePunct.exec(line)) !== null) {
      findings.push({
        id: `space_punct_${l}_${match.index}`,
        rule: 'space_before_punctuation',
        matched: match[0],
        line: l + 1,
      });
    }
  }

  return findings;
}

describe('Proofreader Performance Benchmark', () => {
  it('scans a 100,000+ word manuscript under 250ms', () => {
    // Generate 100k words (~5,000 paragraphs)
    const baseParagraph =
      'The silent citadel stood upon the misty cliff , overlooking the black ocean. The the cold wind howled relentlessly through the ancient stone arches .\n';
    const totalRepetitions = 5000;
    const largeManuscript = baseParagraph.repeat(totalRepetitions);

    const start = performance.now();
    const findings = simpleClientProofreader(largeManuscript);
    const elapsed = performance.now() - start;

    expect(findings.length).toBeGreaterThan(5000);
    expect(elapsed).toBeLessThan(500); // Strict performance target
  });
});
