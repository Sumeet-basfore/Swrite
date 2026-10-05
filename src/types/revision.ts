/**
 * SWRITE — REVISION & MANUSCRIPT REVIEW SYSTEM TYPES
 * Milestone 7: Professional Author-Controlled Revision Domain Model
 */

export type RevisionPassType = 
  | 'structure'
  | 'plot'
  | 'character'
  | 'pacing'
  | 'dialogue'
  | 'worldbuilding'
  | 'description'
  | 'continuity'
  | 'repetition'
  | 'prose'
  | 'proofreading'
  | 'custom';

export type RevisionRoundStatus = 
  | 'planned'
  | 'in-progress'
  | 'paused'
  | 'completed'
  | 'archived';

export type RevisionItemStatus = 
  | 'open'
  | 'in-progress'
  | 'resolved'
  | 'deferred'
  | 'wont-change';

export type RevisionItemPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type RevisionItemCategory = 
  | 'structure'
  | 'plot'
  | 'character'
  | 'pacing'
  | 'dialogue'
  | 'worldbuilding'
  | 'description'
  | 'continuity'
  | 'repetition'
  | 'prose'
  | 'proofreading'
  | 'sensory'
  | 'research'
  | 'other';

export const REVISION_PASS_LABELS: Record<RevisionPassType, string> = {
  structure: 'Structure Pass',
  plot: 'Plot Pass',
  character: 'Character Arc Pass',
  pacing: 'Pacing Pass',
  dialogue: 'Dialogue Pass',
  worldbuilding: 'Worldbuilding Pass',
  description: 'Description Pass',
  continuity: 'Continuity Pass',
  repetition: 'Repetition Pass',
  prose: 'Prose & Voice Pass',
  proofreading: 'Proofreading Pass',
  custom: 'Custom Editorial Pass',
};

export const REVISION_CATEGORY_LABELS: Record<RevisionItemCategory, string> = {
  structure: 'Structure',
  plot: 'Plot',
  character: 'Character',
  pacing: 'Pacing',
  dialogue: 'Dialogue',
  worldbuilding: 'Worldbuilding',
  description: 'Description',
  continuity: 'Continuity',
  repetition: 'Repetition',
  prose: 'Prose',
  proofreading: 'Proofreading',
  sensory: 'Sensory',
  research: 'Research',
  other: 'Editorial Note',
};

export const REVISION_PRIORITY_LABELS: Record<RevisionItemPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const REVISION_STATUS_LABELS: Record<RevisionItemStatus, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  deferred: 'Deferred',
  'wont-change': 'Intentional / Kept',
};

export type RevisionScope = 
  | 'scene'
  | 'chapter'
  | 'act'
  | 'manuscript';

export type SceneRevisionStatus = 
  | 'no-revision'
  | 'needs-review'
  | 'in-progress'
  | 'reviewed';

export type RevisionGroupingMode = 
  | 'status'
  | 'pass'
  | 'chapter'
  | 'priority'
  | 'character'
  | 'thread';

export interface RevisionRound {
  id: string;
  name: string;
  description?: string;
  passType: RevisionPassType;
  status: RevisionRoundStatus;
  scope: RevisionScope;
  targetActId?: string;
  targetChapterId?: string;
  targetSceneId?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  snapshotLabel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TextAnchor {
  from: number;
  to: number;
  selectedText: string;
  surroundingContext?: string;
}

export interface RevisionItem {
  id: string;
  revisionRoundId?: string;
  title: string;
  description?: string;
  category: RevisionItemCategory;
  priority: RevisionItemPriority;
  status: RevisionItemStatus;
  notes?: string;
  
  // Manuscript Location
  actId?: string;
  chapterId?: string;
  sceneId?: string;
  
  // Inline Anchoring
  anchoredText?: string;
  anchorOffset?: { from: number; to: number };
  needsReanchoring?: boolean;

  // Story Engine Integrations (IDs only, never duplicate domain data)
  relatedCharacterIds?: string[];
  relatedPlotThreadIds?: string[];
  relatedStoryArcIds?: string[];
  relatedEventIds?: string[];

  // Source continuity reference (if converted from Continuity engine)
  sourceContinuityId?: string;

  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface RevisionSnapshot {
  id: string;
  roundId: string;
  label: string;
  summary: string;
  totalItems: number;
  itemsResolved: number;
  resolvedItems?: number;
  createdAt: string;
}

export interface StoryAwareRevisionContext {
  character?: {
    id: string;
    name: string;
    role: string;
    currentState?: string;
    goals: Array<{ id: string; statement: string; status: string }>;
    beliefs: Array<{ id: string; statement: string; certainty: string }>;
    lastSeenSceneTitle?: string;
    lastSeenChapterTitle?: string;
  };
  characters: Array<{
    id: string;
    name: string;
    role?: string;
    activeArc?: string;
    currentBelief?: string;
  }>;
  plotThread?: {
    id: string;
    title: string;
    type: string;
    status: string;
    expectedPayoff?: string;
    lastTouchedSceneTitle?: string;
  };
  plotThreads: Array<{
    id: string;
    name: string;
    status: string;
    resolutionPromise?: string;
  }>;
  scene?: {
    id: string;
    title: string;
    purpose?: string;
    goal?: string;
    conflict?: string;
    outcome?: string;
    povCharacterName?: string;
    wordCount: number;
  };
  sceneName?: string;
  sceneGoals?: string;
  chapter?: {
    id: string;
    title: string;
    wordCount: number;
    actTitle?: string;
  };
  chapterName?: string;
}

export interface RevisionFilterOptions {
  roundId?: string;
  passType?: RevisionPassType;
  category?: RevisionItemCategory;
  priority?: RevisionItemPriority;
  status?: RevisionItemStatus;
  scope?: RevisionScope;
  actId?: string;
  chapterId?: string;
  sceneId?: string;
  characterId?: string;
  plotThreadId?: string;
  searchQuery?: string;
}
