import React from 'react';
import { ProjectFilesystemView, ProjectSummary } from '../types/ipc';
import { FileTree } from './FileTree';
import { buildSectionTree } from './treeUtils';
import { TreeNode } from './types';
import {
  BookOpen,
  Plus,
  RefreshCw,
  FilePlus,
  ChevronDown,
  ChevronRight,
  UploadCloud,
} from 'lucide-react';

export interface SidebarProps {
  project: ProjectSummary | null;
  filesView: ProjectFilesystemView | null;
  selectedFile: string | null;
  expandedFolders: Set<string>;
  collapsed: boolean;
  onOpenFile: (relativePath: string) => void;
  onToggleFolder: (folderPath: string) => void;
  onRefreshFiles: () => void;
  onNewChapter: () => void;
  onNewDocument: (parentFolder: string) => void;
  onNewFolder: (parentFolder: string, name: string) => void;
  onContextMenu: (e: React.MouseEvent, node: TreeNode | null, section: string | null) => void;
  onRenameCommit: (oldRelative: string, newRelative: string) => Promise<void>;
  onMoveFile: (sourceRelative: string, targetRelative: string) => Promise<void>;
  onOpenImport?: (section?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  project,
  filesView,
  selectedFile,
  expandedFolders,
  collapsed,
  onOpenFile,
  onToggleFolder,
  onRefreshFiles,
  onNewChapter,
  onNewDocument,
  onContextMenu,
  onRenameCommit,
  onMoveFile,
  onOpenImport,
}) => {
  if (collapsed) return null;

  const manuscriptTree = filesView
    ? buildSectionTree(filesView.manuscript_files, 'Manuscript')
    : [];
  const planningTree = filesView
    ? buildSectionTree(filesView.planning_files, 'Planning')
    : [];
  const deskTree = filesView
    ? buildSectionTree(filesView.desk_files, 'Desk')
    : [];
  const assetsTree = filesView
    ? buildSectionTree(filesView.asset_files, 'Assets')
    : [];

  const renderSectionHeader = (
    title: string,
    sectionKey: 'Manuscript' | 'Planning' | 'Desk' | 'Assets',
    count: number,
    onPrimaryAdd: () => void
  ) => {
    const isExpanded = expandedFolders.has(sectionKey);
    return (
      <div
        className="sidebar-section-header"
        onContextMenu={(e) => onContextMenu(e, null, sectionKey)}
      >
        <div
          className="section-title-wrap"
          onClick={() => onToggleFolder(sectionKey)}
        >
          <span className="section-arrow">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
          <span className="section-label">{title}</span>
          <span className="section-count">{count}</span>
        </div>

        <div className="section-actions">
          {onOpenImport && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenImport(sectionKey);
              }}
              className="section-action-btn"
              title={`Import files or folders into ${title}`}
            >
              <UploadCloud size={12} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrimaryAdd();
            }}
            className="section-action-btn"
            title={
              sectionKey === 'Manuscript'
                ? 'Create New Chapter'
                : `Create New Document in ${title}`
            }
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <aside className="swrite-shell-sidebar">
      {/* Quick Global Action Header */}
      <div className="sidebar-quick-bar">
        <button
          onClick={onNewChapter}
          className="quick-action-btn primary"
          title="Create New Chapter (Manuscript/Chapter XX.md)"
        >
          <FilePlus size={14} />
          <span>New Chapter</span>
        </button>
        {onOpenImport && (
          <button
            onClick={() => onOpenImport('Manuscript')}
            className="quick-action-btn icon-only"
            title="Import Files or Folder"
          >
            <UploadCloud size={14} />
          </button>
        )}
        <button
          onClick={onRefreshFiles}
          className="quick-action-btn icon-only"
          title="Refresh Filesystem View"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* File Tree Sections */}
      <div
        className="sidebar-scroll-tree"
        onContextMenu={(e) => onContextMenu(e, null, 'Manuscript')}
      >
        {/* MANUSCRIPT SECTION */}
        <div className="section-group">
          {renderSectionHeader(
            'MANUSCRIPT',
            'Manuscript',
            filesView?.manuscript_files.length || 0,
            onNewChapter
          )}
          {expandedFolders.has('Manuscript') && (
            <div className="section-content">
              {manuscriptTree.length > 0 ? (
                <FileTree
                  nodes={manuscriptTree}
                  selectedFile={selectedFile}
                  expandedFolders={expandedFolders}
                  onOpenFile={onOpenFile}
                  onToggleFolder={onToggleFolder}
                  onContextMenu={(e, node) => onContextMenu(e, node, 'Manuscript')}
                  onRenameCommit={onRenameCommit}
                  onMoveFile={onMoveFile}
                />
              ) : (
                <div className="empty-section-hint">
                  <span>No manuscript chapters.</span>
                  <button onClick={onNewChapter} className="empty-action-link">
                    + Add Chapter 1
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PLANNING SECTION */}
        <div className="section-group">
          {renderSectionHeader(
            'PLANNING',
            'Planning',
            filesView?.planning_files.length || 0,
            () => onNewDocument('Planning')
          )}
          {expandedFolders.has('Planning') && (
            <div className="section-content">
              {planningTree.length > 0 ? (
                <FileTree
                  nodes={planningTree}
                  selectedFile={selectedFile}
                  expandedFolders={expandedFolders}
                  onOpenFile={onOpenFile}
                  onToggleFolder={onToggleFolder}
                  onContextMenu={(e, node) => onContextMenu(e, node, 'Planning')}
                  onRenameCommit={onRenameCommit}
                  onMoveFile={onMoveFile}
                />
              ) : (
                <div className="empty-section-hint">
                  <span>No planning documents.</span>
                  <button
                    onClick={() => onNewDocument('Planning')}
                    className="empty-action-link"
                  >
                    + Add Outline
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* DESK SECTION */}
        <div className="section-group">
          {renderSectionHeader(
            'DESK',
            'Desk',
            filesView?.desk_files.length || 0,
            () => onNewDocument('Desk')
          )}
          {expandedFolders.has('Desk') && (
            <div className="section-content">
              {deskTree.length > 0 ? (
                <FileTree
                  nodes={deskTree}
                  selectedFile={selectedFile}
                  expandedFolders={expandedFolders}
                  onOpenFile={onOpenFile}
                  onToggleFolder={onToggleFolder}
                  onContextMenu={(e, node) => onContextMenu(e, node, 'Desk')}
                  onRenameCommit={onRenameCommit}
                  onMoveFile={onMoveFile}
                />
              ) : (
                <div className="empty-section-hint">
                  <span>No desk notes.</span>
                  <button
                    onClick={() => onNewDocument('Desk')}
                    className="empty-action-link"
                  >
                    + Add Scratchpad
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ASSETS SECTION */}
        <div className="section-group">
          {renderSectionHeader(
            'ASSETS',
            'Assets',
            filesView?.asset_files.length || 0,
            () => onNewDocument('Assets')
          )}
          {expandedFolders.has('Assets') && assetsTree.length > 0 && (
            <div className="section-content">
              <FileTree
                nodes={assetsTree}
                selectedFile={selectedFile}
                expandedFolders={expandedFolders}
                onOpenFile={onOpenFile}
                onToggleFolder={onToggleFolder}
                onContextMenu={(e, node) => onContextMenu(e, node, 'Assets')}
                onRenameCommit={onRenameCommit}
                onMoveFile={onMoveFile}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <footer className="sidebar-bottom-bar">
        <div className="project-root-indicator" title={project?.root_path}>
          <BookOpen size={13} className="text-muted" />
          <span className="root-name">{project?.name || 'Project'}</span>
        </div>
      </footer>
    </aside>
  );
};
