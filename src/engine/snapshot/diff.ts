import { ProjectData, Chapter } from '../../types';
import { 
  SnapshotDiffResult, ChapterDiffResult, TextDiffSegment, DiffChangeType, DiffParagraph, SceneDiffResult 
} from '../../types/snapshot';

/**
 * Calculates a fast, resilient word-level diff between two text strings.
 * Produces clean segments: 'unchanged', 'added', 'removed'.
 */
export function diffWords(baseText: string, targetText: string): TextDiffSegment[] {
  if (baseText === targetText) {
    return baseText ? [{ type: 'unchanged', text: baseText }] : [];
  }

  if (!baseText) {
    return targetText ? [{ type: 'added', text: targetText }] : [];
  }

  if (!targetText) {
    return [{ type: 'removed', text: baseText }];
  }

  // Tokenize into words and whitespace/punctuation preserving exact structure
  const tokenize = (str: string): string[] => {
    // Split by whitespace boundaries while preserving words
    const tokens = str.match(/\S+|\s+/g);
    return tokens || [];
  };

  const baseTokens = tokenize(baseText);
  const targetTokens = tokenize(targetText);

  // Use Myers/LCS-based diffing optimized for text blocks
  const n = baseTokens.length;
  const m = targetTokens.length;

  // Build matrix for LCS
  // For very large chapters (> 10,000 tokens), handle in chunks or sentence level if needed
  if (n * m > 4000000) {
    // Fallback chunking by paragraphs for huge text
    return diffByParagraphs(baseText, targetText);
  }

  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (baseTokens[i] === targetTokens[j]) {
        lcs[i + 1][j + 1] = lcs[i][j] + 1;
      } else {
        lcs[i + 1][j + 1] = Math.max(lcs[i + 1][j], lcs[i][j + 1]);
      }
    }
  }

  // Backtrack to extract diff tokens
  const rawSegments: TextDiffSegment[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && baseTokens[i - 1] === targetTokens[j - 1]) {
      rawSegments.unshift({ type: 'unchanged', text: baseTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      rawSegments.unshift({ type: 'added', text: targetTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || lcs[i][j - 1] < lcs[i - 1][j])) {
      rawSegments.unshift({ type: 'removed', text: baseTokens[i - 1] });
      i--;
    }
  }

  // Consolidate adjacent segments of same type
  return consolidateSegments(rawSegments);
}

/**
 * Paragraph-level diff fallback for very large texts.
 */
function diffByParagraphs(baseText: string, targetText: string): TextDiffSegment[] {
  const baseParas = baseText.split('\n\n');
  const targetParas = targetText.split('\n\n');

  const segments: TextDiffSegment[] = [];
  const maxLen = Math.max(baseParas.length, targetParas.length);

  for (let k = 0; k < maxLen; k++) {
    const bp = baseParas[k];
    const tp = targetParas[k];

    if (bp === tp && bp !== undefined) {
      segments.push({ type: 'unchanged', text: bp + (k < maxLen - 1 ? '\n\n' : '') });
    } else {
      if (bp !== undefined) {
        segments.push({ type: 'removed', text: bp + (k < maxLen - 1 ? '\n\n' : '') });
      }
      if (tp !== undefined) {
        segments.push({ type: 'added', text: tp + (k < maxLen - 1 ? '\n\n' : '') });
      }
    }
  }

  return consolidateSegments(segments);
}

function consolidateSegments(segments: TextDiffSegment[]): TextDiffSegment[] {
  if (segments.length <= 1) return segments;

  const result: TextDiffSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const next = segments[i];
    if (next.type === current.type) {
      current.text += next.text;
    } else {
      result.push(current);
      current = { ...next };
    }
  }
  result.push(current);

  return result;
}

