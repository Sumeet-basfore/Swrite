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
};
