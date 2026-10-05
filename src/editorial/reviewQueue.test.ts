import { buildReviewQueue, filterReviewQueue } from './reviewQueue';
import { Finding } from './proofreading/types';
import { ContinuityWarning } from '../types/continuity';
import { RevisionItem } from '../types/revision';
import { ProjectData } from '../types';

const project = {
  acts: [{ id: 'act-1', order: 1, title: 'Act I', chapters: [{ id: 'ch-1', order: 1, title: 'Chapter 1', scenes: [{ id: 'sc-1', order: 1, title: 'Scene 1' }], content: '', wordCount: 0, status: 'draft', updatedAt: '' }] }],
} as ProjectData;
const finding = { id: 'f-1', title: 'Grammar', message: 'Check agreement', passId: 'grammar', category: 'grammar', severity: 'warning', status: 'open', chapterId: 'ch-1', sceneId: 'sc-1', originalText: 'was', suggestedText: 'were', position: { start: 2, end: 5 } } as Finding;
const warning = { id: 'w-1', title: 'Continuity', summary: 'Knowledge conflict', description: 'Conflict', type: 'knowledge', severity: 'critical', primaryChapterId: 'ch-1', evidence: [{ sceneId: 'sc-1', label: 'Discovery' }] } as ContinuityWarning;
const revision = { id: 'r-1', title: 'Character note', description: 'Slow the turn', category: 'character', priority: 'high', status: 'open', chapterId: 'ch-1', sceneId: 'sc-1' } as RevisionItem;

export function runReviewQueueTests() {
  const results: string[] = [];
  const queue = buildReviewQueue(project, [finding], [warning], [revision]);
  if (queue.length !== 3) throw new Error('Unified queue should contain each source once');
  results.push('✓ Unified queue construction and no duplicate source records');
  if (queue.find(i => i.sourceType === 'proofreading')?.tier !== 'language-proofing') throw new Error('Proofreading tier normalization failed');
  if (queue.find(i => i.sourceType === 'continuity')?.tier !== 'story-craft') throw new Error('Continuity tier normalization failed');
  if (queue.find(i => i.sourceType === 'revision')?.priority !== 'high') throw new Error('Revision priority normalization failed');
  results.push('✓ Source normalization and priority preservation');
  if (queue[0].priority !== 'high' || queue[1].priority !== undefined) throw new Error('Deterministic priority ordering failed');
  results.push('✓ Deterministic priority ordering');
  if (filterReviewQueue(queue, 'scene', project, 'sc-1', 'ch-1').length !== 3) throw new Error('Current scene scope failed');
  if (filterReviewQueue(queue, 'chapter', project, undefined, 'ch-1').length !== 3) throw new Error('Chapter scope failed');
  if (filterReviewQueue(queue, 'manuscript', project).length !== 3) throw new Error('Manuscript scope failed');
  results.push('✓ Scene, chapter, and manuscript scopes');
  if (queue.filter(i => i.tier === 'language-proofing').length !== 1 || queue.filter(i => i.tier === 'story-craft').length !== 2) throw new Error('Tier filters failed');
  results.push('✓ Language & Proofing and Story & Craft filters');
  const proof = queue.find(i => i.sourceType === 'proofreading');
  if (proof?.start !== 2 || proof.end !== 5 || proof.originalText !== 'was') throw new Error('Range normalization failed');
  results.push('✓ Range metadata preserved for editor focus');
  return { results };
}
