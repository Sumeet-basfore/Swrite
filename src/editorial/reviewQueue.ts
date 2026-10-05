import { Act, Chapter, ProjectData, Scene } from '../types';
import { Finding } from './proofreading/types';
import { ContinuityWarning } from '../types/continuity';
import { RevisionItem, RevisionItemPriority } from '../types/revision';

export type ReviewSourceType = 'proofreading' | 'continuity' | 'revision';
export type ReviewTier = 'language-proofing' | 'story-craft';
export type ReviewScope = 'scene' | 'chapter' | 'act' | 'manuscript';
export type ReviewStatus = 'open' | 'in-progress' | 'resolved' | 'ignored' | 'intentional' | 'deferred' | 'wont-change';

export interface ReviewQueueItem {
  sourceType: ReviewSourceType;
  id: string;
  title: string;
  message: string;
  category: string;
  severity?: string;
  status: ReviewStatus;
  sceneId?: string;
  chapterId?: string;
  actId?: string;
  start?: number;
  end?: number;
  originalText?: string;
  suggestedText?: string;
  priority?: RevisionItemPriority;
  tier: ReviewTier;
  sourceMetadata: {
    finding?: Finding;
    warning?: ContinuityWarning;
    revisionItem?: RevisionItem;
    relatedCharacterIds?: string[];
    relatedPlotThreadIds?: string[];
    chapterTitle?: string;
    sceneTitle?: string;
  };
}

const priorityRank: Record<string, number> = {
  critical: 0, high: 1, medium: 2, low: 3, none: 4,
};

function location(project: ProjectData, chapterId?: string, sceneId?: string) {
  for (const act of project.acts) {
    const chapter = act.chapters.find(c => c.id === chapterId);
    if (chapter) {
      const scene = chapter.scenes?.find(s => s.id === sceneId);
      return { act, chapter, scene };
    }
  }
  return { act: undefined, chapter: undefined, scene: undefined };
}

function orderOf(project: ProjectData, item: ReviewQueueItem): [number, number, number, number] {
  const found = location(project, item.chapterId, item.sceneId);
  const act = found.act?.order ?? Number.MAX_SAFE_INTEGER;
  const chapter = found.chapter?.order ?? Number.MAX_SAFE_INTEGER;
  const scene = found.scene?.order ?? Number.MAX_SAFE_INTEGER;
  return [act, chapter, scene, item.start ?? 0];
}

export function buildReviewQueue(
  project: ProjectData,
  findings: Finding[],
  warnings: ContinuityWarning[],
  revisionItems: RevisionItem[],
): ReviewQueueItem[] {
  const items: ReviewQueueItem[] = [];
  for (const finding of findings) {
    const found = location(project, finding.chapterId, finding.sceneId);
    items.push({
      sourceType: 'proofreading', id: `proof-${finding.id}`, title: finding.title || 'Proofreading issue',
      message: finding.message, category: finding.passId, severity: finding.severity,
      status: finding.status === 'accepted' ? 'resolved' : finding.status, sceneId: finding.sceneId, chapterId: finding.chapterId, actId: finding.actId,
      start: finding.position.start, end: finding.position.end, originalText: finding.originalText,
      suggestedText: finding.suggestedText, tier: 'language-proofing',
      sourceMetadata: { finding, chapterTitle: found.chapter?.title, sceneTitle: found.scene?.title },
    });
  }
  for (const warning of warnings) {
    const evidence = warning.evidence.find(e => e.sceneId) || warning.evidence[0];
    const found = location(project, warning.primaryChapterId, evidence?.sceneId);
    items.push({
      sourceType: 'continuity', id: `cont-${warning.id}`, title: warning.title,
      message: warning.summary || warning.description, category: warning.type, severity: warning.severity,
      status: warning.isIntentional ? 'intentional' : warning.isIgnored ? 'ignored' : 'open',
      chapterId: warning.primaryChapterId, sceneId: evidence?.sceneId, actId: found.act?.id,
      tier: 'story-craft', sourceMetadata: { warning, chapterTitle: found.chapter?.title, sceneTitle: found.scene?.title },
    });
  }
  for (const revisionItem of revisionItems) {
    const found = location(project, revisionItem.chapterId, revisionItem.sceneId);
    items.push({
      sourceType: 'revision', id: `rev-${revisionItem.id}`, title: revisionItem.title,
      message: revisionItem.description || revisionItem.notes || 'Revision note', category: revisionItem.category,
      priority: revisionItem.priority, status: revisionItem.status, sceneId: revisionItem.sceneId,
      chapterId: revisionItem.chapterId, actId: revisionItem.actId || found.act?.id,
      originalText: revisionItem.anchoredText, start: revisionItem.anchorOffset?.from, end: revisionItem.anchorOffset?.to,
      tier: 'story-craft', sourceMetadata: {
        revisionItem, chapterTitle: found.chapter?.title, sceneTitle: found.scene?.title,
        relatedCharacterIds: revisionItem.relatedCharacterIds, relatedPlotThreadIds: revisionItem.relatedPlotThreadIds,
      },
    });
  }
  return items.sort((a, b) => {
    return priorityRank[a.priority || 'none'] - priorityRank[b.priority || 'none'] ||
      orderOf(project, a).map((v, i) => v - orderOf(project, b)[i]).find(v => v !== 0) || a.id.localeCompare(b.id);
  });
}

export function filterReviewQueue(items: ReviewQueueItem[], scope: ReviewScope, project: ProjectData, activeSceneId?: string, activeChapterId?: string, activeActId?: string) {
  if (scope === 'manuscript') return items;
  return items.filter(item => {
    if (scope === 'scene') return !!activeSceneId && item.sceneId === activeSceneId;
    if (scope === 'chapter') return !!activeChapterId && item.chapterId === activeChapterId;
    return !!activeActId && item.actId === activeActId;
  });
}
