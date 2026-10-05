/**
 * Swrite World Simulation Engine — Test Fixture
 * 
 * Provides a clean, strongly-typed ProjectData instance for isolated unit and integration testing.
 */

import { ProjectData } from '../../types';
import { CURATED_THEMES, DEFAULT_TYPOGRAPHY } from '../../styles/themes';

export function createSimulationTestProject(): ProjectData {
  return {
    metadata: {
      id: 'proj-sim-test',
      title: 'The Sovereign Realms of Aethelgard',
      author: 'A. Test Author',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      targetWordCount: 50000,
      currentWordCount: 15000,
      genre: 'Fantasy / Political Worldbuilding',
      preset: 'plotter',
      theme: CURATED_THEMES[0],
      typography: DEFAULT_TYPOGRAPHY
    },
    acts: [
      {
        id: 'act-1',
        title: 'Act I: The Shifting Borders',
        order: 1,
        chapters: [
          {
            id: 'ch-1',
            title: 'Chapter 1: The Frontier Outposts',
            actId: 'act-1',
            order: 1,
            wordCount: 3500,
            status: 'in-progress',
            content: 'The border garrisons reported unusual movements along the river sluices.',
            scenes: [
              {
                id: 'sc-1',
                title: 'Scene 1: Watchtower at Dawn',
                chapterId: 'ch-1',
                order: 1,
                wordCount: 1800,
                content: 'Lucan stood atop the battlements watching the morning mist rise.',
                status: 'revised',
                updatedAt: '2026-01-01T00:00:00Z'
              }
            ],
            updatedAt: '2026-01-01T00:00:00Z'
          }
        ]
      }
    ],
    characters: [
      {
        id: 'char-1',
        name: 'Lord Lucan',
        role: 'Protagonist',
        bio: 'Warden of the Southern March.',
        currentState: {
          emotional: 'Alert',
          physical: 'Fit',
          status: 'active'
        }
      }
    ],
    factions: [
      {
        id: 'fac-solaria',
        name: 'Kingdom of Solaria',
        type: 'government',
        summary: 'Southern agricultural empire',
        description: 'Rich agricultural lands with high maritime commerce.'
      },
      {
        id: 'fac-nordmark',
        name: 'Iron Reaches of Nordmark',
        type: 'military',
        summary: 'Northern industrial bastion',
        description: 'Heavy foundry realm with vast iron reserves and disciplined garrisons.'
      }
    ],
    locations: [
      {
        id: 'loc-capital',
        name: 'Sunspire Citadel',
        type: 'city',
        summary: 'Capital seat of Solaria',
        description: 'Towering marble citadel overlooking the great estuary.'
      }
    ],
    plotThreads: [
      {
        id: 'th-border-war',
        title: 'The Escalating Frontier Conflict',
        type: 'main-plot',
        status: 'active',
        description: 'Friction along the neutral trade buffer zone.'
      }
    ],
    events: [],
    snapshots: [],
    revisionRounds: [],
    revisionItems: [],
    timeline: [],
    annotations: [],
    partnerMessages: [],
    scratchpad: ''
  };
}
