import React, { useState } from 'react';
import { OutputFormat, PreflightCheckResult, PublicationProfile } from '../../types/ipc';
import { SettingsSection } from '../types';

interface PublishSettingsPanelProps {
  profiles: PublicationProfile[];
  activeProfile: PublicationProfile | null;
  preflight: PreflightCheckResult | null;
  onSelectProfile: (id: string) => void;
  onUpdateProfile: (updater: (prev: PublicationProfile) => PublicationProfile) => void;
  onDuplicateProfile: (id: string, newName: string) => void;
  onDeleteProfile: (id: string) => void;
  onOpenPreflight: () => void;
  onOpenExport: () => void;
}

export const PublishSettingsPanel: React.FC<PublishSettingsPanelProps> = ({
  profiles,
  activeProfile,
  preflight,
  onSelectProfile,
  onUpdateProfile,
  onDuplicateProfile,
  onDeleteProfile,
  onOpenPreflight,
  onOpenExport,
}) => {
  const [openSections, setOpenSections] = useState<Record<SettingsSection, boolean>>({
    profile: true,
    page: false,
    typography: true,
    chapter_style: false,
    headers_footers: false,
    front_back_matter: false,
    advanced: false,
  });

  const toggleSection = (sec: SettingsSection) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  if (!activeProfile) {
    return (
      <div className="publish-settings-sidebar">
        <p className="p-4">No publication profile loaded.</p>
      </div>
    );
  }

  const handleDuplicate = () => {
    const name = prompt('Enter name for custom profile:', `${activeProfile.name} (Custom)`);
    if (name) {
      onDuplicateProfile(activeProfile.id, name);
    }
  };

  return (
    <aside className="publish-settings-sidebar">
      {/* Top Profile Switcher */}
      <div className="publish-profile-picker-box">
        <label className="publish-section-label">Publication Profile</label>
        <div className="publish-profile-select-row">
          <select
            className="publish-profile-select"
            value={activeProfile.id}
            onChange={(e) => onSelectProfile(e.target.value)}
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.is_builtin ? '★' : '(Custom)'}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="publish-btn-icon"
            onClick={handleDuplicate}
            title="Duplicate as custom profile"
          >
            📋
          </button>
          {!activeProfile.is_builtin && (
            <button
              type="button"
              className="publish-btn-icon danger"
              onClick={() => {
                if (confirm(`Delete custom profile "${activeProfile.name}"?`)) {
                  onDeleteProfile(activeProfile.id);
                }
              }}
              title="Delete custom profile"
            >
              🗑
            </button>
          )}
        </div>
        <div className="publish-profile-desc">{activeProfile.description}</div>
      </div>

      {/* Main Settings Accordions */}
      <div className="publish-accordion-container">
        {/* 1. Format & Output */}
        <div className="publish-accordion-item">
          <div className="publish-accordion-header" onClick={() => toggleSection('profile')}>
            <span>Profile & Output Format</span>
            <span className="accordion-arrow">{openSections.profile ? '▼' : '▶'}</span>
          </div>
          {openSections.profile && (
            <div className="publish-accordion-content">
              <div className="publish-form-row">
                <label>Format</label>
                <select
                  value={activeProfile.format}
                  onChange={(e) =>
                    onUpdateProfile((p) => ({
                      ...p,
                      format: e.target.value as OutputFormat,
                    }))
                  }
                >
                  <option value="pdf">Print PDF</option>
                  <option value="docx">Microsoft Word (DOCX)</option>
                  <option value="epub">Digital EPUB 3</option>
                  <option value="markdown">Plain Markdown</option>
                  <option value="txt">Plain Text</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 2. Page & Margins */}
        <div className="publish-accordion-item">
          <div className="publish-accordion-header" onClick={() => toggleSection('page')}>
            <span>Page Size & Margins</span>
            <span className="accordion-arrow">{openSections.page ? '▼' : '▶'}</span>
          </div>
          {openSections.page && (
            <div className="publish-accordion-content">
              <div className="publish-form-row">
                <label>Trim Preset</label>
                <select
                  value={activeProfile.page_size.preset}
                  onChange={(e) => {
                    const preset = e.target.value;
                    let w = 6.0;
                    let h = 9.0;
                    if (preset === '5.5x8.5') {
                      w = 5.5;
                      h = 8.5;
                    } else if (preset === 'A5') {
                      w = 5.83;
                      h = 8.27;
                    } else if (preset === 'Letter') {
                      w = 8.5;
                      h = 11.0;
                    }
                    onUpdateProfile((p) => ({
                      ...p,
                      page_size: { width_in: w, height_in: h, preset },
                    }));
                  }}
                >
                  <option value="6x9">Trade Paperback (6 × 9 in)</option>
                  <option value="5.5x8.5">Digest (5.5 × 8.5 in)</option>
                  <option value="A5">Classic A5 (5.83 × 8.27 in)</option>
                  <option value="Letter">US Letter (8.5 × 11 in)</option>
                </select>
              </div>

              <div className="publish-grid-2">
                <div className="publish-form-row">
                  <label>Top Margin (in)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={activeProfile.margins.top_in}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        margins: { ...p.margins, top_in: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="publish-form-row">
                  <label>Bottom Margin (in)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={activeProfile.margins.bottom_in}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        margins: { ...p.margins, bottom_in: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="publish-grid-2">
                <div className="publish-form-row">
                  <label>Inside / Gutter (in)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={activeProfile.margins.inside_in}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        margins: { ...p.margins, inside_in: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="publish-form-row">
                  <label>Outside Margin (in)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={activeProfile.margins.outside_in}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        margins: { ...p.margins, outside_in: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Typography */}
        <div className="publish-accordion-item">
          <div className="publish-accordion-header" onClick={() => toggleSection('typography')}>
            <span>Typography</span>
            <span className="accordion-arrow">{openSections.typography ? '▼' : '▶'}</span>
          </div>
          {openSections.typography && (
            <div className="publish-accordion-content">
              <div className="publish-form-row">
                <label>Body Font</label>
                <select
                  value={activeProfile.typography.body_font}
                  onChange={(e) =>
                    onUpdateProfile((p) => ({
                      ...p,
                      typography: { ...p.typography, body_font: e.target.value },
                    }))
                  }
                >
                  <option value="Garamond">Garamond</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Palatino">Palatino</option>
                  <option value="Baskerville">Baskerville</option>
                  <option value="Courier Prime">Courier Prime</option>
                  <option value="serif">Standard Serif</option>
                  <option value="sans-serif">Standard Sans-Serif</option>
                </select>
              </div>

              <div className="publish-grid-2">
                <div className="publish-form-row">
                  <label>Font Size (pt)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={activeProfile.typography.font_size_pt}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        typography: { ...p.typography, font_size_pt: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="publish-form-row">
                  <label>Line Spacing</label>
                  <input
                    type="number"
                    step="0.05"
                    value={activeProfile.typography.line_height}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        typography: { ...p.typography, line_height: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="publish-grid-2">
                <div className="publish-form-row">
                  <label>First-Line Indent (in)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={activeProfile.typography.paragraph_indent_in}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        typography: {
                          ...p.typography,
                          paragraph_indent_in: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div className="publish-form-row">
                  <label>Alignment</label>
                  <select
                    value={activeProfile.typography.text_align}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        typography: { ...p.typography, text_align: e.target.value },
                      }))
                    }
                  >
                    <option value="justify">Justified</option>
                    <option value="left">Flush Left (Ragged Right)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Chapter Style */}
        <div className="publish-accordion-item">
          <div className="publish-accordion-header" onClick={() => toggleSection('chapter_style')}>
            <span>Chapter Openings</span>
            <span className="accordion-arrow">{openSections.chapter_style ? '▼' : '▶'}</span>
          </div>
          {openSections.chapter_style && (
            <div className="publish-accordion-content">
              <div className="publish-form-row">
                <label>Numbering</label>
                <select
                  value={activeProfile.chapter_style.numbering_style}
                  onChange={(e) =>
                    onUpdateProfile((p) => ({
                      ...p,
                      chapter_style: { ...p.chapter_style, numbering_style: e.target.value },
                    }))
                  }
                >
                  <option value="words">Words (CHAPTER ONE)</option>
                  <option value="arabic">Arabic (Chapter 1)</option>
                  <option value="roman">Roman (Chapter I)</option>
                  <option value="none">None (Title Only)</option>
                </select>
              </div>

              <div className="publish-grid-2">
                <div className="publish-form-row">
                  <label>Alignment</label>
                  <select
                    value={activeProfile.chapter_style.alignment}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        chapter_style: { ...p.chapter_style, alignment: e.target.value },
                      }))
                    }
                  >
                    <option value="center">Centered</option>
                    <option value="left">Left Aligned</option>
                  </select>
                </div>
                <div className="publish-form-row">
                  <label>Title Case</label>
                  <select
                    value={activeProfile.chapter_style.title_case}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        chapter_style: { ...p.chapter_style, title_case: e.target.value },
                      }))
                    }
                  >
                    <option value="uppercase">ALL CAPS</option>
                    <option value="titlecase">Title Case</option>
                  </select>
                </div>
              </div>

              <div className="publish-form-row">
                <label>Ornament / Symbol</label>
                <input
                  type="text"
                  value={activeProfile.chapter_style.ornament || ''}
                  placeholder="e.g., ❦ or ✦ ✦ ✦"
                  onChange={(e) =>
                    onUpdateProfile((p) => ({
                      ...p,
                      chapter_style: {
                        ...p.chapter_style,
                        ornament: e.target.value || undefined,
                      },
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. Headers & Footers */}
        <div className="publish-accordion-item">
          <div className="publish-accordion-header" onClick={() => toggleSection('headers_footers')}>
            <span>Headers & Running Footers</span>
            <span className="accordion-arrow">{openSections.headers_footers ? '▼' : '▶'}</span>
          </div>
          {openSections.headers_footers && (
            <div className="publish-accordion-content">
              <div className="publish-checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={activeProfile.headers_footers.show_header}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        headers_footers: {
                          ...p.headers_footers,
                          show_header: e.target.checked,
                        },
                      }))
                    }
                  />
                  Show Running Headers
                </label>
              </div>

              <div className="publish-checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={activeProfile.headers_footers.show_footer}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        headers_footers: {
                          ...p.headers_footers,
                          show_footer: e.target.checked,
                        },
                      }))
                    }
                  />
                  Show Page Number Footer
                </label>
              </div>

              <div className="publish-checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={activeProfile.headers_footers.odd_even_different}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        headers_footers: {
                          ...p.headers_footers,
                          odd_even_different: e.target.checked,
                        },
                      }))
                    }
                  />
                  Different Odd / Even Headers
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 6. Front Matter */}
        <div className="publish-accordion-item">
          <div className="publish-accordion-header" onClick={() => toggleSection('front_back_matter')}>
            <span>Front & Back Matter</span>
            <span className="accordion-arrow">{openSections.front_back_matter ? '▼' : '▶'}</span>
          </div>
          {openSections.front_back_matter && (
            <div className="publish-accordion-content">
              <div className="publish-checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={activeProfile.front_matter.include_title_page}
                    onChange={(e) =>
                      onUpdateProfile((p) => ({
                        ...p,
                        front_matter: {
                          ...p.front_matter,
                          include_title_page: e.target.checked,
                        },
                      }))
                    }
                  />
                  Include Title Page
                </label>
              </div>

              <div className="publish-form-row">
                <label>Book Title</label>
                <input
                  type="text"
                  value={activeProfile.front_matter.title}
                  onChange={(e) =>
                    onUpdateProfile((p) => ({
                      ...p,
                      front_matter: { ...p.front_matter, title: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="publish-form-row">
                <label>Author Name</label>
                <input
                  type="text"
                  value={activeProfile.front_matter.author}
                  onChange={(e) =>
                    onUpdateProfile((p) => ({
                      ...p,
                      front_matter: { ...p.front_matter, author: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="publish-form-row">
                <label>Copyright Text (Optional)</label>
                <textarea
                  rows={2}
                  value={activeProfile.front_matter.copyright || ''}
                  onChange={(e) =>
                    onUpdateProfile((p) => ({
                      ...p,
                      front_matter: {
                        ...p.front_matter,
                        copyright: e.target.value || undefined,
                      },
                    }))
                  }
                />
              </div>

              <div className="publish-form-row">
                <label>Dedication (Optional)</label>
                <textarea
                  rows={2}
                  value={activeProfile.front_matter.dedication || ''}
                  placeholder="For..."
                  onChange={(e) =>
                    onUpdateProfile((p) => ({
                      ...p,
                      front_matter: {
                        ...p.front_matter,
                        dedication: e.target.value || undefined,
                      },
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preflight & Export Action Bar at Bottom of Sidebar */}
      <div className="publish-bottom-action-box">
        <button
          type="button"
          className="publish-btn-preflight"
          onClick={onOpenPreflight}
        >
          <span>Preflight:</span>
          {preflight?.is_valid ? (
            <span className="preflight-tag-success">✓ Clean</span>
          ) : (
            <span className="preflight-tag-warning">
              ⚠ {preflight?.blocking_count || 0} Blockers
            </span>
          )}
        </button>

        <button
          type="button"
          className="publish-btn-export-trigger"
          onClick={onOpenExport}
        >
          Export {activeProfile.format.toUpperCase()} ↗
        </button>
      </div>
    </aside>
  );
};
