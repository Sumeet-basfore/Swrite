import { ItemPlanningMeta } from '../types/ipc';

export type PlanningTab = 'outline' | 'timeline' | 'notes';

export type OutlineLayoutMode = 'tree' | 'cards';

export type SceneWorkflowStatus = 'Idea' | 'Planned' | 'Drafted' | 'Revising' | 'Complete';

export interface OutlineItem {
  id: string; // relativePath
  name: string;
  relativePath: string;
  level: 'act' | 'chapter' | 'scene';
  isDirectory: boolean;
  children: OutlineItem[];
  meta?: ItemPlanningMeta;
  wordCount?: number;
}

export interface TimelineFilter {
  query: string;
  markerFilter: string | 'All';
}
