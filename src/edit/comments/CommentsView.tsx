import React from 'react';
import { useCommentsState } from './useCommentsState';
import { CommentThreadCard } from './CommentThreadCard';

interface CommentsViewProps {
  currentDocumentPath: string | null;
  onNavigateToPassage?: (filePath: string, startOffset?: number, endOffset?: number) => void;
}

export const CommentsView: React.FC<CommentsViewProps> = ({
  currentDocumentPath,
  onNavigateToPassage,
}) => {
  const {
    comments,
    loading,
    statusFilter,
    setStatusFilter,
    docFilter,
    setDocFilter,
    searchQuery,
    setSearchQuery,
    staleMap,
    addReply,
    resolveComment,
    deleteComment,
    refresh,
  } = useCommentsState(currentDocumentPath);

  return (
    <div className="comments-view">
      {/* Top Filter Bar */}
      <div className="comments-filter-bar">
        <div className="comments-status-pills">
          <button
            type="button"
            className={`comments-pill ${statusFilter === 'open' ? 'active' : ''}`}
            onClick={() => setStatusFilter('open')}
          >
            Open
          </button>
          <button
            type="button"
            className={`comments-pill ${statusFilter === 'resolved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('resolved')}
          >
            Resolved
          </button>
          <button
            type="button"
            className={`comments-pill ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
        </div>

        <div className="comments-doc-selector">
          <select
            className="comments-select"
            value={docFilter}
            onChange={(e) => setDocFilter(e.target.value as 'current' | 'all')}
          >
            <option value="all">All Documents</option>
            <option value="current" disabled={!currentDocumentPath}>
              Current Document {currentDocumentPath ? `(${currentDocumentPath.split('/').pop()})` : ''}
            </option>
          </select>
        </div>

        <div className="comments-search-box">
          <input
            type="text"
            className="comments-search-input"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="comments-refresh-btn"
          onClick={refresh}
          title="Refresh comments"
        >
          ↻
        </button>
      </div>

      {/* Main Comment Cards Container */}
      <div className="comments-list-container">
        {loading ? (
          <div className="comments-empty-state">
            <div className="review-spinner" />
            <p>Loading manuscript comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="comments-empty-state">
            <div className="comments-empty-icon">💬</div>
            <h3>No Comments Found</h3>
            <p>
              {statusFilter === 'open'
                ? 'All comments in this view have been resolved.'
                : 'No comments matching the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="comments-grid">
            {comments.map((comment) => {
              const staleInfo = staleMap[comment.id];
              return (
                <CommentThreadCard
                  key={comment.id}
                  comment={comment}
                  isStale={staleInfo?.isStale}
                  staleReason={staleInfo?.reason}
                  onAddReply={(content) => addReply(comment.id, content)}
                  onResolve={(resolved) => resolveComment(comment.id, resolved)}
                  onDelete={() => deleteComment(comment.id)}
                  onJump={() => {
                    if (onNavigateToPassage) {
                      onNavigateToPassage(
                        comment.anchor.relative_path,
                        comment.anchor.start_offset,
                        comment.anchor.end_offset
                      );
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
