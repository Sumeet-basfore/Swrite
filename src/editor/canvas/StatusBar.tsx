import React from 'react';
import { EditorMode, EditorStats, SaveStatus } from '../core/types';
import { BookOpen, Edit3, Eye, Check, AlertCircle, RefreshCw } from 'lucide-react';

export interface StatusBarProps {
  stats: EditorStats;
  saveStatus: SaveStatus;
  mode: EditorMode;
  focusMode: boolean;
  onToggleMode: () => void;
  onToggleFocusMode: () => void;
  onSaveNow?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  stats,
  saveStatus,
  mode,
  focusMode,
  onToggleMode,
  onToggleFocusMode,
  onSaveNow,
}) => {
  const renderSaveIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="status-item save-saving" title="Saving changes to disk...">
            <RefreshCw className="status-icon spin" size={13} />
            <span>Saving...</span>
          </span>
        );
      case 'saved':
      case 'clean':
        return (
          <span className="status-item save-clean" title="All changes saved to disk">
            <Check className="status-icon text-emerald-500" size={13} />
            <span>Saved</span>
          </span>
        );
      case 'dirty':
        return (
          <button
            onClick={onSaveNow}
            className="status-item save-dirty cursor-pointer hover:underline"
            title="Unsaved changes (Click or press Mod+S to save immediately)"
          >
            <span className="dirty-dot" />
            <span>Unsaved</span>
          </button>
        );
      case 'conflict':
        return (
          <span className="status-item save-conflict text-amber-500" title="External change detected!">
            <AlertCircle className="status-icon" size={13} />
            <span>External Change</span>
          </span>
        );
      case 'error':
        return (
          <span className="status-item save-error text-rose-500" title="Error saving file">
            <AlertCircle className="status-icon" size={13} />
            <span>Save Error</span>
          </span>
        );
    }
  };

  return (
    <footer className="swrite-status-bar">
      <div className="status-left">
        <span className="status-item font-medium">
          {stats.wordCount.toLocaleString()} {stats.wordCount === 1 ? 'word' : 'words'}
        </span>
        <span className="status-divider">·</span>
        <span className="status-item text-muted">
          {stats.charCount.toLocaleString()} chars
        </span>
        <span className="status-divider">·</span>
        <span className="status-item text-muted" title="Estimated reading time">
          <BookOpen size={13} className="status-icon" />
          {stats.readingTimeMinutes} min read
        </span>
      </div>

      <div className="status-right">
        {renderSaveIndicator()}

        <span className="status-divider">·</span>

        <button
          onClick={onToggleMode}
          className={`status-btn ${mode === 'source' ? 'active' : ''}`}
          title="Toggle Markdown Source Mode (Ctrl+/)"
        >
          <Edit3 size={13} className="status-icon" />
          <span>{mode === 'rich' ? 'Rich' : 'Markdown'}</span>
        </button>

        <button
          onClick={onToggleFocusMode}
          className={`status-btn ${focusMode ? 'active' : ''}`}
          title="Toggle Focus Mode (Ctrl+Shift+F)"
        >
          <Eye size={13} className="status-icon" />
          <span>Focus</span>
        </button>
      </div>
    </footer>
  );
};
