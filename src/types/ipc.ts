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

// Milestone 7 — Edit Studio Types

export interface TextAnchor {
  document_id: string;
  relative_path: string;
  start_offset: number;
  end_offset: number;
  exact_text: string;
  prefix_context: string;
  suffix_context: string;
}

export interface CommentReply {
  id: string;
  created_at: string;
  content: string;
}

export interface Comment {
  id: string;
  anchor: TextAnchor;
  created_at: string;
  updated_at: string;
  content: string;
  replies: CommentReply[];
  status: 'open' | 'resolved' | 'deleted';
}

export interface CommentsData {
  comments: Comment[];
}

export type RevisionCategory =
  | 'Structure'
  | 'Plot'
  | 'Character'
  | 'Pacing'
  | 'Dialogue'
  | 'Worldbuilding'
  | 'Continuity'
  | 'Prose'
  | 'Proofreading'
  | 'General';

export type RevisionSeverity = 'low' | 'medium' | 'high';
export type RevisionStatus = 'open' | 'resolved' | 'ignored';

export interface RevisionNote {
  id: string;
  title: string;
  description: string;
  category: RevisionCategory;
  severity: RevisionSeverity;
  status: RevisionStatus;
  target_path?: string | null;
  anchor?: TextAnchor | null;
  created_at: string;
  updated_at: string;
}

export interface RevisionsData {
  revisions: RevisionNote[];
}

export interface ProjectDictionary {
  custom_words: string[];
  ignored_patterns: string[];
  ignored_findings: string[];
}

export type ProofreadingSeverity = 'info' | 'warning' | 'error';

export interface ProofreadingFinding {
  id: string;
  rule_id: string;
  message: string;
  severity: ProofreadingSeverity;
  start_offset: number;
  end_offset: number;
  line_number: number;
  column_number: number;
  matched_text: string;
  suggested_replacement?: string | null;
}

export interface DiffChunk {
  origin: 'same' | 'added' | 'removed' | 'modified';
  old_line_num?: number | null;
  new_line_num?: number | null;
  content: string;
}

export interface DocumentDiffResult {
  old_snapshot_id?: string | null;
  new_snapshot_id?: string | null;
  chunks: DiffChunk[];
  additions_count: number;
  deletions_count: number;
  modifications_count: number;
}

// Milestone 8 — Publish Studio Types

export type OutputFormat = 'pdf' | 'docx' | 'epub' | 'markdown' | 'txt';

export interface PageSizeConfig {
  width_in: number;
  height_in: number;
  preset: string;
}

export interface MarginsConfig {
  top_in: number;
  bottom_in: number;
  inside_in: number;
  outside_in: number;
}

export interface TypographyConfig {
  body_font: string;
  heading_font: string;
  font_size_pt: number;
  line_height: number;
  paragraph_indent_in: number;
  paragraph_spacing_pt: number;
  text_align: string;
}

export interface ChapterStyleConfig {
  numbering_style: string;
  title_case: string;
  alignment: string;
  spacing_top_pt: number;
  drop_cap: boolean;
  ornament?: string | null;
}

export interface SceneBreakConfig {
  style: string;
  custom_text?: string | null;
}

export interface HeadersFootersConfig {
  show_header: boolean;
  show_footer: boolean;
  left_header: string;
  center_header: string;
  right_header: string;
  left_footer: string;
  center_footer: string;
  right_footer: string;
  suppress_first_page: boolean;
  odd_even_different: boolean;
}

export interface PageNumberingConfig {
  style: string;
  start_at: number;
  position: string;
}

export interface FrontMatterConfig {
  include_title_page: boolean;
  title: string;
  subtitle?: string | null;
  author: string;
  copyright?: string | null;
  publisher?: string | null;
  edition?: string | null;
  dedication?: string | null;
  epigraph?: string | null;
}

export interface BackMatterConfig {
  include_acknowledgements: boolean;
  acknowledgements_text?: string | null;
  include_about_author: boolean;
  about_author_text?: string | null;
}

export interface PublicationProfile {
  id: string;
  name: string;
  description: string;
  is_builtin: boolean;
  format: OutputFormat;
  page_size: PageSizeConfig;
  margins: MarginsConfig;
  typography: TypographyConfig;
  chapter_style: ChapterStyleConfig;
  scene_break_style: SceneBreakConfig;
  headers_footers: HeadersFootersConfig;
  page_numbering: PageNumberingConfig;
  front_matter: FrontMatterConfig;
  back_matter: BackMatterConfig;
}

export interface PublishProfilesData {
  active_profile_id: string;
  custom_profiles: PublicationProfile[];
}

export type PreflightSeverity = 'info' | 'warning' | 'blocking';

export interface PreflightIssue {
  id: string;
  severity: PreflightSeverity;
  category: string;
  message: string;
  document_path?: string | null;
  line_number?: number | null;
  suggestion?: string | null;
}

export interface PreflightCheckResult {
  is_valid: boolean;
  chapters_checked: number;
  images_checked: number;
  links_checked: number;
  issues: PreflightIssue[];
  blocking_count: number;
  warning_count: number;
  info_count: number;
}

export type RenderedBlock =
  | {
      type: 'title_page';
      title: string;
      subtitle?: string | null;
      author: string;
      edition?: string | null;
      publisher?: string | null;
    }
  | {
      type: 'copyright_page';
      text: string;
    }
  | {
      type: 'dedication_page';
      text: string;
    }
  | {
      type: 'epigraph_page';
      text: string;
    }
  | {
      type: 'chapter_title';
      number_label?: string | null;
      title: string;
      ornament?: string | null;
    }
  | {
      type: 'paragraph';
      text: string;
      is_first_in_chapter: boolean;
    }
  | {
      type: 'scene_break';
      symbol: string;
    }
  | {
      type: 'image';
      src: string;
      alt: string;
      caption?: string | null;
    };

export interface RenderedPage {
  page_number: number;
  display_number: string;
  is_front_matter: boolean;
  header_left: string;
  header_center: string;
  header_right: string;
  footer_left: string;
  footer_center: string;
  footer_right: string;
  blocks: RenderedBlock[];
  width_pt: number;
  height_pt: number;
  margin_top_pt: number;
  margin_bottom_pt: number;
  margin_left_pt: number;
  margin_right_pt: number;
}

export interface PaginationResult {
  total_pages: number;
  front_matter_pages: number;
  body_pages: number;
  pages: RenderedPage[];
  word_count: number;
}

// Plugin Architecture Types
export type PluginCapability =
  | 'project.read'
  | 'project.write'
  | 'document.read'
  | 'document.write'
  | 'selection.read'
  | 'commands.register'
  | 'panels.register'
  | 'exporters.register';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  api_version: number;
  description?: string | null;
  author?: string | null;
  entry: string;
  permissions: PluginCapability[];
}

export interface DiscoveredPlugin {
  manifest: PluginManifest;
  is_enabled: boolean;
  directory_path: string;
  entry_code?: string | null;
}

export interface PluginStateConfig {
  enabled_plugins: Record<string, boolean>;
}

export interface ImportSummary {
  total_found: number;
  imported_count: number;
  skipped_count: number;
  conflict_count: number;
  unsupported_count: number;
  imported_files: string[];
  skipped_files: string[];
  errors: string[];
}


