import React, { useState, useEffect, useCallback } from 'react';
import { SwriteIpc } from '../../lib/ipc';
import { DiscoveredFile } from '../../types/ipc';
import { FindReplaceMatch, FindReplaceOptions } from '../types';

interface FindReplaceModalProps {
  currentDocumentPath: string | null;
  manuscriptFiles: DiscoveredFile[];
  onClose: () => void;
  onNavigateToPassage?: (filePath: string, startOffset?: number, endOffset?: number) => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  currentDocumentPath,
  manuscriptFiles,
  onClose,
  onNavigateToPassage,
}) => {
  const [options, setOptions] = useState<FindReplaceOptions>({
    searchQuery: '',
    replaceQuery: '',
    caseSensitive: false,
    wholeWord: false,
    scope: currentDocumentPath ? 'document' : 'manuscript',
  });

  const [matches, setMatches] = useState<FindReplaceMatch[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState<number>(-1);
  const [searching, setSearching] = useState(false);
  const [replaceCount, setReplaceCount] = useState<number | null>(null);

  // Scan files for matches
  const performSearch = useCallback(async () => {
    if (!options.searchQuery.trim()) {
      setMatches([]);
      setCurrentMatchIdx(-1);
      return;
    }

    setSearching(true);
    try {
      const targetFiles =
        options.scope === 'document' && currentDocumentPath
          ? manuscriptFiles.filter((f) => f.relative_path === currentDocumentPath)
          : manuscriptFiles;

      const found: FindReplaceMatch[] = [];

      for (const file of targetFiles) {
        try {
          const content = await SwriteIpc.fileRead(file.relative_path);
          let pattern = options.searchQuery;
          if (!options.caseSensitive) {
            pattern = pattern.toLowerCase();
          }

          const lines = content.split('\n');
          let currentOffset = 0;

          for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            const searchLine = options.caseSensitive ? line : line.toLowerCase();
            let startPos = 0;

            while (startPos < searchLine.length) {
              const idx = searchLine.indexOf(pattern, startPos);
              if (idx === -1) break;

              // Check whole word if enabled
              let isMatch = true;
              if (options.wholeWord) {
                const prevChar = idx > 0 ? searchLine[idx - 1] : ' ';
                const nextChar = idx + pattern.length < searchLine.length ? searchLine[idx + pattern.length] : ' ';
                const wordCharRegex = /\w/;
                if (wordCharRegex.test(prevChar) || wordCharRegex.test(nextChar)) {
                  isMatch = false;
                }
              }

              if (isMatch) {
                const lineStartOffset = currentOffset;
                const matchStart = lineStartOffset + idx;
                const matchEnd = matchStart + options.searchQuery.length;

                found.push({
                  documentPath: file.relative_path,
                  lineNumber: lineNum + 1,
                  startOffset: matchStart,
                  endOffset: matchEnd,
                  preview: line.trim(),
                  matchedText: line.slice(idx, idx + options.searchQuery.length),
                });
              }

              startPos = idx + Math.max(1, pattern.length);
            }

            currentOffset += line.length + 1; // +1 for newline
          }
        } catch {
          // continue
        }
      }

      setMatches(found);
      setCurrentMatchIdx(found.length > 0 ? 0 : -1);
      setReplaceCount(null);
    } catch (e) {
      console.error('Find/replace scan error:', e);
    } finally {
      setSearching(false);
    }
  }, [options, currentDocumentPath, manuscriptFiles]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch();
    }, 200);
    return () => clearTimeout(timeout);
  }, [performSearch]);

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIdx + 1) % matches.length;
    setCurrentMatchIdx(nextIdx);
    const m = matches[nextIdx];
    if (onNavigateToPassage) {
      onNavigateToPassage(m.documentPath, m.startOffset, m.endOffset);
    }
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIdx - 1 + matches.length) % matches.length;
    setCurrentMatchIdx(prevIdx);
    const m = matches[prevIdx];
    if (onNavigateToPassage) {
      onNavigateToPassage(m.documentPath, m.startOffset, m.endOffset);
    }
  };

  const handleReplaceNext = async () => {
    if (currentMatchIdx === -1 || !matches[currentMatchIdx]) return;
    const targetMatch = matches[currentMatchIdx];

    try {
      const content = await SwriteIpc.fileRead(targetMatch.documentPath);
      const before = content.slice(0, targetMatch.startOffset);
      const after = content.slice(targetMatch.endOffset);
      const updated = before + options.replaceQuery + after;

      await SwriteIpc.fileWrite(targetMatch.documentPath, updated);
      // Re-scan
      await performSearch();
    } catch (e) {
      console.error('Failed to replace next:', e);
    }
  };

  const handleReplaceAll = async () => {
    if (matches.length === 0) return;

    try {
      let count = 0;
      // Group matches by file
      const fileMap: Record<string, FindReplaceMatch[]> = {};
      for (const m of matches) {
        if (!fileMap[m.documentPath]) fileMap[m.documentPath] = [];
        fileMap[m.documentPath].push(m);
      }

      for (const [path, fileMatches] of Object.entries(fileMap)) {
        let content = await SwriteIpc.fileRead(path);
        // Replace from bottom to top to preserve offsets
        const sortedDesc = [...fileMatches].sort((a, b) => b.startOffset - a.startOffset);

        for (const m of sortedDesc) {
          content =
            content.slice(0, m.startOffset) +
            options.replaceQuery +
            content.slice(m.endOffset);
          count++;
        }

        await SwriteIpc.fileWrite(path, content);
      }

      setReplaceCount(count);
      await performSearch();
    } catch (e) {
      console.error('Failed to replace all:', e);
    }
  };

  return (
    <div className="revision-modal-overlay" onClick={onClose}>
      <div className="find-replace-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="find-replace-header">
          <h3>Find & Replace</h3>
          <button type="button" className="revision-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="find-replace-body">
          {/* Find row */}
          <div className="find-replace-row">
            <label className="find-replace-label">Find:</label>
            <input
              type="text"
              className="find-replace-input"
              placeholder="Search expression..."
              value={options.searchQuery}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              autoFocus
            />
            <span className="find-replace-counter">
              {searching
                ? 'Searching...'
                : matches.length > 0
                ? `${currentMatchIdx + 1} of ${matches.length}`
                : '0 matches'}
            </span>
          </div>

          {/* Replace row */}
          <div className="find-replace-row">
            <label className="find-replace-label">Replace:</label>
            <input
              type="text"
              className="find-replace-input"
              placeholder="Replacement text..."
              value={options.replaceQuery}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, replaceQuery: e.target.value }))
              }
            />
          </div>

          {/* Options & scope */}
          <div className="find-replace-options-row">
            <label className="find-replace-check-label">
              <input
                type="checkbox"
                checked={options.caseSensitive}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, caseSensitive: e.target.checked }))
                }
              />
              Match Case
            </label>

            <label className="find-replace-check-label">
              <input
                type="checkbox"
                checked={options.wholeWord}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, wholeWord: e.target.checked }))
                }
              />
              Whole Word
            </label>

            <div className="find-replace-scope-selector">
              <label className="find-replace-check-label">
                <input
                  type="radio"
                  name="searchScope"
                  checked={options.scope === 'document'}
                  onChange={() =>
                    setOptions((prev) => ({ ...prev, scope: 'document' }))
                  }
                  disabled={!currentDocumentPath}
                />
                Current Document
              </label>
              <label className="find-replace-check-label">
                <input
                  type="radio"
                  name="searchScope"
                  checked={options.scope === 'manuscript'}
                  onChange={() =>
                    setOptions((prev) => ({ ...prev, scope: 'manuscript' }))
                  }
                />
                Entire Manuscript
              </label>
            </div>
          </div>

          {replaceCount !== null && (
            <div className="find-replace-status-banner">
              ✓ Successfully replaced {replaceCount} occurrence{replaceCount === 1 ? '' : 's'}.
            </div>
          )}

          {/* Actions */}
          <div className="find-replace-actions-bar">
            <div className="find-nav-buttons">
              <button
                type="button"
                className="find-btn"
                onClick={handlePrevMatch}
                disabled={matches.length === 0}
              >
                ▲ Previous
              </button>
              <button
                type="button"
                className="find-btn"
                onClick={handleNextMatch}
                disabled={matches.length === 0}
              >
                ▼ Next
              </button>
            </div>

            <div className="replace-buttons">
              <button
                type="button"
                className="find-btn find-btn-replace"
                onClick={handleReplaceNext}
                disabled={currentMatchIdx === -1}
              >
                Replace
              </button>
              <button
                type="button"
                className="find-btn find-btn-replace-all"
                onClick={handleReplaceAll}
                disabled={matches.length === 0}
              >
                Replace All ({matches.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
