import { INITIAL_NOVEL_DATA } from '../services/storageService';
import { StoryEngine } from './storyEngine';
import { compareProjects, diffParagraphs } from './snapshot/diff';
import { ProjectData } from '../types';

const assert = (ok: boolean, message: string) => { if (!ok) throw new Error(`Assertion failed: ${message}`); };

export function runPhase4Tests() {
  const results: string[] = [];
  let project: ProjectData = JSON.parse(JSON.stringify(INITIAL_NOVEL_DATA));
  const chapter = project.acts[0].chapters[0];
  const source = chapter.scenes![0];
  const before = '<p>Paragraph one.</p><p>Paragraph two with <strong>meaning</strong>.</p>';
  const after = '<p>Paragraph three.</p><p>Paragraph four.</p>';
  Object.assign(source, { content: `${before}${after}`, wordCount: 7, povCharacterId: 'unique-pov', characterIds: ['shared-character'], locationIds: ['shared-location'], goal: 'Preserve goal', outcome: 'Preserve outcome' });
  const originalText = `${before}${after}`;
  const split = StoryEngine.splitScene(project, source.id, before, after);
  assert((split.originalScene.content || '') + (split.newScene.content || '') === originalText, 'split preserves exact source fragments');
  assert(split.newScene.title === 'Untitled Scene', 'default split title is neutral');
  assert(split.newScene.chapterId === chapter.id && split.newScene.actId === source.actId, 'chapter and act identity preserved');
  assert(split.newScene.povCharacterId === 'unique-pov' && split.newScene.characterIds?.[0] === 'shared-character' && split.newScene.locationIds?.[0] === 'shared-location' && split.newScene.goal === 'Preserve goal', 'scene metadata is preserved');
  assert(split.originalScene.wordCount === 7 && split.newScene.wordCount === 4, 'split recalculates both word counts');
  assert(chapter.scenes!.indexOf(split.newScene) === chapter.scenes!.indexOf(split.originalScene) + 1, 'new scene follows original');
  results.push('✓ Scene split preserves content, ordering, counts, and metadata');

  const same = diffParagraphs('<p>One.</p><p>Two.</p>', '<p>One.</p><p>Two changed.</p>');
  assert(same.length === 2 && same[0].changeType === 'unchanged' && same[1].changeType === 'modified', 'paragraph grouping');
  assert(same[1].changeType === 'modified', 'modified paragraph classification');
  const rewrite = diffParagraphs('<p>A very short old paragraph.</p>', '<p>A wholly different paragraph with new meaning and texture.</p>');
  assert(rewrite[0].substantiallyRewritten === true, 'large rewrite detection');
  const added = diffParagraphs('', '<p>Added.</p>');
  const removed = diffParagraphs('<p>Removed.</p>', '');
  assert(added[0].changeType === 'added' && removed[0].changeType === 'removed', 'added and removed paragraphs');
  results.push('✓ Paragraph-level grouping, mixed changes, and substantial rewrite detection');

  const target = JSON.parse(JSON.stringify(split.project)) as ProjectData;
  target.acts[0].chapters[0].content = '<p>Changed chapter.</p>';
  target.acts[0].chapters[0].scenes![0].content = '<p>Changed scene.</p>';
  const diff = compareProjects(split.project, target);
  assert(Boolean(diff.sceneDiffs?.length), 'scene diffs included');
  assert(Boolean(diff.chapterDiffs[0].paragraphs), 'chapter paragraph diffs included');
  assert(diff.totalAddedWords >= 0 && diff.totalRemovedWords >= 0, 'summary word counts present');
  results.push('✓ Chapter/scene diff data and compact summary counts');

  const reloaded = JSON.parse(JSON.stringify(split.project)) as ProjectData;
  assert(reloaded.acts[0].chapters[0].scenes!.length === chapter.scenes!.length, 'split survives serialization');
  results.push('✓ Split scene persistence and backwards-compatible engine call');
  return { results };
}
