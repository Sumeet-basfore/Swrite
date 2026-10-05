import React, { useState, useEffect, useRef } from 'react';
import { SearchResult, SearchMatch } from '../types/ipc';
import { SearchScope } from './types';
import { Search, FileText, X } from 'lucide-react';

export interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearch: (query: string) => Promise<void>;
  searchResult: SearchResult | null;
  isSearching: boolean;
  onSelectMatch: (relativePath: string, query: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  open,
  onClose,
  onSearch,
  searchResult,
  isSearching,
  onSelectMatch,
}) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        onSearch(query.trim());
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const filteredMatches: SearchMatch[] = (searchResult?.matches || []).filter(
    (m) => scope === 'All' || m.relative_path.startsWith(scope)
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredMatches.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredMatches.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredMatches.length) % (filteredMatches.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredMatches[selectedIndex]) {
          onSelectMatch(filteredMatches[selectedIndex].relative_path, query);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredMatches, selectedIndex, query, onSelectMatch, onClose]);

  if (!open) return null;

  return (
    <div className="swrite-modal-overlay" onClick={onClose}>
      <div
        className="swrite-search-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="search-input-box">
          <Search size={18} className="search-input-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search across manuscript, planning, and notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-field"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="clear-query-btn"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Scope Filters */}
        <div className="search-scopes">
          {(['All', 'Manuscript', 'Planning', 'Desk', 'Assets'] as SearchScope[]).map(
            (s) => (
              <button
                key={s}
                className={`scope-pill ${scope === s ? 'active' : ''}`}
                onClick={() => setScope(s)}
              >
                {s}
              </button>
            )
          )}
        </div>

        {/* Results List */}
        <div className="search-results-list">
          {isSearching ? (
            <div className="search-status-message">Searching manuscript index...</div>
          ) : query && filteredMatches.length === 0 ? (
            <div className="search-status-message">No matching text found for "{query}"</div>
          ) : (
            filteredMatches.map((match, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${match.relative_path}-${match.line_number}-${idx}`}
                  className={`search-result-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectMatch(match.relative_path, query);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="result-header">
                    <FileText size={13} className="result-icon" />
                    <span className="result-path">{match.relative_path}</span>
                    <span className="result-line">Line {match.line_number}</span>
                  </div>
                  <div className="result-excerpt">{match.excerpt}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="search-modal-footer">
          <span className="footer-hint">↑↓ to navigate</span>
          <span className="footer-hint">↵ to open</span>
          <span className="footer-hint">Esc to dismiss</span>
        </div>
      </div>
    </div>
  );
};
