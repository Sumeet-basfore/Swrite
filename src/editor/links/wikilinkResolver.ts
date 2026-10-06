import { DiscoveredFile } from '../../types/ipc';

/**
 * Resolves a wikilink target string (e.g. "Chapter 01", "Chapter 01.md", "Characters/Lucan")
 * against the discovered files in the project filesystem.
 */
export function resolveWikilink(target: string, files: DiscoveredFile[]): string | null {
  if (!target || !files || files.length === 0) return null;

  const cleanTarget = target.trim().replace(/^\[\[/, '').replace(/\]\]$/, '').trim();
  if (!cleanTarget) return null;

  // Extract base target (if piped alias is passed by mistake: "Target|Alias")
  const actualTarget = cleanTarget.includes('|') ? cleanTarget.split('|')[0].trim() : cleanTarget;
  const targetLower = actualTarget.toLowerCase();
  const targetLowerWithMd = targetLower.endsWith('.md') ? targetLower : `${targetLower}.md`;
  const targetLowerWithoutExt = targetLower.replace(/\.[^/.]+$/, '');

  // 1. Exact match on relative_path
  for (const file of files) {
    const relLower = file.relative_path.toLowerCase();
    if (relLower === targetLower || relLower === targetLowerWithMd) {
      return file.relative_path;
    }
  }

  // 2. Exact match on filename (e.g. "Lucan.md" or "Lucan" matching "Desk/Characters/Lucan.md")
  for (const file of files) {
    const nameLower = file.name.toLowerCase();
    const nameWithoutExt = nameLower.replace(/\.[^/.]+$/, '');

    if (nameLower === targetLower || nameLower === targetLowerWithMd || nameWithoutExt === targetLowerWithoutExt) {
      return file.relative_path;
    }
  }

  // 3. Path suffix match (e.g. "Characters/Lucan" matching "Desk/02.Characters/Lucan.md")
  for (const file of files) {
    const relLower = file.relative_path.toLowerCase();
    if (relLower.endsWith(`/${targetLower}`) || relLower.endsWith(`/${targetLowerWithMd}`)) {
      return file.relative_path;
    }
  }

  // 4. Prefix match / stem match (e.g. "Chapter 1" matching "Manuscript/draft chapters/Chapter 1 - The Sanctuary of Routine.md")
  for (const file of files) {
    const nameLower = file.name.toLowerCase();
    const nameWithoutExt = nameLower.replace(/\.[^/.]+$/, '');

    if (nameWithoutExt.startsWith(targetLowerWithoutExt) || nameLower.startsWith(targetLower)) {
      return file.relative_path;
    }
  }

  // 5. Contains substring match as fallback
  for (const file of files) {
    const nameLower = file.name.toLowerCase();
    if (nameLower.includes(targetLowerWithoutExt)) {
      return file.relative_path;
    }
  }

  return null;
}

export interface ParsedWikilinkMatch {
  raw: string;
  target: string;
  alias?: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Finds all wikilink occurrences (`[[target]]` or `[[target|alias]]`) in a plain text string.
 */
export function findWikilinksInText(text: string): ParsedWikilinkMatch[] {
  const matches: ParsedWikilinkMatch[] = [];
  const regex = /\[\[([^\]\n]+?)\]\]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0];
    const inner = match[1].trim();
    let target = inner;
    let alias: string | undefined = undefined;

    if (inner.includes('|')) {
      const parts = inner.split('|');
      target = parts[0].trim();
      alias = parts.slice(1).join('|').trim();
    }

    if (target) {
      matches.push({
        raw: fullMatch,
        target,
        alias,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
      });
    }
  }

  return matches;
}
