import React, { useState, useEffect } from 'react';
import { ImportSummary } from '../types/ipc';
import { UploadCloud, FolderInput, FileText, CheckCircle2, AlertTriangle, X, ArrowRight } from 'lucide-react';

export interface ImportModalProps {
  open: boolean;
  initialSection?: string;
  onClose: () => void;
  onImportBatch: (
    sourcePaths: string[],
    targetSection: string,
    conflictStrategy: 'rename' | 'skip' | 'overwrite'
  ) => Promise<ImportSummary>;
  onImportFolder: (
    folderPath: string,
    targetSection: string,
    conflictStrategy: 'rename' | 'skip' | 'overwrite'
  ) => Promise<ImportSummary>;
  onOpenFile?: (path: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  open,
  initialSection = 'Manuscript',
  onClose,
  onImportBatch,
  onImportFolder,
  onOpenFile,
}) => {
  const [targetSection, setTargetSection] = useState<string>(initialSection);
  const [importMode, setImportMode] = useState<'files' | 'folder'>('files');
  const [conflictStrategy, setConflictStrategy] = useState<'rename' | 'skip' | 'overwrite'>('rename');
  const [pathInput, setPathInput] = useState<string>('');
  const [fileList, setFileList] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTargetSection(initialSection || 'Manuscript');
      setPathInput('');
      setFileList([]);
      setIsProcessing(false);
      setImportSummary(null);
      setErrorMessage(null);
    }
  }, [open, initialSection]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleAddPath = () => {
    const trimmed = pathInput.trim();
    if (!trimmed) return;

    // Support comma or newline separated paths
    const newPaths = trimmed
      .split(/[\n,]+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (importMode === 'folder') {
      setFileList([newPaths[0]]);
    } else {
      setFileList((prev) => Array.from(new Set([...prev, ...newPaths])));
    }
    setPathInput('');
  };

  const handleRemovePath = (index: number) => {
    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNativeFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const paths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // In web/tauri environment, file may have a path attribute or name
      const fullPath = (file as unknown as { path?: string }).path || file.name;
      paths.push(fullPath);
    }

    if (importMode === 'folder') {
      if (paths.length > 0) setFileList([paths[0]]);
    } else {
      setFileList((prev) => Array.from(new Set([...prev, ...paths])));
    }
  };

  const handleExecuteImport = async () => {
    // If input has text not yet added, include it
    let pathsToImport = [...fileList];
    if (pathInput.trim()) {
      const extra = pathInput.split(/[\n,]+/).map((p) => p.trim()).filter(Boolean);
      pathsToImport = Array.from(new Set([...pathsToImport, ...extra]));
    }

    if (pathsToImport.length === 0) {
      setErrorMessage('Please specify at least one file or folder path to import.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let summary: ImportSummary;
      if (importMode === 'folder') {
        summary = await onImportFolder(pathsToImport[0], targetSection, conflictStrategy);
      } else {
        summary = await onImportBatch(pathsToImport, targetSection, conflictStrategy);
      }
      setImportSummary(summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Import failed: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="swrite-dialog-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="swrite-dialog-modal wide"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dialog-header">
          <div className="dialog-icon-wrap" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
            <UploadCloud size={20} />
          </div>
          <div className="dialog-title-block">
            <h3>Import into Project</h3>
            <p className="dialog-subtitle">
              Bring existing manuscripts, markdown, plain text, and DOCX files into your project.
            </p>
          </div>
          <button
            onClick={onClose}
            className="theme-picker-close-btn"
            style={{ marginLeft: 'auto' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="dialog-body-form" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {importSummary ? (
            /* Result Summary View */
            <div className="import-summary-view" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-success, #10b981)' }}>
                <CheckCircle2 size={24} />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                  Import Completed Successfully
                </h4>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                  padding: '12px 16px',
                  background: 'var(--app-bg, #f9f8f6)',
                  borderRadius: 8,
                  border: '1px solid var(--border-quiet, #eae7e1)',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {importSummary.imported_count}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Imported</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {importSummary.conflict_count}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conflicts/Renamed</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-warning, #f59e0b)' }}>
                    {importSummary.skipped_count}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Skipped</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-error, #ef4444)' }}>
                    {importSummary.errors.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Errors</div>
                </div>
              </div>

              {/* Imported Files List Preview */}
              {importSummary.imported_files.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Imported Documents:
                  </div>
                  <div
                    style={{
                      maxHeight: 140,
                      overflowY: 'auto',
                      padding: 8,
                      background: 'var(--app-surface, #fff)',
                      border: '1px solid var(--border-quiet, #eae7e1)',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                    }}
                  >
                    {importSummary.imported_files.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 6px',
                          borderBottom: idx < importSummary.imported_files.length - 1 ? '1px solid var(--divider)' : 'none',
                        }}
                      >
                        <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{file}</span>
                        {onOpenFile && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenFile(file);
                              onClose();
                            }}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--accent)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.78rem',
                            }}
                          >
                            Open <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skipped files note */}
              {importSummary.skipped_files.length > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--app-bg)', padding: '6px 10px', borderRadius: 4 }}>
                  Skipped (duplicates/system files): {importSummary.skipped_files.join(', ')}
                </div>
              )}
            </div>
          ) : (
            /* Setup & Configuration View */
            <>
              {/* Import Mode Selector */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={`dialog-btn ${importMode === 'files' ? 'primary' : 'secondary'}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => setImportMode('files')}
                >
                  <FileText size={15} />
                  <span>Files (.md, .txt, .docx)</span>
                </button>
                <button
                  type="button"
                  className={`dialog-btn ${importMode === 'folder' ? 'primary' : 'secondary'}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => setImportMode('folder')}
                >
                  <FolderInput size={15} />
                  <span>Recursive Folder</span>
                </button>
              </div>

              {/* Target Destination Section */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Destination Studio Section
                </label>
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  className="dialog-select"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-quiet, #e5e7eb)',
                    background: 'var(--app-surface, #ffffff)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                >
                  <option value="Manuscript">Manuscript (Core Chapters & Scenes)</option>
                  <option value="Planning">Planning (Outlines, Characters, Lore)</option>
                  <option value="Desk">Desk (Notes & Brainstorming)</option>
                  <option value="Assets">Assets (Media & Supporting Files)</option>
                </select>
              </div>

              {/* Conflict Strategy */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  If a file already exists:
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="conflict"
                      value="rename"
                      checked={conflictStrategy === 'rename'}
                      onChange={() => setConflictStrategy('rename')}
                    />
                    <span>Auto-Rename (Keep Both)</span>
                  </label>
                  <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="conflict"
                      value="skip"
                      checked={conflictStrategy === 'skip'}
                      onChange={() => setConflictStrategy('skip')}
                    />
                    <span>Skip Existing</span>
                  </label>
                  <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="conflict"
                      value="overwrite"
                      checked={conflictStrategy === 'overwrite'}
                      onChange={() => setConflictStrategy('overwrite')}
                    />
                    <span>Overwrite</span>
                  </label>
                </div>
              </div>

              {/* Source Path Input / Native File Picker */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {importMode === 'folder' ? 'Folder Absolute Path' : 'File Absolute Path(s)'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="dialog-input"
                    placeholder={
                      importMode === 'folder'
                        ? '/path/to/my-novel-drafts'
                        : '/path/to/chapter1.md, /path/to/notes.docx'
                    }
                    value={pathInput}
                    onChange={(e) => setPathInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPath();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddPath}
                    className="dialog-btn secondary"
                    style={{ padding: '0 14px' }}
                  >
                    Add
                  </button>
                </div>

                {/* File picker input fallback */}
                <div style={{ marginTop: 4 }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.8rem',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Browse files from disk
                    <input
                      type="file"
                      multiple={importMode === 'files'}
                      style={{ display: 'none' }}
                      onChange={handleNativeFileInput}
                    />
                  </label>
                </div>
              </div>

              {/* Selected List Preview */}
              {fileList.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Items to import ({fileList.length}):
                  </div>
                  <div
                    style={{
                      maxHeight: 120,
                      overflowY: 'auto',
                      padding: 6,
                      background: 'var(--app-bg, #f9f8f6)',
                      borderRadius: 6,
                      border: '1px solid var(--border-quiet, #eae7e1)',
                    }}
                  >
                    {fileList.map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '3px 6px',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePath(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0 4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          aria-label="Remove path"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--color-error, #ef4444)',
                    fontSize: '0.85rem',
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="dialog-actions" style={{ padding: '16px 24px', borderTop: '1px solid var(--divider)' }}>
          {importSummary ? (
            <button
              type="button"
              onClick={onClose}
              className="dialog-btn primary"
              style={{ marginLeft: 'auto' }}
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="dialog-btn secondary"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="dialog-btn primary"
                disabled={isProcessing || (fileList.length === 0 && !pathInput.trim())}
              >
                {isProcessing ? 'Importing...' : 'Start Import'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
