import React, { useState } from 'react';
import { useRevisionsState } from './useRevisionsState';
import { RevisionModal } from './RevisionModal';
import { RevisionCategory, RevisionNote, RevisionSeverity } from '../../types/ipc';

interface RevisionsViewProps {
  currentDocumentPath: string | null;
  onNavigateToPassage?: (filePath: string, startOffset?: number, endOffset?: number) => void;
}

const CATEGORIES: RevisionCategory[] = [
  'Structure',
  'Plot',
  'Character',
  'Pacing',
  'Dialogue',
  'Worldbuilding',
  'Continuity',
  'Prose',
  'Proofreading',
  'General',
];

export const RevisionsView: React.FC<RevisionsViewProps> = ({
  currentDocumentPath,
  onNavigateToPassage,
}) => {
  const {
    revisions,
    loading,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    addRevision,
    updateRevision,
    deleteRevision,
    setStatus,
    refresh,
  } = useRevisionsState(currentDocumentPath);

  const [editingRev, setEditingRev] = useState<RevisionNote | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSaveModal = (
    title: string,
    description: string,
    category: RevisionCategory,
    severity: RevisionSeverity,
    targetPath?: string | null
  ) => {
    if (editingRev) {
      updateRevision({
        ...editingRev,
        title,
        description,
        category,
        severity,
        target_path: targetPath || null,
      });
    } else {
      addRevision(title, description, category, severity, targetPath);
    }
  };

  return (
    <div className="revisions-view">
      {/* Top Filter & Action Bar */}
      <div className="revisions-filter-bar">
        <div className="revisions-status-pills">
          <button
            type="button"
            className={`revisions-pill ${statusFilter === 'open' ? 'active' : ''}`}
            onClick={() => setStatusFilter('open')}
          >
            Open
          </button>
          <button
            type="button"
            className={`revisions-pill ${statusFilter === 'resolved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('resolved')}
          >
            Resolved
          </button>
          <button
            type="button"
            className={`revisions-pill ${statusFilter === 'ignored' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ignored')}
          >
            Ignored
          </button>
          <button
            type="button"
            className={`revisions-pill ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
        </div>

        <div className="revisions-category-select-wrapper">
          <select
            className="revisions-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as RevisionCategory | 'all')}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="revisions-search-box">
          <input
            type="text"
            className="revisions-search-input"
            placeholder="Search revision notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="revisions-btn-add"
          onClick={() => {
            setEditingRev(null);
            setShowAddModal(true);
          }}
        >
          + Add Revision Note
        </button>

        <button
          type="button"
          className="revisions-refresh-btn"
          onClick={refresh}
          title="Refresh revisions"
        >
          ↻
        </button>
      </div>

      {/* Main Revisions List Container */}
      <div className="revisions-list-container">
        {loading ? (
          <div className="revisions-empty-state">
            <div className="review-spinner" />
            <p>Loading revision notes...</p>
          </div>
        ) : revisions.length === 0 ? (
          <div className="revisions-empty-state">
            <div className="revisions-empty-icon">📝</div>
            <h3>No Revision Notes</h3>
            <p>
              {statusFilter === 'open'
                ? 'No open revision notes. Add one to track structural or prose edits.'
                : 'No revision notes matching this filter.'}
            </p>
            <button
              type="button"
              className="revisions-btn-add"
              onClick={() => {
                setEditingRev(null);
                setShowAddModal(true);
              }}
            >
              + Create Revision Note
            </button>
          </div>
        ) : (
          <div className="revisions-grid">
            {revisions.map((rev) => {
              const isResolved = rev.status === 'resolved';
              const isIgnored = rev.status === 'ignored';

              return (
                <div
                  key={rev.id}
                  className={`revision-card ${isResolved ? 'resolved' : ''} ${isIgnored ? 'ignored' : ''} severity-${rev.severity}`}
                >
                  <div className="revision-card-header">
                    <div className="revision-card-tags">
                      <span className="revision-category-tag">{rev.category}</span>
                      <span className={`revision-severity-tag severity-${rev.severity}`}>
                        {rev.severity}
                      </span>
                      {rev.target_path && (
                        <span
                          className="revision-target-path"
                          onClick={() => {
                            if (onNavigateToPassage && rev.target_path) {
                              onNavigateToPassage(
                                rev.target_path,
                                rev.anchor?.start_offset,
                                rev.anchor?.end_offset
                              );
                            }
                          }}
                          title="Click to jump to document"
                        >
                          {rev.target_path.split('/').pop()} ↗
                        </span>
                      )}
                    </div>
                    <span className="revision-date">
                      {new Date(rev.updated_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="revision-card-title">{rev.title}</h4>
                  <p className="revision-card-desc">{rev.description}</p>

                  <div className="revision-card-footer">
                    <div className="revision-status-actions">
                      {rev.status === 'open' ? (
                        <>
                          <button
                            type="button"
                            className="revision-btn-action revision-btn-resolve"
                            onClick={() => setStatus(rev.id, 'resolved')}
                          >
                            Resolve
                          </button>
                          <button
                            type="button"
                            className="revision-btn-action revision-btn-ignore"
                            onClick={() => setStatus(rev.id, 'ignored')}
                          >
                            Ignore
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="revision-btn-action"
                          onClick={() => setStatus(rev.id, 'open')}
                        >
                          Reopen
                        </button>
                      )}
                    </div>

                    <div className="revision-manage-actions">
                      <button
                        type="button"
                        className="revision-btn-icon"
                        onClick={() => {
                          setEditingRev(rev);
                          setShowAddModal(true);
                        }}
                        title="Edit note"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="revision-btn-icon revision-btn-danger"
                        onClick={() => deleteRevision(rev.id)}
                        title="Delete note"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <RevisionModal
          initialRevision={editingRev}
          currentDocumentPath={currentDocumentPath}
          onSave={handleSaveModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingRev(null);
          }}
        />
      )}
    </div>
  );
};
