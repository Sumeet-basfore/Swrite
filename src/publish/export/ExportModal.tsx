import React, { useState } from 'react';
import { PaginationResult, PreflightCheckResult, PublicationProfile } from '../../types/ipc';

interface ExportModalProps {
  profile: PublicationProfile;
  projectRoot: string;
  projectName: string;
  pagination: PaginationResult | null;
  preflight: PreflightCheckResult | null;
  exporting: boolean;
  exportSuccessPath: string | null;
  exportError: string | null;
  onExport: (targetPath: string) => Promise<any>;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  profile,
  projectRoot,
  projectName,
  pagination,
  preflight,
  exporting,
  exportSuccessPath,
  exportError,
  onExport,
  onClose,
}) => {
  // Compute default output filename
  const cleanTitle = (profile.front_matter.title || projectName || 'Manuscript')
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  const ext = matchExtension(profile.format);
  const defaultPath = `${projectRoot}/${cleanTitle}.${ext}`;

  const [targetPath, setTargetPath] = useState(defaultPath);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPath.trim()) return;
    try {
      await onExport(targetPath.trim());
    } catch {
      // Handled via props
    }
  };

  const isBlocked = preflight && !preflight.is_valid;

  return (
    <div className="revision-modal-overlay" onClick={onClose}>
      <div className="export-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h3>Export Manuscript</h3>
          <button type="button" className="revision-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleExport} className="export-modal-form">
          {/* Summary Box */}
          <div className="export-summary-box">
            <div className="export-summary-row">
              <span className="summary-label">Publication Profile:</span>
              <span className="summary-val">{profile.name}</span>
            </div>
            <div className="export-summary-row">
              <span className="summary-label">Format:</span>
              <span className="summary-val uppercase">{profile.format}</span>
            </div>
            {pagination && (
              <div className="export-summary-row">
                <span className="summary-label">Output Length:</span>
                <span className="summary-val">
                  {pagination.total_pages} Pages (~{pagination.word_count.toLocaleString()} words)
                </span>
              </div>
            )}
            <div className="export-summary-row">
              <span className="summary-label">Preflight Status:</span>
              <span className={`summary-val ${isBlocked ? 'text-danger' : 'text-success'}`}>
                {isBlocked
                  ? `⛔ ${preflight?.blocking_count} Blocking Issues`
                  : '✓ Valid & Ready'}
              </span>
            </div>
          </div>

          {/* Destination Path */}
          <div className="export-form-group">
            <label className="export-label">Destination File Path</label>
            <input
              type="text"
              className="export-input"
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
              required
            />
          </div>

          {/* Safety Snapshot Guarantee Banner */}
          <div className="export-safety-notice">
            <span className="safety-icon">🛡</span>
            <span>
              <strong>Auto Safety Snapshot:</strong> Swrite will create a timestamped snapshot of your
              manuscript in local history before exporting. Your source files will not be modified.
            </span>
          </div>

          {exportError && (
            <div className="export-error-banner">
              ⛔ {exportError}
            </div>
          )}

          {exportSuccessPath && (
            <div className="export-success-banner">
              ✓ Successfully exported to: <br />
              <code>{exportSuccessPath}</code>
            </div>
          )}

          {/* Modal Actions */}
          <div className="export-modal-actions">
            <button
              type="button"
              className="revision-btn-secondary"
              onClick={onClose}
              disabled={exporting}
            >
              Close
            </button>
            <button
              type="submit"
              className="export-btn-confirm"
              disabled={exporting || !!isBlocked}
            >
              {exporting ? 'Generating Output...' : `Export ${profile.format.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function matchExtension(format: string): string {
  switch (format.toLowerCase()) {
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    case 'epub':
      return 'epub';
    case 'markdown':
      return 'md';
    case 'txt':
    default:
      return 'txt';
  }
}
