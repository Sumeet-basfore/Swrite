import { ProjectData } from './index';

export type SnapshotType = 
  | 'manual'
  | 'auto'
  | 'revision-round'
  | 'pre-export'
  | 'pre-migration'
  | 'pre-restore'
  | 'recovery';

export type SnapshotScope = 'manuscript' | 'chapter' | 'scene';

export interface SnapshotMetadata {
  id: string;
  projectId: string;
  label: string;
  description?: string;
  createdAt: string;
  snapshotType: SnapshotType;
  source: string;
  scope: SnapshotScope;
  targetChapterId?: string;
  targetChapterTitle?: string;
  targetSceneId?: string;
  targetSceneTitle?: string;
  
  // Manuscript metrics at time of snapshot
  wordCount: number;
  chapterCount: number;
  sceneCount: number;
  characterCount: number;
  plotThreadCount: number;
  
  // Integrity & versioning
  contentHash: string;
  metadataHash: string;
  schemaVersion: number;
}

export interface CreateSnapshotOptions {
  label?: string;
  description?: string;
  type?: SnapshotType;
  source?: string;
  scope?: SnapshotScope;
  targetChapterId?: string;
  targetSceneId?: string;
  pinned?: boolean;
}

export interface ManuscriptSnapshot extends SnapshotMetadata {
  // Snapshot Payload: complete serialized project data or scoped snapshot data
  projectData: ProjectData;
  pinned?: boolean;
}

export type DiffChangeType = 'unchanged' | 'added' | 'removed' | 'modified';

export interface TextDiffSegment {
  type: 'unchanged' | 'added' | 'removed';
  text: string;
}

export interface DiffParagraph {
  id: string;
  index: number;
  changeType: DiffChangeType;
  before: string;
  after: string;
  wordSegments?: TextDiffSegment[];
  substantiallyRewritten?: boolean;
}

export interface ChapterDiffResult {
  chapterId: string;
  chapterTitle: string;
  changeType: DiffChangeType;
  baseWordCount: number;
  targetWordCount: number;
  wordCountDelta: number;
  segments: TextDiffSegment[];
  paragraphs?: DiffParagraph[];
}

export interface SceneDiffResult {
  sceneId: string;
  chapterId: string;
  sceneTitle: string;
  changeType: DiffChangeType;
  paragraphs: DiffParagraph[];
}

export interface SnapshotDiffResult {
  baseSnapshotId?: string;
  baseLabel: string;
  targetSnapshotId?: string;
  targetLabel: string;
  comparedAt: string;
  
  // High-level statistics
  totalAddedWords: number;
  totalRemovedWords: number;
  netWordDelta: number;
  
  chapterDiffs: ChapterDiffResult[];
  sceneDiffs?: SceneDiffResult[];
  
  // Structural changes
  addedChapters: string[];
  removedChapters: string[];
  modifiedChapters: string[];
  unchangedChapters: string[];
  
  // Story Engine differences count
  characterChangesCount: number;
  plotThreadChangesCount: number;
}

export interface SnapshotRestoreOptions {
  restoreScope?: SnapshotScope;
  targetChapterId?: string;
  targetSceneId?: string;
  customSafetyLabel?: string;
}

export interface SnapshotRestoreResult {
  restoredProject: ProjectData;
  preRestoreSnapshot: ManuscriptSnapshot;
  restoredScope: SnapshotScope;
  restoredEntitiesSummary: string;
}

export interface SnapshotFilterOptions {
  snapshotType?: SnapshotType;
  scope?: SnapshotScope;
  targetChapterId?: string;
  searchQuery?: string;
  pinnedOnly?: boolean;
}

export interface SnapshotGroup {
  timeGroup: 'Today' | 'Yesterday' | 'This Week' | 'Earlier this Month' | 'Older';
  snapshots: ManuscriptSnapshot[];
}
