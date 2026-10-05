import { 
  ProjectData, Scene, Character, Location, Faction, 
  Item, Event, StoryArc, PlotThread, ResearchNote, Chapter, Act,
  KnowledgeEntry, PlotThreadStatus, PlotThreadType,
  GoalItem, BeliefItem, KnowledgeItem, SecretItem, CharacterState,
  CharacterStateCheckpoint, RelationshipMilestone, GoalStatus,
  BeliefStatus, BeliefCertainty, SecretStatus
} from '../types';
import { migrateProjectToStoryEngine } from './migration';
import { StoryEngineQueries } from './queries';

/**
 * Swrite Story Engine
 * Pure TypeScript domain layer governing narrative entities, relational integrity,
 * character psychology, plot threads, worldbuilding, and continuity.
 */
export class StoryEngine {
  private static syncChapterContent(chapter: Chapter): void {
    if (!chapter.scenes) return;
    chapter.content = chapter.scenes.map(scene => scene.content || '').join('<hr/>');
    const text = chapter.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    chapter.wordCount = text ? text.split(' ').length : 0;
    chapter.updatedAt = new Date().toISOString();
  }

  /**
   * Ensure project data is fully migrated to the Story Engine domain model
   */
  static initialize(project: ProjectData): ProjectData {
    return migrateProjectToStoryEngine(project);
  }

  // ==========================================
  // ACT OPERATIONS
  // ==========================================

  static addAct(project: ProjectData, actData?: Partial<Act>): { project: ProjectData; act: Act } {
    const p = migrateProjectToStoryEngine(project);
    const order = (p.acts || []).length + 1;
    const newAct: Act = {
      id: actData?.id || `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: actData?.title || `Act ${order}`,
      order,
      description: actData?.description || '',
      targetWordCount: actData?.targetWordCount,
      color: actData?.color || '#818CF8',
      storyArcIds: actData?.storyArcIds || [],
      chapters: actData?.chapters || []
    };
    p.acts.push(newAct);
    return { project: p, act: newAct };
  }

  static updateAct(project: ProjectData, actId: string, updates: Partial<Act>): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    p.acts = p.acts.map(a => a.id === actId ? { ...a, ...updates } : a);
    return p;
  }

  static deleteAct(project: ProjectData, actId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    p.acts = p.acts.filter(a => a.id !== actId);
    p.acts.forEach((a, idx) => { a.order = idx + 1; });
    return p;
  }

  static reorderActs(project: ProjectData, sourceIndex: number, targetIndex: number): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (sourceIndex < 0 || sourceIndex >= p.acts.length || targetIndex < 0 || targetIndex >= p.acts.length) {
      return p;
    }
    const [moved] = p.acts.splice(sourceIndex, 1);
    p.acts.splice(targetIndex, 0, moved);
    p.acts.forEach((a, idx) => { a.order = idx + 1; });
    return p;
  }

  // ==========================================
  // CHAPTER OPERATIONS
  // ==========================================

  static addChapter(project: ProjectData, actId?: string, chapterData?: Partial<Chapter>): { project: ProjectData; chapter: Chapter } {
    const p = migrateProjectToStoryEngine(project);
    let targetAct = p.acts.find(a => a.id === actId);
    if (!targetAct) {
      if (p.acts.length === 0) {
        const { act } = this.addAct(p, { title: 'Act I' });
        targetAct = act;
      } else {
        targetAct = p.acts[0];
      }
    }

    const order = (targetAct.chapters || []).length + 1;
    const newChapterId = chapterData?.id || `ch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newChapter: Chapter = {
      id: newChapterId,
      title: chapterData?.title || `Chapter ${order}`,
      order,
      actId: targetAct.id,
      content: chapterData?.content || `<h1>${chapterData?.title || `Chapter ${order}`}</h1><p></p>`,
      wordCount: chapterData?.wordCount || 0,
      targetWordCount: chapterData?.targetWordCount,
      status: chapterData?.status || 'draft',
      synopsis: chapterData?.synopsis || '',
      povCharacterId: chapterData?.povCharacterId,
      tags: chapterData?.tags || [],
      wikilinks: chapterData?.wikilinks || [],
      plotThreadIds: chapterData?.plotThreadIds || [],
      locationIds: chapterData?.locationIds || [],
      characterIds: chapterData?.characterIds || [],
      scenes: chapterData?.scenes || [
        {
          id: `scene-${newChapterId}`,
          title: chapterData?.title || `Chapter ${order}`,
          chapterId: newChapterId,
          actId: targetAct.id,
          order: 1,
          content: chapterData?.content || `<p></p>`,
          wordCount: chapterData?.wordCount || 0,
          povCharacterId: chapterData?.povCharacterId,
          characterIds: chapterData?.characterIds || (chapterData?.povCharacterId ? [chapterData.povCharacterId] : []),
          locationIds: chapterData?.locationIds || [],
          plotThreadIds: chapterData?.plotThreadIds || [],
          eventIds: [],
          storyArcIds: targetAct.storyArcIds || [],
          purpose: '',
          conflict: '',
          goal: '',
          outcome: '',
          consequence: '',
          tensionLevel: 5,
          status: 'draft',
          synopsis: chapterData?.synopsis || '',
          tags: chapterData?.tags || [],
          updatedAt: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString()
    };

    targetAct.chapters.push(newChapter);
    return { project: p, chapter: newChapter };
  }

  static updateChapter(project: ProjectData, chapterId: string, updates: Partial<Chapter>): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    for (const act of p.acts) {
      const idx = act.chapters.findIndex(c => c.id === chapterId);
      if (idx !== -1) {
        act.chapters[idx] = {
          ...act.chapters[idx],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        break;
      }
    }
    return p;
  }

  static deleteChapter(project: ProjectData, chapterId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    for (const act of p.acts) {
      act.chapters = act.chapters.filter(c => c.id !== chapterId);
      act.chapters.forEach((c, idx) => { c.order = idx + 1; });
    }
    return p;
  }

  static moveChapterToAct(project: ProjectData, chapterId: string, targetActId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    let foundChapter: Chapter | null = null;
    for (const act of p.acts) {
      const idx = act.chapters.findIndex(c => c.id === chapterId);
      if (idx !== -1) {
        foundChapter = act.chapters.splice(idx, 1)[0];
        act.chapters.forEach((c, i) => { c.order = i + 1; });
        break;
      }
    }

    if (foundChapter) {
      const targetAct = p.acts.find(a => a.id === targetActId);
      if (targetAct) {
        foundChapter.actId = targetActId;
        foundChapter.order = targetAct.chapters.length + 1;
        if (foundChapter.scenes) {
          foundChapter.scenes.forEach(s => { s.actId = targetActId; });
        }
        targetAct.chapters.push(foundChapter);
      }
    }

    return p;
  }

  static reorderChapters(project: ProjectData, sourceChapterId: string, targetActId: string, targetIndex?: number): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    let chapterToMove: Chapter | null = null;

    for (const act of p.acts) {
      const idx = act.chapters.findIndex(c => c.id === sourceChapterId);
      if (idx !== -1) {
        chapterToMove = act.chapters.splice(idx, 1)[0];
        act.chapters.forEach((c, i) => { c.order = i + 1; });
        break;
      }
    }

    if (!chapterToMove) return p;

    const targetAct = p.acts.find(a => a.id === targetActId);
    if (!targetAct) return p;

    chapterToMove.actId = targetActId;
    if (chapterToMove.scenes) {
      chapterToMove.scenes.forEach(s => { s.actId = targetActId; });
    }

    if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= targetAct.chapters.length) {
      targetAct.chapters.splice(targetIndex, 0, chapterToMove);
    } else {
      targetAct.chapters.push(chapterToMove);
    }

    targetAct.chapters.forEach((c, idx) => { c.order = idx + 1; });
    return p;
  }

  static reorderScenes(project: ProjectData, chapterId: string, orderedSceneIds: string[]): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    for (const act of p.acts) {
      const ch = act.chapters.find(c => c.id === chapterId);
      if (ch && ch.scenes) {
        const sceneMap = new Map(ch.scenes.map(s => [s.id, s]));
        const reordered: Scene[] = [];
        orderedSceneIds.forEach((sId, idx) => {
          const s = sceneMap.get(sId);
          if (s) {
            s.order = idx + 1;
            reordered.push(s);
            sceneMap.delete(sId);
          }
        });
        // Append any remaining scenes
        sceneMap.forEach(s => {
          s.order = reordered.length + 1;
          reordered.push(s);
        });
        ch.scenes = reordered;
        break;
      }
    }
    return p;
  }

