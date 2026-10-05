import React, { useState, useMemo } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { ProofreadingEngine } from '../../editorial';
import { 
  Finding, FindingCategory, ProofreadingPassId, ProofreadingScope, ProofreadingSummary 
} from '../../types';
import { 
  CheckCircle2, AlertCircle, AlertTriangle, Info, Check, EyeOff, Shield,
  BookOpen, SlidersHorizontal, ChevronRight, ChevronDown, Sparkles,
  Volume2, VolumeX, SpellCheck, Settings, RefreshCw, Layers
} from 'lucide-react';

interface ProofreadingReviewPanelProps {
  onJumpToFinding?: (finding: Finding) => void;
  onClose?: () => void;
}

export const ProofreadingReviewPanel: React.FC<ProofreadingReviewPanelProps> = ({
  onJumpToFinding,
  onClose,
}) => {
  const { 
    project, activeChapterId, activeSceneId,
    acceptProofreadingFinding, ignoreProofreadingFinding,
    markProofreadingFindingIntentional, updateProofreadingConfig,
    addCustomWordToDictionary
  } = useSwriteStore();

  const theme = project.metadata.theme;
  const config = project.metadata.proofreadingConfig || {
    preserveVoice: true,
    scope: 'scene' as ProofreadingScope,
    activePasses: {
      'spelling': true,
      'grammar': true,
      'punctuation': true,
      'repetition': true,
      'passive-voice': false,
      'adverbs': false,
      'sentence-length': false,
      'filler-words': false,
      'consistency-names': true,
      'consistency-formatting': true,
    },
    ignoredFindingIds: [],
    intentionalFindingIds: [],
    acceptedFindingIds: [],
    customDictionary: [],
  };

  const [selectedCategory, setSelectedCategory] = useState<FindingCategory | 'all'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Active Chapter & Scene
  const activeChapter = project.acts
    .flatMap(a => a.chapters)
    .find(c => c.id === activeChapterId) || project.acts[0]?.chapters[0];

  const activeScene = activeChapter?.scenes?.find(s => s.id === activeSceneId) || activeChapter?.scenes?.[0];

  // Run Proofreading Audit
  const allFindings = useMemo(() => {
    return ProofreadingEngine.runAudit(project, {
      scope: config.scope,
      activeChapterId: activeChapter?.id,
      activeSceneId: activeScene?.id,
      customConfig: config,
    });
  }, [project, config, activeChapter?.id, activeScene?.id]);

  const summary = useMemo(() => {
    return ProofreadingEngine.getSummary(allFindings);
  }, [allFindings]);

  // Filtered Findings
  const visibleFindings = useMemo(() => {
    let list = allFindings.filter(f => f.status === 'open');
    if (selectedCategory !== 'all') {
      list = list.filter(f => f.category === selectedCategory);
    }
    return list;
  }, [allFindings, selectedCategory]);

  const handleScopeChange = (newScope: ProofreadingScope) => {
    updateProofreadingConfig({ scope: newScope });
  };

  const handleToggleVoice = () => {
    updateProofreadingConfig({ preserveVoice: !config.preserveVoice });
  };

  const handleTogglePass = (passId: ProofreadingPassId) => {
    updateProofreadingConfig({
      activePasses: {
        ...config.activePasses,
        [passId]: !config.activePasses[passId],
      }
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div 
      className="flex flex-col h-full overflow-hidden select-none border-l text-xs"
      style={{
        backgroundColor: theme.bg,
        borderColor: theme.pageBorder,
        color: theme.text,
      }}
    >
      {/* Panel Header */}
      <div 
        className="px-3.5 py-2.5 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
      >
        <div className="flex items-center space-x-2">
          <SpellCheck className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-zinc-100 text-xs tracking-tight">
            Proofreading & Editorial
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded transition-colors ${showSettings ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'}`}
            title="Proofreading Passes & Voice Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200"
              title="Close Review Panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Scope & Voice Preservation Bar */}
      <div 
        className="px-3.5 py-2 border-b flex items-center justify-between gap-2 shrink-0 bg-zinc-900/40"
        style={{ borderColor: theme.pageBorder }}
      >
        {/* Scope Selector */}
        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-zinc-400 font-medium">Scope:</span>
          <select
            value={config.scope}
            onChange={e => handleScopeChange(e.target.value as ProofreadingScope)}
            className="bg-zinc-900 border border-zinc-700/80 rounded px-1.5 py-0.5 text-[11px] text-zinc-200 outline-none"
          >
            <option value="scene">Current Scene</option>
            <option value="chapter">Current Chapter</option>
            <option value="act">Current Act</option>
            <option value="manuscript">Whole Manuscript</option>
          </select>
        </div>

        {/* Voice Preservation Pill */}
        <button
          onClick={handleToggleVoice}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
            config.preserveVoice
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-zinc-800 border-zinc-700 text-zinc-400'
          }`}
          title={config.preserveVoice ? 'Preserve Voice: ON (Stylistic warnings minimized to respect authorial voice)' : 'Preserve Voice: OFF'}
        >
          {config.preserveVoice ? <Shield className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
          <span>Preserve Voice</span>
        </button>
      </div>

      {/* Settings / Passes Drawer */}
      {showSettings && (
        <div 
          className="p-3.5 border-b space-y-3 shrink-0 bg-zinc-900/80 max-h-56 overflow-y-auto"
          style={{ borderColor: theme.pageBorder }}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-200">
            <span>Active Editorial Passes</span>
            <span className="text-[10px] text-zinc-400 font-normal">Deterministic rules</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {[
              { id: 'spelling', label: 'Spelling & Typos' },
              { id: 'grammar', label: 'Grammar & Usage' },
              { id: 'punctuation', label: 'Punctuation' },
              { id: 'repetition', label: 'Word Repetition' },
              { id: 'consistency-names', label: 'Entity Names' },
              { id: 'consistency-formatting', label: 'Quote Formatting' },
              { id: 'passive-voice', label: 'Passive Voice' },
              { id: 'adverbs', label: 'Adverb Frequency' },
              { id: 'sentence-length', label: 'Sentence Length' },
              { id: 'filler-words', label: 'Filler Phrases' },
            ].map(pass => (
              <label 
                key={pass.id}
                className="flex items-center space-x-1.5 cursor-pointer text-zinc-300 hover:text-zinc-100"
              >
                <input
                  type="checkbox"
                  checked={Boolean(config.activePasses[pass.id as ProofreadingPassId])}
                  onChange={() => handleTogglePass(pass.id as ProofreadingPassId)}
                  className="rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-0 w-3 h-3"
                />
                <span className="truncate">{pass.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Category Summary Breakdown Strip */}
      <div 
        className="px-3.5 py-2 border-b grid grid-cols-5 gap-1 text-center shrink-0 bg-zinc-900/20"
        style={{ borderColor: theme.pageBorder }}
      >
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-1 py-1 rounded text-[10px] transition-colors ${
            selectedCategory === 'all'
              ? 'bg-zinc-800 font-bold text-zinc-100 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div>All</div>
          <div className="font-mono text-zinc-300 font-semibold">{summary.total}</div>
        </button>

        <button
          onClick={() => setSelectedCategory('mechanical')}
          className={`px-1 py-1 rounded text-[10px] transition-colors ${
            selectedCategory === 'mechanical'
              ? 'bg-zinc-800 font-bold text-zinc-100 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div>Spelling</div>
          <div className="font-mono text-rose-400 font-semibold">{summary.mechanicalCount}</div>
        </button>

        <button
          onClick={() => setSelectedCategory('grammar')}
          className={`px-1 py-1 rounded text-[10px] transition-colors ${
            selectedCategory === 'grammar'
              ? 'bg-zinc-800 font-bold text-zinc-100 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div>Grammar</div>
          <div className="font-mono text-amber-400 font-semibold">{summary.grammarCount}</div>
        </button>

        <button
          onClick={() => setSelectedCategory('style')}
          className={`px-1 py-1 rounded text-[10px] transition-colors ${
            selectedCategory === 'style'
              ? 'bg-zinc-800 font-bold text-zinc-100 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div>Style</div>
          <div className="font-mono text-sky-400 font-semibold">{summary.styleCount}</div>
        </button>

        <button
          onClick={() => setSelectedCategory('consistency')}
          className={`px-1 py-1 rounded text-[10px] transition-colors ${
            selectedCategory === 'consistency'
              ? 'bg-zinc-800 font-bold text-zinc-100 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div>Consistency</div>
          <div className="font-mono text-purple-400 font-semibold">{summary.consistencyCount}</div>
        </button>
      </div>

      {/* Findings List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {visibleFindings.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 space-y-2">
            <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500/70" />
            <div className="text-xs font-semibold text-zinc-300">No Open Editorial Findings</div>
            <p className="text-[11px] text-zinc-400 max-w-[200px] mx-auto">
              Your prose satisfies active proofreading passes in this {config.scope}.
            </p>
          </div>
        ) : (
          visibleFindings.map(finding => {
            const isSelected = selectedFindingId === finding.id;

            return (
              <div 
                key={finding.id}
                onClick={() => {
                  setSelectedFindingId(finding.id);
                  if (onJumpToFinding) onJumpToFinding(finding);
                }}
                className={`p-3 rounded-lg border transition-all text-xs space-y-2 cursor-pointer ${
                  isSelected 
                    ? 'bg-zinc-800/90 border-indigo-500/50 shadow-sm' 
                    : 'bg-zinc-900/50 hover:bg-zinc-800/40 border-zinc-800/80'
                }`}
              >
                {/* Finding Header */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-start space-x-1.5 min-w-0">
                    {getSeverityIcon(finding.severity)}
                    <div>
                      <div className="font-semibold text-zinc-200 leading-tight truncate">
                        {finding.title}
                      </div>
                      <div className="text-[10px] text-zinc-400 capitalize">
                        {finding.passId.replace('-', ' ')}
                      </div>
                    </div>
                  </div>

                  {finding.suggestedText && (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono shrink-0">
                      Suggestion
                    </span>
                  )}
                </div>

                {/* Finding Message */}
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {finding.message}
                </p>

                {/* Comparison Card (Original vs Suggested) */}
                <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800/80 space-y-1 font-mono text-[11px]">
                  <div className="flex items-center space-x-2 text-rose-400">
                    <span className="text-[10px] text-zinc-400 uppercase font-sans font-bold">Orig:</span>
                    <span className="line-through bg-rose-500/10 px-1 rounded">{finding.originalText}</span>
                  </div>

                  {finding.suggestedText && (
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <span className="text-[10px] text-zinc-400 uppercase font-sans font-bold">Fix:</span>
                      <span className="bg-emerald-500/10 px-1 rounded">{finding.suggestedText}</span>
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/50 text-[11px]">
                  {finding.suggestedText ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptProofreadingFinding(finding);
                      }}
                      className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-[11px] flex items-center space-x-1 shadow-xs"
                      title="Accept suggested replacement"
                    >
                      <Check className="w-3 h-3" />
                      <span>Accept</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-zinc-400 italic">Advisory notice</span>
                  )}

                  <div className="flex items-center space-x-1 ml-auto">
                    {/* Add to Dictionary for spelling */}
                    {finding.passId === 'spelling' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addCustomWordToDictionary(finding.originalText);
                          ignoreProofreadingFinding(finding.id);
                        }}
                        className="px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50"
                        title="Add to project custom dictionary"
                      >
                        Add Word
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        ignoreProofreadingFinding(finding.id);
                      }}
                      className="px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                      title="Ignore this finding"
                    >
                      Ignore
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markProofreadingFindingIntentional(finding.id);
                      }}
                      className="px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                      title="Mark as intentional authorial stylistic choice"
                    >
                      Intentional
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
