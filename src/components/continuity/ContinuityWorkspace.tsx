import React, { useState, useMemo } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { ContinuityEngine } from '../../engine';
import { 
  ContinuityWarning, ContinuityCheckType, ContinuitySeverity, IntentionalChoiceRecord 
} from '../../types';
import { 
  ShieldCheck, AlertTriangle, AlertCircle, Info,
  CheckCircle2, EyeOff, Sliders, ArrowRight, BookOpen, 
  GitBranch, Search, Filter, RotateCcw, X, BookmarkCheck,
  Check, Clock, MapPin, Brain, UserX, FileText, ChevronRight
} from 'lucide-react';

export const ContinuityWorkspace: React.FC = () => {
  const { 
    project, 
    setActiveTab, 
    setActiveChapterId,
    dismissContinuityWarning,
    markWarningIntentional,
    restoreContinuityWarning,
    removeIntentionalWarning,
    updateContinuityConfig,
  } = useSwriteStore();

  const theme = project.metadata.theme;
  const config = project.metadata.continuityConfig;

  // Navigation / View Tabs
  const [activeTab, setActiveViewTab] = useState<'active' | 'intentional' | 'ignored' | 'settings'>('active');
  const [typeFilter, setTypeFilter] = useState<ContinuityCheckType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<ContinuitySeverity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Intentional marking modal state
  const [markingWarning, setMarkingWarning] = useState<ContinuityWarning | null>(null);
  const [intentionalReason, setIntentionalReason] = useState('');

  // Run deterministic continuity diagnostic
  const allWarnings = useMemo(() => {
    return ContinuityEngine.runAudit(project);
  }, [project]);

  // Derived subsets
  const activeWarnings = useMemo(() => {
    return allWarnings.filter(w => !w.isIgnored && !w.isIntentional);
  }, [allWarnings]);

  const ignoredWarnings = useMemo(() => {
    return allWarnings.filter(w => w.isIgnored);
  }, [allWarnings]);

  const intentionalList = useMemo(() => {
    return config?.intentionalWarnings || [];
  }, [config?.intentionalWarnings]);

  // Filtered active list
  const filteredActiveWarnings = useMemo(() => {
    return activeWarnings.filter(w => {
      if (typeFilter !== 'all' && w.type !== typeFilter) return false;
      if (severityFilter !== 'all' && w.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          w.title.toLowerCase().includes(q) ||
          w.summary.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeWarnings, typeFilter, severityFilter, searchQuery]);

  // Counts by severity
  const criticalCount = activeWarnings.filter(w => w.severity === 'critical').length;
  const warningCount = activeWarnings.filter(w => w.severity === 'warning').length;
  const noticeCount = activeWarnings.filter(w => w.severity === 'notice').length;

  const handleJumpToChapter = (chapterId?: string) => {
    if (!chapterId) return;
    setActiveChapterId(chapterId);
    setActiveTab('editor');
  };

  const handleOpenMarkIntentional = (w: ContinuityWarning) => {
    setMarkingWarning(w);
    setIntentionalReason('');
  };

  const handleConfirmMarkIntentional = () => {
    if (!markingWarning) return;
    markWarningIntentional(
      markingWarning.id,
      markingWarning.title,
      markingWarning.type,
      intentionalReason.trim() || 'Intentional narrative device / author choice'
    );
    setMarkingWarning(null);
    setIntentionalReason('');
  };

  const getCheckTypeIcon = (type: ContinuityCheckType) => {
    switch (type) {
      case 'knowledge': return <Brain className="w-3.5 h-3.5 text-amber-400" />;
      case 'state': return <UserX className="w-3.5 h-3.5 text-rose-400" />;
      case 'timeline': return <Clock className="w-3.5 h-3.5 text-indigo-400" />;
      case 'location': return <MapPin className="w-3.5 h-3.5 text-emerald-400" />;
      case 'attributes': return <AlertCircle className="w-3.5 h-3.5 text-sky-400" />;
      case 'thread-dormancy': return <GitBranch className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Info className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getCheckTypeLabel = (type: ContinuityCheckType) => {
    switch (type) {
      case 'knowledge': return 'Character Knowledge';
      case 'state': return 'Character State';
      case 'timeline': return 'Timeline & Causality';
      case 'location': return 'Location & Transit';
      case 'attributes': return 'Structured Attributes';
      case 'thread-dormancy': return 'Plot Thread Dormancy';
      default: return 'General Continuity';
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden select-none"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Top Header / Control Bar */}
      <div 
        className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 shrink-0"
        style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
      >
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            <ShieldCheck className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
              Continuity Diagnostic
            </h1>
            <p className="text-[11px] text-zinc-400">
              Objective detection of character knowledge, states, timelines, and locations.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filter Toolbar */}
      <div 
        className="px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0"
        style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
      >
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveViewTab('active')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'active' 
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Issues</span>
            {activeWarnings.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                {activeWarnings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveViewTab('intentional')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'intentional' 
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Intentional Choices ({intentionalList.length})</span>
          </button>

          <button
            onClick={() => setActiveViewTab('ignored')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'ignored' 
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
            <span>Dismissed ({ignoredWarnings.length})</span>
          </button>

          <button
            onClick={() => setActiveViewTab('settings')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'settings' 
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span>Engine Settings</span>
          </button>
        </div>

        {/* Search & Check Filter Chips */}
        {activeTab === 'active' && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search warnings..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-44"
              />
            </div>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="px-2.5 py-1 text-xs rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-300 focus:outline-none focus:border-zinc-500"
            >
              <option value="all">All Check Types</option>
              <option value="knowledge">Character Knowledge</option>
              <option value="state">Character State</option>
              <option value="timeline">Timeline & Causality</option>
              <option value="location">Location & Spatial</option>
              <option value="attributes">Structured Attributes</option>
              <option value="thread-dormancy">Plot Thread Dormancy</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Workspace Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* ========================================================================= */}
        {/* VIEW 1: ACTIVE INCONSISTENCIES                                           */}
        {/* ========================================================================= */}
        {activeTab === 'active' && (
          <>
            {filteredActiveWarnings.length === 0 ? (
              <div 
                className="py-16 text-center rounded-xl border border-dashed flex flex-col items-center justify-center space-y-3"
                style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
              >
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-sm font-semibold text-zinc-200">
                    No Continuity Inconsistencies Detected
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    All character knowledge, states, timelines, locations, and plot threads align with the story domain model.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 max-w-4xl mx-auto">
                {filteredActiveWarnings.map(warning => {
                  const isCritical = warning.severity === 'critical';
                  const isWarning = warning.severity === 'warning';

                  return (
                    <div
                      key={warning.id}
                      className="rounded-lg border p-4.5 transition-all shadow-xs flex flex-col space-y-3"
                      style={{
                        backgroundColor: theme.pageBg,
                        borderColor: isCritical ? '#f43f5e40' : isWarning ? '#f59e0b40' : theme.pageBorder,
                      }}
                    >
                      {/* Warning Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded ${
                            isCritical ? 'bg-rose-500/15 text-rose-400' : isWarning ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {getCheckTypeIcon(warning.type)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                {getCheckTypeLabel(warning.type)}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                isCritical ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60' :
                                isWarning ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' :
                                'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              }`}>
                                {warning.severity}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-zinc-100 mt-0.5">
                              {warning.title}
                            </h3>
                          </div>
                        </div>

                        {/* Top Action Buttons: Ignore & Mark Intentional */}
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => handleOpenMarkIntentional(warning)}
                            className="px-2.5 py-1 rounded text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors flex items-center space-x-1"
                            title="Mark as intentional narrative choice (e.g. dramatic irony, unreliable narrator)"
                          >
                            <BookmarkCheck className="w-3.5 h-3.5" />
                            <span>Mark Intentional</span>
                          </button>

                          <button
                            onClick={() => dismissContinuityWarning(warning.id)}
                            className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 transition-colors flex items-center space-x-1"
                            title="Dismiss warning for now"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Ignore</span>
                          </button>
                        </div>
                      </div>

                      {/* Explanation */}
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {warning.description}
                      </p>

                      {/* EVIDENCE SECTION */}
                      {warning.evidence && warning.evidence.length > 0 && (
                        <div className="bg-zinc-950/50 rounded-md p-3 border border-zinc-800/80 space-y-2">
                          <div className="text-[11px] font-semibold text-zinc-400 flex items-center space-x-1.5">
                            <FileText className="w-3 h-3 text-zinc-400" />
                            <span>Recorded Story Evidence:</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {warning.evidence.map((ev, idx) => (
                              <div 
                                key={idx} 
                                className="p-2.5 rounded bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-zinc-200 truncate">
                                    {ev.label}
                                  </span>
                                  {ev.chapterId && (
                                    <button
                                      onClick={() => handleJumpToChapter(ev.chapterId)}
                                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors flex items-center space-x-1 shrink-0 ml-2"
                                    >
                                      <span>Chapter {ev.chapterNumber || ''}</span>
                                      <ArrowRight className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                                {ev.details && (
                                  <p className="text-[11px] text-zinc-400 leading-normal">
                                    {ev.details}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer Jump / Deep Link Actions */}
                      <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center space-x-2">
                          {warning.primaryChapterId && (
                            <button
                              onClick={() => handleJumpToChapter(warning.primaryChapterId)}
                              className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium transition-colors flex items-center space-x-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-zinc-300" />
                              <span>Open Chapter in Editor</span>
                            </button>
                          )}

                          {warning.secondaryChapterId && (
                            <button
                              onClick={() => handleJumpToChapter(warning.secondaryChapterId)}
                              className="px-3 py-1 rounded bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 font-medium transition-colors flex items-center space-x-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-zinc-400" />
                              <span>View Reference Chapter</span>
                            </button>
                          )}
                        </div>

                        {warning.suggestedAction && (
                          <button
                            onClick={() => {
                              if (warning.suggestedAction?.actionType === 'navigate-codex') {
                                setActiveTab('codex');
                              } else if (warning.suggestedAction?.actionType === 'navigate-thread') {
                                setActiveTab('threads');
                              }
                            }}
                            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium transition-colors flex items-center space-x-1.5"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{warning.suggestedAction.label}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: INTENTIONAL NARRATIVE CHOICES                                    */}
        {/* ========================================================================= */}
        {activeTab === 'intentional' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div 
              className="p-4 rounded-xl border"
              style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
            >
              <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs mb-1">
                <BookmarkCheck className="w-4 h-4" />
                <span>Author-Marked Intentional Deviations</span>
              </div>
              <p className="text-xs text-zinc-400">
                These divergences are marked as deliberate storytelling choices (e.g. dramatic irony, unreliable narrator, secret backstory, or foreshadowing). Swrite will not flag them as errors.
              </p>
            </div>

            {intentionalList.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                No intentional deviations recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {intentionalList.map(record => (
                  <div
                    key={record.id}
                    className="rounded-xl border p-4 flex items-start justify-between gap-4"
                    style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                          {getCheckTypeLabel(record.type)}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Marked on {new Date(record.markedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-100">
                        {record.warningTitle}
                      </h4>
                      {record.reason && (
                        <p className="text-xs text-zinc-300 italic bg-zinc-950/40 p-2 rounded border border-zinc-800 mt-1.5">
                          "{record.reason}"
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => removeIntentionalWarning(record.warningId)}
                      className="px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors shrink-0"
                    >
                      Unmark Intentional
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: DISMISSED / IGNORED ISSUES                                      */}
        {/* ========================================================================= */}
        {activeTab === 'ignored' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div 
              className="p-4 rounded-xl border"
              style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
            >
              <div className="flex items-center space-x-2 text-zinc-300 font-semibold text-xs mb-1">
                <EyeOff className="w-4 h-4" />
                <span>Dismissed Diagnostics</span>
              </div>
              <p className="text-xs text-zinc-400">
                Continuity issues you have dismissed for this project. You can restore any item to the active issue tracker at any time.
              </p>
            </div>

            {ignoredWarnings.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                No dismissed warnings.
              </div>
            ) : (
              <div className="space-y-3">
                {ignoredWarnings.map(warning => (
                  <div
                    key={warning.id}
                    className="rounded-xl border p-4 flex items-center justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          {getCheckTypeLabel(warning.type)}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-zinc-200">
                        {warning.title}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                        {warning.summary}
                      </p>
                    </div>

                    <button
                      onClick={() => restoreContinuityWarning(warning.id)}
                      className="px-3 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center space-x-1 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: ENGINE SETTINGS & CONFIGURATION                                  */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div 
              className="p-5 rounded-xl border space-y-5"
              style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
            >
              <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Continuity Audit Parameters</span>
              </h3>

              {/* Thread Dormancy Slider */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200">
                    Plot Thread Dormancy Threshold
                  </label>
                  <span className="text-xs font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                    {config?.threadDormancyChapterThreshold || 3} Chapters
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Flags active plot threads that have not had a scene touchpoint for this many consecutive chapters.
                </p>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={config?.threadDormancyChapterThreshold || 3}
                  onChange={e => updateContinuityConfig({ threadDormancyChapterThreshold: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>2 ch (Strict)</span>
                  <span>5 ch (Standard)</span>
                  <span>10 ch (Lenient)</span>
                </div>
              </div>

              {/* Module Toggles */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <label className="text-xs font-semibold text-zinc-200">
                  Active Continuity Check Modules
                </label>

                {[
                  { key: 'knowledge', label: '1. Character Knowledge Chronology', desc: 'Detects characters referencing facts before their learnedAt chapter.' },
                  { key: 'state', label: '2. Character State (Dead / Unavailable)', desc: 'Detects deceased or incapacitated characters participating in scenes.' },
                  { key: 'timeline', label: '3. Timeline Causality & Progression', desc: 'Detects effects placed before their prerequisite cause events.' },
                  { key: 'location', label: '4. Location & Spatial Continuity', desc: 'Detects impossible regional teleportation without travel scenes.' },
                  { key: 'attributes', label: '5. Structured Attributes & Allegiances', desc: 'Detects Codex mismatches, rival faction conflicts, and relationship asymmetry.' },
                  { key: 'threadDormancy', label: '6. Plot Thread Dormancy', desc: 'Detects abandoned active plot threads across consecutive chapters.' },
                ].map(mod => {
                  const isEnabled = config?.enabledChecks?.[mod.key as keyof typeof config.enabledChecks] ?? true;
                  return (
                    <div key={mod.key} className="flex items-start justify-between gap-3 p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80">
                      <div>
                        <div className="text-xs font-medium text-zinc-200">{mod.label}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{mod.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={e => updateContinuityConfig({
                          enabledChecks: {
                            ...(config?.enabledChecks || {} as any),
                            [mod.key]: e.target.checked,
                          }
                        })}
                        className="rounded accent-emerald-500 mt-1 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MARK INTENTIONAL MODAL */}
      {markingWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div 
            className="w-full max-w-md rounded-lg border p-5 space-y-4 shadow-xl"
            style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-zinc-100 font-bold text-sm">
                <BookmarkCheck className="w-4 h-4 text-zinc-400" />
                <span>Mark as Intentional Narrative Choice</span>
              </div>
              <button 
                onClick={() => setMarkingWarning(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-zinc-200">
                {markingWarning.title}
              </div>
              <p className="text-xs text-zinc-400">
                {markingWarning.summary}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Author Note / Literary Rationale (Optional):
              </label>
              <textarea
                value={intentionalReason}
                onChange={e => setIntentionalReason(e.target.value)}
                placeholder="e.g. Dramatic irony, character intercepted a secret letter in backstory, unreliable narrator..."
                rows={3}
                className="w-full text-xs p-2.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setMarkingWarning(null)}
                className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMarkIntentional}
                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-900 shadow-xs transition-colors"
              >
                Confirm Intentional Choice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
