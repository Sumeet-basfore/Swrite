import { 
  ProjectData, Scene, Character, Location, Faction, 
  Item, Event, StoryArc, PlotThread, Chapter, Act,
  ContinuityWarning, ContinuityEvidence, ContinuityConfig, ContinuityCheckType, IntentionalChoiceRecord
} from '../types';
import { StoryEngineQueries } from './queries';

/**
 * Default Continuity Engine Configuration
 */
export const DEFAULT_CONTINUITY_CONFIG: ContinuityConfig = {
  threadDormancyChapterThreshold: 3,
  ignoredWarningIds: [],
  intentionalWarnings: [],
  enabledChecks: {
    knowledge: true,
    state: true,
    timeline: true,
    location: true,
    attributes: true,
    threadDormancy: true,
  },
};

/**
 * Helper to get clean chapter order map
 */
interface FlatChapterInfo {
  chapter: Chapter;
  act: Act;
  index: number; // 1-indexed
  scenes: Scene[];
}

function getFlatChapters(project: ProjectData): FlatChapterInfo[] {
  const result: FlatChapterInfo[] = [];
  let index = 1;
  const allScenes = StoryEngineQueries.getAllScenes(project);

  (project.acts || []).forEach(act => {
    (act.chapters || []).forEach(ch => {
      const scenes = allScenes.filter(s => s.chapterId === ch.id);
      result.push({
        chapter: ch,
        act,
        index: index++,
        scenes,
      });
    });
  });

  return result;
}

/**
 * Parse chapter/scene reference from a freeform string like "Chapter 16", "Ch 3", "ch-123", "The Climax"
 */
function resolveChapterReference(ref: string, flatChapters: FlatChapterInfo[]): FlatChapterInfo | null {
  if (!ref) return null;
  const clean = ref.trim().toLowerCase();

  // Match by direct ID
  const byId = flatChapters.find(fc => fc.chapter.id === ref || fc.chapter.id.toLowerCase() === clean);
  if (byId) return byId;

  // Match by "Chapter N" or "Ch N" or "N"
  const numMatch = clean.match(/(?:chapter|ch\.?|act\s*\w+\s*,\s*ch\.?)\s*(\d+)/i) || clean.match(/^(\d+)$/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const byNum = flatChapters.find(fc => fc.index === num || fc.chapter.order === num);
    if (byNum) return byNum;
  }

  // Match by Title substring
  const byTitle = flatChapters.find(fc => fc.chapter.title.toLowerCase().includes(clean) || clean.includes(fc.chapter.title.toLowerCase()));
  if (byTitle) return byTitle;

  return null;
}

/**
 * Deterministic Continuity Engine
 * 100% LLM-free, structured domain reasoning for Swrite manuscripts.
 */
