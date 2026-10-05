import { ProjectData, Scene, Chapter, Character, PlotThread } from '../../types';
import { 
  RevisionRound, RevisionItem, RevisionFilterOptions, 
  SceneRevisionStatus, StoryAwareRevisionContext 
} from './types';
import { StoryEngineQueries } from '../../engine';

export const RevisionQueries = {
  /**
   * 1. REVISION ROUND QUERIES
   */
  getRevisionRounds(project: ProjectData): RevisionRound[] {
    return project.revisionRounds || [];
  },

  getRevisionRoundById(project: ProjectData, roundId: string): RevisionRound | undefined {
    return (project.revisionRounds || []).find(r => r.id === roundId);
  },

  getActiveRevisionRound(project: ProjectData): RevisionRound | undefined {
    return (project.revisionRounds || []).find(r => r.status === 'in-progress');
  },

  /**
   * 2. REVISION ITEM QUERIES & FILTERING
   */
  getRevisionItems(project: ProjectData, filter?: RevisionFilterOptions): RevisionItem[] {
    let items = project.revisionItems || [];

    if (!filter) return items;

    if (filter.roundId) {
      items = items.filter(i => i.revisionRoundId === filter.roundId);
    }

    if (filter.category) {
      items = items.filter(i => i.category === filter.category);
    }

    if (filter.priority) {
      items = items.filter(i => i.priority === filter.priority);
    }

    if (filter.status) {
      items = items.filter(i => i.status === filter.status);
    }

    if (filter.actId) {
      items = items.filter(i => i.actId === filter.actId);
    }

    if (filter.chapterId) {
      items = items.filter(i => i.chapterId === filter.chapterId);
    }

    if (filter.sceneId) {
      items = items.filter(i => i.sceneId === filter.sceneId);
    }

    if (filter.characterId) {
      items = items.filter(i => (i.relatedCharacterIds || []).includes(filter.characterId!));
    }

    if (filter.plotThreadId) {
      items = items.filter(i => (i.relatedPlotThreadIds || []).includes(filter.plotThreadId!));
    }

    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      items = items.filter(i => 
        i.title.toLowerCase().includes(q) || 
        (i.description && i.description.toLowerCase().includes(q)) ||
        (i.notes && i.notes.toLowerCase().includes(q)) ||
        (i.anchoredText && i.anchoredText.toLowerCase().includes(q))
      );
    }

    return items;
  },

  getRevisionItemById(project: ProjectData, itemId: string): RevisionItem | undefined {
    return (project.revisionItems || []).find(i => i.id === itemId);
  },

  getRevisionItemsForScene(project: ProjectData, sceneId: string): RevisionItem[] {
    return (project.revisionItems || []).filter(i => i.sceneId === sceneId);
  },

  getRevisionItemsForChapter(project: ProjectData, chapterId: string): RevisionItem[] {
    return (project.revisionItems || []).filter(i => {
      if (i.chapterId === chapterId) return true;
      // Also check if item belongs to a scene inside this chapter
      if (i.sceneId) {
        const ch = project.acts?.flatMap(a => a.chapters).find(c => c.id === chapterId);
        return ch?.scenes?.some(s => s.id === i.sceneId) || false;
      }
      return false;
    });
  },

  getRevisionItemsForAct(project: ProjectData, actId: string): RevisionItem[] {
    const act = project.acts?.find(a => a.id === actId);
    if (!act) return [];
    const chapterIds = new Set(act.chapters.map(c => c.id));
    return (project.revisionItems || []).filter(i => {
      if (i.actId === actId) return true;
      if (i.chapterId && chapterIds.has(i.chapterId)) return true;
      return false;
    });
  },

  /**
   * 3. SCENE & CHAPTER REVISION STATUS DERIVATIONS
   */
  getSceneRevisionStatus(project: ProjectData, sceneId: string): {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    deferred: number;
    status: SceneRevisionStatus;
  } {
    const items = this.getRevisionItemsForScene(project, sceneId);
    const open = items.filter(i => i.status === 'open').length;
    const inProgress = items.filter(i => i.status === 'in-progress').length;
    const resolved = items.filter(i => i.status === 'resolved' || i.status === 'wont-change').length;
    const deferred = items.filter(i => i.status === 'deferred').length;

    let status: SceneRevisionStatus = 'no-revision';
    if (items.length > 0) {
      if (inProgress > 0) status = 'in-progress';
      else if (open > 0) status = 'needs-review';
      else status = 'reviewed';
    }

    return {
      total: items.length,
      open,
      inProgress,
      resolved,
      deferred,
      status,
    };
  },

  getChapterRevisionSummary(project: ProjectData, chapterId: string): {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    deferred: number;
    status: SceneRevisionStatus;
    byCategory: Record<string, number>;
  } {
    const items = this.getRevisionItemsForChapter(project, chapterId);
    const open = items.filter(i => i.status === 'open').length;
    const inProgress = items.filter(i => i.status === 'in-progress').length;
    const resolved = items.filter(i => i.status === 'resolved' || i.status === 'wont-change').length;
    const deferred = items.filter(i => i.status === 'deferred').length;

    const byCategory: Record<string, number> = {};
    items.forEach(i => {
      byCategory[i.category] = (byCategory[i.category] || 0) + 1;
    });

    let status: SceneRevisionStatus = 'no-revision';
    if (items.length > 0) {
      if (inProgress > 0) status = 'in-progress';
      else if (open > 0) status = 'needs-review';
      else status = 'reviewed';
    }

    return {
      total: items.length,
      open,
      inProgress,
      resolved,
      deferred,
      status,
      byCategory,
    };
  },

  /**
   * 4. STORY-AWARE REVISION CONTEXT
   */
  getStoryAwareRevisionContext(project: ProjectData, itemOrId: RevisionItem | string): StoryAwareRevisionContext | null {
    let item: RevisionItem | undefined;
    if (typeof itemOrId === 'string') {
      item = (project.revisionItems || []).find(i => i.id === itemOrId);
    } else {
      item = itemOrId;
    }

    if (!item) return null;

    const context: StoryAwareRevisionContext = {
      characters: [],
      plotThreads: [],
    };

    // 1. Scene & Chapter Context
    if (item.sceneId) {
      const scene = StoryEngineQueries.getSceneById(project, item.sceneId);
      if (scene) {
        let povName: string | undefined;
        if (scene.povCharacterId) {
          const povChar = StoryEngineQueries.getCharacterById(project, scene.povCharacterId);
          povName = povChar?.name;
        }

        context.scene = {
          id: scene.id,
          title: scene.title,
          purpose: scene.purpose,
          goal: scene.goal,
          conflict: scene.conflict,
          outcome: scene.outcome,
          povCharacterName: povName,
          wordCount: scene.wordCount || 0,
        };
        context.sceneName = scene.title;

        const goalsParts = [];
        if (scene.purpose) goalsParts.push(`Purpose: ${scene.purpose}`);
        if (scene.goal) goalsParts.push(`Goal: ${scene.goal}`);
        if (scene.conflict) goalsParts.push(`Conflict: ${scene.conflict}`);
        if (scene.outcome) goalsParts.push(`Outcome: ${scene.outcome}`);
        context.sceneGoals = goalsParts.join(' | ') || undefined;
      }
    }

    if (item.chapterId) {
      const chapter = StoryEngineQueries.getChapterById(project, item.chapterId);
      if (chapter) {
        const act = project.acts?.find(a => a.chapters.some(c => c.id === chapter.id));
        context.chapter = {
          id: chapter.id,
          title: chapter.title,
          wordCount: chapter.wordCount || 0,
          actTitle: act?.title,
        };
        context.chapterName = chapter.title;
      }
    }

    // 2. Character State & Last Seen Context
    const charIds = item.relatedCharacterIds || [];
    for (const cId of charIds) {
      const char = StoryEngineQueries.getCharacterById(project, cId);
      if (char) {
        context.characters.push({
          id: char.id,
          name: char.name,
          role: char.role,
          activeArc: typeof (char as any).arcProgress === 'string' ? (char as any).arcProgress : undefined,
          currentBelief: Array.isArray(char.beliefs) && char.beliefs.length > 0 
            ? (typeof char.beliefs[0] === 'string' ? char.beliefs[0] : char.beliefs[0].statement)
            : undefined,
        });
      }
    }

    const charId = item.relatedCharacterIds?.[0];
    if (charId) {
      const character = StoryEngineQueries.getCharacterById(project, charId);
      if (character) {
        const lastSeen = StoryEngineQueries.getCharacterLastSeen(project, charId);
        const goals = (character.goals || []).map(g => 
          typeof g === 'string' ? { id: 'legacy', statement: g, status: 'active' } : { id: g.id, statement: (g as any).statement || g.description || g.title || '', status: g.status }
        );
        const beliefs = (character.beliefs || []).map(b =>
          typeof b === 'string' ? { id: 'legacy', statement: b, certainty: 'strong' } : { id: b.id, statement: b.statement, certainty: b.certainty }
        );

        const currStateStr = typeof character.currentState === 'string'
          ? character.currentState
          : (character.currentState as any)?.summary || (character.currentState as any)?.emotionalState || undefined;

        context.character = {
          id: character.id,
          name: character.name,
          role: character.role || 'Supporting',
          currentState: currStateStr,
          goals,
          beliefs,
          lastSeenSceneTitle: lastSeen?.scene?.title,
          lastSeenChapterTitle: lastSeen?.chapter?.title,
        };
      }
    }

    // 3. Plot Thread Context
    const threadIds = item.relatedPlotThreadIds || [];
    for (const tId of threadIds) {
      const pt = StoryEngineQueries.getThreadById(project, tId) || (project.plotThreads || []).find(t => t.id === tId);
      if (pt) {
        context.plotThreads.push({
          id: pt.id,
          name: pt.title,
          status: pt.status,
          resolutionPromise: pt.expectedPayoff || pt.description,
        });
      }
    }

    const threadId = item.relatedPlotThreadIds?.[0];
    if (threadId) {
      const thread = StoryEngineQueries.getThreadById(project, threadId) || (project.plotThreads || []).find(t => t.id === threadId);
      if (thread) {
        context.plotThread = {
          id: thread.id,
          title: thread.title,
          type: thread.type,
          status: thread.status,
          expectedPayoff: thread.expectedPayoff,
        };
      }
    }

    return context;
  }
};
