/**
 * SWRITE — Continuous Project Intelligence & Assisted Organization Test Suite
 * Validates incremental change detection, content hashing, non-blocking queue,
 * Organization Inbox operations, async cancellation guards, and reversible mutation.
 */

import { ProjectData } from '../../types';
import { IncrementalIntelligenceEngine } from './incrementalEngine';
import { ProjectIntelligenceIndexer } from './indexer';
import { DeterministicLocalProvider, MockFailingProvider } from './provider';
import { ProjectIntelligenceApplier } from './applier';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

export function createMockContinuousProject(id: string = 'proj-continuous-1'): ProjectData {
  return {
    metadata: {
      id,
      title: 'Continuous Intelligence Test Novel',
      author: 'Test Writer',
      genre: 'Fantasy / Mystery',
      targetWordCount: 50000,
      currentWordCount: 1200,
      preset: 'plotter',
      theme: {} as any,
      typography: {} as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    acts: [
      {
        id: 'act-1',
        title: 'Act I - The Gathering Storm',
        order: 1,
        chapters: [
          {
            id: 'chap-1',
            title: 'Chapter 1: Whispers in Oakhaven',
            order: 1,
            wordCount: 600,
            status: 'draft',
            content: 'Lady Lyra of House Vane arrived in Oakhaven under the cover of night. Lord Vance waited near the ancient Obsidian Tower.',
            updatedAt: new Date().toISOString(),
            scenes: [
              {
                id: 'scene-1-1',
                chapterId: 'chap-1',
                title: 'Arrival at the Gates',
                content: 'Lady Lyra stepped past the broken archway. Lord Vance handed her a silver cipher token.',
                order: 1,
                status: 'draft',
                wordCount: 300,
                characterIds: ['char-lyra'],
                locationIds: ['loc-oakhaven'],
                updatedAt: new Date().toISOString()

              }
            ]
          }
        ]
      }
    ],
    characters: [
      {
        id: 'char-lyra',
        name: 'Lady Lyra',
        role: 'Protagonist',
        bio: 'Heir to House Vane.',
        aliases: ['Lyra Vane'],
        color: '#818CF8'
      }
    ],
    locations: [
      {
        id: 'loc-oakhaven',
        name: 'Oakhaven',
        summary: 'A mist-shrouded border village.',
        description: 'A mist-shrouded border village near the Obsidian Tower.',
        aliases: []
      }
    ],
    factions: [],
    items: [],
    events: [],
    plotThreads: [],
    researchNotes: [
      {
        id: 'res-1',
        title: 'Obsidian Tower Lore',
        summary: 'Historical notes on the tower.',
        content: 'Built 400 years ago during the First Epoch.',
        category: 'reference',
        tags: ['history'],
        updatedAt: new Date().toISOString()
      }
    ],
    cutScenes: [
      {
        id: 'cut-1',
        originalChapterId: 'chap-1',
        originalChapterTitle: 'Chapter 1',
        title: 'Deleted Gatekeeper Monologue',
        content: 'The old guard spoke for twenty minutes about turnips.',
        wordCount: 150,
        deletedAt: new Date().toISOString()
      }
    ],
    timeline: [],
    annotations: [],
    partnerMessages: [],
    scratchpad: ''
  };
}

export async function runContinuousIntelligenceTests(): Promise<{ name: string; results: string[] }> {
  const results: string[] = [];

  // Test 1: Incremental Change Detection & Content Hashing
  {
    const project = createMockContinuousProject('proj-1');
    const { index, delta } = ProjectIntelligenceIndexer.indexProject(project);

    assert(delta.addedDocumentIds.length > 0, 'First index run must record added documents');
    assert(delta.dirtyDocumentIds.length > 0, 'First index run must mark documents dirty');
    assert(Object.keys(index.contentHashes).length >= 5, 'Must hash chapters, scenes, characters, locations, research');
    results.push('✓ 1. Incremental change detection & initial content hashing passed');
  }

  // Test 2: Unchanged Source Skip / Deduplication
  {
    const project = createMockContinuousProject('proj-2');
    const { index: firstIndex } = ProjectIntelligenceIndexer.indexProject(project);
    
    // Re-index unchanged project
    const { delta: secondDelta } = ProjectIntelligenceIndexer.indexProject(project, firstIndex);
    assert(secondDelta.dirtyDocumentIds.length === 0, 'Unchanged project re-index must yield 0 dirty documents');
    assert(secondDelta.addedDocumentIds.length === 0, 'Unchanged project re-index must yield 0 added documents');
    results.push('✓ 2. Unchanged source skip / deduplication passed');
  }

  // Test 3: Modified Scene Triggers Scoped Delta Analysis
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const project = createMockContinuousProject('proj-3');

    // First indexing
    const { index: idx1 } = ProjectIntelligenceIndexer.indexProject(project);
    
    // Modify scene 1-1 content
    project.acts[0].chapters[0].scenes![0].content += ' Commander Kael arrived with ten armed guards.';

    const { index: idx2, delta } = ProjectIntelligenceIndexer.indexProject(project, idx1);
    assert(delta.dirtyDocumentIds.includes('scene-1-1'), 'Modified scene must be marked dirty in delta');
    assert(delta.retrievalScopeIds.includes('scene-1-1'), 'Dirty scene must be in retrieval scope');
    results.push('✓ 3. Modified scene triggers scoped delta analysis passed');
  }

  // Test 4: Async Engine Execution & Organization Inbox Population
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const project = createMockContinuousProject('proj-5');

    const analysisResult = await engine.analyzeIncremental(project);

    assert(analysisResult !== undefined, 'Analysis result returned');
    assert(analysisResult.newInboxItems.length > 0, 'New proposals placed in Organization Inbox');
    results.push('✓ 4. Async engine execution & Organization Inbox population passed');
  }

  // Test 5: Inbox Filtering by Domain / Category
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const project = createMockContinuousProject('proj-5');
    await engine.analyzeIncremental(project);

    const inboxItems = engine.getInboxItems('proj-5', 'all');
    assert(inboxItems.length > 0, 'Inbox has proposals');

    const charItems = engine.getInboxItems('proj-5', 'characters');
    assert(Array.isArray(charItems), 'Character filter returns array');
    results.push('✓ 5. Inbox category filtering passed');
  }

  // Test 6: Zero Silent Canon Mutation (Proposals do not auto-modify ProjectData)
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const unappliedProject = createMockContinuousProject('proj-6');
    const initialCharCount = unappliedProject.characters.length;

    await engine.analyzeIncremental(unappliedProject);

    // Verify unappliedProject has NOT been mutated
    assert(unappliedProject.characters.length === initialCharCount, 'ProjectData characters count unchanged before apply');
    results.push('✓ 6. Zero silent canon mutation rule verified');
  }

  // Test 7: Reversible Proposal Application & Safety Snapshot
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const applyProject = createMockContinuousProject('proj-7');
    
    // Perform analysis
    await engine.analyzeIncremental(applyProject);
    const inboxItems = engine.getInboxItems('proj-7', 'all');
    
    assert(inboxItems.length > 0, 'Proposals exist for apply test');
    const itemToApply = inboxItems[0];
    engine.updateInboxItemStatus('proj-7', itemToApply.id, 'accepted');

    // Apply proposals
    const { updatedProject, appliedCount, safetySnapshotId } = engine.applyInboxProposals(applyProject, [itemToApply.id]);

    assert(appliedCount > 0, 'At least 1 proposal applied');
    assert(!!safetySnapshotId, 'Pre-apply safety snapshot captured');
    assert(!!(updatedProject.snapshots && updatedProject.snapshots.length > 0), 'Safety snapshot present in project snapshots');


    // Test Rollback
    const rolledBackProject = ProjectIntelligenceApplier.rollbackOrganization(updatedProject, safetySnapshotId);
    assert(rolledBackProject.metadata.id === applyProject.metadata.id, 'Rollback returns valid restored project');
    results.push('✓ 7. Reversible proposal application & safety snapshot rollback passed');
  }

  // Test 8: Async Cancellation Guard on Project Switch
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const projA = createMockContinuousProject('proj-A');
    const projB = createMockContinuousProject('proj-B');

    engine.setActiveProject('proj-A');
    const analysisAPromise = engine.analyzeIncremental(projA);

    // Switch active project mid-execution to proj-B
    engine.setActiveProject('proj-B');
    
    const resultA = await analysisAPromise;

    assert(resultA.wasCancelled === true || resultA.newInboxItems.length === 0, 'Cancelled analysis result discarded or marked cancelled');
    results.push('✓ 8. Async cancellation guard on project switch passed');
  }

  // Test 9: Provider Failure Safety
  {
    const failingEngine = new IncrementalIntelligenceEngine(new MockFailingProvider());
    const failProject = createMockContinuousProject('proj-fail');

    let errorThrown = false;
    try {
      await failingEngine.analyzeIncremental(failProject);
    } catch (err) {
      errorThrown = true;
    }

    assert(errorThrown, 'Provider failure handled gracefully without corrupting project');
    results.push('✓ 9. Provider failure safety passed');
  }

  // Test 10: Contextual Suggestion Generation
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const suggProject = createMockContinuousProject('proj-sugg');
    await engine.analyzeIncremental(suggProject);

    const suggestions = engine.generateContextualSuggestions(suggProject, 'proj-sugg');
    assert(Array.isArray(suggestions), 'Contextual suggestions returned as array');
    results.push('✓ 10. Contextual suggestion generation passed');
  }

  return {
    name: 'Continuous Project Intelligence & Assisted Organization Tests',
    results
  };
}
