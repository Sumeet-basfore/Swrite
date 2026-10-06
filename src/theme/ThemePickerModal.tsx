import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { useTheme } from './useTheme';
import { ThemeDefinition, ThemeId, ThemeMode, ThemeMoodGroup } from './types';
import './theme.css';

const RECENT_KEY = 'swrite_recent_themes';
const MAX_RECENT = 5;

const MOOD_ORDER: ThemeMoodGroup[] = [
  'Studio Essentials',
  'Paper & Print',
  'Calm & Natural',
  'Night Writing',
  'Gothic & Moody',
  'Vivid & Playful',
];

function loadRecent(): ThemeId[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed.filter((x) => typeof x === 'string') as ThemeId[])
      : [];
  } catch {
    return [];
  }
}

interface ThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemePickerModal: React.FC<ThemePickerModalProps> = ({ isOpen, onClose }) => {
  const { themeId, setTheme, allThemes } = useTheme();
  const [selectedId, setSelectedId] = useState<ThemeId>(themeId);
  const [filterMode, setFilterMode] = useState<'all' | ThemeMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentIds, setRecentIds] = useState<ThemeId[]>(() => loadRecent());
  const searchInputRef = useRef<HTMLInputElement>(null);

  const lightCount = useMemo(() => allThemes.filter((t) => t.mode === 'light').length, [allThemes]);
  const darkCount = useMemo(() => allThemes.filter((t) => t.mode === 'dark').length, [allThemes]);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(themeId);
      setSearchQuery('');
      setFilterMode('all');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, themeId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredThemes = useMemo(() => {
    return allThemes.filter((t) => {
      const matchesMode = filterMode === 'all' || t.mode === filterMode;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query);
      return matchesMode && matchesSearch;
    });
  }, [allThemes, filterMode, searchQuery]);

  const handleSelect = (id: ThemeId) => {
    setSelectedId(id);
    setTheme(id);
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((r) => r !== id)].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const groupedThemes = useMemo(() => {
    const groups = new Map<string, ThemeDefinition[]>();
    for (const t of filteredThemes) {
      const key = t.moodGroup || 'Studio Essentials';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return MOOD_ORDER.filter((g) => groups.has(g)).map((g) => ({
      group: g,
      themes: groups.get(g)!,
    }));
  }, [filteredThemes]);

  const recentThemes = useMemo(
    () =>
      recentIds
        .map((id) => allThemes.find((t) => t.id === id))
        .filter((t): t is ThemeDefinition => !!t)
        .filter((t) => (filterMode === 'all' || t.mode === filterMode)),
    [recentIds, allThemes, filterMode]
  );

  const renderThemeCard = (t: ThemeDefinition) => {
    const isSelected = selectedId === t.id;
    const [c1, c2, c3] = t.swatchColors;
    return (
      <div
        key={t.id}
        className={`theme-card ${isSelected ? 'active' : ''}`}
        onClick={() => handleSelect(t.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect(t.id);
          }
        }}
        data-theme-id={t.id}
      >
        <div className="theme-card-preview">
          <div className="theme-swatch" style={{ backgroundColor: c1 }} />
          <div className="theme-swatch" style={{ backgroundColor: c2 }} />
          <div className="theme-swatch" style={{ backgroundColor: c3 }} />
        </div>
        <div className="theme-card-header">
          <span className="theme-card-name">{t.name}</span>
          <span className="theme-mode-badge">{t.mode}</span>
        </div>
        <p className="theme-card-desc">{t.description}</p>
        <p
          className="theme-card-typespec"
          style={{
            backgroundColor: t.tokens.editorCanvasBg,
            color: t.tokens.editorTextColor,
            borderLeft: `3px solid ${t.tokens.blockquoteBorder}`,
            fontFamily: t.typography?.bodyStack,
          }}
        >
          Ag — The quick brown fox
        </p>
        {isSelected && <div className="theme-card-check"><Check size={12} /></div>}
      </div>
    );
  };

  // NOTE: this early return must stay AFTER all hooks above —
  // returning before a useMemo/useState breaks hook order and blank-screens.
  if (!isOpen) return null;

  return (
    <div className="theme-picker-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Theme Picker">
      <div className="theme-picker-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="theme-picker-header">
          <h2 className="theme-picker-title">Personal Themes</h2>
          <button
            className="theme-picker-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="theme-picker-toolbar">
          <input
            ref={searchInputRef}
            type="text"
            className="theme-search-input"
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="theme-filter-tabs">
            <button
              className={`theme-filter-btn ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              All ({allThemes.length})
            </button>
            <button
              className={`theme-filter-btn ${filterMode === 'light' ? 'active' : ''}`}
              onClick={() => setFilterMode('light')}
            >
              Light ({lightCount})
            </button>
            <button
              className={`theme-filter-btn ${filterMode === 'dark' ? 'active' : ''}`}
              onClick={() => setFilterMode('dark')}
            >
              Dark ({darkCount})
            </button>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="theme-picker-body">
          {!searchQuery.trim() && recentThemes.length > 0 && (
            <div className="theme-recent-row">
              <div className="theme-group-title">Recently used</div>
              <div className="theme-recent-chips">
                {recentThemes.map((t) => (
                  <button
                    key={t.id}
                    className={`theme-recent-chip ${selectedId === t.id ? 'active' : ''}`}
                    onClick={() => handleSelect(t.id)}
                    title={t.description}
                  >
                    <span
                      className="theme-recent-dot"
                      style={{ backgroundColor: t.swatchColors[2] }}
                    />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {groupedThemes.map(({ group, themes }) => (
            <div key={group} className="theme-group">
              <div className="theme-group-title">
                {group}
                <span className="theme-group-count">{themes.length}</span>
              </div>
              <div className="theme-grid">{themes.map(renderThemeCard)}</div>
            </div>
          ))}
          {filteredThemes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              No themes matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="theme-picker-footer">
          <span className="theme-footer-hint">
            Themes personalize your writing environment without altering exported manuscript documents.
          </span>
          <button className="theme-apply-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
