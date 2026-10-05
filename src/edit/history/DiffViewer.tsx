import React, { useState } from 'react';
import { DocumentDiffResult } from '../../types/ipc';

interface DiffViewerProps {
  diffResult: DocumentDiffResult | null;
  loading?: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diffResult, loading }) => {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  if (loading) {
    return (
      <div className="diff-viewer-empty">
        <div className="review-spinner" />
        <p>Computing line differences...</p>
      </div>
    );
  }

  if (!diffResult || diffResult.chunks.length === 0) {
    return (
      <div className="diff-viewer-empty">
        <p>No differences detected between selected versions.</p>
      </div>
    );
  }

  return (
    <div className="diff-viewer-root">
      {/* Diff stats and view toggle bar */}
      <div className="diff-viewer-header">
        <div className="diff-stats">
          <span className="diff-stat-add">+{diffResult.additions_count} additions</span>
          <span className="diff-stat-del">-{diffResult.deletions_count} deletions</span>
          <span className="diff-stat-mod">~{diffResult.modifications_count} modified</span>
        </div>

        <div className="diff-mode-toggle">
          <button
            type="button"
            className={`diff-mode-btn ${viewMode === 'unified' ? 'active' : ''}`}
            onClick={() => setViewMode('unified')}
          >
            Unified
          </button>
          <button
            type="button"
            className={`diff-mode-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Diff chunks container */}
      <div className={`diff-content-container diff-mode-${viewMode}`}>
        {viewMode === 'unified' ? (
          <table className="diff-table unified">
            <tbody>
              {diffResult.chunks.map((chunk, idx) => {
                let sign = ' ';
                let rowClass = 'diff-row-same';
                if (chunk.origin === 'added') {
                  sign = '+';
                  rowClass = 'diff-row-added';
                } else if (chunk.origin === 'removed') {
                  sign = '-';
                  rowClass = 'diff-row-removed';
                } else if (chunk.origin === 'modified') {
                  sign = '~';
                  rowClass = 'diff-row-modified';
                }

                return (
                  <tr key={idx} className={`diff-row ${rowClass}`}>
                    <td className="diff-line-num old-num">
                      {chunk.old_line_num ?? ''}
                    </td>
                    <td className="diff-line-num new-num">
                      {chunk.new_line_num ?? ''}
                    </td>
                    <td className="diff-sign">{sign}</td>
                    <td className="diff-line-content">
                      <code>{chunk.content || ' '}</code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="diff-split-grid">
            <div className="diff-split-pane left">
              <div className="diff-pane-title">Selected Snapshot</div>
              <div className="diff-pane-content">
                {diffResult.chunks.map((chunk, idx) => {
                  if (chunk.origin === 'added') return null;
                  const isRemoved = chunk.origin === 'removed';
                  return (
                    <div
                      key={idx}
                      className={`diff-split-line ${isRemoved ? 'line-removed' : 'line-same'}`}
                    >
                      <span className="diff-split-num">{chunk.old_line_num ?? ''}</span>
                      <span className="diff-split-text">{chunk.content || ' '}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="diff-split-pane right">
              <div className="diff-pane-title">Current / Target Document</div>
              <div className="diff-pane-content">
                {diffResult.chunks.map((chunk, idx) => {
                  if (chunk.origin === 'removed') return null;
                  const isAdded = chunk.origin === 'added';
                  return (
                    <div
                      key={idx}
                      className={`diff-split-line ${isAdded ? 'line-added' : 'line-same'}`}
                    >
                      <span className="diff-split-num">{chunk.new_line_num ?? ''}</span>
                      <span className="diff-split-text">{chunk.content || ' '}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