export class ContinuityEngine {
  /**
   * Run full continuity diagnostic scan across all enabled check modules
   */
  static runAudit(project: ProjectData, customConfig?: Partial<ContinuityConfig>): ContinuityWarning[] {
    const config: ContinuityConfig = {
      ...DEFAULT_CONTINUITY_CONFIG,
      ...(project.metadata?.continuityConfig || {}),
      ...(customConfig || {}),
      enabledChecks: {
        ...DEFAULT_CONTINUITY_CONFIG.enabledChecks,
        ...(project.metadata?.continuityConfig?.enabledChecks || {}),
        ...(customConfig?.enabledChecks || {}),
      },
      ignoredWarningIds: customConfig?.ignoredWarningIds || project.metadata?.continuityConfig?.ignoredWarningIds || [],
      intentionalWarnings: customConfig?.intentionalWarnings || project.metadata?.continuityConfig?.intentionalWarnings || [],
    };

    const flatChapters = getFlatChapters(project);
    const warnings: ContinuityWarning[] = [];

    // 1. Character Knowledge Check
    if (config.enabledChecks.knowledge) {
      warnings.push(...this.checkCharacterKnowledge(project, flatChapters));
    }

    // 2. Character State Check (Dead / Incapacitated / Missing)
    if (config.enabledChecks.state) {
      warnings.push(...this.checkCharacterState(project, flatChapters));
    }

    // 3. Timeline Chronology Check
    if (config.enabledChecks.timeline) {
      warnings.push(...this.checkTimelineChronology(project, flatChapters));
    }

    // 4. Location / Spatial Continuity Check
    if (config.enabledChecks.location) {
      warnings.push(...this.checkLocationContinuity(project, flatChapters));
    }

    // 5. Character Attributes & Structured Conflict Check
    if (config.enabledChecks.attributes) {
      warnings.push(...this.checkCharacterAttributes(project, flatChapters));
    }

    // 6. Plot Thread Dormancy Check
    if (config.enabledChecks.threadDormancy) {
      warnings.push(...this.checkPlotThreadDormancy(project, flatChapters, config.threadDormancyChapterThreshold));
    }

    // Annotate with ignored & intentional status
    const ignoredSet = new Set(config.ignoredWarningIds);
    const intentionalMap = new Map(config.intentionalWarnings.map(w => [w.warningId, w]));

    const processedWarnings = warnings.map(w => {
      const isIgnored = ignoredSet.has(w.id);
      const intentionalRecord = intentionalMap.get(w.id);
      return {
        ...w,
        isIgnored,
        isIntentional: Boolean(intentionalRecord),
        intentionalReason: intentionalRecord?.reason,
      };
    });

    // Sort by severity (critical > warning > notice) and chapter order
    const severityWeight: Record<string, number> = { critical: 3, warning: 2, notice: 1 };
    return processedWarnings.sort((a, b) => {
      const diff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
      if (diff !== 0) return diff;
      return (a.primaryChapterId ? 0 : 1) - (b.primaryChapterId ? 0 : 1);
    });
  }

  // =========================================================================
  // 1. CHECK: Character Knowledge
  // A character references information before they learned it.
  // =========================================================================
  static checkCharacterKnowledge(project: ProjectData, flatChapters: FlatChapterInfo[]): ContinuityWarning[] {
    const warnings: ContinuityWarning[] = [];
    const characters = project.characters || [];

    characters.forEach(char => {
      const knowledgeList = char.knowledgeList || [];
      
      knowledgeList.forEach(k => {
        if (!k.information || !k.learnedAt) return;
        const learnedChapter = resolveChapterReference(k.learnedAt, flatChapters);
        if (!learnedChapter) return;

        const infoTerm = k.information.trim().toLowerCase();
        // Skip short generic terms to eliminate false positives
        if (infoTerm.length < 3) return;

        // Scan chapters prior to learnedChapter
        flatChapters.forEach(fc => {
          if (fc.index >= learnedChapter.index) return; // Only check chapters BEFORE learned chapter

          const isCharPresent = 
            fc.chapter.povCharacterId === char.id ||
            (fc.chapter.characterIds || []).includes(char.id) ||
            fc.scenes.some(s => s.povCharacterId === char.id || (s.characterIds || []).includes(char.id));

          // If character is present or POV in this prior chapter
          if (isCharPresent) {
            const rawContent = (fc.chapter.content || '').toLowerCase();
            const synopsis = (fc.chapter.synopsis || '').toLowerCase();
            const sceneSynopses = fc.scenes.map(s => (s.synopsis || '') + ' ' + (s.content || '')).join(' ').toLowerCase();
            
            // Exact substring or bracketed term [[Term]] check
            const hasDirectMention = 
              rawContent.includes(infoTerm) || 
              synopsis.includes(infoTerm) || 
              sceneSynopses.includes(infoTerm) ||
              rawContent.includes(`[[${infoTerm}]]`);

            if (hasDirectMention) {
              const warningId = `warn-knowledge-${char.id}-${k.id}-${fc.chapter.id}`;
              warnings.push({
                id: warningId,
                type: 'knowledge',
                severity: 'warning',
                title: `Premature Knowledge: ${char.name}`,
                summary: `${char.name} references "${k.information}" in Chapter ${fc.index} before learning it.`,
                description: `According to Story State, ${char.name} learns about "${k.information}" in Chapter ${learnedChapter.index} (${learnedChapter.chapter.title})${k.source ? ` from ${k.source}` : ''}. However, this information appears in Chapter ${fc.index} (${fc.chapter.title}) where ${char.name} is present.`,
                evidence: [
                  {
                    label: `Premature Reference: Chapter ${fc.index}`,
                    chapterId: fc.chapter.id,
                    chapterNumber: fc.index,
                    chapterTitle: fc.chapter.title,
                    details: `Information "${k.information}" is referenced where ${char.name} is present or POV.`,
                  },
                  {
                    label: `Acquisition Point: Chapter ${learnedChapter.index}`,
                    chapterId: learnedChapter.chapter.id,
                    chapterNumber: learnedChapter.index,
                    chapterTitle: learnedChapter.chapter.title,
                    details: `Recorded knowledge origin: ${k.learnedAt}${k.source ? ` (Source: ${k.source})` : ''} [Certainty: ${k.certainty || 'certain'}]`,
                  }
                ],
                primaryChapterId: fc.chapter.id,
                secondaryChapterId: learnedChapter.chapter.id,
                entityId: char.id,
                entityType: 'character',
                suggestedAction: {
                  label: `Adjust Learned Location for "${char.name}"`,
                  actionType: 'navigate-codex',
                  payload: { characterId: char.id, tab: 'knowledge' },
                },
                createdAt: new Date().toISOString(),
              });
            }
          }
        });
      });
    });

    return warnings;
  }

