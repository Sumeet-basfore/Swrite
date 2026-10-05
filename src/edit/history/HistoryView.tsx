import React, { useState } from 'react';
import { useHistoryDiffState } from './useHistoryDiffState';
import { DiffViewer } from './DiffViewer';
import { DiscoveredFile } from '../../types/ipc';

interface HistoryViewProps {
  currentDocumentPath: string | null;
  manuscriptFiles: DiscoveredFile[];
  onSelectDocument: (path: string) => void;
  onRestoreSuccess?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  currentDocumentPath,
  manuscriptFiles,
  onSelectDocument,
  onRestoreSuccess,
}) => {
  const {
    snapshots,
    loadingSnapshots,
    selectedSnapshotId,
    setSelectedSnapshotId,
    compareWithPrevious,
    setCompareWithPrevious,
    diffResult,
    loadingDiff,
    restoring,
    createSnapshot,
    safeRestore,
  } = useHistoryDiffState({ currentDocumentPath });

  const [newLabel, setNewLabel] = useState('');
  const [showNewSnapshotInput, setShowNewSnapshotInput] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSnapshot(newLabel.trim() || 'Manual revision point');
    setNewLabel('');
    setShowNewSnapshotInput(false);
  };

  const handleConfirmRestore = async () => {
    if (!selectedSnapshotId) return;
    try {
      await safeRestore(selectedSnapshotId);
      setShowRestoreConfirm(false);
      if (onRestoreSuccess) onRestoreSuccess();
    } catch (e) {
      console.error('Failed to restore:', e);
    }
  };

  if (!currentDocumentPath) {
    return (
      <div className="history-empty-state">
        <div className="history-empty-icon">⏳</div>
        <h3>No Document Selected</h3>
        <p>Select a manuscript document to inspect its snapshot history and version diffs.</p>
        <div className="history-doc-selector-grid">
          {manuscriptFiles.map((file) => (
            <button
              key={file.relative_path}
              type="button"
              className="history-doc-select-btn"
              onClick={() => onSelectDocument(file.relative_path)}
            >
              📄 {file.relative_path.split('/').pop()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const selectedSnapshot = snapshots.find((s) => s.snapshot_id === selectedSnapshotId);

  return (
    <div className="history-view-root">
      {/* Left Sidebar: Snapshots Timeline */}
      <div className="history-snapshots-sidebar">
        <div className="history-sidebar-header">
          <div className="history-doc-title">
            <span className="history-doc-name">{currentDocumentPath.split('/').pop()}</span>
            <span className="history-doc-count">({snapshots.length} versions)</span>
          </div>

          {!showNewSnapshotInput ? (
            <button
              type="button"
              className="history-btn-new-snapshot"
              onClick={() => setShowNewSnapshotInput(true)}
            >
              + Create Snapshot
            </button>
          ) : (
            <form onSubmit={handleCreateSnapshot} className="history-new-snapshot-form">
              <input
                type="text"
                className="history-new-snapshot-input"
                placeholder="Snapshot reason / label..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                autoFocus
              />
              <div className="history-new-snapshot-actions">
                <button
                  type="button"
                  className="history-btn-cancel"
                  onClick={() => setShowNewSnapshotInput(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="history-btn-save">
                  Save
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="history-snapshots-list">
          {loadingSnapshots ? (
            <div className="history-loading">Loading version timeline...</div>
          ) : snapshots.length === 0 ? (
            <div className="history-empty-list">
              No snapshots recorded yet. Click "Create Snapshot" or edit the document to generate versions.
            </div>
          ) : (
            snapshots.map((snap) => {
              const isSelected = snap.snapshot_id === selectedSnapshotId;
              const date = new Date(snap.timestamp);

              return (
                <div
                  key={snap.snapshot_id}
                  className={`history-snapshot-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedSnapshotId(snap.snapshot_id)}
                >
                  <div className="history-item-top">
                    <span className="history-item-label">{snap.label || 'Autosave Snapshot'}</span>
                    <span className="history-item-time">
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="history-item-bottom">
                    <span className="history-item-date">
                      {date.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="history-item-hash">
                      {snap.content_hash.slice(0, 7)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Content Pane: Diff & Actions */}
      <div className="history-diff-pane">
        <div className="history-diff-topbar">
          <div className="history-compare-modes">
            <label className="history-radio-label">
              <input
                type="radio"
                name="compareMode"
                checked={!compareWithPrevious}
                onChange={() => setCompareWithPrevious(false)}
              />
              Compare with Current Prose
            </label>
            <label className="history-radio-label">
              <input
                type="radio"
                name="compareMode"
                checked={compareWithPrevious}
                onChange={() => setCompareWithPrevious(true)}
              />
              Compare with Previous Snapshot
            </label>
          </div>

          {selectedSnapshot && (
            <div className="history-restore-actions">
              <button
                type="button"
                className="history-btn-restore"
                disabled={restoring}
                onClick={() => setShowRestoreConfirm(true)}
              >
                {restoring ? 'Restoring...' : '↺ Restore This Version'}
              </button>
            </div>
          )}
        </div>

        {/* Diff content */}
        <div className="history-diff-container">
          <DiffViewer diffResult={diffResult} loading={loadingDiff} />
        </div>
      </div>

      {/* Restore confirmation dialog */}
      {showRestoreConfirm && selectedSnapshot && (
        <div className="revision-modal-overlay" onClick={() => setShowRestoreConfirm(false)}>
          <div className="revision-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="revision-modal-header">
              <h3>Restore Version Confirmation</h3>
              <button
                type="button"
                className="revision-modal-close"
                onClick={() => setShowRestoreConfirm(false)}
              >
                ×
              </button>
            </div>

            <div className="history-restore-modal-body">
              <p>
                Are you sure you want to restore the snapshot from{' '}
                <strong>
                  {new Date(selectedSnapshot.timestamp).toLocaleString()} (
                  {selectedSnapshot.label || 'Snapshot'})
                </strong>
                ?
              </p>
              <div className="history-safety-callout">
                <span className="safety-icon">🛡</span>
                <span>
                  <strong>Safe Restore:</strong> Swrite will automatically take a pre-restore safety
                  snapshot of your current document before overwriting, so you can always undo.
                </span>
              </div>
            </div>

            <div className="revision-modal-actions">
              <button
                type="button"
                className="revision-btn-secondary"
                onClick={() => setShowRestoreConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="revision-btn-primary"
                onClick={handleConfirmRestore}
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
