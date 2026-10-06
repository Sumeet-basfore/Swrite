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

  // Actions
  createProject: (path: string, name: string) => Promise<void>;
  openProject: (path: string) => Promise<void>;
  closeProject: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  openDocument: (relativePath: string) => Promise<void>;
  toggleFolder: (folderPath: string) => void;
  toggleSidebar: () => void;
  createNewDocument: (parentFolder: string, name?: string) => Promise<string>;
  createNewChapter: () => Promise<string>;
  createNewScene: (parentChapterFolder: string) => Promise<string>;
  createNewFolder: (parentFolder: string, name: string) => Promise<void>;
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

export function useProjectState(initialPath = '/tmp/swrite-sample-novel', initialName = 'The Cartographer of Shadows'): UseProjectStateReturn {
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

  const activeProjectRef = useRef<ProjectSummary | null>(null);
  activeProjectRef.current = activeProject;

  const selectedFileRef = useRef<string | null>(null);
  selectedFileRef.current = selectedFile;

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
    collapsed?: boolean
  ) => {
    if (!activeProjectRef.current) return;
    try {
      const state: ProjectUiState = {
        last_opened_document: lastDoc !== undefined ? (lastDoc || undefined) : selectedFileRef.current || undefined,
        expanded_folders: Array.from(folders || expandedFoldersRef.current),
        sidebar_collapsed: collapsed !== undefined ? collapsed : sidebarCollapsedRef.current,
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

      persistUiState(relativePath);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`Failed to open document ${relativePath}: ${msg}`);
    } finally {
      setIsLoading(false);
    }
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

        // Auto-create sample Chapter 01 if empty
        if (view.manuscript_files.length === 0) {
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
      log('Closed project');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`Close project error: ${msg}`);
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
      persistUiState(selectedFileRef.current, next, sidebarCollapsedRef.current);
      return next;
    });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      persistUiState(selectedFileRef.current, expandedFoldersRef.current, next);
      return next;
    });
  };

  const createNewDocument = async (parentFolder: string, name?: string): Promise<string> => {
    const docName = name ? (name.endsWith('.md') ? name : `${name}.md`) : 'Untitled.md';
    let targetPath = `${parentFolder}/${docName}`;

    let counter = 1;
    while (await SwriteIpc.fileExists(targetPath)) {
      counter++;
      targetPath = `${parentFolder}/Untitled ${counter}.md`;
    }

    await SwriteIpc.fileCreate(targetPath, '# \n\n');
    await refreshFiles();
    await openDocument(targetPath);
    log(`Created document: ${targetPath}`);
    return targetPath;
  };

  const createNewChapter = async (): Promise<string> => {
    const num = (filesView?.manuscript_files.length || 0) + 1;
    const padNum = num < 10 ? `0${num}` : `${num}`;
    const targetPath = `Manuscript/Chapter ${padNum}.md`;
    const initialText = `# Chapter ${num}\n\n`;

    await SwriteIpc.fileCreate(targetPath, initialText);
    await refreshFiles();
    await openDocument(targetPath);
    log(`Created chapter: ${targetPath}`);
    return targetPath;
  };

  const createNewScene = async (parentChapterFolder: string): Promise<string> => {
    const targetPath = `${parentChapterFolder}/Scene 01.md`;
    let counter = 1;
    let finalPath = targetPath;
    while (await SwriteIpc.fileExists(finalPath)) {
      counter++;
      const padNum = counter < 10 ? `0${counter}` : `${counter}`;
      finalPath = `${parentChapterFolder}/Scene ${padNum}.md`;
    }

    await SwriteIpc.fileCreate(finalPath, `### Scene ${counter}\n\n`);
    await refreshFiles();
    await openDocument(finalPath);
    log(`Created scene: ${finalPath}`);
    return finalPath;
  };

  const createNewFolder = async (parentFolder: string, name: string) => {
    const targetPath = `${parentFolder}/${name}`;
    await SwriteIpc.fileMkdir(targetPath);
    await refreshFiles();
    setExpandedFolders((prev) => new Set([...prev, parentFolder, targetPath]));
    log(`Created directory: ${targetPath}`);
  };

  const renameFile = async (oldRelative: string, newRelative: string) => {
    await SwriteIpc.fileRename(oldRelative, newRelative);
    if (selectedFileRef.current === oldRelative) {
      setSelectedFile(newRelative);
      persistUiState(newRelative);
    }
    await refreshFiles();
    log(`Renamed: ${oldRelative} -> ${newRelative}`);
  };

  const moveFile = async (sourceRelative: string, targetRelative: string) => {
    await SwriteIpc.fileRename(sourceRelative, targetRelative);
    if (selectedFileRef.current === sourceRelative) {
      setSelectedFile(targetRelative);
      persistUiState(targetRelative);
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
    if (selectedFileRef.current === relative) {
      setSelectedFile(null);
      setFileContent('');
    }
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

    createProject,
    openProject,
    closeProject,
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
    importFile,
    importBatch,
    importFolder,
    searchProject,
    clearSearch,
    openSearchResult,
  };
}
