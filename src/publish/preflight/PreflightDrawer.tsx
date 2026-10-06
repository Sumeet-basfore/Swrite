import React, { useState } from 'react';
import { PreflightCheckResult, PreflightIssue, PreflightSeverity } from '../../types/ipc';

interface PreflightDrawerProps {
  preflight: PreflightCheckResult | null;
  loading: boolean;
  onNavigateToDocument?: (path: string) => void;
  onClose?: () => void;
}

export const PreflightDrawer: React.FC<PreflightDrawerProps> = ({
  preflight,
  loading,
  onNavigateToDocument,
  onClose,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<PreflightSeverity | 'all'>('all');

  if (loading) {
    return (
      <div className="preflight-drawer-root">
        <div className="preflight-drawer-header">
          <h4>Preflight Verification</h4>
          {onClose && <button type="button" className="preflight-close-btn" onClick={onClose}>×</button>}
        </div>
        <div className="preflight-loading">
          <div className="review-spinner" />
          <span>Verifying manuscript structure and assets...</span>
        </div>
      </div>
    );
  }

  if (!preflight) {
    return null;
  }

  const filteredIssues = preflight.issues.filter((issue) => {
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="preflight-drawer-root">
      <div className="preflight-drawer-header">
        <div className="preflight-title-group">
          <h4>Preflight Verification</h4>
          <span className={`preflight-status-badge ${preflight.is_valid ? 'valid' : 'invalid'}`}>
            {preflight.is_valid ? '✓ Ready to Export' : `⛔ ${preflight.blocking_count} Blocking Issues`}
          </span>
        </div>
        {onClose && <button type="button" className="preflight-close-btn" onClick={onClose}>×</button>}
      </div>

      {/* Summary Row */}
      <div className="preflight-stats-bar">
        <span className="preflight-stat-item">
          <strong>{preflight.chapters_checked}</strong> chapters
        </span>
        <span className="preflight-stat-item">
          <strong>{preflight.images_checked}</strong> images
        </span>
        <span className="preflight-stat-item">
          <strong>{preflight.links_checked}</strong> links
        </span>
      </div>

      {/* Severity Filter Pills */}
      <div className="preflight-filter-pills">
        <button
          type="button"
          className={`preflight-pill ${filterSeverity === 'all' ? 'active' : ''}`}
          onClick={() => setFilterSeverity('all')}
        >
          All ({preflight.issues.length})
        </button>
        {preflight.blocking_count > 0 && (
          <button
            type="button"
            className={`preflight-pill blocking ${filterSeverity === 'blocking' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('blocking')}
          >
            Blocking ({preflight.blocking_count})
          </button>
        )}
        {preflight.warning_count > 0 && (
          <button
            type="button"
            className={`preflight-pill warning ${filterSeverity === 'warning' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('warning')}
          >
            Warnings ({preflight.warning_count})
          </button>
        )}
        {preflight.info_count > 0 && (
          <button
            type="button"
            className={`preflight-pill info ${filterSeverity === 'info' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('info')}
          >
            Info ({preflight.info_count})
          </button>
        )}
      </div>

      {/* Issues List */}
      <div className="preflight-issues-list">
        {filteredIssues.length === 0 ? (
          <div className="preflight-empty-issues">
            <span className="preflight-success-check">✓</span>
            <p>No issues found. Manuscript structure and assets verified.</p>
          </div>
        ) : (
          filteredIssues.map((issue: PreflightIssue) => (
            <div key={issue.id} className={`preflight-issue-card severity-${issue.severity}`}>
              <div className="preflight-issue-top">
                <span className={`preflight-sev-tag severity-${issue.severity}`}>
                  {issue.severity}
                </span>
                <span className="preflight-cat-tag">{issue.category}</span>
                {issue.document_path && onNavigateToDocument && (
                  <span
                    className="preflight-doc-link"
                    onClick={() => onNavigateToDocument(issue.document_path!)}
                    title="Jump to document in Write studio"
                  >
                    {issue.document_path.split('/').pop()} ↗
                  </span>
                )}
              </div>

              <div className="preflight-issue-message">{issue.message}</div>

              {issue.suggestion && (
                <div className="preflight-issue-suggestion">
                  <strong>Suggestion:</strong> {issue.suggestion}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
