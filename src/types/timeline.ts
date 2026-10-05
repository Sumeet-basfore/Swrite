import { Scene, Character, Location, PlotThread, StoryArc, Event } from './storyEngine';

export type TimelineViewMode = 'manuscript' | 'chronology' | 'comparison';
export type TimelineTimeType = 'present' | 'flashback' | 'flashforward' | 'memory' | 'backstory' | 'historical' | 'parallel';

export interface StoryTimelineNode {
  id: string;
  type: 'scene' | 'chapter' | 'event';
  title: string;
  synopsis?: string;
  
  // Manuscript Position (Reading sequence)
  actId?: string;
  actTitle?: string;
  chapterId?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  sceneId?: string;
  sceneTitle?: string;
  manuscriptOrder: number; // 1, 2, 3... linear reading sequence
  
  // Story Chronology Position (In-universe time)
  chronologicalOrder: number; // 1, 2, 3... in-universe sequence
  timelineDate?: string;      // In-universe timestamp (e.g. "Year 1042", "Day 3, Dawn", "14 years earlier")
  parsedChronologicalScore: number; // Numerical score for true chronological sorting
  timeType: TimelineTimeType;
  
  // Entity Linkages
  povCharacter?: Character;
  characters: Character[];
  locations: Location[];
  plotThreads: PlotThread[];
  storyArcs: StoryArc[];
  events: Event[];
  
  // Dramatic Attributes
  tensionLevel?: number; // 1-10
  status?: string;
  wordCount?: number;
  tags?: string[];
  
  // Nonlinear Discrepancy Diagnostics
  isNonLinear: boolean;
  deltaManuscriptVsChronology: number; // difference between narrative position and chronological position
}

export interface ChronologyPoint {
  id: string;
  entityType: 'scene' | 'chapter' | 'event';
  entityId: string;
  title: string;
  rawDateStr?: string;
  standardMarker?: string;
  parsedScore: number;
  timeType: TimelineTimeType;
  isEstimated: boolean;
  isUndated: boolean;
}

export interface ChronologyInversionWarning {
  nodeId: string;
  entityId: string;
  entityType: 'scene' | 'chapter' | 'event';
  title: string;
  narrativeIndex: number;
  chronologicalIndex: number;
  timeType: TimelineTimeType;
  reason: string;
  delta: number;
}

export interface TimelineFilterConfig {
  characterId?: string;
  locationId?: string;
  plotThreadId?: string;
  storyArcId?: string;
  timeType?: TimelineTimeType | 'all';
  searchQuery?: string;
}

export interface StoryTimelineData {
  manuscriptNodes: StoryTimelineNode[];
  chronologyNodes: StoryTimelineNode[];
  allNodes: StoryTimelineNode[];
  totalScenes: number;
  totalChapters: number;
  totalEvents: number;
  nonLinearCount: number;
  flashbackCount: number;
  flashforwardCount: number;
}
