import { useState, useEffect, useCallback, useRef } from 'react';
import { SwriteIpc } from '../lib/ipc';
import {
  ProjectSummary,
  ProjectFilesystemView,
  ProjectUiState,
  RecentDocumentEntry,
  SearchResult,
  ImportSummary,
} from '../types/ipc';
import { DocumentTab } from './types';

export interface UseProjectStateReturn {
  activeProject: ProjectSummary | null;
  filesView: ProjectFilesystemView | null;
  selectedFile: string | null;
  fileContent: string;
  isLoading: boolean;
  expandedFolders: Set<string>;
  sidebarCollapsed: boolean;
  recentDocuments: RecentDocumentEntry[];
  searchResult: SearchResult | null;
  isSearching: boolean;
  highlightQuery: string | null;
  logs: string[];

  // Document Tabs
  openTabs: DocumentTab[];
  activeTabId: string | null;
  closeTab: (tabId: string) => Promise<void>;
  closeOtherTabs: (tabId: string) => Promise<void>;
  closeAllTabs: () => Promise<void>;
  reorderTabs: (sourceIndex: number, targetIndex: number) => void;
  markTabDirty: (relativePath: string, isDirty: boolean) => void;

  // Actions
  createProject: (path: string, name: string) => Promise<void>;
  openProject: (path: string) => Promise<void>;
  closeProject: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  openDocument: (relativePath: string) => Promise<void>;
  toggleFolder: (folderPath: string) => void;
  collapseAllFolders: () => void;
  toggleSidebar: () => void;
  createNewDocument: (parentFolder: string, name?: string) => Promise<string>;
  createNewChapter: () => Promise<string>;
  createNewScene: (parentChapterFolder: string) => Promise<string>;
  createNewFolder: (parentFolder: string, name?: string) => Promise<void>;
  renameFile: (oldRelative: string, newRelative: string) => Promise<void>;
  moveFile: (sourceRelative: string, targetRelative: string) => Promise<void>;
  duplicateFile: (relative: string) => Promise<string>;
  deleteFileSafe: (relative: string) => Promise<void>;
  importFile: (sourceAbsPath: string, targetRelative: string) => Promise<string>;
  importBatch: (
    sourceAbsolutePaths: string[],
    targetSection: string,
    conflictStrategy?: 'rename' | 'skip' | 'overwrite'
  ) => Promise<ImportSummary>;
  importFolder: (
    sourceFolderAbsolutePath: string,
    targetSection: string,
    conflictStrategy?: 'rename' | 'skip' | 'overwrite'
  ) => Promise<ImportSummary>;
  searchProject: (query: string) => Promise<void>;
  clearSearch: () => void;
  openSearchResult: (relativePath: string, query: string) => Promise<void>;
}

function detectFileFormat(path: string): 'markdown' | 'txt' | 'docx' | 'binary' {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'md' || ext === 'markdown') return 'markdown';
  if (ext === 'docx') return 'docx';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) return 'binary';
  return 'txt';
}

function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

