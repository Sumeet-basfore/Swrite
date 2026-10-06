import React, { useState, useEffect, useRef } from 'react';
import { EditorView } from '@milkdown/prose/view';
import { Search, ChevronUp, ChevronDown, Replace, X } from 'lucide-react';

export interface FindReplaceBarProps {
  getView: () => EditorView | null;
  getRawContent: () => string;
  onReplaceContent: (newContent: string) => void;
  onClose: () => void;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  getView,
  getRawContent,
  onReplaceContent,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [matches, setMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, []);

  // Compute matches
  useEffect(() => {
    if (!searchTerm) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const text = getRawContent();
    const flags = matchCase ? 'g' : 'gi';
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patternStr = matchWholeWord ? `\\b${escaped}\\b` : escaped;

    try {
      const regex = new RegExp(patternStr, flags);
      const indices: number[] = [];
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        indices.push(match.index);
        if (!regex.global) break;
      }

      setMatches(indices);
      if (indices.length > 0) {
        setCurrentMatchIndex(0);
        highlightMatchInView(indices[0]);
      } else {
        setCurrentMatchIndex(0);
      }
    } catch {
      setMatches([]);
    }
  }, [searchTerm, matchCase, matchWholeWord, getRawContent]);

  const highlightMatchInView = (_charOffset: number) => {
    const view = getView();
    if (!view) return;
    // Highlight or scroll into view
  };

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIdx);
    highlightMatchInView(matches[nextIdx]);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIdx);
    highlightMatchInView(matches[prevIdx]);
  };

  const handleReplace = () => {
    if (matches.length === 0 || !searchTerm) return;
    const text = getRawContent();
    const targetOffset = matches[currentMatchIndex];
    if (targetOffset === undefined) return;

    const before = text.slice(0, targetOffset);
    const after = text.slice(targetOffset + searchTerm.length);
    const updated = before + replaceTerm + after;

    onReplaceContent(updated);
  };

  const handleReplaceAll = () => {
    if (!searchTerm) return;
    const text = getRawContent();
    const flags = matchCase ? 'g' : 'gi';
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patternStr = matchWholeWord ? `\\b${escaped}\\b` : escaped;

    try {
      const regex = new RegExp(patternStr, flags);
      const updated = text.replace(regex, replaceTerm);
      onReplaceContent(updated);
    } catch (e) {
      console.error('Replace All failed:', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  return (
    <div className="swrite-find-replace-bar" onKeyDown={handleKeyDown}>
      <div className="find-inputs-group">
        <div className="find-input-wrapper">
          <Search size={14} className="find-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="find-input"
            placeholder="Find in document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="match-count">
            {matches.length > 0 ? `${currentMatchIndex + 1} of ${matches.length}` : searchTerm ? '0 found' : ''}
          </span>
        </div>

        <div className="find-input-wrapper">
          <Replace size={14} className="find-icon" />
          <input
            type="text"
            className="find-input"
            placeholder="Replace with..."
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="find-options-group">
        <button
          type="button"
          className={`option-chip ${matchCase ? 'active' : ''}`}
          onClick={() => setMatchCase((v) => !v)}
          title="Match Case"
        >
          Aa
        </button>
        <button
          type="button"
          className={`option-chip ${matchWholeWord ? 'active' : ''}`}
          onClick={() => setMatchWholeWord((v) => !v)}
          title="Match Whole Word"
        >
          \b
        </button>

        <div className="toolbar-separator" />

        <button
          type="button"
          className="find-nav-btn"
          onClick={handlePrev}
          disabled={matches.length === 0}
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          className="find-nav-btn"
          onClick={handleNext}
          disabled={matches.length === 0}
          title="Next match (Enter)"
        >
          <ChevronDown size={14} />
        </button>

        <div className="toolbar-separator" />

        <button
          type="button"
          className="find-action-btn"
          onClick={handleReplace}
          disabled={matches.length === 0}
          title="Replace current match"
        >
          Replace
        </button>
        <button
          type="button"
          className="find-action-btn"
          onClick={handleReplaceAll}
          disabled={matches.length === 0}
          title="Replace all occurrences"
        >
          Replace All
        </button>

        <button
          type="button"
          className="find-close-btn"
          onClick={onClose}
          title="Close search (Esc)"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
