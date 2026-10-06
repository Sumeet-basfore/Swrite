import React from 'react';
import { ReviewQueueItem } from '../types';

interface ReviewItemCardProps {
  item: ReviewQueueItem;
  isSelected: boolean;
  onSelect: () => void;
  onResolve: () => void;
  onIgnore: () => void;
  onApplyReplacement?: () => void;
  onJump: () => void;
}

export const ReviewItemCard: React.FC<ReviewItemCardProps> = ({
  item,
  isSelected,
  onSelect,
  onResolve,
  onIgnore,
  onApplyReplacement,
  onJump,
}) => {
  const getTypeBadgeClass = () => {
    switch (item.type) {
      case 'proofreading':
        return 'review-badge-proofreading';
      case 'comment':
        return 'review-badge-comment';
      case 'revision':
        return 'review-badge-revision';
      default:
        return 'review-badge-default';
    }
  };

  const getSeverityClass = () => {
    switch (item.severity) {
      case 'error':
      case 'high':
        return 'severity-high';
      case 'warning':
      case 'medium':
        return 'severity-medium';
      case 'info':
      case 'low':
      default:
        return 'severity-low';
    }
  };

  return (
    <div
      className={`review-item-card ${isSelected ? 'selected' : ''} ${getSeverityClass()}`}
      onClick={onSelect}
      onDoubleClick={onJump}
      role="button"
      tabIndex={0}
    >
      <div className="review-card-header">
        <div className="review-card-meta">
          <span className={`review-type-badge ${getTypeBadgeClass()}`}>
            {item.type}
          </span>
          {item.category && (
            <span className="review-category-badge">{item.category}</span>
          )}
          <span className="review-doc-path" title={item.documentPath}>
            {item.documentPath.split('/').pop()}
            {item.lineNumber ? ` : Line ${item.lineNumber}` : ''}
          </span>
        </div>
        <span className={`review-severity-dot ${getSeverityClass()}`} title={`Severity: ${item.severity}`} />
      </div>

      <div className="review-card-title">{item.title}</div>
      <div className="review-card-detail">{item.detail}</div>

      {item.matchedText && (
        <div className="review-matched-excerpt">
          <span className="review-matched-label">Matched:</span>
          <code className="review-matched-code">{item.matchedText}</code>
        </div>
      )}

      {item.suggestedReplacement && onApplyReplacement && (
        <div className="review-replacement-action">
          <button
            type="button"
            className="review-btn-action review-btn-replace"
            onClick={(e) => {
              e.stopPropagation();
              onApplyReplacement();
            }}
          >
            Apply: "{item.suggestedReplacement}"
          </button>
        </div>
      )}

      <div className="review-card-actions">
        <button
          type="button"
          className="review-btn-action"
          onClick={(e) => {
            e.stopPropagation();
            onJump();
          }}
          title="Open passage in manuscript (Enter)"
        >
          Jump to Passage ↗
        </button>
        <button
          type="button"
          className="review-btn-action review-btn-resolve"
          onClick={(e) => {
            e.stopPropagation();
            onResolve();
          }}
          title="Resolve this issue (R)"
        >
          Resolve
        </button>
        <button
          type="button"
          className="review-btn-action review-btn-ignore"
          onClick={(e) => {
            e.stopPropagation();
            onIgnore();
          }}
          title="Ignore / dismiss (I)"
        >
          Ignore
        </button>
      </div>
    </div>
  );
};
