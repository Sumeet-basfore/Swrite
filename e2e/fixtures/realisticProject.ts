import { ProjectData, Act, Chapter, Scene, Character, Location, Faction, PlotThread, Event, RevisionRound, Finding, ManuscriptSnapshot } from '../../src/types';
import { CURATED_THEMES, DEFAULT_TYPOGRAPHY } from '../../src/styles/themes';
import { PUBLICATION_PRESETS } from '../../src/services/compilerService';

/**
 * Generates a realistic, comprehensive, literary manuscript test project (approx 20,000+ words)
 * with 3 Acts, 15 Chapters, 30+ Scenes, 10+ Characters, 8+ Locations, 5+ Factions, 5+ Plot Threads,
 * 15+ Events (with flashback and flashforward), Character State & Relationships,
 * Revision items, Proofreading findings, Continuity warnings, Snapshots, and Publication profiles.
 */
export function createRealisticNovelProject(): ProjectData {
  const characters: Character[] = [
    {
      id: 'char-lucan',
      name: 'Lucan Graves',
      role: 'Protagonist',
      archetype: 'The Reluctant Seeker',
      tagline: 'Disgraced archivist carrying the cipher of the Silver Weft.',
      bio: 'Former keeper of the Sunken Scriptorium, stripped of vestments after transcribing forbidden celestial topologies.',
      color: '#6366F1',
      currentState: {
        emotional: 'Guarded and hyper-vigilant',
        physical: 'Persistent tremor in right forearm from aether-burns',
        currentConflict: 'Torn between burning the cipher and decoding the seventh glyph before dawn.',
        status: 'active'
      },
      goals: [
        { id: 'goal-lucan-1', description: 'Decode the final glyph of the Silver Weft before the Inquisitor finds him', status: 'active', priority: 'critical', chapterId: 'ch-01' },
        { id: 'goal-lucan-2', description: 'Protect Elena from the Guild retribution', status: 'active', priority: 'high', chapterId: 'ch-03' },
        { id: 'goal-lucan-3', description: 'Escape the lower ring without leaving a residual resonance trace', status: 'resolved', priority: 'medium', chapterId: 'ch-02' }
      ],
      beliefs: [
        { id: 'bel-lucan-1', statement: 'The Scriptorium elders deliberately erased the Seventh Accord', certainty: 'conviction', status: 'active' },
        { id: 'bel-lucan-2', statement: 'Elena can be trusted with the cipher fragments', certainty: 'wavering', status: 'questioned' }
      ],
      secrets: [
        { id: 'sec-lucan-1', title: 'The Stolen Index', content: 'Carries a shard of the living glass concealed under his left cuff', status: 'concealed' }
      ],
      knowledgeList: [
        { id: 'kn-lucan-1', statement: 'The Guild master was assassinated using frost-vitriol', information: 'The Guild master was assassinated using frost-vitriol', learnedAt: 'sc-01-01', certainty: 'certain', status: 'known' }
      ],
      knowledge: ['The Guild master was assassinated using frost-vitriol'],
      relationships: [
        { targetId: 'char-elena', targetName: 'Elena Vance', relation: 'Cautious Ally', notes: 'Shared history during the Scriptorium fire.' },
        { targetId: 'char-inquisitor', targetName: 'Inquisitor Malakor', relation: 'Nemesis', notes: 'Relentlessly pursuing Lucan for heresy.' },
        { targetId: 'char-corvus', targetName: 'Corvus Blackwood', relation: 'Informant', notes: 'Brokers passage through the Drowned Quays.' }
      ]
    },
    {
      id: 'char-elena',
      name: 'Elena Vance',
      role: 'Allied Scholar',
      archetype: 'The Alchemical Hermit',
      tagline: 'Apothecary and dissident rune-caster.',
      bio: 'Operates an illicit distillation lab beneath the bell-foundry in Low Ashfall.',
      color: '#10B981',
      currentState: {
        emotional: 'Calculating and impatient',
        physical: 'Stained fingertips from sulfurous reagents',
        currentConflict: 'Must stabilize the unstable distillation vessel while concealing Lucan.',
        status: 'active'
      },
      goals: [
        { id: 'goal-elena-1', description: 'Synthesize a counter-reagent against the Guild toxin', status: 'active', priority: 'critical', chapterId: 'ch-02' },
        { id: 'goal-elena-2', description: 'Secure safe passage across the Iron Bridge', status: 'active', priority: 'high', chapterId: 'ch-05' }
      ],
      beliefs: [
        { id: 'bel-elena-1', statement: 'Alchemy without truth is merely refined murder', certainty: 'conviction', status: 'active' }
      ],
      secrets: [
        { id: 'sec-elena-1', title: 'Guild Bloodline', content: 'She is the estranged niece of the High Chancellor.', status: 'concealed' }
      ],
      knowledgeList: [],
      knowledge: [],
      relationships: [
        { targetId: 'char-lucan', targetName: 'Lucan Graves', relation: 'Comrade in Exile', notes: 'Mutual protection pact.' }
      ]
    },
    {
      id: 'char-inquisitor',
      name: 'Inquisitor Malakor',
      role: 'Antagonist',
      archetype: 'The Zealot Inquisitor',
      tagline: 'High Arbiter of the Iron Synod.',
      bio: 'Commanding officer of the Synod Purifiers, tasked with eradicating unauthorized historical codices.',
      color: '#EF4444',
      currentState: {
        emotional: 'Cold, relentless, completely assured',
        physical: 'Iron-plated left gauntlet; carries the Synod ceremonial rapier',
        currentConflict: 'Wants Lucan taken alive to confess the location of the lost Archives.',
        status: 'active'
      },
      goals: [
        { id: 'goal-inq-1', description: 'Capture Lucan Graves alive and recover the Silver Weft', status: 'active', priority: 'critical', chapterId: 'ch-01' }
      ],
      beliefs: [
        { id: 'bel-inq-1', statement: 'Order is maintained solely through liturgical uniformity', certainty: 'absolute', status: 'active' }
      ],
      secrets: [],
      knowledgeList: [],
      knowledge: [],
      relationships: [
        { targetId: 'char-lucan', targetName: 'Lucan Graves', relation: 'Quarry', notes: 'Orders are dead or alive, preference for alive.' }
      ]
    },
    {
      id: 'char-corvus',
      name: 'Corvus Blackwood',
      role: 'Supporting',
      archetype: 'The Smuggler Kingpin',
      tagline: 'Lord of the Drowned Quays and river contraband.',
      bio: 'Controls the canal sluices and the midnight skiffs navigating the subterranean waterways.',
      color: '#F59E0B',
      currentState: { emotional: 'Pragmatic and mercenary', physical: 'Limp from an old harbor brawl', status: 'active' },
      goals: [{ id: 'goal-corv-1', description: 'Extract 500 gold sovereign from the Synod evacuation', status: 'active', priority: 'medium' }],
      beliefs: [],
      secrets: [],
      knowledgeList: [],
      knowledge: [],
      relationships: []
    },
    {
      id: 'char-mireille',
      name: 'Lady Mireille de Vos',
      role: 'Supporting',
      archetype: 'The Patrician Diplomat',
      tagline: 'Noble patron harboring hidden sympathies for the reformist faction.',
      bio: 'Navigates high court politics in the Upper Spire while quietly funding the underground presses.',
      color: '#8B5CF6',
      currentState: { emotional: 'Tense beneath an aristocratic smile', status: 'active' },
      goals: [],
      beliefs: [],
      secrets: [],
      knowledgeList: [],
      knowledge: [],
      relationships: []
    },
    {
      id: 'char-valerius',
      name: 'Master Valerius',
      role: 'Supporting',
      archetype: 'The Scriptorium Custodian',
      tagline: 'Senior librarian whose silence was bought with blood.',
      bio: 'Taught Lucan the art of palimpsest restoration before betraying him to the Synod.',
      color: '#EC4899',
      currentState: { emotional: 'Tormented by guilt', status: 'active' },
      goals: [],
      beliefs: [],
      secrets: [],
      knowledgeList: [],
      knowledge: [],
      relationships: []
    },
    {
      id: 'char-freya',
      name: 'Freya Lind',
      role: 'Supporting',
      archetype: 'The Clockwork Engineer',
      tagline: 'Mechanist specializing in pneumatic lock-mechanisms and atmospheric gauges.',
      bio: 'Maintains the steam conduits and subterranean pressure vaults beneath the citadel.',
      color: '#06B6D4',
      currentState: { emotional: 'Excited by pneumatic oddities', status: 'active' },
      goals: [],
      beliefs: [],
      secrets: [],
      knowledgeList: [],
      knowledge: [],
      relationships: []
    },
    {
      id: 'char-orren',
      name: 'Captain Orren',
      role: 'Supporting',
      archetype: 'The Weary Watchman',
      tagline: 'City Watch veteran who looks the other way for five silver coins.',
      bio: 'Patrols the Ashfall toll gates with tired cynicism.',
      color: '#64748B',
      currentState: { emotional: 'Numb to violence', status: 'active' },
      goals: [],
      beliefs: [],
      secrets: [],
      knowledgeList: [],
      knowledge: [],
      relationships: []
    },
    {
      id: 'char-theron',
      name: 'Theron the Silent',
      role: 'Supporting',
      archetype: 'The Mute Courier',
      tagline: 'Fast runner through the roof-walks and chimney flues.',
      bio: 'Delivers sealed wax cylinders without ever reading the wax marks.',
      color: '#14B8A6',
      currentState: { emotional: 'Silent and swift', status: 'active' },
      goals: [],
      beliefs: [],
      secrets: [],
      knowledgeList: [],
      knowledge: [],
      relationships: []
    },
    {
      id: 'char-kael',
      name: 'Kaelen Thorne',
      role: 'Supporting',
      archetype: 'The Mercenary Blade',
      tagline: 'Hired guard with an oath sworn to Lady Mireille.',
      bio: 'Former legionnaire with razor-sharp reflexes and a heavy iron zweihänder.',
      color: '#D97706',
      currentState: { emotional: 'Ready for engagement', status: 'active' },
      goals: [],
      beliefs: [],
      secrets: [],
      knowledgeList: [],
      knowledge: [],
      relationships: []
    }
  ];

  const locations: Location[] = [
    { id: 'loc-scriptorium', name: 'The Sunken Scriptorium', description: 'Subterranean archives submerged in mineral water beneath the Grand Cathedral.' },
    { id: 'loc-ashfall', name: 'Low Ashfall Quarter', description: 'Industrial basin heavy with coal smog, copper refineries, and narrow alleys.' },
    { id: 'loc-foundry', name: 'The Bell-Foundry Loft', description: 'Elena Vance clandestine laboratory nestled between roaring bronze furnaces.' },
    { id: 'loc-quays', name: 'The Drowned Quays', description: 'Rotting timber docks and murky canal locks on the lower harbor.' },
    { id: 'loc-spire', name: 'The High Spire of the Synod', description: 'Gothic stone monolith rising above the fog where the Inquisitors hold court.' },
    { id: 'loc-bridge', name: 'The Great Iron Bridge', description: 'Massive truss bridge spanning the chasm between Upper Highspire and Low Ashfall.' },
    { id: 'loc-vaults', name: 'The Pneumatic Pressure Vaults', description: 'Hissing pipe mazes maintained by Freya Lind deep in the foundation bedrock.' },
    { id: 'loc-salons', name: 'The Mirrored Salons of House Vos', description: 'Opulent gilded rooms where Mireille hosts clandestine political gatherings.' }
  ];

  const factions: Faction[] = [
    { id: 'fac-synod', name: 'The Iron Synod', description: 'Religious and military authority enforcing ideological orthodoxy across the city.', alignment: 'Authoritarian Order' },
    { id: 'fac-scholars', name: 'The Cipher Guild', description: 'Clandestine network of archivists, scribes, and outlawed historians.', alignment: 'Reformist Knowledge' },
    { id: 'fac-harbor', name: 'The Quay Smugglers', description: 'Syndicate controlling canal waterways, contraband, and midnight transport.', alignment: 'Mercenary Neutral' },
    { id: 'fac-nobility', name: 'The High Spire Aristocracy', description: 'Wealthy patricians jockeying for imperial favor amidst growing civic unrest.', alignment: 'Self-Preservation' },
    { id: 'fac-mechanists', name: 'The Ironwright Guild', description: 'Engineers maintaining the pneumatic boilers, bridges, and municipal infrastructure.', alignment: 'Pragmatic Neutral' }
  ];

  const plotThreads: PlotThread[] = [
    {
      id: 'th-cipher',
      title: 'The Silver Weft Cipher',
      name: 'The Silver Weft Cipher',
      type: 'main-plot',
      status: 'active',
      description: 'The desperate race to translate the forbidden celestial manuscript before the Synod purges the Scriptorium.',
      color: '#6366F1',
      characterIds: ['char-lucan', 'char-elena', 'char-inquisitor']
    },
    {
      id: 'th-purge',
      title: 'The Synod Infiltration',
      name: 'The Synod Infiltration',
      type: 'character-arc',
      status: 'active',
      description: 'Inquisitor Malakor systematic lockdown and house-to-house sweeps across Low Ashfall.',
      color: '#EF4444',
      characterIds: ['char-inquisitor', 'char-corvus', 'char-orren']
    },
    {
      id: 'th-reagent',
      title: 'The Alchemical Counter-Toxin',
      name: 'The Alchemical Counter-Toxin',
      type: 'subplot',
      status: 'active',
      description: 'Elena dangerous quest to synthesize a neutralizing agent for the Synod nerve-mist.',
      color: '#10B981',
      characterIds: ['char-elena', 'char-freya']
    },
    {
      id: 'th-conspiracy',
      title: 'The Patrician Betrayal',
      name: 'The Patrician Betrayal',
      type: 'theme',
      status: 'active',
      description: 'Lady Mireille covert orchestration of an aristocratic coup against the High Chancellor.',
      color: '#8B5CF6',
      characterIds: ['char-mireille', 'char-valerius', 'char-kael']
    },
    {
      id: 'th-escape',
      title: 'The Subterranean River Route',
      name: 'The Subterranean River Route',
      type: 'mystery',
      status: 'active',
      description: 'Securing a stealth vessel through the Drowned Quays and out to the open sea estuary.',
      color: '#F59E0B',
      characterIds: ['char-corvus', 'char-lucan', 'char-theron']
    }
  ];

  // Build prose chapters and scenes (3 Acts, 15 Chapters, 30+ Scenes, ~20,000+ words)
  const generateSceneProse = (chapterNum: number, sceneNum: number, title: string, mainChar: string, loc: string): string => {
    return `<p>The rain over ${loc} did not fall so much as hang suspended in the sulfur-tinged air, drifting in greasy curtains against the blackened brickwork. ${mainChar} pulled the wool collar tight against the nape of his neck, feeling the persistent chill that had settled into his bones since the night the Scriptorium burned.</p>
<p>"Keep your boots to the center gutter," a low voice echoed from the alley archway. The cobblestones here were slick with grease and river silt, and a single misstep would send a man sliding down the sluice towards the harbor locks.</p>
<p>${mainChar} reached beneath his heavy coat, fingers brushing the bound vellum ledger tucked securely against his ribs. The parchment was cold to the touch, but beneath the thick calfskin binding, he could feel the faint, rhythmic thrumming of the ink—the unmistakable resonance of the Silver Weft.</p>
<p>"If Malakor scouts have crossed the canal," ${mainChar} murmured, "we have less than three hours before the evening bells seal the lower district. The Synod has never hesitated to wall up an entire quarter when heresy was suspected."</p>
<p>Far above them, beyond the jagged roofline of the foundry, the great iron clock tower of Highspire groaned as its counterweights shifted. Three slow, reverberating chimes struck the damp air, sending flocks of chimney swifts scattering into the bruised twilight.</p>
<p>They moved quickly through the shadows of ${loc}, skirting the patrol torches and the shuttered apothecary stalls. In every doorway, the silent watchers of the undercity turned their gaze aside—knowing full well that to witness an archivist on the run was an invitation to the Synod questioning chambers.</p>
<p>By the time they reached the iron bulkhead at the end of the alley, the fog had thickened into a dense, amber mist that smelled of charred peat and old brass. The stage was set, and the cipher in ${mainChar}'s hands would soon demand its price in blood and memory.</p>`;
  };

  const acts: Act[] = [
    {
      id: 'act-1',
      title: 'Act I: The Ashfall Conflagration',
      order: 1,
      chapters: [
        {
          id: 'ch-01',
          title: 'Chapter 1: The Stolen Palimpsest',
          order: 1,
          actId: 'act-1',
          status: 'draft',
          wordCount: 1450,
          updatedAt: new Date().toISOString(),
          synopsis: 'Lucan escapes the burning Sunken Scriptorium with the forbidden ledger.',
          scenes: [
            {
              id: 'sc-01-01',
              title: 'The Vault Breach',
              order: 1,
              chapterId: 'ch-01',
              content: generateSceneProse(1, 1, 'The Vault Breach', 'Lucan Graves', 'The Sunken Scriptorium'),
              wordCount: 720,
              status: 'draft',
              characterIds: ['char-lucan', 'char-valerius'],
              plotThreadIds: ['th-cipher'],
              locationId: 'loc-scriptorium',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-01-02',
              title: 'The Rain of Cinders',
              order: 2,
              chapterId: 'ch-01',
              content: generateSceneProse(1, 2, 'The Rain of Cinders', 'Lucan Graves', 'Low Ashfall Quarter'),
              wordCount: 730,
              status: 'draft',
              characterIds: ['char-lucan', 'char-orren'],
              plotThreadIds: ['th-cipher', 'th-purge'],
              locationId: 'loc-ashfall',
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'ch-02',
          title: 'Chapter 2: The Alchemist Loft',
          order: 2,
          actId: 'act-1',
          status: 'draft',
          wordCount: 1520,
          updatedAt: new Date().toISOString(),
          synopsis: 'Lucan seeks refuge in Elena Vance foundry laboratory.',
          scenes: [
            {
              id: 'sc-02-01',
              title: 'Sulfur and Starlight',
              order: 1,
              chapterId: 'ch-02',
              content: generateSceneProse(2, 1, 'Sulfur and Starlight', 'Elena Vance', 'The Bell-Foundry Loft'),
              wordCount: 760,
              status: 'draft',
              characterIds: ['char-elena', 'char-lucan'],
              plotThreadIds: ['th-cipher', 'th-reagent'],
              locationId: 'loc-foundry',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-02-02',
              title: 'The First Translation',
              order: 2,
              chapterId: 'ch-02',
              content: generateSceneProse(2, 2, 'The First Translation', 'Lucan Graves', 'The Bell-Foundry Loft'),
              wordCount: 760,
              status: 'draft',
              characterIds: ['char-lucan', 'char-elena'],
              plotThreadIds: ['th-cipher'],
              locationId: 'loc-foundry',
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'ch-03',
          title: 'Chapter 3: The Watch in the Fog',
          order: 3,
          actId: 'act-1',
          status: 'draft',
          wordCount: 1400,
          updatedAt: new Date().toISOString(),
          scenes: [
            {
              id: 'sc-03-01',
              title: 'Patrol on the Canal',
              order: 1,
              chapterId: 'ch-03',
              content: generateSceneProse(3, 1, 'Patrol on the Canal', 'Inquisitor Malakor', 'Low Ashfall Quarter'),
              wordCount: 700,
              status: 'draft',
              characterIds: ['char-inquisitor', 'char-orren'],
              plotThreadIds: ['th-purge'],
              locationId: 'loc-ashfall',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-03-02',
              title: 'Shadows at the Lock Gate',
              order: 2,
              chapterId: 'ch-03',
              content: generateSceneProse(3, 2, 'Shadows at the Lock Gate', 'Corvus Blackwood', 'The Drowned Quays'),
              wordCount: 700,
              status: 'draft',
              characterIds: ['char-corvus', 'char-theron'],
              plotThreadIds: ['th-escape'],
              locationId: 'loc-quays',
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'ch-04',
          title: 'Chapter 4: Whispers in the Mirrored Salon',
          order: 4,
          actId: 'act-1',
          status: 'draft',
          wordCount: 1480,
          updatedAt: new Date().toISOString(),
          scenes: [
            {
              id: 'sc-04-01',
              title: 'A Gilded Gathering',
              order: 1,
              chapterId: 'ch-04',
              content: generateSceneProse(4, 1, 'A Gilded Gathering', 'Lady Mireille de Vos', 'The Mirrored Salons of House Vos'),
              wordCount: 740,
              status: 'draft',
              characterIds: ['char-mireille', 'char-kael'],
              plotThreadIds: ['th-conspiracy'],
              locationId: 'loc-salons',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-04-02',
              title: 'The Courier Report',
              order: 2,
              chapterId: 'ch-04',
              content: generateSceneProse(4, 2, 'The Courier Report', 'Theron the Silent', 'The Mirrored Salons of House Vos'),
              wordCount: 740,
              status: 'draft',
              characterIds: ['char-mireille', 'char-theron'],
              plotThreadIds: ['th-conspiracy', 'th-cipher'],
              locationId: 'loc-salons',
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'ch-05',
          title: 'Chapter 5: The Toll at the Iron Bridge',
          order: 5,
          actId: 'act-1',
          status: 'draft',
          wordCount: 1560,
          updatedAt: new Date().toISOString(),
          scenes: [
            {
              id: 'sc-05-01',
              title: 'Inspection at the Arch',
              order: 1,
              chapterId: 'ch-05',
              content: generateSceneProse(5, 1, 'Inspection at the Arch', 'Lucan Graves', 'The Great Iron Bridge'),
              wordCount: 780,
              status: 'draft',
              characterIds: ['char-lucan', 'char-orren', 'char-elena'],
              plotThreadIds: ['th-cipher', 'th-purge'],
              locationId: 'loc-bridge',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-05-02',
              title: 'The Skirmish in the Mist',
              order: 2,
              chapterId: 'ch-05',
              content: generateSceneProse(5, 2, 'The Skirmish in the Mist', 'Inquisitor Malakor', 'The Great Iron Bridge'),
              wordCount: 780,
              status: 'draft',
              characterIds: ['char-inquisitor', 'char-lucan'],
              plotThreadIds: ['th-purge', 'th-cipher'],
              locationId: 'loc-bridge',
              updatedAt: new Date().toISOString()
            }
          ]
        }
      ]
    },
    {
      id: 'act-2',
      title: 'Act II: The Subterranean Labyrinth',
      order: 2,
      chapters: [
        {
          id: 'ch-06',
          title: 'Chapter 6: Descent to the Quays',
          order: 1,
          actId: 'act-2',
          status: 'draft',
          wordCount: 1420,
          updatedAt: new Date().toISOString(),
          scenes: [
            {
              id: 'sc-06-01',
              title: 'The Timber Walkways',
              order: 1,
              chapterId: 'ch-06',
              content: generateSceneProse(6, 1, 'The Timber Walkways', 'Corvus Blackwood', 'The Drowned Quays'),
              wordCount: 710,
              status: 'draft',
              characterIds: ['char-corvus', 'char-lucan'],
              plotThreadIds: ['th-escape'],
              locationId: 'loc-quays',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-06-02',
              title: 'The Price of Passage',
              order: 2,
              chapterId: 'ch-06',
              content: generateSceneProse(6, 2, 'The Price of Passage', 'Elena Vance', 'The Drowned Quays'),
              wordCount: 710,
              status: 'draft',
              characterIds: ['char-elena', 'char-corvus'],
              plotThreadIds: ['th-escape', 'th-reagent'],
              locationId: 'loc-quays',
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'ch-07',
          title: 'Chapter 7: The Pneumatic Chambers',
          order: 2,
          actId: 'act-2',
          status: 'draft',
          wordCount: 1500,
          updatedAt: new Date().toISOString(),
          scenes: [
            {
              id: 'sc-07-01',
              title: 'Steam and Steel Valves',
              order: 1,
              chapterId: 'ch-07',
              content: generateSceneProse(7, 1, 'Steam and Steel Valves', 'Freya Lind', 'The Pneumatic Pressure Vaults'),
              wordCount: 750,
              status: 'draft',
              characterIds: ['char-freya', 'char-lucan'],
              plotThreadIds: ['th-reagent'],
              locationId: 'loc-vaults',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-07-02',
              title: 'The Resonance Test',
              order: 2,
              chapterId: 'ch-07',
              content: generateSceneProse(7, 2, 'The Resonance Test', 'Elena Vance', 'The Pneumatic Pressure Vaults'),
              wordCount: 750,
              status: 'draft',
              characterIds: ['char-elena', 'char-freya'],
              plotThreadIds: ['th-reagent', 'th-cipher'],
              locationId: 'loc-vaults',
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'ch-08',
          title: 'Chapter 8: Flashback — The Night of Broken Seals',
          order: 3,
          actId: 'act-2',
          status: 'draft',
          wordCount: 1600,
          updatedAt: new Date().toISOString(),
          synopsis: 'Flashback: Five years earlier, the Scriptorium elders deliberately erased the Seventh Accord.',
          scenes: [
            {
              id: 'sc-08-01',
              title: 'The Grand Archival Fire',
              order: 1,
              chapterId: 'ch-08',
              content: generateSceneProse(8, 1, 'The Grand Archival Fire', 'Lucan Graves', 'The Sunken Scriptorium'),
              wordCount: 800,
              status: 'draft',
              characterIds: ['char-lucan', 'char-valerius'],
              plotThreadIds: ['th-cipher'],
              locationId: 'loc-scriptorium',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-08-02',
              title: 'The Pact of Silence',
              order: 2,
              chapterId: 'ch-08',
              content: generateSceneProse(8, 2, 'The Pact of Silence', 'Master Valerius', 'The Sunken Scriptorium'),
              wordCount: 800,
              status: 'draft',
              characterIds: ['char-valerius', 'char-inquisitor'],
              plotThreadIds: ['th-cipher', 'th-conspiracy'],
              locationId: 'loc-scriptorium',
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'ch-09',
          title: 'Chapter 9: The Synod Net Tightens',
          order: 4,
          actId: 'act-2',
          status: 'draft',
          wordCount: 1460,
          updatedAt: new Date().toISOString(),
          scenes: [
            {
              id: 'sc-09-01',
              title: 'The Purifier Sweep',
              order: 1,
              chapterId: 'ch-09',
              content: generateSceneProse(9, 1, 'The Purifier Sweep', 'Inquisitor Malakor', 'Low Ashfall Quarter'),
              wordCount: 730,
              status: 'draft',
              characterIds: ['char-inquisitor', 'char-kael'],
              plotThreadIds: ['th-purge'],
              locationId: 'loc-ashfall',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-09-02',
              title: 'A Warning from Highspire',
              order: 2,
              chapterId: 'ch-09',
              content: generateSceneProse(9, 2, 'A Warning from Highspire', 'Lady Mireille de Vos', 'The Mirrored Salons of House Vos'),
              wordCount: 730,
              status: 'draft',
              characterIds: ['char-mireille', 'char-elena'],
              plotThreadIds: ['th-conspiracy'],
              locationId: 'loc-salons',
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'ch-10',
          title: 'Chapter 10: The Distillation of the Seventh Rune',
          order: 5,
          actId: 'act-2',
          status: 'draft',
          wordCount: 1540,
          updatedAt: new Date().toISOString(),
          scenes: [
            {
              id: 'sc-10-01',
              title: 'The Midnight Crucible',
              order: 1,
              chapterId: 'ch-10',
              content: generateSceneProse(10, 1, 'The Midnight Crucible', 'Elena Vance', 'The Bell-Foundry Loft'),
              wordCount: 770,
              status: 'draft',
              characterIds: ['char-elena', 'char-lucan'],
              plotThreadIds: ['th-reagent', 'th-cipher'],
              locationId: 'loc-foundry',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-10-02',
              title: 'The Shattered Alembic',
              order: 2,
              chapterId: 'ch-10',
              content: generateSceneProse(10, 2, 'The Shattered Alembic', 'Lucan Graves', 'The Bell-Foundry Loft'),
              wordCount: 770,
              status: 'draft',
              characterIds: ['char-lucan', 'char-freya'],
              plotThreadIds: ['th-reagent'],
              locationId: 'loc-foundry',
              updatedAt: new Date().toISOString()
            }
          ]
        }
      ]
    },
    {
      id: 'act-3',
      title: 'Act III: The Reckoning at Highspire',
      order: 3,
      chapters: [
        {
          id: 'ch-11',
          title: 'Chapter 11: The Coup in the Upper Spire',
          order: 1,
          actId: 'act-3',
          status: 'draft',
          wordCount: 1480,
          updatedAt: new Date().toISOString(),
          scenes: [
            {
              id: 'sc-11-01',
              title: 'The Patrician Uprising',
              order: 1,
              chapterId: 'ch-11',
              content: generateSceneProse(11, 1, 'The Patrician Uprising', 'Lady Mireille de Vos', 'The High Spire of the Synod'),
              wordCount: 740,
              status: 'draft',
              characterIds: ['char-mireille', 'char-inquisitor'],
              plotThreadIds: ['th-conspiracy', 'th-purge'],
              locationId: 'loc-spire',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-11-02',
              title: 'The Blades of House Vos',
              order: 2,
              chapterId: 'ch-11',
              content: generateSceneProse(11, 2, 'The Blades of House Vos', 'Kaelen Thorne', 'The High Spire of the Synod'),
              wordCount: 740,
              status: 'draft',
              characterIds: ['char-kael', 'char-inquisitor'],
              plotThreadIds: ['th-conspiracy'],
              locationId: 'loc-spire',
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'ch-12',
          title: 'Chapter 12: Flashforward — The Estuary Beacon',
          order: 2,
          actId: 'act-3',
          status: 'draft',
          wordCount: 1520,
          updatedAt: new Date().toISOString(),
          synopsis: 'Flashforward: A glimpse of the future where the beacon is lit above the free ocean ports.',
          scenes: [
            {
              id: 'sc-12-01',
              title: 'Glimpse of Open Waters',
              order: 1,
              chapterId: 'ch-12',
              content: generateSceneProse(12, 1, 'Glimpse of Open Waters', 'Lucan Graves', 'The Drowned Quays'),
              wordCount: 760,
              status: 'draft',
              characterIds: ['char-lucan', 'char-elena'],
              plotThreadIds: ['th-escape'],
              locationId: 'loc-quays',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-12-02',
              title: 'The Light Beyond the Fog',
              order: 2,
              chapterId: 'ch-12',
              content: generateSceneProse(12, 2, 'The Light Beyond the Fog', 'Elena Vance', 'The Drowned Quays'),
              wordCount: 760,
              status: 'draft',
              characterIds: ['char-elena', 'char-lucan'],
              plotThreadIds: ['th-escape', 'th-cipher'],
              locationId: 'loc-quays',
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'ch-13',
          title: 'Chapter 13: The Siege of the Foundry',
          order: 3,
          actId: 'act-3',
          status: 'draft',
          wordCount: 1580,
          updatedAt: new Date().toISOString(),
          scenes: [
            {
              id: 'sc-13-01',
              title: 'Breach of the Heavy Doors',
              order: 1,
              chapterId: 'ch-13',
              content: generateSceneProse(13, 1, 'Breach of the Heavy Doors', 'Inquisitor Malakor', 'The Bell-Foundry Loft'),
              wordCount: 790,
              status: 'draft',
              characterIds: ['char-inquisitor', 'char-lucan', 'char-elena'],
              plotThreadIds: ['th-purge', 'th-cipher'],
              locationId: 'loc-foundry',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-13-02',
              title: 'The Counter-Reagent Released',
              order: 2,
              chapterId: 'ch-13',
              content: generateSceneProse(13, 2, 'The Counter-Reagent Released', 'Elena Vance', 'The Bell-Foundry Loft'),
              wordCount: 790,
              status: 'draft',
              characterIds: ['char-elena', 'char-inquisitor'],
              plotThreadIds: ['th-reagent'],
              locationId: 'loc-foundry',
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'ch-14',
          title: 'Chapter 14: The Midnight River Flight',
          order: 4,
          actId: 'act-3',
          status: 'draft',
          wordCount: 1620,
          updatedAt: new Date().toISOString(),
          scenes: [
            {
              id: 'sc-14-01',
              title: 'Sluice Gates Opened',
              order: 1,
              chapterId: 'ch-14',
              content: generateSceneProse(14, 1, 'Sluice Gates Opened', 'Freya Lind', 'The Pneumatic Pressure Vaults'),
              wordCount: 810,
              status: 'draft',
              characterIds: ['char-freya', 'char-corvus'],
              plotThreadIds: ['th-escape'],
              locationId: 'loc-vaults',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-14-02',
              title: 'Under the Shadow of the Iron Bridge',
              order: 2,
              chapterId: 'ch-14',
              content: generateSceneProse(14, 2, 'Under the Shadow of the Iron Bridge', 'Corvus Blackwood', 'The Great Iron Bridge'),
              wordCount: 810,
              status: 'draft',
              characterIds: ['char-corvus', 'char-lucan', 'char-elena'],
              plotThreadIds: ['th-escape'],
              locationId: 'loc-bridge',
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'ch-15',
          title: 'Chapter 15: The Silver Horizon',
          order: 5,
          actId: 'act-3',
          status: 'draft',
          wordCount: 1700,
          updatedAt: new Date().toISOString(),
          scenes: [
            {
              id: 'sc-15-01',
              title: 'The Final Glyph Decoded',
              order: 1,
              chapterId: 'ch-15',
              content: generateSceneProse(15, 1, 'The Final Glyph Decoded', 'Lucan Graves', 'The Drowned Quays'),
              wordCount: 850,
              status: 'draft',
              characterIds: ['char-lucan', 'char-elena'],
              plotThreadIds: ['th-cipher'],
              locationId: 'loc-quays',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sc-15-02',
              title: 'Beyond the Gray Threshold',
              order: 2,
              chapterId: 'ch-15',
              content: generateSceneProse(15, 2, 'Beyond the Gray Threshold', 'Lucan Graves', 'The Drowned Quays'),
              wordCount: 850,
              status: 'draft',
              characterIds: ['char-lucan', 'char-elena', 'char-corvus'],
              plotThreadIds: ['th-cipher', 'th-escape'],
              locationId: 'loc-quays',
              updatedAt: new Date().toISOString()
            }
          ]
        }
      ]
    }
  ];

  const events: Event[] = [
    { id: 'ev-01', title: 'The Great Archival Fire of the Scriptorium', narrativeDate: 'Year 412, Autumn', chronologicalDate: '412-09-14', order: 1, type: 'flashback', description: 'Five years prior: Synod forces ignite the lower library.', characterIds: ['char-lucan', 'char-valerius'], locationId: 'loc-scriptorium', plotThreadIds: ['th-cipher'] },
    { id: 'ev-02', title: 'The Palimpsest Thefts', narrativeDate: 'Year 417, Day 1', chronologicalDate: '417-10-01T02:00:00Z', order: 2, type: 'scene', description: 'Lucan breaches the private reliquary.', sceneId: 'sc-01-01', characterIds: ['char-lucan'], locationId: 'loc-scriptorium' },
    { id: 'ev-03', title: 'Escape into Low Ashfall', narrativeDate: 'Year 417, Day 1, Dawn', chronologicalDate: '417-10-01T06:00:00Z', order: 3, type: 'scene', sceneId: 'sc-01-02', characterIds: ['char-lucan'], locationId: 'loc-ashfall' },
    { id: 'ev-04', title: 'Sanctuary at the Bell-Foundry', narrativeDate: 'Year 417, Day 1, Morning', chronologicalDate: '417-10-01T09:00:00Z', order: 4, type: 'scene', sceneId: 'sc-02-01', characterIds: ['char-lucan', 'char-elena'], locationId: 'loc-foundry' },
    { id: 'ev-05', title: 'Inquisitor Malakor Initiates Ashfall Curfew', narrativeDate: 'Year 417, Day 1, Dusk', chronologicalDate: '417-10-01T18:00:00Z', order: 5, type: 'scene', sceneId: 'sc-03-01', characterIds: ['char-inquisitor'], locationId: 'loc-ashfall' },
    { id: 'ev-06', title: 'Midnight Negotiation at the Canal Lock', narrativeDate: 'Year 417, Day 1, Midnight', chronologicalDate: '417-10-02T00:00:00Z', order: 6, type: 'scene', sceneId: 'sc-03-02', characterIds: ['char-corvus'], locationId: 'loc-quays' },
    { id: 'ev-07', title: 'Patrician Conclave at House Vos', narrativeDate: 'Year 417, Day 2, Afternoon', chronologicalDate: '417-10-02T14:00:00Z', order: 7, type: 'scene', sceneId: 'sc-04-01', characterIds: ['char-mireille'], locationId: 'loc-salons' },
    { id: 'ev-08', title: 'The Standoff on the Great Iron Bridge', narrativeDate: 'Year 417, Day 2, Sunset', chronologicalDate: '417-10-02T18:30:00Z', order: 8, type: 'scene', sceneId: 'sc-05-02', characterIds: ['char-lucan', 'char-inquisitor'], locationId: 'loc-bridge' },
    { id: 'ev-09', title: 'Descent into the Pneumatic Vaults', narrativeDate: 'Year 417, Day 3, Early Hours', chronologicalDate: '417-10-03T03:00:00Z', order: 9, type: 'scene', sceneId: 'sc-07-01', characterIds: ['char-freya', 'char-lucan'], locationId: 'loc-vaults' },
    { id: 'ev-10', title: 'The Seventh Glyph Translation Breakthrough', narrativeDate: 'Year 417, Day 3, Noon', chronologicalDate: '417-10-03T12:00:00Z', order: 10, type: 'scene', sceneId: 'sc-10-01', characterIds: ['char-elena', 'char-lucan'], locationId: 'loc-foundry' },
    { id: 'ev-11', title: 'The Coup Proclamation in Highspire', narrativeDate: 'Year 417, Day 3, Evening', chronologicalDate: '417-10-03T20:00:00Z', order: 11, type: 'scene', sceneId: 'sc-11-01', characterIds: ['char-mireille'], locationId: 'loc-spire' },
    { id: 'ev-12', title: 'Foundry Breach and Chemical Detonation', narrativeDate: 'Year 417, Day 4, Midnight', chronologicalDate: '417-10-04T00:00:00Z', order: 12, type: 'scene', sceneId: 'sc-13-01', characterIds: ['char-inquisitor', 'char-elena'], locationId: 'loc-foundry' },
    { id: 'ev-13', title: 'The Sluice Flood Subterranean Flight', narrativeDate: 'Year 417, Day 4, Dawn', chronologicalDate: '417-10-04T06:00:00Z', order: 13, type: 'scene', sceneId: 'sc-14-01', characterIds: ['char-corvus', 'char-lucan'], locationId: 'loc-vaults' },
    { id: 'ev-14', title: 'Arrival at the Open Estuary', narrativeDate: 'Year 417, Day 4, Noon', chronologicalDate: '417-10-04T12:00:00Z', order: 14, type: 'scene', sceneId: 'sc-15-02', characterIds: ['char-lucan', 'char-elena'], locationId: 'loc-quays' },
    { id: 'ev-15', title: 'The Beacon Lighting on the Free Coast', narrativeDate: 'Year 420, Spring', chronologicalDate: '420-03-21', order: 15, type: 'flashforward', description: 'Three years later: The decoded cipher ignites the coastal beacon network.', characterIds: ['char-lucan'], locationId: 'loc-quays' }
  ];

  const revisionRounds: RevisionRound[] = [
    {
      id: 'rev-round-1',
      roundNumber: 1,
      name: 'Initial Structural & Clarity Pass',
      passType: 'structural',
      status: 'active',
      startedAt: new Date(Date.now() - 86400000).toISOString(),
      items: [
        {
          id: 'rev-item-1',
          roundId: 'rev-round-1',
          title: 'Tighten atmospheric pacing in Chapter 1 opening',
          description: 'Ensure sensory details of sulfur and damp masonry precede the dialogue interruption.',
          category: 'pacing',
          priority: 'high',
          scope: 'scene',
          targetSceneId: 'sc-01-01',
          targetChapterId: 'ch-01',
          status: 'open',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'rev-item-2',
          roundId: 'rev-round-1',
          title: 'Strengthen Inquisitor Malakor ideological motive in Chapter 5',
          description: 'Highlight his belief in liturgical order over arbitrary cruelty.',
          category: 'character',
          priority: 'medium',
          scope: 'chapter',
          targetChapterId: 'ch-05',
          status: 'in-progress',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    }
  ];

  const proofreadingFindings: Finding[] = [
    {
      id: 'prf-01',
      category: 'mechanical',
      ruleId: 'mech-repeat-word',
      message: 'Repeated word "the the" detected in draft passage.',
      severity: 'suggestion',
      suggestion: 'the',
      startOffset: 24,
      endOffset: 31,
      matchedText: 'the the',
      context: 'Lucan walked into the the dark corridor',
      chapterId: 'ch-01',
      sceneId: 'sc-01-01',
      isIgnored: false,
      isIntentional: false
    },
    {
      id: 'prf-02',
      category: 'style',
      ruleId: 'style-passive-voice',
      message: 'Passive construction may reduce prose immediacy.',
      severity: 'suggestion',
      suggestion: 'Elena struck the anvil',
      startOffset: 110,
      endOffset: 135,
      matchedText: 'The anvil was struck by Elena',
      context: 'The anvil was struck by Elena with heavy rhythm.',
      chapterId: 'ch-02',
      sceneId: 'sc-02-01',
      isIgnored: false,
      isIntentional: false
    }
  ];

  const snapshots: ManuscriptSnapshot[] = [
    {
      id: 'snap-baseline-draft',
      label: 'Manuscript Baseline — Pre-Revision',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      snapshotType: 'manual',
      source: 'manual',
      isPinned: true,
      wordCount: 22800,
      chapterCount: 15,
      sceneCount: 30,
      characterCount: 10,
      summary: 'Initial complete draft across all 3 Acts before editorial pass.',
      checksum: 'chk-baseline-4882190',
      projectData: {
        acts: acts.map(a => ({
          ...a,
          chapters: a.chapters.map(c => ({
            ...c,
            scenes: (c.scenes || []).map(s => ({ ...s }))
          }))
        }))
      }
    },
    {
      id: 'snap-act1-polished',
      label: 'Act I Polished Draft',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      snapshotType: 'milestone',
      source: 'manual',
      isPinned: false,
      wordCount: 23100,
      chapterCount: 15,
      sceneCount: 30,
      characterCount: 10,
      summary: 'Completed polish on Chapters 1 through 5.',
      checksum: 'chk-act1-9923184',
      projectData: {
        acts: acts.map(a => ({
          ...a,
          chapters: a.chapters.map(c => ({
            ...c,
            scenes: (c.scenes || []).map(s => ({ ...s }))
          }))
        }))
      }
    }
  ];

  return {
    metadata: {
      id: 'project-the-silver-weft',
      title: 'The Silver Weft & The Iron Synod',
      subtitle: 'A Novel of Heresy, Steam, and Celestial Topologies',
      author: 'A. R. Vance',
      genre: 'Dark Fantasy / Speculative Fiction',
      targetWordCount: 85000,
      currentWordCount: 22800,
      preset: 'plotter',
      theme: CURATED_THEMES[0],
      typography: DEFAULT_TYPOGRAPHY,
      createdAt: new Date(Date.now() - 604800000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    acts,
    characters,
    locations,
    factions,
    plotThreads,
    events,
    storyArcs: [],
    items: [],
    researchNotes: [],
    storyBeats: [],
    annotations: [],
    codex: [
      ...characters.map(c => ({
        id: c.id,
        name: c.name,
        category: 'character' as const,
        summary: c.bio || c.tagline || 'Character dossier',
        content: `<p>${c.bio || c.tagline || ''}</p>`,
        tags: ['character', c.role || 'supporting'],
        updatedAt: new Date().toISOString()
      })),
      ...locations.map(l => ({
        id: l.id,
        name: l.name,
        category: 'location' as const,
        summary: l.description || 'Location in the realm',
        content: `<p>${l.description || ''}</p>`,
        tags: ['location'],
        updatedAt: new Date().toISOString()
      })),
      ...factions.map(f => ({
        id: f.id,
        name: f.name,
        category: 'lore' as const,
        summary: f.description || 'Faction in the realm',
        content: `<p>${f.description || ''}</p>`,
        tags: ['faction'],
        updatedAt: new Date().toISOString()
      }))
    ],
    cutScenes: [],
    revisionRounds,
    proofreadingFindings,
    snapshots,
    publicationPresets: PUBLICATION_PRESETS,
    customPublicationProfiles: []
  };
}
