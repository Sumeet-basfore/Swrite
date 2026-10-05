import { ProjectData, Scene, Chapter, Act } from '../../types';

export type FindingCategory = 'mechanical' | 'grammar' | 'style' | 'consistency';
export type FindingSeverity = 'info' | 'warning' | 'error';
export type FindingStatus = 'open' | 'accepted' | 'ignored' | 'intentional';
export type ProofreadingScope = 'scene' | 'chapter' | 'act' | 'manuscript';

export type ProofreadingPassId = 
  | 'spelling'
  | 'grammar'
  | 'punctuation'
  | 'repetition'
  | 'passive-voice'
  | 'adverbs'
  | 'sentence-length'
  | 'filler-words'
  | 'consistency-names'
  | 'consistency-formatting';

export interface FindingPosition {
  start: number;
  end: number;
  line?: number;
  column?: number;
}

export interface Finding {
  id: string;
  ruleId: string;
  category: FindingCategory;
  passId: ProofreadingPassId;
  severity: FindingSeverity;
  title: string;
  message: string;
  explanation?: string;
  originalText: string;
  suggestedText?: string;
  position: FindingPosition;
  chapterId: string;
  chapterTitle?: string;
  sceneId?: string;
  sceneTitle?: string;
  actId?: string;
  actTitle?: string;
  status: FindingStatus;
  createdAt: string;
  contextSnippet?: string;
}

export interface ProofreadingPassConfig {
  id: ProofreadingPassId;
  name: string;
  category: FindingCategory;
  description: string;
  enabled: boolean;
  isStylePass?: boolean;
}

export interface ProofreadingConfig {
  preserveVoice: boolean; // default true
  scope: ProofreadingScope; // default 'scene'
  activePasses: Record<ProofreadingPassId, boolean>;
  ignoredFindingIds: string[];
  intentionalFindingIds: string[];
  acceptedFindingIds: string[];
  customDictionary: string[];
}

export interface ProofreadingSummary {
  total: number;
  mechanicalCount: number;
  grammarCount: number;
  punctuationCount: number;
  styleCount: number;
  consistencyCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  byCategory: Record<FindingCategory, number>;
  byPass: Record<ProofreadingPassId, number>;
  findings: Finding[];
}

export interface ProofreadingRuleContext {
  project: ProjectData;
  act?: Act;
  chapter: Chapter;
  scene?: Scene;
  rawText: string;
  plainText: string;
  config: ProofreadingConfig;
}

export interface ProofreadingRule {
  id: string;
  name: string;
  category: FindingCategory;
  passId: ProofreadingPassId;
  severity: FindingSeverity;
  isStyleRule?: boolean;
  check: (context: ProofreadingRuleContext) => Finding[];
}
