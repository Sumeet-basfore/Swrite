import { useState } from 'react';
import { SwriteIpc } from './lib/ipc';
import { ProjectSummary, ProjectFilesystemView, RecoveryDraft, SearchResult, ReconciliationResult } from './types/ipc';
import { Document } from './types/document';

export function App() {
  const [projectPath, setProjectPath] = useState<string>('/tmp/swrite-demo-project');
  const [projectName, setProjectName] = useState<string>('My Novel');
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(null);
  const [filesView, setFilesView] = useState<ProjectFilesystemView | null>(null);
  const [log, setLog] = useState<string[]>([]);

  // Editor Test State
  const [selectedFile, setSelectedFile] = useState<string>('Manuscript/Chapter 01.md');
  const [fileContent, setFileContent] = useState<string>('# Chapter 1\n\nIt was a dark and *stormy* night.');
  const [parsedDoc, setParsedDoc] = useState<Document | null>(null);
  const [serializedOutput, setSerializedOutput] = useState<string>('');
  const [recoveryDrafts, setRecoveryDrafts] = useState<RecoveryDraft[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('Lucan');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [reconResult, setReconResult] = useState<ReconciliationResult | null>(null);

  const addLog = (msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const handleCreateProject = async () => {
    try {
      const summary = await SwriteIpc.projectCreate(projectPath, projectName);
      setActiveProject(summary);
      addLog(`Created project: ${summary.name} at ${summary.root_path}`);
      await refreshFiles();
    } catch (e: any) {
      addLog(`Create error: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleOpenProject = async () => {
    try {
      const summary = await SwriteIpc.projectOpen(projectPath);
      setActiveProject(summary);
      addLog(`Opened project: ${summary.name}`);
      await refreshFiles();
    } catch (e: any) {
      addLog(`Open error: ${e.message || JSON.stringify(e)}`);
    }
  };

  const refreshFiles = async () => {
    try {
      const view = await SwriteIpc.projectDiscover();
      setFilesView(view);
      addLog(`Discovered ${view.manuscript_files.length} manuscript files, ${view.planning_files.length} planning files`);
    } catch (e: any) {
      addLog(`Discover error: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleSaveFile = async () => {
    try {
      await SwriteIpc.fileWrite(selectedFile, fileContent);
      addLog(`Atomically wrote file: ${selectedFile}`);
      await refreshFiles();
    } catch (e: any) {
      addLog(`Write error: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleParse = async () => {
    try {
      const doc = await SwriteIpc.documentParse(fileContent, 'markdown');
      setParsedDoc(doc);
      addLog(`Parsed AST: ${doc.blocks.length} blocks, word count: ${doc.blocks.length}`);
    } catch (e: any) {
      addLog(`Parse error: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleSerialize = async () => {
    if (!parsedDoc) return;
    try {
      const md = await SwriteIpc.documentSerialize(parsedDoc, 'markdown');
      setSerializedOutput(md);
      addLog(`Serialized AST to ${md.length} characters of Markdown`);
    } catch (e: any) {
      addLog(`Serialize error: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleSaveRecovery = async () => {
    try {
      await SwriteIpc.recoverySave('doc-1', selectedFile, fileContent);
      addLog('Saved recovery draft');
      const list = await SwriteIpc.recoveryList();
      setRecoveryDrafts(list);
    } catch (e: any) {
      addLog(`Recovery error: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleSearch = async () => {
    try {
      const res = await SwriteIpc.searchQuery(searchQuery);
      setSearchResult(res);
      addLog(`Search query '${searchQuery}': ${res.total_matches} matches`);
    } catch (e: any) {
      addLog(`Search error: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleReconcile = async () => {
    try {
      const res = await SwriteIpc.reconciliationInspect(selectedFile, '# Chapter 1\n\nBase text.', fileContent);
      setReconResult(res);
      addLog(`Reconciliation status: ${res.status}`);
    } catch (e: any) {
      addLog(`Reconciliation error: ${e.message || JSON.stringify(e)}`);
    }
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: '24px', maxWidth: '1100px', margin: '0 auto', color: '#2c3e50' }}>
      <header style={{ borderBottom: '2px solid #333', paddingBottom: '12px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>Swrite 2 — Native Core IPC Harness</h1>
        <p style={{ margin: '4px 0 0', color: '#666' }}>
          Validates the Tauri 2 Rust document model, filesystem atomic engine, and recovery layer.
        </p>
      </header>

      {/* Project Section */}
      <section style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
        <h3>1. Project Management</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            style={{ flex: 1, padding: '6px' }}
            value={projectPath}
            onChange={(e) => setProjectPath(e.target.value)}
            placeholder="Project root path"
          />
          <input
            style={{ width: '180px', padding: '6px' }}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
          />
          <button onClick={handleCreateProject}>Create Project</button>
          <button onClick={handleOpenProject}>Open Project</button>
          <button onClick={refreshFiles}>Refresh Files</button>
        </div>
        {activeProject && (
          <div style={{ background: '#f5f5f5', padding: '8px', fontSize: '13px' }}>
            <strong>Active:</strong> {activeProject.name} (UUID: {activeProject.project_id})<br />
            <strong>Manuscript Docs:</strong> {activeProject.file_counts.manuscript_count} | <strong>Planning:</strong> {activeProject.file_counts.planning_count}
          </div>
        )}
        {filesView && (
          <div style={{ marginTop: '8px', fontSize: '12px' }}>
            <strong>Discovered Manuscript Files:</strong> {filesView.manuscript_files.map((f) => f.relative_path).join(', ') || 'None'}
          </div>
        )}
      </section>

      {/* File Explorer & Editor Sandbox */}
      <section style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
        <h3>2. Document Model & Atomic Persistence</h3>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label>Relative Path:</label>
            <input
              style={{ width: '100%', padding: '6px', marginBottom: '8px' }}
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
            />
            <label>Content (Markdown / Text):</label>
            <textarea
              style={{ width: '100%', height: '140px', padding: '6px' }}
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
            />
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <button onClick={handleSaveFile}>Atomic Save</button>
              <button onClick={handleParse}>Parse to AST</button>
              <button onClick={handleSerialize}>Serialize AST</button>
              <button onClick={handleSaveRecovery}>Test Recovery Draft</button>
            </div>
          </div>

          <div style={{ flex: 1, background: '#fafafa', padding: '12px', border: '1px solid #eee', overflowY: 'auto', maxHeight: '240px' }}>
            <h4>AST Inspector</h4>
            <pre style={{ fontSize: '11px' }}>
              {parsedDoc ? JSON.stringify(parsedDoc, null, 2) : 'Click "Parse to AST" to inspect AST.'}
            </pre>
          </div>
        </div>

        {recoveryDrafts.length > 0 && (
          <div style={{ marginTop: '8px', fontSize: '12px' }}>
            <strong>Active Recovery Drafts:</strong> {recoveryDrafts.length}
          </div>
        )}

        {serializedOutput && (
          <div style={{ marginTop: '12px', background: '#f0f9ff', padding: '8px' }}>
            <h4>Serialized Markdown Output:</h4>
            <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{serializedOutput}</pre>
          </div>
        )}
      </section>

      {/* Recovery, Search, Reconciliation */}
      <section style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
        <h3>3. Search & 3-Way Reconciliation</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            style={{ flex: 1, padding: '6px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search query in project"
          />
          <button onClick={handleSearch}>Search Index</button>
          <button onClick={handleReconcile}>Inspect 3-Way Reconciliation</button>
        </div>

        {searchResult && (
          <div style={{ background: '#f8f8f8', padding: '8px', fontSize: '12px' }}>
            Found {searchResult.total_matches} matches for "{searchResult.query}":
            <ul>
              {searchResult.matches.map((m, i) => (
                <li key={i}>{m.relative_path} (L{m.line_number}): {m.excerpt}</li>
              ))}
            </ul>
          </div>
        )}

        {reconResult && (
          <div style={{ background: '#fffbeb', padding: '8px', fontSize: '12px', marginTop: '8px' }}>
            <strong>Status:</strong> {reconResult.status}<br />
            {reconResult.conflict_details && <div>{reconResult.conflict_details.message}</div>}
          </div>
        )}
      </section>

      {/* Activity Log */}
      <section style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '6px' }}>
        <h3>4. IPC Activity Log</h3>
        <div style={{ background: '#1e1e1e', color: '#76e096', padding: '12px', height: '140px', overflowY: 'auto', fontSize: '12px' }}>
          {log.length === 0 ? 'No activity logged yet.' : log.map((entry, idx) => <div key={idx}>{entry}</div>)}
        </div>
      </section>
    </div>
  );
}
