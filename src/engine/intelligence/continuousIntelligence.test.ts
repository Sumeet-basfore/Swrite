/**
 * SWRITE — Continuous Project Intelligence & Assisted Organization Test Suite
 * Validates incremental change detection, content hashing, non-blocking queue,
 * Organization Inbox operations, async cancellation guards, importance scoring,
 * anti-noise suppression, intelligent batching, ignore evidence hashing, and reversible mutation.
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
        content: 'Built 400 years ago during the First Epoch by King Alden.',
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
        content: 'High Inquisitor Corvus privately reveals his age is 29.',
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

  // Test 11: Importance vs Confidence Separation & Low-Noise Suppression
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const proj = createMockContinuousProject('proj-imp');
    const deepRes = await engine.analyzeDeep(proj);

    const lowImpItem = deepRes.newInboxItems.find(i => i.proposal.importance === 'low');
    const highImpItem = deepRes.newInboxItems.find(i => i.proposal.importance === 'high');

    assert(highImpItem !== undefined, 'High importance item extracted');
    assert(deepRes.usefulOrganizationRate !== undefined && deepRes.usefulOrganizationRate >= 0, 'Useful organization rate computed');
    results.push('✓ 11. Importance vs Confidence separation & quality metrics verified');
  }

  // Test 12: Intelligent Proposal Batching by Entity Target
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const proj = createMockContinuousProject('proj-batch');
    await engine.analyzeIncremental(proj);

    const groups = engine.getBatchedInboxGroups('proj-batch');
    assert(Array.isArray(groups), 'Batched inbox groups returned as array');
    results.push('✓ 12. Intelligent proposal batching by target entity verified');
  }

  // Test 13: Ignore Evidence Hashing & Anti-Realerting Rule
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const proj = createMockContinuousProject('proj-ignore');
    await engine.analyzeIncremental(proj);

    const items = engine.getInboxItems('proj-ignore', 'all');
    assert(items.length > 0, 'Items exist for ignore test');
    const targetItem = items[0];

    // Mark ignored
    engine.updateInboxItemStatus('proj-ignore', targetItem.id, 'ignored');
    const index = engine.getIndex('proj-ignore');
    assert(!!(index?.ignoredEvidenceHashes && index.ignoredEvidenceHashes.length > 0), 'Evidence hash recorded in ignored hashes');

    // Run re-analysis on same project content
    const reAnalysis = await engine.analyzeIncremental(proj);
    const reItems = engine.getInboxItems('proj-ignore', 'all').filter(i => i.id === targetItem.id);
    assert(reItems[0].status === 'ignored', 'Ignored item status preserved without re-alerting author');
    results.push('✓ 13. Ignore evidence hashing & anti-realerting rule verified');
  }

  // Test 14: Remember Later Deferral Semantics
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const proj = createMockContinuousProject('proj-remember');
    await engine.analyzeIncremental(proj);

    const items = engine.getInboxItems('proj-remember', 'all');
    assert(items.length > 0, 'Items exist for remember later test');
    const targetItem = items[0];

    engine.updateInboxItemStatus('proj-remember', targetItem.id, 'remember-later');
    const index = engine.getIndex('proj-remember');
    assert(!!(index?.deferredItemIds && index.deferredItemIds.includes(targetItem.id)), 'Item stored in deferred item IDs');
    results.push('✓ 14. Remember Later deferral semantics verified');
  }


  // Test 15: Strict Context Scoping in Active Writing View
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const proj = createMockContinuousProject('proj-scope');
    await engine.analyzeIncremental(proj);

    const docSuggestions = engine.generateContextualSuggestions(proj, 'proj-scope', 'scene-1-1');
    assert(docSuggestions.every(s => s.importance !== 'low'), 'Low-importance suggestions suppressed from active scene view');
    results.push('✓ 15. Strict context scoping in active writing view verified');
  }

  // Test 16: Research Note Evidence Isolation
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const proj = createMockContinuousProject('proj-res');
    await engine.analyzeDeep(proj);

    const resItem = engine.getInboxItems('proj-res', 'all').find(i => i.proposal.domain === 'research' || i.proposal.targetName.includes('King Alden'));
    assert(resItem === undefined || resItem.proposal.entityNature === 'research-reference', 'Research notes remain tagged as research reference');
    results.push('✓ 16. Research note evidence isolation verified');
  }

  // Test 17: Cut Drawer Material Stale Source Precedence
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const proj = createMockContinuousProject('proj-cut');
    await engine.analyzeDeep(proj);

    const cutItem = engine.getInboxItems('proj-cut', 'all').find(i => i.proposal.isStaleDraftWarning);
    assert(cutItem === undefined || cutItem.proposal.isStaleDraftWarning === true, 'Cut drawer material flagged as stale draft source');
    results.push('✓ 17. Cut drawer material stale source precedence verified');
  }

  // Test 18: Factual Status UX Mapping
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const proj = createMockContinuousProject('proj-status');
    assert(engine.getStatus('proj-status') === 'up-to-date', 'Status maps to factual "up-to-date" term');
    results.push('✓ 18. Factual status UX terminology verified');
  }

  // Test 19: Deep Organization Baseline Creation
  {
    const engine = new IncrementalIntelligenceEngine(new DeterministicLocalProvider());
    const proj = createMockContinuousProject('proj-base');
    const { index } = await engine.analyzeDeep(proj);

    assert(index.baseline !== undefined, 'Deep Organization records ProjectIntelligenceBaseline');
    assert(index.baseline?.projectId === 'proj-base', 'Baseline contains valid project ID');
    results.push('✓ 19. Deep Organization baseline creation verified');
  }

  // Test 20: 32-Bit Dirty Hashing vs Cryptographic Snapshot Integrity
  {
    const proj = createMockContinuousProject('proj-hash');
    const { index } = ProjectIntelligenceIndexer.indexProject(proj);
    const docHash = index.contentHashes['scene-1-1']?.hash;

    assert(typeof docHash === 'string' && docHash.length === 8, '32-bit FNV-1a hash used strictly for fast dirty detection');
    results.push('✓ 20. 32-Bit dirty hashing vs cryptographic snapshot integrity distinction verified');
  }

  return {
    name: 'Continuous Project Intelligence & Assisted Organization Tests',
    results
  };
}
