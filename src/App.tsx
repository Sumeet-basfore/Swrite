import { useState, useEffect } from 'react';
import { SwriteIpc } from './lib/ipc';
import { ProjectSummary, ProjectFilesystemView, DiscoveredFile } from './types/ipc';
import { EditorCanvas } from './editor';
import {
  Folder,
  FileText,
  BookOpen,
  Plus,
  RefreshCw,
  Sliders,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import './editor/canvas/editor.css';

export function App() {
  const [projectPath] = useState<string>('/tmp/swrite-sample-novel');
  const [projectName] = useState<string>('The Cartographer of Shadows');
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(null);
  const [filesView, setFilesView] = useState<ProjectFilesystemView | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [showCoreHarness, setShowCoreHarness] = useState<boolean>(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Create initial project on mount if not active
  useEffect(() => {
    handleCreateOrOpenProject();
  }, []);

  const handleCreateOrOpenProject = async () => {
    try {
      const summary = await SwriteIpc.projectCreate(projectPath, projectName);
      setActiveProject(summary);
      addLog(`Created/Loaded project "${summary.name}"`);
      await refreshFiles();

      // If manuscript is empty, create a starter Chapter 01
      const view = await SwriteIpc.projectDiscover();
      setFilesView(view);

      if (view.manuscript_files.length === 0) {
        const defaultSample = `# Chapter 1: The Silver Key

The morning mist clung to the cobblestones of Oakhaven like a forgotten memory.

Julian pulled his woolen coat tighter around his shoulders, feeling the weight of the brass astrolabe tucked in his inner pocket. He had spent fifteen years tracking the cartographer's lost journals across three continents, and now, standing before the arched iron gates of the observatory, the silence was almost deafening.

* * *

He hesitated at the iron door. Behind him, the bell tower struck four.

> "To seek the stars is to forfeit the safety of the earth."
> — Master Eric, *The Astronomy of Ruin*

He produced the silver key, turned it once to the left, and stepped across the threshold into the dark.
`;
        await SwriteIpc.fileCreate('Manuscript/Chapter 01.md', defaultSample);
        await refreshFiles();
        await handleOpenFile('Manuscript/Chapter 01.md');
      } else {
        await handleOpenFile(view.manuscript_files[0].relative_path);
      }
    } catch {
      // If already exists, open it
      try {
        const summary = await SwriteIpc.projectOpen(projectPath);
        setActiveProject(summary);
        await refreshFiles();
        const view = await SwriteIpc.projectDiscover();
        if (view.manuscript_files.length > 0) {
          await handleOpenFile(view.manuscript_files[0].relative_path);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`Project error: ${msg}`);
      }
    }
  };

  const refreshFiles = async () => {
    try {
      const view = await SwriteIpc.projectDiscover();
      setFilesView(view);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`Discover error: ${msg}`);
    }
  };

  const handleOpenFile = async (relativePath: string) => {
    setIsLoadingFile(true);
    setSelectedFile(relativePath);
    try {
      const content = await SwriteIpc.fileRead(relativePath);
      setFileContent(content);
      addLog(`Opened document: ${relativePath} (${content.length} chars)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`Read error: ${msg}`);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleCreateNewChapter = async () => {
    const num = (filesView?.manuscript_files.length || 0) + 1;
    const padNum = num < 10 ? `0${num}` : `${num}`;
    const filename = `Manuscript/Chapter ${padNum}.md`;
    const initialText = `# Chapter ${num}\n\nBegin writing your chapter here...\n`;

    try {
      await SwriteIpc.fileCreate(filename, initialText);
      await refreshFiles();
      await handleOpenFile(filename);
      addLog(`Created new chapter: ${filename}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`Create chapter error: ${msg}`);
    }
  };

  const renderFileList = (title: string, files: DiscoveredFile[]) => {
    return (
      <div className="sidebar-section">
        <div className="section-title">
          <span>{title}</span>
          <span className="file-count">{files.length}</span>
        </div>
        <div className="file-list">
          {files.map((file) => {
            const isSelected = selectedFile === file.relative_path;
            return (
              <button
                key={file.relative_path}
                className={`file-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleOpenFile(file.relative_path)}
              >
                <FileText size={14} className="file-icon" />
                <span className="file-name">{file.name}</span>
                {isSelected && <ChevronRight size={14} className="file-arrow" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="swrite-studio-shell">
      {/* Studio Navigation Sidebar */}
      <aside className="swrite-studio-sidebar">
        <div className="studio-brand">
          <div className="brand-logo">
            <Sparkles size={18} className="brand-icon" />
            <span className="brand-name">Swrite</span>
            <span className="brand-version">2.0</span>
          </div>
          <button
            onClick={() => setShowCoreHarness((prev) => !prev)}
            className={`dev-toggle ${showCoreHarness ? 'active' : ''}`}
            title="Toggle Core IPC Harness"
          >
            <Sliders size={14} />
          </button>
        </div>

        {activeProject && (
          <div className="project-info">
            <div className="project-title-row">
              <BookOpen size={14} className="text-muted" />
              <span className="project-title" title={activeProject.name}>
                {activeProject.name}
              </span>
            </div>
          </div>
        )}

        <div className="sidebar-actions">
          <button onClick={handleCreateNewChapter} className="action-btn new-chapter-btn">
            <Plus size={14} />
            <span>New Chapter</span>
          </button>
          <button onClick={refreshFiles} className="action-btn icon-only" title="Refresh file tree">
            <RefreshCw size={13} />
          </button>
        </div>

        <div className="sidebar-tree">
          {filesView ? (
            <>
              {renderFileList('MANUSCRIPT', filesView.manuscript_files)}
              {filesView.planning_files.length > 0 &&
                renderFileList('PLANNING', filesView.planning_files)}
              {filesView.desk_files.length > 0 &&
                renderFileList('DESK', filesView.desk_files)}
            </>
          ) : (
            <div className="sidebar-empty">
              <Folder size={20} />
              <span>No project loaded</span>
            </div>
          )}
        </div>

        {/* Studio footer */}
        <div className="sidebar-footer">
          <span className="sidebar-shortcut-hint">Cmd+Shift+F Focus</span>
        </div>
      </aside>

      {/* Main Studio Workspace */}
      <main className="swrite-studio-workspace">
        {selectedFile && !isLoadingFile ? (
          <EditorCanvas
            key={selectedFile}
            documentId={selectedFile}
            relativePath={selectedFile}
            initialContent={fileContent}
          />
        ) : (
          <div className="workspace-loading">
            <span>Loading manuscript...</span>
          </div>
        )}

        {/* Development IPC Harness Drawer */}
        {showCoreHarness && (
          <div className="core-harness-drawer">
            <div className="drawer-header">
              <h3>Swrite 2 Native IPC Inspector</h3>
              <button onClick={() => setShowCoreHarness(false)}>Close</button>
            </div>
            <div className="drawer-body">
              <div className="log-window">
                {log.map((entry, idx) => (
                  <div key={idx} className="log-line">
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