  // =========================================================================
  // 2. CHECK: Character State
  // A character marked dead/unavailable appears unexpectedly.
  // =========================================================================
  static checkCharacterState(project: ProjectData, flatChapters: FlatChapterInfo[]): ContinuityWarning[] {
    const warnings: ContinuityWarning[] = [];
    const characters = project.characters || [];

    characters.forEach(char => {
      const rawState = typeof char.currentState === 'string'
        ? char.currentState
        : (char.currentState?.status || char.currentState?.emotionalState || char.currentState?.physicalState || '');
      const stateStr = (rawState || '').toLowerCase().trim();
      if (!stateStr) return;

      const isDead = /dead|deceased|killed|slain|perished/i.test(stateStr);
      const isIncapacitated = /imprisoned|captured|jailed|exiled|comatose|unconscious/i.test(stateStr);

      if (!isDead && !isIncapacitated) return;

      // Extract if state specifies an origin chapter, e.g. "Dead (Ch 4)", "Killed in Chapter 3"
      const originMatch = stateStr.match(/(?:in|from|after|at|chapter|ch\.?)\s*(\d+)/i);
      const deathChapterNum = originMatch ? parseInt(originMatch[1], 10) : 0;

      flatChapters.forEach(fc => {
        // If state specifies a chapter, only flag chapters AFTER that chapter
        if (deathChapterNum > 0 && fc.index <= deathChapterNum) return;

        // Check if character appears as POV or explicitly listed scene participant
        const isPov = fc.chapter.povCharacterId === char.id;
        const matchingScenes = fc.scenes.filter(s => 
          s.povCharacterId === char.id || (s.characterIds || []).includes(char.id)
        );

        if (isPov || matchingScenes.length > 0) {
          const stateLabel = isDead ? 'Deceased' : 'Incapacitated / Exiled';
          const warningId = `warn-state-${char.id}-${fc.chapter.id}`;
          
          warnings.push({
            id: warningId,
            type: 'state',
            severity: isDead ? 'critical' : 'warning',
            title: `Unavailable Character Appearance: ${char.name}`,
            summary: `${char.name} is marked as "${char.currentState}" but appears in Chapter ${fc.index}.`,
            description: `${char.name} has story state "${char.currentState}" (${stateLabel}), but is assigned as ${isPov ? 'POV Character' : 'Active Scene Participant'} in Chapter ${fc.index}: ${fc.chapter.title}.`,
            evidence: [
              {
                label: `Current Story State`,
                entityId: char.id,
                entityType: 'character',
                details: `Character State recorded as: "${char.currentState}" in Character Bible.`,
              },
              {
                label: `Unexpected Appearance: Chapter ${fc.index}`,
                chapterId: fc.chapter.id,
                chapterNumber: fc.index,
                chapterTitle: fc.chapter.title,
                sceneId: matchingScenes[0]?.id,
                sceneTitle: matchingScenes[0]?.title,
                details: `${char.name} participates in Chapter ${fc.index}${matchingScenes.length > 0 ? ` (${matchingScenes.map(s => s.title).join(', ')})` : ''}.`,
              }
            ],
            primaryChapterId: fc.chapter.id,
            entityId: char.id,
            entityType: 'character',
            suggestedAction: {
              label: `Update State for ${char.name}`,
              actionType: 'navigate-codex',
              payload: { characterId: char.id, tab: 'state' },
            },
            createdAt: new Date().toISOString(),
          });
        }
      });
    });

    return warnings;
  }

