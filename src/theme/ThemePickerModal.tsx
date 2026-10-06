import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTheme } from './useTheme';
import { ThemeDefinition, ThemeId, ThemeMode } from './types';
import './theme.css';

interface ThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemePickerModal: React.FC<ThemePickerModalProps> = ({ isOpen, onClose }) => {
  const { themeId, setTheme, allThemes } = useTheme();
  const [selectedId, setSelectedId] = useState<ThemeId>(themeId);
  const [filterMode, setFilterMode] = useState<'all' | ThemeMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  if (!isOpen) return null;

  const handleSelect = (id: ThemeId) => {
    setSelectedId(id);
    setTheme(id);
  };

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
            ✕
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
              All (15)
            </button>
            <button
              className={`theme-filter-btn ${filterMode === 'light' ? 'active' : ''}`}
              onClick={() => setFilterMode('light')}
            >
              Light
            </button>
            <button
              className={`theme-filter-btn ${filterMode === 'dark' ? 'active' : ''}`}
              onClick={() => setFilterMode('dark')}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="theme-picker-body">
          <div className="theme-grid">
            {filteredThemes.map((t: ThemeDefinition) => {
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
                  {isSelected && <div className="theme-card-check">✓</div>}
                </div>
              );
            })}
          </div>
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
