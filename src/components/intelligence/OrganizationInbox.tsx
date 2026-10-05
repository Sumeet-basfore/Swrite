import React, { useState } from 'react';
import { Check, X, EyeOff, Clock, AlertTriangle, ShieldCheck, Sparkles, Filter, RotateCcw, ArrowRight, Layers, Play } from 'lucide-react';
import { OrganizationInboxItem, BatchedInboxGroup, InboxFilterCategory, InboxItemStatus, ContextualActionType } from '../../types/intelligence';

interface OrganizationInboxProps {
  items: OrganizationInboxItem[];
  batchedGroups?: BatchedInboxGroup[];
  activeCategory: InboxFilterCategory;
  usefulOrganizationRate?: number;
  noiseRate?: number;
  onSelectCategory: (category: InboxFilterCategory) => void;
  onUpdateStatus: (itemId: string, status: InboxItemStatus) => void;
  onExecuteAction: (itemId: string, action: ContextualActionType) => void;
  onBatchApply: () => void;
  onRunDeepOrganization?: () => void;
  onRollback?: () => void;
  lastSnapshotId?: string;
  isAnalyzing?: boolean;
}

export const OrganizationInbox: React.FC<OrganizationInboxProps> = ({
  items,
  batchedGroups = [],
  activeCategory,
  usefulOrganizationRate,
  noiseRate,
  onSelectCategory,
  onUpdateStatus,
  onExecuteAction,
  onBatchApply,
  onRunDeepOrganization,
  onRollback,
  lastSnapshotId,
  isAnalyzing = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

  const categories: { key: InboxFilterCategory; label: string }[] = [
    { key: 'all', label: 'All Proposals' },
    { key: 'characters', label: 'Characters' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'outline', label: 'Outline' },
    { key: 'relationships', label: 'Relationships' },
    { key: 'research', label: 'Research' },
    { key: 'conflicts', label: 'Conflicts' },
    { key: 'duplicates', label: 'Duplicates' }
  ];

  const filteredItems = items.filter(item => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.proposal.targetName.toLowerCase().includes(q);
      const matchReason = item.userFacingReason.toLowerCase().includes(q);
      if (!matchName && !matchReason) return false;
    }
    return true;
  });

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const safeToApplyCount = items.filter(i => (i.status === 'accepted' || i.status === 'pending') && i.proposal.confidence >= 0.8 && !i.proposal.conflictsWithCanon).length;

  const renderActionButtons = (item: OrganizationInboxItem) => {
    const actions = item.availableActions || ['accept-new-evidence', 'ignore', 'remember-later'];

    return (
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60 mt-2.5">
        {actions.includes('merge') && (
          <button
            onClick={() => onExecuteAction(item.id, 'merge')}
            className="px-2.5 py-1 text-[11px] bg-emerald-600 text-white rounded font-medium hover:bg-emerald-500 transition shadow-sm"
          >
            Merge Alias
          </button>
        )}
        {actions.includes('keep-separate') && (
          <button
            onClick={() => onExecuteAction(item.id, 'keep-separate')}
            className="px-2.5 py-1 text-[11px] bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition"
          >
            Keep Separate
          </button>
        )}
        {actions.includes('create') && (
          <button
            onClick={() => onExecuteAction(item.id, 'create')}
            className="px-2.5 py-1 text-[11px] bg-indigo-600 text-white rounded font-medium hover:bg-indigo-500 transition shadow-sm"
          >
            Create Record
          </button>
        )}
        {actions.includes('accept-new-evidence') && (
          <button
            onClick={() => onExecuteAction(item.id, 'accept-new-evidence')}
            className="px-2.5 py-1 text-[11px] bg-emerald-600 text-white rounded font-medium hover:bg-emerald-500 transition shadow-sm"
          >
            Accept New Evidence
          </button>
        )}
        {actions.includes('keep-existing') && (
          <button
            onClick={() => onExecuteAction(item.id, 'keep-existing')}
            className="px-2.5 py-1 text-[11px] bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition"
          >
            Keep Canon
          </button>
        )}
        {actions.includes('create-revision-note') && (
          <button
            onClick={() => onExecuteAction(item.id, 'create-revision-note')}
            className="px-2.5 py-1 text-[11px] bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded font-medium hover:bg-amber-600/50 transition"
          >
            Revision Note
          </button>
        )}
        {actions.includes('set-timeline-date') && (
          <button
            onClick={() => onExecuteAction(item.id, 'set-timeline-date')}
            className="px-2.5 py-1 text-[11px] bg-purple-600 text-white rounded font-medium hover:bg-purple-500 transition shadow-sm"
          >
            Set Timeline Date
          </button>
        )}
        {actions.includes('update-relationship') && (
          <button
            onClick={() => onExecuteAction(item.id, 'update-relationship')}
            className="px-2.5 py-1 text-[11px] bg-sky-600 text-white rounded font-medium hover:bg-sky-500 transition shadow-sm"
          >
            Update Relationship
          </button>
        )}
        {actions.includes('remember-later') && (
          <button
            onClick={() => onUpdateStatus(item.id, 'remember-later')}
            title="Remember Later (Defer finding without ignoring)"
            className="px-2 py-1 text-[11px] bg-slate-800 text-slate-400 hover:text-slate-200 rounded border border-slate-700 transition flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            <span>Later</span>
          </button>
        )}
        {actions.includes('ignore') && (
          <button
            onClick={() => onUpdateStatus(item.id, 'ignored')}
            title="Ignore finding for this evidence"
            className="px-2 py-1 text-[11px] bg-slate-800 text-slate-400 hover:text-slate-200 rounded border border-slate-700 transition flex items-center gap-1"
          >
            <EyeOff className="w-3 h-3" />
            <span>Ignore</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-l border-slate-800 w-96 shadow-2xl">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-semibold text-slate-100 text-sm tracking-wide">Organization Inbox</h3>
            <p className="text-[10px] text-slate-400">Action Queue for Project Evidence</p>
          </div>
        </div>
        
        {onRunDeepOrganization && (
          <button
            onClick={onRunDeepOrganization}
            disabled={isAnalyzing}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-500 transition shadow-sm disabled:opacity-50"
            title="Run explicit whole-project deep organization pass"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Analyze Project</span>
          </button>
        )}
      </div>

      {/* Quality Metrics Bar */}
      {(usefulOrganizationRate !== undefined || noiseRate !== undefined) && (
        <div className="px-4 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span>Useful Rate: <strong className="text-emerald-400">{usefulOrganizationRate}%</strong></span>
          <span>Noise Suppressed: <strong className="text-sky-400">{noiseRate}%</strong></span>
        </div>
      )}

      {/* Categories & View Switcher */}
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat.key)}
              className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap font-medium transition ${
                activeCategory === cat.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setViewMode(viewMode === 'grouped' ? 'list' : 'grouped')}
          className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-700 transition"
          title={viewMode === 'grouped' ? 'Switch to List View' : 'Switch to Grouped Entity View'}
        >
          <Layers className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Batch Accept Banner */}
      {safeToApplyCount > 0 && (
        <div className="p-3 bg-indigo-950/40 border-b border-indigo-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-indigo-200">
              {safeToApplyCount} safe proposal{safeToApplyCount > 1 ? 's' : ''} ready
            </span>
          </div>
          <button
            onClick={onBatchApply}
            className="flex items-center gap-1 text-xs px-3 py-1 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-500 transition shadow-sm"
          >
            <span>Apply Safe</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800 flex items-center gap-2">
        <input
          type="text"
          placeholder="Filter proposals..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        {lastSnapshotId && onRollback && (
          <button
            onClick={onRollback}
            title="Rollback last organization apply"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded hover:bg-amber-500/20 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rollback</span>
          </button>
        )}
      </div>

      {/* Proposals List / Grouped View */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No actionable organization proposals in queue.</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const prop = item.proposal;
            const isPending = item.status === 'pending';
            const isAccepted = item.status === 'accepted';
            const isRejected = item.status === 'rejected';

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-lg border text-xs transition ${
                  isAccepted
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : isRejected
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : prop.conflictsWithCanon
                    ? 'bg-amber-950/30 border-amber-800/50'
                    : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                {/* Proposal Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="uppercase text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {prop.domain}
                    </span>
                    <span className="font-semibold text-slate-100">{prop.targetName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      prop.importance === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {prop.importance} imp
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {Math.round(prop.confidence * 100)}% conf
                    </span>
                  </div>
                </div>

                {/* Explicit Comparison: CANON vs NEW EVIDENCE */}
                <div className="space-y-1.5 mb-2.5">
                  {prop.existingCanonData && (
                    <div className="p-2 bg-slate-950/80 rounded border border-slate-800 text-[11px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">CANON</span>
                      <p className="text-slate-300 font-mono text-[11px]">
                        {JSON.stringify(prop.existingCanonData.name || prop.existingCanonData.title || prop.existingCanonData).slice(0, 120)}
                      </p>
                    </div>
                  )}

                  <div className="p-2 bg-indigo-950/30 rounded border border-indigo-900/40 text-[11px]">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-0.5">NEW EVIDENCE</span>
                    <p className="text-slate-200">{item.userFacingReason}</p>
                    {item.contextSnippet && (
                      <p className="text-[10px] text-slate-400 italic mt-1 line-clamp-2">
                        "{item.contextSnippet}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Canon Conflict Warning */}
                {prop.conflictsWithCanon && (
                  <div className="mb-2.5 p-2 bg-amber-900/30 border border-amber-700/50 rounded flex items-start gap-1.5 text-amber-200 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Canon Contradiction: New evidence differs from active project canon.</span>
                  </div>
                )}

                {/* Contextual Action Buttons */}
                {isPending ? (
                  renderActionButtons(item)
                ) : (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-400 font-medium">Status: {item.status}</span>
                    <button
                      onClick={() => onUpdateStatus(item.id, 'pending')}
                      className="text-indigo-400 hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
