import { EntityType } from './storyEngine';

export type ContinuityCheckType = 
  | 'knowledge' 
  | 'state' 
  | 'timeline' 
  | 'location' 
  | 'attributes' 
  | 'thread-dormancy' 
  | 'reference';

export type ContinuitySeverity = 'critical' | 'warning' | 'notice';

export interface ContinuityEvidence {
  label: string;
  chapterId?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  sceneId?: string;
  sceneTitle?: string;
  entityId?: string;
  entityType?: EntityType;
  details?: string;
}

export interface ContinuityWarning {
  id: string;
  type: ContinuityCheckType;
  severity: ContinuitySeverity;
  title: string;
  summary: string;
  description: string;
  evidence: ContinuityEvidence[];
  primaryChapterId?: string;
  secondaryChapterId?: string;
  entityId?: string;
  entityType?: EntityType;
  suggestedAction?: {
    label: string;
    actionType: 'update-state' | 'update-knowledge' | 'resolve-thread' | 'navigate-codex' | 'navigate-thread' | 'custom';
    payload?: any;
  };
  isIgnored?: boolean;
  isIntentional?: boolean;
  intentionalReason?: string;
  createdAt: string;
}

export interface IntentionalChoiceRecord {
  id: string;
  warningId: string;
  warningTitle: string;
  type: ContinuityCheckType;
  reason?: string;
  markedAt: string;
}

export interface ContinuityConfig {
  threadDormancyChapterThreshold: number; // default 3
  ignoredWarningIds: string[];
  intentionalWarnings: IntentionalChoiceRecord[];
  enabledChecks: {
    knowledge: boolean;
    state: boolean;
    timeline: boolean;
    location: boolean;
    attributes: boolean;
    threadDormancy: boolean;
  };
}