  // =========================================================================
  // 3. CHECK: Timeline Chronology
  // Events occur in impossible chronological order or causality inversion.
  // =========================================================================
  static checkTimelineChronology(project: ProjectData, flatChapters: FlatChapterInfo[]): ContinuityWarning[] {
    const warnings: ContinuityWarning[] = [];
    const events = project.events || [];

    // Map events to chapter indexes where they occur
    const eventChapterMap = new Map<string, FlatChapterInfo>();

    events.forEach(evt => {
      let matchedChapter: FlatChapterInfo | null = null;
      if (evt.chapterId) {
        matchedChapter = flatChapters.find(fc => fc.chapter.id === evt.chapterId) || null;
      } else if (evt.sceneId) {
        matchedChapter = flatChapters.find(fc => fc.scenes.some(s => s.id === evt.sceneId)) || null;
      }
      if (matchedChapter) {
        eventChapterMap.set(evt.id, matchedChapter);
      }
    });

    // Check causality: Event B caused by Event A
    events.forEach(evtB => {
      if (!evtB.causedByEventId) return;
      const evtA = events.find(e => e.id === evtB.causedByEventId);
      if (!evtA) return;

      const chB = eventChapterMap.get(evtB.id);
      const chA = eventChapterMap.get(evtA.id);

      // If both events are placed in chapters and Effect (B) appears strictly BEFORE Cause (A)
      if (chA && chB && chB.index < chA.index) {
        const warningId = `warn-timeline-causality-${evtA.id}-${evtB.id}`;
        warnings.push({
          id: warningId,
          type: 'timeline',
          severity: 'critical',
          title: `Causality Inversion: ${evtB.title}`,
          summary: `Event "${evtB.title}" occurs in Chapter ${chB.index} before its cause "${evtA.title}" in Chapter ${chA.index}.`,
          description: `Event "${evtB.title}" has a causal dependency on "${evtA.title}" (causedByEventId), but is placed earlier in narrative sequence without a non-linear timeline tag.`,
          evidence: [
            {
              label: `Effect: Chapter ${chB.index}`,
              chapterId: chB.chapter.id,
              chapterNumber: chB.index,
              chapterTitle: chB.chapter.title,
              entityId: evtB.id,
              entityType: 'event',
              details: `Event "${evtB.title}" occurs here.`,
            },
            {
              label: `Prerequisite Cause: Chapter ${chA.index}`,
              chapterId: chA.chapter.id,
              chapterNumber: chA.index,
              chapterTitle: chA.chapter.title,
              entityId: evtA.id,
              entityType: 'event',
              details: `Event "${evtA.title}" occurs here.`,
            }
          ],
          primaryChapterId: chB.chapter.id,
          secondaryChapterId: chA.chapter.id,
          entityId: evtB.id,
          entityType: 'event',
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Check numerical timestamp progression if timelineDate contains parseable years or days
    let prevDateVal: number | null = null;
    let prevChapterInfo: FlatChapterInfo | null = null;

    flatChapters.forEach(fc => {
      fc.scenes.forEach(sc => {
        if (!sc.timelineDate) return;
        // Parse simple numbers or ISO years if present
        const yearMatch = sc.timelineDate.match(/(?:year\s*|day\s*|yr\s*)?(\d{1,6})/i);
        if (yearMatch) {
          const currentVal = parseInt(yearMatch[1], 10);
          // Check if explicit regress occurs without tags like flashback / memory
          const isFlashback = (sc.tags || []).some(t => /flashback|memory|prologue|history/i.test(t));
          if (prevDateVal !== null && currentVal < prevDateVal && !isFlashback && prevChapterInfo && prevChapterInfo.index !== fc.index) {
            const warningId = `warn-timeline-date-${sc.id}-${prevChapterInfo.chapter.id}`;
            warnings.push({
              id: warningId,
              type: 'timeline',
              severity: 'warning',
              title: `Chronological Regression: ${sc.title}`,
              summary: `Scene timestamp "${sc.timelineDate}" in Chapter ${fc.index} regresses from "${prevDateVal}" in Chapter ${prevChapterInfo.index}.`,
              description: `Scene "${sc.title}" has chronological date "${sc.timelineDate}", which precedes the earlier chapter timestamp without being marked as a flashback or memory.`,
              evidence: [
                {
                  label: `Preceding Timestamp: Chapter ${prevChapterInfo.index}`,
                  chapterId: prevChapterInfo.chapter.id,
                  chapterNumber: prevChapterInfo.index,
                  chapterTitle: prevChapterInfo.chapter.title,
                  details: `Timestamp: ${prevDateVal}`,
                },
                {
                  label: `Regressed Timestamp: Chapter ${fc.index}`,
                  chapterId: fc.chapter.id,
                  chapterNumber: fc.index,
                  chapterTitle: fc.chapter.title,
                  sceneId: sc.id,
                  sceneTitle: sc.title,
                  details: `Timestamp: "${sc.timelineDate}" (regressed from ${prevDateVal})`,
                }
              ],
              primaryChapterId: fc.chapter.id,
              secondaryChapterId: prevChapterInfo.chapter.id,
              entityId: sc.id,
              entityType: 'scene',
              createdAt: new Date().toISOString(),
            });
          }
          prevDateVal = currentVal;
          prevChapterInfo = fc;
        }
      });
    });

    return warnings;
  }

  // =========================================================================
  // 4. CHECK: Location / Spatial Continuity
  // A character appears in incompatible locations simultaneously or without transit.
  // =========================================================================
  static checkLocationContinuity(project: ProjectData, flatChapters: FlatChapterInfo[]): ContinuityWarning[] {
    const warnings: ContinuityWarning[] = [];
    const locations = project.locations || [];
    const characters = project.characters || [];

    const locMap = new Map<string, Location>(locations.map(l => [l.id, l]));

    characters.forEach(char => {
      flatChapters.forEach(fc => {
        const charScenes = fc.scenes.filter(s => 
          (s.povCharacterId === char.id || (s.characterIds || []).includes(char.id)) &&
          s.locationIds && s.locationIds.length > 0
        );

        if (charScenes.length >= 2) {
          for (let i = 0; i < charScenes.length - 1; i++) {
            const s1 = charScenes[i];
            const s2 = charScenes[i + 1];

            const loc1Id = s1.locationIds![0];
            const loc2Id = s2.locationIds![0];

            if (loc1Id && loc2Id && loc1Id !== loc2Id) {
              const loc1 = locMap.get(loc1Id);
              const loc2 = locMap.get(loc2Id);

              // Check if parent-child hierarchy exists (e.g. Throne Room in Royal Palace)
              const isChild = loc1?.parentLocationId === loc2Id || loc2?.parentLocationId === loc1Id;
              const isTransitScene = /travel|journey|flight|portal|transit|voyage|carriage/i.test(s2.title + ' ' + (s2.purpose || ''));

              if (!isChild && !isTransitScene && loc1 && loc2 && loc1.type === 'region' && loc2.type === 'region') {
                const warningId = `warn-location-${char.id}-${fc.chapter.id}-${s1.id}-${s2.id}`;
                warnings.push({
                  id: warningId,
                  type: 'location',
                  severity: 'warning',
                  title: `Spatial Teleportation: ${char.name}`,
                  summary: `${char.name} moves between distinct regions "${loc1.name}" and "${loc2.name}" in Chapter ${fc.index} without transit.`,
                  description: `${char.name} appears in Scene "${s1.title}" (${loc1.name}) and immediately in Scene "${s2.title}" (${loc2.name}) in the same chapter without a transition or journey scene.`,
                  evidence: [
                    {
                      label: `Scene 1: ${s1.title}`,
                      chapterId: fc.chapter.id,
                      chapterNumber: fc.index,
                      chapterTitle: fc.chapter.title,
                      sceneId: s1.id,
                      sceneTitle: s1.title,
                      details: `Location: ${loc1.name} (${loc1.type || 'Location'})`,
                    },
                    {
                      label: `Scene 2: ${s2.title}`,
                      chapterId: fc.chapter.id,
                      chapterNumber: fc.index,
                      chapterTitle: fc.chapter.title,
                      sceneId: s2.id,
                      sceneTitle: s2.title,
                      details: `Location: ${loc2.name} (${loc2.type || 'Location'})`,
                    }
                  ],
                  primaryChapterId: fc.chapter.id,
                  entityId: char.id,
                  entityType: 'character',
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
        }
      });
    });

    return warnings;
  }

  // =========================================================================
  // 5. CHECK: Character Attributes & Structured Conflict
  // Structured attributes conflict between story records / relationships.
  // =========================================================================
  static checkCharacterAttributes(project: ProjectData, flatChapters: FlatChapterInfo[]): ContinuityWarning[] {
    const warnings: ContinuityWarning[] = [];
    const characters = project.characters || [];
    const codex = project.codex || [];
    const factions = project.factions || [];

    // 1. Check Character vs CodexEntry attribute divergence
    characters.forEach(char => {
      const matchingCodex = codex.find(c => c.id === char.id || c.name.toLowerCase() === char.name.toLowerCase());
      if (matchingCodex) {
        // Mismatch in role classification
        if (matchingCodex.role && char.role && matchingCodex.role.toLowerCase() !== char.role.toLowerCase()) {
          const warningId = `warn-attr-role-${char.id}`;
          warnings.push({
            id: warningId,
            type: 'attributes',
            severity: 'notice',
            title: `Role Mismatch: ${char.name}`,
            summary: `Character Bible lists role as "${char.role}", but World Codex lists "${matchingCodex.role}".`,
            description: `The structured Character entity has role "${char.role}", while the World Codex dossier for "${char.name}" has role "${matchingCodex.role}".`,
            evidence: [
              {
                label: `Character Bible`,
                entityId: char.id,
                entityType: 'character',
                details: `Role: ${char.role}`,
              },
              {
                label: `World Codex Entry`,
                entityId: matchingCodex.id,
                details: `Role: ${matchingCodex.role}`,
              }
            ],
            entityId: char.id,
            entityType: 'character',
            suggestedAction: {
              label: `Sync Role to "${char.role}"`,
              actionType: 'navigate-codex',
              payload: { characterId: char.id },
            },
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    // 2. Check Reciprocal Relationship Polarization Contradiction
    characters.forEach(charA => {
      (charA.relationships || []).forEach(relA => {
        const charB = characters.find(c => c.id === relA.targetId || c.name.toLowerCase() === (relA.targetName || '').toLowerCase());
        if (!charB) return;

        const relB = (charB.relationships || []).find(r => r.targetId === charA.id || r.targetName?.toLowerCase() === charA.name.toLowerCase());
        if (!relB) return;

        const isHostileA = /enemy|rival|nemesis|hostile|hated|betrayer/i.test(relA.relation + ' ' + (relA.currentState || ''));
        const isFriendlyA = /allied|mentor|friend|lover|spouse|devoted|family/i.test(relA.relation + ' ' + (relA.currentState || ''));

        const isHostileB = /enemy|rival|nemesis|hostile|hated|betrayer/i.test(relB.relation + ' ' + (relB.currentState || ''));
        const isFriendlyB = /allied|mentor|friend|lover|spouse|devoted|family/i.test(relB.relation + ' ' + (relB.currentState || ''));

        // If one character considers the other a sworn hostile enemy while the other considers them a close ally
        if ((isHostileA && isFriendlyB) || (isFriendlyA && isHostileB)) {
          const warningId = `warn-rel-polarization-${charA.id}-${charB.id}`;
          warnings.push({
            id: warningId,
            type: 'attributes',
            severity: 'notice',
            title: `Relationship Asymmetry: ${charA.name} ↔ ${charB.name}`,
            summary: `${charA.name} views ${charB.name} as "${relA.relation}" (${relA.currentState || 'active'}), while ${charB.name} views ${charA.name} as "${relB.relation}" (${relB.currentState || 'active'}).`,
            description: `A significant emotional asymmetry exists between ${charA.name} and ${charB.name}. If intentional (e.g. secret betrayal or one-sided affection), mark as intentional.`,
            evidence: [
              {
                label: `${charA.name}'s Perspective`,
                entityId: charA.id,
                entityType: 'character',
                details: `Relation: "${relA.relation}" | State: "${relA.currentState || 'Unspecified'}"`,
              },
              {
                label: `${charB.name}'s Perspective`,
                entityId: charB.id,
                entityType: 'character',
                details: `Relation: "${relB.relation}" | State: "${relB.currentState || 'Unspecified'}"`,
              }
            ],
            entityId: charA.id,
            entityType: 'character',
            createdAt: new Date().toISOString(),
          });
        }
      });
    });

    // 3. Faction Rivalry Conflict (Character belongs to rival factions simultaneously)
    characters.forEach(char => {
      const charFactionIds = char.factionIds || [];
      if (charFactionIds.length >= 2) {
        for (let i = 0; i < charFactionIds.length; i++) {
          for (let j = i + 1; j < charFactionIds.length; j++) {
            const f1 = factions.find(f => f.id === charFactionIds[i]);
            const f2 = factions.find(f => f.id === charFactionIds[j]);
            if (f1 && f2) {
              const areRivals = (f1.rivalFactionIds || []).includes(f2.id) || (f2.rivalFactionIds || []).includes(f1.id);
              if (areRivals) {
                const warningId = `warn-faction-rival-${char.id}-${f1.id}-${f2.id}`;
                warnings.push({
                  id: warningId,
                  type: 'attributes',
                  severity: 'warning',
                  title: `Rival Faction Allegiance: ${char.name}`,
                  summary: `${char.name} is a member of rival factions "${f1.name}" and "${f2.name}".`,
                  description: `${char.name} is listed as a member of both "${f1.name}" and "${f2.name}", which are registered as hostile rival factions.`,
                  evidence: [
                    {
                      label: `Faction 1: ${f1.name}`,
                      entityId: f1.id,
                      entityType: 'faction',
                      details: `Type: ${f1.type || 'Faction'} | Rivals with: ${f2.name}`,
                    },
                    {
                      label: `Faction 2: ${f2.name}`,
                      entityId: f2.id,
                      entityType: 'faction',
                      details: `Type: ${f2.type || 'Faction'} | Rivals with: ${f1.name}`,
                    }
                  ],
                  entityId: char.id,
                  entityType: 'character',
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
        }
      }
    });

    return warnings;
  }

  // =========================================================================
  // 6. CHECK: Plot Thread Dormancy
  // Important active threads have not been touched for a configurable number of chapters.
  // =========================================================================
  static checkPlotThreadDormancy(
    project: ProjectData, 
    flatChapters: FlatChapterInfo[], 
    threshold: number = 3
  ): ContinuityWarning[] {
    const warnings: ContinuityWarning[] = [];
    const threads = project.plotThreads || [];
    const totalChapters = flatChapters.length;

    if (totalChapters <= threshold) {
      return warnings; // Not enough manuscript length to flag dormancy
    }

    threads.forEach(thread => {
      // Only check active / high priority threads
      const isActive = thread.status === 'active' || thread.status === 'in-progress' || thread.status === 'climax' || thread.status === 'setup';
      if (!isActive) return;

      // Find latest chapter touchpoint
      let latestChapterIndex = 0;
      let latestChapterInfo: FlatChapterInfo | null = null;

      flatChapters.forEach(fc => {
        const isLinkedToChapter = (fc.chapter.plotThreadIds || []).includes(thread.id);
        const isLinkedToScene = fc.scenes.some(s => (s.plotThreadIds || []).includes(thread.id));
        const isExplicitLastTouch = thread.lastTouchedIn === fc.chapter.id;

        if (isLinkedToChapter || isLinkedToScene || isExplicitLastTouch) {
          if (fc.index > latestChapterIndex) {
            latestChapterIndex = fc.index;
            latestChapterInfo = fc;
          }
        }
      });

      // If never touched, check introducedIn
      if (latestChapterIndex === 0 && thread.introducedIn) {
        const introCh = resolveChapterReference(thread.introducedIn, flatChapters);
        if (introCh) {
          latestChapterIndex = introCh.index;
          latestChapterInfo = introCh;
        }
      }

      // If thread has an established start point and has been dormant for > threshold chapters
      if (latestChapterIndex > 0) {
        const gap = totalChapters - latestChapterIndex;
        if (gap >= threshold) {
          const isHighPriority = thread.priority === 'critical' || thread.priority === 'high' || thread.type === 'main-plot';
          const warningId = `warn-thread-dormant-${thread.id}`;

          warnings.push({
            id: warningId,
            type: 'thread-dormancy',
            severity: isHighPriority ? 'warning' : 'notice',
            title: `Dormant Plot Thread: ${thread.title}`,
            summary: `"${thread.title}" was last touched in Chapter ${latestChapterIndex} (${gap} chapters ago).`,
            description: `Active plot thread "${thread.title}" (${thread.type}) has not progressed for ${gap} consecutive chapters (Configured threshold: ${threshold} chapters).`,
            evidence: [
              {
                label: `Last Progress: Chapter ${latestChapterIndex}`,
                chapterId: latestChapterInfo?.chapter.id,
                chapterNumber: latestChapterIndex,
                chapterTitle: latestChapterInfo?.chapter.title,
                details: `Thread was active here in Chapter ${latestChapterIndex}: ${latestChapterInfo?.chapter.title}.`,
              },
              {
                label: `Current Story Frontier`,
                chapterId: flatChapters[flatChapters.length - 1]?.chapter.id,
                chapterNumber: totalChapters,
                chapterTitle: flatChapters[flatChapters.length - 1]?.chapter.title,
                details: `Manuscript has advanced to Chapter ${totalChapters} without a touchpoint.`,
              }
            ],
            primaryChapterId: latestChapterInfo?.chapter.id,
            secondaryChapterId: flatChapters[flatChapters.length - 1]?.chapter.id,
            entityId: thread.id,
            entityType: 'plotThread',
            suggestedAction: {
              label: `Open Thread Matrix`,
              actionType: 'navigate-thread',
              payload: { threadId: thread.id },
            },
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    return warnings;
  }
}
