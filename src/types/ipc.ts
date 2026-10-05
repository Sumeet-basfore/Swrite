export interface ProjectSummary {
  project_id: string;
  name: string;
  root_path: string;
  manifest: ProjectManifest;
  file_counts: ProjectFileCounts;
}

export interface ProjectManifest {
  schema_version: number;
  project_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  document_identities: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface ProjectFileCounts {
  manuscript_count: number;
  planning_count: number;
  desk_count: number;
  asset_count: number;
}

export interface DiscoveredFile {
  relative_path: string;
  name: string;
  is_directory: boolean;
  format: 'markdown' | 'txt' | 'docx' | 'binary';
  size_bytes: number;
}

export interface ProjectFilesystemView {
  manuscript_files: DiscoveredFile[];
  planning_files: DiscoveredFile[];
  desk_files: DiscoveredFile[];
  asset_files: DiscoveredFile[];
  other_visible_files: DiscoveredFile[];
}

export interface FileMetadataInfo {
  relative_path: string;
  is_directory: boolean;
  size_bytes: number;
  modified_timestamp_ms: number;
  sha256_hash: string;
  fast_hash: number;
  is_readonly: boolean;
}

export interface ProjectUiState {
  last_opened_document?: string;
  expanded_folders: string[];
  sidebar_collapsed: boolean;
  last_search_scope?: string;
}

export interface RecentDocumentEntry {
  document_id: string;
  relative_path: string;
  last_opened_at: string;
}

// Planning Studio Types
export interface TimelineEvent {
  id: string;
  title: string;
  temporal_position: string;
  narrative_marker?: string | null;
  linked_scene?: string | null;
  description: string;
  notes: string;
  order_index: number;
}

export interface TimelineData {
  events: TimelineEvent[];
}

export interface ItemPlanningMeta {
  relative_path: string;
  title?: string | null;
  summary?: string | null;
  notes?: string | null;
  status?: 'Idea' | 'Planned' | 'Drafted' | 'Revising' | 'Complete' | null;
  custom_order?: number | null;
}

export interface OutlinePlanningData {
  items: ItemPlanningMeta[];
}

// Creative Desk & Moodboard Types
export interface MoodboardCanvasState {
  pan_x: number;
  pan_y: number;
  zoom: number;
}

export type MoodboardItem =
  | {
      type: 'image';
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      asset_path: string;
      caption?: string | null;
      z_index: number;
    }
  | {
      type: 'text';
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      text: string;
      style: 'title' | 'body' | 'label';
      z_index: number;
    }
  | {
      type: 'color';
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      hex: string;
      label?: string | null;
      z_index: number;
    }
  | {
      type: 'note';
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      title: string;
      content: string;
      z_index: number;
    }
  | {
      type: 'link';
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      title: string;
      target_path: string;
      z_index: number;
    };

export interface MoodboardData {
  id: string;
  name: string;
  canvas: MoodboardCanvasState;
  items: MoodboardItem[];
  updated_at: number;
}

export interface RecoveryDraft {
  document_id: string;
  relative_path: string;
  timestamp: string;
  content_hash: string;
  content: string;
}

export interface SnapshotMetadata {
  snapshot_id: string;
  document_id: string;
  relative_path: string;
  timestamp: string;
  content_hash: string;
  label?: string;
}

export interface DocumentSnapshot {
  metadata: SnapshotMetadata;
  content: string;
}

export interface ReconciliationResult {
  status: 'Identical' | 'UserOnlyChanged' | 'ExternalOnlyChanged' | 'BothChangedConflict' | 'DeletedOnDisk';
  relative_path: string;
  base_hash?: string;
  user_hash: string;
  disk_hash?: string;
  conflict_details?: {
    user_length: number;
    disk_length: number;
    message: string;
  };
}

export interface SearchMatch {
  relative_path: string;
  line_number: number;
  character_offset: number;
  matched_text: string;
  excerpt: string;
}

export interface SearchResult {
  query: string;
  total_matches: number;
  matches: SearchMatch[];
}
