import { 
  ProjectData, Character, Location, Faction, Item, 
  Event, StoryArc, PlotThread, ResearchNote, Scene, Chapter, Act 
} from '../types';

/**
 * Conservative Story Engine Migration
 * Guarantees every project (new, legacy, or imported from Obsidian) has a fully
 * populated, relational domain state without altering or losing any existing content.
 */
export function migrateProjectToStoryEngine(project: ProjectData): ProjectData {
  if (!project) return project;

  const migrated: ProjectData = {
    ...project,
    metadata: {
      ...project.metadata,
      revisionSnapshots: project.metadata?.revisionSnapshots || [],
    },
    acts: project.acts || [],
    characters: project.characters || [],
    locations: project.locations || [],
    factions: project.factions || [],
    items: project.items || [],
    events: project.events || [],
    storyArcs: project.storyArcs || [],
    plotThreads: project.plotThreads || [],
    researchNotes: project.researchNotes || [],
    codex: project.codex || [],
    cutScenes: project.cutScenes || [],
    timeline: project.timeline || [],
    annotations: project.annotations || [],
    partnerMessages: project.partnerMessages || [],
    scratchpad: project.scratchpad || '',
    revisionRounds: project.revisionRounds || [],
    revisionItems: project.revisionItems || [],
    snapshots: project.snapshots || [],
  };

  // 1. Ensure Character entities have all structured fields
  migrated.characters = migrated.characters.map(c => {
    return {
      ...c,
      goals: Array.isArray(c.goals) ? c.goals : (c.motivations ? [c.motivations] : []),
      beliefs: Array.isArray(c.beliefs) ? c.beliefs : [],
      knowledgeList: Array.isArray(c.knowledgeList) 
        ? c.knowledgeList 
        : (Array.isArray(c.knowledge) 
            ? c.knowledge.map((k, idx) => ({ id: `know-${idx + 1}`, statement: k, information: k, certainty: 'certain' as const, status: 'known' as const })) 
            : []),
      knowledge: Array.isArray(c.knowledge) ? c.knowledge : [],
      secrets: Array.isArray(c.secrets) 
        ? c.secrets 
        : (c.secrets !== undefined ? c.secrets : []),
      stateCheckpoints: Array.isArray(c.stateCheckpoints) ? c.stateCheckpoints : [],
      relationships: Array.isArray(c.relationships) 
        ? c.relationships.map(r => ({
            targetId: r.targetId,
            relation: r.relation || 'Associate',
            targetName: r.targetName,
            currentState: r.currentState || 'Active',
            trustLevel: r.trustLevel || 'moderate',
            notes: r.notes || '',
            history: r.history || '',
            dynamicDescription: r.dynamicDescription,
            strength: typeof r.strength === 'number' ? r.strength : 0,
            milestones: Array.isArray(r.milestones) ? r.milestones : []
          }))
        : [],
      currentState: c.currentState !== undefined ? c.currentState : { status: 'active' },
      appearances: Array.isArray(c.appearances) ? c.appearances : [],
      factionIds: Array.isArray(c.factionIds) ? c.factionIds : [],
      itemIds: Array.isArray(c.itemIds) ? c.itemIds : [],
      tags: Array.isArray(c.tags) ? c.tags : [],
    };
  });

  // 2. Migrate Codex Entries to First-Class Domain Entities if collections are empty
  if (migrated.codex && migrated.codex.length > 0) {
    const existingLocIds = new Set((migrated.locations || []).map(l => l.id));
    const existingFactionIds = new Set((migrated.factions || []).map(f => f.id));
    const existingItemIds = new Set((migrated.items || []).map(i => i.id));
    const existingResearchIds = new Set((migrated.researchNotes || []).map(r => r.id));

    migrated.codex.forEach(entry => {
      // Locations
      if (entry.category === 'location' && !existingLocIds.has(entry.id)) {
        migrated.locations!.push({
          id: entry.id,
          name: entry.name,
          aliases: entry.aliases || [],
          type: 'building',
          summary: entry.summary || '',
          description: entry.content || '',
          sensoryDetails: {},
          sceneAppearances: [],
          tags: entry.tags || ['location'],
          color: entry.color || '#10B981',
          updatedAt: entry.updatedAt || new Date().toISOString()
        });
        existingLocIds.add(entry.id);
      }

      // Factions
      if (entry.category === 'faction' && !existingFactionIds.has(entry.id)) {
        migrated.factions!.push({
          id: entry.id,
          name: entry.name,
          aliases: entry.aliases || [],
          type: 'guild',
          summary: entry.summary || '',
          description: entry.content || '',
          goals: [],
          sceneAppearances: [],
          tags: entry.tags || ['faction'],
          color: entry.color || '#F59E0B',
          updatedAt: entry.updatedAt || new Date().toISOString()
        });
        existingFactionIds.add(entry.id);
      }

      // Items
      if (entry.category === 'item' && !existingItemIds.has(entry.id)) {
        migrated.items!.push({
          id: entry.id,
          name: entry.name,
          aliases: entry.aliases || [],
          type: 'artifact',
          summary: entry.summary || '',
          description: entry.content || '',
          sceneAppearances: [],
          plotThreadIds: [],
          tags: entry.tags || ['item'],
          color: entry.color || '#F43F5E',
          updatedAt: entry.updatedAt || new Date().toISOString()
        });
        existingItemIds.add(entry.id);
      }

      // Lore & Research
      if (entry.category === 'lore' && !existingResearchIds.has(entry.id)) {
        migrated.researchNotes!.push({
          id: entry.id,
          title: entry.name,
          category: 'mythology',
          summary: entry.summary || '',
          content: entry.content || '',
          sources: [],
          relatedEntityIds: [],
          tags: entry.tags || ['lore'],
          updatedAt: entry.updatedAt || new Date().toISOString()
        });
        existingResearchIds.add(entry.id);
      }
    });
  }

  // 3. Migrate Timeline StoryBeats to Events if events are empty
  if (migrated.timeline && migrated.timeline.length > 0 && migrated.events!.length === 0) {
    migrated.timeline.forEach((beat, idx) => {
      migrated.events!.push({
        id: `event-${beat.id || idx + 1}`,
        title: beat.title,
        summary: beat.description || '',
        description: beat.description || '',
        order: idx + 1,
        type: 'scene-event',
        chapterId: beat.targetChapterId,
        sceneId: beat.targetSceneId || (beat.targetChapterId ? `scene-${beat.targetChapterId}` : undefined),
        tensionLevel: beat.tensionLevel || 5,
        tags: [beat.beatType ? beat.beatType.toLowerCase() : 'beat']
      });
    });
  }

  // 4. Ensure Default StoryArc if empty
  if (migrated.storyArcs!.length === 0) {
    migrated.storyArcs!.push({
      id: 'arc-main-spine',
      title: 'Main Narrative Spine',
      description: 'The primary dramatic spine of the manuscript.',
      type: 'overarching',
      actIds: migrated.acts.map(a => a.id),
      characterIds: migrated.characters.map(c => c.id),
      plotThreadIds: [],
      sceneIds: [],
      status: 'in-progress',
      updatedAt: new Date().toISOString()
    });
  }

  // 5. Ensure Chapter Scenes & Relational Linkage
  migrated.acts.forEach(act => {
    act.chapters.forEach(ch => {
      // If chapter doesn't have scenes array, initialize 1-to-1 default Scene
      if (!ch.scenes || ch.scenes.length === 0) {
        const defaultSceneId = `scene-${ch.id}`;
        
        // Find mentioned characters
        const matchedCharIds: string[] = [];
        if (ch.povCharacterId) matchedCharIds.push(ch.povCharacterId);
        
        migrated.characters.forEach(c => {
          if (!matchedCharIds.includes(c.id)) {
            const regex = new RegExp(`\\b${c.name}\\b`, 'i');
            if (ch.content && (regex.test(ch.content) || (ch.wikilinks && ch.wikilinks.includes(c.name)))) {
              matchedCharIds.push(c.id);
            }
          }
        });

        // Find mentioned locations
        const matchedLocIds: string[] = [];
        migrated.locations!.forEach(loc => {
          const regex = new RegExp(`\\b${loc.name}\\b`, 'i');
          if (ch.content && (regex.test(ch.content) || (ch.wikilinks && ch.wikilinks.includes(loc.name)))) {
            matchedLocIds.push(loc.id);
          }
        });

        const defaultScene: Scene = {
          id: defaultSceneId,
          title: ch.title,
          chapterId: ch.id,
          actId: act.id,
          order: 1,
          content: ch.content,
          wordCount: ch.wordCount,
          targetWordCount: ch.targetWordCount,
          povCharacterId: ch.povCharacterId,
          characterIds: matchedCharIds,
          locationIds: matchedLocIds,
          plotThreadIds: ch.plotThreadIds || [],
          eventIds: [],
          storyArcIds: act.storyArcIds || ['arc-main-spine'],
          purpose: ch.synopsis || 'Primary scene beat.',
          conflict: '',
          goal: '',
          outcome: '',
          consequence: '',
          tensionLevel: 5,
          status: ch.status || 'draft',
          synopsis: ch.synopsis,
          tags: ch.tags || [],
          updatedAt: ch.updatedAt || new Date().toISOString()
        };

        ch.scenes = [defaultScene];
      }

      // Update chapter relational IDs from its scenes
      const chCharIds = new Set<string>(ch.characterIds || []);
      const chLocIds = new Set<string>(ch.locationIds || []);
      const chThreadIds = new Set<string>(ch.plotThreadIds || []);

      ch.scenes.forEach(sc => {
        if (sc.povCharacterId) chCharIds.add(sc.povCharacterId);
        (sc.characterIds || []).forEach(id => chCharIds.add(id));
        (sc.locationIds || []).forEach(id => chLocIds.add(id));
        (sc.plotThreadIds || []).forEach(id => chThreadIds.add(id));

        // Update character appearances
        (sc.characterIds || []).forEach(charId => {
          const char = migrated.characters.find(c => c.id === charId);
          if (char) {
            char.appearances = char.appearances || [];
            if (!char.appearances.includes(sc.id) && !char.appearances.includes(ch.id)) {
              char.appearances.push(sc.id);
            }
          }
        });

        // Update location appearances
        (sc.locationIds || []).forEach(locId => {
          const loc = (migrated.locations || []).find(l => l.id === locId);
          if (loc) {
            if (!loc.sceneAppearances) loc.sceneAppearances = [];
            if (!loc.sceneAppearances.includes(sc.id)) {
              loc.sceneAppearances.push(sc.id);
            }
          }
        });
      });

      ch.characterIds = Array.from(chCharIds);
      ch.locationIds = Array.from(chLocIds);
      ch.plotThreadIds = Array.from(chThreadIds);
    });
  });

  return migrated;
}
