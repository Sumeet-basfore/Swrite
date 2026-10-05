import React, { useEffect } from 'react';
import { useReviewState } from './useReviewState';
import { ReviewItemCard } from './ReviewItemCard';
import { DiscoveredFile } from '../../types/ipc';
import { ReviewScope } from '../types';

interface ReviewQueueViewProps {
  currentDocumentPath: string | null;
  manuscriptFiles: DiscoveredFile[];
  onNavigateToPassage?: (filePath: string, startOffset?: number, endOffset?: number) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  currentDocumentPath,
  manuscriptFiles,
  onNavigateToPassage,
}) => {
  const {
    items,
    allItemsCount,
    loading,
    filters,
    setFilters,
    selectedIndex,
    setSelectedIndex,
    resolveItem,
    ignoreItem,
    applyReplacement,
    jumpToItem,
    selectNext,
    selectPrevious,
    refresh,
  } = useReviewState({
    currentDocumentPath,
    manuscriptFiles,
    onNavigateToPassage,
  });

  // Global hotkeys for review queue navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
        e.preventDefault();
        selectNext();
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
        e.preventDefault();
        selectPrevious();
      } else if (e.key === 'Enter') {
        if (items[selectedIndex]) {
          e.preventDefault();
          jumpToItem(items[selectedIndex]);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (items[selectedIndex]) {
          e.preventDefault();
          resolveItem(items[selectedIndex]);
        }
      } else if (e.key === 'i' || e.key === 'I') {
        if (items[selectedIndex]) {
          e.preventDefault();
          ignoreItem(items[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, selectNext, selectPrevious, jumpToItem, resolveItem, ignoreItem]);

  return (
    <div className="review-queue-view">
      {/* Top Filter Bar */}
      <div className="review-filter-bar">
        <div className="review-scope-group">
          <label className="review-filter-label">Scope:</label>
          <select
            className="review-select"
            value={filters.scope}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                scope: e.target.value as ReviewScope,
              }))
            }
          >
            <option value="current_doc">Current Document</option>
            <option value="current_chapter">Current Chapter</option>
            <option value="all_manuscript">Entire Manuscript</option>
          </select>
        </div>

        <div className="review-type-pills">
          <button
            type="button"
            className={`review-type-pill ${filters.typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setFilters((prev) => ({ ...prev, typeFilter: 'all' }))}
          >
            All
          </button>
          <button
            type="button"
            className={`review-type-pill ${filters.typeFilter === 'proofreading' ? 'active' : ''}`}
            onClick={() => setFilters((prev) => ({ ...prev, typeFilter: 'proofreading' }))}
          >
            Proofreading
          </button>
          <button
            type="button"
            className={`review-type-pill ${filters.typeFilter === 'comments' ? 'active' : ''}`}
            onClick={() => setFilters((prev) => ({ ...prev, typeFilter: 'comments' }))}
          >
            Comments
          </button>
          <button
            type="button"
            className={`review-type-pill ${filters.typeFilter === 'revisions' ? 'active' : ''}`}
            onClick={() => setFilters((prev) => ({ ...prev, typeFilter: 'revisions' }))}
          >
            Revisions
          </button>
        </div>

        <div className="review-search-group">
          <input
            type="text"
            className="review-search-input"
            placeholder="Search review items..."
            value={filters.searchQuery}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
          />
        </div>

        <button
          type="button"
          className="review-refresh-btn"
          onClick={refresh}
          title="Re-scan and refresh"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Keyboard navigation helper */}
      <div className="review-keyboard-bar">
        <span className="review-key-hint">
          <kbd>J</kbd> / <kbd>K</kbd> Next / Previous
        </span>
        <span className="review-key-hint">
          <kbd>Enter</kbd> Jump to Passage
        </span>
        <span className="review-key-hint">
          <kbd>R</kbd> Resolve
        </span>
        <span className="review-key-hint">
          <kbd>I</kbd> Ignore
        </span>
        <span className="review-count-indicator">
          {items.length} of {allItemsCount} items
        </span>
      </div>

      {/* Main Review Items List */}
      <div className="review-items-container">
        {loading ? (
          <div className="review-empty-state">
            <div className="review-spinner" />
            <p>Scanning manuscript and compiling editorial queue...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="review-empty-state">
            <div className="review-empty-icon">✓</div>
            <h3>Editorial Queue Clear</h3>
            <p>No unresolved findings, comments, or revision notes found in this scope.</p>
          </div>
        ) : (
          <div className="review-list">
            {items.map((item, idx) => (
              <ReviewItemCard
                key={item.id}
                item={item}
                isSelected={idx === selectedIndex}
                onSelect={() => setSelectedIndex(idx)}
                onResolve={() => resolveItem(item)}
                onIgnore={() => ignoreItem(item)}
                onApplyReplacement={
                  item.suggestedReplacement ? () => applyReplacement(item) : undefined
                }
                onJump={() => jumpToItem(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
