/**
 * Swrite Story Engine — Domain Layer Types & Entity Relationships
 * Pure domain model with zero external UI or framework dependencies.
 */

export type EntityType = 
  | 'project'
  | 'act'
  | 'chapter'
  | 'scene'
  | 'character'
  | 'location'
  | 'faction'
  | 'item'
  | 'event'
  | 'storyArc'
  | 'plotThread'
  | 'researchNote';

export type SceneStatus = 'draft' | 'in-progress' | 'revised' | 'final' | 'cut';
export type PlotThreadStatus = 
  | 'setup' 
  | 'active' 
  | 'dormant' 
  | 'payoff-pending' 
  | 'resolved' 
  | 'unresolved' 
  | 'in-progress' 
  | 'climax' 
  | 'abandoned';

export type PlotThreadType = 
  | 'main-plot' 
  | 'subplot' 
  | 'mystery' 
  | 'romance' 
  | 'character-arc' 
  | 'foreshadowing' 
  | 'conflict' 
  | 'custom'
  | 'relationship' 
  | 'world-event';
export type StoryArcType = 'overarching' | 'act-arc' | 'character-journey' | 'thematic';
export type CharacterRole = 'Protagonist' | 'Antagonist' | 'Supporting' | 'Minor';
export type LocationType = 'city' | 'region' | 'building' | 'landmark' | 'realm' | 'interior' | 'celestial';
export type FactionType = 'guild' | 'government' | 'order' | 'syndicate' | 'cult' | 'clan' | 'military' | 'family';
export type ItemType = 'weapon' | 'artifact' | 'document' | 'reagent' | 'tool' | 'currency' | 'heirloom';
export type EventType = 'historical' | 'inciting-incident' | 'climax' | 'backstory' | 'world-event' | 'scene-event';
export type ResearchCategory = 'historical' | 'scientific' | 'mythology' | 'linguistics' | 'weaponry' | 'geography' | 'reference';

/**
 * 1. Scene Entity
 * Core narrative unit inside or mapped to a Chapter.
 */
export interface Scene {
  id: string;
  title: string;
  chapterId: string;
  actId?: string;
  order: number;
  content?: string; // Scene prose / HTML / Markdown
  wordCount: number;
  targetWordCount?: number;
  
  // Relational IDs
  povCharacterId?: string;
  characterIds?: string[];
  locationIds?: string[];
  factionIds?: string[];
  itemIds?: string[];
  plotThreadIds?: string[];
  eventIds?: string[];
  storyArcIds?: string[];

  // Narrative Dramatic Properties
  purpose?: string;      // Why does this scene exist?
  conflict?: string;     // What obstacle prevents the goal?
  goal?: string;         // What does the POV want at start?
  outcome?: string;      // "Yes, but" / "No, and furthermore"
  consequence?: string;  // Ripple effect on future scenes
  tensionLevel?: number; // 1 to 10
  timelineDate?: string; // In-universe chronological timestamp
  
  status: SceneStatus;
  synopsis?: string;
  tags?: string[];
  updatedAt: string;
}

/**
 * 2. Plot Thread Entity
 * Tracks narrative questions, subplots, mysteries, and promises made to the reader.
 */
export interface PlotThread {
  id: string;
  title: string;
  description: string;
  type: PlotThreadType;
  status: PlotThreadStatus;
  color?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  
  storyArcId?: string;
  introducedIn?: string;    // Scene ID or Chapter ID
  lastTouchedIn?: string;   // Scene ID or Chapter ID
  resolvedIn?: string;      // Scene ID or Chapter ID
  
  relatedCharacterIds?: string[];
  relatedSceneIds?: string[];
  expectedPayoff?: string;  // Planned climax / reveal
  notes?: string;
  updatedAt?: string;
}

/**
 * 3. Story Arc Entity
 * High-level narrative structure or character trajectory spanning acts.
 */
export interface StoryArc {
  id: string;
  title: string;
  description: string;
  type: StoryArcType;
  color?: string;
  
  actIds?: string[];
  characterIds?: string[];
  plotThreadIds?: string[];
  sceneIds?: string[];
  
  milestones?: {
    id: string;
    title: string;
    targetSceneId?: string;
    description: string;
    completed: boolean;
  }[];
  
  status: 'planned' | 'in-progress' | 'completed';
  updatedAt?: string;
}

/**
 * Structured Character Goal Item
 */
