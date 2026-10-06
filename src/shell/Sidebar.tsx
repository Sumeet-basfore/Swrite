import React, { useMemo } from 'react';
import { ProjectFilesystemView, ProjectSummary } from '../types/ipc';
import { FileTree } from './FileTree';
import { buildProjectTree } from './treeUtils';
import { TreeNode } from './types';
import {
  FolderPlus,
  FilePlus,
  RefreshCw,
  UploadCloud,
  FolderMinus,
  FolderTree,
} from 'lucide-react';

export interface SidebarProps {
  project: ProjectSummary | null;
  filesView: ProjectFilesystemView | null;
  selectedFile: string | null;
  expandedFolders: Set<string>;
  collapsed: boolean;
  onOpenFile: (relativePath: string) => void;
  onToggleFolder: (folderPath: string) => void;
  onCollapseAllFolders?: () => void;
  onRefreshFiles: () => void;
  onNewChapter?: () => void;
  onNewDocument: (parentFolder: string) => void;
  onNewFolder: (parentFolder: string, name?: string) => void;
  onContextMenu: (e: React.MouseEvent, node: TreeNode | null, section: string | null) => void;
  onRenameCommit: (oldRelative: string, newRelative: string) => Promise<void>;
  onMoveFile: (sourceRelative: string, targetRelative: string) => Promise<void>;
  onOpenImport?: (sectionOrFolder?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  project,
  filesView,
  selectedFile,
  expandedFolders,
  collapsed,
  onOpenFile,
  onToggleFolder,
  onCollapseAllFolders,
  onRefreshFiles,
  onNewDocument,
  onNewFolder,
  onContextMenu,
  onRenameCommit,
  onMoveFile,
  onOpenImport,
}) => {
  if (collapsed) return null;

  // Gather all project files from view into a single flat array
  const allDiscoveredFiles = useMemo(() => {
    if (!filesView) return [];
    const combined = [
      ...filesView.manuscript_files,
      ...filesView.planning_files,
      ...filesView.desk_files,
      ...filesView.asset_files,
      ...(filesView.other_visible_files || []),
    ];
    // Deduplicate by relative_path
    const unique = new Map<string, typeof combined[0]>();
    for (const file of combined) {
      unique.set(file.relative_path, file);
    }
    return Array.from(unique.values());
  }, [filesView]);

  // Construct canonical single unified filesystem tree
  const projectTree = useMemo(() => {
    return buildProjectTree(allDiscoveredFiles);
  }, [allDiscoveredFiles]);

  // Determine current parent folder if a node is selected
  const activeParentFolder = useMemo(() => {
    if (!selectedFile) return '';
    const parts = selectedFile.split('/');
    if (parts.length <= 1) return '';
    return parts.slice(0, -1).join('/');
  }, [selectedFile]);

  return (
    <aside className="swrite-shell-sidebar" aria-label="Project Explorer">
      {/* Explorer Top Toolbar */}
      <div className="sidebar-quick-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <FolderTree size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={project?.name || 'Explorer'}
          >
            {project?.name || 'Explorer'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            onClick={() => onNewDocument(activeParentFolder)}
            className="section-action-btn"
            title="New File in Current / Root Folder"
            aria-label="New File"
          >
            <FilePlus size={14} />
          </button>
          <button
            onClick={() => onNewFolder(activeParentFolder)}
            className="section-action-btn"
            title="New Folder in Current / Root Folder"
            aria-label="New Folder"
          >
            <FolderPlus size={14} />
          </button>
          {onOpenImport && (
            <button
              onClick={() => onOpenImport(activeParentFolder || undefined)}
              className="section-action-btn"
              title="Import Files or Folder"
              aria-label="Import"
            >
              <UploadCloud size={14} />
            </button>
          )}
          {onCollapseAllFolders && (
            <button
              onClick={onCollapseAllFolders}
              className="section-action-btn"
              title="Collapse All Folders"
              aria-label="Collapse All"
            >
              <FolderMinus size={14} />
            </button>
          )}
          <button
            onClick={onRefreshFiles}
            className="section-action-btn"
            title="Refresh Files"
            aria-label="Refresh"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Pure Unified Filesystem Tree */}
      <div
        className="sidebar-scroll-tree"
        onContextMenu={(e) => onContextMenu(e, null, null)}
        style={{ flex: 1, overflowY: 'auto' }}
      >
        {projectTree.length > 0 ? (
          <FileTree
            nodes={projectTree}
            selectedFile={selectedFile}
            expandedFolders={expandedFolders}
            onOpenFile={onOpenFile}
            onToggleFolder={onToggleFolder}
            onContextMenu={(e, node) => onContextMenu(e, node, node.section || null)}
            onRenameCommit={onRenameCommit}
            onMoveFile={onMoveFile}
            depth={0}
          />
        ) : (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <p>No documents yet.</p>
            <button
              onClick={() => onNewDocument('')}
              className="dialog-btn primary"
              style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: 8 }}
            >
              + Create Document
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
