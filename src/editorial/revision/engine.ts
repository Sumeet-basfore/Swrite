import { ProjectData } from '../../types';
import { 
  RevisionRound, RevisionItem, RevisionSnapshot, 
  RevisionPassType, RevisionRoundStatus, RevisionItemStatus, 
  RevisionItemPriority, RevisionItemCategory, RevisionScope 
} from './types';
import { ContinuityWarning } from '../../types/continuity';

export class RevisionEngine {
  /**
   * 1. REVISION ROUND OPERATIONS
   */
  static addRevisionRound(
    project: ProjectData,
    data: {
      name: string;
      description?: string;
      passType: RevisionPassType;
      scope?: RevisionScope;
      targetActId?: string;
      targetChapterId?: string;
      targetSceneId?: string;
      notes?: string;
      status?: RevisionRoundStatus;
    }
  ): { project: ProjectData; round: RevisionRound } {
    const p = JSON.parse(JSON.stringify(project)) as ProjectData;
    p.revisionRounds = p.revisionRounds || [];

    const now = new Date().toISOString();
    const roundId = `rev-round-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const round: RevisionRound = {
      id: roundId,
      name: data.name.trim(),
      description: data.description?.trim(),
      passType: data.passType,
      status: data.status || 'in-progress',
      scope: data.scope || 'manuscript',
      targetActId: data.targetActId,
      targetChapterId: data.targetChapterId,
      targetSceneId: data.targetSceneId,
      startedAt: data.status === 'planned' ? undefined : now,
      notes: data.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    p.revisionRounds.push(round);
    p.metadata.updatedAt = now;

    return { project: p, round };
  }

  static updateRevisionRound(
    project: ProjectData,
    roundId: string,
    updates: Partial<Omit<RevisionRound, 'id' | 'createdAt'>>
  ): ProjectData {
    const p = JSON.parse(JSON.stringify(project)) as ProjectData;
    p.revisionRounds = p.revisionRounds || [];

    const index = p.revisionRounds.findIndex(r => r.id === roundId);
    if (index === -1) return p;

    const now = new Date().toISOString();
    const existing = p.revisionRounds[index];

    p.revisionRounds[index] = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    p.metadata.updatedAt = now;
    return p;
  }

  static deleteRevisionRound(project: ProjectData, roundId: string): ProjectData {
    const p = JSON.parse(JSON.stringify(project)) as ProjectData;
    p.revisionRounds = (p.revisionRounds || []).filter(r => r.id !== roundId);
    // Disassociate items from this round without deleting the items
    p.revisionItems = (p.revisionItems || []).map(item => {
      if (item.revisionRoundId === roundId) {
        const { revisionRoundId, ...rest } = item;
        return rest;
      }
      return item;
    });

    p.metadata.updatedAt = new Date().toISOString();
    return p;
  }

  static completeRevisionRound(
    project: ProjectData,
    roundId: string,
    snapshotLabel?: string
  ): { project: ProjectData; snapshot?: RevisionSnapshot } {
    const p = JSON.parse(JSON.stringify(project)) as ProjectData;
    p.revisionRounds = p.revisionRounds || [];

    const index = p.revisionRounds.findIndex(r => r.id === roundId);
    if (index === -1) return { project: p };

    const now = new Date().toISOString();
    const existing = p.revisionRounds[index];

    p.revisionRounds[index] = {
      ...existing,
      status: 'completed',
      completedAt: now,
      snapshotLabel: snapshotLabel || existing.snapshotLabel || `After ${existing.name}`,
      updatedAt: now,
    };

    // Calculate snapshot summary
    const roundItems = (p.revisionItems || []).filter(i => i.revisionRoundId === roundId);
    const resolvedCount = roundItems.filter(i => i.status === 'resolved' || i.status === 'wont-change').length;

    let snapshot: RevisionSnapshot | undefined;
    if (snapshotLabel || existing.name) {
      snapshot = {
        id: `rev-snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        roundId,
        label: snapshotLabel || `After ${existing.name}`,
        summary: `Completed ${existing.name} (${existing.passType} pass). ${resolvedCount}/${roundItems.length} items addressed.`,
        totalItems: roundItems.length,
        itemsResolved: resolvedCount,
        createdAt: now,
      };

