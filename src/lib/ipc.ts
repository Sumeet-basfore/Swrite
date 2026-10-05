import { invoke } from '@tauri-apps/api/core';
import { Document } from '../types/document';
import {
  DocumentSnapshot,
  FileMetadataInfo,
  ProjectFilesystemView,
  ProjectSummary,
  ProjectUiState,
  RecentDocumentEntry,
  ReconciliationResult,
  RecoveryDraft,
  SearchResult,
  SnapshotMetadata,
  TimelineData,
  OutlinePlanningData,
  ItemPlanningMeta,
  MoodboardData,
  CommentsData,
  Comment,
  RevisionsData,
  RevisionNote,
  ProjectDictionary,
  ProofreadingFinding,
  DocumentDiffResult,
} from '../types/ipc';

export const SwriteIpc = {
  // Project operations
  projectCreate: (path: string, name: string) =>
    invoke<ProjectSummary>('project_create', { path, name }),

  projectOpen: (path: string) =>
    invoke<ProjectSummary>('project_open', { path }),

  projectValidate: (path: string) =>
    invoke<{ is_valid: boolean; issues: string[]; warnings: string[]; healed_structures: string[] }>('project_validate', { path }),

  projectClose: () =>
    invoke<void>('project_close'),

  projectDiscover: () =>
    invoke<ProjectFilesystemView>('project_discover'),

  projectGetUiState: () =>
    invoke<ProjectUiState>('project_get_ui_state'),

  projectSetUiState: (uiState: ProjectUiState) =>
    invoke<void>('project_set_ui_state', { uiState }),

  projectGetRecents: () =>
    invoke<RecentDocumentEntry[]>('project_get_recents'),

  projectAddRecent: (documentId: string, relativePath: string) =>
    invoke<void>('project_add_recent', { documentId, relativePath }),

  // File operations
  fileRead: (relativePath: string) =>
    invoke<string>('file_read', { relativePath }),

  fileWrite: (relativePath: string, content: string) =>
    invoke<void>('file_write', { relativePath, content }),

  fileCreate: (relativePath: string, initialContent?: string) =>
    invoke<string>('file_create', { relativePath, initialContent }),

  fileMkdir: (relativePath: string) =>
    invoke<void>('file_mkdir', { relativePath }),

  fileRename: (oldRelative: string, newRelative: string) =>
    invoke<void>('file_rename', { oldRelative, newRelative }),

  fileCopy: (sourceRelative: string, targetRelative: string) =>
    invoke<void>('file_copy', { sourceRelative, targetRelative }),

  fileDuplicate: (relativePath: string) =>
    invoke<string>('file_duplicate', { relativePath }),

  fileDelete: (relativePath: string) =>
    invoke<void>('file_delete', { relativePath }),

  fileDeleteSafe: (relativePath: string) =>
    invoke<void>('file_delete_safe', { relativePath }),

  fileImport: (sourceAbsolutePath: string, targetRelativePath: string) =>
    invoke<string>('file_import', { sourceAbsolutePath, targetRelativePath }),

  fileExists: (relativePath: string) =>
    invoke<boolean>('file_exists', { relativePath }),

  fileMetadata: (relativePath: string) =>
    invoke<FileMetadataInfo>('file_metadata', { relativePath }),

  // Planning operations
  timelineLoad: () =>
    invoke<TimelineData>('timeline_load'),

  timelineSave: (timeline: TimelineData) =>
    invoke<void>('timeline_save', { timeline }),

  outlineMetaLoad: () =>
    invoke<OutlinePlanningData>('outline_meta_load'),

  outlineMetaSave: (outline: OutlinePlanningData) =>
    invoke<void>('outline_meta_save', { outline }),

  outlineMetaUpdateItem: (item: ItemPlanningMeta) =>
    invoke<void>('outline_meta_update_item', { item }),

  // Desk & Moodboard operations
  moodboardLoad: (relativePath: string) =>
    invoke<MoodboardData>('moodboard_load', { relativePath }),

  moodboardSave: (relativePath: string, data: MoodboardData) =>
    invoke<void>('moodboard_save', { relativePath, data }),

  moodboardCreate: (name: string) =>
    invoke<string>('moodboard_create', { name }),

  assetImport: (sourceAbsolutePath: string, customName?: string) =>
    invoke<string>('asset_import', { sourceAbsolutePath, customName }),

  assetReadBase64: (relativePath: string) =>
    invoke<string>('asset_read_base64', { relativePath }),

  deskScanBacklinks: (targetRelativePath: string) =>
    invoke<string[]>('desk_scan_backlinks', { targetRelativePath }),

  // Document operations
  documentRead: (relativePath: string, documentId?: string) =>
    invoke<Document>('document_read', { relativePath, documentId }),

  documentWrite: (relativePath: string, document: Document, format: string) =>
    invoke<void>('document_write', { relativePath, document, format }),

  documentParse: (source: string, format: string, documentId?: string) =>
    invoke<Document>('document_parse', { source, format, documentId }),

  documentSerialize: (document: Document, format: string) =>
    invoke<string>('document_serialize', { document, format }),

  // Recovery operations
  recoverySave: (documentId: string, relativePath: string, content: string) =>
    invoke<void>('recovery_save', { documentId, relativePath, content }),

  recoveryClear: (documentId: string) =>
    invoke<void>('recovery_clear', { documentId }),

  recoveryList: () =>
    invoke<RecoveryDraft[]>('recovery_list'),

  recoveryGet: (documentId: string) =>
    invoke<RecoveryDraft | null>('recovery_get', { documentId }),

  // History operations
  historyRecord: (documentId: string, relativePath: string, content: string, label?: string) =>
    invoke<SnapshotMetadata>('history_record', { documentId, relativePath, content, label }),

  historyList: (documentId: string) =>
    invoke<SnapshotMetadata[]>('history_list', { documentId }),

  historyGet: (documentId: string, snapshotId: string) =>
    invoke<DocumentSnapshot | null>('history_get', { documentId, snapshotId }),

  // Search
  searchQuery: (query: string) =>
    invoke<SearchResult>('search_query', { query }),

  searchReindex: () =>
    invoke<void>('search_reindex'),

  // Watcher
  watchStart: () =>
    invoke<void>('watch_start'),

  watchStop: () =>
    invoke<void>('watch_stop'),

  // Reconciliation
  reconciliationInspect: (relativePath: string, baseContent?: string, userContent: string = '') =>
    invoke<ReconciliationResult>('reconciliation_inspect', { relativePath, baseContent, userContent }),

  // Milestone 7 — Comments
  commentsLoad: () =>
    invoke<CommentsData>('comments_load'),

  commentsSave: (data: CommentsData) =>
    invoke<void>('comments_save', { data }),

  commentAdd: (comment: Comment) =>
    invoke<void>('comment_add', { comment }),

  commentResolve: (commentId: string, resolved: boolean) =>
    invoke<void>('comment_resolve', { commentId, resolved }),

  commentDelete: (commentId: string) =>
    invoke<void>('comment_delete', { commentId }),

  // Milestone 7 — Revisions
  revisionsLoad: () =>
    invoke<RevisionsData>('revisions_load'),

  revisionsSave: (data: RevisionsData) =>
    invoke<void>('revisions_save', { data }),

  revisionAdd: (revision: RevisionNote) =>
    invoke<void>('revision_add', { revision }),

  revisionUpdate: (revision: RevisionNote) =>
    invoke<void>('revision_update', { revision }),

  revisionDelete: (revisionId: string) =>
    invoke<void>('revision_delete', { revisionId }),

  // Milestone 7 — Dictionary
  dictionaryLoad: () =>
    invoke<ProjectDictionary>('dictionary_load'),

  dictionaryAddWord: (word: string) =>
    invoke<void>('dictionary_add_word', { word }),

  dictionaryRemoveWord: (word: string) =>
    invoke<void>('dictionary_remove_word', { word }),

  dictionaryAddIgnore: (findingId: string) =>
    invoke<void>('dictionary_add_ignore', { findingId }),

  // Milestone 7 — History Diff & Safe Restore
  historyDiffSnapshots: (documentId: string, oldSnapshotId: string, newSnapshotId: string) =>
    invoke<DocumentDiffResult>('history_diff_snapshots', { documentId, oldSnapshotId, newSnapshotId }),

  historyDiffCurrent: (documentId: string, snapshotId: string, currentContent: string) =>
    invoke<DocumentDiffResult>('history_diff_current', { documentId, snapshotId, currentContent }),

  historySafeRestore: (documentId: string, relativePath: string, snapshotId: string, currentContent: string) =>
    invoke<string>('history_safe_restore', { documentId, relativePath, snapshotId, currentContent }),

  // Milestone 7 — Proofreading
  proofreadText: (text: string) =>
    invoke<ProofreadingFinding[]>('proofread_text', { text }),
};

