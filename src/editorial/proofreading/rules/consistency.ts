import { Finding, ProofreadingRule, ProofreadingRuleContext } from '../types';

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * 1. ENTITY NAMES & TERMINOLOGY CONSISTENCY RULE
 */
export const EntityConsistencyRule: ProofreadingRule = {
  id: 'const-entity-names',
  name: 'Story Engine Entity & Terminology Consistency',
  category: 'consistency',
  passId: 'consistency-names',
  severity: 'warning',
  check: (context: ProofreadingRuleContext): Finding[] => {
    const findings: Finding[] = [];
    const text = context.plainText;
    const project = context.project;

    // Collect all canonical entity names
    const characterNames = (project.characters || []).map(c => c.name).filter(Boolean);
    const locationNames = (project.locations || []).map(l => l.name).filter(Boolean);
    const factionNames = (project.factions || []).map(f => f.name).filter(Boolean);
    const itemNames = (project.items || []).map(i => i.name).filter(Boolean);

    const allEntities = [
      ...characterNames.map(n => ({ name: n, type: 'Character' })),
      ...locationNames.map(n => ({ name: n, type: 'Location' })),
      ...factionNames.map(n => ({ name: n, type: 'Faction' })),
      ...itemNames.map(n => ({ name: n, type: 'Item' })),
    ];

    // 1. Check for uncapitalized entity names (e.g. "vaelen" when character is "Vaelen")
    allEntities.forEach(entity => {
      if (entity.name.length < 3) return;
      const lower = entity.name.toLowerCase();
      // Regex for lowercase version of entity name bounded by word boundaries
      const lowerRegex = new RegExp(`\\b${lower}\\b`, 'g');
      let match: RegExpExecArray | null;

      while ((match = lowerRegex.exec(text)) !== null) {
        const found = match[0];
        // If found text is all lowercase while canonical name is Capitalized
        if (found === lower && entity.name !== lower) {
          findings.push({
            id: `find-const-casing-${context.chapter.id}-${match.index}`,
            ruleId: 'const-entity-casing',
            category: 'consistency',
            passId: 'consistency-names',
            severity: 'warning',
            title: `Uncapitalized ${entity.type} Name`,
            message: `"${found}" matches ${entity.type} "${entity.name}" but is written in lowercase.`,
            originalText: found,
            suggestedText: entity.name,
            position: {
              start: match.index,
              end: match.index + found.length,
            },
            chapterId: context.chapter.id,
            chapterTitle: context.chapter.title,
            sceneId: context.scene?.id,
            sceneTitle: context.scene?.title,
            status: 'open',
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    // 2. Check for Near-Miss Typos in Entity Names (distance 1 for names >= 4 chars)
    const proseWords = new Set<string>();
    const wordRegex = /\b([A-Za-z]{4,})\b/g;
    let wMatch: RegExpExecArray | null;
    const wordPositions: Array<{ word: string; index: number }> = [];

    while ((wMatch = wordRegex.exec(text)) !== null) {
      wordPositions.push({ word: wMatch[1], index: wMatch.index });
    }

    allEntities.forEach(entity => {
      const entityName = entity.name.trim();
      if (entityName.length < 4) return;

      // Multi-word entity matching (e.g. "Obsidien Citadel" vs "Obsidian Citadel")
      if (entityName.includes(' ')) {
        const wordsInEntity = entityName.split(/\s+/);
        // Find potential matching slices in text
        const entityWordCount = wordsInEntity.length;
        for (let i = 0; i <= wordPositions.length - entityWordCount; i++) {
          const sliceWords = wordPositions.slice(i, i + entityWordCount);
          const startIndex = sliceWords[0].index;
          const endIndex = sliceWords[sliceWords.length - 1].index + sliceWords[sliceWords.length - 1].word.length;
          const candidatePhrase = text.slice(startIndex, endIndex);

          if (candidatePhrase.toLowerCase() === entityName.toLowerCase()) continue;

          const dist = levenshtein(candidatePhrase.toLowerCase(), entityName.toLowerCase());
          if (dist === 1) {
            findings.push({
              id: `find-const-nearmiss-${context.chapter.id}-${startIndex}`,
              ruleId: 'const-entity-nearmiss',
              category: 'consistency',
              passId: 'consistency-names',
              severity: 'warning',
              title: `Possible ${entity.type} Name Inconsistency`,
              message: `"${candidatePhrase}" is very similar to ${entity.type} name "${entityName}". Did you mean "${entityName}"?`,
              originalText: candidatePhrase,
              suggestedText: entityName,
              position: {
                start: startIndex,
                end: endIndex,
              },
              chapterId: context.chapter.id,
              chapterTitle: context.chapter.title,
              sceneId: context.scene?.id,
              sceneTitle: context.scene?.title,
              status: 'open',
              createdAt: new Date().toISOString(),
            });
          }
        }
      } else {
        // Single word entity matching (e.g. "Vaelin" vs "Vaelen")
        wordPositions.forEach(wp => {
          const proseWord = wp.word;
          if (proseWord.toLowerCase() === entityName.toLowerCase()) return;

          const dist = levenshtein(proseWord.toLowerCase(), entityName.toLowerCase());
          if (dist === 1) {
            findings.push({
              id: `find-const-nearmiss-${context.chapter.id}-${wp.index}`,
              ruleId: 'const-entity-nearmiss',
              category: 'consistency',
              passId: 'consistency-names',
              severity: 'warning',
              title: `Possible ${entity.type} Name Inconsistency`,
              message: `"${proseWord}" is very similar to ${entity.type} name "${entityName}". Did you mean "${entityName}"?`,
              originalText: proseWord,
              suggestedText: entityName,
              position: {
                start: wp.index,
                end: wp.index + proseWord.length,
              },
              chapterId: context.chapter.id,
              chapterTitle: context.chapter.title,
              sceneId: context.scene?.id,
              sceneTitle: context.scene?.title,
              status: 'open',
              createdAt: new Date().toISOString(),
            });
          }
        });
      }
    });

    return findings;
  }
};

/**
 * 2. FORMATTING & QUOTE CONSISTENCY RULE
 */
export const FormattingConsistencyRule: ProofreadingRule = {
  id: 'const-formatting',
  name: 'Quotation & Typography Formatting Consistency',
  category: 'consistency',
  passId: 'consistency-formatting',
  severity: 'info',
  check: (context: ProofreadingRuleContext): Finding[] => {
    const findings: Finding[] = [];
    const text = context.plainText;

    const hasStraightQuotes = /"/.test(text);
    const hasSmartQuotes = /[“”]/.test(text);

    if (hasStraightQuotes && hasSmartQuotes) {
      // Find first straight quote
      const firstStraight = text.indexOf('"');
      findings.push({
        id: `find-const-quotes-${context.chapter.id}`,
        ruleId: 'const-formatting-quotes',
        category: 'consistency',
        passId: 'consistency-formatting',
        severity: 'info',
        title: 'Mixed Quotation Mark Styles',
        message: 'Chapter mixes straight quotes (") and curly/smart quotes (“ ”). Consider standardizing.',
        originalText: '"',
        position: {
          start: firstStraight >= 0 ? firstStraight : 0,
          end: (firstStraight >= 0 ? firstStraight : 0) + 1,
        },
        chapterId: context.chapter.id,
        chapterTitle: context.chapter.title,
        sceneId: context.scene?.id,
        sceneTitle: context.scene?.title,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    return findings;
  }
};