export type GoalStatus = 'active' | 'paused' | 'achieved' | 'failed' | 'abandoned';

export interface GoalItem {
  id: string;
  title?: string;
  description: string;
  status: GoalStatus;
  priority?: 'critical' | 'high' | 'medium' | 'low' | 'primary' | 'secondary' | 'long-term' | string;
  conflict?: string;
  obstacle?: string;
  introducedIn?: string; // Scene ID or Chapter ID
  resolvedIn?: string;   // Scene ID or Chapter ID
}

/**
 * Structured Character Belief Item
 */
export type BeliefCertainty = 'strong' | 'moderate' | 'uncertain';
export type BeliefStatus = 'active' | 'held' | 'challenged' | 'questioned' | 'shattered' | 'evolved' | 'abandoned' | string;

export interface BeliefItem {
  id: string;
  statement: string;
  certainty: BeliefCertainty;
  introducedIn?: string;
  changedIn?: string;
  status?: BeliefStatus;
}

/**
 * Structured Knowledge Item
 * Tracks what the character knows, when they learned it, from whom, and certainty.
 */
export interface KnowledgeEntry {
  id: string;
  statement?: string; // Standard domain statement
  information?: string; // Backward-compatible field
  learnedIn?: string; // Scene ID or Chapter ID
  learnedAt?: string; // Backward-compatible field
  sourceSceneId?: string;
  source?: string;    // Character, book, overheard, observation
  certainty?: 'certain' | 'suspected' | 'rumor' | 'misinformed';
  status?: 'known' | 'forgotten' | 'doubted';
}

export type KnowledgeItem = KnowledgeEntry;

/**
 * Structured Character Secret Item
 */
export type SecretStatus = 'hidden' | 'suspected' | 'revealed';

export interface SecretItem {
  id: string;
  secret?: string;
  content?: string;
  introducedIn?: string;
  revealedIn?: string;
  status: SecretStatus;
  knownByCharacterIds?: string[];
}

/**
 * Dynamic Character State
 */
export interface CharacterState {
  emotional?: string;
  emotionalState?: string;
  physical?: string;
  physicalState?: string;
  mental?: string;
  mentalState?: string;
  currentGoal?: string;
  currentConflict?: string;
  motivation?: string;
  location?: string;
  status?: 'active' | 'missing' | 'incapacitated' | 'deceased' | 'dormant' | string;
  notes?: string;
}

/**
 * Character State Checkpoint along manuscript timeline
 */
export interface CharacterStateCheckpoint {
  id: string;
  sceneId: string;
  chapterId?: string;
  order?: number;
  emotionalState?: string;
  physicalState?: string;
  mentalState?: string;
  currentGoal?: string;
  note?: string;
}

/**
 * Character Relationship Definition
 * Tracks dynamic interpersonal connection between Character A and Character B.
 */
export type RelationshipMilestone = 
  | 'started' 
  | 'changed' 
  | 'broken' 
  | 'repaired' 
  | 'alliance_formed' 
  | 'first_meeting' 
  | 'betrayal' 
  | 'reconciliation' 
  | 'romance' 
  | 'rift' 
  | 'secret_shared' 
  | 'death' 
  | 'custom'
  | string;

export interface CharacterRelationship {
  targetId: string;
  targetName?: string;
  relation: string;       // Relationship type (e.g. Mentor, Rival, Sibling, Enemy, Friend, Romantic)
  currentState?: string; // Current status (e.g. Allied, Estranged, Hostile, Secret romance)
  trustLevel?: number | 'high' | 'moderate' | 'low' | 'none' | string;
  notes?: string;
  history?: string;      // Trajectory / backstory
  dynamicDescription?: string;
  strength?: number;     // -10 (sworn enemy) to +10 (unbreakable bond)
  milestones?: Array<{
    id: string;
    sceneId?: string;
    chapterId?: string;
    milestone: RelationshipMilestone;
    description: string;
  }>;
}

/**
 * 4. Character Entity
 * Complete character bible entry with psychology, goals, knowledge, and dynamic story state.
 */
export interface Character {
  id: string;
  name: string;
  aliases?: string[];
  role: CharacterRole;
  age?: string | number;
  archetype?: string;
  tagline?: string;
  bio: string;
  description?: string; // Alias for bio / overview
  physicalAppearance?: string;
  motivations?: string; // Legacy motivation summary
  motivation?: string;  // Core motivation
  flaws?: string;
  secrets?: Array<SecretItem | string> | string; // Structured secrets or legacy string/array
  voiceNotes?: string;
  color?: string;
  tags?: string[];
  notes?: string;
  
