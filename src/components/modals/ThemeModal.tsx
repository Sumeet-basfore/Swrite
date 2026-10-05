import React, { useEffect, useState, useMemo } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import {
  CURATED_THEMES,
  CURATED_PRESETS,
  MANUSCRIPT_FONTS,
  UI_FONTS,
  HEADING_FONTS,
  MONO_FONTS,
  getContrastRatio,
  validateThemeContrast,
  getCustomThemes,
  saveCustomTheme,
  deleteCustomTheme,
  getCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
  makeTheme
} from '../../styles/themes';
import { ThemeConfig, TypographyConfig, AppearancePreset, ThemeTokens } from '../../types';
import { 
  Check, X, ChevronDown, ChevronRight, RotateCcw, Bookmark, 
  Trash2, Sliders, Palette, Type, Sparkles, ShieldCheck, AlertTriangle
} from 'lucide-react';

// ─── Real Miniature Manuscript Preview Card ───────────────────────────────────

interface ThemePreviewCardProps {
  theme: ThemeConfig;
  isSelected: boolean;
  manuscriptFont?: string;
  headingFont?: string;
  onClick: () => void;
  onDelete?: () => void;
}

const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({ 
  theme, 
  isSelected, 
  manuscriptFont = '"Source Serif 4", serif', 
  headingFont = '"Cormorant Garamond", Georgia, serif', 
  onClick,
  onDelete
}) => {
  const c = theme.colors;

  return (
    <div
      onClick={onClick}
      className="group relative text-left w-full rounded-lg border transition-all duration-150 overflow-hidden cursor-pointer flex flex-col"
      style={{
        borderColor: isSelected ? c.accent : 'rgba(120, 120, 120, 0.2)',
        backgroundColor: c.background,
        boxShadow: isSelected ? `0 0 0 2px ${c.accent}` : undefined,
      }}
      title={`${theme.name} (${theme.category})`}
    >
      {/* Mini manuscript page container */}
      <div
        className="m-1.5 rounded-sm p-2 flex-1 flex flex-col justify-between overflow-hidden select-none border"
        style={{ 
          backgroundColor: c.editorPage || c.surface, 
          borderColor: c.border,
          minHeight: '120px'
        }}
      >
        {/* Real Markdown Hierarchy Sample */}
        <div className="space-y-1.5">
          {/* H1 Heading */}
          <div
            className="text-[9px] font-bold leading-tight truncate tracking-wide"
            style={{ 
              color: c.heading, 
              fontFamily: headingFont 
            }}
          >
            The Forgotten Name
          </div>

          {/* Dialogue / Body prose */}
          <div
            className="text-[7.5px] leading-snug"
            style={{ 
              color: c.editorPageText || c.text, 
              fontFamily: manuscriptFont 
            }}
          >
            Lucan stood beside the dark river. &ldquo;Do you remember me?&rdquo;
          </div>

          {/* Wikilink Chip */}
          <div>
            <span
              className="inline-block text-[6.5px] font-medium px-1 py-0.2 rounded-xs border-b"
              style={{
                color: c.wikilink,
                backgroundColor: c.accentMuted,
                borderColor: c.wikilink,
                borderBottomStyle: 'dotted'
              }}
            >
              [[Lucarion]]
            </span>
          </div>

          {/* Blockquote */}
          <div
            className="text-[7px] italic pl-1.5 py-0.5 border-l"
            style={{
              color: c.quote,
              borderColor: c.quoteBorder,
              backgroundColor: c.accentMuted
            }}
          >
            &gt; The water was silent.
          </div>

          {/* Bold text */}
          <div
            className="text-[7.5px] font-bold"
            style={{ 
              color: c.editorPageText || c.text, 
              fontFamily: manuscriptFont 
            }}
          >
            He turned.
          </div>
        </div>
      </div>

      {/* Label and Selected status */}
      <div 
        className="px-2.5 py-1.5 flex items-center justify-between border-t"
        style={{ borderColor: c.border, backgroundColor: c.surface }}
      >
        <div className="flex items-center space-x-1.5 truncate">
          <span 
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: c.accent }}
          />
          <span className="text-[10px] font-medium truncate" style={{ color: c.text }}>
            {theme.name}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 text-zinc-400 transition-opacity"
              title="Delete custom theme"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          )}
          {isSelected && (
            <Check className="w-3 h-3 flex-shrink-0" style={{ color: c.accent }} />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Preset Card ──────────────────────────────────────────────────────────────

interface PresetCardProps {
  preset: AppearancePreset;
  isActive: boolean;
  onApply: () => void;
  onDelete?: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({ preset, isActive, onApply, onDelete }) => {
  const allThemes = useMemo(() => [...CURATED_THEMES, ...getCustomThemes()], []);
  const presetTheme = allThemes.find(t => t.id === preset.themeId) || CURATED_THEMES[0];
  const c = presetTheme.colors;

  return (
    <div
      onClick={onApply}
      className={`group relative text-left rounded-lg border p-3 transition-all duration-150 cursor-pointer ${
        isActive 
          ? 'bg-zinc-800/80 border-zinc-500 shadow-xs' 
          : 'bg-[#18181c] border-zinc-800 hover:border-zinc-700 hover:bg-[#1e1e24]'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-zinc-100">{preset.name}</span>
          {preset.isCustom && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              Custom
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Swatches */}
          <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: c.background }} />
          <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: c.surface }} />
          <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: c.accent }} />
          
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 text-zinc-400 transition-opacity ml-1"
              title="Delete custom preset"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />}
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
        {preset.description}
      </p>

      <div className="mt-2 flex items-center space-x-2 text-[10px] text-zinc-500 font-mono">
        <span style={{ fontFamily: preset.manuscriptFont }} className="text-zinc-400">
          {preset.manuscriptFont.split('"')[1] || 'Serif'}
        </span>
        <span>•</span>
        <span>{preset.fontSize}px</span>
        <span>•</span>
        <span>{preset.lineHeight}lh</span>
      </div>
    </div>
  );
};

// ─── Font Selector ────────────────────────────────────────────────────────────

interface FontSelectorProps {
  label: string;
  value: string;
  options: { name: string; value: string; category?: string }[];
  onChange: (v: string) => void;
}

const FontSelector: React.FC<FontSelectorProps> = ({ label, value, options, onChange }) => (
  <div>
    <label className="block text-[10px] text-zinc-400 font-semibold mb-1 uppercase tracking-wider">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-[#18181c] border border-zinc-700/80 rounded-md px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"
    >
      {options.map(f => (
        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
          {f.name} {f.category ? `(${f.category})` : ''}
        </option>
      ))}
    </select>
    <div
      className="mt-1 text-xs text-zinc-400 truncate pl-0.5"
      style={{ fontFamily: value }}
    >
      The quiet silver harbor in twilight.
    </div>
  </div>
);

// ─── Slider Control ───────────────────────────────────────────────────────────

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({ label, value, min, max, step, unit, onChange }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">{label}</label>
      <span className="text-xs text-zinc-300 font-mono">{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full accent-zinc-300 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
    />
  </div>
);

// ─── Main Theme Modal ─────────────────────────────────────────────────────────

type AppearanceTab = 'themes' | 'typography' | 'presets' | 'advanced';

export const ThemeModal: React.FC = () => {
  const { 
    project, 
    setTheme, 
    updateTypography, 
    isThemeModalOpen, 
    setThemeModalOpen 
  } = useSwriteStore();

  const currentTheme = project.metadata.theme;
  const currentTypography = project.metadata.typography;

  const [activeTab, setActiveTab] = useState<AppearanceTab>('themes');
  const [themeCategoryFilter, setThemeCategoryFilter] = useState<'all' | 'dark' | 'light' | 'experimental' | 'custom'>('all');
  
  // Custom theme / preset creation state
  const [customPresetName, setCustomPresetName] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [customThemeName, setCustomThemeName] = useState('');
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Custom themes & presets from storage
  const customThemes = useMemo(() => getCustomThemes(), [refreshKey]);
  const customPresets = useMemo(() => getCustomPresets(), [refreshKey]);

  const allThemes = useMemo(() => [...CURATED_THEMES, ...customThemes], [customThemes]);
  const allPresets = useMemo(() => [...CURATED_PRESETS, ...customPresets], [customPresets]);

  // Contrast check memo
  const contrastReport = useMemo(() => {
    return validateThemeContrast(currentTheme);
  }, [currentTheme]);

  const bodyContrastRatio = useMemo(() => {
    return getContrastRatio(currentTheme.colors.text, currentTheme.colors.background);
  }, [currentTheme]);

  const headingContrastRatio = useMemo(() => {
    return getContrastRatio(currentTheme.colors.heading, currentTheme.colors.background);
  }, [currentTheme]);

  useEffect(() => {
    if (!isThemeModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setThemeModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isThemeModalOpen, setThemeModalOpen]);

  if (!isThemeModalOpen) return null;

  // Filtered themes
  const filteredThemes = allThemes.filter(t => {
    if (themeCategoryFilter === 'all') return true;
    if (themeCategoryFilter === 'custom') return customThemes.some(ct => ct.id === t.id);
    return t.category === themeCategoryFilter;
  });

  const handleApplyPreset = (preset: AppearancePreset) => {
    const targetTheme = allThemes.find(t => t.id === preset.themeId);
    if (targetTheme) setTheme(targetTheme);

    updateTypography({
      manuscriptFont: preset.manuscriptFont,
      fontFamily: preset.manuscriptFont,
      uiFont: preset.uiFont,
      headingFont: preset.headingFont,
      monoFont: preset.monoFont,
      fontSize: preset.fontSize,
      lineHeight: preset.lineHeight,
      paragraphIndent: preset.paragraphIndent,
      pageWidth: preset.pageWidth,
      textAlign: preset.textAlign || 'justify',
      dropCap: preset.dropCap ?? false,
      sceneOrnament: preset.sceneOrnament,
    });
  };

  const handleSaveCurrentPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPresetName.trim()) return;

    const newPreset: AppearancePreset = {
      id: `preset-custom-${Date.now()}`,
      name: customPresetName.trim(),
      description: `Custom preset combining ${currentTheme.name} theme with custom typography settings.`,
      themeId: currentTheme.id,
      manuscriptFont: currentTypography.manuscriptFont || currentTypography.fontFamily,
      uiFont: currentTypography.uiFont,
      headingFont: currentTypography.headingFont,
      monoFont: currentTypography.monoFont,
      fontSize: currentTypography.fontSize,
      lineHeight: currentTypography.lineHeight,
      paragraphIndent: currentTypography.paragraphIndent,
      pageWidth: currentTypography.pageWidth,
      textAlign: currentTypography.textAlign as any,
      dropCap: currentTypography.dropCap,
      sceneOrnament: currentTypography.sceneOrnament,
      isCustom: true
    };

    saveCustomPreset(newPreset);
    setCustomPresetName('');
    setIsSavingPreset(false);
    setRefreshKey(k => k + 1);
  };

  const handleSaveCurrentTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customThemeName.trim()) return;

    const newCustomTheme = makeTheme(
      `theme-custom-${Date.now()}`,
      customThemeName.trim(),
      'experimental',
      currentTheme.isDark,
      { ...currentTheme.colors }
    );

    saveCustomTheme(newCustomTheme);
    setTheme(newCustomTheme);
    setCustomThemeName('');
    setIsSavingTheme(false);
    setRefreshKey(k => k + 1);
  };

  const handleUpdateSemanticToken = (tokenKey: keyof ThemeTokens, value: string) => {
    const updatedColors = {
      ...currentTheme.colors,
      [tokenKey]: value
    };
    const updatedTheme = makeTheme(
      currentTheme.id,
      currentTheme.name,
      currentTheme.category,
      currentTheme.isDark,
      updatedColors,
      currentTheme.highlightColors
    );
    setTheme(updatedTheme);
  };

  const handleResetThemeToDefaults = () => {
    const baseTheme = CURATED_THEMES.find(t => t.id === currentTheme.id);
    if (baseTheme) {
      setTheme(baseTheme);
    }
  };

  const TABS: { id: AppearanceTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'themes', label: 'Themes', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'presets', label: 'Presets', icon: Sparkles },
    { id: 'advanced', label: 'Advanced Tokens', icon: Sliders },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div
        className="w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col rounded-xl border border-zinc-800 text-xs"
        style={{ backgroundColor: '#141417', maxHeight: '90vh', height: '780px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 bg-[#18181c]">
          <div className="flex items-center space-x-2.5">
            <Palette className="w-4 h-4 text-zinc-300" />
            <span className="font-semibold text-zinc-100 text-sm tracking-wide">
              Visual Identity & Editorial Typography
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Contrast Indicator Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
              <span className="text-zinc-400">Body Contrast:</span>
              <span className={bodyContrastRatio >= 4.5 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {bodyContrastRatio.toFixed(1)}:1
              </span>
              {bodyContrastRatio >= 4.5 ? (
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-400" />
              )}
            </div>

            <button
              onClick={() => setThemeModalOpen(false)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 px-6 bg-[#121215] space-x-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition-colors ${
                  isTabActive
                    ? 'border-zinc-200 text-zinc-100'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-6 bg-[#121215]">
          {/* ── 1. THEMES TAB ─────────────────────────────────────────── */}
          {activeTab === 'themes' && (
            <div className="space-y-6">
              {/* Category Filter Pills */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  {[
                    { id: 'all', label: 'All Themes' },
                    { id: 'dark', label: 'Dark / Ink (8)' },
                    { id: 'light', label: 'Light / Paper (7)' },
                    { id: 'experimental', label: 'Experimental (5)' },
                    { id: 'custom', label: `Custom (${customThemes.length})` },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setThemeCategoryFilter(cat.id as any)}
                      className={`px-3 py-1 rounded-md text-xs transition-colors ${
                        themeCategoryFilter === cat.id
                          ? 'bg-zinc-700 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsSavingTheme(true)}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded border border-zinc-700 hover:bg-zinc-800 text-zinc-200 text-xs transition-colors"
                >
                  <Bookmark className="w-3 h-3 text-amber-400" />
                  <span>Save Current as Custom</span>
                </button>
              </div>

              {/* Theme Cards Grid with Miniature Real Manuscript Previews */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredThemes.map(th => (
                  <ThemePreviewCard
                    key={th.id}
                    theme={th}
                    isSelected={currentTheme.id === th.id}
                    manuscriptFont={currentTypography.manuscriptFont || currentTypography.fontFamily}
                    headingFont={currentTypography.headingFont}
                    onClick={() => setTheme(th)}
                    onDelete={customThemes.some(ct => ct.id === th.id) ? () => {
                      deleteCustomTheme(th.id);
                      setRefreshKey(k => k + 1);
                    } : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── 2. TYPOGRAPHY TAB ─────────────────────────────────────── */}
          {activeTab === 'typography' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Fonts Grid */}
              <div className="rounded-lg border border-zinc-800 bg-[#16161a] p-5 space-y-4">
                <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Font Families
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FontSelector
                    label="Manuscript Body Font"
                    value={currentTypography.manuscriptFont || currentTypography.fontFamily}
                    options={MANUSCRIPT_FONTS}
                    onChange={v => updateTypography({ manuscriptFont: v, fontFamily: v })}
                  />
                  <FontSelector
                    label="Interface Navigation Font"
                    value={currentTypography.uiFont || ''}
                    options={UI_FONTS}
                    onChange={v => updateTypography({ uiFont: v })}
                  />
                  <FontSelector
                    label="Heading Font"
                    value={currentTypography.headingFont || ''}
                    options={HEADING_FONTS}
                    onChange={v => updateTypography({ headingFont: v })}
                  />
                  <FontSelector
                    label="Monospace Font"
                    value={currentTypography.monoFont || ''}
                    options={MONO_FONTS}
                    onChange={v => updateTypography({ monoFont: v })}
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="rounded-lg border border-zinc-800 bg-[#16161a] p-5 space-y-4">
                <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Layout & Spacing Metrics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <SliderControl
                    label="Font Size"
                    value={currentTypography.fontSize}
                    min={14}
                    max={24}
                    step={1}
                    unit="px"
                    onChange={v => updateTypography({ fontSize: v })}
                  />
                  <SliderControl
                    label="Line Height"
                    value={currentTypography.lineHeight}
                    min={1.4}
                    max={2.2}
                    step={0.05}
                    unit="×"
                    onChange={v => updateTypography({ lineHeight: v })}
                  />
                  <SliderControl
                    label="First-Line Indent"
                    value={currentTypography.paragraphIndent}
                    min={0}
                    max={2.5}
                    step={0.25}
                    unit="em"
                    onChange={v => updateTypography({ paragraphIndent: v })}
                  />
                  <SliderControl
                    label="Manuscript Max Width"
                    value={currentTypography.pageWidth}
                    min={550}
                    max={900}
                    step={25}
                    unit="px"
                    onChange={v => updateTypography({ pageWidth: v })}
                  />
                  <SliderControl
                    label="Letter Spacing"
                    value={currentTypography.letterSpacing || 0}
                    min={-0.02}
                    max={0.08}
                    step={0.005}
                    unit="em"
                    onChange={v => updateTypography({ letterSpacing: v })}
                  />
                  <SliderControl
                    label="Paragraph Spacing"
                    value={currentTypography.paragraphSpacing || 0}
                    min={0}
                    max={1.5}
                    step={0.1}
                    unit="em"
                    onChange={v => updateTypography({ paragraphSpacing: v })}
                  />
                </div>
              </div>

              {/* Editorial Options & Ornaments */}
              <div className="rounded-lg border border-zinc-800 bg-[#16161a] p-5 space-y-4">
                <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Editorial Presentation
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1">
                      Text Alignment
                    </label>
                    <select
                      value={currentTypography.textAlign || 'justify'}
                      onChange={e => updateTypography({ textAlign: e.target.value as any })}
                      className="w-full bg-[#18181c] border border-zinc-700/80 rounded-md px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"
                    >
                      <option value="justify">Justified (Book Tradition)</option>
                      <option value="left">Left (Modern Ragged)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1">
                      Scene Break Ornament
                    </label>
                    <select
                      value={currentTypography.sceneOrnament || '* * *'}
                      onChange={e => updateTypography({ sceneOrnament: e.target.value })}
                      className="w-full bg-[#18181c] border border-zinc-700/80 rounded-md px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"
                    >
                      <option value="* * *">* * * (Classic Asterisms)</option>
                      <option value="✦ ✦ ✦">✦ ✦ ✦ (Starlets)</option>
                      <option value="• • •">• • • (Minimal Bullets)</option>
                      <option value="§ § §">§ § § (Section Glyphs)</option>
                      <option value="— — —">— — — (Em Dashes)</option>
                      <option value="~ ~ ~">~ ~ ~ (Tildes)</option>
                      <option value="# # #"># # # (Hash Marks)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1">
                      Heading Scale
                    </label>
                    <select
                      value={currentTypography.headingScale || 'classic'}
                      onChange={e => updateTypography({ headingScale: e.target.value as any })}
                      className="w-full bg-[#18181c] border border-zinc-700/80 rounded-md px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"
                    >
                      <option value="classic">Classic (Traditional)</option>
                      <option value="modern">Modern (Compact)</option>
                      <option value="dramatic">Dramatic (Large Display)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentTypography.dropCap || false}
                      onChange={e => updateTypography({ dropCap: e.target.checked })}
                      className="w-3.5 h-3.5 accent-zinc-300 rounded"
                    />
                    <span className="text-xs text-zinc-300">
                      Enable Drop Cap on Chapter Opening
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentTypography.typewriterMode || false}
                      onChange={e => updateTypography({ typewriterMode: e.target.checked })}
                      className="w-3.5 h-3.5 accent-zinc-300 rounded"
                    />
                    <span className="text-xs text-zinc-300">
                      Enable Typewriter Centered Scrolling
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. PRESETS TAB ────────────────────────────────────────── */}
          {activeTab === 'presets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Curated Appearance Presets</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Coherent combinations of Theme, Typography, Font pairings, and Page density.
                  </p>
                </div>

                <button
                  onClick={() => setIsSavingPreset(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-medium transition-all shadow-xs"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Current as Preset</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {allPresets.map(preset => {
                  const isActive = preset.themeId === currentTheme.id && 
                    (preset.manuscriptFont === currentTypography.manuscriptFont || preset.manuscriptFont === currentTypography.fontFamily);
                  
                  return (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      isActive={isActive}
                      onApply={() => handleApplyPreset(preset)}
                      onDelete={preset.isCustom ? () => {
                        deleteCustomPreset(preset.id);
                        setRefreshKey(k => k + 1);
                      } : undefined}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 4. ADVANCED TOKENS TAB ─────────────────────────────────── */}
          {activeTab === 'advanced' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Header & Reset */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Semantic Token Customization ({currentTheme.name})
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Modify semantic tokens. Contrast ratios update live to protect readability.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleResetThemeToDefaults}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    onClick={() => setIsSavingTheme(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-zinc-200 hover:bg-white text-zinc-950 font-medium text-xs transition-colors"
                  >
                    <Bookmark className="w-3 h-3" />
                    <span>Save Theme</span>
                  </button>
                </div>
              </div>

              {/* Semantic Tokens Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'background', label: 'Background' },
                  { key: 'surface', label: 'Surface (Panels / Sidebar)' },
                  { key: 'elevatedSurface', label: 'Elevated Surface' },
                  { key: 'text', label: 'Body Text' },
                  { key: 'textMuted', label: 'Muted Text' },
                  { key: 'heading', label: 'Heading Text' },
                  { key: 'accent', label: 'Accent Color' },
                  { key: 'accentMuted', label: 'Muted Accent' },
                  { key: 'border', label: 'Border' },
                  { key: 'borderStrong', label: 'Border Strong' },
                  { key: 'link', label: 'Hyperlinks' },
                  { key: 'wikilink', label: 'Wikilinks' },
                  { key: 'quote', label: 'Quote Text' },
                  { key: 'quoteBorder', label: 'Quote Border' },
                  { key: 'code', label: 'Inline Code' },
                  { key: 'codeBackground', label: 'Code Background' },
                  { key: 'success', label: 'Success' },
                  { key: 'warning', label: 'Warning' },
                  { key: 'error', label: 'Error' },
                ].map(item => {
                  const val = currentTheme.colors[item.key as keyof ThemeTokens] || '#888888';
                  return (
                    <div key={item.key} className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800 bg-[#16161a]">
                      <div>
                        <div className="text-xs font-medium text-zinc-200">{item.label}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{val}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={val.startsWith('#') ? val : '#888888'}
                          onChange={e => handleUpdateSemanticToken(item.key as keyof ThemeTokens, e.target.value)}
                          className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Custom Preset Modal */}
      {isSavingPreset && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#18181c] border border-zinc-700 rounded-lg p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center space-x-2">
              <Bookmark className="w-4 h-4 text-emerald-400" />
              <span>Save Custom Appearance Preset</span>
            </h3>
            <form onSubmit={handleSaveCurrentPreset} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Preset Name</label>
                <input
                  type="text"
                  required
                  value={customPresetName}
                  onChange={e => setCustomPresetName(e.target.value)}
                  placeholder="e.g. My Gothic Obsidian"
                  className="w-full px-3 py-2 bg-[#222228] border border-zinc-700 rounded-md text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSavingPreset(false)}
                  className="px-3 py-1.5 rounded border border-zinc-700 text-zinc-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Custom Theme Modal */}
      {isSavingTheme && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#18181c] border border-zinc-700 rounded-lg p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center space-x-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              <span>Save as Custom Theme</span>
            </h3>
            <form onSubmit={handleSaveCurrentTheme} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Theme Name</label>
                <input
                  type="text"
                  required
                  value={customThemeName}
                  onChange={e => setCustomThemeName(e.target.value)}
                  placeholder="e.g. Velvet Night"
                  className="w-full px-3 py-2 bg-[#222228] border border-zinc-700 rounded-md text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSavingTheme(false)}
                  className="px-3 py-1.5 rounded border border-zinc-700 text-zinc-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                >
                  Save Theme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
