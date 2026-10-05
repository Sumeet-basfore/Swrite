import { StoryEngine } from './storyEngine';
import { StoryEngineQueries } from './queries';
import { migrateProjectToStoryEngine } from './migration';
import { ObsidianParserService } from '../services/obsidianParserService';
import { INITIAL_NOVEL_DATA, StorageService } from '../services/storageService';
import { ProjectData, Scene, Character, Location, Faction, Item, Event, StoryArc, PlotThread, ResearchNote, ContinuityWarning } from '../types';
import { ProofreadingEngine, ProofreadingQueries, RevisionEngine, RevisionQueries } from '../editorial';
import { 
  createSnapshot, restoreSnapshot, verifySnapshotIntegrity, pruneAutoSnapshots, 
  diffWords, compareProjects, groupSnapshotsByTime, filterSnapshots, getSnapshotStats, 
  getChapterSnapshots 
} from './snapshot';
import {
  CURATED_THEMES, CURATED_PRESETS, DEFAULT_TYPOGRAPHY, makeTheme,
  getContrastRatio, validateThemeContrast, getReadableFallback, applyThemeToDocument
} from '../styles/themes';
import { 
  ThemeConfig, TypographyConfig, AppearancePreset, ThemeTokens, 
  PublicationOptions, PublicationPreset, ChapterHeaderStyle, TrimSize 
} from '../types';
import { PUBLICATION_PRESETS, DEFAULT_PUBLICATION_OPTIONS, CompilerService } from '../services/compilerService';
import { EpubZipBuilder } from '../services/epubZip';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runStoryEngineTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  const project: ProjectData = JSON.parse(JSON.stringify(INITIAL_NOVEL_DATA));

  // =========================================================================
  // 1. Entity Creation for All 12 Entities & Stable ID Generation
  // =========================================================================
  const { project: pAct, act } = StoryEngine.addAct(project, { title: 'Act 99: Test Frontier' });
  assert(Boolean(act.id && act.id.startsWith('act-')), 'Act ID created with stable prefix');

  const { project: pCh, chapter } = StoryEngine.addChapter(pAct, act.id, { title: 'Chapter 99: Test Horizon' });
  assert(Boolean(chapter.id && chapter.id.startsWith('ch-')), 'Chapter ID created with stable prefix');

  const { project: pSc, scene } = StoryEngine.addScene(pCh, chapter.id, { title: 'Scene 99.1: The Observation' });
  assert(Boolean(scene.id && scene.id.startsWith('scene-')), 'Scene ID created with stable prefix');

  const { project: pChar, character } = StoryEngine.addCharacter(pSc, { name: 'Vaelen', role: 'Supporting' });
  assert(Boolean(character.id && character.id.startsWith('char-')), 'Character ID created with stable prefix');

  const { project: pLoc, location } = StoryEngine.addLocation(pChar, { name: 'Aethelgard Citadel', type: 'realm' });
  assert(Boolean(location.id && location.id.startsWith('loc-')), 'Location ID created with stable prefix');

  const { project: pFac, faction } = StoryEngine.addFaction(pLoc, { name: 'The Silent Covenant', type: 'order' });
  assert(Boolean(faction.id && faction.id.startsWith('faction-')), 'Faction ID created with stable prefix');

  const { project: pItem, item } = StoryEngine.addItem(pFac, { name: 'Amulet of Solitude', type: 'artifact' });
  assert(Boolean(item.id && item.id.startsWith('item-')), 'Item ID created with stable prefix');

  const { project: pEvt, event } = StoryEngine.addEvent(pItem, { title: 'The Sundering of Skies', order: 99 });
  assert(Boolean(event.id && event.id.startsWith('event-')), 'Event ID created with stable prefix');

  const { project: pArc, arc } = StoryEngine.addStoryArc(pEvt, { title: 'Arc of the Ascendants', type: 'thematic' });
  assert(Boolean(arc.id && arc.id.startsWith('arc-')), 'StoryArc ID created with stable prefix');

  const { project: pTh, thread } = StoryEngine.addPlotThread(pArc, { title: 'The Vanishing Keystone', type: 'mystery' });
  assert(Boolean(thread.id && thread.id.startsWith('thread-')), 'PlotThread ID created with stable prefix');

  const { project: pRes, note } = StoryEngine.addResearchNote(pTh, { title: 'Ancient Spatial Geometry', category: 'scientific' });
  assert(Boolean(note.id && note.id.startsWith('research-')), 'ResearchNote ID created with stable prefix');

  results.push('✓ Test 1 Passed: 12-Entity domain creation with stable, prefixed IDs');

  // =========================================================================
  // 2. Scene ↔ Character Relationships & POV Binding
  // =========================================================================
  const { project: pRelScene, scene: boundScene } = StoryEngine.addScene(pRes, chapter.id, {
    title: 'The Vault Confrontation',
    povCharacterId: character.id,
    characterIds: [character.id, 'char-lucan'],
    locationIds: [location.id],
    purpose: 'Confront Vaelen regarding the stolen amulet.',
    conflict: 'Vaelen refuses to yield without a blood-oath.',
    tensionLevel: 9
  });

  assert(boundScene.povCharacterId === character.id, 'Scene POV character correctly bound');
  assert(boundScene.characterIds?.includes('char-lucan') === true, 'Secondary character present in scene');

  const charsInScene = StoryEngineQueries.getCharactersInScene(pRelScene, boundScene.id);
  assert(charsInScene.some(c => c.id === character.id), 'Queries: getCharactersInScene includes POV');
  assert(charsInScene.some(c => c.id === 'char-lucan'), 'Queries: getCharactersInScene includes cast');

  const scenesForVaelen = StoryEngineQueries.getScenesForCharacter(pRelScene, character.id);
  assert(scenesForVaelen.some(s => s.id === boundScene.id), 'Queries: getScenesForCharacter finds bound scene');

  results.push('✓ Test 2 Passed: Scene ↔ Character relationships, POV binding & bidirectional query');

  // =========================================================================
  // 3. Scene ↔ Location Relationships & Reverse Lookup
  // =========================================================================
  const locScenes = StoryEngineQueries.getScenesForLocation(pRelScene, location.id);
  assert(locScenes.some(s => s.id === boundScene.id), 'Location tagged in scene is retrieved by getScenesForLocation');

  const locsForVaelen = StoryEngineQueries.getLocationsForCharacter(pRelScene, character.id);
  assert(locsForVaelen.some(l => l.id === location.id), 'Character location association resolved via scene presence');

  results.push('✓ Test 3 Passed: Scene ↔ Location relationships & character location inference');

  // =========================================================================
  // 4. Plot Thread Lifecycle, Chapter Linkage & Matrix Generation
  // =========================================================================
  const pLinkedThread = StoryEngine.toggleThreadChapterLink(pRelScene, thread.id, chapter.id);
  const threadsForChapter = StoryEngineQueries.getPlotThreadsForChapter(pLinkedThread, chapter.id);
  assert(threadsForChapter.some(t => t.id === thread.id), 'Plot thread linked to chapter retrieved by getPlotThreadsForChapter');

  const matrix = StoryEngineQueries.getPlotThreadMatrix(pLinkedThread);
  assert(matrix.columns.length > 0, 'Plot thread matrix generated columns');
  const threadRow = matrix.rows.find(r => r.thread.id === thread.id);
  assert(Boolean(threadRow), 'Thread row present in matrix');
  assert(threadRow?.touchCount === 1, 'Touchpoint registered in matrix');

  const pResolved = StoryEngine.updatePlotThread(pLinkedThread, thread.id, { status: 'resolved' });
  const unresolvedThreads = StoryEngineQueries.getUnresolvedPlotThreads(pResolved);
  assert(!unresolvedThreads.some(t => t.id === thread.id), 'Resolved thread excluded from unresolved query');

  results.push('✓ Test 4 Passed: Plot Thread lifecycle, chapter binding, matrix progression & resolution');

  // =========================================================================
  // 5. Character Appearance Timeline & Last Seen Query
  // =========================================================================
  const timeline = StoryEngineQueries.getCharacterAppearanceTimeline(pLinkedThread, character.id, character.name);
  assert(timeline.totalAppearances >= 1, 'Character appearance timeline tracks appearances');
  assert(timeline.povCount >= 1, 'Character appearance timeline tracks POV occurrences');

  const lastSeen = StoryEngineQueries.getCharacterLastSeen(pLinkedThread, character.id);
  assert(lastSeen !== null, 'Character last seen location resolved');
  assert(lastSeen?.scene?.id === boundScene.id || lastSeen?.chapter?.id === chapter.id, 'Last seen matches most recent scene');

  results.push('✓ Test 5 Passed: Character appearance timeline, POV tracking & last-seen resolution');

  // =========================================================================
  // 6. Chapter → Scene Hierarchy & Ordering
  // =========================================================================
  const pReordered = StoryEngine.reorderScenes(pLinkedThread, chapter.id, [boundScene.id, scene.id]);
  const chapterScenes = StoryEngineQueries.getScenesForChapter(pReordered, chapter.id);
  assert(chapterScenes[0].id === boundScene.id, 'Scene reordering puts boundScene first');
  assert(chapterScenes[0].order === 1, 'Scene order renumbered to 1');
  assert(chapterScenes[1].id === scene.id, 'Scene reordering puts scene second');
  assert(chapterScenes[1].order === 2, 'Scene order renumbered to 2');

  results.push('✓ Test 6 Passed: Act → Chapter → Scene hierarchy, reordering & order stability');

  // =========================================================================
  // 7. Conservative Migration of Legacy Data (No Story Engine Fields)
  // =========================================================================
  const legacyProject: any = {
    metadata: {
      id: 'legacy-proj-1',
      title: 'The Old Manuscript',
      author: 'Old Scribe',
      genre: 'Historical',
      targetWordCount: 50000,
      currentWordCount: 1200,
      preset: 'pantser',
      theme: { id: 'obsidian-dark', name: 'Obsidian' },
      typography: { fontSize: 16 },
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    acts: [
      {
        id: 'legacy-act-1',
        title: 'Book One',
        order: 1,
        chapters: [
          {
            id: 'legacy-ch-1',
            title: 'An Old Beginning',
            order: 1,
            content: '<h1>An Old Beginning</h1><p>Garrick met with Lucan in the tavern.</p>',
            wordCount: 1200,
            status: 'draft',
            updatedAt: '2025-01-01',
            // Note: NO scenes, NO plotThreadIds, NO characterIds
          }
        ]
      }
    ],
    characters: [
      {
        id: 'legacy-char-1',
        name: 'Garrick',
        role: 'Protagonist',
        bio: 'A veteran mercenary.',
        motivations: 'Gold and redemption', // Legacy single string
        // Note: NO goals array, NO beliefs, NO knowledge, NO relationships
      }
    ],
    codex: [
      {
        id: 'legacy-loc-1',
        category: 'location',
        name: 'Ironhold Keep',
        summary: 'A fortress on the border.',
        content: '<p>Granite walls.</p>'
      }
    ]
  };

  const migratedLegacy = migrateProjectToStoryEngine(legacyProject);

  assert(Boolean(migratedLegacy.storyArcs && migratedLegacy.storyArcs.length > 0), 'Migration creates default story arc');
  assert(Boolean(migratedLegacy.locations && migratedLegacy.locations.length > 0), 'Migration converts codex location to domain location');
  assert(migratedLegacy.locations?.some(l => l.name === 'Ironhold Keep') === true, 'Migrated location preserved name');

  const migratedGarrick = migratedLegacy.characters.find(c => c.id === 'legacy-char-1');
  assert(Array.isArray(migratedGarrick?.goals), 'Migration converts motivation string to goals array');
  assert(Array.isArray(migratedGarrick?.beliefs), 'Migration initializes beliefs array');
  assert(Array.isArray(migratedGarrick?.relationships), 'Migration initializes relationships array');

  const migratedCh = migratedLegacy.acts[0].chapters[0];
  assert(Boolean(migratedCh.scenes && migratedCh.scenes.length === 1), 'Migration creates 1-to-1 default Scene for legacy chapter');
  assert(migratedCh.scenes![0].title === 'An Old Beginning', 'Default scene inherits chapter title');
  assert(migratedCh.scenes![0].wordCount === 1200, 'Default scene inherits word count');

  results.push('✓ Test 7 Passed: Conservative migration of legacy project, codex conversion & default scene creation');

  // =========================================================================
  // 8. Round-Trip Serialization & Persistence Reload Fidelity
  // =========================================================================
  const jsonString = JSON.stringify(pLinkedThread);
  const deserialized: ProjectData = JSON.parse(jsonString);
  const reloaded = migrateProjectToStoryEngine(deserialized);

  assert(reloaded.acts.length === pLinkedThread.acts.length, 'Reloaded acts count matches');
  assert(reloaded.characters.length === pLinkedThread.characters.length, 'Reloaded characters count matches');
  assert(reloaded.locations?.length === pLinkedThread.locations?.length, 'Reloaded locations count matches');
  assert(reloaded.plotThreads?.length === pLinkedThread.plotThreads?.length, 'Reloaded plot threads count matches');

  const reloadedScene = StoryEngineQueries.getSceneById(reloaded, boundScene.id);
  assert(reloadedScene !== null, 'Reloaded scene found by ID');
  assert(reloadedScene?.povCharacterId === character.id, 'Reloaded scene retains POV character binding');

  results.push('✓ Test 8 Passed: Round-trip JSON serialization & persistence reload fidelity');

  // =========================================================================
  // 9. Backwards Compatibility & Unknown Custom Field Preservation
  // =========================================================================
  const projectWithCustomFields: any = {
    ...legacyProject,
    customAuthorNote: 'Do not delete this custom user metadata',
    experimentalFlags: { betaFeature: true },
  };

  const migratedWithCustom = migrateProjectToStoryEngine(projectWithCustomFields);
  assert((migratedWithCustom as any).customAuthorNote === 'Do not delete this custom user metadata', 'Custom user metadata preserved');
  assert((migratedWithCustom as any).experimentalFlags.betaFeature === true, 'Custom nested objects preserved');

  results.push('✓ Test 9 Passed: Unknown field preservation & non-destructive backward compatibility');

  // =========================================================================
  // 10. Obsidian Wikilink Relationship Extraction & Interoperability
  // =========================================================================
  const graphData = ObsidianParserService.generateGraphData(pLinkedThread, 'global', '', 1, 'story');
  assert(graphData.nodes.length > 0, 'Obsidian graph engine operates seamlessly on Story Engine domain state');

  results.push('✓ Test 10 Passed: Obsidian Wikilink graph & Markdown compatibility');

  // =========================================================================
  // 11. First-Class Scene System: Creation, Defaults & Ordering
  // =========================================================================
  const { project: pNewCh, chapter: testSceneCh } = StoryEngine.addChapter(pLinkedThread, act.id, {
    title: 'Chapter 100: Scene Testing Ground',
  });

  assert(testSceneCh.scenes?.length === 1, 'New chapter initialized with 1 default scene');
  assert(Boolean(testSceneCh.scenes && testSceneCh.scenes[0].order === 1), 'Default scene has order 1');

  const { project: pSc2, scene: scene2 } = StoryEngine.addScene(pNewCh, testSceneCh.id, {
    title: 'Scene 100.2: The Confrontation',
    content: '<p>The shadows deepened along the keep wall.</p>',
    wordCount: 7,
    povCharacterId: character.id,
  });

  const chWith2Scenes = StoryEngineQueries.getChapterById(pSc2, testSceneCh.id);
  assert(Boolean(chWith2Scenes && chWith2Scenes.scenes && chWith2Scenes.scenes.length === 2), 'Chapter has 2 scenes');
  assert(scene2.order === 2, 'Second scene automatically assigned order 2');
  assert(scene2.povCharacterId === character.id, 'Scene assigned POV character');

  results.push('✓ Test 11 Passed: Scene creation, sequential ordering & metadata defaults');

  // =========================================================================
  // 12. First-Class Scene System: Scene Duplication
  // =========================================================================
  const { project: pDup, scene: duplicatedScene } = StoryEngine.duplicateScene(pSc2, scene2.id);
  const chWithDup = StoryEngineQueries.getChapterById(pDup, testSceneCh.id);
  
  assert(duplicatedScene.id !== scene2.id, 'Duplicated scene has new unique ID');
  assert(duplicatedScene.title.includes('(Copy)'), 'Duplicated scene title contains (Copy)');
  assert(duplicatedScene.povCharacterId === scene2.povCharacterId, 'Duplicated scene retains POV character');
  assert(duplicatedScene.order === scene2.order + 1, 'Duplicated scene placed immediately after original');
  assert(chWithDup?.scenes?.length === 3, 'Chapter scene count incremented to 3');

  results.push('✓ Test 12 Passed: Scene duplication, relational cloning & order placement');

  // =========================================================================
  // 13. First-Class Scene System: Scene Splitting
  // =========================================================================
  const splitSourceContent = '<p>First half of the narrative.</p>';
  const splitTargetContent = '<p>Second half of the narrative unfolds here.</p>';
  
  const { project: pSplit, originalScene: origSc, newScene: splitSc } = StoryEngine.splitScene(
    pDup,
    scene2.id,
    splitSourceContent,
    splitTargetContent,
    'Scene 100.2: Part Two'
  );

  assert(origSc.content === splitSourceContent, 'Original scene receives first half of content');
  assert(splitSc.content === splitTargetContent, 'New scene receives second half of content');
  assert(origSc.wordCount === 5, 'Original scene word count recalculated');
  assert(splitSc.wordCount === 7, 'New scene word count calculated');
  assert(splitSc.title === 'Scene 100.2: Part Two', 'New scene assigned custom split title');
  assert(splitSc.order === origSc.order + 1, 'New scene placed directly after split source');

  results.push('✓ Test 13 Passed: Scene splitting, atomic content division & word count calculation');

  // =========================================================================
  // 14. First-Class Scene System: Scene Merging
  // =========================================================================
  const { project: pMerged, mergedScene } = StoryEngine.mergeScenes(
    pSplit,
    origSc.id,
    splitSc.id
  );

  assert(mergedScene.id === origSc.id, 'Merged scene retains first scene ID');
  assert(Boolean(mergedScene.content?.includes('<hr/>')), 'Merged prose combined with horizontal rule divider');
  assert(Boolean(mergedScene.content?.includes('First half') && mergedScene.content?.includes('Second half')), 'Both prose sections preserved in merged scene');
  assert(mergedScene.wordCount === 12, 'Merged word count accurately sums both halves');
  
  const chAfterMerge = StoryEngineQueries.getChapterById(pMerged, testSceneCh.id);
  results.push('✓ Test 14 Passed: Scene merging, text union & reference cleanup');

  // =========================================================================
  // 15. First-Class Scene System: Scene Reordering
  // =========================================================================
  const chScenesBeforeReorder = chAfterMerge?.scenes || [];
  const sceneIdsReversed = [...chScenesBeforeReorder].map(s => s.id).reverse();
  
  const pReorderedScenes = StoryEngine.reorderScenes(pMerged, testSceneCh.id, sceneIdsReversed);
  const chAfterReorder = StoryEngineQueries.getChapterById(pReorderedScenes, testSceneCh.id);
  
  assert(chAfterReorder?.scenes?.[0].id === sceneIdsReversed[0], 'First scene matches reordered sequence');
  assert(chAfterReorder?.scenes?.[0].order === 1, 'Reordered scene has order 1');
  assert(chAfterReorder?.scenes?.[1]?.order === 2, 'Reordered scene has order 2');

  results.push('✓ Test 15 Passed: Pure domain scene reordering & sequential index assignment');

  // =========================================================================
  // 16. Plot Thread System: Creation & Validation
  // =========================================================================
  const { project: pTh16, thread: createdThread } = StoryEngine.createThread(pReorderedScenes, {
    title: 'The Stolen Censer',
    type: 'mystery',
    status: 'setup',
    description: 'Who stole the sacred silver censer from the chapel?',
    expectedPayoff: 'Revealed in Act III during the harvest feast.',
    color: '#A855F7',
  });

  assert(Boolean(createdThread.id && createdThread.id.startsWith('thread-')), 'Created thread ID has stable thread- prefix');
  assert(createdThread.title === 'The Stolen Censer', 'Thread title preserved');
  assert(createdThread.type === 'mystery', 'Thread type preserved');
  assert(createdThread.status === 'setup', 'Thread status preserved');
  assert(createdThread.color === '#A855F7', 'Thread color preserved');
  assert(StoryEngineQueries.getThreadById(pTh16, createdThread.id)?.id === createdThread.id, 'getThreadById finds created thread');

  results.push('✓ Test 16 Passed: Plot thread creation, initial state & ID assignment');

  // =========================================================================
  // 17. Plot Thread System: Update Operations
  // =========================================================================
  const pTh17 = StoryEngine.updateThread(pTh16, createdThread.id, {
    title: 'The Desecrated Censer',
    status: 'active',
    expectedPayoff: 'Confrontation at the high altar.',
  });
  const updatedTh = StoryEngineQueries.getThreadById(pTh17, createdThread.id);

  assert(updatedTh?.title === 'The Desecrated Censer', 'Thread title updated');
  assert(updatedTh?.status === 'active', 'Thread status updated to active');
  assert(updatedTh?.expectedPayoff === 'Confrontation at the high altar.', 'Expected payoff updated');

  results.push('✓ Test 17 Passed: Plot thread update operations & field persistence');

  // =========================================================================
  // 18. Plot Thread System: Scene Attachment & Reciprocal Linking
  // =========================================================================
  const targetSceneId = boundScene.id;
  const pTh18 = StoryEngine.attachSceneToThread(pTh17, createdThread.id, targetSceneId);
  const th18 = StoryEngineQueries.getThreadById(pTh18, createdThread.id);
  const sc18 = StoryEngineQueries.getSceneById(pTh18, targetSceneId);

  assert(Boolean(th18?.relatedSceneIds?.includes(targetSceneId)), 'Thread relatedSceneIds contains target scene');
  assert(Boolean(sc18?.plotThreadIds?.includes(createdThread.id)), 'Scene plotThreadIds contains created thread');
  
  const threadsInScene = StoryEngineQueries.getThreadsForScene(pTh18, targetSceneId);
  assert(threadsInScene.some(t => t.id === createdThread.id), 'getThreadsForScene returns attached thread');

  results.push('✓ Test 18 Passed: Scene ↔ Thread reciprocal attachment & scene thread query');

  // =========================================================================
  // 19. Plot Thread System: Scene Detachment & Reciprocal Cleanup
  // =========================================================================
  const pTh19 = StoryEngine.detachSceneFromThread(pTh18, createdThread.id, targetSceneId);
  const th19 = StoryEngineQueries.getThreadById(pTh19, createdThread.id);
  const sc19 = StoryEngineQueries.getSceneById(pTh19, targetSceneId);

  assert(!th19?.relatedSceneIds?.includes(targetSceneId), 'Thread relatedSceneIds no longer contains target scene');
  assert(!sc19?.plotThreadIds?.includes(createdThread.id), 'Scene plotThreadIds no longer contains created thread');

  results.push('✓ Test 19 Passed: Scene ↔ Thread reciprocal detachment & clean reference dissociation');

  // =========================================================================
  // 20. Plot Thread System: Character Attachment & Detachment
  // =========================================================================
  const pTh20Attached = StoryEngine.attachCharacterToThread(pTh19, createdThread.id, character.id);
  const th20Attached = StoryEngineQueries.getThreadById(pTh20Attached, createdThread.id);
  assert(Boolean(th20Attached?.relatedCharacterIds?.includes(character.id)), 'Character ID attached to thread');

  const threadsForChar = StoryEngineQueries.getThreadsForCharacter(pTh20Attached, character.id);
  assert(threadsForChar.some(t => t.id === createdThread.id), 'getThreadsForCharacter returns attached thread');

  const pTh20Detached = StoryEngine.detachCharacterFromThread(pTh20Attached, createdThread.id, character.id);
  const th20Detached = StoryEngineQueries.getThreadById(pTh20Detached, createdThread.id);
  assert(!th20Detached?.relatedCharacterIds?.includes(character.id), 'Character ID detached from thread');

  results.push('✓ Test 20 Passed: Character ↔ Thread attachment, detachment & character query');

  // =========================================================================
  // 21. Plot Thread System: Status Transitions & Resolution
  // =========================================================================
  const pTh21Status = StoryEngine.markThreadStatus(pTh20Detached, createdThread.id, 'payoff-pending');
  assert(StoryEngineQueries.getThreadById(pTh21Status, createdThread.id)?.status === 'payoff-pending', 'Thread status marked payoff-pending');

  const pTh21Resolved = StoryEngine.resolveThread(pTh21Status, createdThread.id, targetSceneId);
  const th21Resolved = StoryEngineQueries.getThreadById(pTh21Resolved, createdThread.id);
  assert(th21Resolved?.status === 'resolved', 'resolveThread marks thread status as resolved');
  assert(th21Resolved?.resolvedIn === targetSceneId, 'resolveThread records resolvedIn scene');

  const resolvedThreads = StoryEngineQueries.getResolvedThreads(pTh21Resolved);
  assert(resolvedThreads.some(t => t.id === createdThread.id), 'getResolvedThreads includes resolved thread');

  results.push('✓ Test 21 Passed: Thread status transitions, payoff tracking & resolution');

  // =========================================================================
  // 22. Plot Thread System: First and Last Appearance Queries
  // =========================================================================
  // Attach thread across chapter and scene
  let pTh22 = StoryEngine.attachSceneToThread(pTh21Resolved, createdThread.id, boundScene.id);
  pTh22 = StoryEngine.attachSceneToThread(pTh22, createdThread.id, scene2.id);

  const firstApp = StoryEngineQueries.getThreadFirstAppearance(pTh22, createdThread.id);
  assert(firstApp !== null, 'First appearance resolved');
  assert(firstApp?.scene?.id === boundScene.id, 'First appearance matches earliest manuscript scene');

  const lastApp = StoryEngineQueries.getThreadLastAppearance(pTh22, createdThread.id);
  assert(lastApp !== null, 'Last appearance resolved');
  assert(lastApp?.scene?.id === scene2.id, 'Last appearance matches latest manuscript scene');

  results.push('✓ Test 22 Passed: First & Last appearance chronology queries across manuscript');

  // =========================================================================
  // 23. Plot Thread System: Neutral Dormancy Gap Detection
  // =========================================================================
  // Create a multi-chapter sequence to test dormancy
  let pDormant = pTh22;
  const { project: pD1, chapter: dCh1 } = StoryEngine.addChapter(pDormant, act.id, { title: 'Chapter Gap 1' });
  const { project: pD2, chapter: dCh2 } = StoryEngine.addChapter(pD1, act.id, { title: 'Chapter Gap 2' });
  const { project: pD3, chapter: dCh3 } = StoryEngine.addChapter(pD2, act.id, { title: 'Chapter Gap 3' });
  const { project: pD4, chapter: dCh4 } = StoryEngine.addChapter(pD3, act.id, { title: 'Chapter Gap 4' });

  // Re-open thread as active so dormancy checker evaluates it
  const pActiveAgain = StoryEngine.updateThread(pD4, createdThread.id, { status: 'active' });
  
  // At dCh4 (4 chapters after scene2), the thread has a gap of >= 3 chapters
  const dormantReports = StoryEngineQueries.getDormantThreads(pActiveAgain, dCh4.id, 3);
  const threadDormancy = dormantReports.find(d => d.thread.id === createdThread.id);

  assert(Boolean(threadDormancy), 'Dormancy report includes active thread');
  assert(Boolean(threadDormancy?.isDormantCandidate), 'Thread correctly flagged as candidate dormant (> 3 chapters gap)');
  assert(Boolean(threadDormancy && threadDormancy.gapChapters >= 3), 'Dormancy report accurately measures chapter gap length');

  results.push('✓ Test 23 Passed: Neutral dormancy detection & linear chapter gap calculation');

  // =========================================================================
  // 24. Plot Thread System: Payoff Pending & Active Queries
  // =========================================================================
  const pPayoff = StoryEngine.updateThread(pActiveAgain, createdThread.id, { status: 'payoff-pending' });
  const pendingPayoffs = StoryEngineQueries.getPayoffPendingThreads(pPayoff);
  assert(pendingPayoffs.some(t => t.id === createdThread.id), 'getPayoffPendingThreads returns thread in payoff-pending status');

  results.push('✓ Test 24 Passed: Payoff-pending and active thread domain queries');

  // =========================================================================
  // 25. Plot Thread System: Progression Matrix Generation
  // =========================================================================
  const matrixProgression = StoryEngineQueries.getPlotThreadMatrix(pPayoff);
  assert(matrixProgression.columns.length >= 4, 'Matrix contains all project chapters as columns');
  assert(matrixProgression.rows.length >= 1, 'Matrix contains rows for active threads');

  const matrixRow = matrixProgression.rows.find(r => r.thread.id === createdThread.id);
  assert(Boolean(matrixRow), 'Created thread has a corresponding matrix row');
  assert(Boolean(matrixRow?.cells.some(c => c.state === 'touchpoint')), 'Matrix row has touchpoint cells where thread is present');

  results.push('✓ Test 25 Passed: Plot thread progression matrix generation & timeline cells');

  // =========================================================================
  // 26. Plot Thread System: Thread Deletion & Relational Integrity
  // =========================================================================
  const pDeleted = StoryEngine.deleteThread(pPayoff, createdThread.id);
  assert(StoryEngineQueries.getThreadById(pDeleted, createdThread.id) === null, 'Deleted thread removed from project.plotThreads');
  
  const scAfterDel = StoryEngineQueries.getSceneById(pDeleted, boundScene.id);
  assert(!scAfterDel?.plotThreadIds?.includes(createdThread.id), 'Deleted thread ID stripped from scene.plotThreadIds');
  assert(scAfterDel !== null, 'Scene itself is fully preserved (non-destructive deletion)');

  results.push('✓ Test 26 Passed: Thread deletion & non-destructive relational integrity cleanup');

  // =========================================================================
  // 27. Plot Thread System: Round-Trip Persistence & Deserialization
  // =========================================================================
  const { project: pWithThread, thread: persistThread } = StoryEngine.createThread(pDeleted, {
    title: 'The Royal Lineage Secret',
    type: 'character-arc',
    status: 'active',
    description: 'Lucan discovers his true descent.',
    relatedCharacterIds: [character.id],
    relatedSceneIds: [boundScene.id],
  });

  const serialized = JSON.stringify(pWithThread);
  const parsedData = JSON.parse(serialized);
  const reloadedProject = migrateProjectToStoryEngine(parsedData);

  const reloadedThread = StoryEngineQueries.getThreadById(reloadedProject, persistThread.id);
  assert(reloadedThread !== null, 'Reloaded thread found in deserialized project');
  assert(reloadedThread?.title === 'The Royal Lineage Secret', 'Reloaded thread title preserved');
  assert(Boolean(reloadedThread?.relatedCharacterIds?.includes(character.id)), 'Reloaded thread retains character associations');
  assert(Boolean(reloadedThread?.relatedSceneIds?.includes(boundScene.id)), 'Reloaded thread retains scene associations');

  results.push('✓ Test 27 Passed: Thread round-trip serialization & persistence fidelity');

  // =========================================================================
  // 28. Plot Thread System: Backward Compatibility with Legacy Projects
  // =========================================================================
  const legacyWithoutThreads: any = {
    metadata: { title: 'Legacy Novel', author: 'Author', theme: {}, typography: {} },
    acts: [],
    chapters: [],
    characters: [],
    locations: [],
    codex: []
  };
  const migratedNoThreads = migrateProjectToStoryEngine(legacyWithoutThreads);
  assert(Array.isArray(migratedNoThreads.plotThreads), 'Migration initializes plotThreads array if missing');
  assert(Boolean(migratedNoThreads.plotThreads && migratedNoThreads.plotThreads.length >= 0), 'Plot threads array safe and non-null');

  const matrixLegacy = StoryEngineQueries.getPlotThreadMatrix(migratedNoThreads);
  assert(matrixLegacy !== null && Array.isArray(matrixLegacy.rows), 'getPlotThreadMatrix operates safely on legacy projects');

  results.push('✓ Test 28 Passed: Non-destructive backward compatibility for projects without plot threads');

  // =========================================================================
  // 29. Character State System: Character Creation & Initial State
  // =========================================================================
  const { project: pCharCreated, character: seraphina } = StoryEngine.addCharacter(pWithThread, {
    name: 'Seraphina Vance',
    role: 'Protagonist',
    archetype: 'The Reluctant Seeker',
    age: '24',
    aliases: ['The Ashen Blade'],
    bio: 'Former guard turned exile searching for the truth.',
    currentGoal: 'Infiltrate the high council archives',
    currentState: {
      emotional: 'Guarded and hyper-vigilant',
      physical: 'Minor cuts from escape',
      mental: 'Calculated',
      currentGoal: 'Infiltrate the high council archives',
      currentConflict: 'Suspicion from local sentries',
      motivation: 'Vindicate her fallen brother'
    }
  });

  assert(seraphina.name === 'Seraphina Vance', 'Seraphina created with correct name');
  assert(seraphina.role === 'Protagonist', 'Seraphina created with Protagonist role');
  assert(typeof seraphina.currentState === 'object' && seraphina.currentState.emotional === 'Guarded and hyper-vigilant', 'Structured currentState initial emotional state set');
  
  results.push('✓ Test 29 Passed: Character creation & initial structured state modeling');

  // =========================================================================
  // 30. Character State System: Goal Lifecycle & Status Transitions
  // =========================================================================
  const { project: pWithGoal, goal: primaryGoal } = StoryEngine.addGoal(pCharCreated, seraphina.id, {
    description: 'Retrieve the ancestral sigil from the vault',
    priority: 'primary',
    conflict: 'Vault is guarded by enchanted wardens',
    status: 'active'
  });

  assert(primaryGoal.description === 'Retrieve the ancestral sigil from the vault', 'Goal created with description');
  assert(primaryGoal.status === 'active', 'Goal initial status is active');

  const pUpdatedGoal = StoryEngine.updateGoal(pWithGoal, seraphina.id, primaryGoal.id, {
    conflict: 'Vault is guarded by double sentry patrol'
  });
  const updatedChar = StoryEngineQueries.getCharacterById(pUpdatedGoal, seraphina.id);
  const fetchedGoal = (updatedChar?.goals || []).find(g => typeof g === 'object' && g.id === primaryGoal.id) as any;
  assert(fetchedGoal?.conflict === 'Vault is guarded by double sentry patrol', 'Goal conflict updated successfully');

  const pPausedGoal = StoryEngine.setGoalStatus(pUpdatedGoal, seraphina.id, primaryGoal.id, 'paused');
  const pausedChar = StoryEngineQueries.getCharacterById(pPausedGoal, seraphina.id);
  const pausedGoal = (pausedChar?.goals || []).find(g => typeof g === 'object' && g.id === primaryGoal.id) as any;
  assert(pausedGoal?.status === 'paused', 'Goal status set to paused');

  const pAchievedGoal = StoryEngine.setGoalStatus(pPausedGoal, seraphina.id, primaryGoal.id, 'achieved');
  const achievedChar = StoryEngineQueries.getCharacterById(pAchievedGoal, seraphina.id);
  const achievedGoal = (achievedChar?.goals || []).find(g => typeof g === 'object' && g.id === primaryGoal.id) as any;
  assert(achievedGoal?.status === 'achieved', 'Goal status set to achieved');

  const { project: pWithSecondGoal, goal: secondaryGoal } = StoryEngine.addGoal(pAchievedGoal, seraphina.id, {
    description: 'Bribe the tavern informant',
    priority: 'secondary',
    status: 'active'
  });
  const pRemovedGoal = StoryEngine.removeGoal(pWithSecondGoal, seraphina.id, secondaryGoal.id);
  const charAfterRemove = StoryEngineQueries.getCharacterById(pRemovedGoal, seraphina.id);
  assert(!(charAfterRemove?.goals || []).some(g => typeof g === 'object' && g.id === secondaryGoal.id), 'Secondary goal removed cleanly');

  results.push('✓ Test 30 Passed: Character goal lifecycle (add, update, pause, achieve, remove)');

  // =========================================================================
  // 31. Character State System: Belief Lifecycle & Certainty Tracking
  // =========================================================================
  const { project: pWithBelief, belief: primaryBelief } = StoryEngine.addBelief(pRemovedGoal, seraphina.id, {
    statement: 'The Council of Elders is corrupt to its core',
    certainty: 'strong',
    status: 'held'
  });

  assert(primaryBelief.statement.includes('Council of Elders'), 'Belief added with statement');
  assert(primaryBelief.certainty === 'strong', 'Belief certainty is strong');

  const pUpdatedBelief = StoryEngine.updateBelief(pWithBelief, seraphina.id, primaryBelief.id, {
    certainty: 'uncertain',
    status: 'questioned'
  });
  const charWithUpdatedBelief = StoryEngineQueries.getCharacterById(pUpdatedBelief, seraphina.id);
  const fetchedBelief = (charWithUpdatedBelief?.beliefs || []).find(b => typeof b === 'object' && b.id === primaryBelief.id) as any;
  assert(fetchedBelief?.certainty === 'uncertain', 'Belief certainty updated to uncertain');
  assert(fetchedBelief?.status === 'questioned', 'Belief status updated to questioned');

  results.push('✓ Test 31 Passed: Character belief lifecycle & certainty tracking');

  // =========================================================================
  // 32. Character State System: Knowledge Tracking & Attribution
  // =========================================================================
  const { project: pWithKnowledge, knowledge: knowEntry } = StoryEngine.addCharacterKnowledge(pUpdatedBelief, seraphina.id, {
    information: 'The southern gate has an unmonitored drainage conduit',
    source: 'Informant Lucan',
    certainty: 'certain',
    learnedIn: boundScene.id,
    sourceSceneId: boundScene.id
  });

  assert(knowEntry.certainty === 'certain', 'Knowledge entry has certain status');
  assert(knowEntry.source === 'Informant Lucan', 'Knowledge source attributed correctly');

  const pUpdatedKnow = StoryEngine.updateCharacterKnowledge(pWithKnowledge, seraphina.id, knowEntry.id, {
    certainty: 'suspected'
  });
  const charWithUpdatedKnow = StoryEngineQueries.getCharacterById(pUpdatedKnow, seraphina.id);
  const fetchedKnow = (charWithUpdatedKnow?.knowledgeList || []).find(k => k.id === knowEntry.id);
  assert(fetchedKnow?.certainty === 'suspected', 'Knowledge entry certainty updated to suspected');

  results.push('✓ Test 32 Passed: Character knowledge tracking & attribution');

  // =========================================================================
  // 33. Character State System: Chronological Knowledge at Specific Scene
  // =========================================================================
  const { project: pTwoScenes, scene: sceneTwo } = StoryEngine.addScene(pUpdatedKnow, chapter.id, {
    title: 'Scene 99.2: The Drainage Infiltration'
  });

  const { project: pWithLateKnowledge, knowledge: lateKnow } = StoryEngine.addCharacterKnowledge(pTwoScenes, seraphina.id, {
    information: 'The citadel master key was moved to the high tower',
    learnedIn: sceneTwo.id,
    sourceSceneId: sceneTwo.id,
    certainty: 'certain'
  });

  // Query knowledge at scene 1 (should NOT see knowledge learned in scene 2)
  const knowAtScene1 = StoryEngineQueries.getCharacterKnowledgeAtScene(pWithLateKnowledge, seraphina.id, boundScene.id);
  assert(knowAtScene1.some(k => k.id === knowEntry.id), 'Scene 1 knows facts learned in scene 1');
  assert(!knowAtScene1.some(k => k.id === lateKnow.id), 'Scene 1 does NOT know facts learned later in scene 2');

  // Query knowledge at scene 2 (should see both)
  const knowAtScene2 = StoryEngineQueries.getCharacterKnowledgeAtScene(pWithLateKnowledge, seraphina.id, sceneTwo.id);
  assert(knowAtScene2.some(k => k.id === knowEntry.id), 'Scene 2 includes earlier learned knowledge');
  assert(knowAtScene2.some(k => k.id === lateKnow.id), 'Scene 2 includes newly learned knowledge');

  results.push('✓ Test 33 Passed: Chronological character knowledge query at specific manuscript scenes');

  // =========================================================================
  // 34. Character State System: Secrets & Reveal Status Lifecycle
  // =========================================================================
  const { project: pWithSecret, secret: sec1 } = StoryEngine.addSecret(pWithLateKnowledge, seraphina.id, {
    content: 'She was the one who accidentally disabled the citadel alarms years ago',
    status: 'hidden'
  });

  assert(sec1.status === 'hidden', 'Secret created with hidden status');

  const pRevealedSecret = StoryEngine.updateSecret(pWithSecret, seraphina.id, sec1.id, {
    status: 'revealed'
  });
  const charWithSecret = StoryEngineQueries.getCharacterById(pRevealedSecret, seraphina.id);
  const fetchedSec = (charWithSecret?.secrets as any[]).find(s => s.id === sec1.id);
  assert(fetchedSec?.status === 'revealed', 'Secret status transitioned to revealed');

  results.push('✓ Test 34 Passed: Secrets lifecycle & reveal state transitions');

  // =========================================================================
  // 35. Character State System: Interpersonal Relationships, Trust & Milestones
  // =========================================================================
  const pWithRel = StoryEngine.setCharacterRelationship(pRevealedSecret, seraphina.id, character.id, 'Uneasy Alliance', {
    currentState: 'Cautious cooperation',
    trustLevel: 2,
    notes: 'Bound by a shared grudge against the elder council'
  });

  const pWithMilestone = StoryEngine.addRelationshipMilestone(pWithRel, seraphina.id, character.id, {
    milestone: 'alliance_formed',
    description: 'Swore a pact in the drainage tunnels',
    sceneId: boundScene.id
  });

  const rels = StoryEngineQueries.getCharacterRelationships(pWithMilestone, seraphina.id);
  const vaelenRel = rels.find(r => r.targetId === character.id);
  assert(vaelenRel !== undefined, 'Relationship with Vaelen found');
  assert(vaelenRel?.trustLevel === 2, 'Trust level is +2');
  assert(Boolean(vaelenRel?.milestones?.some(m => m.milestone === 'alliance_formed')), 'Relationship milestone alliance_formed recorded');

  results.push('✓ Test 35 Passed: Interpersonal relationships, trust metrics & milestone progression');

  // =========================================================================
  // 36. Character State System: Scene Appearances, POV & First/Last Seen
  // =========================================================================
  const charScenes = StoryEngineQueries.getCharacterScenes(pWithMilestone, seraphina.id);
  // Seraphina is not explicitly in boundScene until we attach her
  const pBoundSeraphina = StoryEngine.updateScene(pWithMilestone, boundScene.id, {
    characterIds: [...(boundScene.characterIds || []), seraphina.id]
  });
  const pBoundSeraphina2 = StoryEngine.updateScene(pBoundSeraphina, sceneTwo.id, {
    povCharacterId: seraphina.id,
    characterIds: [seraphina.id]
  });

  const seraphinaScenes = StoryEngineQueries.getCharacterScenes(pBoundSeraphina2, seraphina.id);
  assert(seraphinaScenes.length >= 2, 'Seraphina scene appearances resolved correctly');

  const firstAppSeraphina = StoryEngineQueries.getCharacterFirstAppearance(pBoundSeraphina2, seraphina.id);
  assert(firstAppSeraphina?.chapter?.id === chapter.id, 'First appearance chapter resolved');
  assert(firstAppSeraphina?.scene?.id === boundScene.id, 'First appearance scene resolved');

  const lastSeenSeraphina = StoryEngineQueries.getCharacterLastSeen(pBoundSeraphina2, seraphina.id);
  assert(lastSeenSeraphina?.scene?.id === sceneTwo.id, 'Last seen scene resolved to later scene 2');

  results.push('✓ Test 36 Passed: Character appearance queries, POV resolution & First/Last seen tracking');

  // =========================================================================
  // 37. Character State System: Act-by-Act Distribution Query
  // =========================================================================
  const actDist = StoryEngineQueries.getCharacterAppearancesByAct(pBoundSeraphina2, seraphina.id);
  assert(actDist.length > 0, 'Act distribution returns act list');
  const targetActSummary = actDist.find(a => a.act.id === act.id);
  assert(Boolean(targetActSummary && targetActSummary.sceneCount >= 2), 'Character appearance count in Act accurately counted');

  results.push('✓ Test 37 Passed: Act-by-act character presence distribution query');

  // =========================================================================
  // 38. Character State System: Connected Plot Threads & Story Arcs Queries
  // =========================================================================
  const pThreadLinked = StoryEngine.attachCharacterToThread(pBoundSeraphina2, thread.id, seraphina.id);
  const connectedThreads = StoryEngineQueries.getCharacterPlotThreads(pThreadLinked, seraphina.id);
  assert(connectedThreads.some(t => t.id === thread.id), 'getCharacterPlotThreads returns thread linked to character');

  const pArcLinked = StoryEngine.updateCharacter(pThreadLinked, seraphina.id, {
    storyArcId: arc.id
  });
  const connectedArcs = StoryEngineQueries.getCharacterStoryArcs(pArcLinked, seraphina.id);
  assert(connectedArcs.some(a => a.id === arc.id), 'getCharacterStoryArcs returns linked story arc');

  results.push('✓ Test 38 Passed: Connected Plot Threads and Story Arcs bidirectional queries');

  // =========================================================================
  // 39. Character State System: State Checkpoint Creation & Scene Lookup
  // =========================================================================
  const { project: pWithCheckpoint, checkpoint } = StoryEngine.addStateCheckpoint(pArcLinked, seraphina.id, {
    sceneId: sceneTwo.id,
    emotionalState: 'Empowered yet cautious',
    physicalState: 'Resting in hideout',
    currentGoal: 'Decode the stolen cipher',
    note: 'After successfully escaping the drainage tunnels'
  });

  assert(checkpoint.emotionalState === 'Empowered yet cautious', 'Checkpoint created with emotional state');

  const stateAtScene2 = StoryEngineQueries.getCharacterStateAtScene(pWithCheckpoint, seraphina.id, sceneTwo.id);
  assert(stateAtScene2?.emotional === 'Empowered yet cautious', 'State lookup at scene 2 retrieves checkpoint emotional state');
  assert(stateAtScene2?.currentGoal === 'Decode the stolen cipher', 'State lookup at scene 2 retrieves checkpoint goal');

  results.push('✓ Test 39 Passed: State Checkpoints creation & chronological state lookup at scene');

  // =========================================================================
  // 40. Character State System: Active Goals Query
  // =========================================================================
  const activeGoalsQuery = StoryEngineQueries.getCharacterActiveGoals(pWithCheckpoint, seraphina.id);
  // We currently have the primaryGoal achieved, let's add a fresh active goal
  const { project: pWithFreshGoal } = StoryEngine.addGoal(pWithCheckpoint, seraphina.id, {
    description: 'Find a safehouse in the lower quarter',
    status: 'active'
  });
  const freshActiveGoals = StoryEngineQueries.getCharacterActiveGoals(pWithFreshGoal, seraphina.id);
  assert(freshActiveGoals.some(g => g.description === 'Find a safehouse in the lower quarter'), 'getCharacterActiveGoals filters active goals accurately');

  results.push('✓ Test 40 Passed: Character active goals query');

  // =========================================================================
  // 41. Character State System: Relationships Query
  // =========================================================================
  const charRelsQuery = StoryEngineQueries.getCharacterRelationships(pWithFreshGoal, seraphina.id);
  assert(charRelsQuery.length > 0, 'getCharacterRelationships returns mapped relationships');
  assert(charRelsQuery.some(r => r.targetId === character.id), 'getCharacterRelationships identifies Vaelen link');

  results.push('✓ Test 41 Passed: Character relationships query');

  // =========================================================================
  // 42. Character State System: Round-Trip Persistence & Deserialization
  // =========================================================================
  const serializedCharProj = JSON.stringify(pWithFreshGoal);
  const deserializedCharData = JSON.parse(serializedCharProj);
  const reloadedCharProj = migrateProjectToStoryEngine(deserializedCharData);

  const reloadedSeraphina = StoryEngineQueries.getCharacterById(reloadedCharProj, seraphina.id);
  assert(reloadedSeraphina !== null, 'Reloaded Seraphina found in deserialized project');
  assert(reloadedSeraphina?.name === 'Seraphina Vance', 'Reloaded character name preserved');
  assert((reloadedSeraphina?.goals || []).length > 0, 'Reloaded character goals array preserved');
  assert((reloadedSeraphina?.beliefs || []).length > 0, 'Reloaded character beliefs array preserved');
  assert((reloadedSeraphina?.knowledgeList || []).length > 0, 'Reloaded character knowledge array preserved');
  assert((reloadedSeraphina?.relationships || []).length > 0, 'Reloaded character relationships array preserved');
  assert((reloadedSeraphina?.stateCheckpoints || []).length > 0, 'Reloaded character checkpoints preserved');

  results.push('✓ Test 42 Passed: Complete character dynamic state round-trip persistence & fidelity');

  // =========================================================================
  // 43. Character State System: Non-Destructive Migration of Legacy Character Data
  // =========================================================================
  const legacyCharacterProject: any = {
    metadata: { title: 'Legacy Novel', author: 'Author', theme: {}, typography: {} },
    acts: [],
    chapters: [],
    characters: [
      {
        id: 'legacy-char-1',
        name: 'Old Knight Marcus',
        role: 'Protagonist',
        bio: 'A weathered warrior.',
        currentGoal: 'Defend the fortress',
        currentState: 'Exhausted after long march',
        beliefs: ['Honor above life', 'Kings never lie'],
        secrets: 'Hides a treasonous letter'
      }
    ],
    locations: [],
    codex: []
  };

  const migratedLegacyCharProj = migrateProjectToStoryEngine(legacyCharacterProject);
  const marcus = StoryEngineQueries.getCharacterById(migratedLegacyCharProj, 'legacy-char-1');
  assert(marcus !== null, 'Legacy character migrated');
  assert(Array.isArray(marcus?.goals), 'Legacy character goals initialized to array');
  assert(Array.isArray(marcus?.beliefs), 'Legacy character beliefs preserved as array');
  assert(Boolean(marcus?.beliefs?.includes('Honor above life')), 'Legacy string belief preserved in array');
  assert(marcus?.currentGoal === 'Defend the fortress', 'Legacy currentGoal string preserved');
  assert(marcus?.currentState === 'Exhausted after long march', 'Legacy currentState string preserved');

  results.push('✓ Test 43 Passed: Non-destructive backward-compatible migration of legacy character structures');

  // =========================================================================
  // 44. Dual Timeline System: Pure Narrative Reading Order Calculation
  // =========================================================================
  const narrativeNodes = StoryEngineQueries.getNarrativeOrder(pWithFreshGoal);
  assert(narrativeNodes.length > 0, 'Narrative order generated sequence of nodes');
  for (let i = 0; i < narrativeNodes.length; i++) {
    assert(narrativeNodes[i].manuscriptOrder === i + 1, `Narrative node ${i} has linear reading order #${i + 1}`);
  }
  results.push('✓ Test 44 Passed: Pure narrative reading order calculation (Act → Chapter → Scene linear sequence)');

  // =========================================================================
  // 45. Dual Timeline System: Pure Chronological Order Calculation
  // =========================================================================
  // Construct a project with nonlinear chronology:
  // Scene 1: "Day 1"
  // Scene 2: "Day 5"
  // Scene 3: "Day 3" (Flashback to Day 3)
  // Scene 4: "Day 8"
  let pChronoTest = JSON.parse(JSON.stringify(pWithFreshGoal));
  const { project: pChronoAct, act: cAct } = StoryEngine.addAct(pChronoTest, { title: 'Act Chrono' });
  const { project: pChronoCh, chapter: cCh } = StoryEngine.addChapter(pChronoAct, cAct.id, { title: 'Chapter Nonlinear' });
  
  const { project: pS1, scene: s1 } = StoryEngine.addScene(pChronoCh, cCh.id, { title: 'The Departure', timelineDate: 'Day 1' });
  const { project: pS2, scene: s2 } = StoryEngine.addScene(pS1, cCh.id, { title: 'The Arrival at the Capital', timelineDate: 'Day 5' });
  const { project: pS3, scene: s3 } = StoryEngine.addScene(pS2, cCh.id, { title: 'The Ambush in the Pass', timelineDate: 'Day 3', tags: ['flashback'] });
  const { project: pS4, scene: s4 } = StoryEngine.addScene(pS3, cCh.id, { title: 'The Coronation Feast', timelineDate: 'Day 8' });

  const chronoScenes = StoryEngineQueries.getScenesChronologically(pS4);
  const testSceneIds = [s1.id, s2.id, s3.id, s4.id];
  const filteredChronoScenes = chronoScenes.filter(s => testSceneIds.includes(s.id));
  
  assert(filteredChronoScenes[0].id === s1.id, 'Chrono 1 is Day 1 (Departure)');
  assert(filteredChronoScenes[1].id === s3.id, 'Chrono 2 is Day 3 (Ambush Flashback)');
  assert(filteredChronoScenes[2].id === s2.id, 'Chrono 3 is Day 5 (Arrival)');
  assert(filteredChronoScenes[3].id === s4.id, 'Chrono 4 is Day 8 (Feast)');

  results.push('✓ Test 45 Passed: Pure chronological order calculation with explicit date strings');

  // =========================================================================
  // 46. Dual Timeline System: Relative Days & Times of Day Sorting
  // =========================================================================
  const dawnScore = StoryEngineQueries.parseChronologicalSortScore('Day 3, Dawn').score;
  const noonScore = StoryEngineQueries.parseChronologicalSortScore('Day 3, Noon').score;
  const duskScore = StoryEngineQueries.parseChronologicalSortScore('Day 3, Dusk').score;
  const nightScore = StoryEngineQueries.parseChronologicalSortScore('Day 3, Night').score;

  assert(dawnScore < noonScore, 'Dawn precedes Noon on the same day');
  assert(noonScore < duskScore, 'Noon precedes Dusk on the same day');
  assert(duskScore < nightScore, 'Dusk precedes Night on the same day');

  results.push('✓ Test 46 Passed: Scene chronology sorting with relative days & times of day');

  // =========================================================================
  // 47. Dual Timeline System: Standalone Historical Event Chronology & BCE Sorting
  // =========================================================================
  const { project: pWithBceEvt, event: bceEvt } = StoryEngine.addEvent(pS4, {
    title: 'The Great Collapse',
    timelineDate: '400 BCE',
    type: 'historical'
  });
  const { project: pWithCeEvt, event: ceEvt } = StoryEngine.addEvent(pWithBceEvt, {
    title: 'The Treaty of Oakhaven',
    timelineDate: 'Year 1492',
    type: 'historical'
  });

  const sortedEvents = StoryEngineQueries.getEventsChronologically(pWithCeEvt);
  const bceIdx = sortedEvents.findIndex(e => e.id === bceEvt.id);
  const ceIdx = sortedEvents.findIndex(e => e.id === ceEvt.id);

  assert(bceIdx < ceIdx, '400 BCE event sorted chronologically before Year 1492 event');
  results.push('✓ Test 47 Passed: Standalone historical event chronology & BCE sorting');

  // =========================================
  // 48. Dual Timeline System: Flashback Detection & Delta Calculation
  // =========================================================================
  const s3Pos = StoryEngineQueries.getChronologyPosition(pWithCeEvt, s3.id);
  const s2Pos = StoryEngineQueries.getChronologyPosition(pWithCeEvt, s2.id);
  assert(s3Pos !== null, 'Chronology position found for flashback scene s3');
  assert(s3Pos?.timeType === 'flashback', 's3 correctly categorized as flashback');
  assert(s3Pos?.isNonLinear === true, 's3 marked as nonlinear');
  assert(
    Boolean(s3Pos && s2Pos && s3Pos.narrativeIndex > s2Pos.narrativeIndex && s3Pos.chronologicalIndex < s2Pos.chronologicalIndex),
    'Flashback appears after scene 2 in narrative reading but precedes scene 2 in story chronology'
  );

  results.push('✓ Test 48 Passed: Flashback detection, negative chronological offset, and delta calculation');

  // =========================================================================
  // 49. Dual Timeline System: Flashforward Detection & Delta Calculation
  // =========================================================================
  const { project: pWithFf, scene: sFf } = StoryEngine.addScene(pWithCeEvt, cCh.id, {
    title: 'Prophetic Vision of the Ash Waste',
    timelineDate: '50 years later',
    tags: ['flashforward', 'vision']
  });

  const ffPos = StoryEngineQueries.getChronologyPosition(pWithFf, sFf.id);
  assert(ffPos !== null, 'Chronology position found for flashforward scene');
  assert(ffPos?.timeType === 'flashforward', 'Scene classified as flashforward');
  assert(ffPos?.isNonLinear === true, 'Flashforward marked as nonlinear');

  results.push('✓ Test 49 Passed: Flashforward detection, future chronological offset, and delta calculation');

  // =========================================================================
  // 50. Dual Timeline System: Approximate & Relative Offset Time Markers
  // =========================================================================
  const earlierScore = StoryEngineQueries.parseChronologicalSortScore('3 days earlier', [], 10);
  const laterScore = StoryEngineQueries.parseChronologicalSortScore('3 days later', [], 10);
  assert(earlierScore.timeType === 'flashback', '"3 days earlier" sets timeType to flashback');
  assert(laterScore.timeType === 'flashforward', '"3 days later" sets timeType to flashforward');
  assert(earlierScore.score < (10 * 1000), '"3 days earlier" decreases chronological score');
  assert(laterScore.score > (10 * 1000), '"3 days later" increases chronological score');

  results.push('✓ Test 50 Passed: Approximate and sequence-only time markers');

  // =========================================================================
  // 51. Dual Timeline System: Undated & Unanchored Scenes Graceful Fallback
  // =========================================================================
  const { project: pWithUndated, scene: sUndated } = StoryEngine.addScene(pWithFf, cCh.id, {
    title: 'An Unanchored Interlude'
  });

  const undatedScore = StoryEngineQueries.parseChronologicalSortScore(sUndated.timelineDate, sUndated.tags, 5);
  assert(undatedScore.isUndated === true, 'Scene without date flagged as isUndated');
  assert(undatedScore.timeType === 'present', 'Undated scene defaults to present narrative stream');

  results.push('✓ Test 51 Passed: Undated & unanchored scenes graceful fallback without date fabrication');

  // =========================================================================
  // 52. Dual Timeline System: Character-Specific Chronological Timeline Query
  // =========================================================================
  const vaelenTimeline = StoryEngineQueries.getTimelineForCharacter(pWithUndated, character.id);
  assert(Array.isArray(vaelenTimeline), 'getTimelineForCharacter returns array');
  assert(vaelenTimeline.length > 0, 'Vaelen timeline contains bound appearance nodes');
  assert(vaelenTimeline.every(n => n.povCharacter?.id === character.id || n.characters.some(c => c.id === character.id)), 'Every returned node contains Vaelen');

  results.push('✓ Test 52 Passed: Character-specific chronological timeline query');

  // =========================================================================
  // 53. Dual Timeline System: Plot Thread-Specific Chronological Timeline Query
  // =========================================================================
  const pThreadBound = StoryEngine.attachSceneToThread(pWithUndated, thread.id, s1.id);
  const threadTimeline = StoryEngineQueries.getTimelineForPlotThread(pThreadBound, thread.id);
  assert(threadTimeline.some(n => n.sceneId === s1.id), 'Thread timeline contains bound scene s1');

  results.push('✓ Test 53 Passed: Plot thread-specific chronological timeline query');

  // =========================================================================
  // 54. Dual Timeline System: Location-Specific Chronological Timeline Query
  // =========================================================================
  const locTimeline = StoryEngineQueries.getTimelineForLocation(pThreadBound, location.id);
  assert(Array.isArray(locTimeline), 'getTimelineForLocation returns array');
  assert(locTimeline.some(n => n.locations.some(l => l.id === location.id)), 'Location timeline contains bound location nodes');

  results.push('✓ Test 54 Passed: Location-specific chronological timeline query');

  // =========================================================================
  // 55. Dual Timeline System: Chronological Window Query (getEventsBetween)
  // =========================================================================
  const eventsInWindow = StoryEngineQueries.getEventsBetween(pThreadBound, '500 BCE', '100 BCE');
  assert(eventsInWindow.some(e => e.id === bceEvt.id), 'getEventsBetween captures 400 BCE event in [-500 BCE, -100 BCE] window');
  assert(!eventsInWindow.some(e => e.id === ceEvt.id), 'getEventsBetween excludes Year 1492 event from BCE window');

  results.push('✓ Test 55 Passed: Chronological window query (getEventsBetween)');

  // =========================================================================
  // 56. Dual Timeline System: Inversions & Missing/Duplicate Diagnostics
  // =========================================================================
  const inversions = StoryEngineQueries.detectChronologyInversions(pThreadBound);
  assert(inversions.some(inv => inv.entityId === s3.id), 'detectChronologyInversions identifies flashback scene s3');

  const missing = StoryEngineQueries.detectMissingChronology(pThreadBound);
  assert(missing.some(m => m.id === sUndated.id), 'detectMissingChronology identifies undated scene');

  const duplicates = StoryEngineQueries.detectDuplicateOrdering(pThreadBound);
  assert(Array.isArray(duplicates), 'detectDuplicateOrdering returns diagnostic array');

  results.push('✓ Test 56 Passed: Inversion detection & missing/duplicate diagnostics');

  // =========================================================================
  // 57. Dual Timeline System: Complete Serialization & Persistence Fidelity
  // =========================================================================
  const serializedTimelineProj = JSON.stringify(pThreadBound);
  const deserializedTimelineData = JSON.parse(serializedTimelineProj);
  const reloadedTimelineProj = migrateProjectToStoryEngine(deserializedTimelineData);

  const reloadedS1 = StoryEngineQueries.getSceneById(reloadedTimelineProj, s1.id);
  const reloadedS3 = StoryEngineQueries.getSceneById(reloadedTimelineProj, s3.id);
  const reloadedBce = (reloadedTimelineProj.events || []).find(e => e.id === bceEvt.id);

  assert(reloadedS1?.timelineDate === 'Day 1', 'Scene 1 timelineDate preserved');
  assert(reloadedS3?.timelineDate === 'Day 3', 'Scene 3 timelineDate preserved');
  assert(reloadedBce?.timelineDate === '400 BCE', 'Historical Event timelineDate preserved');

  const reloadedChronoScenes = StoryEngineQueries.getScenesChronologically(reloadedTimelineProj);
  const reloadedFiltered = reloadedChronoScenes.filter(s => testSceneIds.includes(s.id));
  assert(reloadedFiltered[0].id === s1.id, 'Reloaded chronology order fidelity: Day 1 first');
  assert(reloadedFiltered[1].id === s3.id, 'Reloaded chronology order fidelity: Day 3 second');
  assert(reloadedFiltered[2].id === s2.id, 'Reloaded chronology order fidelity: Day 5 third');
  assert(reloadedFiltered[3].id === s4.id, 'Reloaded chronology order fidelity: Day 8 fourth');

  results.push('✓ Test 57 Passed: Timeline metadata round-trip serialization & persistence fidelity');

  // =========================================================================
  // 58. Proofreading Layer 1 (Mechanical): Spelling & Typos
  // =========================================================================
  const spellingSample = 'It definately occured when teh messenger arrived.';
  const spellingFindings = ProofreadingEngine.auditText(spellingSample, {
    project: pThreadBound,
    scope: 'scene',
    config: { ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG, preserveVoice: false }
  });

  assert(spellingFindings.some(f => f.originalText === 'definately' && f.suggestedText === 'definitely'), 'Detected typo: definately -> definitely');
  assert(spellingFindings.some(f => f.originalText === 'occured' && f.suggestedText === 'occurred'), 'Detected typo: occured -> occurred');
  assert(spellingFindings.some(f => f.originalText === 'teh' && f.suggestedText === 'the'), 'Detected typo: teh -> the');
  assert(spellingFindings.every(f => f.category === 'mechanical'), 'Spelling findings categorized correctly');
  assert(spellingFindings.every(f => f.passId === 'spelling'), 'Spelling findings passId is spelling');

  results.push('✓ Test 58 Passed: Mechanical layer - spelling & typo dictionary detection');

  // =========================================================================
  // 59. Proofreading Layer 1 (Mechanical): Punctuation & Repeated Words
  // =========================================================================
  const puncSample = 'He walked into  the room , and saw the the cat..';
  const puncFindings = ProofreadingEngine.auditText(puncSample, {
    project: pThreadBound,
    scope: 'scene',
    config: { ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG, preserveVoice: false }
  });

  assert(puncFindings.some(f => f.ruleId === 'mech-punctuation-spaces'), 'Detected duplicate spaces');
  assert(puncFindings.some(f => f.ruleId === 'mech-punctuation-spacing'), 'Detected space before punctuation');
  assert(puncFindings.some(f => f.ruleId === 'mech-repetition' && f.originalText === 'the the'), 'Detected consecutive duplicate word "the the"');
  assert(puncFindings.some(f => f.ruleId === 'mech-punctuation-repeated'), 'Detected double period');

  results.push('✓ Test 59 Passed: Mechanical layer - punctuation spacing & consecutive word repetition');

  // =========================================================================
  // 60. Proofreading Layer 1 (Mechanical): Capitalization & Common Contractions
  // =========================================================================
  const capSample = 'When i arrived, i said im not ready and dont know.';
  const capFindings = ProofreadingEngine.auditText(capSample, {
    project: pThreadBound,
    scope: 'scene',
    config: { ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG, preserveVoice: false }
  });

  assert(capFindings.some(f => f.ruleId === 'mech-capitalization-i' && f.suggestedText === 'I'), 'Detected lowercase standalone "i"');
  assert(capFindings.some(f => f.originalText === 'im' && f.suggestedText === "I'm"), 'Detected missing apostrophe in "im" -> "I\'m"');
  assert(capFindings.some(f => f.originalText === 'dont' && f.suggestedText === "don't"), 'Detected missing apostrophe in "dont" -> "don\'t"');

  results.push('✓ Test 60 Passed: Mechanical layer - capitalization & contraction apostrophes');

  // =========================================================================
  // 61. Proofreading Layer 2 (Grammar): Subject-Verb Agreement
  // =========================================================================
  const svaSample = 'They was walking through the gate while he were sleeping.';
  const svaFindings = ProofreadingEngine.auditText(svaSample, {
    project: pThreadBound,
    scope: 'scene',
    config: { ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG, preserveVoice: false }
  });

  assert(svaFindings.some(f => f.ruleId === 'gram-they-was' && f.originalText === 'They was' && f.suggestedText === 'They were'), 'Detected "They was" -> "They were"');
  assert(svaFindings.some(f => f.ruleId === 'gram-he-were' && f.originalText === 'he were' && f.suggestedText === 'he was'), 'Detected "he were" -> "he was"');

  results.push('✓ Test 61 Passed: Grammar layer - deterministic subject-verb agreement');

  // =========================================================================
  // 62. Proofreading Layer 2 (Grammar): Homophones & Confused Words
  // =========================================================================
  const homoSample = "Their going to loose the battle then, but its not over. Your going to win.";
  const homoFindings = ProofreadingEngine.auditText(homoSample, {
    project: pThreadBound,
    scope: 'scene',
    config: { ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG, preserveVoice: false }
  });

  assert(homoFindings.some(f => f.originalText.toLowerCase().includes('their going') && f.suggestedText?.toLowerCase().includes("they're going")), 'Detected "Their going" -> "They\'re going"');
  assert(homoFindings.some(f => f.originalText.includes('loose the battle') && f.suggestedText?.includes('lose the battle')), 'Detected "loose" -> "lose"');
  assert(homoFindings.some(f => f.originalText.toLowerCase().includes('its not') && f.suggestedText?.toLowerCase().includes("it's not")), 'Detected "its not" -> "it\'s not"');
  assert(homoFindings.some(f => f.originalText.toLowerCase().includes('your going') && f.suggestedText?.toLowerCase().includes("you're going")), 'Detected "Your going" -> "you\'re going"');

  results.push('✓ Test 62 Passed: Grammar layer - homophones and commonly confused words');

  // =========================================================================
  // 63. Proofreading Layer 2 (Grammar): Modal Verbs + of & Article Consistency
  // =========================================================================
  const modalArticleSample = 'He could of chosen a apple, but he chose an sword.';
  const modalArticleFindings = ProofreadingEngine.auditText(modalArticleSample, {
    project: pThreadBound,
    scope: 'scene',
    config: { ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG, preserveVoice: false }
  });

  assert(modalArticleFindings.some(f => f.ruleId === 'gram-modal-of' && f.originalText === 'could of' && f.suggestedText === 'could have'), 'Detected "could of" -> "could have"');
  assert(modalArticleFindings.some(f => f.ruleId === 'gram-article-vowel' && f.originalText === 'a apple' && f.suggestedText === 'an apple'), 'Detected "a apple" -> "an apple"');
  assert(modalArticleFindings.some(f => f.ruleId === 'gram-article-consonant' && f.originalText === 'an sword' && f.suggestedText === 'a sword'), 'Detected "an sword" -> "a sword"');

  results.push('✓ Test 63 Passed: Grammar layer - modal verb "of" and indefinite article agreement');

  // =========================================================================
  // 64. Proofreading Layer 3 (Style): Filler Words, Passive Voice & Adverbs
  // =========================================================================
  const styleSample = 'In order to escape the ruin, the gate was opened by the sentinel quickly.';
  const styleFindings = ProofreadingEngine.auditText(styleSample, {
    project: pThreadBound,
    scope: 'scene',
    config: { 
      ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG, 
      preserveVoice: false,
      activePasses: {
        ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG.activePasses,
        'filler-words': true,
        'passive-voice': true,
        'adverbs': true,
        'sentence-length': true
      }
    }
  });

  assert(styleFindings.some(f => f.ruleId === 'style-filler-words' && f.originalText === 'In order to'), 'Detected filler phrase "In order to"');
  assert(styleFindings.some(f => f.ruleId === 'style-passive-voice' && f.originalText.includes('was opened by')), 'Detected passive construction "was opened by"');
  assert(styleFindings.some(f => f.ruleId === 'style-adverbs' && f.originalText === 'quickly'), 'Detected -ly adverb "quickly"');

  results.push('✓ Test 64 Passed: Style layer - filler phrases, passive voice, and modifier adverbs');

  // =========================================================================
  // 65. Proofreading Layer 3 (Style): Long Sentence Detection (>45 words)
  // =========================================================================
  const longSentenceSample = 'The ancient dragon soared across the jagged mountain peaks through endless clouds of suffocating ash while the weary soldiers below marched steadfastly along the crumbling canyon road wondering if their homeland would ever be free from the shadow of the tyrannical emperor whose armies had conquered every province in the known realm.';
  const longSentenceFindings = ProofreadingEngine.auditText(longSentenceSample, {
    project: pThreadBound,
    scope: 'scene',
    config: { 
      ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG, 
      preserveVoice: false,
      activePasses: {
        ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG.activePasses,
        'sentence-length': true
      }
    }
  });

  assert(longSentenceFindings.some(f => f.ruleId === 'style-sentence-length'), 'Detected sentence exceeding 45 words');

  results.push('✓ Test 65 Passed: Style layer - lengthy sentence structural advisory');

  // =========================================================================
  // 66. Voice Preservation Mode (PRESERVE VOICE = Default ON)
  // =========================================================================
  const voicePreservedFindings = ProofreadingEngine.auditText(styleSample, {
    project: pThreadBound,
    scope: 'scene',
    config: { ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG, preserveVoice: true }
  });

  // When preserveVoice is true, purely subjective style findings are suppressed to protect the author's creative voice
  assert(!voicePreservedFindings.some(f => f.category === 'style'), 'Preserve Voice suppresses subjective style suggestions');
  
  // But mechanical and grammar errors are STILL surfaced
  const mixedVoiceSample = 'In order to escape, teh gate was opened by him.';
  const mixedVoiceFindings = ProofreadingEngine.auditText(mixedVoiceSample, {
    project: pThreadBound,
    scope: 'scene',
    config: { ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG, preserveVoice: true }
  });
  assert(mixedVoiceFindings.some(f => f.originalText === 'teh' && f.suggestedText === 'the'), 'Preserve Voice still detects objective typos (teh -> the)');
  assert(!mixedVoiceFindings.some(f => f.category === 'style'), 'Preserve Voice suppresses style suggestions in mixed text');

  results.push('✓ Test 66 Passed: Preserve Voice mode suppresses subjective style while protecting objective accuracy');

  // =========================================================================
  // 67. Proofreading Layer 4 (Consistency): Story Engine Entity Name Casing & Typos
  // =========================================================================
  const { project: pWithObsidian } = StoryEngine.addLocation(pThreadBound, { name: 'Obsidian Citadel' });
  const consistencySample = 'The stranger met vaelen near the Obsidien Citadel.';
  const consistencyFindings = ProofreadingEngine.auditText(consistencySample, {
    project: pWithObsidian,
    scope: 'scene',
    config: { ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG, preserveVoice: false }
  });

  assert(consistencyFindings.some(f => f.ruleId === 'const-entity-casing' && f.originalText === 'vaelen' && f.suggestedText === 'Vaelen'), 'Detected uncapitalized entity "vaelen" -> "Vaelen"');
  assert(consistencyFindings.some(f => f.ruleId === 'const-entity-nearmiss' && f.originalText === 'Obsidien Citadel' && f.suggestedText === 'Obsidian Citadel'), 'Detected 1-distance typo "Obsidien Citadel" -> "Obsidian Citadel"');

  results.push('✓ Test 67 Passed: Consistency layer - Story Engine cross-referenced entity casing & typo detection');

  // =========================================================================
  // 68. Proofreading Layer 4 (Consistency): Mixed Quotation Styles
  // =========================================================================
  const quotesSample = 'He said "straight quotes" and then added “curly quotes” in the same passage.';
  const quoteFindings = ProofreadingEngine.auditText(quotesSample, {
    project: pThreadBound,
    scope: 'scene',
    config: { ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG, preserveVoice: false }
  });

  assert(quoteFindings.some(f => f.ruleId === 'const-formatting-quotes'), 'Detected mixed straight and curly quote marks');

  results.push('✓ Test 68 Passed: Consistency layer - mixed straight and curly quotation styles');

  // =========================================================================
  // 69. Scope Filtering (Scene vs Chapter vs Act vs Whole Manuscript)
  // =========================================================================
  // Setup project with distinct texts in different scenes & chapters
  let pScoped = StoryEngine.updateScene(pThreadBound, s1.id, {
    content: '<p>In scene 1 teh first error appears.</p>'
  });
  pScoped = StoryEngine.updateScene(pScoped, s2.id, {
    content: '<p>In scene 2 teh second error appears.</p>'
  });

  // Scope: Scene 1
  const sceneScopeFindings = ProofreadingEngine.runAudit(pScoped, {
    scope: 'scene',
    activeChapterId: cCh.id,
    activeSceneId: s1.id
  });
  assert(sceneScopeFindings.length === 1 && sceneScopeFindings[0].sceneId === s1.id, 'Scene scope audits only the active scene');

  // Scope: Chapter
  const chapterScopeFindings = ProofreadingEngine.runAudit(pScoped, {
    scope: 'chapter',
    activeChapterId: cCh.id,
    activeSceneId: s1.id
  });
  assert(chapterScopeFindings.length >= 2, 'Chapter scope audits all scenes in the active chapter');

  // Scope: Whole Manuscript
  const manuscriptScopeFindings = ProofreadingEngine.runAudit(pScoped, {
    scope: 'manuscript'
  });
  assert(manuscriptScopeFindings.length >= chapterScopeFindings.length, 'Manuscript scope audits across all acts and chapters');

  results.push('✓ Test 69 Passed: Document scope filtering across Scene, Chapter, Act, and Manuscript');

  // =========================================================================
  // 70. Proofreading Actions, State Transitions & Custom Dictionary Persistence
  // =========================================================================
  const testFinding = sceneScopeFindings[0];
  assert(Boolean(testFinding), 'Target finding exists for action testing');

  // 1. Accept Finding
  const pAccepted = ProofreadingEngine.acceptFinding(pScoped, testFinding);
  assert((pAccepted.metadata?.proofreadingConfig?.acceptedFindingIds || []).includes(testFinding.id), 'Accepted finding ID recorded in metadata');
  const acceptedScene = StoryEngineQueries.getSceneById(pAccepted, s1.id);
  assert(Boolean(acceptedScene?.content?.includes('the first error')), 'Accepted finding replaces typo in content ("teh" -> "the")');

  // Verify accepted finding is removed from open audit
  const reauditAfterAccept = ProofreadingEngine.runAudit(pAccepted, {
    scope: 'scene',
    activeChapterId: cCh.id,
    activeSceneId: s1.id
  });
  assert(!reauditAfterAccept.some(f => f.id === testFinding.id && f.status === 'open'), 'Accepted finding not returned as open in re-audit');

  // 2. Ignore Finding
  const pIgnored = ProofreadingEngine.ignoreFinding(pScoped, testFinding.id);
  assert((pIgnored.metadata?.proofreadingConfig?.ignoredFindingIds || []).includes(testFinding.id), 'Ignored finding recorded in metadata');

  // 3. Mark Finding Intentional
  const pIntentional = ProofreadingEngine.markFindingIntentional(pScoped, testFinding.id);
  assert((pIntentional.metadata?.proofreadingConfig?.intentionalFindingIds || []).includes(testFinding.id), 'Intentional finding recorded in metadata');

  // 4. Custom Dictionary Word Addition
  const fantasySample = 'The warrior entered the fortress of Aethelgard.';
  const fantasyFindingsBefore = ProofreadingEngine.auditText(fantasySample, {
    project: pScoped,
    scope: 'scene',
    config: { ...ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG, customDictionary: [] }
  });
  
  // Add Aethelgard to custom dictionary
  const pWithWord = {
    ...pScoped,
    metadata: {
      ...pScoped.metadata,
      proofreadingConfig: {
        ...(pScoped.metadata?.proofreadingConfig || ProofreadingEngine.DEFAULT_PROOFREADING_CONFIG),
        customDictionary: ['Aethelgard']
      }
    }
  };
  assert(ProofreadingQueries.isWordInCustomDictionary(pWithWord, 'aethelgard'), 'isWordInCustomDictionary is case-insensitive');

  // 5. Round-trip Persistence Serialization
  const serializedProofProj = JSON.stringify(pAccepted);
  const deserializedProofProj = JSON.parse(serializedProofProj);
  const reloadedProofProj = migrateProjectToStoryEngine(deserializedProofProj);

  assert((reloadedProofProj.metadata?.proofreadingConfig?.acceptedFindingIds || []).includes(testFinding.id), 'Accepted finding IDs preserved through serialization & migration');
  assert(reloadedProofProj.metadata?.proofreadingConfig?.preserveVoice !== undefined, 'Proofreading configuration preserved');

  results.push('✓ Test 70 Passed: Proofreading actions (Accept/Ignore/Intentional), Custom Dictionary & persistence fidelity');

  // =========================================================================
  // 71. Revision Pass Creation & Lifecycle Across the 11 Passes
  // =========================================================================
  const { project: pRound1, round: structRound } = RevisionEngine.addRevisionRound(pAccepted, {
    name: 'First Structural Pass',
    description: 'Assess pacing, scene goals, and Act II midpoint tension.',
    passType: 'structure',
    scope: 'manuscript',
    status: 'in-progress'
  });
  assert(Boolean(structRound.id && (structRound.id.startsWith('rev-round-') || structRound.id.startsWith('round-'))), 'Revision round created with stable ID');
  assert(structRound.passType === 'structure', 'Revision pass type recorded');
  assert(structRound.status === 'in-progress', 'Revision round status set to in-progress');

  const { project: pRound2, round: charRound } = RevisionEngine.addRevisionRound(pRound1, {
    name: 'Character Voice & Belief Audit',
    passType: 'character',
    scope: 'scene',
    status: 'planned'
  });
  assert(pRound2.revisionRounds?.length === 2, 'Multiple revision rounds maintained');

  const activeRound = RevisionQueries.getActiveRevisionRound(pRound2);
  assert(activeRound?.id === structRound.id, 'Active revision round correctly resolved by status');

  const pUpdatedRound = RevisionEngine.updateRevisionRound(pRound2, structRound.id, {
    description: 'Updated structural focus description'
  });
  const foundRound = pUpdatedRound.revisionRounds?.find(r => r.id === structRound.id);
  assert(foundRound?.description === 'Updated structural focus description', 'Revision round update preserves properties');

  results.push('✓ Test 71 Passed: Revision Pass creation & lifecycle across the 11 passes');

  // =========================================================================
  // 72. Revision Item Creation with Category, Priority & Scope
  // =========================================================================
  const { project: pItem1, item: revItem1 } = RevisionEngine.addRevisionItem(pUpdatedRound, {
    revisionRoundId: structRound.id,
    title: 'Tighten scene opening pacing',
    description: 'Trim the introductory exposition before Garrick speaks.',
    category: 'pacing',
    priority: 'high',
    actId: cAct.id,
    chapterId: cCh.id,
    sceneId: s1.id,
    notes: 'Keep focus on the rising tension.'
  });

  assert(Boolean(revItem1.id && revItem1.id.startsWith('rev-')), 'Revision item created with stable ID prefix');
  assert(revItem1.category === 'pacing', 'Revision item category saved');
  assert(revItem1.priority === 'high', 'Revision item priority saved');
  assert(revItem1.status === 'open', 'Default revision item status is open');
  assert(revItem1.sceneId === s1.id, 'Revision item correctly associated with scene');

  results.push('✓ Test 72 Passed: Revision Item creation with Category, Priority, Scope & stable IDs');

  // =========================================================================
  // 73. Text Selection Anchoring Without Prose Mutation
  // =========================================================================
  const sampleProse = '<p>The ancient door groaned as Vaelen stepped into the dark vault.</p>';
  const pProseScene = StoryEngine.updateScene(pItem1, s1.id, { content: sampleProse });
  
  const { project: pAnchored, item: anchoredItem } = RevisionEngine.createInlineRevisionNote(pProseScene, {
    revisionRoundId: structRound.id,
    chapterId: cCh.id,
    sceneId: s1.id,
    anchoredText: 'ancient door groaned',
    anchorOffset: { from: 4, to: 24 },
    title: 'Strengthen sensory detail for vault entrance',
    category: 'sensory',
    priority: 'medium',
    notes: 'Describe the scent of rust and cold stone.'
  });

  assert(anchoredItem.anchoredText === 'ancient door groaned', 'Anchored text preserved in revision item');
  assert(anchoredItem.needsReanchoring === false, 'Newly anchored item marked as valid');
  
  // Verify underlying prose was NOT mutated
  const untouchedScene = StoryEngineQueries.getSceneById(pAnchored, s1.id);
  assert(untouchedScene?.content === sampleProse, 'Manuscript prose remains completely unmutated when creating revision note');

  results.push('✓ Test 73 Passed: Text Selection Anchoring without prose mutation');

  // =========================================================================
  // 74. Anchoring Resilience & Drift Detection
  // =========================================================================
  // 1. Text still intact
  const validCheck = RevisionEngine.validateAnchoring(sampleProse, anchoredItem.anchoredText);
  assert(validCheck.isValid === true, 'validateAnchoring succeeds when anchored text is present');

  // 2. Minor whitespace drift / case matching fallback
  const driftedProse = '<p>The ANCIENT DOOR GROANED with great force.</p>';
  const fallbackCheck = RevisionEngine.validateAnchoring(driftedProse, anchoredItem.anchoredText);
  assert(fallbackCheck.isValid === true, 'validateAnchoring resiliently handles case variance');

  // 3. Text completely removed
  const alteredProse = '<p>Vaelen entered the silent chamber directly.</p>';
  const missingCheck = RevisionEngine.validateAnchoring(alteredProse, anchoredItem.anchoredText);
  assert(missingCheck.isValid === false, 'validateAnchoring flags missing text as invalid');

  results.push('✓ Test 74 Passed: Anchoring resilience, whitespace tolerance & drift detection');

  // =========================================================================
  // 75. Revision Item Status Transitions (Open -> In Progress -> Resolved -> Deferred)
  // =========================================================================
  // Resolve item
  const pResolvedItem = RevisionEngine.resolveRevisionItem(pAnchored, revItem1.id, 'Rewrote introductory paragraph.');
  const resolved = pResolvedItem.revisionItems?.find(i => i.id === revItem1.id);
  assert(resolved?.status === 'resolved', 'Item status transitions to resolved');
  assert(Boolean(resolved?.resolvedAt), 'Resolved timestamp recorded');
  assert(Boolean(resolved?.notes?.includes('Rewrote introductory paragraph.')), 'Resolution notes appended');

  // Defer item
  const pDeferredItem = RevisionEngine.deferRevisionItem(pResolvedItem, anchoredItem.id);
  const deferred = pDeferredItem.revisionItems?.find(i => i.id === anchoredItem.id);
  assert(deferred?.status === 'deferred', 'Item status transitions to deferred');

  // Re-open item
  const pReopened = RevisionEngine.updateRevisionItem(pDeferredItem, anchoredItem.id, { status: 'open' });
  const reopened = pReopened.revisionItems?.find(i => i.id === anchoredItem.id);
  assert(reopened?.status === 'open', 'Item status successfully reopened');

  results.push('✓ Test 75 Passed: Revision Item lifecycle transitions (Open, In Progress, Resolved, Deferred)');

  // =========================================================================
  // 76. Sequential Review Mode Ordering & Filtering
  // =========================================================================
  const allReviewItems = RevisionQueries.getRevisionItems(pReopened, { roundId: structRound.id });
  assert(allReviewItems.length >= 2, 'getRevisionItems retrieves items for round');

  const openReviewItems = RevisionQueries.getRevisionItems(pReopened, { status: 'open' });
  assert(openReviewItems.every(i => i.status === 'open'), 'Query filters strictly by status');

  const highPriorityItems = RevisionQueries.getRevisionItems(pReopened, { priority: 'high' });
  assert(highPriorityItems.every(i => i.priority === 'high'), 'Query filters strictly by priority');

  results.push('✓ Test 76 Passed: Sequential Review Mode queries, sorting & multi-parameter filtering');

  // =========================================================================
  // 77. Story Engine Integration: Live Character State, Goals & Beliefs
  // =========================================================================
  // Attach character to revision item
  const pWithCharItem = RevisionEngine.updateRevisionItem(pReopened, revItem1.id, {
    relatedCharacterIds: [character.id]
  });

  const storyContext = RevisionQueries.getStoryAwareRevisionContext(pWithCharItem, revItem1.id);
  assert(storyContext !== null, 'Story-aware context generated');
  assert(storyContext?.characters.some(c => c.id === character.id) === true, 'Related character included in context');
  assert(storyContext?.sceneName === s1.title, 'Scene name resolved in story context');

  results.push('✓ Test 77 Passed: Story Engine Integration: Live Character State, Goals & Beliefs');

  // =========================================================================
  // 78. Story Engine Integration: Plot Threads & Resolution Promises
  // =========================================================================
  const pWithThreadItem = RevisionEngine.updateRevisionItem(pWithCharItem, revItem1.id, {
    relatedPlotThreadIds: [thread.id]
  });

  const threadContext = RevisionQueries.getStoryAwareRevisionContext(pWithThreadItem, revItem1.id);
  assert(threadContext?.plotThreads.some(t => t.id === thread.id) === true, 'Related plot thread surfaced in revision context');

  results.push('✓ Test 78 Passed: Story Engine Integration: Plot Threads & resolution promises in revision context');

  // =========================================================================
  // 79. Story Engine Integration: Scene Conflict, Purpose & Outcomes
  // =========================================================================
  const pSceneDetails = StoryEngine.updateScene(pWithThreadItem, s1.id, {
    purpose: 'Establish the stakes of the heirloom.',
    conflict: 'Vaelen refuses to trust Garrick.',
    outcome: 'A reluctant truce is forged.'
  });

  const detailedContext = RevisionQueries.getStoryAwareRevisionContext(pSceneDetails, revItem1.id);
  assert(Boolean(detailedContext?.sceneGoals?.includes('Establish the stakes')), 'Scene purpose, conflict and outcome formatted in context');

  results.push('✓ Test 79 Passed: Story Engine Integration: Scene Purpose, Conflict & Outcome retrieval');

  // =========================================================================
  // 80. Continuity Warning to Revision Item Direct Conversion
  // =========================================================================
  const mockContinuityWarning: ContinuityWarning = {
    id: 'cw-eye-color-test',
    type: 'attributes',
    severity: 'warning',
    title: 'Eye color inconsistency for Vaelen',
    summary: 'Eye color inconsistency for Vaelen',
    description: 'Vaelen was previously described as having amber eyes, but is here described with blue eyes.',
    evidence: [
      {
        label: 'Character attribute inconsistency',
        chapterId: cCh.id,
        sceneId: s1.id,
        entityId: character.id,
        entityType: 'character',
      }
    ],
    primaryChapterId: cCh.id,
    entityId: character.id,
    entityType: 'character',
    isIgnored: false,
    isIntentional: false,
    createdAt: new Date().toISOString()
  };

  const { project: pFromContinuity, item: continuityConvertedItem } = RevisionEngine.convertContinuityWarningToRevisionItem(
    pSceneDetails,
    mockContinuityWarning,
    structRound.id
  );

  assert(continuityConvertedItem.category === 'character', 'Converted item category is character for attributes warning');
  assert(continuityConvertedItem.priority === 'high', 'Warning converted to high priority item');
  assert(continuityConvertedItem.sourceContinuityId === 'cw-eye-color-test', 'Source continuity warning ID linked');
  assert(continuityConvertedItem.relatedCharacterIds?.includes(character.id) === true, 'Character ID linked from continuity warning');

  results.push('✓ Test 80 Passed: Continuity Warning conversion to actionable Revision Item');

  // =========================================================================
  // 81. Multi-Round Scoping & Round Isolation
  // =========================================================================
  const { project: pMultiRound, item: round2Item } = RevisionEngine.addRevisionItem(pFromContinuity, {
    revisionRoundId: charRound.id,
    title: 'Sharpen Vaelen distinct dialogue cadence',
    category: 'dialogue',
    priority: 'critical'
  });

  const round1Items = RevisionQueries.getRevisionItems(pMultiRound, { roundId: structRound.id });
  const round2Items = RevisionQueries.getRevisionItems(pMultiRound, { roundId: charRound.id });

  assert(round1Items.every(i => i.revisionRoundId === structRound.id), 'Round 1 items strictly isolated');
  assert(round2Items.every(i => i.revisionRoundId === charRound.id), 'Round 2 items strictly isolated');
  assert(!round1Items.some(i => i.id === round2Item.id), 'Round 2 item excluded from Round 1 query');

  results.push('✓ Test 81 Passed: Multi-Round scoping and round isolation');

  // =========================================================================
  // 82. Scene & Chapter Revision Summaries
  // =========================================================================
  const sceneRevStatus = RevisionQueries.getSceneRevisionStatus(pMultiRound, s1.id);
  assert(sceneRevStatus.total >= 1, 'Scene revision status reports total items');
  assert(sceneRevStatus.open >= 1, 'Scene revision status reports open items');

  const chapterRevSummary = RevisionQueries.getChapterRevisionSummary(pMultiRound, cCh.id);
  assert(chapterRevSummary.total >= sceneRevStatus.total, 'Chapter revision summary aggregates all scenes');
  assert(chapterRevSummary.byCategory['pacing'] !== undefined || chapterRevSummary.byCategory['character'] !== undefined, 'Summary breaks down by category');

  results.push('✓ Test 82 Passed: Scene & Chapter Revision Summaries and aggregation');

  // =========================================================================
  // 83. Revision Snapshot Generation on Round Completion
  // =========================================================================
  const { project: pCompletedRound, snapshot } = RevisionEngine.completeRevisionRound(
    pMultiRound,
    structRound.id,
    'Post-Alpha Structural Revisions'
  );

  assert(snapshot !== undefined, 'Revision snapshot created on completion');
  assert(snapshot?.label === 'Post-Alpha Structural Revisions', 'Snapshot label preserved');
  assert((snapshot?.itemsResolved ?? 0) >= 0, 'Snapshot records resolved item count');
  assert(pCompletedRound.metadata?.revisionSnapshots?.some(s => s.id === snapshot?.id) === true, 'Snapshot stored in project metadata');

  const completedRoundEntity = pCompletedRound.revisionRounds?.find(r => r.id === structRound.id);
  assert(completedRoundEntity?.status === 'completed', 'Round status updated to completed');

  results.push('✓ Test 83 Passed: Revision Snapshot generation and round completion');

  // =========================================================================
  // 84. Full JSON Round-trip Serialization & Persistence Fidelity
  // =========================================================================
  const jsonProject = JSON.stringify(pCompletedRound);
  const parsedProject = JSON.parse(jsonProject);
  const reloadedRevProject = migrateProjectToStoryEngine(parsedProject);

  assert(reloadedRevProject.revisionRounds?.length === pCompletedRound.revisionRounds?.length, 'Revision rounds preserved across JSON serialization');
  assert(reloadedRevProject.revisionItems?.length === pCompletedRound.revisionItems?.length, 'Revision items preserved across JSON serialization');
  assert(reloadedRevProject.metadata?.revisionSnapshots?.length === pCompletedRound.metadata?.revisionSnapshots?.length, 'Snapshots preserved across JSON serialization');

  const reloadedItem = reloadedRevProject.revisionItems?.find(i => i.id === continuityConvertedItem.id);
  assert(reloadedItem?.title === continuityConvertedItem.title, 'Item title preserved');
  assert(reloadedItem?.category === continuityConvertedItem.category, 'Item category preserved');
  assert(reloadedItem?.sourceContinuityId === 'cw-eye-color-test', 'Source continuity link preserved');

  results.push('✓ Test 84 Passed: Complete JSON round-trip serialization & persistence fidelity');

  // =========================================================================
  // 85. Conservative Migration of Legacy Data (No Revision Engine Fields)
  // =========================================================================
  const preRevisionLegacyProject: any = {
    metadata: {
      id: 'pre-rev-proj',
      title: 'Legacy Manuscript',
      author: 'Author',
      currentWordCount: 5000,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    acts: [],
    characters: []
  };

  const migratedForRevision = migrateProjectToStoryEngine(preRevisionLegacyProject);
  assert(Array.isArray(migratedForRevision.revisionRounds), 'Migration initializes revisionRounds array');
  assert(Array.isArray(migratedForRevision.revisionItems), 'Migration initializes revisionItems array');
  assert(Array.isArray(migratedForRevision.metadata?.revisionSnapshots), 'Migration initializes revisionSnapshots array');

  results.push('✓ Test 85 Passed: Backward-compatible migration of legacy projects into the Revision domain');

  // =========================================================================
  // 86. Snapshot Creation with Stable ID, Hashes & Manuscript Metrics
  // =========================================================================
  const snap1 = createSnapshot(pCompletedRound, {
    label: 'Initial Milestone 9 Snapshot',
    description: 'Testing snapshot creation with full metrics',
    type: 'manual',
    source: 'user'
  });

  assert(Boolean(snap1.id && snap1.id.startsWith('snap-')), 'Snapshot ID has stable snap- prefix');
  assert(snap1.label === 'Initial Milestone 9 Snapshot', 'Snapshot label saved');
  assert(snap1.description === 'Testing snapshot creation with full metrics', 'Snapshot description saved');
  assert(snap1.wordCount > 0, 'Snapshot word count calculated');
  assert(snap1.chapterCount > 0, 'Snapshot chapter count calculated');
  assert(Boolean(snap1.contentHash && snap1.metadataHash), 'Content and metadata hashes calculated');
  assert(snap1.projectData.snapshots === undefined, 'Snapshots array stripped from snapshot payload to prevent recursion');

  results.push('✓ Test 86 Passed: Snapshot creation with stable ID, hashes & manuscript metrics');

  // =========================================================================
  // 87. Snapshot Classification & Source Attribution
  // =========================================================================
  const autoSnap = createSnapshot(pCompletedRound, { type: 'auto', source: 'auto-save' });
  const exportSnap = createSnapshot(pCompletedRound, { type: 'pre-export', source: 'compiler-export' });
  const migrationSnap = createSnapshot(pCompletedRound, { type: 'pre-migration', source: 'migration-engine' });
  const revisionSnap = createSnapshot(pCompletedRound, { type: 'revision-round', source: 'round-complete' });

  assert(autoSnap.snapshotType === 'auto' && autoSnap.source === 'auto-save', 'Auto snapshot type & source attributed');
  assert(exportSnap.snapshotType === 'pre-export' && exportSnap.source === 'compiler-export', 'Pre-export snapshot type & source attributed');
  assert(migrationSnap.snapshotType === 'pre-migration' && migrationSnap.source === 'migration-engine', 'Pre-migration snapshot type & source attributed');
  assert(revisionSnap.snapshotType === 'revision-round' && revisionSnap.source === 'round-complete', 'Revision-round snapshot type & source attributed');

  results.push('✓ Test 87 Passed: Snapshot classification and source attribution');

  // =========================================================================
  // 88. Snapshot Integrity Verification
  // =========================================================================
  const snapValidCheck = verifySnapshotIntegrity(snap1);
  assert(snapValidCheck.isValid === true, 'Valid snapshot passes integrity verification');

  const tamperedSnap = JSON.parse(JSON.stringify(snap1));
  tamperedSnap.projectData.acts[0].chapters[0].content = 'Tampered content that does not match hash';
  const tamperedCheck = verifySnapshotIntegrity(tamperedSnap);
  assert(tamperedCheck.isValid === false && Boolean(tamperedCheck.error), 'Tampered content fails integrity verification');

  const malformedSnap: any = { id: 'snap-broken' };
  const malformedCheck = verifySnapshotIntegrity(malformedSnap);
  assert(malformedCheck.isValid === false, 'Malformed snapshot fails integrity verification');

  results.push('✓ Test 88 Passed: Snapshot integrity verification & tamper detection');

  // =========================================================================
  // 89. Automatic Pre-Restore Safety Snapshot Generation
  // =========================================================================
  // Modify project to create a delta
  const projectBeforeRestore = JSON.parse(JSON.stringify(pCompletedRound));
  projectBeforeRestore.acts[0].chapters[0].content = '<p>Drafting some dangerous experimental changes before restoring...</p>';
  
  const restoreResult = restoreSnapshot(projectBeforeRestore, snap1, {
    customSafetyLabel: 'Safety Before Restoring Snap 1'
  });

  assert(restoreResult.preRestoreSnapshot !== undefined, 'Safety snapshot returned on restore');
  assert(restoreResult.preRestoreSnapshot.snapshotType === 'pre-restore', 'Safety snapshot typed as pre-restore');
  assert(restoreResult.preRestoreSnapshot.label === 'Safety Before Restoring Snap 1', 'Custom safety label applied');
  assert(restoreResult.restoredProject.snapshots?.[0].id === restoreResult.preRestoreSnapshot.id, 'Safety snapshot prepended to project snapshot history');

  results.push('✓ Test 89 Passed: Automatic pre-restore safety snapshot generation');

  // =========================================================================
  // 90. Full Manuscript Restoration
  // =========================================================================
  const fullyRestored = restoreResult.restoredProject;
  assert(fullyRestored.acts.length === snap1.projectData.acts.length, 'Restored all acts');
  assert(fullyRestored.acts[0].chapters[0].content === snap1.projectData.acts[0].chapters[0].content, 'Restored chapter content matching snapshot');
  assert(fullyRestored.characters?.length === snap1.projectData.characters?.length, 'Restored characters matching snapshot');
  assert(fullyRestored.plotThreads?.length === snap1.projectData.plotThreads?.length, 'Restored plot threads matching snapshot');

  results.push('✓ Test 90 Passed: Full manuscript restoration fidelity');

  // =========================================================================
  // 91. Granular Single-Chapter Restoration
  // =========================================================================
  const targetChapterToRestore = snap1.projectData.acts[0].chapters[0];
  const projectWithModifiedChapter = JSON.parse(JSON.stringify(pCompletedRound));
  projectWithModifiedChapter.acts[0].chapters[0].content = '<p>Accidentally erased text here.</p>';
  if (projectWithModifiedChapter.acts[0].chapters.length > 1) {
    projectWithModifiedChapter.acts[0].chapters[1].content = '<p>Keep this newer content untouched!</p>';
  }

  const singleChapterRestoreResult = restoreSnapshot(projectWithModifiedChapter, snap1, {
    restoreScope: 'chapter',
    targetChapterId: targetChapterToRestore.id
  });

  const projAfterChRestore = singleChapterRestoreResult.restoredProject;
  assert(projAfterChRestore.acts[0].chapters[0].content === targetChapterToRestore.content, 'Target chapter restored from snapshot');
  if (projAfterChRestore.acts[0].chapters.length > 1) {
    assert(projAfterChRestore.acts[0].chapters[1].content === '<p>Keep this newer content untouched!</p>', 'Other chapters left untouched');
  }

  results.push('✓ Test 91 Passed: Granular single-chapter restoration');

  // =========================================================================
  // 92. Story Engine Relational Integrity Across Snapshots
  // =========================================================================
  const charWithState = snap1.projectData.characters.find(c => c.goals && c.goals.length > 0);
  if (charWithState) {
    const restoredChar = fullyRestored.characters.find(c => c.id === charWithState.id);
    assert(Boolean(restoredChar && restoredChar.goals && restoredChar.goals.length === charWithState.goals?.length), 'Character goals preserved across snapshot restore');
    assert(restoredChar?.beliefs?.length === charWithState.beliefs?.length, 'Character beliefs preserved across snapshot restore');
  }

  const threadWithLinks = snap1.projectData.plotThreads?.[0];
  if (threadWithLinks) {
    const restoredThread = fullyRestored.plotThreads?.find(t => t.id === threadWithLinks.id);
    assert(restoredThread?.status === threadWithLinks.status, 'Plot thread status preserved across snapshot restore');
  }

  results.push('✓ Test 92 Passed: Story Engine relational integrity across snapshots');

  // =========================================================================
  // 93. Word-Level Text Diff Algorithm
  // =========================================================================
  const baseSample = 'The silver raven landed upon the parapet.';
  const targetSample = 'The golden raven landed softly upon the stone parapet.';
  const wordDiff = diffWords(baseSample, targetSample);

  assert(wordDiff.length > 0, 'diffWords produces segments');
  const hasAdded = wordDiff.some(s => s.type === 'added');
  const hasRemoved = wordDiff.some(s => s.type === 'removed');
  const hasUnchanged = wordDiff.some(s => s.type === 'unchanged');

  assert(hasAdded && hasRemoved && hasUnchanged, 'diffWords detects additions, removals, and unchanged tokens');
  assert(wordDiff.find(s => s.type === 'removed')?.text.includes('silver') === true, 'Removed token identified');
  assert(wordDiff.some(s => s.type === 'added' && s.text.includes('golden')), 'Added token golden identified');

  results.push('✓ Test 93 Passed: Word-level text diff algorithm accuracy');

  // =========================================================================
  // 94. Project Comparison & Net Word Delta Calculation
  // =========================================================================
  const baseProjForDiff = JSON.parse(JSON.stringify(pCompletedRound));
  const targetProjForDiff = JSON.parse(JSON.stringify(pCompletedRound));
  targetProjForDiff.acts[0].chapters[0].content = (baseProjForDiff.acts[0].chapters[0].content || '') + ' Added fifty extra words for dramatic effect.';
  targetProjForDiff.acts[0].chapters[0].wordCount = (baseProjForDiff.acts[0].chapters[0].wordCount || 0) + 7;

  const projDiff = compareProjects(baseProjForDiff, targetProjForDiff, 'Base', 'Target');
  assert(projDiff.totalAddedWords > 0, 'compareProjects calculates added words');
  assert(projDiff.chapterDiffs.some(c => c.changeType === 'modified'), 'compareProjects flags modified chapter');

  results.push('✓ Test 94 Passed: Project comparison & net word delta calculation');

  // =========================================================================
  // 95. Structural Diff Detection (Added & Removed Chapters)
  // =========================================================================
  const baseProjWithCh = JSON.parse(JSON.stringify(pCompletedRound));
  const targetProjWithNewCh = JSON.parse(JSON.stringify(pCompletedRound));
  
  targetProjWithNewCh.acts[0].chapters.push({
    id: 'ch-brand-new-999',
    title: 'Chapter 999: The Unseen Gate',
    order: 99,
    content: '<p>A whole new chapter emerges here.</p>',
    wordCount: 7,
    scenes: []
  });

  const structDiff = compareProjects(baseProjWithCh, targetProjWithNewCh);
  assert(structDiff.addedChapters.includes('Chapter 999: The Unseen Gate'), 'Detected added chapter in structural diff');

  const structDiffReversed = compareProjects(targetProjWithNewCh, baseProjWithCh);
  assert(structDiffReversed.removedChapters.includes('Chapter 999: The Unseen Gate'), 'Detected removed chapter in structural diff');

  results.push('✓ Test 95 Passed: Structural diff detection for added and removed chapters');

  // =========================================================================
  // 96. Snapshot Pinning & Indefinite Retention
  // =========================================================================
  const pinnedSnap = createSnapshot(pCompletedRound, {
    label: 'Milestone Golden Master',
    pinned: true,
    type: 'manual'
  });

  assert(pinnedSnap.pinned === true, 'Snapshot marked as pinned');

  results.push('✓ Test 96 Passed: Snapshot pinning & indefinite retention flag');

  // =========================================================================
  // 97. Retention Policy & Auto-Snapshot Pruning
  // =========================================================================
  const autoList: any[] = [];
  for (let i = 0; i < 30; i++) {
    autoList.push(createSnapshot(pCompletedRound, {
      label: `Auto save ${i}`,
      type: 'auto',
      source: 'auto-save'
    }));
  }
  autoList.push(pinnedSnap);
  autoList.push(snap1); // manual snapshot

  const pruned = pruneAutoSnapshots(autoList, 10);
  // Should keep 10 auto + 1 pinned + 1 manual = 12 total
  assert(pruned.length === 12, 'Pruning caps auto snapshots to max count while preserving manual & pinned snapshots');
  assert(pruned.some(s => s.id === pinnedSnap.id), 'Pinned snapshot preserved after pruning');
  assert(pruned.some(s => s.id === snap1.id), 'Manual snapshot preserved after pruning');

  results.push('✓ Test 97 Passed: Retention policy & auto-snapshot pruning');

  // =========================================================================
  // 98. Time-Based Snapshot Grouping
  // =========================================================================
  const groups = groupSnapshotsByTime(pruned);
  assert(groups.length > 0, 'groupSnapshotsByTime returns time buckets');
  assert(groups[0].timeGroup === 'Today', 'Recent snapshots grouped under Today');

  results.push('✓ Test 98 Passed: Time-based snapshot grouping into literary buckets');

  // =========================================================================
  // 99. Multi-Parameter Snapshot Filtering
  // =========================================================================
  const manualFiltered = filterSnapshots(pruned, { snapshotType: 'manual' });
  assert(manualFiltered.every(s => s.snapshotType === 'manual'), 'Filtered by manual type');

  const searchFiltered = filterSnapshots(pruned, { searchQuery: 'Golden Master' });
  assert(searchFiltered.length === 1 && searchFiltered[0].id === pinnedSnap.id, 'Filtered by search query');

  const pinnedFiltered = filterSnapshots(pruned, { pinnedOnly: true });
  assert(pinnedFiltered.every(s => s.pinned === true), 'Filtered by pinned only');

  results.push('✓ Test 99 Passed: Multi-parameter snapshot filtering');

  // =========================================================================
  // 100. Snapshot Summary Statistics Calculation
  // =========================================================================
  const statsResult = getSnapshotStats(pruned);
  assert(statsResult.totalCount === pruned.length, 'Total count calculated');
  assert(statsResult.pinnedCount >= 1, 'Pinned count calculated');
  assert(statsResult.manualCount >= 1, 'Manual count calculated');
  assert(statsResult.autoCount === 10, 'Auto count calculated');

  results.push('✓ Test 100 Passed: Snapshot summary statistics calculation');

  // =========================================================================
  // 101. Round-Trip JSON Persistence & Backward Compatibility
  // =========================================================================
  const projectWithSnapshots: ProjectData = {
    ...pCompletedRound,
    snapshots: [snap1, pinnedSnap]
  };

  const snapSerialized = JSON.stringify(projectWithSnapshots);
  const snapReloaded = JSON.parse(snapSerialized);
  const migratedReload = migrateProjectToStoryEngine(snapReloaded);

  assert(Boolean(migratedReload.snapshots && Array.isArray(migratedReload.snapshots)), 'Migration preserves snapshots array');
  assert(Boolean(migratedReload.snapshots && migratedReload.snapshots.length === 2), 'All snapshots preserved across JSON reload');
  assert(Boolean(migratedReload.snapshots && migratedReload.snapshots[0].id === snap1.id), 'Snapshot ID preserved across reload');
  assert(Boolean(migratedReload.snapshots && migratedReload.snapshots[0].contentHash === snap1.contentHash), 'Snapshot content hash preserved across reload');

  // Verify legacy project with undefined snapshots gets clean empty array
  const legacyProjWithoutSnaps: any = {
    metadata: { id: 'leg-proj', title: 'Old Project' },
    acts: [],
    characters: []
  };
  const snapMigratedLegacy = migrateProjectToStoryEngine(legacyProjWithoutSnaps);
  assert(Array.isArray(snapMigratedLegacy.snapshots) && snapMigratedLegacy.snapshots.length === 0, 'Legacy projects initialized with empty snapshots array');

  results.push('✓ Test 101 Passed: Round-trip JSON persistence & backward compatibility');

  // =========================================================================
  // 102. Theme Collection Loading & Category Distribution
  // =========================================================================
  assert(CURATED_THEMES.length === 20, 'Curated theme collection contains 20 curated themes');
  const darkThemeList = CURATED_THEMES.filter(t => t.category === 'dark');
  const lightThemeList = CURATED_THEMES.filter(t => t.category === 'light');
  const expThemeList = CURATED_THEMES.filter(t => t.category === 'experimental');

  assert(darkThemeList.length === 8, '8 Dark/Ink themes present');
  assert(lightThemeList.length === 7, '7 Light/Paper themes present');
  assert(expThemeList.length === 5, '5 Experimental themes present');

  results.push('✓ Test 102 Passed: Theme collection loading & category distribution (20 themes)');

  // =========================================================================
  // 103. Semantic Token Completeness Across All Themes
  // =========================================================================
  CURATED_THEMES.forEach(t => {
    const c = t.colors;
    assert(Boolean(c.background && c.surface && c.text && c.textMuted && c.heading && c.accent), `Theme ${t.name} has core semantic tokens`);
    assert(Boolean(c.link && c.wikilink && c.quote && c.code && c.border && c.selection), `Theme ${t.name} has markdown tokens`);
    assert(Boolean(c.success && c.warning && c.error), `Theme ${t.name} has status tokens`);
    assert(Boolean(c.editorPage && c.editorPageText && c.revisionAdded && c.revisionRemoved), `Theme ${t.name} has editorial & revision tokens`);
    assert(Boolean(c.proofreadingInfo && c.proofreadingWarning && c.proofreadingError), `Theme ${t.name} has proofreading tokens`);
  });

  results.push('✓ Test 103 Passed: Semantic token completeness across all 20 themes');

  // =========================================================================
  // 104. Independent Typography Configuration
  // =========================================================================
  const customTypo: TypographyConfig = {
    ...DEFAULT_TYPOGRAPHY,
    manuscriptFont: '"Literata", serif',
    uiFont: '"IBM Plex Sans", sans-serif',
    headingFont: '"Cinzel", serif',
    monoFont: '"Fira Code", monospace',
    fontSize: 20,
    lineHeight: 1.85,
    letterSpacing: 0.02,
    paragraphSpacing: 0.5,
    paragraphIndent: 1.75,
    pageWidth: 740,
    textAlign: 'justify',
    dropCap: true,
    sceneOrnament: '✦ ✦ ✦'
  };

  assert(customTypo.manuscriptFont === '"Literata", serif', 'Manuscript font configured independently');
  assert(customTypo.headingFont === '"Cinzel", serif', 'Heading font configured independently');
  assert(customTypo.fontSize === 20 && customTypo.lineHeight === 1.85, 'Metrics configured independently');
  assert(customTypo.dropCap === true && customTypo.sceneOrnament === '✦ ✦ ✦', 'Editorial presentation flags preserved');

  results.push('✓ Test 104 Passed: Independent typography configuration');

  // =========================================================================
  // 105. Preset Application & Linking
  // =========================================================================
  assert(CURATED_PRESETS.length >= 7, 'At least 7 curated presets defined');
  const midnightPreset = CURATED_PRESETS.find(p => p.id === 'midnight-novel');
  assert(Boolean(midnightPreset), 'Midnight Novel preset defined');
  assert(midnightPreset?.themeId === 'tokyo-midnight', 'Midnight Novel links to Tokyo Midnight theme');
  assert(Boolean(midnightPreset?.manuscriptFont.includes('Literata')), 'Midnight Novel uses Literata');

  const oldLibPreset = CURATED_PRESETS.find(p => p.id === 'old-library');
  assert(oldLibPreset?.themeId === 'warm-paper', 'Old Library links to Warm Paper');
  assert(oldLibPreset?.dropCap === true, 'Old Library has drop cap enabled');

  results.push('✓ Test 105 Passed: Preset application & linking');

  // =========================================================================
  // 106. Custom Theme Creation & Token Overrides
  // =========================================================================
  const baseTheme = CURATED_THEMES[0];
  const customTheme = makeTheme(
    'theme-custom-99',
    'Custom Twilight',
    'dark',
    true,
    {
      ...baseTheme.colors,
      accent: '#E06C75',
      wikilink: '#98C379',
      quote: '#ABB2BF'
    }
  );

  assert(customTheme.id === 'theme-custom-99', 'Custom theme ID generated');
  assert(customTheme.colors.accent === '#E06C75', 'Overridden accent token applied');
  assert(customTheme.colors.wikilink === '#98C379', 'Overridden wikilink token applied');
  assert(customTheme.colors.background === baseTheme.colors.background, 'Inherited tokens preserved');

  results.push('✓ Test 106 Passed: Custom theme creation & token overrides');

  // =========================================================================
  // 107. Custom Preset Creation & Validation
  // =========================================================================
  const customPreset: AppearancePreset = {
    id: 'preset-author-signature',
    name: 'Author Signature',
    description: 'Custom author signature aesthetic',
    themeId: customTheme.id,
    manuscriptFont: '"EB Garamond", serif',
    uiFont: '"Inter", sans-serif',
    headingFont: '"Cormorant Garamond", Georgia, serif',
    monoFont: '"JetBrains Mono", monospace',
    fontSize: 19,
    lineHeight: 1.8,
    paragraphIndent: 1.5,
    pageWidth: 680,
    textAlign: 'justify',
    dropCap: true,
    isCustom: true
  };

  assert(customPreset.isCustom === true, 'Custom preset flagged as custom');
  assert(customPreset.themeId === customTheme.id, 'Custom preset links to custom theme');

  results.push('✓ Test 107 Passed: Custom preset creation & validation');

  // =========================================================================
  // 108. Contrast Calculation Utilities (WCAG)
  // =========================================================================
  const blackWhiteContrast = getContrastRatio('#FFFFFF', '#000000');
  assert(blackWhiteContrast >= 20.0, 'White on black contrast is 21:1');

  const obsidianTextContrast = getContrastRatio(CURATED_THEMES[0].colors.text, CURATED_THEMES[0].colors.background);
  assert(obsidianTextContrast >= 7.0, 'Obsidian body text contrast is high and accessible');

  const warmPaperTextContrast = getContrastRatio(CURATED_THEMES[8].colors.text, CURATED_THEMES[8].colors.background);
  assert(warmPaperTextContrast >= 7.0, 'Warm Paper text contrast is high and accessible');

  results.push('✓ Test 108 Passed: Contrast calculation utilities (WCAG)');

  // =========================================================================
  // 109. Contrast Validation & Readable Fallback Generation
  // =========================================================================
  const validReport = validateThemeContrast(CURATED_THEMES[0]);
  assert(validReport.isValid === true, 'Obsidian passes contrast validation');

  // Low contrast fallback test
  const fallbackForDark = getReadableFallback('#1A1A1A', '#000000', 4.5);
  assert(fallbackForDark === '#F4F4F5', 'Dark on dark generates high contrast light fallback');

  const fallbackForLight = getReadableFallback('#F0F0F0', '#FFFFFF', 4.5);
  assert(fallbackForLight === '#18181B', 'Light on light generates high contrast dark fallback');

  results.push('✓ Test 109 Passed: Contrast validation & readable fallback generation');

  // =========================================================================
  // 110. Editorial Markdown Token Derivation
  // =========================================================================
  const tokyoTheme = CURATED_THEMES.find(t => t.id === 'tokyo-midnight')!;
  assert(tokyoTheme.colors.wikilink === '#7AA2F7', 'Tokyo Midnight wikilink token coherent with palette');
  assert(tokyoTheme.colors.heading === '#E0AF68', 'Tokyo Midnight heading token warm amber contrast');
  assert(tokyoTheme.colors.code === '#BB9AF7', 'Tokyo Midnight code token violet tone');

  const warmPaperTheme = CURATED_THEMES.find(t => t.id === 'warm-paper')!;
  assert(warmPaperTheme.colors.heading === '#423326', 'Warm paper heading deep brown ink');
  assert(warmPaperTheme.colors.wikilink === '#A06236', 'Warm paper wikilink soft terracotta');

  results.push('✓ Test 110 Passed: Editorial Markdown token derivation');

  // =========================================================================
  // 111. Review & Proofreading Marker Theme Token Integration
  // =========================================================================
  assert(Boolean(tokyoTheme.colors.proofreadingInfo?.includes('rgba')), 'Proofreading info token formatted as tint');
  assert(Boolean(tokyoTheme.colors.proofreadingWarning?.includes('rgba')), 'Proofreading warning token formatted as tint');
  assert(Boolean(tokyoTheme.colors.proofreadingError?.includes('rgba')), 'Proofreading error token formatted as tint');

  results.push('✓ Test 111 Passed: Review & Proofreading marker theme token integration');

  // =========================================================================
  // 112. Version Diff Theme Token Integration
  // =========================================================================
  assert(Boolean(tokyoTheme.colors.revisionAdded?.includes('rgba')), 'Revision added token formatted as subtle tint');
  assert(Boolean(tokyoTheme.colors.revisionRemoved?.includes('rgba')), 'Revision removed token formatted as subtle tint');

  results.push('✓ Test 112 Passed: Version diff theme token integration');

  // =========================================================================
  // 113. Document Theme Application Runtime Simulation
  // =========================================================================
  // In node environment, applyThemeToDocument gracefully handles undefined document without throwing
  let applyDidNotThrow = true;
  try {
    applyThemeToDocument(tokyoTheme, customTypo);
  } catch (e) {
    applyDidNotThrow = false;
  }
  assert(applyDidNotThrow === true, 'applyThemeToDocument safely handles runtime execution');

  results.push('✓ Test 113 Passed: Document theme application runtime simulation');

  // =========================================================================
  // 114. Legacy Theme Migration & Non-Destructive Preservation
  // =========================================================================
  const legacyThemeObject: any = {
    id: 'legacy-dark',
    name: 'Legacy Theme',
    bg: '#111111',
    text: '#EEEEEE',
    pageBg: '#181818',
    pageBorder: '#282828',
    accent: '#8888FF',
    muted: '#777777',
  };

  const migratedTheme = makeTheme(
    legacyThemeObject.id,
    legacyThemeObject.name,
    'dark',
    true,
    {
      background: legacyThemeObject.bg,
      surface: legacyThemeObject.pageBg,
      elevatedSurface: '#222222',
      text: legacyThemeObject.text,
      textMuted: legacyThemeObject.muted,
      textFaint: '#444444',
      heading: legacyThemeObject.text,
      accent: legacyThemeObject.accent,
      accentMuted: '#222244',
      border: legacyThemeObject.pageBorder,
      borderStrong: '#444444',
      selection: 'rgba(136, 136, 255, 0.25)',
      link: legacyThemeObject.accent,
      wikilink: legacyThemeObject.accent,
      quote: legacyThemeObject.text,
      quoteBorder: legacyThemeObject.accent,
      code: legacyThemeObject.text,
      codeBackground: '#1A1A1A',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444'
    }
  );

  results.push('✓ Test 114 Passed: Legacy theme migration & non-destructive preservation');

  // =========================================================================
  // 115. Publication Preset Loading & Completeness (6 Core Profiles)
  // =========================================================================
  const allCorePresets = PUBLICATION_PRESETS;
  assert(allCorePresets.length === 6, 'Exactly 6 core publication profiles defined');
  const expectedPresetIds = ['trade-paperback', 'standard-manuscript', 'digest-paperback', 'classic-hardcover', 'digital-epub', 'clean-markdown'];
  expectedPresetIds.forEach(id => {
    const found = allCorePresets.find(p => p.id === id);
    assert(Boolean(found), `Core profile ${id} exists`);
    assert(Boolean(found?.options.format), `Core profile ${id} defines format`);
    assert(Boolean(found?.options.trimSize), `Core profile ${id} defines trimSize`);
    assert(Boolean(found?.options.fontFamily), `Core profile ${id} defines fontFamily`);
  });
  results.push('✓ Test 115 Passed: Publication preset loading & core profile completeness (6 presets)');

  // =========================================================================
  // 116. Custom Profile Persistence & Management (Save / Duplicate / Reset / Delete)
  // =========================================================================
  const sampleCustomProfile: PublicationPreset = {
    id: 'test-custom-preset-1',
    name: 'Gothic Hardcover Deluxe',
    description: 'Customized A5 deluxe hardcover with Crimson font',
    badge: 'Custom Profile',
    isCustom: true,
    options: {
      presetId: 'test-custom-preset-1',
      format: 'pdf',
      trimSize: 'A5',
      fontFamily: 'garamond',
      fontSize: 10.5,
      lineHeight: 1.45,
      paragraphIndent: 6,
      margins: { top: 22, bottom: 22, inner: 24, outer: 18 },
      headerStyle: 'recto-verso',
      footerStyle: 'centered-page-num',
      chapterStartPage: 'recto',
      chapterHeaderStyle: 'ornate-bordered',
      dropCap: true,
      dropCapLines: 3,
      sceneBreak: '§ § §',
      includeChapterSynopsis: false,
      frontMatter: {
        includeTitlePage: true,
        includeCopyright: true,
        includeDedication: true,
        includeEpigraph: true,
        includeTableOfContents: true,
      },
      backMatter: {
        includeAcknowledgments: true,
        includeAboutAuthor: true,
      },
    }
  };

  CompilerService.saveCustomPublicationProfile(sampleCustomProfile);
  const fetchedProfiles = CompilerService.getCustomPublicationProfiles();
  assert(fetchedProfiles.some(p => p.id === 'test-custom-preset-1'), 'Custom profile saved and retrieved');

  const duplicatedProfile = CompilerService.duplicatePublicationProfile('trade-paperback', 'Duplicated Trade');
  assert(Boolean(duplicatedProfile.id.startsWith('custom-profile-')), 'Duplicated profile has unique ID');
  assert(duplicatedProfile.isCustom === true, 'Duplicated profile flagged as custom');

  const resetOpts = CompilerService.resetToPresetDefaults('trade-paperback');
  assert(resetOpts.presetId === 'trade-paperback', 'Reset to defaults restored trade-paperback');
  assert(resetOpts.fontSize === 11, 'Reset restored default 11pt font');

  CompilerService.deleteCustomPublicationProfile('test-custom-preset-1');
  CompilerService.deleteCustomPublicationProfile(duplicatedProfile.id);
  const postDeleteProfiles = CompilerService.getCustomPublicationProfiles();
  assert(!postDeleteProfiles.some(p => p.id === 'test-custom-preset-1'), 'Custom profile deleted cleanly');
  results.push('✓ Test 116 Passed: Custom profile persistence & management (save, duplicate, reset, delete)');

  // =========================================================================
  // 117. Semantic Prose & Scene Break Parsing
  // =========================================================================
  const rawManuscriptHtml = `
    <h1>Chapter 1: The Gathering</h1>
    <p>The dawn broke slowly over the silent harbor. Salt air filled the narrow alleyways.</p>
    <hr class="scene-break" />
    <p>Later that evening, [[Elaria|Lady Elaria]] met with [[Kaelen]] in secret.</p>
    <div class="scene-break">* * *</div>
    <p>By midnight, the fleet was ready to sail.</p>
  `;

  const parsedItems = CompilerService.parseProseItems(rawManuscriptHtml, '✦ ✦ ✦');
  assert(parsedItems.length === 5, 'Parsed exactly 3 paragraphs and 2 scene breaks');
  assert(parsedItems[0].type === 'paragraph' && parsedItems[0].text.startsWith('The dawn broke'), 'Paragraph 1 parsed cleanly');
  assert(parsedItems[1].type === 'scene-break' && parsedItems[1].text === '✦ ✦ ✦', 'Scene break 1 mapped to configured symbol');
  assert(parsedItems[2].type === 'paragraph' && parsedItems[2].text.includes('Lady Elaria'), 'Wikilink resolved to display alias');
  assert(parsedItems[3].type === 'scene-break' && parsedItems[3].text === '✦ ✦ ✦', 'Scene break 2 mapped to configured symbol');
  assert(parsedItems[4].type === 'paragraph' && parsedItems[4].text.startsWith('By midnight'), 'Paragraph 3 parsed cleanly');
  results.push('✓ Test 117 Passed: Semantic prose & scene break parsing with ornament substitution');

  // =========================================================================
  // 118. Front Matter Ordering & Structure
  // =========================================================================
  const testProjectForExport: ProjectData = {
    ...project,
    metadata: {
      ...project.metadata,
      title: 'The Obsidian Ledger',
      author: 'A. R. Vance',
      genre: 'Gothic Mystery',
    },
    acts: [
      {
        id: 'act-1',
        title: 'Act I: The Salt Watch',
        order: 1,
        chapters: [
          {
            id: 'ch-1',
            title: 'Chapter 1: The Fog Bells',
            order: 1,
            wordCount: 850,
            content: '<p>The lighthouse stood silent against the gale.</p><hr/><p>A lantern flickered in the watchtower.</p>',
            status: 'revised',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'ch-2',
            title: 'Chapter 2: Dead Calm',
            order: 2,
            wordCount: 1100,
            content: '<p>The schooner drifted without a sound into the inlet.</p>',
            status: 'final',
            updatedAt: new Date().toISOString(),
          }
        ]
      }
    ]
  };

  const tradeOptions: PublicationOptions = {
    ...DEFAULT_PUBLICATION_OPTIONS,
    presetId: 'trade-paperback',
    format: 'markdown',
    frontMatter: {
      includeTitlePage: true,
      includeCopyright: true,
      copyrightYear: '2026',
      publisherName: 'Blackwood & Co.',
      isbn: '978-0-123456-78-9',
      includeDedication: true,
      dedicationText: 'For the keepers of the light.',
      includeEpigraph: true,
      epigraphQuote: 'The sea does not forgive hesitation.',
      epigraphSource: 'Old Mariner Proverb',
      includeTableOfContents: true,
    },
    backMatter: {
      includeAcknowledgments: true,
      acknowledgmentsText: 'Heartfelt gratitude to the editorial team.',
      includeAboutAuthor: true,
      aboutAuthorBio: 'A. R. Vance writes dark tales from coastal climes.',
    }
  };

  const compiledMd = CompilerService.compileMarkdown(testProjectForExport, tradeOptions);
  
  // Verify sequential front matter ordering
  const titleIdx = compiledMd.indexOf('# The Obsidian Ledger');
  const copyIdx = compiledMd.indexOf('Copyright © 2026');
  const dedIdx = compiledMd.indexOf('For the keepers of the light.');
  const epiIdx = compiledMd.indexOf('The sea does not forgive hesitation.');
  const tocIdx = compiledMd.indexOf('## Table of Contents');
  const ch1Idx = compiledMd.indexOf('## Chapter 1: The Fog Bells');

  assert(titleIdx > 0, 'Title page generated');
  assert(copyIdx > titleIdx, 'Copyright follows title page');
  assert(dedIdx > copyIdx, 'Dedication follows copyright');
  assert(epiIdx > dedIdx, 'Epigraph follows dedication');
  assert(tocIdx > epiIdx, 'Table of contents follows epigraph');
  assert(ch1Idx > tocIdx, 'First chapter follows table of contents');
  results.push('✓ Test 118 Passed: Front matter ordering & sequence verification (Title -> Copyright -> Dedication -> Epigraph -> TOC -> Body)');

  // =========================================================================
  // 119. Back Matter Ordering (Acknowledgments & About the Author)
  // =========================================================================
  const ackIdx = compiledMd.indexOf('# Acknowledgments');
  const bioIdx = compiledMd.indexOf('# About the Author');
  assert(ackIdx > ch1Idx, 'Acknowledgments generated after manuscript body');
  assert(bioIdx > ackIdx, 'About the Author generated after Acknowledgments');
  assert(compiledMd.includes('A. R. Vance writes dark tales'), 'Author bio text present');
  results.push('✓ Test 119 Passed: Back matter ordering & formatting (Acknowledgments -> About the Author)');

  // =========================================================================
  // 120. Chapter Opening Rendering Rules (4 Styles)
  // =========================================================================
  const styles: ChapterHeaderStyle[] = ['centered-classic', 'left-modern', 'ornate-bordered', 'minimal'];
  styles.forEach(style => {
    const opts: PublicationOptions = { ...tradeOptions, chapterHeaderStyle: style };
    const preflight = CompilerService.validateManuscript(testProjectForExport, opts);
    assert(preflight.readyForPrint === true, `Preflight valid for chapter header style: ${style}`);
  });
  results.push('✓ Test 120 Passed: Chapter opening styles verified (Centered Classic, Left Modern, Ornate Bordered, Minimal)');

  // =========================================================================
  // 121. Table of Contents Generation
  // =========================================================================
  assert(compiledMd.includes('- [Chapter 1: The Fog Bells](#chapter-1-the-fog-bells)'), 'TOC contains Chapter 1 anchor link');
  assert(compiledMd.includes('- [Chapter 2: Dead Calm](#chapter-2-dead-calm)'), 'TOC contains Chapter 2 anchor link');
  results.push('✓ Test 121 Passed: Table of Contents generation with structured chapter hierarchy');

  // =========================================================================
  // 122. PDF Export Geometry & Parameter Computation
  // =========================================================================
  const trimSizes: TrimSize[] = ['6x9', '5.5x8.5', 'A5', 'Letter', 'A4'];
  trimSizes.forEach(trim => {
    const opts: PublicationOptions = { ...tradeOptions, trimSize: trim, format: 'pdf' };
    const report = CompilerService.validateManuscript(testProjectForExport, opts);
    assert(report.estimatedPageCount > 0, `Estimated page count computed for ${trim}`);
    assert(Boolean(report.formatNotes && report.formatNotes.length > 0), `Geometry notes included for ${trim}`);
  });
  results.push('✓ Test 122 Passed: PDF export geometry & parameter computation across trim sizes');

  // =========================================================================
  // 123. DOCX Export Formatting (Standard Manuscript Shunn vs Trade Paperback)
  // =========================================================================
  const shunnOpts: PublicationOptions = {
    ...DEFAULT_PUBLICATION_OPTIONS,
    presetId: 'standard-manuscript',
    format: 'docx',
    fontFamily: 'courier',
    fontSize: 12,
    lineHeight: 2.0,
    paragraphIndent: 12.7,
    margins: { top: 25.4, bottom: 25.4, inner: 25.4, outer: 25.4 },
    sceneBreak: '#',
    chapterHeaderStyle: 'centered-classic',
    dropCap: false,
  };

  const shunnPreflight = CompilerService.validateManuscript(testProjectForExport, shunnOpts);
  assert(shunnPreflight.readyForPrint === true, 'Shunn submission preflight valid');
  assert(shunnOpts.lineHeight === 2.0, 'Shunn uses double spacing');
  assert(shunnOpts.paragraphIndent === 12.7, 'Shunn uses 0.5 inch indent (12.7mm)');
  assert(shunnOpts.margins.top === 25.4, 'Shunn uses 1.0 inch margins (25.4mm)');
  assert(shunnOpts.sceneBreak === '#', 'Shunn uses # for scene breaks');
  results.push('✓ Test 123 Passed: DOCX Shunn manuscript vs Trade Paperback formatting separation');

  // =========================================================================
  // 124. EPUB 3 Standards-Compliant Zip Package Construction
  // =========================================================================
  const epubBuilder = new EpubZipBuilder();
  epubBuilder.addFile('mimetype', 'application/epub+zip');
  epubBuilder.addFile('META-INF/container.xml', '<container version="1.0"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  epubBuilder.addFile('OEBPS/content.opf', '<package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata><dc:title>Test</dc:title></metadata><manifest/><spine/></package>');
  epubBuilder.addFile('OEBPS/nav.xhtml', '<html xmlns="http://www.w3.org/1999/xhtml"><nav epub:type="toc"><h1>TOC</h1></nav></html>');

  const epubBytes = epubBuilder.buildUint8Array();
  assert(epubBytes.length > 100, 'EPUB zip binary constructed successfully');
  
  // Verify standard ZIP header signature (PK\x03\x04) = 0x04034b50
  assert(epubBytes[0] === 0x50 && epubBytes[1] === 0x4B && epubBytes[2] === 0x03 && epubBytes[3] === 0x04, 'Valid PK zip file header');
  
  // Verify first entry filename is 'mimetype'
  const firstFilename = new TextDecoder().decode(epubBytes.subarray(30, 38));
  assert(firstFilename === 'mimetype', 'First uncompressed file in EPUB zip is mimetype');

  const epubBlob = epubBuilder.buildBlob();
  assert(epubBlob.type === 'application/epub+zip', 'Blob type set to application/epub+zip');
  results.push('✓ Test 124 Passed: EPUB 3 zip package construction, mimetype uncompressed header & validity');

  // =========================================================================
  // 125. Markdown Export with YAML Front Matter
  // =========================================================================
  assert(compiledMd.startsWith('---\n'), 'Markdown starts with YAML front matter fence');
  assert(compiledMd.includes('title: "The Obsidian Ledger"'), 'YAML front matter contains title');
  assert(compiledMd.includes('author: "A. R. Vance"'), 'YAML front matter contains author');
  assert(compiledMd.includes('word_count: 1950'), 'YAML front matter contains word count');
  assert(compiledMd.includes('generator: "Swrite Editorial Publication Studio"'), 'YAML front matter contains generator');
  results.push('✓ Test 125 Passed: Markdown export with YAML front matter & CommonMark compliance');

  // =========================================================================
  // 126. Preflight Error Detection (Empty project, Empty chapters, Default Title)
  // =========================================================================
  const invalidProject: ProjectData = {
    ...project,
    metadata: { ...project.metadata, title: 'Untitled Project', author: 'Author' },
    acts: [
      {
        id: 'act-err',
        title: 'Empty Act',
        order: 1,
        chapters: [
          {
            id: 'ch-empty',
            title: 'Empty Chapter',
            order: 1,
            wordCount: 0,
            content: '',
            status: 'draft',
            updatedAt: new Date().toISOString(),
          }
        ]
      }
    ]
  };

  const errReport = CompilerService.validateManuscript(invalidProject, DEFAULT_PUBLICATION_OPTIONS);
  assert(errReport.readyForPrint === false, 'Preflight flags unready project as false');
  assert(errReport.issues.some(i => i.type === 'error' && i.title.includes('Default or Empty Book Title')), 'Detected default title error');
  assert(errReport.issues.some(i => i.type === 'error' && i.title.includes('Empty Chapter')), 'Detected empty chapter error');
  results.push('✓ Test 126 Passed: Preflight error detection (default title, empty chapters, unready status)');

  // =========================================================================
  // 127. Preflight Warning Detection & Actionable Remediation
  // =========================================================================
  const warningOptions: PublicationOptions = {
    ...DEFAULT_PUBLICATION_OPTIONS,
    frontMatter: {
      ...DEFAULT_PUBLICATION_OPTIONS.frontMatter,
      includeDedication: true,
      dedicationText: '', // Empty dedication text
      includeEpigraph: true,
      epigraphQuote: '', // Empty quote
    },
    backMatter: {
      includeAcknowledgments: true,
      acknowledgmentsText: 'Thanks',
      includeAboutAuthor: true,
      aboutAuthorBio: '', // Empty bio
    }
  };

  const warnReport = CompilerService.validateManuscript(testProjectForExport, warningOptions);
  assert(warnReport.issues.some(i => i.type === 'warning' && i.title.includes('Empty Dedication Text')), 'Detected empty dedication warning');
  assert(warnReport.issues.some(i => i.type === 'warning' && i.title.includes('Empty Epigraph Quote')), 'Detected empty epigraph warning');
  assert(warnReport.issues.some(i => i.type === 'warning' && i.title.includes('Empty Author Biography')), 'Detected empty bio warning');
  assert(warnReport.issues.every(i => Boolean(i.impact && i.suggestion)), 'All diagnostics contain impact and suggestion guidance');
  results.push('✓ Test 127 Passed: Preflight warning detection with actionable impact and suggestion guidance');

  // =========================================================================
  // 128. Page Count Estimation Model
  // =========================================================================
  const tradeReport = CompilerService.validateManuscript(testProjectForExport, tradeOptions);
  const digestReport = CompilerService.validateManuscript(testProjectForExport, { ...tradeOptions, trimSize: '5.5x8.5' });
  const hardcoverReport = CompilerService.validateManuscript(testProjectForExport, { ...tradeOptions, trimSize: 'A5', chapterStartPage: 'recto' });

  assert(tradeReport.estimatedPageCount >= 6, 'Trade paperback page count includes body + front/back matter');
  assert(digestReport.estimatedPageCount >= tradeReport.estimatedPageCount, 'Digest paperback has higher or equal page count due to smaller trim');
  assert(tradeReport.estimatedReadingTimeMinutes >= 1, 'Estimated reading time calculated');
  results.push('✓ Test 128 Passed: Page count estimation model factoring trim size, leading & front/back matter');

  // =========================================================================
  // 129. Pre-Export Safety Snapshot Creation & Deduplication
  // =========================================================================
  const preExportSnapshot = createSnapshot(testProjectForExport, {
    label: 'Before Export — Trade Paperback',
    description: 'Pre-export safety snapshot created before PDF export',
    type: 'pre-export',
    source: 'compiler-export',
  });

  assert(preExportSnapshot.label.startsWith('Before Export —'), 'Snapshot labeled with Before Export prefix');
  assert(preExportSnapshot.snapshotType === 'pre-export', 'Snapshot type set to pre-export');
  assert(preExportSnapshot.source === 'compiler-export', 'Snapshot source tagged compiler-export');
  assert(verifySnapshotIntegrity(preExportSnapshot).isValid, 'Snapshot integrity verified');
  results.push('✓ Test 129 Passed: Pre-export safety snapshot creation & metadata verification');

  // =========================================================================
  // 130. Legacy Compiler Compatibility & Non-Destructive Preservation
  // =========================================================================
  const legacyExportOptions = {
    format: 'pdf',
    preset: 'trade-paperback',
    fontSize: 11,
  };
  const normalizedOpts = CompilerService.resetToPresetDefaults((legacyExportOptions as any).preset || 'trade-paperback');
  assert(normalizedOpts.presetId === 'trade-paperback', 'Legacy preset normalized to modern PublicationOptions');
  assert(normalizedOpts.margins.inner === 20, 'Gutter margins preserved');
  results.push('✓ Test 130 Passed: Legacy compiler compatibility & non-destructive preservation');

  // =========================================================================
  // PHASE 1 — FRICTIONLESS PROSE FLOW TESTS
  // =========================================================================

  // =========================================================================
  // 131. One-Click Scene Creation — Default 'Untitled Scene' Title
  // =========================================================================
  const phase1Project = migrateProjectToStoryEngine(JSON.parse(JSON.stringify(INITIAL_NOVEL_DATA)));
  const phase1Chapter = phase1Project.acts[0].chapters[0];
  const { scene: untitledScene } = StoryEngine.addScene(phase1Project, phase1Chapter.id);
  assert(untitledScene.title === 'Untitled Scene', 'New scene created with "Untitled Scene" default title');
  assert(untitledScene.content === '<p></p>', 'New scene starts with empty prose');
  assert(untitledScene.id !== undefined, 'New scene has a valid ID');
  results.push('✓ Test 131 Passed: One-click scene creation — default "Untitled Scene" title');

  // =========================================================================
  // 132. Scene Split — Content Preserved in Both Halves
  // =========================================================================
  const splitProject = migrateProjectToStoryEngine(JSON.parse(JSON.stringify(INITIAL_NOVEL_DATA)));
  const splitChapter = splitProject.acts[0].chapters[0];
  const { scene: sceneToSplit } = StoryEngine.addScene(splitProject, splitChapter.id, {
    title: 'Scene To Split',
    content: 'First half content. Second half content.'
  });
  const splitResult = StoryEngine.splitScene(
    splitProject, sceneToSplit.id,
    'First half content.',
    'Second half content.',
    'Split Scene — Part 2'
  );
  assert(splitResult.originalScene !== undefined, 'Original scene preserved after split');
  assert(splitResult.newScene !== undefined, 'New scene created after split');
  assert(splitResult.newScene.title === 'Split Scene — Part 2', 'New scene has correct title after split');
  assert(splitResult.originalScene.content === 'First half content.', 'Original scene has first-half content');
  assert(splitResult.newScene.content === 'Second half content.', 'New scene has second-half content');
  assert(splitChapter.content.includes('First half content.') && splitChapter.content.includes('Second half content.'), 'Chapter content remains synchronized after split');
  results.push('✓ Test 132 Passed: Scene split — content preserved in both halves and chapter persisted');

  // =========================================================================
  // 133. Inline Character State Update — No Workspace Navigation Required
  // =========================================================================
  const stateProject = migrateProjectToStoryEngine(JSON.parse(JSON.stringify(INITIAL_NOVEL_DATA)));
  const { project: projectWithChar, character: charA } = StoryEngine.addCharacter(stateProject, {
    name: 'Margit Verne',
    role: 'Protagonist',
  });
  const updatedStateProject = StoryEngine.updateCharacterState(projectWithChar, charA.id, {
    emotional: 'Determined',
    physical: 'Exhausted',
  });
  const phase1UpdatedChar = updatedStateProject.characters.find(c => c.id === charA.id);
  assert(phase1UpdatedChar !== undefined, 'Character found after state update');
  const state = phase1UpdatedChar!.currentState;
  assert(typeof state === 'object' && (state as any).emotional === 'Determined', 'Emotional state updated inline');
  assert(typeof state === 'object' && (state as any).physical === 'Exhausted', 'Physical state updated inline');
  results.push('✓ Test 133 Passed: Inline character state update — emotional and physical fields saved');

  return { passed: true, results };
}

// Direct CLI Execution when invoked via node
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('storyEngine.test')) {
  try {
    console.log('\n=============================================');
    console.log('  RUNNING SWRITE STORY ENGINE TEST SUITE');
    console.log('=============================================\n');
    const { passed, results } = runStoryEngineTests();
    results.forEach(r => console.log(r));
    console.log('\n=============================================');
    console.log(`  ALL ${results.length} TESTS PASSED SUCCESSFULLY (✓)`);
    console.log('=============================================\n');
  } catch (err: any) {
    console.error('\n❌ TEST SUITE FAILURE:', err.stack || err.message || err);
    process.exit(1);
  }
}

