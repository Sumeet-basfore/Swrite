export * from './storyEngine';
export * from './continuity';
export * from './timeline';
export * from './publication';
export * from './proofreading';
export * from './revision';
export * from './snapshot';

import { 
  Scene, PlotThread, StoryArc, Character, Location, 
  Faction, Item, Event, ResearchNote 
} from './storyEngine';
import { ContinuityConfig } from './continuity';
import { ProofreadingConfig } from './proofreading';
import { RevisionRound, RevisionItem, RevisionSnapshot } from './revision';
import { ManuscriptSnapshot } from './snapshot';

export type WriterPreset = 'pantser' | 'plotter' | 'plantser';

export type ViewMode = 'continuous' | 'paginated' | 'focus';

export type SplitMode = 'none' | 'editor-graph' | 'editor-editor' | 'editor-partner';

export type SyncStatus = 'synced' | 'saving' | 'offline' | 'saved-locally';

export type WorkspaceTab = 'overview' | 'editor' | 'outliner' | 'threads' | 'codex' | 'partner' | 'graph' | 'characters' | 'timeline' | 'corkboard' | 'scratchpad' | 'continuity' | 'revision' | 'write' | 'plan' | 'review' | 'story' | 'research' | 'publication' | 'versions' | 'simulation';

export interface ThemeTokens {
  background: string;
  surface: string;
  elevatedSurface: string;
  text: string;
  textMuted: string;
  textFaint: string;
  heading: string;
  accent: string;
  accentMuted: string;
  border: string;
  borderStrong: string;
  selection: string;
  link: string;
  wikilink: string;
  quote: string;
  quoteBorder: string;
  code: string;
  codeBackground: string;
  success: string;
  warning: string;
  error: string;

  // Editorial & Markdown Tokens
  editorPage?: string;
  editorPageText?: string;
  revisionAdded?: string;
  revisionRemoved?: string;
  proofreadingInfo?: string;
  proofreadingWarning?: string;
  proofreadingError?: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  category: 'dark' | 'light' | 'experimental';
  isDark: boolean;
  colors: ThemeTokens;
  // Backward compatibility convenience fields
  bg: string;
  text: string;
  pageBg: string;
  pageBorder: string;
  accent: string;
  muted: string;
  highlightColors: {
    critique: string;
    sensory: string;
    factcheck: string;
    favorite: string;
    todo: string;
  };
}

export interface TypographyConfig {
  fontFamily: string; // primary manuscript font (backward-compatible)
  manuscriptFont: string;
  uiFont: string;
  headingFont: string;
  monoFont: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  paragraphSpacing: number;
  paragraphIndent: number;
  pageWidth: number;
  headingScale: 'classic' | 'modern' | 'dramatic';
  textAlign: 'left' | 'justify' | 'center' | 'right';
  typewriterMode: boolean;
  dropCap: boolean;
  sceneOrnament: string;
}

export interface AppearancePreset {
  id: string;
  name: string;
  description: string;
  themeId: string;
  manuscriptFont: string;
  uiFont: string;
  headingFont: string;
  monoFont: string;
  fontSize: number;
  lineHeight: number;
  paragraphIndent: number;
  pageWidth: number;
  textAlign?: 'left' | 'justify';
  dropCap?: boolean;
  sceneOrnament?: string;
  isCustom?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  actId?: string;
  content: string; // HTML / Markdown
  synopsis?: string;
  povCharacterId?: string;
  targetWordCount?: number;
  wordCount: number;
  status: 'draft' | 'in-progress' | 'revised' | 'final';
  tags?: string[];
  wikilinks?: string[];
  
  // Story Engine Integrations
  scenes?: Scene[];
  plotThreadIds?: string[];
  locationIds?: string[];
  characterIds?: string[];
  
  updatedAt: string;
}

export interface Act {
  id: string;
  title: string;
  order: number;
  description?: string;
  targetWordCount?: number;
  color?: string;
  storyArcIds?: string[];
  chapters: Chapter[];
}

export interface StoryBeat {
  id: string;
  title: string;
  act: 'Act I' | 'Act II-A' | 'Act II-B' | 'Act III' | string;
  beatType: 'Hook' | 'Inciting Incident' | 'Plot Point 1' | 'Midpoint' | 'All Hope Lost' | 'Climax' | 'Resolution' | 'Custom';
  description: string;
  targetChapterId?: string;
  targetSceneId?: string;
  tensionLevel: number;
  status: 'todo' | 'in-progress' | 'complete';
}

export interface Annotation {
  id: string;
  chapterId: string;
  sceneId?: string;
  type: 'highlight' | 'comment' | 'critique' | 'factcheck';
  color: string;
  quote: string;
  noteText?: string;
  characterId?: string;
  resolved: boolean;
  createdAt: string;
  from?: number;
  to?: number;
}

export type AIAssistanceMode = 'off' | 'local' | 'cloud';

export type WritingPartnerMode = 
  | 'brainstorm'       // Brainstorming & alternatives
  | 'discussion'       // Story craft & character psychology
  | 'critique'         // Constructive literary critique
  | 'continuity'       // Continuity investigation & resolution
  | 'research'         // Worldbuilding & lore research
  | 'structure';       // Structural beat & pacing analysis

