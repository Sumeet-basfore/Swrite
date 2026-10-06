import React, { useState } from 'react';
import { EditorMode, EditorStats, SaveStatus } from '../core/types';
import { TypographyPresetId, TYPOGRAPHY_PRESETS } from './typographyPresets';
import {
  BookOpen,
  Edit3,
  Eye,
  Book,
  Check,
  AlertCircle,
  RefreshCw,
  ListTree,
  Type,
  Target,
  Sparkles,
  Crosshair,
} from 'lucide-react';

export interface StatusBarProps {
  stats: EditorStats;
  saveStatus: SaveStatus;
  mode: EditorMode;
  focusMode: boolean;
  readingMode: boolean;
  currentPreset: TypographyPresetId;
  sessionGoalWords?: number;
  sessionDeltaWords?: number;
  onEditSessionGoal?: () => void;
  themeName?: string;
  usingThemePairing?: boolean;
  typewriterLock?: boolean;
  onToggleTypewriterLock?: () => void;
  onToggleMode: () => void;
  onToggleFocusMode: () => void;
  onToggleReadingMode: () => void;
  onToggleOutline: () => void;
  onSelectPreset: (preset: TypographyPresetId) => void;
  onSelectThemePairing?: () => void;
  onSaveNow?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  stats,
  saveStatus,
  mode,
  focusMode,
  readingMode,
  currentPreset,
  sessionGoalWords,
  sessionDeltaWords,
  onEditSessionGoal,
  themeName,
  usingThemePairing,
  typewriterLock,
  onToggleTypewriterLock,
  onToggleMode,
  onToggleFocusMode,
  onToggleReadingMode,
  onToggleOutline,
  onSelectPreset,
  onSelectThemePairing,
  onSaveNow,
}) => {
  const [showPresetMenu, setShowPresetMenu] = useState(false);

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

        {sessionGoalWords && sessionGoalWords > 0 && (
          <>
            <span className="status-divider">·</span>
            {onEditSessionGoal ? (
              <button
                onClick={onEditSessionGoal}
                className="status-btn"
                title={`Session: +${sessionDeltaWords ?? 0} words toward a ${sessionGoalWords} goal. Click to change the goal.`}
              >
                <Target size={12} className="status-icon" />
                <span>
                  +{sessionDeltaWords ?? 0} · {Math.min(100, Math.round(((sessionDeltaWords ?? 0) / sessionGoalWords) * 100))}% goal
                </span>
              </button>
            ) : (
              <span
                className="status-item text-muted"
                title={`Session progress: ${stats.wordCount} / ${sessionGoalWords} words`}
              >
                <Target size={12} className="status-icon" />
                <span>
                  {Math.min(100, Math.round((stats.wordCount / sessionGoalWords) * 100))}% goal
                </span>
              </span>
            )}
          </>
        )}

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

        {/* Outline / Bookmarks button */}
        <button
          onClick={onToggleOutline}
          className="status-btn"
          title="Document Outline & Bookmarks (Mod+Shift+O)"
        >
          <ListTree size={13} className="status-icon" />
          <span>Outline</span>
        </button>

        {/* Typography Preset selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowPresetMenu((v) => !v)}
            className="status-btn"
            title="Typography Preset"
          >
            {usingThemePairing ? (
              <Sparkles size={13} className="status-icon" />
            ) : (
              <Type size={13} className="status-icon" />
            )}
            <span>{usingThemePairing ? `${themeName || 'Theme'} pairing` : TYPOGRAPHY_PRESETS[currentPreset]?.name || 'Preset'}</span>
          </button>

          {showPresetMenu && (
            <div
              className="preset-dropdown-menu"
              onMouseLeave={() => setShowPresetMenu(false)}
            >
              {onSelectThemePairing && (
                <button
                  className={`preset-option ${usingThemePairing ? 'active' : ''}`}
                  onClick={() => {
                    onSelectThemePairing();
                    setShowPresetMenu(false);
                  }}
                >
                  <span className="preset-name">{themeName || 'Theme'} pairing</span>
                  <span className="preset-desc">Follow the active theme's typography</span>
                </button>
              )}
              {(Object.keys(TYPOGRAPHY_PRESETS) as TypographyPresetId[]).map((pid) => (
                <button
                  key={pid}
                  className={`preset-option ${pid === currentPreset && !usingThemePairing ? 'active' : ''}`}
                  onClick={() => {
                    onSelectPreset(pid);
                    setShowPresetMenu(false);
                  }}
                >
                  <span className="preset-name">{TYPOGRAPHY_PRESETS[pid].name}</span>
                  <span className="preset-desc">{TYPOGRAPHY_PRESETS[pid].description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="status-divider">·</span>

        {/* Typewriter Lock button */}
        <button
          onClick={onToggleTypewriterLock}
          className={`status-btn ${typewriterLock ? 'active' : ''}`}
          title="Typewriter lock: dim every paragraph except the one being written (stays on)"
        >
          <Crosshair size={13} className="status-icon" />
          <span>Lock</span>
        </button>

        {/* Reading Mode button */}
        <button
          onClick={onToggleReadingMode}
          className={`status-btn ${readingMode ? 'active' : ''}`}
          title="Toggle Reading Mode (Mod+Shift+R)"
        >
          <Book size={13} className="status-icon" />
          <span>Read</span>
        </button>

        {/* Focus Mode button */}
        <button
          onClick={onToggleFocusMode}
          className={`status-btn ${focusMode ? 'active' : ''}`}
          title="Toggle Focus Mode (Mod+Shift+F)"
        >
          <Eye size={13} className="status-icon" />
          <span>Focus</span>
        </button>

        {/* Mode button */}
        <button
          onClick={onToggleMode}
          className={`status-btn ${mode === 'source' ? 'active' : ''}`}
          title="Toggle Markdown Source Mode (Mod+/)"
        >
          <Edit3 size={13} className="status-icon" />
          <span>{mode === 'rich' ? 'Rich' : 'Markdown'}</span>
        </button>
      </div>
    </footer>
  );
};