export function useProjectState(
  initialPath = '/tmp/swrite-sample-novel',
  initialName = 'The Cartographer of Shadows'
): UseProjectStateReturn {
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(null);
  const [filesView, setFilesView] = useState<ProjectFilesystemView | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['Manuscript']));
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocumentEntry[]>([]);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [highlightQuery, setHighlightQuery] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Document Tabs State
  const [openTabs, setOpenTabs] = useState<DocumentTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const activeProjectRef = useRef<ProjectSummary | null>(null);
  activeProjectRef.current = activeProject;

  const selectedFileRef = useRef<string | null>(null);
  selectedFileRef.current = selectedFile;

  const openTabsRef = useRef<DocumentTab[]>(openTabs);
  openTabsRef.current = openTabs;

  const activeTabIdRef = useRef<string | null>(activeTabId);
  activeTabIdRef.current = activeTabId;

  const expandedFoldersRef = useRef<Set<string>>(expandedFolders);
  expandedFoldersRef.current = expandedFolders;

  const sidebarCollapsedRef = useRef<boolean>(sidebarCollapsed);
  sidebarCollapsedRef.current = sidebarCollapsed;

  const log = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const persistUiState = useCallback(async (
    lastDoc?: string | null,
    folders?: Set<string>,
    collapsed?: boolean,
    tabs?: DocumentTab[],
    currentTabId?: string | null
  ) => {
    if (!activeProjectRef.current) return;
    try {
      const state: ProjectUiState = {
        last_opened_document: lastDoc !== undefined ? (lastDoc || undefined) : selectedFileRef.current || undefined,
        expanded_folders: Array.from(folders || expandedFoldersRef.current),
        sidebar_collapsed: collapsed !== undefined ? collapsed : sidebarCollapsedRef.current,
        open_tabs: (tabs || openTabsRef.current).map((t) => t.relativePath),
        active_tab_id: currentTabId !== undefined ? (currentTabId || undefined) : (activeTabIdRef.current || undefined),
      };
      await SwriteIpc.projectSetUiState(state);
    } catch {
      // Non-blocking UI state persistence
    }
  }, []);

  const refreshFiles = useCallback(async () => {
    try {
      const view = await SwriteIpc.projectDiscover();
      setFilesView(view);
      const recents = await SwriteIpc.projectGetRecents().catch(() => []);
      setRecentDocuments(recents);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`Discover error: ${msg}`);
    }
  }, []);

  const markTabDirty = useCallback((relativePath: string, isDirty: boolean) => {
    setOpenTabs((prev) =>
      prev.map((tab) =>
        tab.relativePath === relativePath || tab.id === relativePath
          ? { ...tab, isDirty }
          : tab
      )
    );
  }, []);

  const openDocument = useCallback(async (relativePath: string) => {
    if (!relativePath) return;
    try {
      setIsLoading(true);
      const content = await SwriteIpc.fileRead(relativePath);
      setSelectedFile(relativePath);
      setFileContent(content);
      log(`Opened: ${relativePath} (${content.length} chars)`);

      // Record in recent documents
      await SwriteIpc.projectAddRecent(relativePath, relativePath).catch(() => {});
      const recents = await SwriteIpc.projectGetRecents().catch(() => []);
      setRecentDocuments(recents);

      // Manage Document Tabs
      setOpenTabs((prev) => {
        const existingIndex = prev.findIndex(
          (t) => t.relativePath === relativePath || t.id === relativePath
        );
        let updated: DocumentTab[];
        if (existingIndex >= 0) {
          // Already in tabs
          updated = prev;
        } else {
          // Add new tab
          const newTab: DocumentTab = {
            id: relativePath,
            relativePath,
            title: getFileName(relativePath),
            format: detectFileFormat(relativePath),
            isDirty: false,
          };
          updated = [...prev, newTab];
        }
        setActiveTabId(relativePath);
        persistUiState(relativePath, undefined, undefined, updated, relativePath);
        return updated;
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`Failed to open document ${relativePath}: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [persistUiState]);

  const closeTab = useCallback(async (tabId: string) => {
    setOpenTabs((prev) => {
      const tabIndex = prev.findIndex((t) => t.id === tabId || t.relativePath === tabId);
      if (tabIndex < 0) return prev;

      const updated = prev.filter((_, idx) => idx !== tabIndex);
      const isActive = activeTabIdRef.current === tabId || selectedFileRef.current === tabId;

      if (isActive) {
        if (updated.length > 0) {
          // Activate adjacent tab (previous or current index)
          const nextIndex = Math.min(tabIndex, updated.length - 1);
          const nextTab = updated[nextIndex];
          setActiveTabId(nextTab.id);
          // Asynchronously load next tab content
          openDocument(nextTab.relativePath);
        } else {
          setActiveTabId(null);
          setSelectedFile(null);
          setFileContent('');
          persistUiState(null, undefined, undefined, [], null);
        }
      } else {
        persistUiState(undefined, undefined, undefined, updated, undefined);
      }
      return updated;
    });
  }, [openDocument, persistUiState]);

  const closeOtherTabs = useCallback(async (tabId: string) => {
    setOpenTabs((prev) => {
      const kept = prev.filter((t) => t.id === tabId || t.relativePath === tabId);
      if (kept.length > 0) {
        setActiveTabId(kept[0].id);
        openDocument(kept[0].relativePath);
      }
      persistUiState(undefined, undefined, undefined, kept, kept[0]?.id || null);
      return kept;
    });
  }, [openDocument, persistUiState]);

  const closeAllTabs = useCallback(async () => {
    setOpenTabs([]);
    setActiveTabId(null);
    setSelectedFile(null);
    setFileContent('');
    persistUiState(null, undefined, undefined, [], null);
  }, [persistUiState]);

  const reorderTabs = useCallback((sourceIndex: number, targetIndex: number) => {
    setOpenTabs((prev) => {
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex >= prev.length || targetIndex >= prev.length) {
        return prev;
      }
      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      persistUiState(undefined, undefined, undefined, updated, undefined);
      return updated;
    });
  }, [persistUiState]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        setIsLoading(true);
        let summary: ProjectSummary;
        try {
          summary = await SwriteIpc.projectCreate(initialPath, initialName);
          log(`Created project: ${summary.name}`);
        } catch {
          summary = await SwriteIpc.projectOpen(initialPath);
          log(`Opened project: ${summary.name}`);
        }

        if (!isMounted) return;
        setActiveProject(summary);

        // Start Watcher
        await SwriteIpc.watchStart().catch(() => {});

        // Discover Files
        const view = await SwriteIpc.projectDiscover();
        if (!isMounted) return;
        setFilesView(view);

        // Load UI State
        const uiState: ProjectUiState = await SwriteIpc.projectGetUiState().catch(() => ({
          expanded_folders: ['Manuscript'],
          sidebar_collapsed: false,
        }));

        if (!isMounted) return;

        if (uiState.expanded_folders) {
          setExpandedFolders(new Set(uiState.expanded_folders));
        }
        if (uiState.sidebar_collapsed !== undefined) {
          setSidebarCollapsed(uiState.sidebar_collapsed);
        }

        // Restore Open Tabs if present
        if (uiState.open_tabs && uiState.open_tabs.length > 0) {
          const restoredTabs: DocumentTab[] = uiState.open_tabs.map((path) => ({
            id: path,
            relativePath: path,
            title: getFileName(path),
            format: detectFileFormat(path),
            isDirty: false,
          }));
          setOpenTabs(restoredTabs);
          const target = uiState.active_tab_id || uiState.last_opened_document || uiState.open_tabs[0];
          await openDocument(target);
        } else if (view.manuscript_files.length === 0) {
          // Auto-create sample Chapter 01 if completely empty
          const sampleText = `# Chapter 1: The Cartographer's Journal\n\nThe lantern flickered in the drafty archives of Oakhaven.\n`;
          await SwriteIpc.fileCreate('Manuscript/Chapter 01.md', sampleText);
          const updatedView = await SwriteIpc.projectDiscover();
          if (isMounted) setFilesView(updatedView);
          await openDocument('Manuscript/Chapter 01.md');
        } else {
          const targetToOpen = uiState.last_opened_document || view.manuscript_files[0].relative_path;
          await openDocument(targetToOpen);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        log(`Initialization error: ${msg}`);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [initialPath, initialName, openDocument]);

  const createProject = async (path: string, name: string) => {
    try {
      setIsLoading(true);
      const summary = await SwriteIpc.projectCreate(path, name);
      setActiveProject(summary);
      await refreshFiles();
      log(`Created project "${name}" at ${path}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`Create project error: ${msg}`);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const openProject = async (path: string) => {
    try {
      setIsLoading(true);
      const summary = await SwriteIpc.projectOpen(path);
      setActiveProject(summary);
      await refreshFiles();
      log(`Opened project "${summary.name}"`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`Open project error: ${msg}`);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const closeProject = async () => {
    try {
      await SwriteIpc.projectClose();
      setActiveProject(null);
      setFilesView(null);
      setSelectedFile(null);
      setFileContent('');
      setOpenTabs([]);
      setActiveTabId(null);
      log('Closed project');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`Close project error: ${msg}`);
      throw e;
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      persistUiState(undefined, next);
      return next;
    });
  };

  const collapseAllFolders = () => {
    setExpandedFolders(new Set());
    persistUiState(undefined, new Set());
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      persistUiState(undefined, undefined, next);
      return next;
    });
  };

  const createNewDocument = async (parentFolder: string, name?: string): Promise<string> => {
    const docName = name || `Document ${new Date().toLocaleTimeString().replace(/:/g, '-')}.md`;
    const cleanDocName = docName.endsWith('.md') || docName.endsWith('.txt') || docName.endsWith('.docx')
      ? docName
      : `${docName}.md`;
    const targetRelative = parentFolder ? `${parentFolder}/${cleanDocName}` : cleanDocName;

    const newPath = await SwriteIpc.fileCreate(targetRelative, `# ${cleanDocName.replace(/\.[^/.]+$/, '')}\n\n`);
    await refreshFiles();
    if (parentFolder) {
      setExpandedFolders((prev) => new Set([...prev, parentFolder]));
    }
    await openDocument(newPath);
    log(`Created document: ${newPath}`);
    return newPath;
  };

  const createNewChapter = async (): Promise<string> => {
    const count = filesView?.manuscript_files.filter((f) => !f.is_directory).length || 0;
    const pad = String(count + 1).padStart(2, '0');
    const relative = `Manuscript/Chapter ${pad}.md`;
    const initialMarkdown = `# Chapter ${count + 1}\n\nBegin writing here...\n`;

    const newPath = await SwriteIpc.fileCreate(relative, initialMarkdown);
    await refreshFiles();
    setExpandedFolders((prev) => new Set([...prev, 'Manuscript']));
    await openDocument(newPath);
    log(`Created chapter: ${newPath}`);
    return newPath;
  };

  const createNewScene = async (parentChapterFolder: string): Promise<string> => {
    const relative = `${parentChapterFolder}/Scene ${Date.now().toString().slice(-4)}.md`;
    const newPath = await SwriteIpc.fileCreate(relative, `### New Scene\n\n`);
    await refreshFiles();
    setExpandedFolders((prev) => new Set([...prev, parentChapterFolder]));
    await openDocument(newPath);
    log(`Created scene: ${newPath}`);
    return newPath;
  };

  const createNewFolder = async (parentFolder: string, name?: string) => {
    const folderName = name || `Folder ${new Date().toLocaleTimeString().replace(/:/g, '-')}`;
    const targetRelative = parentFolder ? `${parentFolder}/${folderName}` : folderName;
    const createFolderFunc = SwriteIpc.folderCreate || SwriteIpc.fileMkdir;
    await createFolderFunc(targetRelative);
    await refreshFiles();
    setExpandedFolders((prev) => new Set([...prev, parentFolder ? parentFolder : targetRelative, targetRelative]));
    log(`Created folder: ${targetRelative}`);
  };

  const renameFile = async (oldRelative: string, newRelative: string) => {
    await SwriteIpc.fileRename(oldRelative, newRelative);

    // Update matching tabs
    setOpenTabs((prev) =>
      prev.map((t) => {
        if (t.relativePath === oldRelative || t.id === oldRelative) {
          return {
            ...t,
            id: newRelative,
            relativePath: newRelative,
            title: getFileName(newRelative),
            format: detectFileFormat(newRelative),
          };
        }
        if (t.relativePath.startsWith(oldRelative + '/')) {
          const updatedSub = t.relativePath.replace(oldRelative, newRelative);
          return {
            ...t,
            id: updatedSub,
            relativePath: updatedSub,
            title: getFileName(updatedSub),
          };
        }
        return t;
      })
    );

    if (selectedFileRef.current === oldRelative) {
      setSelectedFile(newRelative);
      setActiveTabId(newRelative);
    }
    await refreshFiles();
    log(`Renamed: ${oldRelative} -> ${newRelative}`);
  };

  const moveFile = async (sourceRelative: string, targetRelative: string) => {
    await SwriteIpc.fileRename(sourceRelative, targetRelative);

    // Update matching tabs
    setOpenTabs((prev) =>
      prev.map((t) => {
        if (t.relativePath === sourceRelative || t.id === sourceRelative) {
          return {
            ...t,
            id: targetRelative,
            relativePath: targetRelative,
            title: getFileName(targetRelative),
            format: detectFileFormat(targetRelative),
          };
        }
        return t;
      })
    );

    if (selectedFileRef.current === sourceRelative) {
      setSelectedFile(targetRelative);
      setActiveTabId(targetRelative);
    }
    await refreshFiles();
    log(`Moved: ${sourceRelative} -> ${targetRelative}`);
  };

  const duplicateFile = async (relative: string): Promise<string> => {
    const newRelative = await SwriteIpc.fileDuplicate(relative);
    await refreshFiles();
    await openDocument(newRelative);
    log(`Duplicated: ${relative} -> ${newRelative}`);
    return newRelative;
  };

  const deleteFileSafe = async (relative: string) => {
    await SwriteIpc.fileDeleteSafe(relative);

    // Close any tabs belonging to deleted file or directory
    setOpenTabs((prev) => {
      const updated = prev.filter(
        (t) => t.relativePath !== relative && !t.relativePath.startsWith(relative + '/')
      );
      if (selectedFileRef.current === relative || selectedFileRef.current?.startsWith(relative + '/')) {
        if (updated.length > 0) {
          const next = updated[0];
          setActiveTabId(next.id);
          openDocument(next.relativePath);
        } else {
          setSelectedFile(null);
          setActiveTabId(null);
          setFileContent('');
        }
      }
      return updated;
    });

    await refreshFiles();
    log(`Moved to trash: ${relative}`);
  };

  const importFile = async (sourceAbsPath: string, targetRelative: string): Promise<string> => {
    const newPath = await SwriteIpc.fileImport(sourceAbsPath, targetRelative);
    await refreshFiles();
    await openDocument(newPath);
    log(`Imported file: ${newPath}`);
    return newPath;
  };

  const importBatch = async (
    sourceAbsolutePaths: string[],
    targetSection: string,
    conflictStrategy: 'rename' | 'skip' | 'overwrite' = 'rename'
  ): Promise<ImportSummary> => {
    const summary = await SwriteIpc.fileImportBatch(sourceAbsolutePaths, targetSection, conflictStrategy);
    await refreshFiles();
    log(`Imported batch: ${summary.imported_files.length} files (${summary.total_found} scanned) into ${targetSection}`);
    return summary;
  };

  const importFolder = async (
    sourceFolderAbsolutePath: string,
    targetSection: string,
    conflictStrategy: 'rename' | 'skip' | 'overwrite' = 'rename'
  ): Promise<ImportSummary> => {
    const summary = await SwriteIpc.folderImportRecursive(sourceFolderAbsolutePath, targetSection, conflictStrategy);
    await refreshFiles();
    log(`Imported folder: ${summary.imported_files.length} files into ${targetSection}`);
    return summary;
  };

  const searchProject = async (query: string) => {
    if (!query.trim()) {
      setSearchResult(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await SwriteIpc.searchQuery(query);
      setSearchResult(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`Search error: ${msg}`);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResult(null);
    setHighlightQuery(null);
  };

  const openSearchResult = async (relativePath: string, query: string) => {
    setHighlightQuery(query);
    await openDocument(relativePath);
  };

  return {
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
    highlightQuery,
    logs,

    openTabs,
    activeTabId,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    reorderTabs,
    markTabDirty,

    createProject,
    openProject,
    closeProject,
    refreshFiles,
    openDocument,
    toggleFolder,
    collapseAllFolders,
    toggleSidebar,
    createNewDocument,
    createNewChapter,
    createNewScene,
    createNewFolder,
    renameFile,
    moveFile,
    duplicateFile,
    deleteFileSafe,
    importFile,
    importBatch,
    importFolder,
    searchProject,
    clearSearch,
    openSearchResult,
  };
}
