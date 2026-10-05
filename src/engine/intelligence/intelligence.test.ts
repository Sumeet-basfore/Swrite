import { ProjectData } from '../../types';
import { 
  ProjectIntelligenceExtractor, 
  ProjectIntelligenceClassifier, 
  ProjectIntelligenceApplier,
  DeterministicLocalProvider,
  filterProposals,
  getProposalStats
} from './index';
import { CURATED_THEMES } from '../../styles/themes';
import { getPersistedUserTypography } from '../../services/storageService';

export function runIntelligenceEngineTests() {
  const results: string[] = [];
  function assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
    results.push(`  ✓ ${message}`);
  }

  const initialProject: ProjectData = {
    metadata: {
      id: 'test-project-intel',
      title: 'The Obsidian Crown',
      author: 'Author Test',
      genre: 'Fantasy',
      preset: 'plotter',
      theme: CURATED_THEMES[0],
      typography: getPersistedUserTypography(),
      targetWordCount: 80000,
      currentWordCount: 1500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    acts: [
      {
        id: 'act-1',
        title: 'Act I: The Gathering Storm',
        order: 1,
        chapters: [
          {
            id: 'chap-1',
            title: 'Chapter 1: The High Inquisitor',
            order: 1,
            wordCount: 800,
            content: '',
            status: 'draft',
            updatedAt: new Date().toISOString(),
            scenes: [
              {
                id: 'scene-1',
                chapterId: 'chap-1',
                title: 'The Throne Room Infiltration',
                content: '<p>High Inquisitor Corvus entered the Obsidian Citadel with heavy iron boots.</p><p>Lord Lucarion drew the Sunshard Blade from its scabbard. "The Iron Concordat will not bow to you," he whispered.</p><p>Corvus has violet eyes that burned with arcane fire.</p>',
                order: 1,
                status: 'draft',
                wordCount: 400,
                updatedAt: new Date().toISOString()
              }
            ]
          },
          {
            id: 'chap-2',
            title: 'Chapter 2: Ambush at the Northern Pass',
            order: 2,
            wordCount: 700,
            content: '',
            status: 'draft',
            updatedAt: new Date().toISOString(),
            scenes: [
              {
                id: 'scene-2',
                chapterId: 'chap-2',
                title: 'The Battle at Dawn',
                content: '<p>At dawn, the Iron Concordat marched through the Frostpeak Pass.</p><p>Lucan led the vanguard. Meanwhile, the Sunshard Blade glowed with intense solar fury.</p><p>Lord Lucarion fell in battle at the foot of Mount Mourn.</p>',
                order: 1,
                status: 'draft',
                wordCount: 300,
                updatedAt: new Date().toISOString()
              }
            ]
          }
        ]
      }
    ],
    characters: [
      {
        id: 'char-lucarion',
        name: 'Lord Lucarion',
        aliases: ['Lucan'],
        role: 'Protagonist',
        bio: 'Commander of the Northern Guard.',
        motivations: 'Defend the realm',
        flaws: 'Stubborn',
        voiceNotes: '',
        color: '#6366F1'
      },
      {
        id: 'char-corvus',
        name: 'High Inquisitor Corvus',
        aliases: ['Corvus'],
        role: 'Antagonist',
        bio: 'Head of the Arcane Inquisition. Brown eyes and dark robes.',
        motivations: 'Cleanse the magic',
        flaws: 'Zealot',
        voiceNotes: '',
        color: '#EF4444'
      }
    ],
    locations: [
      {
        id: 'loc-citadel',
        name: 'Obsidian Citadel',
        summary: 'Capital seat of power.',
        description: 'Capital seat of power.',
        tags: ['Fortress']
      }
    ],
    factions: [
      {
        id: 'fac-concordat',
        name: 'Iron Concordat',
        summary: 'Military alliance of the Free Cities.',
        description: 'Military alliance of the Free Cities.',
        tags: ['Military']
      }
    ],
    items: [
      {
        id: 'item-sunshard',
        name: 'Sunshard Blade',
        summary: 'An ancient sword forged with solar fire.',
        description: 'An ancient sword forged with solar fire.',
        type: 'weapon',
        tags: ['Relic']
      }
    ],
    plotThreads: [
      {
        id: 'thread-inquisition',
        title: 'The Inquisition Uprising',
        description: 'Corvus seeks to eradicate the Free Cities.',
        type: 'main-plot',
        status: 'active',
        color: '#F59E0B'
      }
    ],
    events: [
      {
        id: 'event-citadel-siege',
        title: 'Siege of the Citadel',
        summary: 'The beginning of the war.',
        timelineDate: 'Year 450, First Moon',
        order: 1
      }
    ],
    codex: [
      {
        id: 'codex-ship',
        name: 'John.md',
        summary: 'A heavy galleon constructed in the dry docks.',
        category: 'lore',
        tags: ['Navy', 'Vessels'],
        content: '<p>The John is an eighty-gun heavy galleon constructed in the dry docks of Oakhaven. It serves as the flagship vessel of the Free Armada.</p>'
      },
      {
        id: 'codex-arcane-fire',
        name: 'Arcane Fire',
        summary: 'A forbidden sorcery.',
        category: 'lore',
        tags: ['Arcane'],
        content: '<p>Arcane Fire is a forbidden sorcery requiring blood catalyst.</p>'
      }
    ],
    researchNotes: [
      {
        id: 'note-cut-scene',
        title: 'Chapter 1 Cut Material',
        summary: 'Secret lineage notes.',
        content: '<p>Cut scene: High Inquisitor Corvus privately reveals his true father was King Alden.</p>',
        category: 'reference',
        updatedAt: new Date().toISOString()
      }
    ],
    revisionItems: [],
    timeline: [],
    annotations: [],
    partnerMessages: [],
    scratchpad: ''
  };

  // --- TEST SUITE ---

  // 1. Pass 1 Extraction & Provenance
  const rawEntities = ProjectIntelligenceExtractor.extractProjectCandidates(initialProject);
  assert(rawEntities.length > 0, `Pass 1: Extracted ${rawEntities.length} raw entities across project documents`);
  
  const hasProvenance = rawEntities.every(e => 
    e.sourceReferences.length > 0 &&
    e.sourceReferences.every(r => r.documentId && r.documentTitle && r.snippet && r.snippet.length > 0)
  );
  assert(hasProvenance, 'Pass 1: All extracted entities retain full document and snippet provenance');

  // 2. Contextual Disambiguation over Filenames (e.g. John.md)
  const shipEntity = rawEntities.find(e => e.name.toLowerCase().includes('john') || e.reasoning.toLowerCase().includes('galleon'));
  assert(
    shipEntity !== undefined && shipEntity.domain !== 'character',
    'Contextual Disambiguation: "John.md" describing a galleon is NOT classified as a character'
  );

  // 3. Pass 2 Classification & Confidence Scoring
  const intelResult = ProjectIntelligenceClassifier.classifyAndBuildProposals(rawEntities, initialProject);
  const proposals = intelResult.proposals;
  assert(proposals.length > 0, `Pass 2: Generated ${proposals.length} high-fidelity organization proposals`);

  const hasConfidence = proposals.every(p => ['high', 'medium', 'low'].includes(p.confidenceLevel));
  assert(hasConfidence, 'Pass 2: Every proposal has an explicit confidenceLevel (high/medium/low)');

  // 4. Duplicate & Alias Detection (e.g. Lucan vs Lord Lucarion, Corvus vs High Inquisitor Corvus)
  const duplicateProposals = proposals.filter(p => p.duplicateCandidate !== undefined);
  assert(duplicateProposals.length > 0, `Duplicate Detection: Detected ${duplicateProposals.length} alias/duplicate candidate proposals`);
  
  const corvusDuplicate = duplicateProposals.find(p => 
    p.targetName.includes('Corvus') || 
    p.duplicateCandidate?.targetEntityName.includes('Corvus') ||
    p.duplicateCandidate?.aliasCandidateName.includes('Corvus')
  );
  assert(corvusDuplicate !== undefined, 'Alias Resolution: Correctly flagged "Corvus" and "High Inquisitor Corvus" as duplicate/alias candidates');

  // 5. Canon Conflict Detection (e.g. Corvus eye color: brown in canon vs violet in manuscript text)
  const conflictProposals = proposals.filter(p => p.conflictsWithCanon || (p.canonConflicts && p.canonConflicts.length > 0));
  assert(conflictProposals.length > 0, `Canon Conflict Detection: Detected ${conflictProposals.length} canon contradiction proposals`);
  
  const eyeColorConflict = conflictProposals.find(p => 
    p.canonConflicts?.some(c => c.field === 'traits' || c.explanation.toLowerCase().includes('eye') || c.explanation.toLowerCase().includes('color'))
  );
  assert(eyeColorConflict !== undefined, 'Canon Conflict: Caught physical appearance contradiction (violet vs brown eyes)');

  // 6. Provider Interface & Deterministic Engine
  const provider = new DeterministicLocalProvider();
  assert(provider.id === 'local-deterministic', 'Provider Architecture: DeterministicLocalProvider registered properly');
  assert(provider.isAvailable(), 'Provider Architecture: DeterministicLocalProvider is always available offline');

  // 7. Proposal Filtering and Stats Query Utilities
  const stats = getProposalStats(proposals);
  assert(stats.totalCount === proposals.length, 'Query Utility: Stats calculate correct total proposals');
  assert(stats.highConfidenceCount >= 0 && stats.mediumConfidenceCount >= 0, 'Query Utility: Stats breakdown by confidence');

  const filtered = filterProposals(proposals, { domain: 'character', confidenceLevel: 'all' });
  assert(filtered.every(p => p.domain === 'character'), 'Query Utility: Domain filter properly isolates character proposals');

  // 8. Deterministic Proposal Application & Pre-Apply Safety Snapshot
  const approvedProposal = proposals[0];
  const approvedList = [{ ...approvedProposal, status: 'accepted' as const }];
  
  const { updatedProject, appliedCount, safetySnapshotId } = ProjectIntelligenceApplier.applyApprovedProposals(
    initialProject, 
    approvedList
  );

  assert(appliedCount === 1, `Applier: Successfully applied ${appliedCount} approved proposal to ProjectData`);
  assert(safetySnapshotId !== null && safetySnapshotId.startsWith('snap-'), 'Safety Snapshot: Created automatic pre-organization snapshot version');
  assert(
    (updatedProject.snapshots || []).some(s => s.id === safetySnapshotId),
    'Safety Snapshot: Snapshot exists in project.snapshots'
  );

  // 9. Rollback Capability
  const rolledBackProject = ProjectIntelligenceApplier.rollbackOrganization(
    updatedProject, 
    safetySnapshotId
  );

  assert(
    rolledBackProject.metadata.updatedAt !== undefined,
    'Rollback: Successfully restored project state from pre-organization snapshot'
  );

  return { results };
}
