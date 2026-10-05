import { ContinuityEngine } from './continuityEngine';
import { ProjectData } from '../types';

export function runContinuityEngineTests() {
  const results: string[] = [];

  // Mock project setup
  const baseProject: ProjectData = {
    metadata: {
      id: 'proj-continuity-test',
      title: 'Continuity Verification Test',
      author: 'Tester',
      genre: 'Fantasy Mystery',
      targetWordCount: 50000,
      currentWordCount: 12000,
      preset: 'plotter',
      theme: {} as any,
      typography: {} as any,
      continuityConfig: {
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
      },
      createdAt: '2026-10-01',
      updatedAt: '2026-10-04',
    },
    acts: [
      {
        id: 'act-1',
        title: 'Act I: The Initiation',
        order: 1,
        chapters: [
          {
            id: 'ch-1',
            title: 'The Silent Street',
            order: 1,
            actId: 'act-1',
            content: 'Lucan walked down the rain-swept cobblestone alley.',
            wordCount: 1500,
            status: 'revised',
            povCharacterId: 'char-lucan',
            updatedAt: '2026-10-01',
            scenes: [],
          },
          {
            id: 'ch-2',
            title: 'The Whispering Shadows',
            order: 2,
            actId: 'act-1',
            content: 'Lucan whispered of "The Order" in the shadows of the tavern.',
            wordCount: 2000,
            status: 'draft',
            povCharacterId: 'char-lucan',
            updatedAt: '2026-10-02',
            scenes: [
              {
                id: 'sc-2-1',
                title: 'Tavern Discussion',
                chapterId: 'ch-2',
                order: 1,
                wordCount: 2000,
                status: 'draft',
                povCharacterId: 'char-lucan',
                locationIds: ['loc-capital-city'],
                content: 'Lucan warned them about The Order and the impending strike.',
                updatedAt: '2026-10-02',
              }
            ],
          },
          {
            id: 'ch-3',
            title: 'The Fall',
            order: 3,
            actId: 'act-1',
            content: 'Garrick was executed in the town square.',
            wordCount: 1800,
            status: 'final',
            updatedAt: '2026-10-03',
            scenes: [],
          },
          {
            id: 'ch-4',
            title: 'The Aftermath',
            order: 4,
            actId: 'act-1',
            content: 'The city mourned after the betrayal.',
            wordCount: 1600,
            status: 'draft',
            updatedAt: '2026-10-03',
            scenes: [],
          },
          {
            id: 'ch-5',
            title: 'The Return to the Docks',
            order: 5,
            actId: 'act-1',
            content: 'Garrick emerged unexpectedly from the shadows.',
            wordCount: 1400,
            status: 'draft',
            povCharacterId: 'char-garrick', // Dead character appearing!
            updatedAt: '2026-10-04',
            scenes: [],
          },
          {
            id: 'ch-6',
            title: 'The Revelation',
            order: 6,
            actId: 'act-1',
            content: 'Lucan finally learned the truth about The Order.',
            wordCount: 2200,
            status: 'draft',
            povCharacterId: 'char-lucan',
            updatedAt: '2026-10-04',
            scenes: [],
          }
        ]
      }
    ],
    characters: [
      {
        id: 'char-lucan',
        name: 'Lucan',
        role: 'Protagonist',
        bio: 'A rogue seeking the truth.',
        knowledgeList: [
          {
            id: 'k-order',
            information: 'The Order',
            learnedAt: 'Chapter 6', // Learned in Ch 6, but mentioned in Ch 2!
            source: 'Archivist Malric',
            certainty: 'certain',
          }
        ],
        relationships: [
          {
            targetId: 'char-kassandra',
            targetName: 'Kassandra',
            relation: 'Sworn Enemy',
            currentState: 'Hostile Nemesis',
          }
        ],
        factionIds: ['fac-guild-assassins', 'fac-royal-guard'], // Rival factions!
      },
      {
        id: 'char-garrick',
        name: 'Garrick',
        role: 'Supporting',
        bio: 'A fallen warrior.',
        currentState: 'Dead (Ch 3)', // Marked dead in Ch 3, appears in Ch 5!
      },
      {
        id: 'char-kassandra',
        name: 'Kassandra',
        role: 'Antagonist',
        bio: 'High Inquisitor.',
        relationships: [
          {
            targetId: 'char-lucan',
            targetName: 'Lucan',
            relation: 'Allied Mentor', // Asymmetry with Lucan's "Sworn Enemy"!
            currentState: 'Protective Friend',
          }
        ]
      }
    ],
    factions: [
      {
        id: 'fac-guild-assassins',
        name: 'Guild of Assassins',
        summary: 'Underworld killers.',
        description: 'Shadow operatives.',
        rivalFactionIds: ['fac-royal-guard'],
      },
      {
        id: 'fac-royal-guard',
        name: 'Royal Guard',
        summary: 'Sworn crown protectors.',
        description: 'Elite defenders.',
        rivalFactionIds: ['fac-guild-assassins'],
      }
    ],
    events: [
      {
        id: 'evt-climax',
        title: 'The Citadel Breach',
        summary: 'The breach created by the earlier explosion.',
        order: 1,
        chapterId: 'ch-2', // Placed in Ch 2
        causedByEventId: 'evt-bomb', // Caused by evt-bomb in Ch 4!
      },
      {
        id: 'evt-bomb',
        title: 'The Powder Keg Ignition',
        summary: 'The detonator ignited the lower fortress.',
        order: 2,
        chapterId: 'ch-4', // Placed in Ch 4
      }
    ],
    plotThreads: [
      {
        id: 'thread-stolen-blade',
        title: 'The Stolen Heirloom Blade',
        description: 'Who stole the sacred dagger?',
        type: 'mystery',
        status: 'active',
        priority: 'high',
        introducedIn: 'Chapter 1',
        lastTouchedIn: 'ch-1', // Last touched in Ch 1, manuscript is at Ch 6 (gap = 5 >= 3)!
      }
    ],
    codex: [
      {
        id: 'char-lucan',
        category: 'character',
        name: 'Lucan',
        role: 'Antagonist', // Mismatch with Character Bible's 'Protagonist'!
        summary: 'Codex summary',
        content: 'Dossier content',
      }
    ],
    timeline: [],
    annotations: [],
    partnerMessages: [],
    scratchpad: '',
  };

  // Run full audit
  const warnings = ContinuityEngine.runAudit(baseProject);

  // 1. Test Knowledge Check
  const knowledgeWarn = warnings.find(w => w.type === 'knowledge');
  if (knowledgeWarn && knowledgeWarn.entityId === 'char-lucan' && knowledgeWarn.evidence.length === 2) {
    results.push('✓ Test 1 Passed: Character Knowledge premature reference detected with evidence');
  } else {
    throw new Error('Test 1 Failed: Character Knowledge warning was not generated correctly.');
  }

  // 2. Test Character State Check
  const stateWarn = warnings.find(w => w.type === 'state');
  if (stateWarn && stateWarn.entityId === 'char-garrick' && stateWarn.severity === 'critical') {
    results.push('✓ Test 2 Passed: Deceased character unexpected appearance detected');
  } else {
    throw new Error('Test 2 Failed: Character State warning was not generated correctly.');
  }

  // 3. Test Timeline Causality Inversion Check
  const timelineWarn = warnings.find(w => w.type === 'timeline');
  if (timelineWarn && timelineWarn.title.includes('Causality Inversion')) {
    results.push('✓ Test 3 Passed: Timeline causality inversion detected');
  } else {
    throw new Error('Test 3 Failed: Timeline Causality warning was not generated correctly.');
  }

  // 4. Test Character Attributes (Codex mismatch, rival factions, relationship asymmetry)
  const attrWarns = warnings.filter(w => w.type === 'attributes');
  if (attrWarns.length >= 2) {
    results.push(`✓ Test 4 Passed: Character attribute & relationship asymmetry detected (${attrWarns.length} issues)`);
  } else {
    throw new Error('Test 4 Failed: Expected at least 2 attribute conflict warnings.');
  }

  // 5. Test Plot Thread Dormancy Check
  const threadWarn = warnings.find(w => w.type === 'thread-dormancy');
  if (threadWarn && threadWarn.entityId === 'thread-stolen-blade') {
    results.push('✓ Test 5 Passed: Plot thread dormancy detected (>3 chapters gap)');
  } else {
    throw new Error('Test 5 Failed: Plot thread dormancy warning was not generated correctly.');
  }

  // 6. Test Dismiss / Ignore and Mark Intentional
  const auditWithIgnored = ContinuityEngine.runAudit(baseProject, {
    ignoredWarningIds: [knowledgeWarn.id],
    intentionalWarnings: [
      {
        id: 'intent-1',
        warningId: stateWarn.id,
        warningTitle: stateWarn.title,
        type: 'state',
        reason: 'Garrick faked his death in chapter 3 as a plot twist.',
        markedAt: '2026-10-04',
      }
    ]
  });

  const updatedKnowledge = auditWithIgnored.find(w => w.id === knowledgeWarn.id);
  const updatedState = auditWithIgnored.find(w => w.id === stateWarn.id);

  if (updatedKnowledge?.isIgnored && updatedState?.isIntentional && updatedState?.intentionalReason?.includes('faked his death')) {
    results.push('✓ Test 6 Passed: Ignore and Mark Intentional state persisted and annotated');
  } else {
    throw new Error('Test 6 Failed: Ignore and Intentional annotations did not apply.');
  }

  return { passed: true, results };
}