  // ==========================================
  // SCENE OPERATIONS
  // ==========================================

  static addScene(project: ProjectData, chapterId: string, sceneData?: Partial<Scene>): { project: ProjectData; scene: Scene } {
    const p = migrateProjectToStoryEngine(project);
    let targetChapter: Chapter | null = null;
    let targetAct: Act | null = null;

    for (const act of p.acts) {
      const ch = act.chapters.find(c => c.id === chapterId);
      if (ch) {
        targetChapter = ch;
        targetAct = act;
        break;
      }
    }

    if (!targetChapter) {
      targetChapter = p.acts[0]?.chapters[0];
      targetAct = p.acts[0];
    }

    if (!targetChapter) {
      throw new Error('Cannot add scene: No chapters exist in project.');
    }

    if (!targetChapter.scenes) targetChapter.scenes = [];

    const order = targetChapter.scenes.length + 1;
    const newScene: Scene = {
      id: sceneData?.id || `scene-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: sceneData?.title || 'Untitled Scene',
      chapterId: targetChapter.id,
      actId: targetAct?.id,
      order,
      content: sceneData?.content || '<p></p>',
      wordCount: sceneData?.wordCount || 0,
      targetWordCount: sceneData?.targetWordCount,
      povCharacterId: sceneData?.povCharacterId,
      characterIds: sceneData?.characterIds || (sceneData?.povCharacterId ? [sceneData.povCharacterId] : []),
      locationIds: sceneData?.locationIds || [],
      plotThreadIds: sceneData?.plotThreadIds || [],
      eventIds: sceneData?.eventIds || [],
      storyArcIds: sceneData?.storyArcIds || targetAct?.storyArcIds || [],
      purpose: sceneData?.purpose || '',
      conflict: sceneData?.conflict || '',
      goal: sceneData?.goal || '',
      outcome: sceneData?.outcome || '',
      consequence: sceneData?.consequence || '',
      tensionLevel: sceneData?.tensionLevel || 5,
      timelineDate: sceneData?.timelineDate,
      status: sceneData?.status || 'draft',
      synopsis: sceneData?.synopsis || '',
      tags: sceneData?.tags || [],
      updatedAt: new Date().toISOString()
    };

    targetChapter.scenes.push(newScene);
    this.syncSceneRelations(p, newScene);
    this.syncChapterContent(targetChapter);

    return { project: p, scene: newScene };
  }

  static updateScene(project: ProjectData, sceneId: string, updates: Partial<Scene>): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    let updatedScene: Scene | null = null;

    for (const act of p.acts) {
      for (const ch of act.chapters) {
        if (ch.scenes) {
          const idx = ch.scenes.findIndex(s => s.id === sceneId);
          if (idx !== -1) {
            ch.scenes[idx] = {
              ...ch.scenes[idx],
              ...updates,
              updatedAt: new Date().toISOString()
            };
            updatedScene = ch.scenes[idx];
            this.syncChapterContent(ch);
            break;
          }
        }
      }
      if (updatedScene) break;
    }

    if (updatedScene) {
      this.syncSceneRelations(p, updatedScene);
    }

    return p;
  }

  static deleteScene(project: ProjectData, sceneId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);

    for (const act of p.acts) {
      for (const ch of act.chapters) {
        if (ch.scenes) {
          const hadScene = ch.scenes.some(s => s.id === sceneId);
          ch.scenes = ch.scenes.filter(s => s.id !== sceneId);
          ch.scenes.forEach((s, idx) => { s.order = idx + 1; });
          if (hadScene) this.syncChapterContent(ch);
        }
      }
    }

    // Clean up references across plot threads and events
    (p.plotThreads || []).forEach(t => {
      t.relatedSceneIds = (t.relatedSceneIds || []).filter(id => id !== sceneId);
    });

    (p.events || []).forEach(e => {
      if (e.sceneId === sceneId) e.sceneId = undefined;
    });

    return p;
  }

  static duplicateScene(project: ProjectData, sceneId: string): { project: ProjectData; scene: Scene } {
    const p = migrateProjectToStoryEngine(project);
    let originalScene: Scene | null = null;
    let targetChapter: Chapter | null = null;
    let originalIndex = -1;

    for (const act of p.acts) {
      for (const ch of act.chapters) {
        if (ch.scenes) {
          const idx = ch.scenes.findIndex(s => s.id === sceneId);
          if (idx !== -1) {
            originalScene = ch.scenes[idx];
            targetChapter = ch;
            originalIndex = idx;
            break;
          }
        }
      }
      if (originalScene) break;
    }

    if (!originalScene || !targetChapter || !targetChapter.scenes) {
      throw new Error(`Scene ${sceneId} not found for duplication`);
    }

    const newScene: Scene = {
      ...originalScene,
      id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: `${originalScene.title} (Copy)`,
      characterIds: [...(originalScene.characterIds || [])],
      locationIds: [...(originalScene.locationIds || [])],
      plotThreadIds: [...(originalScene.plotThreadIds || [])],
      eventIds: [...(originalScene.eventIds || [])],
      storyArcIds: [...(originalScene.storyArcIds || [])],
      tags: [...(originalScene.tags || [])],
      status: 'draft',
      updatedAt: new Date().toISOString()
    };

    targetChapter.scenes.splice(originalIndex + 1, 0, newScene);
    targetChapter.scenes.forEach((s, idx) => { s.order = idx + 1; });
    this.syncSceneRelations(p, newScene);
    this.syncChapterContent(targetChapter);

    return { project: p, scene: newScene };
  }

  static splitScene(
    project: ProjectData, 
    sceneId: string, 
    contentBefore: string, 
    contentAfter: string, 
    newSceneTitle?: string
  ): { project: ProjectData; originalScene: Scene; newScene: Scene } {
    const p = migrateProjectToStoryEngine(project);
    let originalScene: Scene | null = null;
    let targetChapter: Chapter | null = null;
    let originalIndex = -1;

    for (const act of p.acts) {
      for (const ch of act.chapters) {
        if (ch.scenes) {
          const idx = ch.scenes.findIndex(s => s.id === sceneId);
          if (idx !== -1) {
            originalScene = ch.scenes[idx];
            targetChapter = ch;
            originalIndex = idx;
            break;
          }
        }
      }
      if (originalScene) break;
    }

    if (!originalScene || !targetChapter || !targetChapter.scenes) {
      throw new Error(`Scene ${sceneId} not found for split`);
    }

    // Helper to calculate word count
    const countWords = (html: string) => {
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return text ? text.split(' ').length : 0;
    };

    // Update original scene with first half
    originalScene.content = contentBefore;
    originalScene.wordCount = countWords(contentBefore);
    originalScene.updatedAt = new Date().toISOString();

    // Create new second scene
    const newScene: Scene = {
      id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: newSceneTitle || 'Untitled Scene',
      chapterId: targetChapter.id,
      actId: originalScene.actId,
      order: originalScene.order + 1,
      content: contentAfter,
      wordCount: countWords(contentAfter),
      povCharacterId: originalScene.povCharacterId,
      characterIds: [...(originalScene.characterIds || [])],
      locationIds: [...(originalScene.locationIds || [])],
      plotThreadIds: [...(originalScene.plotThreadIds || [])],
      eventIds: [],
      storyArcIds: [...(originalScene.storyArcIds || [])],
      purpose: originalScene.purpose,
      conflict: originalScene.conflict,
      goal: originalScene.goal,
      outcome: originalScene.outcome,
      consequence: originalScene.consequence,
      tensionLevel: originalScene.tensionLevel,
      status: originalScene.status,
      tags: [...(originalScene.tags || [])],
      updatedAt: new Date().toISOString()
    };

    targetChapter.scenes.splice(originalIndex + 1, 0, newScene);
    targetChapter.scenes.forEach((s, idx) => { s.order = idx + 1; });
    this.syncSceneRelations(p, newScene);
    this.syncChapterContent(targetChapter);

    return { project: p, originalScene, newScene };
  }

  static mergeScenes(
    project: ProjectData, 
    firstSceneId: string, 
    secondSceneId: string
  ): { project: ProjectData; mergedScene: Scene } {
    const p = migrateProjectToStoryEngine(project);
    let firstScene: Scene | null = null;
    let secondScene: Scene | null = null;
    let targetChapter: Chapter | null = null;

    for (const act of p.acts) {
      for (const ch of act.chapters) {
        if (ch.scenes) {
          const s1 = ch.scenes.find(s => s.id === firstSceneId);
          const s2 = ch.scenes.find(s => s.id === secondSceneId);
          if (s1 && s2) {
            firstScene = s1;
            secondScene = s2;
            targetChapter = ch;
            break;
          }
        }
      }
      if (firstScene) break;
    }

    if (!firstScene || !secondScene || !targetChapter || !targetChapter.scenes) {
      throw new Error(`Both scenes must be in the same chapter to merge.`);
    }

    // Merge content with a scene break
    const combinedContent = `${firstScene.content || ''}<hr/>${secondScene.content || ''}`;
    const countWords = (html: string) => {
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return text ? text.split(' ').length : 0;
    };

    // Combine relational IDs
    const mergedCharIds = Array.from(new Set([...(firstScene.characterIds || []), ...(secondScene.characterIds || [])]));
    const mergedLocIds = Array.from(new Set([...(firstScene.locationIds || []), ...(secondScene.locationIds || [])]));
    const mergedThreadIds = Array.from(new Set([...(firstScene.plotThreadIds || []), ...(secondScene.plotThreadIds || [])]));
    const mergedArcIds = Array.from(new Set([...(firstScene.storyArcIds || []), ...(secondScene.storyArcIds || [])]));
    const mergedEventIds = Array.from(new Set([...(firstScene.eventIds || []), ...(secondScene.eventIds || [])]));

    firstScene.content = combinedContent;
    firstScene.wordCount = countWords(combinedContent);
    firstScene.characterIds = mergedCharIds;
    firstScene.locationIds = mergedLocIds;
    firstScene.plotThreadIds = mergedThreadIds;
    firstScene.storyArcIds = mergedArcIds;
    firstScene.eventIds = mergedEventIds;
    if (!firstScene.povCharacterId && secondScene.povCharacterId) {
      firstScene.povCharacterId = secondScene.povCharacterId;
    }
    firstScene.updatedAt = new Date().toISOString();

    // Remove secondScene
    targetChapter.scenes = targetChapter.scenes.filter(s => s.id !== secondSceneId);
    targetChapter.scenes.forEach((s, idx) => { s.order = idx + 1; });
    this.syncChapterContent(targetChapter);

    // Clean up references to secondScene
    (p.plotThreads || []).forEach(t => {
      t.relatedSceneIds = (t.relatedSceneIds || []).filter(id => id !== secondSceneId);
    });
    (p.events || []).forEach(e => {
      if (e.sceneId === secondSceneId) e.sceneId = firstScene?.id;
    });

    this.syncSceneRelations(p, firstScene);

    return { project: p, mergedScene: firstScene };
  }

  // ==========================================
  // PLOT THREAD OPERATIONS
  // ==========================================

  static addPlotThread(project: ProjectData, threadData: Partial<PlotThread>): { project: ProjectData; thread: PlotThread } {
    const p = migrateProjectToStoryEngine(project);
    if (!p.plotThreads) p.plotThreads = [];

    const newThread: PlotThread = {
      id: threadData.id || `thread-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: threadData.title || 'New Plot Thread',
      description: threadData.description || '',
      type: threadData.type || 'subplot',
      status: threadData.status || 'unresolved',
      color: threadData.color || '#38BDF8',
      priority: threadData.priority || 'medium',
      storyArcId: threadData.storyArcId,
      introducedIn: threadData.introducedIn,
      lastTouchedIn: threadData.lastTouchedIn,
      resolvedIn: threadData.resolvedIn,
      relatedCharacterIds: threadData.relatedCharacterIds || [],
      relatedSceneIds: threadData.relatedSceneIds || [],
      expectedPayoff: threadData.expectedPayoff || '',
      notes: threadData.notes || '',
      updatedAt: new Date().toISOString()
    };

    p.plotThreads.push(newThread);
    return { project: p, thread: newThread };
  }