      p.metadata.revisionSnapshots = p.metadata.revisionSnapshots || [];
      p.metadata.revisionSnapshots.push(snapshot);
    }

    p.metadata.updatedAt = now;
    return { project: p, snapshot };
  }

  /**
   * 2. REVISION ITEM OPERATIONS
   */
  static addRevisionItem(
    project: ProjectData,
    data: {
      revisionRoundId?: string;
      title: string;
      description?: string;
      category: RevisionItemCategory;
      priority?: RevisionItemPriority;
      status?: RevisionItemStatus;
      notes?: string;
      actId?: string;
      chapterId?: string;
      sceneId?: string;
      anchoredText?: string;
      anchorOffset?: { from: number; to: number };
      relatedCharacterIds?: string[];
      relatedPlotThreadIds?: string[];
      relatedStoryArcIds?: string[];
      relatedEventIds?: string[];
      sourceContinuityId?: string;
    }
  ): { project: ProjectData; item: RevisionItem } {
    const p = JSON.parse(JSON.stringify(project)) as ProjectData;
    p.revisionItems = p.revisionItems || [];

    const now = new Date().toISOString();
    const itemId = `rev-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Resolve hierarchy if sceneId is provided
    let resolvedActId = data.actId;
    let resolvedChapterId = data.chapterId;

    if (data.sceneId && (!resolvedChapterId || !resolvedActId)) {
      for (const act of p.acts || []) {
        for (const ch of act.chapters || []) {
          if (ch.scenes?.some(s => s.id === data.sceneId)) {
            resolvedChapterId = ch.id;
            resolvedActId = act.id;
            break;
          }
        }
      }
    } else if (data.chapterId && !resolvedActId) {
      const act = p.acts?.find(a => a.chapters.some(c => c.id === data.chapterId));
      if (act) resolvedActId = act.id;
    }

    const item: RevisionItem = {
      id: itemId,
      revisionRoundId: data.revisionRoundId,
      title: data.title.trim(),
      description: data.description?.trim(),
      category: data.category,
      priority: data.priority || 'medium',
      status: data.status || 'open',
      notes: data.notes?.trim(),
      actId: resolvedActId,
      chapterId: resolvedChapterId,
      sceneId: data.sceneId,
      anchoredText: data.anchoredText,
      anchorOffset: data.anchorOffset,
      needsReanchoring: false,
      relatedCharacterIds: data.relatedCharacterIds || [],
      relatedPlotThreadIds: data.relatedPlotThreadIds || [],
      relatedStoryArcIds: data.relatedStoryArcIds || [],
      relatedEventIds: data.relatedEventIds || [],
      sourceContinuityId: data.sourceContinuityId,
      createdAt: now,
      updatedAt: now,
    };

    p.revisionItems.push(item);
    p.metadata.updatedAt = now;

    return { project: p, item };
  }

  static updateRevisionItem(
    project: ProjectData,
    itemId: string,
    updates: Partial<Omit<RevisionItem, 'id' | 'createdAt'>>
  ): ProjectData {
    const p = JSON.parse(JSON.stringify(project)) as ProjectData;
    p.revisionItems = p.revisionItems || [];

    const index = p.revisionItems.findIndex(i => i.id === itemId);
    if (index === -1) return p;

    const now = new Date().toISOString();
    const existing = p.revisionItems[index];

    let resolvedAt = existing.resolvedAt;
    if (updates.status === 'resolved' && existing.status !== 'resolved') {
      resolvedAt = now;
    } else if (updates.status && updates.status !== 'resolved') {
      resolvedAt = undefined;
    }

    p.revisionItems[index] = {
      ...existing,
      ...updates,
      resolvedAt,
      updatedAt: now,
    };

    p.metadata.updatedAt = now;
    return p;
  }

  static deleteRevisionItem(project: ProjectData, itemId: string): ProjectData {
    const p = JSON.parse(JSON.stringify(project)) as ProjectData;
    p.revisionItems = (p.revisionItems || []).filter(i => i.id !== itemId);
    p.metadata.updatedAt = new Date().toISOString();
    return p;
  }

  static resolveRevisionItem(project: ProjectData, itemId: string, notes?: string): ProjectData {
    const p = JSON.parse(JSON.stringify(project)) as ProjectData;
    p.revisionItems = p.revisionItems || [];

    const index = p.revisionItems.findIndex(i => i.id === itemId);
    if (index === -1) return p;

    const now = new Date().toISOString();
    const existing = p.revisionItems[index];

    p.revisionItems[index] = {
      ...existing,
      status: 'resolved',
      notes: notes ? `${existing.notes ? `${existing.notes}\n\n` : ''}Resolved: ${notes}` : existing.notes,
      resolvedAt: now,
      updatedAt: now,
    };

    p.metadata.updatedAt = now;
    return p;
  }

  static deferRevisionItem(project: ProjectData, itemId: string): ProjectData {
    return this.updateRevisionItem(project, itemId, { status: 'deferred' });
  }

  /**
   * 3. INLINE REVISION NOTES & RESILIENT ANCHORING
   */
  static createInlineRevisionNote(
    project: ProjectData,
    params: {
      chapterId: string;
      sceneId?: string;
      anchoredText: string;
      anchorOffset?: { from: number; to: number };
      title?: string;
      category?: RevisionItemCategory;
      priority?: RevisionItemPriority;
      notes?: string;
      revisionRoundId?: string;
    }
  ): { project: ProjectData; item: RevisionItem } {
    const title = params.title || `Revision: "${params.anchoredText.slice(0, 32)}${params.anchoredText.length > 32 ? '...' : ''}"`;
    return this.addRevisionItem(project, {
      revisionRoundId: params.revisionRoundId,
      title,
      description: params.notes,
      category: params.category || 'prose',
      priority: params.priority || 'medium',
      chapterId: params.chapterId,
      sceneId: params.sceneId,
      anchoredText: params.anchoredText,
      anchorOffset: params.anchorOffset,
      notes: params.notes,
    });
  }

  /**
   * Resilient anchor check: determines if anchored text still exists in target prose
   */
  static validateAnchoring(
    itemOrProse: RevisionItem | string,
    targetProseOrAnchoredText?: string
  ): { valid: boolean; isValid: boolean; offset?: { from: number; to: number } } {
    let anchoredText = '';
    let targetProseText = '';

    if (typeof itemOrProse === 'object' && itemOrProse !== null) {
      anchoredText = itemOrProse.anchoredText || '';
      targetProseText = targetProseOrAnchoredText || '';
    } else {
      // Called as validateAnchoring(prose, anchoredText)
      targetProseText = itemOrProse || '';
      anchoredText = targetProseOrAnchoredText || '';
    }

    if (!anchoredText) {
      return { valid: true, isValid: true };
    }

    const cleanProse = targetProseText.replace(/<[^>]*>/g, '');
    const directIdx = cleanProse.indexOf(anchoredText);

    if (directIdx >= 0) {
      return {
        valid: true,
        isValid: true,
        offset: { from: directIdx, to: directIdx + anchoredText.length },
      };
    }

    // Try case-insensitive fallback or trimmed whitespace
    const trimmed = anchoredText.trim();
    const lowerIdx = cleanProse.toLowerCase().indexOf(trimmed.toLowerCase());
    if (lowerIdx >= 0) {
      return {
        valid: true,
        isValid: true,
        offset: { from: lowerIdx, to: lowerIdx + trimmed.length },
      };
    }

    return { valid: false, isValid: false };
  }

  /**
   * 4. CONTINUITY WARNING CONVERSION
   */
  static convertContinuityWarningToRevisionItem(
    project: ProjectData,
    warning: ContinuityWarning,
    overrides?: string | {
      revisionRoundId?: string;
      priority?: RevisionItemPriority;
      notes?: string;
    }
  ): { project: ProjectData; item: RevisionItem } {
    const opts = typeof overrides === 'string' ? { revisionRoundId: overrides } : overrides;
    let category: RevisionItemCategory = 'continuity';
    if (warning.type === 'knowledge' || warning.type === 'state' || warning.type === 'attributes') {
      category = 'character';
    } else if (warning.type === 'thread-dormancy') {
      category = 'plot';
    } else if (warning.type === 'timeline') {
      category = 'continuity';
    }

    let priority: RevisionItemPriority = 'medium';
    if (warning.severity === 'critical') priority = 'critical';
    else if (warning.severity === 'warning') priority = 'high';
    else priority = 'low';

    const firstEvidence = warning.evidence?.[0];
    const relatedCharIds: string[] = [];
    const relatedThreadIds: string[] = [];

    if (warning.entityType === 'character' && warning.entityId) {
      relatedCharIds.push(warning.entityId);
    } else if (warning.entityType === 'plotThread' && warning.entityId) {
      relatedThreadIds.push(warning.entityId);
    }

    return this.addRevisionItem(project, {
      revisionRoundId: opts?.revisionRoundId,
      title: warning.title,
      description: warning.description || warning.summary,
      category,
      priority: opts?.priority || priority,
      notes: opts?.notes || (warning.suggestedAction ? `Suggestion: ${warning.suggestedAction.label}` : undefined),
      sceneId: firstEvidence?.sceneId,
      chapterId: warning.primaryChapterId || firstEvidence?.chapterId,
      relatedCharacterIds: relatedCharIds,
      relatedPlotThreadIds: relatedThreadIds,
      sourceContinuityId: warning.id,
    });
  }
}
