/**
 * Frontmatter extraction, parsing, and serialization utilities for Swrite 2.
 * Ensures lossless roundtrip of document metadata and clean separation
 * between YAML/TOML frontmatter and manuscript prose.
 */

export interface ParsedDocumentContent {
  frontmatter: string | null;
  body: string;
  metadata: Record<string, string>;
}

/**
 * Extracts YAML/TOML frontmatter from raw markdown content.
 * Frontmatter must begin on line 1 with `---` or `+++` and close with `---` or `...` or `+++`.
 */
export function extractFrontmatter(source: string): ParsedDocumentContent {
  if (!source) {
    return { frontmatter: null, body: '', metadata: {} };
  }

  // Handle BOM
  const cleaned = source.replace(/^\uFEFF/, '');
  const startsWithDashes = cleaned.startsWith('---');
  const startsWithPlus = cleaned.startsWith('+++');

  if (!startsWithDashes && !startsWithPlus) {
    return { frontmatter: null, body: source, metadata: {} };
  }

  const delimiter = startsWithDashes ? '---' : '+++';
  const afterFirstDelim = cleaned.slice(3);

  // Check if first line only contains optional whitespace before newline
  const firstNewlineIndex = afterFirstDelim.indexOf('\n');
  if (firstNewlineIndex === -1) {
    return { frontmatter: null, body: source, metadata: {} };
  }

  const firstLine = afterFirstDelim.slice(0, firstNewlineIndex);
  if (firstLine.trim() !== '') {
    return { frontmatter: null, body: source, metadata: {} };
  }

  const rest = afterFirstDelim.slice(firstNewlineIndex + 1);
  const lines = rest.split('\n');

  let closingLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === delimiter || (delimiter === '---' && trimmed === '...')) {
      closingLineIndex = i;
      break;
    }
  }

  if (closingLineIndex === -1) {
    // No closing delimiter found
    return { frontmatter: null, body: source, metadata: {} };
  }

  const frontmatterLines = lines.slice(0, closingLineIndex);
  const rawFrontmatter = frontmatterLines.join('\n');
  const bodyLines = lines.slice(closingLineIndex + 1);
  const body = bodyLines.join('\n').replace(/^\n+/, ''); // Trim leading newlines from body

  const metadata = parseFrontmatterMetadata(rawFrontmatter);

  return {
    frontmatter: rawFrontmatter,
    body,
    metadata,
  };
}

/**
 * Parses simple key-value YAML/TOML frontmatter into a dictionary.
 */
export function parseFrontmatterMetadata(rawFrontmatter: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  if (!rawFrontmatter) return metadata;

  const lines = rawFrontmatter.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
      const key = trimmed.slice(0, colonIndex).trim();
      let val = trimmed.slice(colonIndex + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key) {
        metadata[key] = val;
      }
    }
  }

  return metadata;
}

/**
 * Combines frontmatter and body markdown cleanly.
 */
export function combineFrontmatter(frontmatter: string | null | undefined, body: string): string {
  if (!frontmatter || frontmatter.trim() === '') {
    return body;
  }

  const trimmedFm = frontmatter.trim();
  const trimmedBody = body || '';

  if (trimmedBody === '') {
    return `---\n${trimmedFm}\n---\n`;
  }

  return `---\n${trimmedFm}\n---\n\n${trimmedBody}`;
}