  static updatePlotThread(project: ProjectData, threadId: string, updates: Partial<PlotThread>): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.plotThreads) {
      p.plotThreads = p.plotThreads.map(t => 
        t.id === threadId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      );
    }
    return p;
  }

  static deletePlotThread(project: ProjectData, threadId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.plotThreads) {
      p.plotThreads = p.plotThreads.filter(t => t.id !== threadId);
    }

    // Clean up scene references
    p.acts.forEach(act => {
      act.chapters.forEach(ch => {
        if (ch.plotThreadIds) {
          ch.plotThreadIds = ch.plotThreadIds.filter(id => id !== threadId);
        }
        if (ch.scenes) {
          ch.scenes.forEach(sc => {
            if (sc.plotThreadIds) {
              sc.plotThreadIds = sc.plotThreadIds.filter(id => id !== threadId);
            }
          });
        }
      });
    });

    return p;
  }

  static toggleThreadChapterLink(project: ProjectData, threadId: string, chapterId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const thread = (p.plotThreads || []).find(t => t.id === threadId);
    if (!thread) return p;

    let targetChapter: Chapter | null = null;
    for (const act of p.acts) {
      const ch = act.chapters.find(c => c.id === chapterId);
      if (ch) {
        targetChapter = ch;
        break;
      }
    }

    if (!targetChapter) return p;

    if (!targetChapter.plotThreadIds) targetChapter.plotThreadIds = [];
    const hasLink = targetChapter.plotThreadIds.includes(threadId);

    if (hasLink) {
      targetChapter.plotThreadIds = targetChapter.plotThreadIds.filter(id => id !== threadId);
      if (targetChapter.scenes) {
        targetChapter.scenes.forEach(s => {
          if (s.plotThreadIds) {
            s.plotThreadIds = s.plotThreadIds.filter(id => id !== threadId);
          }
        });
      }
      if (thread.relatedSceneIds) {
        const chSceneIds = (targetChapter.scenes || []).map(s => s.id);
        thread.relatedSceneIds = thread.relatedSceneIds.filter(id => !chSceneIds.includes(id) && id !== `scene-${chapterId}`);
      }
    } else {
      targetChapter.plotThreadIds.push(threadId);
      if (targetChapter.scenes && targetChapter.scenes.length > 0) {
        targetChapter.scenes.forEach(s => {
          if (!s.plotThreadIds) s.plotThreadIds = [];
          if (!s.plotThreadIds.includes(threadId)) s.plotThreadIds.push(threadId);
        });
      }
      if (!thread.relatedSceneIds) thread.relatedSceneIds = [];
      const chSceneIds = (targetChapter.scenes || []).map(s => s.id);
      if (chSceneIds.length > 0) {
        chSceneIds.forEach(sId => {
          if (!thread.relatedSceneIds!.includes(sId)) thread.relatedSceneIds!.push(sId);
        });
      } else {
        if (!thread.relatedSceneIds.includes(`scene-${chapterId}`)) {
          thread.relatedSceneIds.push(`scene-${chapterId}`);
        }
      }
      thread.lastTouchedIn = chapterId;
    }

    return p;
  }

  static toggleThreadSceneLink(project: ProjectData, threadId: string, sceneId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const thread = (p.plotThreads || []).find(t => t.id === threadId);
    if (!thread) return p;

    let targetScene: Scene | null = null;
    let targetChapter: Chapter | null = null;

    for (const act of p.acts) {
      for (const ch of act.chapters) {
        const found = (ch.scenes || []).find(s => s.id === sceneId);
        if (found) {
          targetScene = found;
          targetChapter = ch;
          break;
        }
      }
      if (targetScene) break;
    }

    if (!targetScene) return p;

    if (!targetScene.plotThreadIds) targetScene.plotThreadIds = [];
    const hasLink = targetScene.plotThreadIds.includes(threadId);

    if (hasLink) {
      targetScene.plotThreadIds = targetScene.plotThreadIds.filter(id => id !== threadId);
      if (thread.relatedSceneIds) {
        thread.relatedSceneIds = thread.relatedSceneIds.filter(id => id !== sceneId);
      }
    } else {
      targetScene.plotThreadIds.push(threadId);
      if (!thread.relatedSceneIds) thread.relatedSceneIds = [];
      if (!thread.relatedSceneIds.includes(sceneId)) {
        thread.relatedSceneIds.push(sceneId);
      }
      thread.lastTouchedIn = sceneId;
      if (targetChapter && targetChapter.plotThreadIds && !targetChapter.plotThreadIds.includes(threadId)) {
        targetChapter.plotThreadIds.push(threadId);
      }
    }

    return p;
  }

  static updateThreadChronology(project: ProjectData, threadId: string): void {
    const thread = (project.plotThreads || []).find(t => t.id === threadId);
    if (!thread) return;

    const allScenes: { sceneId: string; chapterId: string }[] = [];
    (project.acts || []).forEach(act => {
      (act.chapters || []).forEach(ch => {
        (ch.scenes || []).forEach(sc => {
          allScenes.push({ sceneId: sc.id, chapterId: ch.id });
        });
      });
    });

    const threadSceneIds = new Set(thread.relatedSceneIds || []);
    const matchingAppearances = allScenes.filter(item => threadSceneIds.has(item.sceneId));

    if (matchingAppearances.length > 0) {
      thread.introducedIn = matchingAppearances[0].sceneId;
      thread.lastTouchedIn = matchingAppearances[matchingAppearances.length - 1].sceneId;
    }
  }

  static attachSceneToThread(project: ProjectData, threadId: string, sceneId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const thread = (p.plotThreads || []).find(t => t.id === threadId);
    if (!thread) return p;

    let targetScene: Scene | null = null;
    let targetChapter: Chapter | null = null;

    for (const act of p.acts) {
      for (const ch of act.chapters) {
        const found = (ch.scenes || []).find(s => s.id === sceneId);
        if (found) {
          targetScene = found;
          targetChapter = ch;
          break;
        }
      }
      if (targetScene) break;
    }

    if (!targetScene || !targetChapter) return p;

    if (!targetScene.plotThreadIds) targetScene.plotThreadIds = [];
    if (!targetScene.plotThreadIds.includes(threadId)) {
      targetScene.plotThreadIds.push(threadId);
    }

    if (!thread.relatedSceneIds) thread.relatedSceneIds = [];
    if (!thread.relatedSceneIds.includes(sceneId)) {
      thread.relatedSceneIds.push(sceneId);
    }

    if (!targetChapter.plotThreadIds) targetChapter.plotThreadIds = [];
    if (!targetChapter.plotThreadIds.includes(threadId)) {
      targetChapter.plotThreadIds.push(threadId);
    }

    this.updateThreadChronology(p, threadId);
    thread.updatedAt = new Date().toISOString();
    return p;
  }

  static detachSceneFromThread(project: ProjectData, threadId: string, sceneId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const thread = (p.plotThreads || []).find(t => t.id === threadId);
    if (!thread) return p;

    let targetChapter: Chapter | null = null;

    for (const act of p.acts) {
      for (const ch of act.chapters) {
        if (ch.scenes) {
          const found = ch.scenes.find(s => s.id === sceneId);
          if (found) {
            found.plotThreadIds = (found.plotThreadIds || []).filter(id => id !== threadId);
            targetChapter = ch;
            break;
          }
        }
      }
      if (targetChapter) break;
    }

    if (thread.relatedSceneIds) {
      thread.relatedSceneIds = thread.relatedSceneIds.filter(id => id !== sceneId);
    }

    if (targetChapter) {
      const stillHasThreadInChapter = (targetChapter.scenes || []).some(s => (s.plotThreadIds || []).includes(threadId));
      if (!stillHasThreadInChapter) {
        targetChapter.plotThreadIds = (targetChapter.plotThreadIds || []).filter(id => id !== threadId);
      }
    }

    this.updateThreadChronology(p, threadId);
    thread.updatedAt = new Date().toISOString();
    return p;
  }

  static attachCharacterToThread(project: ProjectData, threadId: string, characterId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const thread = (p.plotThreads || []).find(t => t.id === threadId);
    if (!thread) return p;

    if (!thread.relatedCharacterIds) thread.relatedCharacterIds = [];
    if (!thread.relatedCharacterIds.includes(characterId)) {
      thread.relatedCharacterIds.push(characterId);
      thread.updatedAt = new Date().toISOString();
    }
    return p;
  }

  static detachCharacterFromThread(project: ProjectData, threadId: string, characterId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const thread = (p.plotThreads || []).find(t => t.id === threadId);
    if (!thread) return p;

    if (thread.relatedCharacterIds) {
      thread.relatedCharacterIds = thread.relatedCharacterIds.filter(id => id !== characterId);
      thread.updatedAt = new Date().toISOString();
    }
    return p;
  }

  static markThreadStatus(project: ProjectData, threadId: string, status: PlotThreadStatus): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const thread = (p.plotThreads || []).find(t => t.id === threadId);
    if (thread) {
      thread.status = status;
      thread.updatedAt = new Date().toISOString();
    }
    return p;
  }

  static resolveThread(project: ProjectData, threadId: string, resolvedInSceneId?: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const thread = (p.plotThreads || []).find(t => t.id === threadId);
    if (thread) {
      thread.status = 'resolved';
      if (resolvedInSceneId) {
        thread.resolvedIn = resolvedInSceneId;
      } else if (!thread.resolvedIn) {
        thread.resolvedIn = thread.lastTouchedIn;
      }
      thread.updatedAt = new Date().toISOString();
    }
    return p;
  }

  // Aliases matching domain vocabulary
  static createThread = StoryEngine.addPlotThread;
  static updateThread = StoryEngine.updatePlotThread;
  static deleteThread = StoryEngine.deletePlotThread;

  // ==========================================
  // STORY ARC OPERATIONS
  // ==========================================

  static addStoryArc(project: ProjectData, arcData: Partial<StoryArc>): { project: ProjectData; arc: StoryArc } {
    const p = migrateProjectToStoryEngine(project);
    if (!p.storyArcs) p.storyArcs = [];

    const newArc: StoryArc = {
      id: arcData.id || `arc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: arcData.title || 'New Story Arc',
      description: arcData.description || '',
      type: arcData.type || 'act-arc',
      color: arcData.color || '#A78BFA',
      actIds: arcData.actIds || [],
      characterIds: arcData.characterIds || [],
      plotThreadIds: arcData.plotThreadIds || [],
      sceneIds: arcData.sceneIds || [],
      milestones: arcData.milestones || [],
      status: arcData.status || 'planned',
      updatedAt: new Date().toISOString()
    };

    p.storyArcs.push(newArc);
    return { project: p, arc: newArc };
  }

  static updateStoryArc(project: ProjectData, arcId: string, updates: Partial<StoryArc>): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.storyArcs) {
      p.storyArcs = p.storyArcs.map(a => 
        a.id === arcId ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      );
    }
    return p;
  }

  static deleteStoryArc(project: ProjectData, arcId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.storyArcs) {
      p.storyArcs = p.storyArcs.filter(a => a.id !== arcId);
    }
    return p;
  }

  // ==========================================
  // CHARACTER PSYCHOLOGY & RELATIONS
  // ==========================================

  static addCharacter(project: ProjectData, charData: Partial<Character>): { project: ProjectData; character: Character } {
    const p = migrateProjectToStoryEngine(project);

    const newChar: Character = {
      id: charData.id || `char-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: charData.name || 'New Character',
      aliases: charData.aliases || [],
      role: charData.role || 'Supporting',
      archetype: charData.archetype || '',
      tagline: charData.tagline || '',
      bio: charData.bio || '',
      physicalAppearance: charData.physicalAppearance || '',
      motivations: charData.motivations || '',
      flaws: charData.flaws || '',
      secrets: charData.secrets || '',
      voiceNotes: charData.voiceNotes || '',
      color: charData.color || '#818CF8',
      tags: charData.tags || [],
      goals: charData.goals || [],
      beliefs: charData.beliefs || [],
      knowledge: charData.knowledge || [],
      relationships: charData.relationships || [],
      currentState: charData.currentState || 'Active',
      appearances: charData.appearances || [],
      factionIds: charData.factionIds || [],
      locationId: charData.locationId,
      itemIds: charData.itemIds || [],
      updatedAt: new Date().toISOString()
    };

    p.characters.push(newChar);
    return { project: p, character: newChar };
  }

  static updateCharacter(project: ProjectData, characterId: string, updates: Partial<Character>): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    p.characters = p.characters.map(c => 
      c.id === characterId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    return p;
  }

  static deleteCharacter(project: ProjectData, characterId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    p.characters = p.characters.filter(c => c.id !== characterId);

    // Clean up relationships
    p.characters.forEach(c => {
      c.relationships = (c.relationships || []).filter(r => r.targetId !== characterId);
    });

    // Clean up scenes
    p.acts.forEach(act => {
      act.chapters.forEach(ch => {
        if (ch.povCharacterId === characterId) ch.povCharacterId = undefined;
        if (ch.characterIds) ch.characterIds = ch.characterIds.filter(id => id !== characterId);
        if (ch.scenes) {
          ch.scenes.forEach(sc => {
            if (sc.povCharacterId === characterId) sc.povCharacterId = undefined;
            if (sc.characterIds) {
              sc.characterIds = sc.characterIds.filter(id => id !== characterId);
            }
          });
        }
      });
    });

    return p;
  }

  static setCharacterRelationship(
    project: ProjectData, 
    sourceId: string, 
    targetId: string, 
    relation: string, 
    options?: { 
      currentState?: string;
      notes?: string;
      history?: string;
      dynamicDescription?: string; 
      strength?: number;
      trustLevel?: number | 'high' | 'moderate' | 'low' | 'none' | string;
    }
  ): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const sourceChar = p.characters.find(c => c.id === sourceId);
    const targetChar = p.characters.find(c => c.id === targetId);

    if (sourceChar && targetChar) {
      if (!sourceChar.relationships) sourceChar.relationships = [];
      sourceChar.relationships = sourceChar.relationships.filter(r => r.targetId !== targetId);
      sourceChar.relationships.push({
        targetId,
        targetName: targetChar.name,
        relation,
        currentState: options?.currentState || 'Active',
        notes: options?.notes || '',
        history: options?.history || '',
        dynamicDescription: options?.dynamicDescription,
        strength: options?.strength ?? 0,
        trustLevel: options?.trustLevel ?? options?.strength ?? 0
      });
    }

    return p;
  }

  static removeRelationship(project: ProjectData, sourceId: string, targetId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const sourceChar = p.characters.find(c => c.id === sourceId);
    if (sourceChar && sourceChar.relationships) {
      sourceChar.relationships = sourceChar.relationships.filter(r => r.targetId !== targetId);
    }
    return p;
  }

  static addRelationshipMilestone(
    project: ProjectData,
    sourceId: string,
    targetId: string,
    milestone: {
      sceneId?: string;
      chapterId?: string;
      milestone: RelationshipMilestone;
      description: string;
    }
  ): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const sourceChar = p.characters.find(c => c.id === sourceId);
    if (sourceChar && sourceChar.relationships) {
      const rel = sourceChar.relationships.find(r => r.targetId === targetId);
      if (rel) {
        if (!rel.milestones) rel.milestones = [];
        rel.milestones.push({
          id: `mile-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          ...milestone
        });
      }
    }
    return p;
  }

  static updateCharacterState(
    project: ProjectData,
    characterId: string,
    stateData: Partial<CharacterState> | string
  ): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (char) {
      if (typeof stateData === 'string') {
        char.currentState = stateData;
      } else {
        const existingState = typeof char.currentState === 'object' && char.currentState !== null
          ? char.currentState
          : { status: typeof char.currentState === 'string' ? char.currentState : 'active' };
        char.currentState = {
          ...existingState,
          ...stateData
        };
      }
      char.updatedAt = new Date().toISOString();
    }
    return p;
  }

  // ==========================================
  // GOAL OPERATIONS
  // ==========================================

  static addGoal(
    project: ProjectData,
    characterId: string,
    goalData: Partial<GoalItem> | string
  ): { project: ProjectData; goal: GoalItem } {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (!char) throw new Error(`Character ${characterId} not found`);

    if (!char.goals) char.goals = [];

    const newGoal: GoalItem = typeof goalData === 'string'
      ? {
          id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: goalData,
          description: goalData,
          status: 'active',
          priority: 'medium'
        }
      : {
          id: goalData.id || `goal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: goalData.title || goalData.description || 'New Goal',
          description: goalData.description || goalData.title || '',
          status: goalData.status || 'active',
          priority: goalData.priority || 'medium',
          introducedIn: goalData.introducedIn,
          resolvedIn: goalData.resolvedIn
        };

    char.goals.push(newGoal);
    char.updatedAt = new Date().toISOString();
    return { project: p, goal: newGoal };
  }

  static updateGoal(
    project: ProjectData,
    characterId: string,
    goalId: string,
    updates: Partial<GoalItem>
  ): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (char && char.goals) {
      char.goals = char.goals.map(g => {
        if (typeof g === 'string') {
          return g === goalId ? (updates.title || g) : g;
        }
        return g.id === goalId ? { ...g, ...updates } : g;
      });
      char.updatedAt = new Date().toISOString();
    }
    return p;
  }

  static removeGoal(
    project: ProjectData,
    characterId: string,
    goalId: string
  ): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (char && char.goals) {
      char.goals = char.goals.filter(g => typeof g === 'string' ? g !== goalId : g.id !== goalId);
      char.updatedAt = new Date().toISOString();
    }
    return p;
  }

  static setGoalStatus(
    project: ProjectData,
    characterId: string,
    goalId: string,
    status: GoalStatus
  ): ProjectData {
    return this.updateGoal(project, characterId, goalId, { status });
  }

  // ==========================================
  // BELIEF OPERATIONS
  // ==========================================

  static addBelief(
    project: ProjectData,
    characterId: string,
    beliefData: Partial<BeliefItem> | string
  ): { project: ProjectData; belief: BeliefItem } {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (!char) throw new Error(`Character ${characterId} not found`);

    if (!char.beliefs) char.beliefs = [];

    const newBelief: BeliefItem = typeof beliefData === 'string'
      ? {
          id: `belief-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          statement: beliefData,
          certainty: 'strong',
          status: 'active'
        }
      : {
          id: beliefData.id || `belief-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          statement: beliefData.statement || 'New belief statement',
          certainty: beliefData.certainty || 'strong',
          introducedIn: beliefData.introducedIn,
          changedIn: beliefData.changedIn,
          status: beliefData.status || 'active'
        };

    char.beliefs.push(newBelief);
    char.updatedAt = new Date().toISOString();
    return { project: p, belief: newBelief };
  }

  static updateBelief(
    project: ProjectData,
    characterId: string,
    beliefId: string,
    updates: Partial<BeliefItem>
  ): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (char && char.beliefs) {
      char.beliefs = char.beliefs.map(b => {
        if (typeof b === 'string') {
          return b === beliefId ? (updates.statement || b) : b;
        }
        return b.id === beliefId ? { ...b, ...updates } : b;
      });
      char.updatedAt = new Date().toISOString();
    }
    return p;
  }

  static removeBelief(
    project: ProjectData,
    characterId: string,
    beliefId: string
  ): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (char && char.beliefs) {
      char.beliefs = char.beliefs.filter(b => typeof b === 'string' ? b !== beliefId : b.id !== beliefId);
      char.updatedAt = new Date().toISOString();
    }
    return p;
  }

  // ==========================================
  // KNOWLEDGE OPERATIONS
  // ==========================================

  static addCharacterKnowledge(
    project: ProjectData,
    characterId: string,
    entry: Partial<KnowledgeEntry> | string
  ): { project: ProjectData; knowledge: KnowledgeEntry } {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (!char) throw new Error(`Character ${characterId} not found`);

    if (!char.knowledgeList) char.knowledgeList = [];
    const newEntry: KnowledgeEntry = typeof entry === 'string'
      ? {
          id: `know-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          statement: entry,
          information: entry,
          certainty: 'certain',
          status: 'known'
        }
      : {
          id: entry.id || `know-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          statement: entry.statement || entry.information || '',
          information: entry.information || entry.statement || '',
          learnedIn: entry.learnedIn || entry.learnedAt || '',
          learnedAt: entry.learnedAt || entry.learnedIn || '',
          sourceSceneId: entry.sourceSceneId,
          source: entry.source || '',
          certainty: entry.certainty || 'certain',
          status: entry.status || 'known'
        };
    char.knowledgeList.push(newEntry);
    char.updatedAt = new Date().toISOString();
    return { project: p, knowledge: newEntry };
  }

  static updateCharacterKnowledge(
    project: ProjectData,
    characterId: string,
    knowledgeId: string,
    updates: Partial<KnowledgeEntry>
  ): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (char && char.knowledgeList) {
      char.knowledgeList = char.knowledgeList.map(k => {
        if (k.id === knowledgeId) {
          const merged = { ...k, ...updates };
          if (updates.statement && !updates.information) merged.information = updates.statement;
          if (updates.information && !updates.statement) merged.statement = updates.information;
          return merged;
        }
        return k;
      });
      char.updatedAt = new Date().toISOString();
    }
    return p;
  }

  static deleteCharacterKnowledge(
    project: ProjectData,
    characterId: string,
    knowledgeId: string
  ): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (char && char.knowledgeList) {
      char.knowledgeList = char.knowledgeList.filter(k => k.id !== knowledgeId);
      char.updatedAt = new Date().toISOString();
    }
    return p;
  }

  // Aliases for knowledge operations
  static addKnowledge = StoryEngine.addCharacterKnowledge;
  static updateKnowledge = StoryEngine.updateCharacterKnowledge;
  static removeKnowledge = StoryEngine.deleteCharacterKnowledge;

  // ==========================================
  // SECRET OPERATIONS
  // ==========================================

  static addSecret(
    project: ProjectData,
    characterId: string,
    secretData: Partial<SecretItem> | string
  ): { project: ProjectData; secret: SecretItem } {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (!char) throw new Error(`Character ${characterId} not found`);

    if (!char.secrets) char.secrets = [];
    const secretsArr = Array.isArray(char.secrets) ? char.secrets : [];

    const newSecret: SecretItem = typeof secretData === 'string'
      ? {
          id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          secret: secretData,
          status: 'hidden'
        }
      : {
          id: secretData.id || `sec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          secret: secretData.secret || 'New secret',
          introducedIn: secretData.introducedIn,
          revealedIn: secretData.revealedIn,
          status: secretData.status || 'hidden',
          knownByCharacterIds: secretData.knownByCharacterIds || []
        };

    secretsArr.push(newSecret);
    char.secrets = secretsArr;
    char.updatedAt = new Date().toISOString();
    return { project: p, secret: newSecret };
  }

  static updateSecret(
    project: ProjectData,
    characterId: string,
    secretId: string,
    updates: Partial<SecretItem>
  ): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (char && char.secrets && Array.isArray(char.secrets)) {
      char.secrets = char.secrets.map(s => {
        if (typeof s === 'string') {
          return s === secretId ? (updates.secret || s) : s;
        }
        return s.id === secretId ? { ...s, ...updates } : s;
      });
      char.updatedAt = new Date().toISOString();
    }
    return p;
  }

  static removeSecret(
    project: ProjectData,
    characterId: string,
    secretId: string
  ): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (char && char.secrets && Array.isArray(char.secrets)) {
      char.secrets = char.secrets.filter(s => typeof s === 'string' ? s !== secretId : s.id !== secretId);
      char.updatedAt = new Date().toISOString();
    }
    return p;
  }

  // ==========================================
  // STATE CHECKPOINT OPERATIONS
  // ==========================================

  static addStateCheckpoint(
    project: ProjectData,
    characterId: string,
    checkpointData: Partial<CharacterStateCheckpoint>
  ): { project: ProjectData; checkpoint: CharacterStateCheckpoint } {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (!char) throw new Error(`Character ${characterId} not found`);

    if (!char.stateCheckpoints) char.stateCheckpoints = [];

    const newCheckpoint: CharacterStateCheckpoint = {
      id: checkpointData.id || `chk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sceneId: checkpointData.sceneId || '',
      chapterId: checkpointData.chapterId,
      order: checkpointData.order || char.stateCheckpoints.length + 1,
      emotionalState: checkpointData.emotionalState,
      physicalState: checkpointData.physicalState,
      mentalState: checkpointData.mentalState,
      currentGoal: checkpointData.currentGoal,
      note: checkpointData.note
    };

    char.stateCheckpoints.push(newCheckpoint);
    char.updatedAt = new Date().toISOString();
    return { project: p, checkpoint: newCheckpoint };
  }

  static updateStateCheckpoint(
    project: ProjectData,
    characterId: string,
    checkpointId: string,
    updates: Partial<CharacterStateCheckpoint>
  ): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (char && char.stateCheckpoints) {
      char.stateCheckpoints = char.stateCheckpoints.map(c => 
        c.id === checkpointId ? { ...c, ...updates } : c
      );
      char.updatedAt = new Date().toISOString();
    }
    return p;
  }

  static removeStateCheckpoint(
    project: ProjectData,
    characterId: string,
    checkpointId: string
  ): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    const char = p.characters.find(c => c.id === characterId);
    if (char && char.stateCheckpoints) {
      char.stateCheckpoints = char.stateCheckpoints.filter(c => c.id !== checkpointId);
      char.updatedAt = new Date().toISOString();
    }
    return p;
  }

  static setRelationship = StoryEngine.setCharacterRelationship;

  // ==========================================
  // LOCATION OPERATIONS
  // ==========================================

  static addLocation(project: ProjectData, locData: Partial<Location>): { project: ProjectData; location: Location } {
    const p = migrateProjectToStoryEngine(project);
    if (!p.locations) p.locations = [];

    const newLoc: Location = {
      id: locData.id || `loc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: locData.name || 'New Location',
      aliases: locData.aliases || [],
      type: locData.type || 'building',
      summary: locData.summary || '',
      description: locData.description || '',
      sensoryDetails: locData.sensoryDetails || {},
      parentLocationId: locData.parentLocationId,
      controllingFactionId: locData.controllingFactionId,
      associatedCharacterIds: locData.associatedCharacterIds || [],
      sceneAppearances: locData.sceneAppearances || [],
      tags: locData.tags || ['location'],
      color: locData.color || '#10B981',
      updatedAt: new Date().toISOString()
    };

    p.locations.push(newLoc);
    return { project: p, location: newLoc };
  }

  static updateLocation(project: ProjectData, locationId: string, updates: Partial<Location>): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.locations) {
      p.locations = p.locations.map(l => 
        l.id === locationId ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
      );
    }
    return p;
  }

  static deleteLocation(project: ProjectData, locationId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.locations) {
      p.locations = p.locations.filter(l => l.id !== locationId);
    }

    // Clean up scene references
    p.acts.forEach(act => {
      act.chapters.forEach(ch => {
        if (ch.locationIds) ch.locationIds = ch.locationIds.filter(id => id !== locationId);
        if (ch.scenes) {
          ch.scenes.forEach(sc => {
            if (sc.locationIds) {
              sc.locationIds = sc.locationIds.filter(id => id !== locationId);
            }
          });
        }
      });
    });

    return p;
  }

  // ==========================================
  // FACTION OPERATIONS
  // ==========================================

  static addFaction(project: ProjectData, factionData: Partial<Faction>): { project: ProjectData; faction: Faction } {
    const p = migrateProjectToStoryEngine(project);
    if (!p.factions) p.factions = [];

    const newFaction: Faction = {
      id: factionData.id || `faction-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: factionData.name || 'New Faction',
      aliases: factionData.aliases || [],
      type: factionData.type || 'guild',
      summary: factionData.summary || '',
      description: factionData.description || '',
      leaderCharacterId: factionData.leaderCharacterId,
      memberCharacterIds: factionData.memberCharacterIds || [],
      headquartersLocationId: factionData.headquartersLocationId,
      alliedFactionIds: factionData.alliedFactionIds || [],
      rivalFactionIds: factionData.rivalFactionIds || [],
      goals: factionData.goals || [],
      doctrine: factionData.doctrine || '',
      sceneAppearances: factionData.sceneAppearances || [],
      tags: factionData.tags || ['faction'],
      color: factionData.color || '#F59E0B',
      updatedAt: new Date().toISOString()
    };

    p.factions.push(newFaction);
    return { project: p, faction: newFaction };
  }

  static updateFaction(project: ProjectData, factionId: string, updates: Partial<Faction>): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.factions) {
      p.factions = p.factions.map(f => 
        f.id === factionId ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
      );
    }
    return p;
  }

  static deleteFaction(project: ProjectData, factionId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.factions) {
      p.factions = p.factions.filter(f => f.id !== factionId);
    }
    return p;
  }

  // ==========================================
  // ITEM OPERATIONS
  // ==========================================

  static addItem(project: ProjectData, itemData: Partial<Item>): { project: ProjectData; item: Item } {
    const p = migrateProjectToStoryEngine(project);
    if (!p.items) p.items = [];

    const newItem: Item = {
      id: itemData.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: itemData.name || 'New Item',
      aliases: itemData.aliases || [],
      type: itemData.type || 'artifact',
      summary: itemData.summary || '',
      description: itemData.description || '',
      currentOwnerCharacterId: itemData.currentOwnerCharacterId,
      originLocationId: itemData.originLocationId,
      magicalProperties: itemData.magicalProperties || '',
      sceneAppearances: itemData.sceneAppearances || [],
      plotThreadIds: itemData.plotThreadIds || [],
      tags: itemData.tags || ['item'],
      color: itemData.color || '#F43F5E',
      updatedAt: new Date().toISOString()
    };

    p.items.push(newItem);
    return { project: p, item: newItem };
  }

  static updateItem(project: ProjectData, itemId: string, updates: Partial<Item>): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.items) {
      p.items = p.items.map(i => 
        i.id === itemId ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
      );
    }
    return p;
  }

  static deleteItem(project: ProjectData, itemId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.items) {
      p.items = p.items.filter(i => i.id !== itemId);
    }
    return p;
  }

  // ==========================================
  // EVENT OPERATIONS
  // ==========================================

  static addEvent(project: ProjectData, eventData: Partial<Event>): { project: ProjectData; event: Event } {
    const p = migrateProjectToStoryEngine(project);
    if (!p.events) p.events = [];

    const newEvent: Event = {
      id: eventData.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: eventData.title || 'New Narrative Event',
      summary: eventData.summary || '',
      description: eventData.description || '',
      timelineDate: eventData.timelineDate,
      order: eventData.order || (p.events.length + 1),
      type: eventData.type || 'scene-event',
      sceneId: eventData.sceneId,
      chapterId: eventData.chapterId,
      actId: eventData.actId,
      locationId: eventData.locationId,
      participantCharacterIds: eventData.participantCharacterIds || [],
      involvedFactionIds: eventData.involvedFactionIds || [],
      causedByEventId: eventData.causedByEventId,
      impact: eventData.impact,
      tensionLevel: eventData.tensionLevel || 5,
      tags: eventData.tags || ['event']
    };

    p.events.push(newEvent);
    p.events.sort((a, b) => a.order - b.order);

    return { project: p, event: newEvent };
  }

  static updateEvent(project: ProjectData, eventId: string, updates: Partial<Event>): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.events) {
      p.events = p.events.map(e => e.id === eventId ? { ...e, ...updates } : e);
      p.events.sort((a, b) => a.order - b.order);
    }
    return p;
  }

  static deleteEvent(project: ProjectData, eventId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.events) {
      p.events = p.events.filter(e => e.id !== eventId);
      p.events.forEach((e, idx) => { e.order = idx + 1; });
    }
    return p;
  }

  // ==========================================
  // RESEARCH NOTE OPERATIONS
  // ==========================================

  static addResearchNote(project: ProjectData, noteData: Partial<ResearchNote>): { project: ProjectData; note: ResearchNote } {
    const p = migrateProjectToStoryEngine(project);
    if (!p.researchNotes) p.researchNotes = [];

    const newNote: ResearchNote = {
      id: noteData.id || `research-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: noteData.title || 'New Research Reference',
      category: noteData.category || 'reference',
      summary: noteData.summary || '',
      content: noteData.content || '<p>Research documentation...</p>',
      sources: noteData.sources || [],
      relatedEntityIds: noteData.relatedEntityIds || [],
      tags: noteData.tags || ['research'],
      updatedAt: new Date().toISOString()
    };

    p.researchNotes.push(newNote);
    return { project: p, note: newNote };
  }

  static updateResearchNote(project: ProjectData, noteId: string, updates: Partial<ResearchNote>): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.researchNotes) {
      p.researchNotes = p.researchNotes.map(r => 
        r.id === noteId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      );
    }
    return p;
  }

  static deleteResearchNote(project: ProjectData, noteId: string): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (p.researchNotes) {
      p.researchNotes = p.researchNotes.filter(r => r.id !== noteId);
    }
    return p;
  }

  // ==========================================
  // TIMELINE & CHRONOLOGY OPERATIONS
  // ==========================================

  static setSceneTimelineDate(project: ProjectData, sceneId: string, timelineDate?: string): ProjectData {
    return this.updateScene(project, sceneId, { timelineDate });
  }

  static setEventTimelineDate(project: ProjectData, eventId: string, timelineDate?: string): ProjectData {
    return this.updateEvent(project, eventId, { timelineDate });
  }

  static setEventCause(project: ProjectData, eventId: string, causedByEventId?: string): ProjectData {
    return this.updateEvent(project, eventId, { causedByEventId });
  }

  static reorderEvents(project: ProjectData, sourceIndex: number, targetIndex: number): ProjectData {
    const p = migrateProjectToStoryEngine(project);
    if (!p.events || sourceIndex < 0 || sourceIndex >= p.events.length || targetIndex < 0 || targetIndex >= p.events.length) {
      return p;
    }
    const [moved] = p.events.splice(sourceIndex, 1);
    p.events.splice(targetIndex, 0, moved);
    p.events.forEach((e, idx) => { e.order = idx + 1; });
    return p;
  }

  // ==========================================
  // INTERNAL RELATIONAL SYNC
  // ==========================================

  private static syncSceneRelations(project: ProjectData, scene: Scene): void {
    // 1. Update Character appearances
    const presentCharIds = new Set<string>(scene.characterIds || []);
    if (scene.povCharacterId) presentCharIds.add(scene.povCharacterId);

    project.characters.forEach(char => {
      if (presentCharIds.has(char.id)) {
        char.appearances = char.appearances || [];
        if (!char.appearances.includes(scene.id)) {
          char.appearances.push(scene.id);
        }
      }
    });

    // 2. Update Location appearances
    if (project.locations) {
      const locIds = new Set<string>(scene.locationIds || []);
      project.locations.forEach(loc => {
        if (locIds.has(loc.id)) {
          if (!loc.sceneAppearances) loc.sceneAppearances = [];
          if (!loc.sceneAppearances.includes(scene.id)) {
            loc.sceneAppearances.push(scene.id);
          }
        }
      });
    }

    // 3. Update Plot Thread scene links
    if (project.plotThreads) {
      const threadIds = new Set<string>(scene.plotThreadIds || []);
      project.plotThreads.forEach(thread => {
        if (threadIds.has(thread.id)) {
          if (!thread.relatedSceneIds) thread.relatedSceneIds = [];
          if (!thread.relatedSceneIds.includes(scene.id)) {
            thread.relatedSceneIds.push(scene.id);
          }
          thread.lastTouchedIn = scene.id;
        }
      });
    }
  }
}