/** Paragraphs are the default editorial unit; word diffs stay deferred until requested. */
export function extractParagraphs(html: string): string[] {
  const matches = [...(html || '').matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)];
  if (matches.length) return matches.map(match => match[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()).filter(Boolean);
  return (html || '').replace(/<[^>]+>/g, '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
}

export function diffParagraphs(baseText: string, targetText: string): DiffParagraph[] {
  const before = extractParagraphs(baseText);
  const after = extractParagraphs(targetText);
  const result: DiffParagraph[] = [];
  const max = Math.max(before.length, after.length);
  for (let index = 0; index < max; index++) {
    const oldText = before[index] || '';
    const newText = after[index] || '';
    if (oldText === newText) result.push({ id: `p-${index}`, index, changeType: 'unchanged', before: oldText, after: newText });
    else if (!oldText) result.push({ id: `p-${index}`, index, changeType: 'added', before: '', after: newText });
    else if (!newText) result.push({ id: `p-${index}`, index, changeType: 'removed', before: oldText, after: '' });
    else {
      const segments = diffWords(oldText, newText);
      const changedWords = segments.filter(s => s.type !== 'unchanged').reduce((n, s) => n + countWords(s.text), 0);
      const totalWords = Math.max(1, countWords(oldText) + countWords(newText));
      result.push({ id: `p-${index}`, index, changeType: 'modified', before: oldText, after: newText, substantiallyRewritten: changedWords / totalWords >= 0.6 });
    }
  }
  return result;
}

/**
 * Counts words in a string.
 */
function countWords(str: string): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Compares two ProjectData snapshots and produces a structured ManuscriptDiffResult.
 */
export function compareProjects(
  baseProject: ProjectData,
  targetProject: ProjectData,
  baseLabel: string = 'Base Version',
  targetLabel: string = 'Target Version',
  baseSnapshotId?: string,
  targetSnapshotId?: string
): SnapshotDiffResult {
  const baseChaptersMap = new Map<string, Chapter>();
  baseProject.acts.forEach(act => {
    act.chapters.forEach(ch => baseChaptersMap.set(ch.id, ch));
  });

  const targetChaptersMap = new Map<string, Chapter>();
  targetProject.acts.forEach(act => {
    act.chapters.forEach(ch => targetChaptersMap.set(ch.id, ch));
  });

  const allChapterIds = Array.from(
    new Set([...baseChaptersMap.keys(), ...targetChaptersMap.keys()])
  );

  const chapterDiffs: ChapterDiffResult[] = [];
  const addedChapters: string[] = [];
  const removedChapters: string[] = [];
  const modifiedChapters: string[] = [];
  const unchangedChapters: string[] = [];

  let totalAddedWords = 0;
  let totalRemovedWords = 0;

  for (const chId of allChapterIds) {
    const baseCh = baseChaptersMap.get(chId);
    const targetCh = targetChaptersMap.get(chId);

    if (baseCh && !targetCh) {
      // Removed chapter
      const baseWords = baseCh.wordCount || countWords(baseCh.content);
      removedChapters.push(baseCh.title);
      totalRemovedWords += baseWords;

      chapterDiffs.push({
        chapterId: chId,
        chapterTitle: baseCh.title,
        changeType: 'removed',
        baseWordCount: baseWords,
        targetWordCount: 0,
        wordCountDelta: -baseWords,
        segments: diffWords(baseCh.content, ''),
        paragraphs: diffParagraphs(baseCh.content, '')
      });
    } else if (!baseCh && targetCh) {
      // Added chapter
      const targetWords = targetCh.wordCount || countWords(targetCh.content);
      addedChapters.push(targetCh.title);
      totalAddedWords += targetWords;

      chapterDiffs.push({
        chapterId: chId,
        chapterTitle: targetCh.title,
        changeType: 'added',
        baseWordCount: 0,
        targetWordCount: targetWords,
        wordCountDelta: targetWords,
        segments: diffWords('', targetCh.content),
        paragraphs: diffParagraphs('', targetCh.content)
      });
    } else if (baseCh && targetCh) {
      const baseContent = baseCh.content || '';
      const targetContent = targetCh.content || '';
      const baseWords = baseCh.wordCount || countWords(baseContent);
      const targetWords = targetCh.wordCount || countWords(targetContent);
      const delta = targetWords - baseWords;

      if (baseContent === targetContent && baseCh.title === targetCh.title) {
        unchangedChapters.push(targetCh.title);
        chapterDiffs.push({
          chapterId: chId,
          chapterTitle: targetCh.title,
          changeType: 'unchanged',
          baseWordCount: baseWords,
          targetWordCount: targetWords,
          wordCountDelta: 0,
          segments: [{ type: 'unchanged', text: targetContent }],
          paragraphs: diffParagraphs(baseContent, targetContent)
        });
      } else {
        modifiedChapters.push(targetCh.title);
        const segments = diffWords(baseContent, targetContent);

        // Count added and removed words in segments
        for (const seg of segments) {
          const segWords = countWords(seg.text);
          if (seg.type === 'added') totalAddedWords += segWords;
          if (seg.type === 'removed') totalRemovedWords += segWords;
        }

        chapterDiffs.push({
          chapterId: chId,
          chapterTitle: targetCh.title,
          changeType: 'modified',
          baseWordCount: baseWords,
          targetWordCount: targetWords,
          wordCountDelta: delta,
          segments,
          paragraphs: diffParagraphs(baseContent, targetContent)
        });
      }
    }
  }

  const sceneMap = (project: ProjectData) => new Map(project.acts.flatMap(act => act.chapters.flatMap(ch => (ch.scenes || []).map(scene => [scene.id, { ...scene, chapterId: ch.id }] as const))));
  const baseScenes = sceneMap(baseProject);
  const targetScenes = sceneMap(targetProject);
  const sceneDiffs: SceneDiffResult[] = [];
  for (const sceneId of new Set([...baseScenes.keys(), ...targetScenes.keys()])) {
    const before = baseScenes.get(sceneId);
    const after = targetScenes.get(sceneId);
    const paragraphs = diffParagraphs(before?.content || '', after?.content || '');
    const changeType: DiffChangeType = !before ? 'added' : !after ? 'removed' : paragraphs.some(p => p.changeType !== 'unchanged') ? 'modified' : 'unchanged';
    sceneDiffs.push({ sceneId, chapterId: after?.chapterId || before?.chapterId || '', sceneTitle: after?.title || before?.title || 'Untitled Scene', changeType, paragraphs });
  }

  // Count changes in Story Engine entities
  const baseCharacters = baseProject.characters || [];
  const targetCharacters = targetProject.characters || [];
  const characterChangesCount = Math.abs(targetCharacters.length - baseCharacters.length);

  const baseThreads = baseProject.plotThreads || [];
  const targetThreads = targetProject.plotThreads || [];
  const plotThreadChangesCount = Math.abs(targetThreads.length - baseThreads.length);

  return {
    baseSnapshotId,
    baseLabel,
    targetSnapshotId,
    targetLabel,
    comparedAt: new Date().toISOString(),
    totalAddedWords,
    totalRemovedWords,
    netWordDelta: totalAddedWords - totalRemovedWords,
    chapterDiffs,
    sceneDiffs,
    addedChapters,
    removedChapters,
    modifiedChapters,
    unchangedChapters,
    characterChangesCount,
    plotThreadChangesCount
  };
}
