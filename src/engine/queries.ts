import { 
  ProjectData, Scene, Character, Location, Faction, 
  Item, Event, StoryArc, PlotThread, ResearchNote, ContinuityIssue,
  StoryTimelineNode, StoryTimelineData, TimelineFilterConfig, TimelineTimeType,
  ChronologyPoint, ChronologyInversionWarning,
  Chapter, Act, GoalItem, BeliefItem, KnowledgeEntry, SecretItem,
  CharacterState, CharacterRelationship, CharacterStateCheckpoint
} from '../types';

/**
 * Story Engine Relational Queries & Analytics
 * High-performance, pure functional domain selectors.
 */
export const StoryEngineQueries = {
  /**
   * Retrieve flat list of all scenes across acts and chapters
   */
  getAllScenes(project: ProjectData): Scene[] {
    const scenes: Scene[] = [];
    (project.acts || []).forEach(act => {
      (act.chapters || []).forEach(ch => {
        if (ch.scenes && ch.scenes.length > 0) {
          scenes.push(...ch.scenes);
        } else {
          // Fallback virtual scene for chapters without explicit scenes array
          scenes.push({
            id: `scene-${ch.id}`,
            title: ch.title,
            chapterId: ch.id,
            actId: act.id,
            order: ch.order,
            content: ch.content,
            wordCount: ch.wordCount,
            povCharacterId: ch.povCharacterId,
            characterIds: ch.characterIds || (ch.povCharacterId ? [ch.povCharacterId] : []),
            locationIds: ch.locationIds || [],
            plotThreadIds: ch.plotThreadIds || [],
            eventIds: [],
            status: ch.status,
            synopsis: ch.synopsis,
            tags: ch.tags,
            updatedAt: ch.updatedAt,
          });
        }
      });
    });
    return scenes;
  },

  getSceneById(project: ProjectData, sceneId: string): Scene | null {
    for (const act of project.acts || []) {
      for (const ch of act.chapters || []) {
        const found = (ch.scenes || []).find(s => s.id === sceneId || `scene-${ch.id}` === sceneId);
        if (found) return found;
      }
    }
    return null;
  },

  getChapterById(project: ProjectData, chapterId: string): Chapter | null {
    for (const act of project.acts || []) {
      const found = (act.chapters || []).find(c => c.id === chapterId);
      if (found) return found;
    }
    return null;
  },

  getActById(project: ProjectData, actId: string): Act | null {
    return (project.acts || []).find(a => a.id === actId) || null;
  },

  getScenesForChapter(project: ProjectData, chapterId: string): Scene[] {
    for (const act of project.acts || []) {
      const ch = (act.chapters || []).find(c => c.id === chapterId);
      if (ch) return ch.scenes || [];
    }
    return [];
  },

  getScenesForCharacter(project: ProjectData, characterId: string): Scene[] {
    return this.getAllScenes(project).filter(s => 
      s.povCharacterId === characterId || (s.characterIds || []).includes(characterId)
    );
  },

  getScenesForLocation(project: ProjectData, locationId: string): Scene[] {
    return this.getAllScenes(project).filter(s => 
      (s.locationIds || []).includes(locationId)
    );
  },

  getThreadById(project: ProjectData, threadId: string): PlotThread | null {
    return (project.plotThreads || []).find(t => t.id === threadId) || null;
  },

  getThreadsForScene(project: ProjectData, sceneId: string): PlotThread[] {
    const scene = this.getSceneById(project, sceneId);
    if (!scene) return [];
    const threadIds = new Set<string>(scene.plotThreadIds || []);
    return (project.plotThreads || []).filter(t => 
      threadIds.has(t.id) || (t.relatedSceneIds || []).includes(sceneId)
    );
  },

  getThreadsForChapter(project: ProjectData, chapterId: string): PlotThread[] {
    let targetChapter: Chapter | null = null;
    for (const act of project.acts || []) {
      const ch = (act.chapters || []).find(c => c.id === chapterId);
      if (ch) {
        targetChapter = ch;
        break;
      }
    }
    if (!targetChapter) return [];
    const threadIds = new Set<string>(targetChapter.plotThreadIds || []);
    (targetChapter.scenes || []).forEach((sc: Scene) => {
      (sc.plotThreadIds || []).forEach((id: string) => threadIds.add(id));
    });
    return (project.plotThreads || []).filter(t => 
      threadIds.has(t.id) || (t.relatedSceneIds || []).some((sId: string) => (targetChapter!.scenes || []).some((s: Scene) => s.id === sId))
    );
  },

  getPlotThreadsForChapter(project: ProjectData, chapterId: string): PlotThread[] {
    return this.getThreadsForChapter(project, chapterId);
  },

  getPlotThreadsForScene(project: ProjectData, sceneId: string): PlotThread[] {
    return this.getThreadsForScene(project, sceneId);
  },

  getThreadsForCharacter(project: ProjectData, characterId: string): PlotThread[] {
    return (project.plotThreads || []).filter(t => 
      (t.relatedCharacterIds || []).includes(characterId)
    );
  },

  getScenesForThread(project: ProjectData, threadId: string): Scene[] {
    const thread = this.getThreadById(project, threadId);
    const relatedSceneIds = new Set<string>(thread?.relatedSceneIds || []);
    return this.getAllScenes(project).filter(s => 
      (s.plotThreadIds || []).includes(threadId) || relatedSceneIds.has(s.id)
    );
  },

  getScenesForPlotThread(project: ProjectData, threadId: string): Scene[] {
    return this.getScenesForThread(project, threadId);
  },

  getThreadFirstAppearance(project: ProjectData, threadId: string): { scene: Scene | null; chapter: Chapter | null; act: Act | null; chapterOrder: number; sceneOrder: number } | null {
    const thread = this.getThreadById(project, threadId);
    if (!thread) return null;

    let chIndex = 0;
    for (const act of project.acts || []) {
      for (const ch of act.chapters || []) {
        chIndex++;
        const scenes = ch.scenes || [];
        for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
          const sc = scenes[sIdx];
          if ((sc.plotThreadIds || []).includes(threadId) || (thread.relatedSceneIds || []).includes(sc.id)) {
            return { scene: sc, chapter: ch, act, chapterOrder: chIndex, sceneOrder: sIdx + 1 };
          }
        }
        if ((ch.plotThreadIds || []).includes(threadId) || thread.introducedIn === ch.id) {
          return { scene: scenes[0] || null, chapter: ch, act, chapterOrder: chIndex, sceneOrder: 1 };
        }
      }
    }
    return null;
  },

  getThreadLastAppearance(project: ProjectData, threadId: string): { scene: Scene | null; chapter: Chapter | null; act: Act | null; chapterOrder: number; sceneOrder: number } | null {
    const thread = this.getThreadById(project, threadId);
    if (!thread) return null;

    let totalChapters = 0;
    (project.acts || []).forEach(a => { totalChapters += (a.chapters || []).length; });

    let chIndex = totalChapters;
    const allActs = project.acts || [];
    for (let aIdx = allActs.length - 1; aIdx >= 0; aIdx--) {
      const act = allActs[aIdx];
      const chapters = act.chapters || [];
      for (let cIdx = chapters.length - 1; cIdx >= 0; cIdx--) {
        const ch = chapters[cIdx];
        const scenes = ch.scenes || [];
        for (let sIdx = scenes.length - 1; sIdx >= 0; sIdx--) {
          const sc = scenes[sIdx];
          if ((sc.plotThreadIds || []).includes(threadId) || (thread.relatedSceneIds || []).includes(sc.id)) {
            return { scene: sc, chapter: ch, act, chapterOrder: chIndex, sceneOrder: sIdx + 1 };
          }
        }
        if ((ch.plotThreadIds || []).includes(threadId) || thread.lastTouchedIn === ch.id) {
          return { scene: scenes[scenes.length - 1] || null, chapter: ch, act, chapterOrder: chIndex, sceneOrder: scenes.length || 1 };
        }
        chIndex--;
      }
    }
    return null;
  },

  getDormantThreads(
    project: ProjectData, 
    currentChapterIdOrIndex?: string | number, 
    thresholdChapters: number = 3
  ): Array<{ 
    thread: PlotThread; 
    gapChapters: number; 
    lastChapter: Chapter | null; 
    lastScene: Scene | null; 
    isDormantCandidate: boolean 
  }> {
    const matrix = this.getPlotThreadMatrix(project);
    let targetIndex = matrix.columns.length - 1;

    if (typeof currentChapterIdOrIndex === 'number') {
      targetIndex = Math.min(Math.max(0, currentChapterIdOrIndex), matrix.columns.length - 1);
    } else if (typeof currentChapterIdOrIndex === 'string') {
      const foundIdx = matrix.columns.findIndex(c => c.chapterId === currentChapterIdOrIndex);
      if (foundIdx !== -1) targetIndex = foundIdx;
    }

    return matrix.rows
      .filter(r => r.thread.status !== 'resolved' && r.thread.status !== 'abandoned')
      .map(r => {
        const lastTouch = r.lastTouchIndex;
        let gap = 0;
        let isDormantCandidate = false;

        if (lastTouch !== -1 && targetIndex >= lastTouch) {
          gap = targetIndex - lastTouch;
          isDormantCandidate = gap >= thresholdChapters;
        } else if (r.thread.status === 'dormant') {
          isDormantCandidate = true;
          gap = thresholdChapters;
        }

        const lastCol = lastTouch !== -1 ? matrix.columns[lastTouch] : null;
        const lastCh = lastCol ? this.getChapterById(project, lastCol.chapterId) : null;
        const lastSc = r.thread.lastTouchedIn ? this.getSceneById(project, r.thread.lastTouchedIn) : (lastCh?.scenes?.[0] || null);

        return {
          thread: r.thread,
          gapChapters: gap,
          lastChapter: lastCh,
          lastScene: lastSc,
          isDormantCandidate
        };
      });
  },

  getPayoffPendingThreads(project: ProjectData): PlotThread[] {
    return (project.plotThreads || []).filter(t => 
      t.status === 'payoff-pending' || (Boolean(t.expectedPayoff) && t.status !== 'resolved' && t.status !== 'abandoned')
    );
  },

  getActiveThreads(project: ProjectData): PlotThread[] {
    return (project.plotThreads || []).filter(t => 
      t.status === 'active' || t.status === 'in-progress' || t.status === 'setup' || t.status === 'unresolved'
    );
  },

  getResolvedThreads(project: ProjectData): PlotThread[] {
    return (project.plotThreads || []).filter(t => t.status === 'resolved');
  },

  getThreadProgressionMatrix(project: ProjectData) {
    return this.getPlotThreadMatrix(project);
  },

  getScenesForStoryArc(project: ProjectData, arcId: string): Scene[] {
    return this.getAllScenes(project).filter(s => 
      s.storyArcIds && s.storyArcIds.includes(arcId)
    );
  },

  getUnresolvedPlotThreads(project: ProjectData): PlotThread[] {
    return (project.plotThreads || []).filter(t => 
      t.status === 'unresolved' || t.status === 'active' || t.status === 'in-progress' || t.status === 'climax'
    );
  },

  getCharacterById(project: ProjectData, characterId: string): Character | null {
    return (project.characters || []).find(c => c.id === characterId) || null;
  },

  getCharacterScenes(project: ProjectData, characterId: string): Scene[] {
    return this.getScenesForCharacter(project, characterId);
  },

  getCharacterChapters(project: ProjectData, characterId: string): Chapter[] {
    const chapters: Chapter[] = [];
    for (const act of project.acts || []) {
      for (const ch of act.chapters || []) {
        const hasDirect = ch.povCharacterId === characterId || (ch.characterIds || []).includes(characterId);
        const hasScene = (ch.scenes || []).some(s => s.povCharacterId === characterId || (s.characterIds || []).includes(characterId));
        if (hasDirect || hasScene) {
          chapters.push(ch);
        }
      }
    }
    return chapters;
  },

  getCharacterFirstAppearance(project: ProjectData, characterId: string): { scene?: Scene; chapter?: Chapter; act?: Act; chapterOrder: number; sceneOrder: number } | null {
    let chOrder = 0;
    for (const act of project.acts || []) {
      for (const ch of act.chapters || []) {
        chOrder++;
        const scenes = ch.scenes || [];
        for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
          const sc = scenes[sIdx];
          if (sc.povCharacterId === characterId || (sc.characterIds || []).includes(characterId)) {
            return { scene: sc, chapter: ch, act, chapterOrder: chOrder, sceneOrder: sIdx + 1 };
          }
        }
        if (ch.povCharacterId === characterId || (ch.characterIds || []).includes(characterId)) {
          return { scene: scenes[0], chapter: ch, act, chapterOrder: chOrder, sceneOrder: 1 };
        }
      }
    }
    return null;
  },

  getCharacterLastSeen(project: ProjectData, characterId: string): { scene?: Scene; chapter?: Chapter; act?: Act; chapterOrder: number; sceneOrder: number } | null {
    let totalChapters = 0;
    (project.acts || []).forEach(a => { totalChapters += (a.chapters || []).length; });

    let chOrder = totalChapters;
    const allActs = project.acts || [];
    for (let aIdx = allActs.length - 1; aIdx >= 0; aIdx--) {
      const act = allActs[aIdx];
      const chapters = act.chapters || [];
      for (let cIdx = chapters.length - 1; cIdx >= 0; cIdx--) {
        const ch = chapters[cIdx];
        const scenes = ch.scenes || [];
        for (let sIdx = scenes.length - 1; sIdx >= 0; sIdx--) {
          const sc = scenes[sIdx];
          if (sc.povCharacterId === characterId || (sc.characterIds || []).includes(characterId)) {
            return { scene: sc, chapter: ch, act, chapterOrder: chOrder, sceneOrder: sIdx + 1 };
          }
        }
        if (ch.povCharacterId === characterId || (ch.characterIds || []).includes(characterId)) {
          return { scene: scenes[scenes.length - 1], chapter: ch, act, chapterOrder: chOrder, sceneOrder: scenes.length || 1 };
        }
        chOrder--;
      }
    }
    return null;
  },

  getCharacterAppearancesByAct(project: ProjectData, characterId: string): Array<{ act: Act; sceneCount: number; scenes: Scene[] }> {
    const result: Array<{ act: Act; sceneCount: number; scenes: Scene[] }> = [];
    for (const act of project.acts || []) {
      const actScenes: Scene[] = [];
      for (const ch of act.chapters || []) {
        for (const sc of ch.scenes || []) {
          if (sc.povCharacterId === characterId || (sc.characterIds || []).includes(characterId)) {
            actScenes.push(sc);
          }
        }
      }
      result.push({
        act,
        sceneCount: actScenes.length,
        scenes: actScenes
      });
    }
    return result;
  },

  getPlotThreadsForCharacter(project: ProjectData, characterId: string): PlotThread[] {
    return this.getThreadsForCharacter(project, characterId);
  },

  getCharacterPlotThreads(project: ProjectData, characterId: string): PlotThread[] {
    return this.getThreadsForCharacter(project, characterId);
  },

  getCharacterStoryArcs(project: ProjectData, characterId: string): StoryArc[] {
    const char = this.getCharacterById(project, characterId);
    if (!char) return [];
    const arcIds = new Set<string>();
    if (char.storyArcId) arcIds.add(char.storyArcId);
    if (char.storyArcIds) char.storyArcIds.forEach(id => arcIds.add(id));

    return (project.storyArcs || []).filter(arc => 
      arcIds.has(arc.id) || (arc.characterIds || []).includes(characterId)
    );
  },

  getCharacterRelationships(project: ProjectData, characterId: string): CharacterRelationship[] {
    const char = this.getCharacterById(project, characterId);
    if (!char) return [];
    return (char.relationships || []).map(rel => {
      const target = this.getCharacterById(project, rel.targetId);
      return {
        ...rel,
        targetName: target?.name || rel.targetName || 'Unknown Character'
      };
    });
  },

  getCharacterActiveGoals(project: ProjectData, characterId: string): GoalItem[] {
    const char = this.getCharacterById(project, characterId);
    if (!char || !char.goals) return [];
    const goals: GoalItem[] = [];
    char.goals.forEach((g, idx) => {
      if (typeof g === 'string') {
        goals.push({
          id: `goal-${idx}`,
          title: g,
          description: g,
          status: 'active',
          priority: 'medium'
        });
      } else if (g && (g.status === 'active' || !g.status)) {
        goals.push(g);
      }
    });
    return goals;
  },

  getCharacterKnowledgeAtScene(project: ProjectData, characterId: string, sceneId: string): KnowledgeEntry[] {
    const char = this.getCharacterById(project, characterId);
    if (!char || !char.knowledgeList) return [];

    // Find manuscript index of the target scene
    const allScenes = this.getAllScenes(project);
    const targetSceneIndex = allScenes.findIndex(s => s.id === sceneId);
    if (targetSceneIndex === -1) return char.knowledgeList;

    return char.knowledgeList.filter(k => {
      const learnedSceneId = k.sourceSceneId || k.learnedIn || k.learnedAt;
      if (!learnedSceneId) return true; // If no scene specified, author entered it as established baseline

      const learnedIndex = allScenes.findIndex(s => s.id === learnedSceneId || `scene-${s.chapterId}` === learnedSceneId || s.chapterId === learnedSceneId);
      if (learnedIndex === -1) return true;
      return learnedIndex <= targetSceneIndex;
    });
  },

  getCharacterStateAtScene(project: ProjectData, characterId: string, sceneId: string): CharacterState | null {
    const char = this.getCharacterById(project, characterId);
    if (!char) return null;

    // Check if there is an explicit state checkpoint at or before this scene
    if (char.stateCheckpoints && char.stateCheckpoints.length > 0) {
      const allScenes = this.getAllScenes(project);
      const targetSceneIndex = allScenes.findIndex(s => s.id === sceneId);

      if (targetSceneIndex !== -1) {
        let bestCheckpoint: CharacterStateCheckpoint | null = null;
        let bestIndex = -1;

        for (const chk of char.stateCheckpoints) {
          const chkIndex = allScenes.findIndex(s => s.id === chk.sceneId || `scene-${s.chapterId}` === chk.sceneId || s.chapterId === chk.sceneId);
          if (chkIndex !== -1 && chkIndex <= targetSceneIndex && chkIndex >= bestIndex) {
            bestCheckpoint = chk;
            bestIndex = chkIndex;
          }
        }

        if (bestCheckpoint) {
          return {
            emotional: bestCheckpoint.emotionalState,
            emotionalState: bestCheckpoint.emotionalState,
            physical: bestCheckpoint.physicalState,
            physicalState: bestCheckpoint.physicalState,
            mental: bestCheckpoint.mentalState,
            mentalState: bestCheckpoint.mentalState,
            currentGoal: bestCheckpoint.currentGoal,
            notes: bestCheckpoint.note,
            status: typeof char.currentState === 'object' ? char.currentState?.status : 'active'
          };
        }
      }
    }

    // Fallback to character's current state
    if (typeof char.currentState === 'object' && char.currentState !== null) {
      return char.currentState;
    } else if (typeof char.currentState === 'string') {
      return {
        status: char.currentState,
        currentGoal: char.currentGoal,
        motivation: char.motivations
      };
    }

    return {
      status: 'active',
      currentGoal: char.currentGoal,
      motivation: char.motivations
    };
  },

  getCharactersInScene(project: ProjectData, sceneId: string): Character[] {
    const scene = this.getSceneById(project, sceneId);
    if (!scene) return [];
    const charIds = new Set<string>(scene.characterIds || []);
    if (scene.povCharacterId) charIds.add(scene.povCharacterId);
    return (project.characters || []).filter(c => charIds.has(c.id));
  },

  getEventsForCharacter(project: ProjectData, characterId: string): Event[] {
    return (project.events || []).filter(e => 
      (e.participantCharacterIds || []).includes(characterId)
    );
  },

  getLocationsForCharacter(project: ProjectData, characterId: string): Location[] {
    const character = (project.characters || []).find(c => c.id === characterId);
    if (!character) return [];
    const locIds = new Set<string>();
    if (character.locationId) locIds.add(character.locationId);
    
    // Check scenes where character appears
    this.getScenesForCharacter(project, characterId).forEach(sc => {
      (sc.locationIds || []).forEach(id => locIds.add(id));
    });

    return (project.locations || []).filter(l => locIds.has(l.id));
  },

  getFactionsForCharacter(project: ProjectData, characterId: string): Faction[] {
    const character = (project.characters || []).find(c => c.id === characterId);
    if (!character) return [];
    const factionIds = new Set<string>(character.factionIds || []);
    
    (project.factions || []).forEach(fac => {
      if (fac.leaderCharacterId === characterId || (fac.memberCharacterIds || []).includes(characterId)) {
        factionIds.add(fac.id);
      }
    });

    return (project.factions || []).filter(f => factionIds.has(f.id));
  },

  getTimelineEventsChronological(project: ProjectData): Event[] {
    return [...(project.events || [])].sort((a, b) => a.order - b.order);
  },

  /**
   * Character Appearance Timeline
   * Generates horizontal chapter progression with explicit presence, POV status,
   * scene count, and direct editor navigation.
   */
  getCharacterAppearanceTimeline(project: ProjectData, characterId: string, characterName?: string) {
    const allScenes = this.getAllScenes(project);
    const lowerName = (characterName || '').toLowerCase();

    const columns: {
      chapterId: string;
      chapterNumber: number;
      chapterTitle: string;
      actTitle: string;
      isPresent: boolean;
      isPov: boolean;
      sceneCount: number;
      matchingScenes: { id: string; title: string; isPov: boolean }[];
    }[] = [];

    let chIndex = 1;
    let totalAppearances = 0;
    let povCount = 0;

    (project.acts || []).forEach(act => {
      (act.chapters || []).forEach(ch => {
        const scenesInChapter = allScenes.filter(s => s.chapterId === ch.id);
        
        // Match by scene characterIds or POV
        const matchingScenes = scenesInChapter.filter(s => 
          s.povCharacterId === characterId || (s.characterIds || []).includes(characterId)
        ).map(s => ({
          id: s.id,
          title: s.title,
          isPov: s.povCharacterId === characterId,
        }));

        const isPovInChapter = ch.povCharacterId === characterId || matchingScenes.some(s => s.isPov);
        const isChapterExplicit = (ch.characterIds || []).includes(characterId) || matchingScenes.length > 0;
        
        // Also check prose / wikilinks if characterName is provided
        const chapterProse = (ch.content || '') + ' ' + scenesInChapter.map(s => s.content || '').join(' ');
        const proseMatch = lowerName ? (chapterProse.toLowerCase().includes(lowerName) || chapterProse.toLowerCase().includes(`[[${lowerName}]]`)) : false;
        
        const isPresent = isPovInChapter || isChapterExplicit || Boolean(proseMatch);

        if (isPresent) totalAppearances++;
        if (isPovInChapter) povCount++;

        columns.push({
          chapterId: ch.id,
          chapterNumber: chIndex++,
          chapterTitle: ch.title,
          actTitle: act.title,
          isPresent,
          isPov: isPovInChapter,
          sceneCount: matchingScenes.length,
          matchingScenes,
        });
      });
    });

    return {
      columns,
      totalAppearances,
      povCount,
    };
  },

  /**
   * Get detailed narrative context bundle for a scene
   */
  getSceneDetailedContext(project: ProjectData, sceneId: string) {
    const scene = this.getSceneById(project, sceneId);
    if (!scene) return null;

    let parentChapter = null;
    let parentAct = null;

    for (const act of project.acts || []) {
      for (const ch of act.chapters || []) {
        if (ch.id === scene.chapterId || (ch.scenes || []).some(s => s.id === sceneId)) {
          parentChapter = ch;
          parentAct = act;
          break;
        }
      }
      if (parentChapter) break;
    }

    const povChar = (project.characters || []).find(c => c.id === scene.povCharacterId);
    const presentCharacters = (project.characters || []).filter(c => (scene.characterIds || []).includes(c.id));
    const locations = (project.locations || []).filter(l => (scene.locationIds || []).includes(l.id));
    const activeThreads = (project.plotThreads || []).filter(t => (scene.plotThreadIds || []).includes(t.id));
    const linkedEvents = (project.events || []).filter(e => (scene.eventIds || []).includes(e.id) || e.sceneId === scene.id);

    return {
      scene,
      parentChapter,
      parentAct,
      povChar,
      presentCharacters,
      locations,
      activeThreads,
      linkedEvents,
    };
  },

  /**
   * Continuity Diagnostic Engine
   * Detects narrative inconsistencies, unfulfilled promises, broken links, and orphans
   */
  diagnoseContinuityIssues(project: ProjectData): ContinuityIssue[] {
    const issues: ContinuityIssue[] = [];
    const allScenes = this.getAllScenes(project);
    const allCharacters = project.characters || [];
    const allLocations = project.locations || [];
    const allThreads = project.plotThreads || [];

    const charIds = new Set(allCharacters.map(c => c.id));
    const locIds = new Set(allLocations.map(l => l.id));
    const threadIds = new Set(allThreads.map(t => t.id));

    // 1. Check for POV assigned to non-existent characters
    allScenes.forEach(sc => {
      if (sc.povCharacterId && !charIds.has(sc.povCharacterId)) {
        issues.push({
          id: `issue-pov-${sc.id}`,
          severity: 'error',
          entityType: 'scene',
          entityId: sc.id,
          entityName: sc.title,
          message: `Scene references POV Character ID "${sc.povCharacterId}" which does not exist in the Character Bible.`,
          recommendation: 'Assign a valid POV character in the scene inspector.'
        });
      }

      // 2. Check for invalid location references
      (sc.locationIds || []).forEach(locId => {
        if (!locIds.has(locId)) {
          issues.push({
            id: `issue-loc-${sc.id}-${locId}`,
            severity: 'warning',
            entityType: 'scene',
            entityId: sc.id,
            entityName: sc.title,
            message: `Scene references unknown Location ID "${locId}".`,
            recommendation: 'Link an existing location or create a new Location in the Codex.'
          });
        }
      });

      // 3. Check for invalid plot thread references
      (sc.plotThreadIds || []).forEach(threadId => {
        if (!threadIds.has(threadId)) {
          issues.push({
            id: `issue-thread-${sc.id}-${threadId}`,
            severity: 'warning',
            entityType: 'scene',
            entityId: sc.id,
            entityName: sc.title,
            message: `Scene references unknown Plot Thread ID "${threadId}".`,
            recommendation: 'Remove stale thread reference or define it in Plot Threads.'
          });
        }
      });
    });

    // 4. Check for unresolved plot threads with 0 scene touchpoints
    allThreads.forEach(thread => {
      if (thread.status === 'active' || thread.status === 'in-progress' || thread.status === 'unresolved') {
        const scenesWithThread = allScenes.filter(s => (s.plotThreadIds || []).includes(thread.id));
        if (scenesWithThread.length === 0) {
          issues.push({
            id: `issue-thread-empty-${thread.id}`,
            severity: 'info',
            entityType: 'plotThread',
            entityId: thread.id,
            entityName: thread.title,
            message: `Plot thread "${thread.title}" is active but not linked to any scenes yet.`,
            recommendation: 'Tag the scenes where this thread progresses or set its status to Planned.'
          });
        }
      }
    });

    // 5. Check for major characters with 0 scene appearances
    allCharacters.forEach(char => {
      if (char.role === 'Protagonist' || char.role === 'Antagonist') {
        const scenesWithChar = allScenes.filter(s => s.povCharacterId === char.id || (s.characterIds || []).includes(char.id));
        if (scenesWithChar.length === 0) {
          issues.push({
            id: `issue-char-empty-${char.id}`,
            severity: 'warning',
            entityType: 'character',
            entityId: char.id,
            entityName: char.name,
            message: `${char.role} "${char.name}" has 0 recorded scene appearances.`,
            recommendation: `Assign "${char.name}" to the scenes they participate in.`
          });
        }
      }
    });

    return issues;
  },

  /**
   * Primary Plot Thread Matrix Engine
   * Generates horizontal timeline progression grid across all chapters/scenes with
   * touchpoint detection, continuous span calculation, and dormancy gap analysis.
   */
  getPlotThreadMatrix(project: ProjectData) {
    const columns: {
      chapterId: string;
      chapterNumber: number;
      chapterTitle: string;
      actTitle: string;
      actId: string;
      wordCount: number;
      sceneIds: string[];
    }[] = [];

    let chIndex = 1;
    (project.acts || []).forEach(act => {
      (act.chapters || []).forEach(ch => {
        const sceneIds = (ch.scenes && ch.scenes.length > 0)
          ? ch.scenes.map(s => s.id)
          : [`scene-${ch.id}`];

        columns.push({
          chapterId: ch.id,
          chapterNumber: chIndex++,
          chapterTitle: ch.title,
          actTitle: act.title,
          actId: act.id,
          wordCount: ch.wordCount,
          sceneIds
        });
      });
    });

    const allThreads = project.plotThreads || [];
    const allCharacters = project.characters || [];

    const rows = allThreads.map(thread => {
      // Find all column indexes where this thread appears
      const touchColIndices: number[] = [];

      const cells = columns.map((col, cIdx) => {
        // Check if chapter or any of its scenes link this thread
        const chapter = project.acts.flatMap(a => a.chapters).find(c => c.id === col.chapterId);
        const chapterHasThread = (chapter?.plotThreadIds || []).includes(thread.id);
        
        const linkedSceneIds = (chapter?.scenes || []).filter(s => (s.plotThreadIds || []).includes(thread.id)).map(s => s.id);
        const hasSceneLink = linkedSceneIds.length > 0;
        
        // Also check thread.relatedSceneIds
        const threadSceneIds = thread.relatedSceneIds || [];
        const threadMatchesScene = col.sceneIds.some(sId => threadSceneIds.includes(sId));

        const isTouchpoint = chapterHasThread || hasSceneLink || threadMatchesScene;

        if (isTouchpoint) {
          touchColIndices.push(cIdx);
        }

        return {
          chapterId: col.chapterId,
          isTouchpoint,
          sceneIds: linkedSceneIds,
          isIntroducedHere: thread.introducedIn === col.chapterId || col.sceneIds.includes(thread.introducedIn || ''),
          isResolvedHere: thread.resolvedIn === col.chapterId || col.sceneIds.includes(thread.resolvedIn || ''),
        };
      });

      const firstTouch = touchColIndices.length > 0 ? touchColIndices[0] : -1;
      const lastTouch = touchColIndices.length > 0 ? touchColIndices[touchColIndices.length - 1] : -1;

      // Finalize cells with 'span' (between first and last touch)
      const enrichedCells = cells.map((cell, idx) => {
        let state: 'touchpoint' | 'span' | 'none' = 'none';
        if (cell.isTouchpoint) {
          state = 'touchpoint';
        } else if (firstTouch !== -1 && lastTouch !== -1 && idx > firstTouch && idx < lastTouch) {
          state = 'span';
        }

        return {
          ...cell,
          state,
        };
      });

      // Dormancy Calculation:
      // If thread is active/setup/payoff-pending/unresolved, and has appeared before,
      // but has had a gap of >= 3 chapters up to the end or between appearances.
      const isUnresolved = thread.status !== 'resolved' && thread.status !== 'abandoned';
      let isDormant = false;
      let dormantGapLength = 0;
      let dormantAfterIndex = -1;

      if (isUnresolved && lastTouch !== -1) {
        const gapFromLastTouchToEnd = columns.length - 1 - lastTouch;
        if (gapFromLastTouchToEnd >= 3) {
          isDormant = true;
          dormantGapLength = gapFromLastTouchToEnd;
          dormantAfterIndex = lastTouch;
        } else if (thread.status === 'dormant') {
          isDormant = true;
          dormantGapLength = Math.max(3, gapFromLastTouchToEnd);
          dormantAfterIndex = lastTouch;
        }
      } else if (thread.status === 'dormant') {
        isDormant = true;
        dormantGapLength = 3;
      }

      const relatedChars = allCharacters.filter(c => (thread.relatedCharacterIds || []).includes(c.id));

      return {
        thread,
        cells: enrichedCells,
        firstTouchIndex: firstTouch,
        lastTouchIndex: lastTouch,
        touchCount: touchColIndices.length,
        isDormant,
        dormantGapLength,
        dormantAfterIndex,
        relatedCharacters: relatedChars,
      };
    });

    return {
      columns,
      rows,
      totalThreads: allThreads.length,
      activeCount: allThreads.filter(t => t.status === 'active' || t.status === 'setup' || t.status === 'in-progress' || t.status === 'payoff-pending').length,
      dormantCount: rows.filter(r => r.isDormant).length,
      resolvedCount: allThreads.filter(t => t.status === 'resolved').length,
    };
  },

  /**
   * Deterministic Chronological Sort Score & Marker Parser
   * Converts in-universe dates, relative days, offsets, and non-linear markers
   * into a standardized numerical scoring and categorization.
   */
  parseChronologicalSortScore(
    dateStr?: string, 
    tags: string[] = [], 
    narrativeIndex: number = 0
  ): { 
    score: number; 
    timeType: TimelineTimeType; 
    isEstimated: boolean; 
    isUndated: boolean; 
    standardMarker?: string; 
  } {
    const tagStr = tags.join(' ').toLowerCase();
    const rawDate = (dateStr || '').trim();
    const rawLower = rawDate.toLowerCase();

    // 1. Determine baseline timeType from tags and text
    let timeType: TimelineTimeType = 'present';
    if (/flashback|memory|reminisc/i.test(tagStr) || /flashback|years earlier|days earlier|ago\b/i.test(rawLower)) {
      timeType = 'flashback';
    } else if (/flashforward|vision|prophecy|future/i.test(tagStr) || /flashforward|years later|days later|in the future/i.test(rawLower)) {
      timeType = 'flashforward';
    } else if (/backstory|prelude|historical/i.test(tagStr) || /ancient|historical/i.test(rawLower)) {
      timeType = 'historical';
    } else if (/prologue|origin/i.test(tagStr) || /prologue|origin/i.test(rawLower)) {
      timeType = 'backstory';
    } else if (/parallel/i.test(tagStr)) {
      timeType = 'parallel';
    }

    // 2. Handle empty / undated cases
    if (!rawDate) {
      if (timeType === 'flashback') {
        return {
          score: (narrativeIndex * 1000) - 50000,
          timeType,
          isEstimated: true,
          isUndated: false,
          standardMarker: 'Flashback'
        };
      }
      if (timeType === 'backstory') {
        return {
          score: -100000 + narrativeIndex,
          timeType,
          isEstimated: true,
          isUndated: false,
          standardMarker: 'Backstory'
        };
      }
      if (timeType === 'historical') {
        return {
          score: -200000 + narrativeIndex,
          timeType,
          isEstimated: true,
          isUndated: false,
          standardMarker: 'Historical Era'
        };
      }
      if (timeType === 'flashforward') {
        return {
          score: 500000 + (narrativeIndex * 1000),
          timeType,
          isEstimated: true,
          isUndated: false,
          standardMarker: 'Flashforward'
        };
      }
      return {
        score: narrativeIndex * 1000,
        timeType: 'present',
        isEstimated: false,
        isUndated: true,
      };
    }

    // 3. Parse BCE / BC Dates (e.g. "400 BCE", "Year 120 BC")
    const bceMatch = rawDate.match(/(\d+)\s*(?:bce|bc)\b/i);
    if (bceMatch) {
      const year = parseInt(bceMatch[1], 10);
      return {
        score: -year * 100000,
        timeType: timeType === 'present' ? 'historical' : timeType,
        isEstimated: false,
        isUndated: false,
        standardMarker: `${year} BCE`
      };
    }

    // 4. Parse Relative Day formats (e.g. "Day 1", "Day 4", "Day 3, Dawn", "Day 12, Evening")
    const dayMatch = rawDate.match(/day\s*([+-]?\d+(?:\.\d+)?)/i);
    if (dayMatch) {
      const dayNum = parseFloat(dayMatch[1]);
      let timeOfDayFraction = 0;
      if (/dawn|early morning/i.test(rawDate)) timeOfDayFraction = 100;
      else if (/morning|am\b/i.test(rawDate)) timeOfDayFraction = 200;
      else if (/noon|midday/i.test(rawDate)) timeOfDayFraction = 500;
      else if (/afternoon/i.test(rawDate)) timeOfDayFraction = 600;
      else if (/dusk|sunset|twilight/i.test(rawDate)) timeOfDayFraction = 750;
      else if (/evening|pm\b/i.test(rawDate)) timeOfDayFraction = 800;
      else if (/night|midnight/i.test(rawDate)) timeOfDayFraction = 900;

      const score = (dayNum * 10000) + timeOfDayFraction;
      return {
        score,
        timeType,
        isEstimated: false,
        isUndated: false,
        standardMarker: `Day ${dayNum}`
      };
    }

    // 5. Parse Relative Offsets (e.g. "14 years earlier", "3 days earlier", "5 years later", "+3 days", "-2 days")
    const yearsEarlierMatch = rawDate.match(/(\d+)\s*years?\s*earlier/i);
    if (yearsEarlierMatch) {
      const yrs = parseInt(yearsEarlierMatch[1], 10);
      return {
        score: (narrativeIndex * 1000) - (yrs * 100000),
        timeType: 'flashback',
        isEstimated: false,
        isUndated: false,
        standardMarker: `${yrs} Years Earlier`
      };
    }

    const daysEarlierMatch = rawDate.match(/(\d+)\s*days?\s*earlier/i);
    if (daysEarlierMatch) {
      const days = parseInt(daysEarlierMatch[1], 10);
      return {
        score: (narrativeIndex * 1000) - (days * 10000),
        timeType: 'flashback',
        isEstimated: false,
        isUndated: false,
        standardMarker: `${days} Days Earlier`
      };
    }

    const yearsLaterMatch = rawDate.match(/(\d+)\s*years?\s*later/i);
    if (yearsLaterMatch) {
      const yrs = parseInt(yearsLaterMatch[1], 10);
      return {
        score: (narrativeIndex * 1000) + (yrs * 100000),
        timeType: 'flashforward',
        isEstimated: false,
        isUndated: false,
        standardMarker: `${yrs} Years Later`
      };
    }

    const daysLaterMatch = rawDate.match(/(\d+)\s*days?\s*later/i);
    if (daysLaterMatch) {
      const days = parseInt(daysLaterMatch[1], 10);
      return {
        score: (narrativeIndex * 1000) + (days * 10000),
        timeType: 'flashforward',
        isEstimated: false,
        isUndated: false,
        standardMarker: `${days} Days Later`
      };
    }

    const signedOffsetMatch = rawDate.match(/^([+-]\d+)\s*(?:days?|d)?$/i);
    if (signedOffsetMatch) {
      const offset = parseInt(signedOffsetMatch[1], 10);
      return {
        score: (narrativeIndex * 1000) + (offset * 10000),
        timeType: offset < 0 ? 'flashback' : 'flashforward',
        isEstimated: false,
        isUndated: false,
        standardMarker: `${offset > 0 ? '+' : ''}${offset} Days`
      };
    }

    // 6. Parse Year formats (e.g. "Year 1492", "Yr 402", "1492 CE")
    const yearMatch = rawDate.match(/(?:year|yr\.?)\s*(\d+)/i) || rawDate.match(/\b(1\d{3}|20\d{2})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      return {
        score: year * 100000,
        timeType: timeType === 'present' ? 'historical' : timeType,
        isEstimated: false,
        isUndated: false,
        standardMarker: `Year ${year}`
      };
    }

    // 7. Parse ISO or Standard Calendar Strings (e.g. "2024-03-15", "March 15, 2024")
    const parsedTs = Date.parse(rawDate);
    if (!isNaN(parsedTs)) {
      return {
        score: parsedTs,
        timeType,
        isEstimated: false,
        isUndated: false,
        standardMarker: rawDate
      };
    }

    // 8. Plain numerical index string (e.g. "1", "2", "10")
    if (/^[+-]?\d+$/.test(rawDate)) {
      const num = parseInt(rawDate, 10);
      return {
        score: num * 10000,
        timeType,
        isEstimated: false,
        isUndated: false,
        standardMarker: `T+${num}`
      };
    }

    // 9. Freeform approximate markers (e.g. "Before the siege", "Three days later", "Years earlier")
    if (/earlier|before|past|prior/i.test(rawDate)) {
      return {
        score: (narrativeIndex * 1000) - 50000,
        timeType: 'flashback',
        isEstimated: true,
        isUndated: false,
        standardMarker: rawDate
      };
    }

    if (/later|after|future/i.test(rawDate)) {
      return {
        score: (narrativeIndex * 1000) + 50000,
        timeType: 'flashforward',
        isEstimated: true,
        isUndated: false,
        standardMarker: rawDate
      };
    }

    return {
      score: narrativeIndex * 1000,
      timeType,
      isEstimated: true,
      isUndated: false,
      standardMarker: rawDate
    };
  },

  /**
   * Return all events sorted strictly by story chronology
   */
  getEventsChronologically(project: ProjectData): Event[] {
    return [...(project.events || [])].sort((a, b) => {
      const aScore = this.parseChronologicalSortScore(a.timelineDate, a.tags, a.order).score;
      const bScore = this.parseChronologicalSortScore(b.timelineDate, b.tags, b.order).score;
      if (aScore !== bScore) return aScore - bScore;
      return a.order - b.order;
    });
  },

  /**
   * Return all scenes sorted strictly by story chronology
   */
  getScenesChronologically(project: ProjectData): Scene[] {
    const allScenes = this.getAllScenes(project);
    const narrativeMap = new Map<string, number>();
    allScenes.forEach((s, idx) => narrativeMap.set(s.id, idx + 1));

    return [...allScenes].sort((a, b) => {
      const aNarrative = narrativeMap.get(a.id) || 1;
      const bNarrative = narrativeMap.get(b.id) || 1;
      const aScore = this.parseChronologicalSortScore(a.timelineDate, a.tags, aNarrative).score;
      const bScore = this.parseChronologicalSortScore(b.timelineDate, b.tags, bNarrative).score;
      if (aScore !== bScore) return aScore - bScore;
      return aNarrative - bNarrative;
    });
  },

  /**
   * Return narrative reading order (flat linear sequence as read by the audience)
   */
  getNarrativeOrder(project: ProjectData): StoryTimelineNode[] {
    return this.getStoryTimelineData(project).manuscriptNodes;
  },

  /**
   * Return fictional chronological order across all scenes & unlinked events
   */
  getChronologicalOrder(project: ProjectData): StoryTimelineNode[] {
    return this.getStoryTimelineData(project).chronologyNodes;
  },

  /**
   * Return chronological timeline nodes specifically for a character
   */
  getTimelineForCharacter(project: ProjectData, characterId: string): StoryTimelineNode[] {
    return this.getStoryTimelineData(project, { characterId }).chronologyNodes;
  },

  /**
   * Return chronological timeline nodes specifically for a plot thread
   */
  getTimelineForPlotThread(project: ProjectData, threadId: string): StoryTimelineNode[] {
    return this.getStoryTimelineData(project, { plotThreadId: threadId }).chronologyNodes;
  },

  /**
   * Return chronological timeline nodes specifically for a location
   */
  getTimelineForLocation(project: ProjectData, locationId: string): StoryTimelineNode[] {
    return this.getStoryTimelineData(project, { locationId }).chronologyNodes;
  },

  /**
   * Return events occurring between two chronological points or dates
   */
  getEventsBetween(
    project: ProjectData, 
    start: string | number, 
    end: string | number
  ): Event[] {
    const startScore = typeof start === 'number' ? start : this.parseChronologicalSortScore(start, []).score;
    const endScore = typeof end === 'number' ? end : this.parseChronologicalSortScore(end, []).score;
    const min = Math.min(startScore, endScore);
    const max = Math.max(startScore, endScore);

    const sorted = this.getEventsChronologically(project);
    return sorted.filter(e => {
      const eScore = this.parseChronologicalSortScore(e.timelineDate, e.tags, e.order).score;
      return eScore >= min && eScore <= max;
    });
  },

  /**
   * Retrieve the exact dual-position coordinates for a given scene or event
   */
  getChronologyPosition(
    project: ProjectData, 
    sceneOrEventId: string
  ): {
    narrativeIndex: number;
    chronologicalIndex: number;
    isNonLinear: boolean;
    delta: number;
    timeType: TimelineTimeType;
    timelineDate?: string;
  } | null {
    const data = this.getStoryTimelineData(project);
    const node = data.allNodes.find(n => 
      n.sceneId === sceneOrEventId || 
      (n.events && n.events.some(e => e.id === sceneOrEventId)) ||
      n.id === sceneOrEventId ||
      n.id === `tl-${sceneOrEventId}` ||
      n.id === `tl-evt-${sceneOrEventId}` ||
      n.id === `tl-ch-${sceneOrEventId}`
    );
    if (!node) return null;
    return {
      narrativeIndex: node.manuscriptOrder,
      chronologicalIndex: node.chronologicalOrder,
      isNonLinear: node.isNonLinear,
      delta: node.deltaManuscriptVsChronology,
      timeType: node.timeType,
      timelineDate: node.timelineDate,
    };
  },

  /**
   * Identify all chronological inversions, flashbacks, and non-linear deviations
   */
  detectChronologyInversions(project: ProjectData): ChronologyInversionWarning[] {
    const data = this.getStoryTimelineData(project);
    const warnings: ChronologyInversionWarning[] = [];

    data.allNodes.forEach(node => {
      if (node.isNonLinear || node.timeType !== 'present' || node.deltaManuscriptVsChronology !== 0) {
        let reason = '';
        if (node.timeType === 'flashback') {
          reason = `Flashback: Presented at position #${node.manuscriptOrder} in manuscript, but occurred at #${node.chronologicalOrder} in story history.`;
        } else if (node.timeType === 'flashforward') {
          reason = `Flashforward: Presented at position #${node.manuscriptOrder} in manuscript, ahead of story chronology #${node.chronologicalOrder}.`;
        } else if (node.deltaManuscriptVsChronology > 0) {
          reason = `Nonlinear shift: Placed at manuscript #${node.manuscriptOrder} but chronologically belongs at #${node.chronologicalOrder} (earlier in time).`;
        } else {
          reason = `Nonlinear shift: Placed at manuscript #${node.manuscriptOrder} but chronologically belongs at #${node.chronologicalOrder} (later in time).`;
        }

        warnings.push({
          nodeId: node.id,
          entityId: node.sceneId || (node.events[0]?.id) || node.chapterId || node.id,
          entityType: node.type,
          title: node.title,
          narrativeIndex: node.manuscriptOrder,
          chronologicalIndex: node.chronologicalOrder,
          timeType: node.timeType,
          reason,
          delta: node.deltaManuscriptVsChronology,
        });
      }
    });

    return warnings;
  },

  /**
   * Detect scenes and events that have missing or undated chronology
   */
  detectMissingChronology(project: ProjectData): Array<{ id: string; type: 'scene' | 'event'; title: string; chapterTitle?: string }> {
    const missing: Array<{ id: string; type: 'scene' | 'event'; title: string; chapterTitle?: string }> = [];
    const allScenes = this.getAllScenes(project);

    allScenes.forEach(s => {
      if (!s.timelineDate || !s.timelineDate.trim()) {
        const hasTimeTag = (s.tags || []).some(t => /flashback|flashforward|backstory|historical|memory|prologue/i.test(t));
        if (!hasTimeTag) {
          const ch = this.getChapterById(project, s.chapterId);
          missing.push({
            id: s.id,
            type: 'scene',
            title: s.title,
            chapterTitle: ch?.title,
          });
        }
      }
    });

    (project.events || []).forEach(e => {
      if (!e.timelineDate || !e.timelineDate.trim()) {
        const hasTimeTag = (e.tags || []).some(t => /flashback|flashforward|backstory|historical|memory|prologue/i.test(t));
        if (!hasTimeTag) {
          missing.push({
            id: e.id,
            type: 'event',
            title: e.title,
          });
        }
      }
    });

    return missing;
  },

  /**
   * Detect duplicate order indices across events or scenes within the same chapter
   */
  detectDuplicateOrdering(project: ProjectData): Array<{ order: number; eventIds: string[]; sceneIds: string[] }> {
    const duplicates: Array<{ order: number; eventIds: string[]; sceneIds: string[] }> = [];

    // Check events
    const eventOrderMap = new Map<number, string[]>();
    (project.events || []).forEach(e => {
      if (typeof e.order === 'number') {
        const list = eventOrderMap.get(e.order) || [];
        list.push(e.id);
        eventOrderMap.set(e.order, list);
      }
    });

    eventOrderMap.forEach((ids, order) => {
      if (ids.length > 1) {
        duplicates.push({ order, eventIds: ids, sceneIds: [] });
      }
    });

    // Check scenes per chapter
    (project.acts || []).forEach(act => {
      (act.chapters || []).forEach(ch => {
        const sceneOrderMap = new Map<number, string[]>();
        (ch.scenes || []).forEach(s => {
          if (typeof s.order === 'number') {
            const list = sceneOrderMap.get(s.order) || [];
            list.push(s.id);
            sceneOrderMap.set(s.order, list);
          }
        });
        sceneOrderMap.forEach((ids, order) => {
          if (ids.length > 1) {
            duplicates.push({ order, eventIds: [], sceneIds: ids });
          }
        });
      });
    });

    return duplicates;
  },

  /**
   * Primary Story Timeline Engine
   * Generates synchronized dual-perspective representations:
   * 1. MANUSCRIPT ORDER: The linear experience of the reader (Acts -> Chapters -> Scenes)
   * 2. STORY CHRONOLOGY: True in-universe timeline (Historical backstory -> Present -> Flashforwards)
   */
  getStoryTimelineData(project: ProjectData, filter?: TimelineFilterConfig): StoryTimelineData {
    const allScenes = this.getAllScenes(project);
    const allCharacters = project.characters || [];
    const allLocations = project.locations || [];
    const allThreads = project.plotThreads || [];
    const allArcs = project.storyArcs || [];
    const allEvents = project.events || [];

    const charMap = new Map(allCharacters.map(c => [c.id, c]));
    const locMap = new Map(allLocations.map(l => [l.id, l]));
    const threadMap = new Map(allThreads.map(t => [t.id, t]));
    const arcMap = new Map(allArcs.map(a => [a.id, a]));

    const rawNodes: StoryTimelineNode[] = [];
    let readingOrderIndex = 1;
    let chCount = 0;

    (project.acts || []).forEach(act => {
      (act.chapters || []).forEach(ch => {
        chCount++;
        const scenesInChapter = allScenes.filter(s => s.chapterId === ch.id);

        if (scenesInChapter.length > 0) {
          scenesInChapter.forEach(sc => {
            const povChar = sc.povCharacterId ? charMap.get(sc.povCharacterId) : (ch.povCharacterId ? charMap.get(ch.povCharacterId) : undefined);
            const presentChars = (sc.characterIds || []).map(id => charMap.get(id)).filter(Boolean) as Character[];
            if (povChar && !presentChars.some(c => c.id === povChar.id)) {
              presentChars.unshift(povChar);
            }

            const locs = (sc.locationIds || []).map(id => locMap.get(id)).filter(Boolean) as Location[];
            const threads = (sc.plotThreadIds || []).map(id => threadMap.get(id)).filter(Boolean) as PlotThread[];
            const arcs = (sc.storyArcIds || []).map(id => arcMap.get(id)).filter(Boolean) as StoryArc[];
            const linkedEvts = allEvents.filter(e => (sc.eventIds || []).includes(e.id) || e.sceneId === sc.id || e.chapterId === ch.id);

            const parsedScore = this.parseChronologicalSortScore(sc.timelineDate, sc.tags, readingOrderIndex);

            rawNodes.push({
              id: `tl-${sc.id}`,
              type: 'scene',
              title: sc.title,
              synopsis: sc.synopsis,
              actId: act.id,
              actTitle: act.title,
              chapterId: ch.id,
              chapterNumber: ch.order || chCount,
              chapterTitle: ch.title,
              sceneId: sc.id,
              sceneTitle: sc.title,
              manuscriptOrder: readingOrderIndex++,
              chronologicalOrder: 0, // calculated after sorting
              timelineDate: sc.timelineDate || parsedScore.standardMarker,
              parsedChronologicalScore: parsedScore.score,
              timeType: parsedScore.timeType,
              povCharacter: povChar,
              characters: presentChars,
              locations: locs,
              plotThreads: threads,
              storyArcs: arcs,
              events: linkedEvts,
              tensionLevel: sc.tensionLevel || 5,
              status: sc.status,
              wordCount: sc.wordCount,
              tags: sc.tags,
              isNonLinear: parsedScore.timeType !== 'present',
              deltaManuscriptVsChronology: 0,
            });
          });
        } else {
          // Chapter without discrete scenes
          const povChar = ch.povCharacterId ? charMap.get(ch.povCharacterId) : undefined;
          const presentChars = (ch.characterIds || []).map(id => charMap.get(id)).filter(Boolean) as Character[];
          if (povChar && !presentChars.some(c => c.id === povChar.id)) {
            presentChars.unshift(povChar);
          }

          const locs = (ch.locationIds || []).map(id => locMap.get(id)).filter(Boolean) as Location[];
          const threads = (ch.plotThreadIds || []).map(id => threadMap.get(id)).filter(Boolean) as PlotThread[];
          const linkedEvts = allEvents.filter(e => e.chapterId === ch.id);

          const parsedScore = this.parseChronologicalSortScore(undefined, ch.tags, readingOrderIndex);

          rawNodes.push({
            id: `tl-ch-${ch.id}`,
            type: 'chapter',
            title: ch.title,
            synopsis: ch.synopsis,
            actId: act.id,
            actTitle: act.title,
            chapterId: ch.id,
            chapterNumber: ch.order || chCount,
            chapterTitle: ch.title,
            manuscriptOrder: readingOrderIndex++,
            chronologicalOrder: 0,
            parsedChronologicalScore: parsedScore.score,
            timeType: parsedScore.timeType,
            povCharacter: povChar,
            characters: presentChars,
            locations: locs,
            plotThreads: threads,
            storyArcs: [],
            events: linkedEvts,
            status: ch.status,
            wordCount: ch.wordCount,
            tags: ch.tags,
            isNonLinear: parsedScore.timeType !== 'present',
            deltaManuscriptVsChronology: 0,
          });
        }
      });
    });

    // Also include standalone unlinked historical events in chronology
    allEvents.forEach(evt => {
      if (!evt.chapterId && !evt.sceneId) {
        const presentChars = (evt.participantCharacterIds || []).map(id => charMap.get(id)).filter(Boolean) as Character[];
        const locs = evt.locationId && locMap.get(evt.locationId) ? [locMap.get(evt.locationId)!] : [];
        
        const parsedScore = this.parseChronologicalSortScore(evt.timelineDate, evt.tags || ['historical'], evt.order);

        rawNodes.push({
          id: `tl-evt-${evt.id}`,
          type: 'event',
          title: evt.title,
          synopsis: evt.summary,
          manuscriptOrder: readingOrderIndex++,
          chronologicalOrder: 0,
          timelineDate: evt.timelineDate || parsedScore.standardMarker,
          parsedChronologicalScore: parsedScore.score,
          timeType: parsedScore.timeType === 'present' ? 'historical' : parsedScore.timeType,
          characters: presentChars,
          locations: locs,
          plotThreads: [],
          storyArcs: [],
          events: [evt],
          tensionLevel: evt.tensionLevel || 5,
          isNonLinear: true,
          deltaManuscriptVsChronology: 0,
        });
      }
    });

    // Compute Chronological Order ranking
    const sortedByChronology = [...rawNodes].sort((a, b) => {
      if (a.parsedChronologicalScore !== b.parsedChronologicalScore) {
        return a.parsedChronologicalScore - b.parsedChronologicalScore;
      }
      return a.manuscriptOrder - b.manuscriptOrder;
    });

    sortedByChronology.forEach((node, idx) => {
      node.chronologicalOrder = idx + 1;
      node.deltaManuscriptVsChronology = node.manuscriptOrder - node.chronologicalOrder;
      node.isNonLinear = node.deltaManuscriptVsChronology !== 0 || node.timeType !== 'present';
    });

    // Apply Filters if provided
    const filterNode = (n: StoryTimelineNode): boolean => {
      if (!filter) return true;
      if (filter.characterId) {
        const hasChar = (n.povCharacter?.id === filter.characterId) || n.characters.some(c => c.id === filter.characterId);
        if (!hasChar) return false;
      }
      if (filter.locationId) {
        const hasLoc = n.locations.some(l => l.id === filter.locationId);
        if (!hasLoc) return false;
      }
      if (filter.plotThreadId) {
        const hasThread = n.plotThreads.some(t => t.id === filter.plotThreadId);
        if (!hasThread) return false;
      }
      if (filter.storyArcId) {
        const hasArc = n.storyArcs.some(a => a.id === filter.storyArcId);
        if (!hasArc) return false;
      }
      if (filter.timeType && filter.timeType !== 'all') {
        if (n.timeType !== filter.timeType) return false;
      }
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        const matches = 
          n.title.toLowerCase().includes(q) ||
          (n.synopsis || '').toLowerCase().includes(q) ||
          (n.chapterTitle || '').toLowerCase().includes(q) ||
          (n.povCharacter?.name || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    };

    const manuscriptNodes = rawNodes.filter(filterNode).sort((a, b) => a.manuscriptOrder - b.manuscriptOrder);
    const chronologyNodes = [...rawNodes].filter(filterNode).sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);

    return {
      manuscriptNodes,
      chronologyNodes,
      allNodes: rawNodes,
      totalScenes: allScenes.length,
      totalChapters: chCount,
      totalEvents: allEvents.length,
      nonLinearCount: rawNodes.filter(n => n.isNonLinear).length,
      flashbackCount: rawNodes.filter(n => n.timeType === 'flashback').length,
      flashforwardCount: rawNodes.filter(n => n.timeType === 'flashforward').length,
    };
  }
};
