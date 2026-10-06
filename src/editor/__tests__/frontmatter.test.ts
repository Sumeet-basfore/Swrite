import { describe, it, expect } from 'vitest';
import { extractFrontmatter, combineFrontmatter, parseFrontmatterMetadata } from '../core/frontmatter';

describe('Frontmatter Parser and Serializer', () => {
  it('extracts standard YAML frontmatter cleanly without altering body', () => {
    const raw = `---
type: chapter_draft
series: Vaelrion
act: 1
arc: 1
chapter: 1
title: The Sanctuary of Routine
status: draft
pov: Lucan
word_count: 1560
---

# The Sanctuary of Routine

The lantern flickered in the evening breeze.
`;

    const parsed = extractFrontmatter(raw);
    expect(parsed.frontmatter).toContain('type: chapter_draft');
    expect(parsed.frontmatter).toContain('pov: Lucan');
    expect(parsed.frontmatter).toContain('title: The Sanctuary of Routine');

    expect(parsed.body).toBe(`# The Sanctuary of Routine\n\nThe lantern flickered in the evening breeze.\n`);

    expect(parsed.metadata.type).toBe('chapter_draft');
    expect(parsed.metadata.series).toBe('Vaelrion');
    expect(parsed.metadata.chapter).toBe('1');
    expect(parsed.metadata.title).toBe('The Sanctuary of Routine');
    expect(parsed.metadata.status).toBe('draft');
    expect(parsed.metadata.pov).toBe('Lucan');
    expect(parsed.metadata.word_count).toBe('1560');
  });

  it('handles TOML frontmatter with +++ delimiters', () => {
    const raw = `+++
title = "Ancient Lore"
author = "Scribe"
+++

Prose content follows.
`;

    const parsed = extractFrontmatter(raw);
    expect(parsed.frontmatter).toContain('title = "Ancient Lore"');
    expect(parsed.body).toBe('Prose content follows.\n');
  });

  it('preserves documents with no frontmatter', () => {
    const raw = `# Just a Heading\n\nOrdinary markdown paragraph.\n`;
    const parsed = extractFrontmatter(raw);
    expect(parsed.frontmatter).toBeNull();
    expect(parsed.body).toBe(raw);
    expect(parsed.metadata).toEqual({});
  });

  it('does not confuse scene breaks or horizontal rules inside body with frontmatter', () => {
    const raw = `# Chapter 1\n\nFirst scene.\n\n---\n\nSecond scene.\n`;
    const parsed = extractFrontmatter(raw);
    expect(parsed.frontmatter).toBeNull();
    expect(parsed.body).toBe(raw);
  });

  it('handles UTF-8 BOM without corrupting frontmatter', () => {
    const raw = `\uFEFF---\ntitle: BOM Test\n---\n\nHello world`;
    const parsed = extractFrontmatter(raw);
    expect(parsed.frontmatter).toBe('title: BOM Test');
    expect(parsed.body).toBe('Hello world');
    expect(parsed.metadata.title).toBe('BOM Test');
  });

  it('combines frontmatter and body markdown losslessly', () => {
    const fm = 'title: Roundtrip\nauthor: Lucan';
    const body = '# Chapter 1\n\nProse text.';
    const combined = combineFrontmatter(fm, body);

    expect(combined).toBe(`---\ntitle: Roundtrip\nauthor: Lucan\n---\n\n# Chapter 1\n\nProse text.`);

    const reparsed = extractFrontmatter(combined);
    expect(reparsed.frontmatter).toBe(fm);
    expect(reparsed.body).toBe(body);
  });

  it('returns plain body when combining with empty or null frontmatter', () => {
    const body = '# Chapter 1\n\nProse text.';
    expect(combineFrontmatter(null, body)).toBe(body);
    expect(combineFrontmatter('', body)).toBe(body);
    expect(combineFrontmatter('   ', body)).toBe(body);
  });

  it('parses frontmatter metadata with quotes and colons in values', () => {
    const fm = `title: "The Book: A Novel"\nsubtitle: 'Part 1: The Beginning'\nurl: https://example.com/item\n# A comment\nempty_val:`;
    const meta = parseFrontmatterMetadata(fm);

    expect(meta.title).toBe('The Book: A Novel');
    expect(meta.subtitle).toBe('Part 1: The Beginning');
    expect(meta.url).toBe('https://example.com/item');
    expect(meta.empty_val).toBe('');
    expect(meta['# A comment']).toBeUndefined();
  });
});
