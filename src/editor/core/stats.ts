import { EditorStats } from './types';

export function calculateEditorStats(text: string): EditorStats {
  if (!text || text.trim() === '') {
    return {
      wordCount: 0,
      charCount: 0,
      paragraphCount: 0,
      readingTimeMinutes: 0,
    };
  }

  // Character count (including whitespaces)
  const charCount = text.length;

  // Standard literary word counting (whitespace separated tokens, filtering punctuation-only tokens)
  const tokens = text.match(/\S+/g) || [];
  const words = tokens.filter((t) => /[\p{L}\p{N}]/u.test(t));
  const wordCount = words.length;

  // Non-empty paragraphs
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const paragraphCount = paragraphs.length;

  // Average reading speed: 225 words per minute for adult reading
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 225));

  return {
    wordCount,
    charCount,
    paragraphCount,
    readingTimeMinutes,
  };
}
