import React, { useState, useMemo, useEffect } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { 
  CompilerService, 
  PUBLICATION_PRESETS, 
  DEFAULT_PUBLICATION_OPTIONS 
} from '../../services/compilerService';
import { 
  PublicationOptions, 
  PublicationPreset,
  ExportFormat, 
  TrimSize, 
  ExportFontFamily, 
  SceneBreakStyle,
  ChapterHeaderStyle,
  HeaderStyle,
  FooterStyle
} from '../../types';
import { 
  X, Download, BookOpen, Check, AlertCircle, AlertTriangle, 
  Info, Sliders, FileText, CheckCircle2, ChevronRight, Layers, 
  FileCheck, Sparkles, Copy, Trash2, RotateCcw, Save, ShieldCheck,
  Bookmark, Eye, Settings2
} from 'lucide-react';

type ConfigMode = 'quick' | 'customize' | 'advanced';
type PreviewPage = 'chapter1' | 'chapter2' | 'title' | 'copyright' | 'dedication' | 'toc' | 'backmatter';

export const CompilerModal: React.FC = () => {
  const { project, isCompilerModalOpen, setCompilerModalOpen, createManualSnapshot } = useSwriteStore();

  const [presets, setPresets] = useState<PublicationPreset[]>(() => CompilerService.getAllPublicationPresets());

  const [options, setOptions] = useState<PublicationOptions>(() => {
    return {
      ...DEFAULT_PUBLICATION_OPTIONS,
      runningHeaderTitle: project.metadata?.title || 'Manuscript',
      runningHeaderAuthor: project.metadata?.author || 'Author',
      frontMatter: {
        ...DEFAULT_PUBLICATION_OPTIONS.frontMatter,
        copyrightYear: new Date().getFullYear().toString(),
        publisherName: project.metadata?.author ? `${project.metadata.author} Press` : 'Independent Edition',
      },
    };
  });

  const [configMode, setConfigMode] = useState<ConfigMode>('quick');
  const [previewPage, setPreviewPage] = useState<PreviewPage>('chapter1');
  const [customProfileInputName, setCustomProfileInputName] = useState('');
  const [lastExportSnapshotTime, setLastExportSnapshotTime] = useState(0);

  // Sync presets list on modal open
  useEffect(() => {
    if (isCompilerModalOpen) {
      setPresets(CompilerService.getAllPublicationPresets());
    }
  }, [isCompilerModalOpen]);

  // Preflight validation memo
  const preflightReport = useMemo(() => {
    return CompilerService.validateManuscript(project, options);
  }, [project, options]);

  const allChapters = project.acts.flatMap(a => a.chapters.map(c => ({ ...c, actTitle: a.title, actId: a.id })));

  const handleApplyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    setOptions(prev => ({
      ...prev,
      ...preset.options,
      presetId,
      customProfileName: preset.name,
      isCustom: preset.isCustom,
      frontMatter: { ...prev.frontMatter, ...preset.options.frontMatter },
      backMatter: { ...prev.backMatter, ...preset.options.backMatter },
    }));
  };

  const handleToggleChapter = (chapterId: string) => {
    const current = options.selectedChapterIds || allChapters.map(c => c.id);
    const exists = current.includes(chapterId);
    const updated = exists ? current.filter(id => id !== chapterId) : [...current, chapterId];
    setOptions(prev => ({ ...prev, selectedChapterIds: updated }));
  };

  const handleToggleAllChapters = () => {
    const allSelected = !options.selectedChapterIds || options.selectedChapterIds.length === allChapters.length;
    setOptions(prev => ({
      ...prev,
      selectedChapterIds: allSelected ? [] : allChapters.map(c => c.id),
    }));
  };

  const handleSaveCustomProfile = () => {
    const name = customProfileInputName.trim() || `Custom (${options.trimSize} ${options.fontFamily})`;
    const newId = `custom-profile-${Date.now()}`;
    const newProfile: PublicationPreset = {
      id: newId,
      name,
      description: `User-saved publication profile for ${options.trimSize} ${options.format.toUpperCase()}`,
      badge: 'Custom Profile',
      isCustom: true,
      options: {
        ...options,
        presetId: newId,
        customProfileName: name,
        isCustom: true,
      },
    };
    CompilerService.saveCustomPublicationProfile(newProfile);
    const updated = CompilerService.getAllPublicationPresets();
    setPresets(updated);
    setOptions(prev => ({ ...prev, presetId: newId, customProfileName: name, isCustom: true }));
    setCustomProfileInputName('');
  };

  const handleDeleteProfile = (profileId: string) => {
    CompilerService.deleteCustomPublicationProfile(profileId);
    const updated = CompilerService.getAllPublicationPresets();
    setPresets(updated);
    if (options.presetId === profileId) {
      handleApplyPreset('trade-paperback');
    }
  };

  const handleDuplicateProfile = (profileId: string) => {
    const dup = CompilerService.duplicatePublicationProfile(profileId);
    const updated = CompilerService.getAllPublicationPresets();
    setPresets(updated);
    handleApplyPreset(dup.id);
  };

  const handleResetDefaults = () => {
    const reset = CompilerService.resetToPresetDefaults(options.presetId);
    setOptions(prev => ({
      ...prev,
      ...reset,
      runningHeaderTitle: project.metadata?.title || 'Manuscript',
      runningHeaderAuthor: project.metadata?.author || 'Author',
    }));
  };

  const handleExport = () => {
    const now = Date.now();
    // Pre-export safety snapshot with deduplication (10s threshold)
    if (now - lastExportSnapshotTime > 10000) {
      const activePresetName = presets.find(p => p.id === options.presetId)?.name || options.presetId;
      createManualSnapshot({
        label: `Before Export — ${activePresetName}`,
        description: `Safety snapshot created before exporting manuscript as ${options.format.toUpperCase()} (${options.trimSize})`,
        type: 'pre-export',
        source: 'compiler-export',
      });
      setLastExportSnapshotTime(now);
    }

    if (options.format === 'pdf') {
      CompilerService.exportPdf(project, options);
    } else if (options.format === 'epub') {
      CompilerService.exportEpub(project, options);
    } else if (options.format === 'docx') {
      CompilerService.exportDocx(project, options);
    } else if (options.format === 'markdown') {
      CompilerService.downloadMarkdown(project, options);
    }
    setCompilerModalOpen(false);
  };

  // Sample chapters for live preview
  const selectedChaptersList = allChapters.filter(c => 
    !options.selectedChapterIds || options.selectedChapterIds.includes(c.id)
  );
  const firstSelectedChapter = selectedChaptersList[0] || allChapters[0];

  const parsedChapterItems = useMemo(() => {
    return CompilerService.parseProseItems(firstSelectedChapter?.content || '', options.sceneBreak);
  }, [firstSelectedChapter, options.sceneBreak]);

  if (!isCompilerModalOpen) return null;

  const p1Text = parsedChapterItems.find(i => i.type === 'paragraph')?.text || 
    'The harbor smelled of tar, brine, and old rain. Across the slate-grey water, the lighthouse turned its slow amber eye upon the archipelago, sweeping over hulls and docks in silent rhythm...';
  
  const p2Text = parsedChapterItems.filter(i => i.type === 'paragraph')[1]?.text || 
    'A bell rang twice from the harbor master’s tower. Gulls dipped low through the mist, their cries thin against the roar of the incoming surf.';

  const isShunn = options.presetId === 'standard-manuscript';

  // Preview Typography styles
  const previewFontFamily = 
    isShunn || options.fontFamily === 'courier' ? '"Courier New", Courier, monospace' :
    options.fontFamily === 'helvetica' ? '"Inter", -apple-system, sans-serif' :
    options.fontFamily === 'times' ? '"Times New Roman", Times, serif' :
    '"EB Garamond", Garamond, Georgia, serif';

  // Preview Sheet Dimensions according to trim size
  const sheetWidth = options.trimSize === 'Letter' ? '330px' : options.trimSize === '5.5x8.5' ? '280px' : options.trimSize === 'A5' ? '290px' : '300px';
  const sheetHeight = options.trimSize === 'Letter' ? '430px' : options.trimSize === '5.5x8.5' ? '410px' : options.trimSize === 'A5' ? '415px' : '435px';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div 
        className="w-full max-w-5xl rounded-lg border shadow-2xl flex flex-col overflow-hidden text-xs"
        style={{ 
          backgroundColor: '#141416', 
          borderColor: '#27272a',
          maxHeight: '92vh',
          height: '800px',
        }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-[#18181c]">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded bg-zinc-800 border border-zinc-700/60 text-zinc-200">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-zinc-100 text-sm tracking-wide">
                  Publication & Export Studio
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                  {project.metadata.title || 'Untitled Manuscript'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Typeset, validate, and export camera-ready books, submission manuscripts, and digital EPUBs.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Preflight Badge */}
            <div className="flex items-center space-x-1.5 text-[11px] px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">
              {preflightReport.readyForPrint ? (
                <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Ready for Export</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-amber-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{preflightReport.issues.filter(i => i.type === 'error').length} Errors</span>
                </span>
              )}
            </div>

            <button
              onClick={() => setCompilerModalOpen(false)}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Close Publication Studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace: Split Configuration (52%) vs. High-Fidelity Preview (48%) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Progressive Configuration */}
          <div className="w-[52%] border-r border-zinc-800 flex flex-col bg-[#161619]">
            
            {/* 3-Tier Progressive Navigation (Quick / Customize / Advanced) */}
            <div className="flex border-b border-zinc-800 bg-[#121215] px-3">
              {[
                { id: 'quick', label: '1. Quick Setup', icon: Sparkles },
                { id: 'customize', label: '2. Customize Book', icon: Sliders },
                { id: 'advanced', label: `3. Advanced & Preflight (${preflightReport.issues.length})`, icon: Settings2 },
              ].map(tier => {
                const Icon = tier.icon;
                const isActive = configMode === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setConfigMode(tier.id as ConfigMode)}
                    className={`flex items-center space-x-1.5 py-2.5 px-3.5 border-b-2 font-medium text-[11px] transition-colors ${
                      isActive 
                        ? 'border-zinc-300 text-zinc-100 bg-zinc-800/30 font-semibold' 
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tier.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Config Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-zinc-300">
              
              {/* ─────────────────────────────────────────────────────────── */}
              {/* TIER 1: QUICK SETUP                                         */}
              {/* ─────────────────────────────────────────────────────────── */}
              {configMode === 'quick' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-zinc-400 block mb-1.5 uppercase font-mono text-[10px] tracking-wider">
                      Target Publication Profile
                    </label>
                    <div className="space-y-2">
                      {presets.map(preset => {
                        const isSelected = options.presetId === preset.id;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => handleApplyPreset(preset.id)}
                            className={`p-3 rounded border cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-zinc-400 bg-zinc-800/70 ring-1 ring-zinc-400/80 shadow-xs' 
                                : 'border-zinc-800 bg-[#131316] hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-zinc-100 text-xs">{preset.name}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700/60 text-zinc-400">
                                  {preset.badge}
                                </span>
                                {preset.isCustom && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-700/60 text-indigo-300">
                                    Custom
                                  </span>
                                )}
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-zinc-200" />}
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">{preset.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Format & Trim */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                    <div>
                      <label className="text-zinc-400 block mb-1 font-mono text-[10px] uppercase">Export Format</label>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { id: 'pdf', label: 'PDF (Print)' },
                          { id: 'epub', label: 'EPUB 3' },
                          { id: 'docx', label: 'Word (.doc)' },
                          { id: 'markdown', label: 'Markdown' },
                        ].map(fmt => (
                          <button
                            key={fmt.id}
                            onClick={() => setOptions({ ...options, format: fmt.id as ExportFormat })}
                            className={`py-1.5 px-2 rounded border text-center text-xs font-medium transition-colors ${
                              options.format === fmt.id
                                ? 'border-zinc-300 bg-zinc-800 text-white'
                                : 'border-zinc-800 bg-[#121215] text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            {fmt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-zinc-400 block mb-1 font-mono text-[10px] uppercase">Trim Size</label>
                      <select
                        value={options.trimSize}
                        onChange={(e) => setOptions({ ...options, trimSize: e.target.value as TrimSize })}
                        className="w-full bg-[#121215] border border-zinc-700 rounded p-1.5 text-zinc-200 text-xs"
                      >
                        <option value="6x9">6" × 9" Trade Paperback</option>
                        <option value="5.5x8.5">5.5" × 8.5" Digest Paperback</option>
                        <option value="A5">A5 Deluxe (148 × 210mm)</option>
                        <option value="Letter">US Letter (8.5" × 11")</option>
                        <option value="A4">A4 Standard (210 × 297mm)</option>
                      </select>

                      <div className="mt-2 text-[10px] text-zinc-400">
                        {options.format === 'pdf' && 'Exact point geometry with camera-ready margins.'}
                        {options.format === 'epub' && 'Standards-compliant reflowable EPUB 3 package.'}
                        {options.format === 'docx' && 'Standard Word document with print headers & section breaks.'}
                        {options.format === 'markdown' && 'Clean CommonMark Markdown with YAML front matter.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* TIER 2: CUSTOMIZE BOOK                                      */}
              {/* ─────────────────────────────────────────────────────────── */}
              {configMode === 'customize' && (
                <div className="space-y-4">
                  {/* Typography & Layout */}
                  <div>
                    <div className="font-semibold text-zinc-200 mb-2 uppercase font-mono text-[10px] tracking-wider">
                      Typography & Metrics
                    </div>
                    <div className="grid grid-cols-2 gap-3 bg-[#121215] p-3 rounded border border-zinc-800">
                      <div>
                        <label className="text-zinc-400 block mb-1">Body Typeface</label>
                        <select
                          value={options.fontFamily}
                          onChange={(e) => setOptions({ ...options, fontFamily: e.target.value as ExportFontFamily })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-zinc-200 text-xs"
                        >
                          <option value="garamond">Garamond (Book Classic)</option>
                          <option value="times">Times New Roman (Editorial Serif)</option>
                          <option value="courier">Courier New (Standard Manuscript)</option>
                          <option value="helvetica">Helvetica / Inter (Clean Sans)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-zinc-400 block mb-1">First Line Indent</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min={0}
                            max={15}
                            step={0.5}
                            value={options.paragraphIndent}
                            onChange={(e) => setOptions({ ...options, paragraphIndent: Number(e.target.value) })}
                            className="w-full accent-zinc-400"
                          />
                          <span className="font-mono text-zinc-300 w-12 text-right">{options.paragraphIndent}mm</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-zinc-400">Font Size</label>
                          <span className="font-mono text-zinc-300">{options.fontSize}pt</span>
                        </div>
                        <input
                          type="range"
                          min={9}
                          max={14}
                          step={0.5}
                          value={options.fontSize}
                          onChange={(e) => setOptions({ ...options, fontSize: Number(e.target.value) })}
                          className="w-full accent-zinc-400"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-zinc-400">Line Spacing (Leading)</label>
                          <span className="font-mono text-zinc-300">{options.lineHeight}×</span>
                        </div>
                        <input
                          type="range"
                          min={1.15}
                          max={2.2}
                          step={0.05}
                          value={options.lineHeight}
                          onChange={(e) => setOptions({ ...options, lineHeight: Number(e.target.value) })}
                          className="w-full accent-zinc-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chapter Openings & Scene Breaks */}
                  <div>
                    <div className="font-semibold text-zinc-200 mb-2 uppercase font-mono text-[10px] tracking-wider">
                      Chapter Styling & Scene Ornaments
                    </div>
                    <div className="grid grid-cols-2 gap-3 bg-[#121215] p-3 rounded border border-zinc-800">
                      <div>
                        <label className="text-zinc-400 block mb-1">Chapter Heading Style</label>
                        <select
                          value={options.chapterHeaderStyle}
                          onChange={(e) => setOptions({ ...options, chapterHeaderStyle: e.target.value as ChapterHeaderStyle })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-zinc-200 text-xs"
                        >
                          <option value="centered-classic">Centered Classic</option>
                          <option value="left-modern">Left Modern</option>
                          <option value="ornate-bordered">Ornate Bordered</option>
                          <option value="minimal">Minimal Understated</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-zinc-400 block mb-1">Scene Break Symbol</label>
                        <select
                          value={options.sceneBreak}
                          onChange={(e) => setOptions({ ...options, sceneBreak: e.target.value as SceneBreakStyle })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-zinc-200 text-xs"
                        >
                          <option value="* * *">* * * (Asterisms)</option>
                          <option value="✦ ✦ ✦">✦ ✦ ✦ (Editorial Stars)</option>
                          <option value="§ § §">§ § § (Section Glyphs)</option>
                          <option value="#"># (Shunn Submission Mark)</option>
                          <option value="— — —">— — — (Em Dashes)</option>
                          <option value="• • •">• • • (Bullets)</option>
                          <option value="❦">❦ (Fleuron)</option>
                          <option value="◇">◇ (Diamond)</option>
                          <option value="blank-line">Blank Line Only</option>
                        </select>
                      </div>

                      <div className="col-span-2 pt-2 border-t border-zinc-800 flex items-center justify-between">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.dropCap}
                            onChange={(e) => setOptions({ ...options, dropCap: e.target.checked })}
                            className="accent-zinc-400 rounded"
                          />
                          <span>Drop Cap on Opening Paragraph</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.chapterStartPage === 'recto'}
                            onChange={(e) => setOptions({ ...options, chapterStartPage: e.target.checked ? 'recto' : 'next-page' })}
                            className="accent-zinc-400 rounded"
                          />
                          <span>Start Chapters on Right Page (Recto)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Running Headers & Footers */}
                  <div>
                    <div className="font-semibold text-zinc-200 mb-2 uppercase font-mono text-[10px] tracking-wider">
                      Headers & Footers
                    </div>
                    <div className="grid grid-cols-2 gap-3 bg-[#121215] p-3 rounded border border-zinc-800">
                      <div>
                        <label className="text-zinc-400 block mb-1">Running Header Style</label>
                        <select
                          value={options.headerStyle}
                          onChange={(e) => setOptions({ ...options, headerStyle: e.target.value as HeaderStyle })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-zinc-200 text-xs"
                        >
                          <option value="recto-verso">Recto / Verso (Title & Chapter)</option>
                          <option value="centered-title">Centered Title</option>
                          <option value="minimal">Author / Title (Top Right)</option>
                          <option value="none">No Running Headers</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-zinc-400 block mb-1">Page Number Footer</label>
                        <select
                          value={options.footerStyle}
                          onChange={(e) => setOptions({ ...options, footerStyle: e.target.value as FooterStyle })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-zinc-200 text-xs"
                        >
                          <option value="centered-page-num">Centered Page Number</option>
                          <option value="outer-page-num">Outer Margin Page Number</option>
                          <option value="none">No Footer Numbers</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Front & Back Matter Toggles */}
                  <div>
                    <div className="font-semibold text-zinc-200 mb-2 uppercase font-mono text-[10px] tracking-wider">
                      Front & Back Matter
                    </div>
                    <div className="space-y-2 bg-[#121215] p-3 rounded border border-zinc-800">
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.frontMatter.includeTitlePage}
                            onChange={(e) => setOptions({
                              ...options,
                              frontMatter: { ...options.frontMatter, includeTitlePage: e.target.checked }
                            })}
                            className="accent-zinc-400 rounded"
                          />
                          <span>Title Page</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.frontMatter.includeCopyright}
                            onChange={(e) => setOptions({
                              ...options,
                              frontMatter: { ...options.frontMatter, includeCopyright: e.target.checked }
                            })}
                            className="accent-zinc-400 rounded"
                          />
                          <span>Copyright Page</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.frontMatter.includeDedication}
                            onChange={(e) => setOptions({
                              ...options,
                              frontMatter: { ...options.frontMatter, includeDedication: e.target.checked }
                            })}
                            className="accent-zinc-400 rounded"
                          />
                          <span>Dedication</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.frontMatter.includeEpigraph}
                            onChange={(e) => setOptions({
                              ...options,
                              frontMatter: { ...options.frontMatter, includeEpigraph: e.target.checked }
                            })}
                            className="accent-zinc-400 rounded"
                          />
                          <span>Epigraph</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.frontMatter.includeTableOfContents}
                            onChange={(e) => setOptions({
                              ...options,
                              frontMatter: { ...options.frontMatter, includeTableOfContents: e.target.checked }
                            })}
                            className="accent-zinc-400 rounded"
                          />
                          <span>Table of Contents</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.backMatter.includeAboutAuthor}
                            onChange={(e) => setOptions({
                              ...options,
                              backMatter: { ...options.backMatter, includeAboutAuthor: e.target.checked }
                            })}
                            className="accent-zinc-400 rounded"
                          />
                          <span>About the Author</span>
                        </label>
                      </div>

                      {/* Detail inputs when expanded */}
                      {options.frontMatter.includeDedication && (
                        <input
                          type="text"
                          placeholder="Dedication message..."
                          value={options.frontMatter.dedicationText || ''}
                          onChange={(e) => setOptions({
                            ...options,
                            frontMatter: { ...options.frontMatter, dedicationText: e.target.value }
                          })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-xs text-zinc-200 mt-1"
                        />
                      )}

                      {options.frontMatter.includeEpigraph && (
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <input
                            type="text"
                            placeholder="Epigraph quote..."
                            value={options.frontMatter.epigraphQuote || ''}
                            onChange={(e) => setOptions({
                              ...options,
                              frontMatter: { ...options.frontMatter, epigraphQuote: e.target.value }
                            })}
                            className="bg-zinc-900 border border-zinc-700 rounded p-1.5 text-xs text-zinc-200"
                          />
                          <input
                            type="text"
                            placeholder="Quote attribution..."
                            value={options.frontMatter.epigraphSource || ''}
                            onChange={(e) => setOptions({
                              ...options,
                              frontMatter: { ...options.frontMatter, epigraphSource: e.target.value }
                            })}
                            className="bg-zinc-900 border border-zinc-700 rounded p-1.5 text-xs text-zinc-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* TIER 3: ADVANCED & PREFLIGHT                                */}
              {/* ─────────────────────────────────────────────────────────── */}
              {configMode === 'advanced' && (
                <div className="space-y-4">
                  {/* Preflight Diagnostics */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-zinc-200 uppercase font-mono text-[10px] tracking-wider">
                        Preflight Report ({preflightReport.issues.length} Diagnostics)
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {preflightReport.totalWordCount.toLocaleString()} words • ~{preflightReport.estimatedPageCount} pages • {preflightReport.estimatedReadingTimeMinutes}m read
                      </span>
                    </div>

                    <div className="space-y-2">
                      {preflightReport.issues.length === 0 ? (
                        <div className="p-3 rounded border border-emerald-800/40 bg-emerald-950/20 text-emerald-300 flex items-center space-x-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>All editorial and geometric preflight checks passed. Camera-ready for export.</span>
                        </div>
                      ) : (
                        preflightReport.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded border flex flex-col space-y-1 ${
                              issue.type === 'error' 
                                ? 'border-red-900/50 bg-red-950/20 text-red-200'
                                : issue.type === 'warning'
                                ? 'border-amber-900/50 bg-amber-950/20 text-amber-200'
                                : 'border-blue-900/50 bg-blue-950/20 text-blue-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {issue.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                              {issue.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                              {issue.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
                              <span className="font-semibold text-xs">{issue.title}</span>
                            </div>
                            <p className="text-[11px] opacity-80 pl-6">{issue.description}</p>
                            {issue.suggestion && (
                              <p className="text-[10px] text-zinc-400 pl-6 italic">
                                Action: {issue.suggestion}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Chapter Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-zinc-200 uppercase font-mono text-[10px] tracking-wider">
                        Included Chapters ({options.selectedChapterIds?.length ?? allChapters.length} of {allChapters.length})
                      </span>
                      <button
                        onClick={handleToggleAllChapters}
                        className="text-zinc-400 hover:text-white underline text-[10px]"
                      >
                        {(!options.selectedChapterIds || options.selectedChapterIds.length === allChapters.length) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1 bg-[#121215] p-2 rounded border border-zinc-800">
                      {project.acts.map(act => (
                        <div key={act.id} className="space-y-1 mb-2">
                          <div className="font-mono text-[9px] text-zinc-500 uppercase px-1">
                            {act.title}
                          </div>
                          {act.chapters.map(ch => {
                            const isSelected = !options.selectedChapterIds || options.selectedChapterIds.includes(ch.id);
                            return (
                              <div
                                key={ch.id}
                                onClick={() => handleToggleChapter(ch.id)}
                                className={`flex items-center justify-between p-1.5 rounded border cursor-pointer text-xs transition-colors ${
                                  isSelected 
                                    ? 'border-zinc-700 bg-zinc-800/40 text-zinc-100' 
                                    : 'border-zinc-900 bg-[#141417] text-zinc-500 opacity-60'
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="accent-zinc-400 rounded"
                                  />
                                  <span className="truncate">{ch.title}</span>
                                </div>
                                <span className="font-mono text-[10px] text-zinc-500 shrink-0">
                                  {ch.wordCount.toLocaleString()} w
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Profile Management: Save / Duplicate / Reset */}
                  <div>
                    <div className="font-semibold text-zinc-200 mb-2 uppercase font-mono text-[10px] tracking-wider">
                      Export Profile Management
                    </div>
                    <div className="bg-[#121215] p-3 rounded border border-zinc-800 space-y-2.5">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Name for custom profile..."
                          value={customProfileInputName}
                          onChange={(e) => setCustomProfileInputName(e.target.value)}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded p-1.5 text-xs text-zinc-200"
                        />
                        <button
                          onClick={handleSaveCustomProfile}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-white font-medium text-xs transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Custom</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <button
                          onClick={() => handleDuplicateProfile(options.presetId)}
                          className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Duplicate Current</span>
                        </button>

                        <button
                          onClick={handleResetDefaults}
                          className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset to Defaults</span>
                        </button>

                        {options.isCustom && (
                          <button
                            onClick={() => handleDeleteProfile(options.presetId)}
                            className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Profile</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Left Panel Footer: Export Actions */}
            <div className="p-3 border-t border-zinc-800 bg-[#131316] flex items-center justify-between">
              <div className="text-[11px] text-zinc-400">
                Format: <span className="font-mono text-zinc-200 uppercase font-semibold">{options.format}</span>
                <span className="mx-1.5">•</span>
                Trim: <span className="text-zinc-200">{options.trimSize}</span>
                <span className="mx-1.5">•</span>
                Font: <span className="text-zinc-200">{options.fontFamily}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCompilerModalOpen(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white rounded transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-zinc-200 hover:bg-white text-zinc-900 font-semibold text-xs shadow transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export {options.format.toUpperCase()}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: High-Fidelity Book Page Preview (48%) */}
          <div className="w-[48%] bg-[#0f0f12] flex flex-col items-center justify-between p-4 overflow-hidden select-text">
            
            {/* Preview Navigation Tabs */}
            <div className="flex items-center justify-between w-full pb-2 border-b border-zinc-800/80">
              <div className="flex items-center space-x-1.5 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5 text-zinc-300" />
                <span>Live Page Preview</span>
              </div>
              <div className="flex items-center space-x-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-[10px]">
                {[
                  { id: 'chapter1', label: 'Chapter 1 (Recto)' },
                  { id: 'chapter2', label: 'Page 2 (Verso)' },
                  { id: 'title', label: 'Title Page' },
                  { id: 'copyright', label: 'Copyright' },
                  { id: 'dedication', label: 'Dedication' },
                  { id: 'toc', label: 'TOC' },
                  { id: 'backmatter', label: 'Author Bio' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPreviewPage(p.id as PreviewPage)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      previewPage === p.id 
                        ? 'bg-zinc-700 text-white font-medium' 
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Printed Book Page Sheet */}
            <div className="flex-1 flex items-center justify-center w-full py-3">
              <div
                className="bg-[#faf8f5] text-[#1a1815] shadow-2xl rounded-xs border border-amber-900/10 flex flex-col justify-between p-7 overflow-hidden transition-all relative"
                style={{
                  width: sheetWidth,
                  height: sheetHeight,
                  fontFamily: previewFontFamily,
                  backgroundColor: isShunn ? '#ffffff' : '#faf8f5',
                }}
              >
                {/* ── PREVIEW: CHAPTER 1 OPENING (RECTO) ─────────────── */}
                {previewPage === 'chapter1' && (
                  <>
                    {/* Header is suppressed on chapter start */}
                    <div className="h-4" />

                    {/* Chapter Body */}
                    <div className="my-auto">
                      {/* Chapter Heading Styles */}
                      {options.chapterHeaderStyle === 'ornate-bordered' && !isShunn ? (
                        <div className="text-center my-3">
                          <div className="border-t border-b border-zinc-400/60 py-1 inline-block px-4">
                            <span className="text-[12px] font-bold tracking-widest uppercase text-zinc-950">
                              {firstSelectedChapter?.title || 'Chapter I'}
                            </span>
                          </div>
                        </div>
                      ) : options.chapterHeaderStyle === 'left-modern' && !isShunn ? (
                        <div className="text-left my-3">
                          <div className="text-[13px] font-bold tracking-tight text-zinc-950">
                            {firstSelectedChapter?.title || 'Chapter I'}
                          </div>
                        </div>
                      ) : options.chapterHeaderStyle === 'minimal' && !isShunn ? (
                        <div className="text-center my-3">
                          <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                            {firstSelectedChapter?.title || 'Chapter I'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center my-3">
                          <div className="text-[12px] font-bold tracking-wide text-zinc-900">
                            {firstSelectedChapter?.title || 'Chapter I'}
                          </div>
                        </div>
                      )}

                      {/* Drop Cap & Opening Paragraph */}
                      <div 
                        className={`text-[9px] text-zinc-800 ${isShunn ? 'text-left' : 'text-justify'}`}
                        style={{ lineHeight: `${Math.min(1.4, options.lineHeight)}` }}
                      >
                        {options.dropCap && !isShunn ? (
                          <p>
                            <span 
                              className="float-left text-2xl font-bold leading-none pr-1.5 pt-0.5 font-serif text-zinc-950"
                              style={{ fontFamily: previewFontFamily }}
                            >
                              {p1Text.charAt(0)}
                            </span>
                            {p1Text.slice(1)}
                          </p>
                        ) : (
                          <p style={{ textIndent: isShunn ? '12px' : '0' }}>{p1Text}</p>
                        )}
                      </div>

                      {/* Scene Break Ornament */}
                      <div className="text-center my-3 text-[8.5px] font-serif text-zinc-500 tracking-widest">
                        {options.sceneBreak === 'blank-line' ? '' : options.sceneBreak}
                      </div>

                      {/* Paragraph 2 */}
                      <div 
                        className={`text-[9px] text-zinc-800 ${isShunn ? 'text-left' : 'text-justify'}`}
                        style={{ 
                          lineHeight: `${Math.min(1.4, options.lineHeight)}`,
                          textIndent: `${options.paragraphIndent}px`
                        }}
                      >
                        <p>{p2Text}</p>
                      </div>
                    </div>

                    {/* Running Footer with Page Number */}
                    <div className="text-center text-[8px] text-zinc-500 font-sans">
                      1
                    </div>
                  </>
                )}

                {/* ── PREVIEW: PAGE 2 (VERSO) ────────────────────────── */}
                {previewPage === 'chapter2' && (
                  <>
                    {/* Running Header (Verso: Book Title) */}
                    <div className="flex justify-between items-center text-[7.5px] uppercase tracking-widest text-zinc-500 font-sans border-b border-zinc-300/40 pb-1">
                      <span>{project.metadata.title || 'MANUSCRIPT'}</span>
                      <span>{options.headerStyle === 'minimal' ? '2' : ''}</span>
                    </div>

                    {/* Page Body */}
                    <div className="my-auto space-y-2 text-[9px] text-justify leading-relaxed text-zinc-800" style={{ lineHeight: `${Math.min(1.4, options.lineHeight)}` }}>
                      <p style={{ textIndent: `${options.paragraphIndent}px` }}>
                        The wind carried the smell of rain and burning driftwood from the outer shoals. Along the pier, shadows stretched across wet flagstones as the lanterns sputtered to life.
                      </p>
                      <p style={{ textIndent: `${options.paragraphIndent}px` }}>
                        "There is time yet," she murmured, watching the grey swell break against the seawall. "The tide will not turn until midnight."
                      </p>
                      <p style={{ textIndent: `${options.paragraphIndent}px` }}>
                        He nodded once, adjusting the collar of his coat against the spray. Beyond the headland, the dark silhouette of the schooner drifted into the cove, its canvas furled tight.
                      </p>
                    </div>

                    {/* Running Footer */}
                    <div className="text-center text-[8px] text-zinc-500 font-sans">
                      2
                    </div>
                  </>
                )}

                {/* ── PREVIEW: TITLE PAGE ────────────────────────────── */}
                {previewPage === 'title' && (
                  <div className="flex flex-col justify-center items-center text-center h-full space-y-4">
                    <div className="text-base font-bold text-zinc-900 tracking-wide font-serif">
                      {project.metadata.title || 'Untitled Manuscript'}
                    </div>
                    <div className="text-[10px] text-zinc-600 italic">
                      by {project.metadata.author || 'Author'}
                    </div>
                    {project.metadata.genre && (
                      <div className="text-[8px] text-zinc-400 uppercase tracking-widest pt-6">
                        A Novel of {project.metadata.genre}
                      </div>
                    )}
                  </div>
                )}

                {/* ── PREVIEW: COPYRIGHT PAGE ────────────────────────── */}
                {previewPage === 'copyright' && (
                  <div className="flex flex-col justify-end text-left h-full pb-4 space-y-1 text-[7.5px] text-zinc-600">
                    <div className="font-bold text-zinc-900">{project.metadata.title}</div>
                    <div>Copyright © {options.frontMatter.copyrightYear || '2026'} by {project.metadata.author}</div>
                    <div>Published by {options.frontMatter.publisherName || 'Independent Edition'}</div>
                    <div>All rights reserved.</div>
                    {options.frontMatter.isbn && <div>ISBN: {options.frontMatter.isbn}</div>}
                  </div>
                )}

                {/* ── PREVIEW: DEDICATION ────────────────────────────── */}
                {previewPage === 'dedication' && (
                  <div className="flex flex-col justify-center items-center text-center h-full px-4 space-y-4">
                    <div className="text-[10px] italic text-zinc-700 leading-relaxed font-serif">
                      "{options.frontMatter.dedicationText || 'For those who read between the lines.'}"
                    </div>
                    {options.frontMatter.includeEpigraph && options.frontMatter.epigraphQuote && (
                      <div className="pt-6 border-t border-zinc-300/40 w-3/4">
                        <p className="text-[8.5px] italic text-zinc-600">
                          "{options.frontMatter.epigraphQuote}"
                        </p>
                        <p className="text-[8px] text-zinc-500 mt-1">
                          — {options.frontMatter.epigraphSource || 'Unknown'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── PREVIEW: TABLE OF CONTENTS ─────────────────────── */}
                {previewPage === 'toc' && (
                  <div className="flex flex-col justify-start h-full py-2 space-y-2">
                    <div className="text-center font-bold text-[11px] uppercase tracking-wider text-zinc-900 font-serif pb-2 border-b border-zinc-300">
                      Table of Contents
                    </div>
                    <div className="space-y-1.5 text-[8px] text-zinc-700 pt-1">
                      {selectedChaptersList.slice(0, 6).map((ch, idx) => (
                        <div key={ch.id} className="flex justify-between items-center">
                          <span>{ch.title}</span>
                          <span className="font-mono text-[7px] text-zinc-400">{idx * 14 + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── PREVIEW: BACK MATTER ───────────────────────────── */}
                {previewPage === 'backmatter' && (
                  <div className="flex flex-col justify-center h-full px-2 space-y-2">
                    <div className="text-center font-bold text-[11px] text-zinc-900 font-serif">
                      About the Author
                    </div>
                    <div className="text-[8.5px] text-justify text-zinc-700 leading-relaxed">
                      {options.backMatter.aboutAuthorBio || 'The author is a passionate storyteller exploring deep worlds and complex characters.'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Trim & Renderer Limitation Info */}
            <div className="text-[10px] text-zinc-500 font-mono text-center">
              Trim: {options.trimSize} • Font: {options.fontFamily} ({options.fontSize}pt / {options.lineHeight}×) • {options.format.toUpperCase()} Target
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