  // Dynamic Story State
  currentGoal?: string;                          // Current active objective
  currentState?: CharacterState | string;        // Current physical/emotional state object or legacy string
  goals?: Array<GoalItem | string>;              // Structured goals or legacy string array
  beliefs?: Array<BeliefItem | string>;          // Structured beliefs or legacy string array
  knowledgeList?: KnowledgeEntry[];              // Structured knowledge items
  knowledge?: string[];                          // Backwards-compatible knowledge strings
  relationships?: CharacterRelationship[];
  stateCheckpoints?: CharacterStateCheckpoint[]; // Explicit author checkpoints
  storyArcId?: string;                           // Associated Story Arc
  storyArcIds?: string[];                        // Associated Story Arcs
  storyArcTrajectory?: string;                   // Arc trajectory / transformation
  appearances?: string[];                        // Scene IDs or Chapter IDs where present
  
  factionIds?: string[];
  locationId?: string;
  itemIds?: string[];
  updatedAt?: string;
}

/**
 * 5. Location Entity
 * Worldbuilding setting with spatial relations and sensory cues.
 */
export interface Location {
  id: string;
  name: string;
  aliases?: string[];
  type?: LocationType;
  summary: string;
  description: string;
  sensoryDetails?: {
    sight?: string;
    sound?: string;
    smell?: string;
    texture?: string;
  };
  parentLocationId?: string;
  controllingFactionId?: string;
  associatedCharacterIds?: string[];
  sceneAppearances?: string[];
  tags?: string[];
  color?: string;
  updatedAt?: string;
}

/**
 * 6. Faction Entity
 * Organizations, guilds, courts, and orders.
 */
export interface Faction {
  id: string;
  name: string;
  aliases?: string[];
  type?: FactionType;
  summary: string;
  description: string;
  leaderCharacterId?: string;
  memberCharacterIds?: string[];
  headquartersLocationId?: string;
  alliedFactionIds?: string[];
  rivalFactionIds?: string[];
  goals?: string[];
  doctrine?: string;
  sceneAppearances?: string[];
  tags?: string[];
  color?: string;
  updatedAt?: string;
}

/**
 * 7. Item Entity
 * Weapons, magical relics, promissory documents, and macguffins.
 */
export interface Item {
  id: string;
  name: string;
  aliases?: string[];
  type?: ItemType;
  summary: string;
  description: string;
  currentOwnerCharacterId?: string;
  originLocationId?: string;
  magicalProperties?: string;
  sceneAppearances?: string[];
  plotThreadIds?: string[];
  tags?: string[];
  color?: string;
  updatedAt?: string;
}

/**
 * 8. Event Entity
 * In-universe chronology milestones, backstories, and historical turning points.
 */
export interface Event {
  id: string;
  title: string;
  summary: string;
  description?: string;
  timelineDate?: string; // In-universe chronological timestamp / era
  order: number;
  type?: EventType;
  sceneId?: string;
  chapterId?: string;
  actId?: string;
  locationId?: string;
  participantCharacterIds?: string[];
  involvedFactionIds?: string[];
  causedByEventId?: string;
  impact?: string;
  tensionLevel?: number;
  tags?: string[];
}

/**
 * 9. Research Note Entity
 * Real-world historical, linguistic, anatomical, or scientific references.
 */
export interface ResearchNote {
  id: string;
  title: string;
  category: ResearchCategory;
  summary: string;
  content: string; // Markdown / HTML
  sources?: string[];
  relatedEntityIds?: string[];
  tags?: string[];
  updatedAt: string;
}

/**
 * Continuity Issue Diagnostic
 */
export interface ContinuityIssue {
  id: string;
  severity: 'warning' | 'info' | 'error';
  entityType: EntityType;
  entityId: string;
  entityName: string;
  message: string;
  recommendation?: string;
}

/**
 * Story Engine State Container
 * Represents the complete domain state for a story project.
 */
export interface StoryEngineState {
  scenes: Scene[];
  plotThreads: PlotThread[];
  storyArcs: StoryArc[];
  characters: Character[];
  locations: Location[];
  factions: Faction[];
  items: Item[];
  events: Event[];
  researchNotes: ResearchNote[];
}