export interface StructuredPartnerContext {
  projectTitle: string;
  genre: string;
  currentAct?: { id: string; title: string; order: number };
  currentChapter?: { id: string; title: string; synopsis?: string; status: string; wordCount: number };
  currentScene?: {
    id: string;
    title: string;
    purpose?: string;
    goal?: string;
    conflict?: string;
    outcome?: string;
    consequence?: string;
    status: string;
  };
  povCharacter?: {
    id: string;
    name: string;
    role: string;
    currentGoal?: string;
    currentState?: string;
    flaws?: string;
    secrets?: string;
  };
  involvedCharacters: Array<{
    id: string;
    name: string;
    role: string;
    currentGoal?: string;
    currentState?: string;
    flaws?: string;
    secrets?: string;
    relationships?: string[];
    knowledgeSummary?: string[];
  }>;
  activePlotThreads: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    expectedPayoff?: string;
  }>;
  relevantCodex: Array<{
    category: string;
    name: string;
    summary: string;
  }>;
  timelinePosition?: {
    beatTitle?: string;
    beatType?: string;
    act?: string;
    tensionLevel?: number;
  };
  recentContinuityWarnings?: Array<{
    type: string;
    title: string;
    description: string;
  }>;
  boundedDraftExcerpt?: string; // Strictly bounded excerpt (~1500 chars max), never full manuscript
}

export interface PartnerMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  mode?: WritingPartnerMode;
  contextAttached?: {
    chapterId?: string;
    sceneId?: string;
    characterIds?: string[];
    plotThreadIds?: string[];
    locationIds?: string[];
  };
}

export interface AIProviderConfig {
  mode: AIAssistanceMode; // 'off' | 'local' | 'cloud'
  provider: 'gemini' | 'openai' | 'anthropic' | 'ollama' | 'lmstudio' | 'openrouter';
  localProvider: 'ollama' | 'lmstudio' | 'custom-local';
  cloudProvider: 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'custom-cloud';
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
}

export type StoryGraphMode = 'story' | 'characters' | 'threads' | 'locations' | 'knowledge';

export interface GraphNode {
  id: string;
  label: string;
  type: 'chapter' | 'character' | 'act' | 'lore' | 'beat' | 'scene' | 'location' | 'faction' | 'item' | 'plotThread' | 'event' | 'knowledge' | 'storyArc';
  subType?: string;
  val: number; // size / weight
  color: string;
  targetId?: string;
  actId?: string;
  wordCount?: number;
  synopsis?: string;
  excerpt?: string;
  tags?: string[];
  castNames?: string[];
  certainty?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label?: string;
  type?: 'sequence' | 'character' | 'act' | 'lore' | 'beat' | 'location' | 'faction' | 'plotThread' | 'event' | 'knowledge' | 'storyArc';
  isDirectional?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphPhysicsConfig {
  repelForce: number;
  linkDistance: number;
  centerGravity: number;
  nodeScale: number;
  showArrows: boolean;
  showOrphans: boolean;
  showLabels: boolean;
  layoutMode: 'force' | 'spine' | 'radial';
  scope: 'global' | 'local';
  localDepth: number;
}

export interface CodexEntry {
  id: string;
  category: 'character' | 'location' | 'lore' | 'faction' | 'item';
  name: string;
  aliases?: string[];
  role?: string;
  summary: string;
  content: string;
  tags?: string[];
  color?: string;
  updatedAt?: string;
}

export interface CutScene {
  id: string;
  originalChapterId: string;
  originalChapterTitle: string;
  title: string;
  content: string;
  wordCount: number;
  deletedAt: string;
  reason?: string;
}

export interface SmartFilter {
  id: string;
  name: string;
  criteria: {
    povCharacterId?: string;
    status?: 'draft' | 'in-progress' | 'revised' | 'final';
    plotThreadId?: string;
    locationId?: string;
    maxWordCount?: number;
    minWordCount?: number;
    tag?: string;
  };
}

export type StructureTemplateType = 'three-act' | 'heros-journey' | 'serialized-volumes' | 'flat-pantser';

export interface ProjectMetadata {
  id: string;
  title: string;
  author: string;
  genre: string;
  targetWordCount: number;
  currentWordCount: number;
  preset: WriterPreset;
  theme: ThemeConfig;
  typography: TypographyConfig;
  continuityConfig?: ContinuityConfig;
  proofreadingConfig?: ProofreadingConfig;
  revisionSnapshots?: RevisionSnapshot[];
  enableWorldSimulation?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectData {
  metadata: ProjectMetadata;
  acts: Act[];
  characters: Character[];
  
  // Story Engine Domain Collections (Optional for backward-compatibility, initialized by migration)
  locations?: Location[];
  factions?: Faction[];
  items?: Item[];
  events?: Event[];
  storyArcs?: StoryArc[];
  plotThreads?: PlotThread[];
  researchNotes?: ResearchNote[];
  
  // Revision & Manuscript Review System
  revisionRounds?: RevisionRound[];
  revisionItems?: RevisionItem[];

  // Version History & Recovery System
  snapshots?: ManuscriptSnapshot[];

  // Legacy / Companion Stores
  codex?: CodexEntry[];
  cutScenes?: CutScene[];
  timeline: StoryBeat[];
  annotations: Annotation[];
  partnerMessages: PartnerMessage[];
  scratchpad: string;
}
