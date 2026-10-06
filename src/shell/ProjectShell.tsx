import React, { useState, useEffect } from 'react';
import { useProjectState } from './useProjectState';
import { ShellHeader } from './ShellHeader';
import { Sidebar } from './Sidebar';
import { FileContextMenu } from './FileContextMenu';
import { SearchModal } from './SearchModal';
import { RecentFilesMenu } from './RecentFilesMenu';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { NewDocumentDialog } from './NewDocumentDialog';
import { EditorCanvas } from '../editor';
import { PlanningStudio } from '../planning';
import { DeskStudio, SplitDeskContainer } from '../desk';
import { EditStudio } from '../edit';
import { PublishStudio } from '../publish';
import { usePlugins, PluginDrawer } from '../plugins';
import { ContextMenuState, TreeNode } from './types';
import { SwriteIpc } from '../lib/ipc';
import './shell.css';

export const ProjectShell: React.FC = () => {
  const {
    activeProject,
    filesView,
    selectedFile,
    fileContent,
    isLoading,
    expandedFolders,
    sidebarCollapsed,
    recentDocuments,
    searchResult,
    isSearching,
    logs,
    refreshFiles,
    openDocument,
    toggleFolder,
    toggleSidebar,
    createNewDocument,
    createNewChapter,
    createNewScene,
    createNewFolder,
    renameFile,
    moveFile,
    duplicateFile,
    deleteFileSafe,
    searchProject,
    openSearchResult,
  } = useProjectState();

  const [studioMode, setStudioMode] = useState<'write' | 'plan' | 'desk' | 'edit' | 'publish'>('write');
  const [splitDocument, setSplitDocument] = useState<{ path: string; content: string } | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [showDevDrawer, setShowDevDrawer] = useState(false);
  const [showPluginsDrawer, setShowPluginsDrawer] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [recentsMenuOpen, setRecentsMenuOpen] = useState(false);

  const {
    plugins,
    loading: pluginsLoading,
    refreshPlugins,
    togglePlugin,
  } = usePlugins({
    projectRoot: activeProject?.root_path || '',
  });
  const [deleteModalState, setDeleteModalState] = useState<{ open: boolean; targetPath: string | null }>({
    open: false,
    targetPath: null,
  });
  const [newDialogState, setNewDialogState] = useState<{
    open: boolean;
    type: 'document' | 'folder';
    parentFolder: string;
  }>({
    open: false,
    type: 'document',
    parentFolder: 'Manuscript',
  });

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    open: false,
    x: 0,
    y: 0,
    targetNode: null,
    targetSection: null,
  });

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Mod+1: Write Studio
      if (isMod && !e.shiftKey && key === '1') {
        e.preventDefault();
        setStudioMode('write');
        return;
      }

      // Mod+2: Planning Studio
      if (isMod && !e.shiftKey && key === '2') {
        e.preventDefault();
        setStudioMode('plan');
        return;
      }

      // Mod+3: Creative Desk
      if (isMod && !e.shiftKey && key === '3') {
        e.preventDefault();
        setStudioMode('desk');
        return;
      }

      // Mod+4: Edit Studio
      if (isMod && !e.shiftKey && key === '4') {
        e.preventDefault();
        setStudioMode('edit');
        return;
      }

      // Mod+5: Publish Studio
      if (isMod && !e.shiftKey && key === '5') {
        e.preventDefault();
        setStudioMode('publish');
        return;
      }

      // Mod+P or Mod+Shift+O: Open Search
      if ((isMod && key === 'p') || (isMod && e.shiftKey && key === 'o')) {
        e.preventDefault();
        setSearchModalOpen(true);
        return;
      }

      // Mod+B: Toggle Sidebar
      if (isMod && !e.shiftKey && key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Mod+Shift+F: Toggle Focus Mode
      if (isMod && e.shiftKey && key === 'f') {
        e.preventDefault();
        setFocusMode((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const handleOpenSplitDocument = async (targetPath: string) => {
    try {
      let content = '';
      if (!targetPath.endsWith('board.json') && !targetPath.includes('/Moodboards/')) {
        content = await SwriteIpc.fileRead(targetPath);
      }
      setSplitDocument({ path: targetPath, content });
      setStudioMode('write');
    } catch (e) {
      console.error('Failed to open split document:', e);
    }
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    node: TreeNode | null,
    section: string | null
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      targetNode: node,
      targetSection: section,
    });
  };

  return (
    <div className={`swrite-app-shell ${focusMode ? 'in-focus-mode' : ''}`}>
      {/* Top Header */}
      <ShellHeader
        project={activeProject}
        activePath={selectedFile}
        sidebarCollapsed={sidebarCollapsed}
        focusMode={focusMode}
        studioMode={studioMode}
        onChangeStudioMode={setStudioMode}
        isSplitOpen={splitDocument !== null}
        onToggleSplit={() => {
          if (splitDocument) {
            setSplitDocument(null);
          } else {
            // Open first desk note or moodboard if available
            const firstDesk = filesView?.desk_files?.find((f) => !f.is_directory);
            if (firstDesk) {
              handleOpenSplitDocument(firstDesk.relative_path);
            }
          }
        }}
        onToggleSidebar={toggleSidebar}
        onOpenSearch={() => setSearchModalOpen(true)}
        onToggleRecents={() => setRecentsMenuOpen((prev) => !prev)}
        onToggleFocusMode={() => setFocusMode((prev) => !prev)}
        onToggleDevDrawer={() => setShowDevDrawer((prev) => !prev)}
        showDevDrawer={showDevDrawer}
        onTogglePlugins={() => setShowPluginsDrawer((prev) => !prev)}
        showPluginsDrawer={showPluginsDrawer}
      />

      <div className="swrite-shell-body">
        {/* Navigation Sidebar */}
        {!focusMode && (
          <Sidebar
            project={activeProject}
            filesView={filesView}
            selectedFile={selectedFile}
            expandedFolders={expandedFolders}
            collapsed={sidebarCollapsed}
            onOpenFile={(path) => {
              setStudioMode('write');
              openDocument(path);
            }}
            onToggleFolder={toggleFolder}
            onRefreshFiles={refreshFiles}
            onNewChapter={createNewChapter}
            onNewDocument={(parent) =>
              setNewDialogState({ open: true, type: 'document', parentFolder: parent })
            }
            onNewFolder={(parent) =>
              setNewDialogState({ open: true, type: 'folder', parentFolder: parent })
            }
            onContextMenu={handleContextMenu}
            onRenameCommit={renameFile}
            onMoveFile={moveFile}
          />
        )}

        {/* Main Document Workspace / Planning Studio / Creative Desk */}
        <main className="swrite-shell-canvas-area">
          {studioMode === 'plan' ? (
            <PlanningStudio
              manuscriptFiles={filesView?.manuscript_files || []}
              planningFiles={filesView?.planning_files || []}
              onOpenFile={(path) => {
                setStudioMode('write');
                openDocument(path);
              }}
              onRefreshFiles={refreshFiles}
            />
          ) : studioMode === 'desk' ? (
            <DeskStudio
              deskFiles={filesView?.desk_files || []}
              assetFiles={filesView?.asset_files || []}
              onOpenFile={(path) => {
                setStudioMode('write');
                openDocument(path);
              }}
              onOpenSplitFile={handleOpenSplitDocument}
              onRefreshFiles={refreshFiles}
            />
          ) : studioMode === 'edit' ? (
            <EditStudio
              currentDocumentPath={selectedFile}
              manuscriptFiles={filesView?.manuscript_files || []}
              onNavigateToDocument={(path, _startOffset, _endOffset) => {
                setStudioMode('write');
                openDocument(path);
              }}
              onSelectDocument={(path) => {
                openDocument(path);
              }}
            />
          ) : studioMode === 'publish' ? (
            <PublishStudio
              projectRoot={activeProject?.root_path || ''}
              projectName={activeProject?.name || 'Manuscript'}
              onNavigateToDocument={(path) => {
                setStudioMode('write');
                openDocument(path);
              }}
            />
          ) : splitDocument && selectedFile ? (
            <SplitDeskContainer
              primaryDocumentPath={selectedFile}
              primaryFileContent={fileContent}
              secondaryDocumentPath={splitDocument.path}
              secondaryFileContent={splitDocument.content}
              projectAssets={filesView?.asset_files || []}
              onCloseSplit={() => setSplitDocument(null)}
              onOpenDocument={openDocument}
              onRefreshFiles={refreshFiles}
            />
          ) : selectedFile && !isLoading ? (
            <EditorCanvas
              key={selectedFile}
              documentId={selectedFile}
              relativePath={selectedFile}
              initialContent={fileContent}
            />
          ) : (
            <div className="canvas-empty-state">
              <div className="empty-message-box">
                <h2>{activeProject?.name || 'Swrite Studio'}</h2>
                <p>Select a document from the sidebar to begin writing, or create a new chapter.</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
                  <button onClick={createNewChapter} className="empty-create-btn">
                    + Create First Chapter
                  </button>
                  <button onClick={() => setStudioMode('plan')} className="empty-create-btn" style={{ background: 'var(--bg-desk)', color: 'var(--text-ink)', border: '1px solid var(--border-quiet)' }}>
                    Planning Studio
                  </button>
                  <button onClick={() => setStudioMode('desk')} className="empty-create-btn" style={{ background: 'var(--bg-desk)', color: 'var(--text-ink)', border: '1px solid var(--border-quiet)' }}>
                    Creative Desk
                  </button>
                  <button onClick={() => setStudioMode('edit')} className="empty-create-btn" style={{ background: 'var(--bg-desk)', color: 'var(--text-ink)', border: '1px solid var(--border-quiet)' }}>
                    Edit Studio
                  </button>
                  <button onClick={() => setStudioMode('publish')} className="empty-create-btn" style={{ background: 'var(--bg-desk)', color: 'var(--text-ink)', border: '1px solid var(--border-quiet)' }}>
                    Publish Studio
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Context Menu */}
      {contextMenu.open && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.targetNode}
          section={contextMenu.targetSection}
          onClose={() => setContextMenu((c) => ({ ...c, open: false }))}
          onOpen={openDocument}
          onNewDocument={(parent) =>
            setNewDialogState({ open: true, type: 'document', parentFolder: parent })
          }
          onNewFolder={(parent) =>
            setNewDialogState({ open: true, type: 'folder', parentFolder: parent })
          }
          onNewChapter={createNewChapter}
          onNewScene={createNewScene}
          onRename={() => {
            // Inline rename triggered in tree
          }}
          onDuplicate={duplicateFile}
          onDeleteSafe={(path) =>
            setDeleteModalState({ open: true, targetPath: path })
          }
        />
      )}

      {/* Global Search Omnisearch Modal */}
      <SearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSearch={searchProject}
        searchResult={searchResult}
        isSearching={isSearching}
        onSelectMatch={openSearchResult}
      />

      {/* Recent Files Menu */}
      <RecentFilesMenu
        open={recentsMenuOpen}
        recents={recentDocuments}
        onClose={() => setRecentsMenuOpen(false)}
        onOpen={openDocument}
      />

      {/* Safe Delete Modal */}
      <DeleteConfirmModal
        open={deleteModalState.open}
        targetPath={deleteModalState.targetPath}
        onConfirm={async () => {
          if (deleteModalState.targetPath) {
            await deleteFileSafe(deleteModalState.targetPath);
          }
          setDeleteModalState({ open: false, targetPath: null });
        }}
        onCancel={() => setDeleteModalState({ open: false, targetPath: null })}
      />

      {/* New Document / Folder Dialog */}
      <NewDocumentDialog
        open={newDialogState.open}
        type={newDialogState.type}
        parentFolder={newDialogState.parentFolder}
        onConfirm={async (name) => {
          if (newDialogState.type === 'document') {
            await createNewDocument(newDialogState.parentFolder, name);
          } else {
            await createNewFolder(newDialogState.parentFolder, name);
          }
          setNewDialogState((s) => ({ ...s, open: false }));
        }}
        onCancel={() => setNewDialogState((s) => ({ ...s, open: false }))}
      />

      {/* Core IPC Inspector Drawer */}
      {showDevDrawer && (
        <div className="shell-dev-drawer">
          <div className="dev-drawer-header">
            <span>Swrite 2 Native IPC Inspector</span>
            <button onClick={() => setShowDevDrawer(false)}>Close</button>
          </div>
          <div className="dev-drawer-body">
            {logs.map((entry, idx) => (
              <div key={idx} className="dev-log-line">
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Local Extensions & Plugins Drawer */}
      {showPluginsDrawer && (
        <div className="revision-modal-overlay" onClick={() => setShowPluginsDrawer(false)}>
          <div className="preflight-modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <PluginDrawer
              plugins={plugins}
              loading={pluginsLoading}
              onTogglePlugin={togglePlugin}
              onRefresh={refreshPlugins}
              onClose={() => setShowPluginsDrawer(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
